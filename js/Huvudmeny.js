class Huvudmeny {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.menyAlternativ = [
            'Nytt spel',
            'Fortsätt',
            'Ladda spel',
            'Spara spel',
            'Kontroller',
            'Avsluta'
        ];
        this.valdtAlternativ = 0;
        this.aktiv = true;
        // Submenu state for save/load slots
        this.submenu = null; // 'save' | 'load' | null
        this.submenuSelected = 0;
        this.numSlots = 4;
    }

    hamtaMenyBounds() {
        const startY = 200;
        const mellanrum = 60;
        const bredd = 300;
        const hojd = 50;
        const vanster = this.canvas.width / 2 - 150;

        return this.menyAlternativ.map((alternativ, index) => ({
            alternativ,
            index,
            x: vanster,
            y: startY + index * mellanrum - 35,
            w: bredd,
            h: hojd
        }));
    }

    hamtaSubmenuBounds() {
        if (!this.submenu) return [];

        const popupW = 440;
        const popupX = Math.round(this.canvas.width / 2 - popupW / 2);
        const popupY = 160;
        const rowH = 44;
        const slotsStartY = popupY + 60;
        const innerX = popupX + 20;
        const innerW = popupW - 40;
        const bounds = [];

        for (let i = 0; i < this.numSlots; i++) {
            bounds.push({
                type: 'slot',
                index: i,
                x: innerX,
                y: slotsStartY + i * rowH - 20,
                w: innerW,
                h: 36
            });
        }

        bounds.push({
            type: 'back',
            index: this.numSlots,
            x: innerX,
            y: slotsStartY + this.numSlots * rowH - 20,
            w: innerW,
            h: 36
        });

        return bounds;
    }

    hamtaTraffadMenyRad(musX, musY) {
        return this.hamtaMenyBounds().find((rad) => (
            musX >= rad.x && musX <= rad.x + rad.w && musY >= rad.y && musY <= rad.y + rad.h
        )) || null;
    }

    hamtaTraffadSubmenuRad(musX, musY) {
        return this.hamtaSubmenuBounds().find((rad) => (
            musX >= rad.x && musX <= rad.x + rad.w && musY >= rad.y && musY <= rad.y + rad.h
        )) || null;
    }

    hanteraMusMove(musX, musY) {
        if (!this.aktiv) return;

        if (this.submenu) {
            const traff = this.hamtaTraffadSubmenuRad(musX, musY);
            if (traff) {
                this.submenuSelected = traff.index;
            }
            return;
        }

        const rad = this.hamtaTraffadMenyRad(musX, musY);
        if (rad) {
            this.valdtAlternativ = rad.index;
        }
    }

    hanteraKlick(musX, musY) {
        if (!this.aktiv) return null;

        if (this.submenu) {
            const traff = this.hamtaTraffadSubmenuRad(musX, musY);
            if (!traff) return null;

            this.submenuSelected = traff.index;
            if (traff.type === 'back') {
                this.submenu = null;
                return null;
            }

            const slotIndex = traff.index + 1;
            if (this.submenu === 'save') {
                if (window && typeof window.sparaSpel === 'function') window.sparaSpel(slotIndex);
            } else if (this.submenu === 'load') {
                if (window && typeof window.laddaSpel === 'function') window.laddaSpel(slotIndex);
            }
            this.submenu = null;
            return null;
        }

        const rad = this.hamtaTraffadMenyRad(musX, musY);
        if (!rad) return null;

        this.valdtAlternativ = rad.index;
        return this.hanteraInput('Enter');
    }

    hanteraInput(tangent) {
        if (!this.aktiv) return null;

        // If in submenu (save/load slots), handle navigation there
        if (this.submenu) {
            switch(tangent) {
                case 'ArrowUp':
                    this.submenuSelected = (this.submenuSelected - 1 + (this.numSlots + 1)) % (this.numSlots + 1);
                    break;
                case 'ArrowDown':
                    this.submenuSelected = (this.submenuSelected + 1) % (this.numSlots + 1);
                    break;
                case 'Escape':
                    this.submenu = null;
                    return null;
                case 'Enter':
                    // If last option (Tillbaka)
                    if (this.submenuSelected === this.numSlots) {
                        this.submenu = null;
                        return null;
                    }
                    const slotIndex = this.submenuSelected + 1;
                    if (this.submenu === 'save') {
                        if (window && typeof window.sparaSpel === 'function') window.sparaSpel(slotIndex);
                    } else if (this.submenu === 'load') {
                        if (window && typeof window.laddaSpel === 'function') window.laddaSpel(slotIndex);
                    }
                    this.submenu = null;
                    return null;
            }
            return null;
        }

        switch(tangent) {
            case 'ArrowUp':
                this.valdtAlternativ = (this.valdtAlternativ - 1 + this.menyAlternativ.length) % this.menyAlternativ.length;
                break;
            case 'ArrowDown':
                this.valdtAlternativ = (this.valdtAlternativ + 1) % this.menyAlternativ.length;
                break;
            case 'Enter':
                // If selecting load/save, open submenu instead of returning a value
                const sel = this.menyAlternativ[this.valdtAlternativ];
                if (sel === 'Ladda spel') {
                    this.submenu = 'load';
                    this.submenuSelected = 0;
                    return null;
                }
                if (sel === 'Spara spel') {
                    this.submenu = 'save';
                    this.submenuSelected = 0;
                    return null;
                }
                return sel;
        }
        return null;
    }

    rita() {
        if (!this.aktiv) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        // Rita bakgrund
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Rita titel
        ctx.fillStyle = '#eee';
        ctx.font = 'bold 48px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText('HUVUDMENY', canvas.width / 2, 100);

        // Rita menyalternativ
        ctx.font = '32px Times New Roman';
        const startY = 200;
        const mellanrum = 60;

        this.menyAlternativ.forEach((alternativ, index) => {
            const y = startY + index * mellanrum;
            
            if (index === this.valdtAlternativ) {
                // Markerat alternativ
                ctx.fillStyle = '#16213e';
                ctx.fillRect(canvas.width / 2 - 150, y - 35, 300, 50);
                ctx.fillStyle = '#00ff88';
                ctx.fillText('> ' + alternativ + ' <', canvas.width / 2, y);
            } else {
                // Omarkerat alternativ
                ctx.fillStyle = '#aaa';
                ctx.fillText(alternativ, canvas.width / 2, y);
            }
        });

        // Rita instruktioner
        ctx.fillStyle = '#666';
        ctx.font = '16px Times New Roman';
        ctx.fillText('Använd piltangenterna eller musen för att navigera, Enter eller klick för att välja', canvas.width / 2, canvas.height - 30);

        // Rita submenu (slots) om aktiv
        if (this.submenu) {
            // Dim entire background more for better contrast
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Compute popup dimensions dynamically so all slots + 'Tillbaka' fit
            const popupW = 440;
            const popupX = Math.round(canvas.width / 2 - popupW / 2);
            const popupY = 160;
            const rowH = 44;
            const titleH = 60;
            const popupH = Math.max(220, titleH + (this.numSlots + 1) * rowH + 16);

            // Popup box
            ctx.fillStyle = 'rgba(10,10,16,0.95)';
            ctx.fillRect(popupX, popupY, popupW, popupH);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.strokeRect(popupX, popupY, popupW, popupH);

            ctx.fillStyle = '#fff';
            ctx.font = '20px Times New Roman';
            ctx.textAlign = 'center';
            const titleY = popupY + 30;
            ctx.fillText(this.submenu === 'save' ? 'Spara i slot' : 'Ladda från slot', canvas.width / 2, titleY);

            const slotsStartY = popupY + 60;
            const innerX = popupX + 20;
            const innerW = popupW - 40;

            for (let i = 0; i < this.numSlots; i++) {
                const y = slotsStartY + i * rowH;
                const key = 'yggdrasil_save_slot_' + (i + 1);
                const getSavedSlot = typeof window !== 'undefined' && typeof window.hamtaLagradData === 'function'
                    ? window.hamtaLagradData
                    : () => null;
                const hasStorage = typeof window !== 'undefined' && typeof window.arLagringTillganglig === 'function'
                    ? window.arLagringTillganglig()
                    : true;
                const raw = getSavedSlot(key);
                let displayText = (i + 1) + '. Tom slot';
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        const playerName = parsed && parsed.spelare && parsed.spelare.namn ? String(parsed.spelare.namn) : null;
                        displayText = (playerName && playerName.length > 0) ? (i + 1) + '. ' + playerName : (i + 1) + '. Sparning hittad';
                    } catch (e) {
                        displayText = (i + 1) + '. Sparning hittad';
                    }
                } else if (!hasStorage) {
                    displayText = (i + 1) + '. Sparning otillganglig';
                }
                if (i === this.submenuSelected) {
                    ctx.fillStyle = '#16213e';
                    ctx.fillRect(innerX, y - 20, innerW, 36);
                    ctx.fillStyle = '#00ff88';
                } else {
                    ctx.fillStyle = '#aaa';
                }
                ctx.fillText(displayText, canvas.width / 2, y);
            }

            // Tillbaka-rad (placed inside popup)
            const backY = slotsStartY + this.numSlots * rowH;
            if (this.submenuSelected === this.numSlots) {
                ctx.fillStyle = '#16213e';
                ctx.fillRect(innerX, backY - 20, innerW, 36);
                ctx.fillStyle = '#00ff88';
            } else ctx.fillStyle = '#aaa';
            ctx.fillText('Tillbaka', canvas.width / 2, backY);
        }
    }

    visaMeny() {
        this.aktiv = true;
    }

    doljMeny() {
        this.aktiv = false;
    }
}
