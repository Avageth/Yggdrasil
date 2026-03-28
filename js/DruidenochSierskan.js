class DruidenochSierskan {
    constructor(canvas, ctx, hamtaSpelare) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);

        this.lage = 'start';
        this.startAlternativ = [
            { namn: 'Fyll på vatten', action: 'påfyllning', pris: { silver: 2 }, beskrivning: 'Fyll på en tom flaska med vatten' },
            { namn: 'Galdra energidryck', action: 'galdraEnergi', pris: { guld: 1 }, beskrivning: 'Galdra en flaska med vatten till en Energi dryck' },
            { namn: 'Galdra livsdryck', action: 'galdraLiv', pris: { guld: 1 }, beskrivning: 'Galdra en flaska med vatten till en Livs dryck' },
            { namn: 'Galdra vatten', action: 'galdraVatten', pris: { guld: 2 }, beskrivning: 'Galdra en flaska med vatten till en flaska med Galdrat vatten' },
            { namn: 'Blota', action: 'blota', pris: null, beskrivning: 'Offra 9 köttbitar för en kravnivå' }
        ];
        this.blotaAlternativ = [
            { namn: 'Blota: Konstruktion', action: 'blotaKrav', key: 'konstruktion', pris: null, beskrivning: 'Höj Konstruktion med 1' },
            { namn: 'Blota: Reflex', action: 'blotaKrav', key: 'reflex', pris: null, beskrivning: 'Höj Reflex med 1' },
            { namn: 'Blota: Special', action: 'blotaKrav', key: 'special', pris: null, beskrivning: 'Höj Special med 1' }
        ];
        this.shopValdIndex = 0;
        this.shopItemBounds = [];
        this.shopHoverIndex = -1;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.meddelande = null;

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Druiden_och_Sierskan.png';
        this.bild.onload = () => {
            this.bildLaddad = true;
            console.log('DruidenochSierskan-bild laddad!');
        };
        this.bild.onerror = () => {
            console.log('Kunde inte ladda DruidenochSierskan-bild, använder placeholder');
        };

        this.pengarBildCache = {};
    }

    visa() {
        this.visas = true;
        this.lage = 'start';
        this.shopValdIndex = 0;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
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
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Druiden och Sierskan', canvas.width / 2, canvas.height / 2);
        }

        this.ritaShopLista();
        this.ritaPreview();
        this.ritaMeddelande();
    }

    hanteraTangent(tangent) {
        if (!this.visas) return;

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
        } else if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
            this.hanteraStartVal(this.shopValdIndex);
        }
    }

    hanteraEscape() {
        if (!this.visas) return false;
        if (this.lage === 'blota') {
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

        const index = this.hamtaIndexFranMus(musX, musY);
        if (index !== null) {
            this.shopValdIndex = index;
            this.justeraScrollForVal();
            return this.hanteraStartVal(index);
        }
        return null;
    }

    hanteraMusMove(musX, musY) {
        this._musX = musX;
        this._musY = musY;
        if (!this.visas) return;

        const index = this.hamtaIndexFranMus(musX, musY);
        this.shopHoverIndex = index === null ? -1 : index;
        if (index !== null) {
            this.shopValdIndex = index;
            this.justeraScrollForVal();
        }
    }

    hanteraScroll(delta) {
        if (!this.visas) return;

        const maxScroll = this.beraknaMaxScroll();
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget + delta, maxScroll));
    }

    ritaShopLista() {
        if (typeof console !== 'undefined' && console.debug) console.debug('DruidenochSierskan: ritaShopLista called, lage=', this.lage);
        const ctx = this.ctx;
        const panelBredd = 320;
        const panelHojd = 280;
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
        ctx.fillText('MYSTISKA TJÄNSTER', panelX + 16, panelY + 12);

        // Varulista
        ctx.font = '14px Arial';
        const radHojd = 32;

        this.uppdateraScroll();

        // Klippningsyta för listan
        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 6, listTop - 6, panelBredd - 12, listHojd + 12);
        ctx.clip();

        this._shopPengarHoverInfo = null;
        this.shopItemBounds = [];
        const lista = this.hamtaAktivLista();
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        lista.forEach((vara, index) => {
            const y = listTop + index * radHojd - this.scrollOffset;
            const itemX = panelX + 10;
            const itemY = y - 4;
            const itemBredd = panelBredd - 20;
            const itemHojd = 28;

            if (index === this.shopValdIndex) {
                ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
                ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
            } else if (index === this.shopHoverIndex) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.textAlign = 'left';
            ctx.fillText(vara.namn, panelX + 16, y);

            // Rita pris
            this.ritaPrisIkoner(ctx, vara.pris, panelX + panelBredd - 16, y);

            // Spara bounds bara om synlig
            if (y + itemHojd >= listTop && y <= listTop + listHojd) {
                this.shopItemBounds.push({ index, x: itemX, y: itemY, bredd: itemBredd, hojd: itemHojd });
            }
        });

        ctx.restore();

        if (this._shopPengarHoverInfo && typeof ShopUI !== 'undefined') {
            ShopUI.ritaPengarTooltip(this, this._shopPengarHoverInfo.valuta, this._shopPengarHoverInfo.x, this._shopPengarHoverInfo.y);
        }

        // Footer
        ctx.fillStyle = 'rgba(170, 170, 170, 0.9)';
        ctx.font = '12px Arial';
        const footerText = 'Enter/E/klick: välj | ESC: lämna';
        ctx.fillText(footerText, panelX + 16, panelY + panelHojd - 22);

        ctx.restore();
    }

    ritaPrisIkoner(ctx, pris, xPos, yPos) {
        if (typeof ShopUI !== 'undefined') {
            ShopUI.ritaPrisIkoner(this, pris, xPos, yPos);
            return;
        }
        if (!pris) return; // fallback
    }

    hamtaPengarBild(src) {
        if (typeof ShopUI !== 'undefined') return ShopUI.hamtaPengarBild(src);
        if (!this.pengarBildCache[src]) {
            const img = new Image();
            img.src = src;
            this.pengarBildCache[src] = img;
        }
        return this.pengarBildCache[src];
    }

    ritaPreview() {
        if (typeof ShopUI !== 'undefined') {
            ShopUI.ritaPreview(this);
            return;
        }
    }

    uppdateraScroll() {
        if (typeof ShopUI !== 'undefined') {
            ShopUI.uppdateraScroll(this);
            return;
        }
        const maxScroll = this.beraknaMaxScroll();
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget, maxScroll));
        this.scrollOffset += (this.scrollTarget - this.scrollOffset) * 0.2;
        if (Math.abs(this.scrollTarget - this.scrollOffset) < 0.5) {
            this.scrollOffset = this.scrollTarget;
        }
    }

    beraknaMaxScroll() {
        if (typeof ShopUI !== 'undefined') return ShopUI.beraknaMaxScroll(this);
        const panelHojd = 280;
        const headerHojd = 36;
        const footerHojd = 26;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 32;
        const contentHojd = this.hamtaAktivLista().length * radHojd;
        return Math.max(0, contentHojd - listHojd);
    }

    justeraScrollForVal() {
        if (typeof ShopUI !== 'undefined') {
            ShopUI.justeraScrollForVal(this);
            return;
        }
        const panelHojd = 280;
        const headerHojd = 36;
        const footerHojd = 26;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 32;
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
        if (typeof ShopUI !== 'undefined') return ShopUI.hamtaIndexFranMus(this, musX, musY);
        const panelX = 20;
        const panelY = 20;
        const panelBredd = 320;
        const panelHojd = 280;
        const headerHojd = 36;
        const footerHojd = 26;
        const listTop = panelY + headerHojd + 12;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 32;

        const inomPanel = musX >= panelX && musX <= panelX + panelBredd && musY >= listTop && musY <= listTop + listHojd;
        if (!inomPanel) return null;

        const relY = musY - listTop + this.scrollOffset;
        const index = Math.floor(relY / radHojd);
        if (index < 0 || index >= this.hamtaAktivLista().length) return null;
        return index;
    }

    hamtaAktivLista() {
        return this.lage === 'blota' ? this.blotaAlternativ : this.startAlternativ;
    }

    hanteraStartVal(index) {
        const lista = this.hamtaAktivLista();
        const alternativ = lista[index];
        if (!alternativ) return null;

        const spelare = this.hamtaSpelare();
        if (!spelare) {
            this.visaMeddelande('Ingen spelare hittad');
            return null;
        }

        if (this.lage === 'blota' && alternativ.action === 'blotaKrav') {
            return this.utforBlot(spelare, alternativ.key);
        }

        if (alternativ.action === 'blota') {
            return this.startaBlot(spelare);
        }

        // Kontrollera om spelaren har råd
        const harRad = this.kontrolleraRad(spelare, alternativ.pris);
        if (!harRad) {
            this.visaMeddelande('Du har inte råd!');
            return null;
        }

        // Utför åtgärden
        if (alternativ.action === 'påfyllning') {
            // Fyll på tom flaska med vatten
            if (!spelare.utrustning) {
                this.visaMeddelande('Ingen utrustning hittad!');
                return null;
            }
            
            // Hitta tom flaska i inventory
            const tomFlaskaIndex = spelare.utrustning.inventory.findIndex(item => item && item.id === 'tom flaska');
            if (tomFlaskaIndex === -1) {
                this.visaMeddelande('Du har ingen tom flaska!');
                return null;
            }
            
            this.taPengar(spelare, alternativ.pris);
            spelare.utrustning.taBortForemal(tomFlaskaIndex);
            spelare.utrustning.laggTillForemal('flaskaMedVatten', { source: 'purchase' });
            this.visaMeddelande('Fyllt på en flaska med vatten!');
            
        } else if (alternativ.action === 'galdraEnergi') {
            // Galdra flaska med vatten till energidryck
            if (!spelare.utrustning) {
                this.visaMeddelande('Ingen utrustning hittad!');
                return null;
            }
            
            const vattenIndex = spelare.utrustning.inventory.findIndex(item => item && item.id === 'flaskaMedVatten');
            if (vattenIndex === -1) {
                this.visaMeddelande('Du har ingen flaska med vatten!');
                return null;
            }
            
            this.taPengar(spelare, alternativ.pris);
            spelare.utrustning.taBortForemal(vattenIndex);
            spelare.utrustning.laggTillForemal('energiDryck', { source: 'purchase' });
            this.visaMeddelande('Galdrat till en Energi dryck!');
            
        } else if (alternativ.action === 'galdraLiv') {
            // Galdra flaska med vatten till livsdryck
            if (!spelare.utrustning) {
                this.visaMeddelande('Ingen utrustning hittad!');
                return null;
            }
            
            const vattenIndex = spelare.utrustning.inventory.findIndex(item => item && item.id === 'flaskaMedVatten');
            if (vattenIndex === -1) {
                this.visaMeddelande('Du har ingen flaska med vatten!');
                return null;
            }
            
            this.taPengar(spelare, alternativ.pris);
            spelare.utrustning.taBortForemal(vattenIndex);
            spelare.utrustning.laggTillForemal('hälsoDryck', { source: 'purchase' });
            this.visaMeddelande('Galdrat till en Livs dryck!');
            
        } else if (alternativ.action === 'galdraVatten') {
            // Galdra flaska med vatten till galdrat vatten
            if (!spelare.utrustning) {
                this.visaMeddelande('Ingen utrustning hittad!');
                return null;
            }
            
            const vattenIndex = spelare.utrustning.inventory.findIndex(item => item && item.id === 'flaskaMedVatten');
            if (vattenIndex === -1) {
                this.visaMeddelande('Du har ingen flaska med vatten!');
                return null;
            }
            
            this.taPengar(spelare, alternativ.pris);
            spelare.utrustning.taBortForemal(vattenIndex);
            spelare.utrustning.laggTillForemal('galdratVatten', { source: 'purchase' });
            this.visaMeddelande('Galdrat till Galdrat vatten!');
        }

        return null;
    }

    hamtaKottbitAntal(spelare) {
        if (!spelare || !spelare.utrustning) return 0;
        const inventory = spelare.utrustning.inventory || [];
        return inventory.reduce((sum, item) => {
            if (item && item.id === 'kottbit') {
                return sum + (item.count || 1);
            }
            return sum;
        }, 0);
    }

    taKottbitar(spelare, antal) {
        if (!spelare || !spelare.utrustning) return false;
        let kvar = antal;
        const inventory = spelare.utrustning.inventory || [];
        for (let i = inventory.length - 1; i >= 0 && kvar > 0; i--) {
            const item = inventory[i];
            if (!item || item.id !== 'kottbit') continue;
            const count = item.count || 1;
            if (count > kvar) {
                item.count = count - kvar;
                kvar = 0;
            } else {
                kvar -= count;
                inventory[i] = null;
            }
        }
        if (spelare.utrustning && typeof spelare.utrustning.stadaTommaSvansrutor === 'function') {
            spelare.utrustning.stadaTommaSvansrutor();
        }
        return kvar === 0;
    }

    startaBlot(spelare) {
        if (!spelare || !spelare.utrustning) {
            this.visaMeddelande('Ingen utrustning hittad!');
            return null;
        }

        const kottbitar = this.hamtaKottbitAntal(spelare);
        if (kottbitar < 9) {
            this.visaMeddelande('Du behöver 9 köttbitar');
            return null;
        }

        const krav = spelare.krav || { konstruktion: 1, reflex: 1, special: 1, max: 8 };
        const max = krav.max || 8;
        const fullt = (krav.konstruktion >= max)
            && (krav.reflex >= max)
            && (krav.special >= max);
        if (fullt) {
            this.visaMeddelande('Alla krav är redan max');
            return null;
        }

        this.lage = 'blota';
        this.shopValdIndex = 0;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        return null;
    }

    utforBlot(spelare, key) {
        if (!spelare || !spelare.utrustning) return null;
        if (!key) return null;

        const kottbitar = this.hamtaKottbitAntal(spelare);
        if (kottbitar < 9) {
            this.visaMeddelande('Du behöver 9 köttbitar');
            return null;
        }

        const krav = spelare.krav || { konstruktion: 1, reflex: 1, special: 1, max: 8 };
        const max = krav.max || 8;
        const current = krav[key] || 0;
        if (current >= max) {
            this.visaMeddelande('Den nivån är redan max');
            return null;
        }

        if (!this.taKottbitar(spelare, 9)) {
            this.visaMeddelande('Du behöver 9 köttbitar');
            return null;
        }

        spelare.krav[key] = Math.min(max, current + 1);
        this.visaMeddelande('Kravnivå höjd!');
        this.lage = 'start';
        this.shopValdIndex = 0;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        return null;
    }

    kontrolleraRad(spelare, pris) {
        if (typeof ShopUI !== 'undefined') return ShopUI.kontrolleraRad(spelare, pris);
        if (!pris || !spelare.pengar) return true;

        const kopparTotalt = spelare.pengar.koppar + (spelare.pengar.silver * 10) + (spelare.pengar.guld * 100);
        const prisTotalt = (pris.koppar || 0) + ((pris.silver || 0) * 10) + ((pris.guld || 0) * 100);

        return kopparTotalt >= prisTotalt;
    }

    taPengar(spelare, pris) {
        if (typeof ShopUI !== 'undefined') return ShopUI.taPengar(spelare, pris);
        if (!pris || !spelare.pengar) return;
        const kopparTotalt = (spelare.pengar.koppar || 0)
            + (spelare.pengar.silver || 0) * 10
            + (spelare.pengar.guld || 0) * 100;
        const prisTotalt = (pris.koppar || 0)
            + (pris.silver || 0) * 10
            + (pris.guld || 0) * 100;
        const kvar = Math.max(0, kopparTotalt - prisTotalt);

        const guld = Math.floor(kvar / 100);
        const kvarEfterGuld = kvar % 100;
        const silver = Math.floor(kvarEfterGuld / 10);
        const koppar = kvarEfterGuld % 10;

        spelare.pengar.guld = guld;
        spelare.pengar.silver = silver;
        spelare.pengar.koppar = koppar;
    }

    visaMeddelande(text) {
        if (typeof ShopUI !== 'undefined') return ShopUI.visaMeddelande(this, text);
        this.meddelande = { text, tills: Date.now() + 5000 };
    }

    ritaMeddelande() {
        if (typeof ShopUI !== 'undefined') {
            ShopUI.ritaMeddelande(this);
            return;
        }
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
        const x = canvas.width / 2 - boxW / 2;
        const y = canvas.height - 80;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = '#00ff88';
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
