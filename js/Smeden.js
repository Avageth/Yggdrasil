class Smeden {
    constructor(canvas, ctx, hamtaSpelare) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);

        this.kopa = new Kopa(canvas, ctx, this.hamtaSpelare, (text) => this.visaMeddelande(text));
        this.salja = new Salja(
            canvas,
            ctx,
            this.hamtaSpelare,
            this.kopa,
            (text) => this.visaMeddelande(text),
            () => this.justeraValEfterSalj()
        );
        this.lage = 'start';
        this.startAlternativ = [
            { namn: 'Köpa', action: 'kopa' },
            { namn: 'Sälja', action: 'salj' },
            { namn: 'Uppgradera', action: 'uppgradera' }
        ];
        this.shopValdIndex = 0;
        this.shopItemBounds = [];
        this.shopHoverIndex = -1;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.meddelande = null;

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Smeden.png';
        this.bild.onload = () => {
            this.bildLaddad = true;
            console.log('Smeden-bild laddad!');
        };
        this.bild.onerror = () => {
            console.log('Kunde inte ladda Smeden-bild från: assets/platser/Smeden.png');
        };
    }

    visa() {
        this.visas = true;
        this.lage = 'start';
        this.shopValdIndex = 0;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.salja.stangSaljDialog();
    }

    dolj() {
        this.visas = false;
    }

    rita() {
        if (!this.visas) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        if (this.bildLaddad) {
            ctx.drawImage(this.bild, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Smeden', canvas.width / 2, canvas.height / 2);
        }

        this.ritaShopLista();
        this.kopa.ritaProduktPreview(this.lage, this.shopHoverIndex, this.shopValdIndex);
        this.salja.ritaSaljDialog();
        this.ritaMeddelande();
    }

    hanteraTangent(tangent) {
        if (!this.visas) return;

        if (this.salja.arDialogAktiv()) {
            this.salja.hanteraDialogTangent(tangent);
            return;
        }

        const upp = tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W' || tangent === 'a' || tangent === 'A' || tangent === 'ArrowLeft';
        const ner = tangent === 'ArrowDown' || tangent === 's' || tangent === 'S' || tangent === 'd' || tangent === 'D' || tangent === 'ArrowRight';
        const lista = this.hamtaAktivLista();
        const harLista = lista.length > 0;

        if (upp && harLista) {
            this.shopValdIndex = (this.shopValdIndex - 1 + lista.length) % lista.length;
            this.justeraScrollForVal();
        } else if (ner && harLista) {
            this.shopValdIndex = (this.shopValdIndex + 1) % lista.length;
            this.justeraScrollForVal();
        } else if (tangent === 'Enter') {
            if (this.lage === 'start') {
                this.hanteraStartVal(this.shopValdIndex);
            } else if (this.lage === 'kategorier') {
                this.kopa.sattAktivKategoriIndex(this.shopValdIndex);
                this.lage = 'produkter';
                this.shopValdIndex = 0;
                this.scrollOffset = 0;
                this.scrollTarget = 0;
            } else if (this.lage === 'produkter') {
                this.kopa.forsokKop(this.shopValdIndex);
            } else if (this.lage === 'salj' && harLista) {
                this.salja.forsokSalj(this.shopValdIndex);
            }
        }
    }

    hanteraEscape() {
        if (!this.visas) return false;

        if (this.salja.hanteraEscape()) {
            return true;
        }

        if (this.lage === 'produkter') {
            this.lage = 'kategorier';
            this.shopValdIndex = this.kopa.hamtaAktivKategoriIndex();
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return true;
        }

        if (this.lage === 'kategorier') {
            this.lage = 'start';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return true;
        }

        if (this.lage === 'salj') {
            this.lage = 'start';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return true;
        }

        return false;
    }

    hanteraKlick(musX, musY) {
        if (!this.visas) return;
        if (this.salja.arDialogAktiv()) return;

        const index = this.hamtaIndexFranMus(musX, musY);
        if (index !== null) {
            this.shopValdIndex = index;
            this.justeraScrollForVal();
            if (this.lage === 'start') {
                return this.hanteraStartVal(index);
            }
            if (this.lage === 'salj') {
                return this.salja.forsokSalj(index);
            }
            if (this.lage === 'kategorier') {
                this.kopa.sattAktivKategoriIndex(index);
                this.lage = 'produkter';
                this.shopValdIndex = 0;
                this.scrollOffset = 0;
                this.scrollTarget = 0;
                return this.hamtaAktivKategori();
            }
            return this.kopa.forsokKop(index);
        }
        return null;
    }

    hanteraMusMove(musX, musY) {
        if (!this.visas) return;
        this.kopa._musX = musX;
        this.kopa._musY = musY;

        if (this.salja.arDialogAktiv()) return;

        const index = this.hamtaIndexFranMus(musX, musY);
        this.shopHoverIndex = index === null ? -1 : index;
        if (index !== null) {
            this.shopValdIndex = index;
            this.justeraScrollForVal();
        }
    }

    hanteraScroll(delta) {
        if (!this.visas) return;
        if (this.salja.arDialogAktiv()) return;

        const maxScroll = this.beraknaMaxScroll();
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget + delta, maxScroll));
    }

    ritaShopLista() {
        const ctx = this.ctx;
        const panelBredd = 320;
        const panelHojd = 240;
        const panelX = 20;
        const panelY = 20;
        const headerHojd = 36;
        const footerHojd = 26;
        const listTop = panelY + headerHojd + 12;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;

        ctx.save();

        // Panelbakgrund
        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        // Titel
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('SMEDENS SHOP', panelX + 16, panelY + 12);

        // Varulista
        ctx.font = '14px Arial';
        const radHojd = 28;

        this.uppdateraScroll();

        // Klippningsyta för listan
        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 6, listTop - 6, panelBredd - 12, listHojd + 12);
        ctx.clip();

        this.kopa.pengarHoverInfo = null;
        this.shopItemBounds = [];
        const lista = this.hamtaAktivLista();
        if (lista.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('Inga föremål', panelX + panelBredd / 2, listTop + listHojd / 2);
            ctx.textAlign = 'left';
        } else {
            lista.forEach((vara, index) => {
                const y = listTop + index * radHojd - this.scrollOffset;
                const itemX = panelX + 10;
                const itemY = y - 4;
                const itemBredd = panelBredd - 20;
                const itemHojd = 22;

                if (index === this.shopValdIndex) {
                    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
                    ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
                } else if (index === this.shopHoverIndex) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillText(vara.namn, panelX + 16, y);

                if (this.lage === 'kategorier') {
                    const suffix = `${vara.produkter.length} st`;
                    ctx.fillStyle = '#9be7ff';
                    ctx.textAlign = 'right';
                    ctx.fillText(suffix, panelX + panelBredd - 16, y);
                    ctx.textAlign = 'left';
                } else {
                    this.kopa.ritaPrisIkoner(ctx, vara.pris, panelX + panelBredd - 16, y);
                }

                // Spara bounds bara om synlig
                if (y + itemHojd >= listTop && y <= listTop + listHojd) {
                    this.shopItemBounds.push({ index, x: itemX, y: itemY, bredd: itemBredd, hojd: itemHojd });
                }
            });
        }

        ctx.restore();

        if (this.kopa.pengarHoverInfo) {
            this.kopa.ritaPengarTooltip(ctx, this.kopa.pengarHoverInfo.valuta, this.kopa.pengarHoverInfo.x, this.kopa.pengarHoverInfo.y);
        }

        // Footer
        ctx.fillStyle = 'rgba(170, 170, 170, 0.9)';
        ctx.font = '12px Arial';
        const footerText = this.lage === 'start'
            ? 'Enter/klick: välj | ESC: lämna'
            : this.lage === 'kategorier'
                ? 'Enter/klick: öppna | ESC: tillbaka'
                : this.lage === 'salj'
                    ? 'Enter/klick: sälj | ESC: tillbaka'
                    : 'Enter/klick: köp | ESC: tillbaka';
        ctx.fillText(footerText, panelX + 16, panelY + panelHojd - 22);

        ctx.restore();
    }

    uppdateraScroll() {
        const maxScroll = this.beraknaMaxScroll();
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget, maxScroll));
        this.scrollOffset += (this.scrollTarget - this.scrollOffset) * 0.2;
        if (Math.abs(this.scrollTarget - this.scrollOffset) < 0.5) {
            this.scrollOffset = this.scrollTarget;
        }
    }

    beraknaMaxScroll() {
        const panelHojd = 240;
        const headerHojd = 36;
        const footerHojd = 26;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 28;
        const contentHojd = this.hamtaAktivLista().length * radHojd;
        return Math.max(0, contentHojd - listHojd);
    }

    justeraScrollForVal() {
        const panelHojd = 240;
        const headerHojd = 36;
        const footerHojd = 26;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 28;
        const itemTop = this.shopValdIndex * radHojd;
        const itemBottom = itemTop + radHojd;

        if (itemTop < this.scrollTarget) {
            this.scrollTarget = itemTop;
        } else if (itemBottom > this.scrollTarget + listHojd) {
            this.scrollTarget = itemBottom - listHojd;
        }

        const maxScroll = this.beraknaMaxScroll();
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget, maxScroll));
    }

    hamtaIndexFranMus(musX, musY) {
        const panelX = 20;
        const panelY = 20;
        const panelBredd = 320;
        const panelHojd = 240;
        const headerHojd = 36;
        const footerHojd = 26;
        const listTop = panelY + headerHojd + 12;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 28;

        const inomPanel = musX >= panelX && musX <= panelX + panelBredd && musY >= listTop && musY <= listTop + listHojd;
        if (!inomPanel) return null;

        const relY = musY - listTop + this.scrollOffset;
        const index = Math.floor(relY / radHojd);
        if (index < 0 || index >= this.hamtaAktivLista().length) return null;
        return index;
    }

    hamtaAktivKategori() {
        return this.kopa.hamtaAktivKategori();
    }

    hamtaAktivLista() {
        if (this.lage === 'start') return this.startAlternativ;
        if (this.lage === 'salj') return this.salja.hamtaSaljLista();
        if (this.lage === 'kategorier') return this.kopa.hamtaKategorier();
        return this.kopa.hamtaProdukter();
    }

    hanteraStartVal(index) {
        const alternativ = this.startAlternativ[index];
        if (!alternativ) return null;

        if (alternativ.action === 'kopa') {
            this.lage = 'kategorier';
            this.kopa.sattAktivKategoriIndex(0);
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return this.hamtaAktivKategori();
        }

        if (alternativ.action === 'salj') {
            this.lage = 'salj';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return null;
        }

        if (alternativ.action === 'uppgradera') {
            this.visaMeddelande('Uppgradera kommer snart');
            return null;
        }

        return null;
    }

    justeraValEfterSalj() {
        const nyLista = this.salja.hamtaSaljLista();
        if (nyLista.length === 0) {
            this.shopValdIndex = 0;
        } else if (this.shopValdIndex >= nyLista.length) {
            this.shopValdIndex = nyLista.length - 1;
        }
        this.justeraScrollForVal();
    }

    visaMeddelande(text) {
        this.meddelande = { text, tills: Date.now() + 5000 };
    }

    ritaMeddelande() {
        if (!this.meddelande) return;
        if (Date.now() > this.meddelande.tills) {
            this.meddelande = null;
            return;
        }

        const ctx = this.ctx;
        const canvas = this.canvas;
        const text = this.meddelande.text;

        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const paddingX = 16;
        const paddingY = 10;
        const textWidth = ctx.measureText(text).width;
        const boxW = textWidth + paddingX * 2;
        const boxH = 32 + paddingY;
        const x = canvas.width / 2 - boxW / 2 + 30;
        const y = canvas.height - 400;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x + boxW / 2, y + boxH / 2);
        ctx.restore();
    }

}
