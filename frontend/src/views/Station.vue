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

<style scoped>
.station-container {
  min-height: calc(100vh - 70px);
  background-color: var(--bg-primary);
}

.station-content {
  display: flex;
  height: calc(100vh - 70px);
  background-color: transparent;
}

.sidebar {
  width: 30%;
  min-width: 350px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 20px;
}

.search-section {
  padding: 0 24px 16px;
  background-color: transparent;
}

.search-wrapper {
  position: relative;
  background-color: transparent;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  background-color: transparent;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.filters-section {
  padding: 0 24px 16px;
  border-bottom: 1px solid var(--border-primary);
  background-color: transparent;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  background-color: transparent;
}

.filter-group {
  background-color: transparent;
}

.filter-select {
  width: 100%;
  padding: 8px 6px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.stations-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: transparent;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-secondary);
  background-color: transparent;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
  background-color: transparent;
}

/* Edit/Delete Buttons */
.edit-delete-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  background-color: transparent;
}

.edit-button,
.delete-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-button {
  background-color: var(--accent-primary);
  color: var(--text-primary);
}

.edit-button:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
}

.delete-button {
  background-color: var(--danger);
  color: white;
}

.delete-button:hover {
  background-color: #dc2626;
  transform: translateY(-1px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  max-width: 450px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-primary);
  background-color: transparent;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  background-color: transparent;
}

.modal-close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  text-align: center;
  background-color: transparent;
}

.warning-icon {
  color: var(--warning);
  margin-bottom: 16px;
  background-color: transparent;
}

.modal-message {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 20px;
  background-color: transparent;
}

.station-details-modal {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  text-align: left;
}

.detail-item-modal {
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  background-color: transparent;
}

.detail-item-modal:last-child {
  margin-bottom: 0;
}

.detail-item-modal strong {
  color: var(--text-primary);
  background-color: transparent;
}

.warning-text {
  font-size: 0.9rem;
  color: var(--warning);
  font-weight: 500;
  margin-top: 16px;
  background-color: transparent;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-primary);
  background-color: transparent;
}

.cancel-btn,
.confirm-delete-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.cancel-btn {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  color: var(--text-secondary);
}

.cancel-btn:hover:not(:disabled) {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.confirm-delete-btn {
  background-color: var(--danger);
  color: white;
}

.confirm-delete-btn:hover:not(:disabled) {
  background-color: #dc2626;
  transform: translateY(-1px);
}

.cancel-btn:disabled,
.confirm-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .edit-delete-buttons {
    flex-direction: column;
    gap: 6px;
  }

  .edit-button,
  .delete-button {
    justify-content: center;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.stations-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background-color: transparent;
}

.station-card {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.station-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.station-card.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.station-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  background-color: transparent;
}

.station-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  background-color: transparent;
}

.station-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
}

.station-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  background-color: transparent;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background-color: transparent;
}

.detail-icon {
  color: var(--accent-primary);
  background-color: transparent;
}

.station-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: transparent;
}

.distance {
  font-size: 0.8rem;
  color: var(--text-muted);
  background-color: transparent;
}

.view-btn {
  padding: 6px 12px;
  background-color: var(--accent-primary);
  color: var(--text-primary);
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
  background-color: transparent;
}

.empty-icon {
  margin-bottom: 16px;
  color: var(--text-muted);
  background-color: transparent;
}

.empty-state h3 {
  margin-bottom: 8px;
  color: var(--text-primary);
  background-color: transparent;
}

.pagination-section {
  padding: 16px 24px;
  border-top: 1px solid var(--border-primary);
  background-color: transparent;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background-color: transparent;
}

.pagination-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-button svg {
  background-color: transparent !important;
  flex-shrink: 0;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.pagination-button:hover:not(:disabled) svg {
  color: var(--text-primary);
}

.pagination-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: var(--bg-tertiary);
  border-color: var(--border-secondary);
  color: var(--text-muted);
}

.pagination-button:disabled svg {
  color: var(--text-muted);
}

.pagination-button:disabled:hover {
  transform: none;
}

.page-info {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  background-color: transparent;
  min-width: 80px;
  text-align: center;
  padding: 0 8px;
}

.map-section {
  flex: 1;
  position: relative;
  background-color: transparent;
}

.map-container {
  width: 100%;
  height: 100%;
  background-color: transparent;
}

.leaflet-map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.place-search-floating {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  width: 300px;
}

.place-search-wrapper {
  position: relative;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(12px);
}

.place-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  background-color: transparent;
}

.place-search-input {
  width: 100%;
  padding: 12px 80px 12px 40px;
  background-color: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
}

.place-search-input::placeholder {
  color: var(--text-muted);
}

.current-coordinates-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--accent-primary);
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 25px;
  height: 25px;
}

.current-coordinates-btn:hover {
  background-color: var(--accent-hover);
}

.clear-place-search-btn {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 3px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 20px;
  height: 20px;
}

.clear-place-search-btn:hover {
  color: var(--text-secondary);
  background-color: var(--bg-hover);
}

.place-search-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--accent-primary);
  animation: spin 1s linear infinite;
}

.place-search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: var(--shadow-lg);
  max-height: 200px;
  overflow-y: auto;
  backdrop-filter: blur(12px);
}

.place-suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-primary);
  background-color: transparent;
}

.place-suggestion-item:last-child {
  border-bottom: none;
}

.place-suggestion-item:hover {
  background-color: var(--bg-hover);
}

.place-suggestion-icon {
  color: var(--accent-primary);
  flex-shrink: 0;
  background-color: transparent;
}

.place-suggestion-content {
  flex: 1;
  background-color: transparent;
}

.place-suggestion-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
  background-color: transparent;
}

.place-suggestion-address {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background-color: transparent;
}

.station-details-overlay {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  backdrop-filter: blur(12px);
}

.overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-secondary);
  background-color: transparent;
}

.overlay-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  background-color: transparent;
}

.close-btn {
  width: 24px;
  height: 24px;
  background-color: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.overlay-content {
  padding: 16px;
  background-color: transparent;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  background-color: transparent;
}

.detail-row .label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  background-color: transparent;
}

.detail-row .value {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  background-color: transparent;
}

.detail-row .value.status {
  font-weight: 600;
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background-color: var(--accent-primary);
  color: var(--text-primary);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.action-btn:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
}

.popup-content {
  background-color: transparent;
}

.popup-content h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  background-color: transparent;
}

.popup-content p {
  margin: 4px 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  background-color: transparent;
}

.popup-btn {
  margin-top: 8px;
  padding: 6px 12px;
  background-color: var(--accent-primary);
  color: var(--text-primary);
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.popup-btn:hover {
  background-color: var(--accent-hover);
}

.stations-list::-webkit-scrollbar {
  width: 6px;
}

.stations-list::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.stations-list::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 3px;
}

.stations-list::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}

.place-search-suggestions::-webkit-scrollbar {
  width: 4px;
}

.place-search-suggestions::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.place-search-suggestions::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 2px;
}

.place-search-suggestions::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}

@media (max-width: 1024px) {
  .sidebar {
    width: 35%;
    min-width: 300px;
  }

  .search-section,
  .filters-section {
    padding: 0 20px 12px;
  }

  .stations-list {
    padding: 12px 20px;
  }

  .pagination-section {
    padding: 12px 20px;
  }

  .station-details-overlay {
    width: 280px;
  }

  .place-search-floating {
    width: 280px;
  }

  .filter-select {
    font-size: 0.75rem;
    padding: 6px 4px;
  }
}

@media (max-width: 768px) {
  .station-content {
    flex-direction: column;
    height: 160vh;
    overflow-y: auto;
  }

  .sidebar {
    width: 100%;
    min-width: auto;
    height: 80vh;
    border-right: none;
    border-bottom: 1px solid var(--border-primary);
    padding-top: 12px;
  }

  .map-section {
    height: 80vh;
  }

  .search-section,
  .filters-section {
    padding: 0 16px 10px;
  }

  .stations-list {
    padding: 10px 16px;
  }

  .pagination-section {
    padding: 10px 16px;
  }

  .station-card {
    padding: 12px;
    margin-bottom: 8px;
  }

  .station-details-overlay {
    position: fixed;
    bottom: 16px;
    left: 16px;
    right: 16px;
    width: auto;
    z-index: 2000;
  }

  .place-search-floating {
    top: 12px;
    right: 12px;
    left: 12px;
    width: auto;
  }

  .filter-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }

  .filter-select {
    font-size: 0.7rem;
    padding: 6px 3px;
  }

  .pagination-button {
    width: 32px;
    height: 32px;
  }

  .page-info {
    font-size: 0.85rem;
    min-width: 70px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    height: 45vh;
    padding-top: 8px;
  }

  .map-section {
    height: 55vh;
  }

  .search-section,
  .filters-section {
    padding: 0 12px 8px;
  }

  .stations-list {
    padding: 8px 12px;
  }

  .pagination-section {
    padding: 8px 12px;
  }

  .station-card {
    padding: 10px;
    margin-bottom: 6px;
  }

  .station-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .station-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .view-btn {
    align-self: flex-end;
    font-size: 0.75rem;
    padding: 4px 8px;
  }

  .station-details-overlay {
    bottom: 10px;
    left: 10px;
    right: 10px;
  }

  .overlay-header,
  .overlay-content {
    padding: 12px;
  }

  .place-search-floating {
    top: 8px;
    right: 8px;
    left: 8px;
  }

  .place-search-input {
    padding: 10px 70px 10px 35px;
    font-size: 0.85rem;
  }

  .place-suggestion-item {
    padding: 8px 10px;
  }

  .filter-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
  }

  .filter-select {
    font-size: 0.65rem;
    padding: 5px 2px;
  }

  .pagination-button {
    width: 28px;
    height: 28px;
  }

  .pagination {
    gap: 8px;
  }

  .page-info {
    font-size: 0.8rem;
    min-width: 60px;
  }

  .search-input {
    padding: 10px 10px 10px 35px;
    font-size: 0.85rem;
  }

  .search-icon {
    left: 10px;
  }
}

@media (max-width: 360px) {
  .filter-select {
    font-size: 0.6rem;
    padding: 4px 1px;
  }

  .filter-row {
    gap: 3px;
  }

  .station-name {
    font-size: 0.9rem;
  }

  .detail-item {
    font-size: 0.8rem;
  }

  .pagination-button {
    width: 26px;
    height: 26px;
  }

  .page-info {
    font-size: 0.75rem;
    min-width: 50px;
  }
}

:deep(.leaflet-popup-content-wrapper) {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
}

:deep(.leaflet-popup-tip) {
  background-color: var(--bg-tertiary);
}

:deep(.leaflet-popup-close-button) {
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: bold;
}

:deep(.leaflet-popup-close-button:hover) {
  color: var(--text-primary);
}

:deep(.leaflet-control-zoom a) {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-secondary);
}

:deep(.leaflet-control-zoom a:hover) {
  background-color: var(--bg-hover);
}

:deep(.leaflet-control-attribution) {
  background-color: rgba(0, 0, 0, 0.7);
  color: var(--text-primary);
}

:deep(.custom-marker) {
  background: transparent !important;
  border: none !important;
}

.search-input:focus,
.filter-select:focus,
.pagination-button:focus,
.view-btn:focus,
.action-btn:focus,
.close-btn:focus,
.place-search-input:focus,
.current-coordinates-btn:focus,
.clear-place-search-btn:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

@media (prefers-contrast: high) {
  .station-card {
    border-width: 2px;
  }

  .station-card.selected {
    border-width: 3px;
  }

  .pagination-button {
    border-width: 2px;
  }

  .pagination-button:disabled {
    border-style: dashed;
  }
}

@media (prefers-reduced-motion: reduce) {

  .station-card,
  .search-input,
  .filter-select,
  .view-btn,
  .action-btn,
  .pagination-button {
    transition: none;
  }

  .spinner,
  .place-search-spinner {
    animation: none;
  }

  .station-card:hover,
  .view-btn:hover,
  .action-btn:hover,
  .pagination-button:hover:not(:disabled) {
    transform: none;
  }
}

.station-card.loading {
  opacity: 0.6;
  pointer-events: none;
}

.station-card,
.search-input,
.filter-select,
.view-btn,
.action-btn,
.pagination-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
