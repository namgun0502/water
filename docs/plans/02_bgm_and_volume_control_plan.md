# 02. BGM 배경음악 6종 선택 & 볼륨 조절 기능 구현 계획서

## 1. 개요 및 목표
사용자 경험(UX)을 향상시키기 위해 다음 3가지 핵심 사운드 시스템을 업그레이드합니다:
1. **사운드 출력 오류 해결**: 브라우저의 자동재생 제한(Autoplay policy)으로 인해 `AudioContext`가 `suspended` 상태에 머무는 문제를 해결하기 위한 `resume()` 인터랙션 보장.
2. **BGM 배경음악 선택 (총 6종 힐링 사운드)**: 
   - 🎵 Chill Lofi Ambient (아늑한 로파이)
   - 🌊 Ocean Water Sound (자연 바다 물소리)
   - 🎹 Peaceful Piano Melody (감성 피아노)
   - 🌲 Forest Rain ASMR (아늑한 숲속 빗소리)
   - ✨ Fantasy Synth Wave (몽환적 드림 신디사이저)
   - ☕ Cozy Cafe Jazz (따뜻한 카페 재즈)
3. **볼륨 조절 슬라이더**: 효과음(SFX) 및 배경음악(BGM)의 크기를 0% ~ 100% 실시간 조절할 수 있는 슬라이더 UI 제공.

---

## 2. 주요 변경 사항 및 UI/UX 디자인

### 🎵 사운드 시스템 (Sound Engine Update)
- `SoundManager` 클래스에 Web Audio API 기반 Synth BGM 6종 루프 합성기 구축.
- 첫 터치 시 `ctx.resume()`을 호출하여 모든 효과음(Pop, Pouring, Win)이 끊김 없이 확실히 들리도록 보장.
- SFX 볼륨 및 BGM 볼륨 독립 제어 노드(`GainNode`) 구축.

### 🎛️ 볼륨 및 BGM 컨트롤 설정 모달 (Settings Modal UI)
- 헤더의 사운드 버튼 클릭 시 팝업 설정 모달 등장:
  - **BGM 선택 드롭다운 / 트랙 셀렉터**: 6종 BGM 선택
  - **BGM 볼륨 슬라이더**: 0% ~ 100%
  - **효과음(SFX) 볼륨 슬라이더**: 0% ~ 100%
