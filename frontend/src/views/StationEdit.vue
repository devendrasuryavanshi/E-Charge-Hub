<script lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Zap, Settings, Save, X, Loader2, Navigation, RotateCcw } from 'lucide-vue-next'
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { toast } from 'vue3-toastify'
import api from '@/plugins/axios'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export default {
  props: ['id'],
  name: 'StationEdit',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    MapPin,
    Zap,
    Settings,
    Save,
    X,
    Loader2,
    Navigation,
    RotateCcw
  },
  setup(props) {
    const router = useRouter()
    const map = ref<InstanceType<typeof LMap> | null>(null)
    const isLoading = ref(false)
    const isSubmitting = ref(false)
    const userLocation = ref<{ lat: number; lng: number } | null>(null)
    const selectedLocation = ref<{ lat: number; lng: number } | null>(null)
    const mapInstance = ref<any>(null)
    const selectedMarker = ref<L.Marker | null>(null)
    const mapCenter = ref<[number, number]>([40.7128, -74.0060]) // Default to NYC
    const mapZoom = ref(13)

    const form = reactive({
      name: '',
      latitude: '',
      longitude: '',
      status: 'Active',
      powerOutput: '',
      connectorType: ''
    })

    const errors = reactive({
      name: '',
      location: '',
      status: '',
      powerOutput: '',
      connectorType: ''
    })

    const statusOptions = [
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
      { value: 'Maintenance', label: 'Maintenance' }
    ]

    const connectorTypeOptions = [
      { value: 'Type1', label: 'Type 1' },
      { value: 'Type2', label: 'Type 2' },
      { value: 'CCS', label: 'CCS' },
      { value: 'CHAdeMO', label: 'CHAdeMO' },
      { value: 'GB/T', label: 'GB/T' }
    ]

    const powerOutputOptions = [
      { value: '50', label: '50 kW' },
      { value: '100', label: '100 kW' },
      { value: '150', label: '150 kW' },
      { value: '200', label: '200 kW' },
      { value: '250', label: '250 kW' }
    ]

    // marker icon for selected location
    const selectedLocationIcon = new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="#6366f1"/>
          <circle cx="15" cy="15" r="8" fill="white"/>
          <circle cx="15" cy="15" r="5" fill="#6366f1"/>
        </svg>
      `),
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40],
      className: 'selected-location-marker'
    })

    const getUserLocation = () => {
      isLoading.value = true
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            userLocation.value = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            mapCenter.value = [userLocation.value.lat, userLocation.value.lng]
            isLoading.value = false
          },
          (error) => {
            console.warn('Geolocation error:', error)
            toast.warning('Could not get your location. Please select manually on the map.')
            isLoading.value = false
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        )
      } else {
        toast.error('Geolocation is not supported by this browser.')
        isLoading.value = false
      }
    }

    const onMapClick = (event: any) => {
      const { lat, lng } = event.latlng
      selectedLocation.value = { lat, lng }
      form.latitude = lat.toFixed(6)
      form.longitude = lng.toFixed(6)
      errors.location = ''

      if (selectedMarker.value && mapInstance.value) {
        mapInstance.value.removeLayer(selectedMarker.value as unknown as L.Layer)
      }

      if (mapInstance.value) {
        selectedMarker.value = L.marker([lat, lng], { icon: selectedLocationIcon })
          .addTo(mapInstance.value)
          .bindPopup(`
        <div class="popup-content">
          <h4>Selected Location</h4>
          <p><strong>Coordinates:</strong></p>
          <p>${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        </div>
      `)
      }
    }

    const onMapReady = () => {
      nextTick(() => {
        mapInstance.value = map.value?.leafletObject
        if (mapInstance.value) {
          mapInstance.value.on('click', onMapClick)
        }
      })
    }

    const resetLocation = () => {
      if (selectedMarker.value && mapInstance.value) {
        mapInstance.value.removeLayer(selectedMarker.value)
        selectedMarker.value = null
      }

      selectedLocation.value = null
      form.latitude = ''
      form.longitude = ''
      errors.location = ''
    }

    const centerOnUserLocation = () => {
      if (userLocation.value) {
        mapCenter.value = [userLocation.value.lat, userLocation.value.lng]
        mapZoom.value = 15
      } else {
        getUserLocation()
      }
    }

    const validateForm = () => {
      let isValid = true

      Object.keys(errors).forEach(key => {
        errors[key as keyof typeof errors] = ''
      })

      if (!form.name.trim()) {
        errors.name = 'Station name is required'
        isValid = false
      } else if (form.name.trim().length < 3) {
        errors.name = 'Station name must be at least 3 characters'
        isValid = false
      } else if (form.name.trim().length > 100) {
        errors.name = 'Station name must be less than 100 characters'
        isValid = false
      }

      if (!selectedLocation.value || !form.latitude || !form.longitude) {
        errors.location = 'Please select a location on the map'
        isValid = false
      }

      if (!form.status) {
        errors.status = 'Status is required'
        isValid = false
      }

      if (!form.powerOutput) {
        errors.powerOutput = 'Power output is required'
        isValid = false
      } else {
        const power = parseInt(form.powerOutput)
        if (isNaN(power) || power < 1 || power > 1000) {
          errors.powerOutput = 'Power output must be between 1 and 1000 kW'
          isValid = false
        }
      }

      if (!form.connectorType) {
        errors.connectorType = 'Connector type is required'
        isValid = false
      }

      return isValid
    }

    const handleSubmit = async () => {
      if (!validateForm()) return
      isSubmitting.value = true

      try {
        const payload = {
          name: form.name.trim(),
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          status: form.status,
          powerOutput: parseInt(form.powerOutput),
          connectorType: form.connectorType
        }

        const response = await api.put(`/charging-stations/${props.id}`, payload)

        if (response.data.success) {
          toast.success('Charging station updated successfully!')
          router.back();
        } else {
          toast.error(response.data.message || 'Failed to create charging station')
        }
      } catch (error: any) {
        console.error('Error creating station:', error)
        const errorMessage = error.response?.data?.message ||
          (Array.isArray(error.response?.data?.message)
            ? error.response.data.message.join(', ')
            : 'Failed to create charging station')
        toast.error(errorMessage)
      } finally {
        isSubmitting.value = false
      }
    }

    const handleCancel = () => {
      router.back();
    }

    const fetchStationData = async () => {
      const id = props.id;
      try {
        const response = await api.get(`/charging-stations/${id}`);
        if (response.data.success) {
          const stationData = response.data.data;
          const lat = stationData.coordinates.latitude
          const lng = stationData.coordinates.longitude

          form.name = stationData.name
          form.status = stationData.status
          form.powerOutput = stationData.powerOutput.toString()
          form.connectorType = stationData.connectorType
          form.latitude = lat.toFixed(6).toString()
          form.longitude = lng.toFixed(6).toString()
          selectedLocation.value = { lat, lng } // ✅ Add this
          errors.location = ''

          if (selectedMarker.value && mapInstance.value) {
            mapInstance.value.removeLayer(selectedMarker.value)
          }

          if (mapInstance.value) {
            selectedMarker.value = L.marker([lat, lng], { icon: selectedLocationIcon })
              .addTo(mapInstance.value)
              .bindPopup(`
            <div class="popup-content">
              <h4>Selected Location</h4>
              <p><strong>Coordinates:</strong></p>
              <p>${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            </div>
          `)
          }
          mapInstance.value.setView([lat, lng], mapZoom.value || 15)
        }
      } catch (error) {
        console.error('Error fetching station data:', error);
      }
    }


    onMounted(() => {
      fetchStationData();
    })

    return {
      map,
      isLoading,
      isSubmitting,
      userLocation,
      selectedLocation,
      mapCenter,
      mapZoom,
      form,
      errors,
      statusOptions,
      connectorTypeOptions,
      powerOutputOptions,
      selectedLocationIcon,
      mapInstance,
      selectedMarker,
      onMapReady,
      resetLocation,
      centerOnUserLocation,
      handleSubmit,
      handleCancel,
      getUserLocation
    }
  }
}
</script>

<template>
  <div class="add-station-container">
    <div class="add-station-content">
      <div class="main-content">
        <!-- Form Section -->
        <div class="form-section">
          <div class="form-container">
            <div class="form-header">
              <h2 class="form-title">Station Details</h2>
              <p class="form-subtitle">Edit the details of the charging station</p>
            </div>

            <form @submit.prevent="handleSubmit" class="station-form">
              <!-- Station Name -->
              <div class="form-group">
                <label for="name" class="form-label">
                  <Settings :size="16" class="label-icon" />
                  Station Name
                </label>
                <input id="name" v-model="form.name" type="text" class="form-input" :class="{ 'error': errors.name }"
                  placeholder="Enter station name (e.g., Downtown Charging Hub)" :disabled="isSubmitting"
                  maxlength="100" />
                <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
              </div>

              <!-- Location Display -->
              <div class="form-group">
                <label class="form-label">
                  <MapPin :size="16" class="label-icon" />
                  Location
                </label>
                <div class="location-display">
                  <div v-if="selectedLocation" class="location-info">
                    <div class="coordinates">
                      <span class="coord-label">Latitude:</span>
                      <span class="coord-value">{{ form.latitude }}</span>
                    </div>
                    <div class="coordinates">
                      <span class="coord-label">Longitude:</span>
                      <span class="coord-value">{{ form.longitude }}</span>
                    </div>
                    <button type="button" @click="resetLocation" class="reset-location-btn">
                      <RotateCcw :size="14" />
                      Reset
                    </button>
                  </div>
                  <div v-else class="location-placeholder">
                    <MapPin :size="20" class="placeholder-icon" />
                    <span>Click on the map to select a location</span>
                  </div>
                </div>
                <span v-if="errors.location" class="error-message">{{ errors.location }}</span>
              </div>

              <!-- Status -->
              <div class="form-group">
                <label for="status" class="form-label">
                  <div class="status-indicator" :class="form.status.toLowerCase()"></div>
                  Status
                </label>
                <select id="status" v-model="form.status" class="form-select" :class="{ 'error': errors.status }"
                  :disabled="isSubmitting">
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <span v-if="errors.status" class="error-message">{{ errors.status }}</span>
              </div>

              <!-- Power Output -->
              <div class="form-group">
                <label for="powerOutput" class="form-label">
                  <Zap :size="16" class="label-icon" />
                  Power Output
                </label>
                <select id="powerOutput" v-model="form.powerOutput" class="form-select"
                  :class="{ 'error': errors.powerOutput }" :disabled="isSubmitting">
                  <option value="">Select power output</option>
                  <option v-for="option in powerOutputOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <span v-if="errors.powerOutput" class="error-message">{{ errors.powerOutput }}</span>
              </div>

              <!-- Connector Type -->
              <div class="form-group">
                <label for="connectorType" class="form-label">
                  <div class="connector-icon"></div>
                  Connector Type
                </label>
                <select id="connectorType" v-model="form.connectorType" class="form-select"
                  :class="{ 'error': errors.connectorType }" :disabled="isSubmitting">
                  <option value="">Select connector type</option>
                  <option v-for="option in connectorTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <span v-if="errors.connectorType" class="error-message">{{ errors.connectorType }}</span>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button type="button" @click="handleCancel" class="secondary-btn" :disabled="isSubmitting">
                  Cancel
                </button>
                <button type="submit" class="primary-btn" :disabled="isSubmitting || !selectedLocation">
                  <Loader2 v-if="isSubmitting" :size="18" class="spinner" />
                  <Save v-else :size="18" />
                  <span>{{ isSubmitting ? 'Editing...' : 'Edit Station' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Map Section -->
        <div class="map-section">
          <div class="map-container">
            <div class="map-header">
              <h3 class="map-title">Select Location</h3>
              <div class="map-actions">
                <button @click="centerOnUserLocation" class="location-btn" :disabled="isLoading"
                  title="Center on my location">
                  <Navigation :size="16" />
                  <span class="btn-text">My Location</span>
                </button>
                <button v-if="selectedLocation" @click="resetLocation" class="reset-btn" title="Clear selection">
                  <RotateCcw :size="16" />
                  <span class="btn-text">Reset</span>
                </button>
              </div>
            </div>

            <div class="map-wrapper">
              <div v-if="isLoading" class="map-loading">
                <Loader2 :size="32" class="spinner" />
                <span>Loading map...</span>
              </div>

              <LMap ref="map" :zoom="mapZoom" :center="mapCenter" @ready="onMapReady" class="leaflet-map">
                <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" />

                <!-- User Location Marker -->
                <LMarker v-if="userLocation" :lat-lng="[userLocation.lat, userLocation.lng]">
                  <LPopup>
                    <div class="popup-content">
                      <h4>Your Location</h4>
                      <p>{{ userLocation.lat.toFixed(4) }}, {{ userLocation.lng.toFixed(4) }}</p>
                    </div>
                  </LPopup>
                </LMarker>
              </LMap>

              <!-- Map Instructions -->
              <div class="map-instructions">
                <div class="instruction-item">
                  <MapPin :size="16" class="instruction-icon" />
                  <span>Click anywhere on the map to select a location</span>
                </div>
                <div v-if="selectedLocation" class="instruction-item success">
                  <div class="success-icon">✓</div>
                  <span>Location selected successfully</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets//styles/stationEdit.css"></style>
