document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const config = {
        zoomSpeed: 0.05,
        rotateSpeedBase: 0.002,
        rotateSpeedHover: 0.01,
        particleCount: 800,
        particleSpeed: 2,
        warpSpeed: 20,
        colors: {
            cyan: '#00ffff',
            purple: '#bc13fe',
            bg: '#020202'
        }
    };

    // --- Translations ---
    const translations = {
        en: {
            bio: "Creative Developer | AI & Vibe Coding Enthusiast",
            btn_portfolio: "MY PORTFOLIO",
            btn_text: "YOUR TEXT",
            btn_spotify: "OPEN SPOTIFY",
            btn_calendar: "CALENDAR 2026"
        },
        ru: {
            bio: "Креативный разработчик | AI & Vibe Coding Энтузиаст",
            btn_portfolio: "МОЕ ПОРТФОЛИО",
            btn_text: "ВАШ ТЕКСТ",
            btn_spotify: "ОТКРЫТЬ SPOTIFY",
            btn_calendar: "КАЛЕНДАРЬ 2026"
        },
        uz: {
            bio: "Raqamli olam ijodkori | AI va Vibe Coding ishqibozi",
            btn_portfolio: "MENING PORTFOLIOM",
            btn_text: "SIZNING MATNINGIZ",
            btn_spotify: "SPOTIFY-NI OCHISH",
            btn_calendar: "KALENDAR 2026"
        }
    };

    const langSelector = document.querySelector('.language-selector');
    const langOptions = document.querySelectorAll('.lang-option');
    const translatableElements = document.querySelectorAll('[data-i18n]');

    // Language Click Handler
    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            // UI Update
            langOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');

            // Set Language
            const lang = opt.getAttribute('data-lang');
            updateLanguage(lang);
        });
    });

    function updateLanguage(lang) {
        translatableElements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerText = translations[lang][key];
            }
        });
    }

    // --- Boot Sequence ---
    const terminalOverlay = document.getElementById('terminal-overlay');
    const terminalText = document.getElementById('terminal-text');
    const mainContent = document.getElementById('main-content');

    // Auto-detect language or default to EN
    // You could check navigator.language here

    const bootLines = [
        "Initializing Digital ID...",
        "Loading assets...",
        "Verifying security keys...",
        "System Ready!"
    ];

    async function typeLine(text) {
        if (!terminalText) return;
        terminalText.textContent = "";
        for (let i = 0; i < text.length; i++) {
            terminalText.textContent += text[i];
            await new Promise(r => setTimeout(r, 50));
        }
        await new Promise(r => setTimeout(r, 400));
    }

    async function runBootSequence() {
        if (!terminalText) return;

        for (let i = 0; i < bootLines.length; i++) {
            await typeLine(bootLines[i]);
        }

        terminalText.classList.add('glitch');
        terminalText.setAttribute('data-text', "System Ready!");

        await new Promise(r => setTimeout(r, 800));

        terminalOverlay.style.transition = "opacity 0.5s ease-out";
        terminalOverlay.style.opacity = "0";
        setTimeout(() => {
            if (terminalOverlay) terminalOverlay.remove();
            mainContent.style.opacity = "1";

            // Show Language Selector instead of Weather
            if (langSelector) langSelector.style.display = "block";

            // Trigger entry animations
            document.querySelectorAll('.fade-in-up').forEach(el => {
                el.style.animationPlayState = 'running';
            });
        }, 500);
    }

    runBootSequence();

    // --- 3D Engine (Canvas) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        let width, height;
        let particles = [];
        let orbVertices = [];
        let orbEdges = [];
        let rotation = { x: 0, y: 0 };
        let targetRotationSpeed = config.rotateSpeedBase;
        let currentRotationSpeed = config.rotateSpeedBase;

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        }
        window.addEventListener('resize', resize);

        function initParticles() {
            particles = [];
            for (let i = 0; i < config.particleCount; i++) {
                particles.push({
                    x: (Math.random() - 0.5) * width * 2,
                    y: (Math.random() - 0.5) * height * 2,
                    z: Math.random() * 2000,
                    speed: Math.random() * config.particleSpeed + 0.5
                });
            }
        }

        function initOrb() {
            const t = (1.0 + Math.sqrt(5.0)) / 2.0;
            const s = 150;
            orbVertices = [
                [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
                [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
                [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
            ].map(v => ({ x: v[0] * s, y: v[1] * s, z: v[2] * s }));

            for (let i = 0; i < orbVertices.length; i++) {
                for (let j = i + 1; j < orbVertices.length; j++) {
                    const dx = orbVertices[i].x - orbVertices[j].x;
                    const dy = orbVertices[i].y - orbVertices[j].y;
                    const dz = orbVertices[i].z - orbVertices[j].z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist < s * 2.2) orbEdges.push([i, j]);
                }
            }
        }

        function project(point) {
            const fov = 800;
            const scale = fov / (fov + point.z + 500);
            const x2d = (point.x * scale) + width / 2;
            const y2d = (point.y * scale) + height / 2;
            return { x: x2d, y: y2d, scale: scale };
        }

        function rotateX(point, angle) {
            const y = point.y * Math.cos(angle) - point.z * Math.sin(angle);
            const z = point.y * Math.sin(angle) + point.z * Math.cos(angle);
            return { ...point, y, z };
        }

        function rotateY(point, angle) {
            const x = point.x * Math.cos(angle) + point.z * Math.sin(angle);
            const z = -point.x * Math.sin(angle) + point.z * Math.cos(angle);
            return { ...point, x, z };
        }

        function animate() {
            ctx.fillStyle = config.colors.bg;
            ctx.fillRect(0, 0, width, height);

            currentRotationSpeed += (targetRotationSpeed - currentRotationSpeed) * 0.1;
            rotation.x += currentRotationSpeed;
            rotation.y += currentRotationSpeed;

            const fov = 500;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            particles.forEach(p => {
                p.z -= p.speed;
                if (p.z < -fov) p.z = 2000;

                const proj = project(p);

                ctx.beginPath();
                if (currentRotationSpeed > config.rotateSpeedBase * 2) {
                    ctx.moveTo(proj.x, proj.y);
                    ctx.lineTo(proj.x, proj.y - (p.speed * 2));
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * p.speed})`;
                    ctx.stroke();
                } else {
                    ctx.arc(proj.x, proj.y, Math.max(0.5, 2 * proj.scale), 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.strokeStyle = config.colors.cyan;
            ctx.lineWidth = 1.5;

            const transformedVertices = orbVertices.map(v => {
                let p = rotateX(v, rotation.x);
                p = rotateY(p, rotation.y);
                return p;
            });

            orbEdges.forEach(edge => {
                const v1 = transformedVertices[edge[0]];
                const v2 = transformedVertices[edge[1]];
                const p1 = project(v1);
                const p2 = project(v2);

                const alpha = (p1.scale + p2.scale) / 2;
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.6})`;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            });

            requestAnimationFrame(animate);
        }

        resize();
        initOrb();
        animate();
    }

    // --- Interactions ---

    // Avatar Hover -> Orb Zoom/Fast Spin
    const avatar = document.getElementById('avatar-img');
    if (avatar) {
        avatar.addEventListener('mouseenter', () => {
            targetRotationSpeed = config.rotateSpeedHover;
            config.particleSpeed = config.warpSpeed;
        });
        avatar.addEventListener('mouseleave', () => {
            targetRotationSpeed = config.rotateSpeedBase;
            config.particleSpeed = 2;
        });
    }

    // 3D Tilt for Phone Frame
    const frame = document.querySelector('.phone-frame');
    if (frame) {
        document.addEventListener('mousemove', (e) => {
            // Check if mobile (disable tilt on small screens)
            if (window.innerWidth <= 768) return;

            const x = e.clientX;
            const y = e.clientY;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const maxRotate = 15;
            const rotateX = ((y - centerY) / centerY) * -maxRotate;
            const rotateY = ((x - centerX) / centerX) * maxRotate;

            frame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    }

    // Button Click Logic
    const btns = document.querySelectorAll('.btn');
    btns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const text = this.querySelector('span');
            // Simple pop effect
            this.style.transform = "scale(0.95)";
            setTimeout(() => {
                this.style.transform = "scale(1)";
                alert("Opening " + text.innerText);
            }, 100);
        });
    });
});
