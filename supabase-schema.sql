-- Supabase Database Schema DDL
-- 專案名稱：指甲矯正智能追蹤衛教系統 (NailTrace AI)

-- 1. 啟用 UUID 擴充套件（通常 Supabase 預設啟用）
create extension if not exists "uuid-ossp";

-- 2. 建立 profiles (用戶資料表)
create table public.profiles (
    id uuid default uuid_generate_v4() primary key,
    line_user_id text unique not null,
    patient_id text unique not null,
    name text not null,
    doctor_name text not null,
    status text default 'green' check (status in ('green', 'yellow', 'red')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 建立 tracking_records (追蹤紀錄表)
create table public.tracking_records (
    id uuid default uuid_generate_v4() primary key,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    tracking_month integer not null,
    pain_score integer not null check (pain_score >= 0 and pain_score <= 10),
    satisfaction_score integer not null check (satisfaction_score >= 0 and satisfaction_score <= 10),
    image_url text not null, -- 儲存於 Supabase Storage 的加密照片路徑或公開連結
    gemini_analysis jsonb not null, -- 儲存 Gemini AI 多模態分析的 JSON 結果
    status text not null check (status in ('green', 'yellow', 'red')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 啟用 Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.tracking_records enable row level security;

-- 5. 建立簡單的安全策略 (Policies) - 這裡以所有人皆可讀寫作為 MVP 範例，實際生產環境應綁定 auth.uid()
create policy "Allow public read access to profiles" 
    on public.profiles for select using (true);

create policy "Allow public insert/update to profiles" 
    on public.profiles for insert with check (true);

create policy "Allow public update to profiles" 
    on public.profiles for update using (true);

create policy "Allow public read access to tracking_records" 
    on public.tracking_records for select using (true);

create policy "Allow public insert to tracking_records" 
    on public.tracking_records for insert with check (true);

-- 6. 建立儲存貯體 (Storage Bucket) 用於存放指甲照片
-- 請在 Supabase Console 中建立一個名為 "nail-photos" 的 Public Bucket。
