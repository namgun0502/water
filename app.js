/**
 * ==========================================================================
 * Water Sort Puzzle - Core Application Logic & Sound Engine Upgrade
 * ==========================================================================
 */

// 1. ?¡ì²´ ?‰ìƒ ?Œë ›???•ì˜ (?œê°??êµ¬ë³„???œë ·??20ê°€ì§€ ê³ ë?ë¹??ŒìŠ¤???¤ì˜¨ ?ë§ ?Œë ›??
const PALETTE = [
    '#FF2A55', // 1: Cherry Red (ì²´ë¦¬ ?ˆë“œ)
    '#FF8C00', // 2: Mango Orange (ë§ê³  ì£¼í™©)
    '#FFE600', // 3: Lemon Yellow (?ˆëª¬ ?¸ë‘)
    '#00E676', // 4: Lime Green (?¼ì„ ?°ë‘)
    '#006400', // 5: Forest Green (ì§„í•œ ì´ˆë¡)
    '#00E5FF', // 6: Cyan Sky (ë°ì? ?˜ëŠ˜??
    '#1565C0', // 7: Cobalt Blue (ì§„í•œ ì½”ë°œ???Œë‘)
    '#AA00FF', // 8: Royal Violet (? ëª…??ë³´ë¼)
    '#FF4081', // 9: Berry Pink (ë°ì? ë¶„í™)
    '#E0E0E0', // 10: Pearl Silver (ë°ì? ?€ë°±ìƒ‰)
    '#795548', // 11: Deep Chocolate Brown (ì´ˆì½œë¦?ë¸Œë¼??
    '#FF7043', // 12: Coral Tangerine (ì½”ë„ ? ì?ë¦?
    '#004D40', // 13: Deep Teal (ì§™ì? ì²?¡)
    '#4A148C', // 14: Plum Purple (?ŒëŸ¼ ?¼í”Œ)
    '#D500F9', // 15: Magenta Rose (ë§ˆì  ?€ ë¡œì¦ˆ - ? ê·œ)
    '#827717', // 16: Sage Olive (?¸ì´ì§€ ?¬ë¦¬ë¸?- ? ê·œ)
    '#BF360C', // 17: Deep Caramel (ì¹´ë¼ë©?ë¸Œë¼??- ? ê·œ)
    '#1A237E', // 18: Midnight Navy (ë¯¸ë“œ?˜ì‡ ?¤ì´ë¹?- ? ê·œ)
    '#FFD600', // 19: Deep Bronze Gold (ë¸Œë¡ ì¦?ê³¨ë“œ - ? ê·œ)
    '#A7FFEB'  // 20: Cotton Mint (?œì‚¬??ë¯¼íŠ¸ - ? ê·œ)
];

const BOTTLE_CAPACITY = 4;

// 2. Web Audio API ê¸°ë°˜ ?¤ë””???”ì§„ & 6ì¢?BGM ë°??¬ìš´??ë§¤ë‹ˆ?€
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

    // AudioContext ì´ˆê¸°??ë°?ë¸Œë¼?°ì? ?ë™?¬ìƒ ?œí•œ(Autoplay) ?¤ë¥˜ ?´ê²° ?¨ì¹˜
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // SFX ë°?BGM ?…ë¦½ ë³¼ë¥¨ ?œì–´ ?¸ë“œ êµ¬ì¶•
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.ctx.destination);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = this.bgmVolume;
            this.bgmGain.connect(this.ctx.destination);
        }

        // ?¼ì‹œì¤‘ì? ?íƒœ(suspended) ?´ì œ -> ?Œë¦¬ê°€ ???˜ëŠ” ?¤ë¥˜ 100% ë³´ì¥
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // SFX ?¨ê³¼??ë³¼ë¥¨ ë³€ê²?(0.0 ~ 1.0)
    setSfxVolume(val) {
        this.sfxVolume = val;
        if (this.sfxGain) {
            this.sfxGain.gain.setValueAtTime(val, this.ctx ? this.ctx.currentTime : 0);
        }
    }

    // BGM ë°°ê²½??ë³¼ë¥¨ ë³€ê²?(0.0 ~ 1.0)
    setBgmVolume(val) {
        this.bgmVolume = val;
        if (this.bgmGain) {
            this.bgmGain.gain.setValueAtTime(val, this.ctx ? this.ctx.currentTime : 0);
        }
    }

    // ë³?? íƒ ?¨ê³¼??    playPop() {
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

    // ë¬¼ì„ ë¶“ëŠ” ASMR ë¬¼ë¦¬ ?Œë¦¬
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

    // ?¹ë¦¬ ?´ë¦¬???¡íŒŒë¥?    playWinFanfare() {
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

    // ?µ 6ì¢?BGM ë°°ê²½?Œì•… ?¬ìƒ ë£¨í”„ ì»¨íŠ¸ë¡?    changeBgm(track) {
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

    // 1. Chill Lofi BGM (? ì?: ?¸ì•ˆ??ë¡œíŒŒ??
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

    // 2. Soft Moonlight BGM (? ê·œ: ë¶€?œëŸ¬???¬ë¹› - ë§‘ê³  ë¶€?œëŸ¬???„ë¥´?˜ì???
    startMoonlightBgm() {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63];
        let step = 0;

        const playNote = () => {
            const freq = notes[step % notes.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; // ?„ì£¼ ë¶€?œëŸ¬???¬ì¸??            osc.frequency.value = freq;

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

    // 3. Soft Breeze BGM (? ê·œ: ?”ì”??ë´„ë°”??- ?„ëŠ‘???¼ê°???ë§ ë©œë¡œ??
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

    // 4. Starlight Lullaby BGM (? ê·œ: ?¬ê·¼??ë³„ë¹› - ?¤ë¥´ê³?ê°™ì? ?”ì”??
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

    // 5. Cloud Ambient BGM (? ê·œ: ë¶€?œëŸ¬??êµ¬ë¦„ - ?„ëŠ‘???°ë¹„?¸íŠ¸ ?¨ë“œ)
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

    // 6. Cozy Jazz BGM (ì¹´í˜ ?„ëŠ‘ ?¬ì¦ˆ)
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
// 4. Supabase ?´ë¼?´ì–¸??ì´ˆê¸°??// window.supabase??SDKê°€ ?ë™?¼ë¡œ ë§Œë“œ???„ì—­ë³€?˜ì…?ˆë‹¤.
// ?´ë¦„ ì¶©ëŒ??ë§‰ê¸° ?„í•´ ?°ë¦¬ ë³€?˜ëŠ” sbClientë¡??´ë¦„ì§“ìŠµ?ˆë‹¤.
// ============================================================
const SUPABASE_URL  = 'https://qzhgsshyhmnczmreagqd.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aGdzc2h5aG1uY3ptcmVhZ3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzc0NzksImV4cCI6MjA5Nzg1MzQ3OX0.2NZxyClmIpj7WtUuZtexZqAMuTnC7udF5FejwitzvcU';
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================================
// 5. AuthManager - ë¡œê·¸??/ ?Œì›ê°€??/ ë¡œê·¸?„ì›ƒ ?´ë‹¹
// ============================================================
class AuthManager {
    constructor() {
        // ë¡œê·¸???”ë©´ DOM ?”ì†Œ
        this.authScreen    = document.getElementById('auth-screen');
        this.loginForm     = document.getElementById('login-form');
        this.signupForm    = document.getElementById('signup-form');
        this.loginError    = document.getElementById('login-error');
        this.signupError   = document.getElementById('signup-error');

        this.initAuthEvents();
    }

    // ë¡œê·¸??/ ?Œì›ê°€???´ë²¤???°ê²°
    initAuthEvents() {
        // ë¡œê·¸?????œì¶œ ?´ë²¤??        if (this.loginForm) {
            this.loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // ?Œì›ê°€?????œì¶œ ?´ë²¤??        if (this.signupForm) {
            this.signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSignup();
            });
        }
    }

    // ë¡œê·¸??ì²˜ë¦¬
    async handleLogin() {
        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn      = document.getElementById('btn-login');

        this.hideError('login');

        if (!email) { this.showError('login', '?´ë©”?¼ì„ ?…ë ¥??ì£¼ì„¸??'); return; }
        if (!password) { this.showError('login', 'ë¹„ë?ë²ˆí˜¸ë¥??…ë ¥??ì£¼ì„¸??'); return; }

        btn.disabled = true;
        btn.querySelector('span').textContent = 'ë¡œê·¸??ì¤?..';

        try {
            const { data, error } = await sbClient.auth.signInWithPassword({ email, password });

            if (error) {
                this.showError('login', error.message || '?´ë©”???ëŠ” ë¹„ë?ë²ˆí˜¸ê°€ ?¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.');
                return;
            }

            // ë¡œê·¸???±ê³µ ??ê²Œì„ ?œì‘
            await startGameAfterAuth(data.user);
        } catch (err) {
            console.error('ë¡œê·¸???ëŸ¬:', err);
            this.showError('login', 'ë¡œê·¸??ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
        } finally {
            btn.disabled = false;
            btn.querySelector('span').textContent = 'ë¡œê·¸??;
        }
    }

    // ?Œì›ê°€??ì²˜ë¦¬
    async handleSignup() {
        const nicknameEl = document.getElementById('signup-nickname');
        const emailEl    = document.getElementById('signup-email');
        const passwordEl = document.getElementById('signup-password');
        const btn        = document.getElementById('btn-signup');

        const nickname = nicknameEl ? nicknameEl.value.trim() : '';
        const email    = emailEl ? emailEl.value.trim() : '';
        const password = passwordEl ? passwordEl.value : '';

        this.hideError('signup');

        if (!nickname) { alert('?‰ë„¤?„ì„ ?…ë ¥??ì£¼ì„¸??'); this.showError('signup', '?‰ë„¤?„ì„ ?…ë ¥??ì£¼ì„¸??'); return; }
        if (!email) { alert('?´ë©”?¼ì„ ?…ë ¥??ì£¼ì„¸??'); this.showError('signup', '?´ë©”?¼ì„ ?…ë ¥??ì£¼ì„¸??'); return; }
        if (password.length < 6) { alert('ë¹„ë?ë²ˆí˜¸??6?ë¦¬ ?´ìƒ?´ì–´???©ë‹ˆ??'); this.showError('signup', 'ë¹„ë?ë²ˆí˜¸??6?ë¦¬ ?´ìƒ?´ì–´???©ë‹ˆ??'); return; }

        btn.disabled = true;
        const btnSpan = btn.querySelector('span');
        if (btnSpan) btnSpan.textContent = 'ê°€??ì¤?..';

        try {
            // Supabase Authë¡??Œì›ê°€??            const { data: signUpData, error: signUpError } = await sbClient.auth.signUp({ email, password });

            if (signUpError) {
                alert('?Œì›ê°€???¤íŒ¨: ' + (signUpError.message || '?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.'));
                this.showError('signup', signUpError.message || '?´ë? ?¬ìš© ì¤‘ì¸ ?´ë©”?¼ì´ê±°ë‚˜ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
                return;
            }

            let finalUser = signUpData ? signUpData.user : null;
            if (!signUpData || !signUpData.session) {
                const { data: signInData, error: signInError } = await sbClient.auth.signInWithPassword({ email, password });
                if (signInError || !signInData || !signInData.user) {
                    alert('ê°€?…ì? ?„ë£Œ?˜ì—ˆ?µë‹ˆ?? ë¡œê·¸????—??ë¡œê·¸?¸í•´ ì£¼ì„¸??');
                    this.showError('signup', 'ê°€???„ë£Œ! ë¡œê·¸????—??ë¡œê·¸?¸í•´ ì£¼ì„¸??');
                    switchTab('login');
                    return;
                }
                finalUser = signInData.user;
            }

            if (finalUser) {
                // DB??ì´ˆê¸° ?Œë ˆ?´ì–´ ?¤ì • ?€??                await sbClient.from('player_settings').upsert({
                    id: finalUser.id,
                    nickname: nickname,
                    stage: 1,
                    bg_theme: 'deep-space',
                    bgm_track: 'lofi',
                    bgm_volume: 60,
                    sfx_volume: 80
                });

                alert('?Œì›ê°€???±ê³µ! ê²Œì„???œì‘?©ë‹ˆ??');
                // ê°€??+ ë¡œê·¸???±ê³µ ????ê²Œì„ ?œì‘
                await startGameAfterAuth(finalUser, true);
            }
        } catch (err) {
            console.error('?Œì›ê°€???ëŸ¬:', err);
            alert('?Œì›ê°€??ì²˜ë¦¬ ì¤??¤ë¥˜ ë°œìƒ: ' + err.message);
            this.showError('signup', '?Œì›ê°€??ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
        } finally {
            btn.disabled = false;
            if (btnSpan) btnSpan.textContent = '?Œì›ê°€??;
        }
    }

    // ?¤ë¥˜ ë©”ì‹œì§€ ?œì‹œ
    showError(type, msg) {
        const el = type === 'login' ? this.loginError : this.signupError;
        el.textContent = msg;
        el.classList.remove('hidden');
    }

    // ?¤ë¥˜ ë©”ì‹œì§€ ?¨ê¸°ê¸?    hideError(type) {
        const el = type === 'login' ? this.loginError : this.signupError;
        el.classList.add('hidden');
    }

    // ë¡œê·¸???”ë©´ ?¨ê¸°ê¸?    hideAuthScreen() {
        this.authScreen.classList.add('hidden');
    }
}

// ============================================================
// 6. PlayerDataManager - Supabase?ì„œ ?Œë ˆ?´ì–´ ?¤ì • ?€??ë¶ˆëŸ¬?¤ê¸°
// ============================================================
class PlayerDataManager {
    constructor(userId) {
        this.userId = userId; // ?„ì¬ ë¡œê·¸?¸í•œ ?¬ìš©??ê³ ìœ  ID
    }

    // Supabase?ì„œ ???¤ì • ë¶ˆëŸ¬?¤ê¸°
    async load() {
        const { data, error } = await supabase
            .from('player_settings')
            .select('*')
            .eq('id', this.userId)
            .single();

        if (error || !data) return null;
        return data;
    }

    // Supabase???„ì¬ ?¤ì • ?€??(?¤í…Œ?´ì?, ë°°ê²½, BGM, ë³¼ë¥¨)
    async save(settings) {
        await supabase
            .from('player_settings')
            .update({ ...settings, updated_at: new Date().toISOString() })
            .eq('id', this.userId);
    }
}

// ???„í™˜ ?„ì—­ ?¨ìˆ˜ (HTML onclick?ì„œ ?¸ì¶œ)
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

// HTML onclick ?„ì—­ ?¸ë“¤??async function handleLoginAction() {
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

// ë¡œê·¸???±ê³µ ???´ì–´???ˆë¡œ ?œì‘ ? íƒ ë°?ê²Œì„ ì´ˆê¸°??async function startGameAfterAuth(user, isNewUser = false) {
    const authManager = window._authManager;
    authManager.hideAuthScreen();

    const playerData = new PlayerDataManager(user.id);
    const settings   = await playerData.load();

    if (isNewUser || !settings || settings.stage <= 1) {
        // ??? ì? ?ëŠ” ?¤í…Œ?´ì? 1?´ë©´ ë°”ë¡œ ?œì‘
        window.gameApp = new WaterSortGame(user, playerData, settings, false);
        document.getElementById('app').classList.remove('hidden');
        return;
    }

    // ?€?¥ëœ ?¤í…Œ?´ì?ê°€ 2 ?´ìƒ?´ë©´ ? íƒ ëª¨ë‹¬ ?œì‹œ
    const continueModal = document.getElementById('continue-modal');
    document.getElementById('continue-welcome').textContent =
        `${settings.nickname}?? ë°˜ê°‘?µë‹ˆ??`;
    document.getElementById('continue-info').textContent =
        `ë§ˆì?ë§‰ìœ¼ë¡?ì§„í–‰???¤í…Œ?´ì?: ${settings.stage}?¨ê³„`;
    continueModal.classList.remove('hidden');
    document.getElementById('app').classList.remove('hidden');

    // ?´ì–´??ì§„í–‰ ë²„íŠ¼
    document.getElementById('btn-continue').onclick = () => {
        continueModal.classList.add('hidden');
        window.gameApp = new WaterSortGame(user, playerData, settings, true); // ?´ì–´??    };

    // ì²˜ìŒë¶€???œì‘ ë²„íŠ¼
    document.getElementById('btn-new-game').onclick = () => {
        continueModal.classList.add('hidden');
        window.gameApp = new WaterSortGame(user, playerData, settings, false); // ì²˜ìŒë¶€??    };
}


// 3. ë©”ì¸ ê²Œì„ ?´ë˜??(WaterSortGame)
class WaterSortGame {
    // user: ë¡œê·¸???•ë³´, playerData: DB ?€??ë§¤ë‹ˆ?€,
    // settings: ?€?¥ëœ ?¤ì •ê°? isContinue: ?´ì–´??ì§„í–‰ ?¬ë?
    constructor(user, playerData, settings, isContinue) {
        this.user        = user;
        this.playerData  = playerData; // PlayerDataManager ?¸ìŠ¤?´ìŠ¤
        this.stage       = (isContinue && settings) ? (settings.stage || 1) : 1;
        this.bottles     = [];
        this.selectedBottleIdx = null;
        this.history     = [];
        this.bonusBottlesCount = 1;
        this.isAnimating = false;
        this.currentBgTheme = (settings && settings.bg_theme) ? settings.bg_theme : 'deep-space';

        // DOM ?”ì†Œ
        this.bottlesContainer = document.getElementById('bottles-container');
        this.stageNumEl       = document.getElementById('stage-number');
        this.winModal         = document.getElementById('win-modal');
        this.infoModal        = document.getElementById('info-modal');
        this.soundModal       = document.getElementById('sound-modal');
        this.appEl            = document.getElementById('app');

        this.bgmSelect       = document.getElementById('bgm-select');
        this.bgThemeSelect   = document.getElementById('bg-theme-select');
        this.bgmVolumeSlider = document.getElementById('bgm-volume');
        this.sfxVolumeSlider = document.getElementById('sfx-volume');
        this.bgmValText      = document.getElementById('bgm-val-text');
        this.sfxValText      = document.getElementById('sfx-val-text');

        // ?€?¥ëœ ?¤ì •??UI??ì¦‰ì‹œ ë°˜ì˜
        this.applyBgTheme(this.currentBgTheme);
        if (settings) this.applySettings(settings);

        this.initEvents();
        this.startStage(this.stage);
    }

    // Supabase?ì„œ ë¶ˆëŸ¬???¤ì •ê°’ì„ UI ?¬ë¼?´ë”/?œë¡­?¤ìš´??ë°˜ì˜
    applySettings(settings) {
        // BGM ?¸ë™ UI ?™ê¸°??        if (this.bgmSelect && settings.bgm_track) {
            this.bgmSelect.value = settings.bgm_track;
        }
        // BGM ë³¼ë¥¨ UI ?™ê¸°??        if (settings.bgm_volume !== undefined) {
            this.bgmVolumeSlider.value = settings.bgm_volume;
            this.bgmValText.textContent = `${settings.bgm_volume}%`;
            soundEngine.setBgmVolume(settings.bgm_volume / 100);
        }
        // SFX ë³¼ë¥¨ UI ?™ê¸°??        if (settings.sfx_volume !== undefined) {
            this.sfxVolumeSlider.value = settings.sfx_volume;
            this.sfxValText.textContent = `${settings.sfx_volume}%`;
            soundEngine.setSfxVolume(settings.sfx_volume / 100);
        }
        // ?€?¥ëœ BGM ?¬ìƒ (?œë ˆ?????œì‘)
        const track = settings.bgm_track || 'lofi';
        setTimeout(() => soundEngine.changeBgm(track), 500);
    }

    // ?„ì¬ ?¤ì •??Supabase DB???€??    async saveProgress() {
        if (!this.playerData) return;
        await this.playerData.save({
            stage:      this.stage,
            bg_theme:   this.currentBgTheme,
            bgm_track:  this.bgmSelect ? this.bgmSelect.value : 'lofi',
            bgm_volume: this.bgmVolumeSlider ? parseInt(this.bgmVolumeSlider.value, 10) : 60,
            sfx_volume: this.sfxVolumeSlider ? parseInt(this.sfxVolumeSlider.value, 10) : 80
        });
    }

    // ë°°ê²½ ?Œë§ˆë¥?#app??data-theme ?ì„±?¼ë¡œ ?ìš©
    applyBgTheme(theme) {
        this.currentBgTheme = theme;
        this.appEl.setAttribute('data-theme', theme);
        if (this.bgThemeSelect) this.bgThemeSelect.value = theme;
    }

    initEvents() {
        // ?´ëŠ ?„ì¹˜??ì²??°ì¹˜ ??AudioContext resume ?¸ì¶œ (?Œë¦¬ ?¤ë¥˜ 100% ë°©ì?)
        const unlockAudio = () => {
            soundEngine.init();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        // ?¬ìš´???¤ì • ëª¨ë‹¬ ?´ê¸°/?«ê¸°
        document.getElementById('btn-sound-settings').addEventListener('click', () => {
            soundEngine.init();
            this.soundModal.classList.remove('hidden');
        });
        document.getElementById('btn-close-sound').addEventListener('click', () => {
            this.soundModal.classList.add('hidden');
            this.saveProgress(); // ëª¨ë‹¬ ?«ì„ ???¤ì • ?ë™ ?€??        });

        // ë°°ê²½ ?Œë§ˆ ë³€ê²??´ë²¤??        this.bgThemeSelect.addEventListener('change', (e) => {
            this.applyBgTheme(e.target.value);
            soundEngine.playPop();
        });

        // BGM ?¸ë™ ë³€ê²??´ë²¤??        this.bgmSelect.addEventListener('change', (e) => {
            soundEngine.changeBgm(e.target.value);
        });

        // BGM ë³¼ë¥¨ ?¬ë¼?´ë”
        this.bgmVolumeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            this.bgmValText.textContent = `${val}%`;
            soundEngine.setBgmVolume(val / 100);
        });

        // SFX ?¨ê³¼??ë³¼ë¥¨ ?¬ë¼?´ë”
        this.sfxVolumeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            this.sfxValText.textContent = `${val}%`;
            soundEngine.setSfxVolume(val / 100);
        });

        // ?„ì?ë§?ëª¨ë‹¬
        document.getElementById('btn-info') && document.getElementById('btn-info').addEventListener('click', () => {
            this.infoModal.classList.remove('hidden');
        });
        document.getElementById('btn-close-info').addEventListener('click', () => {
            this.infoModal.classList.add('hidden');
        });

        // ë¡œê·¸?„ì›ƒ ë²„íŠ¼
        document.getElementById('btn-logout').addEventListener('click', async () => {
            soundEngine.stopBgm();
            await sbClient.auth.signOut();
            // ?˜ì´ì§€ ?ˆë¡œê³ ì¹¨?¼ë¡œ ë¡œê·¸???”ë©´?¼ë¡œ ?Œì•„ê°€ê¸?            window.location.reload();
        });

        // ?˜ëŒë¦¬ê¸°, ?¬ì‹œ?? ?¤ìŒ ?¨ê³„
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetStage());

        document.getElementById('btn-next-stage').addEventListener('click', () => {
            this.winModal.classList.add('hidden');
            this.stage++;
            this.saveProgress(); // ?¤ìŒ ?¤í…Œ?´ì? Supabase???€??            this.startStage(this.stage);
        });

        // ?ŒŸ ë°°ê²½ ë°”ê¹¥ ?ì—­ ?°ì¹˜/?´ë¦­ ??ë³?? íƒ ì·¨ì†Œ (Deselect)
        this.bottlesContainer.parentElement.addEventListener('click', (e) => {
            if (!e.target.closest('.bottle-wrapper') && this.selectedBottleIdx !== null && !this.isAnimating) {
                soundEngine.playPop();
                this.selectedBottleIdx = null;
                this.render();
            }
        });
    }

    // ?ˆë¡œ???¤í…Œ?´ì? ?œì‘ (?‰ìƒ ?ì„± ë°?ì´ˆê¸° ?”í”Œ)
    startStage(stageNum) {
        this.stageNumEl.textContent = stageNum;
        this.selectedBottleIdx = null;
        this.history = [];
        this.isAnimating = false;

        // ?ŒŸ ?¤í…Œ?´ì? ?œì´??ê³µì‹: 1~2?¨ê³„ 3??-> ìµœë? 17??(+ ê¸°ë³¸ ë¹?ë³?3ê°?= ì´?20ê°?ë³?
        const colorCount = Math.min(3 + Math.floor((stageNum - 1) / 2), 17);
        const emptyBottleCount = 3; // ?ŒŸ ê¸°ë³¸ ?œê³µ ë¹?ë³‘ì„ 3ê°œë¡œ ?•ì¥?˜ì—¬ ?¬ì‹œ???œì—??ì¾Œì ??ë³´ì¥!
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

        // ?ŒŸ ?¤í…Œ?´ì? ìµœì´ˆ ?íƒœ ë³´ê? (?¬ì‹œ?????ë˜ ë°°ì¹˜ ê·¸ë?ë¡?ë³µì›?˜ê¸° ?„í•¨)
        this.initialBottles = this.bottles.map(b => [...b]);

        this.render();
    }

    // ?ŒŸ ?„ì¬ ?¤í…Œ?´ì? ?¬ì‹œ??(?ë˜ ì²˜ìŒ ?ì„±?˜ì—ˆ??ë°°ì¹˜ ê·¸ë?ë¡?ë³µì›)
    resetStage() {
        if (this.isAnimating) return;
        soundEngine.playPop();
        
        // ì²˜ìŒ ë°°ì¹˜ ?íƒœ ê·¸ë?ë¡??ë³µ
        this.bottles = this.initialBottles.map(b => [...b]);
        this.selectedBottleIdx = null;
        this.history = [];
        this.render();
    }

    render() {
        this.bottlesContainer.innerHTML = '';
        this.bottlesContainer.className = 'bottles-container';

        this.bottles.forEach((bottle, bIdx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'bottle-wrapper';
            if (this.selectedBottleIdx === bIdx) {
                wrapper.classList.add('selected');
            }

            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
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
    }

    // ? ë¦¬ë³??°ì¹˜/?´ë¦­ ì²˜ë¦¬ (? íƒ ?´ì œ ë°?ë¶€???´ê¸°)
    handleBottleClick(bIdx) {
        if (this.isAnimating) return;

        // 1. ?´ë? ? íƒ??ë³‘ì„ ?¤ì‹œ ?„ë¥´ë©?-> ? íƒ ì¦‰ì‹œ ì·¨ì†Œ!
        if (this.selectedBottleIdx === bIdx) {
            soundEngine.playPop();
            this.selectedBottleIdx = null;
            this.render();
            return;
        }

        // 2. ? íƒ??ë³‘ì´ ?†ì„ ??-> ?ˆë¡œ??ë³?? íƒ
        if (this.selectedBottleIdx === null) {
            if (this.bottles[bIdx].length === 0) return;
            soundEngine.playPop();
            this.selectedBottleIdx = bIdx;
            this.render();
            return;
        }

        // 3. ë¬???¸°ê¸??œë„
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
        if (fromBottle.length === 0) return false; // ??¸¸ ?¡ì²´ê°€ ?†ìŒ
        if (toBottle.length >= BOTTLE_CAPACITY) return false; // ë°›ëŠ” ë³‘ì´ ê½?ì°¨ìˆ??
        const topColorFrom = fromBottle[fromBottle.length - 1];

        if (toBottle.length === 0) return true; // ë°›ëŠ” ë³‘ì´ ë¹„ì–´?ˆìœ¼ë©??¸ì œ??ê°€??        const topColorTo = toBottle[toBottle.length - 1];

        // ?ŒŸ ?€?Œë¬¸??êµ¬ë¬¸ ë°?ê³µë°± ì°¨ì´ ?¤ë¥˜ ë°©ì?ë¥??„í•´ toUpperCase()ë¡??¸ë¦¼ ë¹„êµ
        return topColorFrom.trim().toUpperCase() === topColorTo.trim().toUpperCase();
    }

    async pourWater(fromIdx, toIdx) {
        this.isAnimating = true;
        
        try {
            const fromBottle = this.bottles[fromIdx];
            const toBottle = this.bottles[toIdx];

            if (!fromBottle || fromBottle.length === 0) return;

            const pourColor = fromBottle[fromBottle.length - 1];

            // ?´ë™???™ì¼???‰ìƒ???¡ì²´ ì¸?ê°œìˆ˜ ê³„ì‚°
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

            // ë¬??Œë¦¬ ?¬ìƒ
            soundEngine.playPourSound(actualPourCount * 300);

            // ?¤ì œ ë¬??°ì´???´ë™
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
            // ?ŒŸ ë¬´ìŠ¨ ?¼ì´ ?ˆì–´??isAnimating???´ì œ?˜ì—¬ ë³??°ì¹˜ê°€ ë§‰íˆ???„ìƒ ë°©ì?
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

window.addEventListener('DOMContentLoaded', async () => {
    // AuthManager ì´ˆê¸°??(ë¡œê·¸???Œì›ê°€??ë²„íŠ¼ ?´ë²¤???°ê²°)
    window._authManager = new AuthManager();

    // ?´ë? ë¡œê·¸?¸ëœ ?¸ì…˜???ˆìœ¼ë©?ë¡œê·¸???”ë©´ ?†ì´ ë°”ë¡œ ê²Œì„?¼ë¡œ ?´ë™
    if (supabase) {
        try {
            const { data: { session } } = await sbClient.auth.getSession();
            if (session && session.user) {
                await startGameAfterAuth(session.user);
            }
        } catch (e) {
            console.error('?¸ì…˜ ?•ì¸ ?¤ë¥˜:', e);
        }
    }
});


