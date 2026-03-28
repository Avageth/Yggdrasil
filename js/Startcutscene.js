class Startcutscene {
    constructor(canvas, ctx, onComplete) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onComplete = typeof onComplete === 'function' ? onComplete : (() => {});
        this.visas = false;
        this.startTid = 0;
        this.slideDuration = 10000;
        this.fadeDuration = 1400;
        this.textFadeDuration = 1800;
        this.introMusik = this.skapaIntroMusik();
        this.introMusikBasvolym = 0.42;
        this.images = [
            null,
            this.skapaBild('assets/Cutscene/Starting/Scen 1.png'),
            this.skapaBild('assets/Cutscene/Starting/Scen 2.png'),
            this.skapaBild('assets/Cutscene/Starting/Scen 3.jpg'),
            this.skapaBild('assets/Cutscene/Starting/Scen 4.png')
        ];
        this.texts = [
            'Hören mig alla\nheliga släkten,\nstörre och smärre\nsöner av Heimdall;\ndu vill ju, Valfader,\natt väl jag täljer\nforntida sägner,\nde första, jag minnes.',
            'På gården med brädspel de glada lekte, armod på guld fanns ingalunda.',
            'Tills tursamöar trenne kommo, mycket mäktiga mör, från jättevärlden.',
            'Då drogo alla makter till sina domaresäten, högheliga gudar, och höllo rådslag, vem dvärgars skara skapa skulle av blodig bränning och Blains ben.',
            'Nio världar jag minns, och vad som var i de nio.'
        ];
    }

    skapaIntroMusik() {
        try {
            const ljud = new Audio(encodeURI('assets/Audio/Intro.mp3'));
            ljud.preload = 'auto';
            ljud.loop = false;
            ljud.volume = 0;
            return ljud;
        } catch (e) {
            return null;
        }
    }

    startaIntroMusik() {
        if (!this.introMusik) return;
        try {
            this.introMusik.pause();
            this.introMusik.currentTime = 0;
            this.introMusik.volume = this.introMusikBasvolym;
            const playPromise = this.introMusik.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } catch (e) {}
    }

    stoppaIntroMusik() {
        if (!this.introMusik) return;
        try {
            this.introMusik.pause();
            this.introMusik.currentTime = 0;
            this.introMusik.volume = 0;
        } catch (e) {}
    }

    uppdateraIntroMusik(index, localTime) {
        if (!this.introMusik) return;

        const arSistaSlide = index === this.images.length - 1;
        let volymRatio = 1;

        if (arSistaSlide && localTime > this.slideDuration - this.fadeDuration) {
            volymRatio = Math.max(0, (this.slideDuration - localTime) / this.fadeDuration);
        }

        try {
            this.introMusik.volume = this.introMusikBasvolym * volymRatio;
        } catch (e) {}
    }

    skapaBild(src) {
        const image = new Image();
        image.src = src;
        return image;
    }

    visa() {
        this.visas = true;
        this.startTid = performance.now();
        this.startaIntroMusik();
    }

    dolj() {
        this.visas = false;
        this.startTid = 0;
        this.stoppaIntroMusik();
    }

    avsluta() {
        if (!this.visas) return;
        this.dolj();
        this.onComplete();
    }

    tangentNed(tangent) {
        if (!this.visas) return;
        if (tangent === 'Enter' || tangent === 'Escape' || tangent === ' ' || tangent === 'Spacebar') {
            this.avsluta();
        }
    }

    uppdatera() {
        if (!this.visas || !this.startTid) return;
        const elapsed = performance.now() - this.startTid;
        const totalDuration = this.images.length * this.slideDuration;
        const { index, localTime } = this.hamtaSlideData();
        this.uppdateraIntroMusik(index, localTime);
        if (elapsed >= totalDuration) {
            this.avsluta();
        }
    }

    hamtaSlideData() {
        const elapsed = Math.max(0, performance.now() - this.startTid);
        const index = Math.min(this.images.length - 1, Math.floor(elapsed / this.slideDuration));
        const localTime = elapsed - index * this.slideDuration;
        return { index, localTime };
    }

    beraknaAlpha(localTime) {
        if (localTime < this.fadeDuration) {
            return localTime / this.fadeDuration;
        }
        if (localTime > this.slideDuration - this.fadeDuration) {
            return Math.max(0, (this.slideDuration - localTime) / this.fadeDuration);
        }
        return 1;
    }

    ritaBakgrund() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    ritaBild(image, alpha) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        if (!image || !image.complete || image.naturalWidth <= 0) return;

        const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(image, x, y, width, height);
        ctx.restore();
    }

    ritaText(text, localTime, slideAlpha, centered = false) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const textAlpha = Math.min(1, localTime / this.textFadeDuration) * slideAlpha;
        const fontSize = 22;
        const lineHeight = 28;
        const horizontalPadding = 28;
        const verticalPadding = 18;
        const maxWidth = Math.floor(canvas.width * 0.58);

        ctx.save();
        ctx.font = `${fontSize}px Georgia`;
        const lines = this.brytText(text, maxWidth);
        const longestLine = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
        const boxHeight = lines.length * lineHeight + verticalPadding * 2;
        const boxWidth = Math.min(canvas.width - 60, Math.ceil(longestLine + horizontalPadding * 2));
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = centered
            ? Math.round((canvas.height - boxHeight) / 2)
            : canvas.height - boxHeight - 42;

        ctx.globalAlpha = textAlpha;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 14);
        ctx.fill();

        ctx.fillStyle = '#f3e7c2';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((line, index) => {
            const y = boxY + verticalPadding + index * lineHeight + lineHeight / 2;
            ctx.fillText(line, canvas.width / 2, y);
        });
        ctx.restore();
    }

    brytText(text, maxWidth) {
        const ctx = this.ctx;
        const lines = [];
        const stycken = String(text || '').split('\n');

        stycken.forEach((stycke) => {
            const words = stycke.split(/\s+/).filter(Boolean);
            let current = '';

            if (words.length === 0) {
                lines.push('');
                return;
            }

            words.forEach((word) => {
                const test = current ? `${current} ${word}` : word;
                if (!current || ctx.measureText(test).width <= maxWidth) {
                    current = test;
                    return;
                }
                lines.push(current);
                current = word;
            });

            if (current) lines.push(current);
        });
        return lines;
    }

    ritaHint() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.font = '16px Georgia';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Enter eller Esc: hoppa over', canvas.width - 22, canvas.height - 14);
        ctx.restore();
    }

    rita() {
        if (!this.visas || !this.startTid) return;

        const { index, localTime } = this.hamtaSlideData();
        const image = this.images[index] || null;
        const text = this.texts[index] || '';
        const alpha = this.beraknaAlpha(localTime);

        this.ritaBakgrund();
        this.ritaBild(image, alpha);
        this.ritaText(text, localTime, alpha, !image);
        this.ritaHint();
    }
}

window.Startcutscene = Startcutscene;