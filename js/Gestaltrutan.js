class Gestaltrutan {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka, gaTillSlagfalt, borjaOm) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);
        this.gaTillSlagfalt = gaTillSlagfalt || (() => null);
        this.borjaOm = borjaOm || (() => null);
        this.spawnX = 320;
        this.spawnY = 550;
        this.minSpelarSkala = 0.6;
        this.maxSpelarSkala = 2;
        this.visaBarriarer = false;
        this.visaUtgangar = false;
        this.narmasteUtgang = null;
        this.eKnappNedtryckt = false;
        this.slagfaltLas = false;
        this.ikonBildCache = {};
        this.elementIkoner = {
            fysisk: 'assets/Ikoner/Element Fysisk.png',
            eld: 'assets/Ikoner/Element Eld.png',
            magi: 'assets/Ikoner/Element Magi.png'
        };
        this.elementInfo = {
            fysisk: { namn: 'Fysisk', beskrivning: 'Vanlig skada och motstånd från vapen, slag och rå styrka.' },
            eld: { namn: 'Eld', beskrivning: 'Brännande skada och skydd mot hetta, lågor och eldattacker.' },
            magi: { namn: 'Magi', beskrivning: 'Mystisk skada och motstånd mot besvärjelser och magiska krafter.' }
        };
        this.elementHoverBounds = [];
        this.elementHoverInfo = null;

        // Gestalter
        this.gestalter = new Gestalter();
        this.aktuellGestaltOmrade = null;
        this.senastRum = null;
        // Temporär test-selector (sätt true för att visa vid inladdning)
        this.enableTestSelector = true;
        this.testSelectorVisible = false;
        this.testOptions = [];
        this.testSelectedIndex = 0;

        this.utgangar = [
            {
                namn: 'Utgang',
                x: 450,
                y: 250,
                radie: 110,
                meddelande: 'Tryck pa [E] for att ga vidare',
                action: () => this.lamnaGestaltrutan()
            }
        ];

        this.barriarer = [
            { x: 0, y: 300, bredd: canvas.width, hojd: 20 },
            { x: 0, y: canvas.height - 20, bredd: canvas.width, hojd: 20 },
            { x: 300, y: 300, bredd: 20, hojd: 100 },
            { typ: 'oval', x: 470, y: 320, bredd: 200, hojd: 40, rotation: -30 },
            { typ: 'oval', x: 470, y: 420, bredd: 200, hojd: 40, rotation: 30 },
            { typ: 'oval', x: -20, y: 500, bredd: 400, hojd: 70, rotation: -35 },
            { typ: 'oval', x: 300, y: 500, bredd: 400, hojd: 70, rotation: -45 }
        ];

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Gestaltrutan.png';
        this.bild.onload = () => {
            this.bildLaddad = true;
            console.log('Gestaltrutan-bild laddad!');
        };
        this.bild.onerror = () => {
            console.log('Kunde inte ladda Gestaltrutan-bild fran: assets/platser/Gestaltrutan.png');
        };

        // Modal / dialog state för interaktioner
        this.modalVisible = false;
        this.modalText = '';
        this.modalOnAccept = null;
        this.modalOnDecline = null;
        this._boundModalMouse = null;
    }

    _wrapText(ctx, text, maxWidth) {
        const words = String(text).split(' ');
        const lines = [];
        let cur = '';
        for (let i = 0; i < words.length; i++) {
            const w = words[i];
            const test = cur ? (cur + ' ' + w) : w;
            const wWidth = ctx.measureText(test).width;
            if (wWidth > maxWidth && cur) {
                lines.push(cur);
                cur = w;
            } else {
                cur = test;
            }
        }
        if (cur) lines.push(cur);
        return lines;
    }

    visa(gestaltNamn) {
        this.visas = true;
        this.slagfaltLas = false;
        this.aktuellGestaltOmrade = gestaltNamn || this.aktuellGestaltOmrade || 'Gestalt1';
        // Om ingen specifik gestalt skickades, välj ett slumpmässigt gestalt-område vid varje inladdning.
        if (!gestaltNamn && this.gestalter) {
            try {
                const keys = Object.keys(this.gestalter.spawnPunkter || {});
                if (keys && keys.length > 0) {
                    // välj slumpmässig nyckel
                    const rand = Math.floor(Math.random() * keys.length);
                    this.aktuellGestaltOmrade = keys[rand];
                }
            } catch (e) {}
        }
        if (this.gestalter) {
            // För test: fyll options (visa inte selector automatiskt)
            try {
                this.testOptions = Object.keys(this.gestalter.spawnPunkter || {});
                if (!this.testOptions || this.testOptions.length === 0) this.testOptions = ['standard'];
                this.testSelectedIndex = Math.max(0, this.testOptions.indexOf(this.aktuellGestaltOmrade));
                this.testSelectorVisible = false;
            } catch (e) { this.testOptions = ['standard']; this.testSelectorVisible = !!this.enableTestSelector; }
            // Mirror Stigen: increment shared visit counter on area change so Gestalter can use same respawn logic
            try {
                if (this.gestalter) {
                    if (typeof this.gestalter.rumBesokRaknare === 'undefined') this.gestalter.rumBesokRaknare = 0;
                    if (this.aktuellGestaltOmrade !== this.senastRum) {
                        this.gestalter.rumBesokRaknare += 1;
                        this.senastRum = this.aktuellGestaltOmrade;
                    }
                }
            } catch (e) {}

            // Notera ruta-besök för gestalter (unika rutor)
            try { if (this.aktuellGestaltOmrade && this.gestalter) { try { this.gestalter.notaRutaBesokt(this.aktuellGestaltOmrade); } catch(e){} } } catch (e) {}
            // Ladda gestalter för det valda området
            try { this.gestalter.laddaGestalter(this.aktuellGestaltOmrade); } catch (e) {}
            this.gestalter.stridTillaten = true;
        }
        const spelare = this.hamtaSpelare();
        if (spelare) {
            if (this.gestalter) {
                const spawn = this.gestalter.hamtaSpelareSpawn(this.aktuellGestaltOmrade);
                spelare.x = spawn.x;
                spelare.y = spawn.y;
            } else {
                spelare.x = this.spawnX;
                spelare.y = this.spawnY;
            }
        }
    }

    dolj() {
        this.visas = false;
        try {
            if (this.gestalter && typeof this.gestalter.rensaMeddelanden === 'function') {
                this.gestalter.rensaMeddelanden();
            }
        } catch (e) {}
    }

    rita() {
        if (!this.visas) return;
        this.elementHoverBounds = [];

        const ctx = this.ctx;
        const canvas = this.canvas;

        if (this.bildLaddad) {
            ctx.drawImage(this.bild, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#3a1f1f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffd9d9';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Gestaltrutan', canvas.width / 2, canvas.height / 2 - 20);
        }

        if (this.gestalter) {
            this.gestalter.rita(ctx, canvas, this.minSpelarSkala, this.maxSpelarSkala);
        }

        this.ritaFiendeStats();

        const spelare = this.hamtaSpelare();
        if (spelare) {
            const clampY = Math.max(0, Math.min(canvas.height, spelare.y));
            const t = clampY / canvas.height;
            const skala = this.minSpelarSkala + (this.maxSpelarSkala - this.minSpelarSkala) * t;

            ctx.save();
            ctx.translate(spelare.x, spelare.y);
            ctx.scale(skala, skala);
            ctx.translate(-spelare.x, -spelare.y);
            spelare.rita(ctx);
            ctx.restore();
        }

        if (this.visaUtgangar) {
            this.ritaUtgangar();
        }

        this.ritaInteraktionsmeddelande();

        if (this.visaBarriarer) {
            this.ritaBarriarer();
        }

        // Rita bara lokal game over om den globala dödsregeln inte redan visar overlayn
        if (this.gestalter && this.gestalter.gameOver && !(spelare && spelare.gameOverAktiv)) {
            this.ritaGameOver();
        }

        if (this.elementHoverInfo) {
            this.ritaElementTooltip(this.elementHoverInfo.element, this.elementHoverInfo.x, this.elementHoverInfo.y);
        }
    }

    brytTextTillRader(text, maxBredd) {
        const ctx = this.ctx;
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

    ritaElementTooltip(element, musX, musY) {
        const info = this.elementInfo[element];
        if (!info) return;
        const ctx = this.ctx;
        const ikon = this.hamtaIkonBild(this.elementIkoner[element]);
        const iconSize = 52;
        const maxText = 176;
        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(info.beskrivning, maxText);
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

    hanteraMusMove(musX, musY) {
        this.elementHoverInfo = null;
        for (const bound of this.elementHoverBounds) {
            if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
                this.elementHoverInfo = { element: bound.element, x: musX, y: musY };
                break;
            }
        }
    }

    rensaHover() {
        this.elementHoverInfo = null;
    }

    tangentNed(tangent) {
        if (!this.visas) return;

        // Om game over är aktiverat, låt ESC börja om
        if (this.gestalter && this.gestalter.gameOver) {
            if (tangent === 'Escape') {
                this.borjaOm();
            }
            return;
        }

        // Om modal är synlig hantera Enter/Escape eller E
        if (this.modalVisible) {
            if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
                try { if (typeof this.modalOnAccept === 'function') this.modalOnAccept(); } catch (e) {}
                this.closeModal();
            } else if (tangent === 'Escape') {
                try { if (typeof this.modalOnDecline === 'function') this.modalOnDecline(); } catch (e) {}
                this.closeModal();
            }
            return;
        }

        // Hantera test-selector tangenter om synlig
        if (this.testSelectorVisible) {
            if (tangent === 'ArrowLeft' || tangent === 'Left') {
                this.testSelectedIndex = (this.testSelectedIndex - 1 + this.testOptions.length) % this.testOptions.length;
                return;
            }
            if (tangent === 'ArrowRight' || tangent === 'Right') {
                this.testSelectedIndex = (this.testSelectedIndex + 1) % this.testOptions.length;
                return;
            }
            if (tangent === 'Escape') {
                this.testSelectorVisible = false;
                return;
            }
            if (tangent === 'Enter') {
                const chosen = this.testOptions[this.testSelectedIndex] || 'standard';
                this.aktuellGestaltOmrade = chosen;
                try { this.gestalter.laddaGestalter(chosen); } catch (e) {}
                // Positionera spelaren till spawn för valt område
                const spelare = this.hamtaSpelare();
                if (spelare) {
                    const spawn = this.gestalter.hamtaSpelareSpawn(chosen);
                    if (spawn) { spelare.x = spawn.x; spelare.y = spawn.y; }
                }
                this.testSelectorVisible = false;
                return;
            }
        }

        if ((tangent === 'e' || tangent === 'E') && !this.eKnappNedtryckt) {
            if (this.narmasteUtgang) {
                this.eKnappNedtryckt = true;
                this.narmasteUtgang.action();
                return;
            }
            // Interaktion med gestalt
            if (this.gestalter && this.gestalter.narmasteGestalt) {
                this.eKnappNedtryckt = true;
                const gestalt = this.gestalter.narmasteGestalt;
                const spelare = this.hamtaSpelare();
                try {
                    if (this.gestalter && typeof this.gestalter.registreraRumsinteraktion === 'function') {
                        this.gestalter.registreraRumsinteraktion(gestalt);
                    }
                } catch (e) {}
                if (gestalt.onInteragera && typeof gestalt.onInteragera === 'function') {
                    try { gestalt.onInteragera(gestalt, spelare, this.gestalter, this); } catch (e) {}
                } else {
                    this.gestalter.senasteMeddelande = `${gestalt.namn}: ${gestalt.meddelande || ''}`;
                    this.gestalter.senasteMeddelandeTid = 240;
                }
                return;
            }
        }

        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.tangentNed(tangent);
        }
    }

    tangentUpp(tangent) {
        if (!this.visas) return;
        if (tangent === 'e' || tangent === 'E') {
            this.eKnappNedtryckt = false;
        }
        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.tangentUpp(tangent);
        }
    }

    openModal(text, onAccept, onDecline) {
        this.modalText = text || '';
        this.modalOnAccept = onAccept || null;
        this.modalOnDecline = onDecline || null;
        this.modalVisible = true;
        // registrera muslyssnare för knappklick
        if (this.canvas && !this._boundModalMouse) {
            this._boundModalMouse = this._handleModalMouse.bind(this);
            this.canvas.addEventListener('mousedown', this._boundModalMouse);
        }
    }

    closeModal() {
        this.modalVisible = false;
        this.modalText = '';
        this.modalOnAccept = null;
        this.modalOnDecline = null;
        if (this.canvas && this._boundModalMouse) {
            this.canvas.removeEventListener('mousedown', this._boundModalMouse);
            this._boundModalMouse = null;
        }
        this._modalBtnRects = null;
    }

    _handleModalMouse(e) {
        if (!this.modalVisible || !this._modalBtnRects) return;
        const rect = this.canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const hit = (r) => (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h);
        if (this._modalBtnRects.accept && hit(this._modalBtnRects.accept)) {
            try { if (typeof this.modalOnAccept === 'function') this.modalOnAccept(); } catch (e) {}
            this.closeModal();
        } else if (this._modalBtnRects.decline && hit(this._modalBtnRects.decline)) {
            try { if (typeof this.modalOnDecline === 'function') this.modalOnDecline(); } catch (e) {}
            this.closeModal();
        }
    }

    uppdateraRorelse() {
        if (!this.visas) return;
        const spelare = this.hamtaSpelare();
        if (spelare) {
            let rorelse = false;

            const dx = (spelare.tangenter.left ? -spelare.hastighet : 0) + (spelare.tangenter.right ? spelare.hastighet : 0);
            const dy = (spelare.tangenter.up ? -spelare.hastighet : 0) + (spelare.tangenter.down ? spelare.hastighet : 0);

            if (dx !== 0) {
                spelare.riktning = dx < 0 ? 'vänster' : 'höger';
                rorelse = true;
            }
            if (dy !== 0) {
                rorelse = true;
            }

            if (dx !== 0 || dy !== 0) {
                const radie = spelare.storlek;
                const nyttX = spelare.x + dx;
                const nyttY = spelare.y + dy;

                if (!this.kolliderarPos(nyttX, nyttY, radie)) {
                    spelare.x = nyttX;
                    spelare.y = nyttY;
                } else {
                    let flyttad = false;

                    if (dx !== 0 && !this.kolliderarPos(spelare.x + dx, spelare.y, radie)) {
                        spelare.x += dx;
                        flyttad = true;
                    }
                    if (dy !== 0 && !this.kolliderarPos(spelare.x, spelare.y + dy, radie)) {
                        spelare.y += dy;
                        flyttad = true;
                    }

                    if (!flyttad) {
                        const kollision = this.hittaKollision(nyttX, nyttY, radie);
                        if (kollision) {
                            const tangentX = -kollision.normal.y;
                            const tangentY = kollision.normal.x;
                            const proj = dx * tangentX + dy * tangentY;
                            const slideX = tangentX * proj;
                            const slideY = tangentY * proj;

                            if (!this.kolliderarPos(spelare.x + slideX, spelare.y + slideY, radie)) {
                                spelare.x += slideX;
                                spelare.y += slideY;
                            }
                        }
                    }
                }
            }

            if (animationer) {
                animationer.uppdateraAnimering(spelare, rorelse);
            }

            this.kontrolleraNarhet(spelare.x, spelare.y);
            if (this.gestalter) {
                this.gestalter.kontrolleraNarhet(spelare.x, spelare.y);
                this.gestalter.uppdatera(spelare);
                this.gestalter.rensaDeadGestals();
            }
        }

    }

    kontrolleraNarhet(spelareX, spelareY) {
        this.narmasteUtgang = null;
        let minstaAvstand = Infinity;

        for (const punkt of this.utgangar) {
            const dx = spelareX - punkt.x;
            const dy = spelareY - punkt.y;
            const avstand = Math.sqrt(dx * dx + dy * dy);
            if (avstand <= punkt.radie && avstand < minstaAvstand) {
                minstaAvstand = avstand;
                this.narmasteUtgang = punkt;
            }
        }
    }

    ritaInteraktionsmeddelande() {
        const ctx = this.ctx;
        const spelare = this.hamtaSpelare();
        if (!spelare) return;

        if (this.narmasteUtgang) {
            const text = this.narmasteUtgang.meddelande;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;

            ctx.font = 'bold 14px Arial';
            const maxW = 260;
            const lines = this._wrapText(ctx, text, maxW - 20);
            let textBredd = 0;
            for (const ln of lines) textBredd = Math.max(textBredd, ctx.measureText(ln).width);
            textBredd += 20;
            const lineH = 18;
            const textHojd = Math.max(30, lines.length * lineH + 10);
            const x = spelare.x - textBredd / 2;
            const y = spelare.y - 60;

            ctx.beginPath();
            ctx.roundRect(x, y, textBredd, textHojd, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], spelare.x, y + 8 + i * lineH + lineH / 2);
            }

            ctx.restore();
        }

        if (this.gestalter) {
            // Rita interaktionshint för närmaste gestalt
            try { this.gestalter.ritaInteraktionsmeddelande(ctx, spelare.x, spelare.y); } catch (e) {}
            if (this.gestalter.stridsmeddelandeTid > 0) {
                this.gestalter.ritaStridsmeddelande(ctx, spelare.x, spelare.y);
            }
            this.gestalter.ritaSenasteMeddelande(ctx, spelare.x, spelare.y);
        }

        // Rita test-selector UI om synlig
        if (this.testSelectorVisible && this.testOptions && this.testOptions.length > 0) {
            try {
                ctx.save();
                const pad = 8;
                const boxW = 260;
                const boxH = 28 + (this.testOptions.length * 22);
                const x = 12;
                const y = 12;

                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(x, y, boxW, boxH);
                ctx.strokeStyle = '#66ccff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, boxW, boxH);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('Test: välj gestalt (← →) + Enter', x + pad, y + 18);

                ctx.font = '14px Arial';
                for (let i = 0; i < this.testOptions.length; i++) {
                    const opt = this.testOptions[i];
                    const yy = y + 22 + 18 + i * 20;
                    if (i === this.testSelectedIndex) {
                        ctx.fillStyle = '#222244';
                        ctx.fillRect(x + pad, yy - 14, boxW - pad * 2, 18);
                        ctx.fillStyle = '#ffffff';
                    } else {
                        ctx.fillStyle = '#cccccc';
                    }
                    ctx.fillText(opt, x + pad + 4, yy);
                }

                ctx.restore();
            } catch (e) {}
        }

        // Rita modal om aktiv
        if (this.modalVisible) {
            try {
                ctx.save();
                // mörk overlay
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const boxW = Math.min(600, canvas.width - 80);
                const boxX = Math.round((canvas.width - boxW) / 2);
                // Wrap modal text to fit inside boxW with padding
                ctx.font = '16px Arial';
                const lines = this._wrapText(ctx, String(this.modalText), boxW - 40);
                const lineH = 20;
                const contentH = Math.max(0, lines.length * lineH);
                const boxH = Math.max(120, 40 + contentH + 80);
                const boxY = Math.round((canvas.height - boxH) / 2);

                // dialogruta
                ctx.fillStyle = '#111111';
                ctx.strokeStyle = '#88ccff';
                ctx.lineWidth = 2;
                ctx.fillRect(boxX, boxY, boxW, boxH);
                ctx.strokeRect(boxX, boxY, boxW, boxH);

                // text
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const textX = boxX + boxW / 2;
                const textY = boxY + 28;
                for (let i = 0; i < lines.length; i++) {
                    ctx.fillText(lines[i], textX, textY + i * lineH);
                }

                // knappar
                const btnW = 140;
                const btnH = 36;
                const gap = 24;
                const btnY = boxY + boxH - btnH - 18;

                // Om det inte finns en decline-hanterare, visa EN knapp (Okej) centrerad
                if (!this.modalOnDecline) {
                    const singleX = boxX + Math.round((boxW - btnW) / 2);
                    ctx.fillStyle = '#1a8f1a';
                    ctx.fillRect(singleX, btnY, btnW, btnH);
                    ctx.strokeStyle = '#66ff66';
                    ctx.strokeRect(singleX, btnY, btnW, btnH);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText('Okej', singleX + btnW/2, btnY + btnH/2);
                    this._modalBtnRects = { accept: { x: singleX, y: btnY, w: btnW, h: btnH } };
                } else {
                    const acceptX = boxX + boxW / 2 - btnW - gap/2;
                    const declineX = boxX + boxW / 2 + gap/2;

                    // accept
                    ctx.fillStyle = '#1a8f1a';
                    ctx.fillRect(acceptX, btnY, btnW, btnH);
                    ctx.strokeStyle = '#66ff66';
                    ctx.strokeRect(acceptX, btnY, btnW, btnH);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText('Tacka ja', acceptX + btnW/2, btnY + btnH/2);

                    // decline
                    ctx.fillStyle = '#8f1a1a';
                    ctx.fillRect(declineX, btnY, btnW, btnH);
                    ctx.strokeStyle = '#ff7777';
                    ctx.strokeRect(declineX, btnY, btnW, btnH);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('Tacka nej', declineX + btnW/2, btnY + btnH/2);

                    // spara knapprect för klick-test
                    this._modalBtnRects = {
                        accept: { x: acceptX, y: btnY, w: btnW, h: btnH },
                        decline: { x: declineX, y: btnY, w: btnW, h: btnH }
                    };
                }

                ctx.restore();
            } catch (e) {}
        }
    }

    ritaFiendeStats() {
        if (!this.visas || !this.gestalter || !this.gestalter.gestalter) return;

        const narmaste = this.gestalter.narmasteGestalt;
        const gestalt = (narmaste && narmaste.levande)
            ? narmaste
            : this.gestalter.gestalter.find((g) => g.levande && !this.gestalter.arInteraktionskravGestalt(g) && g.hostil !== false);
        if (!gestalt || !gestalt.levande) return;
        if (this.gestalter.arInteraktionskravGestalt(gestalt) || gestalt.hostil === false) return;

        const skada = { fysisk: 0, eld: 0, magi: 0 };
        if (gestalt.skada && typeof gestalt.skada === 'object') {
            skada.fysisk = gestalt.skada.fysisk || 0;
            skada.eld = gestalt.skada.eld || 0;
            skada.magi = gestalt.skada.magi || 0;
        } else if (gestalt.skadaElement) {
            skada[gestalt.skadaElement] = gestalt.skada || 0;
        }

        const forsvar = gestalt.motstånd || { fysisk: 0, eld: 0, magi: 0 };

        const ctx = this.ctx;
        const boxW = 210;
        const boxH = 98;
        const x = this.canvas.width - boxW - 12;
        const y = 12;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = '#ffcc66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Fiende: ${gestalt.namn}`, x + 10, y + 8);

        const iconSize = 14;
        const iconGap = 6;
        const valueGap = 10;

        const drawRow = (label, values, rowY) => {
            ctx.font = '12px Arial';
            ctx.fillText(label, x + 10, rowY);

            let drawX = x + 10 + ctx.measureText(label).width + 8;
            ['fysisk', 'eld', 'magi'].forEach((key, index) => {
                const ikon = this.hamtaIkonBild(this.elementIkoner[key]);
                if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                    ctx.drawImage(ikon, drawX, rowY + 1, iconSize, iconSize);
                }
                this.elementHoverBounds.push({ x: drawX, y: rowY + 1, w: iconSize, h: iconSize, element: key });
                drawX += iconSize + iconGap;
                ctx.fillText(String(values[key] || 0), drawX, rowY + 2);
                drawX += ctx.measureText(String(values[key] || 0)).width + valueGap;
                if (index < 2) {
                    drawX += 4;
                }
            });
        };

        drawRow('Skada', skada, y + 30);
        drawRow('Försvar', forsvar, y + 52);

        ctx.restore();
    }

    hamtaIkonBild(src) {
        if (!src) return null;
        if (!this.ikonBildCache[src]) {
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
            this.ikonBildCache[src] = img;
        }
        return this.ikonBildCache[src];
    }

    ritaUtgangar() {
        const ctx = this.ctx;
        ctx.save();

        for (const utgang of this.utgangar) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(utgang.x, utgang.y, utgang.radie, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(utgang.namn, utgang.x, utgang.y);
        }

        ctx.restore();
    }

    lamnaGestaltrutan() {
        try {
            if (this.gestalter && typeof this.gestalter.kanLamnaRum === 'function' && !this.gestalter.kanLamnaRum()) {
                if (this.gestalter.pendingMission && !this.gestalter.pendingMission.rewarded) {
                    this.gestalter.senasteMeddelande = 'Du kan inte lämna förrän uppdraget är klart och alla fiender är besegrade.';
                } else {
                    this.gestalter.senasteMeddelande = 'Du kan inte lämna förrän du har interagerat med Hjälpare, Behov av hjälp eller Lögnare.';
                }
                this.gestalter.senasteMeddelandeTid = 240;
                return;
            }
        } catch (e) {}
        this.dolj();
        this.gaTillbaka();
    }

    kolliderarPos(x, y, radie) {
        return this.hittaKollision(x, y, radie) !== null;
    }

    hittaKollision(x, y, radie) {
        for (const barriar of this.barriarer) {
            const kollision = this.kollisionInfoBarriar(x, y, radie, barriar);
            if (kollision) {
                return kollision;
            }
        }
        return null;
    }

    kollisionInfoBarriar(x, y, radie, barriar) {
        if (barriar.typ === 'oval') {
            return this.kollisionInfoOval(x, y, radie, barriar);
        }
        return this.kollisionInfoRoteradRektangel(x, y, radie, barriar);
    }

    kollisionInfoRoteradRektangel(x, y, radie, barriar) {
        const rotation = (barriar.rotation || 0) * Math.PI / 180;
        const cx = barriar.x + barriar.bredd / 2;
        const cy = barriar.y + barriar.hojd / 2;

        const dx = x - cx;
        const dy = y - cy;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const lokalX = dx * cos + dy * sin;
        const lokalY = -dx * sin + dy * cos;

        const halvaBredd = barriar.bredd / 2;
        const halvaHojd = barriar.hojd / 2;
        const narmastX = Math.max(-halvaBredd, Math.min(lokalX, halvaBredd));
        const narmastY = Math.max(-halvaHojd, Math.min(lokalY, halvaHojd));

        const diffX = lokalX - narmastX;
        const diffY = lokalY - narmastY;
        const dist2 = diffX * diffX + diffY * diffY;
        if (dist2 > radie * radie) return null;

        let normalLokalX = 0;
        let normalLokalY = 0;
        const diffLen = Math.sqrt(dist2);

        if (diffLen > 0.0001) {
            normalLokalX = diffX / diffLen;
            normalLokalY = diffY / diffLen;
        } else {
            const distX = halvaBredd - Math.abs(lokalX);
            const distY = halvaHojd - Math.abs(lokalY);
            if (distX < distY) {
                normalLokalX = lokalX >= 0 ? 1 : -1;
                normalLokalY = 0;
            } else {
                normalLokalX = 0;
                normalLokalY = lokalY >= 0 ? 1 : -1;
            }
        }

        const normalVarldX = normalLokalX * cos - normalLokalY * sin;
        const normalVarldY = normalLokalX * sin + normalLokalY * cos;

        return {
            normal: { x: normalVarldX, y: normalVarldY }
        };
    }

    kollisionInfoOval(x, y, radie, barriar) {
        const rotation = (barriar.rotation || 0) * Math.PI / 180;
        const cx = barriar.x + barriar.bredd / 2;
        const cy = barriar.y + barriar.hojd / 2;

        const dx = x - cx;
        const dy = y - cy;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const lokalX = dx * cos + dy * sin;
        const lokalY = -dx * sin + dy * cos;

        const a = barriar.bredd / 2 + radie;
        const b = barriar.hojd / 2 + radie;
        if (a <= 0 || b <= 0) return null;

        const normX = lokalX / a;
        const normY = lokalY / b;
        const dist = normX * normX + normY * normY;
        if (dist > 1) return null;

        let normalLokalX = normX / (a || 1);
        let normalLokalY = normY / (b || 1);
        const len = Math.hypot(normalLokalX, normalLokalY);
        if (len > 0.0001) {
            normalLokalX /= len;
            normalLokalY /= len;
        } else {
            normalLokalX = Math.abs(lokalX) > Math.abs(lokalY) ? (lokalX >= 0 ? 1 : -1) : 0;
            normalLokalY = normalLokalX === 0 ? (lokalY >= 0 ? 1 : -1) : 0;
        }

        const normalVarldX = normalLokalX * cos - normalLokalY * sin;
        const normalVarldY = normalLokalX * sin + normalLokalY * cos;

        return {
            normal: { x: normalVarldX, y: normalVarldY }
        };
    }

    ritaBarriarer() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;

        for (const barriar of this.barriarer) {
            const rotation = (barriar.rotation || 0) * Math.PI / 180;
            const cx = barriar.x + barriar.bredd / 2;
            const cy = barriar.y + barriar.hojd / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotation);
            ctx.beginPath();
            if (barriar.typ === 'oval') {
                ctx.ellipse(0, 0, barriar.bredd / 2, barriar.hojd / 2, 0, 0, Math.PI * 2);
            } else {
                ctx.rect(-barriar.bredd / 2, -barriar.hojd / 2, barriar.bredd, barriar.hojd);
            }
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    ritaGameOver() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        // Mörk overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Game Over text
        ctx.save();
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);

        // Instruktionstext
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('Du har förlorat alla dina liv!', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Tryck [ESC] för att börja om', canvas.width / 2, canvas.height / 2 + 60);

        ctx.restore();
    }
}
