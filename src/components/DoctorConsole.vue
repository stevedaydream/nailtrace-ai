<script setup>
import { computed } from 'vue';
import PatientSidebar from './console/PatientSidebar.vue';
import PatientRecordCard from './console/PatientRecordCard.vue';

const props = defineProps({
  profiles: {
    type: Array,
    required: true
  },
  selectedProfileId: {
    type: String,
    required: true
  },
  records: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select-profile', 'reset-db', 'refresh']);

// Get active patient profile details
const activePatient = computed(() => {
  return props.profiles.find(p => p.id === props.selectedProfileId) || null;
});

const getTriageBadgeClass = (status) => {
  if (status === 'green') return 'badge-green';
  if (status === 'yellow') return 'badge-yellow';
  return 'badge-red';
};
</script>

<template>
  <div class="console-container">
    
    <!-- LEFT PANEL: PATIENTS LIST (Modular Component) -->
    <PatientSidebar 
      :profiles="props.profiles"
      :selectedProfileId="props.selectedProfileId"
      @select-profile="id => emit('select-profile', id)"
      @reset-db="emit('reset-db')"
      @refresh="emit('refresh')"
    />

    <!-- RIGHT PANEL: TRACKING TIMELINE -->
    <div class="console-main glass-panel">
      <div v-if="activePatient" class="main-wrapper">
        
        <!-- Active Patient Header -->
        <div class="active-patient-header">
          <div class="patient-title-group">
            <div class="patient-title-row">
              <h1>{{ activePatient.name }}</h1>
              <span :class="['badge', getTriageBadgeClass(activePatient.status)]">
                {{ activePatient.status.toUpperCase() }}
              </span>
            </div>
            <p class="patient-subtitle">
              病歷號: <span>{{ activePatient.patient_id }}</span> | 
              主治醫師: <span>{{ activePatient.doctor_name }}</span>
            </p>
          </div>
        </div>

        <!-- History Timeline -->
        <div class="history-section">
          <h2>📅 歷次追蹤病歷表 (由新至舊)</h2>
          
          <!-- No Records Fallback -->
          <div v-if="props.records.length === 0" class="no-records">
            📭 目前尚無追蹤紀錄，請於左側 LINE 模擬器中點選「填寫追蹤表單」以新增紀錄。
          </div>

          <!-- Timeline Grid -->
          <div v-else class="timeline">
            <!-- Modular Record Card Component -->
            <PatientRecordCard 
              v-for="rec in props.records" 
              :key="rec.id" 
              :record="rec" 
            />
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.console-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  height: 100%;
}

.console-main {
  padding: 1.75rem;
  overflow-y: auto;
  height: 100%;
}

.main-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.active-patient-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.25rem;
}

.patient-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.patient-title-row h1 {
  font-size: 1.75rem;
  color: white;
  margin: 0;
}

.patient-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.patient-subtitle span {
  color: var(--text-secondary);
  font-weight: 500;
}

.badge {
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 4px;
}

.badge-green { background-color: rgba(16, 185, 129, 0.15); color: var(--color-green); border: 1px solid rgba(16, 185, 129, 0.3); }
.badge-yellow { background-color: rgba(245, 158, 11, 0.15); color: var(--color-yellow); border: 1px solid rgba(245, 158, 11, 0.3); }
.badge-red { background-color: rgba(239, 68, 68, 0.15); color: var(--color-red); border: 1px solid rgba(239, 68, 68, 0.3); }

/* History Section */
.history-section h2 {
  font-size: 1.15rem;
  color: white;
  margin-bottom: 1.25rem;
}

.no-records {
  background-color: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.timeline {
  display: flex;
  flex-direction: column;
}
</style>
