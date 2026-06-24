<script setup>
import { ref } from 'vue';

const props = defineProps({
  profiles: {
    type: Array,
    required: true
  },
  records: {
    type: Array,
    default: () => []
  }
});

const activeTab = ref('profiles');
const expandedJsonRecordId = ref(null);

const toggleJson = (id) => {
  if (expandedJsonRecordId.value === id) {
    expandedJsonRecordId.value = null;
  } else {
    expandedJsonRecordId.value = id;
  }
};

const getStatusColorClass = (status) => {
  if (status === 'green') return 'cell-green';
  if (status === 'yellow') return 'cell-yellow';
  return 'cell-red';
};
</script>

<template>
  <div class="db-viewer-container glass-panel">
    <div class="db-viewer-header">
      <div class="db-title-group">
        <h3>⚡ Supabase Database Monitor (Live Schema)</h3>
        <p>即時觀察前端 LocalStorage 與 Supabase 對應之資料表異動與 JSONB 儲存內容</p>
      </div>
      <div class="db-tabs">
        <button 
          :class="['db-tab', activeTab === 'profiles' ? 'active' : '']" 
          @click="activeTab = 'profiles'"
        >
          📁 profiles
        </button>
        <button 
          :class="['db-tab', activeTab === 'records' ? 'active' : '']" 
          @click="activeTab = 'records'"
        >
          📊 tracking_records
        </button>
      </div>
    </div>

    <!-- PROFILES TAB -->
    <div v-if="activeTab === 'profiles'" class="table-wrapper">
      <table class="db-table">
        <thead>
          <tr>
            <th>id (uuid, PK)</th>
            <th>line_user_id (text)</th>
            <th>patient_id (text)</th>
            <th>name (text)</th>
            <th>doctor_name (text)</th>
            <th>status (text)</th>
            <th>created_at (timestamp)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in profiles" :key="p.id">
            <td class="cell-uuid" :title="p.id">{{ p.id }}</td>
            <td class="cell-text">{{ p.line_user_id }}</td>
            <td class="cell-code">{{ p.patient_id }}</td>
            <td class="cell-name">{{ p.name }}</td>
            <td class="cell-text">{{ p.doctor_name }}</td>
            <td>
              <span :class="['status-cell-badge', getStatusColorClass(p.status)]">
                {{ p.status }}
              </span>
            </td>
            <td class="cell-date">{{ new Date(p.created_at).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- RECORDS TAB -->
    <div v-else class="table-wrapper">
      <table class="db-table">
        <thead>
          <tr>
            <th>id (uuid, PK)</th>
            <th>patient_id (uuid, FK)</th>
            <th>month (int)</th>
            <th>pain (int)</th>
            <th>satisfaction (int)</th>
            <th>image_url (text)</th>
            <th>gemini_analysis (jsonb)</th>
            <th>status (text)</th>
            <th>created_at (timestamp)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in records" :key="r.id">
            <td class="cell-uuid" :title="r.id">{{ r.id }}</td>
            <td class="cell-uuid" :title="r.patient_id">{{ r.patient_id }}</td>
            <td class="cell-number">{{ r.tracking_month }}</td>
            <td class="cell-number font-bold">{{ r.pain_score }}</td>
            <td class="cell-number">{{ r.satisfaction_score }}</td>
            <td class="cell-text truncate-path" :title="r.image_url">{{ r.image_url }}</td>
            <td>
              <button class="json-toggle-btn" @click="toggleJson(r.id)">
                {{ expandedJsonRecordId === r.id ? '收合 JSON' : '🔍 查看 JSONB (' + Object.keys(r.gemini_analysis).length + ' fields)' }}
              </button>
              
              <!-- Expanded JSON View -->
              <div v-if="expandedJsonRecordId === r.id" class="json-inspect-box">
                <pre>{{ JSON.stringify(r.gemini_analysis, null, 2) }}</pre>
              </div>
            </td>
            <td>
              <span :class="['status-cell-badge', getStatusColorClass(r.status)]">
                {{ r.status }}
              </span>
            </td>
            <td class="cell-date">{{ new Date(r.created_at).toLocaleString() }}</td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="9" class="empty-table-row">無資料列。請點開 LINE 選單提交追蹤表單。</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
.db-viewer-container {
  grid-column: 1 / -1;
  background: rgba(10, 15, 28, 0.7);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  padding: 1.25rem;
  margin-top: 1rem;
}

.db-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.db-title-group h3 {
  font-size: 1rem;
  color: white;
}

.db-title-group p {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.db-tabs {
  display: flex;
  gap: 6px;
  background-color: var(--bg-primary);
  padding: 3px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.db-tab {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.db-tab:hover {
  color: white;
}

.db-tab.active {
  background-color: var(--bg-tertiary);
  color: var(--color-brand);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.table-wrapper {
  overflow-x: auto;
  max-height: 250px;
}

.db-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  text-align: left;
}

.db-table th {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: bold;
  padding: 8px 10px;
  border-bottom: 2px solid var(--border-color);
  font-family: monospace;
}

.db-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.db-table tr:hover {
  background-color: rgba(255,255,255,0.01);
}

.cell-uuid {
  font-family: monospace;
  color: var(--text-muted);
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-code {
  font-family: monospace;
  color: var(--color-brand);
  font-weight: 600;
}

.cell-name {
  color: white;
  font-weight: 500;
}

.cell-text {
  color: var(--text-secondary);
}

.cell-number {
  color: white;
  text-align: center;
}

.font-bold {
  font-weight: bold;
}

.truncate-path {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-date {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.status-cell-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: bold;
  text-transform: uppercase;
}

.cell-green {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.cell-yellow {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.cell-red {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.empty-table-row {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem !important;
}

/* JSON Inspector */
.json-toggle-btn {
  background: rgba(0, 242, 254, 0.08);
  border: 1px solid rgba(0, 242, 254, 0.2);
  color: var(--color-brand);
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

.json-toggle-btn:hover {
  background: rgba(0, 242, 254, 0.15);
  color: white;
}

.json-inspect-box {
  margin-top: 8px;
  background-color: #060913;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
  max-width: 250px;
  max-height: 150px;
  overflow-y: auto;
  position: absolute;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.json-inspect-box pre {
  font-family: monospace;
  font-size: 0.65rem;
  color: #a5d6ff;
  margin: 0;
  white-space: pre-wrap;
}
</style>
