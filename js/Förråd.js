class Forrad {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = true;
        this.spelare = null;
        this.pengarBildCache = {};
        this.ikonBildCache = {};
        this.forhandsvisningForemal = null;
        this.previewKrav = null;
        this.hoverInfo = null;
        this.meddelande = null;
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
        this.pengarInfo = {
            guld: { namn: 'Guld', beskrivning: 'Den mest vardefulla valutan.' },
            silver: { namn: 'Silver', beskrivning: 'En vanlig valuta for handel.' },
            koppar: { namn: 'Koppar', beskrivning: 'Den enklaste valutan for mindre kop.' }
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
        this.elementHoverInfo = null;
        this.elementHoverBounds = [];
        this.kravHoverInfo = null;
        this.kravHoverBounds = [];
        this.pengarHoverInfo = null;
        this.pengarHoverBounds = [];
        this.hoverBoxBounds = null;
        this.hoverLasAktiv = false;
        this.senasteMusX = null;
        this.senasteMusY = null;
        this.dragInfo = null;
        this.dragThreshold = 8;
        this.dropTargetIndex = null;
        this.suppressNextClick = false;
        
        // Position och storlek för förrådsrutan
        this.ruta = {
            x: 0,
            y: 0,
            bredd: canvas.width,
            hojd: canvas.height
        };
        
        // Förrådets innehåll
        this.foremal = [];
        
        // Grid-konfiguration (anpassa efter rutnätet i bilden)
        this.gridKolumner = 5;
        this.gridRader = 5;
        this.gridInset = 118;
        this.gridBreddFactor = 1.08;
        this.gridHojdFactor = 1.02;
        this.visaGridDebug = false;
        this.maxAntal = this.gridKolumner * this.gridRader;
    }

    // Sätt aktiv spelare (för pengar m.m.)
    sattSpelare(spelare) {
        this.spelare = spelare;
        if (this.spelare && this.spelare.utrustning) {
            this.spelare.utrustning.maxInventory = this.maxAntal;
        }
    }
    
    // Visa/dölj förrådet
    toggle() {
        this.visas = !this.visas;
    }

    sattForhandsvisning(foremal) {
        this.forhandsvisningForemal = foremal || null;
    }

    sattPreviewKrav(krav) {
        this.previewKrav = krav || null;
    }

    rensaForhandsvisning() {
        this.forhandsvisningForemal = null;
    }
    
    visa() {
        this.visas = true;
    }
    
    dölj() {
        this.visas = false;
    }
    
    // Lägg till föremål i förrådet
    laggTillForemal(foremal) {
        if (this.foremal.length >= this.maxAntal) {
            console.log('Förrådet är fullt!');
            return false;
        }
        this.foremal.push(foremal);
        return true;
    }
    
    // Ta bort föremål från förrådet
    taBortForemal(index) {
        if (index >= 0 && index < this.foremal.length) {
            return this.foremal.splice(index, 1)[0];
        }
        return null;
    }
    
    // Rita förrådsrutan
    rita() {
        if (!this.visas) return;
        
        const ctx = this.ctx;
        
        // Rensa canvas (bakgrundsbilden ligger i CSS)
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.synkaForemalFranSpelare();

        // Rita spelarens pengar
        this.ritaPengar();
        
        // Rita föremål i grid
        this.ritaForemalGrid();

        // Rita hover-info
        this.ritaHoverInfo();
        if (!this.hoverInfo && this.pengarHoverInfo) {
            this.ritaPengarTooltip(this.pengarHoverInfo.valuta, this.pengarHoverInfo.x, this.pengarHoverInfo.y);
        }

        // Rita meddelande
        this.ritaMeddelande();
    }

    synkaForemalFranSpelare() {
        if (this.forhandsvisningForemal) {
            this.foremal = this.forhandsvisningForemal;
            return;
        }
        if (!this.spelare || !this.spelare.utrustning) return;
        this.spelare.utrustning.maxInventory = this.maxAntal;
        this.foremal = this.spelare.utrustning.inventory;
    }

    ritaPengar() {
        if (this.forhandsvisningForemal) return;
        if (!this.spelare || !this.spelare.pengar) return;
        this.pengarHoverBounds = [];

        const { koppar = 0, silver = 0, guld = 0 } = this.spelare.pengar;
        const ctx = this.ctx;

        const panelX = 60;
        const panelY = 510;
        const panelBredd = 220;
        const panelHojd = 36;

        ctx.save();
        const iconSize = 20;
        const textGap = 6;
        const blockGap = 14;
        const centerY = panelY + panelHojd / 2;
        let drawX = panelX + 10;

        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd166';

        drawX = this.ritaPengarRad(drawX, centerY, guld, 'assets/ikoner/Guld.png', iconSize, textGap, 'guld');
        drawX += blockGap;
        drawX = this.ritaPengarRad(drawX, centerY, silver, 'assets/ikoner/Silver.png', iconSize, textGap, 'silver');
        drawX += blockGap;
        this.ritaPengarRad(drawX, centerY, koppar, 'assets/ikoner/Koppar.png', iconSize, textGap, 'koppar');
        ctx.restore();
    }

    ritaPengarRad(startX, centerY, belopp, bildSrc, iconSize, textGap, valuta) {
        const ctx = this.ctx;
        const bild = this.hamtaPengarBild(bildSrc);
        const iconY = centerY - iconSize / 2;

        this.pengarHoverBounds.push({ x: startX, y: iconY, w: iconSize, h: iconSize, valuta });

        if (bild && bild.complete && bild.naturalWidth > 0) {
            ctx.drawImage(bild, startX, iconY, iconSize, iconSize);
        } else {
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(startX, iconY, iconSize, iconSize);
        }

        const textX = startX + iconSize + textGap;
        ctx.fillStyle = '#ffd166';
        ctx.fillText(`${belopp}`, textX, centerY);

        return textX + ctx.measureText(`${belopp}`).width;
    }

    hamtaPengarBild(src) {
        if (!this.pengarBildCache[src]) {
            const img = new Image();
            img.src = src;
            this.pengarBildCache[src] = img;
        }
        return this.pengarBildCache[src];
    }
    
    // Rita föremål i grid-format
    ritaForemalGrid() {
        const ctx = this.ctx;
        const grid = this.beraknaGrid();
        const kolumner = this.gridKolumner;
        const rader = this.gridRader;

        if (this.visaGridDebug) {
            this.ritaGridDebug(grid);
        }

        if (this.dragInfo && this.dragInfo.aktiv && this.dropTargetIndex !== null) {
            this.ritaDropMarkering(grid, this.dropTargetIndex);
        }
        
        for (let i = 0; i < this.foremal.length; i++) {
            if (this.dragInfo && this.dragInfo.aktiv && i === this.dragInfo.startIndex) {
                continue;
            }

            const rad = Math.floor(i / kolumner);
            const kolumn = i % kolumner;
            
            if (rad >= rader) break;
            
            const x = grid.x + kolumn * grid.slotBredd;
            const y = grid.y + rad * grid.slotHojd;
            
            // Rita föremålsikon
            const foremal = this.foremal[i];
            if (foremal) {
                this.ritaForemalIGridSlot(foremal, x, y, grid, 1);
            }
        }

        if (this.dragInfo && this.dragInfo.aktiv && this.dragInfo.foremal) {
            this.ritaDragForhandsvisning(grid);
        }
    }

    ritaForemalIGridSlot(foremal, x, y, grid, alpha) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;

        const ikonStig = foremal.ikon || this.byggIkonStig(foremal);
        const ikon = this.hamtaIkonBild(ikonStig);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            const padding = 12;
            const maxBredd = grid.slotBredd - padding * 2;
            const maxHojd = grid.slotHojd - padding * 2;
            const scale = Math.min(maxBredd / ikon.naturalWidth, maxHojd / ikon.naturalHeight);
            const drawW = ikon.naturalWidth * scale;
            const drawH = ikon.naturalHeight * scale;
            const drawX = x + (grid.slotBredd - drawW) / 2;
            const drawY = y + (grid.slotHojd - drawH) / 2;
            ctx.drawImage(ikon, drawX, drawY, drawW, drawH);
        } else {
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const kortnamn = foremal.namn ? foremal.namn.substring(0, 3).toUpperCase() : '?';
            ctx.fillText(kortnamn, x + grid.slotBredd / 2, y + grid.slotHojd / 2);
        }

        if (foremal.count && foremal.count > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            const countX = x + grid.slotBredd - 10;
            const countY = y + grid.slotHojd - 6;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(String(foremal.count), countX, countY);
            ctx.fillText(String(foremal.count), countX, countY);
        }

        if (foremal.questFor) {
            const badgeSize = 18;
            const bx = x + 8;
            const by = y + 8;
            const cx = bx + badgeSize / 2;
            const cy = by + badgeSize / 2;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.fillStyle = '#50DCA4';
            ctx.arc(cx, cy, badgeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Q', cx, cy);
            ctx.restore();
        }

        ctx.restore();
    }

    ritaDropMarkering(grid, index) {
        const slot = this.hamtaSlotRect(index, grid);
        if (!slot) return;

        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(139, 211, 255, 0.16)';
        ctx.fillRect(slot.x + 4, slot.y + 4, slot.bredd - 8, slot.hojd - 8);
        ctx.strokeRect(slot.x + 4, slot.y + 4, slot.bredd - 8, slot.hojd - 8);
        ctx.restore();
    }

    ritaDragForhandsvisning(grid) {
        const dragInfo = this.dragInfo;
        if (!dragInfo || !dragInfo.foremal || this.senasteMusX === null || this.senasteMusY === null) return;

        const x = this.senasteMusX - dragInfo.offsetX;
        const y = this.senasteMusY - dragInfo.offsetY;
        this.ritaForemalIGridSlot(dragInfo.foremal, x, y, grid, 0.78);
    }

    ritaGridDebug(grid) {
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let rad = 0; rad < this.gridRader; rad++) {
            for (let kolumn = 0; kolumn < this.gridKolumner; kolumn++) {
                const x = grid.x + kolumn * grid.slotBredd;
                const y = grid.y + rad * grid.slotHojd;
                const index = rad * this.gridKolumner + kolumn;
                ctx.fillRect(x, y, grid.slotBredd, grid.slotHojd);
                ctx.strokeRect(x, y, grid.slotBredd, grid.slotHojd);
                ctx.fillStyle = 'rgba(0, 255, 136, 0.9)';
                ctx.fillText(String(index + 1), x + 4, y + 4);
                ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
            }
        }

        ctx.strokeStyle = 'rgba(255, 220, 120, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(grid.x, grid.y, grid.bredd, grid.hojd);
        ctx.restore();
    }

    ritaHoverInfo() {
        this.elementHoverBounds = [];
        this.kravHoverBounds = [];
        this.hoverBoxBounds = null;
        if (!this.hoverInfo || !this.hoverInfo.foremal) return;

        const ctx = this.ctx;
        const foremal = this.hoverInfo.foremal;
        const rows = [];

        if (foremal.namn) {
            rows.push({ type: 'text', text: foremal.namn });
        }
        if (foremal.questFor) {
            rows.push({ type: 'text', text: 'Quest item' });
        }
        if (foremal.count && foremal.count > 1) {
            rows.push({ type: 'text', text: 'Antal: ' + foremal.count });
        }
        if (foremal.beskrivning) {
            rows.push({ type: 'text', text: foremal.beskrivning, italic: true, description: true });
        }

        const statRows = this.hamtaStatRader(foremal);
        statRows.forEach((row) => rows.push(row));

        for (let i = 1; i < rows.length; i++) {
            if (rows[i - 1] && rows[i - 1].description && rows[i] && rows[i].type === 'elements') {
                rows.splice(i, 0, { type: 'spacer' });
                break;
            }
        }

        if (this.arLuftigUtrustningstooltip(foremal, rows)) {
            for (let i = 1; i < rows.length; i++) {
                if (rows[i] && rows[i].type === 'krav' && rows[i - 1] && rows[i - 1].type !== 'spacer') {
                    rows.splice(i, 0, { type: 'spacer' });
                    break;
                }
            }
        }

        if (rows.length === 0) return;

        const padding = 8;
        const lineHeight = 18;
        ctx.save();
        ctx.font = '14px Arial';

        const iconSize = 14;
        const iconGap = 6;
        const pairGap = 10;

        let maxWidth = 0;
        rows.forEach((row) => {
            let width = 0;
            if (row.type === 'elements') {
                const labelWidth = ctx.measureText(row.label).width;
                width += labelWidth + iconGap;
                const values = [row.values.fysisk || 0, row.values.eld || 0, row.values.magi || 0];
                values.forEach((value, index) => {
                    const valueWidth = ctx.measureText(String(value)).width;
                    width += iconSize + iconGap + valueWidth;
                    if (index < values.length - 1) width += pairGap;
                });
            } else if (row.type === 'krav') {
                const labelWidth = ctx.measureText(row.label).width;
                width += labelWidth + iconGap;
                const values = [row.values.konstruktion || 0, row.values.reflex || 0, row.values.special || 0];
                values.forEach((value, index) => {
                    const valueWidth = ctx.measureText(String(value)).width;
                    width += iconSize + iconGap + valueWidth;
                    if (index < values.length - 1) width += pairGap;
                });
            } else if (row.type === 'spacer') {
                width = 0;
            } else {
                ctx.font = row.italic ? 'italic 14px Arial' : '14px Arial';
                width = ctx.measureText(row.text).width;
            }
            if (width > maxWidth) maxWidth = width;
        });
        ctx.font = '14px Arial';

        const boxW = maxWidth + padding * 2;
        const boxH = rows.length * lineHeight + padding * 2;
        let boxX = this.hoverInfo.x + 12;
        let boxY = this.hoverInfo.y + 12;

        if (boxX + boxW > this.canvas.width) {
            boxX = this.hoverInfo.x - boxW - 12;
        }
        if (boxY + boxH > this.canvas.height) {
            boxY = this.hoverInfo.y - boxH - 12;
        }
        boxX = Math.max(0, Math.min(boxX, this.canvas.width - boxW));
        boxY = Math.max(0, Math.min(boxY, this.canvas.height - boxH));
        this.hoverBoxBounds = { x: boxX, y: boxY, w: boxW, h: boxH, foremal };

        ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        rows.forEach((row, index) => {
            const textY = boxY + padding + index * lineHeight;
            if (row.type === 'elements') {
                let drawX = boxX + padding;
                ctx.fillText(row.label, drawX, textY);
                drawX += ctx.measureText(row.label).width + iconGap;

                const entries = [
                    { key: 'fysisk', value: row.values.fysisk || 0 },
                    { key: 'eld', value: row.values.eld || 0 },
                    { key: 'magi', value: row.values.magi || 0 }
                ];

                entries.forEach((entry, entryIndex) => {
                    const ikon = this.hamtaIkonBild(this.elementIkoner[entry.key]);
                    if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                        ctx.drawImage(ikon, drawX, textY + 2, iconSize, iconSize);
                    }
                    this.elementHoverBounds.push({
                        x: drawX,
                        y: textY + 2,
                        w: iconSize,
                        h: iconSize,
                        element: entry.key
                    });
                    drawX += iconSize + iconGap;
                    ctx.fillText(String(entry.value), drawX, textY);
                    drawX += ctx.measureText(String(entry.value)).width;
                    if (entryIndex < entries.length - 1) drawX += pairGap;
                });
            } else if (row.type === 'krav') {
                let drawX = boxX + padding;
                ctx.fillText(row.label, drawX, textY);
                drawX += ctx.measureText(row.label).width + iconGap;

                const entries = [
                    { key: 'konstruktion', value: row.values.konstruktion || 0 },
                    { key: 'reflex', value: row.values.reflex || 0 },
                    { key: 'special', value: row.values.special || 0 }
                ];

                entries.forEach((entry, entryIndex) => {
                    const ikon = this.hamtaIkonBild(this.kravIkoner[entry.key]);
                    if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                        ctx.drawImage(ikon, drawX, textY + 2, iconSize, iconSize);
                    }
                    this.kravHoverBounds.push({
                        x: drawX,
                        y: textY + 2,
                        w: iconSize,
                        h: iconSize,
                        krav: entry.key
                    });
                    drawX += iconSize + iconGap;
                    ctx.fillText(String(entry.value), drawX, textY);
                    drawX += ctx.measureText(String(entry.value)).width;
                    if (entryIndex < entries.length - 1) drawX += pairGap;
                });
            } else if (row.type === 'spacer') {
                return;
            } else {
                ctx.font = row.italic ? 'italic 14px Arial' : '14px Arial';
                ctx.fillText(row.text, boxX + padding, textY);
                ctx.font = '14px Arial';
            }
        });
        if (this.elementHoverInfo) {
            this.ritaElementTooltip(this.elementHoverInfo.element, this.elementHoverInfo.x, this.elementHoverInfo.y);
        } else if (this.kravHoverInfo) {
            this.ritaKravTooltip(this.kravHoverInfo.krav, this.kravHoverInfo.x, this.kravHoverInfo.y);
        }
        ctx.restore();
    }

    hanteraTangent(tangent) {
        if (!this.visas) return false;
        if (tangent !== 'e' && tangent !== 'E') return false;

        if (this.hoverLasAktiv) {
            this.hoverLasAktiv = false;
            if (this.senasteMusX !== null && this.senasteMusY !== null) {
                this.uppdateraHoverFranMus(this.senasteMusX, this.senasteMusY);
            } else {
                this.rensaHover();
            }
            return true;
        }

        if (!this.hoverInfo || !this.hoverInfo.foremal) return false;

        this.hoverLasAktiv = true;
        this.hoverInfo = {
            foremal: this.hoverInfo.foremal,
            x: this.hoverInfo.x,
            y: this.hoverInfo.y
        };

        if (this.senasteMusX !== null && this.senasteMusY !== null) {
            this.uppdateraElementHover(this.senasteMusX, this.senasteMusY);
        }

        return true;
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

    arLuftigUtrustningstooltip(foremal, rows) {
        if (!foremal) return false;
        const utrustningTyper = ['vapen', 'verktyg', 'rustning', 'skold', 'hjalm'];
        if (!utrustningTyper.includes(foremal.typ)) return false;
        return !rows.some((row) => row && row.type === 'text' && !row.text);
    }

    ritaElementTooltip(element, musX, musY) {
        const info = this.elementInfo[element];
        if (!info) return;

        const ctx = this.ctx;
        const ikon = this.hamtaIkonBild(this.elementIkoner[element]);
        const iconSize = 104;
        const maxTextBredd = 204;

        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(info.beskrivning, maxTextBredd);
        const boxW = 268;
        const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
        let boxX = musX + 16;
        let boxY = musY - boxH / 2;

        if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
        if (boxY < 0) boxY = 0;
        if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

        ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

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

    ritaKravTooltip(krav, musX, musY) {
        const info = this.kravInfo[krav];
        if (!info) return;

        const ctx = this.ctx;
        const ikon = this.hamtaIkonBild(this.kravIkoner[krav]);
        const iconSize = 104;
        const maxTextBredd = 204;

        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(info.beskrivning, maxTextBredd);
        const boxW = 268;
        const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
        let boxX = musX + 16;
        let boxY = musY - boxH / 2;

        if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
        if (boxY < 0) boxY = 0;
        if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

        ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

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

    ritaPengarTooltip(valuta, musX, musY) {
        const info = this.pengarInfo[valuta];
        if (!info) return;

        const ctx = this.ctx;
        const ikon = this.hamtaPengarBild(`assets/ikoner/${valuta.charAt(0).toUpperCase() + valuta.slice(1)}.png`);
        const iconSize = 104;
        const maxTextBredd = 204;

        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(info.beskrivning, maxTextBredd);
        const boxW = 268;
        const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
        let boxX = musX + 16;
        let boxY = musY - boxH / 2;

        if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
        if (boxY < 0) boxY = 0;
        if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

        ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

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

    uppdateraElementHover(musX, musY) {
        this.elementHoverInfo = null;
        this.kravHoverInfo = null;
        for (const bound of this.elementHoverBounds) {
            if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
                this.elementHoverInfo = { element: bound.element, x: musX, y: musY };
                break;
            }
        }
        if (this.elementHoverInfo) return;
        for (const bound of this.kravHoverBounds) {
            if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
                this.kravHoverInfo = { krav: bound.krav, x: musX, y: musY };
                break;
            }
        }
    }

    uppdateraHoverFranMus(musX, musY) {
        const grid = this.beraknaGrid();
        const inomGrid = musX >= grid.x && musX <= grid.x + grid.bredd &&
                         musY >= grid.y && musY <= grid.y + grid.hojd;
        if (inomGrid) {
            const kolumn = Math.floor((musX - grid.x) / grid.slotBredd);
            const rad = Math.floor((musY - grid.y) / grid.slotHojd);

            if (kolumn >= 0 && kolumn < this.gridKolumner && rad >= 0 && rad < this.gridRader) {
                const index = rad * this.gridKolumner + kolumn;
                const foremal = this.foremal[index] || null;
                if (foremal) {
                    this.hoverInfo = {
                        foremal,
                        x: musX,
                        y: musY
                    };
                    this.uppdateraElementHover(musX, musY);
                    return;
                }
            }
        }

        if (this.hoverBoxBounds && musX >= this.hoverBoxBounds.x && musX <= this.hoverBoxBounds.x + this.hoverBoxBounds.w && musY >= this.hoverBoxBounds.y && musY <= this.hoverBoxBounds.y + this.hoverBoxBounds.h) {
            this.hoverInfo = {
                foremal: this.hoverBoxBounds.foremal,
                x: musX,
                y: musY
            };
            this.uppdateraElementHover(musX, musY);
            return;
        }

        this.hoverInfo = null;
        this.elementHoverInfo = null;
        this.kravHoverInfo = null;
    }

    hamtaStatRader(foremal) {
        const rader = [];
        if (!foremal) return rader;

        const utrustningTyper = ['vapen', 'verktyg', 'rustning', 'skold', 'hjalm'];
        const arUtrustning = utrustningTyper.includes(foremal.typ);
        if (!arUtrustning) {
            if (typeof foremal.styrka === 'number') rader.push({ type: 'text', text: 'Styrka: +' + foremal.styrka });
            if (typeof foremal.konstruktion === 'number') rader.push({ type: 'text', text: 'Konstruktion: +' + foremal.konstruktion });
            if (typeof foremal.special === 'number') rader.push({ type: 'text', text: 'Special: +' + foremal.special });
            if (typeof foremal.uthållighet === 'number') rader.push({ type: 'text', text: 'Uthållighet: +' + foremal.uthållighet });
        }

        const forsvar = foremal.försvar || foremal.forsvar;
        if (forsvar && typeof forsvar === 'object') {
            rader.push({
                type: 'elements',
                label: 'Försvar:',
                values: {
                    fysisk: forsvar.fysisk || 0,
                    eld: forsvar.eld || 0,
                    magi: forsvar.magi || 0
                }
            });
        }

        if (foremal.strid && typeof foremal.strid === 'object') {
            rader.push({
                type: 'elements',
                label: 'Strid:',
                values: {
                    fysisk: foremal.strid.fysisk || 0,
                    eld: foremal.strid.eld || 0,
                    magi: foremal.strid.magi || 0
                }
            });
        }
        if (foremal.jakt && typeof foremal.jakt === 'object') {
            rader.push({
                type: 'elements',
                label: 'Jakt:',
                values: {
                    fysisk: foremal.jakt.fysisk || 0,
                    eld: foremal.jakt.eld || 0,
                    magi: foremal.jakt.magi || 0
                }
            });
        }

        if (foremal.effekt && typeof foremal.värde === 'number') {
            const effekt = foremal.effekt === 'liv' ? 'Liv' : (foremal.effekt === 'energi' ? 'Energi' : foremal.effekt);
            rader.push({ type: 'text', text: 'Effekt: ' + effekt + ' +' + foremal.värde });
        }

        if (foremal.passiv && typeof foremal.passiv === 'object') {
            let passivRader = [];

            if (this.forhandsvisningForemal && this.previewKrav) {
                const previewSpelare = {
                    krav: this.previewKrav,
                    konstruktion: this.previewKrav.konstruktion || 0,
                    special: this.previewKrav.special || 0
                };
                const previewUtrustning = new Utrustning(previewSpelare);
                if (typeof previewUtrustning.hamtaPassivTooltipRader === 'function') {
                    passivRader = previewUtrustning.hamtaPassivTooltipRader(foremal);
                }
            } else if (this.spelare && this.spelare.utrustning && typeof this.spelare.utrustning.hamtaPassivTooltipRader === 'function') {
                passivRader = this.spelare.utrustning.hamtaPassivTooltipRader(foremal);
            }

            if (passivRader.length > 0) {
                passivRader.forEach((rad) => {
                    if (rad && typeof rad === 'object' && rad.type) {
                        rader.push(rad);
                    } else {
                        rader.push({ type: 'text', text: rad });
                    }
                });
            } else {
                const passivNamn = foremal.passiv.namn || 'Passiv';
                rader.push({ type: 'text', text: 'Passiv: ' + passivNamn });
                if (foremal.passiv.beskrivning) {
                    rader.push({ type: 'text', text: foremal.passiv.beskrivning });
                }
            }
        }

        if (typeof Krav === 'function') {
            if (arUtrustning) {
                const krav = Krav.hamtaKravForForemal(foremal);
                rader.push({
                    type: 'krav',
                    label: 'Krav:',
                    values: {
                        konstruktion: krav.konstruktion || 0,
                        reflex: krav.reflex || 0,
                        special: krav.special || 0
                    }
                });
            }
        }

        return rader;
    }

    byggIkonStig(foremal) {
        if (!foremal || !foremal.namn) return null;
        const mapp = this.hamtaForemalMapp(foremal.typ);
        if (!mapp) return null;
        return `assets/${mapp}/${foremal.namn}.png`;
    }

    hamtaForemalMapp(typ) {
        if (typ === 'konsumerbar') return 'Varor';
        if (typ === 'vara') return 'Varor';
        if (typ === 'vapen' || typ === 'verktyg' || typ === 'rustning') return 'Utrustning';
        return null;
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

    hamtaIndexFranMus(musX, musY) {
        const grid = this.beraknaGrid();
        const inomGrid = musX >= grid.x && musX <= grid.x + grid.bredd && musY >= grid.y && musY <= grid.y + grid.hojd;
        if (!inomGrid) return null;

        const kolumn = Math.floor((musX - grid.x) / grid.slotBredd);
        const rad = Math.floor((musY - grid.y) / grid.slotHojd);
        if (kolumn < 0 || kolumn >= this.gridKolumner || rad < 0 || rad >= this.gridRader) return null;
        return rad * this.gridKolumner + kolumn;
    }

    hamtaSlotRect(index, grid) {
        const aktivtGrid = grid || this.beraknaGrid();
        if (!Number.isInteger(index) || index < 0 || index >= this.maxAntal) return null;
        const kolumn = index % this.gridKolumner;
        const rad = Math.floor(index / this.gridKolumner);
        if (rad >= this.gridRader) return null;
        return {
            x: aktivtGrid.x + kolumn * aktivtGrid.slotBredd,
            y: aktivtGrid.y + rad * aktivtGrid.slotHojd,
            bredd: aktivtGrid.slotBredd,
            hojd: aktivtGrid.slotHojd
        };
    }

    hanteraMusNed(musX, musY) {
        if (!this.visas) return false;
        if (this.forhandsvisningForemal) return false;

        this.senasteMusX = musX;
        this.senasteMusY = musY;
        const index = this.hamtaIndexFranMus(musX, musY);
        if (index === null) {
            this.dragInfo = null;
            this.dropTargetIndex = null;
            return false;
        }

        const foremal = this.foremal[index] || null;
        if (!foremal) {
            this.dragInfo = null;
            this.dropTargetIndex = null;
            return false;
        }

        const slot = this.hamtaSlotRect(index);
        this.dragInfo = {
            startIndex: index,
            foremal,
            startX: musX,
            startY: musY,
            offsetX: slot ? musX - slot.x : 0,
            offsetY: slot ? musY - slot.y : 0,
            aktiv: false
        };
        this.dropTargetIndex = index;
        return true;
    }

    hanteraMusUpp(musX, musY) {
        if (!this.dragInfo) return false;

        if (typeof musX === 'number') this.senasteMusX = musX;
        if (typeof musY === 'number') this.senasteMusY = musY;

        const dragInfo = this.dragInfo;
        this.dragInfo = null;

        if (!dragInfo.aktiv) {
            this.dropTargetIndex = null;
            return false;
        }

        const targetIndexRaw = this.hamtaIndexFranMus(this.senasteMusX, this.senasteMusY);
        const targetIndex = targetIndexRaw === null ? this.dropTargetIndex : targetIndexRaw;
        const malIndex = targetIndex === null ? dragInfo.startIndex : Math.max(0, Math.min(targetIndex, this.maxAntal - 1));

        if (malIndex !== dragInfo.startIndex) {
            if (this.spelare && this.spelare.utrustning && typeof this.spelare.utrustning.flyttaForemal === 'function') {
                this.spelare.utrustning.flyttaForemal(dragInfo.startIndex, malIndex);
            } else {
                while (this.foremal.length <= Math.max(dragInfo.startIndex, malIndex)) {
                    this.foremal.push(null);
                }
                const malForemal = this.foremal[malIndex] || null;
                this.foremal[malIndex] = dragInfo.foremal;
                this.foremal[dragInfo.startIndex] = malForemal;
            }
        }

        this.dropTargetIndex = null;
        this.suppressNextClick = true;
        this.hoverLasAktiv = false;
        this.hoverInfo = null;
        this.elementHoverInfo = null;
        this.kravHoverInfo = null;
        this.uppdateraHoverFranMus(this.senasteMusX, this.senasteMusY);
        return true;
    }
    
    // Hantera musklick
    hanteraKlick(musX, musY) {
        if (!this.visas) return;
        if (this.suppressNextClick) {
            this.suppressNextClick = false;
            return null;
        }
        
        const index = this.hamtaIndexFranMus(musX, musY);
        if (index === null) return null;
        const foremal = this.foremal[index] || null;
        if (foremal) {
            const kanUtrusta = !this.forhandsvisningForemal && this.spelare && this.spelare.utrustning;
            if (kanUtrusta) {
                const lyckades = this.spelare.utrustning.utrustaForemal(index);
                if (!lyckades) {
                    const saknas = this.spelare.utrustning.hamtaSaknadeKrav(foremal);
                    if (saknas.length > 0) {
                        this.visaMeddelande(`Du har för lite ${saknas.join(' och ')}`);
                    }
                }
            }
            console.log('Klickade på föremål:', foremal);
        }
        return foremal;
    }

    hanteraMusMove(musX, musY) {
        if (!this.visas) return;
        this.senasteMusX = musX;
        this.senasteMusY = musY;

        if (this.dragInfo) {
            const dragDistans = Math.hypot(musX - this.dragInfo.startX, musY - this.dragInfo.startY);
            if (!this.dragInfo.aktiv && dragDistans >= this.dragThreshold) {
                this.dragInfo.aktiv = true;
                this.hoverLasAktiv = false;
                this.hoverInfo = null;
                this.elementHoverInfo = null;
                this.kravHoverInfo = null;
            }

            if (this.dragInfo.aktiv) {
                const targetIndex = this.hamtaIndexFranMus(musX, musY);
                if (targetIndex !== null) {
                    this.dropTargetIndex = Math.max(0, Math.min(targetIndex, this.maxAntal - 1));
                } else {
                    this.dropTargetIndex = null;
                }
                this.pengarHoverInfo = null;
                return;
            }
        }

        this.pengarHoverInfo = null;

        for (const bound of this.pengarHoverBounds) {
            if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
                this.pengarHoverInfo = { valuta: bound.valuta, x: musX, y: musY };
                break;
            }
        }

        if (this.hoverLasAktiv) {
            if (!this.hoverInfo || !this.hoverInfo.foremal) {
                this.hoverLasAktiv = false;
                this.uppdateraHoverFranMus(musX, musY);
                return;
            }

            if (this.hoverBoxBounds && musX >= this.hoverBoxBounds.x && musX <= this.hoverBoxBounds.x + this.hoverBoxBounds.w && musY >= this.hoverBoxBounds.y && musY <= this.hoverBoxBounds.y + this.hoverBoxBounds.h) {
                this.uppdateraElementHover(musX, musY);
            } else {
                this.elementHoverInfo = null;
            }
            return;
        }

        this.uppdateraHoverFranMus(musX, musY);
    }

    rensaHover() {
        this.hoverInfo = null;
        this.elementHoverInfo = null;
        this.elementHoverBounds = [];
        this.kravHoverInfo = null;
        this.kravHoverBounds = [];
        this.pengarHoverInfo = null;
        this.pengarHoverBounds = [];
        this.hoverBoxBounds = null;
        this.hoverLasAktiv = false;
        if (!this.dragInfo) {
            this.dropTargetIndex = null;
        }
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
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const paddingX = 14;
        const paddingY = 8;
        const textWidth = ctx.measureText(text).width;
        const boxW = textWidth + paddingX * 2;
        const boxH = 28 + paddingY;
        const x = canvas.width / 2 - boxW / 2;
        const y = canvas.height - 48;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, boxW, boxH);
        ctx.strokeRect(x, y, boxW, boxH);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, canvas.width / 2, y + boxH / 2);

        ctx.restore();
    }
    
    // Hantera scrollning
    hanteraScroll(delta) {
        return;
    }
    
    // Beräkna grid-området där rutor finns i bilden
    beraknaGrid() {
        const size = Math.min(this.canvas.width, this.canvas.height);
        const offsetX = (this.canvas.width - size) / 2;
        const offsetY = (this.canvas.height - size) / 2;
        const inset = this.gridInset;
        const gridSize = size - inset * 2;
        const gridBredd = gridSize * this.gridBreddFactor;
        const tillgangligHojd = Math.max(0, this.canvas.height - (offsetY + inset) - 84);
        const onskadGridHojd = gridSize * this.gridHojdFactor;
        const gridHojd = Math.min(onskadGridHojd, tillgangligHojd);
        const extraBredd = gridBredd - gridSize;
        return {
            x: offsetX + inset - extraBredd / 2,
            y: offsetY + inset - 5,
            bredd: gridBredd,
            hojd: gridHojd,
            slotBredd: gridBredd / this.gridKolumner,
            slotHojd: gridHojd / this.gridRader
        };
    }
}
