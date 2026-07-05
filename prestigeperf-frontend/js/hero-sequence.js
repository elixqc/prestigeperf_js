$(function () {
    gsap.registerPlugin(ScrollTrigger);

    const FRAME_COUNT = 147;
    const FRAME_PATH = i => `images/sequence/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;

    const canvas = document.getElementById('image-sequence');
    const ctx = canvas.getContext('2d');
    const playhead = { frame: 0 };
    const images = [];

    // Preload all frames
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = FRAME_PATH(i);
        images.push(img);
    }

    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        lastFrame = -1;
        render();
    }

    let lastFrame = -1;

    // Draw current frame
    function render() {
        const frameIndex = Math.round(playhead.frame);
        if (frameIndex === lastFrame) return;
        const img = images[frameIndex];
        if (!img || !img.complete || !img.naturalWidth) return;
        lastFrame = frameIndex;

        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let dw, dh, dx, dy;

        if (imgRatio > canvasRatio) {
            dh = canvas.height;
            dw = img.naturalWidth * (canvas.height / img.naturalHeight);
            dx = (canvas.width - dw) / 2;
            dy = 0;
        } else {
            dw = canvas.width;
            dh = img.naturalHeight * (canvas.width / img.naturalWidth);
            dx = 0;
            dy = (canvas.height - dh) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
    }

    images[0].onload = () => {
        resizeCanvas();
        playHeroIntro();
    };

    function playHeroIntro() {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .to('.pp-hero-eyebrow', { y: 0, opacity: 1, duration: 0.7 })
            .to('.pp-hero-title', { y: 0, opacity: 1, duration: 1 }, '-=0.5')
            .to('.pp-hero-sub', { y: 0, opacity: 1, duration: 0.8 }, '-=0.6')
            .to('.pp-hero-cta', { y: 0, opacity: 1, duration: 0.8 }, '-=0.5');
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        ScrollTrigger.refresh();
    });

    gsap.to(playhead, {
        frame: FRAME_COUNT - 1,
        snap: 'frame',
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
            trigger: '.pp-hero',
            start: 'top top',
            end: '+=300%',   // scroll distance the sequence plays over — tweak to taste
            scrub: 0.5,
            pin: true,
        }
    });
});