/**
 * Antigravity Premium Link Hub Script
 * Features: High-performance particle system, 3D Tilt, Magnetic effects.
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = 150;
    const mouse = { x: -1000, y: -1000, radius: 200 };

    // Resize handler
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    class Particle {
        constructor() {
            this.init();
        }

        init() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 1;

            // Random Antigravity Colors
            const colors = ['#00f2ff', '#7000ff', '#ff00d4', '#4dff00'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        update() {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            let maxDistance = mouse.radius;
            let force = (maxDistance - distance) / maxDistance;
            let directionX = forceDirectionX * force * this.density;
            let directionY = forceDirectionY * force * this.density;

            if (distance < mouse.radius) {
                this.x -= directionX;
                this.y -= directionY;
            } else {
                if (this.x !== this.baseX) {
                    let dx = this.x - this.baseX;
                    this.x -= dx / 15;
                }
                if (this.y !== this.baseY) {
                    let dy = this.y - this.baseY;
                    this.y -= dy / 15;
                }
            }

            // Subtle drift
            this.baseX += Math.sin(Date.now() / 2000) * 0.2;
            this.baseY += Math.cos(Date.now() / 2000) * 0.2;
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    resize();
    init();
    animate();
    window.addEventListener('resize', () => {
        resize();
        init();
    });

    // 3D Tilt for Phone Frame
    const frame = document.querySelector('.phone-frame');
    if (frame) {
        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth <= 768) return;
            const x = e.clientX;
            const y = e.clientY;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const maxRotate = 10;
            const rotateX = ((y - centerY) / centerY) * -maxRotate;
            const rotateY = ((x - centerX) / centerX) * maxRotate;
            frame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    }

    // Button magnetic effect
    const btns = document.querySelectorAll('.btn, .social-icon');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.style.transform = "scale(0.9)";
            setTimeout(() => {
                btn.style.transform = "scale(1)";
            }, 100);
        });
    });
});
