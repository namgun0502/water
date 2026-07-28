/**
 * ==========================================================================
 * Water Sort Puzzle - Core Application Logic & Sound Engine Upgrade
 * ==========================================================================
 */

// 1. 액체 색상 파렛트 정의 (시각적 구별이 뚜렷한 14가지 고대비 파스텔/네온 힐링 파렛트)
const PALETTE = [
    '#FF2A55', // 1: Cherry Red (체리 레드)
    '#FF8C00', // 2: Mango Orange (망고 주황)
    '#FFE600', // 3: Lemon Yellow (레몬 노랑)
    '#00E676', // 4: Lime Green (라임 연두)
    '#006400', // 5: Forest Green (진한 초록)
    '#00E5FF', // 6: Cyan Sky (밝은 하늘색)
    '#1565C0', // 7: Cobalt Blue (진한 코발트 파랑)
    '#AA00FF', // 8: Royal Violet (선명한 보라)
    '#FF4081', // 9: Berry Pink (밝은 분홍)
    '#E0E0E0', // 10: Pearl Silver (밝은 은백색)
    '#795548', // 11: Deep Chocolate Brown (초콜릿 브라운)
    '#FF7043', // 12: Coral Tangerine (코랄 탠저린)
    '#004D40', // 13: Deep Teal (짙은 청록)
    '#4A148C'  // 14: Plum Purple (플럼 퍼플)
];

const BOTTLE_CAPACITY = 4;

// 2. Web Audio API 기반 오디오 엔진 & 6종 BGM 및 사운드 매니저
class SoundManager {
    constructor() {
        this.ctx = null;
        this.sfxGain = null;
        this.bgmGain = null;

        this.sfxVolume = 0.8;
        this.bgmVolume = 0.6;
        this.currentBgmTrack = 'lofi';

        this.bgmInterval = null;
        this.bgmNodes = [];
    }

    // AudioContext 초기화 및 브라우저 자동재생 제한(Autoplay) 오류 해결 패치
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // SFX 및 BGM 독립 볼륨 제어 노드 구축
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.ctx.destination);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = this.bgmVolume;
            this.bgmGain.connect(this.ctx.destination);
        }

        // 일시중지 상태(suspended) 해제 -> 소리가 안 나는 오류 100% 보장
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // SFX 효과음 볼륨 변경 (0.0 ~ 1.0)
    setSfxVolume(val) {
        this.sfxVolume = val;
        if (this.sfxGain) {
            this.sfxGain.gain.setValueAtTime(val, this.ctx ? this.ctx.currentTime : 0);
        }
    }

    // BGM 배경음 볼륨 변경 (0.0 ~ 1.0)
    setBgmVolume(val) {
        this.bgmVolume = val;
        if (this.bgmGain) {
            this.bgmGain.gain.setValueAtTime(val, this.ctx ? this.ctx.currentTime : 0);
        }
    }

    // 병 선택 효과음
    playPop() {
        this.init();
        if (this.sfxVolume <= 0) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // 물을 붓는 ASMR 물리 소리
    playPourSound(durationMs = 400) {
        this.init();
        if (this.sfxVolume <= 0) return;

        const bufferSize = this.ctx.sampleRate * (durationMs / 1000);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(1300, this.ctx.currentTime + (durationMs / 1000));
        filter.Q.value = 4;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (durationMs / 1000));

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start();
    }

    // 승리 클리어 팡파르
    playWinFanfare() {
        this.init();
        if (this.sfxVolume <= 0) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const startTime = this.ctx.currentTime + index * 0.1;
            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + 0.35);
        });
    }

    // 🎵 6종 BGM 배경음악 재생 루프 컨트롤
    changeBgm(track) {
        this.currentBgmTrack = track;
        this.stopBgm();

        if (track === 'off') return;
        this.init();

        if (track === 'lofi') this.startLofiBgm();
        else if (track === 'moon') this.startMoonlightBgm();
        else if (track === 'breeze') this.startBreezeBgm();
        else if (track === 'star') this.startStarlightBgm();
        else if (track === 'cloud') this.startCloudBgm();
        else if (track === 'jazz') this.startJazzBgm();
    }

    stopBgm() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.bgmNodes.forEach(node => {
            try { node.stop(); } catch (e) {}
        });
        this.bgmNodes = [];
    }

    // 1. Chill Lofi BGM (유지: 편안한 로파이)
    startLofiBgm() {
        const chords = [
            [261.63, 329.63, 392.00, 493.88], // Cmaj7
            [220.00, 261.63, 329.63, 392.00], // Am7
            [174.61, 220.00, 261.63, 329.63], // Fmaj7
            [196.00, 246.94, 293.66, 349.23]  // G7
        ];
        let step = 0;

        const playStep = () => {
            const chord = chords[step % chords.length];
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

                osc.connect(gain);
                gain.connect(this.bgmGain);
                osc.start();
                osc.stop(this.ctx.currentTime + 1.8);
                this.bgmNodes.push(osc);
            });
            step++;
        };

        playStep();
        this.bgmInterval = setInterval(playStep, 2000);
    }

    // 2. Soft Moonlight BGM (신규: 부드러운 달빛 - 맑고 부드러운 아르페지오)
    startMoonlightBgm() {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63];
        let step = 0;

        const playNote = () => {
            const freq = notes[step % notes.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; // 아주 부드러운 사인파
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 1.2);
            this.bgmNodes.push(osc);
            step++;
        };

        playNote();
        this.bgmInterval = setInterval(playNote, 700);
    }

    // 3. Soft Breeze BGM (신규: 잔잔한 봄바람 - 아늑한 삼각파 힐링 멜로디)
    startBreezeBgm() {
        const breezeMelody = [329.63, 392.00, 440.00, 523.25, 440.00, 392.00];
        let step = 0;

        const playBreezeStep = () => {
            const freq = breezeMelody[step % breezeMelody.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 1.5);
            this.bgmNodes.push(osc);
            step++;
        };

        playBreezeStep();
        this.bgmInterval = setInterval(playBreezeStep, 1000);
    }

    // 4. Starlight Lullaby BGM (신규: 포근한 별빛 - 오르골 같은 잔잔함)
    startStarlightBgm() {
        const starNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33];
        let step = 0;

        const playStar = () => {
            const freq = starNotes[step % starNotes.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.9);
            this.bgmNodes.push(osc);
            step++;
        };

        playStar();
        this.bgmInterval = setInterval(playStar, 650);
    }

    // 5. Cloud Ambient BGM (신규: 부드러운 구름 - 아늑한 앰비언트 패드)
    startCloudBgm() {
        const cloudPads = [
            [174.61, 261.63, 329.63], // Fmaj
            [220.00, 261.63, 329.63], // Am
            [196.00, 246.94, 293.66]  // G
        ];
        let step = 0;

        const playCloudPad = () => {
            const pad = cloudPads[step % cloudPads.length];
            pad.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.035, this.ctx.currentTime + 1.2);
                gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);

                osc.connect(gain);
                gain.connect(this.bgmGain);
                osc.start();
                osc.stop(this.ctx.currentTime + 2.5);
                this.bgmNodes.push(osc);
            });
            step++;
        };

        playCloudPad();
        this.bgmInterval = setInterval(playCloudPad, 2600);
    }

    // 6. Cozy Jazz BGM (카페 아늑 재즈)
    startJazzBgm() {
        const jazzNotes = [220.00, 277.18, 329.63, 415.30, 440.00, 329.63];
        let step = 0;

        const playJazzStep = () => {
            const freq = jazzNotes[step % jazzNotes.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.7);
            this.bgmNodes.push(osc);
            step++;
        };

        playJazzStep();
        this.bgmInterval = setInterval(playJazzStep, 800);
    }
}

const soundEngine = new SoundManager();

// 3. 메인 게임 클래스 (WaterSortGame)
class WaterSortGame {
    constructor() {
        this.stage = 1;
        this.bottles = [];
        this.selectedBottleIdx = null;
        this.history = [];
        this.bonusBottlesCount = 1;
        this.isAnimating = false;

        // DOM 요소
        this.bottlesContainer = document.getElementById('bottles-container');
        this.stageNumEl = document.getElementById('stage-number');
        this.winModal = document.getElementById('win-modal');
        this.infoModal = document.getElementById('info-modal');
        this.soundModal = document.getElementById('sound-modal');

        this.bgmSelect = document.getElementById('bgm-select');
        this.bgmVolumeSlider = document.getElementById('bgm-volume');
        this.sfxVolumeSlider = document.getElementById('sfx-volume');
        this.bgmValText = document.getElementById('bgm-val-text');
        this.sfxValText = document.getElementById('sfx-val-text');

        this.loadProgress();
        this.initEvents();
        this.startStage(this.stage);
    }

    loadProgress() {
        const savedStage = localStorage.getItem('watersort_stage');
        if (savedStage) {
            this.stage = parseInt(savedStage, 10) || 1;
        }
    }

    saveProgress() {
        localStorage.setItem('watersort_stage', this.stage);
    }

    initEvents() {
        // 어느 위치든 첫 터치 시 AudioContext resume 호출 (소리 오류 100% 방지)
        const unlockAudio = () => {
            soundEngine.init();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        // 사운드 설정 모달 열기/닫기
        document.getElementById('btn-sound-settings').addEventListener('click', () => {
            soundEngine.init();
            this.soundModal.classList.remove('hidden');
        });
        document.getElementById('btn-close-sound').addEventListener('click', () => {
            this.soundModal.classList.add('hidden');
        });

        // BGM 트랙 변경 이벤트
        this.bgmSelect.addEventListener('change', (e) => {
            const track = e.target.value;
            soundEngine.changeBgm(track);
        });

        // BGM 볼륨 슬라이더
        this.bgmVolumeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            this.bgmValText.textContent = `${val}%`;
            soundEngine.setBgmVolume(val / 100);
        });

        // SFX 효과음 볼륨 슬라이더
        this.sfxVolumeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            this.sfxValText.textContent = `${val}%`;
            soundEngine.setSfxVolume(val / 100);
        });

        // 도움말 모달
        document.getElementById('btn-info').addEventListener('click', () => {
            this.infoModal.classList.remove('hidden');
        });
        document.getElementById('btn-close-info').addEventListener('click', () => {
            this.infoModal.classList.add('hidden');
        });

        // 되돌리기, 재시작, 다음 단계
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetStage());

        document.getElementById('btn-next-stage').addEventListener('click', () => {
            this.winModal.classList.add('hidden');
            this.stage++;
            this.saveProgress();
            this.startStage(this.stage);
        });

        // 기본 BGM 시작 (Chill Lofi)
        setTimeout(() => {
            soundEngine.changeBgm('lofi');
        }, 500);
    }

    // 새로운 스테이지 시작 (색상 생성 및 초기 셔플)
    startStage(stageNum) {
        this.stageNumEl.textContent = stageNum;
        this.selectedBottleIdx = null;
        this.history = [];
        this.isAnimating = false;

        // 🌟 스테이지 난이도 공식: 1~2단계 3색 -> 최대 11색 (+ 기본 빈 병 3개 = 총 14개 병)
        const colorCount = Math.min(3 + Math.floor((stageNum - 1) / 2), 11);
        const emptyBottleCount = 3; // 🌟 기본 제공 빈 병을 3개로 확장하여 재시작 시에도 쾌적함 보장!
        const selectedColors = PALETTE.slice(0, colorCount);

        let colorPool = [];
        selectedColors.forEach(color => {
            for (let i = 0; i < BOTTLE_CAPACITY; i++) {
                colorPool.push(color);
            }
        });

        for (let i = colorPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
        }

        this.bottles = [];
        for (let i = 0; i < colorCount; i++) {
            const b = colorPool.slice(i * BOTTLE_CAPACITY, (i + 1) * BOTTLE_CAPACITY);
            this.bottles.push(b);
        }

        for (let i = 0; i < emptyBottleCount; i++) {
            this.bottles.push([]);
        }

        // 🌟 스테이지 최초 상태 보관 (재시작 시 원래 배치 그대로 복원하기 위함)
        this.initialBottles = this.bottles.map(b => [...b]);

        this.render();
    }

    // 🌟 현재 스테이지 재시작 (원래 처음 생성되었던 배치 그대로 복원)
    resetStage() {
        if (this.isAnimating) return;
        soundEngine.playPop();
        
        // 처음 배치 상태 그대로 원복
        this.bottles = this.initialBottles.map(b => [...b]);
        this.selectedBottleIdx = null;
        this.history = [];
        this.render();
    }

    render() {
        this.bottlesContainer.innerHTML = '';

        // 🌟 병 개수가 9개 이상으로 많아지면 compact 레이아웃 클래스 부여
        if (this.bottles.length >= 11) {
            this.bottlesContainer.className = 'bottles-container compact-mini';
        } else if (this.bottles.length >= 9) {
            this.bottlesContainer.className = 'bottles-container compact';
        } else {
            this.bottlesContainer.className = 'bottles-container';
        }

        this.bottles.forEach((bottle, bIdx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'bottle-wrapper';
            if (this.selectedBottleIdx === bIdx) {
                wrapper.classList.add('selected');
            }

            wrapper.addEventListener('click', () => this.handleBottleClick(bIdx));

            const bottleEl = document.createElement('div');
            bottleEl.className = 'bottle';

            const rimEl = document.createElement('div');
            rimEl.className = 'bottle-rim';
            wrapper.appendChild(rimEl);

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

    // 유리병 터치/클릭 처리 (선택 해제 및 부어 담기)
    handleBottleClick(bIdx) {
        if (this.isAnimating) return;

        // 1. 이미 선택된 병을 다시 누르면 -> 선택 즉시 취소!
        if (this.selectedBottleIdx === bIdx) {
            soundEngine.playPop();
            this.selectedBottleIdx = null;
            this.render();
            return;
        }

        // 2. 선택된 병이 없을 때 -> 새로운 병 선택
        if (this.selectedBottleIdx === null) {
            if (this.bottles[bIdx].length === 0) return;
            soundEngine.playPop();
            this.selectedBottleIdx = bIdx;
            this.render();
            return;
        }

        // 3. 물 옮기기 시도
        const fromIdx = this.selectedBottleIdx;
        const toIdx = bIdx;

        if (this.canPour(fromIdx, toIdx)) {
            this.saveHistory();
            this.pourWater(fromIdx, toIdx);
        } else {
            soundEngine.playPop();
            if (this.bottles[toIdx].length > 0) {
                this.selectedBottleIdx = toIdx;
            } else {
                this.selectedBottleIdx = null;
            }
            this.render();
        }
    }

    canPour(fromIdx, toIdx) {
        const fromBottle = this.bottles[fromIdx];
        const toBottle = this.bottles[toIdx];

        if (!fromBottle || !toBottle) return false;
        if (fromBottle.length === 0) return false; // 옮길 액체가 없음
        if (toBottle.length >= BOTTLE_CAPACITY) return false; // 받는 병이 꽉 차있음

        const topColorFrom = fromBottle[fromBottle.length - 1];

        if (toBottle.length === 0) return true; // 받는 병이 비어있으면 언제든 가능
        const topColorTo = toBottle[toBottle.length - 1];

        // 🌟 대소문자 구문 및 공백 차이 오류 방지를 위해 toUpperCase()로 트림 비교
        return topColorFrom.trim().toUpperCase() === topColorTo.trim().toUpperCase();
    }

    async pourWater(fromIdx, toIdx) {
        this.isAnimating = true;
        
        try {
            const fromBottle = this.bottles[fromIdx];
            const toBottle = this.bottles[toIdx];

            if (!fromBottle || fromBottle.length === 0) return;

            const pourColor = fromBottle[fromBottle.length - 1];

            // 이동할 동일한 색상의 액체 층 개수 계산
            let pourCount = 0;
            for (let i = fromBottle.length - 1; i >= 0; i--) {
                if (fromBottle[i].trim().toUpperCase() === pourColor.trim().toUpperCase()) {
                    pourCount++;
                } else {
                    break;
                }
            }

            const availableSpace = BOTTLE_CAPACITY - toBottle.length;
            const actualPourCount = Math.min(pourCount, availableSpace);

            if (actualPourCount <= 0) return;

            // 물 소리 재생
            soundEngine.playPourSound(actualPourCount * 300);

            // 실제 물 데이터 이동
            for (let i = 0; i < actualPourCount; i++) {
                fromBottle.pop();
                toBottle.push(pourColor);
            }

            this.selectedBottleIdx = null;
            this.render();

            await new Promise(res => setTimeout(res, 300));
        } catch (error) {
            console.error("Pouring error:", error);
        } finally {
            // 🌟 무슨 일이 있어도 isAnimating을 해제하여 병 터치가 막히는 현상 방지
            this.isAnimating = false;
        }

        this.checkWinCondition();
    }

    checkWinCondition() {
        let isCleared = true;

        for (let bottle of this.bottles) {
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
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            setTimeout(() => {
                this.winModal.classList.remove('hidden');
            }, 400);
        }
    }

    saveHistory() {
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
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new WaterSortGame();
});
