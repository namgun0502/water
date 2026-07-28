/**
 * ==========================================================================
 * Water Sort Puzzle - Core Application Logic & Sound Engine Upgrade
 * ==========================================================================
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
        else if (track === 'ocean') this.startOceanBgm();
        else if (track === 'piano') this.startPianoBgm();
        else if (track === 'rain') this.startRainBgm();
        else if (track === 'synth') this.startSynthBgm();
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

    // 1. Chill Lofi BGM (로파이 아날로그 앰비언트 코드)
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

    // 2. Ocean ASMR BGM (바다 파도 물소리)
    startOceanBgm() {
        const playWave = () => {
            const bufferSize = this.ctx.sampleRate * 4;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, this.ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 2);
            filter.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 4);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 2);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 4);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            noise.start();
            this.bgmNodes.push(noise);
        };

        playWave();
        this.bgmInterval = setInterval(playWave, 4000);
    }

    // 3. Calm Piano BGM (감성 클래식 피아노 아르페지오)
    startPianoBgm() {
        const notes = [261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 329.63, 261.63];
        let step = 0;

        const playNote = () => {
            const freq = notes[step % notes.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.8);
            this.bgmNodes.push(osc);
            step++;
        };

        playNote();
        this.bgmInterval = setInterval(playNote, 600);
    }

    // 4. Forest Rain BGM (숲속 아늑한 빗소리)
    startRainBgm() {
        const playRainDrop = () => {
            const bufferSize = this.ctx.sampleRate * 0.5;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            noise.start();
            this.bgmNodes.push(noise);
        };

        playRainDrop();
        this.bgmInterval = setInterval(playRainDrop, 300);
    }

    // 5. Fantasy Synth BGM (몽환 우주 신디사이저)
    startSynthBgm() {
        const freqs = [130.81, 196.00, 261.63, 392.00];
        let step = 0;

        const playSynthPad = () => {
            const freq = freqs[step % freqs.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, this.ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 1.5);
            filter.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 3);

            gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 1.5);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            osc.start();
            osc.stop(this.ctx.currentTime + 3);
            this.bgmNodes.push(osc);
            step++;
        };

        playSynthPad();
        this.bgmInterval = setInterval(playSynthPad, 2500);
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

        // 되돌리기, 재시작, 병 추가, 다음 단계
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());
        document.getElementById('btn-reset').addEventListener('click', () => this.startStage(this.stage));
        document.getElementById('btn-add-bottle').addEventListener('click', () => this.addExtraBottle());

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

    startStage(stageNum) {
        this.stageNumEl.textContent = stageNum;
        this.selectedBottleIdx = null;
        this.history = [];
        this.isAnimating = false;

        const colorCount = Math.min(3 + Math.floor((stageNum - 1) / 2), 8);
        const emptyBottleCount = 2;
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

        this.render();
    }

    render() {
        this.bottlesContainer.innerHTML = '';

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

        if (fromBottle.length === 0) return false;
        if (toBottle.length >= BOTTLE_CAPACITY) return false;

        const topColorFrom = fromBottle[fromBottle.length - 1];

        if (toBottle.length === 0) return true;
        const topColorTo = toBottle[toBottle.length - 1];

        return topColorFrom === topColorTo;
    }

    async pourWater(fromIdx, toIdx) {
        this.isAnimating = true;
        const fromBottle = this.bottles[fromIdx];
        const toBottle = this.bottles[toIdx];

        const pourColor = fromBottle[fromBottle.length - 1];

        let pourCount = 0;
        for (let i = fromBottle.length - 1; i >= 0; i--) {
            if (fromBottle[i] === pourColor) pourCount++;
            else break;
        }

        const availableSpace = BOTTLE_CAPACITY - toBottle.length;
        const actualPourCount = Math.min(pourCount, availableSpace);

        soundEngine.playPourSound(actualPourCount * 300);

        for (let i = 0; i < actualPourCount; i++) {
            fromBottle.pop();
            toBottle.push(pourColor);
        }

        this.selectedBottleIdx = null;
        this.render();

        await new Promise(res => setTimeout(res, 350));
        this.isAnimating = false;

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

    addExtraBottle() {
        if (this.isAnimating || this.bonusBottlesCount <= 0) return;
        soundEngine.playPop();
        this.bottles.push([]);
        this.bonusBottlesCount--;

        const badge = document.getElementById('add-bottle-badge');
        badge.textContent = this.bonusBottlesCount;
        if (this.bonusBottlesCount <= 0) {
            badge.style.display = 'none';
        }

        this.render();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new WaterSortGame();
});
