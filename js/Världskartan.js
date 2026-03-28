class Varldskartan {
    constructor(canvas, ctx, gaTillbaka) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gaTillbaka = gaTillbaka || (() => null);
        this.visas = false;

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/kartor/Världskartan.png';
        this.bild.onload = () => {
            this.bildLaddad = true;
        };
        this.bild.onerror = () => {
            this.bildLaddad = false;
        };

        this.dimmaBild = new Image();
        this.dimmaBildLaddad = false;
        this.dimmaBild.src = 'assets/kartor/Dimma.png';
        this.dimmaBild.onload = () => {
            this.dimmaBildLaddad = true;
        };
        this.dimmaBild.onerror = () => {
            this.dimmaBildLaddad = false;
        };
    }

    visa() {
        this.visas = true;
    }

    dolj() {
        this.visas = false;
    }

    hanteraEscape() {
        if (!this.visas) return false;
        this.dolj();
        if (typeof this.gaTillbaka === 'function') this.gaTillbaka();
        return true;
    }

    tangentNed(tangent) {
        if (!this.visas) return;
        if (tangent === 'Escape' || tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
            this.hanteraEscape();
        }
    }

    tangentUpp(tangent) {
        if (!this.visas) return;
    }

    hanteraKlick(musX, musY) {
        if (!this.visas) return;
    }

    rita() {
        if (!this.visas) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        if (this.bildLaddad) {
            ctx.drawImage(this.bild, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#101824';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Världskartan kunde inte laddas', canvas.width / 2, canvas.height / 2);
        }

        if (this.dimmaBildLaddad && this.dimmaBild.naturalWidth > 0 && this.dimmaBild.naturalHeight > 0) {
            const maxBredd = Math.min(canvas.width * 0.9, canvas.width - 8);
            const onskaadBredd = Math.max(this.dimmaBild.naturalWidth * 2.6, canvas.width * 0.48);
            const scale = Math.min(maxBredd / this.dimmaBild.naturalWidth, onskaadBredd / this.dimmaBild.naturalWidth);
            const drawW = this.dimmaBild.naturalWidth * scale;
            const drawH = this.dimmaBild.naturalHeight * scale;
            const drawX = canvas.width - drawW - -300;
            const drawY = -Math.round(drawH * 0.30);
            ctx.drawImage(this.dimmaBild, drawX, drawY, drawW, drawH);
        }

        ctx.save();
        ctx.fillStyle = 'rgba(8, 16, 24, 0.72)';
        ctx.fillRect(0, canvas.height - 42, canvas.width, 42);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Tryck [Esc], [Enter] eller [E] för att återgå till kartan', canvas.width / 2, canvas.height - 21);
        ctx.restore();
    }
}

if (typeof module !== 'undefined') module.exports = Varldskartan;
if (typeof window !== 'undefined') window.Varldskartan = Varldskartan;