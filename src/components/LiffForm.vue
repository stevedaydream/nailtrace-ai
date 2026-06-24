<script setup>
import { ref, computed } from 'vue';
import { geminiService } from '../services/gemini';
import { supabaseService } from '../services/supabase';

const props = defineProps({
  currentProfile: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'submit-success']);

const currentStep = ref(1);
const painScore = ref(3);
const satisfactionScore = ref(8);
const selectedPreset = ref('preset-normal');

// 自訂指甲照
const customImageBase64 = ref('');
const customImageName = ref('');
const isUploadingCustom = ref(false);

const isSubmitting = ref(false);
const submitStatusText = ref('');

// 預設照片路徑 (色彩提示代表臨床特徵)
const imagePresets = ref([
  { id: 'preset-normal', label: '1. 矯正正常 & 健康', desc: '指甲無發炎，固定端正', color: '#10b981' },
  { id: 'preset-loose', label: '2. 矯正器鬆脫/位移', desc: '顯示矯正器位移或鬆脫', color: '#f59e0b' },
  { id: 'preset-inflamed', label: '3. 甲溝輕微紅腫', desc: '指甲邊緣紅腫壓迫', color: '#f97316' },
  { id: 'preset-granuloma', label: '4. 嚴重肉芽與紅腫', desc: '明顯肉芽組織增生與嚴重發炎', color: '#ef4444' }
]);

const compressImage = (file, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output JPEG at 0.7 quality to keep size small (~40-70KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const handleCustomFrontUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  isUploadingCustom.value = true;
  customImageName.value = file.name;
  selectedPreset.value = ''; // 取消預設選取

  try {
    const compressed = await compressImage(file);
    customImageBase64.value = compressed;
  } catch (err) {
    console.error('Image upload failed:', err);
    alert('圖片壓縮處理失敗，請換一張相片試試！');
  } finally {
    isUploadingCustom.value = false;
  }
};

const painLabel = computed(() => {
  const score = painScore.value;
  if (score === 0) return '🟢 完全不痛 (VAS 0)';
  if (score <= 3) return '🟢 輕微疼痛 (VAS 1-3) - 感覺微張力';
  if (score <= 6) return '🟡 中度疼痛 (VAS 4-6) - 輕微抽痛/壓痛';
  return '🔴 重度疼痛 (VAS 7-10) - 嚴重疼痛/影響行走';
});

const activeImagePreview = computed(() => {
  const preset = imagePresets.value.find(p => p.id === selectedPreset.value);
  if (!preset) return '#6366f1';
  return preset.color;
});

const nextStep = () => {
  if (currentStep.value < 3) currentStep.value++;
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

// 提交至 Gemini 與 Supabase
const handleSubmit = async () => {
  isSubmitting.value = true;
  submitStatusText.value = '🔍 Gemini AI 正在讀取患部影像...';
  
  try {
    let finalImage = '';
    let frontPayload = customImageBase64.value;

    if (selectedPreset.value) {
      finalImage = selectedPreset.value;
      frontPayload = 'PRESET_IMAGE_BASE64_PLACEHOLDER';
    } else {
      // 自訂相片存在，上傳至 Supabase Storage
      submitStatusText.value = '📤 正在上傳照片至 Supabase Storage...';
      finalImage = await supabaseService.uploadImage(
        props.currentProfile.id,
        customImageBase64.value,
        customImageName.value || 'photo.jpg'
      );
    }

    // 階段 1: 呼叫 Gemini AI 分析
    submitStatusText.value = '🧠 Gemini AI 正在分析指甲弧度與嵌肉張力...';
    setTimeout(() => { submitStatusText.value = '🔬 正在評估甲溝發炎與肉芽組織風險...'; }, 1500);
    setTimeout(() => { submitStatusText.value = '💾 正在將診斷結果寫入 Supabase...'; }, 3000);

    const aiResult = await geminiService.analyzeToeImage({
      imageBase64: frontPayload,
      painScore: painScore.value,
      satisfactionScore: satisfactionScore.value,
      presetId: selectedPreset.value
    });

    await new Promise(resolve => setTimeout(resolve, 4500)); // 擬真 AI 多模態運算時間

    // 階段 2: 寫入 Supabase DB
    const newRecord = await supabaseService.addTrackingRecord({
      patientId: props.currentProfile.id,
      painScore: painScore.value,
      satisfactionScore: satisfactionScore.value,
      imageUrl: finalImage,
      geminiAnalysis: aiResult,
      status: aiResult.status
    });

    emit('submit-success', newRecord);
    emit('close');

  } catch (error) {
    console.error(error);
    alert('AI 影像分析或上傳失敗：' + error.message);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="liff-overlay">
    <!-- LIFF Header -->
    <div class="liff-header">
      <div class="liff-title">
        <span class="liff-badge">LIFF</span>
        <span>指甲追蹤表單</span>
      </div>
      <button class="close-btn" @click="emit('close')">✕</button>
    </div>

    <!-- Main Content Area -->
    <div class="liff-content">
      
      <!-- SUBMITTING LOADER SCREEN -->
      <div v-if="isSubmitting" class="loader-screen">
        <div class="spinner"></div>
        <h3>NailTrace AI 核心分析中</h3>
        <p class="loader-status">{{ submitStatusText }}</p>
        <div class="loader-bar-bg">
          <div class="loader-bar-fill"></div>
        </div>
      </div>

      <!-- STEP 1: Verify Profile -->
      <div v-else-if="currentStep === 1" class="step-view">
        <div class="step-header">
          <span class="step-number">步驟 1 / 3</span>
          <h2>確認基本病歷資訊</h2>
        </div>

        <div class="profile-card">
          <div class="card-item">
            <span class="item-label">病患姓名</span>
            <span class="item-val">{{ currentProfile.name }}</span>
          </div>
          <div class="card-item">
            <span class="item-label">病歷號碼</span>
            <span class="item-val font-code">{{ currentProfile.patient_id }}</span>
          </div>
          <div class="card-item">
            <span class="item-label">主治醫師</span>
            <span class="item-val">{{ currentProfile.doctor_name }}</span>
          </div>
        </div>

        <div class="alert-box note">
          💡 系統已自動帶入您的病歷與 LINE ID 綁定資訊。請確認無誤後點選下一步開始填寫本月追蹤表單。
        </div>

        <div class="step-footer">
          <button class="liff-btn btn-next" @click="nextStep">確認無誤，下一步 ➔</button>
        </div>
      </div>

      <!-- STEP 2: VAS Pain & Satisfaction -->
      <div v-else-if="currentStep === 2" class="step-view">
        <div class="step-header">
          <span class="step-number">步驟 2 / 3</span>
          <h2>填寫本月症狀問卷</h2>
        </div>

        <!-- Pain Slider -->
        <div class="form-section">
          <h3>1. 腳趾疼痛評估 (VAS 評分)</h3>
          <p class="section-desc">請滑動下方拉桿，選擇您這幾天腳趾甲周圍的疼痛感程度：</p>
          <div class="pain-score-display">
            <div class="pain-num" :style="{ color: painScore <= 3 ? 'var(--color-green)' : painScore <= 6 ? 'var(--color-yellow)' : 'var(--color-red)' }">
              {{ painScore }}
            </div>
            <div class="pain-desc">{{ painLabel }}</div>
          </div>
          <div class="slider-box">
            <input 
              type="range" 
              min="0" 
              max="10" 
              v-model="painScore" 
              class="range-slider"
            />
            <div class="slider-labels">
              <span>0 (無痛)</span>
              <span>5 (中度)</span>
              <span>10 (極痛)</span>
            </div>
          </div>
        </div>

        <!-- Satisfaction Slider -->
        <div class="form-section" style="margin-top: 1.5rem;">
          <h3>2. 目前矯正滿意度</h3>
          <p class="section-desc">您對目前指甲矯正的形狀、舒適度與治療進度的滿意程度：</p>
          <div class="pain-score-display">
            <div class="pain-num" style="color: var(--color-brand);">
              {{ satisfactionScore }}
            </div>
            <div class="pain-desc">😊 滿意度：{{ satisfactionScore }} / 10 分</div>
          </div>
          <div class="slider-box">
            <input 
              type="range" 
              min="0" 
              max="10" 
              v-model="satisfactionScore" 
              class="range-slider"
            />
            <div class="slider-labels">
              <span>0 (極不滿)</span>
              <span>5 (普通)</span>
              <span>10 (極滿意)</span>
            </div>
          </div>
        </div>

        <div class="step-footer split">
          <button class="liff-btn btn-back" @click="prevStep">❮ 上一步</button>
          <button class="liff-btn btn-next" @click="nextStep">下一步 ➔</button>
        </div>
      </div>

      <!-- STEP 3: Image Upload & Preset -->
      <div v-else-if="currentStep === 3" class="step-view">
        <div class="step-header">
          <span class="step-number">步驟 3 / 3</span>
          <h2>拍攝或選取腳趾照片</h2>
        </div>

        <div class="form-section">
          <h3>請提供清楚的患部指甲照片</h3>
          <p class="section-desc">您可以使用手機拍攝正面照片上傳，或者在測試中選取下方的【臨床模擬預設】進行 AI 多模態辨識：</p>
          
          <!-- Preset Selector Grid -->
          <div class="preset-grid">
            <div 
              v-for="p in imagePresets" 
              :key="p.id"
              :class="['preset-card', selectedPreset === p.id ? 'active' : '']"
              @click="selectedPreset = p.id; customImageBase64 = ''; customImageName = ''"
            >
              <div class="preset-color-block" :style="{ background: `linear-gradient(135deg, ${p.color}, ${p.color}80)` }">
                <span class="preset-color-text">診斷預設</span>
              </div>
              <div class="preset-card-body">
                <div class="preset-title">{{ p.label }}</div>
                <div class="preset-desc">{{ p.desc }}</div>
              </div>
            </div>
          </div>

          <div class="divider-text"><span>或 上傳自訂照片</span></div>

          <!-- Single Custom File Uploader -->
          <div class="single-upload-container">
            <div class="upload-col">
              <span class="upload-col-label">📸 上傳指甲照片 (Photo)</span>
              <label class="upload-btn" :class="{ 'has-file': customImageBase64 }">
                {{ customImageBase64 ? '✓ 已選擇相片' : '選擇指甲相片' }}
                <input type="file" accept="image/*" @change="handleCustomFrontUpload" style="display:none;" />
              </label>
              <div v-if="customImageName" class="file-name-tag" :title="customImageName">
                {{ customImageName }}
              </div>
              <div v-if="isUploadingCustom" class="upload-loader">處理中...</div>
            </div>
          </div>

          <!-- Test Helper Tip -->
          <div class="test-helper-tip">
            <span class="test-tip-icon">💡</span>
            <div class="test-tip-body">
              <strong>測試提示：</strong> 本專案已在 public/ 生成對應的測試照片，可點選下載儲存至手機/本機後用作自訂上傳測試：
              <div class="test-links">
                <a href="/sample-front.png" download="sample-front.png" class="test-link-btn">⬇️ 下載正面測試圖</a>
              </div>
            </div>
          </div>

          <!-- Active Preview -->
          <div class="preview-container">
            <div class="preview-title">照片預覽：</div>
            
            <!-- Preset Preview -->
            <div v-if="selectedPreset" class="preset-img-placeholder" :style="{ background: activeImagePreview }">
              <span class="placeholder-emoji">👣</span>
              <span>已載入臨床模擬預設 - </span>
              <strong>{{ imagePresets.find(p => p.id === selectedPreset)?.label }}</strong>
              <span class="preset-desc-small">{{ imagePresets.find(p => p.id === selectedPreset)?.desc }}</span>
            </div>

            <!-- Custom Image Preview -->
            <div v-else-if="customImageBase64" class="single-preview">
              <div class="custom-img-wrapper-full">
                <img :src="customImageBase64" alt="Custom toe preview" />
              </div>
            </div>

            <!-- No Preview -->
            <div v-else class="no-img-placeholder">
              <span>尚未選擇預設或上傳自訂照片</span>
            </div>
          </div>
        </div>

        <div class="step-footer split">
          <button class="liff-btn btn-back" @click="prevStep" :disabled="isSubmitting">❮ 上一步</button>
          <button class="liff-btn btn-submit" @click="handleSubmit" :disabled="isSubmitting || (!selectedPreset && !customImageBase64)">
            送出追蹤資料 🚀
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.liff-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #121824; /* Dark medical theme inside LIFF */
  z-index: 100;
  display: flex;
  flex-direction: column;
  animation: slide-up 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.liff-header {
  height: 48px;
  background-color: #192030;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  color: white;
}

.liff-title {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.liff-badge {
  background-color: #00c300;
  color: black;
  font-size: 0.6rem;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 800;
}

.close-btn {
  background: none;
  border: none;
  color: #9ab4d6;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.liff-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

/* Steps and Typography */
.step-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.step-header {
  margin-bottom: 1.25rem;
}

.step-number {
  font-size: 0.7rem;
  color: var(--color-brand);
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 0.05em;
}

.step-header h2 {
  font-size: 1.1rem;
  color: white;
  margin-top: 2px;
}

/* Step 1 Profile Card */
.profile-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 1.25rem;
}

.card-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.card-item:last-child {
  border-bottom: none;
}

.item-label {
  font-size: 0.75rem;
  color: #8c9ba5;
}

.item-val {
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

.font-code {
  font-family: monospace;
}

/* Alert boxes */
.alert-box {
  padding: 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  margin-bottom: 1.25rem;
}

.alert-box.note {
  background-color: rgba(0, 242, 254, 0.05);
  border: 1px solid rgba(0, 242, 254, 0.15);
  color: #9cdbf7;
}

/* Step 2 Form sections */
.form-section h3 {
  font-size: 0.9rem;
  color: white;
  margin-bottom: 4px;
}

.section-desc {
  font-size: 0.7rem;
  color: #8c9ba5;
  margin-bottom: 12px;
}

.pain-score-display {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.pain-num {
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
}

.pain-desc {
  font-size: 0.75rem;
  font-weight: 500;
}

.slider-box {
  padding: 0 10px;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #6a7c8a;
  margin-top: 6px;
}

/* Step 3 preset selectors */
.preset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.preset-card {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(255,255,255,0.02);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.preset-card:hover {
  border-color: rgba(0, 242, 254, 0.3);
}

.preset-card.active {
  border-color: var(--color-brand);
  background-color: rgba(0, 242, 254, 0.05);
  box-shadow: 0 0 8px rgba(0, 242, 254, 0.15);
}

.preset-color-block {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-color-text {
  font-size: 0.6rem;
  font-weight: bold;
  color: rgba(0,0,0,0.4);
  text-transform: uppercase;
}

.preset-card-body {
  padding: 6px 8px;
}

.preset-title {
  font-size: 0.72rem;
  font-weight: bold;
  color: white;
}

.preset-desc {
  font-size: 0.6rem;
  color: #8c9ba5;
  line-height: 1.2;
  margin-top: 2px;
}

.divider-text {
  display: flex;
  align-items: center;
  text-align: center;
  color: #6a7c8a;
  font-size: 0.65rem;
  margin: 12px 0;
}

.divider-text::before, .divider-text::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.divider-text span {
  padding: 0 8px;
}

.dual-upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.upload-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-col-label {
  font-size: 0.65rem;
  color: #8c9ba5;
  font-weight: 600;
  margin-bottom: 2px;
}

.upload-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: white;
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.72rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-brand);
}

.upload-btn.has-file {
  border-color: #00c300;
  background-color: rgba(0, 195, 0, 0.05);
  color: #00c300;
}

.file-name-tag {
  font-size: 0.6rem;
  color: var(--color-brand);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.upload-loader {
  font-size: 0.6rem;
  color: var(--color-yellow);
  text-align: center;
}

/* Image Preview */
.preview-container {
  margin-top: 10px;
}

.preview-title {
  font-size: 0.7rem;
  color: #8c9ba5;
  margin-bottom: 4px;
}

.preset-img-placeholder {
  height: 100px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #111;
  font-size: 0.75rem;
  padding: 10px;
  text-align: center;
}

.preset-desc-small {
  font-size: 0.65rem;
  color: rgba(0, 0, 0, 0.7);
  margin-top: 4px;
  line-height: 1.2;
}

.placeholder-emoji {
  font-size: 1.5rem;
  margin-bottom: 2px;
}

.dual-preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.preview-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-sub-title {
  font-size: 0.65rem;
  color: #6a7c8a;
  text-align: center;
}

.custom-img-wrapper {
  border-radius: 8px;
  overflow: hidden;
  height: 100px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-preview-box {
  height: 100px;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6a7c8a;
  font-size: 0.68rem;
  background-color: rgba(255, 255, 255, 0.01);
}

.no-img-placeholder {
  height: 80px;
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6a7c8a;
  font-size: 0.7rem;
}

/* LIFF Step Footers */
.step-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.step-footer.split {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 10px;
}

.liff-btn {
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-next {
  width: 100%;
  background-color: var(--color-brand);
  color: #111;
}

.btn-next:hover {
  background-color: var(--color-brand-hover);
  box-shadow: 0 0 12px rgba(0, 242, 254, 0.3);
}

.btn-back {
  background-color: rgba(255, 255, 255, 0.05);
  color: #8c9ba5;
  border: 1px solid rgba(255,255,255,0.08);
}

.btn-back:hover {
  background-color: rgba(255,255,255,0.1);
  color: white;
}

.btn-submit {
  background: linear-gradient(135deg, var(--color-brand), #00c300);
  color: #111;
}

.btn-submit:hover:not(:disabled) {
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.4);
  transform: translateY(-1px);
}

.btn-submit:disabled {
  background: #27303f;
  color: #586980;
  cursor: not-allowed;
}

/* Submitting Screen */
.loader-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.loader-screen .spinner {
  margin-bottom: 20px;
}

.loader-screen h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.loader-status {
  font-size: 0.75rem;
  color: var(--color-brand);
  height: 20px;
  margin-bottom: 20px;
}

.loader-bar-bg {
  width: 150px;
  height: 4px;
  background-color: rgba(255,255,255,0.08);
  border-radius: 2px;
  overflow: hidden;
}

.loader-bar-fill {
  height: 100%;
  width: 0%;
  background-color: var(--color-brand);
  border-radius: 2px;
  animation: load 4s forwards linear;
}

@keyframes load {
  to { width: 100%; }
}

.test-helper-tip {
  margin: 10px 0;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  display: flex;
  gap: 8px;
  font-size: 0.7rem;
  color: #8c9ba5;
  line-height: 1.4;
}

.test-tip-icon {
  font-size: 1rem;
}

.test-tip-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.test-links {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.test-link-btn {
  background-color: rgba(0, 242, 254, 0.08);
  border: 1px solid rgba(0, 242, 254, 0.2);
  color: var(--color-brand);
  padding: 4px 8px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.65rem;
  transition: all 0.2s;
  display: inline-block;
}

.test-link-btn:hover {
  background-color: rgba(0, 242, 254, 0.15);
  color: white;
}

.single-upload-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.single-upload-container .upload-col {
  width: 100%;
  max-width: 240px;
}

.custom-img-wrapper-full {
  border-radius: 8px;
  overflow: hidden;
  height: 120px;
  max-width: 200px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-img-wrapper-full img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
