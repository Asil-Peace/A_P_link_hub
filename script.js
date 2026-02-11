/**
 * Premium Particle Field - Minimal Tech Luxury
 * Optimized for 60fps, cursor-reactive, elegant motion
 */
document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-btn');
    const langOptions = document.querySelectorAll('.lang-option');

    // Theme & Language handlers
    themeBtn?.addEventListener('click', () => {
        const t = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', t);
        themeBtn.innerHTML = t === 'dark' ? '<i class="ph-bold ph-moon"></i>' : '<i class="ph-bold ph-sun"></i>';
    });

    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            updateLang(opt.getAttribute('data-lang'));
        });
    });

    function updateLang(lang) {
        const translations = {
            en: { bio: "Creative Developer | AI & Vibe Coding Enthusiast", p: "Portfolio", pr: "Projects", m: "Music", c: "Contact" },
            uz: { bio: "Raqamli olam ijodkori | AI va Vibe Coding ishqibozi", p: "Portfolio", pr: "Loyihalar", m: "Musiqa", c: "Bog'lanish" },
            ru: { bio: "Креативный разработчик | AI & Vibe Coding Энтузиаст", p: "Портфолио", pr: "Проекты", m: "Музыка", c: "Контакты" }
        };
        const t = translations[lang];
        const bioEl = document.querySelector('#profile-bio');
        if (bioEl) bioEl.innerText = t.bio;
        const btns = document.querySelectorAll('.link-btn span');
        if (btns[0]) btns[0].innerText = t.p;
        if (btns[1]) btns[1].innerText = t.pr;
        if (btns[2]) btns[2].innerText = t.c;
    }

    // ===== PREMIUM PARTICLE FIELD ENGINE =====
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    let w, h, centerX, centerY;
    let particles = [];
    let time = 0;

    // Performance optimization
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const PARTICLE_COUNT = isMobile ? 350 : 800; // Balanced particle density
    const RIPPLE_DURATION = 60; // frames

    // Cursor tracking with smooth easing
    const cursor = {
        x: -1000,
        y: -1000,
        targetX: -1000,
        targetY: -1000,
        vx: 0,
        vy: 0,
        radius: isMobile ? 200 : 180, // Increased mobile radius for better touch interaction
        ripples: [] // Array of active ripples
    };

    // Debug: Log if mobile is detected
    if (isMobile) {
        console.log('Mobile device detected - touch tracking enabled with radius:', cursor.radius);
    }

    // Dynamic color system - reads from CSS variables
    function getThemeColors() {
        const root = document.documentElement;
        const style = getComputedStyle(root);

        return {
            bg: style.getPropertyValue('--particle-bg').trim(),
            particle: {
                r: parseInt(style.getPropertyValue('--particle-r')),
                g: parseInt(style.getPropertyValue('--particle-g')),
                b: parseInt(style.getPropertyValue('--particle-b')),
                alpha: parseFloat(style.getPropertyValue('--particle-alpha'))
            },
            glow: {
                r: parseInt(style.getPropertyValue('--glow-r')),
                g: parseInt(style.getPropertyValue('--glow-g')),
                b: parseInt(style.getPropertyValue('--glow-b')),
                alpha: parseFloat(style.getPropertyValue('--glow-alpha'))
            }
        };
    }

    let COLORS = getThemeColors();

    // Update colors when theme changes
    themeBtn?.addEventListener('click', () => {
        setTimeout(() => {
            COLORS = getThemeColors();
        }, 50); // Small delay to let CSS variables update
    });

    // Protected regions for masking (particles won't draw here)
    let protectedRects = [];
    function updateProtectedRects() {
        const selectors = [
            '.profile',
            '.avatar-wrapper',
            '#profile-name',
            '#profile-bio',
            '.social-grid',
            '.links-stack',
            '.bottom-icon-bar',
            '.top-bar'
        ];
        protectedRects = [];
        selectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) {
                const rect = el.getBoundingClientRect();
                protectedRects.push({
                    x: rect.left,
                    y: rect.top,
                    w: rect.width,
                    h: rect.height
                });
            }
        });
    }

    class Particle {
        constructor() {
            this.reset();
            // Random initial position
            this.x = Math.random() * w;
            this.y = Math.random() * h;
        }

        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.z = Math.random() * 0.6 + 0.4; // Depth: 0.4 to 1.0 (closer range for subtlety)

            // Organic drift velocity
            this.baseVx = (Math.random() - 0.5) * 0.3;
            this.baseVy = (Math.random() - 0.5) * 0.3;
            this.vx = this.baseVx;
            this.vy = this.baseVy;

            // Particle properties
            this.size = (0.8 + Math.random() * 1.2) * this.z; // 0.8-2.0px based on depth
            this.opacity = (0.3 + Math.random() * 0.4) * this.z; // Depth-based opacity

            // Phase offset for organic motion
            this.phaseX = Math.random() * Math.PI * 2;
            this.phaseY = Math.random() * Math.PI * 2;
        }

        update() {
            // Organic floating motion (low gravity drift)
            const driftX = Math.sin(time * 0.001 + this.phaseX) * 0.2;
            const driftY = Math.cos(time * 0.0008 + this.phaseY) * 0.2;

            this.vx = this.baseVx + driftX;
            this.vy = this.baseVy + driftY;

            // Cursor magnetic distortion (smooth repulsion + swirl)
            const dx = this.x - cursor.x;
            const dy = this.y - cursor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < cursor.radius && dist > 0) {
                const force = (1 - dist / cursor.radius) * this.z; // Depth affects force
                const angle = Math.atan2(dy, dx);

                // Repulsion force
                const repelStrength = force * 2.5;
                this.vx += Math.cos(angle) * repelStrength;
                this.vy += Math.sin(angle) * repelStrength;

                // Subtle swirl (perpendicular force)
                const swirlStrength = force * 0.8;
                this.vx += Math.cos(angle + Math.PI / 2) * swirlStrength;
                this.vy += Math.sin(angle + Math.PI / 2) * swirlStrength;
            }

            // Apply velocity with damping (smooth easing)
            this.x += this.vx;
            this.y += this.vy;

            // Damping for smooth deceleration
            this.vx *= 0.95;
            this.vy *= 0.95;

            // Wrap around edges with parallax (depth-based speed)
            const margin = 50;
            if (this.x < -margin) this.x = w + margin;
            if (this.x > w + margin) this.x = -margin;
            if (this.y < -margin) this.y = h + margin;
            if (this.y > h + margin) this.y = -margin;
        }

        isInsideProtected() {
            for (let rect of protectedRects) {
                if (this.x > rect.x && this.x < rect.x + rect.w &&
                    this.y > rect.y && this.y < rect.y + rect.h) {
                    return true;
                }
            }
            return false;
        }

        draw() {
            // MUHIM: Do not draw if inside protected (UI) region
            if (this.isInsideProtected()) return;

            // Depth-based rendering (Z-axis parallax illusion)
            const scale = 0.5 + this.z * 0.5; // Size scales with depth
            const finalSize = this.size * scale;
            const finalOpacity = this.opacity * scale;

            // Soft glow effect
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, finalSize * 3
            );

            gradient.addColorStop(0, `rgba(${COLORS.particle.r}, ${COLORS.particle.g}, ${COLORS.particle.b}, ${finalOpacity})`);
            gradient.addColorStop(0.5, `rgba(${COLORS.glow.r}, ${COLORS.glow.g}, ${COLORS.glow.b}, ${finalOpacity * 0.3})`);
            gradient.addColorStop(1, `rgba(${COLORS.glow.r}, ${COLORS.glow.g}, ${COLORS.glow.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, finalSize * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core particle (brighter center)
            ctx.fillStyle = `rgba(${COLORS.particle.r}, ${COLORS.particle.g}, ${COLORS.particle.b}, ${finalOpacity * 1.5})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, finalSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function createRipple(x, y) {
        cursor.ripples.push({
            x,
            y,
            radius: 0,
            maxRadius: 200,
            life: 0,
            maxLife: RIPPLE_DURATION
        });
    }

    function updateRipples() {
        cursor.ripples = cursor.ripples.filter(ripple => {
            ripple.life++;
            ripple.radius = (ripple.life / ripple.maxLife) * ripple.maxRadius;
            return ripple.life < ripple.maxLife;
        });
    }

    function drawRipples() {
        cursor.ripples.forEach(ripple => {
            const progress = ripple.life / ripple.maxLife;
            const opacity = (1 - progress) * 0.15; // Fade out

            ctx.strokeStyle = `rgba(${COLORS.glow.r}, ${COLORS.glow.g}, ${COLORS.glow.b}, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        centerX = w / 2;
        centerY = h / 2;

        // Reinitialize particles
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }
        updateProtectedRects();
    }

    function animate() {
        time++;

        // Clear with background color (clean white/light)
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, w, h);

        // Update protected zones for masking
        updateProtectedRects();

        // Smooth cursor easing
        cursor.vx = (cursor.targetX - cursor.x) * 0.15;
        cursor.vy = (cursor.targetY - cursor.y) * 0.15;
        cursor.x += cursor.vx;
        cursor.y += cursor.vy;

        // Update ripples
        updateRipples();

        // Update and draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw ripples on top
        drawRipples();

        requestAnimationFrame(animate);
    }

    // Initialize
    resize();
    animate();

    // Event listeners
    let lastMoveTime = 0;

    // Enable mouse tracking on all devices
    window.addEventListener('mousemove', e => {
        cursor.targetX = e.clientX;
        cursor.targetY = e.clientY;

        // Create ripple on significant movement
        const now = Date.now();
        const speed = Math.sqrt(cursor.vx * cursor.vx + cursor.vy * cursor.vy);
        if (now - lastMoveTime > 150 && speed > 5) {
            createRipple(e.clientX, e.clientY);
            lastMoveTime = now;
        }
    });

    window.addEventListener('mouseleave', () => {
        cursor.targetX = -1000;
        cursor.targetY = -1000;
    });

    // MOBILE TOUCH TRACKING - Multiple approaches for maximum compatibility

    // Approach 1: Body-level touch tracking
    document.body.addEventListener('touchmove', e => {
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            cursor.targetX = touch.clientX;
            cursor.targetY = touch.clientY;

            // Debug log (remove after testing)
            if (isMobile && Math.random() < 0.05) { // Log 5% of events to avoid spam
                console.log('Touch move detected:', touch.clientX, touch.clientY);
            }

            const now = Date.now();
            if (now - lastMoveTime > 80) {
                createRipple(touch.clientX, touch.clientY);
                lastMoveTime = now;
            }
        }
    }, { passive: true });

    document.body.addEventListener('touchstart', e => {
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            cursor.targetX = touch.clientX;
            cursor.targetY = touch.clientY;
            createRipple(touch.clientX, touch.clientY);
            lastMoveTime = Date.now();

            // Debug log
            if (isMobile) {
                console.log('Touch start detected at:', touch.clientX, touch.clientY);
            }
        }
    }, { passive: true });

    document.body.addEventListener('touchend', () => {
        setTimeout(() => {
            document.querySelectorAll('.touch-hover').forEach(el => el.classList.remove('touch-hover'));
        }, 150);
        cursor.targetX = -1000;
        cursor.targetY = -1000;
    });

    // Approach 2: Document-level touch tracking
    document.addEventListener('touchmove', e => {
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            cursor.targetX = touch.clientX;
            cursor.targetY = touch.clientY;
        }
    }, { passive: true });

    document.addEventListener('touchstart', e => {
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            cursor.targetX = touch.clientX;
            cursor.targetY = touch.clientY;
        }
    }, { passive: true });

    // Approach 3: Window-level touch tracking (fallback)
    window.addEventListener('touchmove', e => {
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            cursor.targetX = touch.clientX;
            cursor.targetY = touch.clientY;
        }
    }, { passive: true });

    window.addEventListener('touchstart', e => {
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            cursor.targetX = touch.clientX;
            cursor.targetY = touch.clientY;
        }
    }, { passive: true });

    window.addEventListener('resize', resize);
});
