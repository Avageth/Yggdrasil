class Byggarbetsplatsen {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);

        // Bakgrundsbild
        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Byggarbetsplatsen.png';
        this.bild.onload = () => { this.bildLaddad = true; };
        this.bild.onerror = () => { this.bildLaddad = false; };

        // Ingen utgångsruta här — använd Escape för att lämna

        // Shop-state (liknar Druiden och Sierskans struktur)
        this.lage = 'start';
        this.shopKategorier = ['Hus', 'Skepp'];
        this.shopKategoriBeskrivningar = {
            Hus: 'Bygg bostäder och förråd för att stå starkare på land.',
            Skepp: 'Skaffa skepp för resor och starkare försvar till sjöss.'
        };
        this.shopValdIndex = 0;
        this.shopItemBounds = [];
        this.shopKategoriBounds = [];
        this.shopKategoriHoverIndex = -1;
        this.shopHoverIndex = -1;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.pengarBildCache = {};
    }

    // --- Druiden-like helpers: price rendering, preview, scrolling, buying ---
    ritaPrisIkoner(ctx, pris, xPos, yPos) {
        // Delegate to shared ShopUI
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
        // fallback: do nothing
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
        const { panelHojd, headerHojd, footerHojd, radHojd } = this.hamtaShopLayout();
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const contentHojd = this.hamtaAktivLista().length * radHojd;
        return Math.max(0, contentHojd - listHojd);
    }

    justeraScrollForVal() {
        if (typeof ShopUI !== 'undefined') {
            ShopUI.justeraScrollForVal(this);
            return;
        }
        const { panelHojd, headerHojd, footerHojd, radHojd } = this.hamtaShopLayout();
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
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
        if (Array.isArray(this.shopItemBounds) && this.shopItemBounds.length > 0) {
            for (const bound of this.shopItemBounds) {
                if (!bound) continue;
                if (musX >= bound.x && musX <= bound.x + bound.bredd && musY >= bound.y && musY <= bound.y + bound.hojd) {
                    return typeof bound.index === 'number' ? bound.index : null;
                }
            }
        }
        const { panelBredd, panelHojd, headerHojd, footerHojd, radHojd } = this.hamtaShopLayout();

        // Prefer computing index from the shop box and current scrollOffset
        const panelX = (this._shopBox && typeof this._shopBox.x === 'number') ? this._shopBox.x : 20;
        const panelY = (this._shopBox && typeof this._shopBox.y === 'number') ? this._shopBox.y : 20;

        const listTop = panelY + headerHojd + 12;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;

        const inomPanel = musX >= panelX && musX <= panelX + panelBredd && musY >= listTop && musY <= listTop + listHojd;
        if (!inomPanel) return null;

        // Use current scrollOffset to compute which row the mouse is over
        const relY = musY - listTop + this.scrollOffset;
        const index = Math.floor(relY / radHojd);
        if (index < 0 || index >= this.hamtaAktivLista().length) return null;
        return index;
    }

    hamtaAktivLista() {
        return this.lage === 'shop' ? (this.shopKategori === 0 ? this._husProdukter : this._skeppProdukter) : [];
    }

    hamtaShopLayout() {
        return {
            panelBredd: 320,
            panelHojd: 280,
            headerHojd: 78,
            footerHojd: 26,
            radHojd: 32
        };
    }

    hamtaKategoriBeskrivning() {
        const kategoriNamn = this.shopKategorier[this.shopKategori] || '';
        return this.shopKategoriBeskrivningar[kategoriNamn] || '';
    }

    hamtaKategoriIndexFranMus(musX, musY) {
        if (!Array.isArray(this.shopKategoriBounds)) return null;
        for (const bound of this.shopKategoriBounds) {
            if (!bound) continue;
            const inomX = musX >= bound.x && musX <= bound.x + bound.bredd;
            const inomY = musY >= bound.y && musY <= bound.y + bound.hojd;
            if (inomX && inomY) return typeof bound.index === 'number' ? bound.index : null;
        }
        return null;
    }

    bytShopKategori(index) {
        if (!Array.isArray(this.shopKategorier) || index < 0 || index >= this.shopKategorier.length) return false;
        if (this.shopKategori === index) return false;
        this.shopKategori = index;
        this.shopValdIndex = 0;
        this.shopHoverIndex = -1;
        this.shopKategoriHoverIndex = -1;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        return true;
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

        // Kontrollera om spelaren har råd och har nödvändiga varor
        const harRad = this.kontrolleraRad(spelare, alternativ.pris);
        const krav = alternativ.krav || (alternativ.template && alternativ.template.krav) || [];
        let harVaror = true;
        if (typeof ShopUI !== 'undefined' && krav && krav.length > 0) {
            harVaror = ShopUI.kontrolleraVaror(spelare, krav);
        }

        if (!harRad) {
            this.visaMeddelande('Du har inte råd!');
            return null;
        }
        if (!harVaror) {
            this.visaMeddelande('Saknar nödvändiga varor för köp');
            return null;
        }

        // Förhindra att spelaren köper samma hus flera gånger
        if (this.shopKategori === 0) {
            const proto = alternativ.template || {};
            const husId = proto.id || alternativ.id || proto.namn || alternativ.namn;
            if (husId) {
                if (!spelare.egnaHus) spelare.egnaHus = [];
                const redan = spelare.egnaHus.some(h => {
                    if (!h) return false;
                    return (h.id && husId && String(h.id) === String(husId)) || (h.namn && String(h.namn) === String(proto.namn || alternativ.namn));
                });
                if (redan) {
                    this.visaMeddelande('Du äger redan detta hus');
                    return null;
                }
            }
        }

        // Utför köp: ta pengar och konsumera varor
        this.taPengar(spelare, alternativ.pris);
        if (typeof ShopUI !== 'undefined' && krav && krav.length > 0) {
            ShopUI.taVaror(spelare, krav);
        }

        if (!spelare.egnaHus) spelare.egnaHus = [];
        if (!spelare.egnaSkepp) spelare.egnaSkepp = [];

        if (this.shopKategori === 0) {
            const proto = alternativ.template || {};
            let instance = null;
            if (typeof window !== 'undefined' && window.Hus) {
                try {
                    instance = new window.Hus({ id: proto.id, namn: proto.namn, level: proto.level || 1, egenskaper: proto.egenskaper || {} });
                } catch (e) {
                    instance = Object.assign({}, proto);
                }
            } else if (typeof require === 'function') {
                try {
                    const HusClass = require('./Hus.js');
                    instance = new HusClass({ id: proto.id, namn: proto.namn, level: proto.level || 1, egenskaper: proto.egenskaper || {} });
                } catch (e) {
                    instance = Object.assign({}, proto);
                }
            } else {
                instance = Object.assign({}, proto);
            }
            spelare.egnaHus.push(instance);
            this.visaMeddelande('Hus köpt: ' + alternativ.namn);
        } else {
            const proto = alternativ.template || {};
            let instance = null;
            if (typeof window !== 'undefined' && window.Skepp) {
                try {
                    instance = new window.Skepp({ id: proto.id, namn: proto.namn, level: proto.level || 1, egenskaper: proto.egenskaper || {} });
                } catch (e) {
                    instance = Object.assign({}, proto);
                }
            } else if (typeof require === 'function') {
                try {
                    const SkeppClass = require('./Skepp.js');
                    instance = new SkeppClass({ id: proto.id, namn: proto.namn, level: proto.level || 1, egenskaper: proto.egenskaper || {} });
                } catch (e) {
                    instance = Object.assign({}, proto);
                }
            } else {
                instance = Object.assign({}, proto);
            }
            spelare.egnaSkepp.push(instance);
            this.visaMeddelande('Skepp köpt: ' + alternativ.namn);
        }

        return null;
    }

    kontrolleraRad(spelare, pris) {
        if (typeof ShopUI !== 'undefined') return ShopUI.kontrolleraRad(spelare, pris);
        if (!pris || !spelare.pengar) return true;

        const kopparTotalt = (spelare.pengar.koppar || 0) + (spelare.pengar.silver || 0) * 10 + (spelare.pengar.guld || 0) * 100;
        const prisTotalt = (pris.koppar || 0) + ((pris.silver || 0) * 10) + ((pris.guld || 0) * 100);

        return kopparTotalt >= prisTotalt;
    }

    taPengar(spelare, pris) {
        if (typeof ShopUI !== 'undefined') return ShopUI.taPengar(spelare, pris);
        if (!pris || !spelare.pengar) return;
        const kopparTotalt = (spelare.pengar.koppar || 0) + (spelare.pengar.silver || 0) * 10 + (spelare.pengar.guld || 0) * 100;
        const prisTotalt = (pris.koppar || 0) + ((pris.silver || 0) * 10) + ((pris.guld || 0) * 100);
        const kvar = Math.max(0, kopparTotalt - prisTotalt);

        const guld = Math.floor(kvar / 100);
        const kvarEfterGuld = kvar % 100;
        const silver = Math.floor(kvarEfterGuld / 10);
        const koppar = kvarEfterGuld % 10;

        spelare.pengar.guld = guld;
        spelare.pengar.silver = silver;
        spelare.pengar.koppar = koppar;
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

    // Enkel meddelandevisare
    visaMeddelande(text) {
        if (typeof ShopUI !== 'undefined') return ShopUI.visaMeddelande(this, text);
        this.meddelande = { text: String(text || ''), tills: Date.now() + 5000 };
    }

    visa() {
        this.visas = true;
        const spelare = this.hamtaSpelare();
        if (spelare) {
            // Spara spelarens position så vi kan återställa vid utgång
            this._entryX = typeof spelare.x === 'number' ? spelare.x : null;
            this._entryY = typeof spelare.y === 'number' ? spelare.y : null;

            // Positionera spelaren nära mitten/botten i byggarbetsplatsen vy
            spelare.x = Math.max(100, Math.min(this.canvas.width - 100, spelare.x || 200));
            spelare.y = this.canvas.height - 120;
        }

        // Förbered shopdata
        this._initShop();
        // Auto-open shop when entering byggarbetsplatsen so it's visible immediately
        this.lage = 'shop';
        this.shopValdIndex = 0;
        this.shopKategori = 0;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
    }

    dolj() {
        this.visas = false;
    }

    lamna() {
        // Återställ spelarens position till den plats de kom in från
        try {
            const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
            if (spelare && this._entryX !== null && this._entryY !== null) {
                spelare.x = this._entryX;
                spelare.y = this._entryY;
            }
        } catch (e) {
            // ignore
        }

        this.dolj();
        // Rensa sparad ingångsposition
        this._entryX = null;
        this._entryY = null;

        if (typeof this.gaTillbaka === 'function') this.gaTillbaka();
    }

    tangentNed(tangent) {
        if (!this.visas) return;
        // Open shop with B
        if (tangent === 'b' || tangent === 'B') {
            this.lage = 'shop';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            this.shopKategori = 0;
            return;
        }

        // Forward to hanteraTangent when in shop (Druiden-style)
        if (this.lage === 'shop') {
            this.hanteraTangent(tangent);
        }
    }

    // Druiden-like key handler for shop navigation
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
        } else if (tangent === 'Escape') {
            // handled elsewhere via hanteraEscape
        }

        // Category switching: A / Left -> previous category, D / Right -> next category
        if (this.lage === 'shop') {
            const prev = tangent === 'a' || tangent === 'A' || tangent === 'ArrowLeft';
            const next = tangent === 'd' || tangent === 'D' || tangent === 'ArrowRight';
            if (prev || next) {
                const max = (this.shopKategorier && this.shopKategorier.length) ? this.shopKategorier.length : 2;
                if (typeof this.shopKategori !== 'number') this.shopKategori = 0;
                if (prev) this.shopKategori = (this.shopKategori - 1 + max) % max;
                if (next) this.shopKategori = (this.shopKategori + 1) % max;
                this.shopValdIndex = 0;
                this.scrollOffset = 0;
                this.scrollTarget = 0;
            }
        }
    }

    tangentUpp(tangent) {
        if (!this.visas) return;
    }

    hanteraKlick(musX, musY) {
        if (!this.visas || this.lage !== 'shop') return null;

        const kategoriIndex = this.hamtaKategoriIndexFranMus(musX, musY);
        if (kategoriIndex !== null) {
            this.bytShopKategori(kategoriIndex);
            return null;
        }

        const index = this.hamtaIndexFranMus(musX, musY);
        if (index !== null) {
            this.shopValdIndex = index;
            this.shopHoverIndex = index;
            this.justeraScrollForVal();
            return this.hanteraStartVal(index);
        }

        return null;
    }

    hanteraMusMove(musX, musY) {
        this._musX = musX;
        this._musY = musY;
        if (!this.visas || this.lage !== 'shop') {
            this.shopHoverIndex = -1;
            this.shopKategoriHoverIndex = -1;
            return;
        }

        this.shopKategoriHoverIndex = this.hamtaKategoriIndexFranMus(musX, musY);

        const index = this.hamtaIndexFranMus(musX, musY);
        this.shopHoverIndex = index === null ? -1 : index;
        if (index !== null && this.shopValdIndex !== index) {
            this.shopValdIndex = index;
            this.justeraScrollForVal();
        }
    }

    hanteraScroll(delta) {
        // Scrolling via mus är avstängt i Byggarbetsplatsen
        return;
    }

    hanteraEscape() {
        if (!this.visas) return false;
        if (this.lage === 'shop') {
            this.lage = 'start';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return true;
        }
        // ESC tar tillbaka till världen
        this.lamna();
        return true;
    }

    rita() {
        if (!this.visas) return;
        const ctx = this.ctx;
        const canvas = this.canvas;

        // Bakgrund
        if (this.bildLaddad) {
            ctx.drawImage(this.bild, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2d2d2d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Byggarbetsplatsen', canvas.width / 2, 80);
        }

        // Informationsrad
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tryck [Esc] för att lämna Byggarbetsplatsen', canvas.width / 2, canvas.height - 20);

        // Visa knapp för att öppna shop
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('Tryck [B] för att öppna butiken (hus & skepp)', canvas.width / 2, canvas.height - 44);

        // Render message overlay (if any)
        // Shop UI handled below
        if (this.lage === 'shop') {
            this._ritaShop(ctx, canvas);
            this.ritaPreview();
        }

        // Global in-view messages
        this.ritaMeddelande();

        if (this.lage === 'shop' && this._shopPengarHoverInfo && typeof ShopUI !== 'undefined') {
            ShopUI.ritaPengarTooltip(this, this._shopPengarHoverInfo.valuta, this._shopPengarHoverInfo.x, this._shopPengarHoverInfo.y);
        }
    }

    // --- Shop implementation ---
    _initShop() {
        if (this._shopInit) return;
        this._shopInit = true;
        this.shopKategorier = ['Hus', 'Skepp'];

        // Hämta hus- och skeppstyper från globala arrayer om tillgängliga
        const husTyper = (typeof window !== 'undefined' && window.HUS_TYPER) ? window.HUS_TYPER : (typeof require === 'function' ? require('./Hus.js').HUS_TYPER : []);
        const skeppTyper = (typeof window !== 'undefined' && window.SKEPP_TYPER) ? window.SKEPP_TYPER : (typeof require === 'function' ? require('./Skepp.js').SKEPP_TYPER : []);

        // Konvertera till produkter med prisobjekt { guld, silver, koppar }
        const husPriser = [{ guld:1, silver:0, koppar:0 }, { guld:2, silver:8, koppar:0 }, { guld:2, silver:5, koppar:7 }, { guld:5, silver:0, koppar:0 }];
        const skeppPriser = [{ guld:5, silver:0, koppar:0 }, { guld:8, silver:0, koppar:0 }, { guld:15, silver:0, koppar:0 }];

        this._husProdukter = husTyper.map((h, i) => ({ id: h.id, namn: h.namn, template: h, pris: husPriser[i] || { guld:1, silver:0, koppar:0 }, beskrivning: (typeof h.hamtaBeskrivning === 'function') ? h.hamtaBeskrivning() : h.namn }));
        this._skeppProdukter = skeppTyper.map((s, i) => ({ id: s.id, namn: s.namn, template: s, pris: skeppPriser[i] || { guld:5, silver:0, koppar:0 }, beskrivning: (typeof s.hamtaBeskrivning === 'function') ? s.hamtaBeskrivning() : s.namn }));

        this.lage = 'start';
        this.shopKategori = 0;
        this.shopValdIndex = 0;
    }

    _getAktivLista() {
        return this.lage === 'shop' ? (this.shopKategori === 0 ? this._husProdukter : this._skeppProdukter) : [];
    }

    _prisKopparTillValutaObj(koppar) {
        const g = Math.floor(koppar / 100);
        koppar -= g * 100;
        const s = Math.floor(koppar / 10);
        koppar -= s * 10;
        const c = koppar;
        return { guld: g, silver: s, koppar: c };
    }

    _prisObjToString(koppar) {
        const p = koppar;
        if (!p) return '0c';
        return `${p.guld || 0}g ${p.silver || 0}s ${p.koppar || 0}c`;
    }

    _spelareTotalKoppar(spelare) {
        if (!spelare || !spelare.pengar) return 0;
        return (spelare.pengar.koppar || 0) + (spelare.pengar.silver || 0) * 10 + (spelare.pengar.guld || 0) * 100;
    }

    _uppdateraSpelarePengar(spelare, kvarKoppar) {
        if (!spelare || !spelare.pengar) return;
        const g = Math.floor(kvarKoppar / 100);
        kvarKoppar -= g * 100;
        const s = Math.floor(kvarKoppar / 10);
        kvarKoppar -= s * 10;
        const c = Math.max(0, kvarKoppar);
        spelare.pengar.guld = g;
        spelare.pengar.silver = s;
        spelare.pengar.koppar = c;
    }

    _forsokKopaVald() {
        // Backwards-compatible wrapper: call hanteraStartVal for the selected index
        this.hanteraStartVal(this.shopValdIndex);
    }

    _ritaShop(ctx, canvas) {
        if (typeof console !== 'undefined' && console.debug) console.debug('Byggarbetsplatsen: _ritaShop called, lage=', this.lage, 'shopKategori=', this.shopKategori);
        const boxW = Math.min(760, canvas.width - 80);
        const boxH = Math.min(420, canvas.height - 120);
        const boxX = (canvas.width - boxW) / 2;
        const boxY = (canvas.height - boxH) / 2;
        const { panelBredd, panelHojd, headerHojd, footerHojd, radHojd } = this.hamtaShopLayout();

        // Expose box geometry for shared UI helpers (so preview can be
        // rendered inside the big shop box).
        this._shopBox = { x: boxX, y: boxY, w: boxW, h: boxH };

        ctx.save();
        ctx.fillStyle = 'rgba(8,16,24,0.95)';
        roundRect(ctx, boxX, boxY, boxW, boxH, 8, true, false);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        roundRect(ctx, boxX, boxY, boxW, boxH, 8, false, true);

        // Kategorier
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const catX = boxX + 16;
        let curX = catX;
        this.shopKategoriBounds = [];
        this.shopKategorier.forEach((k, idx) => {
            const textBredd = ctx.measureText(k).width;
            const arAktiv = idx === this.shopKategori;
            const arHoverad = idx === this.shopKategoriHoverIndex;
            if (arAktiv || arHoverad) {
                ctx.save();
                ctx.fillStyle = arAktiv ? 'rgba(255, 209, 102, 0.22)' : 'rgba(255, 255, 255, 0.12)';
                roundRect(ctx, curX - 8, boxY + 10, textBredd + 16, 28, 10, true, false);
                ctx.restore();
            }
            ctx.fillStyle = arAktiv ? '#ffd166' : (arHoverad ? '#eaf7ff' : '#fff');
            ctx.fillText(k, curX, boxY + 32);
            if (arAktiv || arHoverad) {
                ctx.save();
                ctx.strokeStyle = arAktiv ? 'rgba(255, 209, 102, 0.9)' : 'rgba(255, 255, 255, 0.55)';
                ctx.lineWidth = arAktiv ? 2 : 1;
                ctx.beginPath();
                ctx.moveTo(curX - 2, boxY + 38);
                ctx.lineTo(curX + textBredd + 2, boxY + 38);
                ctx.stroke();
                ctx.restore();
            }
            this.shopKategoriBounds.push({
                index: idx,
                x: curX - 4,
                y: boxY + 12,
                bredd: textBredd + 8,
                hojd: 26
            });
            curX += textBredd + 20;
        });

        const kategoriBeskrivning = this.hamtaKategoriBeskrivning();
        if (kategoriBeskrivning) {
            ctx.fillStyle = 'rgba(255,255,255,0.72)';
            ctx.font = '13px Arial';
            ctx.fillText(kategoriBeskrivning, boxX + 16, boxY + 56);
        }

        // Produktlista (med scroll/clip som i Druiden)
        const listTop = boxY + headerHojd + 12;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;

        this.uppdateraScroll();

        // Clip area
        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX + 6, listTop - 6, panelBredd - 12, listHojd + 12);
        ctx.clip();

        this._shopPengarHoverInfo = null;
        const lista = this.hamtaAktivLista();
        const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
        this.shopItemBounds = [];
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';

        for (let i = 0; i < lista.length; i++) {
            const p = lista[i];
            const y = listTop + i * radHojd - this.scrollOffset;
            const itemX = boxX + 10;
            const itemY = y - 4;
            const itemBredd = panelBredd - 20;
            const itemHojd = 28;

            if (i === this.shopValdIndex) {
                ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
                ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
            } else if (i === this.shopHoverIndex) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
            }

            // Layout: reserve space at right for price icons and owned-count
            const priceRightX = boxX + panelBredd - 24;
            const ownedRightX = priceRightX - 130; // moved further left to avoid collision with price icons
            const nameLeftX = boxX + 16;
            const nameMaxWidth = Math.max(60, ownedRightX - nameLeftX - 8);

            // Draw product name, truncating with ellipsis if too long
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.textAlign = 'left';
            const elide = (text, maxW) => {
                if (!text) return '';
                if (ctx.measureText(text).width <= maxW) return text;
                let t = text;
                while (t.length > 0 && ctx.measureText(t + '...').width > maxW) t = t.slice(0, -1);
                return t + '...';
            };
            const drawName = elide(p.namn || '', nameMaxWidth);
            ctx.fillText(drawName, nameLeftX, y);

            // Visa ägd/åtkomlig kvantitet (t.ex. "0/1") placerat till vänster om prisikoner
            try {
                let owned = 0;
                let maxCount = 1;
                const pid = p.id || (p.template && p.template.id) || p.namn;
                if (p.template && typeof p.template.maxCount === 'number') maxCount = p.template.maxCount;
                if (spelare) {
                    const listaE = this.shopKategori === 0 ? (Array.isArray(spelare.egnaHus) ? spelare.egnaHus : []) : (Array.isArray(spelare.egnaSkepp) ? spelare.egnaSkepp : []);
                    owned = listaE.reduce((acc, h) => {
                        if (!h) return acc;
                        const hid = h.id || h.namn;
                        if (!hid) return acc;
                        if (String(hid) === String(pid) || String(hid) === String(p.namn) || String(hid) === String((p.template && p.template.namn))) return acc + 1;
                        return acc;
                    }, 0);
                }

                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.font = '12px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`${owned}/${maxCount}`, ownedRightX, y);
                ctx.restore();
            } catch (e) {
                // ignore
            }

            // Rita pris (behåll längst till höger)
            this.ritaPrisIkoner(ctx, p.pris, priceRightX, y);

            // (varokrav i listan ritas inte längre här)

            if (y + itemHojd >= listTop && y <= listTop + listHojd) {
                this.shopItemBounds.push({ index: i, x: itemX, y: itemY, bredd: itemBredd, hojd: itemHojd });
            }
        }

        ctx.restore();

        ctx.restore();
    }
}

// Exportera för Node och browser
if (typeof module !== 'undefined') module.exports = Byggarbetsplatsen;
if (typeof window !== 'undefined') window.Byggarbetsplatsen = Byggarbetsplatsen;
