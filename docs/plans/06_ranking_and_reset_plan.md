# [구현 계획서] 처음부터 다시 시작 및 랭킹 (최고 스테이지 & 최소 움직임) 시스템

이 계획서는 사운드 설정 모달 내 **'처음부터 다시 시작'** 기능과 **'실시간 랭킹 시스템'**(최고 스테이지 순위 및 스테이지별 최소 붓기 횟수 리더보드)을 추가하기 위한 상세 작업 계획입니다.

---

## 📌 주요 변경 내용

### 1. ⚙️ 설정 모달 내 [처음부터 다시 시작] 기능
- 사운드 설정 모달 하단에 **[🔄 처음부터 다시 시작]** 빨간색 버튼 추가.
- 클릭 시 "정말로 1단계부터 다시 시작하시겠습니까?" 팝업 확인 후 1단계로 리셋 및 Supabase DB 저장.

### 2. 🏆 실시간 랭킹 (리더보드) 시스템
- **헤더 우측 아이콘 그룹**에 **[🏆 랭킹]** 버튼 추가.
- **랭킹 모달 (Glassmorphism 디자인)**:
  - **탭 1: 🌟 최고 스테이지 랭킹 (Top Stage)**
    - 전체 사용자 중 가장 높은 스테이지에 도달한 상위 10명 순위 표시 (1~3위 금/은/동 트로피 표식).
  - **탭 2: ⚡ 스테이지별 최소 움직임 랭킹 (Best Moves)**
    - 드롭다운으로 스테이지 선택 (예: STAGE 1, STAGE 2...).
    - 해당 스테이지를 **가장 적은 붓기 횟수(Moves)** 로 완료한 명예의 전당 순위 표시.

---

## 🗄️ 데이터베이스 변경 (Supabase SQL)

`supabase/migrations/002_create_rankings.sql` 생성 예정:
1. `stage_records` 테이블 생성 (사용자ID, 닉네임, 스테이지, 붓기 횟수, 클리어 일시).
2. 타인의 랭킹을 볼 수 있도록 `player_settings` 및 `stage_records` 테이블의 RLS SELECT 정책을 `true`(전체 공개)로 추가.

---

## 📂 파일 변경 계획

#### [NEW] [002_create_rankings.sql](file:///c:/Users/user/Desktop/water/supabase/migrations/002_create_rankings.sql)
- 랭킹 데이터 저장을 위한 테이블 및 RLS 공개 조회 정책 SQL 정의.

#### [MODIFY] [index.html](file:///c:/Users/user/Desktop/water/index.html)
- 헤더에 랭킹 버튼 추가.
- 설정 모달 하단에 '처음부터 다시 시작' 버튼 추가.
- 랭킹 모달 HTML 레이아웃 (탭 2개: 최고 스테이지, 스테이지별 최소 움직임) 추가.

#### [MODIFY] [style.css](file:///c:/Users/user/Desktop/water/style.css)
- 랭킹 모달 글래스모피즘 스타일, 순위 태그(1, 2, 3위 트로피 색상), 탭 스타일 추가.

#### [MODIFY] [app.js](file:///c:/Users/user/Desktop/water/app.js)
- 물 이동 시 `moveCount` 카운팅 로직 추가.
- 스테이지 클리어 시 `moveCount`를 Supabase `stage_records` 테이블에 갱신 (더 적은 움직임일 경우에만 최적 기록 갱신).
- 랭킹 모달 열기 및 Supabase에서 리더보드 데이터 쿼리 연동 logic 구현.
