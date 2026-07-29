/**
 * ==========================================================================
 * Water Sort Puzzle - Core Application Logic & Sound Engine Upgrade
 * ==========================================================================
 */

// 1. 액체 색상 파렛트 정의 (시각적 구별이 뚜렷한 20가지 고대비 파스텔/네온 힐링 파렛트)
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
    '#4A148C', // 14: Plum Purple (플럼 퍼플)
    '#D500F9', // 15: Magenta Rose (마젠타 로즈 - 신규)
    '#827717', // 16: Sage Olive (세이지 올리브 - 신규)
    '#BF360C', // 17: Deep Caramel (카라멜 브라운 - 신규)
    '#1A237E', // 18: Midnight Navy (미드나잇 네이비 - 신규)
    '#FFD600', // 19: Deep Bronze Gold (브론즈 골드 - 신규)
    '#A7FFEB'  // 20: Cotton Mint (솜사탕 민트 - 신규)
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

// ============================================================
// 4. Supabase 클라이언트 초기화
// ============================================================
const SUPABASE_URL  = 'https://qzhgsshyhmnczmreagqd.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aGdzc2h5aG1uY3ptcmVhZ3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzc0NzksImV4cCI6MjA5Nzg1MzQ3OX0.2NZxyClmIpj7WtUuZtexZqAMuTnC7udF5FejwitzvcU';
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================================
// 5. AuthManager - 로그인 / 회원가입 / 로그아웃 담당
// ============================================================
class AuthManager {
    constructor() {
        // 로그인 화면 DOM 요소
        this.authScreen    = document.getElementById('auth-screen');
        this.loginForm     = document.getElementById('login-form');
        this.signupForm    = document.getElementById('signup-form');
        this.loginError    = document.getElementById('login-error');
        this.signupError   = document.getElementById('signup-error');

        this.initAuthEvents();
    }

    // 로그인 / 회원가입 이벤트 연결
    initAuthEvents() {
        // 로그인 폼 제출 이벤트
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // 회원가입 폼 제출 이벤트
        if (this.signupForm) {
            this.signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSignup();
            });
        }
    }

    // 이메일 양식 자동 보정 (아이디만 입력해도 @water.com 자동 부착)
    formatEmail(raw) {
        if (!raw) return '';
        return raw.includes('@') ? raw : `${raw}@water.com`;
    }

    // 로그인 처리
    async handleLogin() {
        let email      = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn      = document.getElementById('btn-login');

        email = this.formatEmail(email);
        this.hideError('login');

        if (!email) { this.showError('login', '아이디 또는 이메일을 입력해 주세요.'); return; }
        if (!password) { this.showError('login', '비밀번호를 입력해 주세요.'); return; }

        btn.disabled = true;
        btn.querySelector('span').textContent = '로그인 중...';

        try {
            const { data, error } = await sbClient.auth.signInWithPassword({ email, password });

            if (error) {
                this.showError('login', '아이디(이메일) 또는 비밀번호가 올바르지 않습니다.');
                return;
            }

            // 로그인 성공 → 게임 시작
            await startGameAfterAuth(data.user);
        } catch (err) {
            console.error('로그인 에러:', err);
            this.showError('login', '로그인 처리 중 오류가 발생했습니다.');
        } finally {
            btn.disabled = false;
            btn.querySelector('span').textContent = '로그인';
        }
    }

    // 회원가입 처리
    async handleSignup() {
        const nicknameEl = document.getElementById('signup-nickname');
        const emailEl    = document.getElementById('signup-email');
        const passwordEl = document.getElementById('signup-password');
        const btn        = document.getElementById('btn-signup');

        const nickname = nicknameEl ? nicknameEl.value.trim() : '';
        let email      = emailEl ? emailEl.value.trim() : '';
        const password = passwordEl ? passwordEl.value : '';

        email = this.formatEmail(email);
        this.hideError('signup');

        if (!nickname) { alert('닉네임을 입력해 주세요.'); this.showError('signup', '닉네임을 입력해 주세요.'); return; }
        if (!email) { alert('아이디(이메일)를 입력해 주세요.'); this.showError('signup', '아이디(이메일)를 입력해 주세요.'); return; }
        if (password.length < 6) { alert('비밀번호는 6자리 이상이어야 합니다.'); this.showError('signup', '비밀번호는 6자리 이상이어야 합니다.'); return; }

        btn.disabled = true;
        const btnSpan = btn.querySelector('span');
        if (btnSpan) btnSpan.textContent = '가입 중...';

        try {
            // 1. 회원가입 시도
            const { data: signUpData, error: signUpError } = await sbClient.auth.signUp({ email, password });

            // 2. 가입 성공 여부와 상관없이 곧바로 로그인 시도하여 세션 획득
            const { data: signInData, error: signInError } = await sbClient.auth.signInWithPassword({ email, password });

            let finalUser = (signInData && signInData.user) ? signInData.user : (signUpData ? signUpData.user : null);

            if (finalUser) {
                // DB에 초기 플레이어 설정 저장 (없으면 생성, 있으면 업데이트)
                try {
                    const { error: dbError } = await sbClient.from('player_settings').upsert({
                        id: finalUser.id,
                        nickname: nickname,
                        stage: 1,
                        bg_theme: 'deep-space',
                        bgm_track: 'lofi',
                        bgm_volume: 60,
                        sfx_volume: 80
                    });
                    if (dbError) {
                        console.error('DB 저장 실패 세부원인:', dbError);
                    }
                } catch (dbErr) {
                    console.warn('DB 초기 설정 저장 경고:', dbErr);
                }

                alert('🎉 반가워요! 로그인되어 게임을 시작합니다.');
                await startGameAfterAuth(finalUser, !signInData);
                return;
            }

            // 둘 다 실패 시 에러 표출
            if (signUpError) {
                alert('⚠️ 안내: ' + (signUpError.message || '입력 정보를 확인해 주세요.'));
                this.showError('signup', signUpError.message);
            }
        } catch (err) {
            console.error('회원가입 에러:', err);
            alert('처리 중 오류 발생: ' + err.message);
            this.showError('signup', '처리 중 오류가 발생했습니다.');
        } finally {
            btn.disabled = false;
            if (btnSpan) btnSpan.textContent = '회원가입';
        }
    }

    // 오류 메시지 표시
    showError(type, msg) {
        const el = type === 'login' ? this.loginError : this.signupError;
        el.textContent = msg;
        el.classList.remove('hidden');
    }

    // 오류 메시지 숨기기
    hideError(type) {
        const el = type === 'login' ? this.loginError : this.signupError;
        el.classList.add('hidden');
    }

    // 로그인 화면 숨기기
    hideAuthScreen() {
        this.authScreen.classList.add('hidden');
    }
}

// ============================================================
// 6. PlayerDataManager - Supabase에서 플레이어 설정 저장/불러오기
// ============================================================
class PlayerDataManager {
    constructor(userId) {
        this.userId = userId; // 현재 로그인한 사용자 고유 ID
    }

    // Supabase에서 내 설정 불러오기
    async load() {
        const { data, error } = await sbClient
            .from('player_settings')
            .select('*')
            .eq('id', this.userId)
            .single();

        if (error || !data) return null;
        return data;
    }

    // Supabase에 현재 설정 저장 (스테이지, 배경, BGM, 볼륨)
    async save(settings) {
        try {
            await sbClient
                .from('player_settings')
                .upsert({
                    id: this.userId,
                    ...settings,
                    updated_at: new Date().toISOString()
                });
        } catch (e) {
            console.error('Supabase DB 저장 에러:', e);
        }
    }
}

// 탭 전환 전역 함수 (HTML onclick에서 호출)
function switchTab(tab) {
    const loginForm  = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabLogin   = document.getElementById('tab-login');
    const tabSignup  = document.getElementById('tab-signup');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
    } else {
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

// HTML onclick 전역 핸들러
async function handleLoginAction() {
    if (!window._authManager) {
        window._authManager = new AuthManager();
    }
    await window._authManager.handleLogin();
}

async function handleSignupAction() {
    if (!window._authManager) {
        window._authManager = new AuthManager();
    }
    await window._authManager.handleSignup();
}

// 비밀번호 보이기/숨기기 토글 전역 함수
function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const icon = btnEl.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

// 로그인 성공 후 이어서/새로 시작 선택 및 게임 초기화
async function startGameAfterAuth(user, isNewUser = false) {
    const authManager = window._authManager;
    authManager.hideAuthScreen();

    const playerData = new PlayerDataManager(user.id);
    const settings   = await playerData.load();

    if (isNewUser || !settings || settings.stage <= 1) {
        // 새 유저 또는 스테이지 1이면 바로 시작
        window.gameApp = new WaterSortGame(user, playerData, settings, false);
        document.getElementById('app').classList.remove('hidden');
        return;
    }

    // 저장된 스테이지가 2 이상이면 선택 모달 표시
    const continueModal = document.getElementById('continue-modal');
    document.getElementById('continue-welcome').textContent =
        `${settings.nickname}님, 반갑습니다!`;
    document.getElementById('continue-info').textContent =
        `마지막으로 진행한 스테이지: ${settings.stage}단계`;
    continueModal.classList.remove('hidden');
    document.getElementById('app').classList.remove('hidden');

    // 게임 시작하기 버튼 클릭 이벤트
    document.getElementById('btn-continue').onclick = () => {
        continueModal.classList.add('hidden');
        window.gameApp = new WaterSortGame(user, playerData, settings, true);
    };
}


// 3. 메인 게임 클래스 (WaterSortGame)
class WaterSortGame {
    // user: 로그인 정보, playerData: DB 저장 매니저,
    // settings: 저장된 설정값, isContinue: 이어서 진행 여부
    constructor(user, playerData, settings, isContinue) {
        this.user        = user;
        this.playerData  = playerData;
        this.maxStage    = (settings && settings.max_stage) ? settings.max_stage : ((settings && settings.stage) ? settings.stage : 1); // 달성한 최고 스테이지
        this.stage       = (isContinue && settings) ? (settings.stage || 1) : 1;
        this.bottles     = [];
        this.selectedBottleIdx = null;
        this.history     = [];
        this.bonusBottlesCount = 1;
        this.isAnimating = false;
        this.moveCount   = 0;
        this.currentBgTheme = (settings && settings.bg_theme) ? settings.bg_theme : 'deep-space';
        // 닉네임 보관 (stage_records 저장 시 사용)
        this.nickname    = (settings && settings.nickname) ? settings.nickname : '플레이어';
        if (this.playerData) this.playerData.nickname = this.nickname;

        // DOM 요소
        this.bottlesContainer   = document.getElementById('bottles-container');
        this.completedContainer = document.getElementById('completed-container');
        this.stageNumEl         = document.getElementById('stage-number');
        this.winModal           = document.getElementById('win-modal');
        this.infoModal          = document.getElementById('info-modal');
        this.soundModal         = document.getElementById('sound-modal');
        this.appEl              = document.getElementById('app');

        this.bgmSelect       = document.getElementById('bgm-select');
        this.bgThemeSelect   = document.getElementById('bg-theme-select');
        this.bgmVolumeSlider = document.getElementById('bgm-volume');
        this.sfxVolumeSlider = document.getElementById('sfx-volume');
        this.bgmValText      = document.getElementById('bgm-val-text');
        this.sfxValText      = document.getElementById('sfx-val-text');

        // 저장된 설정을 UI에 즉시 반영
        this.applyBgTheme(this.currentBgTheme);
        if (settings) this.applySettings(settings);

        this.initEvents();
        this.startStage(this.stage);
    }

    // Supabase에서 불러온 설정값을 UI 슬라이더/드롭다운에 반영
    applySettings(settings) {
        // BGM 트랙 UI 동기화
        if (this.bgmSelect && settings.bgm_track) {
            this.bgmSelect.value = settings.bgm_track;
        }
        // BGM 볼륨 UI 동기화
        if (settings.bgm_volume !== undefined) {
            this.bgmVolumeSlider.value = settings.bgm_volume;
            this.bgmValText.textContent = `${settings.bgm_volume}%`;
            soundEngine.setBgmVolume(settings.bgm_volume / 100);
        }
        // SFX 볼륨 UI 동기화
        if (settings.sfx_volume !== undefined) {
            this.sfxVolumeSlider.value = settings.sfx_volume;
            this.sfxValText.textContent = `${settings.sfx_volume}%`;
            soundEngine.setSfxVolume(settings.sfx_volume / 100);
        }
        // 저장된 BGM 재생 (딜레이 후 시작)
        const track = settings.bgm_track || 'lofi';
        setTimeout(() => soundEngine.changeBgm(track), 500);
    }

    // 현재 설정을 Supabase DB에 저장
    async saveProgress() {
        if (!this.playerData) return;
        await this.playerData.save({
            stage:      this.stage,
            max_stage:  this.maxStage, // 최고 스테이지는 절대 낮아지지 않음
            bg_theme:   this.currentBgTheme,
            bgm_track:  this.bgmSelect ? this.bgmSelect.value : 'lofi',
            bgm_volume: this.bgmVolumeSlider ? parseInt(this.bgmVolumeSlider.value, 10) : 60,
            sfx_volume: this.sfxVolumeSlider ? parseInt(this.sfxVolumeSlider.value, 10) : 80
        });
    }

    // 배경 테마를 #app에 data-theme 속성으로 적용
    applyBgTheme(theme) {
        this.currentBgTheme = theme;
        this.appEl.setAttribute('data-theme', theme);
        if (this.bgThemeSelect) this.bgThemeSelect.value = theme;
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
            // 스테이지 선택 드롭다운을 1 ~ maxStage 범위로 채우기
            const sel = document.getElementById('stage-select');
            sel.innerHTML = '';
            for (let i = 1; i <= this.maxStage; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = `STAGE ${i}`;
                if (i === this.stage) opt.selected = true;
                sel.appendChild(opt);
            }
            this.soundModal.classList.remove('hidden');
        });
        document.getElementById('btn-close-sound').addEventListener('click', () => {
            this.soundModal.classList.add('hidden');
            this.saveProgress(); // 모달 닫을 때 설정 자동 저장
        });

        // 배경 테마 변경 이벤트
        this.bgThemeSelect.addEventListener('change', (e) => {
            this.applyBgTheme(e.target.value);
            soundEngine.playPop();
            this.saveProgress(); // 즉시 DB 저장
        });

        // BGM 트랙 변경 이벤트
        this.bgmSelect.addEventListener('change', (e) => {
            soundEngine.changeBgm(e.target.value);
            this.saveProgress(); // 즉시 DB 저장
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
        document.getElementById('btn-info') && document.getElementById('btn-info').addEventListener('click', () => {
            this.infoModal.classList.remove('hidden');
        });
        document.getElementById('btn-close-info').addEventListener('click', () => {
            this.infoModal.classList.add('hidden');
        });

        // 로그아웃 버튼
        document.getElementById('btn-logout').addEventListener('click', async () => {
            soundEngine.stopBgm();
            await sbClient.auth.signOut();
            // 페이지 새로고침으로 로그인 화면으로 돌아가기
            window.location.reload();
        });

        // 되돌리기, 재시작, 다음 단계
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetStage());

        document.getElementById('btn-next-stage').addEventListener('click', () => {
            this.winModal.classList.add('hidden');
            this.stage++;
            this.saveProgress(); // 다음 스테이지 Supabase에 저장
            this.startStage(this.stage);
        });

        // 스테이지 선택 드롭다운 이벤트 (1 ~ maxStage 까지 선택 가능)
        document.getElementById('stage-select').addEventListener('change', (e) => {
            const selected = parseInt(e.target.value, 10);
            if (selected >= 1 && selected <= this.maxStage) {
                this.stage = selected;
                this.moveCount = 0;
                this.soundModal.classList.add('hidden');
                this.saveProgress();
                this.startStage(this.stage);
            }
        });

        // 랭킹 모달 열기
        document.getElementById('btn-ranking').addEventListener('click', () => {
            openRankingModal(this.user);
        });
        document.getElementById('btn-close-ranking').addEventListener('click', () => {
            document.getElementById('ranking-modal').classList.add('hidden');
        });

        // 🌟 배경 바깥 영역 터치/클릭 시 병 선택 취소 (Deselect)
        this.bottlesContainer.parentElement.addEventListener('click', (e) => {
            if (!e.target.closest('.bottle-wrapper') && this.selectedBottleIdx !== null && !this.isAnimating) {
                soundEngine.playPop();
                this.selectedBottleIdx = null;
                this.render();
            }
        });
    }

    // 새로운 스테이지 시작 (색상 생성 및 난수 시드 기반 고정 셔플)
    startStage(stageNum) {
        this.stageNumEl.textContent = stageNum;
        this.selectedBottleIdx = null;
        this.history = [];
        this.completedBottles = []; // 🌟 화면 왼쪽 아래로 열외된 완성 병들의 색상 목록
        this.isAnimating = false;
        this.moveCount = 0; // 스테이지 시작 시 움직임 횟수 리셋

        // 🌟 스테이지 난이도 공식: 1~2단계 3색 -> 최대 17색 (+ 기본 빈 병 3개 = 총 20개 병)
        const colorCount = Math.min(3 + Math.floor((stageNum - 1) / 2), 17);
        const emptyBottleCount = 3; // 🌟 기본 제공 빈 병 3개
        const selectedColors = PALETTE.slice(0, colorCount);

        let colorPool = [];
        selectedColors.forEach(color => {
            for (let i = 0; i < BOTTLE_CAPACITY; i++) {
                colorPool.push(color);
            }
        });

        // 🌟 시드 기반 난수 생성기 (스테이지 번호마다 항상 같은 색상 배열 보장!)
        let seed = stageNum * 15485863 + 32452843; // 스테이지별 고유 시드
        const pseudoRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        // 시드 난수로 색상 셔플 (초기에 완성된 병이 없도록 검증)
        let isValidShuffle = false;
        let attempts = 0;
        while (!isValidShuffle && attempts < 50) {
            attempts++;
            for (let i = colorPool.length - 1; i > 0; i--) {
                const j = Math.floor(pseudoRandom() * (i + 1));
                [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
            }

            // 초기에 완성된 병(한 가지 색상 4개)이 있는지 검사
            isValidShuffle = true;
            for (let i = 0; i < colorCount; i++) {
                const b = colorPool.slice(i * BOTTLE_CAPACITY, (i + 1) * BOTTLE_CAPACITY);
                if (b.length === BOTTLE_CAPACITY && b.every(c => c === b[0])) {
                    isValidShuffle = false;
                    break;
                }
            }
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
        this.completedBottles = [];
        this.history = [];
        this.render();
    }

    render() {
        this.bottlesContainer.innerHTML = '';
        this.bottlesContainer.className = 'bottles-container';

        if (this.completedContainer) {
            this.completedContainer.innerHTML = '';
        }

        // 🌟 1. 메인 보드 유리병 렌더링 (아직 완성되지 않은 병 및 빈 병)
        this.bottles.forEach((bottle, bIdx) => {
            const isCompleted = (bottle.length === BOTTLE_CAPACITY && bottle.every(c => c === bottle[0]));
            
            // 만약 완성된 병이라면 열외 목록으로 이동하지 않았을 때 처리
            const wrapper = document.createElement('div');
            wrapper.className = 'bottle-wrapper';
            if (this.selectedBottleIdx === bIdx) {
                wrapper.classList.add('selected');
            }
            if (isCompleted) {
                wrapper.classList.add('completed');
            }

            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                // 이미 완성된 병은 클릭 불가능하도록 막음
                if (isCompleted) return;
                this.handleBottleClick(bIdx);
            });

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

        // 🌟 2. 화면 왼쪽 아래 완성 보관함(completed-container) 렌더링
        if (this.completedContainer && this.completedBottles) {
            const totalCount = this.completedBottles.length;
            this.completedBottles.forEach((color, idx) => {
                const wrapper = document.createElement('div');
                // 방금 새로 들어온 마지막 병에만 popIn 애니메이션 적용, 기존 병은 정적 표시
                const isNew = (idx === totalCount - 1);
                wrapper.className = isNew ? 'bottle-wrapper completed newly-added' : 'bottle-wrapper completed';

                const bottleEl = document.createElement('div');
                bottleEl.className = 'bottle';

                const rimEl = document.createElement('div');
                rimEl.className = 'bottle-rim';
                wrapper.appendChild(rimEl);

                // 4칸 모두 동일한 완색
                for (let i = 0; i < BOTTLE_CAPACITY; i++) {
                    const layer = document.createElement('div');
                    layer.className = 'water-layer';
                    layer.style.backgroundColor = color;
                    bottleEl.appendChild(layer);
                }

                wrapper.appendChild(bottleEl);
                this.completedContainer.appendChild(wrapper);
            });
        }
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

            this.moveCount++; // 물을 한 번 부을 때마다 움직임 횟수 +1
            this.selectedBottleIdx = null;
            this.render();

            await new Promise(res => setTimeout(res, 200));

            // 🌟 한 색상으로 가득 찬 물병(완색 병) 자동 검출 후 메인 보드에서 완전히 제거하고 왼쪽 아래 보관함으로 열외 연출
            for (let i = 0; i < this.bottles.length; i++) {
                const b = this.bottles[i];
                if (b.length === BOTTLE_CAPACITY && b.every(c => c === b[0])) {
                    // 완료 효과음 & 팡파르
                    soundEngine.playPop();
                    if (typeof confetti === 'function') {
                        confetti({ particleCount: 25, spread: 40, origin: { x: 0.2, y: 0.8 } });
                    }
                    // 완색 병의 색상을 보관함에 기록하고 메인 병 배열에서 아예 제거 (병 자체가 빠짐)
                    const completedColor = b[0];
                    this.completedBottles.push(completedColor);
                    this.bottles.splice(i, 1);
                    i--; // splice로 인덱스가 당겨졌으므로 재조정
                    this.render();
                    await new Promise(res => setTimeout(res, 250));
                }
            }
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
            // 승리 시 maxStage 갱신 (최고 스테이지는 절대 낮아지지 않음)
            this.maxStage = Math.max(this.maxStage, this.stage + 1);
            // 스테이지 저장 + stage_records 최소 움직임 업데이트
            this.saveProgress();
            this.saveStageRecord(this.stage, this.moveCount);
            setTimeout(() => {
                this.winModal.classList.remove('hidden');
            }, 400);
        }
    }

    // 스테이지 최소 움직임 기록을 stage_records 테이블에 저장 (더 적은 움직임일 때만 갱신)
    async saveStageRecord(stage, moves) {
        if (!this.user) return;
        const nickname = (this.playerData && this.playerData.nickname)
            ? this.playerData.nickname
            : (this.user.email ? this.user.email.split('@')[0] : '플레이어');

        try {
            // 기존 기록 조회
            const { data: existing } = await sbClient
                .from('stage_records')
                .select('moves')
                .eq('user_id', this.user.id)
                .eq('stage', stage)
                .single();

            // 기존 기록이 없거나, 현재 움직임이 더 적으면 갱신
            if (!existing || moves < existing.moves) {
                await sbClient.from('stage_records').upsert({
                    user_id: this.user.id,
                    nickname: nickname,
                    stage: stage,
                    moves: moves,
                    cleared_at: new Date().toISOString()
                }, { onConflict: 'user_id,stage' });
            }
        } catch (e) {
            console.warn('stage_records 저장 오류:', e);
        }
    }

    saveHistory() {
        const snapShot = {
            bottles: this.bottles.map(b => [...b]),
            completedBottles: [...this.completedBottles]
        };
        this.history.push(snapShot);
    }

    undoMove() {
        if (this.isAnimating || this.history.length === 0) return;
        soundEngine.playPop();
        const lastState = this.history.pop();
        this.bottles = lastState.bottles;
        this.completedBottles = lastState.completedBottles || [];
        this.selectedBottleIdx = null;
        this.render();
    }

}

window.addEventListener('DOMContentLoaded', async () => {
    // AuthManager 초기화 (로그인/회원가입 버튼 이벤트 연결)
    window._authManager = new AuthManager();

    // 이미 로그인된 세션이 있으면 로그인 화면 없이 바로 게임으로 이동
    if (window.sbClient && sbClient.auth) {
        try {
            const { data: { session } } = await sbClient.auth.getSession();
            if (session && session.user) {
                await startGameAfterAuth(session.user);
            }
        } catch (e) {
            console.error('세션 확인 오류:', e);
        }
    }
});

// ============================================================
// 🏆 랭킹 (리더보드) 전역 함수
// ============================================================

// 랭킹 모달 열기 + 최고 스테이지 탭 기본 로드
function openRankingModal(currentUser) {
    const modal = document.getElementById('ranking-modal');
    modal.classList.remove('hidden');

    // 스테이지 선택 드롭다운 채우기 (1~현재 스테이지)
    const select = document.getElementById('ranking-stage-select');
    const currentStage = window.gameApp ? window.gameApp.stage : 1;
    select.innerHTML = '';
    for (let i = 1; i <= Math.max(currentStage, 10); i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `STAGE ${i}`;
        select.appendChild(opt);
    }

    // 기본 탭 활성화 및 데이터 로드
    switchRankingTab('top-stage');
    loadTopStageRanking(currentUser);
}

// 랭킹 탭 전환
function switchRankingTab(tab) {
    const topPanel = document.getElementById('ranking-top-stage');
    const movesPanel = document.getElementById('ranking-best-moves');
    const tabTop = document.getElementById('tab-top-stage');
    const tabMoves = document.getElementById('tab-best-moves');

    if (tab === 'top-stage') {
        topPanel.classList.remove('hidden');
        movesPanel.classList.add('hidden');
        tabTop.classList.add('active');
        tabMoves.classList.remove('active');
        const user = window.gameApp ? window.gameApp.user : null;
        loadTopStageRanking(user);
    } else {
        topPanel.classList.add('hidden');
        movesPanel.classList.remove('hidden');
        tabTop.classList.remove('active');
        tabMoves.classList.add('active');
        loadBestMovesRanking();
    }
}

// 최고 스테이지 랭킹 로드 (player_settings 기준)
async function loadTopStageRanking(currentUser) {
    const list = document.getElementById('top-stage-list');
    list.innerHTML = '<div class="ranking-loading">📡 랭킹 불러오는 중...</div>';

    try {
        const { data, error } = await sbClient
            .from('player_settings')
            .select('nickname, max_stage, stage, id')
            .order('max_stage', { ascending: false })
            .limit(10);

        if (error || !data || data.length === 0) {
            list.innerHTML = '<div class="ranking-loading">아직 랭킹 데이터가 없습니다.</div>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = data.map((row, idx) => {
            const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
            const badge = idx < 3 ? medals[idx] : `${idx + 1}`;
            const isMe = currentUser && row.id === currentUser.id;
            const bestStage = row.max_stage || row.stage || 1;
            return `
                <div class="ranking-item ${rankClass}">
                    <div class="rank-badge">${badge}</div>
                    <div class="rank-info">
                        <div class="rank-nickname">
                            ${row.nickname || '플레이어'}
                            ${isMe ? '<span class="rank-me">나</span>' : ''}
                        </div>
                        <div class="rank-detail">최고 달성 스테이지</div>
                    </div>
                    <div class="rank-value">STAGE ${bestStage}</div>
                </div>`;
        }).join('');
    } catch (e) {
        list.innerHTML = '<div class="ranking-loading">⚠️ 랭킹을 불러오지 못했습니다.</div>';
        console.error('Top Stage 랭킹 조회 오류:', e);
    }
}

// 스테이지별 최소 움직임 랭킹 로드 (stage_records 기준)
async function loadBestMovesRanking() {
    const select = document.getElementById('ranking-stage-select');
    const stage = parseInt(select.value, 10);
    const list = document.getElementById('best-moves-list');
    const currentUser = window.gameApp ? window.gameApp.user : null;

    list.innerHTML = '<div class="ranking-loading">📡 랭킹 불러오는 중...</div>';

    try {
        const { data, error } = await sbClient
            .from('stage_records')
            .select('nickname, moves, user_id, cleared_at')
            .eq('stage', stage)
            .order('moves', { ascending: true })
            .limit(10);

        if (error || !data || data.length === 0) {
            list.innerHTML = `<div class="ranking-loading">아직 STAGE ${stage} 기록이 없습니다.<br>첫 번째 도전자가 되어보세요! 🚀</div>`;
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = data.map((row, idx) => {
            const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
            const badge = idx < 3 ? medals[idx] : `${idx + 1}`;
            const isMe = currentUser && row.user_id === currentUser.id;
            const date = row.cleared_at ? new Date(row.cleared_at).toLocaleDateString('ko-KR') : '';
            return `
                <div class="ranking-item ${rankClass}">
                    <div class="rank-badge">${badge}</div>
                    <div class="rank-info">
                        <div class="rank-nickname">
                            ${row.nickname || '플레이어'}
                            ${isMe ? '<span class="rank-me">나</span>' : ''}
                        </div>
                        <div class="rank-detail">${date} 클리어</div>
                    </div>
                    <div class="rank-value">${row.moves}회</div>
                </div>`;
        }).join('');
    } catch (e) {
        list.innerHTML = '<div class="ranking-loading">⚠️ 랭킹을 불러오지 못했습니다.</div>';
        console.error('Best Moves 랭킹 조회 오류:', e);
    }
}
