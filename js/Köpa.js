class Kopa {
    constructor(canvas, ctx, hamtaSpelare, visaMeddelande) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.visaMeddelande = visaMeddelande || (() => {});

        this.kategorier = [
            { namn: 'Special', produkter: [
                { namn: 'Högaffel', pris: { g: 0, s: 2, c: 0 }, strid: { fysisk: 20, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Högaffel.png' },
                { namn: 'Pinne', pris: { g: 0, s: 0, c: 5 }, strid: { fysisk: 10, eld: 0, magi: 0 }, jakt: { fysisk: 0, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Pinne.png' }
            ] },
            { namn: 'Svärd', produkter: [
                { namn: 'Träsvärd', pris: { g: 0, s: 1, c: 3 }, strid: { fysisk: 20, eld: 0, magi: 0 }, jakt: { fysisk: 10, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Träsvärd.png' },
                { namn: 'Järnsvärd', pris: { g: 0, s: 4, c: 4 }, strid: { fysisk: 50, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Järnsvärd.png' }
            ] },
            { namn: 'Knivar', produkter: [
                { namn: 'Dolk', pris: { g: 1, s: 3, c: 5 }, strid: { fysisk: 50, eld: 0, magi: 0 }, jakt: { fysisk: 50, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Dolk.png' }
            ] },
            { namn: 'Klubbor', produkter: [
                { namn: 'Träklubba', pris: { g: 1, s: 5, c: 0 }, strid: { fysisk: 30, eld: 0, magi: 0 }, jakt: { fysisk: 10, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Träklubba.png' },
                { namn: 'JärnKlubba', pris: { g: 3, s: 2, c: 3 }, strid: { fysisk: 60, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Järnklubba.png' }
            ] },
            { namn: 'Hammare', produkter: [
                { namn: 'Stridshammare', pris: { g: 3, s: 8, c: 8 }, strid: { fysisk: 80, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Stridshammare.png' }
            ] },
            { namn: 'Spjut', produkter: [
                { namn: 'Träspjut', pris: { g: 2, s: 7, c: 1 }, strid: { fysisk: 20, eld: 0, magi: 0 }, jakt: { fysisk: 50, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Träspjut.png' },
                { namn: 'Järnspjut', pris: { g: 4, s: 9, c: 6 }, strid: { fysisk: 50, eld: 0, magi: 0 }, jakt: { fysisk: 70, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Järnspjut.png' }
            ] },
            { namn: 'Sköldar', produkter: [
                { namn: 'Trä Sköld', pris: { g: 2, s: 1, c: 9 }, försvar: { fysisk: 10, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Trä Sköld.png' },
                { namn: 'Järn Sköld', pris: { g: 4, s: 3, c: 7 }, försvar: { fysisk: 20, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Järn Sköld.png' }
            ] },
            { namn: 'Hjälmar', produkter: [
                { namn: 'Viking Hjälm', pris: { g: 5, s: 0, c: 0 }, försvar: { fysisk: 30, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Viking Hjälm.png' }
            ] },
            { namn: 'Rustningar', produkter: [
                { namn: 'Sko', pris: { g: 0, s: 6, c: 4 }, försvar: { fysisk: 10, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Sko.png' },
                { namn: 'Ringbrynja', pris: { g: 4, s: 6, c: 9 }, försvar: { fysisk: 30, eld: 0, magi: 0 }, bild: 'assets/Utrustning/Ringbrynja.png' }
            ] },
            { namn: 'Varor', produkter: [
                { namn: 'Trä', pris: { g: 0, s: 1, c: 0 }, bild: 'assets/Varor/Trä.png' },
                { namn: 'Sten', pris: { g: 0, s: 1, c: 0 }, bild: 'assets/Varor/Sten.png' },
                { namn: 'Järn', pris: { g: 0, s: 2, c: 0 }, bild: 'assets/Varor/Järn.png' },
                { namn: 'Titanit', pris: { g: 2, s: 0, c: 0 }, bild: 'assets/Varor/Titanit.png' },
                { namn: 'Tom Flaska', pris: { g: 0, s: 5, c: 0 }, bild: 'assets/Varor/Tom Flaska.png' },
                { namn: 'Köttbit', pris: { g: 0, s: 2, c: 0 }, bild: 'assets/Varor/Köttbit.png' }
            ] }
        ];

        this.aktivKategoriIndex = 0;
        this.bildCache = {};
        this.myntIkoner = {
            g: 'assets/ikoner/Guld.png',
            s: 'assets/ikoner/Silver.png',
            c: 'assets/ikoner/Koppar.png'
        };
        this.elementIkoner = {
            fysisk: 'assets/Ikoner/Element Fysisk.png',
            eld: 'assets/Ikoner/Element Eld.png',
            magi: 'assets/Ikoner/Element Magi.png'
        };
        this.kravIkoner = {
            konstruktion: 'assets/Ikoner/Konstruktion_Aktiv.png',
            reflex: 'assets/Ikoner/Reflex_Aktiv.png',
            special: 'assets/Ikoner/Special_Aktiv.png'
        };
        this.kravInfo = {
            konstruktion: { namn: 'Konstruktion', beskrivning: 'Anvands som utrustningskrav for robusta foremal och vissa passiver.' },
            reflex: { namn: 'Reflex', beskrivning: 'Anvands som utrustningskrav for smidiga foremal och vissa passiver.' },
            special: { namn: 'Special', beskrivning: 'Anvands som utrustningskrav for sarskilda foremal och vissa passiver.' }
        };
        this.myntInfo = {
            g: { namn: 'Guld', beskrivning: 'Den mest vardefulla valutan. Anvands for dyra kop och storre beloningar.' },
            s: { namn: 'Silver', beskrivning: 'En vanlig valuta for handel, uppdrag och utrustning.' },
            c: { namn: 'Koppar', beskrivning: 'Den minsta valutan. Anvands ofta for billiga varor och mindre kostnader.' }
        };
        this.elementInfo = {
            fysisk: { namn: 'Fysisk', beskrivning: 'Vanlig skada och motstånd från vapen, slag och rå styrka.' },
            eld: { namn: 'Eld', beskrivning: 'Brännande skada och skydd mot hetta, lågor och eldattacker.' },
            magi: { namn: 'Magi', beskrivning: 'Mystisk skada och motstånd mot besvärjelser och magiska krafter.' }
        };
        this._musX = null;
        this._musY = null;
        this.pengarHoverInfo = null;
        this.valutaKurs = { g: 100, s: 10, c: 1 };
        this.namnTillForemalId = {
            'Högaffel': 'Högaffel',
            'Träsvärd': 'Träsvärd',
            'Träklubba': 'Träklubba',
            'JärnKlubba': 'Järnklubba',
            'Stridshammare': 'hammare',
            'Järnspjut': 'Järnspjut',
            'Sko': 'sko',
            'Ringbrynja': 'Ringbrynja',
            'Trä Sköld': 'Träsköld',
            'Träsköld': 'Träsköld',
            'Järn Sköld': 'Järnsköld',
            'Viking Hjälm': 'vikingHjalm',
            'Trä': 'tra',
            'Sten': 'sten',
            'Järn': 'jarn'
        };
    }

    sattAktivKategoriIndex(index) {
        const max = this.kategorier.length - 1;
        const nytt = Math.max(0, Math.min(max, index));
        this.aktivKategoriIndex = nytt;
    }

    hamtaAktivKategoriIndex() {
        return this.aktivKategoriIndex;
    }

    hamtaKategorier() {
        return this.kategorier;
    }

    hamtaAktivKategori() {
        return this.kategorier[this.aktivKategoriIndex];
    }

    hamtaProdukter() {
        const kat = this.hamtaAktivKategori();
        return kat ? kat.produkter : [];
    }

    hamtaAktivProdukt(hoverIndex, valdIndex) {
        const lista = this.hamtaProdukter();
        if (lista.length === 0) return null;
        const index = hoverIndex >= 0 ? hoverIndex : valdIndex;
        return lista[index] || null;
    }

    ritaProduktPreview(lage, hoverIndex, valdIndex) {
        if (lage !== 'produkter') return;

        const aktiv = this.hamtaAktivProdukt(hoverIndex, valdIndex);
        if (!aktiv || !aktiv.bild) return;

        const ctx = this.ctx;
        const previewBredd = 320;
        const previewHojd = 300;
        const previewX = 20;
        const previewY = 270;

        ctx.save();

        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(previewX, previewY, previewBredd, previewHojd, 10);
        ctx.fill();
        ctx.stroke();

        const bild = this.hamtaBild(aktiv.bild);
        if (bild && bild.complete && bild.naturalWidth > 0) {
            const pad = 12;
            const maxW = (previewBredd - pad * 2) * 0.85;
            const maxH = (previewHojd - pad * 2 - 22) * 0.85;
            const scale = Math.min(maxW / bild.width, maxH / bild.height);
            const drawW = bild.width * scale;
            const drawH = bild.height * scale;
            const drawX = previewX + (previewBredd - drawW) / 2;
            const topGap = 8;
            const drawY = previewY + pad + topGap;
            ctx.drawImage(bild, drawX, drawY, drawW, drawH);
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Laddar bild...', previewX + previewBredd / 2, previewY + previewHojd / 2);
        }

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const statY = previewY + previewHojd - 52;
        let hoveredElement = null;
        let hoveredKrav = null;
        if (this.harStats(aktiv)) {
            hoveredElement = this.ritaStatsIkoner(ctx, aktiv, previewX + previewBredd / 2, statY);
        }

        if (this.skaVisaKravForProdukt(aktiv)) {
            const krav = this.hamtaKravForProdukt(aktiv);
            hoveredKrav = this.ritaKravIkoner(ctx, krav, previewX + previewBredd / 2, previewY + previewHojd - 10);
        }

        if (hoveredElement) {
            this.ritaElementTooltip(ctx, hoveredElement.element, hoveredElement.x, hoveredElement.y);
        } else if (hoveredKrav) {
            this.ritaKravTooltip(ctx, hoveredKrav.krav, hoveredKrav.x, hoveredKrav.y);
        }

        ctx.restore();
    }

    brytTextTillRader(ctx, text, maxBredd) {
        const ord = String(text || '').split(/\s+/).filter(Boolean);
        const rader = [];
        let aktuellRad = '';

        for (const del of ord) {
            const testRad = aktuellRad ? aktuellRad + ' ' + del : del;
            if (aktuellRad && ctx.measureText(testRad).width > maxBredd) {
                rader.push(aktuellRad);
                aktuellRad = del;
            } else {
                aktuellRad = testRad;
            }
        }

        if (aktuellRad) rader.push(aktuellRad);
        return rader;
    }

    ritaElementTooltip(ctx, element, musX, musY) {
        const info = this.elementInfo[element];
        const ikon = this.hamtaBild(this.elementIkoner[element]);
        if (!info) return;

        const iconSize = 52;
        const maxTextBredd = 176;
        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(ctx, info.beskrivning, maxTextBredd);
        const boxW = 210;
        const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
        let boxX = musX + 16;
        let boxY = musY - boxH / 2;

        if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
        if (boxY < 0) boxY = 0;
        if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

        ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        const ikonX = boxX + (boxW - iconSize) / 2;
        const ikonY = boxY + 12;
        ctx.fillStyle = 'rgba(77, 109, 140, 0.28)';
        ctx.fillRect(boxX + 16, ikonY - 6, boxW - 32, iconSize + 12);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(info.namn, boxX + boxW / 2, ikonY + iconSize + 10);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#d9ecff';
        let textY = ikonY + iconSize + 30;
        for (const rad of rader) {
            ctx.fillText(rad, boxX + boxW / 2, textY);
            textY += 15;
        }
        ctx.restore();
    }

    ritaKravTooltip(ctx, krav, musX, musY) {
        const info = this.kravInfo[krav];
        const ikon = this.hamtaBild(this.kravIkoner[krav]);
        if (!info) return;

        const iconSize = 52;
        const maxTextBredd = 176;
        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(ctx, info.beskrivning, maxTextBredd);
        const boxW = 210;
        const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
        let boxX = musX + 16;
        let boxY = musY - boxH / 2;

        if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
        if (boxY < 0) boxY = 0;
        if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

        ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        const ikonX = boxX + (boxW - iconSize) / 2;
        const ikonY = boxY + 12;
        ctx.fillStyle = 'rgba(77, 109, 140, 0.28)';
        ctx.fillRect(boxX + 16, ikonY - 6, boxW - 32, iconSize + 12);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(info.namn, boxX + boxW / 2, ikonY + iconSize + 10);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#d9ecff';
        let textY = ikonY + iconSize + 30;
        for (const rad of rader) {
            ctx.fillText(rad, boxX + boxW / 2, textY);
            textY += 15;
        }
        ctx.restore();
    }

    ritaPengarTooltip(ctx, valuta, musX, musY) {
        const info = this.myntInfo[valuta];
        const ikon = this.hamtaBild(this.myntIkoner[valuta]);
        if (!info) return;

        const iconSize = 52;
        const maxTextBredd = 176;
        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(ctx, info.beskrivning, maxTextBredd);
        const boxW = 210;
        const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
        let boxX = musX + 16;
        let boxY = musY - boxH / 2;

        if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
        if (boxY < 0) boxY = 0;
        if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

        ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        const ikonX = boxX + (boxW - iconSize) / 2;
        const ikonY = boxY + 12;
        ctx.fillStyle = 'rgba(77, 109, 140, 0.28)';
        ctx.fillRect(boxX + 16, ikonY - 6, boxW - 32, iconSize + 12);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(info.namn, boxX + boxW / 2, ikonY + iconSize + 10);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#d9ecff';
        let textY = ikonY + iconSize + 30;
        for (const rad of rader) {
            ctx.fillText(rad, boxX + boxW / 2, textY);
            textY += 15;
        }
        ctx.restore();
    }

    hamtaBild(src) {
        if (!this.bildCache[src]) {
            const img = new Image();
            img.src = src;
            this.bildCache[src] = img;
        }
        return this.bildCache[src];
    }

    skaVisaKravForProdukt(produkt) {
        if (!produkt || typeof Krav !== 'function') return false;
        const typ = this.gissaProduktTyp(produkt);
        return ['vapen', 'verktyg', 'rustning', 'skold', 'hjalm'].includes(typ);
    }

    hamtaKravForProdukt(produkt) {
        const spelare = this.hamtaSpelare();
        const foremalId = this.hamtaForemalIdFranNamn(spelare, produkt.namn);
        return Krav.hamtaKravForForemal({ id: foremalId, namn: produkt.namn });
    }

    ritaPrisIkoner(ctx, pris, rightX, y) {
        if (!pris) return;

        const coinSize = 18;
        const gap = 6;
        const textGap = 4;
        const yOffset = 8;
        let cursorX = rightX;

        const ordning = [
            { key: 'c', color: '#d19a66' },
            { key: 's', color: '#b0c4de' },
            { key: 'g', color: '#ffd166' }
        ];

        ctx.save();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '14px Arial';

        ordning.forEach(({ key, color }) => {
            const val = pris[key] || 0;
            if (!val) return;

            const img = this.hamtaBild(this.myntIkoner[key]);
            const iconX = cursorX - coinSize;
            const iconY = (y + yOffset) - coinSize / 2;

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, iconX, iconY, coinSize, coinSize);
            } else {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(iconX + coinSize / 2, iconY + coinSize / 2, coinSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }

            if (typeof this._musX === 'number' && typeof this._musY === 'number' && this._musX >= iconX && this._musX <= iconX + coinSize && this._musY >= iconY && this._musY <= iconY + coinSize) {
                this.pengarHoverInfo = { valuta: key, x: this._musX, y: this._musY };
            }

            cursorX = iconX - textGap;
            ctx.fillStyle = '#ffd166';
            ctx.fillText(`${val}`, cursorX, y + yOffset);
            cursorX -= ctx.measureText(`${val}`).width + gap;
        });

        ctx.restore();
    }

    ritaKravIkoner(ctx, krav, centerX, baselineY) {
        if (!krav) return;

        const entries = [
            { key: 'konstruktion', value: krav.konstruktion || 0 },
            { key: 'reflex', value: krav.reflex || 0 },
            { key: 'special', value: krav.special || 0 }
        ];
        const iconSize = 16;
        const iconGap = 5;
        const pairGap = 10;
        const label = 'Krav:';

        ctx.save();
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#ffd166';
        let hoveredKrav = null;

        let totalWidth = ctx.measureText(label).width + iconGap;
        entries.forEach((entry, index) => {
            totalWidth += iconSize + iconGap + ctx.measureText(String(entry.value)).width;
            if (index < entries.length - 1) totalWidth += pairGap;
        });

        let drawX = centerX - totalWidth / 2;
        ctx.fillText(label, drawX, baselineY);
        drawX += ctx.measureText(label).width + iconGap;

        entries.forEach((entry, index) => {
            const ikon = this.hamtaBild(this.kravIkoner[entry.key]);
            const ikonX = drawX;
            const ikonY = baselineY - iconSize + 2;
            if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);
            }
            if (typeof this._musX === 'number' && typeof this._musY === 'number' && this._musX >= ikonX && this._musX <= ikonX + iconSize && this._musY >= ikonY && this._musY <= ikonY + iconSize) {
                hoveredKrav = { krav: entry.key, x: this._musX, y: this._musY };
            }
            drawX += iconSize + iconGap;
            ctx.fillText(String(entry.value), drawX, baselineY);
            drawX += ctx.measureText(String(entry.value)).width;
            if (index < entries.length - 1) drawX += pairGap;
        });

        ctx.restore();
        return hoveredKrav;
    }

    forsokKop(index) {
        const produkt = this.hamtaProdukter()[index];
        if (!produkt) return null;

        const spelare = this.hamtaSpelare();
        if (!spelare || !spelare.pengar) {
            this.visaMeddelande('Ingen spelare');
            return null;
        }

        const prisKoppar = this.valutaTillKoppar(produkt.pris);
        const spelareKoppar = this.valutaTillKoppar({
            g: spelare.pengar.guld,
            s: spelare.pengar.silver,
            c: spelare.pengar.koppar
        });

        if (spelareKoppar < prisKoppar) {
            this.visaMeddelande('Du har inte råd');
            return null;
        }

        if (!this.laggTillForemalIForrad(spelare, produkt)) {
            this.visaMeddelande('Förrådet är fullt');
            return null;
        }

        const kvar = spelareKoppar - prisKoppar;
        const uppdaterad = this.kopparTillValuta(kvar);
        spelare.pengar.guld = uppdaterad.g;
        spelare.pengar.silver = uppdaterad.s;
        spelare.pengar.koppar = uppdaterad.c;
        if (prisKoppar > 0 && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
            window.spelaStandardLjud('pengar', 0.38);
        }

        this.visaMeddelande('Köp genomfört');
        return produkt;
    }

    laggTillForemalIForrad(spelare, produkt) {
        if (!spelare || !spelare.utrustning || !produkt) return false;

        const foremalId = this.hamtaForemalIdFranNamn(spelare, produkt.namn);
        if (foremalId) {
            return spelare.utrustning.laggTillForemal(foremalId, { source: 'purchase' });
        }

        const foremal = {
            namn: produkt.namn,
            ikon: produkt.bild,
            typ: this.gissaProduktTyp(produkt),
            count: 1,
            strid: produkt.strid,
            jakt: produkt.jakt,
            forsvar: produkt.forsvar || produkt['försvar']
        };
        return spelare.utrustning.laggTillForemalObj(foremal, { source: 'purchase' });
    }

    hamtaForemalIdFranNamn(spelare, namn) {
        if (!spelare || !spelare.utrustning || !namn) return null;
        const foremal = spelare.utrustning.tillgangligaForemal || {};
        const explicitId = this.namnTillForemalId[namn];
        if (explicitId && foremal[explicitId]) return explicitId;
        const entries = Object.entries(foremal);
        for (const [id, def] of entries) {
            if (def && def.namn === namn) return id;
        }
        return null;
    }

    gissaProduktTyp(produkt) {
        if (!produkt) return 'vara';
        const forsvar = produkt.forsvar || produkt['försvar'];
        if (forsvar) return 'rustning';
        if (produkt.strid || produkt.jakt) return 'vapen';
        return 'vara';
    }

    normaliseraProduktNamn(namn) {
        return String(namn || '')
            .toLowerCase()
            .replace(/\s+/g, '')
            .trim();
    }

    hamtaPrisForNamn(namnLower) {
        if (!namnLower) return null;
        let pris = null;
        const sokNamn = this.normaliseraProduktNamn(namnLower);

        this.kategorier.some((kategori) => {
            return kategori.produkter.some((produkt) => {
                if (this.normaliseraProduktNamn(produkt.namn) === sokNamn && produkt.pris) {
                    pris = produkt.pris;
                    return true;
                }
                return false;
            });
        });

        return pris;
    }

    valutaTillKoppar(pris) {
        if (!pris) return 0;
        return (pris.g || 0) * this.valutaKurs.g + (pris.s || 0) * this.valutaKurs.s + (pris.c || 0) * this.valutaKurs.c;
    }

    kopparTillValuta(koppar) {
        let kvar = Math.max(0, koppar || 0);
        const g = Math.floor(kvar / this.valutaKurs.g);
        kvar -= g * this.valutaKurs.g;
        const s = Math.floor(kvar / this.valutaKurs.s);
        kvar -= s * this.valutaKurs.s;
        const c = kvar;
        return { g, s, c };
    }

    harStats(aktiv) {
        if (!aktiv) return false;
        const strid = aktiv.strid;
        const jakt = aktiv.jakt;
        const forsvar = aktiv.forsvar || aktiv['försvar'];
        const harStrid = strid && typeof strid === 'object';
        const harJakt = jakt && typeof jakt === 'object';
        const harForsvar = forsvar && typeof forsvar === 'object';
        return harStrid || harJakt || harForsvar;
    }

    ritaStatsIkoner(ctx, aktiv, centerX, y) {
        const strid = aktiv.strid;
        const jakt = aktiv.jakt;
        const forsvar = aktiv.forsvar || aktiv['försvar'];
        const iconSize = 18;
        const gap = 8;
        const valueGap = 6;
        const lineGap = 18;
        const labelGap = 8;

        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '14px Arial';

        const rader = [];
        if (strid && typeof strid === 'object') rader.push({ label: 'Strid', stats: strid });
        if (jakt && typeof jakt === 'object') rader.push({ label: 'Jakt', stats: jakt });
        if (forsvar && typeof forsvar === 'object') rader.push({ label: 'Försvar', stats: forsvar });
        if (rader.length === 0) {
            ctx.restore();
            return null;
        }

        let hoveredElement = null;

        let totalBredd = 0;
        rader.forEach((rad) => {
            totalBredd = Math.max(totalBredd, this.beraknaStatsRadBredd(ctx, rad.label, rad.stats, iconSize, gap, valueGap, labelGap));
        });
        const startX = centerX - totalBredd / 2;
        const totalHojd = (rader.length - 1) * lineGap;
        let startY = y - totalHojd / 2;

        rader.forEach((rad, index) => {
            const radY = startY + index * lineGap;
            const hovered = this.ritaStatsRad(ctx, startX, radY, rad.label, rad.stats, iconSize, gap, valueGap, labelGap);
            if (hovered) hoveredElement = hovered;
        });

        ctx.restore();
        return hoveredElement;
    }

    ritaStatsRad(ctx, x, y, label, stats, iconSize, gap, valueGap, labelGap) {
        let cursorX = x;
        let hoveredElement = null;
        ctx.fillStyle = '#9be7ff';
        ctx.fillText(`${label}:`, cursorX, y);
        cursorX += ctx.measureText(`${label}:`).width + labelGap;

        const ordning = [
            { key: 'fysisk', label: 'F', color: '#c7c7c7' },
            { key: 'eld', label: 'E', color: '#ff7a59' },
            { key: 'magi', label: 'M', color: '#7ad5ff' }
        ];

        ordning.forEach(({ key, label: fallbackLabel, color }) => {
            const val = stats[key] || 0;
            const img = this.hamtaBild(this.elementIkoner[key]);
            const ikonX = cursorX;
            const ikonY = y - iconSize / 2;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, ikonX, ikonY, iconSize, iconSize);
            } else {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(ikonX + iconSize / 2, y, iconSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#111';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(fallbackLabel, ikonX + iconSize / 2, y + 1);
                ctx.textAlign = 'left';
                ctx.font = '14px Arial';
            }

            if (typeof this._musX === 'number' && typeof this._musY === 'number' && this._musX >= ikonX && this._musX <= ikonX + iconSize && this._musY >= ikonY && this._musY <= ikonY + iconSize) {
                hoveredElement = { element: key, x: this._musX, y: this._musY };
            }

            cursorX += iconSize + valueGap;
            ctx.fillStyle = '#9be7ff';
            ctx.fillText(`${val}`, cursorX, y);
            cursorX += ctx.measureText(`${val}`).width + gap;
        });

        return hoveredElement;
    }

    beraknaStatsRadBredd(ctx, label, stats, iconSize, gap, valueGap, labelGap) {
        let bredd = ctx.measureText(`${label}:`).width + labelGap;
        const ordning = ['fysisk', 'eld', 'magi'];
        ordning.forEach((key) => {
            const val = stats[key] || 0;
            bredd += iconSize + valueGap + ctx.measureText(`${val}`).width + gap;
        });
        return bredd;
    }
}
