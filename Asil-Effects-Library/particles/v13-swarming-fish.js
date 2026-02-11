/**
 * Antigravity Engine V12: Magnetic Dash & Confetti Flow
 * - Idle Mode: Particles flow like magnetic field lines (dashes).
 * - Light Mode: Multi-colored confetti mix (Google Style).
 * - Dark Mode: Neon Blue/Cyan stream.
 * - Active Mode: Standard Rainbow Wave shapes (Avatar, Text, Icons).
 */
document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-btn');
    const langOptions = document.querySelectorAll('.lang-option');
    const profileName = document.getElementById('profile-name');
    const avatarImg = document.querySelector('.avatar-img');

    // Theme & Lang
    themeBtn.addEventListener('click', () => {
        const t = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', t);
        themeBtn.innerHTML = t === 'dark' ? '<i class="ph-bold ph-moon"></i>' : '<i class="ph-bold ph-sun"></i>';
        particles.forEach(p => p.setIdleColor());
    });
    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            updateLang(opt.getAttribute('data-lang'));
        });
    });
    function updateLang(lang) {
        const d = {
            en: { bio: "Creative Developer | AI & Vibe Coding Enthusiast", p: "Portfolio", pr: "Projects", m: "Music", c: "Contact" },
            uz: { bio: "Raqamli olam ijodkori | AI va Vibe Coding ishqibozi", p: "Portfolio", pr: "Loyihalar", m: "Musiqa", c: "Bog'lanish" },
            ru: { bio: "Креативный разработчик | AI & Vibe Coding Энтузиаст", p: "Портфолио", pr: "Проекты", m: "Музыка", c: "Контакты" }
        };
        const t = d[lang];
        document.querySelector('#profile-bio').innerText = t.bio;
        const b = document.querySelectorAll('.link-btn span');
        b[0].innerText = t.p; b[1].innerText = t.pr; b[2].innerText = t.m; b[3].innerText = t.c;
    }

    // Engine Setup
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    const ghost = document.createElement('canvas'); const gctx = ghost.getContext('2d', { willReadFrequently: true });

    let w, h, particles = [];
    const count = 3500;
    const mouse = { x: -1000, y: -1000, radius: 150 };
    let targets = [];
    let currentType = null;
    let cardRect = { l: 0, r: 0 };
    let time = 0;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        // Compact card width
        const cw = Math.min(600, w * 0.95);
        const cl = (w - cw) / 2;
        cardRect = { l: cl, r: cl + cw };
    }

    // Simplex Noise (Minimal)
    const Simplex = { perm: new Uint8Array(512), grad3: [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]], p: [], gradP: new Float32Array(512 * 3), init() { for (let i = 0; i < 256; i++)this.p[i] = Math.floor(Math.random() * 256); for (let i = 0; i < 512; i++) { const v = this.perm[i] = this.p[i & 255]; this.grad3[v % 12].forEach((g, k) => this.gradP[i * 3 + k] = g) } }, dot(g, x, y) { return g[0] * x + g[1] * y }, noise(xin, yin) { const F2 = 0.5 * (Math.sqrt(3) - 1), s = (xin + yin) * F2, i = Math.floor(xin + s), j = Math.floor(yin + s), G2 = (3 - Math.sqrt(3)) / 6, t = (i + j) * G2, X0 = i - t, Y0 = j - t, x0 = xin - X0, y0 = yin - Y0; let i1, j1; if (x0 > y0) { i1 = 1; j1 = 0 } else { i1 = 0; j1 = 1 } const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2, ii = i & 255, jj = j & 255, g0 = (ii + jj) % 12, g1 = (ii + i1 + jj + j1) % 12, g2 = (ii + 1 + jj + 1) % 12; let t0 = 0.5 - x0 * x0 - y0 * y0, n0 = t0 < 0 ? 0 : (t0 *= t0, t0 * t0 * this.dot(this.grad3[g0], x0, y0)); let t1 = 0.5 - x1 * x1 - y1 * y1, n1 = t1 < 0 ? 0 : (t1 *= t1, t1 * t1 * this.dot(this.grad3[g1], x1, y1)); let t2 = 0.5 - x2 * x2 - y2 * y2, n2 = t2 < 0 ? 0 : (t2 *= t2, t2 * t2 * this.dot(this.grad3[g2], x2, y2)); return 70 * (n0 + n1 + n2) } }; Simplex.init();

    // Simplex Noise (Already initialized in previous steps, just reused)
    // If not present, we rely on the previous initialization or re-declare if scope is an issue.
    // Assuming Simplex is globally available from previous steps.

    class Particle {
        constructor(i) {
            this.i = i;
            this.init();
            this.speedFactor = Math.random() * 0.8 + 0.2; // Varied speed
        }
        init() {
            // Start fully random
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.bx = this.x; this.by = this.y;
            this.size = Math.random() * 2 + 1; // Slightly thicker for dash visibility
            this.setIdleColor();
        }
        setIdleColor() {
            const isD = html.getAttribute('data-theme') === 'dark';
            if (isD) {
                // Dark Mode: Electric Blue Stream
                const c = ['#00f2ff', '#0051ff', '#00aaff'];
                this.baseColor = c[Math.floor(Math.random() * c.length)];
            } else {
                // Light Mode: Google Confetti Mix (Red, Blue, Green, Yellow, Purple)
                const c = ['#EA4335', '#4285F4', '#34A853', '#FBBC05', '#9334E6'];
                this.baseColor = c[Math.floor(Math.random() * c.length)];
            }
            this.color = this.baseColor;
        }
        update() {
            if (targets.length > 0) {
                // ACTIVE MODE (Forming Shape)
                const t = targets[this.i % targets.length];
                if (t) {
                    this.x += (t.x - this.x) * 0.2;
                    this.y += (t.y - this.y) * 0.2;
                }
                if (currentType) {
                    const waveScale = (currentType === 'text') ? 0.2 : 0.8;
                    const hue = (this.x * waveScale + time * 3) % 360;
                    const isDark = html.getAttribute('data-theme') === 'dark';
                    const light = isDark ? '60%' : '40%';
                    this.color = `hsl(${hue}, 100%, ${light})`;
                }
            } else {
                // IDLE MODE: SWARMING FISH (Google Style Flow)

                if (this.color.startsWith('hsl')) this.setIdleColor();

                // Mouse Repel (Gentle Push)
                let dx = mouse.x - this.x, dy = mouse.y - this.y, d = Math.sqrt(dx * dx + dy * dy);
                let mvx = 0, mvy = 0;
                if (d < mouse.radius) {
                    const f = (1 - d / mouse.radius);
                    const ang = Math.atan2(dy, dx);
                    // Push away from mouse
                    mvx = -Math.cos(ang) * f * 3;
                    mvy = -Math.sin(ang) * f * 3;
                }

                // Swarm Flow Field (Simplex Noise)
                // Low frequency noise = Large, smooth waves
                const scale = 0.0015;
                // Time moves the field slowly
                const angleNoise = Simplex.noise(this.x * scale, this.y * scale + time * 0.0005);

                // Convert noise to angle (Flow Direction)
                // Map -1..1 to 0..2PI (Full rotation possibilities)
                const angle = angleNoise * Math.PI * 2;

                // Base speed for the swarm
                const speed = (this.speedFactor || 1) * 1.5;

                // Target velocity based on flow angle
                const tx = Math.cos(angle) * speed + mvx;
                const ty = Math.sin(angle) * speed + mvy;

                // SmoothSteer: Gradual turn towards target velocity
                this.vx += (tx - this.vx) * 0.08;
                this.vy += (ty - this.vy) * 0.08;

                this.x += this.vx;
                this.y += this.vy;

                // Wrap Around Screen (Seamless)
                if (this.x < -50) this.x = w + 50; if (this.x > w + 50) this.x = -50;
                if (this.y < -50) this.y = h + 50; if (this.y > h + 50) this.y = -50;
            }
        }
        draw() {
            if (targets.length === 0) {
                // IDLE: Magnetic Dash
                if (this.x > cardRect.l && this.x < cardRect.r) return;

                ctx.strokeStyle = this.color;
                // Width based on speed
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                ctx.lineWidth = Math.min(this.size, speed * 1.5);

                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                // Trail length based on speed
                ctx.lineTo(this.x - this.vx * (3 + speed), this.y - this.vy * (3 + speed));
                ctx.stroke();
            } else {
                // ACTIVE: Dots
                if (this.x > cardRect.l + 30 && this.x < cardRect.r - 30) return;
                ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    function getPoints(el, type) {
        const s = 100; ghost.width = ghost.height = s; gctx.clearRect(0, 0, s, s); gctx.fillStyle = "white";

        if (type === 'icon') {
            const i = el.querySelector('i');
            if (i) {
                const c = window.getComputedStyle(i, ':before').content.replace(/['"]/g, '');
                gctx.font = `${s * 0.8}px "Phosphor"`; gctx.textAlign = "center"; gctx.textBaseline = "middle";
                gctx.fillText(c, s / 2, s / 2);
            } else {
                gctx.font = `bold ${s * 0.25}px "Outfit"`; gctx.textAlign = "center"; gctx.textBaseline = "middle";
                gctx.fillText(el.innerText, s / 2, s / 2);
            }
        } else if (type === 'avatar') {
            try {
                gctx.drawImage(avatarImg, 0, 0, s, s);
            } catch (e) {
                // Fallback Silhouette
                gctx.beginPath(); gctx.arc(s / 2, s * 0.35, s * 0.22, 0, Math.PI * 2); gctx.fill();
                gctx.beginPath(); gctx.ellipse(s / 2, s, s * 0.45, s * 0.35, 0, Math.PI, Math.PI * 2); gctx.fill();
            }
        } else if (type === 'text') {
            gctx.font = `600 ${s * 0.22}px "Outfit"`; gctx.textAlign = "center"; gctx.textBaseline = "middle";
            gctx.fillText("Asil", s / 2, s * 0.35); gctx.fillText("Peace", s / 2, s * 0.65);
        }

        let pts = [];
        try {
            const d = gctx.getImageData(0, 0, s, s).data;
            let gap = type === 'avatar' ? 1 : 2;
            for (let y = 0; y < s; y += gap) for (let x = 0; x < s; x += gap) if (d[(y * s + x) * 4 + 3] > 128) pts.push({ x: x / s, y: y / s });
        } catch (e) {
            // Fallback logic omitted for brevity, same as V11 if needed
        }

        const res = [];
        if (type === 'text') {
            const sideW = cardRect.l;
            const sc = Math.min(120, Math.max(60, sideW * 0.45));
            const lx = cardRect.l / 2, rx = cardRect.r + (w - cardRect.r) / 2, cy = h / 2;
            pts.forEach(p => res.push({ x: Math.max(10, Math.min(lx + (p.x - 0.5) * sc, cardRect.l - 10)), y: cy + (p.y - 0.5) * sc }));
            pts.forEach(p => res.push({ x: Math.min(w - 10, Math.max(rx + (p.x - 0.5) * sc, cardRect.r + 10)), y: cy + (p.y - 0.5) * sc }));
        } else if (type === 'avatar') {
            const sc = 130;
            const lx = cardRect.l / 2, rx = cardRect.r + (w - cardRect.r) / 2, cy = h / 2;
            pts.forEach(p => res.push({ x: lx + (p.x - 0.5) * sc, y: cy + (p.y - 0.5) * sc }));
            pts.forEach(p => res.push({ x: rx + (p.x - 0.5) * sc, y: cy + (p.y - 0.5) * sc }));
        } else {
            const sc = 110;
            const lx = cardRect.l / 2, rx = cardRect.r + (w - cardRect.r) / 2;
            const startY = h * 0.2;
            for (let i = 0; i < 3; i++) {
                const yPos = startY + i * (sc + 60);
                if (pts.length > 0) {
                    pts.forEach(p => res.push({ x: lx + (p.x - 0.5) * sc, y: yPos + (p.y - 0.5) * sc }));
                    pts.forEach(p => res.push({ x: rx + (p.x - 0.5) * sc, y: yPos + (p.y - 0.5) * sc }));
                }
            }
        }
        return res;
    }

    resize();
    for (let i = 0; i < count; i++) particles.push(new Particle(i));
    function anim() { time++; ctx.clearRect(0, 0, w, h); particles.forEach(p => { p.update(); p.draw() }); requestAnimationFrame(anim); }
    anim();

    // Events
    document.querySelectorAll('.social-item, .link-btn').forEach(el => {
        el.addEventListener('mouseenter', () => { currentType = 'icon'; targets = getPoints(el, 'icon'); });
        el.addEventListener('mouseleave', () => { currentType = null; targets = []; });
    });
    document.querySelector('.avatar-wrapper').addEventListener('mouseenter', () => { currentType = 'avatar'; targets = getPoints(null, 'avatar'); });
    document.querySelector('.avatar-wrapper').addEventListener('mouseleave', () => { currentType = null; targets = []; });
    profileName.addEventListener('mouseenter', () => { currentType = 'text'; targets = getPoints(null, 'text'); });
    profileName.addEventListener('mouseleave', () => { currentType = null; targets = []; });

    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('resize', () => { resize(); particles = []; for (let i = 0; i < count; i++) particles.push(new Particle(i)); });
});
