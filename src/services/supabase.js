// Supabase Database Service (with LocalStorage Fallback for MVP demo)
// 支援直接連線 Supabase 或使用 Mock LocalStorage 進行演示
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('🟢 Supabase Client initialized successfully!');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase Client:', err);
  }
}

const MOCK_PROFILES_KEY = 'nailtrace_mock_profiles';
const MOCK_RECORDS_KEY = 'nailtrace_mock_records';

const DEFAULT_PROFILES = [
  {
    id: 'p1-uuid-1111-2222',
    line_user_id: 'U123456789a',
    patient_id: 'P2026001',
    name: '王小明',
    doctor_name: '陳志強 醫師',
    status: 'green',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'p2-uuid-3333-4444',
    line_user_id: 'U987654321b',
    patient_id: 'P2026002',
    name: '李美玲',
    doctor_name: '黃淑芬 醫師',
    status: 'yellow',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'p3-uuid-5555-6666',
    line_user_id: 'U112233445c',
    patient_id: 'P2026003',
    name: '張大同',
    doctor_name: '陳志強 醫師',
    status: 'red',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_RECORDS = [
  {
    id: 'r1-uuid-0001',
    patient_id: 'p1-uuid-1111-2222',
    tracking_month: 1,
    pain_score: 2,
    satisfaction_score: 8,
    image_url: 'preset-normal',
    gemini_analysis: {
      orthosis_status: 'normal',
      inflammation: false,
      granuloma: false,
      redness_severity: 'none',
      status: 'green',
      patient_advice: '您的指甲矯正器固定良好，周圍甲肉狀況正常，未見紅腫或發炎。請維持日常的清潔，並避免穿著過緊的鞋子壓迫指甲。',
      doctor_alert: '無異常。'
    },
    status: 'green',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'r2-uuid-0002',
    patient_id: 'p2-uuid-3333-4444',
    tracking_month: 1,
    pain_score: 4,
    satisfaction_score: 6,
    image_url: 'preset-loose',
    gemini_analysis: {
      orthosis_status: 'loose',
      inflammation: false,
      granuloma: false,
      redness_severity: 'none',
      status: 'yellow',
      patient_advice: '辨識到矯正器可能有輕微位移或鬆脫跡象，目前周圍甲肉無明顯發炎。請注意避免碰撞，若有明顯晃動可預約提早回診微調。',
      doctor_alert: '矯正器有鬆脫傾向，目前無感染，建議回診調整。'
    },
    status: 'yellow',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'r3-uuid-0003',
    patient_id: 'p3-uuid-5555-6666',
    tracking_month: 1,
    pain_score: 7,
    satisfaction_score: 4,
    image_url: 'preset-inflamed',
    gemini_analysis: {
      orthosis_status: 'normal',
      inflammation: true,
      granuloma: true,
      redness_severity: 'severe',
      status: 'red',
      patient_advice: '偵測到指甲周圍有明顯紅腫發炎及肉芽組織增生現象，疼痛感偏高。建議儘速預約回診，由醫師處理肉芽及評估是否需要用藥或調整矯正器。',
      doctor_alert: '患者有肉芽組織且嚴重發炎，疼痛指數 7/10，需儘速安排回診。'
    },
    status: 'red',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// 初始化模擬資料庫
function initMockDb() {
  if (!localStorage.getItem(MOCK_PROFILES_KEY)) {
    localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(DEFAULT_PROFILES));
  }
  if (!localStorage.getItem(MOCK_RECORDS_KEY)) {
    localStorage.setItem(MOCK_RECORDS_KEY, JSON.stringify(DEFAULT_RECORDS));
  }
}

// 呼叫初始化
initMockDb();

export const supabaseService = {
  // 檢查是否已設定真實的 Supabase 環境變數
  isRealSupabaseConfigured() {
    return supabase !== null;
  },

  // 將 base64 轉換為 Blob
  base64ToBlob(base64Data, contentType = 'image/jpeg') {
    try {
      const parts = base64Data.split(';base64,');
      const mime = parts[0].split(':')[1] || contentType;
      const byteCharacters = atob(parts[1]);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      return new Blob(byteArrays, { type: mime });
    } catch (e) {
      console.error('base64ToBlob error:', e);
      throw e;
    }
  },

  // 上傳單張圖片至 Supabase Storage
  async uploadImage(patientId, base64Data, filename) {
    if (!this.isRealSupabaseConfigured()) {
      console.log('⚠️ 未設定真實 Supabase 連線，使用 Base64 預覽字串作為 fallback');
      return base64Data;
    }

    try {
      const blob = this.base64ToBlob(base64Data, 'image/jpeg');
      const fileExt = filename ? filename.split('.').pop() : 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 7);
      // 以 patientId/timestamp_randomId.ext 作為存檔路徑
      const filePath = `${patientId}/${timestamp}_${randomId}.${fileExt}`;

      console.log(`📤 正在上傳圖片至 nail-photos 儲存庫，路徑: ${filePath}`);
      const { data, error } = await supabase.storage
        .from('nail-photos')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Supabase storage upload error details:', error);
        throw error;
      }

      // 取得公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('nail-photos')
        .getPublicUrl(filePath);

      console.log('🟢 圖片上傳成功，公開 URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Supabase 圖片上傳失敗:', error);
      throw error;
    }
  },


  // 取得所有患者 profiles
  async getProfiles() {
    if (this.isRealSupabaseConfigured()) {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getProfiles error:', error);
        throw error;
      }
      
      // 若資料庫完全空白，自動為其寫入 3 位預設病患及歷史病歷以利立刻演示
      if (data && data.length === 0) {
        console.log('Real Supabase database is empty. Auto-seeding default profiles...');
        const { data: seededProfiles, error: seedProfileError } = await supabase
          .from('profiles')
          .insert(DEFAULT_PROFILES.map(p => ({
            line_user_id: p.line_user_id,
            patient_id: p.patient_id,
            name: p.name,
            doctor_name: p.doctor_name,
            status: p.status
          })))
          .select();
          
        if (seedProfileError) {
          console.error('Failed to seed default profiles:', seedProfileError);
        } else if (seededProfiles && seededProfiles.length > 0) {
          // 自動對應寫入歷史紀錄
          const p1 = seededProfiles.find(p => p.name === '王小明');
          const p2 = seededProfiles.find(p => p.name === '李美玲');
          const p3 = seededProfiles.find(p => p.name === '張大同');
          
          const defaultRecs = [];
          if (p1) {
            defaultRecs.push({
              patient_id: p1.id,
              tracking_month: 1,
              pain_score: 2,
              satisfaction_score: 8,
              image_url: 'preset-normal',
              gemini_analysis: DEFAULT_RECORDS[0].gemini_analysis,
              status: 'green'
            });
          }
          if (p2) {
            defaultRecs.push({
              patient_id: p2.id,
              tracking_month: 1,
              pain_score: 4,
              satisfaction_score: 6,
              image_url: 'preset-loose',
              gemini_analysis: DEFAULT_RECORDS[1].gemini_analysis,
              status: 'yellow'
            });
          }
          if (p3) {
            defaultRecs.push({
              patient_id: p3.id,
              tracking_month: 1,
              pain_score: 7,
              satisfaction_score: 4,
              image_url: 'preset-inflamed',
              gemini_analysis: DEFAULT_RECORDS[2].gemini_analysis,
              status: 'red'
            });
          }
          
          if (defaultRecs.length > 0) {
            const { error: seedRecordsError } = await supabase
              .from('tracking_records')
              .insert(defaultRecs);
            if (seedRecordsError) {
              console.error('Failed to seed default tracking records:', seedRecordsError);
            }
          }
          
          // 重新抓取寫入後的 profiles
          const { data: refreshedProfiles } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          return refreshedProfiles || seededProfiles;
        }
      }
      return data;
    }
    
    // Fallback Mock
    return JSON.parse(localStorage.getItem(MOCK_PROFILES_KEY));
  },

  // 藉由 LINE UID 或 病歷號 尋找 profile
  async findProfile({ lineUserId, patientId }) {
    if (this.isRealSupabaseConfigured()) {
      let query = supabase.from('profiles').select('*');
      if (lineUserId) query = query.eq('line_user_id', lineUserId);
      if (patientId) query = query.eq('patient_id', patientId);
      
      const { data, error } = await query.maybeSingle();
      if (error) {
        console.error('Supabase findProfile error:', error);
        throw error;
      }
      return data;
    }

    const profiles = JSON.parse(localStorage.getItem(MOCK_PROFILES_KEY)) || [];
    if (lineUserId) {
      return profiles.find(p => p.line_user_id === lineUserId) || null;
    }
    if (patientId) {
      return profiles.find(p => p.patient_id === patientId) || null;
    }
    return null;
  },

  // 註冊或綁定新的患者 profile
  async createProfile({ lineUserId, patientId, name, doctorName }) {
    if (this.isRealSupabaseConfigured()) {
      // 檢查是否已存在
      const { data: existing, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .or(`patient_id.eq.${patientId},line_user_id.eq.${lineUserId}`)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        const updates = {};
        if (lineUserId) updates.line_user_id = lineUserId;
        if (name) updates.name = name;
        if (doctorName) updates.doctor_name = doctorName;
        
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (updateError) {
          console.error('Supabase update profile error:', updateError);
          throw updateError;
        }
        return updated;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({
          line_user_id: lineUserId || `mock-line-${Math.random().toString(36).substr(2, 5)}`,
          patient_id: patientId,
          name,
          doctor_name: doctorName || '未指定主治醫師',
          status: 'green'
        })
        .select()
        .single();
      if (insertError) {
        console.error('Supabase insert profile error:', insertError);
        throw insertError;
      }
      return inserted;
    }

    // Fallback Mock
    const profiles = JSON.parse(localStorage.getItem(MOCK_PROFILES_KEY)) || [];
    const existing = profiles.find(p => p.patient_id === patientId || p.line_user_id === lineUserId);
    if (existing) {
      if (lineUserId) existing.line_user_id = lineUserId;
      if (name) existing.name = name;
      if (doctorName) existing.doctor_name = doctorName;
      localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(profiles));
      return existing;
    }

    const newProfile = {
      id: `p-uuid-${Math.random().toString(36).substr(2, 9)}`,
      line_user_id: lineUserId || `mock-line-${Math.random().toString(36).substr(2, 5)}`,
      patient_id: patientId,
      name,
      doctor_name: doctorName || '未指定主治醫師',
      status: 'green',
      created_at: new Date().toISOString()
    };

    profiles.push(newProfile);
    localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(profiles));
    return newProfile;
  },

  // 更新患者的最新紅綠燈狀態
  async updateProfileStatus(id, status) {
    if (this.isRealSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase updateProfileStatus error:', error);
        throw error;
      }
      return data;
    }

    const profiles = JSON.parse(localStorage.getItem(MOCK_PROFILES_KEY)) || [];
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      profile.status = status;
      localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(profiles));
      return profile;
    }
    return null;
  },

  // 取得特定患者的歷史追蹤紀錄
  async getTrackingRecords(patientId) {
    if (this.isRealSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('tracking_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getTrackingRecords error:', error);
        throw error;
      }
      return data;
    }

    // Fallback Mock
    const records = JSON.parse(localStorage.getItem(MOCK_RECORDS_KEY)) || [];
    return records
      .filter(r => r.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // 新增一筆追蹤紀錄
  async addTrackingRecord({ patientId, painScore, satisfactionScore, imageUrl, geminiAnalysis, status }) {
    const finalStatus = status || geminiAnalysis.status || 'green';

    if (this.isRealSupabaseConfigured()) {
      // 取得現有紀錄數以計算 tracking_month
      const { count, error: countError } = await supabase
        .from('tracking_records')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);
      if (countError) throw countError;

      const trackingMonth = (count || 0) + 1;

      const { data: newRecord, error: insertError } = await supabase
        .from('tracking_records')
        .insert({
          patient_id: patientId,
          tracking_month: trackingMonth,
          pain_score: parseInt(painScore, 10),
          satisfaction_score: parseInt(satisfactionScore, 10),
          image_url: imageUrl,
          gemini_analysis: geminiAnalysis,
          status: finalStatus
        })
        .select()
        .single();
      if (insertError) {
        console.error('Supabase addTrackingRecord error:', insertError);
        throw insertError;
      }

      // 同步更新 profile 的 status
      await this.updateProfileStatus(patientId, finalStatus);
      return newRecord;
    }

    // Fallback Mock
    const records = JSON.parse(localStorage.getItem(MOCK_RECORDS_KEY)) || [];
    const patientRecords = records.filter(r => r.patient_id === patientId);
    const trackingMonth = patientRecords.length + 1;

    const newRecord = {
      id: `r-uuid-${Math.random().toString(36).substr(2, 9)}`,
      patient_id: patientId,
      tracking_month: trackingMonth,
      pain_score: parseInt(painScore, 10),
      satisfaction_score: parseInt(satisfactionScore, 10),
      image_url: imageUrl,
      gemini_analysis: geminiAnalysis,
      status: finalStatus,
      created_at: new Date().toISOString()
    };

    records.push(newRecord);
    localStorage.setItem(MOCK_RECORDS_KEY, JSON.stringify(records));

    // 同步更新 profile 的 status
    await this.updateProfileStatus(patientId, finalStatus);
    return newRecord;
  },

  // 重設資料庫為預設值
  resetDatabase() {
    localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(DEFAULT_PROFILES));
    localStorage.setItem(MOCK_RECORDS_KEY, JSON.stringify(DEFAULT_RECORDS));
    return { success: true };
  }
};
