<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { supabaseService } from './services/supabase';
import LineChat from './components/LineChat.vue';
import LiffForm from './components/LiffForm.vue';
import DoctorConsole from './components/DoctorConsole.vue';
import DatabaseViewer from './components/DatabaseViewer.vue';
import PresentationSlides from './components/PresentationSlides.vue';

const profiles = ref([]);
const records = ref([]);
const selectedProfileId = ref('');
const isLiffOpen = ref(false);
const isSlidesOpen = ref(false);
const lineChatRef = ref(null);
const activeMobileTab = ref('patient'); // 'patient' | 'doctor' | 'database'

// 計算當前選取的 Profile
const currentProfile = computed(() => {
  return profiles.value.find(p => p.id === selectedProfileId.value) || null;
});

// 計算各燈號統計數
const statusCounts = computed(() => {
  const counts = { green: 0, yellow: 0, red: 0 };
  profiles.value.forEach(p => {
    if (counts[p.status] !== undefined) {
      counts[p.status]++;
    }
  });
  return counts;
});

// 載入資料庫資料
const loadAllData = async () => {
  try {
    profiles.value = await supabaseService.getProfiles();
    
    // 預設選取第一個 Profile (如果沒選的話)
    if (!selectedProfileId.value && profiles.value.length > 0) {
      selectedProfileId.value = profiles.value[0].id;
    }
    
    if (selectedProfileId.value) {
      records.value = await supabaseService.getTrackingRecords(selectedProfileId.value);
    }
  } catch (error) {
    console.error('Error loading database data:', error);
  }
};

// 切換患者
const handleSelectProfile = async (profileId) => {
  selectedProfileId.value = profileId;
  records.value = await supabaseService.getTrackingRecords(profileId);
  isLiffOpen.value = false; // 切換時關閉 LIFF 重新整理
};

// 當 LIFF 填寫成功
const handleLiffSubmitSuccess = async (newRecord) => {
  // 1. 重新載入最新資料 (同步醫生控制台與資料庫)
  await loadAllData();
  
  // 2. 觸發 LINE Chat 顯示 AI Flex Message 訊息氣泡
  if (lineChatRef.value) {
    lineChatRef.value.addLiffSubmissionMessage(newRecord);
  }
};

// 重置資料庫
const handleResetDatabase = async () => {
  if (confirm('確定要清除所有自訂資料並重置為預設病例嗎？')) {
    supabaseService.resetDatabase();
    selectedProfileId.value = '';
    await loadAllData();
    alert('資料庫已重置為預設測試數據。');
  }
};

// 監聽 SelectedProfileId 變化
watch(selectedProfileId, async (newVal) => {
  if (newVal) {
    records.value = await supabaseService.getTrackingRecords(newVal);
  }
});

onMounted(() => {
  loadAllData();
});
</script>

<template>
  <div id="app">
    <!-- Top Brand Header -->
    <header class="app-header">
      <div class="brand">
        <div class="brand-logo">N</div>
        <div class="brand-text">
          <h1>NailTrace AI</h1>
          <span>指甲矯正智能追蹤衛教系統 (MVP)</span>
        </div>
      </div>

      <!-- Triage Indicators -->
      <div class="header-actions">
        <button class="btn btn-primary" @click="isSlidesOpen = true" style="margin-right: 12px; display: flex; align-items: center; gap: 6px; font-weight: 600; padding: 0.5rem 1rem; border-radius: 50px;">
          <span>📊</span> 5分鐘計畫時程簡報 (PPT)
        </button>
        <div class="triage-status-bar">
          <span class="status-summary-title font-display">Triage Status:</span>
          <div class="status-badge-item">
            <span class="status-dot green"></span>
            <span>綠燈: {{ statusCounts.green }} 人</span>
          </div>
          <div class="status-badge-item">
            <span class="status-dot yellow"></span>
            <span>黃燈: {{ statusCounts.yellow }} 人</span>
          </div>
          <div class="status-badge-item">
            <span class="status-dot red"></span>
            <span>紅燈: {{ statusCounts.red }} 人</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Workspace Grid -->
    <main class="app-container">
      
      <!-- LEFT: LINE Mobile Simulator Frame -->
      <div class="phone-frame" :class="{ 'mobile-hidden': activeMobileTab !== 'patient' }">
        <div class="phone-notch">
          <div class="phone-speaker"></div>
          <div class="phone-camera"></div>
        </div>
        
        <div class="phone-screen">
          <!-- LIFF Web Form Drawer (Overlay inside phone frame) -->
          <Transition name="slide-up">
            <LiffForm 
              v-if="isLiffOpen && currentProfile"
              :currentProfile="currentProfile"
              @close="isLiffOpen = false"
              @submit-success="handleLiffSubmitSuccess"
            />
          </Transition>

          <!-- LINE App Chat Thread -->
          <LineChat 
            ref="lineChatRef"
            v-if="currentProfile"
            :currentProfile="currentProfile"
            :activeRecords="records"
            @open-liff="isLiffOpen = true"
          />
        </div>
      </div>

      <!-- RIGHT: Doctor/Admin Console Dashboard -->
      <DoctorConsole 
        v-if="selectedProfileId"
        :profiles="profiles"
        :selectedProfileId="selectedProfileId"
        :records="records"
        @select-profile="handleSelectProfile"
        @reset-db="handleResetDatabase"
        @refresh="loadAllData"
        :class="{ 'mobile-hidden': activeMobileTab !== 'doctor' }"
      />

      <!-- BOTTOM FULL-WIDTH: Supabase DB visualizer -->
      <DatabaseViewer 
        :profiles="profiles"
        :records="records"
        :class="{ 'mobile-hidden': activeMobileTab !== 'database' }"
      />

    </main>

    <!-- Mobile Bottom Tab Navigation -->
    <nav class="mobile-nav">
      <button 
        :class="['mobile-nav-item', activeMobileTab === 'patient' ? 'active' : '']" 
        @click="activeMobileTab = 'patient'"
      >
        <span class="mobile-nav-icon">💬</span>
        <span class="mobile-nav-label">患者 LINE</span>
      </button>
      <button 
        :class="['mobile-nav-item', activeMobileTab === 'doctor' ? 'active' : '']" 
        @click="activeMobileTab = 'doctor'"
      >
        <span class="mobile-nav-icon">🏥</span>
        <span class="mobile-nav-label">醫師後台</span>
      </button>
      <button 
        :class="['mobile-nav-item', activeMobileTab === 'database' ? 'active' : '']" 
        @click="activeMobileTab = 'database'"
      >
        <span class="mobile-nav-icon">⚡</span>
        <span class="mobile-nav-label">資料監控</span>
      </button>
    </nav>

    <!-- Plan slides overlay -->
    <PresentationSlides 
      v-if="isSlidesOpen" 
      @close="isSlidesOpen = false" 
    />
  </div>
</template>

<style>
/* Global CSS variables & structure override */
.triage-status-bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
}

.status-summary-title {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: bold;
}

.status-badge-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}
</style>
