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
                // IDLE MODE
                const isDark = html.getAttribute('data-theme') === 'dark';

                if (isDark) {
                    // DARK MODE: DEEP SWARM
                    if (!this.color.startsWith('#')) this.setIdleColor();
                    // ... (Keep existing Dark Mode Logic: Deep Swarm) ...
                    // Re-implementing simplified version to save space but keep logic identical
                    let dx = mouse.x - this.x, dy = mouse.y - this.y, d = Math.sqrt(dx * dx + dy * dy);
                    let mvx = 0, mvy = 0;
                    if (d < mouse.radius * 1.5) {
                        const f = (1 - d / (mouse.radius * 1.5));
                        const ang = Math.atan2(dy, dx);
                        mvx = -Math.cos(ang) * f * 2; mvy = -Math.sin(ang) * f * 2;
                    }
                    const scale = 0.0008;
                    const timeFactor = time * 0.0003;
                    const layerSpeed = (this.speedFactor || 0.5);
                    const zOffset = layerSpeed * 100;
                    const n = Simplex.noise(this.x * scale + zOffset, this.y * scale + timeFactor);
                    const angle = n * Math.PI * 4;
                    const baseSpeed = layerSpeed * 1.2;
                    const tx = Math.cos(angle) * baseSpeed + mvx;
                    const ty = Math.sin(angle) * baseSpeed + mvy;
                    const inertia = 0.05 * layerSpeed;
                    this.vx += (tx - this.vx) * inertia;
                    this.vy += (ty - this.vy) * inertia;
                    this.x += this.vx; this.y += this.vy;
                    if (this.x < -50) this.x = w + 50; if (this.x > w + 50) this.x = -50;
                    if (this.y < -50) this.y = h + 50; if (this.y > h + 50) this.y = -50;
                } else {
                    // LIGHT MODE: V16 MOLTEN GLASS FLUID
                    // We need aggressively moving particles that act like a fluid.
                    // We use fewer, larger particles for the 'Blob' effect.

                    // 1. Iridescent Colors: Electric Cyan, Magenta, Soft Gold
                    // Cycle based on noise to make colors 'bleed'
                    const nC = Simplex.noise(this.x * 0.002, this.y * 0.002 + time * 0.001);
                    if (nC < -0.3) this.color = 'rgba(0, 255, 255, 0.8)'; // Electric Cyan
                    else if (nC > 0.3) this.color = 'rgba(255, 0, 255, 0.8)'; // Magenta
                    else this.color = 'rgba(255, 215, 0, 0.8)'; // Soft Gold

                    // 2. Physics: Aggressive Attractor (Cursor)
                    // They swirl around the cursor
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    // Attract force (stronger closer)
                    // But prevent clumping at exact center with spiral
                    // Attraction
                    let ax = 0, ay = 0;
                    if (dist > 10) { // Don't divide by zero
                        const force = 2000 / (dist + 50); // Strong pull
                        const ang = Math.atan2(dy, dx);
                        ax = Math.cos(ang) * force;
                        ay = Math.sin(ang) * force;

                        // Swirl (Tangent)
                        // Add perpendicular force
                        ax += Math.cos(ang + Math.PI / 2) * force * 1.5;
                        ay += Math.sin(ang + Math.PI / 2) * force * 1.5;
                    }

                    // Fluid Viscosity (High drag)
                    this.vx *= 0.92;
                    this.vy *= 0.92;

                    this.vx += ax * 0.05;
                    this.vy += ay * 0.05;

                    // Simplex Noise movement for organic 'bleeding' even when still
                    const flowAngle = Simplex.noise(this.x * 0.005, this.y * 0.005 + time * 0.001) * Math.PI * 4;
                    this.vx += Math.cos(flowAngle) * 0.5;
                    this.vy += Math.sin(flowAngle) * 0.5;

                    this.x += this.vx;
                    this.y += this.vy;

                    // Bounds (Bounce instead of wrap to keep fluid on screen)
                    if (this.x < 0 || this.x > w) this.vx *= -1;
                    if (this.y < 0 || this.y > h) this.vy *= -1;
                    this.x = Math.max(0, Math.min(w, this.x));
                    this.y = Math.max(0, Math.min(h, this.y));
                }
            }
        }
        draw() {
            if (targets.length === 0) {
                // IDLE DRAW
                const isDark = html.getAttribute('data-theme') === 'dark';

                if (isDark) {
                    // DARK MODE: Thin Space Dash
                    if (this.x > cardRect.l && this.x < cardRect.r) return;
                    const alpha = Math.max(0.2, this.speedFactor);
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = Math.max(0.5, this.size * this.speedFactor);
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    ctx.lineTo(this.x - this.vx * (4 + speed * 2), this.y - this.vy * (4 + speed * 2));
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                } else {
                    // LIGHT MODE: V16 MOLTEN GLASS (Gooey)
                    // We need a composite operation or filter to make them merge
                    // Since we can't easily change globalCompositeOperation per particle efficiently in this loop structure without killing FPS,
                    // we use large soft circles with high overlap.

                    if (this.x > cardRect.l && this.x < cardRect.r) return;

                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    // Draw MUCH larger to create fluid blobs
                    const s = this.size * 5;
                    ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
                    ctx.fill();

                    // Add 'Caustic' highlight (White center)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.beginPath();
                    ctx.arc(this.x - s * 0.3, this.y - s * 0.3, s * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // ACTIVE: Standard Dots
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
