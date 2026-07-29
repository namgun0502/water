-- ============================================================
-- 002_create_rankings.sql
-- Water Sort Puzzle - 랭킹 (스테이지별 최소 움직임 & 전체 공개 조회 RLS)
-- ============================================================

-- 1. 스테이지별 최적 클리어 기록 테이블 (최소 움직임 랭킹용)
CREATE TABLE IF NOT EXISTS public.stage_records (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname    TEXT NOT NULL,
    stage       INTEGER NOT NULL,
    moves       INTEGER NOT NULL,
    cleared_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stage)
);

-- RLS 보안 활성화
ALTER TABLE public.stage_records ENABLE ROW LEVEL SECURITY;

-- 정책 1: 누구나 랭킹 조회 가능 (리더보드용)
DROP POLICY IF EXISTS "모두 랭킹 조회 가능" ON public.stage_records;
CREATE POLICY "모두 랭킹 조회 가능" ON public.stage_records
    FOR SELECT USING (true);

-- 정책 2: 본인 기록만 추가/수정 가능
DROP POLICY IF EXISTS "본인 랭킹 기록 허용" ON public.stage_records;
CREATE POLICY "본인 랭킹 기록 허용" ON public.stage_records
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. player_settings 테이블 전체 조회 RLS 허용 (최고 스테이지 랭킹용)
DROP POLICY IF EXISTS "모두 플레이어 설정 조회 가능" ON public.player_settings;
CREATE POLICY "모두 플레이어 설정 조회 가능" ON public.player_settings
    FOR SELECT USING (true);
