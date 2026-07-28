-- ============================================================
-- 001_create_player_settings.sql
-- Water Sort Puzzle - 플레이어 설정 및 진행 상황 저장 테이블
-- ============================================================

-- player_settings 테이블 생성
-- Supabase Auth의 users 테이블과 연동됩니다.
CREATE TABLE IF NOT EXISTS public.player_settings (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname    TEXT NOT NULL DEFAULT '플레이어',
    stage       INTEGER NOT NULL DEFAULT 1,
    bg_theme    TEXT NOT NULL DEFAULT 'deep-space',
    bgm_track   TEXT NOT NULL DEFAULT 'lofi',
    bgm_volume  INTEGER NOT NULL DEFAULT 60,
    sfx_volume  INTEGER NOT NULL DEFAULT 80,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) 보안 정책 설정
-- 핵심: 각 사용자는 오직 자신의 데이터만 읽고 쓸 수 있습니다.
-- ============================================================

-- RLS 활성화
ALTER TABLE public.player_settings ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인 데이터 조회 허용
CREATE POLICY "본인 데이터 조회" ON public.player_settings
    FOR SELECT USING (auth.uid() = id);

-- 정책 2: 본인 데이터 삽입 허용 (회원가입 시 최초 1회)
CREATE POLICY "본인 데이터 삽입" ON public.player_settings
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 정책 3: 본인 데이터 수정 허용 (설정 변경, 스테이지 업데이트)
CREATE POLICY "본인 데이터 수정" ON public.player_settings
    FOR UPDATE USING (auth.uid() = id);
