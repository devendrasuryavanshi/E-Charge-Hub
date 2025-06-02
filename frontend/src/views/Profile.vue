<script lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  MapPin,
  Zap,
  Wifi,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-vue-next'
import api from '@/plugins/axios'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth'

interface Station {
  id: string
  name: string
  status: string
  powerOutput: number
  connectorType: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  createdAt: string
  updatedAt: string
}

export default {
  name: 'Profile',
  components: {
    User,
    MapPin,
    Zap,
    Wifi,
    Edit,
    Trash2,
    Plus,
    Search,
    Filter,
    ChevronDown,
    Loader2,
    AlertTriangle,
    X
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    const isLoading = ref(false)
    const showFilters = ref(false)
    const showDeleteModal = ref(false)
    const stationToDelete = ref<Station | null>(null)
    const isDeleting = ref(false)
    const stations = ref<Station[]>([])
    const totalStations = ref(0)

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

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Active': return 'var(--success)'
        case 'Inactive': return 'var(--danger)'
        case 'Maintenance': return 'var(--warning)'
        default: return 'var(--text-muted)'
      }
    }

    const fetchUserStations = async () => {
      isLoading.value = true
      try {
        const params = new URLSearchParams()
        params.append('getByUserId', 'true')

        if (filters.search) params.append('search', filters.search)
        if (filters.status) params.append('status', filters.status)
        if (filters.powerOutput) params.append('powerOutput', filters.powerOutput)
        if (filters.connectorType) params.append('connectorType', filters.connectorType)
        params.append('limit', '100')

        const response = await api.get(`/charging-stations?${params}`)
        if (response.data.success) {
          stations.value = response.data.data.chargingStations
          totalStations.value = response.data.data.pagination.totalCount
        } else {
          toast.error(response.data.message || 'Failed to fetch stations')
        }
      } catch (error: any) {
        console.error('Error fetching user stations:', error)
        toast.error(error.response?.data?.message || 'Failed to fetch your stations')
      } finally {
        isLoading.value = false
      }
    }

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
          totalStations.value -= 1
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

    const addNewStation = () => {
      router.push({ name: 'station-create' })
    }

    const clearFilters = () => {
      filters.search = ''
      filters.status = ''
      filters.powerOutput = ''
      filters.connectorType = ''
      fetchUserStations()
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    onMounted(() => {
      fetchUserStations()
    })

    return {
      authStore,
      isLoading,
      showFilters,
      showDeleteModal,
      stationToDelete,
      isDeleting,
      stations,
      totalStations,
      filters,
      statusOptions,
      powerOutputOptions,
      connectorTypeOptions,
      getStatusColor,
      fetchUserStations,
      editStation,
      confirmDelete,
      cancelDelete,
      deleteStation,
      addNewStation,
      clearFilters,
      formatDate
    }
  }
}
</script>

<template>
  <div class="profile-container">
    <div class="profile-content">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="user-info">
          <div class="user-avatar">
            <User :size="32" />
          </div>
          <div class="user-details">
            <h1 class="user-name">{{ authStore.user?.name || 'User' }}</h1>
            <p class="user-email">{{ authStore.user?.email || 'user@example.com' }}</p>
          </div>
        </div>
        <div class="stats-summary">
          <div class="stat-item">
            <span class="stat-value">{{ totalStations }}</span>
            <span class="stat-label">Total Stations</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{stations.filter(s => s.status === 'Active').length}}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{stations.filter(s => s.status === 'Maintenance').length}}</span>
            <span class="stat-label">Maintenance</span>
          </div>
        </div>
      </div>

      <!-- Stations Section -->
      <div class="stations-section">
        <div class="section-header">
          <div class="header-left">
            <h2 class="section-title">My Charging Stations</h2>
            <button class="filter-toggle" @click="showFilters = !showFilters" :class="{ active: showFilters }">
              <Filter :size="18" />
              <span>Filters</span>
              <ChevronDown :size="16" :class="{ rotated: showFilters }" />
            </button>
          </div>
          <button @click="addNewStation" class="add-station-btn">
            <Plus :size="18" />
            Add Station
          </button>
        </div>

        <!-- Search -->
        <div class="search-section">
          <div class="search-wrapper">
            <Search :size="20" class="search-icon" />
            <input v-model="filters.search" @input="fetchUserStations" type="text" placeholder="Search your stations..."
              class="search-input" />
          </div>
        </div>

        <!-- Filters -->
        <div v-if="showFilters" class="filters-section">
          <div class="filter-grid">
            <div class="filter-group">
              <label class="filter-label">Status</label>
              <select v-model="filters.status" @change="fetchUserStations" class="filter-select">
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Power Output</label>
              <select v-model="filters.powerOutput" @change="fetchUserStations" class="filter-select">
                <option v-for="option in powerOutputOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Connector Type</label>
              <select v-model="filters.connectorType" @change="fetchUserStations" class="filter-select">
                <option v-for="option in connectorTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>

          <button @click="clearFilters" class="clear-filters-btn">
            Clear Filters
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <Loader2 :size="32" class="spinner" />
          <span>Loading your stations...</span>
        </div>

        <!-- Stations Grid -->
        <div v-else-if="stations.length > 0" class="stations-grid">
          <div v-for="station in stations" :key="station.id" class="station-card">
            <div class="station-header">
              <h3 class="station-name">{{ station.name }}</h3>
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
                <span>
                  {{ station.coordinates?.latitude?.toFixed(4) }},
                  {{ station.coordinates?.longitude?.toFixed(4) }}
                </span>
              </div>
            </div>

            <div class="station-meta">
              <span class="created-date">Created: {{ formatDate(station.createdAt) }}</span>
              <span class="updated-date">Updated: {{ formatDate(station.updatedAt) }}</span>
            </div>

            <div class="station-actions">
              <button @click="editStation(station)" class="edit-btn">
                <Edit :size="16" />
                Edit
              </button>
              <button @click="confirmDelete(station)" class="delete-btn">
                <Trash2 :size="16" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <MapPin :size="64" class="empty-icon" />
          <h3>No charging stations found</h3>
          <p>You haven't created any charging stations yet.</p>
          <button @click="addNewStation" class="add-first-station-btn">
            <Plus :size="18" />
            Add Your First Station
          </button>
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
  </div>
</template>

<style scoped>
.profile-container {
  min-height: calc(100vh - 70px);
  background-color: var(--bg-primary);
  padding: 24px;
}

.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  background-color: transparent;
}

/* Profile Header */
.profile-header {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  background-color: transparent;
}

.user-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
}

.user-details {
  background-color: transparent;
}

.user-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  background-color: transparent;
}

.user-email {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
  background-color: transparent;
}

.stats-summary {
  display: flex;
  gap: 32px;
  background-color: transparent;
}

.stat-item {
  text-align: center;
  background-color: transparent;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-primary);
  background-color: transparent;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 4px;
  background-color: transparent;
}

/* Stations Section */
.stations-section {
  background-color: transparent;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: transparent;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: transparent;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  background-color: transparent;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.filter-toggle:hover,
.filter-toggle.active {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.filter-toggle .rotated {
  transform: rotate(180deg);
}

.add-station-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.add-station-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Search Section */
.search-section {
  margin-bottom: 16px;
  background-color: transparent;
}

.search-wrapper {
  position: relative;
  max-width: 400px;
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

/* Filters Section */
.filters-section {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
  background-color: transparent;
}

.filter-group {
  background-color: transparent;
}

.filter-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  background-color: transparent;
}

.filter-select {
  width: 100%;
  padding: 8px 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.clear-filters-btn {
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-filters-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-secondary);
  background-color: transparent;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  background-color: transparent;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* Stations Grid */
.stations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  background-color: transparent;
}

.station-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
}

.station-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-primary);
}

.station-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  background-color: transparent;
}

.station-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  background-color: transparent;
}

.station-status {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.1);
}

.station-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  background-color: transparent;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  background-color: transparent;
}

.detail-icon {
  color: var(--accent-primary);
  background-color: transparent;
}

.station-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-primary);
  background-color: transparent;
}

.created-date,
.updated-date {
  font-size: 0.8rem;
  color: var(--text-muted);
  background-color: transparent;
}

.station-actions {
  display: flex;
  gap: 12px;
  background-color: transparent;
}

.edit-btn,
.delete-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background-color: var(--accent-primary);
  color: var(--text-primary);
}

.edit-btn:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
}

.delete-btn {
  background-color: var(--danger);
  color: white;
}

.delete-btn:hover {
  background-color: #dc2626;
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  background-color: var(--bg-secondary);
  border: 2px dashed var(--border-secondary);
  border-radius: 16px;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 24px;
  background-color: transparent;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  background-color: transparent;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 32px;
  background-color: transparent;
}

.add-first-station-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.add-first-station-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
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

/* Responsive Design */
@media (max-width: 1024px) {
  .profile-header {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }

  .stats-summary {
    gap: 24px;
  }

  .stations-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .profile-container {
    padding: 16px;
  }

  .profile-header {
    padding: 24px;
  }

  .user-info {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .user-avatar {
    width: 60px;
    height: 60px;
  }

  .user-name {
    font-size: 1.5rem;
  }

  .stats-summary {
    flex-direction: row;
    gap: 20px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stations-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .station-card {
    padding: 20px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .header-left {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .section-title {
    font-size: 1.3rem;
  }

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
}

@media (max-width: 480px) {
  .profile-header {
    padding: 20px;
  }

  .user-name {
    font-size: 1.3rem;
  }

  .user-email {
    font-size: 1rem;
  }

  .stats-summary {
    gap: 16px;
  }

  .stat-value {
    font-size: 1.3rem;
  }

  .station-card {
    padding: 16px;
  }

  .station-actions {
    flex-direction: column;
    gap: 8px;
  }

  .edit-btn,
  .delete-btn {
    justify-content: center;
  }

  .empty-state {
    padding: 40px 20px;
  }

  .empty-state h3 {
    font-size: 1.3rem;
  }

  .add-station-btn,
  .add-first-station-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Focus states for accessibility */
.search-input:focus,
.filter-select:focus,
.filter-toggle:focus,
.add-station-btn:focus,
.edit-btn:focus,
.delete-btn:focus,
.modal-close-btn:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .station-card {
    border-width: 2px;
  }

  .station-card:hover {
    border-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {

  .station-card,
  .filter-toggle,
  .search-input,
  .filter-select,
  .edit-btn,
  .delete-btn,
  .add-station-btn {
    transition: none;
  }

  .spinner {
    animation: none;
  }
}

/* Scrollbar styles */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.modal-content::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}
</style>
