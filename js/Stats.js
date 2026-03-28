class Stats {
    constructor(canvas, ctx, hamtaSpelare) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.visas = true;

        // Möjliga ikoner för stats
        this.ikonerLaddade = {};
        this.ikonStigar = {
            strid: 'assets/Ikoner/Järnsvärd.png',
            jakt: 'assets/Ikoner/Båge.png',
            forsvar: 'assets/Ikoner/Sköld.png',
            fysisk: 'assets/Ikoner/Element Fysisk.png',
            eld: 'assets/Ikoner/Element Eld.png',
            magi: 'assets/Ikoner/Element Magi.png',
            guld: 'assets/ikoner/Guld.png',
            silver: 'assets/ikoner/Silver.png',
            koppar: 'assets/ikoner/Koppar.png'
        };
        this.elementInfo = {
            fysisk: { namn: 'Fysisk', beskrivning: 'Vanlig skada och motstånd från vapen, slag och rå styrka.' },
            eld: { namn: 'Eld', beskrivning: 'Brännande skada och skydd mot hetta, lågor och eldattacker.' },
            magi: { namn: 'Magi', beskrivning: 'Mystisk skada och motstånd mot besvärjelser och magiska krafter.' }
        };
        this.pengarInfo = {
            guld: { namn: 'Guld', beskrivning: 'Den mest vardefulla valutan. Anvands for dyra kop och storre beloningar.' },
            silver: { namn: 'Silver', beskrivning: 'En vanlig valuta for handel, uppdrag och utrustning.' },
            koppar: { namn: 'Koppar', beskrivning: 'Den minsta valutan. Anvands ofta for billiga varor och mindre kostnader.' }
        };
        this.elementHoverBounds = [];
        this.elementHoverInfo = null;
        this.pengarHoverBounds = [];
        this.pengarHoverInfo = null;

        // Ladda ikoner
        this.laddasIkoner();
    }

    laddasIkoner() {
        for (const [key, stig] of Object.entries(this.ikonStigar)) {
            const bild = new Image();
            bild.src = stig;
            bild.onload = () => {
                this.ikonerLaddade[key] = bild;
            };
            bild.onerror = () => {
                console.log(`Kunde inte ladda ikon från: ${stig}`);
            };
        }
    }

    rita() {
        if (!this.visas) return;

        const ctx = this.ctx;
        const canvas = this.canvas;
        const spelare = this.hamtaSpelare();

        if (!spelare) return;
        if (typeof spelare.uppdateraAktivaBonusEgenskaper === 'function') {
            spelare.uppdateraAktivaBonusEgenskaper();
        }
        this.elementHoverBounds = [];
        this.pengarHoverBounds = [];

        // Rensa canvasan
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw border
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Draw vertical line in middle
        const mittX = canvas.width / 2;
        ctx.strokeStyle = '#00ff8844';
        ctx.beginPath();
        ctx.moveTo(mittX, 0);
        ctx.lineTo(mittX, canvas.height);
        ctx.stroke();

        // Titel vänster
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Utrustning', 15, 10);
        
        // Titel höger
        ctx.fillText('Prestationer', mittX + 15, 10);

        // Y-position för stats
        let y = 40;
        const radHojd = 35;
        const ikonStorlek = 24;
        const xIkon = 15;
        const xText = xIkon + ikonStorlek + 10;

        // Separator
        ctx.strokeStyle = '#00ff8844';
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(canvas.width - 10, y);
        ctx.stroke();
        y += 10;

        // Utrustning Stats
        if (spelare.utrustning) {
            const vapen = spelare.utrustning.vapen;
            const rustning = spelare.utrustning.rustning;
            const hjalm = spelare.utrustning.hjalm;
            const skold = spelare.utrustning.skold;

            // Summera Skada från vapen
            const totalSkada = { fysisk: 0, eld: 0, magi: 0 };
            if (vapen && vapen.strid && typeof vapen.strid === 'object') {
                totalSkada.fysisk += vapen.strid.fysisk || 0;
                totalSkada.eld += vapen.strid.eld || 0;
                totalSkada.magi += vapen.strid.magi || 0;
            }

            // Summera Jakt från vapen
            const totalJakt = { fysisk: 0, eld: 0, magi: 0 };
            if (vapen && vapen.jakt && typeof vapen.jakt === 'object') {
                totalJakt.fysisk += vapen.jakt.fysisk || 0;
                totalJakt.eld += vapen.jakt.eld || 0;
                totalJakt.magi += vapen.jakt.magi || 0;
            }

            // Summera Motstånd från rustning, hjälm, sköld
            const totalMotstånd = { fysisk: 0, eld: 0, magi: 0 };
            const addMotstånd = (item) => {
                if (!item) return;
                const forsvarStat = item.försvar || item.forsvar;
                if (forsvarStat && typeof forsvarStat === 'object') {
                    totalMotstånd.fysisk += forsvarStat.fysisk || 0;
                    totalMotstånd.eld += forsvarStat.eld || 0;
                    totalMotstånd.magi += forsvarStat.magi || 0;
                }
            };
            addMotstånd(rustning);
            addMotstånd(hjalm);
            addMotstånd(skold);

            // Lägg till bonus från byggda hus (spelare.bonusEgenskaper)
            const bonus = spelare.bonusEgenskaper || {};
            const bonusStrid = bonus.strid || {};
            totalSkada.fysisk += bonusStrid.fysisk || 0;
            totalSkada.eld += bonusStrid.eld || 0;
            totalSkada.magi += bonusStrid.magi || 0;

            const bonusJakt = bonus.jakt || {};
            totalJakt.fysisk += bonusJakt.fysisk || 0;
            totalJakt.eld += bonusJakt.eld || 0;
            totalJakt.magi += bonusJakt.magi || 0;

            const bonusForsvar = bonus.försvar || bonus.forsvar || {};
            totalMotstånd.fysisk += bonusForsvar.fysisk || 0;
            totalMotstånd.eld += bonusForsvar.eld || 0;
            totalMotstånd.magi += bonusForsvar.magi || 0;

            // Rita Skada
            this.ritaElementStats(ctx, 'Skada', totalSkada, y, xIkon, xText);
            y += 18;

            // Rita Jakt
            this.ritaElementStats(ctx, 'Jakt', totalJakt, y, xIkon, xText);
            y += 18;

            // Rita Motstånd
            this.ritaElementStats(ctx, 'Motstånd', totalMotstånd, y, xIkon, xText);
            y += 18;

            y += 5;
            ctx.strokeStyle = '#00ff8844';
            ctx.beginPath();
            ctx.moveTo(10, y);
            ctx.lineTo(mittX - 5, y);
            ctx.stroke();
            y += 10;
        }
        
        // Rita prestationer på höger sida
        this.ritaPrestationer(ctx, spelare, mittX);
        if (this.elementHoverInfo) {
            this.ritaElementTooltip(this.elementHoverInfo.element, this.elementHoverInfo.x, this.elementHoverInfo.y);
        } else if (this.pengarHoverInfo) {
            this.ritaPengarTooltip(this.pengarHoverInfo.valuta, this.pengarHoverInfo.x, this.pengarHoverInfo.y);
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
        const ikon = this.ikonerLaddade[element];
        if (!info) return;

        const ctx = this.ctx;
        const iconSize = 104;
        const maxText = 204;
        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(info.beskrivning, maxText);
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
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        const ikonX = boxX + (boxW - iconSize) / 2;
        const ikonY = boxY + 12;
        ctx.fillStyle = 'rgba(77, 109, 140, 0.28)';
        ctx.fillRect(boxX + 16, ikonY - 6, boxW - 32, iconSize + 12);
        if (ikon) ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);

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
        const ikon = this.ikonerLaddade[valuta];
        if (!info) return;

        const ctx = this.ctx;
        const iconSize = 104;
        const maxText = 204;
        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(info.beskrivning, maxText);
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
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        const ikonX = boxX + (boxW - iconSize) / 2;
        const ikonY = boxY + 12;
        ctx.fillStyle = 'rgba(77, 109, 140, 0.28)';
        ctx.fillRect(boxX + 16, ikonY - 6, boxW - 32, iconSize + 12);
        if (ikon) ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);

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
        this.pengarHoverInfo = null;
        for (const bound of this.elementHoverBounds) {
            if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
                this.elementHoverInfo = { element: bound.element, x: musX, y: musY };
                break;
            }
        }
        if (!this.elementHoverInfo) {
            for (const bound of this.pengarHoverBounds) {
                if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
                    this.pengarHoverInfo = { valuta: bound.valuta, x: musX, y: musY };
                    break;
                }
            }
        }
    }

    rensaHover() {
        this.elementHoverInfo = null;
        this.pengarHoverInfo = null;
    }

    ritaStat(ctx, namn, varde, y, xIkon, xText, ikonStorlek, ikonNyckel) {
        // Rita ikon
        if (this.ikonerLaddade[ikonNyckel]) {
            ctx.drawImage(this.ikonerLaddade[ikonNyckel], xIkon, y - ikonStorlek / 2, ikonStorlek, ikonStorlek);
        }

        // Rita text
        ctx.fillStyle = '#00ff88';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${namn}: ${varde}`, xText, y);
    }

    ritaElementStats(ctx, label, stats, y, xIkon, xText) {
        const ikonStorlek = 16;
        const iconGap = 4;

        ctx.fillStyle = '#00ff88';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        let drawX = xText;
        ctx.fillText(`${label}:`, drawX, y);
        drawX += ctx.measureText(`${label}:`).width + 12;

        ['fysisk', 'eld', 'magi'].forEach((key) => {
            const value = stats[key] || 0;
            const ikon = this.ikonerLaddade[key];
            if (ikon) {
                ctx.drawImage(ikon, drawX, y - 6, ikonStorlek, ikonStorlek);
            }
            this.elementHoverBounds.push({ x: drawX, y: y - 6, w: ikonStorlek, h: ikonStorlek, element: key });
            drawX += ikonStorlek + iconGap;
            ctx.fillText(String(value), drawX, y);
            drawX += ctx.measureText(String(value)).width + 12;
        });
    }

    ritaPrestationer(ctx, spelare, startX) {
        if (!spelare.prestationer) return;
        
        const p = spelare.prestationer;
        let y = 40;
        const radHojd = 22;
        const xText = startX + 15;
        
        // Separator
        ctx.strokeStyle = '#00ff8844';
        ctx.beginPath();
        ctx.moveTo(startX + 10, y);
        ctx.lineTo(this.canvas.width - 10, y);
        ctx.stroke();
        y += 15;
        
        ctx.fillStyle = '#00ff88';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Fiender besegrade
        ctx.fillText(`Fiender besegrade: ${p.fiendesBesegrade}`, xText, y);
        y += radHojd;
        
        // Strider vunna
        ctx.fillText(`Strider vunna: ${p.striderVunna}`, xText, y);
        y += radHojd;
        
        // Strider förlorade
        ctx.fillText(`Strider förlorade: ${p.striderForlorade}`, xText, y);
        y += radHojd;
        
        // Lyckade Jakter
        ctx.fillText(`Lyckade Jakter: ${p.lyckadeJakter || 0}`, xText, y);
        y += radHojd;
        
        // Totalt pengar samlat
        const totalKoppar = Math.max(0, p.totaltGuldSamlat || 0);
        const totaltGuld = Math.floor(totalKoppar / 100);
        const totaltSilver = Math.floor((totalKoppar % 100) / 10);
        const totaltKopparRest = totalKoppar % 10;
        const label = 'Totalt pengar samlat:';
        const lineY = y;

        ctx.save();
        ctx.textBaseline = 'top';
        ctx.fillText(label, xText, lineY);
        let drawX = xText + ctx.measureText(label).width + 8;
        const iconSize = 18;
        const iconGap = 6;
        const valueGap = 12;
        const iconY = lineY + (radHojd - iconSize) / 2 - 5;

        const coins = [
            { key: 'guld', value: totaltGuld },
            { key: 'silver', value: totaltSilver },
            { key: 'koppar', value: totaltKopparRest }
        ];

        coins.forEach((coin) => {
            const ikon = this.ikonerLaddade[coin.key];
            if (ikon) {
                ctx.drawImage(ikon, drawX, iconY, iconSize, iconSize);
            }
            this.pengarHoverBounds.push({ x: drawX, y: iconY, w: iconSize, h: iconSize, valuta: coin.key });
            drawX += iconSize + iconGap;
            ctx.fillText(String(coin.value), drawX, lineY);
            drawX += ctx.measureText(String(coin.value)).width + valueGap;
        });
        ctx.restore();
        y += radHojd;
        
        // Föremål plockade
        ctx.fillText(`Föremål plockade: ${p.foremalPlockade}`, xText, y);
        y += radHojd;
    }

    visa() {
        this.visas = true;
    }

    dolj() {
        this.visas = false;
    }
}
