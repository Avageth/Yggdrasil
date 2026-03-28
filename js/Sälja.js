class Salja {
    constructor(canvas, ctx, hamtaSpelare, kopa, visaMeddelande, efterSalj) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.kopa = kopa || null;
        this.visaMeddelande = visaMeddelande || (() => {});
        this.efterSalj = efterSalj || (() => {});

        this.saljDialogAktiv = false;
        this.saljDialogIndex = -1;
        this.saljDialogMax = 0;
        this.saljDialogCount = 1;
        this.saljDialogNamn = '';
        this.saljDialogPris = { c: 1 };
    }

    arDialogAktiv() {
        return this.saljDialogAktiv;
    }

    hanteraDialogTangent(tangent) {
        if (!this.saljDialogAktiv) return;

        const stegNer = tangent === 'ArrowDown' || tangent === 's' || tangent === 'S';
        const stegUpp = tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W';
        const stegMinus = tangent === 'ArrowLeft' || tangent === 'a' || tangent === 'A';
        const stegPlus = tangent === 'ArrowRight' || tangent === 'd' || tangent === 'D';

        if (tangent === 'Escape') {
            this.stangSaljDialog();
            return;
        }
        if (tangent === 'Enter') {
            this.bekraftaSaljDialog();
            return;
        }
        if (stegMinus) {
            this.justeraSaljDialogCount(-1);
            return;
        }
        if (stegPlus) {
            this.justeraSaljDialogCount(1);
            return;
        }
        if (stegUpp) {
            this.justeraSaljDialogCount(5);
            return;
        }
        if (stegNer) {
            this.justeraSaljDialogCount(-5);
            return;
        }
    }

    hanteraEscape() {
        if (!this.saljDialogAktiv) return false;
        this.stangSaljDialog();
        return true;
    }

    oppnaSaljDialog(index, foremal, pris) {
        const count = foremal && foremal.count ? foremal.count : 1;
        const namn = foremal && foremal.namn ? foremal.namn : 'Föremål';
        this.saljDialogAktiv = true;
        this.saljDialogIndex = index;
        this.saljDialogMax = Math.max(1, count);
        this.saljDialogCount = Math.min(1, this.saljDialogMax);
        this.saljDialogNamn = namn;
        this.saljDialogPris = pris || { c: 1 };
    }

    stangSaljDialog() {
        this.saljDialogAktiv = false;
        this.saljDialogIndex = -1;
        this.saljDialogMax = 0;
        this.saljDialogCount = 1;
        this.saljDialogNamn = '';
        this.saljDialogPris = { c: 1 };
    }

    justeraSaljDialogCount(delta) {
        if (!this.saljDialogAktiv) return;
        const max = this.saljDialogMax;
        if (max <= 1) {
            this.saljDialogCount = 1;
            return;
        }

        let nytt = this.saljDialogCount + delta;
        if (nytt < 1) nytt = max;
        if (nytt > max) nytt = 1;
        this.saljDialogCount = nytt;
    }

    bekraftaSaljDialog() {
        if (!this.saljDialogAktiv) return;
        const index = this.saljDialogIndex;
        const antal = this.saljDialogCount;
        this.stangSaljDialog();
        this.genomforSalj(index, antal);
    }

    hamtaSaljLista() {
        const spelare = this.hamtaSpelare();
        if (!spelare || !spelare.utrustning) return [];
        const inventory = spelare.utrustning.inventory || [];
        return inventory.map((foremal, index) => {
            if (!foremal) return null;
            const count = foremal.count || 1;
            const namn = foremal.namn || foremal.id || 'Okänt';
            return {
                namn: count > 1 ? `${namn} x${count}` : namn,
                pris: this.hamtaSaljPris(foremal),
                _inventoryIndex: index,
                _ref: foremal
            };
        }).filter(Boolean);
    }

    hamtaSaljPris(foremal) {
        if (!foremal) return { c: 1 };
        if (!this.kopa) return { c: 1 };
        const namn = (foremal.namn || '').toLowerCase();
        const pris = this.kopa.hamtaPrisForNamn(namn);
        if (!pris) return { c: 1 };
        const koppar = this.kopa.valutaTillKoppar(pris);
        const saljKoppar = Math.max(1, Math.floor(koppar * 0.5));
        return this.kopa.kopparTillValuta(saljKoppar);
    }

    forsokSalj(index) {
        const lista = this.hamtaSaljLista();
        const entry = lista[index];
        if (!entry) return null;

        if (entry._ref && entry._ref.count && entry._ref.count > 1) {
            this.oppnaSaljDialog(entry._inventoryIndex, entry._ref, entry.pris);
            return entry._ref;
        }

        return this.genomforSalj(entry._inventoryIndex, 1);
    }

    genomforSalj(index, antal) {
        const spelare = this.hamtaSpelare();
        if (!spelare || !spelare.pengar || !spelare.utrustning) {
            this.visaMeddelande('Ingen spelare');
            return null;
        }

        const inventory = spelare.utrustning.inventory || [];
        const foremal = inventory[index];
        if (!foremal) return null;

        const maxAntal = foremal.count || 1;
        const saljAntal = Math.max(1, Math.min(maxAntal, antal || 1));
        const prisPer = this.hamtaSaljPris(foremal);
        const prisKoppar = this.kopa ? this.kopa.valutaTillKoppar(prisPer) * saljAntal : saljAntal;
        const spelareKoppar = this.kopa
            ? this.kopa.valutaTillKoppar({
                g: spelare.pengar.guld,
                s: spelare.pengar.silver,
                c: spelare.pengar.koppar
            })
            : 0;

        const nySumma = spelareKoppar + prisKoppar;
        if (typeof spelare.registreraIntjanadePengar === 'function') {
            spelare.registreraIntjanadePengar({ koppar: prisKoppar });
        } else if (spelare.prestationer && typeof spelare.prestationer.totaltGuldSamlat === 'number') {
            spelare.prestationer.totaltGuldSamlat += prisKoppar;
        }
        if (this.kopa) {
            const uppdaterad = this.kopa.kopparTillValuta(nySumma);
            spelare.pengar.guld = uppdaterad.g;
            spelare.pengar.silver = uppdaterad.s;
            spelare.pengar.koppar = uppdaterad.c;
        }
        if (prisKoppar > 0 && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
            window.spelaStandardLjud('pengar');
        }

        if (foremal.count && foremal.count > saljAntal) {
            foremal.count -= saljAntal;
        } else {
            inventory[index] = null;
            if (spelare.utrustning && typeof spelare.utrustning.stadaTommaSvansrutor === 'function') {
                spelare.utrustning.stadaTommaSvansrutor();
            }
        }

        const namn = foremal.namn || 'Föremål';
        const suffix = saljAntal > 1 ? ` x${saljAntal}` : '';
        this.visaMeddelande(`Sålt ${namn}${suffix}`);
        this.efterSalj();
        return foremal;
    }

    ritaSaljDialog() {
        if (!this.saljDialogAktiv) return;

        const ctx = this.ctx;
        const canvas = this.canvas;
        const boxW = 360;
        const boxH = 160;
        const boxX = canvas.width / 2 - boxW / 2;
        const boxY = canvas.height / 2 - boxH / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(10, 10, 20, 0.92)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Hur många vill du sälja?', boxX + boxW / 2, boxY + 18);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${this.saljDialogNamn}`, boxX + boxW / 2, boxY + 44);

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`${this.saljDialogCount} / ${this.saljDialogMax}`, boxX + boxW / 2, boxY + 78);

        if (this.kopa) {
            const totalPris = this.kopa.valutaTillKoppar(this.saljDialogPris) * this.saljDialogCount;
            const totalValuta = this.kopa.kopparTillValuta(totalPris);
            const totalY = boxY + 106;
            ctx.fillStyle = '#9be7ff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Totalt:', boxX + 60, totalY);
            this.kopa.pengarHoverInfo = null;
            this.kopa.ritaPrisIkoner(ctx, totalValuta, boxX + boxW - 60, totalY);
            if (this.kopa.pengarHoverInfo) {
                this.kopa.ritaPengarTooltip(ctx, this.kopa.pengarHoverInfo.valuta, this.kopa.pengarHoverInfo.x, this.kopa.pengarHoverInfo.y);
            }
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pilar: ändra antal | Enter: sälj | Esc: avbryt', boxX + boxW / 2, boxY + 130);

        ctx.restore();
    }
}
