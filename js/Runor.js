// Runor.js
// Enkel manager för "runor" (magiska effekter som kan registreras och appliceras på spelaren)
// Kommentarer och metoder på svenska för enkel integration med resten av spelet.

class Runor {
    constructor() {
        this._runes = {}; // id -> definition
    }

    // Registrera en rune-definition: { id, namn, beskrivning, apply(spelare) }
    registerRune(def) {
        if (!def || !def.id) return false;
        this._runes[def.id] = def;
        return true;
    }

    // Hämta rune-definition
    getRune(id) {
        return this._runes[id] || null;
    }

    // Applicera rune på spelare; returnerar true om lyckades
    applyRune(id, spelare) {
        const r = this.getRune(id);
        if (!r || typeof r.apply !== 'function') return false;
        try {
            r.apply(spelare);
            return true;
        } catch (e) {
            try { console.error('[Runor] applyRune failed for', id, e); } catch (ee) {}
            return false;
        }
    }

    // Lista alla registrerade runor
    listRunes() {
        return Object.keys(this._runes).map(k => this._runes[k]);
    }
}

// Exportera en singleton-instans för enkel användning globalt
const runor = new Runor();
try { if (typeof window !== 'undefined') window.runor = runor; } catch (e) {}

// Exponera för CommonJS/ES-moduler om relevant
if (typeof module !== 'undefined' && module.exports) module.exports = runor;
// Note: we avoid `export default` here to keep the file usable as a plain <script> in the browser

// Create a full-width "runor" canvas under the three main columns
try {
    if (typeof window !== 'undefined') {
        const setupRunorCanvas = () => {
            try {
                const mainFlex = document.getElementById('main-flex');
                if (!mainFlex) return;

                // Determine widths of the three columns (character, container, inventory)
                const charCanvas = document.getElementById('characterCanvas');
                const gameCanvas = document.getElementById('gameCanvas');
                const invCanvas = document.getElementById('inventoryCanvas');
                const statsCanvas = document.getElementById('statsCanvas');
                // Compute target width as the visible width of the main-flex row
                const rect = mainFlex.getBoundingClientRect();
                const statsH = statsCanvas ? (statsCanvas.height || statsCanvas.clientHeight) : 200;
                const h = Math.max(32, Math.round(statsH / 2));
                // Align left with characterCanvas left and right with inventoryCanvas right
                const charR = charCanvas ? charCanvas.getBoundingClientRect() : null;
                const invR = invCanvas ? invCanvas.getBoundingClientRect() : null;
                const scrollLeft = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
                const SHIFT_LEFT_PX = 6;
                const SHIFT_RIGHT_PX = 6;
                const leftEdgeRaw = charR ? Math.round(charR.left + scrollLeft) : Math.round(rect.left + scrollLeft);
                const rightEdgeRaw = invR ? Math.round(invR.right + scrollLeft) : Math.round(rect.right + scrollLeft);
                const leftEdge = Math.max(0, leftEdgeRaw - SHIFT_LEFT_PX);
                const rightEdge = Math.max(0, rightEdgeRaw - SHIFT_RIGHT_PX);
                const totalW = Math.max(0, rightEdge - leftEdge);

                // Avoid creating duplicate canvas
                if (document.getElementById('runorCanvas')) return;

                const c = document.createElement('canvas');
                c.id = 'runorCanvas';
                c.width = totalW;
                c.height = h;
                // style to match existing panels
                c.style.border = '2px solid #00ff88';
                c.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.2)';
                c.style.background = '#1a1a2e';
                c.style.display = 'block';
                // position absolute under the main-flex so it lines up with the three columns
                c.style.position = 'absolute';
                const docTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
                c.style.left = leftEdge + 'px';
                c.style.top = Math.round(rect.bottom + 8 + docTop) + 'px';
                c.style.width = totalW + 'px';
                c.style.height = h + 'px';
                // Insert into body so absolute positioning is relative to viewport
                document.body.appendChild(c);

                const ritaTomRunorBakgrund = () => {
                    try {
                        const ctx = c.getContext('2d');
                        if (!ctx) return;
                        ctx.clearRect(0, 0, c.width, c.height);
                        ctx.fillStyle = 'rgba(0,0,0,0.15)';
                        ctx.fillRect(0, 0, c.width, c.height);
                        ctx.strokeStyle = 'rgba(0,255,136,0.08)';
                        for (let x = 0; x < c.width; x += 40) {
                            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
                        }
                    } catch (e) {}
                };

                // (image will be loaded after the API is attached below)
                // reposition on resize/scroll
                const reposition = () => {
                    try {
                        const r = mainFlex.getBoundingClientRect();
                        const statsNow = statsCanvas ? statsCanvas.getBoundingClientRect() : null;
                        const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
                        const scrollLeftNow = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
                        const charNow = charCanvas ? charCanvas.getBoundingClientRect() : null;
                        const invNow = invCanvas ? invCanvas.getBoundingClientRect() : null;
                        const SHIFT_LEFT_PX_NOW = 6;
                        const SHIFT_RIGHT_PX_NOW = 6;
                        const leftNowRaw = charNow ? Math.round(charNow.left + scrollLeftNow) : Math.round(r.left + scrollLeftNow);
                        const rightNowRaw = invNow ? Math.round(invNow.right + scrollLeftNow) : Math.round(r.right + scrollLeftNow);
                        const leftNow = Math.max(0, leftNowRaw - SHIFT_LEFT_PX_NOW);
                        const rightNow = Math.max(0, rightNowRaw - SHIFT_RIGHT_PX_NOW);
                        const widthNow = Math.max(0, rightNow - leftNow);
                        const heightNow = Math.max(32, Math.round((statsNow ? statsNow.height : (statsCanvas ? (statsCanvas.height || statsCanvas.clientHeight) : 200)) / 2));
                        const changedSize = c.width !== widthNow || c.height !== heightNow;
                        c.style.left = leftNow + 'px';
                        c.style.top = Math.round(r.bottom + 8 + scrollTop) + 'px';
                        c.style.width = widthNow + 'px';
                        c.style.height = heightNow + 'px';
                        if (changedSize) {
                            c.width = widthNow;
                            c.height = heightNow;
                            if (typeof runor !== 'undefined' && runor && typeof runor.redrawRunorCanvas === 'function') runor.redrawRunorCanvas();
                            else ritaTomRunorBakgrund();
                        }
                    } catch (e) {}
                };
                window.addEventListener('resize', reposition);
                window.addEventListener('scroll', reposition);
                window.addEventListener('focus', () => requestAnimationFrame(reposition));
                window.addEventListener('pageshow', () => requestAnimationFrame(reposition));
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) requestAnimationFrame(reposition);
                });
                // Optionally draw a subtle grid or header
                try {
                    const ctx = c.getContext('2d');
                    if (ctx) {
                        ritaTomRunorBakgrund();
                        // Attach helpful API to `runor` for loading an image and marking regions
                        try {
                            const runorCtx = c.getContext('2d');
                            const offC = document.createElement('canvas');
                            const offCtx = offC.getContext('2d');
                            runor._runorCanvas = c;
                            runor._runorCtx = runorCtx;
                            runor._runorOffCanvas = offC;
                            runor._runorImage = null;
                            runor._runorRegions = []; // {id, x, y, w, h, enabled}
                            runor._hoveredRuneRegionId = null;
                            runor._hoveredRunePos = null;

                            runor.loadRunorImage = function(url, regions = []) {
                                try {
                                    console.log('[Runor] loading image:', url);
                                    const img = new Image();
                                    // Do not force crossOrigin here to avoid issues when running locally
                                    img.onload = function() {
                                        console.log('[Runor] image loaded:', url, 'size=', img.width, 'x', img.height);
                                        runor._runorImage = img;
                                        offC.width = img.width;
                                        offC.height = img.height;
                                        // create a grayscaled copy on the offscreen canvas
                                        offCtx.clearRect(0, 0, offC.width, offC.height);
                                        try { offCtx.filter = 'grayscale(100%)'; } catch (e) {}
                                        offCtx.drawImage(img, 0, 0);
                                        // store regions (image-coordinates)
                                        if (Array.isArray(regions) && regions.length > 0) {
                                            runor._runorRegions = regions.map(r => Object.assign({ enabled: true }, r));
                                        } else {
                                            // Auto-generate 24 regions in a single row with uneven widths
                                            const cols = 24;
                                            const regionsAuto = [];
                                            // Allow pixel widths to be specified directly, otherwise generate uneven widths.
                                            // If you want to hardcode pixel widths, set `runor._pixelWidths = [w0,w1,...]` before calling loadRunorImage.
                                            const pixelWidths = [];
                                            if (Array.isArray(runor._pixelWidths) && runor._pixelWidths.length === cols) {
                                                // Use provided pixel widths (ensure integers and at least 1px)
                                                for (let i = 0; i < cols; i++) pixelWidths.push(Math.max(1, Math.floor(runor._pixelWidths[i] || 0)));
                                                // If sum doesn't match image width, scale or distribute remainder
                                                let sumP = pixelWidths.reduce((s, v) => s + v, 0);
                                                if (sumP !== img.width) {
                                                    if (sumP < img.width) {
                                                        pixelWidths[pixelWidths.length - 1] += (img.width - sumP);
                                                    } else {
                                                        // scale down proportionally and fix rounding remainder
                                                        const scale = img.width / sumP;
                                                        for (let i = 0; i < pixelWidths.length; i++) pixelWidths[i] = Math.max(1, Math.floor(pixelWidths[i] * scale));
                                                        let s2 = pixelWidths.reduce((s, v) => s + v, 0);
                                                        pixelWidths[pixelWidths.length - 1] += (img.width - s2);
                                                    }
                                                }
                                            } else {
                                                // Create deterministic weight pattern and convert to pixel widths
                                                const weights = [];
                                                for (let i = 0; i < cols; i++) {
                                                    weights.push(1 + Math.sin(i * 0.7) * 0.6 + (i % 5) * 0.08);
                                                }
                                                const totalWeight = weights.reduce((s, v) => s + v, 0);
                                                for (let i = 0; i < cols; i++) pixelWidths.push(Math.max(1, Math.floor(img.width * weights[i] / totalWeight)));
                                                // Fix rounding remainder on last cell
                                                let sumP = pixelWidths.reduce((s, v) => s + v, 0);
                                                if (sumP !== img.width) pixelWidths[pixelWidths.length - 1] += (img.width - sumP);
                                            }
                                            let usedX = 0;
                                            let idCounter = 0;
                                            for (let cx = 0; cx < cols; cx++) {
                                                const w = Math.max(1, pixelWidths[cx] || 1);
                                                const x = usedX;
                                                const y = 0;
                                                const h2 = img.height;
                                                regionsAuto.push({ id: 'r' + idCounter++, x: x, y: y, w: w, h: h2, enabled: false });
                                                usedX += w;
                                            }
                                            runor._runorRegions = regionsAuto;
                                        }
                                        runor.redrawRunorCanvas();
                                    };
                                    img.onerror = function(ev) {
                                        try { console.warn('[Runor] failed to load image:', url, ev); } catch (e) {}
                                        runor._runorImage = null;
                                    };
                                    img.src = url;
                                } catch (e) { console.warn('[Runor] loadRunorImage exception', e); }
                            };

                            runor.defineRegion = function(id, x, y, w, h, enabled = true) {
                                runor._runorRegions.push({ id: id, x: x, y: y, w: w, h: h, enabled: enabled });
                                runor.redrawRunorCanvas();
                            };

                            runor.setRegionState = function(id, enabled) {
                                const r = runor._runorRegions.find(rr => rr.id === id);
                                if (r) { r.enabled = !!enabled; runor.redrawRunorCanvas(); }
                            };

                            runor.setRegionRune = function(id, runeId) {
                                const r = runor._runorRegions.find(rr => rr.id === id);
                                if (r) {
                                    r.runeId = runeId || null;
                                    runor.redrawRunorCanvas();
                                }
                            };

                            runor.enableAll = function() {
                                if (!runor._runorRegions) return;
                                runor._runorRegions.forEach(rr => rr.enabled = true);
                                runor.redrawRunorCanvas();
                            };

                            runor.disableAll = function() {
                                if (!runor._runorRegions) return;
                                runor._runorRegions.forEach(rr => rr.enabled = false);
                                runor.redrawRunorCanvas();
                            };

                            runor.toggleRegionAt = function(px, py) {
                                return false;
                            };

                            runor.redrawRunorCanvas = function() {
                                try {
                                    const ctx2 = runor._runorCtx;
                                    const img = runor._runorImage;
                                    if (!ctx2) return;
                                    ctx2.clearRect(0, 0, c.width, c.height);
                                    if (img) {
                                        ctx2.filter = 'none';
                                        ctx2.drawImage(img, 0, 0, c.width, c.height);
                                        for (let r of runor._runorRegions) {
                                            // scaled destination rect
                                            const dx = Math.round(r.x * c.width / img.width);
                                            const dy = Math.round(r.y * c.height / img.height);
                                            const dw = Math.max(1, Math.round(r.w * c.width / img.width));
                                            const dh = Math.max(1, Math.round(r.h * c.height / img.height));
                                            if (!r.enabled) {
                                                // draw grayscale portion from offscreen onto the canvas
                                                try { ctx2.drawImage(offC, r.x, r.y, r.w, r.h, dx, dy, dw, dh); } catch (e) {}
                                                // subtle dark overlay to indicate "off"
                                                ctx2.fillStyle = 'rgba(0,0,0,0.25)';
                                                ctx2.fillRect(dx, dy, dw, dh);
                                            }
                                            // optional border for clarity
                                            ctx2.strokeStyle = 'rgba(255,255,255,0.12)';
                                            ctx2.lineWidth = 1;
                                            ctx2.strokeRect(dx, dy, dw, dh);
                                        }

                                        const hoveredId = runor._hoveredRuneRegionId;
                                        const hoveredPos = runor._hoveredRunePos;
                                        if (hoveredId && hoveredPos) {
                                            const hoveredRegion = runor._runorRegions.find(rr => rr.id === hoveredId && rr.enabled);
                                            const runeId = hoveredRegion ? (hoveredRegion.runeId || hoveredRegion.id) : null;
                                            const runeDef = runeId ? runor.getRune(runeId) : null;
                                            if (hoveredRegion && runeDef) {
                                                const tooltipTitel = runeDef.namn || runeId;
                                                const tooltipText = runeDef.beskrivning || 'Ingen beskrivning tillgänglig.';
                                                const maxTextBredd = 260;
                                                const rader = [];
                                                const ord = String(tooltipText).split(' ');
                                                let rad = '';
                                                ctx2.font = '12px Arial';
                                                for (const ordet of ord) {
                                                    const test = rad ? (rad + ' ' + ordet) : ordet;
                                                    if (ctx2.measureText(test).width > maxTextBredd && rad) {
                                                        rader.push(rad);
                                                        rad = ordet;
                                                    } else {
                                                        rad = test;
                                                    }
                                                }
                                                if (rad) rader.push(rad);

                                                ctx2.font = 'bold 14px Arial';
                                                let boxW = Math.max(160, ctx2.measureText(tooltipTitel).width + 24);
                                                ctx2.font = '12px Arial';
                                                for (const line of rader) boxW = Math.max(boxW, ctx2.measureText(line).width + 24);
                                                const lineH = 16;
                                                const boxH = 16 + 22 + (rader.length * lineH) + 14;
                                                let boxX = Math.round((hoveredPos.x || 0) + 16);
                                                let boxY = Math.round((hoveredPos.y || 0) - boxH / 2);
                                                if (boxX + boxW > c.width - 4) boxX = Math.max(4, Math.round((hoveredPos.x || 0) - boxW - 16));
                                                if (boxY < 4) boxY = 4;
                                                if (boxY + boxH > c.height - 4) boxY = Math.max(4, c.height - boxH - 4);

                                                ctx2.save();
                                                ctx2.fillStyle = 'rgba(8, 18, 24, 0.96)';
                                                ctx2.strokeStyle = 'rgba(0,255,136,0.85)';
                                                ctx2.lineWidth = 2;
                                                ctx2.fillRect(boxX, boxY, boxW, boxH);
                                                ctx2.strokeRect(boxX, boxY, boxW, boxH);
                                                ctx2.fillStyle = '#9fffd7';
                                                ctx2.font = 'bold 14px Arial';
                                                ctx2.textAlign = 'left';
                                                ctx2.textBaseline = 'top';
                                                ctx2.fillText(tooltipTitel, boxX + 12, boxY + 10);
                                                ctx2.fillStyle = '#ffffff';
                                                ctx2.font = '12px Arial';
                                                let textY = boxY + 34;
                                                for (const line of rader) {
                                                    ctx2.fillText(line, boxX + 12, textY);
                                                    textY += lineH;
                                                }
                                                ctx2.restore();
                                            }
                                        }
                                    } else {
                                        // fallback: redraw subtle grid if no image
                                        ctx2.fillStyle = 'rgba(0,0,0,0.15)';
                                        ctx2.fillRect(0, 0, c.width, c.height);
                                        ctx2.strokeStyle = 'rgba(0,255,136,0.08)';
                                        for (let x = 0; x < c.width; x += 40) {
                                            ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, c.height); ctx2.stroke();
                                        }
                                    }
                                } catch (e) {}
                            };

                            // Provide default pixel widths for the 24 regions so the user can tweak them later.
                            try {
                                if (!Array.isArray(runor._pixelWidths) || runor._pixelWidths.length !== 24) {
                                    runor._pixelWidths = [95,73,66,74,82,65,58,66,80,62,60,80,80,60,75,74,66,68,65,85,64,76,75,90];
                                }
                            } catch (e) {}
                            // Now that the API exists, try loading the default image
                            try { if (typeof runor !== 'undefined' && runor && typeof runor.loadRunorImage === 'function') runor.loadRunorImage('assets/Runor.png'); } catch (e) {}

                            c.addEventListener('mousemove', function(ev) {
                                try {
                                    const rectCanvas = c.getBoundingClientRect();
                                    const scaleX = rectCanvas.width > 0 ? (c.width / rectCanvas.width) : 1;
                                    const scaleY = rectCanvas.height > 0 ? (c.height / rectCanvas.height) : 1;
                                    const px = (ev.clientX - rectCanvas.left) * scaleX;
                                    const py = (ev.clientY - rectCanvas.top) * scaleY;
                                    const imgNow = runor._runorImage;
                                    let nextRegionId = null;
                                    if (imgNow && Array.isArray(runor._runorRegions)) {
                                        for (const region of runor._runorRegions) {
                                            if (!region || !region.enabled) continue;
                                            const dx = Math.round(region.x * c.width / imgNow.width);
                                            const dy = Math.round(region.y * c.height / imgNow.height);
                                            const dw = Math.max(1, Math.round(region.w * c.width / imgNow.width));
                                            const dh = Math.max(1, Math.round(region.h * c.height / imgNow.height));
                                            const runeId = region.runeId || region.id;
                                            if (runeId && runor.getRune(runeId) && px >= dx && px <= dx + dw && py >= dy && py <= dy + dh) {
                                                nextRegionId = region.id;
                                                break;
                                            }
                                        }
                                    }
                                    const changed = runor._hoveredRuneRegionId !== nextRegionId;
                                    runor._hoveredRuneRegionId = nextRegionId;
                                    runor._hoveredRunePos = nextRegionId ? { x: px, y: py } : null;
                                    if (changed) runor.redrawRunorCanvas();
                                } catch (e) {}
                            });

                            c.addEventListener('mouseleave', function() {
                                try {
                                    if (runor._hoveredRuneRegionId || runor._hoveredRunePos) {
                                        runor._hoveredRuneRegionId = null;
                                        runor._hoveredRunePos = null;
                                        runor.redrawRunorCanvas();
                                    }
                                } catch (e) {}
                            });
                        } catch (e) {}
                    }
                } catch (e) {}
            } catch (e) {}
        };
        if (document.readyState === 'complete' || document.readyState === 'interactive') setupRunorCanvas();
        else window.addEventListener('DOMContentLoaded', setupRunorCanvas);
    }
} catch (e) {}
