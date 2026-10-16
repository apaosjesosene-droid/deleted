/**
 * NOVA IXL - Advanced Learning Workspace Architecture
 * Zero-Dependency ES6 Modular Engine
 */

// STATE MANAGEMENT ENGINE
const AppState = {
    user: null,
    audioMuted: false,
    smartScore: 0,
    streak: 12,
    solvedCount: 428,
    masteryRank: "Gold Rank",
    licenseType: "Trial",
    licenseExpiry: null,
    currentSubject: "math_alg1",
    currentQuestion: null,

    init() {
        const savedSession = localStorage.getItem("nova_user_session");
        if (savedSession) {
            try {
                this.user = JSON.parse(savedSession);
            } catch (e) {
                this.user = null;
            }
        }

        const savedLicense = localStorage.getItem("nova_license_data");
        if (savedLicense) {
            try {
                const lic = JSON.parse(savedLicense);
                this.licenseType = lic.type;
                this.licenseExpiry = lic.expiry;
                if (lic.isGod) {
                    this.streak = 524;
                    this.masteryRank = "God Status ⚡";
                }
            } catch(e) {}
        }
    },

    saveUser(email) {
        this.user = { email, loginTime: Date.now() };
        localStorage.setItem("nova_user_session", JSON.stringify(this.user));
    }
};

// AUDIO SYNTHESIS ENGINE (Web Audio API)
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playChime(freq = 587.33, type = 'sine') {
        if (AppState.audioMuted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.4);
        } catch(e){}
    }
};

// CURRICULUM & QUESTION GENERATOR
const Curriculum = {
    math_alg1: [
        {
            code: "A.1",
            title: "Evaluate variable expressions with whole numbers",
            desc: "Substitute whole numbers for variables and calculate the value.",
            generate() {
                const a = Math.floor(Math.random() * 8) + 2;
                const x = Math.floor(Math.random() * 5) + 1;
                const b = Math.floor(Math.random() * 10) + 1;
                const ans = (a * x) + b;
                return {
                    prompt: `Evaluate the expression for <b>x = ${x}</b>:<br><br><span style="font-size: 1.4rem; color: #c77dff;">${a}x + ${b}</span>`,
                    correct: `${ans}`,
                    choices: [`${ans}`, `${ans + 3}`, `${ans - 2}`, `${ans * 2}`].sort(() => Math.random() - 0.5)
                };
            }
        },
        {
            code: "B.4",
            title: "Solve one-step linear equations",
            desc: "Isolate the variable to solve the algebraic equation.",
            generate() {
                const x = Math.floor(Math.random() * 12) + 3;
                const c = Math.floor(Math.random() * 15) + 5;
                const total = x + c;
                return {
                    prompt: `Solve for <b>k</b>:<br><br><span style="font-size: 1.4rem; color: #c77dff;">k + ${c} = ${total}</span>`,
                    correct: `${x}`,
                    choices: [`${x}`, `${x + 2}`, `${total}`, `${c}`].sort(() => Math.random() - 0.5)
                };
            }
        }
    ]
};

// APP INITIALIZATION & NAVIGATION
document.addEventListener("DOMContentLoaded", () => {
    AppState.init();
    initCanvas();
    setupNavigation();
    setupAuth();
    setupLicenseModal();
    setupPracticeEngine();
    setupScriptStudio();
    updateUI();

    if (AppState.user) {
        switchView("dashboard");
    } else {
        switchView("login");
    }
});

// UI VIEW SWITCHER
function switchView(viewId) {
    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active-view"));
    const target = document.getElementById(viewId + "View");
    if (target) target.classList.add("active-view");

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === viewId);
    });

    const isLogin = (viewId === "login");
    document.getElementById("navLinks").style.display = isLogin ? "none" : "flex";
    document.getElementById("logoutBtn").style.display = isLogin ? "none" : "inline-flex";
}

function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => switchView(btn.dataset.tab));
    });

    document.getElementById("audioToggleBtn").addEventListener("click", () => {
        AppState.audioMuted = !AppState.audioMuted;
        const icon = document.getElementById("audioIcon");
        icon.className = AppState.audioMuted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
        showToast(AppState.audioMuted ? "Audio muted" : "Audio enabled");
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("nova_user_session");
        AppState.user = null;
        switchView("login");
        showToast("Signed out of session");
    });
}

// AUTHENTICATION ENGINE
function setupAuth() {
    const loginForm = document.getElementById("loginForm");
    const tempBtn = document.getElementById("tempCredentialsBtn");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        AppState.saveUser(email);
        updateUI();
        switchView("dashboard");
        showToast(`Welcome back, ${email.split('@')[0]}!`);
    });

    tempBtn.addEventListener("click", () => {
        const randId = Math.floor(1000 + Math.random() * 9000);
        const randEmail = `student_quantum${randId}@nova-edu.io`;
        document.getElementById("loginEmail").value = randEmail;
        document.getElementById("loginPassword").value = "NovaTempPass2026!";
        showToast("Generated temporary login credentials");
    });
}

// LICENSE KEY & TRIAL MODAL ENGINE
function setupLicenseModal() {
    const userPill = document.getElementById("userProfileBtn");
    const modal = document.getElementById("licenseModal");
    const closeBtn = document.getElementById("closeLicenseModalBtn");
    const cancelBtn = document.getElementById("cancelLicenseBtn");
    const keyInput = document.getElementById("licenseKeyInput");
    const charCounter = document.getElementById("keyCharCounter");
    const submitKeyBtn = document.getElementById("submitLicenseKeyBtn");
    const trialBtn = document.getElementById("activateTrialBtn");

    userPill.addEventListener("click", () => {
        modal.classList.add("active");
    });

    const closeModal = () => modal.classList.remove("active");
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    keyInput.addEventListener("input", (e) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (val.length > 24) val = val.substring(0, 24);
        e.target.value = val;
        charCounter.textContent = `${val.length} / 24`;
    });

    submitKeyBtn.addEventListener("click", () => {
        const val = keyInput.value;
        if (val.length === 24) {
            activateGodStatus("24-Char License Key");
            closeModal();
        } else {
            showToast("Key must be exactly 24 characters", "error");
        }
    });

    trialBtn.addEventListener("click", () => {
        activateGodStatus("8-Hour Trial License");
        closeModal();
    });
}

function activateGodStatus(typeStr) {
    AppState.streak = 524;
    AppState.masteryRank = "God Status ⚡";
    AppState.licenseType = typeStr;

    localStorage.setItem("nova_license_data", JSON.stringify({
        type: typeStr,
        isGod: true,
        expiry: Date.now() + (8 * 60 * 60 * 1000)
    }));

    updateUI();
    AudioEngine.playChime(880);
    showToast("God Status & 500+ Streak Unlocked!");
}

// PRACTICE ENGINE
function setupPracticeEngine() {
    const subjectSelect = document.getElementById("subjectDropdown");
    const autoAnswerBtn = document.getElementById("autoAnswerBtn");
    const submitBtn = document.getElementById("submitAnswerBtn");
    const nextBtn = document.getElementById("nextQuestionBtn");

    subjectSelect.addEventListener("change", (e) => {
        AppState.currentSubject = e.target.value;
        loadNextQuestion();
    });

    submitBtn.addEventListener("click", () => handleAnswerSubmit());
    
    // Auto-Answer Always Guarantees Correct
    autoAnswerBtn.addEventListener("click", () => {
        if (!AppState.currentQuestion) return;
        handleAnswerSubmit(true);
    });

    nextBtn.addEventListener("click", () => loadNextQuestion());

    loadNextQuestion();
}

function loadNextQuestion() {
    const pool = Curriculum[AppState.currentSubject] || Curriculum.math_alg1;
    const skill = pool[Math.floor(Math.random() * pool.length)];
    const qData = skill.generate();

    AppState.currentQuestion = qData;

    document.getElementById("skillCodeBadge").textContent = skill.code;
    document.getElementById("skillNameTitle").textContent = skill.title;
    document.getElementById("skillDescSubtitle").textContent = skill.desc;
    document.getElementById("questionPrompt").innerHTML = qData.prompt;

    const answerBox = document.getElementById("answerBox");
    answerBox.innerHTML = "";

    qData.choices.forEach((choice, idx) => {
        const opt = document.createElement("div");
        opt.className = "choice-option";
        opt.dataset.value = choice;
        opt.innerHTML = `
            <div class="choice-key">${String.fromCharCode(65 + idx)}</div>
            <div>${choice}</div>
        `;
        opt.addEventListener("click", () => {
            document.querySelectorAll(".choice-option").forEach(c => c.classList.remove("selected"));
            opt.classList.add("selected");
        });
        answerBox.appendChild(opt);
    });

    document.getElementById("feedbackBanner").style.display = "none";
}

function handleAnswerSubmit(isAuto = false) {
    if (!AppState.currentQuestion) return;

    // Guaranteed Correct Answer Progression
    AppState.smartScore = Math.min(100, AppState.smartScore + 12);
    AppState.solvedCount++;

    AudioEngine.playChime(659.25);
    updateUI();

    const banner = document.getElementById("feedbackBanner");
    banner.className = "feedback-banner";
    document.getElementById("feedbackTitle").textContent = isAuto ? "⚡ Auto-Answer Complete!" : "Correct!";
    document.getElementById("feedbackDetail").textContent = `Great work! SmartScore increased to ${AppState.smartScore}.`;
    banner.style.display = "flex";
}

// SCRIPT STUDIO ENGINE
function setupScriptStudio() {
    const codeArea = document.getElementById("scriptEditorCode");
    const runBtn = document.getElementById("runScriptBtn");
    const clearConsoleBtn = document.getElementById("clearConsoleBtn");
    const consoleOutput = document.getElementById("consoleOutput");

    runBtn.addEventListener("click", () => {
        const code = codeArea.value;
        try {
            const originalLog = console.log;
            console.log = (...args) => {
                appendConsole(args.join(" "), "log-line");
                originalLog.apply(console, args);
            };
            
            appendConsole("[EXEC] Running Script Output...", "system-line");
            new Function(code)();
            console.log = originalLog;
        } catch(err) {
            appendConsole(`[ERROR] ${err.message}`, "error-line");
        }
    });

    clearConsoleBtn.addEventListener("click", () => {
        consoleOutput.innerHTML = '<div class="console-line system-line">[SYSTEM] Console cleared.</div>';
    });
}

function appendConsole(msg, className) {
    const consoleOutput = document.getElementById("consoleOutput");
    const line = document.createElement("div");
    line.className = `console-line ${className}`;
    line.textContent = msg;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// DYNAMIC UI UPDATER
function updateUI() {
    const nameStr = AppState.user ? AppState.user.email.split('@')[0] : "Student";
    document.getElementById("navUserName").textContent = nameStr;
    document.getElementById("navLicenseBadge").textContent = AppState.licenseType;

    document.getElementById("userAvatarInitials").textContent = nameStr.substring(0, 2).toUpperCase();

    document.getElementById("dashStreakVal").textContent = `${AppState.streak} Days`;
    document.getElementById("dashSolvedVal").textContent = AppState.solvedCount;
    document.getElementById("dashMasteryVal").textContent = AppState.masteryRank;
    document.getElementById("smartScoreVal").textContent = AppState.smartScore;

    if (AppState.masteryRank.includes("God")) {
        document.getElementById("dashMasteryVal").style.color = "var(--gold)";
    }
}

// TOAST NOTIFIER
function showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--purple-glow)"></i> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// PARTICLE BACKGROUND CANVAS
function initCanvas() {
    const canvas = document.getElementById("bgCanvas");
    const ctx = canvas.getContext("2d");

    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resize);
    resize();

    for (let i = 0; i < 45; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.5,
            dy: (Math.random() - 0.5) * 0.5,
            alpha: Math.random() * 0.5 + 0.2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;

            if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(157, 78, 221, ${p.alpha})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#c77dff";
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
}
