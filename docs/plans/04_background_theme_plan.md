# 04. 배경 테마 선택 기능 구현 계획서

## 1. 개요 및 목표
게임 메인 화면의 배경을 6가지 힐링 테마 중 하나로 자유롭게 변경할 수 있는 기능을 구현합니다.
선택한 배경 테마는 LocalStorage에 자동 저장되어 다음 방문 시에도 유지됩니다.

---

## 2. 배경 테마 6종 라인업

| # | 테마 이름 | 설명 | 주요 색상 |
|---|---|---|---|
| 1 | 🌌 Deep Space | 기본 딥 다크 우주 퍼플 (기존) | #1e1b4b → #0f172a |
| 2 | 🌊 Ocean Depths | 심해 딥 블루 그라데이션 | #0c3547 → #0a0f1e |
| 3 | 🌸 Cherry Blossom | 부드러운 벚꽃 핑크 파스텔 | #3b0a2a → #1a0d1a |
| 4 | 🌿 Forest Night | 아늑한 다크 포레스트 초록 | #0a2e1a → #061510 |
| 5 | 🌅 Sunset Glow | 따뜻한 석양 노을 오렌지/핑크 | #3b1a08 → #1a0a05 |
| 6 | 🍬 Cotton Candy | 몽환적인 파스텔 민트/라벤더 | #1a0b3b → #0a0818 |

---

## 3. 작업 대상 파일
- [docs/plans/04_background_theme_plan.md](file:///c:/Users/user/Desktop/water/docs/plans/04_background_theme_plan.md)
- [index.html](file:///c:/Users/user/Desktop/water/index.html)
- [style.css](file:///c:/Users/user/Desktop/water/style.css)
- [app.js](file:///c:/Users/user/Desktop/water/app.js)

---

## 4. 단계별 진행 계획 (Step-by-Step)
1. Step 1: 문서화 및 승인
2. Step 2: index.html - 설정 모달에 배경 선택 드롭다운 UI 추가
3. Step 3: style.css - 6종 배경 테마 CSS 클래스 정의
4. Step 4: app.js - 테마 적용 로직 및 LocalStorage 저장/불러오기
5. Step 5: Git Commit & Push
