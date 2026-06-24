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
      <h3 class="panel-sub-title">⚙️ 模擬器設定面板</h3>
      
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
</style>
