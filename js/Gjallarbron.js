class Gjallarbron {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);

        this.bakgrund = new Image();
        this.bakgrundLaddad = false;
        this.bakgrund.src = 'assets/platser/Gjallarbron1.png';
        this.bakgrund.onload = () => { this.bakgrundLaddad = true; };
        this.bakgrund.onerror = () => { console.log('Kunde inte ladda Gjallarbron-bild från: assets/platser/Gjallarbron1.png'); };

        this.spawnX = Math.round(this.canvas.width -550);
        this.spawnY = Math.round(this.canvas.height - 60);
        this.eKnappNedtryckt = false;
        this.minSpelarSkala = 0.4;
        this.maxSpelarSkala = 1.3;
        // Hastighetsmultiplikator: spelaren går långsammare högre upp
        this.minHastighetMult = 0.2;
        this.maxHastighetMult = 1;
        // Barriärer: fyra rektangulära hinder varav två är lätt roterade
        this.visaBarriarer = false;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.barriarer = [
            { typ: 'rotated', cx: 320, cy: 310, bredd: 260, hojd: 18, rotation: -25 },
            { typ: 'rotated', cx: 520, cy: 350, bredd: 260, hojd: 18, rotation: -50 },
            { typ: 'rotated', cx: 500, cy: 510, bredd: 200, hojd: 18, rotation: 50 },
            { typ: 'rotated', x: 0, y: 370, bredd: 200, hojd: 22, rotation: -10 },
            { typ: 'rotated', x: -50, y: 470, bredd: 200, hojd: 22, rotation: 70 },
            { x: 0, y: 240, bredd: canvas.width, hojd: 22 },
            { x: 0, y: canvas.height - 20, bredd: canvas.width, hojd: 20 }
        ];
        // Exit rectangle placed at bottom (visible for placement)
        this.visaUtgangForPlacering = false;
        this.exitRect = { x: Math.round(w * 0.05), y: h - 34, bredd: Math.round(w * 0.9), hojd: 34, meddelande: 'Tryck Enter för att lämna Gjallarbron' };
        this.midgardNPC = (typeof MidgardNPC !== 'undefined') ? new MidgardNPC(canvas, ctx) : null;
    }

    visa() {
        this.visas = true;
        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.x = this.spawnX;
            spelare.y = this.spawnY;
            try { if (typeof animationer !== 'undefined' && animationer && spelare.klass) animationer.laddaAnimationer(spelare.klass.namn); } catch (e) {}
            try { if (typeof animationer !== 'undefined' && animationer && spelare.klass) animationer.uppdateraAnimering(spelare, false); } catch (e) {}
        }
    }

    dolj() { this.visas = false; }

    rita() {
        if (!this.visas) return;
        const ctx = this.ctx;
        const canvas = this.canvas;
        if (this.bakgrundLaddad) {
            ctx.drawImage(this.bakgrund, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#1b1b2f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Gjallarbron', canvas.width / 2, canvas.height / 2);
        }

        const spelare = this.hamtaSpelare();
        if (this.midgardNPC) {
            try {
                const npcRender = this.midgardNPC.ritaNPC(spelare);
                if (npcRender && typeof npcRender.ritaBakomSpelare === 'function') npcRender.ritaBakomSpelare();
            } catch (e) {}
        }

        // Rita spelaren med höjd-baserad skala (djupeffekt)
        if (spelare) {
            try {
                const clampY = Math.max(0, Math.min(canvas.height, spelare.y));
                const t = clampY / canvas.height;
                const skala = this.minSpelarSkala + (this.maxSpelarSkala - this.minSpelarSkala) * t;

                ctx.save();
                ctx.translate(spelare.x, spelare.y);
                ctx.scale(skala, skala);
                ctx.translate(-spelare.x, -spelare.y);
                spelare.rita(ctx);
                ctx.restore();
            } catch (e) {}
        }

        if (this.midgardNPC) {
            try {
                const npcRender = this.midgardNPC.ritaNPC(spelare);
                if (npcRender && typeof npcRender.ritaFramforSpelare === 'function') npcRender.ritaFramforSpelare();
                this.midgardNPC.ritaInteraktionsmeddelande(spelare);
                this.midgardNPC.ritaDialog();
            } catch (e) {}
        }

        // Rita barriärer (debug) om aktiverat
        if (this.visaBarriarer) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 2;
            for (const barr of this.barriarer || []) {
                const rotation = (barr.rotation || 0) * Math.PI / 180;
                const cx = (typeof barr.cx !== 'undefined') ? barr.cx : (barr.x || 0) + (barr.bredd || 0) / 2;
                const cy = (typeof barr.cy !== 'undefined') ? barr.cy : (barr.y || 0) + (barr.hojd || 0) / 2;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(rotation);
                ctx.beginPath();
                if (barr.typ === 'oval') {
                    ctx.ellipse(0, 0, (barr.bredd || 0) / 2, (barr.hojd || 0) / 2, 0, 0, Math.PI * 2);
                } else {
                    ctx.rect(-(barr.bredd || 0) / 2, -(barr.hojd || 0) / 2, barr.bredd || 0, barr.hojd || 0);
                }
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }

        // Rita utgångsruta längst ner endast i placeringsläge (håll den osynlig under spel)
        try {
            if (this.visaUtgangForPlacering) {
                const er = this.exitRect || { x: 20, y: canvas.height - 60, bredd: canvas.width - 40, hojd: 60 };
                ctx.save();
                ctx.strokeStyle = 'rgba(0,255,128,0.95)';
                ctx.lineWidth = 2;
                ctx.strokeRect(er.x, er.y, er.bredd, er.hojd);
                ctx.fillStyle = 'rgba(0,255,128,0.95)';
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Utgång', er.x + er.bredd / 2, er.y + er.hojd / 2);
                ctx.restore();
            }

            // Visa Enter-hint när spelaren står i utgången (oavsett om rutan är synlig för placering)
            const sp = this.hamtaSpelare();
            if (this.exitRect && sp) {
                const er = this.exitRect;
                const r = sp.storlek || (sp.storlek === 0 ? 0 : 15);
                const inside = (sp.x + r > er.x) && (sp.x - r < (er.x + er.bredd)) && (sp.y + r > er.y) && (sp.y - r < (er.y + er.hojd));
                if (inside) {
                    const msg = (er.meddelande || 'Tryck Enter för att lämna');
                    ctx.save();
                    ctx.font = '16px Arial';
                    const textWidth = ctx.measureText(msg).width;
                    const padX = 12;
                    const padY = 6;
                    const bgW = textWidth + padX * 2;
                    const bgH = 16 + padY * 2;
                    const centerX = er.x + er.bredd / 2;
                    const bgX = Math.round(centerX - bgW / 2);
                    const bgY = Math.round(er.y - 8 - bgH / 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(bgX, bgY, bgW, bgH);
                    ctx.fillStyle = 'rgba(255,255,255,1)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(msg, centerX, bgY + bgH / 2);
                    ctx.restore();
                }
            }
        } catch (e) {}

        // (Instruktionstext borttagen)
    }

    tangentNed(tangent) {
        if (!this.visas) return;
        if (this.midgardNPC && typeof this.midgardNPC.hanteraTangent === 'function') {
            const hanteradAvNPC = this.midgardNPC.hanteraTangent(tangent);
            if (hanteradAvNPC) return;
        }
        if (tangent === 'Escape') {
            this.gaTillbaka();
            return;
        }
        if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
            if (!this.eKnappNedtryckt) {
                const spelare = this.hamtaSpelare();
                if (spelare && this.exitRect) {
                    const er = this.exitRect;
                    const r = spelare.storlek || (spelare.storlek === 0 ? 0 : 15);
                    const inside = (spelare.x + r > er.x) && (spelare.x - r < (er.x + er.bredd)) && (spelare.y + r > er.y) && (spelare.y - r < (er.y + er.hojd));
                    if (inside) {
                        this.eKnappNedtryckt = true;
                        this.gaTillbaka();
                    }
                }
            }
            return;
        }

        const spelare = this.hamtaSpelare();
        if (spelare && typeof spelare.tangentNed === 'function') spelare.tangentNed(tangent);
    }

    tangentUpp(tangent) {
        if (!this.visas) return;
        if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') this.eKnappNedtryckt = false;
        const spelare = this.hamtaSpelare();
        if (spelare && typeof spelare.tangentUpp === 'function') spelare.tangentUpp(tangent);
    }

    uppdateraRorelse() {
        if (!this.visas) return;
        const spelare = this.hamtaSpelare();
        if (!spelare) return;
        try {
            // Beräkna hastighetsmultiplier baserat på y-position (0 top, 1 bottom)
            const canvas = this.canvas;
            const clampY = Math.max(0, Math.min(canvas.height, spelare.y));
            const t = clampY / canvas.height;
            const mult = this.minHastighetMult + (this.maxHastighetMult - this.minHastighetMult) * t;

            // Bevara original hastighet om inte redan sparad
            if (typeof spelare._origHastighet === 'undefined') spelare._origHastighet = spelare.hastighet;
            // Tillfälligt applicera multiplier
            spelare.hastighet = (spelare._origHastighet || spelare.hastighet) * mult;

            if (typeof spelare.uppdateraRorelse === 'function') spelare.uppdateraRorelse(this.barriarer || []);

            if (this.midgardNPC && typeof this.midgardNPC.uppdateraNarhet === 'function') {
                this.midgardNPC.uppdateraNarhet(spelare);
            }

            // Återställ spelaren.hastighet till original (bevara _origHastighet)
            spelare.hastighet = spelare._origHastighet || spelare.hastighet;
        } catch (e) {}
    }
}
