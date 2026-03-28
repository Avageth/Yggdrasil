// Shared shop UI helpers extracted from Druiden och Sierskan
const ShopUI = (function() {
    const pengarBildCache = {};
    const produktBildCache = {};
    const ikonBildCache = {};
    let _tillgangligaVaror = null;

    function hamtaVaraIkonPath(id) {
        if (!id) return null;
        // Lazy-load mapping from Utrustning if available
        if (_tillgangligaVaror === null) {
            _tillgangligaVaror = {};
            try {
                if (typeof window !== 'undefined' && window.Utrustning) {
                    const tmp = new window.Utrustning(null);
                    if (tmp && tmp.tillgangligaForemal) _tillgangligaVaror = tmp.tillgangligaForemal;
                }
            } catch (e) {
                _tillgangligaVaror = {};
            }
        }

        if (_tillgangligaVaror && _tillgangligaVaror[id] && _tillgangligaVaror[id].ikon) return _tillgangligaVaror[id].ikon;

        // Fallback candidates
        const candidates = [
            `assets/Varor/${id}.png`,
            `assets/Varor/${id.charAt(0).toUpperCase() + id.slice(1)}.png`
        ];
        return candidates[0];
    }

    // Normalize item ids for comparison: replace Swedish diacritics to plain letters
    function normalizeId(id) {
        if (!id || typeof id !== 'string') return id;
        return id.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o');
    }

    const ELEMENT_IKONER = {
        fysisk: 'assets/Ikoner/Element Fysisk.png',
        eld: 'assets/Ikoner/Element Eld.png',
        magi: 'assets/Ikoner/Element Magi.png'
    };
    const ELEMENT_INFO = {
        fysisk: { namn: 'Fysisk', beskrivning: 'Vanlig skada och motstånd från vapen, slag och rå styrka.' },
        eld: { namn: 'Eld', beskrivning: 'Brännande skada och skydd mot hetta, lågor och eldattacker.' },
        magi: { namn: 'Magi', beskrivning: 'Mystisk skada och motstånd mot besvärjelser och magiska krafter.' }
    };
    const VALUTA_INFO = {
        guld: { namn: 'Guld', beskrivning: 'Den mest vardefulla valutan. Anvands for dyra kop och storre beloningar.' },
        silver: { namn: 'Silver', beskrivning: 'En vanlig valuta for handel, uppdrag och utrustning.' },
        koppar: { namn: 'Koppar', beskrivning: 'Den minsta valutan. Anvands ofta for billiga varor och mindre kostnader.' }
    };

    // debug: log when ShopUI loads
    if (typeof console !== 'undefined' && console.log) console.log('ShopUI loaded');

    function hamtaPengarBild(src) {
        if (!pengarBildCache[src]) {
            const img = new Image();
            img.src = src;
            pengarBildCache[src] = img;
        }
        return pengarBildCache[src];
    }

    function normaliseraValutaNyckel(nyckel) {
        if (nyckel === 'g' || nyckel === 'guld') return 'guld';
        if (nyckel === 's' || nyckel === 'silver') return 'silver';
        if (nyckel === 'c' || nyckel === 'koppar') return 'koppar';
        return null;
    }

    function ritaPrisIkoner(screen, pris, xPos, yPos) {
        if (!pris) return;
        const ctx = screen.ctx;
        const ikonStorlek = 16;
        const gap = 4;
        let x = xPos;

        ctx.save();
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Draw order is computed by subtracting widths from xPos, so the
        // visual left-to-right order will be the reverse of this array.
        // To display left->right: Guld, Silver, Koppar, we list them as
        // Koppar, Silver, Guld here.
        const ordning = [
            { nyckel: 'koppar', bild: 'assets/ikoner/Koppar.png' },
            { nyckel: 'silver', bild: 'assets/ikoner/Silver.png' },
            { nyckel: 'guld', bild: 'assets/ikoner/Guld.png' }
        ];

        ordning.forEach((rad) => {
            const belopp = pris[rad.nyckel];
            if (!belopp || belopp <= 0) return;

            const text = `${belopp}`;
            const textWidth = ctx.measureText(text).width;
            const blockWidth = ikonStorlek + gap + textWidth;
            x -= blockWidth;

            const bild = hamtaPengarBild(rad.bild);
            if (bild && bild.complete && bild.naturalWidth > 0) {
                ctx.drawImage(bild, x, yPos, ikonStorlek, ikonStorlek);
            } else {
                ctx.fillStyle = '#ffd166';
                ctx.fillRect(x, yPos, ikonStorlek, ikonStorlek);
            }

            if (
                typeof screen._musX === 'number' &&
                typeof screen._musY === 'number' &&
                screen._musX >= x &&
                screen._musX <= x + ikonStorlek &&
                screen._musY >= yPos &&
                screen._musY <= yPos + ikonStorlek
            ) {
                screen._shopPengarHoverInfo = {
                    valuta: normaliseraValutaNyckel(rad.nyckel),
                    x: screen._musX,
                    y: screen._musY
                };
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(text, x + ikonStorlek + gap, yPos);

            x -= 8;
        });

        ctx.restore();
    }

    function ritaPengarTooltip(screen, valuta, musX, musY) {
        const info = VALUTA_INFO[valuta];
        if (!info) return;

        const ctx = screen.ctx;
        const canvas = screen.canvas;
        const ikon = hamtaPengarBild(`assets/ikoner/${valuta.charAt(0).toUpperCase() + valuta.slice(1)}.png`);
        const iconSize = 52;
        const textMax = 176;

        ctx.save();
        ctx.font = '12px Arial';
        const rader = wrapSimpleText(ctx, info.beskrivning, textMax);
        const boxW = 210;
        const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
        let boxX = musX + 16;
        let boxY = musY - boxH / 2;
        if (boxX + boxW > canvas.width) boxX = musX - boxW - 16;
        if (boxY < 0) boxY = 0;
        if (boxY + boxH > canvas.height) boxY = canvas.height - boxH;

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

    function wrapTextToWidth(ctx, text, maxWidth) {
        const source = String(text || '').replace(/\r/g, '');
        const stycken = source.split('\n');
        const rader = [];

        stycken.forEach((stycke) => {
            const ord = stycke.split(/\s+/).filter(Boolean);
            if (ord.length === 0) {
                rader.push('');
                return;
            }

            let rad = '';
            ord.forEach((ordet) => {
                const kandidat = rad ? `${rad} ${ordet}` : ordet;
                if (!rad || ctx.measureText(kandidat).width <= maxWidth) {
                    rad = kandidat;
                    return;
                }

                rader.push(rad);
                rad = ordet;

                while (ctx.measureText(rad).width > maxWidth && rad.length > 1) {
                    let brytpunkt = rad.length - 1;
                    while (brytpunkt > 1 && ctx.measureText(`${rad.slice(0, brytpunkt)}-`).width > maxWidth) {
                        brytpunkt -= 1;
                    }
                    rader.push(`${rad.slice(0, brytpunkt)}-`);
                    rad = rad.slice(brytpunkt);
                }
            });

            if (rad) rader.push(rad);
        });

        return rader;
    }

    function trimLinesToFit(ctx, lines, maxWidth, maxLines) {
        if (lines.length <= maxLines) return lines;
        const trimmed = lines.slice(0, maxLines);
        let sistaRad = trimmed[maxLines - 1] || '';

        while (sistaRad.length > 0 && ctx.measureText(`${sistaRad}...`).width > maxWidth) {
            sistaRad = sistaRad.slice(0, -1).trimEnd();
        }

        trimmed[maxLines - 1] = sistaRad ? `${sistaRad}...` : '...';
        return trimmed;
    }

    function wrapSimpleText(ctx, text, maxWidth) {
        const ord = String(text || '').split(/\s+/).filter(Boolean);
        const rader = [];
        let aktuellRad = '';
        for (const del of ord) {
            const testRad = aktuellRad ? `${aktuellRad} ${del}` : del;
            if (aktuellRad && ctx.measureText(testRad).width > maxWidth) {
                rader.push(aktuellRad);
                aktuellRad = del;
            } else {
                aktuellRad = testRad;
            }
        }
        if (aktuellRad) rader.push(aktuellRad);
        return rader;
    }

    function ritaElementTooltip(screen, element, musX, musY) {
        const info = ELEMENT_INFO[element];
        if (!info) return;
        const ctx = screen.ctx;
        const canvas = screen.canvas;
        const ikon = hamtaIkonBild(ELEMENT_IKONER[element]);
        const iconSize = 52;
        const textMax = 176;

        ctx.save();
        ctx.font = '12px Arial';
        const rader = wrapSimpleText(ctx, info.beskrivning, textMax);
        const boxW = 210;
        const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
        let boxX = musX + 16;
        let boxY = musY - boxH / 2;
        if (boxX + boxW > canvas.width) boxX = musX - boxW - 16;
        if (boxY < 0) boxY = 0;
        if (boxY + boxH > canvas.height) boxY = canvas.height - boxH;

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

    function ritaPreview(screen) {
        const lista = screen.hamtaAktivLista ? screen.hamtaAktivLista() : [];
        const hover = screen.shopHoverIndex >= 0 ? screen.shopHoverIndex : screen.shopValdIndex;
        if (hover < 0 || hover >= lista.length) return;

        const vara = lista[hover];
        if (!vara || !vara.beskrivning) return;

        const ctx = screen.ctx;
        const panelBredd = 280;
        const panelHojd = 120;

        // If the caller (e.g. Byggarbetsplatsen) exposed the big shop box
        // geometry, draw the preview inside that box to the right of the
        // product list. Otherwise fall back to a local panel position.
        let panelX, panelY, panelW, panelH;
        if (screen._shopBox) {
            const box = screen._shopBox;
            // list area in Byggarbetsplatsen: starts at boxX + 24 and is 320px wide
            const listLeft = box.x + 24;
            const listWidth = 320;
            panelX = listLeft + listWidth + 12;
            panelY = box.y + 60;
            panelW = box.x + box.w - panelX - 16;
            panelH = 280;
        } else {
            const listPanelX = 20;
            const listPanelBredd = 320;
            panelX = listPanelX + listPanelBredd + 16;
            panelY = 20;
            panelW = panelBredd;
            panelH = panelBredd;
        }

        ctx.save();
        screen._previewElementBounds = [];
        if (!screen._shopBox) {
            ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(panelX, panelY, panelW, panelH, 10);
            ctx.fill();
            ctx.stroke();
        }

        // Determine image and split areas: top area for image + basic info,
        // bottom area for stats (as in the sketch). All drawn inside the
        // big shop box so it visually belongs to the main panel.
        let bildSrc = null;
        if (vara.template && vara.template.bild) bildSrc = vara.template.bild;
        else if (vara.id) bildSrc = `assets/Byggarbetsplatsen/${vara.id}.png`;
        else bildSrc = null;

        const padding = 12;
        const topAreaH = Math.floor((panelH || panelHojd) * 0.48);
        const bottomAreaY = (panelY || 0) + topAreaH + padding;
        const bottomAreaH = (panelH || panelHojd) - topAreaH - padding * 2;

        // Image box on the upper-right of the right pane
        const imageSize = Math.min(120, Math.floor(topAreaH - padding * 2));
        const imgX = (panelX || 0) + (panelW ? panelW - imageSize - padding : panelBredd - imageSize - padding);
        const imgY = (panelY || 0) + padding;

        if (bildSrc) {
            const img = hamtaProduktBild(bildSrc);
            if (img && img.complete && img.naturalWidth > 0) {
                const ratio = Math.min(imageSize / img.naturalWidth, imageSize / img.naturalHeight);
                const w = img.naturalWidth * ratio;
                const h = img.naturalHeight * ratio;
                const dx = imgX + (imageSize - w) / 2;
                const dy = imgY + (imageSize - h) / 2;
                ctx.drawImage(img, dx, dy, w, h);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.fillRect(imgX, imgY, imageSize, imageSize);
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.strokeRect(imgX, imgY, imageSize, imageSize);
            }
        }

        // Upper-left text area (title + description) within the top area
        const textX = (panelX || 0) + padding;
        const textY = (panelY || 0) + padding;

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(vara.namn, textX, textY);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '13px Arial';
        const desc = String(vara.beskrivning || '');
        const lineHeight = 18;
        const descMaxWidth = Math.max(60, imgX - textX - padding);
        const descTopY = textY + 26;
        const descMaxLines = Math.max(1, Math.floor((topAreaH - (descTopY - panelY) - padding) / lineHeight));
        const descLines = trimLinesToFit(ctx, wrapTextToWidth(ctx, desc, descMaxWidth), descMaxWidth, descMaxLines);
        for (let i = 0; i < descLines.length; i++) {
            ctx.fillText(descLines[i], textX, textY + 26 + i * 18);
        }

        // Draw separator line between top and bottom areas
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        const sepY = (panelY || 0) + topAreaH + 6;
        ctx.beginPath();
        ctx.moveTo((panelX || 0) + 6, sepY);
        ctx.lineTo((panelX || 0) + (panelW || panelBredd) - 6, sepY);
        ctx.stroke();

        // Bottom area: render stats if available
        const statsX = (panelX || 0) + padding;
        let statsY = bottomAreaY + 6;
        ctx.fillStyle = 'rgba(200,200,200,0.9)';
        ctx.font = '13px Arial';

        const tpl = vara.template || {};
        let hoveredElement = null;
        if (tpl.egenskaper && typeof tpl.egenskaper === 'object') {
            // Egenskaper may be nested (e.g. strid: { fysisk: 10, eld: 0 })
            for (const huvud in tpl.egenskaper) {
                const sub = tpl.egenskaper[huvud];
                if (sub && typeof sub === 'object') {
                    ctx.fillStyle = '#ffd166';
                    ctx.fillText(huvud.charAt(0).toUpperCase() + huvud.slice(1) + ':', statsX, statsY);
                    // Draw element icons + values on the same line
                    let iconX = statsX + 100;
                    const ikonStorlek = 14;
                    for (const k in sub) {
                        const val = sub[k] || 0;
                        const ikonPath = ELEMENT_IKONER[k];
                        const ikonImg = ikonPath ? hamtaIkonBild(ikonPath) : null;
                        if (ikonImg && ikonImg.complete && ikonImg.naturalWidth > 0) {
                            ctx.drawImage(ikonImg, iconX, statsY - 2, ikonStorlek, ikonStorlek);
                        } else {
                            ctx.fillStyle = 'rgba(255,255,255,0.06)';
                            ctx.fillRect(iconX, statsY - 2, ikonStorlek, ikonStorlek);
                        }
                        screen._previewElementBounds.push({ x: iconX, y: statsY - 2, w: ikonStorlek, h: ikonStorlek, element: k });
                        if (typeof screen._musX === 'number' && typeof screen._musY === 'number' && screen._musX >= iconX && screen._musX <= iconX + ikonStorlek && screen._musY >= statsY - 2 && screen._musY <= statsY - 2 + ikonStorlek) {
                            hoveredElement = { element: k, x: screen._musX, y: screen._musY };
                        }
                        ctx.fillStyle = 'rgba(255,255,255,0.9)';
                        ctx.fillText(String(val), iconX + ikonStorlek + 6, statsY);
                        const advance = ikonStorlek + 6 + ctx.measureText(String(val)).width + 12;
                        iconX += advance;
                    }
                    statsY += 18;
                } else {
                    ctx.fillText(`${huvud}: ${String(sub)}`, statsX, statsY);
                    statsY += 18;
                }
            }
        } else {
            ctx.fillStyle = 'rgba(180,180,180,0.9)';
            ctx.fillText('Inga stats tillgängliga', statsX, statsY);
        }

        // Price line in bottom-left of the stats area
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '12px Arial';
        let prisText = 'Pris: ';
        if (vara.pris) {
            if (vara.pris.guld) prisText += `${vara.pris.guld} guld `;
            if (vara.pris.silver) prisText += `${vara.pris.silver} silver `;
            if (vara.pris.koppar) prisText += `${vara.pris.koppar} koppar`;
        }
        const priceX = statsX;
        const priceY = (panelY || 0) + topAreaH + bottomAreaH - 10;
        ctx.fillText(prisText, priceX, priceY);

        // Visa eventuella varokrav intill priset (owned / required)
        const krav = (vara && (vara.krav || (vara.template && vara.template.krav))) || [];
        if (Array.isArray(krav) && krav.length > 0) {
            const ikonStorlek = 18;
            let ikonX = priceX + ctx.measureText(prisText).width + 12;
            const ikonY = priceY - ikonStorlek + 6;
            ctx.save();
            // Attempt to resolve current player via screen helper or global
            const spelare = (screen && typeof screen.hamtaSpelare === 'function') ? screen.hamtaSpelare() : (typeof window !== 'undefined' ? window.spelare : null);
            for (const req of krav) {
                const id = req && req.id ? req.id : null;
                const required = (req && req.count) ? req.count : 0;
                if (!id) continue;
                // Försök standardväg i assets/Varor
                const ikonSrc = `assets/Varor/${id}.png`;
                const ikonImg = hamtaProduktBild(ikonSrc);
                if (ikonImg && ikonImg.complete && ikonImg.naturalWidth > 0) {
                    ctx.drawImage(ikonImg, ikonX, ikonY, ikonStorlek, ikonStorlek);
                } else {
                    ctx.fillStyle = 'rgba(255,255,255,0.06)';
                    ctx.fillRect(ikonX, ikonY, ikonStorlek, ikonStorlek);
                    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                    ctx.strokeRect(ikonX, ikonY, ikonStorlek, ikonStorlek);
                }

                // Owned count (from player's inventory)
                const owned = hamtaAntalVaror(spelare, id);
                const text = `${owned}/${required}`;

                // Color: red-ish if missing, green-ish if enough
                if (owned < required) ctx.fillStyle = 'rgba(255,120,120,0.95)';
                else ctx.fillStyle = 'rgba(180,255,180,0.95)';

                ctx.font = '12px Arial';
                ctx.fillText(text, ikonX + ikonStorlek + 6, priceY);

                // advance X by icon + text width + gap
                ikonX += ikonStorlek + 6 + ctx.measureText(text).width + 12;
            }
            ctx.restore();
        }

        if (hoveredElement) {
            ritaElementTooltip(screen, hoveredElement.element, hoveredElement.x, hoveredElement.y);
        }

        ctx.restore();
    }

    function hamtaProduktBild(src) {
        if (!src) return null;
        if (!produktBildCache[src]) {
            const img = new Image();
            img.src = src;
            produktBildCache[src] = img;
            // optional: re-use pengarBildCache for icons if path matches
        }
        return produktBildCache[src];
    }

    // Expose helper to resolve icon path for a resource id
    function hamtaVaraIkonPathPublic(id) {
        return hamtaVaraIkonPath(id);
    }

    function hamtaIkonBild(src) {
        if (!src) return null;
        if (!ikonBildCache[src]) {
            const img = new Image();
            img.src = src;
            ikonBildCache[src] = img;
        }
        return ikonBildCache[src];
    }

    function beraknaMaxScroll(screen) {
        const panelHojd = 280;
        const headerHojd = 36;
        const footerHojd = 26;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 32;
        const contentHojd = (screen.hamtaAktivLista ? screen.hamtaAktivLista().length : 0) * radHojd;
        return Math.max(0, contentHojd - listHojd);
    }

    function uppdateraScroll(screen) {
        const maxScroll = beraknaMaxScroll(screen);
        screen.scrollTarget = Math.max(0, Math.min(screen.scrollTarget || 0, maxScroll));
        screen.scrollOffset = (screen.scrollOffset || 0) + ((screen.scrollTarget || 0) - (screen.scrollOffset || 0)) * 0.2;
        if (Math.abs((screen.scrollTarget || 0) - (screen.scrollOffset || 0)) < 0.5) {
            screen.scrollOffset = screen.scrollTarget;
        }
    }

    function justeraScrollForVal(screen) {
        const panelHojd = 280;
        const headerHojd = 36;
        const footerHojd = 26;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 32;
        const itemTop = (screen.shopValdIndex || 0) * radHojd;
        const itemBottom = itemTop + radHojd;

        if (itemTop < (screen.scrollTarget || 0)) {
            screen.scrollTarget = itemTop;
        } else if (itemBottom > (screen.scrollTarget || 0) + listHojd) {
            screen.scrollTarget = itemBottom - listHojd;
        }

        const maxScroll = beraknaMaxScroll(screen);
        screen.scrollTarget = Math.max(0, Math.min(screen.scrollTarget || 0, maxScroll));
    }

    function hamtaIndexFranMus(screen, musX, musY) {
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

        const relY = musY - listTop + (screen.scrollOffset || 0);
        const index = Math.floor(relY / radHojd);
        if (index < 0 || index >= (screen.hamtaAktivLista ? screen.hamtaAktivLista().length : 0)) return null;
        return index;
    }

    function ritaMeddelande(screen) {
        if (!screen.meddelande) return;
        if (Date.now() > screen.meddelande.tills) {
            screen.meddelande = null;
            return;
        }

        const ctx = screen.ctx;
        const canvas = screen.canvas;
        const text = screen.meddelande.text;

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

    function visaMeddelande(screen, text) {
        screen.meddelande = { text: String(text || ''), tills: Date.now() + 5000 };
    }

    function kontrolleraRad(spelare, pris) {
        if (!pris || !spelare.pengar) return true;
        const kopparTotalt = (spelare.pengar.koppar || 0) + (spelare.pengar.silver || 0) * 10 + (spelare.pengar.guld || 0) * 100;
        const prisTotalt = (pris.koppar || 0) + ((pris.silver || 0) * 10) + ((pris.guld || 0) * 100);
        return kopparTotalt >= prisTotalt;
    }

    function taPengar(spelare, pris) {
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
        if (prisTotalt > 0 && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
            window.spelaStandardLjud('pengar', 0.38);
        }
    }

    // Kontrollera att spelaren har nötvändiga varor enligt krav-lista
    // krav: [{ id: 'sten', count: 3 }, { id: 'tra', count: 5 }]
    function kontrolleraVaror(spelare, krav) {
        if (!krav || !Array.isArray(krav) || krav.length === 0) return true;
        if (!spelare || !spelare.utrustning || !Array.isArray(spelare.utrustning.inventory)) return false;
        const inv = spelare.utrustning.inventory;
        for (const req of krav) {
            const need = req.count || 0;
            if (!req.id || need <= 0) continue;
            const target = normalizeId(req.id);
            const have = inv.reduce((s, it) => {
                const iid = it && it.id ? normalizeId(it.id) : null;
                return s + ((iid === target) ? (it.count || 1) : 0);
            }, 0);
            if (have < need) return false;
        }
        return true;
    }

    // Return number of items with given id in player's inventory
    function hamtaAntalVaror(spelare, id) {
        if (!spelare || !id) return 0;
        if (!spelare.utrustning || !Array.isArray(spelare.utrustning.inventory)) return 0;
        const inv = spelare.utrustning.inventory;
        const target = normalizeId(id);
        return inv.reduce((s, it) => {
            const iid = it && it.id ? normalizeId(it.id) : null;
            return s + ((iid === target) ? (it.count || 1) : 0);
        }, 0);
    }

    // Ta bort varor från spelarens inventory enligt krav-lista
    function taVaror(spelare, krav) {
        if (!krav || !Array.isArray(krav) || krav.length === 0) return;
        if (!spelare || !spelare.utrustning || !Array.isArray(spelare.utrustning.inventory)) return;
        const inv = spelare.utrustning.inventory;
        for (const req of krav) {
            let toRemove = req.count || 0;
            if (!req.id || toRemove <= 0) continue;
            const target = normalizeId(req.id);
            for (let i = inv.length - 1; i >= 0 && toRemove > 0; i--) {
                const it = inv[i];
                const iid = it && it.id ? normalizeId(it.id) : null;
                if (iid !== target) continue;
                const have = it.count || 1;
                if (have > toRemove) {
                    it.count = have - toRemove;
                    toRemove = 0;
                } else {
                    // remove the whole stack
                    toRemove -= have;
                    inv.splice(i, 1);
                }
            }
        }
    }

    return {
        ritaPrisIkoner,
        ritaPengarTooltip,
        hamtaPengarBild,
        ritaPreview,
        uppdateraScroll,
        beraknaMaxScroll,
        justeraScrollForVal,
        hamtaIndexFranMus,
        ritaMeddelande,
        visaMeddelande,
        kontrolleraRad,
        taPengar,
        kontrolleraVaror,
        taVaror,
        hamtaAntalVaror,
        hamtaVaraIkonPath: hamtaVaraIkonPathPublic
    };
})();

if (typeof module !== 'undefined') module.exports = ShopUI;
if (typeof window !== 'undefined') window.ShopUI = ShopUI;
