<script setup>
import { ref, onMounted, nextTick } from 'vue';

const props = defineProps({
  currentProfile: {
    type: Object,
    required: true
  },
  activeRecords: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['open-liff']);

const chatMessages = ref([
  {
    id: 1,
    sender: 'bot',
    text: '您好！我是您的 **NailTrace AI 衛教小幫手** 🟢\n為了協助您的主治醫師追蹤您的指甲矯正進度，請點選下方選單的「填寫追蹤表單」上傳本月指甲照片並填寫疼痛評分，AI 將即時提供照護建議！',
    time: '上午 10:00'
  }
]);

const userInput = ref('');
const chatScrollContainer = ref(null);

const scrollToBottom = async () => {
  await nextTick();
  if (chatScrollContainer.value) {
    chatScrollContainer.value.scrollTop = chatScrollContainer.value.scrollHeight;
  }
};

const sendBotMessage = (text, delay = 800) => {
  setTimeout(() => {
    chatMessages.value.push({
      id: Date.now(),
      sender: 'bot',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    scrollToBottom();
  }, delay);
};

const handleSendUserText = (customText = null) => {
  const textToSend = customText || userInput.value.trim();
  if (!textToSend) return;

  chatMessages.value.push({
    id: Date.now(),
    sender: 'user',
    text: textToSend,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  if (!customText) {
    userInput.value = '';
  }
  
  scrollToBottom();
  processBotReply(textToSend);
};

// 處理衛教與對話回覆
const processBotReply = (text) => {
  const query = text.toLowerCase();
  
  if (query.includes('鬆脫') || query.includes('脫落') || query.includes('掉')) {
    sendBotMessage(`【🏥 矯正器鬆脫衛教指引】\n\n別慌張！請依循以下步驟處理：\n1️⃣ **確認是否有傷口/流血**：如有流血，請以乾淨紗布加壓止血，並擦消炎藥膏。\n2️⃣ **妥善保存矯正器**：如果矯正器已完全脫落，請將其用乾淨面紙包好，於回診時帶回，若能重新使用可省下材料費。\n3️⃣ **避免摳挖**：請勿嘗試自行黏回或用剪刀修剪甲肉。\n4️⃣ **預約回診**：請點選選單「聯絡診所」或撥打電話提前預約回診，由醫師為您重新固定。`, 500);
  } 
  else if (query.includes('預約') || query.includes('回診') || query.includes('掛號')) {
    sendBotMessage(`【📅 預約回診服務】\n\n您的主治醫師為 **${props.currentProfile.doctor_name}**。\n\n建議您點擊以下連結進行線上預約，或撥打專線由專人為您掛號：\n📞 預約專線：(02) 2345-6789\n🌐 [點我進入診所線上預約系統](javascript:void(0))\n\n*提示：指甲矯正一般建議每 4~6 週回診調整一次，若有異常紅腫，請儘早回診！*`, 500);
  } 
  else if (query.includes('痛') || query.includes('不舒服') || query.includes('發炎')) {
    sendBotMessage(`【🩹 疼痛與發炎照護】\n\n矯正初期 3-5 天有輕微張力或異物感屬於正常現象。但若有持續性抽痛、局部紅腫、摸起來熱熱的甚至有膿液：\n1️⃣ 請勿自行挑甲溝或修剪皮褶。\n2️⃣ 每天早晚以生理食鹽水輕柔沖洗乾淨，並吹乾保持乾燥。\n3️⃣ 請盡快填寫「追蹤表單」上傳照片讓 AI 進行評估，或直接預約回診讓醫師檢視！`, 600);
  } 
  else if (query.includes('洗澡') || query.includes('碰水') || query.includes('清潔')) {
    sendBotMessage(`【🚿 日常清潔要點】\n\n1️⃣ **可以正常洗澡碰水**：矯正器有防鏽塗層，但洗完澡後務必將腳趾「吹乾」，保持乾燥是防菌關鍵。\n2️⃣ **洗腳方式**：洗澡時使用溫水輕輕沖洗腳趾即可，請勿拿刷子大力猛刷矯正器周圍。\n3️⃣ **避免泡腳**：矯正期間請暫時避免長時間泡溫泉、游泳或泡腳，以免角質過度軟化導致矯正器脫落。`, 500);
  }
  else {
    sendBotMessage(`收到您的訊息！我是 AI 衛教助手。\n\n您可以試著詢問我以下常見問題：\n👉 「矯正器鬆脫怎麼辦？」\n👉 「如何預約回診？」\n👉 「指甲痛/紅腫怎麼辦？」\n👉 「洗澡需要注意什麼？」`, 700);
  }
};

// 模擬外部觸發：當 LIFF 提交完畢後，由 LINE Bot 發送 Flex Message 通知
const addLiffSubmissionMessage = (record) => {
  const statusLabels = { green: '🟢 狀況良好 (綠燈)', yellow: '🟡 輕度預警 (黃燈)', red: '🔴 嚴重警告 (紅燈)' };
  
  chatMessages.value.push({
    id: Date.now(),
    sender: 'bot',
    isFlex: true,
    data: {
      title: '📋 本月指甲追蹤報告已送出',
      month: `第 ${record.tracking_month} 個月追蹤`,
      pain: `${record.pain_score} / 10 分 (VAS 疼痛)`,
      satisfaction: `${record.satisfaction_score} / 10 分`,
      status: statusLabels[record.status] || record.status,
      aiAdvice: record.gemini_analysis.patient_advice
    },
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  scrollToBottom();
};

defineExpose({
  addLiffSubmissionMessage
});

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="line-container">
    <!-- LINE Header -->
    <div class="line-header">
      <div class="line-header-left">
        <span class="back-icon">❮</span>
        <div class="bot-avatar">N</div>
        <div class="bot-info">
          <div class="bot-name">NailTrace AI 衛教小幫手</div>
          <span class="bot-sub">● 官方帳號</span>
        </div>
      </div>
      <div class="line-header-right">
        <span class="header-icon">🔍</span>
        <span class="header-icon">☰</span>
      </div>
    </div>

    <!-- Chat Messages Scroll Area -->
    <div class="line-messages" ref="chatScrollContainer">
      <div 
        v-for="msg in chatMessages" 
        :key="msg.id" 
        :class="['chat-bubble-wrapper', msg.sender === 'user' ? 'user-wrapper' : 'bot-wrapper']"
      >
        <!-- Bot Avatar for bot messages -->
        <div v-if="msg.sender === 'bot'" class="chat-avatar">N</div>
        
        <div class="chat-bubble-content">
          <!-- Standard Text Bubble -->
          <div v-if="!msg.isFlex" class="chat-bubble">
            <p style="white-space: pre-line;">{{ msg.text }}</p>
          </div>

          <!-- LINE Flex Card Message -->
          <div v-else class="flex-card">
            <div class="flex-card-header">{{ msg.data.title }}</div>
            <div class="flex-card-body">
              <div class="flex-row">
                <span class="row-label">追蹤期程:</span>
                <span class="row-val font-highlight">{{ msg.data.month }}</span>
              </div>
              <div class="flex-row">
                <span class="row-label">疼痛指數:</span>
                <span class="row-val font-highlight">{{ msg.data.pain }}</span>
              </div>
              <div class="flex-row">
                <span class="row-label">滿意度:</span>
                <span class="row-val">{{ msg.data.satisfaction }}</span>
              </div>
              <div class="flex-row">
                <span class="row-label">評估燈號:</span>
                <span class="row-val font-highlight">{{ msg.data.status }}</span>
              </div>
              <div class="flex-divider"></div>
              <div class="flex-advice-title">💡 AI 衛教建議</div>
              <div class="flex-advice-text">{{ msg.data.aiAdvice }}</div>
            </div>
            <div class="flex-card-footer">
              <button class="flex-btn" @click="handleSendUserText('如何預約回診？')">📆 預約回診</button>
            </div>
          </div>

          <span class="chat-time">{{ msg.time }}</span>
        </div>
      </div>
    </div>

    <!-- LINE Rich Menu (Simulation) -->
    <div class="line-rich-menu">
      <div class="rich-menu-item item-liff" @click="emit('open-liff')">
        <span class="menu-icon">📋</span>
        <span class="menu-label">填寫追蹤表單</span>
      </div>
      <div class="rich-menu-item" @click="handleSendUserText('矯正器鬆脫怎麼辦？')">
        <span class="menu-icon">🩹</span>
        <span class="menu-label">矯正器鬆脫指引</span>
      </div>
      <div class="rich-menu-item" @click="handleSendUserText('如何預約回診？')">
        <span class="menu-icon">📅</span>
        <span class="menu-label">預約回診掛號</span>
      </div>
    </div>

    <!-- Chat Text Input Bar -->
    <div class="line-input-bar">
      <span class="input-plus">+</span>
      <input 
        type="text" 
        v-model="userInput" 
        placeholder="輸入訊息..." 
        @keyup.enter="handleSendUserText()"
      />
      <button class="send-btn" @click="handleSendUserText()">傳送</button>
    </div>
  </div>
</template>

<style scoped>
.line-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #7b9cc2; /* LINE Classic blue bg */
}

/* Header style */
.line-header {
  height: 48px;
  background-color: #273244;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.line-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-icon {
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
}

.bot-avatar {
  width: 28px;
  height: 28px;
  background-color: var(--color-brand);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: bold;
  font-size: 0.9rem;
  color: #111;
}

.bot-info {
  display: flex;
  flex-direction: column;
}

.bot-name {
  font-size: 0.8rem;
  font-weight: 600;
}

.bot-sub {
  font-size: 0.6rem;
  color: #9ab4d6;
}

.line-header-right {
  display: flex;
  gap: 12px;
}

.header-icon {
  font-size: 14px;
  cursor: pointer;
}

/* Message board */
.line-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-bubble-wrapper {
  display: flex;
  gap: 8px;
  max-width: 85%;
}

.bot-wrapper {
  align-self: flex-start;
}

.user-wrapper {
  align-self: flex-end;
  flex-direction: row-reverse;
  max-width: 80%;
}

.chat-avatar {
  width: 32px;
  height: 32px;
  background-color: var(--color-brand);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
  font-weight: bold;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.chat-bubble-content {
  display: flex;
  flex-direction: column;
  position: relative;
}

.bot-wrapper .chat-bubble-content {
  align-items: flex-start;
}

.user-wrapper .chat-bubble-content {
  align-items: flex-end;
}

.chat-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #333;
}

.bot-wrapper .chat-bubble {
  background-color: white;
  border-top-left-radius: 2px;
}

.user-wrapper .chat-bubble {
  background-color: #8ce682; /* LINE Green user bubble */
  border-top-right-radius: 2px;
}

.chat-time {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

/* LINE Flex Card */
.flex-card {
  width: 250px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  border-top: 4px solid var(--color-brand);
}

.flex-card-header {
  background-color: #f7f9fa;
  padding: 10px 12px;
  font-size: 0.85rem;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #eee;
}

.flex-card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flex-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.row-label {
  color: #666;
}

.row-val {
  color: #333;
  font-weight: 500;
}

.font-highlight {
  font-weight: bold;
}

.flex-divider {
  height: 1px;
  background-color: #eee;
  margin: 4px 0;
}

.flex-advice-title {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--color-brand-hover);
}

.flex-advice-text {
  font-size: 0.7rem;
  color: #555;
  line-height: 1.4;
}

.flex-card-footer {
  border-top: 1px solid #eee;
}

.flex-btn {
  width: 100%;
  background: none;
  border: none;
  padding: 10px;
  color: #007aff;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.flex-btn:hover {
  background-color: #f5f5f5;
}

/* Rich Menu style */
.line-rich-menu {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  height: 90px;
  background-color: #2c3547;
  border-top: 1px solid #1a2233;
}

.rich-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-right: 1px solid #202633;
  padding: 5px;
}

.rich-menu-item:hover {
  background-color: #3b475e;
}

.item-liff {
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(0, 100, 255, 0.05));
  position: relative;
}

.item-liff::after {
  content: 'LIFF';
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: var(--color-brand);
  color: #000;
  font-size: 0.5rem;
  padding: 1px 3px;
  border-radius: 3px;
  font-weight: bold;
}

.menu-icon {
  font-size: 20px;
}

.menu-label {
  font-size: 0.7rem;
  text-align: center;
  font-weight: 500;
}

/* Bottom Text Input Bar */
.line-input-bar {
  height: 48px;
  background-color: #f7f9fa;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  border-top: 1px solid #e1e3e6;
}

.input-plus {
  font-size: 20px;
  color: #7b8e9b;
  cursor: pointer;
}

.line-input-bar input {
  flex: 1;
  height: 32px;
  border-radius: 16px;
  border: 1px solid #ccc;
  padding: 0 12px;
  font-size: 0.85rem;
  outline: none;
}

.send-btn {
  background-color: var(--color-line);
  color: white;
  border: none;
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-btn:hover {
  background-color: var(--color-line-dark);
}
</style>
