// Particle Background Effect
const canvas = document.getElementById('particles-bg');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const iconUrls = [
    'https://api.iconify.design/simple-icons/blender.svg?color=%2300ffd5',
    'https://api.iconify.design/simple-icons/houdini.svg?color=%2300ffd5',
    'https://api.iconify.design/file-icons/adobe-photoshop.svg?color=%2300ffd5',
    'https://api.iconify.design/file-icons/adobe-illustrator.svg?color=%2300ffd5',
    'https://api.iconify.design/file-icons/adobe-lightroom.svg?color=%2300ffd5',
    'https://api.iconify.design/simple-icons/davinciresolve.svg?color=%2300ffd5'
];

const loadedIcons = iconUrls.map(url => {
    const img = new Image();
    img.src = url;
    return img;
});

let particlesArray = [];
let scrollY = 0;
let ticking = false;

const heroRender = document.querySelector('.hero-render');
const parallaxContainers = document.querySelectorAll('.parallax-container');

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    
    if (!ticking) {
        window.requestAnimationFrame(() => {
            // READ phase
            const updates = [];
            parallaxContainers.forEach(container => {
                const rect = container.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const distance = (window.innerHeight - rect.top) * -0.06;
                    updates.push({ container, distance });
                }
            });
            
            // WRITE phase
            if (heroRender) {
                heroRender.style.transform = `translate3d(0, ${scrollY * -0.15}px, 0)`;
            }
            updates.forEach(({ container, distance }) => {
                container.style.transform = `translate3d(0, ${distance}px, 0)`;
            });
            
            ticking = false;
        });
        ticking = true;
    }
});

class Particle {
    constructor() {
        this.img = loadedIcons[Math.floor(Math.random() * loadedIcons.length)];
        this.x = Math.random() * canvas.width;
        // Distribute over a massive vertical area so they don't run out during scroll
        this.y = (Math.random() * (canvas.height * 3)) - canvas.height;
        
        // Depth/Scale
        this.scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        this.size = 80 * this.scale;
        
        // Blur based on distance (smaller = blurrier)
        this.blur = Math.max(0, (1.1 - this.scale) * 6); 
        
        // Motion
        this.speedX = (Math.random() * 0.3 - 0.15);
        this.speedY = (Math.random() * -0.3 - 0.1);
        
        // Rotation
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() * 0.004 - 0.002);
        
        // Visuals
        this.opacity = 0.1 + Math.random() * 0.15; // 0.1 to 0.25
        
        // Parallax depth multiplier
        this.parallaxSpeed = this.scale * 0.25;
        
        // Pre-rendering cache
        this.preRendered = false;
        this.offscreenCanvas = document.createElement('canvas');
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.rotationSpeed;

        const maxScrollDrift = scrollY * this.parallaxSpeed;

        // Reset if floats off top
        if (this.y - maxScrollDrift + this.size < -50) {
            this.y = canvas.height + maxScrollDrift + 50;
            this.x = Math.random() * canvas.width;
        }
        // Reset if goes too far below bounds (rare unless fast scroll up)
        if (this.y - maxScrollDrift - this.size > canvas.height + 50) {
            this.y = maxScrollDrift - 50;
            this.x = Math.random() * canvas.width;
        }
        
        // Horizontal wrap
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.x > canvas.width + this.size) this.x = -this.size;
    }

    draw() {
        if (!this.img.complete) return;
        
        // Render the blurred icon onto an offscreen canvas ONCE to save performance
        if (!this.preRendered) {
            const padding = this.blur * 2 + 10;
            this.offscreenCanvas.width = this.size + padding * 2;
            this.offscreenCanvas.height = this.size + padding * 2;
            
            const oCtx = this.offscreenCanvas.getContext('2d');
            oCtx.filter = `blur(${this.blur}px)`;
            
            // Draw into the center of offscreen canvas
            oCtx.translate(this.offscreenCanvas.width / 2, this.offscreenCanvas.height / 2);
            oCtx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
            this.preRendered = true;
        }
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Calculate Y with parallax
        const finalY = this.y - (scrollY * this.parallaxSpeed);
        
        ctx.translate(this.x, finalY);
        ctx.rotate(this.angle);
        
        // Draw the pre-rendered canvas instead of applying filter dynamically
        if (this.preRendered) {
            ctx.drawImage(
                this.offscreenCanvas, 
                -this.offscreenCanvas.width / 2, 
                -this.offscreenCanvas.height / 2
            );
        } else {
            ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
        }
        ctx.restore();
    }
}

function initParticles(num) {
    particlesArray = [];
    for (let i = 0; i < num; i++) {
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles(25);
});

initParticles(25);
animateParticles();


// Intersection Observer for scroll animations
// Intersection Observer for cinematic scroll animations
const observerOptions = {
    threshold: 0.15,
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            entry.target.classList.remove('out-up', 'out-down');
        } else {
            entry.target.classList.remove('in-view');
            if (entry.boundingClientRect.y < 0) {
                entry.target.classList.add('out-up');
                entry.target.classList.remove('out-down');
            } else {
                entry.target.classList.add('out-down');
                entry.target.classList.remove('out-up');
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.showcase-panel').forEach(panel => {
    panel.classList.add('out-down');
    observer.observe(panel);
});


// 3D Tilt Effect on images
const tiltImages = document.querySelectorAll('.3d-tilt');

tiltImages.forEach(img => {
    const parent = img.parentElement;
    
    parent.addEventListener('mousemove', (e) => {
        const rect = parent.getBoundingClientRect();
        
        // Calculate mouse position relative to container center
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Convert to percentage (-1 to +1)
        const percentX = (x - centerX) / centerX;
        const percentY = (y - centerY) / centerY;
        
        // Tilt magnitude
        const tiltX = percentY * -10; // invert Y
        const tiltY = percentX * 10;
        
        img.style.transform = `translateZ(50px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.05)`;
    });
    
    parent.addEventListener('mouseleave', () => {
        img.style.transform = `translateZ(50px) rotateX(0) rotateY(0) scale(1)`;
    });
});


// Parallax scrolling effect is now handled in the optimized scroll listener above.
