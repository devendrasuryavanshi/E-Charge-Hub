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
  name: 'StationCreate',
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
  setup() {
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

        const response = await api.post('/charging-stations', payload)

        if (response.data.success) {
          toast.success('Charging station created successfully!')
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

    onMounted(() => {
      getUserLocation()
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
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Add New Charging Station</h1>
            <p class="page-subtitle">Create a new charging station by filling out the form and selecting a location on
              the map</p>
          </div>
          <div class="header-actions">
            <button @click="handleCancel" class="cancel-btn">
              <X :size="18" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div class="main-content">
        <!-- Form Section -->
        <div class="form-section">
          <div class="form-container">
            <div class="form-header">
              <h2 class="form-title">Station Details</h2>
              <p class="form-subtitle">Enter the basic information for the charging station</p>
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
                  <span>{{ isSubmitting ? 'Creating...' : 'Create Station' }}</span>
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

<style scoped>
.add-station-container {
  min-height: calc(100vh - 70px);
  background-color: var(--bg-primary);
  padding: 0;
}

.add-station-content {
  max-width: 1400px;
  margin: 0 auto;
  background-color: transparent;
}

.page-header {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  padding: 15px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  background-color: transparent;
}

.header-text {
  background-color: transparent;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  background-color: transparent;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.5;
  background-color: transparent;
}

.header-actions {
  background-color: transparent;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.cancel-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.main-content {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  min-height: calc(100vh - 140px);
  background-color: transparent;
  margin: 0;
}

.form-section {
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
  overflow-y: auto;
}

.form-container {
  padding: 32px;
  background-color: transparent;
}

.form-header {
  margin-bottom: 32px;
  background-color: transparent;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  background-color: transparent;
}

.form-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  background-color: transparent;
}

.station-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: transparent;
}

.form-group {
  background-color: transparent;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  background-color: transparent;
}

.label-icon {
  color: var(--accent-primary);
  background-color: transparent;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: transparent;
}

.status-indicator.active {
  background-color: var(--success);
}

.status-indicator.inactive {
  background-color: var(--danger);
}

.status-indicator.maintenance {
  background-color: var(--warning);
}

.connector-icon {
  width: 16px;
  height: 16px;
  background: linear-gradient(45deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 3px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background-color: var(--bg-hover);
}

.form-input.error,
.form-select.error {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.location-display {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: transparent;
}

.coordinates {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: transparent;
}

.coord-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  background-color: transparent;
}

.coord-value {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 600;
  font-family: 'Courier New', monospace;
  background-color: transparent;
}

.reset-location-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  align-self: flex-start;
}

.reset-location-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.location-placeholder {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  background-color: transparent;
}

.placeholder-icon {
  color: var(--accent-primary);
  background-color: transparent;
}

.error-message {
  display: block;
  color: var(--danger);
  font-size: 0.85rem;
  margin-top: 6px;
  background-color: transparent;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  background-color: transparent;
}

.secondary-btn,
.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  min-height: 44px;
}

.secondary-btn {
  background-color: transparent;
  border: 1px solid var(--border-secondary);
  color: var(--text-secondary);
  flex: 1;
}

.secondary-btn:hover:not(:disabled) {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.primary-btn {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border: none;
  color: var(--text-primary);
  flex: 2;
  box-shadow: var(--shadow-md);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.map-section {
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.map-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.map-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  background-color: transparent;
}

.map-actions {
  display: flex;
  gap: 12px;
  background-color: transparent;
}

.location-btn,
.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.location-btn:hover:not(:disabled),
.reset-btn:hover {
  background-color: var(--accent-primary);
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text {
  background-color: transparent;
}

.map-wrapper {
  flex: 1;
  position: relative;
  background-color: transparent;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  gap: 12px;
  z-index: 10;
}

.leaflet-map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map-instructions {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background-color: rgba(26, 26, 36, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  padding: 16px;
  z-index: 1000;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  background-color: transparent;
}

.instruction-item.success {
  color: var(--success);
  font-weight: 500;
}

.instruction-icon {
  color: var(--accent-primary);
  background-color: transparent;
}

.success-icon {
  width: 16px;
  height: 16px;
  background-color: var(--success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
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

@media (max-width: 1200px) {

  .form-container {
    padding: 24px;
  }

  .page-header {
    padding: 20px;
  }

  .page-title {
    font-size: 1.75rem;
  }
}

@media (max-width: 1024px) {
  .form-section {
    border-right: none;
    border-bottom: 1px solid var(--border-primary);
  }

  .map-section {
    min-height: 40vh;
  }

  .form-container {
    padding: 20px;
  }

  .map-header {
    padding: 16px 20px;
  }

  .map-instructions {
    bottom: 16px;
    left: 16px;
    right: 16px;
    padding: 12px;
  }

  .btn-text {
    display: none;
  }

  .location-btn,
  .reset-btn {
    padding: 8px;
  }
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .page-header {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.9rem;
  }

  .form-container {
    padding: 16px;
  }

  .form-header {
    margin-bottom: 24px;
  }

  .form-title {
    font-size: 1.25rem;
  }

  .station-form {
    gap: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .secondary-btn,
  .primary-btn {
    flex: none;
    width: 100%;
  }

  .map-header {
    padding: 12px 16px;
  }

  .map-title {
    font-size: 1.1rem;
  }

  .map-actions {
    gap: 8px;
  }

  .map-instructions {
    bottom: 12px;
    left: 12px;
    right: 12px;
    padding: 10px;
  }

  .instruction-item {
    font-size: 0.85rem;
  }

  .coordinates {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .location-display {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .add-station-container {
    padding: 0;
  }

  .page-header {
    padding: 12px;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .header-content {
    gap: 12px;
  }

  .cancel-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  .form-container {
    padding: 12px;
  }

  .form-header {
    margin-bottom: 20px;
  }

  .form-title {
    font-size: 1.1rem;
  }

  .form-subtitle {
    font-size: 0.85rem;
  }

  .station-form {
    gap: 16px;
  }

  .form-input,
  .form-select {
    padding: 10px 12px;
    font-size: 0.9rem;
  }

  .form-label {
    font-size: 0.85rem;
  }

  .location-display {
    padding: 10px;
  }

  .coordinates {
    font-size: 0.85rem;
  }

  .reset-location-btn {
    padding: 4px 8px;
    font-size: 0.8rem;
  }

  .secondary-btn,
  .primary-btn {
    padding: 10px 16px;
    font-size: 0.9rem;
    min-height: 40px;
  }

  .map-header {
    padding: 10px 12px;
  }

  .map-title {
    font-size: 1rem;
  }

  .location-btn,
  .reset-btn {
    padding: 6px;
    font-size: 0.8rem;
  }

  .map-instructions {
    bottom: 8px;
    left: 8px;
    right: 8px;
    padding: 8px;
  }

  .instruction-item {
    font-size: 0.8rem;
  }

  .form-section {
    max-height: 55vh;
  }

  .map-section {
    min-height: 45vh;
  }
}

@media (max-width: 360px) {
  .page-title {
    font-size: 1.2rem;
  }

  .form-container {
    padding: 10px;
  }

  .form-input,
  .form-select {
    padding: 8px 10px;
  }

  .location-display {
    padding: 8px;
  }

  .map-header {
    padding: 8px 10px;
  }

  .map-instructions {
    padding: 6px;
  }

  .instruction-item {
    font-size: 0.75rem;
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

:deep(.selected-location-marker) {
  background: transparent !important;
  border: none !important;
}

.form-section::-webkit-scrollbar {
  width: 6px;
}

.form-section::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.form-section::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 3px;
}

.form-section::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}

.form-input:focus,
.form-select:focus,
.primary-btn:focus,
.secondary-btn:focus,
.cancel-btn:focus,
.location-btn:focus,
.reset-btn:focus,
.reset-location-btn:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

@media (prefers-contrast: high) {

  .form-input,
  .form-select,
  .location-display {
    border-width: 2px;
  }

  .form-input.error,
  .form-select.error {
    border-width: 3px;
  }

  .map-instructions {
    border-width: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {

  .form-input,
  .form-select,
  .primary-btn,
  .secondary-btn,
  .cancel-btn,
  .location-btn,
  .reset-btn,
  .reset-location-btn,
  .location-display {
    transition: none;
  }

  .spinner {
    animation: none;
  }

  .primary-btn:hover:not(:disabled) {
    transform: none;
  }
}

.form-input:disabled,
.form-select:disabled {
  background-color: var(--bg-secondary);
  color: var(--text-muted);
}

.location-display.has-location {
  border-color: var(--success);
  background-color: rgba(34, 197, 94, 0.05);
}

.form-input,
.form-select,
.location-display,
.primary-btn,
.secondary-btn,
.cancel-btn,
.location-btn,
.reset-btn,
.reset-location-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media print {
  .map-section {
    display: none;
  }

  .main-content {
    grid-template-columns: 1fr;
  }

  .form-section {
    border: none;
    max-height: none;
  }
}
</style>
