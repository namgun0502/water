/**
 * ==========================================================================
 * Water Sort Puzzle - Core Application Logic
 * ==========================================================================
 * 초보자분들도 한눈에 이해할 수 있도록 코드 전체 구조와 로직에 한국어 주석을 다 달았습니다.
 */

// 1. 액체 색상 파렛트 정의 (시각적 구별이 뚜렷한 고대비 파스텔/네온 힐링 파렛트)
const PALETTE = [
    '#FF2A55', // 1: Vibrant Cherry Red (체리 레드)
    '#FF8C00', // 2: Vivid Mango Orange (망고 주황)
    '#FFE600', // 3: Bright Lemon Yellow (레몬 노랑)
    '#00E676', // 4: Neon Lime Green (라임 연두)
    '#006400', // 5: Deep Forest Green (진한 초록)
    '#00E5FF', // 6: Electric Cyan Sky (맑은 하늘색)
    '#1565C0', // 7: Deep Cobalt Blue (진한 코발트 파랑)
    '#AA00FF', // 8: Electric Royal Violet (선명한 보라)
    '#FF4081', // 9: Bright Berry Pink (밝은 분홍)
    '#E0E0E0'  // 10: Pearl White Silver (밝은 은백색)
];

// 병 하나당 들어갈 수 있는 최대 액체 칸수 (기본 4칸)
const BOTTLE_CAPACITY = 4;

// 2. Web Audio API 기반 ASMR 사운드 효과음 생성기
class SoundManager {
    constructor() {
        this.ctx = null; // AudioContext
        this.enabled = true; // 음소거 여부
    }

    // 오디오 컨텍스트 초기화 (사용자 첫 클릭 시 활성화)
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }

    // 병 터치 소리 (톡 부드러운 노크 소리)
    playPop() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // 물을 부을 때 졸졸졸 나는 ASMR 물소리 합성
    playPourSound(durationMs = 400) {
        if (!this.enabled) return;
        this.init();

        const bufferSize = this.ctx.sampleRate * (durationMs / 1000);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // 핑크 노이즈 성분의 노이즈 필터 생성
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // 물 느낌을 주는 밴드패스 필터
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + (durationMs / 1000));
        filter.Q.value = 5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (durationMs / 1000));

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    // 스테이지 승리 축하 팡파르음
    playWinFanfare() {
        if (!this.enabled) return;
        this.init();

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 멜로디
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const startTime = this.ctx.currentTime + index * 0.1;
            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }
}

// 사운드 매니저 인스턴스 생성
const soundEngine = new SoundManager();

// 3. 메인 게임 클래스 (WaterSortGame)
class WaterSortGame {
    constructor() {
        // 현재 게임 상태 변수들
        this.stage = 1;               // 현재 스테이지 번호
        this.bottles = [];            // 각 병의 액체 배열들 (예: [['#ff5964', '#ff5964'], ...])
        this.selectedBottleIdx = null;// 사용자가 첫번째로 선택한 병의 인덱스
        this.history = [];            // Undo(되돌리기) 기능을 위한 이력 스택
        this.bonusBottlesCount = 1;   // 사용 가능한 보너스 병 개수
        this.isAnimating = false;     // 물 옮기는 애니메이션 진행 중 여부

        // DOM 요소 연결
        this.bottlesContainer = document.getElementById('bottles-container');
        this.stageNumEl = document.getElementById('stage-number');
        this.winModal = document.getElementById('win-modal');
        this.infoModal = document.getElementById('info-modal');
        this.streamCanvas = document.getElementById('stream-canvas');

        // 저장된 스테이지가 있다면 불러오기
        this.loadProgress();

        // 이벤트 리스너 및 게임 초기화
        this.initEvents();
        this.startStage(this.stage);
    }

    // LocalStorage에서 진행 상태 불러오기
    loadProgress() {
        const savedStage = localStorage.getItem('watersort_stage');
        if (savedStage) {
            this.stage = parseInt(savedStage, 10) || 1;
        }
    }

    // 진행 상태 저장하기
    saveProgress() {
        localStorage.setItem('watersort_stage', this.stage);
    }

    // UI 버튼 및 사용자 터치 이벤트 바인딩
    initEvents() {
        // 사운드 토글
        document.getElementById('btn-sound').addEventListener('click', (e) => {
            soundEngine.enabled = !soundEngine.enabled;
            const icon = e.currentTarget.querySelector('i');
            icon.className = soundEngine.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        });

        // 도움말 모달
        document.getElementById('btn-info').addEventListener('click', () => {
            this.infoModal.classList.remove('hidden');
        });
        document.getElementById('btn-close-info').addEventListener('click', () => {
            this.infoModal.classList.add('hidden');
        });

        // 되돌리기(Undo) 버튼
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());

        // 재시작(Reset) 버튼
        document.getElementById('btn-reset').addEventListener('click', () => this.startStage(this.stage));

        // 보너스 병 추가 버튼
        document.getElementById('btn-add-bottle').addEventListener('click', () => this.addExtraBottle());

        // 다음 스테이지 버튼
        document.getElementById('btn-next-stage').addEventListener('click', () => {
            this.winModal.classList.add('hidden');
            this.stage++;
            this.saveProgress();
            this.startStage(this.stage);
        });
    }

    // 스테이지 생성 및 초기 배치 (난이도에 맞게 자동 믹싱)
    startStage(stageNum) {
        this.stageNumEl.textContent = stageNum;
        this.selectedBottleIdx = null;
        this.history = [];
        this.isAnimating = false;

        // 난이도 조절: 스테이지에 따른 색상 개수 설정 (최소 3개 ~ 최대 8개)
        const colorCount = Math.min(3 + Math.floor((stageNum - 1) / 2), 8);
        const emptyBottleCount = 2; // 기본 빈 병 2개

        // 사용할 색상 선정
        const selectedColors = PALETTE.slice(0, colorCount);

        // 색상 묶음 생성 (각 색상마다 4개씩 칸 생성)
        let colorPool = [];
        selectedColors.forEach(color => {
            for (let i = 0; i < BOTTLE_CAPACITY; i++) {
                colorPool.push(color);
            }
        });

        // 배열 무작위 셔플 (Fisher-Yates 알고리즘)
        for (let i = colorPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
        }

        // 병에 액체 채우기
        this.bottles = [];
        for (let i = 0; i < colorCount; i++) {
            const b = colorPool.slice(i * BOTTLE_CAPACITY, (i + 1) * BOTTLE_CAPACITY);
            this.bottles.push(b);
        }

        // 빈 병 추가
        for (let i = 0; i < emptyBottleCount; i++) {
            this.bottles.push([]);
        }

        // 화면 렌더링
        this.render();
    }

    // 화면 렌더링 (병과 액체 층)
    render() {
        this.bottlesContainer.innerHTML = '';

        this.bottles.forEach((bottle, bIdx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'bottle-wrapper';
            if (this.selectedBottleIdx === bIdx) {
                wrapper.classList.add('selected');
            }

            // 터치/클릭 이벤트 바인딩
            wrapper.addEventListener('click', () => this.handleBottleClick(bIdx));

            const bottleEl = document.createElement('div');
            bottleEl.className = 'bottle';

            // 유리병 입구 Rim
            const rimEl = document.createElement('div');
            rimEl.className = 'bottle-rim';
            wrapper.appendChild(rimEl);

            // 병 내 액체 층들 렌더링 (아래에서부터 쌓임)
            bottle.forEach(color => {
                const layer = document.createElement('div');
                layer.className = 'water-layer';
                layer.style.backgroundColor = color;
                bottleEl.appendChild(layer);
            });

            wrapper.appendChild(bottleEl);
            this.bottlesContainer.appendChild(wrapper);
        });
    }

    // 유리병 클릭 처리
    handleBottleClick(bIdx) {
        if (this.isAnimating) return; // 물 붓는 중에는 클릭 무시

        soundEngine.playPop();

        // 1. 선택된 병이 없을 때 (출처 병 선택)
        if (this.selectedBottleIdx === null) {
            // 빈 병은 선택 불가능
            if (this.bottles[bIdx].length === 0) return;
            this.selectedBottleIdx = bIdx;
            this.render();
            return;
        }

        // 2. 이미 선택된 병을 다시 누르면 선택 해제
        if (this.selectedBottleIdx === bIdx) {
            this.selectedBottleIdx = null;
            this.render();
            return;
        }

        // 3. 다른 병 선택 -> 물 이동 조건 검증
        const fromIdx = this.selectedBottleIdx;
        const toIdx = bIdx;

        if (this.canPour(fromIdx, toIdx)) {
            // 이동 전 히스토리 저장 (Undo 용)
            this.saveHistory();
            // 물 옮기기 실행
            this.pourWater(fromIdx, toIdx);
        } else {
            // 부을 수 없을 때는 선택을 새 병으로 변경 (단, 새 병이 비어있지 않다면)
            if (this.bottles[toIdx].length > 0) {
                this.selectedBottleIdx = toIdx;
            } else {
                this.selectedBottleIdx = null;
            }
            this.render();
        }
    }

    // 물 옮기기 가능한지 조건 검증
    canPour(fromIdx, toIdx) {
        const fromBottle = this.bottles[fromIdx];
        const toBottle = this.bottles[toIdx];

        if (fromBottle.length === 0) return false; // 출처가 비어있음
        if (toBottle.length >= BOTTLE_CAPACITY) return false; // 받는 병이 이미 가득 참

        const topColorFrom = fromBottle[fromBottle.length - 1];

        // 받는 병이 완전히 비어있거나, 맨 위 색깔이 같으면 이동 가능
        if (toBottle.length === 0) return true;
        const topColorTo = toBottle[toBottle.length - 1];

        return topColorFrom === topColorTo;
    }

    // 실제 물 옮기기 및 애니메이션 수행
    async pourWater(fromIdx, toIdx) {
        this.isAnimating = true;
        const fromBottle = this.bottles[fromIdx];
        const toBottle = this.bottles[toIdx];

        const pourColor = fromBottle[fromBottle.length - 1];

        // 이동할 동일한 색상의 액체 칸 수 계산
        let pourCount = 0;
        for (let i = fromBottle.length - 1; i >= 0; i--) {
            if (fromBottle[i] === pourColor) {
                pourCount++;
            } else {
                break;
            }
        }

        // 받는 병의 여유 공간 계산
        const availableSpace = BOTTLE_CAPACITY - toBottle.length;
        const actualPourCount = Math.min(pourCount, availableSpace);

        // 사운드 재생
        soundEngine.playPourSound(actualPourCount * 300);

        // 데이터 갱신
        for (let i = 0; i < actualPourCount; i++) {
            fromBottle.pop();
            toBottle.push(pourColor);
        }

        this.selectedBottleIdx = null;
        this.render();

        // 약간의 딜레이 후 애니메이션 완료 및 승리 체크
        await new Promise(res => setTimeout(res, 350));
        this.isAnimating = false;

        // 승리 조건 체크
        this.checkWinCondition();
    }

    // 승리(Stage Clear) 체크
    checkWinCondition() {
        let isCleared = true;

        for (let bottle of this.bottles) {
            // 병이 비어있지 않은데, 칸수가 4개가 아니거나 색깔이 통일되지 않았으면 미완성
            if (bottle.length > 0) {
                if (bottle.length !== BOTTLE_CAPACITY) {
                    isCleared = false;
                    break;
                }
                const firstColor = bottle[0];
                const allSame = bottle.every(c => c === firstColor);
                if (!allSame) {
                    isCleared = false;
                    break;
                }
            }
        }

        if (isCleared) {
            soundEngine.playWinFanfare();
            // 승리 폭죽(Confetti) 효과 실행
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            // 모달 띄우기
            setTimeout(() => {
                this.winModal.classList.remove('hidden');
            }, 400);
        }
    }

    // Undo (한 단계 뒤로가기)
    saveHistory() {
        // 복사본 저장
        const snapShot = this.bottles.map(b => [...b]);
        this.history.push(snapShot);
    }

    undoMove() {
        if (this.isAnimating || this.history.length === 0) return;
        soundEngine.playPop();
        this.bottles = this.history.pop();
        this.selectedBottleIdx = null;
        this.render();
    }

    // 병 추가 아이템 사용
    addExtraBottle() {
        if (this.isAnimating || this.bonusBottlesCount <= 0) return;
        soundEngine.playPop();
        this.bottles.push([]); // 빈 병 1개 추가
        this.bonusBottlesCount--;

        // 배지 갱신
        const badge = document.getElementById('add-bottle-badge');
        badge.textContent = this.bonusBottlesCount;
        if (this.bonusBottlesCount <= 0) {
            badge.style.display = 'none';
        }

        this.render();
    }
}

// 앱 실행
window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new WaterSortGame();
});
