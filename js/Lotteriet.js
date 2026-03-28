class Lotteriet {
    constructor(canvas, ctx, hamtaSpelare, onExit) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.onExit = onExit || (() => {});
        this.visas = false;

        // Huvudmeny
        this.alternativ = [
            { namn: 'Köp lott', action: 'köp' },
            { namn: 'Tillbaka', action: 'tillbaka' }
        ];

        // Spelets state
        this.lage = 'start'; // 'start', 'satstyp', 'vara', 'mangd', 'odds', 'nummer', 'resultat'
        this.satstyp = 'silver'; // 'silver' eller 'vara'
        this.valVara = null; // { id, namn, antal } för vara-spel
        this.varuLista = []; // Lista över tillgängliga varor att satsa
        this.varBounds = []; // För musklick på varor
        this.valMangd = 1; // Hur mycket spelaren satsar
        this.maxMangd = 1; // Max att satsa
        
        this.valAntal = 1; // Alltid 1 (ett vinnande nummer)
        this.valOdds = 'high'; // 'high' eller 'low'
        this.valNummer = []; // Array med valda nummer
        this.maxNummer = 10; // Beror på odds: high = 1-10, low = 1-20
        
        this.shopValdIndex = 0;
        this.shopItemBounds = [];
        this.shopHoverIndex = -1;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.meddelande = null;
        this.meddelandeTid = 0;
        
        // Lotteri kostnad
        this.kostnad = { silver: 1, koppar: 0, guld: 0 };
        
        // Resultat från spelet
        this.vinnande = [];
        this.totalSats = 0; // Total sats (silver eller varor)
        this.vinst = 0;
        this.vinstVara = null; // { id, namn, antal } för vinstvaror
        this.vunnetLotteri = false;

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Lotteriet.png';
        this.ikonCache = {};
        this.bild.onload = () => {
            this.bildLaddad = true;
        };
        this.bild.onerror = () => {
            console.log('Kunde inte ladda Lotteriet-bild fran: assets/platser/Lotteriet.png');
        };
    }

    visa() {
        this.visas = true;
        this.lage = 'start';
        this.satstyp = 'silver';
        this.valVara = null;
        this.varuLista = [];
        this.valMangd = 1;
        this.maxMangd = 1;
        this.valAntal = 1;
        this.valOdds = 'high';
        this.valNummer = [];
        this.maxNummer = 10;
        this.shopValdIndex = 0;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.meddelande = null;
        this.meddelandeTid = 0;
    }

    dolj() {
        this.visas = false;
    }

    hanteraTangent(tangent) {
        if (!this.visas) return;

        const valjTangent = tangent === 'Enter' || tangent === 'e' || tangent === 'E';
        const upp = tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W';
        const ner = tangent === 'ArrowDown' || tangent === 's' || tangent === 'S';

        if (this.lage === 'start') {
            if (upp) {
                this.shopValdIndex = (this.shopValdIndex - 1 + this.alternativ.length) % this.alternativ.length;
                this.justeraScrollForVal();
                return;
            }
            if (ner) {
                this.shopValdIndex = (this.shopValdIndex + 1) % this.alternativ.length;
                this.justeraScrollForVal();
                return;
            }
            if (valjTangent) {
                this.hanteraVal(this.shopValdIndex);
            }
        } else if (this.lage === 'satstyp') {
            if (tangent === 'ArrowLeft' || tangent === 'a' || tangent === 'A') {
                this.satstyp = 'silver';
            }
            if (tangent === 'ArrowRight' || tangent === 'd' || tangent === 'D') {
                this.satstyp = 'vara';
            }
            if (valjTangent) {
                if (this.satstyp === 'vara') {
                    this.hamtaVaruLista();
                    this.lage = 'vara';
                } else {
                    // Silver - sätt max satsningsbelopp
                    const spelare = this.hamtaSpelare();
                    if (spelare && spelare.pengar) {
                        this.maxMangd = Math.min(99, spelare.pengar.silver);
                        this.valMangd = Math.min(this.valMangd, this.maxMangd);
                    }
                    this.lage = 'mangd';
                }
            }
        } else if (this.lage === 'vara') {
            if (upp) {
                this.shopValdIndex = (this.shopValdIndex - 1 + this.varuLista.length) % this.varuLista.length;
                this.justeraScrollForVal();
                return;
            }
            if (ner) {
                this.shopValdIndex = (this.shopValdIndex + 1) % this.varuLista.length;
                this.justeraScrollForVal();
                return;
            }
            if (valjTangent) {
                this.valVara = this.varuLista[this.shopValdIndex];
                this.maxMangd = this.valVara.count;
                this.valMangd = Math.min(this.valMangd, this.maxMangd);
                this.lage = 'mangd';
                this.shopValdIndex = 0;
            }
        } else if (this.lage === 'mangd') {
            if (tangent === 'ArrowLeft' || tangent === 'a' || tangent === 'A') {
                this.valMangd = Math.max(1, this.valMangd - 1);
            }
            if (tangent === 'ArrowRight' || tangent === 'd' || tangent === 'D') {
                this.valMangd = Math.min(this.maxMangd, this.valMangd + 1);
            }
            const num = parseInt(tangent);
            if (!isNaN(num) && num >= 0 && num <= 9) {
                const siffra = num === 0 ? 10 : num;
                if (siffra <= this.maxMangd) {
                    this.valMangd = siffra;
                }
            }
            if (valjTangent) {
                this.valAntal = 1;
                this.lage = 'odds';
            }
        } else if (this.lage === 'odds') {
            if (tangent === 'ArrowLeft' || tangent === 'a' || tangent === 'A') {
                this.valOdds = 'high';
            }
            if (tangent === 'ArrowRight' || tangent === 'd' || tangent === 'D') {
                this.valOdds = 'low';
            }
            if (valjTangent) {
                this.maxNummer = this.valOdds === 'high' ? 10 : 20;
                this.lage = 'nummer';
                this.valNummer = [];
            }
        } else if (this.lage === 'nummer') {
            const num = parseInt(tangent);
            if (!isNaN(num) && num >= 0 && num <= 9) {
                const nummer = num === 0 ? 10 : num;
                if (nummer <= this.maxNummer) {
                    if (this.valNummer.includes(nummer)) {
                        this.valNummer = this.valNummer.filter(n => n !== nummer);
                    } else if (this.valNummer.length < 2) {
                        this.valNummer.push(nummer);
                        this.valNummer.sort((a, b) => a - b);
                    }
                }
            }
            if (valjTangent && this.valNummer.length >= 1) {
                this.spelaLotteri();
            }
        } else if (this.lage === 'resultat') {
            if (valjTangent) {
                this.lage = 'start';
                this.shopValdIndex = 0;
            }
        }
    }

    hanteraVal(index) {
        const vald = this.alternativ[index];
        if (vald && vald.action === 'tillbaka') {
            this.lage = 'start';
            this.onExit();
            return;
        }
        if (vald && vald.action === 'köp') {
            // Starta lottspelet - först välja satstyp
            this.lage = 'satstyp';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
        }
    }

    hanteraKlick(musX, musY) {
        if (!this.visas) return;

        if (this.lage === 'start') {
            const index = this.hamtaIndexFranMus(musX, musY);
            if (index === null) return;

            this.shopValdIndex = index;
            this.justeraScrollForVal();
            this.hanteraVal(index);
        } else if (this.lage === 'satstyp') {
            if (this.klickSatsKnapp(musX, musY, 'silver')) {
                this.satstyp = 'silver';
            } else if (this.klickSatsKnapp(musX, musY, 'vara')) {
                this.satstyp = 'vara';
            }
        } else if (this.lage === 'vara') {
            const index = this.hamtaIndexFranMus(musX, musY);
            if (index === null) return;

            this.shopValdIndex = index;
            this.justeraScrollForVal();
            this.valVara = this.varuLista[this.shopValdIndex];
            this.maxMangd = this.valVara.count;
            this.valMangd = Math.min(this.valMangd, this.maxMangd);
            this.lage = 'mangd';
            this.shopValdIndex = 0;
        } else if (this.lage === 'mangd') {
            if (this.klickMinusKnapp(musX, musY)) {
                this.valMangd = Math.max(1, this.valMangd - 1);
            } else if (this.klickPlusKnapp(musX, musY)) {
                this.valMangd = Math.min(this.maxMangd, this.valMangd + 1);
            }
        } else if (this.lage === 'odds') {
            if (this.klickOddsKnapp(musX, musY, 'low')) {
                this.valOdds = 'low';
            } else if (this.klickOddsKnapp(musX, musY, 'high')) {
                this.valOdds = 'high';
            }
        } else if (this.lage === 'nummer') {
            const nummer = this.klickNummerKnapp(musX, musY);
            if (nummer >= 1 && nummer <= this.maxNummer) {
                if (this.valNummer.includes(nummer)) {
                    this.valNummer = this.valNummer.filter(n => n !== nummer);
                } else if (this.valNummer.length < 2) {
                    this.valNummer.push(nummer);
                    this.valNummer.sort((a, b) => a - b);
                }
            }
        } else if (this.lage === 'resultat') {
            this.lage = 'start';
            this.shopValdIndex = 0;
        }
    }

    hanteraMusMove(musX, musY) {
        if (!this.visas) return;
        
        if (this.lage === 'start' || this.lage === 'vara') {
            const index = this.hamtaIndexFranMus(musX, musY);
            this.shopHoverIndex = index === null ? -1 : index;
            if (index !== null) {
                this.shopValdIndex = index;
                this.justeraScrollForVal();
            }
        }
    }

    hanteraScroll(delta) {
        if (!this.visas) return;
        const maxScroll = this.beraknaMaxScroll();
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget + delta, maxScroll));
    }

    hanteraEscape() {
        if (!this.visas) return false;
        
        if (this.lage !== 'start') {
            this.lage = 'start';
            this.shopValdIndex = 0;
        } else {
            this.onExit();
        }
        return true;
    }

    visaMeddelande(text) {
        this.meddelande = text;
        this.meddelandeTid = Date.now() + 2000;
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
        }

        if (this.lage === 'start') {
            this.ritaMenyLista();
        } else if (this.lage === 'satstyp') {
            this.ritaSatsTypVal();
        } else if (this.lage === 'vara') {
            this.ritaVaraVal();
        } else if (this.lage === 'mangd') {
            this.ritaMangdVal();
        } else if (this.lage === 'odds') {
            this.ritaOddsVal();
        } else if (this.lage === 'nummer') {
            this.ritaNummerVal();
        } else if (this.lage === 'resultat') {
            this.ritaResultat();
        }

        this.ritaMeddelande();
    }

    hamtaVaruLista() {
        const spelare = this.hamtaSpelare();
        if (!spelare || !spelare.utrustning || !spelare.utrustning.inventory) {
            this.varuLista = [];
            return;
        }

        // Skapa lista över varor från inventory (endast typ 'vara' med count > 0)
        this.varuLista = [];
        spelare.utrustning.inventory.forEach((foremal) => {
            if (foremal.typ === 'vara' && foremal.count > 0) {
                this.varuLista.push({
                    id: foremal.id,
                    namn: foremal.namn + ' (' + foremal.count + ')',
                    originalNamn: foremal.namn,
                    count: foremal.count,
                    ikon: foremal.ikon || null
                });
            }
        });
    }

    hamtaIkonBild(src) {
        if (!src) return null;
        if (!this.ikonCache[src]) {
            const img = new Image();
            const encodedSrc = encodeURI(src);
            img._fallbackTried = false;
            img.onerror = () => {
                if (!img._fallbackTried && encodedSrc !== src) {
                    img._fallbackTried = true;
                    img.src = encodedSrc;
                }
            };
            img.src = src;
            this.ikonCache[src] = img;
        }
        return this.ikonCache[src];
    }

    ritaSatsTypVal() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const panelBredd = 320;
        const panelHojd = 240;

        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Vad vill du satsa?', canvas.width / 2, panelY + 35);

        // Button: Silver
        const silverX = panelX + 40;
        const silverY = panelY + 100;
        const buttonW = 100;
        const buttonH = 50;

        ctx.fillStyle = this.satstyp === 'silver' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(100, 100, 100, 0.3)';
        ctx.strokeStyle = this.satstyp === 'silver' ? '#00ff88' : '#666';
        ctx.lineWidth = 2;
        ctx.fillRect(silverX, silverY, buttonW, buttonH);
        ctx.strokeRect(silverX, silverY, buttonW, buttonH);

        ctx.fillStyle = this.satstyp === 'silver' ? '#00ff88' : '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SILVER', silverX + buttonW / 2, silverY + buttonH / 2);

        // Button: Vara
        const varaX = panelX + 180;
        const varaY = panelY + 100;

        ctx.fillStyle = this.satstyp === 'vara' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(100, 100, 100, 0.3)';
        ctx.strokeStyle = this.satstyp === 'vara' ? '#00ff88' : '#666';
        ctx.lineWidth = 2;
        ctx.fillRect(varaX, varaY, buttonW, buttonH);
        ctx.strokeRect(varaX, varaY, buttonW, buttonH);

        ctx.fillStyle = this.satstyp === 'vara' ? '#00ff88' : '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('VARA', varaX + buttonW / 2, varaY + buttonH / 2);

        // Instructions
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Piltangenter eller A/D för att välja', canvas.width / 2, panelY + panelHojd - 40);
        ctx.fillText('Enter för att fortsätta', canvas.width / 2, panelY + panelHojd - 20);

        ctx.restore();
    }

    ritaVaraVal() {
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

        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Välj vara att satsa', panelX + 16, panelY + 12);

        ctx.font = '14px Arial';
        const radHojd = 28;

        this.uppdateraScroll();

        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 6, listTop - 6, panelBredd - 12, listHojd + 12);
        ctx.clip();

        this.shopItemBounds = [];
        if (this.varuLista.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('Inga varor', panelX + panelBredd / 2, listTop + listHojd / 2);
            ctx.textAlign = 'left';
        } else {
            this.varuLista.forEach((vara, index) => {
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

                if (y + itemHojd >= listTop && y <= listTop + listHojd) {
                    this.shopItemBounds.push({ index, x: itemX, y: itemY, bredd: itemBredd, hojd: itemHojd });
                }
            });
        }

        ctx.restore();

        ctx.fillStyle = 'rgba(170, 170, 170, 0.9)';
        ctx.font = '12px Arial';
        ctx.fillText('Enter: välj | ESC: tillbaka', panelX + 16, panelY + panelHojd - 22);

        ctx.restore();
    }

    klickSatsKnapp(musX, musY, typ) {
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const buttonY = panelY + 100;
        const buttonW = 100;
        const buttonH = 50;

        if (typ === 'silver') {
            const silverX = panelX + 40;
            return musX >= silverX && musX <= silverX + buttonW && musY >= buttonY && musY <= buttonY + buttonH;
        } else {
            const varaX = panelX + 180;
            return musX >= varaX && musX <= varaX + buttonW && musY >= buttonY && musY <= buttonY + buttonH;
        }
    }

    ritaMangdVal() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const panelBredd = 320;
        const panelHojd = 240;

        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        const titel = this.satstyp === 'silver' ? 'Hur mycket silver?' : 'Hur många ' + this.valVara.originalNamn + '?';
        ctx.fillText(titel, canvas.width / 2, panelY + 35);

        // Display current amount
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.valMangd, canvas.width / 2, panelY + 100);

        // Minus button
        const minusX = panelX + 50;
        const minusY = panelY + 130;
        const buttonW = 60;
        const buttonH = 50;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.fillRect(minusX, minusY, buttonW, buttonH);
        ctx.strokeRect(minusX, minusY, buttonW, buttonH);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('-', minusX + buttonW / 2, minusY + buttonH / 2);

        // Plus button
        const plusX = panelX + 210;
        const plusY = panelY + 130;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.fillRect(plusX, plusY, buttonW, buttonH);
        ctx.strokeRect(plusX, plusY, buttonW, buttonH);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('+', plusX + buttonW / 2, plusY + buttonH / 2);

        // Instructions
        ctx.font = '11px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Piltangenter/A-D, eller skriv nummer (1-' + this.maxMangd + ')', canvas.width / 2, panelY + panelHojd - 40);
        ctx.fillText('Enter för att fortsätta', canvas.width / 2, panelY + panelHojd - 20);

        ctx.restore();
    }

    klickMinusKnapp(musX, musY) {
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const minusX = panelX + 50;
        const minusY = panelY + 130;
        const buttonW = 60;
        const buttonH = 50;
        
        return musX >= minusX && musX <= minusX + buttonW && musY >= minusY && musY <= minusY + buttonH;
    }

    klickPlusKnapp(musX, musY) {
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const plusX = panelX + 210;
        const plusY = panelY + 130;
        const buttonW = 60;
        const buttonH = 50;
        
        return musX >= plusX && musX <= plusX + buttonW && musY >= plusY && musY <= plusY + buttonH;
    }

    ritaAntalVal() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const panelBredd = 320;
        const panelHojd = 240;

        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Hur många nummer?', canvas.width / 2, panelY + 35);

        // Buttons: 1 och 2
        ctx.font = '16px Arial';
        const buttonY = panelY + 100;
        const button1X = panelX + 50;
        const button2X = panelX + 220;
        const buttonW = 70;
        const buttonH = 40;

        // Button 1
        ctx.fillStyle = this.valAntal === 1 ? 'rgba(0, 255, 136, 0.4)' : 'rgba(100, 100, 100, 0.3)';
        ctx.strokeStyle = this.valAntal === 1 ? '#00ff88' : '#666';
        ctx.lineWidth = 2;
        ctx.fillRect(button1X, buttonY, buttonW, buttonH);
        ctx.strokeRect(button1X, buttonY, buttonW, buttonH);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', button1X + buttonW / 2, buttonY + buttonH / 2);

        // Button 2
        ctx.fillStyle = this.valAntal === 2 ? 'rgba(0, 255, 136, 0.4)' : 'rgba(100, 100, 100, 0.3)';
        ctx.strokeStyle = this.valAntal === 2 ? '#00ff88' : '#666';
        ctx.lineWidth = 2;
        ctx.fillRect(button2X, buttonY, buttonW, buttonH);
        ctx.strokeRect(button2X, buttonY, buttonW, buttonH);

        ctx.fillStyle = '#fff';
        ctx.fillText('2', button2X + buttonW / 2, buttonY + buttonH / 2);

        // Instructions
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Piltangenter eller A/D för att välja', canvas.width / 2, panelY + panelHojd - 40);
        ctx.fillText('Enter för att fortsätta', canvas.width / 2, panelY + panelHojd - 20);

        ctx.restore();
    }

    ritaOddsVal() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const panelBredd = 320;
        const panelHojd = 240;

        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Välj odds', canvas.width / 2, panelY + 30);

        // High Odds option
        ctx.font = 'bold 14px Arial';
        const highY = panelY + 75;
        ctx.fillStyle = this.valOdds === 'high' ? '#00ff88' : '#888';
        ctx.fillText('HÖGA ODDS', canvas.width / 2 - 80, highY);

        ctx.font = '11px Arial';
        ctx.fillStyle = this.valOdds === 'high' ? '#00ff88' : '#666';
        ctx.fillText('(1-10)', canvas.width / 2 - 80, highY + 18);
        ctx.fillText('1 nummer: 3x vinst', canvas.width / 2 - 80, highY + 32);
        ctx.fillText('2 nummer: 2x vinst', canvas.width / 2 - 80, highY + 45);

        // Low Odds option
        ctx.font = 'bold 14px Arial';
        const lowY = panelY + 75;
        ctx.fillStyle = this.valOdds === 'low' ? '#00ff88' : '#888';
        ctx.fillText('LÅGA ODDS', canvas.width / 2 + 80, lowY);

        ctx.font = '11px Arial';
        ctx.fillStyle = this.valOdds === 'low' ? '#00ff88' : '#666';
        ctx.fillText('(1-20)', canvas.width / 2 + 80, lowY + 18);
        ctx.fillText('1 nummer: 5x vinst', canvas.width / 2 + 80, lowY + 32);
        ctx.fillText('2 nummer: 3x vinst', canvas.width / 2 + 80, lowY + 45);

        // Instructions
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Piltangenter eller A/D för att välja', canvas.width / 2, panelY + panelHojd - 40);
        ctx.fillText('Enter för att fortsätta', canvas.width / 2, panelY + panelHojd - 20);

        ctx.restore();
    }

    ritaNummerVal() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const panelBredd = 320;
        const panelHojd = 240;

        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Välj 1-2 nummer', canvas.width / 2, panelY + 30);

        // Display selected numbers
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'center';
        ctx.fillText('Valda: ' + (this.valNummer.length > 0 ? this.valNummer.join(', ') : '---'), canvas.width / 2, panelY + 55);

        // Show odds and multiplier
        ctx.font = '11px Arial';
        ctx.fillStyle = '#aaa';
        const oddsText = this.valOdds === 'high' ? 'HÖGA ODDS (1-10)' : 'LÅGA ODDS (1-20)';
        const multiplikator = this.valOdds === 'high' ? 
            (this.valNummer.length === 1 ? 3 : 2) : 
            (this.valNummer.length === 1 ? 10 : 3);
        ctx.fillText(oddsText + ' - ' + multiplikator + 'x vid vinst', canvas.width / 2, panelY + 200);

        // Number buttons (1-10 or 1-20)
        ctx.font = '12px Arial';
        const radioX = panelX + 20;
        const radioY = panelY + 90;
        const radioW = 260;
        const radioH = 110;
        const cols = this.maxNummer <= 10 ? 5 : 10;
        const buttonSize = 24;
        const buttonSpacing = this.maxNummer <= 10 ? 50 : 26;

        for (let i = 1; i <= this.maxNummer; i++) {
            const col = (i - 1) % cols;
            const row = Math.floor((i - 1) / cols);
            const x = radioX + col * buttonSpacing;
            const y = radioY + row * 40;

            const selected = this.valNummer.includes(i);
            ctx.fillStyle = selected ? 'rgba(0, 255, 136, 0.4)' : 'rgba(100, 100, 100, 0.3)';
            ctx.strokeStyle = selected ? '#00ff88' : '#666';
            ctx.lineWidth = 1;
            ctx.fillRect(x, y, buttonSize, buttonSize);
            ctx.strokeRect(x, y, buttonSize, buttonSize);

            ctx.fillStyle = selected ? '#00ff88' : '#fff';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i, x + buttonSize / 2, y + buttonSize / 2);
        }

        // Instructions
        ctx.font = '11px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Klicka på nummer eller skriv på tangentbordet (1-' + this.maxNummer + ')', canvas.width / 2, panelY + panelHojd - 30);
        ctx.fillText('Enter för att spela', canvas.width / 2, panelY + panelHojd - 15);

        ctx.restore();
    }

    ritaResultat() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const panelBredd = 320;
        const panelHojd = 240;

        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = this.vunnetLotteri ? '#00ff88' : '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = this.vunnetLotteri ? '#00ff88' : '#ff6666';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.vunnetLotteri ? '🎉 VINST! 🎉' : 'FÖRLUST', canvas.width / 2, panelY + 35);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText('Dina nummer: ' + this.valNummer.join(', '), canvas.width / 2, panelY + 70);
        ctx.fillText('Vinnande nummer: ' + this.vinnande.join(', '), canvas.width / 2, panelY + 88);

        // Show bet amount
        if (this.satstyp === 'silver') {
            ctx.fillText('Sats: ' + this.totalSats + ' silver', canvas.width / 2, panelY + 104);
        } else if (this.valVara) {
            ctx.fillText('Sats: ' + this.totalSats + 'x ' + this.valVara.originalNamn, canvas.width / 2, panelY + 104);
        }

        if (this.vunnetLotteri) {
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 16px Arial';
            
            if (this.satstyp === 'silver') {
                ctx.fillText('Vinst: ' + this.vinst + ' silver', canvas.width / 2, panelY + 125);
            } else if (this.vinstVara) {
                // Visa vara-ikon och antal
                const spelare = this.hamtaSpelare();
                const original = spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal ?
                    spelare.utrustning.tillgangligaForemal[this.vinstVara.id] : null;
                const ikonSrc = original ? original.ikon : null;
                const ikonBild = this.hamtaIkonBild(ikonSrc);

                if (ikonBild && ikonBild.complete && ikonBild.naturalWidth > 0) {
                    const ikonStorlek = 40;
                    const ikonX = canvas.width / 2 - 50;
                    const ikonY = panelY + 115;

                    ctx.drawImage(ikonBild, ikonX, ikonY, ikonStorlek, ikonStorlek);

                    // Visa antal vid sidan av ikonen
                    ctx.fillStyle = '#00ff88';
                    ctx.font = 'bold 18px Arial';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('x' + this.vinstVara.antal, ikonX + ikonStorlek + 10, ikonY + ikonStorlek / 2);
                } else {
                    // Fallback till text om ingen ikon
                    ctx.fillStyle = '#00ff88';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Vinst: ' + this.vinstVara.antal + 'x ' + this.vinstVara.namn, canvas.width / 2, panelY + 125);
                }
            }
        }

        // Instructions
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText('Enter för att fortsätta', canvas.width / 2, panelY + panelHojd - 20);

        ctx.restore();
    }

    ritaMenyLista() {
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

        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('LOTTERIET', panelX + 16, panelY + 12);

        ctx.font = '14px Arial';
        const radHojd = 28;

        this.uppdateraScroll();

        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 6, listTop - 6, panelBredd - 12, listHojd + 12);
        ctx.clip();

        this.shopItemBounds = [];
        if (this.alternativ.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('Inga val', panelX + panelBredd / 2, listTop + listHojd / 2);
            ctx.textAlign = 'left';
        } else {
            this.alternativ.forEach((alt, index) => {
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
                ctx.fillText(alt.namn, panelX + 16, y);

                if (y + itemHojd >= listTop && y <= listTop + listHojd) {
                    this.shopItemBounds.push({ index, x: itemX, y: itemY, bredd: itemBredd, hojd: itemHojd });
                }
            });
        }

        ctx.restore();

        ctx.fillStyle = 'rgba(170, 170, 170, 0.9)';
        ctx.font = '12px Arial';
        ctx.fillText('Enter: valj | ESC: lamna', panelX + 16, panelY + panelHojd - 22);

        ctx.restore();
    }

    klickAntalsKnapp(musX, musY, antal) {
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const buttonY = panelY + 100;
        const buttonW = 70;
        const buttonH = 40;

        if (antal === 1) {
            const button1X = panelX + 50;
            return musX >= button1X && musX <= button1X + buttonW && musY >= buttonY && musY <= buttonY + buttonH;
        } else {
            const button2X = panelX + 220;
            return musX >= button2X && musX <= button2X + buttonW && musY >= buttonY && musY <= buttonY + buttonH;
        }
    }

    klickOddsKnapp(musX, musY, odds) {
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const panelBredd = 320;

        const highX = panelX + 30;
        const lowX = panelX + panelBredd / 2 + 30;
        const clickW = 100;
        const clickH = 80;
        const clickY = panelY + 65;

        if (odds === 'high') {
            return musX >= highX && musX <= highX + clickW && musY >= clickY && musY <= clickY + clickH;
        } else {
            return musX >= lowX && musX <= lowX + clickW && musY >= clickY && musY <= clickY + clickH;
        }
    }

    klickNummerKnapp(musX, musY) {
        const canvas = this.canvas;
        const panelX = canvas.width / 2 - 160;
        const panelY = canvas.height / 2 - 120;
        const radioX = panelX + 20;
        const radioY = panelY + 90;
        const cols = this.maxNummer <= 10 ? 5 : 10;
        const buttonSize = 24;
        const buttonSpacing = this.maxNummer <= 10 ? 50 : 26;

        for (let i = 1; i <= this.maxNummer; i++) {
            const col = (i - 1) % cols;
            const row = Math.floor((i - 1) / cols);
            const x = radioX + col * buttonSpacing;
            const y = radioY + row * 40;

            if (musX >= x && musX <= x + buttonSize && musY >= y && musY <= y + buttonSize) {
                return i;
            }
        }
        return -1;
    }

    spelaLotteri() {
        const spelare = this.hamtaSpelare();
        if (!spelare) {
            this.visaMeddelande('Kan inte spela just nu!');
            return;
        }

        if (this.satstyp === 'silver') {
            // Kontrollera att spelaren har pengar
            const kostnad = this.valMangd * 1; // 1 silver per lott
            if (!spelare.pengar || spelare.pengar.silver < kostnad) {
                this.visaMeddelande('Inte tillräckligt med pengar!');
                this.lage = 'start';
                return;
            }

            // Dra kostnad för lotterna
            spelare.pengar.silver -= kostnad;
            this.totalSats = kostnad;
        } else {
            // Vara betting
            if (!this.valVara || !spelare.utrustning || !spelare.utrustning.inventory) {
                this.visaMeddelande('Du har inte den varan!');
                this.lage = 'start';
                return;
            }

            // Hitta och dra varor som sats
            let kvarvarande = this.valMangd;
            while (kvarvarande > 0) {
                const varuIndex = spelare.utrustning.inventory.findIndex(f => f && f.id === this.valVara.id && f.count > 0);
                if (varuIndex === -1) {
                    this.visaMeddelande('Du har inte tillräckligt många varor!');
                    this.lage = 'start';
                    return;
                }

                spelare.utrustning.inventory[varuIndex].count -= 1;
                if (spelare.utrustning.inventory[varuIndex].count <= 0) {
                    spelare.utrustning.inventory[varuIndex] = null;
                }
                kvarvarande--;
            }
            if (typeof spelare.utrustning.stadaTommaSvansrutor === 'function') {
                spelare.utrustning.stadaTommaSvansrutor();
            }
            this.totalSats = this.valMangd;
        }

        // Generera vinnande nummer (samma antal som användaren valde)
        this.vinnande = [];
        const numran = this.valOdds === 'high' ? 10 : 20;
        for (let i = 0; i < this.valNummer.length; i++) {
            let num;
            do {
                num = Math.floor(Math.random() * numran) + 1;
            } while (this.vinnande.includes(num));
            this.vinnande.push(num);
        }
        this.vinnande.sort((a, b) => a - b);

        // Kontrollera hur många nummer som matchade
        const matchade = this.valNummer.filter(n => this.vinnande.includes(n)).length;
        this.vunnetLotteri = matchade > 0;

        // Beräkna vinster
        if (this.satstyp === 'silver') {
            this.vinst = 0;
            if (this.vunnetLotteri) {
                let multiplikator = 0;

                if (this.valOdds === 'high') {
                    multiplikator = this.valNummer.length === 1 ? 3 : 2; // High odds: 1 nummer = 3x, 2 nummer = 2x
                } else {
                    multiplikator = this.valNummer.length === 1 ? 10 : 3; // Low odds: 1 nummer = 10x, 2 nummer = 3x
                }

                this.vinst = this.totalSats * multiplikator;
                if (typeof spelare.laggTillPengar === 'function') {
                    spelare.laggTillPengar({ silver: this.vinst }, { raknaSomIntakt: true });
                } else {
                    spelare.pengar.silver += this.vinst;
                }
            }
        } else {
            // Vara betting
            this.vinstVara = null;
            if (this.vunnetLotteri) {
                let multiplikator = 0;

                if (this.valOdds === 'high') {
                    multiplikator = this.valNummer.length === 1 ? 3 : 2; // High odds: 1 nummer = 3x, 2 nummer = 2x
                } else {
                    multiplikator = this.valNummer.length === 1 ? 10 : 3; // Low odds: 1 nummer = 10x, 2 nummer = 3x
                }

                const vinstvaror = this.totalSats * multiplikator;
                
                // Lägg till varor i inventory
                const befintlig = spelare.utrustning.inventory.find(f => f && f.id === this.valVara.id);
                if (befintlig) {
                    befintlig.count += vinstvaror;
                } else {
                    // Hitta originalet för att få alla egenskaper
                    const original = spelare.utrustning.tillgangligaForemal[this.valVara.id];
                    if (original) {
                        spelare.utrustning.laggTillForemalObj({
                            id: this.valVara.id,
                            count: vinstvaror,
                            ...original
                        }, { source: 'internal' });
                    }
                }

                this.vinstVara = {
                    id: this.valVara.id,
                    namn: this.valVara.originalNamn,
                    antal: vinstvaror,
                    ikon: this.valVara.ikon || null
                };
            }
        }

        this.lage = 'resultat';
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
        
        let antal = 0;
        if (this.lage === 'vara') {
            antal = this.varuLista.length;
        } else {
            antal = this.alternativ.length;
        }
        
        const contentHojd = antal * radHojd;
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
        
        let maxIndex = this.alternativ.length;
        if (this.lage === 'vara') {
            maxIndex = this.varuLista.length;
        }
        
        if (index < 0 || index >= maxIndex) return null;
        return index;
    }

    ritaMeddelande() {
        if (!this.meddelande || Date.now() > this.meddelandeTid) {
            this.meddelande = null;
            return;
        }

        const ctx = this.ctx;
        const canvas = this.canvas;

        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const paddingX = 16;
        const paddingY = 10;
        const textWidth = ctx.measureText(this.meddelande).width;
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
        ctx.fillText(this.meddelande, x + boxW / 2, y + boxH / 2);
        ctx.restore();
    }
}
