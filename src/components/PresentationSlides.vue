<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['close']);

const currentSlide = ref(0);
const slidesCount = 5;

// Presentation Timer (5 minutes = 300 seconds)
const timeLeft = ref(300);
const timerActive = ref(false);
let timerInterval = null;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const toggleTimer = () => {
  if (timerActive.value) {
    clearInterval(timerInterval);
    timerActive.value = false;
  } else {
    timerActive.value = true;
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--;
      } else {
        clearInterval(timerInterval);
        timerActive.value = false;
      }
    }, 1000);
  }
};

const resetTimer = () => {
  clearInterval(timerInterval);
  timerActive.value = false;
  timeLeft.value = 300;
};

// Navigation
const nextSlide = () => {
  if (currentSlide.value < slidesCount - 1) {
    currentSlide.value++;
  }
};

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--;
  }
};

const goToSlide = (index) => {
  currentSlide.value = index;
};

// Keyboard navigation
const handleKeyDown = (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
    nextSlide();
  } else if (e.key === 'ArrowLeft') {
    prevSlide();
  } else if (e.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  clearInterval(timerInterval);
});
</script>

<template>
  <div class="slides-overlay">
    <!-- Slides Control Bar -->
    <header class="slides-header">
      <div class="header-left">
        <span class="badge-role">專案計畫介紹與開發時程</span>
        <span class="slide-progress-text">投影片 {{ currentSlide + 1 }} / {{ slidesCount }}</span>
      </div>
      
      <div class="header-right">
        <button class="btn-close-slides" @click="emit('close')">
          <span>關閉簡報</span> ✕
        </button>
      </div>
    </header>

    <!-- Slide Body Canvas -->
    <main class="slide-canvas">
      
      <!-- Slide 1: Cover Page -->
      <Transition name="fade">
        <div v-if="currentSlide === 0" class="slide-content cover-slide">
          <div class="cover-wrapper glass-panel">
            <span class="project-tag">萬芳醫院 115 年度全人計畫 (創新研發組)</span>
            <h1 class="cover-title font-display">指甲矯正智能追蹤衛教系統開發</h1>
            <h2 class="cover-subtitle">系統技術架構與工程開發時程規劃匯報</h2>
            
            <div class="divider"></div>
            
            <div class="cover-meta">
              <div class="meta-item">
                <span class="meta-label">計畫主持人</span>
                <span class="meta-val">皮膚科 黃愉真 主任</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">開發單位</span>
                <span class="meta-val">系統工程研發團隊</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">時程期程</span>
                <span class="meta-val">115.08.01 - 116.07.31 (12個月)</span>
              </div>
            </div>
            
            <div class="cover-footer">
              <span class="accent-text">報告重點：系統功能實作技術架構、12個月開發里程碑、以及需要醫療團隊配合的關鍵節點。</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Slide 2: Technical Architecture -->
      <Transition name="fade">
        <div v-if="currentSlide === 1" class="slide-content two-col-slide">
          <h2 class="slide-title font-display">系統技術落實與 MVP 架構</h2>
          
          <div class="grid-container">
            <!-- Left: Frontend Integration -->
            <div class="grid-col glass-panel border-cyan">
              <h3 class="col-title text-cyan">LINE 官方帳號 × LIFF 前端</h3>
              <ul class="points-list">
                <li>
                  <strong>無縫身分與隱私綁定</strong>
                  <p>病患首次加入時，透過 SMS 簡訊或病歷號進行驗證，將 LINE UID 與後台資料庫對齊，保障個資安全。</p>
                </li>
                <li>
                  <strong>LIFF 結構化表單相機</strong>
                  <p>整合 HTML5 Camera API，在 LIFF 拍照介面重疊半透明的「腳趾/指甲輪廓引導框」，解決患者上傳照片角度不一、模糊等難以比對的痛點。</p>
                </li>
                <li>
                  <strong>動態進度儀表板</strong>
                  <p>提供病患個人化進度視圖，可隨時查看歷史指甲照片縮圖及矯正進度，提升病人治療的依從性。</p>
                </li>
              </ul>
            </div>

            <!-- Right: Backend & AI -->
            <div class="grid-col glass-panel">
              <h3 class="col-title text-purple">雲端後台與 Gemini AI 智慧客服</h3>
              <ul class="points-list">
                <li>
                  <strong>Supabase 雲端資料庫</strong>
                  <p>做為後端引擎，實現即時數據同步（問卷分數、影像 URL、醫師審閱狀態），確保系統高可用性。</p>
                </li>
                <li>
                  <strong>Gemini 1.5 Pro/Flash API 串接</strong>
                  <p>針對病患常見問題 (FAQ)，利用 LLM 的 Natural Language Processing 進行精準回覆，並在必要時（如偵測到紅燈字眼）轉接人工掛號指引。</p>
                </li>
                <li>
                  <strong>三色燈號自動判定邏輯</strong>
                  <p>
                    • <strong>綠燈：</strong> 數據穩定正常。<br>
                    • <strong>黃燈：</strong> 超過 3 天未回傳，系統背景 Cron Job 自動觸發 LINE Push API 催繳。<br>
                    • <strong>紅燈：</strong> 系統依據問卷規則（如痛感 VAS 突然飆升）自動標記，發送即時警報。
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Slide 3: Execution Timeline & Milestones -->
      <Transition name="fade">
        <div v-if="currentSlide === 2" class="slide-content timeline-slide">
          <h2 class="slide-title font-display">系統開發時程規劃 (12個月)</h2>
          
          <!-- Gantt chart simulation -->
          <div class="gantt-wrapper glass-panel">
            <div class="gantt-header">
              <div class="gantt-col-name">工程開發階段 \ 執行月份</div>
              <div class="gantt-col-month" v-for="m in 12" :key="m">M{{ m }}</div>
            </div>
            
            <div class="gantt-rows">
              <!-- Row 1 -->
              <div class="gantt-row">
                <div class="gantt-row-name">
                  <span class="project-dot p-blue"></span>
                  1. 需求訪談與系統分析 (SD)
                </div>
                <div class="gantt-row-bar-container">
                  <div class="gantt-bar p-blue" style="grid-column: 1 / 4;">
                    M1-M3: 系統規格書、數據 Schema 設定、臨床照護文案結構化
                  </div>
                </div>
              </div>
              
              <!-- Row 2 -->
              <div class="gantt-row">
                <div class="gantt-row-name">
                  <span class="project-dot p-cyan"></span>
                  2. LINE LIFF 前端與相機開發
                </div>
                <div class="gantt-row-bar-container">
                  <div class="gantt-bar p-cyan" style="grid-column: 2 / 5;">
                    M2-M4: 身分綁定、問卷表單、相機引導框、個人進度儀表板
                  </div>
                </div>
              </div>

              <!-- Row 3 -->
              <div class="gantt-row">
                <div class="gantt-row-name">
                  <span class="project-dot p-purple"></span>
                  3. Gemini AI 衛教助手開發
                </div>
                <div class="gantt-row-bar-container">
                  <div class="gantt-bar p-purple" style="grid-column: 2 / 7;">
                    M2-M6: Gemini API 串接、提示詞工程、FAQ 知識庫與 RAG 測試
                  </div>
                </div>
              </div>

              <!-- Row 4 -->
              <div class="gantt-row">
                <div class="gantt-row-name">
                  <span class="project-dot p-yellow"></span>
                  4. 後台 Dashboard 與燈號預警
                </div>
                <div class="gantt-row-bar-container">
                  <div class="gantt-bar p-yellow" style="grid-column: 7 / 9;">
                    M7-M8: 三色預警系統、醫師審閱後台、系統整合測試與上線
                  </div>
                </div>
              </div>

              <!-- Row 5 -->
              <div class="gantt-row">
                <div class="gantt-row-name">
                  <span class="project-dot p-green"></span>
                  5. 系統測試、臨床回饋與優化
                </div>
                <div class="gantt-row-bar-container">
                  <div class="gantt-bar p-green" style="grid-column: 9 / 13;">
                    M9-M12: 門診試辦、Bug 修復、AI 回覆率校正、期末系統交付
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Milestones markers -->
            <div class="milestones-row">
              <div class="milestone-box" style="left: 25%;">
                <span class="ms-marker"></span>
                <span class="ms-text"><strong>M3 (SD定案):</strong> 系統規格書與資料結構簽約</span>
              </div>
              <div class="milestone-box" style="left: 50%;">
                <span class="ms-marker"></span>
                <span class="ms-text"><strong>M6 (AI就緒):</strong> FAQ 對答與 API 回覆成功率達 90%</span>
              </div>
              <div class="milestone-box" style="left: 67%;">
                <span class="ms-marker"></span>
                <span class="ms-text"><strong>M8 (上線測試):</strong> 系統整體整合，開啟門診 Demo</span>
              </div>
              <div class="milestone-box" style="left: 100%;">
                <span class="ms-marker"></span>
                <span class="ms-text"><strong>M12 (系統交付):</strong> 完成原始碼交付及教育訓練</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Slide 4: Action Items for Medical Team -->
      <Transition name="fade">
        <div v-if="currentSlide === 3" class="slide-content structure-slide">
          <h2 class="slide-title font-display">臨床醫療團隊關鍵配合事項</h2>
          
          <div class="flow-container">
            
            <!-- Step 1: M1-M3 -->
            <div class="flow-card glass-panel flex-1">
              <div class="card-icon">階段一 (M1 - M3)：素材準備</div>
              <ul class="flow-details">
                <li><strong>臨床問卷結構</strong>：確定 VAS 疼痛量表及 questionnaire 題目（異物感、發炎等）。</li>
                <li><strong>常見問答集 (FAQ)</strong>：收集 30-50 題病人常見的指甲矯正疑問，用於 AI 知識庫訓練。</li>
                <li><strong>標準拍照示意圖</strong>：提供正確及錯誤拍照角度範例，用於設計相機導引框。</li>
              </ul>
            </div>

            <!-- Arrow -->
            <div class="flow-arrow">→</div>

            <!-- Step 2: M4-M6 -->
            <div class="flow-card glass-panel flex-1 border-yellow">
              <div class="card-icon">階段二 (M4 - M6)：AI 與介面測試</div>
              <ul class="flow-details">
                <li><strong>LIFF 介面易用性走查</strong>：由護理人員測試前端操作流程是否流暢.</li>
                <li><strong>AI 對答校正</strong>：協助測試 Gemini 衛教助理的回覆內容，確保醫學知識準確度，防止 AI 幻覺。</li>
              </ul>
            </div>

            <!-- Arrow -->
            <div class="flow-arrow">→</div>

            <!-- Step 3: M9-M12 -->
            <div class="flow-card glass-panel flex-1">
              <div class="card-icon">階段三 (M9 - M12)：門診試辦</div>
              <ul class="flow-details">
                <li><strong>個案甄詢與綁定</strong>：門診徵得患者同意後引入系統，目標試辦期間達 50 例以上。</li>
                <li><strong>後台使用反饋</strong>：醫師與護理師對三色燈號及審閱後台的交互體驗提出修改建議。</li>
              </ul>
            </div>

          </div>
        </div>
      </Transition>

      <!-- Slide 5: Expected Deliverables & Value -->
      <Transition name="fade">
        <div v-if="currentSlide === 4" class="slide-content summary-slide">
          <h2 class="slide-title font-display">預期交付物與專案效益</h2>
          
          <div class="grid-container">
            <!-- Left: Expected Metrics -->
            <div class="grid-col glass-panel">
              <h3 class="col-title text-green">系統交付物清單</h3>
              <ul class="points-list">
                <li>
                  <strong>LINE @ LIFF 網頁端應用程式</strong>
                  <p>包含身份綁定、結構化問卷、引導拍照相機模組、病患個人進度儀表板。</p>
                </li>
                <li>
                  <strong>後台管理系統 Dashboard</strong>
                  <p>包含紅黃綠三色預警模組、病歷檢視、照片時間軸對比、後台即時轉接掛號設定。</p>
                </li>
                <li>
                  <strong>Gemini AI 衛教客服機器人</strong>
                  <p>部署於 LINE API 上的自動回覆模組，含完整的 API 串接程式碼與提示詞設定手冊。</p>
                </li>
                <li>
                  <strong>完整專案技術文檔與原始碼</strong>
                  <p>系統架構說明書、API 規格書、資料庫欄位說明書、系統轉交手冊。</p>
                </li>
              </ul>
            </div>

            <!-- Right: Value Proposition -->
            <div class="grid-col glass-panel border-purple">
              <h3 class="col-title text-purple">對本計畫全人評鑑之加分效益</h3>
              <ul class="points-list">
                <li>
                  <strong>全人醫療服務創新性</strong>
                  <p>將最新生成式 AI (Gemini) 與醫療追蹤結合，符合全人計畫中「引進科技媒體提昇品質」與「創新照護模式」指標。</p>
                </li>
                <li>
                  <strong>量化效益易於展現</strong>
                  <p>結案時可提供「節省護理追蹤時間比例」、「病患回傳率變化」、「VAS 疼痛控制成效」，圖表直接產出，利於結案報告撰寫。</p>
                </li>
                <li>
                  <strong>高複製性與未來擴充</strong>
                  <p>系統資料庫與前端邏輯預留彈性，未來可直接複製至「異位性皮膚炎」、「乾癬」等需長期追蹤之皮膚科慢性疾病。</p>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="discussion-footer">
            <span>🗣️ <strong>臨床合作討論要點：</strong> M1 階段的問卷與 FAQ 素材是否能於第一個月底前提供？是否有其他科部（如整形外科）術後照護也需納入初期欄位考量？</span>
          </div>
        </div>
      </Transition>

    </main>

    <!-- Slide Navigation Footer -->
    <footer class="slides-footer">
      <div class="footer-left">
        <span class="hotkey-tip">提示: 可使用鍵盤 左右方向鍵(←/→) 進行投影片切換，ESC 鍵退出</span>
      </div>
      
      <div class="footer-center">
        <button class="btn-nav" @click="prevSlide" :disabled="currentSlide === 0">&lt; 上一頁</button>
        <div class="nav-dots">
          <span 
            v-for="(s, index) in slidesCount" 
            :key="index" 
            :class="['nav-dot', currentSlide === index ? 'active' : '']"
            @click="goToSlide(index)"
          ></span>
        </div>
        <button class="btn-nav" @click="nextSlide" :disabled="currentSlide === slidesCount - 1">下一頁 &gt;</button>
      </div>

      <div class="footer-right"></div>
    </footer>
  </div>
</template>

<style scoped>
.slides-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-primary);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  color: var(--text-primary);
  font-family: var(--font-sans);
  background-image: 
    radial-gradient(at 0% 0%, hsla(220, 80%, 15%, 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 100%, hsla(270, 70%, 15%, 0.3) 0px, transparent 50%);
}

/* Header styling */
.slides-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background-color: rgba(20, 26, 40, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.badge-role {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--color-brand);
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
}

.slide-progress-text {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Presentation Timer */
.presentation-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  padding: 4px 12px;
  border-radius: 50px;
  transition: var(--transition-smooth);
}

.presentation-timer.timer-warning {
  border-color: var(--color-red);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
}

.timer-display {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  min-width: 50px;
}

.btn-timer-toggle, .btn-timer-reset {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-timer-toggle:hover {
  background-color: var(--color-brand);
  color: var(--bg-primary);
}

.btn-timer-reset:hover {
  background-color: var(--bg-secondary);
  color: var(--color-red);
}

.btn-close-slides {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--color-red);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-close-slides:hover {
  background-color: var(--color-red);
  color: var(--text-primary);
}

/* Canvas & Transitions */
.slide-canvas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 4rem;
  position: relative;
  overflow: hidden;
}

.slide-content {
  width: 100%;
  max-width: 1200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: absolute;
}

/* Slide Transition Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

/* Typography on slides */
.slide-title {
  font-size: 2.2rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 5px solid var(--color-brand);
  padding-left: 15px;
}

/* Cover Slide Styles */
.cover-slide {
  align-items: center;
}

.cover-wrapper {
  padding: 3.5rem;
  max-width: 900px;
  text-align: center;
  border-color: rgba(0, 242, 254, 0.2);
  background: rgba(20, 26, 40, 0.8);
}

.project-tag {
  color: var(--color-brand);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.cover-title {
  font-size: 3.2rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #fff 30%, var(--color-brand) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cover-subtitle {
  font-size: 1.5rem;
  color: var(--text-secondary);
  font-weight: 400;
  margin-bottom: 2rem;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  margin: 2rem 0;
}

.cover-meta {
  display: flex;
  justify-content: space-around;
  margin-bottom: 2.5rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.meta-val {
  font-size: 1.05rem;
  color: var(--text-primary);
  font-weight: 600;
}

.cover-footer {
  background-color: rgba(0, 242, 254, 0.05);
  border: 1px dashed var(--color-brand);
  padding: 12px 20px;
  border-radius: 8px;
}

.accent-text {
  font-size: 0.9rem;
  color: var(--color-brand);
}

/* Two Column Slide Styles */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  flex: 1;
}

.grid-col {
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.col-title {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 700;
}

.text-red { color: var(--color-red); }
.text-cyan { color: var(--color-brand); }
.text-purple { color: #a855f7; }
.text-green { color: var(--color-green); }

.border-cyan { border-color: rgba(0, 242, 254, 0.3) !important; }
.border-purple { border-color: rgba(168, 85, 247, 0.3) !important; }

.points-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
}

.points-list li strong {
  font-size: 1rem;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}

.points-list li p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Structure Slide Styles */
.flow-container {
  display: flex;
  align-items: stretch;
  gap: 1.25rem;
  flex: 1;
  margin-top: 1rem;
}

.flex-1 { flex: 1; }

.flow-card {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
}

.border-yellow {
  border-color: rgba(245, 158, 11, 0.3) !important;
}

.card-icon {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.flow-details {
  list-style: square;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.flow-details li {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.flow-arrow {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  color: var(--text-muted);
}

.triage-strip {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.triage-box {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
}

.triage-box.green-box {
  background-color: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.15);
}
.triage-box.yellow-box {
  background-color: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.15);
}
.triage-box.red-box {
  background-color: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.15);
}

.triage-box strong {
  font-size: 0.85rem;
  margin-left: 6px;
}

.triage-box p {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 4px;
  margin-left: 18px;
}

/* Timeline/Gantt Slide Styles */
.gantt-wrapper {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.gantt-header {
  display: grid;
  grid-template-columns: 240px repeat(12, 1fr);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
  color: var(--text-muted);
}

.gantt-col-name {
  text-align: left;
}

.gantt-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 20px;
}

.gantt-row {
  display: grid;
  grid-template-columns: 240px 1fr;
  align-items: center;
}

.gantt-row-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.p-blue { background-color: #3b82f6; }
.p-cyan { background-color: var(--color-brand); }
.p-purple { background-color: #a855f7; }
.p-yellow { background-color: var(--color-yellow); }
.p-green { background-color: var(--color-green); }

.gantt-row-bar-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  height: 34px;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  align-items: center;
  padding: 0 4px;
}

.gantt-bar {
  border-radius: 4px;
  font-size: 0.72rem;
  color: #fff;
  padding: 4px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  font-weight: 500;
}

.gantt-bar.p-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.gantt-bar.p-cyan { background: linear-gradient(90deg, var(--color-brand), #22d3ee); }
.gantt-bar.p-purple { background: linear-gradient(90deg, #a855f7, #c084fc); }
.gantt-bar.p-yellow { background: linear-gradient(90deg, var(--color-yellow), #fbbf24); }
.gantt-bar.p-green { background: linear-gradient(90deg, var(--color-green), #34d399); }

/* Milestones Row */
.milestones-row {
  position: relative;
  height: 50px;
  margin-top: 15px;
}

.milestone-box {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 180px;
  text-align: center;
}

.ms-marker {
  font-size: 1.1rem;
}

.ms-text {
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.3;
  margin-top: 2px;
}

.discussion-footer {
  margin-top: 1.5rem;
  background-color: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.15);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #c084fc;
}

/* Slide Footer styling */
.slides-footer {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background-color: rgba(20, 26, 40, 0.85);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border-color);
  font-size: 0.8rem;
}

.footer-left {
  color: var(--text-muted);
}

.footer-center {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn-nav {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-smooth);
}

.btn-nav:hover:not(:disabled) {
  background-color: var(--color-brand);
  color: var(--bg-primary);
  border-color: var(--color-brand);
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-dots {
  display: flex;
  gap: 8px;
}

.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--border-color);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.nav-dot.active {
  background-color: var(--color-brand);
  transform: scale(1.3);
  box-shadow: 0 0 8px var(--color-brand);
}

.footer-right {
  display: flex;
  align-items: center;
}

.slide-key-concept {
  color: var(--color-brand);
  font-weight: 600;
  font-size: 0.85rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.8; }
}

@media (max-width: 768px) {
  .slides-header {
    padding: 0 1rem !important;
    font-size: 0.75rem !important;
  }
  
  .badge-role {
    font-size: 0.7rem !important;
    padding: 2px 8px !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }
  
  .presentation-timer {
    padding: 2px 8px !important;
    gap: 4px !important;
  }
  
  .timer-display {
    font-size: 0.9rem !important;
    min-width: auto !important;
  }
  
  .btn-timer-toggle, .btn-timer-reset {
    font-size: 0.65rem !important;
    padding: 1px 4px !important;
  }
  
  .btn-close-slides {
    padding: 4px 10px !important;
    font-size: 0.75rem !important;
  }

  .slide-canvas {
    padding: 1rem 0.75rem !important;
    height: calc(100vh - 120px) !important;
    overflow-y: auto !important;
    display: block !important;
  }

  .slide-content {
    position: relative !important;
    height: auto !important;
    min-height: 100% !important;
    justify-content: flex-start !important;
    top: auto !important;
    left: auto !important;
    transform: none !important;
    padding-bottom: 2rem !important;
  }

  .slide-title {
    font-size: 1.4rem !important;
    margin-bottom: 1rem !important;
    padding-left: 10px !important;
  }

  /* Cover Slide Mobile */
  .cover-wrapper {
    padding: 1.5rem !important;
  }
  
  .cover-title {
    font-size: 1.6rem !important;
    line-height: 1.3 !important;
  }
  
  .cover-subtitle {
    font-size: 1.05rem !important;
    margin-bottom: 1.25rem !important;
  }
  
  .divider {
    margin: 1.25rem 0 !important;
  }
  
  .cover-meta {
    flex-direction: column !important;
    gap: 12px !important;
    margin-bottom: 1.5rem !important;
  }
  
  .meta-val {
    font-size: 0.95rem !important;
  }
  
  .cover-footer {
    padding: 8px 12px !important;
  }
  
  .accent-text {
    font-size: 0.78rem !important;
  }

  /* Two Column Slide Mobile */
  .grid-container {
    grid-template-columns: 1fr !important;
    gap: 1rem !important;
  }
  
  .grid-col {
    padding: 1.25rem !important;
  }
  
  .col-title {
    font-size: 1.1rem !important;
    margin-bottom: 1rem !important;
  }

  /* Gantt timeline Slide Mobile */
  .gantt-wrapper {
    padding: 0.75rem !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
  }
  
  .gantt-header, .gantt-rows {
    min-width: 680px !important;
  }
  
  .milestones-row {
    display: none !important;
  }

  /* Flow card Slide Mobile */
  .flow-container {
    flex-direction: column !important;
    gap: 0.75rem !important;
  }
  
  .flow-arrow {
    transform: rotate(90deg) !important;
    justify-content: center !important;
    margin: 0.25rem 0 !important;
  }
  
  .flow-card {
    padding: 1.25rem !important;
  }

  /* Slide Footer Mobile */
  .slides-footer {
    padding: 0 1rem !important;
    font-size: 0.75rem !important;
    height: 60px !important;
  }
  
  .hotkey-tip {
    display: none !important;
  }
  
  .btn-nav {
    padding: 4px 10px !important;
    font-size: 0.75rem !important;
  }
  
  .slide-key-concept {
    display: none !important;
  }
}
</style>
