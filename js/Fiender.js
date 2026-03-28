class Fiende {
    constructor(typ, x, y, stridSystem) {
        this.typ = typ;
        this.x = x;
        this.y = y;
        this.levande = true;
        this.erfarenhetGiven = false;

        // Hämta stats från strid-systemet
        const stats = stridSystem ? stridSystem.hamtaFiendeStats(typ) : null;
        if (stats) {
            this.namn = stats.namn;
            this.liv = stats.liv;
            this.maxLiv = stats.liv;
            this.skada = stats.skada;
            this.skadaElement = stats.skadaElement;
            this.motstånd = stats.motstånd;
            this.hastighet = stats.hastighet;
            this.storlek = stats.storlek;
            this.attackRackvidd = stats.attackRackvidd;
            this.attackHastighet = stats.attackHastighet;
            this.erfarenhet = stats.erfarenhet;
        } else {
            // Fallback-värden
            this.namn = 'Okänd fiende';
            this.liv = 100;
            this.maxLiv = 100;
            this.skada = 10;
            this.skadaElement = 'fysisk';
            this.motstånd = { fysisk: 0, eld: 0, magi: 0 };
            this.hastighet = 1;
            this.storlek = 20;
            this.attackRackvidd = 40;
            this.attackHastighet = 60;
            this.erfarenhet = 10;
        }

        this.riktning = 'höger';
        this.attackTimer = 0;

        // Ladda fiende-sprite
        this.sprite = new Image();
        const spritePath = (stats && stats.sprite) ? stats.sprite : `assets/Gestalter/${typ}.png`;
        this.sprite.src = spritePath;
        this.sprite.onload = () => {
            console.log(`Fiende-sprite laddad: ${spritePath}`);
        };
        this.sprite.onerror = () => {
            console.log(`Kunde inte ladda sprite för fiende: ${spritePath}`);
        };
    }

    uppdatera(spelare, stridSystem) {
        if (!this.levande) return;

        if (!spelare || !stridSystem) return;

        // Vänd fienden mot spelaren varje uppdatering.
        // För `Blodvargen` inverteras logiken så att den använder högersidan istället.
        if (spelare && typeof spelare.x === 'number') {
            const typNorm = (this.typ || '').toString().toLowerCase();
            // Support both 'blodvarg' and 'blodvargen' naming variations
            if (typNorm === 'blodvarg' || typNorm === 'blodvargen') {
                this.riktning = (spelare.x < this.x) ? 'höger' : 'vänster';
            } else {
                this.riktning = (spelare.x < this.x) ? 'vänster' : 'höger';
            }
        }

        // Attackera om spelaren är inom räckvidd
        if (stridSystem.kanAttackera(this, spelare)) {
            stridSystem.utforAttack(this, spelare);
        }
    }

    rita(ctx) {
        if (!this.levande) return;

        // Rita fiende-sprite eller fallback
        // Draw sprite at 1:1 (natural) pixel size when available
        const logicalSize = (typeof this.storlek === 'number' && this.storlek > 0) ? this.storlek : 20;

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            const bredd = Math.round(this.sprite.naturalWidth / 2);
            const hojd = Math.round(this.sprite.naturalHeight / 2);

            if (this.riktning === 'vänster') {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(
                    this.sprite,
                    -(this.x + bredd / 2),
                    this.y - hojd / 2,
                    bredd,
                    hojd
                );
                ctx.restore();
            } else {
                ctx.drawImage(
                    this.sprite,
                    this.x - bredd / 2,
                    this.y - hojd / 2,
                    bredd,
                    hojd
                );
            }
        } else {
            // Fallback: Rita en röd cirkel
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(this.x, this.y, logicalSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Rita liv-bar om inte uttryckligen dolt
        if (this.visaLivBar !== false) this.ritaLivBar(ctx);
    }

    ritaLivBar(ctx) {
        const barBredd = 40;
        const barHojd = 5;
        const x = this.x - barBredd / 2;
        const y = this.y - 35;

        // Bakgrund
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barBredd, barHojd);

        // Liv
        const livProcent = this.liv / this.maxLiv;
        ctx.fillStyle = livProcent > 0.5 ? '#00ff88' : (livProcent > 0.25 ? '#ffaa00' : '#ff4444');
        ctx.fillRect(x, y, barBredd * livProcent, barHojd);

        // Ram
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barBredd, barHojd);
    }

    taSakda(skada) {
        if (!this.levande) return;
        this.liv -= skada;
        if (this.liv <= 0) {
            this.liv = 0;
            this.levande = false;
        }
    }

    kolliderar(x, y, radie) {
        const dx = this.x - x;
        const dy = this.y - y;
        const avstand = Math.sqrt(dx * dx + dy * dy);
        return avstand <= (this.storlek + radie);
    }
}
