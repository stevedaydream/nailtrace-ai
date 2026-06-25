<script setup>
const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

// Utility classes mapping
const getTriageBadgeClass = (status) => {
  if (status === 'green') return 'badge-green';
  if (status === 'yellow') return 'badge-yellow';
  return 'badge-red';
};

const getOrthosisClass = (status) => {
  if (status === 'normal') return 'ortho-normal';
  if (status === 'loose') return 'ortho-loose';
  return 'ortho-detached';
};

const getOrthosisLabel = (status) => {
  if (status === 'normal') return '正常固定';
  if (status === 'loose') return '輕微位移/鬆退';
  return '完全脫落';
};

const getPresetColor = (url) => {
  if (url.startsWith('preset-normal')) return '#10b981';
  if (url.startsWith('preset-loose')) return '#f59e0b';
  if (url.startsWith('preset-inflamed')) return '#f97316';
  if (url.startsWith('preset-granuloma')) return '#ef4444';
  return '#6366f1';
};

const isCustomUpload = (url) => {
  if (!url) return false;
  return !url.startsWith('preset-');
};

const splitImages = (url) => {
  if (!url) return [];
  if (url.includes('|')) {
    return url.split('|');
  }
  return [url];
};
</script>

<template>
  <div :class="['timeline-item', 'border-' + props.record.status]">
    <!-- Timeline Marker -->
    <div class="timeline-marker">
      <span :class="['status-dot', props.record.status]"></span>
    </div>

    <!-- Timeline Body -->
    <div class="timeline-body">
      
      <!-- Card Header -->
      <div class="timeline-card-header">
        <h3>第 {{ props.record.tracking_month }} 個月追蹤紀錄</h3>
        <span class="record-date">{{ new Date(props.record.created_at).toLocaleString() }}</span>
      </div>

      <!-- Parameters Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-lbl">疼痛指數 (VAS)</span>
          <span class="metric-val" :style="{ color: props.record.pain_score <= 3 ? 'var(--color-green)' : props.record.pain_score <= 6 ? 'var(--color-yellow)' : 'var(--color-red)' }">
            {{ props.record.pain_score }} / 10
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-lbl">病患滿意度</span>
          <span class="metric-val" style="color: var(--color-brand);">
            {{ props.record.satisfaction_score }} / 10
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-lbl">當次評分燈號</span>
          <span :class="['badge', getTriageBadgeClass(props.record.status)]" style="margin-top: 4px;">
            {{ props.record.status.toUpperCase() }}
          </span>
        </div>
      </div>

      <!-- Diagnostics Section split -->
      <div class="diagnostics-split">
        <!-- Photo block -->
        <div class="diagnostics-photo-box">
          <span class="diagnostic-title">📸 影像紀錄</span>
          <div class="images-display-container">
            <!-- Custom Uploaded Photo(s) -->
            <template v-if="isCustomUpload(props.record.image_url)">
              <!-- Check if it contains multiple images (split by pipe) -->
              <div v-if="splitImages(props.record.image_url).length > 1" class="dual-images-container">
                <div class="image-wrapper-with-label">
                  <span class="image-label-sub">正面照 (Front)</span>
                  <div class="img-frame custom-img">
                    <img :src="splitImages(props.record.image_url)[0]" alt="Front view" />
                  </div>
                </div>
                <div class="image-wrapper-with-label">
                  <span class="image-label-sub">側視照 (Side)</span>
                  <div class="img-frame custom-img">
                    <img :src="splitImages(props.record.image_url)[1]" alt="Side view" />
                  </div>
                </div>
              </div>
              
              <!-- Single image upload -->
              <div v-else class="single-image-container">
                <div class="img-frame custom-img-full">
                  <img :src="props.record.image_url" alt="Toe view" />
                </div>
              </div>
            </template>

            <!-- Preset Simulation color block -->
            <template v-else>
              <div class="img-frame preset-color-frame" :style="{ backgroundColor: getPresetColor(props.record.image_url) }">
                <span class="preset-label-short">{{ props.record.image_url.replace('preset-', '').toUpperCase() }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- AI details -->
        <div class="diagnostics-ai-details">
          <span class="diagnostic-title">🤖 Gemini 2.5 Flash 影像診斷結果</span>
          
          <div class="ai-tags-row">
            <div class="ai-tag">
              矯正器：
              <span :class="getOrthosisClass(props.record.gemini_analysis.orthosis_status)">
                {{ getOrthosisLabel(props.record.gemini_analysis.orthosis_status) }}
              </span>
            </div>
            <div class="ai-tag">
              甲溝發炎：
              <span :class="props.record.gemini_analysis.inflammation ? 'alert-danger' : 'alert-success'">
                {{ props.record.gemini_analysis.inflammation ? '有發炎紅腫' : '無發炎' }}
              </span>
            </div>
            <div class="ai-tag">
              肉芽組織：
              <span :class="props.record.gemini_analysis.granuloma ? 'alert-danger' : 'alert-success'">
                {{ props.record.gemini_analysis.granuloma ? '有肉芽組織' : '無肉芽' }}
              </span>
            </div>
            <div class="ai-tag">
              紅腫程度：
              <span :class="props.record.gemini_analysis.redness_severity === 'severe' ? 'alert-danger' : props.record.gemini_analysis.redness_severity === 'mild' ? 'alert-warning' : 'alert-success'">
                {{ props.record.gemini_analysis.redness_severity === 'severe' ? '嚴重' : props.record.gemini_analysis.redness_severity === 'mild' ? '輕度' : '無紅腫' }}
              </span>
            </div>
          </div>

          <!-- Clinical advices -->
          <div class="advice-block-doctor">
            <strong>🩺 醫護警示訊息 (Doctor Alert):</strong>
            <p>{{ props.record.gemini_analysis.doctor_alert }}</p>
          </div>

          <div class="advice-block-patient">
            <strong>💡 給病患的衛教指引 (Patient Advice):</strong>
            <p>{{ props.record.gemini_analysis.patient_advice }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.timeline-item {
  position: relative;
  padding-left: 2.5rem;
  padding-bottom: 2.5rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

/* Vertical line in timeline */
.timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 20px;
  bottom: 0;
  width: 2px;
  background-color: var(--border-color);
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 4px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.green {
  background-color: var(--color-green);
  box-shadow: 0 0 8px var(--color-green-glow);
}

.status-dot.yellow {
  background-color: var(--color-yellow);
  box-shadow: 0 0 8px var(--color-yellow-glow);
}

.status-dot.red {
  background-color: var(--color-red);
  box-shadow: 0 0 8px var(--color-red-glow);
}

.timeline-body {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  transition: var(--transition-smooth);
}

.timeline-item:hover .timeline-body {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.timeline-item.border-green .timeline-body { border-left: 4px solid var(--color-green); }
.timeline-item.border-yellow .timeline-body { border-left: 4px solid var(--color-yellow); }
.timeline-item.border-red .timeline-body { border-left: 4px solid var(--color-red); }

.timeline-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 0.75rem;
}

.timeline-card-header h3 {
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
}

.record-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Parameters grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
}

.metric-lbl {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.metric-val {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.badge {
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
  text-align: center;
}

.badge-green { background-color: rgba(16, 185, 129, 0.15); color: var(--color-green); border: 1px solid rgba(16, 185, 129, 0.3); }
.badge-yellow { background-color: rgba(245, 158, 11, 0.15); color: var(--color-yellow); border: 1px solid rgba(245, 158, 11, 0.3); }
.badge-red { background-color: rgba(239, 68, 68, 0.15); color: var(--color-red); border: 1px solid rgba(239, 68, 68, 0.3); }

/* Diagnostics split layout */
.diagnostics-split {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}

@media (max-width: 1200px) {
  .diagnostics-split {
    grid-template-columns: 1fr;
  }
}

.diagnostic-title {
  display: block;
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-secondary);
  margin-bottom: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.images-display-container {
  height: 100%;
}

.dual-images-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.image-wrapper-with-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.image-label-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: bold;
}

.img-frame {
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-img img, .custom-img-full img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.custom-img-full {
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
  width: 100%;
}

.preset-color-frame {
  height: 120px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: var(--radius-sm);
}

.preset-label-short {
  letter-spacing: 0.05em;
}

.diagnostics-ai-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-tag {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.ai-tag span {
  font-weight: bold;
}

.ortho-normal { color: var(--color-green); }
.ortho-loose { color: var(--color-yellow); }
.ortho-detached { color: var(--color-red); }

.alert-success { color: var(--color-green); }
.alert-warning { color: var(--color-yellow); }
.alert-danger { color: var(--color-red); }

.advice-block-doctor {
  background-color: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.8rem;
}

.advice-block-doctor strong {
  color: hsl(355, 75%, 65%);
}

.advice-block-doctor p {
  color: hsl(355, 20%, 80%);
  margin-top: 4px;
  line-height: 1.4;
}

.advice-block-patient {
  background-color: rgba(0, 242, 254, 0.02);
  border: 1px solid rgba(0, 242, 254, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.8rem;
}

.advice-block-patient strong {
  color: var(--color-brand);
}

.advice-block-patient p {
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.4;
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr !important;
    gap: 0.5rem !important;
  }
}
</style>
