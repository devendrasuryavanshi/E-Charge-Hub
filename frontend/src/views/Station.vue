<script lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { Search, Filter, MapPin, Zap, Clock, Wifi, ChevronDown, Loader2, LocateFixed, X, ChevronLeft, ChevronRight, Edit, Trash2, AlertTriangle } from 'lucide-vue-next'
import { LMap, LTileLayer, LMarker, LPopup, LIcon } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '@/plugins/axios';
import { toast } from 'vue3-toastify';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Station {
  id: string;
  name: string;
  status: string;
  powerOutput: number;
  connectorType: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdBy: string;
}

export default {
  name: 'Station',
  components: {
    Search,
    Filter,
    MapPin,
    Zap,
    Clock,
    Wifi,
    ChevronDown,
    LocateFixed,
    X,
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    AlertTriangle,
    LMap,
    LMarker,
    LPopup,
    LIcon,
    LTileLayer
  },
  setup() {
    const map = ref<InstanceType<typeof LMap> | null>(null)
    const isLoading = ref(false)
    const currentPage = ref(1)
    const hasNextPage = ref(true)
    const hasPreviousPage = ref(false)
    const limit = ref(10)
    const totalPages = ref(1)
    const selectedStation = ref<Station | null>(null)
    const coordinates = ref<{ lat: number; lng: number } | null>(null)
    const stations = ref<Station[]>([])
    const mapCenter = ref<[number, number]>([40.7128, -74.0060])
    const mapZoom = ref(13)
    const auth = useAuthStore();
    const userId = auth.user?.id.toString();
    const showDeleteModal = ref(false)
    const stationToDelete = ref<Station | null>(null)
    const isDeleting = ref(false)


    const placeSearchQuery = ref('')
    const searchSuggestions = ref<any[]>([])
    const showSuggestions = ref(false)
    const isSearchingPlaces = ref(false)
    const searchTimeout = ref<NodeJS.Timeout | null>(null)

    const fetchNextPage = async () => {
      if (!hasNextPage.value) return
      await fetchStations(currentPage.value + 1)
    }

    const fetchPreviousPage = async () => {
      if (!hasPreviousPage.value) return
      await fetchStations(currentPage.value - 1)
    }

    const searchPlaces = async (query: string) => {
      if (!query.trim()) {
        searchSuggestions.value = []
        showSuggestions.value = false
        return
      }

      isSearchingPlaces.value = true
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        )
        const data = await response.json()
        searchSuggestions.value = data
        showSuggestions.value = data.length > 0
      } catch (error) {
        console.error('Error searching places:', error)
        toast.error('Failed to search places')
      } finally {
        isSearchingPlaces.value = false
      }
    }

    const handlePlaceSearchInput = (event: Event) => {
      const target = event.target as HTMLInputElement
      placeSearchQuery.value = target.value

      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }

      searchTimeout.value = setTimeout(() => {
        searchPlaces(placeSearchQuery.value)
      }, 600)
    }

    const fetchStationsForPlace = async () => {
      if (!coordinates.value) return
      isLoading.value = true
      try {
        const response = await api.get(`/charging-stations?lat=${coordinates.value.lat}&lng=${coordinates.value.lng}&page=${currentPage.value}&limit=${limit.value}`)
        if (response.data.success) {
          const newStations = response.data.data.chargingStations.filter((station: Station) => !stations.value.some((s) => s.id === station.id))
          stations.value.push(...newStations)
        }
      } catch (error) {
        console.error('Error fetching stations:', error)
        toast.error('Failed to fetch stations')
      } finally {
        isLoading.value = false
      }
    }

    const selectPlace = (suggestion: any) => {
      const lat = parseFloat(suggestion.lat)
      const lng = parseFloat(suggestion.lon)

      nextTick(() => {
        const mapInstance = map.value?.leafletObject;
        if (mapInstance) {
          mapInstance.setView([lat, lng], 12);
        }
      });


      mapCenter.value = [lat, lng]
      mapZoom.value = 12
      coordinates.value = { lat, lng }

      fetchStationsForPlace()

      placeSearchQuery.value = suggestion.display_name.split(',')[0]
      showSuggestions.value = false
    }

    const clearPlaceSearch = () => {
      placeSearchQuery.value = ''
      searchSuggestions.value = []
      showSuggestions.value = false
    }

    const getCurrentcoordinatesForPlace = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          mapCenter.value = [lat, lng]
          mapZoom.value = 12
          coordinates.value = { lat, lng }

          placeSearchQuery.value = 'Current coordinates'
          showSuggestions.value = false

          fetchStationsForPlace()

        }, (error) => {
          console.warn('Geocoordinates error:', error)
          toast.error('Could not get your current coordinates')
        })
      } else {
        toast.error('Geocoordinates is not supported by this browser')
      }
    }

    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement
      if (!target.closest('.place-search-floating')) {
        showSuggestions.value = false
      }
    }

    const filters = reactive({
      search: '',
      status: '',
      powerOutput: '',
      connectorType: ''
    })

    const statusOptions = [
      { value: '', label: 'All Status' },
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
      { value: 'Maintenance', label: 'Maintenance' }
    ]

    const powerOutputOptions = [
      { value: '', label: 'All Power' },
      { value: '50', label: '50kW' },
      { value: '100', label: '100kW' },
      { value: '150', label: '150kW' },
      { value: '250', label: '250kW+' }
    ]

    const connectorTypeOptions = [
      { value: '', label: 'All Types' },
      { value: 'Type1', label: 'Type 1' },
      { value: 'Type2', label: 'Type 2' },
      { value: 'CCS', label: 'CCS' },
      { value: 'CHAdeMO', label: 'CHAdeMO' },
      { value: 'GB/T', label: 'GB/T' }
    ]

    const filteredStations = computed(() => {
      return (stations.value || []).filter((station: Station) => {
        const matchesSearch = !filters.search || station.name.toLowerCase().includes(filters.search.toLowerCase())
        const matchesStatus = !filters.status || station.status === filters.status
        const matchesPowerOutput = !filters.powerOutput || station.powerOutput === parseInt(filters.powerOutput)
        const matchesConnectorType = !filters.connectorType || station.connectorType === filters.connectorType
        return matchesSearch && matchesStatus && matchesPowerOutput && matchesConnectorType
      })
    })

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Active': return 'var(--success)'
        case 'Inactive': return 'var(--danger)'
        case 'Maintenance': return 'var(--warning)'
        default: return 'var(--text-muted)'
      }
    }

    const getMarkerIcon = (station: any) => {
      const color = station.status === 'Active' ? '#22c55e' :
        station.status === 'Maintenance' ? '#f59e0b' : '#ef4444'

      return new L.Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="3"/>
          </svg>
        `),
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10],
        className: 'custom-marker'
      })
    }

    const fetchStations = async (page: number = currentPage.value) => {
      if (isLoading.value) return;

      isLoading.value = true;
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);
        if (filters.powerOutput) params.append('powerOutput', filters.powerOutput);
        if (filters.connectorType) params.append('connectorType', filters.connectorType);

        // map bounds for coordinates-based filtering
        if (coordinates.value) {
          const center = coordinates.value;
          params.append('latitude', center.lat.toString());
          params.append('longitude', center.lng.toString());
        }

        params.append('limit', limit.value.toString());
        params.append('page', page.toString());

        const response = await api.get(`/charging-stations?${params}`)
        if (response.data.success) {
          const mappedStations = response.data.data.chargingStations.map((station: any) => ({
            ...station,
            coordinates: {
              latitude: station.coordinates?.latitude || 0,
              longitude: station.coordinates?.longitude || 0
            }
          }));

          stations.value = mappedStations;
          currentPage.value = response.data.data.pagination.currentPage;
          hasNextPage.value = response.data.data.pagination.hasNextPage;
          hasPreviousPage.value = response.data.data.pagination.hasPrevPage;
          totalPages.value = response.data.data.pagination.totalPages;
        } else {
          toast.error(response.data.message || 'Failed to fetch stations');
        }
      } catch (error: any) {
        console.error('Error fetching stations:', error)
        toast.error(error.response?.data?.message || 'Failed to fetch charging stations')
      } finally {
        isLoading.value = false
      }
    };

    const onMapReady = () => {
      // nextTick(() => {
      //   const mapInstance = map.value?.$el
      //   if (mapInstance) {
      //     mapInstance.on('moveend', () => {
      //       const bounds = mapInstance.getBounds()
      //       mapBounds.value = bounds
      //       fetchStations()
      //     })
      //   }
      // })
    }

    const selectStation = (station: Station) => {
      selectedStation.value = station
      if (station.coordinates?.latitude && station.coordinates?.longitude) {
        mapCenter.value = [station.coordinates.latitude, station.coordinates.longitude]
        mapZoom.value = 16
      }
    }

    const onMarkerClick = (station: Station) => {
      selectStation(station);
    }

    const clearFilters = () => {
      filters.search = ''
      filters.status = ''
      filters.powerOutput = ''
      filters.connectorType = ''
      fetchStations()
    }

    watch([() => filters.search, () => filters.status, () => filters.powerOutput, () => filters.connectorType], () => {
      fetchStations(1)
    },
      {
        deep: true,
        flush: 'post'
      }
    )

    const editStation = (station: Station) => {
      router.push({ name: 'station-edit', params: { id: station.id } })
    }

    const confirmDelete = (station: Station) => {
      stationToDelete.value = station
      showDeleteModal.value = true
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      stationToDelete.value = null
    }

    const deleteStation = async () => {
      if (!stationToDelete.value) return

      isDeleting.value = true
      try {
        const response = await api.delete(`/charging-stations/${stationToDelete.value.id}`)
        if (response.data.success) {
          toast.success('Station deleted successfully')
          stations.value = stations.value.filter(s => s.id !== stationToDelete.value!.id)
          if (selectedStation.value?.id === stationToDelete.value.id) {
            selectedStation.value = null
          }
          cancelDelete()
        } else {
          toast.error(response.data.message || 'Failed to delete station')
        }
      } catch (error: any) {
        console.error('Error deleting station:', error)
        toast.error(error.response?.data?.message || 'Failed to delete station')
      } finally {
        isDeleting.value = false
      }
    }


    onMounted(() => {
      fetchStations()
      document.addEventListener('click', handleClickOutside)
    })

    return {
      userId,
      map,
      isLoading,
      selectedStation,
      stations,
      filteredStations,
      mapCenter,
      mapZoom,
      filters,
      statusOptions,
      powerOutputOptions,
      connectorTypeOptions,
      placeSearchQuery,
      searchSuggestions,
      showSuggestions,
      isSearchingPlaces,
      currentPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      showDeleteModal,
      stationToDelete,
      isDeleting,
      editStation,
      confirmDelete,
      cancelDelete,
      deleteStation,
      fetchNextPage,
      fetchPreviousPage,
      getStatusColor,
      getMarkerIcon,
      selectStation,
      onMarkerClick,
      onMapReady,
      clearFilters,
      handlePlaceSearchInput,
      selectPlace,
      clearPlaceSearch,
      getCurrentcoordinatesForPlace,
    };
  }
}
</script>

<template>
  <div class="station-container">
    <div class="station-content">
      <!-- Left Sidebar -->
      <div class="sidebar">

        <!-- Search -->
        <div class="search-section">
          <div class="search-wrapper">
            <Search :size="20" class="search-icon" />
            <input v-model="filters.search" type="text" placeholder="Search stations..." class="search-input" />
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-row">
            <div class="filter-group">
              <select v-model="filters.status" class="filter-select">
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <select v-model="filters.powerOutput" class="filter-select">
                <option v-for="option in powerOutputOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <select v-model="filters.connectorType" class="filter-select">
                <option v-for="option in connectorTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Station List -->
        <div class="stations-section">

          <div v-if="isLoading" class="loading-state">
            <Loader2 :size="24" class="spinner" />
            <span>Loading stations...</span>
          </div>

          <div v-else class="stations-list">
            <div v-for="station in filteredStations" :key="station.id" class="station-card"
              :class="{ selected: selectedStation?.id === station.id }" @click="selectStation(station)">
              <div class="station-header">
                <h4 class="station-name">{{ station.name }}</h4>
                <div class="station-status" :style="{ color: getStatusColor(station.status) }">
                  {{ station.status }}
                </div>
              </div>

              <div class="station-details">
                <div class="detail-item">
                  <Zap :size="16" class="detail-icon" />
                  <span>{{ station.powerOutput }}kW</span>
                </div>
                <div class="detail-item">
                  <Wifi :size="16" class="detail-icon" />
                  <span>{{ station.connectorType }}</span>
                </div>
                <div class="detail-item">
                  <MapPin :size="16" class="detail-icon" />
                  <span>{{ station.coordinates?.latitude?.toFixed(4) }}, {{ station.coordinates?.longitude?.toFixed(4)
                  }}</span>
                </div>
                <div v-if="station.createdBy === userId" class="edit-delete-buttons">
                  <button @click.stop="editStation(station)" class="edit-button">
                    <Edit :size="14" />
                    Edit
                  </button>
                  <button @click.stop="confirmDelete(station)" class="delete-button">
                    <Trash2 :size="14" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!isLoading && filteredStations.length === 0" class="empty-state">
              <MapPin :size="48" class="empty-icon" />
              <h3>No stations found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-section">
          <div class="pagination">
            <button :disabled="!hasPreviousPage" @click="fetchPreviousPage" class="pagination-button">
              <ChevronLeft :size="20" />
            </button>
            <span class="page-info">{{ currentPage }} of {{ totalPages }}</span>
            <button :disabled="!hasNextPage" @click="fetchNextPage" class="pagination-button">
              <ChevronRight :size="20" />
            </button>
          </div>
        </div>
      </div>

      <!-- Map Section -->
      <div class="map-section">
        <div class="map-container">
          <LMap ref="map" :zoom="mapZoom" :center="mapCenter" :useZoom="true" :useCenter="true" @ready="onMapReady"
            class="leaflet-map">
            <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" />

            <template v-for="station in filteredStations" :key="station.id">
              <LMarker v-if="station.coordinates?.latitude && station.coordinates?.longitude"
                :lat-lng="[station.coordinates.latitude, station.coordinates.longitude]" :icon="getMarkerIcon(station)"
                @click="onMarkerClick(station)">
                <LPopup>
                  <div class="popup-content">
                    <h4>{{ station.name }}</h4>
                    <p><strong>Status:</strong> {{ station.status }}</p>
                    <p><strong>Power:</strong> {{ station.powerOutput }}kW</p>
                    <p><strong>Type:</strong> {{ station.connectorType }}</p>
                    <button @click="selectStation(station)" class="popup-btn">
                      View Details
                    </button>
                  </div>
                </LPopup>
              </LMarker>
            </template>
          </LMap>
        </div>

        <!-- Search Floating -->
        <div class="place-search-floating">
          <div class="place-search-wrapper">
            <Search :size="18" class="place-search-icon" />
            <input :value="placeSearchQuery" @input="handlePlaceSearchInput" type="text" placeholder="Search places..."
              class="place-search-input" />
            <button v-if="placeSearchQuery" @click="clearPlaceSearch" class="clear-place-search-btn">
              <X :size="14" />
            </button>
            <button @click="getCurrentcoordinatesForPlace" class="current-coordinates-btn"
              title="Use current coordinates">
              <LocateFixed :size="16" />
            </button>
            <Loader2 v-if="isSearchingPlaces" :size="14" class="place-search-spinner" />
          </div>

          <!-- Place Search Suggestions -->
          <div v-if="showSuggestions && searchSuggestions.length > 0" class="place-search-suggestions">
            <div v-for="suggestion in searchSuggestions" :key="suggestion.place_id" @click="selectPlace(suggestion)"
              class="place-suggestion-item">
              <MapPin :size="14" class="place-suggestion-icon" />
              <div class="place-suggestion-content">
                <div class="place-suggestion-name">{{ suggestion.display_name.split(',')[0] }}</div>
                <div class="place-suggestion-address">{{ suggestion.display_name.split(',').slice(1, 3).join(',') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Confirm Delete</h3>
        <button @click="cancelDelete" class="modal-close-btn">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div class="warning-icon">
          <AlertTriangle :size="48" />
        </div>
        <p class="modal-message">
          Are you sure you want to delete this charging station?
        </p>

        <div v-if="stationToDelete" class="station-details-modal">
          <div class="detail-item-modal">
            <strong>Name:</strong> {{ stationToDelete.name }}
          </div>
          <div class="detail-item-modal">
            <strong>Status:</strong> {{ stationToDelete.status }}
          </div>
          <div class="detail-item-modal">
            <strong>Power:</strong> {{ stationToDelete.powerOutput }}kW
          </div>
          <div class="detail-item-modal">
            <strong>Type:</strong> {{ stationToDelete.connectorType }}
          </div>
        </div>

        <p class="warning-text">
          This action cannot be undone.
        </p>
      </div>

      <div class="modal-footer">
        <button @click="cancelDelete" class="cancel-btn" :disabled="isDeleting">
          Cancel
        </button>
        <button @click="deleteStation" class="confirm-delete-btn" :disabled="isDeleting">
          <Loader2 v-if="isDeleting" :size="16" class="spinner" />
          <Trash2 v-else :size="16" />
          {{ isDeleting ? 'Deleting...' : 'Delete Station' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/styles/station.css">
</style>
