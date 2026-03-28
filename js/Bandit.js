class Bandit {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka, stridSystem) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);
        this.stridSystem = stridSystem || null;

        this.spawnX = 380;
        this.spawnY = 520;
        this.minSpelarSkala = 0.6;
        this.maxSpelarSkala = 1.6;
        // Simple barriers in the camp for collision testing and layout
        this.barriarer = [
            // outer bounds
            { x: canvas.width - 20, y: 0, bredd: 20, hojd: canvas.height },
            { x: 0, y: 200, bredd: canvas.width, hojd: 20 },
            { x: 0, y: 0, bredd: 20, hojd: canvas.height },
            { x: 0, y: 580, bredd: canvas.width, hojd: 20 },
            // oval barrier (uses ellipse rendering)
                { typ: 'oval', x: 130, y: 170, bredd: 460, hojd: 150, rotation: -20 },
            { typ: 'oval', x: 520, y: 220, bredd: 360, hojd: 180, rotation: 30 },
            // rotated rectangle barrier (centered at cx,cy, rotated degrees)
            { typ: 'rotated', cx: 120, cy: 400, bredd: 270, hojd: 20, rotation: -20 }
        ];

        // Precompute bounding boxes for non-rectangular barriers so collision uses AABB
        for (const b of this.barriarer) {
            if (b.typ === 'rotated') {
                // preserve original dimensions for drawing
                b._origBredd = b.bredd || 0;
                b._origHojd = b.hojd || 0;
                const rad = (b.rotation || 0) * Math.PI / 180;
                const c = Math.abs(Math.cos(rad));
                const s = Math.abs(Math.sin(rad));
                // Axis-aligned bbox of rotated rect: w*|cos| + h*|sin|
                const bboxW = (b._origBredd) * c + (b._origHojd) * s;
                const bboxH = (b._origBredd) * s + (b._origHojd) * c;
                b.x = Math.round(b.cx - bboxW / 2);
                b.y = Math.round(b.cy - bboxH / 2);
                b.bredd = Math.round(bboxW);
                b.hojd = Math.round(bboxH);
            } else if (b.typ === 'oval') {
                // ensure AABB fields exist for oval
                b.x = b.x || 0;
                b.y = b.y || 0;
                b.bredd = b.bredd || 100;
                b.hojd = b.hojd || 60;
            }
        }

        this.bakgrund = new Image();
        this.bakgrundLaddad = false;
        this.bakgrund.src = 'assets/platser/Banditlägret.png';
        this.bakgrund.onload = () => { this.bakgrundLaddad = true; };
        this.bakgrund.onerror = () => { console.log('Kunde inte ladda Banditlägret-bild från: assets/platser/Banditlägret.png'); };

        this.eKnappNedtryckt = false;
        this.utgang = { x: 0, y: this.canvas.height - 60, bredd: this.canvas.width, hojd: 60, meddelande: 'Tryck på [E] för att lämna Banditlägret' };

        // Exit state: closed until a fiende is defeated
        this.exitOpen = false;
        // Exit rectangle (default position centered at bottom) - used for placement/visibility
        const _erBredd = this.canvas.width;
        const _erHojd = 60;
        const _erX = 0;
        const _erY = this.canvas.height - _erHojd;
        this.exitRect = { x: _erX, y: _erY, bredd: _erBredd, hojd: _erHojd };

        // Editor/placement helpers: hide exit for placement and hide barriers
        this.visaUtgangForPlacering = false;
        this.doljBarriarer = true;

        // Fiender som finns i lägret
        this.fiender = [];
        this.attackCooldown = 0;
        this.attackCooldownMax = 15;
        this.resultMeddelande = '';
        this.resultMeddelandeTid = 0;
        this.resultMeddelandeDuration = 5000;
        this.resultLootVisual = null;
        this.aktivStridInfo = null;
        this.aktivStridInfoTid = 0;
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
    }

    visa() {
        this.visas = true;
        this.rensaMeddelanden();
        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.x = this.spawnX;
            spelare.y = this.spawnY;
            // Ensure walking animations start loading for this player's class
            try { if (typeof animationer !== 'undefined' && animationer && spelare.klass) animationer.laddaAnimationer(spelare.klass.namn); } catch (e) {}
        }
        // Spawna en slumpmässig fiende i mitten av rummet
        try {
            this.spawnSlumpFiende();
        } catch (e) {}
        // ensure exit closed when entering
        this.exitOpen = false;
        this.exitRect = null;
    }

    rensaMeddelanden() {
        this.resultMeddelande = '';
        this.resultMeddelandeTid = 0;
        this.resultLootVisual = null;
        this.aktivStridInfo = null;
        this.aktivStridInfoTid = 0;
    }

    dolj() { this.visas = false; }

    rita() {
        if (!this.visas) return;
        const ctx = this.ctx;
        const canvas = this.canvas;
        this.elementHoverBounds = [];
        if (this.bakgrundLaddad) {
            ctx.drawImage(this.bakgrund, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2b2b2b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Banditlägret', canvas.width/2, canvas.height/2);
        }

        // Draw barriers (red) so they are easy to spot and move, unless hidden for placement
        try {
            if (!this.doljBarriarer) {
                ctx.save();
                for (const b of this.barriarer || []) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
                    ctx.lineWidth = 2;
                    if (b.typ === 'oval') {
                        const cx = b.x + b.bredd / 2;
                        const cy = b.y + b.hojd / 2;
                        ctx.beginPath();
                        const rad = (b.rotation || 0) * Math.PI / 180;
                        ctx.ellipse(cx, cy, b.bredd / 2, b.hojd / 2, rad, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    } else if (b.typ === 'rotated') {
                        const rad = (b.rotation || 0) * Math.PI / 180;
                        const halfW = (b._origBredd || b.bredd || 0) / 2;
                        const halfH = (b._origHojd || b.hojd || 0) / 2;
                        ctx.save();
                        ctx.translate(b.cx, b.cy);
                        ctx.rotate(rad);
                        ctx.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);
                        ctx.strokeRect(-halfW, -halfH, halfW * 2, halfH * 2);
                        ctx.restore();
                    } else {
                        ctx.fillRect(b.x, b.y, b.bredd, b.hojd);
                        ctx.strokeRect(b.x, b.y, b.bredd, b.hojd);
                    }
                }
                ctx.restore();
            }
        } catch (e) {}

        // Top exit hint removed per request (was: this.utgang.meddelande)

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

        // Rita fiender (under spelaren så att spelaren kan stå framför)
        try {
            for (const f of this.fiender || []) {
                try { if (f && typeof f.rita === 'function') f.rita(ctx); } catch (e) {}
            }
        } catch (e) {}

        try { this.ritaFiendeStridsinfo(); } catch (e) {}
        if (this.elementHoverInfo) {
            this.ritaElementTooltip(this.elementHoverInfo.element, this.elementHoverInfo.x, this.elementHoverInfo.y);
        }

        // Draw exit for placement only (exit is invisible during play). Show Enter hint with background when player stands inside.
        try {
            if (this.visaUtgangForPlacering) {
                const er = this.exitRect || { x: 20, y: canvas.height - 60, bredd: canvas.width - 40, hojd: 60 };
                ctx.save();
                ctx.strokeStyle = 'rgba(0,255,128,0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(er.x, er.y, er.bredd, er.hojd);
                ctx.fillStyle = 'rgba(0,255,128,0.9)';
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Utgång', er.x + er.bredd / 2, er.y + er.hojd / 2);
                ctx.restore();
            }

            // If exit is open and player is inside, show an Enter hint with background (even though exit rectangle itself is invisible)
            const sp = this.hamtaSpelare();
            if (this.exitOpen && this.exitRect && sp) {
                const er = this.exitRect;
                const r = sp.storlek || (sp.storlek === 0 ? 0 : 15);
                const inside = (sp.x + r > er.x) && (sp.x - r < (er.x + er.bredd)) && (sp.y + r > er.y) && (sp.y - r < (er.y + er.hojd));
                if (inside) {
                    const msg = 'Tryck Enter för att lämna rummet';
                    ctx.save();
                    ctx.font = '16px Arial';
                    const textWidth = ctx.measureText(msg).width;
                    const padX = 12;
                    const padY = 6;
                    const bgW = textWidth + padX * 2;
                    const bgH = 16 + padY * 2;
                    const centerX = er.x + er.bredd / 2;
                    const bgX = Math.round(centerX - bgW / 2);
                    const bgY = Math.round(er.y - 8 - bgH / 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(bgX, bgY, bgW, bgH);
                    ctx.fillStyle = 'rgba(255,215,0,1)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(msg, centerX, bgY + bgH / 2);
                    ctx.restore();
                }
            }
        } catch (e) {}

        // Result message overlay
        try { this.ritaResultatMeddelande(); } catch (e) {}
    }

    ritaResultatMeddelande() {
        if (!this.resultMeddelande || this.resultMeddelande === '') return;
        const ctx = this.ctx;
        const canvas = this.canvas;
        const elapsed = Date.now() - this.resultMeddelandeTid;
        if (elapsed > this.resultMeddelandeDuration) {
            this.resultMeddelande = '';
            this.resultLootVisual = null;
            return;
        }
        const fadeStart = this.resultMeddelandeDuration - 500;
        let opacity = 1;
        if (elapsed > fadeStart) {
            opacity = 1 - ((elapsed - fadeStart) / 500);
        }
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
        const rader = String(this.resultMeddelande).split('\n');
        const radHojd = 34;
        const lootHojd = this.resultLootVisual ? 92 : 0;
        const totalHojd = (radHojd * rader.length) + lootHojd;
        const startY = (canvas.height / 2) - (totalHojd / 2) + (radHojd / 2);
        rader.forEach((rad, index) => { ctx.fillText(rad, canvas.width / 2, startY + (index * radHojd)); });
        if (this.resultLootVisual) {
            const lootTopY = startY + (rader.length * radHojd) + 8;
            this.ritaLootVisual(ctx, this.resultLootVisual, canvas.width / 2, lootTopY, opacity);
        }
    }

    uppdateraAktivStridInfo(fiende) {
        if (!fiende) return;
        const skada = (fiende.skada && typeof fiende.skada === 'object')
            ? {
                fysisk: fiende.skada.fysisk || 0,
                eld: fiende.skada.eld || 0,
                magi: fiende.skada.magi || 0
            }
            : {
                fysisk: fiende.skadaElement === 'fysisk' ? (fiende.skada || 0) : 0,
                eld: fiende.skadaElement === 'eld' ? (fiende.skada || 0) : 0,
                magi: fiende.skadaElement === 'magi' ? (fiende.skada || 0) : 0
            };
        this.aktivStridInfo = {
            namn: fiende.namn || 'Fiende',
            liv: fiende.liv || 0,
            maxLiv: fiende.maxLiv || fiende.liv || 0,
            skada,
            motstand: fiende.motstånd || { fysisk: 0, eld: 0, magi: 0 },
            erfarenhet: fiende.erfarenhet || 0
        };
        this.aktivStridInfoTid = 180;
    }

    ritaFiendeStridsinfo() {
        const fallbackFiende = Array.isArray(this.fiender) ? this.fiender.find((fiende) => fiende && fiende.levande) : null;
            const info = (fallbackFiende ? {
            namn: fallbackFiende.namn || 'Fiende',
            liv: fallbackFiende.liv || 0,
            maxLiv: fallbackFiende.maxLiv || fallbackFiende.liv || 0,
            skada: (fallbackFiende.skada && typeof fallbackFiende.skada === 'object')
                ? {
                    fysisk: fallbackFiende.skada.fysisk || 0,
                    eld: fallbackFiende.skada.eld || 0,
                    magi: fallbackFiende.skada.magi || 0
                }
                : {
                    fysisk: fallbackFiende.skadaElement === 'fysisk' ? (fallbackFiende.skada || 0) : 0,
                    eld: fallbackFiende.skadaElement === 'eld' ? (fallbackFiende.skada || 0) : 0,
                    magi: fallbackFiende.skadaElement === 'magi' ? (fallbackFiende.skada || 0) : 0
                },
            motstand: fallbackFiende.motstånd || { fysisk: 0, eld: 0, magi: 0 },
            erfarenhet: fallbackFiende.erfarenhet || 0
        } : null) || this.aktivStridInfo;
        if (!info || (!fallbackFiende && this.aktivStridInfoTid <= 0)) return;

        const ctx = this.ctx;
        const boxW = 210;
        const boxH = 98;
        const x = this.canvas.width - boxW - 12;
        const y = 12;
        const motstand = info.motstand || { fysisk: 0, eld: 0, magi: 0 };
        const skada = info.skada || { fysisk: 0, eld: 0, magi: 0 };

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
        ctx.fillText(`Fiende: ${info.namn || 'Fiende'}`, x + 10, y + 8);

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
                if (index < 2) drawX += 4;
            });
        };

        drawRow('Skada', skada, y + 30);
        drawRow('Försvar', motstand, y + 52);
        ctx.restore();
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

    hamtaLootVisual(itemId, antal = 1) {
        const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
        const foremal = spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal
            ? spelare.utrustning.tillgangligaForemal[itemId]
            : null;
        if (!foremal || !foremal.ikon) return null;
        return {
            itemId,
            antal: Math.max(1, antal || 1),
            ikon: foremal.ikon
        };
    }

    hamtaPengarVisual(lootData) {
        if (!lootData) return null;
        const valutor = [
            { key: 'guld', antal: lootData.guld || 0, ikon: 'assets/Ikoner/Guld.png' },
            { key: 'silver', antal: lootData.silver || 0, ikon: 'assets/Ikoner/Silver.png' },
            { key: 'koppar', antal: lootData.koppar || 0, ikon: 'assets/Ikoner/Koppar.png' }
        ].filter((valuta) => valuta.antal > 0);
        return valutor.length > 0 ? { valutor } : null;
    }

    ritaLootVisual(ctx, lootVisual, centerX, topY, opacity) {
        if (!lootVisual) return 0;

        if (Array.isArray(lootVisual.valutor) && lootVisual.valutor.length > 0) {
            const boxStorlek = 62;
            const mellanrum = 10;
            const totalBredd = (lootVisual.valutor.length * boxStorlek) + ((lootVisual.valutor.length - 1) * mellanrum);
            const startX = Math.round(centerX - totalBredd / 2);

            ctx.save();
            ctx.globalAlpha = opacity;
            for (let i = 0; i < lootVisual.valutor.length; i++) {
                const valuta = lootVisual.valutor[i];
                const boxX = startX + (i * (boxStorlek + mellanrum));
                const boxY = Math.round(topY);
                const ikon = this.hamtaIkonBild(valuta.ikon);

                ctx.fillStyle = 'rgba(15, 22, 18, 0.92)';
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
                ctx.lineWidth = 2;
                ctx.fillRect(boxX, boxY, boxStorlek, boxStorlek);
                ctx.strokeRect(boxX, boxY, boxStorlek, boxStorlek);
                if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                    ctx.drawImage(ikon, boxX + 11, boxY + 6, 40, 40);
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(valuta.antal), boxX + boxStorlek / 2, boxY + boxStorlek - 11);
            }
            ctx.restore();
            return boxStorlek;
        }

        if (!lootVisual.ikon) return 0;

        const bgStorlek = 78;
        const ikonStorlek = 54;
        const boxX = Math.round(centerX - bgStorlek / 2);
        const boxY = Math.round(topY);
        const ikonX = Math.round(centerX - ikonStorlek / 2);
        const ikonY = Math.round(boxY + (bgStorlek - ikonStorlek) / 2);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(15, 22, 18, 0.92)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, bgStorlek, bgStorlek);
        ctx.strokeRect(boxX, boxY, bgStorlek, bgStorlek);

        const ikon = this.hamtaIkonBild(lootVisual.ikon);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            ctx.drawImage(ikon, ikonX, ikonY, ikonStorlek, ikonStorlek);
        }

        if (lootVisual.antal > 1) {
            const badgeText = `x${lootVisual.antal}`;
            ctx.font = 'bold 16px Arial';
            const badgeW = Math.max(28, Math.ceil(ctx.measureText(badgeText).width + 14));
            const badgeH = 24;
            const badgeX = Math.round(boxX + bgStorlek - badgeW - 4);
            const badgeY = Math.round(boxY + bgStorlek - badgeH - 4);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
        }
        ctx.restore();
        return bgStorlek;
    }

    geLootTillSpelare(fiende, spelare, lootData) {
        if (!fiende || !spelare || !lootData || fiende._lootGiven) return false;

        let gavLoot = false;
        if (lootData.typ === 'pengar' && spelare) {
            if (typeof spelare.laggTillPengar === 'function') {
                spelare.laggTillPengar(lootData, { raknaSomIntakt: true });
            } else if (spelare.pengar) {
                spelare.pengar.koppar += lootData.koppar || 0;
                spelare.pengar.silver += lootData.silver || 0;
                spelare.pengar.guld += lootData.guld || 0;
            }
            gavLoot = ((lootData.koppar || 0) + (lootData.silver || 0) + (lootData.guld || 0)) > 0;
            if (gavLoot && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                window.spelaStandardLjud('pengar');
            }
        } else if (lootData.typ === 'item' && spelare.utrustning) {
            const exists = spelare.utrustning.tillgangligaForemal && spelare.utrustning.tillgangligaForemal[lootData.itemId];
            if (exists) {
                let added = 0;
                for (let n = 0; n < (lootData.antal || 1); n++) {
                    try {
                        if (spelare.utrustning.laggTillForemal(lootData.itemId)) added++;
                    } catch (e) {}
                }
                gavLoot = added > 0;
            }
        }

        if (gavLoot) {
            try { fiende._lootGiven = true; } catch (e) {}
        }

        return gavLoot;
    }

    tangentNed(tangent) {
        if (!this.visas) return;
        // Support Enter (preferred) and E as fallbacks to leave when standing inside exit
        if ((tangent === 'e' || tangent === 'E' || tangent === 'Enter') && !this.eKnappNedtryckt) {
            const sp = this.hamtaSpelare();
            if (this.exitOpen && this.exitRect && sp) {
                const er = this.exitRect;
                const r = sp.storlek || (sp.storlek === 0 ? 0 : 15);
                const horizOverlap = (sp.x + r > er.x) && (sp.x - r < (er.x + er.bredd));
                const vertOverlap = (sp.y + r > er.y) && (sp.y - r < (er.y + er.hojd));
                // Allow a forgiving vertical margin so standing slightly above center still counts
                const withinAboveMargin = (sp.y < er.y) && (er.y - sp.y) <= 48;
                const inside = horizOverlap && (vertOverlap || withinAboveMargin);
                if (inside) {
                    this.eKnappNedtryckt = true;
                    this.gaTillbaka();
                    return;
                } else {
                    // Inform player they must go to the exit
                    this.resultLootVisual = null;
                    this.resultMeddelande = 'Gå till utgången för att lämna rummet';
                    this.resultMeddelandeTid = Date.now();
                    return;
                }
            }
            // If exit isn't open, ignore the key
            return;
        }
        const spelare = this.hamtaSpelare();
        if (spelare) spelare.tangentNed(tangent);
    }

    tangentUpp(tangent) {
        if (!this.visas) return;
        // Reset the key-pressed lock for E and Enter variants
        if (tangent === 'e' || tangent === 'E' || tangent === 'Enter' || tangent === 'Return' || tangent === '\r') this.eKnappNedtryckt = false;
        const spelare = this.hamtaSpelare();
        if (spelare) spelare.tangentUpp(tangent);
    }

    uppdateraRorelse() {
        if (!this.visas) return;
        const spelare = this.hamtaSpelare();
        if (!spelare) return;
        if (this.aktivStridInfoTid > 0) this.aktivStridInfoTid--;
        // Delegate movement and animation handling to the Spelare instance so animations update
        let handledByPlayer = false;
        try {
            if (typeof spelare.uppdateraRorelse === 'function') {
                // Let the Spelare instance handle movement and collision
                spelare.uppdateraRorelse(this.barriarer || []);
                handledByPlayer = true;
            }
        } catch (e) {}

        // Fallback: basic movement logic only if player's method is unavailable
        if (!handledByPlayer) {
            const dx = (spelare.tangenter.left ? -spelare.hastighet : 0) + (spelare.tangenter.right ? spelare.hastighet : 0);
            const dy = (spelare.tangenter.up ? -spelare.hastighet : 0) + (spelare.tangenter.down ? spelare.hastighet : 0);
            if (dx !== 0 || dy !== 0) {
                spelare.riktning = dx < 0 ? 'vänster' : 'höger';
                const nyttX = spelare.x + dx;
                const nyttY = spelare.y + dy;
                spelare.x = Math.max(0, Math.min(this.canvas.width, nyttX));
                spelare.y = Math.max(0, Math.min(this.canvas.height, nyttY));
                try { if (typeof animationer !== 'undefined') animationer.uppdateraAnimering(spelare, true); } catch (e) {}
            } else {
                try { if (typeof animationer !== 'undefined') animationer.uppdateraAnimering(spelare, false); } catch (e) {}
            }
        }

        // Uppdatera fiender
        try {
            for (let i = this.fiender.length - 1; i >= 0; i--) {
                const f = this.fiender[i];
                try {
                    if (f && typeof f.uppdatera === 'function') f.uppdatera(spelare, this.stridSystem);
                    if (f && f.levande === false) {
                        // Give loot to player if available
                        try {
                            if (this.stridSystem && this.stridSystem.hamtaSlumpmassigLoot) {
                                if (f.dodadAvSpelare && !f._lootGiven) {
                                    const lootData = f._lootData || (this.stridSystem.parsaLoot ? this.stridSystem.parsaLoot(this.stridSystem.hamtaSlumpmassigLoot(f.typ)) : null);
                                    this.geLootTillSpelare(f, spelare, lootData);
                                }
                            }
                        } catch (e) {}
                        this.fiender.splice(i, 1);
                    }
                } catch (e) {}
            }
        } catch (e) {}

        // Player attack loop: one-shot simultaneous resolution like Chansrutan
        try {
            if (!this.stridSystem) return;
            const attackRange = 100;
            for (let i = this.fiender.length - 1; i >= 0; i--) {
                const f = this.fiender[i];
                if (!f || !f.levande) continue;
                const dx = spelare.x - f.x;
                const dy = spelare.y - f.y;
                const avstand = Math.sqrt(dx * dx + dy * dy);
                if (avstand > attackRange) continue;

                this.uppdateraAktivStridInfo(f);

                // Rate-limit attacks
                if (this.attackCooldown > 0) {
                    this.attackCooldown--;
                    continue;
                }

                // === SPELAREN ATTACKERAR FIENDEN ===
                let spelarSkada = 0;
                let spelarElement = spelare.skadaElement || 'fysisk';
                const stridStats = (spelare.strid && typeof spelare.strid === 'object')
                    ? spelare.strid
                    : (spelare.utrustning && spelare.utrustning.vapen && spelare.utrustning.vapen.strid ? spelare.utrustning.vapen.strid : null);
                let vapenPassivEffekt = { multiplikator: 1, utlöst: false, passiv: null };
                if (stridStats && typeof stridStats === 'object') {
                    const motstand = (f.motstånd && typeof f.motstånd === 'object') ? f.motstånd : {};
                    let hogstBidrag = -1;
                    for (const element of ['fysisk', 'eld', 'magi']) {
                        const grundSkada = typeof stridStats[element] === 'number' ? stridStats[element] : 0;
                        if (grundSkada <= 0) continue;
                        const passivEffekt = (spelare.utrustning && typeof spelare.utrustning.rullaVapenPassivSkada === 'function')
                            ? spelare.utrustning.rullaVapenPassivSkada(element)
                            : { multiplikator: 1, utlöst: false, passiv: null };
                        const elementMotstand = typeof motstand[element] === 'number' ? motstand[element] : 0;
                        const bidrag = Math.max(0, (grundSkada * (passivEffekt.multiplikator || 1)) - elementMotstand);
                        spelarSkada += bidrag;
                        if (bidrag > hogstBidrag) {
                            hogstBidrag = bidrag;
                            spelarElement = element;
                        }
                        if (passivEffekt.utlöst && passivEffekt.passiv && !vapenPassivEffekt.utlöst) {
                            vapenPassivEffekt = passivEffekt;
                        }
                    }
                } else if (typeof stridStats === 'number') {
                    spelarSkada = stridStats;
                }
                const spelarDodsChans = Math.max(0, Math.min(100, spelarSkada));
                const spelarSlump = Math.random() * 100;
                const spelarenTraffar = spelarSlump <= spelarDodsChans;

                // === FIENDEN ATTACKERAR SPELAREN ===
                const fiendeSkada = (f.skada && f.skada.fysisk) || 0;
                const fiendeElement = f.skadaElement || 'fysisk';
                const spelarMotstand = (spelare.motstånd && spelare.motstånd[fiendeElement]) || 0;
                const fiendeDodsChans = Math.max(0, Math.min(100, fiendeSkada - spelarMotstand));
                const fiendeSlump = Math.random() * 100;
                const fiendenTraffar = fiendeSlump <= fiendeDodsChans;

                // === UTVÄRDERA RESULTAT ===
                let resultatMeddelande = '';
                // Only consider "killed by player" as a true kill for loot/achievements
                let enemyKilled = false;
                if (spelarenTraffar && fiendenTraffar) {
                    // both hit -> enemy dies, player takes damage
                    f.liv = 0;
                    f.levande = false;
                    enemyKilled = true;
                    if (typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('fiendeDor');
                    }
                    const skadeResultat = (spelare && typeof spelare.taSkada === 'function')
                        ? spelare.taSkada(1, { element: fiendeElement, tystLjud: true })
                        : (spelare && typeof spelare.forloraLiv === 'function' ? (spelare.forloraLiv(1), { togSkada: true, undvekSkada: false, passiv: null }) : (spelare.liv = Math.max(0, spelare.liv - 1), { togSkada: true, undvekSkada: false, passiv: null }));
                    if ((!skadeResultat || !skadeResultat.undvekSkada) && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('badaSkadas');
                    }
                    const efterTraffResultat = spelare && spelare.liv > 0 && spelare.utrustning && typeof spelare.utrustning.tillampaVapenPassiverEfterTraff === 'function'
                        ? spelare.utrustning.tillampaVapenPassiverEfterTraff(spelarElement)
                        : null;
                    resultatMeddelande = (vapenPassivEffekt.utlöst && vapenPassivEffekt.passiv ? `${vapenPassivEffekt.passiv.namn}! Dubbel skada!\n` : '')
                        + (efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0 ? `${efterTraffResultat.meddelanden.join('\n')}\n` : '')
                        + ((skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande)
                            ? `${skadeResultat.meddelande}\nBåda träffar! Fienden besegrad!`
                            : 'Båda träffar! Fienden besegrad\nDu förlorade 1 liv!');
                } else if (spelarenTraffar) {
                    // player hit -> enemy dies
                    f.liv = 0;
                    f.levande = false;
                    enemyKilled = true;
                    if (typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('fiendeDor');
                    }
                    const efterTraffResultat = spelare && spelare.utrustning && typeof spelare.utrustning.tillampaVapenPassiverEfterTraff === 'function'
                        ? spelare.utrustning.tillampaVapenPassiverEfterTraff(spelarElement)
                        : null;
                    resultatMeddelande = (vapenPassivEffekt.utlöst && vapenPassivEffekt.passiv ? `${vapenPassivEffekt.passiv.namn}! Dubbel skada!\n` : '')
                        + (efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0 ? `${efterTraffResultat.meddelanden.join('\n')}\n` : '')
                        + 'Fienden besegrad!';
                } else if (fiendenTraffar) {
                    // enemy hits player -> enemy removed but not considered killed by player
                    const skadeResultat = (spelare && typeof spelare.taSkada === 'function')
                        ? spelare.taSkada(1, { element: fiendeElement })
                        : (spelare && typeof spelare.forloraLiv === 'function' ? (spelare.forloraLiv(1), { togSkada: true, undvekSkada: false, passiv: null }) : (spelare.liv = Math.max(0, spelare.liv - 1), { togSkada: true, undvekSkada: false, passiv: null }));
                    f.levande = false;
                    enemyKilled = false;
                    resultatMeddelande = (skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande)
                        ? `${skadeResultat.meddelande}\nFienden drog sig undan.`
                        : 'Du förlorade striden!\nDu förlorade 1 liv!';
                } else {
                    // both miss -> enemy flees (removed, not killed)
                    f.levande = false;
                    enemyKilled = false;
                    if (typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('fiendeFlyr');
                    }
                    resultatMeddelande = 'Båda missade! Fienden flydde.';
                }

                // Mark the fiende so other logic (removal loop) knows if player killed it
                try { f.dodadAvSpelare = !!enemyKilled; } catch (e) {}

                // Open the exit after this combat resolution (regardless of kill)
                try {
                    this.exitOpen = true;
                    // Make exit span full canvas width
                    const erBredd = this.canvas.width;
                    const erHojd = 60;
                    const erX = 0;
                    const erY = this.canvas.height - erHojd;
                    this.exitRect = { x: erX, y: erY, bredd: erBredd, hojd: erHojd };
                } catch (e) {}

                // Handle loot and stats for killed/removed enemy
                let lootData = null;
                try {
                    if (this.stridSystem && this.stridSystem.hamtaSlumpmassigLoot) {
                        const lootString = this.stridSystem.hamtaSlumpmassigLoot(f.typ);
                        lootData = this.stridSystem.parsaLoot ? this.stridSystem.parsaLoot(lootString) : null;
                        // Store the loot data on the enemy so the removal/cleanup loop can award it exactly once
                        if (lootData && enemyKilled) {
                            try { f._lootData = lootData; } catch (e) {}
                            this.geLootTillSpelare(f, spelare, lootData);
                        }
                    }
                } catch (e) {}

                // If enemy died and there is loot, append loot info to result message
                try {
                    // Only append loot text if the enemy was killed by the player and loot exists
                    if (enemyKilled && lootData) {
                        if (lootData.typ === 'pengar') {
                            this.resultLootVisual = this.hamtaPengarVisual(lootData);
                            const delar = [];
                            if (lootData.guld > 0) delar.push(`${lootData.guld} guld`);
                            if (lootData.silver > 0) delar.push(`${lootData.silver} silver`);
                            if (lootData.koppar > 0) delar.push(`${lootData.koppar} koppar`);
                            if (delar.length > 0) {
                                resultatMeddelande += this.resultLootVisual ? '\nFick:' : `\nFick: ${delar.join(' och ')}`;
                            }
                        } else if (lootData.typ === 'item') {
                            this.resultLootVisual = this.hamtaLootVisual(lootData.itemId, lootData.antal);
                            resultatMeddelande += '\nFick:';
                        }
                    } else {
                        this.resultLootVisual = null;
                    }
                } catch (e) {}

                // Update player stats
                try {
                    if (spelare && spelare.prestationer) {
                        if (typeof spelare.registreraStridsresultat === 'function') {
                            spelare.registreraStridsresultat({ vann: !!enemyKilled, forlorade: !enemyKilled });
                        }
                        if (f && f.erfarenhet) {
                            spelare.prestationer.fiendesBesegrade = (spelare.prestationer.fiendesBesegrade || 0) + (enemyKilled ? 1 : 0);
                        }
                        const keyRaw = f && (f.typ || f.namn) ? (f.typ || f.namn) : '';
                        const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                        const key = normalize(keyRaw);
                        if (enemyKilled) {
                            spelare.prestationer.killsByType = spelare.prestationer.killsByType || {};
                            spelare.prestationer.killsByType[key] = (spelare.prestationer.killsByType[key] || 0) + 1;
                        }
                    }
                } catch (e) {}

                // Show result message (if any)
                try {
                    if (resultatMeddelande && resultatMeddelande !== '') {
                        this.resultMeddelande = resultatMeddelande;
                        this.resultMeddelandeTid = Date.now();
                    }
                } catch (e) {}

                // Remove enemy from list
                try { this.fiender.splice(i, 1); } catch (e) {}

                // Reset attack cooldown
                this.attackCooldown = this.attackCooldownMax;
                // Only handle one enemy per frame
                break;
            }
        } catch (e) {}
    }

    spawnSlumpFiende() {
        // Choose a random type from stridSystem if available
        let typ = 'bandit';
        try {
            if (this.stridSystem && this.stridSystem.fiendeTyper) {
                const keys = Object.keys(this.stridSystem.fiendeTyper || {});
                if (keys.length > 0) typ = keys[Math.floor(Math.random() * keys.length)];
            }
        } catch (e) {}
        // Spawn slightly down-right from the exact center so it doesn't overlap player spawn
        const x = Math.round(this.canvas.width / 2 + 60);
        const y = Math.round(this.canvas.height / 2 + 40);
        try {
            const ny = new Fiende(typ, x, y, this.stridSystem);
            // Hide the usual health bar for in-room enemies and ensure proper sprite proportions
            try { ny.visaLivBar = false; } catch (e) {}
            this.fiender.push(ny);
            return ny;
        } catch (e) {
            return null;
        }
    }
}

window.Bandit = Bandit;
