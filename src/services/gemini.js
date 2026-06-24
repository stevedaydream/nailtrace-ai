// Gemini 2.5 Flash Vision & Chat Integration Service
// 支援直接連線 Gemini API 或在無金鑰時使用內建臨床情境模擬

// 模擬情境對照表 (無 API 金鑰時使用)
const SIMULATION_PRESETS = {
  'preset-normal': {
    orthosis_status: 'normal',
    inflammation: false,
    granuloma: false,
    redness_severity: 'none',
    status: 'green',
    patient_advice: '您的指甲與矯正器狀況非常良好！目前沒有看到任何發炎或紅腫跡象，矯正器固定穩當。請繼續保持足部清潔與乾燥，洗澡後記得吹乾指甲邊緣。避免穿著過窄或壓迫腳趾的鞋襪，下個月我們再繼續追蹤喔！',
    doctor_alert: '正常。患者恢復良好，矯正器無鬆脫跡象。'
  },
  'preset-loose': {
    orthosis_status: 'loose',
    inflammation: false,
    granuloma: false,
    redness_severity: 'none',
    status: 'yellow',
    patient_advice: '我們注意到您的矯正器有輕微位移或鬆脫跡象，不過甲肉周圍目前很健康、沒有發炎紅腫。請儘量避免踢到或碰撞腳趾，如果走路時覺得矯正器有明顯晃動或異物感，可以透過 LINE 或是撥打診所電話提前預約回診微調，不需過度擔心喔！',
    doctor_alert: '矯正器出現鬆退/位移，尚未引發周圍組織發炎，建議叮嚀患者預約回診微調。'
  },
  'preset-inflamed': {
    orthosis_status: 'normal',
    inflammation: true,
    granuloma: false,
    redness_severity: 'mild',
    status: 'yellow',
    patient_advice: '影像顯示您的腳趾甲側溝有輕微的紅腫發炎現象，可能因為指甲邊緣稍微壓迫到甲肉。請務必每天使用生理食鹽水清洗並擦乾，若有醫師開立的消炎藥膏可局部薄擦。請密切注意這幾天是否有發熱或化膿，若疼痛加劇或紅腫擴大，請提早回診評估。',
    doctor_alert: '甲溝輕度發炎紅腫，VAS 疼痛評分偏高，可能需要開立外用消炎藥膏，已列為黃燈追蹤。'
  },
  'preset-granuloma': {
    orthosis_status: 'detached',
    inflammation: true,
    granuloma: true,
    redness_severity: 'severe',
    status: 'red',
    patient_advice: '【緊急提示】分析顯示您的指甲邊緣有明顯的紅腫發炎，且伴隨肉芽組織（增生肉瓣）的形成，這可能是矯正器脫落或壓迫所致。肉芽組織容易出血及造成深部感染，請不要自行修剪或摳挖。建議您儘速預約回診，由醫師為您處理肉芽組織並重新固定矯正器，以免症狀惡化。',
    doctor_alert: '【高風險警示】偵測到肉芽組織增生與中重度甲溝炎，且矯正器脫落。患者疼痛指數偏高，強烈建議主動致電安排患者於 3 天內回診診治。'
  }
};

export const geminiService = {
  // 取得儲存在本地的 API 金鑰
  getApiKey() {
    return localStorage.getItem('nailtrace_gemini_api_key') || import.meta.env?.VITE_GEMINI_API_KEY || '';
  },

  // 儲存 API 金鑰
  saveApiKey(key) {
    if (key) {
      localStorage.setItem('nailtrace_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('nailtrace_gemini_api_key');
    }
  },

  // 多模態分析腳趾照片
  async analyzeToeImage({ imageBase64, painScore, satisfactionScore, presetId }) {
    const apiKey = this.getApiKey();

    // 如果沒有 API 金鑰，使用模擬器
    if (!apiKey) {
      console.log('No Gemini API key found. Using simulated response...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模擬網路延遲
      
      // 如果指定了預設 ID 則回傳對應分析
      if (presetId && SIMULATION_PRESETS[presetId]) {
        return SIMULATION_PRESETS[presetId];
      }

      // 如果是自訂圖片，根據疼痛分數推測一個合理的診斷結果
      if (painScore >= 7) {
        return {
          ...SIMULATION_PRESETS['preset-granuloma'],
          patient_advice: '（自訂圖片模擬分析）' + SIMULATION_PRESETS['preset-granuloma'].patient_advice
        };
      } else if (painScore >= 4) {
        return {
          ...SIMULATION_PRESETS['preset-inflamed'],
          patient_advice: '（自訂圖片模擬分析）' + SIMULATION_PRESETS['preset-inflamed'].patient_advice
        };
      } else {
        return {
          ...SIMULATION_PRESETS['preset-normal'],
          patient_advice: '（自訂圖片模擬分析）' + SIMULATION_PRESETS['preset-normal'].patient_advice
        };
      }
    }

    // 實際對接 Gemini 2.5 Flash API
    try {
      const prompt = `你是一位專業的皮膚科與甲溝炎矯正醫療AI助手。請分析上傳的腳趾照片，並結合病患提供的疼痛分數 (VAS ${painScore}/10) 與滿意度 (${satisfactionScore}/10)。
 
請嚴格審查以下臨床指標：
1. 矯正器狀態 (orthosis_status)：是否在正確位置，有無鬆脫 (loose) 或完全脫落 (detached)。
2. 發炎狀態 (inflammation)：周圍甲溝皮褶有無紅腫、熱痛、化膿。
3. 肉芽組織 (granuloma)：有無鮮紅色、易出血的過度增生肉芽。
4. 紅腫嚴重度 (redness_severity)：無 (none), 輕微 (mild) 或嚴重 (severe)。
5. 燈號狀態 (status)：
   - 綠色 (green)：無發炎且矯正器正常。
   - 黃色 (yellow)：輕微紅腫/發炎，或矯正器有鬆脫跡象但無發炎。
   - 紅色 (red)：嚴重發炎、有肉芽組織，或矯正器脫落且疼痛指數偏高。
 
請以 JSON 格式回覆，不可包含任何 Markdown 格式標籤（不要用 \`\`\`json 等標記），直接以大括號 {} 包裝 JSON 字串。
JSON 格式規範如下：
{
  "orthosis_status": "normal" | "loose" | "detached",
  "inflammation": true | false,
  "granuloma": true | false,
  "redness_severity": "none" | "mild" | "severe",
  "status": "green" | "yellow" | "red",
  "patient_advice": "請給予病患有溫度、具關懷感且專業的中文衛教指引（繁體中文），說明目前的指甲狀況、照片分析結果、日常清潔與照護重點、以及是否需要提前預約回診。",
  "doctor_alert": "提供給診所醫護人員的重點警示，指出照片分析所得的風險（例如：側邊甲肉受壓、肉芽增生、高疼痛、矯正器位移等），若無異常則填寫「無異常」。"
}`;

      const parts = [{ text: prompt }];

      if (imageBase64.includes('|')) {
        const [frontImg, sideImg] = imageBase64.split('|');
        if (frontImg && frontImg !== 'PRESET_IMAGE_BASE64_PLACEHOLDER') {
          const cleanFront = frontImg.replace(/^data:image\/\w+;base64,/, "");
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanFront
            }
          });
        }
        if (sideImg && sideImg !== 'PRESET_IMAGE_BASE64_PLACEHOLDER') {
          const cleanSide = sideImg.replace(/^data:image\/\w+;base64,/, "");
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanSide
            }
          });
        }
      } else {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API 請求失敗 (${response.status}): ${errText}`);
      }

      const result = await response.json();
      const rawText = result.candidates[0].content.parts[0].text;
      
      // 解析 JSON
      const parsedData = JSON.parse(rawText.trim());
      return parsedData;

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
};
