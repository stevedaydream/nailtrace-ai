<script setup>
import { ref } from 'vue';
import { geminiService } from '../../services/gemini';

const props = defineProps({
  profiles: {
    type: Array,
    required: true
  },
  selectedProfileId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['select-profile', 'reset-db', 'refresh']);

const apiKeyInput = ref(geminiService.getApiKey());
const showKeySavedMessage = ref(false);
const isSettingsExpanded = ref(window.innerWidth > 768);


const handleSaveApiKey = () => {
  geminiService.saveApiKey(apiKeyInput.value);
  showKeySavedMessage.value = true;
  setTimeout(() => {
    showKeySavedMessage.value = false;
  }, 3000);
  emit('refresh');
};

const handleClearApiKey = () => {
  apiKeyInput.value = '';
  geminiService.saveApiKey('');
  emit('refresh');
};
</script>

<template>
  <div class="console-sidebar glass-panel">
    <!-- Header -->
    <div class="panel-header">
      <h2>🏥 病患追蹤名單</h2>
      <span class="count-badge">{{ profiles.length }} 人</span>
    </div>

    <!-- Patient List -->
    <div class="patient-list">
      <div 
        v-for="p in props.profiles" 
        :key="p.id" 
        :class="['patient-item', p.id === props.selectedProfileId ? 'active' : '']"
        @click="emit('select-profile', p.id)"
      >
        <div class="patient-main-info">
          <span class="patient-name">{{ p.name }}</span>
          <span class="patient-id">{{ p.patient_id }}</span>
        </div>
        <div class="patient-meta-info">
          <span class="doctor-tag">{{ p.doctor_name }}</span>
          <span :class="['status-dot', p.status]"></span>
        </div>
      </div>
    </div>

    <!-- SIMULATION CONTROL BOARD -->
    <div class="control-board">
      <h3 class="panel-sub-title" @click="isSettingsExpanded = !isSettingsExpanded" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
        <span>⚙️ 模擬器設定面板</span>
        <span class="expand-icon" style="font-size: 0.75rem; color: var(--color-brand);">{{ isSettingsExpanded ? '▲ 收起' : '▼ 展開' }}</span>
      </h3>
      
      <!-- Collapsible Container -->
      <div v-show="isSettingsExpanded" style="margin-top: 0.75rem;">
        <!-- API Configuration -->
        <div class="api-config-box">
          <label class="form-label">Google Gemini API 金鑰</label>
          <div class="api-input-row">
            <input 
              type="password" 
              v-model="apiKeyInput" 
              placeholder="貼入 AI Key 以啟用真實分析..." 
              class="form-input"
            />
            <button class="btn btn-primary" @click="handleSaveApiKey">儲存</button>
          </div>
          <p v-if="showKeySavedMessage" class="key-success-msg">🟢 金鑰已更新！</p>
          <div class="api-status-badge">
            <span v-if="apiKeyInput" class="status-active">
              🟢 多模態視覺分析模式已開啟
              <a href="javascript:void(0)" @click="handleClearApiKey" class="clear-key-link">清除</a>
            </span>
            <span v-else class="status-demo">🔵 演示模式：免 Key 運行 (使用預設案例)</span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="control-actions">
          <button class="btn btn-secondary" @click="emit('refresh')" style="flex: 1;">🔄 重整狀態</button>
          <button class="btn btn-danger" @click="emit('reset-db')">🧹 重置資料庫</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.console-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  font-size: 1.1rem;
  color: white;
}

.count-badge {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
  color: var(--color-brand);
  font-weight: bold;
}

.patient-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.patient-item {
  padding: 0.875rem 1.25rem;
  border-left: 4px solid transparent;
  cursor: pointer;
  transition: var(--transition-smooth);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.patient-item:hover {
  background: rgba(255, 255, 255, 0.02);
}

.patient-item.active {
  background: rgba(0, 242, 254, 0.05);
  border-left-color: var(--color-brand);
}

.patient-main-info {
  display: flex;
  flex-direction: column;
}

.patient-name {
  font-size: 0.95rem;
  font-weight: bold;
  color: white;
}

.patient-id {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: monospace;
}

.patient-meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doctor-tag {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}

/* Control Board Styles */
.control-board {
  border-top: 1px solid var(--border-color);
  padding: 1.25rem;
  background-color: rgba(255, 255, 255, 0.01);
}

.panel-sub-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  font-weight: bold;
}

.api-config-box {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.875rem;
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.api-input-row {
  display: flex;
  gap: 6px;
}

.form-input {
  flex: 1;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  outline: none;
  transition: var(--transition-smooth);
}

.form-input:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-brand-glow);
}

.key-success-msg {
  font-size: 0.7rem;
  color: var(--color-green);
  margin-top: 4px;
}

.api-status-badge {
  margin-top: 8px;
  font-size: 0.7rem;
  display: block;
  line-height: 1.4;
}

.status-active {
  color: var(--color-brand);
}

.clear-key-link {
  color: var(--color-red);
  text-decoration: underline;
  margin-left: 4px;
  cursor: pointer;
}

.status-demo {
  color: var(--text-muted);
}

.control-actions {
  display: flex;
  gap: 10px;
}

.btn {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: var(--transition-smooth);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-primary {
  background-color: var(--color-brand);
  color: var(--bg-primary);
}

.btn-primary:hover {
  background-color: var(--color-brand-hover);
  box-shadow: 0 0 10px var(--color-brand-glow);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background-color: var(--bg-secondary);
  border-color: var(--text-secondary);
}

.btn-danger {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: var(--color-red);
}

.btn-danger:hover {
  background-color: var(--color-red);
  color: white;
}

@media (max-width: 768px) {
  .console-sidebar {
    height: auto !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  
  .panel-header {
    padding: 0.75rem 1rem !important;
  }

  .patient-list {
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    padding: 0.75rem 1rem !important;
    gap: 0.75rem !important;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }
  
  .patient-item {
    flex: 0 0 auto !important;
    border-left: none !important;
    border-bottom: 3px solid transparent !important;
    padding: 0.5rem 0.875rem !important;
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 8px !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 4px !important;
    width: 140px !important;
  }
  
  .patient-item.active {
    background: rgba(0, 242, 254, 0.05) !important;
    border-bottom-color: var(--color-brand) !important;
    border-color: var(--color-brand) !important;
  }

  .patient-main-info {
    width: 100% !important;
  }

  .patient-name {
    font-size: 0.9rem !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .patient-id {
    font-size: 0.7rem !important;
  }

  .patient-meta-info {
    width: 100% !important;
    justify-content: space-between !important;
    margin-top: 2px !important;
    gap: 4px !important;
  }

  .doctor-tag {
    font-size: 0.65rem !important;
    padding: 1px 4px !important;
  }

  .control-board {
    padding: 0.75rem 1rem !important;
    background-color: var(--bg-secondary) !important;
    border-top: 1px solid var(--border-color) !important;
    border-bottom: 1px solid var(--border-color) !important;
    margin: 0.5rem 0 !important;
  }

  .api-config-box {
    padding: 0.6rem !important;
    margin-bottom: 0.75rem !important;
    background-color: var(--bg-primary) !important;
  }
}
</style>
