# 03. 액체 색상 14종 확장 & 스테이지별 동적 병 개수 조정 구현 계획서

## 1. 개요 및 목표
퍼즐의 재미와 풍성함을 극대화하기 위해 다음과 같이 수치 및 시스템을 업그레이드합니다:
1. **액체 색상 14종 대폭 확장**: 시각적으로 명확히 구별되는 14가지 고대비 파스텔/네온 힐링 파렛트 구성.
2. **스테이지별 병 개수 동적 난이도 조정**: 
   - 초기 스테이지 (3개 색상 + 빈 병 2개 = 총 5개 병)부터 시작하여 난이도에 따라 최대 12개 색상 + 빈 병 2개 = 총 14개 병까지 점진적 확장.
3. **모바일 반응형 유리병 레이아웃**: 병 개수가 많아져도 깨지거나 넘치지 않고 2~3줄로 예쁘게 정렬되도록 CSS 너비 및 크기 동적 조절.

---

## 2. 작업 대상 파일
- [docs/plans/03_color_and_bottle_expansion_plan.md](file:///c:/Users/user/Desktop/water/docs/plans/03_color_and_bottle_expansion_plan.md) (규칙 #12 프로젝트 문서)
- [app.js](file:///c:/Users/user/Desktop/water/app.js) (PALETTE 14종 확장 및 startStage 난이도 공식 수정)
- [style.css](file:///c:/Users/user/Desktop/water/style.css) (유리병 크기 및 격자 정렬 반응형 레이아웃 최적화)

---

## 3. 진행 단계 (Step-by-Step)
1. **Step 1: 문서 저장 및 승인 (현재 단계)**
2. **Step 2: PALETTE 14종 & startStage 알고리즘 갱신**
3. **Step 3: CSS Glassmorphism 병 레이아웃 반응형 최적화**
4. **Step 4: Git Commit & Push**
