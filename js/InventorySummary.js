class InventorySummary {
    constructor(canvas, ctx, hamtaSpelare) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.visas = true;
        this.padding = 12;
        this._buttons = [];
        this._overlay = {
            visible: false,
            selectedHouse: null,
            placed: [],
            sidebarButtons: [],
            gridRect: null,
            closeRect: null,
            hoveredPlaced: null,
            housesList: [],
            hoveredTooltipRect: null
        };
        this._elementInfo = {
            fysisk: { namn: 'Fysisk', beskrivning: 'Vanlig skada och motstånd från vapen, slag och rå styrka.' },
            eld: { namn: 'Eld', beskrivning: 'Brännande skada och skydd mot hetta, lågor och eldattacker.' },
            magi: { namn: 'Magi', beskrivning: 'Mystisk skada och motstånd mot besvärjelser och magiska krafter.' }
        };

        // builder/grid sizing defaults
        this._targetGridW = 1152;
        this._targetGridH = 768;
        this._builderSidebarW = 220;
        this._builderMargin = 24;
        this._origCanvasSize = null;

        // background image for builder grid
        this._gridBg = new Image();
        this._gridBgLoaded = false;
        this._gridBg.onload = () => { this._gridBgLoaded = true; };
        this._gridBg.src = 'assets/By/Bakgrund.png';
        // mouse position for preview
        this._mousePos = { x: 0, y: 0 };
        if (this.canvas && this.canvas.addEventListener) {
            this._onMouseMoveBound = this._onMouseMove.bind(this);
            this.canvas.addEventListener('mousemove', this._onMouseMoveBound);
        }
        // element icons
        this._elementIcons = {
            fysisk: new Image(),
            eld: new Image(),
            magi: new Image()
        };
        this._elementIcons.fysisk.onload = () => { this._elementIcons.fysisk._loaded = true; };
        this._elementIcons.eld.onload = () => { this._elementIcons.eld._loaded = true; };
        this._elementIcons.magi.onload = () => { this._elementIcons.magi._loaded = true; };
        this._elementIcons.fysisk.src = 'assets/Ikoner/Element Fysisk.png';
        this._elementIcons.eld.src = 'assets/Ikoner/Element Eld.png';
        this._elementIcons.magi.src = 'assets/Ikoner/Element Magi.png';

        if (this.canvas && this.canvas.addEventListener) {
            this._onClickBound = this._onClick.bind(this);
            this.canvas.addEventListener('click', this._onClickBound);
        }
    }

    visa() { this.visas = true; }
    dolj() { this.visas = false; }

    rita() {
        if (!this.visas) return;
        const ctx = this.ctx;
        const canvas = this.canvas;
        const spelare = this.hamtaSpelare();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // reset interactive button list each draw
        this._buttons.length = 0;

        // ensure consistent text alignment baseline for all draws
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Vertical divider
        const midX = Math.floor(canvas.width / 2);
        ctx.strokeStyle = 'rgba(0,255,136,0.15)';
        ctx.beginPath();
        ctx.moveTo(midX, 6);
        ctx.lineTo(midX, canvas.height - 6);
        ctx.stroke();

        // Titles
        ctx.fillStyle = '#ff4d4d';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Hus', midX / 2, 18);
        ctx.fillStyle = '#ff4d4d';
        ctx.fillText('Skepp', midX + midX / 2, 18);

        // Lists
        const leftX = this.padding;
        const rightX = midX + this.padding;
        let y = 40;
        const lineH = 18;
        // reserve space for the build button so the list won't run into it
        const reservedBottom = this.padding + 20 + 12; // button height is 20

        const husLista = (spelare && Array.isArray(spelare.egnaHus)) ? spelare.egnaHus : [];
        const skeppLista = (spelare && Array.isArray(spelare.egnaSkepp)) ? spelare.egnaSkepp : [];

        ctx.fillStyle = '#00ff88';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';

        // Draw houses on left as counts per house type, then a single "Bygg by" button
        if (husLista.length === 0) {
            ctx.fillStyle = 'rgba(200,200,200,0.7)';
            ctx.fillText('Inga hus ägda', leftX, y);
            y += lineH * 1.5;
        } else {
            // group by type (id or name)
            const counts = {};
            for (let i = 0; i < husLista.length; i++) {
                const h = husLista[i];
                const key = h.id || h.namn || ('house_' + i);
                if (!counts[key]) counts[key] = { house: h, count: 0 };
                counts[key].count++;
            }
            ctx.fillStyle = '#00ff88';
            ctx.font = '14px Arial';
            for (const k in counts) {
                if (!Object.prototype.hasOwnProperty.call(counts, k)) continue;
                const entry = counts[k];
                const h = entry.house;
                const display = h.namn || h.id || 'Okänt';
                ctx.fillStyle = '#00ff88';
                ctx.font = '14px Arial';
                ctx.fillText(display, leftX, y);
                // Visa endast antal (ingen detaljstat) för att hålla rutan ren
                const antal = entry.count || 1;
                if (antal > 1) {
                    ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    ctx.font = '12px Arial';
                    ctx.fillText(`Antal: ${antal}`, leftX + 8, y + 16);
                    y += lineH * 2;
                } else {
                    // enkel radhöjd för enstaka hus
                    y += lineH * 2;
                }
                if (y > canvas.height - reservedBottom) break;
                ctx.font = '14px Arial';
                ctx.fillStyle = '#00ff88';
            }
            ctx.font = '14px Arial';
        }

        // Single button to open the builder overlay — place bottom-center in the left box
        const buildBtnW = 120;
        const buildBtnH = 20;
        const buildBtnX = Math.round((midX / 2) - (buildBtnW / 2));
        const buildBtnY = Math.round(canvas.height - this.padding - buildBtnH - 6);
        ctx.fillStyle = '#003d2b';
        ctx.fillRect(buildBtnX, buildBtnY, buildBtnW, buildBtnH);
        ctx.strokeStyle = '#00ff88';
        ctx.strokeRect(buildBtnX, buildBtnY, buildBtnW, buildBtnH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Bygg by', buildBtnX + buildBtnW / 2, buildBtnY + buildBtnH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        this._buttons.push({ x: buildBtnX, y: buildBtnY, w: buildBtnW, h: buildBtnH, type: 'open_all_hus' });

        // Draw ships on right
        y = 40;
        if (skeppLista.length === 0) {
            ctx.fillStyle = 'rgba(200,200,200,0.7)';
            ctx.fillText('Inga skepp ägda', rightX, y);
        } else {
            for (let i = 0; i < skeppLista.length; i++) {
                const s = skeppLista[i];
                const namn = s.namn || (s.id || 'Okänt');
                ctx.fillStyle = '#00ff88';
                ctx.fillText(namn, rightX, y);
                y += lineH * 2;
                if (y > canvas.height - 20) break;
                ctx.font = '14px Arial';
            }
        }

        // Button to open fleet builder on the right
        const fleetBtnW = 120;
        const fleetBtnH = 20;
        const fleetBtnX = Math.round((midX + midX / 2) - (fleetBtnW / 2));
        const fleetBtnY = Math.round(canvas.height - this.padding - fleetBtnH - 6);
        ctx.fillStyle = '#003d2b';
        ctx.fillRect(fleetBtnX, fleetBtnY, fleetBtnW, fleetBtnH);
        ctx.strokeStyle = '#00ff88';
        ctx.strokeRect(fleetBtnX, fleetBtnY, fleetBtnW, fleetBtnH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Bygg flotta', fleetBtnX + fleetBtnW / 2, fleetBtnY + fleetBtnH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        this._buttons.push({ x: fleetBtnX, y: fleetBtnY, w: fleetBtnW, h: fleetBtnH, type: 'open_flotta' });

        // Draw overlay builder if active
        if (this._overlay.visible) {
            // Ensure houses list in overlay is populated only when opened
            if (!this._overlay.housesList || this._overlay.housesList.length === 0) {
                // Build a map of types -> counts so we can prevent placing more than owned.
                // Use houses or ships depending on fleetMode
                const counts = {};
                const types = [];
                const images = {};
                const sourceList = this._overlay.fleetMode ? skeppLista : husLista;
                for (let i = 0; i < sourceList.length; i++) {
                    const hh = sourceList[i];
                    const key = hh.id || hh.namn || ('item_' + i);
                    if (!counts[key]) {
                        counts[key] = { count: 0, house: hh };
                        types.push({ key: key, house: hh });
                    }
                    counts[key].count++;
                }
                // try to preload images for each house type (look in assets/Byggarbetsplatsen)
                for (let t = 0; t < types.length; t++) {
                    const ht = types[t];
                    const hh = ht.house;
                    const img = new Image();
                    img._loaded = false;
                    img.onload = () => { img._loaded = true; };
                    img.onerror = () => { img._loaded = false; };
                    // candidates: namn, id
                    const candidates = [];
                    if (hh.namn) candidates.push(hh.namn + '.png');
                    if (hh.id) candidates.push(hh.id + '.png');
                    // fallback to key name
                    candidates.push(ht.key + '.png');
                    // set first candidate as src (will fail harmlessly if not found)
                    img.src = 'assets/Byggarbetsplatsen/' + candidates[0];
                    images[ht.key] = img;
                }

                // also ensure images are available for any already-placed objects
                if (this._overlay.placed && this._overlay.placed.length) {
                    for (let pi = 0; pi < this._overlay.placed.length; pi++) {
                        const placed = this._overlay.placed[pi];
                        const pkey = placed.key || (placed.house && (placed.house.id || placed.house.namn));
                        if (!pkey) continue;
                        if (images[pkey]) continue; // already loaded
                        const hh = placed.house;
                        const img = new Image();
                        img._loaded = false;
                        img.onload = () => { img._loaded = true; };
                        img.onerror = () => { img._loaded = false; };
                        const candidates = [];
                        if (hh && hh.namn) candidates.push(hh.namn + '.png');
                        if (hh && hh.id) candidates.push(hh.id + '.png');
                        candidates.push(pkey + '.png');
                        img.src = 'assets/Byggarbetsplatsen/' + candidates[0];
                        images[pkey] = img;
                    }
                }

                // If there are already placed houses/ships, decrement counts so reopening
                // the builder doesn't give additional free placements. Also tag placed
                // objects with their type so removal is limited to the corresponding mode.
                if (this._overlay.placed && this._overlay.placed.length) {
                    for (let pi = 0; pi < this._overlay.placed.length; pi++) {
                        const placed = this._overlay.placed[pi];
                        const pkey = placed.key || (placed.house && (placed.house.id || placed.house.namn));
                        if (pkey && counts[pkey]) {
                            counts[pkey].count = Math.max(0, counts[pkey].count - 1);
                        }
                        // ensure placed._type exists by checking player's lists
                        if (!placed._type) {
                            let found = false;
                            for (let si = 0; si < skeppLista.length; si++) {
                                const s = skeppLista[si];
                                if (!placed.house) continue;
                                if ((s.id && s.id === placed.house.id) || (s.namn && s.namn === placed.house.namn)) { placed._type = 'skepp'; found = true; break; }
                            }
                            if (!found) {
                                for (let hi = 0; hi < husLista.length; hi++) {
                                    const h = husLista[hi];
                                    if (!placed.house) continue;
                                    if ((h.id && h.id === placed.house.id) || (h.namn && h.namn === placed.house.namn)) { placed._type = 'hus'; found = true; break; }
                                }
                            }
                            // fallback: assume whatever mode we're opening in
                            if (!placed._type) placed._type = this._overlay.fleetMode ? 'skepp' : 'hus';
                        }
                    }
                }

                this._overlay.houseCounts = counts;
                this._overlay.houseTypes = types;
                this._overlay.houseImages = images;
                this._overlay.housesList = types.slice();
            }

            // dim background
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // layout
            const sidebarW = this._builderSidebarW;
            const margin = this._builderMargin;
            const gridY = margin + 24;

            // Target grid size requested by user; cap to available canvas area
            const targetGridW = this._targetGridW;
            const targetGridH = this._targetGridH;

            // compute available width to the right of the sidebar
            const areaLeft = margin + sidebarW + 12;
            const availableRight = Math.max(0, canvas.width - areaLeft - margin);

            // grid width/height should try to be target, but not exceed available space
            const gridW = Math.min(targetGridW, availableRight);
            const gridH = Math.min(targetGridH, Math.max(0, canvas.height - gridY - margin - 40));

            // center the grid horizontally within the available right area
            const gridX = areaLeft + Math.floor(Math.max(0, (availableRight - gridW) / 2));

            // sidebar panel
            const sideX = margin;
            const sideY = margin;
            const sideH = gridH + 24;
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(sideX, sideY, sidebarW, sideH);
            ctx.strokeStyle = '#00ff88';
            ctx.strokeRect(sideX, sideY, sidebarW, sideH);

            // grid panel (use background image if loaded)
            if (this._gridBgLoaded) {
                try {
                    ctx.drawImage(this._gridBg, gridX, gridY, gridW, gridH);
                } catch (e) {
                    ctx.fillStyle = '#0f1724';
                    ctx.fillRect(gridX, gridY, gridW, gridH);
                }
            } else {
                ctx.fillStyle = '#0f1724';
                ctx.fillRect(gridX, gridY, gridW, gridH);
            }
            ctx.strokeStyle = '#00ff88';
            ctx.strokeRect(gridX, gridY, gridW, gridH);

            // draw grid (smaller cell for finer placement)
            const cell = 8;
            ctx.strokeStyle = 'rgba(0,255,136,0.08)';
            for (let gx = gridX; gx <= gridX + gridW; gx += cell) {
                ctx.beginPath(); ctx.moveTo(gx, gridY); ctx.lineTo(gx, gridY + gridH); ctx.stroke();
            }
            for (let gy2 = gridY; gy2 <= gridY + gridH; gy2 += cell) {
                ctx.beginPath(); ctx.moveTo(gridX, gy2); ctx.lineTo(gridX + gridW, gy2); ctx.stroke();
            }

            // sidebar content: list of available houses or ships with select buttons
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 16px Arial';
            const titleText = this._overlay.fleetMode ? 'Tillgängliga skepp' : 'Tillgängliga hus';
            ctx.fillText(titleText, sideX + 12, sideY + 28);
            ctx.font = '14px Arial';
            this._overlay.sidebarButtons = [];
            let sy = sideY + 44;
            const btnW = 64, btnH = 18;
            for (let i = 0; i < this._overlay.houseTypes.length; i++) {
                const ht = this._overlay.houseTypes[i];
                const hh = ht.house;
                const displayRaw = hh.namn || (hh.id || 'Okänt');
                // remaining count
                const rem = (this._overlay.houseCounts && this._overlay.houseCounts[ht.key]) ? this._overlay.houseCounts[ht.key].count : 0;
                // reserve space on the right for the small select button
                const textMaxW = sidebarW - btnW - 36; // padding
                let displayText = displayRaw + ' x' + rem;
                // truncate if too long
                ctx.font = '14px Arial';
                while (ctx.measureText(displayText).width > textMaxW && displayText.length > 3) {
                    displayText = displayText.slice(0, -1);
                }
                if (displayText.length < (displayRaw + ' x' + rem).length) {
                    // ensure visible ellipsis
                    displayText = displayText.slice(0, Math.max(0, displayText.length - 3)) + '...';
                }
                ctx.fillStyle = '#00ff88';
                ctx.fillText(displayText, sideX + 12, sy + 12);
                // draw select button (disabled if none left)
                const bx = sideX + sidebarW - btnW - 12;
                const by = sy - -10;
                const canSelect = rem > 0;
                ctx.fillStyle = (this._overlay.selectedHouse && this._overlay.selectedHouse.key === ht.key) ? '#006644' : (canSelect ? '#003d2b' : '#333333');
                ctx.fillRect(bx, by, btnW, btnH);
                ctx.strokeStyle = '#00ff88'; ctx.strokeRect(bx, by, btnW, btnH);
                ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(canSelect ? 'Välj' : 'Slut', bx + btnW/2, by + btnH/2); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                this._overlay.sidebarButtons.push({ x: bx, y: by, w: btnW, h: btnH, key: ht.key, house: hh });
                sy += 28;
                if (sy > sideY + sideH - 28) break;
            }

            // placed houses
                for (let i = 0; i < this._overlay.placed.length; i++) {
                const p = this._overlay.placed[i];
                // size varies with vertical position: smaller at top, larger at bottom
                const minSize = 5;
                const maxSize = 250;
                let size = 48;
                if (this._overlay.gridRect) {
                    const g = this._overlay.gridRect;
                    const denom = Math.max(1, g.h);
                    let t = (p.y - g.y) / denom;
                    if (t < 0) t = 0; if (t > 1) t = 1;
                    size = Math.round(minSize + t * (maxSize - minSize));
                }
                // try to draw an image for this house/ship type
                const key = p.key || (p.house && (p.house.id || p.house.namn));
                const img = (this._overlay.houseImages && key) ? this._overlay.houseImages[key] : null;
                const isTunna = this._isTunnaKey(key, p.house);
                const effectiveSize = Math.max(1, Math.round(size * (isTunna ? 0.5 : 1)));
                if (img && img._loaded) {
                    const dims = this._fitImageSize(img, effectiveSize);
                    ctx.drawImage(img, p.x - dims.w / 2, p.y - dims.h / 2, dims.w, dims.h);
                } else {
                    ctx.fillStyle = '#8fbf8f';
                    ctx.fillRect(p.x - effectiveSize / 2, p.y - effectiveSize / 2, effectiveSize, effectiveSize);
                    ctx.strokeStyle = '#003d2b'; ctx.strokeRect(p.x - effectiveSize / 2, p.y - effectiveSize / 2, effectiveSize, effectiveSize);
                    ctx.fillStyle = '#001b10'; ctx.font = Math.max(10, Math.floor(effectiveSize/4)) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.house && (p.house.namn || p.house.id) || 'H', p.x, p.y);
                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                }
                // store rect for click detection (use effective size)
                p._rect = { x: p.x - effectiveSize / 2, y: p.y - effectiveSize / 2, w: effectiveSize, h: effectiveSize };
            }

            // detect hover over placed houses (for tooltip)
            let hovered = null;
            const previousHovered = this._overlay.hoveredPlaced;
            if (this._mousePos) {
                for (let i = 0; i < this._overlay.placed.length; i++) {
                    const p = this._overlay.placed[i];
                    if (p._rect && this._isInside(this._mousePos.x, this._mousePos.y, p._rect)) {
                        hovered = p;
                        break;
                    }
                }
                if (!hovered && previousHovered && this._overlay.hoveredTooltipRect && this._isInside(this._mousePos.x, this._mousePos.y, this._overlay.hoveredTooltipRect)) {
                    hovered = previousHovered;
                }
            }
            this._overlay.hoveredPlaced = hovered;
            this._overlay.hoveredTooltipRect = null;

            // draw tooltip for hovered placed house
            if (hovered) {
                const pad = 8;
                const iconSize = 14;
                const lineH = 18;
                const title = hovered.house.namn || hovered.house.id || 'Okänt';
                const eg = hovered.house.egenskaper || {};

                // prepare stat lines
                const statKeys = [['strid','Strid'], ['jakt','Jakt'], ['försvar','Försvar']];
                ctx.font = '12px Arial';
                let maxW = ctx.measureText(title).width;
                const statLines = [];
                for (let si = 0; si < statKeys.length; si++) {
                    const key = statKeys[si][0];
                    const label = statKeys[si][1];
                    const s = eg[key] || {};
                    const vals = [s.fysisk || 0, s.eld || 0, s.magi || 0];
                    // measure width of this line: label + icons + numbers
                    let w = ctx.measureText(label + ':').width + 8;
                    for (let vi = 0; vi < vals.length; vi++) {
                        const numText = String(vals[vi]);
                        w += iconSize + 4 + ctx.measureText(numText).width + 12;
                    }
                    if (w > maxW) maxW = w;
                    statLines.push({ label, vals });
                }

                const tooltipW = Math.ceil(maxW) + pad * 2;
                const tooltipH = pad * 2 + lineH * (1 + statLines.length);

                // position near mouse but keep inside canvas
                let tx = this._mousePos.x + 12;
                let ty = this._mousePos.y + 12;
                if (tx + tooltipW > canvas.width - 6) tx = canvas.width - tooltipW - 6;
                if (ty + tooltipH > canvas.height - 6) ty = canvas.height - tooltipH - 6;
                this._overlay.hoveredTooltipRect = { x: tx, y: ty, w: tooltipW, h: tooltipH };

                // background
                ctx.fillStyle = 'rgba(0,27,16,0.95)';
                ctx.fillRect(tx, ty, tooltipW, tooltipH);
                ctx.strokeStyle = '#00ff88'; ctx.strokeRect(tx, ty, tooltipW, tooltipH);

                // draw title
                ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 13px Arial'; ctx.textBaseline = 'top';
                ctx.fillText(title, tx + pad, ty + pad);

                // draw stat lines with icons
                let drawY = ty + pad + lineH;
                ctx.font = '12px Arial'; ctx.fillStyle = '#00ff88'; ctx.textBaseline = 'top';
                let hoveredElement = null;
                for (let li = 0; li < statLines.length; li++) {
                    const L = statLines[li];
                    // label
                    ctx.fillStyle = '#00ff88'; ctx.textAlign = 'left'; ctx.fillText(L.label + ':', tx + pad, drawY);
                    let ix = tx + pad + ctx.measureText(L.label + ':').width + 8;
                    // draw element icons and numbers
                    const icons = this._elementIcons;
                    const drawElem = (key, iconImg, val) => {
                        // ensure numbers use top baseline
                        const prevBaseline = ctx.textBaseline;
                        ctx.textBaseline = 'top';
                        if (iconImg && iconImg._loaded) {
                            ctx.drawImage(iconImg, ix, drawY, iconSize, iconSize);
                        } else {
                            ctx.fillStyle = '#666666'; ctx.fillRect(ix, drawY, iconSize, iconSize);
                        }
                        if (this._mousePos && this._mousePos.x >= ix && this._mousePos.x <= ix + iconSize && this._mousePos.y >= drawY && this._mousePos.y <= drawY + iconSize) {
                            hoveredElement = { element: key, x: this._mousePos.x, y: this._mousePos.y };
                        }
                        ix += iconSize + 4;
                        ctx.fillStyle = '#ffd27a'; ctx.fillText(String(val), ix, drawY);
                        ix += ctx.measureText(String(val)).width + 12;
                        ctx.textBaseline = prevBaseline;
                    };
                    drawElem('fysisk', icons.fysisk, L.vals[0]);
                    drawElem('eld', icons.eld, L.vals[1]);
                    drawElem('magi', icons.magi, L.vals[2]);
                    drawY += lineH;
                }
                ctx.textAlign = 'left';
                if (hoveredElement) {
                    this._ritaElementTooltip(ctx, hoveredElement.element, hoveredElement.x, hoveredElement.y);
                }
            }

            // instructions and selected house preview (mouse-follow)
            const infoX = gridX;
            const infoY = gridY + gridH + 18;
            ctx.fillStyle = '#00ff88'; ctx.font = '13px Arial';
            ctx.fillText('Klicka på ett hus i listan, sedan i rutnätsytan för att placera det.', infoX, infoY);
            if (this._overlay.selectedHouse) {
                const sel = this._overlay.selectedHouse;
                const key = sel.key || (sel.house && (sel.house.id || sel.house.namn));
                const img = (this._overlay.houseImages && key) ? this._overlay.houseImages[key] : null;
                // draw preview at mouse position snapped to grid if within grid, otherwise fallback to info area
                let px = infoX + 360;
                let py = infoY - 10;
                if (this._overlay.gridRect && this._mousePos) {
                    const g = this._overlay.gridRect;
                    if (this._mousePos.x >= g.x && this._mousePos.x <= g.x + g.w && this._mousePos.y >= g.y && this._mousePos.y <= g.y + g.h) {
                        const localX = this._mousePos.x - g.x;
                        const localY = this._mousePos.y - g.y;
                        px = Math.floor(localX / cell) * cell + g.x + Math.floor(cell/2);
                        py = Math.floor(localY / cell) * cell + g.y + Math.floor(cell/2);
                    }
                }
                // preview size also scales with vertical position
                let previewSize = 56;
                if (this._overlay.gridRect) {
                    const g = this._overlay.gridRect;
                    const denom = Math.max(1, g.h);
                    let t = (py - g.y) / denom;
                    if (t < 0) t = 0; if (t > 1) t = 1;
                    const pMin = 5, pMax = 250;
                    previewSize = Math.round(pMin + t * (pMax - pMin));
                }
                ctx.save();
                ctx.globalAlpha = 0.9;
                if (img && img._loaded) {
                    const isTunnaSel = this._isTunnaKey(key, sel.house);
                    const usePreviewSize = isTunnaSel ? Math.max(1, Math.round(previewSize * 0.5)) : previewSize;
                    const pd = this._fitImageSize(img, usePreviewSize);
                    ctx.drawImage(img, px - pd.w / 2, py - pd.h / 2, pd.w, pd.h);
                } else {
                    ctx.fillStyle = '#ffefc2'; ctx.font = '14px Arial';
                    ctx.fillText('Valt: ' + (sel.house.namn || sel.house.id), px + 40, infoY);
                }
                ctx.restore();
            }

            // close button top-right
            const closeW = 28, closeH = 20;
            const closeX = canvas.width - closeW - 12;
            const closeY = 12;
                ctx.fillStyle = '#550000'; ctx.fillRect(closeX, closeY, closeW, closeH);
            ctx.strokeStyle = '#ff4d4d'; ctx.strokeRect(closeX, closeY, closeW, closeH);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('X', closeX + closeW/2, closeY + closeH/2); ctx.textAlign = 'left'; ctx.textBaseline = 'top';

            this._overlay.closeRect = { x: closeX, y: closeY, w: closeW, h: closeH };
            this._overlay.gridRect = { x: gridX, y: gridY, w: gridW, h: gridH };
        } else {
            this._overlay.closeRect = null;
            this._overlay.gridRect = null;
            this._overlay.hoveredTooltipRect = null;
        }
    }

    _wrapElementText(text, maxWidth) {
        const ctx = this.ctx;
        const ord = String(text || '').split(/\s+/).filter(Boolean);
        const rader = [];
        let aktuellRad = '';
        for (const del of ord) {
            const testRad = aktuellRad ? aktuellRad + ' ' + del : del;
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

    _ritaElementTooltip(ctx, element, musX, musY) {
        const info = this._elementInfo[element];
        const ikon = this._elementIcons[element];
        if (!info) return;

        const iconSize = 104;
        const textMax = 204;
        ctx.save();
        ctx.font = '12px Arial';
        const rader = this._wrapElementText(info.beskrivning, textMax);
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
        if (ikon && ikon._loaded) ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);
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

    _onClick(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;

        // If overlay visible, handle overlay-specific interactions first
        if (this._overlay.visible) {
            const c = this._overlay.closeRect;
            if (c && this._isInside(x, y, c)) {
                this._overlay.visible = false;
                this._overlay.selectedHouse = null;
                this._overlay.fleetMode = false;
                // Persist all placed houses and ships back to the player object.
                try {
                    const spelare = this.hamtaSpelare();
                    if (spelare) {
                        const placed = (this._overlay.placed || []).map((p) => ({ key: p.key, x: p.x, y: p.y, type: p._type || 'hus' }));
                        spelare.husPlaced = placed.filter((p) => p.type === 'hus');
                        spelare.flottaPlaced = placed.filter((p) => p.type === 'skepp');
                    }
                } catch (e) {}
                // restore original canvas size and transform if we changed it
                if (this._origCanvasSize) {
                    const canvas = this.canvas;
                    canvas.width = this._origCanvasSize.w;
                    canvas.height = this._origCanvasSize.h;
                    canvas.style.width = this._origCanvasSize.styleW || canvas.width + 'px';
                    canvas.style.height = this._origCanvasSize.styleH || canvas.height + 'px';
                    // restore previous transform (or clear)
                    canvas.style.transform = this._origCanvasSize.prevTransform || '';
                    this._origCanvasSize = null;
                }
                // redraw
                this.rita();
                return;
            }

            // check sidebar selects
            for (let i = 0; i < (this._overlay.sidebarButtons || []).length; i++) {
                const sb = this._overlay.sidebarButtons[i];
                if (this._isInside(x, y, sb)) {
                    // select that house only if there are remaining units
                    const rem = (this._overlay.houseCounts && this._overlay.houseCounts[sb.key]) ? this._overlay.houseCounts[sb.key].count : 0;
                    if (rem > 0) {
                        this._overlay.selectedHouse = { key: sb.key, house: sb.house };
                    }
                    return;
                }
            }

            // check clicks on placed objects to remove them (only in matching mode)
            const currentModeType = this._overlay.fleetMode ? 'skepp' : 'hus';
            for (let i = 0; i < this._overlay.placed.length; i++) {
                const p = this._overlay.placed[i];
                if (!p._rect || !this._isInside(x, y, p._rect)) continue;
                // only allow removal when the placed object's type matches the open builder mode
                if (p._type && p._type !== currentModeType) continue;
                // remove placed and return house/ship to available counts
                const key = p.key || (p.house && (p.house.id || p.house.namn));
                if (this._overlay.houseCounts && key && this._overlay.houseCounts[key]) {
                    this._overlay.houseCounts[key].count++;
                }
                // remove and subtract stats from player totals
                try {
                    this._applyEgenskaperToPlayer(p.house.egenskaper, -1);
                } catch (e) {}
                this._overlay.placed.splice(i, 1);
                return;
            }

            // click in grid to place selected house
            const g = this._overlay.gridRect;
            if (g && this._isInside(x, y, g) && this._overlay.selectedHouse) {
                const cell = 8;
                const localX = x - g.x;
                const localY = y - g.y;
                const cx = Math.floor(localX / cell) * cell + g.x + Math.floor(cell/2);
                const cy = Math.floor(localY / cell) * cell + g.y + Math.floor(cell/2);
                // ensure still available
                const key = this._overlay.selectedHouse.key;
                const remObj = this._overlay.houseCounts && this._overlay.houseCounts[key];
                if (!remObj || remObj.count <= 0) {
                    // nothing to place
                    this._overlay.selectedHouse = null;
                    return;
                }
                // place (store key and type for later restore/removal)
                this._overlay.placed.push({ x: cx, y: cy, house: this._overlay.selectedHouse.house, key: key, _type: this._overlay.fleetMode ? 'skepp' : 'hus' });
                // decrement count
                remObj.count--;
                // if depleted, clear selection
                if (remObj.count <= 0) this._overlay.selectedHouse = null;
                // apply house stats to player totals
                try {
                    this._applyEgenskaperToPlayer(this._overlay.placed[this._overlay.placed.length-1].house.egenskaper, +1);
                } catch (e) {}
                return;
            }

            return;
        }

        // otherwise check top-level buttons
        for (let i = 0; i < this._buttons.length; i++) {
            const b = this._buttons[i];
            if (this._isInside(x, y, b)) {
                if (b.type === 'open_all_hus' || b.type === 'open_flotta') {
                    const spelare = this.hamtaSpelare();
                    this._overlay.visible = true;
                    // initialize overlay lists next draw
                    this._overlay.selectedHouse = null;
                    this._overlay.placed = this._hamtaSparadePlaceringar(spelare);
                    this._overlay.housesList = [];
                    // fleet mode when opening via right-side button
                    this._overlay.fleetMode = (b.type === 'open_flotta');

                    // expand canvas if needed so the target grid fits
                    const margin = this._builderMargin;
                    const sidebarW = this._builderSidebarW;
                    const gridY = margin + 24;
                    const requiredW = margin + sidebarW + 12 + this._targetGridW + margin;
                    const requiredH = gridY + this._targetGridH + margin + 40;
                    const canvas = this.canvas;
                    if (!this._origCanvasSize && (canvas.width < requiredW || canvas.height < requiredH)) {
                        // record original sizes and transform
                        const rectBefore = canvas.getBoundingClientRect();
                        const prevTransform = canvas.style.transform || '';
                        this._origCanvasSize = {
                            w: canvas.width,
                            h: canvas.height,
                            styleW: canvas.style.width,
                            styleH: canvas.style.height,
                            prevTransform: prevTransform,
                            rightBefore: rectBefore.right,
                            bottomBefore: rectBefore.bottom
                        };
                        // resize canvas to required
                        canvas.width = Math.max(canvas.width, requiredW);
                        canvas.height = Math.max(canvas.height, requiredH);
                        canvas.style.width = canvas.width + 'px';
                        canvas.style.height = canvas.height + 'px';

                        // compute how much the canvas moved on screen and translate it so
                        // the bottom-right stays at the same screen coordinates
                        const rectAfter = canvas.getBoundingClientRect();
                        const deltaX = rectAfter.right - this._origCanvasSize.rightBefore;
                        const deltaY = rectAfter.bottom - this._origCanvasSize.bottomBefore;
                        if (deltaX !== 0 || deltaY !== 0) {
                            const translate = `translate(${-deltaX}px, ${-deltaY}px)`;
                            canvas.style.transform = translate + (prevTransform ? ' ' + prevTransform : '');
                            this._origCanvasSize.appliedTransform = canvas.style.transform;
                        }
                    }
                    // redraw immediately
                    this.rita();
                }
                return;
            }
        }
    }

    _hamtaSparadePlaceringar(spelare) {
        if (!spelare) return [];

        const husLista = Array.isArray(spelare.egnaHus) ? spelare.egnaHus : [];
        const skeppLista = Array.isArray(spelare.egnaSkepp) ? spelare.egnaSkepp : [];
        const husPlaced = Array.isArray(spelare.husPlaced) ? spelare.husPlaced : [];
        const flottaPlaced = Array.isArray(spelare.flottaPlaced) ? spelare.flottaPlaced : [];

        const hittaByggnad = (lista, key) => {
            if (!Array.isArray(lista) || !key) return null;
            return lista.find((entry) => entry && ((entry.id && String(entry.id) === String(key)) || (entry.namn && String(entry.namn) === String(key)))) || null;
        };

        const byggPlaceringar = (placeringar, lista, fallbackType) => placeringar
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => {
                const key = entry.key || null;
                const house = hittaByggnad(lista, key);
                if (!house) return null;
                return {
                    x: typeof entry.x === 'number' ? entry.x : 0,
                    y: typeof entry.y === 'number' ? entry.y : 0,
                    house,
                    key,
                    _type: entry.type || fallbackType
                };
            })
            .filter(Boolean);

        return byggPlaceringar(husPlaced, husLista, 'hus').concat(byggPlaceringar(flottaPlaced, skeppLista, 'skepp'));
    }

    _onMouseMove(evt) {
        const rect = this.canvas.getBoundingClientRect();
        this._mousePos.x = evt.clientX - rect.left;
        this._mousePos.y = evt.clientY - rect.top;
        // redraw to update preview
        try { this.rita(); } catch (e) {}
    }

    _isInside(x, y, r) {
        return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    }

    _fitImageSize(img, maxSize) {
        if (!img || !img._loaded) return { w: maxSize, h: maxSize };
        const iw = img.naturalWidth || img.width || 1;
        const ih = img.naturalHeight || img.height || 1;
        const scale = maxSize / Math.max(iw, ih);
        return { w: Math.max(1, Math.round(iw * scale)), h: Math.max(1, Math.round(ih * scale)) };
    }

    _isTunnaKey(key, house) {
        const chk = (v) => v && String(v).toLowerCase().indexOf('tunna') !== -1;
        if (chk(key)) return true;
        if (house) {
            if (chk(house.namn)) return true;
            if (chk(house.id)) return true;
        }
        return false;
    }

    _ensurePlayerBonus() {
        const spelare = this.hamtaSpelare();
        if (!spelare) return null;
        if (!spelare.bonusKallor || typeof spelare.bonusKallor !== 'object') {
            spelare.bonusKallor = { hus: {}, skepp: {} };
        }
        if (!spelare.bonusEgenskaper) spelare.bonusEgenskaper = {};
        if (typeof spelare.uppdateraAktivaBonusEgenskaper === 'function') {
            spelare.uppdateraAktivaBonusEgenskaper();
        }
        return spelare;
    }

    _applyEgenskaperToPlayer(eg, mul) {
        // mul = +1 to add, -1 to remove
        if (!eg) return;
        const spelare = this._ensurePlayerBonus();
        if (!spelare) return;
        const bonusTyp = this._overlay.fleetMode ? 'skepp' : 'hus';
        if (!spelare.bonusKallor[bonusTyp] || typeof spelare.bonusKallor[bonusTyp] !== 'object') {
            spelare.bonusKallor[bonusTyp] = {};
        }
        const be = spelare.bonusKallor[bonusTyp];
        const add = (target, src) => {
            if (!src || typeof src !== 'object') return;
            for (const k in src) {
                if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
                const v = src[k] || 0;
                if (typeof v === 'object') {
                    if (!target[k]) target[k] = {};
                    add(target[k], src[k]);
                } else if (typeof v === 'number') {
                    target[k] = (target[k] || 0) + mul * v;
                }
            }
        };
        add(be, eg);
        if (typeof spelare.uppdateraAktivaBonusEgenskaper === 'function') {
            spelare.uppdateraAktivaBonusEgenskaper();
        } else {
            spelare.bonusEgenskaper = be;
        }
    }

    _summarizeEgenskaper(eg) {
        if (!eg || typeof eg !== 'object') return '';
        const parts = [];
        // common keys: strid, jakt, försvar, hastighet, last
        if (eg.strid) {
            const s = eg.strid;
            const total = (s.fysisk || 0) + (s.eld || 0) + (s.magi || 0);
            parts.push(`Strid:${total}`);
        }
        if (eg.jakt) {
            const j = eg.jakt;
            const total = (j.fysisk || 0) + (j.eld || 0) + (j.magi || 0);
            parts.push(`Jakt:${total}`);
        }
        if (eg.försvar || eg.forsvar) {
            const f = eg.försvar || eg.forsvar;
            const total = (f.fysisk || 0) + (f.eld || 0) + (f.magi || 0);
            parts.push(`Försvar:${total}`);
        }
        if (eg.hastighet) parts.push(`Hast:${eg.hastighet}`);
        if (eg.last) parts.push(`Last:${eg.last}`);
        return parts.join('  ');
    }
}

if (typeof module !== 'undefined') module.exports = InventorySummary;
if (typeof window !== 'undefined') window.InventorySummary = InventorySummary;
