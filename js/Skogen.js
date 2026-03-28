class Skogen {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);

        this.bakgrund = new Image();
        this.bakgrundLaddad = false;
        this.bakgrund.onload = () => { this.bakgrundLaddad = true; };
        this.bakgrund.onerror = () => { console.log('Kunde inte ladda Skogen-bild från: ' + (this.bakgrund && this.bakgrund.src ? this.bakgrund.src : 'assets/platser/Skogen1.png')); };

        // Which Skogen-variant to show; can be set externally (e.g. game.js sets `skogen.startOmradeNamn`)
        this.startOmradeNamn = null;

        this.spawnX = Math.round(this.canvas.width / 2);
        this.spawnY = Math.round(this.canvas.height - 80);
        this.eKnappNedtryckt = false;

        this.minSpelarSkala = 0.2;
        this.maxSpelarSkala = 1.5;
        this.minHastighetMult = 0.1;
        this.maxHastighetMult = 1;

        // Enkel utgångs-rect längst ner i scenen
        const w = this.canvas.width;
        const h = this.canvas.height;
        // Remove the bottom exit in all Skogen variants; keep center exits / thresholds only
        this.exitRect = null;
        // Inner threshold (center) that can lead deeper into the forest variants
        this.innerThreshold = { x: Math.round(w / 2 - 40), y: Math.round(h / 2 - 40), bredd: 80, hojd: 80, meddelande: 'Tryck Enter för att gå djupare' };
        this.innerTarget = null; // computed per-variant in visa()
        // Center exit for Skogen1 that returns to the map
        this.centerExit = { x: Math.round(w / 2 - 32), y: Math.round(h / 2 - 32), bredd: 64, hojd: 64, meddelande: 'Tryck Enter för att lämna skogen' };
        // Whether the centerExit was set by user code (don't overwrite when recomputing defaults)
        this._centerExitOverride = false;
        // Barriers array (populated in visa())
        this.barriers = [];
        // Whether barriers/thresholds/center-exit should be drawn (can be toggled at runtime)
        this.showBarriers = false;
        this.showThresholds = false;
        this.showCenterExit = false;
        // Optional per-variant innerThreshold overrides (can be set at runtime)
        this.thresholdPositions = {};
        // Random event system: default 11 events can be registered/overridden
        this.randomEvents = [];
        this._lastRandomEventId = null;
        this._lastRandomEventDescription = null;
        this._randomEventTriggeredForThisVisit = false;
        this._initDefaultRandomEvents();
        // How many empty bottles may be refilled at the lake per visit
        this._lakeRefillsRemaining = 0;
        // Transient loot messages to show when chests are opened
        this._lootMessages = [];
        this._lootMessageDuration = 5000; // ms (changed from 3000 to 5000)
        // Yggdrasil in-panel menu state
        this._yggMenuVisible = false;
        this._yggMenuItems = [];
        this._yggMenuIndex = 0;
        this._yggMenuPrimed = false;
        // Altare interaction menu state
        this._altarMenuVisible = false;
        this._altarMenuItems = [];
        this._altarMenuIndex = 0;
        this._activeAltar = null;
        // Altare offer submenu (for 'Offra ett föremål')
        this._altarOfferMenuVisible = false;
        this._altarOfferMenuItems = [];
        this._altarOfferMenuIndex = 0;
        this._altarOfferMode = null; // e.g. 'blota'
        this._altarMenuPrevItems = null;
        // Sjö (lake) left-side menu state
        this._sjoMenuVisible = false;
        this._sjoMenuItems = [];
        this._sjoMenuIndex = 0;
        this._sjoMenuPrimed = false;
        // Store last drawn panel state to avoid noisy render logs
        this._lastSjoPanelState = null;
        this._sjoMenuWasVisibleLastFrame = false;
        // Global one-time-use flags for altar resource exchanges (shared across all altars)
        this._globalAltarOffersUsed = { jarn: false, sten: false, tra: false };
        // Known top-level worlds that can be shown in Yggdrasil menu (configurable)
        this._knownWorlds = ['Midgård', 'Alvheim', 'Asgård', 'Vanaheim', 'Jotunheim', 'Niflheim', 'Muspelheim'];
        // Load default sprites from assets/skogen for spawned objects
        this._skogenSprites = {
            kista: { img: new Image(), loaded: false },
            kista_open: { img: new Image(), loaded: false },
            altare: { img: new Image(), loaded: false },
            ragnar_kista: { img: new Image(), loaded: false }
            ,ragnar_kista_open: { img: new Image(), loaded: false }
        };
        // Default sizes for spawned objects (can be changed at runtime)
        // Leave kista default null so we draw chests at their sprite natural size (1:1)
        this._defaultSpawnSizes = {
            kista: null,
            // Altare default size set to null to use sprite natural size (1:1)
            altare: null
        };
        // Altare scale multiplier (1 = sprite natural size)
        this._altareScale = 1;
        // Chest scale multiplier (1 = natural size)
        this._kistaScale = 0.15;
        // How close the player must be to interact with a chest (pixels). Smaller = must be nearer.
        this._kistaInteractionRadius = 0.5;
        // Whether Ragnar's special chest has been opened (prevents farming)
        this._ragnarKistaClaimed = false;
        // Snapshot of visited worlds at the time Ragnar's chest was last claimed
        this._ragnarVisitedSnapshot = null;
        this._ragnarVisitedStartIndex = null;
        // If any kistor already spawned, scale them up to match the new default (x3)
        try {
            if (Array.isArray(this._spawnedObjects)) {
                for (const o of this._spawnedObjects) {
                    if (!o) continue;
                    if (o.type === 'kista') {
                            // Do not forcibly scale existing chests here; we'll draw using sprite natural size (1:1)
                            try {
                                if (!o._shiftedForChestOffset) {
                                    if (typeof o.x === 'number') o.x = Math.round(o.x + 50);
                                    if (typeof o.y === 'number') o.y = Math.round(o.y - 100);
                                    o._shiftedForChestOffset = true;
                                }
                            } catch (e) {}
                        }
                    if (o.type === 'altare') {
                        try {
                            if (typeof o.bredd === 'number') o.bredd = Math.round(o.bredd * 3);
                            if (typeof o.hojd === 'number') o.hojd = Math.round(o.hojd * 3);
                            if (typeof o.width === 'number') o.width = Math.round(o.width * 3);
                            if (typeof o.height === 'number') o.height = Math.round(o.height * 3);
                        } catch (e) {}
                    }
                }
            }
        } catch (e) {}
        // Loot on ground (trä) similar to Stigen
        this.varorPaMarken = [];
        // Persist fynd per Skogen-variant so each Skogen1..Skogen5 can have its own fynd
        this._fyndByVariant = {};
        // Track whether we've attempted initial spawn for a given variant (prevents automatic respawn)
        this._spawnedFyndAttempted = {};
        this.narmasteFynd = null;
        this.itemIkonCache = {};
        try {
            this._skogenSprites.kista.img.onload = () => { this._skogenSprites.kista.loaded = true; };
            this._skogenSprites.kista.img.onerror = () => { /* silent fallback */ };
            this._skogenSprites.kista.img.src = 'assets/skogen/KistaStängd.png';

            this._skogenSprites.altare.img.onload = () => { this._skogenSprites.altare.loaded = true; };
            this._skogenSprites.altare.img.onerror = () => { };
            this._skogenSprites.altare.img.src = 'assets/skogen/Altare.png';

            this._skogenSprites.ragnar_kista.img.onload = () => { this._skogenSprites.ragnar_kista.loaded = true; };
            this._skogenSprites.ragnar_kista.img.onerror = () => { };
            this._skogenSprites.ragnar_kista.img.src = 'assets/skogen/RagnarLodbroksKistaStängd.png';
            // open variants
            try {
                this._skogenSprites.kista_open.img.onload = () => { this._skogenSprites.kista_open.loaded = true; };
                this._skogenSprites.kista_open.img.onerror = () => { };
                this._skogenSprites.kista_open.img.src = 'assets/skogen/KistaÖppen.png';

                this._skogenSprites.ragnar_kista_open.img.onload = () => { this._skogenSprites.ragnar_kista_open.loaded = true; };
                this._skogenSprites.ragnar_kista_open.img.onerror = () => { };
                this._skogenSprites.ragnar_kista_open.img.src = 'assets/skogen/RagnarLodbroksKistaÖppen.png';
            } catch (e) {}
            // (Removed transient loot rendering from constructor — rendering happens in rita())
        } catch (e) {}
        // Update Gestalter system (proximity checks, AI, pending missions)
        try {
            const gest = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
            if (gest) {
                try { if (typeof gest.kontrolleraNarhet === 'function') gest.kontrolleraNarhet(spelare.x, spelare.y); } catch (e) {}
                try { if (typeof gest.uppdatera === 'function') gest.uppdatera(spelare); } catch (e) {}
                try { if (typeof gest.rensaDeadGestals === 'function') gest.rensaDeadGestals(); } catch (e) {}
            }
        } catch (e) {}
        // Global keydown fallback: ensure E picks up nearest fynd even if other handlers miss it
        try {
            this._onGlobalKeyDown = (ev) => {
                try {
                    if (!this.visas) return;
                    if (!ev || !ev.key) return;
                    if (ev.repeat) return;
                    if (this.eKnappNedtryckt) return;
                    if (ev.key === 'e' || ev.key === 'E') {
                        try { ev.preventDefault(); } catch (e) {}
                        const sp = this.hamtaSpelare();
                        try { if (sp) this.kontrolleraFynd(sp.x, sp.y); } catch (e) {}
                        if (this.narmasteFynd) {
                            this.eKnappNedtryckt = true;
                            try { this.plockaUppFynd(this.narmasteFynd); } catch (e) {}
                        }
                    }
                } catch (e) {}
            };
            try { document.addEventListener('keydown', this._onGlobalKeyDown); } catch (e) {}
        } catch (e) {}
    }

    // --- Ground loot (trä) utilities adapted from Stigen ---
    hamtaSlumpadDropPlats(radie, centerX, centerY) {
        const canvas = this.canvas;
        if (!canvas) return null;
        const attempts = 60;
        for (let i = 0; i < attempts; i++) {
            let x, y;
            // If a center is provided, sample uniformly inside the circle with given radie
            if (typeof centerX === 'number' && typeof centerY === 'number') {
                const t = Math.random();
                const r = (radie || 25) * Math.sqrt(t);
                const ang = Math.random() * Math.PI * 2;
                x = Math.round(centerX + r * Math.cos(ang));
                y = Math.round(centerY + r * Math.sin(ang));
            } else {
                x = 40 + Math.floor(Math.random() * Math.max(0, canvas.width - 80));
                y = 100 + Math.floor(Math.random() * Math.max(0, canvas.height - 200));
            }
            try {
                if (!this.kolliderarPos(x, y, radie)) return { x: x, y: y };
            } catch (e) {}
        }
        return null;
    }

    hamtaIkonBild(src) {
        if (!src) return null;
        if (!this.itemIkonCache) this.itemIkonCache = {};
        const key = String(src);
        if (this.itemIkonCache[key]) return this.itemIkonCache[key];
        const img = new Image();
        // Try a small set of sensible alternates on error (växla a<->ä, strip diacritics)
        img._alternates = img._alternates || [];
        const alternates = [];
        try {
            // a <-> ä swap for common 'tra' vs 'trä'
            try {
                alternates.push(key.replace(/tra\.png$/i, 'trä.png'));
            } catch (e) {}
            try {
                alternates.push(key.replace(/trä\.png$/i, 'tra.png'));
            } catch (e) {}
            // strip diacritics from filename
            try {
                const url = String(key);
                const parts = url.split('/');
                const fname = parts.pop();
                const stripped = fname.normalize('NFD').replace(/\p{Diacritic}/gu, '');
                alternates.push(parts.concat([stripped]).join('/'));
            } catch (e) {}
        } catch (e) {}
        // filter unique and valid
        const uniq = []; for (const a of alternates) { if (a && a !== key && uniq.indexOf(a) === -1) uniq.push(a); }
        img._alternates = uniq;
        img.addEventListener('error', function onErr() {
            try {
                if (!img._alternates || img._alternates.length === 0) return;
                if (img._triedAltIndex == null) img._triedAltIndex = 0;
                if (img._triedAltIndex >= img._alternates.length) return;
                const next = img._alternates[img._triedAltIndex++];
                if (next) img.src = next;
            } catch (e) {}
        });
        img.addEventListener('load', function onLoad() {
            try { console.log('[Skogen] hamtaIkonBild loaded', key, 'finalSrc=', img.src); } catch (e) {}
        });
        img.addEventListener('error', function onFinalErr() {
            try { console.log('[Skogen] hamtaIkonBild failed to load', key, 'triedAlternates=', img._alternates); } catch (e) {}
        });
        img.src = key;
        this.itemIkonCache[key] = img;
        return img;
    }

    hamtaFyndDef(id) {
        const spelare = this.hamtaSpelare();
        if (spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal) {
            return spelare.utrustning.tillgangligaForemal[id] || null;
        }
        return null;
    }

    byggLootPopupItems(kallor) {
        const resultat = [];
        const laggTill = (itemId, antal = 1) => {
            if (!itemId) return;
            const foremal = this.hamtaFyndDef(itemId);
            if (!foremal || !foremal.ikon) return;
            resultat.push({ id: itemId, icon: foremal.ikon, count: Math.max(1, antal || 1) });
        };

        if (Array.isArray(kallor)) {
            for (const kalla of kallor) {
                if (!kalla) continue;
                if (typeof kalla === 'string') {
                    laggTill(kalla, 1);
                    continue;
                }
                if (typeof kalla === 'object' && kalla.id) {
                    laggTill(kalla.id, kalla.qty || kalla.count || 1);
                }
            }
        } else if (typeof kallor === 'string') {
            laggTill(kallor, 1);
        } else if (kallor && typeof kallor === 'object' && kallor.id) {
            laggTill(kallor.id, kallor.qty || kallor.count || 1);
        }

        return resultat;
    }

    skapaLootPopup(text, x, y, itemId = null, antal = 1, pengar = null, lootItems = null) {
        const popup = {
            text: text || '',
            created: Date.now(),
            duration: this._lootMessageDuration,
            x: (typeof x === 'number') ? x : null,
            y: (typeof y === 'number') ? y : null
        };
        if (Array.isArray(lootItems) && lootItems.length > 0) {
            popup.items = lootItems;
            return popup;
        }
        if (pengar) {
            const valutor = [
                { key: 'guld', antal: pengar.guld || 0, ikon: 'assets/Ikoner/Guld.png' },
                { key: 'silver', antal: pengar.silver || 0, ikon: 'assets/Ikoner/Silver.png' },
                { key: 'koppar', antal: pengar.koppar || 0, ikon: 'assets/Ikoner/Koppar.png' }
            ].filter((valuta) => valuta.antal > 0);
            if (valutor.length > 0) {
                popup.valutor = valutor;
                return popup;
            }
        }
        const foremal = itemId ? this.hamtaFyndDef(itemId) : null;
        if (foremal && foremal.ikon) {
            popup.icon = foremal.ikon;
            popup.count = Math.max(1, antal || 1);
        }
        return popup;
    }

    _spawnTraFynd() {
        try {
            // spawn 1-4 trä in this room (only on first attempt per-variant)
            const variant = this.startOmradeNamn || 'Skogen1';
            // Clear existing varorPaMarken so previous-variant fynd don't carry over
            try { this.varorPaMarken = []; } catch (e) {}
            // Never spawn wood in special rooms.
            if (variant === 'Sjö' || variant === 'Sjo' || variant === 'Yggdrasil') {
                try { if (!this._fyndByVariant) this._fyndByVariant = {}; this._fyndByVariant[variant] = []; } catch (e) {}
                try { this._spawnedFyndAttempted = this._spawnedFyndAttempted || {}; this._spawnedFyndAttempted[variant] = true; } catch (e) {}
                return;
            }
            // If we have persisted fynd for this variant (even empty array), restore it and mark attempted
            try {
                if (this._fyndByVariant && Object.prototype.hasOwnProperty.call(this._fyndByVariant, variant)) {
                    this.varorPaMarken = (Array.isArray(this._fyndByVariant[variant]) ? this._fyndByVariant[variant].map(f => Object.assign({}, f)) : []);
                    this._spawnedFyndAttempted[variant] = true;
                    return;
                }
            } catch (e) {}
            // If we've already attempted spawn for this variant (and there was no persisted fynd), do not auto-spawn again
            try { if (this._spawnedFyndAttempted && this._spawnedFyndAttempted[variant]) return; } catch (e) {}
            const count = 1 + Math.floor(Math.random() * 4);
            const radie = 25;
            const positions = [
                { x: 400, y: 500 },
                { x: 350, y: 475 },
                { x: 475, y: 450 }
            ];
            const chosen = positions[Math.floor(Math.random() * positions.length)] || positions[0];
            const arr = [
                { id: 'tra', x: chosen.x, y: chosen.y, count: count, radie: radie, icon: 'assets/Varor/Trä.png' }
            ];
            try { console.log('[Skogen] _spawnTraFynd spawned trä at', chosen, 'count=', count); } catch (e) {}
            this.varorPaMarken = arr;
            try { if (!this._fyndByVariant) this._fyndByVariant = {}; this._fyndByVariant[variant] = arr.map(f => Object.assign({}, f)); } catch (e) {}
            try { this._spawnedFyndAttempted = this._spawnedFyndAttempted || {}; this._spawnedFyndAttempted[variant] = true; } catch (e) {}
        } catch (e) {}
    }

    // Prepare variant spawn state: clear persisted fynd and mark as not attempted so a fresh spawn occurs
    _prepareVariantSpawn(variant) {
        try {
            if (!variant) variant = this.startOmradeNamn || null;
            try { if (this._fyndByVariant && Object.prototype.hasOwnProperty.call(this._fyndByVariant, variant)) delete this._fyndByVariant[variant]; } catch (e) {}
            try { this._spawnedFyndAttempted = this._spawnedFyndAttempted || {}; this._spawnedFyndAttempted[variant] = false; } catch (e) {}
        } catch (e) {}
    }

    plockaUppFynd(fynd) {
        const spelare = this.hamtaSpelare();
        if (!spelare || !spelare.utrustning) return;

        let kvar = fynd.count || 1;
        // Try adding by original id, then alternatives (ä <-> a) if the first fails
        const tryAddId = (id) => {
            try {
                if (!id) return false;
                // Try exact id first
                if (typeof spelare.utrustning.laggTillForemal === 'function') {
                    const res = spelare.utrustning.laggTillForemal(id);
                    if (res) return true;
                }
                if (typeof spelare.utrustning.laggTillForemalObj === 'function') {
                    const r = spelare.utrustning.laggTillForemalObj({ id: id, count: 1 });
                    if (r) return true;
                }
            } catch (e) {}
            return false;
        };
        while (kvar > 0) {
            let lyckades = tryAddId(fynd.id);
            if (!lyckades) {
                // try swap a <-> ä
                try { const alt = String(fynd.id).replace(/tra$/i, 'trä'); if (alt !== fynd.id) lyckades = tryAddId(alt); } catch (e) {}
            }
            if (!lyckades) {
                try { const alt2 = String(fynd.id).normalize('NFD').replace(/\p{Diacritic}/gu, ''); if (alt2 !== fynd.id) lyckades = tryAddId(alt2); } catch (e) {}
            }
            if (!lyckades) {
                // try lower/upper variants
                try { if (String(fynd.id).toLowerCase() !== fynd.id) lyckades = tryAddId(String(fynd.id).toLowerCase()); } catch (e) {}
            }
            if (!lyckades) {
                try { if (String(fynd.id).toUpperCase() !== fynd.id) lyckades = tryAddId(String(fynd.id).toUpperCase()); } catch (e) {}
            }
            if (!lyckades) {
                // final fallback: attempt adding raw object id
                try { if (typeof spelare.utrustning.laggTillForemalObj === 'function') lyckades = !!spelare.utrustning.laggTillForemalObj({ id: fynd.id, count: 1 }); } catch (e) {}
            }
            if (!lyckades) break;
            kvar -= 1;
        }

        if (kvar <= 0) {
            // remove matching fynd from ground; prefer direct identity, fallback to match by id+coords
            let index = this.varorPaMarken.indexOf(fynd);
            if (index < 0) {
                for (let i = 0; i < (this.varorPaMarken || []).length; i++) {
                    const f = this.varorPaMarken[i];
                    try {
                        if (!f) continue;
                        if (f.id === fynd.id && Math.round(f.x) === Math.round(fynd.x) && Math.round(f.y) === Math.round(fynd.y)) { index = i; break; }
                    } catch (e) {}
                }
            }
            if (index >= 0) this.varorPaMarken.splice(index, 1);
            this.narmasteFynd = null;
            // also remove from persisted per-variant fynd if present
            try {
                const variant = this.startOmradeNamn || null;
                if (variant && this._fyndByVariant && Array.isArray(this._fyndByVariant[variant])) {
                    for (let i = this._fyndByVariant[variant].length - 1; i >= 0; i--) {
                        const f = this._fyndByVariant[variant][i];
                        try {
                            if (f && f.id === fynd.id && Math.round(f.x) === Math.round(fynd.x) && Math.round(f.y) === Math.round(fynd.y)) {
                                this._fyndByVariant[variant].splice(i, 1);
                            }
                        } catch (e) {}
                    }
                }
            } catch (e) {}
            try { console.log('[Skogen] plockaUppFynd succeeded, removed fynd', fynd); } catch (e) {}
        } else {
            fynd.count = kvar;
            try { console.log('[Skogen] plockaUppFynd partially added, remaining=', kvar, 'for', fynd); } catch (e) {}
        }
    }

    ritaFynd(playerBottomY, topOnly) {
        try {
            const ctx = this.ctx;
            if (!ctx) return;
            for (const fynd of this.varorPaMarken || []) {
                try {
                    if (typeof playerBottomY === 'number') {
                        const fyBottom = fynd.y + ((fynd.radie || 24) / 2);
                        if (topOnly && fyBottom >= playerBottomY) continue;
                        if (!topOnly && fyBottom < playerBottomY) continue;
                    }
                } catch (e) {}
                const ikon = this.hamtaIkonBild((fynd.icon || 'assets/Varor/Trä.png'));
                const storlek = 36;
                const x = Math.round(fynd.x - storlek / 2);
                const y = Math.round(fynd.y - storlek / 2);
                if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                    try { ctx.drawImage(ikon, x, y, storlek, storlek); } catch (e) {}
                } else {
                    ctx.fillStyle = '#a0522d';
                    ctx.beginPath();
                    ctx.arc(fynd.x, fynd.y, 12, 0, Math.PI * 2);
                    ctx.fill();
                }

                // If this is the nearest pickable fynd, draw a hint above it
                try {
                    if (this.narmasteFynd === fynd) {
                        const hint = 'Tryck E för att plocka upp';
                        ctx.save();
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        const tw = ctx.measureText(hint).width;
                        const padX = 6; const padY = 4;
                        const hx = fynd.x; const hy = fynd.y - (storlek / 2) - 8;
                        ctx.fillStyle = 'rgba(0,0,0,0.7)';
                        ctx.fillRect(Math.round(hx - tw/2 - padX), Math.round(hy - 16 - padY), Math.round(tw + padX*2), Math.round(16 + padY*2));
                        ctx.fillStyle = 'white';
                        ctx.fillText(hint, hx, hy - padY);
                        ctx.restore();
                    }
                } catch (e) {}

                if (fynd.count && fynd.count > 1) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 3;
                    ctx.strokeText(String(fynd.count), fynd.x, fynd.y + 14);
                    ctx.fillText(String(fynd.count), fynd.x, fynd.y + 14);
                }
            }
            if (this.narmasteFynd) this.ritaGlitterMarkor(this.narmasteFynd);
        } catch (e) {}
    }

    ritaGlitterMarkor(fynd) {
        try {
            const ctx = this.ctx;
            const tid = Date.now() / 1000;
            const puls = 0.6 + Math.sin(tid * 4) * 0.3;
            const radie = (fynd.radie || 24) + 10 + Math.sin(tid * 2) * 4;
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 136, ${puls})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 8]);
            ctx.beginPath();
            ctx.arc(fynd.x, fynd.y, radie, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            for (let i = 0; i < 6; i++) {
                const vinkel = tid * 2 + i * (Math.PI * 2 / 6);
                const sx = fynd.x + Math.cos(vinkel) * (radie + 6);
                const sy = fynd.y + Math.sin(vinkel) * (radie + 6);
                ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
                ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        } catch (e) {}
    }

    kontrolleraFynd(spelareX, spelareY) {
        try {
            this.narmasteFynd = null;
            let minstaAvstand = Infinity;
            const list = (this.varorPaMarken || []);
            for (let i = 0; i < list.length; i++) {
                const fynd = list[i];
                const radie = fynd.radie || 24;
                const dx = spelareX - fynd.x;
                const dy = spelareY - fynd.y;
                const avstand = Math.sqrt(dx * dx + dy * dy);
                if (avstand <= radie && avstand < minstaAvstand) {
                    minstaAvstand = avstand;
                    this.narmasteFynd = fynd;
                }
            }
            // Throttled logging: only log when nearest changes or at most once every 5s
            try {
                if (typeof this._lastKontrollFyndNearestId === 'undefined') this._lastKontrollFyndNearestId = null;
                if (typeof this._lastKontrollFyndLogTime === 'undefined') this._lastKontrollFyndLogTime = 0;
                const now = Date.now();
                const nearestId = this.narmasteFynd ? (this.narmasteFynd.id || (this.narmasteFynd.x + '|' + this.narmasteFynd.y)) : null;
                if (nearestId !== this._lastKontrollFyndNearestId || (now - this._lastKontrollFyndLogTime) > 5000) {
                    this._lastKontrollFyndNearestId = nearestId;
                    this._lastKontrollFyndLogTime = now;
                    try { console.log('[Skogen] kontrolleraFynd nearest=', this.narmasteFynd ? { id: this.narmasteFynd.id, x: this.narmasteFynd.x, y: this.narmasteFynd.y } : null); } catch (e) {}
                }
            } catch (e) {}
        } catch (e) {}
    }

    _handleAltareInteract(o) {
        try {
            if (!o) return;
            // Open an interaction menu without permanently locking the altar for the rest of the visit.
            this._activeAltar = o;
            this._altarMenuVisible = true;
            this._altarMenuIndex = 0;
            // Ask external hook for menu items; fallback to sensible defaults
            let items = null;
            try {
                if (typeof window.aktiveraAltare === 'function') {
                    const res = window.aktiveraAltare(o);
                    if (Array.isArray(res) && res.length > 0) items = res;
                }
            } catch (e) {}
            if (!items) items = ['Be vid altaret', 'Offra ett föremål', 'Stäng'];
            this._altarMenuItems = items;
        } catch (e) {}
    }

    _primeSjoMenu() {
        try { this._lakeRefillsRemaining = 3; } catch (e) {}
        try {
            this._sjoMenuVisible = true;
            this._sjoMenuIndex = 0;
            this._sjoMenuPrimed = true;
            this._sjoMenuItems = ['Fiska', 'Fyll flaskor', 'Gå vidare'];
            if (typeof this._refreshSjoMenuLabels === 'function') this._refreshSjoMenuLabels();
        } catch (e) {}
    }

    _buildYggMenuItems() {
        try {
            const items = [];
            const g = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
            const visited = (g && Array.isArray(g.globalVisited)) ? g.globalVisited.slice() : [];
            const seen = new Set();
            for (let i = 0; i < visited.length; i++) {
                const name = visited[i];
                if (!name) continue;
                const n = String(name).trim();
                if (!n) continue;
                const low = n.toLowerCase();
                if (low === 'yggdrasil' || low === 'sjö' || low === 'sjo') continue;
                for (const kw of (this._knownWorlds || [])) {
                    if (!kw) continue;
                    if (kw.toLowerCase() === low && !seen.has(kw)) {
                        seen.add(kw);
                        items.push(kw);
                        break;
                    }
                }
            }
            return items;
        } catch (e) { return []; }
    }

    _primeYggMenu() {
        try {
            this._yggMenuItems = this._buildYggMenuItems();
            if (!Array.isArray(this._yggMenuItems)) this._yggMenuItems = [];
            if (this._yggMenuItems.indexOf('Gå vidare') === -1) this._yggMenuItems.push('Gå vidare');
            this._yggMenuIndex = 0;
            this._yggMenuVisible = true;
            this._yggMenuPrimed = true;
        } catch (e) {}
    }

    visa() {
        this.visas = true;
        try {
            this._altarMenuVisible = false;
            this._altarMenuItems = [];
            this._altarMenuIndex = 0;
            this._activeAltar = null;
            this._altarOfferMenuVisible = false;
            this._altarOfferMenuItems = [];
            this._altarOfferMenuIndex = 0;
            this._altarOfferMode = null;
            this._altarMenuPrevItems = null;
            this._globalAltarOffersUsed = { jarn: false, sten: false, tra: false };
            if (Array.isArray(this._spawnedObjects)) {
                for (const spawnedObject of this._spawnedObjects) {
                    if (spawnedObject && spawnedObject.type === 'altare') {
                        spawnedObject.used = false;
                    }
                }
            }
        } catch (e) {}
        // Choose background image based on startOmradeNamn if provided
        try {
            // Choose explicit image for each variant
            let imgName = 'Skogen1.png';
            if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo')) imgName = 'Sjö.png';
            if (this.startOmradeNamn === 'Yggdrasil') {
                // Yggdrasil uses a sprite inside assets/skogen; set directly
                if (!this.bakgrund || this.bakgrund.src.indexOf('Yggdrasil.png') === -1) {
                    this.bakgrundLaddad = false;
                    this.bakgrund.src = 'assets/skogen/Yggdrasil.png';
                }
            }
            if (this.startOmradeNamn === 'Skogen2') imgName = 'Skogen2.png';
            else if (this.startOmradeNamn === 'Skogen3') imgName = 'Skogen3.png';
            else if (this.startOmradeNamn === 'Skogen4') imgName = 'Skogen4.png';
            else if (this.startOmradeNamn === 'Skogen5') imgName = 'Skogen5.png';
            // Always (re-)set src so correct variant is loaded
            if (!this.bakgrund || this.bakgrund.src.indexOf(imgName) === -1) {
                this.bakgrundLaddad = false;
                this.bakgrund.src = 'assets/platser/' + imgName;
            }
            // Compute inner threshold target chain: 5->4->3->2->1
            if (this.startOmradeNamn === 'Skogen5') this.innerTarget = 'Skogen4';
            else if (this.startOmradeNamn === 'Skogen4') this.innerTarget = 'Skogen3';
            else if (this.startOmradeNamn === 'Skogen3') this.innerTarget = 'Skogen2';
            else if (this.startOmradeNamn === 'Skogen2') this.innerTarget = 'Skogen1';
            else this.innerTarget = null;
            // Clear previous saved Skogen state when entering a normal skogen variant
            try { if (!(this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo' || this.startOmradeNamn === 'Yggdrasil'))) this._previousSkogenState = null; } catch (e) {}
            // If this variant is the lake or Yggdrasil, expose a bottom/side exit instead of an inner threshold
            try {
                if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo' || this.startOmradeNamn === 'Yggdrasil')) {
                    const w = this.canvas.width;
                    const h = this.canvas.height;
                    try { this._resetSpecialRoomState(); } catch (e) {}
                    // place exit on the right-bottom area
                    this.exitRect = { x: Math.round(w - 140), y: Math.round(h - 100), bredd: 120, hojd: 64, meddelande: (this.startOmradeNamn === 'Yggdrasil' ? 'Tryck Enter för att lämna Yggdrasil' : 'Tryck Enter för att lämna sjön') };
                    // disable inner threshold for the lake
                    this.innerTarget = null;
                    if (this.startOmradeNamn === 'Yggdrasil') {
                        try { this._primeYggMenu(); } catch (e) {}
                        try { console.log('[Skogen] visa(): primed Yggdrasil menu, index=', this._yggMenuIndex, 'visible=', this._yggMenuVisible); } catch (e) {}
                    } else {
                        try { this._primeSjoMenu(); } catch (e) {}
                        try { console.log('[Skogen] visa(): primed lake menu, index=', this._sjoMenuIndex, 'visible=', this._sjoMenuVisible); } catch (e) {}
                    }
                } else {
                    try { this._sjoMenuVisible = false; this._sjoMenuItems = []; this._sjoMenuIndex = 0; this._sjoMenuPrimed = false; } catch (e) {}
                    try { this._yggMenuVisible = false; this._yggMenuItems = []; this._yggMenuIndex = 0; this._yggMenuPrimed = false; } catch (e) {}
                    // non-lake variants: clear legacy simple exit (we use centerExit/thresholds instead)
                    // leave this.exitRect alone if it's intentionally set elsewhere
                    if (this.exitRect && this.exitRect.meddelande && this.exitRect.meddelande.indexOf('sjön') !== -1) {
                        this.exitRect = null;
                    }
                }
            } catch (e) {}
        } catch (e) {}

        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.x = this.spawnX;
            spelare.y = this.spawnY;
            try { if (typeof animationer !== 'undefined' && animationer && spelare.klass) animationer.laddaAnimationer(spelare.klass.namn); } catch (e) {}
            try { if (typeof animationer !== 'undefined' && animationer && spelare.klass) animationer.uppdateraAnimering(spelare, false); } catch (e) {}
        }
        // Ensure visibility flags have sensible defaults but do not overwrite runtime overrides
        if (typeof this.showBarriers === 'undefined') this.showBarriers = false;
        if (typeof this.showThresholds === 'undefined') this.showThresholds = false;
        if (typeof this.showCenterExit === 'undefined') this.showCenterExit = false;
            // Compute barriers positioned relative to canvas size and variant
            try {
                this._updateBarriers();
            } catch (e) {}
            // Trigger a random event when entering the area (each visa() call)
            try { this._randomEventTriggeredForThisVisit = false; this._triggerRandomEvent(); } catch (e) {}
            // Spawn 1-4 trä-fynd for this visit
            try { this._prepareVariantSpawn(this.startOmradeNamn); this._spawnTraFynd(); } catch (e) {}
    }

    dolj() {
        try { this._cleanupSpawnedObjectsForVariant(null); } catch (e) {}
        try { this._removeGlobalListeners(); } catch (e) {}
        try { this._lootMessages = []; } catch (e) {}
        try {
            if (this.gestalter && typeof this.gestalter.rensaMeddelanden === 'function') {
                this.gestalter.rensaMeddelanden();
            }
        } catch (e) {}
        this.visas = false;
    }
    
    // Ensure we cleanup global listeners when hiding
    _removeGlobalListeners() {
        try { if (this._onGlobalKeyDown) { document.removeEventListener('keydown', this._onGlobalKeyDown); this._onGlobalKeyDown = null; } } catch (e) {}
    }

    // Remove spawned objects that do not belong to the given variant (keep persistent ones).
    // If variant is null, remove all non-persistent spawned objects (useful when leaving area).
    _cleanupSpawnedObjectsForVariant(variant) {
        try {
            if (!Array.isArray(this._spawnedObjects) || this._spawnedObjects.length === 0) return;
            const kept = [];
            for (const o of this._spawnedObjects) {
                if (!o) continue;
                if (o.persistent) { kept.push(o); continue; }
                if (variant === null) continue; // leaving area: drop non-persistent
                if (o.spawnedInVariant === variant) kept.push(o);
            }
            const remaining = kept;
            // Update loot messages: keep only those that are attached to remaining objects (match x/y)
            const posSet = new Set();
            for (const o of remaining) {
                if (!o) continue;
                if (typeof o.x === 'number' && typeof o.y === 'number') posSet.add(Math.round(o.x) + '|' + Math.round(o.y));
            }
            if (Array.isArray(this._lootMessages)) {
                this._lootMessages = this._lootMessages.filter(m => {
                    if (!m) return false;
                    if (typeof m.x === 'number' && typeof m.y === 'number') return posSet.has(Math.round(m.x) + '|' + Math.round(m.y));
                    return false;
                });
            }
            this._spawnedObjects = remaining;
        } catch (e) {}
    }

    _isRagnarChest(obj) {
        return !!(obj && obj.type === 'kista' && obj.special && typeof obj.special === 'string' && obj.special.toLowerCase().indexOf('ragnar') !== -1);
    }

    _dedupeRagnarChests(preferredVariant) {
        try {
            if (!Array.isArray(this._spawnedObjects) || this._spawnedObjects.length <= 1) return;
            const ragnarIndices = [];
            for (let i = 0; i < this._spawnedObjects.length; i++) {
                if (this._isRagnarChest(this._spawnedObjects[i])) ragnarIndices.push(i);
            }
            if (ragnarIndices.length <= 1) return;

            let keepIndex = ragnarIndices[ragnarIndices.length - 1];
            if (preferredVariant) {
                for (let i = ragnarIndices.length - 1; i >= 0; i--) {
                    const candidateIndex = ragnarIndices[i];
                    const candidate = this._spawnedObjects[candidateIndex];
                    if (candidate && candidate.spawnedInVariant === preferredVariant) {
                        keepIndex = candidateIndex;
                        break;
                    }
                }
            }

            this._spawnedObjects = this._spawnedObjects.filter((obj, index) => !this._isRagnarChest(obj) || index === keepIndex);
        } catch (e) {}
    }

    _hamtaGlobalVisitedRutor() {
        const g = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
        return (g && Array.isArray(g.globalVisited)) ? g.globalVisited.slice() : [];
    }

    _arRagnarGiltigRuta(rutaNamn) {
        if (!rutaNamn) return false;
        const low = String(rutaNamn).trim().toLowerCase();
        if (!low) return false;
        if (low.indexOf('skogen') === 0) return false;
        if (low === 'yggdrasil' || low === 'sjö' || low === 'sjo') return false;
        return true;
    }

    _hamtaRagnarUnikaRutor(list) {
        const seen = new Set();
        for (const rutaNamn of list || []) {
            if (!this._arRagnarGiltigRuta(rutaNamn)) continue;
            seen.add(String(rutaNamn).trim().toLowerCase());
        }
        return seen;
    }

    _hamtaRagnarBesokSedanCooldown() {
        try {
            const visited = this._hamtaGlobalVisitedRutor();
            if (typeof this._ragnarVisitedStartIndex === 'number' && this._ragnarVisitedStartIndex >= 0) {
                const slice = visited.slice(this._ragnarVisitedStartIndex);
                let count = 0;
                for (const rutaNamn of slice) {
                    if (this._arRagnarGiltigRuta(rutaNamn)) count++;
                }
                return count;
            }

            let eligibleCount = 0;
            for (const rutaNamn of visited) {
                if (this._arRagnarGiltigRuta(rutaNamn)) eligibleCount++;
            }
            const snap = (this._ragnarVisitedSnapshot instanceof Set)
                ? this._ragnarVisitedSnapshot
                : new Set(Array.isArray(this._ragnarVisitedSnapshot) ? this._ragnarVisitedSnapshot : []);
            return Math.max(0, eligibleCount - snap.size);
        } catch (e) {
            return 0;
        }
    }

    _startaRagnarCooldown() {
        try {
            const visited = this._hamtaGlobalVisitedRutor();
            this._ragnarVisitedSnapshot = this._hamtaRagnarUnikaRutor(visited);
            this._ragnarVisitedStartIndex = visited.length;
            this._ragnarKistaClaimed = true;
        } catch (e) {}
    }

    rita() {
        if (!this.visas) return;
        const ctx = this.ctx;
        const canvas = this.canvas;

        if (this.bakgrundLaddad) {
            ctx.drawImage(this.bakgrund, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#0b2b0b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Skogen', canvas.width / 2, canvas.height / 2);
        }

        const spelare = this.hamtaSpelare();
        // We'll draw spawned objects that are above the player first, then the player,
        // then spawned objects that are below the player so the player appears on top
        // when standing lower than a chest.
        const sp = spelare; // convenience alias used throughout
        // If no ground-loot exists for this variant and we haven't attempted spawn yet, try once.
        try {
            if (this.startOmradeNamn && String(this.startOmradeNamn).indexOf('Skogen') === 0) {
                const variant = this.startOmradeNamn;
                const attempted = (this._spawnedFyndAttempted && this._spawnedFyndAttempted[variant]);
                if (!attempted && (!Array.isArray(this.varorPaMarken) || this.varorPaMarken.length === 0)) {
                    try { this._prepareVariantSpawn(this.startOmradeNamn); this._spawnTraFynd(); } catch (e) {}
                }
            }
        } catch (e) {}

        // Visa Enter-hint när spelaren står i utgången
        try {
            const sp = this.hamtaSpelare();
            if (this.exitRect && sp) {
                const er = this.exitRect;
                const r = sp.storlek || (sp.storlek === 0 ? 0 : 15);
                const inside = (sp.x + r > er.x) && (sp.x - r < (er.x + er.bredd)) && (sp.y + r > er.y) && (sp.y - r < (er.y + er.hojd));
                if (inside) {
                    const msg = (er.meddelande || 'Tryck Enter för att lämna');
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
                    ctx.fillStyle = 'rgba(255,255,255,1)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(msg, centerX, bgY + bgH / 2);
                    ctx.restore();
                }
            }
            // Draw barriers
            try {
                if (this.showBarriers && Array.isArray(this.barriers)) {
                    for (const b of this.barriers) {
                        ctx.save();
                        const cx = b.x + (b.bredd || 0) / 2;
                        const cy = b.y + (b.hojd || 0) / 2;
                        ctx.translate(cx, cy);
                        const drawAngle = this._normalizeAngle(b.angle || 0);
                        if (drawAngle) ctx.rotate(drawAngle);
                        ctx.fillStyle = b.fill || 'rgba(80,40,20,0.6)';
                        ctx.strokeStyle = b.stroke || 'rgba(0,0,0,0.6)';
                        ctx.lineWidth = 2;
                        if (b.shape === 'ellipse') {
                            const a = (b.bredd || 0) / 2;
                            const bb = (b.hojd || 0) / 2;
                            ctx.beginPath();
                            ctx.ellipse(0, 0, a, bb, 0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                        } else {
                            ctx.fillRect(- (b.bredd || 0) / 2, - (b.hojd || 0) / 2, b.bredd, b.hojd);
                            ctx.strokeRect(- (b.bredd || 0) / 2, - (b.hojd || 0) / 2, b.bredd, b.hojd);
                        }
                        ctx.restore();
                    }
                }
            } catch (e) {}
            // Draw spawned objects (kistor, altare) using assets/skogen sprites when available.
            try {
                const objs = Array.isArray(this._spawnedObjects) ? this._spawnedObjects.slice() : [];
                const altarObjs = [];
                const topObjs = [];
                const bottomObjs = [];
                // compute player's visual scale and bottom Y (approximate using `storlek` as half-height)
                let playerScale = 1;
                let playerBottomY = null;
                if (sp) {
                    try {
                        const clampY = Math.max(0, Math.min(canvas.height, sp.y));
                        const t = clampY / canvas.height;
                        playerScale = this.minSpelarSkala + (this.maxSpelarSkala - this.minSpelarSkala) * t;
                        const halfH = (typeof sp.storlek === 'number') ? sp.storlek : 15;
                        playerBottomY = sp.y + (halfH * playerScale);
                    } catch (e) { playerBottomY = sp.y || 0; }
                }
                if (sp) {
                    for (const o of objs) {
                        if (!o) continue;
                        const oy = (typeof o.y === 'number') ? o.y : 0;
                        try {
                            if (o.type === 'kista') {
                                // compute chest bottom as before
                                const defaultSize = Math.round(Math.max(32, Math.min(96, this.canvas.width * 0.06)));
                                const drawH = (typeof o.hojd === 'number') ? o.hojd : (typeof o.height === 'number' ? o.height : defaultSize);
                                const sClosed = this._skogenSprites && this._skogenSprites[(o.special ? 'ragnar_kista' : 'kista')];
                                let chestH = drawH;
                                try { if (typeof o.hojd !== 'number' && sClosed && sClosed.loaded && sClosed.img && sClosed.img.naturalHeight) chestH = sClosed.img.naturalHeight; } catch (e) {}
                                try { const scale = (typeof this._kistaScale === 'number' && this._kistaScale > 0) ? this._kistaScale : 1; chestH = Math.max(1, Math.round(chestH * scale)); } catch (e) {}
                                const objBottom = oy + (chestH / 2);
                                if (playerBottomY === null) topObjs.push(o);
                                else if (objBottom < playerBottomY) topObjs.push(o);
                                else bottomObjs.push(o);
                            } else if (o.type === 'altare') {
                                altarObjs.push(o);
                            } else {
                                // Default: use object's bottom to decide
                                const defaultSize = Math.round(Math.max(32, Math.min(96, this.canvas.width * 0.06)));
                                const drawH = (typeof o.hojd === 'number') ? o.hojd : (typeof o.height === 'number' ? o.height : defaultSize);
                                const objBottom = oy + (drawH / 2);
                                if (playerBottomY === null) topObjs.push(o);
                                else if (objBottom < playerBottomY) topObjs.push(o);
                                else bottomObjs.push(o);
                            }
                        } catch (e) {
                            if (playerBottomY === null) topObjs.push(o);
                            else topObjs.push(o);
                        }
                    }
                } else {
                    for (const o of objs) {
                        if (o && o.type === 'altare') altarObjs.push(o);
                        else topObjs.push(o);
                    }
                }

                // If Gestalter system exists, prepare lists so we can draw gestalterna
                // relative to player (so some appear above and some below player).
                const gestalterSys = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                let topGestalters = [];
                let bottomGestalters = [];
                try {
                    if (gestalterSys && Array.isArray(gestalterSys.gestalter)) {
                        const visibleG = gestalterSys.gestalter.filter(g => g && g.levande).slice();
                        visibleG.sort((a, b) => { const ay = (typeof a.y === 'number') ? a.y : 0; const by = (typeof b.y === 'number') ? b.y : 0; return ay - by; });
                        for (const g of visibleG) {
                            try {
                                if (playerBottomY === null) topGestalters.push(g);
                                else if ((typeof g.y === 'number' ? g.y : 0) < playerBottomY) topGestalters.push(g);
                                else bottomGestalters.push(g);
                            } catch (e) { topGestalters.push(g); }
                        }
                    }
                } catch (e) {}

                const drawOne = (o) => {
                    if (!o || !o.type) return;
                    const dx = Math.round(o.x || 0);
                    const dy = Math.round(o.y || 0);
                    const defaultSize = Math.round(Math.max(32, Math.min(96, this.canvas.width * 0.06)));
                    const drawW = (typeof o.bredd === 'number') ? o.bredd : (typeof o.width === 'number' ? o.width : defaultSize);
                    const drawH = (typeof o.hojd === 'number') ? o.hojd : (typeof o.height === 'number' ? o.height : defaultSize);
                    if (o.type === 'kista') {
                        const baseKey = o.special ? 'ragnar_kista' : 'kista';
                        const openKey = baseKey + '_open';
                        const sClosed = this._skogenSprites && this._skogenSprites[baseKey];
                        const sOpen = this._skogenSprites && this._skogenSprites[openKey];
                        let chestW = drawW;
                        let chestH = drawH;
                        try {
                            if (typeof o.bredd !== 'number' && sClosed && sClosed.loaded && sClosed.img && sClosed.img.naturalWidth) chestW = sClosed.img.naturalWidth;
                            if (typeof o.hojd !== 'number' && sClosed && sClosed.loaded && sClosed.img && sClosed.img.naturalHeight) chestH = sClosed.img.naturalHeight;
                        } catch (e) {}
                        try {
                            const scale = (typeof this._kistaScale === 'number' && this._kistaScale > 0) ? this._kistaScale : 1;
                            chestW = Math.max(1, Math.round(chestW * scale));
                            chestH = Math.max(1, Math.round(chestH * scale));
                        } catch (e) {}
                        if (o.opened) {
                            if (sOpen && sOpen.loaded) ctx.drawImage(sOpen.img, dx - chestW / 2, dy - chestH / 2, chestW, chestH);
                            else { ctx.save(); ctx.fillStyle = 'peru'; ctx.fillRect(dx - Math.round(chestW/2), dy - Math.round(chestH/2), chestW, chestH); ctx.restore(); }
                        } else {
                            if (sClosed && sClosed.loaded) ctx.drawImage(sClosed.img, dx - chestW / 2, dy - chestH / 2, chestW, chestH);
                            else { ctx.save(); ctx.fillStyle = 'saddlebrown'; ctx.fillRect(dx - Math.round(chestW/2), dy - Math.round(chestH/2), chestW, chestH); ctx.restore(); }
                        }
                        try {
                            if (sp && !o.opened) {
                                const chestRect = { x: dx - chestW / 2, y: dy - chestH / 2, bredd: chestW, hojd: chestH };
                                const defaultPr = (sp && typeof sp.storlek === 'number') ? sp.storlek : 15;
                                const pr = (typeof this._kistaInteractionRadius === 'number') ? this._kistaInteractionRadius : defaultPr;
                                const insideChest = this._pointIntersectsRect(sp.x, sp.y, pr, chestRect);
                                if (insideChest) {
                                    const msg = 'Tryck E för att öppna kistan';
                                    ctx.save();
                                    ctx.font = '14px Arial';
                                    const textWidth = ctx.measureText(msg).width;
                                    const padX = 10; const padY = 6;
                                    const bgW = textWidth + padX * 2; const bgH = 14 + padY * 2;
                                    const centerX = chestRect.x + chestRect.bredd / 2;
                                    const bgX = Math.round(centerX - bgW / 2);
                                    const bgY = Math.round(chestRect.y - 8 - bgH / 2);
                                    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bgX, bgY, bgW, bgH);
                                    ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                                    ctx.fillText(msg, centerX, bgY + bgH / 2);
                                    ctx.restore();
                                }
                            }
                        } catch (e) {}
                    } else if (o.type === 'altare') {
                        const s = this._skogenSprites && this._skogenSprites.altare;
                        const drawWAlt = (typeof o.bredd === 'number') ? o.bredd : ((typeof o.width === 'number') ? o.width : (this._defaultSpawnSizes && this._defaultSpawnSizes.altare ? this._defaultSpawnSizes.altare.bredd : drawW));
                        const drawHAlt = (typeof o.hojd === 'number') ? o.hojd : ((typeof o.height === 'number') ? o.height : (this._defaultSpawnSizes && this._defaultSpawnSizes.altare ? this._defaultSpawnSizes.altare.hojd : drawH));
                        if (s && s.loaded) ctx.drawImage(s.img, dx - drawWAlt / 2, dy - drawHAlt / 2, drawWAlt, drawHAlt);
                        else { ctx.save(); ctx.fillStyle = 'darkslategray'; ctx.fillRect(dx - Math.round(drawWAlt/2), dy - Math.round(drawHAlt/2), drawWAlt, drawHAlt); ctx.restore(); }
                        try {
                            if (sp) {
                                const altarRect = { x: dx - drawWAlt / 2, y: dy - drawHAlt / 2, bredd: drawWAlt, hojd: drawHAlt };
                                const pr = sp.storlek || (sp.storlek === 0 ? 0 : 15);
                                const insideAltar = this._pointIntersectsRect(sp.x, sp.y, pr, altarRect);
                                if (insideAltar) {
                                    const msg = 'Tryck E för att interagera med altaret';
                                    ctx.save();
                                    ctx.font = '14px Arial';
                                    const textWidth = ctx.measureText(msg).width;
                                    const padX = 10; const padY = 6;
                                    const bgW = textWidth + padX * 2; const bgH = 14 + padY * 2;
                                    const centerX = altarRect.x + altarRect.bredd / 2;
                                    const bgX = Math.round(centerX - bgW / 2);
                                    const bgY = Math.round(altarRect.y - 8 - bgH / 2);
                                    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bgX, bgY, bgW, bgH);
                                    ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                                    ctx.fillText(msg, centerX, bgY + bgH / 2);
                                    ctx.restore();
                                }
                            }
                        } catch (e) {}
                    }
                };

                // draw altars first so they stay under wood loot and the player sprite
                for (const o of altarObjs) {
                    try { drawOne(o); } catch (e) {}
                }

                // draw objects that are above the player
                try { this.ritaFynd(playerBottomY, true); } catch (e) {}
                for (const o of topObjs) {
                    try { drawOne(o); } catch (e) {}
                }

                // draw gestalterna that should appear above (i.e. with y < playerBottomY)
                try {
                    if (topGestalters && topGestalters.length) {
                        for (const g of topGestalters) {
                            try {
                                const clampY = Math.max(0, Math.min(canvas.height, g.y || 0));
                                const t = clampY / canvas.height;
                                const skala = this.minSpelarSkala + (this.maxSpelarSkala - this.minSpelarSkala) * t;
                                try {
                                    if (spelare && typeof spelare.x === 'number') {
                                        let facing = (spelare.x < (g.x || 0));
                                        try {
                                            const idCheck = String(g.id || g.mappedId || '').toLowerCase();
                                            if (idCheck === 'blodvarg') facing = !facing;
                                        } catch (ee) {}
                                        g.spegelvand = facing;
                                    }
                                } catch (e) {}
                                if (typeof g.rita === 'function') g.rita(ctx, skala);
                            } catch (e) {}
                        }
                    }
                } catch (e) {}

                // draw player now (so player appears above objects that are higher on screen)
                try {
                    if (sp) {
                        const clampY = Math.max(0, Math.min(canvas.height, sp.y));
                        const t = clampY / canvas.height;
                        const skala = this.minSpelarSkala + (this.maxSpelarSkala - this.minSpelarSkala) * t;
                        ctx.save();
                        ctx.translate(sp.x, sp.y);
                        ctx.scale(skala, skala);
                        ctx.translate(-sp.x, -sp.y);
                        sp.rita(ctx);
                        ctx.restore();
                    }
                } catch (e) {}

                // draw remaining objects
                for (const o of bottomObjs) {
                    try { drawOne(o); } catch (e) {}
                }

                // draw remaining gestalterna (those below player)
                try {
                    if (bottomGestalters && bottomGestalters.length) {
                        for (const g of bottomGestalters) {
                            try {
                                const clampY = Math.max(0, Math.min(canvas.height, g.y || 0));
                                const t = clampY / canvas.height;
                                const skala = this.minSpelarSkala + (this.maxSpelarSkala - this.minSpelarSkala) * t;
                                try {
                                    if (spelare && typeof spelare.x === 'number') {
                                        let facing = (spelare.x < (g.x || 0));
                                        try {
                                            const idCheck = String(g.id || g.mappedId || '').toLowerCase();
                                            if (idCheck === 'blodvarg') facing = !facing;
                                        } catch (ee) {}
                                        g.spegelvand = facing;
                                    }
                                } catch (e) {}
                                if (typeof g.rita === 'function') g.rita(ctx, skala);
                            } catch (e) {}
                        }
                    }
                } catch (e) {}
                try { this.ritaFynd(playerBottomY, false); } catch (e) {}
                // If Gestalter has transient messages (stridsmeddelande/senasteMeddelande), draw them over the player
                try {
                    const gest = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                    if (gest && spelare) {
                        try { if (typeof gest.ritaStridsmeddelande === 'function' && gest.stridsmeddelandeTid > 0) gest.ritaStridsmeddelande(ctx, spelare.x, (spelare.y || 0) + 80); } catch (e) {}
                        try { if (typeof gest.ritaSenasteMeddelande === 'function' && gest.senasteMeddelandeTid > 0) gest.ritaSenasteMeddelande(ctx, spelare.x, (spelare.y || 0) + 60); } catch (e) {}
                        try { if (typeof gest.ritaFiendeStridsinfo === 'function') gest.ritaFiendeStridsinfo(ctx, canvas); } catch (e) {}
                    }
                } catch (e) {}
            } catch (e) {}
            // Draw transient loot messages above their source chests
            try {
                if (Array.isArray(this._lootMessages) && this._lootMessages.length > 0) {
                    const now = Date.now();
                    // keep only active
                    this._lootMessages = this._lootMessages.filter(m => (m && (now - (m.created || 0) < (m.duration || this._lootMessageDuration))));
                    for (let i = 0; i < this._lootMessages.length; i++) {
                        const m = this._lootMessages[i];
                        if (!m || !m.text) continue;
                        const age = now - (m.created || 0);
                        const dur = m.duration || this._lootMessageDuration;
                        const alpha = Math.max(0.1, 1 - (age / dur));
                        const fontSize = 14;
                        const hasIcon = !!m.icon;
                        const hasItems = Array.isArray(m.items) && m.items.length > 0;
                        const hasValutor = Array.isArray(m.valutor) && m.valutor.length > 0;
                        const iconBox = (hasIcon || hasValutor || hasItems) ? 64 : 0;
                        ctx.save();
                        ctx.font = fontSize + 'px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = (hasIcon || hasValutor || hasItems) ? 'top' : 'bottom';
                        const textWidth = ctx.measureText(m.text).width;
                        const padX = 10; const padY = 6;
                        const itemKolumner = hasItems ? Math.min(5, m.items.length) : 0;
                        const itemRader = hasItems ? Math.ceil(m.items.length / itemKolumner) : 0;
                        const itemGridW = hasItems ? ((itemKolumner * 52) + ((itemKolumner - 1) * 8)) : 0;
                        const itemGridH = hasItems ? ((itemRader * 52) + ((itemRader - 1) * 8)) : 0;
                        const valutaW = hasValutor ? ((m.valutor.length * 52) + ((m.valutor.length - 1) * 8)) : 0;
                        const bgW = Math.max(textWidth + padX * 2, hasIcon ? iconBox + 20 : 0, hasValutor ? valutaW + 20 : 0, hasItems ? itemGridW + 20 : 0);
                        const bgH = (fontSize + padY * 2) + (hasItems ? itemGridH + 10 : ((hasIcon || hasValutor) ? iconBox + 10 : 0));
                        // default to top-center if no position
                        let px = (typeof m.x === 'number') ? m.x : (canvas.width / 2);
                        let py = (typeof m.y === 'number') ? m.y : 40;
                        // draw slightly above chest
                        const drawX = Math.round(px - bgW / 2);
                        const drawY = Math.round(py - (bgH + 12));
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = 'rgba(0,0,0,0.8)';
                        ctx.fillRect(drawX, drawY, bgW, bgH);
                        ctx.fillStyle = 'rgba(255,255,255,1)';
                        if (hasIcon || hasValutor || hasItems) {
                            ctx.fillText(m.text, px, drawY + padY);
                            if (hasItems) {
                                const gridX = Math.round(px - itemGridW / 2);
                                const gridY = Math.round(drawY + fontSize + padY + 8);
                                for (let ii = 0; ii < m.items.length; ii++) {
                                    const item = m.items[ii];
                                    const kol = ii % itemKolumner;
                                    const rad = Math.floor(ii / itemKolumner);
                                    const slotX = gridX + (kol * 60);
                                    const slotY = gridY + (rad * 60);
                                    const ikon = this.hamtaIkonBild(item.icon);
                                    ctx.fillStyle = 'rgba(15,22,18,0.92)';
                                    ctx.fillRect(slotX, slotY, 52, 52);
                                    if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                                        ctx.drawImage(ikon, slotX + 8, slotY + 4, 36, 36);
                                    }
                                    if ((item.count || 1) > 1) {
                                        const badgeText = `x${item.count}`;
                                        ctx.font = 'bold 13px Arial';
                                        const badgeW = Math.max(24, Math.ceil(ctx.measureText(badgeText).width + 8));
                                        const badgeH = 18;
                                        const badgeX = Math.round(slotX + 52 - badgeW - 3);
                                        const badgeY = Math.round(slotY + 52 - badgeH - 3);
                                        ctx.fillStyle = 'rgba(0,0,0,0.82)';
                                        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
                                        ctx.fillStyle = 'rgba(255,255,255,1)';
                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'middle';
                                        ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
                                    }
                                }
                            } else if (hasValutor) {
                                const rowW = valutaW;
                                const rowX = Math.round(px - rowW / 2);
                                const rowY = Math.round(drawY + fontSize + padY + 8);
                                for (let vi = 0; vi < m.valutor.length; vi++) {
                                    const valuta = m.valutor[vi];
                                    const slotX = rowX + (vi * 60);
                                    const slotY = rowY;
                                    const ikon = this.hamtaIkonBild(valuta.ikon);
                                    ctx.fillStyle = 'rgba(15,22,18,0.92)';
                                    ctx.fillRect(slotX, slotY, 52, 52);
                                    if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                                        ctx.drawImage(ikon, slotX + 8, slotY + 4, 36, 36);
                                    }
                                    ctx.fillStyle = 'rgba(255,255,255,1)';
                                    ctx.font = 'bold 13px Arial';
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillText(String(valuta.antal), slotX + 26, slotY + 42);
                                }
                            } else {
                                const icon = this.hamtaIkonBild(m.icon);
                                const iconX = Math.round(px - iconBox / 2);
                                const iconY = Math.round(drawY + fontSize + padY + 6);
                                ctx.fillStyle = 'rgba(15,22,18,0.92)';
                                ctx.fillRect(iconX, iconY, iconBox, iconBox);
                                if (icon && icon.complete && icon.naturalWidth > 0) {
                                    ctx.drawImage(icon, iconX + 6, iconY + 6, iconBox - 12, iconBox - 12);
                                }
                                if ((m.count || 1) > 1) {
                                    const badgeText = `x${m.count}`;
                                    ctx.font = 'bold 14px Arial';
                                    const badgeW = Math.max(24, Math.ceil(ctx.measureText(badgeText).width + 10));
                                    const badgeH = 20;
                                    const badgeX = Math.round(iconX + iconBox - badgeW - 4);
                                    const badgeY = Math.round(iconY + iconBox - badgeH - 4);
                                    ctx.fillStyle = 'rgba(0,0,0,0.82)';
                                    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
                                    ctx.fillStyle = 'rgba(255,255,255,1)';
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
                                }
                            }
                        } else {
                            ctx.fillText(m.text, px, drawY + bgH - padY);
                        }
                        ctx.restore();
                    }
                }
            } catch (e) {}
            // Inner threshold: draw subtle marker only if enabled, but always show hint text when inside
            if (this.innerThreshold && sp && this.innerTarget) {
                const ir = this.innerThreshold;
                const r = sp.storlek || (sp.storlek === 0 ? 0 : 15);
                const insideInner = (sp.x + r > ir.x) && (sp.x - r < (ir.x + ir.bredd)) && (sp.y + r > ir.y) && (sp.y - r < (ir.y + ir.hojd));
                if (this.showThresholds) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(34,139,34,0.25)';
                    ctx.fillRect(ir.x, ir.y, ir.bredd, ir.hojd);
                    ctx.strokeStyle = 'rgba(34,139,34,0.6)';
                    ctx.strokeRect(ir.x, ir.y, ir.bredd, ir.hojd);
                    ctx.restore();
                }
                if (insideInner) {
                    const msg = this.innerThreshold.meddelande || 'Tryck Enter för att gå djupare';
                    ctx.save();
                    ctx.font = '16px Arial';
                    const textWidth = ctx.measureText(msg).width;
                    const padX = 12;
                    const padY = 6;
                    const bgW = textWidth + padX * 2;
                    const bgH = 16 + padY * 2;
                    const centerX = ir.x + ir.bredd / 2;
                    const bgX = Math.round(centerX - bgW / 2);
                    const bgY = Math.round(ir.y - 8 - bgH / 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(bgX, bgY, bgW, bgH);
                    ctx.fillStyle = 'rgba(255,255,255,1)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(msg, centerX, bgY + bgH / 2);
                    ctx.restore();
                }
            }
            // Center exit: draw marker only if enabled; always show hint text when inside
            if (this.centerExit && sp && this.startOmradeNamn === 'Skogen1') {
                const ce = this.centerExit;
                if (this.showCenterExit) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    ctx.fillRect(ce.x, ce.y, ce.bredd, ce.hojd);
                    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                    ctx.strokeRect(ce.x, ce.y, ce.bredd, ce.hojd);
                    ctx.restore();
                }
                const r = sp.storlek || (sp.storlek === 0 ? 0 : 15);
                const insideCenter = (sp.x + r > ce.x) && (sp.x - r < (ce.x + ce.bredd)) && (sp.y + r > ce.y) && (sp.y - r < (ce.y + ce.hojd));
                if (insideCenter) {
                    const msg = ce.meddelande || 'Tryck Enter för att lämna skogen';
                    ctx.save();
                    ctx.font = '16px Arial';
                    const textWidth = ctx.measureText(msg).width;
                    const padX = 12;
                    const padY = 6;
                    const bgW = textWidth + padX * 2;
                    const bgH = 16 + padY * 2;
                    const centerX = ce.x + ce.bredd / 2;
                    const bgX = Math.round(centerX - bgW / 2);
                    const bgY = Math.round(ce.y - 8 - bgH / 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(bgX, bgY, bgW, bgH);
                    ctx.fillStyle = 'rgba(255,255,255,1)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(msg, centerX, bgY + bgH / 2);
                    ctx.restore();
                }
            }
            // If this is the lake or Yggdrasil, draw a left-side option panel
            try {
                if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo')) {
                    if (typeof this._drawSjoPanel === 'function') this._drawSjoPanel(ctx);
                }
                if (this.startOmradeNamn && this.startOmradeNamn === 'Yggdrasil') {
                    if (typeof this._drawYggPanel === 'function') this._drawYggPanel(ctx);
                }
                // Draw altar menu if visible
                    try {
                        if (this._altarMenuVisible && typeof this._drawAltarPanel === 'function') this._drawAltarPanel(ctx);
                        if (this._altarOfferMenuVisible && typeof this._drawAltarOfferPanel === 'function') this._drawAltarOfferPanel(ctx);
                    } catch (e) {}
            } catch (e) {}
        } catch (e) {}
    }

    tangentNed(tangent) {
        if (!this.visas) return;
        try { console.log('[Skogen] tangentNed called:', tangent, 'startOmradeNamn=', this.startOmradeNamn, '_sjoMenuVisible=', this._sjoMenuVisible, '_sjoMenuIndex=', this._sjoMenuIndex); } catch (e) {}
        // If altar menu is open, always consume navigation keys regardless of variant
        try {
            if (this._altarOfferMenuVisible) {
                try {
                    if (tangent === 'ArrowDown' || tangent === 's' || tangent === 'S') { this._altarOfferMenuIndex = Math.min((this._altarOfferMenuItems.length || 0) - 1, (this._altarOfferMenuIndex || 0) + 1); return; }
                    if (tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W') { this._altarOfferMenuIndex = Math.max(0, (this._altarOfferMenuIndex || 0) - 1); return; }
                    if (tangent === 'Escape') { this._altarOfferMenuVisible = false; this._altarOfferMode = null; this._altarOfferMenuItems = []; this._altarOfferMenuIndex = 0; this._altarMenuItems = this._altarMenuPrevItems || this._altarMenuItems; this._altarMenuPrevItems = null; this._altarMenuVisible = true; return; }
                    if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
                        // handle offer selection
                        const sel = (this._altarOfferMenuItems && this._altarOfferMenuItems[this._altarOfferMenuIndex]) || null;
                        try { this._performAltarOffer(sel); } catch (e) {}
                        return;
                    }
                } catch (e) {}
            }
            // If we're at the lake, always allow menu navigation with arrows/W/S and Enter
            try {
                if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo')) {
                    // ensure menu items exist
                    if (!this._sjoMenuItems || this._sjoMenuItems.length === 0) this._sjoMenuItems = ['Fiska', 'Fyll flaskor', 'Gå vidare'];
                    if (tangent === 'ArrowDown' || tangent === 's' || tangent === 'S') { this._sjoMenuVisible = true; this._sjoMenuPrimed = false; this._sjoMenuIndex = Math.min((this._sjoMenuItems.length || 0) - 1, (this._sjoMenuIndex || 0) + 1); return; }
                    if (tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W') { this._sjoMenuVisible = true; this._sjoMenuPrimed = false; this._sjoMenuIndex = Math.max(0, (this._sjoMenuIndex || 0) - 1); return; }
                    if (tangent === 'Escape') { this._sjoMenuVisible = false; return; }
                    if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
                        const sel = (this._sjoMenuItems && this._sjoMenuItems[this._sjoMenuIndex]) || null;
                        try {
                            const low = String(sel || '').toLowerCase();
                            if (low.indexOf('fiska') === 0) { try { this._handleFishing(); } catch (e) {} }
                            else if (low.indexOf('fyll flaskor') === 0) { try { this._handleRefillBottles(); } catch (e) {} }
                            else if (low.indexOf('gå vidare') === 0 || low.indexOf('ga vidare') === 0) { try { this._leaveSpecialForestRoom(); } catch (e) {} }
                        } catch (e) {}
                        return;
                    }
                }
            } catch (e) {}
            try {
                if (this.startOmradeNamn === 'Yggdrasil') {
                    if (!this._yggMenuItems || this._yggMenuItems.length === 0) this._primeYggMenu();
                    if (tangent === 'ArrowDown' || tangent === 's' || tangent === 'S') { this._yggMenuVisible = true; this._yggMenuPrimed = false; this._yggMenuIndex = Math.min((this._yggMenuItems.length || 0) - 1, (this._yggMenuIndex || 0) + 1); return; }
                    if (tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W') { this._yggMenuVisible = true; this._yggMenuPrimed = false; this._yggMenuIndex = Math.max(0, (this._yggMenuIndex || 0) - 1); return; }
                    if (tangent === 'Escape') { this._yggMenuVisible = false; this._yggMenuPrimed = false; return; }
                    if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
                        const sel = (this._yggMenuItems && this._yggMenuItems[this._yggMenuIndex]) || null;
                        try {
                            const low = String(sel || '').toLowerCase();
                            if (low.indexOf('gå vidare') === 0 || low.indexOf('ga vidare') === 0) { try { this._leaveSpecialForestRoom(); } catch (e) {} }
                            else if (sel) { try { this._yggTravelTo(sel); } catch (e) {} }
                        } catch (e) {}
                        return;
                    }
                }
            } catch (e) {}
            if (this._altarMenuVisible) {
                try {
                    if (tangent === 'ArrowDown' || tangent === 's' || tangent === 'S') { this._altarMenuIndex = Math.min((this._altarMenuItems.length || 0) - 1, (this._altarMenuIndex || 0) + 1); return; }
                    if (tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W') { this._altarMenuIndex = Math.max(0, (this._altarMenuIndex || 0) - 1); return; }
                    if (tangent === 'Escape') { this._altarMenuVisible = false; this._activeAltar = null; return; }
                    if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
                        const sel = (this._altarMenuItems && this._altarMenuItems[this._altarMenuIndex]) || null;
                        // If player selected the generic "Offra ett föremål", open offer submenu
                        if (sel && typeof sel === 'string' && sel.toLowerCase().indexOf('offra') !== -1) {
                            // prepare offer menu
                            this._altarMenuPrevItems = this._altarMenuItems.slice();
                            this._altarMenuVisible = false;
                            this._altarOfferMenuVisible = true;
                            this._altarOfferMenuIndex = 0;
                            this._altarOfferMode = null;
                            // Build offer menu and hide resource exchanges that already used on this altar
                            try {
                                // Use global one-time flags so resource exchanges are one-time across all altars
                                const used = this._globalAltarOffersUsed || {};
                                const items = [];
                                items.push('Blota (Offra 9 Köttbitar)');
                                if (!used['jarn']) items.push('Offra 3 Järn (få 1-20 Järn)');
                                if (!used['sten']) items.push('Offra 3 Sten (få 1-100 Sten)');
                                if (!used['tra']) items.push('Offra 3 Trä (få 1-60 Trä)');
                                items.push('Galdra: 3 Flaskor Vatten -> 3 Galdrat Vatten');
                                items.push('Tillbaka');
                                this._altarOfferMenuItems = items;
                            } catch (e) {
                                this._altarOfferMenuItems = [
                                    'Blota (Offra 9 Köttbitar)',
                                    'Offra 3 Järn (få 1-20 Järn)',
                                    'Offra 3 Sten (få 1-100 Sten)',
                                    'Offra 3 Trä (få 1-60 Trä)',
                                    'Galdra: 3 Flaskor Vatten -> 3 Galdrat Vatten',
                                    'Tillbaka'
                                ];
                            }
                            return;
                        }
                        this._altarMenuVisible = false;
                        const altarObj = this._activeAltar || null;
                        this._activeAltar = null;
                        try {
                            if (typeof window.altareVald === 'function') window.altareVald(altarObj, sel);
                            else if (typeof window.aktiveraAltare === 'function') {
                                try { window.aktiveraAltare(altarObj, sel); } catch (e) {}
                            }
                        } catch (e) {}
                        return;
                    }
                } catch (e) {}
            }
        } catch (e) {}
        // Handle lake-specific keys: F to fish, Enter to go on
        try {
                // If the lake menu is visible, consume these keys here to avoid falling through to the default Enter->leave behaviour
                if (this._sjoMenuVisible) {
                    if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
                        const sel = (this._sjoMenuItems && this._sjoMenuItems[this._sjoMenuIndex]) || null;
                        try {
                            const low = String(sel || '').toLowerCase();
                            if (low.indexOf('fiska') === 0) { try { this._handleFishing(); } catch (e) {} }
                            else if (low.indexOf('fyll flaskor') === 0) { try { this._handleRefillBottles(); } catch (e) {} }
                            else if (low.indexOf('gå vidare') === 0 || low.indexOf('ga vidare') === 0) { try { this._leaveSpecialForestRoom(); } catch (e) {} }
                        } catch (e) {}
                        return;
                    }
                    // let navigation keys be handled earlier; just prevent default fall-through
                    if (tangent === 'ArrowDown' || tangent === 's' || tangent === 'S' || tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W' || tangent === 'f' || tangent === 'F' || tangent === 'r' || tangent === 'R') {
                        return;
                    }
                }
                if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo' || this.startOmradeNamn === 'Yggdrasil') && (tangent === 'f' || tangent === 'F' || tangent === 'Enter' || tangent === 'e' || tangent === 'E')) {
                const spelare = this.hamtaSpelare();
                    // handle Sjö fishing
                if ((this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo') && (tangent === 'f' || tangent === 'F')) {
                    try { this._handleFishing(); } catch (e) {}
                    return;
                }
                if ((this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo') && (tangent === 'r' || tangent === 'R')) {
                    try { this._handleRefillBottles(); } catch (e) {}
                    return;
                }
                if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
                    // If lake menu is visible, don't allow the generic Enter->leave behaviour
                    try { if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo') && this._sjoMenuVisible) { return; } } catch (e) {}
                    // If there's a nearest fynd, prefer picking it up on Enter as well (convenience)
                    try {
                        const spelareNow = this.hamtaSpelare();
                        if (this.narmasteFynd && spelareNow) {
                            this.eKnappNedtryckt = true;
                            try { this.plockaUppFynd(this.narmasteFynd); } catch (e) {}
                            return;
                        }
                    } catch (e) {}
                    try {
                        if (this._leaveSpecialForestRoom()) return;
                    } catch (e) {}
                    try { this._cleanupSpawnedObjectsForVariant(null); } catch (e) {}
                    try { this.gaTillbaka(); } catch (e) {}
                    return;
                }
            }
        } catch (e) {}
        // If we're in the lake or Yggdrasil variant, ignore movement keys so the player cannot move
        try {
            if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo' || this.startOmradeNamn === 'Yggdrasil')) {
                const mvKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'];
                if (mvKeys.indexOf(tangent) !== -1) return;
            }
        } catch (e) {}
        if (tangent === 'Escape') { this.gaTillbaka(); return; }
        if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
            if (!this.eKnappNedtryckt) {
                const spelare = this.hamtaSpelare();
                if (spelare) {
                    if (tangent === 'e' || tangent === 'E') {
                        try { this.kontrolleraFynd(spelare.x, spelare.y); } catch (e) {}
                        if (this.narmasteFynd) {
                            this.eKnappNedtryckt = true;
                            try { this.plockaUppFynd(this.narmasteFynd); } catch (e) {}
                            return;
                        }
                    }
                    // Check bottom exit if it exists (kept for compatibility)
                    if (this.exitRect) {
                        const er = this.exitRect;
                        const r = spelare.storlek || (spelare.storlek === 0 ? 0 : 15);
                        const inside = (spelare.x + r > er.x) && (spelare.x - r < (er.x + er.bredd)) && (spelare.y + r > er.y) && (spelare.y - r < (er.y + er.hojd));
                        if (inside) {
                            // Block exiting if gestaltrutan requests exit lock (enemy present)
                            try {
                                const gest = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                                if (gest && gest.lockExit) {
                                    this._lootMessages = this._lootMessages || [];
                                    this._lootMessages.push({ text: 'Du kan inte lämna rummet förrän fienden är besegrad!', created: Date.now(), duration: this._lootMessageDuration, x: (spelare && typeof spelare.x === 'number') ? spelare.x : null, y: (spelare && typeof spelare.y === 'number') ? spelare.y : null });
                                    return;
                                }
                            } catch (e) {}
                            this.eKnappNedtryckt = true;
                            try { this._cleanupSpawnedObjectsForVariant(null); } catch (e) {}
                            this.gaTillbaka();
                        }
                    }
                    // Check center exit first (when in Skogen1)
                    if (!this.eKnappNedtryckt && spelare && this.centerExit && this.startOmradeNamn === 'Skogen1') {
                        const ce = this.centerExit;
                        const r3 = spelare.storlek || (spelare.storlek === 0 ? 0 : 15);
                        const insideCenter = (spelare.x + r3 > ce.x) && (spelare.x - r3 < (ce.x + ce.bredd)) && (spelare.y + r3 > ce.y) && (spelare.y - r3 < (ce.y + ce.hojd));
                        if (insideCenter) {
                            try {
                                const gest = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                                if (gest && gest.lockExit) {
                                    this._lootMessages = this._lootMessages || [];
                                    this._lootMessages.push({ text: 'Du kan inte gå djupare förrän fienden är besegrad!', created: Date.now(), duration: this._lootMessageDuration, x: (spelare && typeof spelare.x === 'number') ? spelare.x : null, y: (spelare && typeof spelare.y === 'number') ? spelare.y : null });
                                    return;
                                }
                            } catch (e) {}
                            this.eKnappNedtryckt = true;
                            // Return to map via callback; remove non-persistent spawns before leaving
                            try { this._cleanupSpawnedObjectsForVariant(null); } catch (e) {}
                            try { this.gaTillbaka(); } catch (e) {}
                        }
                    }
                    // Check nearby kistor to open them with Enter/E
                    if (!this.eKnappNedtryckt && spelare && Array.isArray(this._spawnedObjects) && this._spawnedObjects.length > 0) {
                        const defaultPr = (spelare && typeof spelare.storlek === 'number') ? spelare.storlek : 15;
                        const pr = (typeof this._kistaInteractionRadius === 'number') ? this._kistaInteractionRadius : defaultPr;
                        for (let i = 0; i < this._spawnedObjects.length; i++) {
                            const o = this._spawnedObjects[i];
                            if (!o || o.type !== 'kista') continue;
                            let w = (typeof o.bredd === 'number') ? o.bredd : ((typeof o.width === 'number') ? o.width : (this._defaultSpawnSizes && this._defaultSpawnSizes.kista ? this._defaultSpawnSizes.kista.bredd : 64));
                            let h = (typeof o.hojd === 'number') ? o.hojd : ((typeof o.height === 'number') ? o.height : (this._defaultSpawnSizes && this._defaultSpawnSizes.kista ? this._defaultSpawnSizes.kista.hojd : 64));
                            try {
                                const baseKey = o.special ? 'ragnar_kista' : 'kista';
                                const sClosed = this._skogenSprites && this._skogenSprites[baseKey];
                                if (typeof o.bredd !== 'number' && sClosed && sClosed.loaded && sClosed.img && sClosed.img.naturalWidth) w = sClosed.img.naturalWidth;
                                if (typeof o.hojd !== 'number' && sClosed && sClosed.loaded && sClosed.img && sClosed.img.naturalHeight) h = sClosed.img.naturalHeight;
                                const scale = (typeof this._kistaScale === 'number' && this._kistaScale > 0) ? this._kistaScale : 1;
                                w = Math.max(1, Math.round(w * scale));
                                h = Math.max(1, Math.round(h * scale));
                            } catch (e) {}
                            const rect = { x: (o.x || 0) - w / 2, y: (o.y || 0) - h / 2, bredd: w, hojd: h };
                            const inside = this._pointIntersectsRect(spelare.x, spelare.y, pr, rect);
                            try { console.log('[Skogen DEBUG] kista check', i, 'inside=', inside, 'o.opened=', !!o.opened, 'o.attempted=', !!o.attempted, 'o.special=', o && o.special); } catch (e) {}
                            if (inside) {
                                // Special handling for Ragnar's chest: allow exactly one open-attempt
                                const isRagnar = (o && o.special && typeof o.special === 'string' && o.special.toLowerCase().indexOf('ragnar') !== -1);
                                if (isRagnar) {
                                    if (!o.attempted) {
                                        o.attempted = true;
                                        // chance based on player's physical stat (`spelare.stats.fysisk`) as percent
                                        try {
                                            const fys = (spelare && spelare.strid && typeof spelare.strid.fysisk === 'number') ? spelare.strid.fysisk : (spelare && spelare.strid && spelare.strid.fysisk ? Number(spelare.strid.fysisk) : 0);
                                            const chance = Math.max(0, Math.min(100, (isNaN(fys) ? 0 : Math.round(fys))));
                                            const roll = Math.floor(Math.random() * 100) + 1; // 1..100
                                            if (roll <= chance) {
                                                // success
                                                o.opened = true;
                                                try { console.log('[Skogen] lyckades öppna Ragnar kista', i, o); } catch (e) {}
                                                try { this._handleKistaLoot(o); } catch (e) { try { console.log('[Skogen] _handleKistaLoot failed', e); } catch (ee) {} }
                                                try { if (typeof window.oppnaKista === 'function') window.oppnaKista(o); } catch (e) {}
                                            } else {
                                                // failed attempt (one try only)
                                                try { console.log('[Skogen] misslyckades öppna Ragnar kista', i, o); } catch (e) {}
                                                try {
                                                    this._lootMessages = this._lootMessages || [];
                                                    this._lootMessages.push({ text: 'Du försökte öppna Ragnars kista men misslyckades.', created: Date.now(), duration: this._lootMessageDuration, x: (o && typeof o.x === 'number') ? o.x : null, y: (o && typeof o.y === 'number') ? o.y : null });
                                                } catch (e) {}
                                            }
                                        } catch (e) { try { console.log('[Skogen] Ragnar open chance failed', e); } catch (ee) {} }
                                    } else {
                                        // already attempted: do nothing / show subtle feedback
                                        try {
                                            this._lootMessages = this._lootMessages || [];
                                            this._lootMessages.push({ text: 'Du har redan försökt att öppna denna kista.', created: Date.now(), duration: this._lootMessageDuration, x: (o && typeof o.x === 'number') ? o.x : null, y: (o && typeof o.y === 'number') ? o.y : null });
                                        } catch (e) {}
                                    }
                                } else {
                                    if (!o.opened) {
                                        o.opened = true;
                                        try { console.log('[Skogen] öppnade kista', i, o); } catch (e) {}
                                        try { console.log('[Skogen DEBUG] calling _handleKistaLoot for kista index', i); } catch (e) {}
                                        try { this._handleKistaLoot(o); } catch (e) { try { console.log('[Skogen] _handleKistaLoot failed', e); } catch (ee) {} }
                                        try { if (typeof window.oppnaKista === 'function') window.oppnaKista(o); } catch (e) {}
                                    } else {
                                        try { console.log('[Skogen DEBUG] kista already opened, index', i, o); } catch (e) {}
                                    }
                                }
                                this.eKnappNedtryckt = true;
                                break;
                            }
                        }
                    }
                    // Check nearby altare to interact with
                    if (!this.eKnappNedtryckt && spelare && Array.isArray(this._spawnedObjects) && this._spawnedObjects.length > 0) {
                        // If the player is inside the innerThreshold (able to go deeper), prefer that action
                        let insideInnerForSkip = false;
                        try {
                            if (this.innerThreshold && this.innerTarget) {
                                const ir = this.innerThreshold;
                                const r2 = spelare.storlek || (spelare.storlek === 0 ? 0 : 15);
                                insideInnerForSkip = (spelare.x + r2 > ir.x) && (spelare.x - r2 < (ir.x + ir.bredd)) && (spelare.y + r2 > ir.y) && (spelare.y - r2 < (ir.y + ir.hojd));
                            }
                        } catch (e) { insideInnerForSkip = false; }

                        const pr2 = spelare.storlek || (spelare.storlek === 0 ? 0 : 15);
                        for (let i = 0; i < this._spawnedObjects.length; i++) {
                            const o = this._spawnedObjects[i];
                            if (!o || o.type !== 'altare') continue;
                            // If player is inside the inner threshold, skip altar interaction so Enter goes deeper
                            if (insideInnerForSkip) continue;
                            const w = (typeof o.bredd === 'number') ? o.bredd : ((typeof o.width === 'number') ? o.width : (this._defaultSpawnSizes && this._defaultSpawnSizes.altare ? this._defaultSpawnSizes.altare.bredd : 80));
                            const h = (typeof o.hojd === 'number') ? o.hojd : ((typeof o.height === 'number') ? o.height : (this._defaultSpawnSizes && this._defaultSpawnSizes.altare ? this._defaultSpawnSizes.altare.hojd : 48));
                            const rect = { x: (o.x || 0) - w / 2, y: (o.y || 0) - h / 2, bredd: w, hojd: h };
                            if (this._pointIntersectsRect(spelare.x, spelare.y, pr2, rect)) {
                                try { this._handleAltareInteract(o); } catch (e) {}
                                this.eKnappNedtryckt = true;
                                break;
                            }
                        }
                    }
                    // Check inner threshold as well (only when Enter isn't already consumed)
                    if (!this.eKnappNedtryckt && spelare && this.innerThreshold && this.innerTarget) {
                        const ir = this.innerThreshold;
                        const r2 = spelare.storlek || (spelare.storlek === 0 ? 0 : 15);
                        const insideInner = (spelare.x + r2 > ir.x) && (spelare.x - r2 < (ir.x + ir.bredd)) && (spelare.y + r2 > ir.y) && (spelare.y - r2 < (ir.y + ir.hojd));
                        try { console.log('[Skogen DEBUG] eKnappNedtryckt=', this.eKnappNedtryckt); } catch (e) {}
                        try {
                            console.log('[Skogen DEBUG]', tangent, 'pressed: sp=', { x: spelare.x, y: spelare.y, r: r2 }, 'innerThreshold=', ir, 'innerTarget=', this.innerTarget, 'insideInner=', insideInner, 'startOmradeNamn=', this.startOmradeNamn);
                        } catch (e) {}
                        if (insideInner) {
                            try {
                                const gest = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                                if (gest && gest.lockExit) {
                                    this._lootMessages = this._lootMessages || [];
                                    this._lootMessages.push({ text: 'Du kan inte gå djupare förrän fienden är besegrad!', created: Date.now(), duration: this._lootMessageDuration, x: (spelare && typeof spelare.x === 'number') ? spelare.x : null, y: (spelare && typeof spelare.y === 'number') ? spelare.y : null });
                                    this.eKnappNedtryckt = true;
                                    return;
                                }
                            } catch (e) {}
                            // Transition deeper - compute deterministically from current variant
                            this.eKnappNedtryckt = true;
                            const prev = this.startOmradeNamn;
                            let target = null;
                            try {
                                if (this.startOmradeNamn === 'Skogen5') target = 'Skogen4';
                                else if (this.startOmradeNamn === 'Skogen4') target = 'Skogen3';
                                else if (this.startOmradeNamn === 'Skogen3') target = 'Skogen2';
                                else if (this.startOmradeNamn === 'Skogen2') target = 'Skogen1';
                                else target = this.innerTarget || null;
                            } catch (e) { target = this.innerTarget || null; }
                            if (target) {
                                this.startOmradeNamn = target;
                                // Remove spawned objects that were created in the previous variant
                                try { this._cleanupSpawnedObjectsForVariant(this.startOmradeNamn); } catch (e) {}
                                // reset background to load new variant
                                try {
                                    this.bakgrundLaddad = false;
                                    let nextImg = 'Skogen1.png';
                                    if (this.startOmradeNamn === 'Skogen2') nextImg = 'Skogen2.png';
                                    else if (this.startOmradeNamn === 'Skogen3') nextImg = 'Skogen3.png';
                                    else if (this.startOmradeNamn === 'Skogen4') nextImg = 'Skogen4.png';
                                    else if (this.startOmradeNamn === 'Skogen5') nextImg = 'Skogen5.png';
                                    this.bakgrund.src = 'assets/platser/' + nextImg;
                                } catch (e) {}
                                // recompute innerTarget for the new variant
                                try {
                                    if (this.startOmradeNamn === 'Skogen5') this.innerTarget = 'Skogen4';
                                    else if (this.startOmradeNamn === 'Skogen4') this.innerTarget = 'Skogen3';
                                    else if (this.startOmradeNamn === 'Skogen3') this.innerTarget = 'Skogen2';
                                    else if (this.startOmradeNamn === 'Skogen2') this.innerTarget = 'Skogen1';
                                    else this.innerTarget = null;
                                } catch (e) {}
                                // recompute barriers for the newly selected variant so old barriers are removed
                                try { this._updateBarriers(); } catch (e) {}
                                // reposition player to the same place as when first entering the forest
                                try { spelare.x = this.spawnX; spelare.y = this.spawnY; } catch (e) {}
                                // Trigger a random event for the new sub-area
                                try { this._randomEventTriggeredForThisVisit = false; this._triggerRandomEvent(); } catch (e) {}
                                // notify gestalter about entering new sub-area if available
                                try { if (window.gestaltrutan && window.gestaltrutan.gestalter) window.gestaltrutan.gestalter.notaRutaBesokt(this.startOmradeNamn); } catch (e) {}
                                try { if (typeof animationer !== 'undefined' && animationer && spelare.klass) animationer.uppdateraAnimering(spelare, false); } catch (e) {}
                            }
                        }
                    }
                }
            }
            return;
        }

        // E-pickup is handled at the start of the shared Enter/E branch above.
        const spelare = this.hamtaSpelare();
        if (spelare && typeof spelare.tangentNed === 'function') spelare.tangentNed(tangent);
    }

    tangentUpp(tangent) {
        if (!this.visas) return;
        if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') this.eKnappNedtryckt = false;
        // Block movement key releases in the lake so player doesn't resume movement
        try {
            if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo')) {
                const mvKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'];
                if (mvKeys.indexOf(tangent) !== -1) return;
            }
        } catch (e) {}
        const spelare = this.hamtaSpelare();
        if (spelare && typeof spelare.tangentUpp === 'function') spelare.tangentUpp(tangent);
    }

    uppdateraRorelse() {
        if (!this.visas) return;
        // When in the lake or Yggdrasil variant, disable player movement updates entirely
        try {
            if (this.startOmradeNamn && (this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo' || this.startOmradeNamn === 'Yggdrasil')) return;
        } catch (e) {}
        // If altar menu is open, block movement updates
        try {
            if (this._altarMenuVisible) return;
        } catch (e) {}
        const spelare = this.hamtaSpelare();
        if (!spelare) return;
        try {
            const canvas = this.canvas;
            const clampY = Math.max(0, Math.min(canvas.height, spelare.y));
            const t = clampY / canvas.height;
            const mult = this.minHastighetMult + (this.maxHastighetMult - this.minHastighetMult) * t;
            if (typeof spelare._origHastighet === 'undefined') spelare._origHastighet = spelare.hastighet;
            // Save old pos; run player movement; if collides with a barrier, revert to old pos
            const oldX = spelare.x;
            const oldY = spelare.y;
            spelare.hastighet = (spelare._origHastighet || spelare.hastighet) * mult;
            if (typeof spelare.uppdateraRorelse === 'function') spelare.uppdateraRorelse([]);
            spelare.hastighet = spelare._origHastighet || spelare.hastighet;

            if (Array.isArray(this.barriers) && this.barriers.length > 0) {
                for (const b of this.barriers) {
                    let hit = false;
                    if (b.shape === 'ellipse') {
                        hit = this._circleIntersectsEllipse(spelare.x, spelare.y, spelare.storlek || 15, b);
                    } else {
                        hit = this._pointIntersectsRect(spelare.x, spelare.y, spelare.storlek || 15, b);
                    }
                    if (hit) {
                        try {
                            const r = spelare.storlek || 15;
                            // Attempt to slide along barrier tangent for rotated rects
                            try {
                                if (b && typeof b.angle !== 'undefined') {
                                    const angle = this._normalizeAngle(b.angle || 0);
                                    const vX = spelare.x - oldX;
                                    const vY = spelare.y - oldY;
                                    const tX = Math.cos(angle);
                                    const tY = Math.sin(angle);
                                    const dot = vX * tX + vY * tY;
                                    const projX = oldX + dot * tX;
                                    const projY = oldY + dot * tY;
                                    if (!this._isCollidingBarriers(projX, projY, r)) {
                                        spelare.x = projX; spelare.y = projY;
                                        break;
                                    }
                                }
                            } catch (e) {}
                            // Fallback sliding: try keeping Y (restore X) or keeping X (restore Y)
                            const canKeepY = !this._isCollidingBarriers(oldX, spelare.y, r);
                            if (canKeepY) {
                                spelare.x = oldX;
                                // keep new Y
                            } else {
                                const canKeepX = !this._isCollidingBarriers(spelare.x, oldY, r);
                                if (canKeepX) {
                                    spelare.y = oldY;
                                } else {
                                    // final fallback: full revert
                                    spelare.x = oldX; spelare.y = oldY;
                                }
                            }
                        } catch (e) {
                            try { spelare.x = oldX; spelare.y = oldY; } catch (ee) {}
                        }
                        break;
                    }
                }
            }
            // Update Gestalter system: proximity checks and AI update so combat can start
            try {
                const gest = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                if (gest) {
                    try { if (typeof gest.kontrolleraNarhet === 'function') gest.kontrolleraNarhet(spelare.x, spelare.y); } catch (e) {}
                    try { if (typeof gest.uppdatera === 'function') gest.uppdatera(spelare); } catch (e) {}
                    try { if (typeof gest.rensaDeadGestals === 'function') gest.rensaDeadGestals(); } catch (e) {}
                }
            } catch (e) {}
            try { this.kontrolleraFynd(spelare.x, spelare.y); } catch (e) {}
        } catch (e) {}
    }

    _updateBarriers() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (this.startOmradeNamn === 'Skogen5') {
            this.barriers = [
                { x: 0, y: 200, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: 0, y: canvas.height - 20, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: 30, y: 460, bredd: 340, hojd: 20, angle: -30 },
                { x: 145, y: 300, bredd: 200, hojd: 20, angle: 40 },
                { x: 460, y: 460, bredd: 340, hojd: 20, angle: 70 },
                { x: 30, y: 260, bredd: 340, hojd: 20, angle: -30 },
                { x: 360, y: 400, bredd: 500, hojd: 20, angle: 35 },
                { x: Math.round(w * 0.50 - (w * 0.16) / 2), y: 100, bredd: Math.round(w * 0.16), hojd: Math.round(h * 0.08), angle: (-22 * Math.PI / 180), shape: 'ellipse' }
            ];
        } else if (this.startOmradeNamn === 'Skogen4') {
            this.barriers = [
                { x: 0, y: 170, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: 0, y: canvas.height - 20, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: 30, y: 460, bredd: 340, hojd: 20, angle: -30 },
                { x: 180, y: 300, bredd: 200, hojd: 20, angle: 40 },
                { x: 460, y: 460, bredd: 340, hojd: 20, angle: 70 },
                { x: 130, y: 260, bredd: 340, hojd: 20, angle: -30 },
                { x: 400, y: 420, bredd: 500, hojd: 20, angle: 35 },
                { x: 430, y: 200, bredd: 340, hojd: 20, angle: -30 },
                { x: 350, y: 200, bredd: 340, hojd: 20, angle: 30 },
                { x: Math.round(w * 0.55 - (w * 0.20) / 2), y: 100, bredd: Math.round(w * 0.20), hojd: Math.round(h * 0.06), angle: (15 * Math.PI / 180), shape: 'ellipse' }
            ];
        } else if (this.startOmradeNamn === 'Skogen3') {
            this.barriers = [
                { x: 0, y: 250, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: 0, y: canvas.height - 20, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: 20, y: 480, bredd: 340, hojd: 20, angle: -25 },
                { x: 145, y: 350, bredd: 200, hojd: 20, angle: 40 },
                { x: 400, y: 460, bredd: 440, hojd: 20, angle: 60 },
                { x: 170, y: 260, bredd: 340, hojd: 20, angle: -30 },
                { x: Math.round(w * 0.40 - (w * 0.14) / 2), y: 100, bredd: Math.round(w * 0.14), hojd: Math.round(h * 0.10), angle: (-30 * Math.PI / 180), shape: 'ellipse' }
            ];
        } else if (this.startOmradeNamn === 'Skogen2') {
            this.barriers = [
                { x: 0, y: 250, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: 0, y: canvas.height - 20, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: -100, y: 400, bredd: 540, hojd: 20, angle: -40 },
                { x: 460, y: 460, bredd: 340, hojd: 20, angle: 70 },
                { x: 360, y: 300, bredd: 500, hojd: 20, angle: 35 },
                { x: 200, y: 300, bredd: Math.round(w * 0.18), hojd: Math.round(h * 0.08), angle: (8 * Math.PI / 180), shape: 'ellipse' }
            ];
        } else {
            // Skogen1 or default
            this.barriers = [
                { x: 0, y: 240, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: 0, y: canvas.height - 20, bredd: canvas.width, hojd: 20, angle: 0 },
                { x: -30, y: 420, bredd: 400, hojd: 20, angle: -30 },
                { x: 400, y: 460, bredd: 540, hojd: 20, angle: 70 },
                { x: 230, y: 260, bredd: 340, hojd: 20, angle: -30 },
                { x: Math.round(w * 0.46 - (w * 0.16) / 2), y: 100, bredd: Math.round(w * 0.16), hojd: Math.round(h * 0.08), angle: (-15 * Math.PI / 180), shape: 'ellipse' }
            ];
        }
        // Position inner threshold differently per variant so it appears in different places
        try {
            const itW = Math.max(64, Math.round(w * 0.12));
            const itH = Math.max(64, Math.round(h * 0.12));
            // compute defaults
            let itX = Math.round(w / 2 - itW / 2);
            let itY = Math.round(h / 2 - itH / 2);
            if (this.startOmradeNamn === 'Skogen5') {
                itX = 300;
                itY = 200;
            } else if (this.startOmradeNamn === 'Skogen4') {
                itX = 400;
                itY = 200;
            } else if (this.startOmradeNamn === 'Skogen3') {
                itX = 400;
                itY = 250;
            } else if (this.startOmradeNamn === 'Skogen2') {
                itX = 400;
                itY = 250;
            } else {
                itX = 450;
                itY = 250;
            }
            // Allow runtime overrides via this.thresholdPositions
            const override = this.thresholdPositions && this.thresholdPositions[this.startOmradeNamn];
            const finalX = override && typeof override.x === 'number' ? override.x : itX;
            const finalY = override && typeof override.y === 'number' ? override.y : itY;
            const finalW = override && typeof override.bredd === 'number' ? override.bredd : itW;
            const finalH = override && typeof override.hojd === 'number' ? override.hojd : itH;
            if (!this.innerThreshold) this.innerThreshold = { meddelande: 'Tryck Enter för att gå djupare' };
            this.innerThreshold.x = finalX;
            this.innerThreshold.y = finalY;
            this.innerThreshold.bredd = finalW;
            this.innerThreshold.hojd = finalH;
        } catch (e) {}

        // Recompute default centerExit for Skogen1 unless user has overridden it
        try {
            if (!this._centerExitOverride) {
                const ceW = 64;
                const ceH = 64;
                this.centerExit = {
                    x: Math.round(w / 2 - ceW / 2),
                    y: Math.round(h / 2 - ceH / 2),
                    bredd: ceW,
                    hojd: ceH,
                    meddelande: 'Tryck Enter för att lämna skogen'
                };
                try { console.log('[Skogen] default centerExit set', this.centerExit, '_centerExitOverride=', this._centerExitOverride); } catch (e) {}
            }
        } catch (e) {}
    }

    // Public API: set threshold for a single variant (e.g. 'Skogen4')
    setThresholdPosition(variant, x, y, bredd, hojd) {
        if (!variant) return;
        this.thresholdPositions = this.thresholdPositions || {};
        this.thresholdPositions[variant] = { x: x, y: y, bredd: bredd, hojd: hojd };
        if (this.startOmradeNamn === variant) {
            this.innerThreshold = this.innerThreshold || { meddelande: 'Tryck Enter för att gå djupare' };
            this.innerThreshold.x = x;
            this.innerThreshold.y = y;
            this.innerThreshold.bredd = bredd;
            this.innerThreshold.hojd = hojd;
        }
    }

    // Helper: test whether a given player position collides with any barrier
    _isCollidingBarriers(x, y, r) {
        try {
            if (!Array.isArray(this.barriers) || this.barriers.length === 0) return false;
            for (const b of this.barriers) {
                try {
                    let hit = false;
                    if (b && b.shape === 'ellipse') hit = this._circleIntersectsEllipse(x, y, r, b);
                    else hit = this._pointIntersectsRect(x, y, r, b);
                    if (hit) return true;
                } catch (e) {}
            }
        } catch (e) {}
        return false;
    }

    // Public API: set multiple thresholds at once using an object map
    setThresholdPositions(map) {
        if (!map || typeof map !== 'object') return;
        this.thresholdPositions = this.thresholdPositions || {};
        for (const k of Object.keys(map)) {
            const v = map[k];
            if (v && typeof v.x === 'number') this.thresholdPositions[k] = { x: v.x, y: v.y, bredd: v.bredd, hojd: v.hojd };
        }
        // apply current variant if present
        if (this.startOmradeNamn && this.thresholdPositions[this.startOmradeNamn]) {
            const o = this.thresholdPositions[this.startOmradeNamn];
            this.innerThreshold = this.innerThreshold || { meddelande: 'Tryck Enter för att gå djupare' };
            this.innerThreshold.x = o.x; this.innerThreshold.y = o.y; this.innerThreshold.bredd = o.bredd; this.innerThreshold.hojd = o.hojd;
        }
    }

    // Public API: set center exit position/size/message for Skogen1
    setCenterExit(x, y, bredd, hojd, meddelande) {
        try {
            if (typeof x !== 'number' || typeof y !== 'number') return;
            this._centerExitOverride = true;
            const w = this.canvas && this.canvas.width ? this.canvas.width : 64;
            const h = this.canvas && this.canvas.height ? this.canvas.height : 64;
            this.centerExit = {
                x: 450,
                y: 200,
                bredd: typeof bredd === 'number' ? Math.round(bredd) : 500,
                hojd: typeof hojd === 'number' ? Math.round(hojd) : 64,
                meddelande: meddelande || 'Tryck Enter för att lämna skogen'
            };
            try { console.log('[Skogen] setCenterExit called', this.centerExit, '_centerExitOverride=', this._centerExitOverride); } catch (e) {}
        } catch (e) {}
    }

    // Public API: show or hide barrier rendering. Collision still respects `this.barriers`.
    setShowBarriers(show) {
        this.showBarriers = !!show;
    }

    getShowBarriers() { return !!this.showBarriers; }

    // Public API: show/hide inner thresholds (visual only)
    setShowThresholds(show) { this.showThresholds = !!show; }
    getShowThresholds() { return !!this.showThresholds; }

    // Public API: show/hide center exit (visual only)
    setShowCenterExit(show) { this.showCenterExit = !!show; }
    getShowCenterExit() { return !!this.showCenterExit; }

    // Public API: configure which top-level worlds should appear in Yggdrasil's travel menu
    setKnownWorlds(arr) {
        if (!Array.isArray(arr)) return;
        this._knownWorlds = arr.slice();
    }
    getKnownWorlds() { return (this._knownWorlds || []).slice(); }

    // Public API: clear any override and restore default centerExit (recomputed from canvas)
    clearCenterExitOverride() {
        this._centerExitOverride = false;
        try {
            const w = this.canvas.width;
            const h = this.canvas.height;
            const ceW = 64;
            const ceH = 64;
            this.centerExit = {
                x: Math.round(w / 2 - ceW / 2),
                y: Math.round(h / 2 - ceH / 2),
                bredd: ceW,
                hojd: ceH,
                meddelande: 'Tryck Enter för att lämna skogen'
            };
        } catch (e) {}
    }

    // Public API: get current center exit
    getCenterExit() { return this.centerExit; }

    getThresholdPosition(variant) {
        return (this.thresholdPositions && this.thresholdPositions[variant]) || null;
    }

    // Spawned object management API
    spawnObject(type, x, y, opts) {
        if (!type) return -1;
        this._spawnedObjects = this._spawnedObjects || [];
        const o = Object.assign({ type: type, x: (typeof x === 'number' ? x : 0), y: (typeof y === 'number' ? y : 0) }, opts || {});
        // Prevent spawning of Ragnar's treasure until player has visited enough distinct external areas
        try {
            if (o && o.special && typeof o.special === 'string' && o.special.toLowerCase().indexOf('ragnar') !== -1) {
                // If already claimed, require visiting 5 eligible room entries since claim.
                if (this._ragnarKistaClaimed) {
                    try {
                        const newCount = this._hamtaRagnarBesokSedanCooldown();
                        if (newCount < 5) {
                            try { console.log('[Skogen] Ragnar kista spawn blocked - need', 5 - newCount, 'more visited locations'); } catch (e) {}
                            try {
                                this._lootMessages = this._lootMessages || [];
                                const c = this.canvas || { width: 160, height: 120 };
                                const px = Math.round((this.hamtaSpelare && this.hamtaSpelare() && typeof this.hamtaSpelare().x === 'number') ? this.hamtaSpelare().x : (c.width/2));
                                const py = Math.round((this.hamtaSpelare && this.hamtaSpelare() && typeof this.hamtaSpelare().y === 'number') ? this.hamtaSpelare().y : (c.height/4));
                                this._lootMessages.push({ text: 'Ragnars kista återkommer efter att du besökt ' + (5 - newCount) + ' andra platser.', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                            } catch (e) {}
                            return -1;
                        }
                        // Enough new locations visited -> allow spawning again (reset claimed flag)
                        this._ragnarKistaClaimed = false;
                        this._ragnarVisitedStartIndex = null;
                        this._ragnarVisitedSnapshot = null;
                    } catch (e) {
                        try { console.log('[Skogen] Ragnar gating check failed', e); } catch (ee) {}
                    }
                } else {
                    // Initial gating: require at least 5 visited worlds ever
                    if (!this._hasVisitedAtLeast(5)) {
                        try { console.log('[Skogen] Ragnar kista spawn blocked - not enough visited worlds yet'); } catch (e) {}
                        // Optionally provide player feedback
                        try {
                            this._lootMessages = this._lootMessages || [];
                            const c = this.canvas || { width: 160, height: 120 };
                            const px = Math.round((this.hamtaSpelare && this.hamtaSpelare() && typeof this.hamtaSpelare().x === 'number') ? this.hamtaSpelare().x : (c.width/2));
                            const py = Math.round((this.hamtaSpelare && this.hamtaSpelare() && typeof this.hamtaSpelare().y === 'number') ? this.hamtaSpelare().y : (c.height/4));
                            this._lootMessages.push({ text: 'En särskild kista väntar på att du utforskar fler platser...', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                        } catch (e) {}
                        return -1;
                    }
                }
            }
        } catch (e) {}
        try {
            if (this._isRagnarChest(o)) {
                this._spawnedObjects = this._spawnedObjects.filter(existing => !this._isRagnarChest(existing));
            }
        } catch (e) {}
        // Record which variant (room) this object was spawned in so we can remove it when leaving
        try { if (!o.hasOwnProperty('spawnedInVariant')) o.spawnedInVariant = this.startOmradeNamn || null; } catch (e) {}
        // Allow marking objects as persistent across variant changes using opts.persistent = true
        // Apply default size for known types when not specified
        try {
            const def = this._defaultSpawnSizes && this._defaultSpawnSizes[type];
            if (def) {
                if (typeof o.bredd !== 'number' && typeof o.width !== 'number') o.bredd = def.bredd;
                if (typeof o.hojd !== 'number' && typeof o.height !== 'number') o.hojd = def.hojd;
            }
            // If altare scale is configured and no explicit size provided, compute from sprite natural size
            if (type === 'altare' && (typeof o.bredd !== 'number' && typeof o.width !== 'number') && (typeof this._altareScale === 'number' && this._altareScale > 0)) {
                const sAlt = this._skogenSprites && this._skogenSprites.altare;
                // fallback base size
                let baseW = Math.round(Math.max(32, Math.min(96, this.canvas.width * 0.06)));
                let baseH = baseW;
                try {
                    if (sAlt && sAlt.loaded && sAlt.img && sAlt.img.naturalWidth) baseW = sAlt.img.naturalWidth;
                    if (sAlt && sAlt.loaded && sAlt.img && sAlt.img.naturalHeight) baseH = sAlt.img.naturalHeight;
                } catch (e) {}
                try {
                    o.bredd = Math.max(1, Math.round(baseW * this._altareScale));
                    o.hojd = Math.max(1, Math.round(baseH * this._altareScale));
                } catch (e) {}
            }
            // If this is a chest, apply the configured position offset so chests appear slightly to the right and above
            try {
                if (type === 'kista' && !o._shiftedForChestOffset) {
                    if (typeof o.x === 'number') o.x = Math.round(o.x + 50);
                    if (typeof o.y === 'number') o.y = Math.round(o.y - 100);
                    o._shiftedForChestOffset = true;
                }
            } catch (e) {}
        } catch (e) {}
        this._spawnedObjects.push(o);
        return this._spawnedObjects.length - 1;
    }

    // Convenience: change default kista size for future spawns
    setDefaultKistaSize(bredd, hojd) {
        if (!this._defaultSpawnSizes) this._defaultSpawnSizes = {};
        this._defaultSpawnSizes.kista = { bredd: Math.round(bredd || 64), hojd: Math.round(hojd || 64) };
    }

    // Convenience: set size of an existing spawned kista (by index)
    setKistaSize(index, bredd, hojd) { return this.setSpawnedObjectSize(index, bredd, hojd); }

    // Public API: set/get how close the player must be to interact with chests (pixels)
    setKistaInteractionRadius(radius) {
        if (typeof radius !== 'number' || isNaN(radius) || radius < 50) return;
        this._kistaInteractionRadius = Math.round(radius);
    }

    getKistaInteractionRadius() { return (typeof this._kistaInteractionRadius === 'number') ? this._kistaInteractionRadius : null; }

    // Public API: set/get global chest scale multiplier (1 = natural size, 0.1 = 1:10)
    setKistaScale(scale) {
        if (typeof scale !== 'number' || isNaN(scale) || scale <= 0) return;
        this._kistaScale = scale;
    }

    getKistaScale() { return (typeof this._kistaScale === 'number') ? this._kistaScale : null; }

    getSpawnedObjects() { return (this._spawnedObjects || []).slice(); }

    updateSpawnedObject(index, props) {
        if (!Array.isArray(this._spawnedObjects)) return false;
        if (typeof index !== 'number' || index < 0 || index >= this._spawnedObjects.length) return false;
        const o = this._spawnedObjects[index];
        if (!o) return false;
        for (const k of Object.keys(props || {})) o[k] = props[k];
        return true;
    }

    moveSpawnedObject(index, x, y) { return this.updateSpawnedObject(index, { x: x, y: y }); }

    setSpawnedObjectSize(index, bredd, hojd) { return this.updateSpawnedObject(index, { bredd: bredd, hojd: hojd }); }

    removeSpawnedObject(index) {
        if (!Array.isArray(this._spawnedObjects)) return false;
        if (typeof index !== 'number' || index < 0 || index >= this._spawnedObjects.length) return false;
        this._spawnedObjects.splice(index, 1);
        return true;
    }

    clearSpawnedObjects() { this._spawnedObjects = []; }

    // Random event system -------------------------------------------------
    _initDefaultRandomEvents() {
        if (Array.isArray(this.randomEvents) && this.randomEvents.length >= 11) return;
        const push = (fn) => { if (typeof fn === 'function') this.randomEvents.push(fn.bind(this)); };
        // Map events 1..11 to indices 0..10 as requested by the user
        // 1 => Kommer till Yggdrasil (handled inside Skogen instance)
        push(function () {
            try {
                this._lastRandomEventDescription = 'Du förs till Yggdrasil.';
                // remember previous skogen variant
                try {
                    const sp = this.hamtaSpelare();
                    this._previousSkogenState = {
                        variant: this.startOmradeNamn || null,
                        innerTarget: this.innerTarget || null,
                        playerX: (sp && typeof sp.x === 'number') ? sp.x : null,
                        playerY: (sp && typeof sp.y === 'number') ? sp.y : null
                    };
                } catch (e) {}
                try {
                    this.startOmradeNamn = 'Yggdrasil';
                    this.bakgrundLaddad = false;
                    // Yggdrasil image lives in assets/skogen
                    this.bakgrund.src = 'assets/skogen/Yggdrasil.png';
                    // set up an exit and disable inner threshold
                    try { this._updateBarriers(); } catch (e) {}
                    try { if (typeof this._primeYggMenu === 'function') this._primeYggMenu(); } catch (e) {}
                    const sp = this.hamtaSpelare(); if (sp) { sp.x = this.spawnX; sp.y = this.spawnY; }
                } catch (e) {}
                console.log('[Skogen] event 1 -> Yggdrasil');
            } catch (e) { console.log('[Skogen] event 1 failed', e); }
        });
        // 2 => Kista spawnar
        push(function () {
            try {
                const p = this.hamtaSpelare();
                const sx = p ? p.x + 20 : Math.round(this.canvas.width / 2);
                const sy = p ? p.y : Math.round(this.canvas.height / 2);
                this._spawnedObjects = this._spawnedObjects || [];
                this.spawnObject('kista', sx, sy, { special: false });
                this._lastRandomEventDescription = 'En kista har dykt upp.';
                console.log('[Skogen] event 2 -> kista spawned');
            } catch (e) { console.log('[Skogen] event 2 failed', e); }
        });
        // 3 => En fiende spawnar (preferera Gestalter.spawnMissionEnemies)
        push(function () {
            try {
                const p = this.hamtaSpelare();
                const sx = p ? p.x + 60 : Math.round(this.canvas.width / 2 + 60);
                const sy = p ? p.y : Math.round(this.canvas.height / 2);
                this._spawnedObjects = this._spawnedObjects || [];
                const g = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                if (g && typeof g.spawnMissionEnemies === 'function') {
                    try {
                        let enemyId = 'bandit';
                        try {
                            if (g.spawnPunkter) {
                                // Build a flattened pool of all spawn templates and prefer hostile ones
                                let pool = [];
                                const keys = Object.keys(g.spawnPunkter || {});
                                for (const k of keys) {
                                    try { const arr = g.spawnPunkter[k]; if (Array.isArray(arr)) pool = pool.concat(arr); } catch (ee) {}
                                }
                                const candidates = pool.filter(d => (typeof d.hostil === 'undefined') || d.hostil !== false);
                                const pickPool = (candidates && candidates.length) ? candidates : (pool.length ? pool : []);
                                if (pickPool && pickPool.length) {
                                    const tpl = pickPool[Math.floor(Math.random() * pickPool.length)];
                                    if (tpl && tpl.id) enemyId = tpl.id;
                                }
                            }
                        } catch (e) {}
                        g.spawnMissionEnemies(enemyId, 1, sx, sy);
                        try { g.lockExit = true; } catch (e) {}
                    } catch (e) {
                        console.log('[Skogen] gestalter spawnMissionEnemies failed, falling back', e);
                        this.spawnObject('fiende', sx, sy);
                    }
                } else {
                    this.spawnObject('fiende', sx, sy);
                }
                this._lastRandomEventDescription = 'En fiende dyker upp.';
                console.log('[Skogen] event 3 -> fiende spawned');
            } catch (e) { console.log('[Skogen] event 3 failed', e); }
        });
        // 4 => Kista spawnar
        push(function () {
            try {
                const p = this.hamtaSpelare();
                const sx = p ? p.x - 20 : Math.round(this.canvas.width / 2 - 20);
                const sy = p ? p.y : Math.round(this.canvas.height / 2);
                this._spawnedObjects = this._spawnedObjects || [];
                this.spawnObject('kista', sx, sy, { special: false });
                this._lastRandomEventDescription = 'En kista har dykt upp.';
                console.log('[Skogen] event 4 -> kista spawned');
            } catch (e) { console.log('[Skogen] event 4 failed', e); }
        });
        // 5 => Altare spawnar
        push(function () {
            try {
                const p = this.hamtaSpelare();
                // Spawn altar near player, shifted up ~100px and doubled in size
                const sx = p ? Math.round(p.x + 20) : Math.round(this.canvas.width / 2 + 20);
                // Move altar ~50px higher than before
                const sy = p ? Math.round(p.y - 150) : Math.round(this.canvas.height / 2 - 150);
                this._spawnedObjects = this._spawnedObjects || [];
                // Spawn altar without explicit size so `_defaultSpawnSizes.altare` is applied
                this.spawnObject('altare', sx, sy);
                this._lastRandomEventDescription = 'Ett altare uppenbarar sig.';
                console.log('[Skogen] event 5 -> altare spawned');
            } catch (e) { console.log('[Skogen] event 5 failed', e); }
        });
        // 6 => En fiende spawnar (preferera Gestalter.spawnMissionEnemies)
        push(function () {
            try {
                const p = this.hamtaSpelare();
                const sx = p ? p.x + 40 : Math.round(this.canvas.width / 2 + 40);
                const sy = p ? p.y + 20 : Math.round(this.canvas.height / 2 + 20);
                this._spawnedObjects = this._spawnedObjects || [];
                const g = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                if (g && typeof g.spawnMissionEnemies === 'function') {
                    try {
                        let enemyId = 'bandit';
                        try {
                            if (g.spawnPunkter) {
                                let pool = [];
                                const keys = Object.keys(g.spawnPunkter || {});
                                for (const k of keys) {
                                    try { const arr = g.spawnPunkter[k]; if (Array.isArray(arr)) pool = pool.concat(arr); } catch (ee) {}
                                }
                                const candidates = pool.filter(d => (typeof d.hostil === 'undefined') || d.hostil !== false);
                                const pickPool = (candidates && candidates.length) ? candidates : (pool.length ? pool : []);
                                if (pickPool && pickPool.length) {
                                    const tpl = pickPool[Math.floor(Math.random() * pickPool.length)];
                                    if (tpl && tpl.id) enemyId = tpl.id;
                                }
                            }
                        } catch (e) {}
                        g.spawnMissionEnemies(enemyId, 1, sx, sy);
                        try { g.lockExit = true; } catch (e) {}
                    } catch (e) {
                        console.log('[Skogen] gestalter spawnMissionEnemies failed, falling back', e);
                        this.spawnObject('fiende', sx, sy);
                    }
                } else {
                    this.spawnObject('fiende', sx, sy);
                }
                this._lastRandomEventDescription = 'En fiende dyker upp.';
                console.log('[Skogen] event 6 -> fiende spawned');
            } catch (e) { console.log('[Skogen] event 6 failed', e); }
        });
        // 7 => Man kommer till Sjö
        push(function () {
            try {
                this._lastRandomEventDescription = 'Du förs till sjön.';
                // remember the current skogen variant so we can return back here after the lake
                try {
                    const sp = this.hamtaSpelare();
                    this._previousSkogenState = {
                        variant: this.startOmradeNamn || null,
                        innerTarget: this.innerTarget || null,
                        playerX: (sp && typeof sp.x === 'number') ? sp.x : null,
                        playerY: (sp && typeof sp.y === 'number') ? sp.y : null
                    };
                } catch (e) {}
                // switch current variant to the lake so the same Skogen instance shows the lake background
                try {
                    this.startOmradeNamn = 'Sjö';
                    this.bakgrundLaddad = false;
                    this.bakgrund.src = 'assets/platser/Sjö.png';
                    try { this._updateBarriers(); } catch (e) {}
                    try { if (typeof this._primeSjoMenu === 'function') this._primeSjoMenu(); } catch (e) {}
                    try { const sp = this.hamtaSpelare(); if (sp) { sp.x = this.spawnX; sp.y = this.spawnY; } } catch (e) {}
                } catch (e) {}
                console.log('[Skogen] event 7 -> Sjö');
            } catch (e) { console.log('[Skogen] event 7 failed', e); }
        });
        // 8 => Kista spawnar
        push(function () {
            try {
                const p = this.hamtaSpelare();
                const sx = p ? p.x + 10 : Math.round(this.canvas.width / 2 + 10);
                const sy = p ? p.y - 10 : Math.round(this.canvas.height / 2 - 10);
                this._spawnedObjects = this._spawnedObjects || [];
                this.spawnObject('kista', sx, sy, { special: false });
                this._lastRandomEventDescription = 'En kista har dykt upp.';
                console.log('[Skogen] event 8 -> kista spawned');
            } catch (e) { console.log('[Skogen] event 8 failed', e); }
        });
        // 9 => En fiende spawnar (preferera Gestalter.spawnMissionEnemies)
        push(function () {
            try {
                const p = this.hamtaSpelare();
                const sx = p ? p.x - 50 : Math.round(this.canvas.width / 2 - 50);
                const sy = p ? p.y : Math.round(this.canvas.height / 2);
                this._spawnedObjects = this._spawnedObjects || [];
                const g = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                if (g && typeof g.spawnMissionEnemies === 'function') {
                    try {
                        let enemyId = 'bandit';
                        try {
                            if (g.spawnPunkter) {
                                let pool = [];
                                const keys = Object.keys(g.spawnPunkter || {});
                                for (const k of keys) {
                                    try { const arr = g.spawnPunkter[k]; if (Array.isArray(arr)) pool = pool.concat(arr); } catch (ee) {}
                                }
                                const candidates = pool.filter(d => (typeof d.hostil === 'undefined') || d.hostil !== false);
                                const pickPool = (candidates && candidates.length) ? candidates : (pool.length ? pool : []);
                                if (pickPool && pickPool.length) {
                                    const tpl = pickPool[Math.floor(Math.random() * pickPool.length)];
                                    if (tpl && tpl.id) enemyId = tpl.id;
                                }
                            }
                        } catch (e) {}
                        g.spawnMissionEnemies(enemyId, 1, sx, sy);
                        try { g.lockExit = true; } catch (e) {}
                    } catch (e) {
                        console.log('[Skogen] gestalter spawnMissionEnemies failed, falling back', e);
                        this.spawnObject('fiende', sx, sy);
                    }
                } else {
                    this.spawnObject('fiende', sx, sy);
                }
                this._lastRandomEventDescription = 'En fiende dyker upp.';
                console.log('[Skogen] event 9 -> fiende spawned');
            } catch (e) { console.log('[Skogen] event 9 failed', e); }
        });
        // 10 => En fiende spawnar (preferera Gestalter.spawnMissionEnemies)
        push(function () {
            try {
                const p = this.hamtaSpelare();
                const sx = p ? p.x + 80 : Math.round(this.canvas.width / 2 + 80);
                const sy = p ? p.y + 10 : Math.round(this.canvas.height / 2 + 10);
                this._spawnedObjects = this._spawnedObjects || [];
                const g = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                if (g && typeof g.spawnMissionEnemies === 'function') {
                    try {
                        let enemyId = 'bandit';
                        try {
                            if (g.spawnPunkter) {
                                let pool = [];
                                const keys = Object.keys(g.spawnPunkter || {});
                                for (const k of keys) {
                                    try { const arr = g.spawnPunkter[k]; if (Array.isArray(arr)) pool = pool.concat(arr); } catch (ee) {}
                                }
                                const candidates = pool.filter(d => (typeof d.hostil === 'undefined') || d.hostil !== false);
                                const pickPool = (candidates && candidates.length) ? candidates : (pool.length ? pool : []);
                                if (pickPool && pickPool.length) {
                                    const tpl = pickPool[Math.floor(Math.random() * pickPool.length)];
                                    if (tpl && tpl.id) enemyId = tpl.id;
                                }
                            }
                        } catch (e) {}
                        g.spawnMissionEnemies(enemyId, 1, sx, sy);
                        try { g.lockExit = true; } catch (e) {}
                    } catch (e) {
                        console.log('[Skogen] gestalter spawnMissionEnemies failed, falling back', e);
                        this.spawnObject('fiende', sx, sy);
                    }
                } else {
                    this.spawnObject('fiende', sx, sy);
                }
                this._lastRandomEventDescription = 'En fiende dyker upp.';
                console.log('[Skogen] event 10 -> fiende spawned');
            } catch (e) { console.log('[Skogen] event 10 failed', e); }
        });
        // 11 => Ragnar Lodbroks försvunna kista spawnar (special)
        push(function () {
            try {
                const p = this.hamtaSpelare();
                const sx = p ? p.x : Math.round(this.canvas.width / 2);
                const sy = p ? p.y : Math.round(this.canvas.height / 2);
                this._spawnedObjects = this._spawnedObjects || [];
                this.spawnObject('kista', sx, sy, { special: 'Ragnar Lodbroks kista' });
                this._lastRandomEventDescription = 'Ragnar Lodbroks försvunna kista har dykt upp!';
                console.log('[Skogen] event 11 -> Ragnar kista spawned');
            } catch (e) { console.log('[Skogen] event 11 failed', e); }
        });
    }

    registerRandomEvent(fn) { if (typeof fn === 'function') this.randomEvents.push(fn.bind(this)); }
    setRandomEvents(arr) { if (!Array.isArray(arr)) return; this.randomEvents = arr.filter(f => typeof f === 'function').map(f => f.bind(this)); }
    getLastRandomEvent() { return { id: this._lastRandomEventId, description: this._lastRandomEventDescription }; }
    _triggerRandomEvent(id) {
        try {
            if (!Array.isArray(this.randomEvents) || this.randomEvents.length === 0) this._initDefaultRandomEvents();
            if (this._randomEventTriggeredForThisVisit && typeof id === 'undefined') return;
            let idx = typeof id === 'number' ? id : Math.floor(Math.random() * this.randomEvents.length);
            idx = Math.max(0, Math.min(this.randomEvents.length - 1, idx));
            this._lastRandomEventId = idx;
            const fn = this.randomEvents[idx];
            if (typeof fn === 'function') fn({ spelare: this.hamtaSpelare(), skogen: this });
            this._randomEventTriggeredForThisVisit = true;
        } catch (e) { try { console.log('[Skogen] _triggerRandomEvent failed', e); } catch (ee) {} }
    }

    // Handle chest loot when a kista is opened
    _handleKistaLoot(o) {
        try {
            if (!o || o.type !== 'kista') return;
            const spelare = this.hamtaSpelare();
            let titanitTilldelad = 0;
            if (o.loot && o.loot.fromEnemy && o.loot.enemyLoot) {
                const lootData = o.loot.enemyLoot;
                const invMap = (spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal) || {};
                let msg = '';

                if (lootData.typ === 'pengar') {
                    if (!o.loot.alreadyAwarded && spelare) {
                        if (typeof spelare.laggTillPengar === 'function') {
                            spelare.laggTillPengar(lootData, { raknaSomIntakt: true });
                        } else if (spelare.pengar) {
                            spelare.pengar.koppar += lootData.koppar || 0;
                            spelare.pengar.silver += lootData.silver || 0;
                            spelare.pengar.guld += lootData.guld || 0;
                        }
                    }
                    const delar = [];
                    if (lootData.guld > 0) delar.push(`${lootData.guld} guld`);
                    if (lootData.silver > 0) delar.push(`${lootData.silver} silver`);
                    if (lootData.koppar > 0) delar.push(`${lootData.koppar} koppar`);
                    msg = delar.length > 0 ? `Du fick: ${delar.join(' och ')}.` : 'Du fick pengar.';
                } else if (lootData.typ === 'item') {
                    let added = 0;
                    if (spelare && spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') {
                        for (let i = 0; i < (lootData.antal || 1); i++) {
                            try {
                                if (spelare.utrustning.laggTillForemal(lootData.itemId)) added++;
                            } catch (e) {}
                        }
                    }
                    msg = added > 0 ? 'Du fick:' : 'Inventoryt var fullt.';
                    o.loot.given = {
                        varor: Array.from({ length: added }, () => lootData.itemId)
                    };
                }

                o.loot.alreadyAwarded = true;
                this._lootMessages = this._lootMessages || [];
                this._lootMessages.push(this.skapaLootPopup(msg || 'Du fick loot.', (o && typeof o.x === 'number') ? o.x : null, (o && typeof o.y === 'number') ? o.y : null, (lootData && lootData.typ === 'item') ? lootData.itemId : null, (lootData && lootData.typ === 'item') ? (lootData.antal || 1) : 1, (lootData && lootData.typ === 'pengar') ? lootData : null));
                try { console.log('[Skogen] enemy chest loot', o.loot); } catch (e) {}
                return;
            }
            // Special handling for Ragnar's chest: give 5 random equipment and 5 different varor with quantities 1-20
            try {
                if (o.special && typeof o.special === 'string' && o.special.toLowerCase().indexOf('ragnar') !== -1) {
                    o.loot = o.loot || {};
                    o.loot.roll = 'ragnar';
                    const invMap = (spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal) || {};
                    const allKeys = Object.keys(invMap || {});
                    const blockedStartingItems = ['pilbage', 'yxa', 'stav'];
                    // equipment pool (weapons, armor, helm, shield, accessory)
                    const equipKeys = allKeys.filter(k => invMap[k] && (invMap[k].typ === 'vapen' || invMap[k].typ === 'rustning' || invMap[k].typ === 'hjalm' || invMap[k].typ === 'skold' || invMap[k].typ === 'accessoar') && blockedStartingItems.indexOf(k) === -1);
                    // vara pool
                    const varaKeys = allKeys.filter(k => invMap[k] && invMap[k].typ === 'vara');
                    // helper: shuffle array
                    const shuffle = (arr) => {
                        const a = arr.slice();
                        for (let i = a.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
                        }
                        return a;
                    };
                    const chosenEquip = shuffle(equipKeys).slice(0, 5);
                    const chosenVaror = shuffle(varaKeys).slice(0, 5);
                    const givenEquip = [];
                    const givenVaror = [];
                    // add equipments (one each)
                    for (const id of chosenEquip) {
                        try { if (spelare && spelare.utrustning) { spelare.utrustning.laggTillForemal(id); givenEquip.push(id); } } catch (e) {}
                    }
                    // add varor with random quantities 1-20
                    for (const id of chosenVaror) {
                        const qty = (id === 'titanit') ? 1 : (Math.floor(Math.random() * 20) + 1);
                        let added = 0;
                        for (let i = 0; i < qty; i++) {
                            try { if (spelare && spelare.utrustning && spelare.utrustning.laggTillForemal(id)) added++; } catch (e) {}
                        }
                        if (id === 'titanit' && added > 0) titanitTilldelad = 1;
                        givenVaror.push({ id: id, qty: added });
                    }
                    o.loot.given = { equipment: givenEquip, varor: givenVaror };
                    // Build readable message and enqueue it
                    try {
                        const msg = 'Ragnars kista gav:';
                        const popupItems = this.byggLootPopupItems([].concat(givenEquip || [], givenVaror || []));
                        this._lootMessages = this._lootMessages || [];
                        // Mark Ragnar chest as claimed so it cannot be farmed again
                        try {
                            this._startaRagnarCooldown();
                        } catch (e) {}
                        this._lootMessages.push(this.skapaLootPopup(msg, (o && typeof o.x === 'number') ? o.x : null, (o && typeof o.y === 'number') ? o.y : null, null, 1, null, popupItems));
                    } catch (e) {}
                    try { console.log('[Skogen] Ragnar kista loot', o.loot); } catch (e) {}
                    return;
                }
            } catch (e) {}
            // decide 1..6 outcome
            const roll = Math.floor(Math.random() * 6) + 1;
            o.loot = o.loot || {};
            o.loot.roll = roll;
            // helper to add a vara N times
            const addVaraN = (varaId, n) => {
                if (!spelare || !spelare.utrustning) return 0;
                let added = 0;
                for (let k = 0; k < n; k++) {
                    try { if (spelare.utrustning.laggTillForemal(varaId)) added++; } catch (e) {}
                }
                return added;
            };

            const addRandomEquipment = () => {
                if (!spelare || !spelare.utrustning) return null;
                const pool = spelare.utrustning.tillgangligaForemal || {};
                const blocklist = ['pilbage', 'yxa', 'stav'];
                const keys = Object.keys(pool).filter(k => pool[k] && (pool[k].typ === 'vapen' || pool[k].typ === 'rustning' || pool[k].typ === 'hjalm' || pool[k].typ === 'skold' || pool[k].typ === 'accessoar') && blocklist.indexOf(k) === -1);
                if (!keys || keys.length === 0) return null;
                const id = keys[Math.floor(Math.random() * keys.length)];
                try { spelare.utrustning.laggTillForemal(id); } catch (e) {}
                return id;
            };

            const addRandomVara = (count) => {
                if (!spelare || !spelare.utrustning) return [];
                const pool = spelare.utrustning.tillgangligaForemal || {};
                const keys = Object.keys(pool).filter(k => pool[k] && pool[k].typ === 'vara');
                if (!keys || keys.length === 0) return [];
                const added = [];
                for (let i = 0; i < count; i++) {
                    const kandidatKeys = titanitTilldelad > 0 ? keys.filter(k => k !== 'titanit') : keys;
                    const aktivPool = kandidatKeys.length > 0 ? kandidatKeys : keys;
                    const id = aktivPool[Math.floor(Math.random() * aktivPool.length)];
                    if (id === 'titanit' && titanitTilldelad > 0) continue;
                    try { spelare.utrustning.laggTillForemal(id); added.push(id); } catch (e) {}
                    if (id === 'titanit') titanitTilldelad = 1;
                }
                return added;
            };

            switch (roll) {
                case 1:
                    // random equipment
                    o.loot.given = { equipment: addRandomEquipment() };
                    break;
                case 2:
                    // 1-10 varor
                    const n2 = Math.floor(Math.random() * 10) + 1;
                    o.loot.given = { varor: addRandomVara(n2) };
                    break;
                case 3:
                    // random equipment
                    o.loot.given = { equipment: addRandomEquipment() };
                    break;
                case 4:
                    // spawn a random fiende near player
                    try {
                        const sx = (spelare && typeof spelare.x === 'number') ? spelare.x + 40 : Math.round(this.canvas.width / 2 + 40);
                        const sy = (spelare && typeof spelare.y === 'number') ? spelare.y : Math.round(this.canvas.height / 2);
                        this.spawnObject('fiende', sx, sy);
                        o.loot.given = { spawnedFiende: true };
                    } catch (e) { o.loot.given = { spawnedFiende: false }; }
                    break;
                case 5:
                    // 1-6 of two different varor
                    const c1 = Math.floor(Math.random() * 6) + 1;
                    const c2 = Math.floor(Math.random() * 6) + 1;
                    const v1 = addRandomVara(c1);
                    const v2 = addRandomVara(c2);
                    o.loot.given = { varor: v1.concat(v2) };
                    break;
                case 6:
                    // 1-10 varor
                    const n6 = Math.floor(Math.random() * 10) + 1;
                    o.loot.given = { varor: addRandomVara(n6) };
                    break;
            }

            try { console.log('[Skogen] kista loot', o.loot); } catch (e) {}
            // Create a readable message for the loot and enqueue it
            try {
                let msg = '';
                const spelare = this.hamtaSpelare();
                const invMap = (spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal) || {};
                const g = o.loot && o.loot.given;
                if (!g) msg = 'Inga föremål.';
                else if (g.equipment) {
                    msg = 'Du fick:';
                } else if (g.varor && Array.isArray(g.varor)) {
                    // summarize counts
                    const counts = {};
                    for (const vid of g.varor) counts[vid] = (counts[vid] || 0) + 1;
                    const parts = [];
                    for (const k of Object.keys(counts)) {
                        const n = counts[k];
                        const namn = (invMap[k] && invMap[k].namn) || k;
                        parts.push(n + '× ' + namn);
                    }
                    msg = 'Du fick:';
                } else if (g.spawnedFiende) {
                    msg = 'En fiende uppenbarade sig!';
                    try {
                        // Respawn player to this room's spawn point
                        try {
                            const sp = this.hamtaSpelare();
                            if (sp) {
                                sp.x = this.spawnX || sp.x;
                                sp.y = this.spawnY || sp.y;
                                try { if (typeof animationer !== 'undefined' && animationer && sp.klass) animationer.uppdateraAnimering(sp, false); } catch (e) {}
                            }
                        } catch (e) {}
                        // Choose a random hostile enemy from gestalter spawnPunkter if available
                        let chosenId = 'bandit';
                        try {
                            const gest = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                            let pool = [];
                            if (gest && gest.spawnPunkter) {
                                const keys = Object.keys(gest.spawnPunkter || {});
                                for (const k of keys) {
                                    try { const arr = gest.spawnPunkter[k]; if (Array.isArray(arr)) pool = pool.concat(arr); } catch (ee) {}
                                }
                                const candidates = pool.filter(d => (typeof d.hostil === 'undefined') || d.hostil !== false);
                                const pickPool = (candidates && candidates.length) ? candidates : (pool.length ? pool : []);
                                if (pickPool && pickPool.length) {
                                    const tpl = pickPool[Math.floor(Math.random() * pickPool.length)];
                                    if (tpl && tpl.id) chosenId = tpl.id;
                                }
                            }
                        } catch (e) {}
                        // Spawn the enemy slightly in front of the chest position
                        try {
                            const sx = (o && typeof o.x === 'number') ? Math.round(o.x) : Math.round(this.canvas.width / 2);
                            const sy = (o && typeof o.y === 'number') ? Math.round(o.y + 40) : Math.round(this.canvas.height / 2 + 40);
                            const gest = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
                            if (gest && typeof gest.spawnMissionEnemies === 'function') {
                                gest.spawnMissionEnemies(chosenId, 1, sx, sy);
                                try { gest.lockExit = true; } catch (e) {}
                            } else {
                                this.spawnObject('fiende', sx, sy);
                            }
                        } catch (e) {}
                    } catch (e) {}
                } else {
                    msg = 'Du fick något mystiskt.';
                }
                this._lootMessages = this._lootMessages || [];
                // attach chest position so message can be drawn above the chest
                let popupItemId = null;
                let popupAntal = 1;
                let popupItems = null;
                if (g && g.equipment) {
                    if (Array.isArray(g.equipment)) {
                        popupItems = this.byggLootPopupItems(g.equipment);
                    } else {
                        popupItemId = g.equipment;
                    }
                } else if (g && g.varor && Array.isArray(g.varor)) {
                    const uniqueIds = Array.from(new Set(g.varor));
                    if (uniqueIds.length === 1) {
                        popupItemId = uniqueIds[0];
                        popupAntal = g.varor.length;
                    } else {
                        const counts = {};
                        for (const itemId of g.varor) counts[itemId] = (counts[itemId] || 0) + 1;
                        popupItems = this.byggLootPopupItems(Object.keys(counts).map((itemId) => ({ id: itemId, qty: counts[itemId] })));
                    }
                }
                this._lootMessages.push(this.skapaLootPopup(msg, (o && typeof o.x === 'number') ? o.x : null, (o && typeof o.y === 'number') ? o.y : null, popupItemId, popupAntal, null, popupItems));
            } catch (e) { try { console.log('[Skogen] build loot message failed', e); } catch (ee) {} }
        } catch (e) { try { console.log('[Skogen] _handleKistaLoot error', e); } catch (ee) {} }
    }

    // Check whether a circle (px,py,r) intersects an axis-aligned or rotated rect b
    _pointIntersectsRect(px, py, radius, b) {
        try {
            // If rotated, rotate point into rect-local coordinates
            const cx = b.x + b.bredd / 2;
            const cy = b.y + b.hojd / 2;
            let rx = px - cx;
            let ry = py - cy;
            const angle = this._normalizeAngle(b.angle || 0);
            if (angle) {
                const c = Math.cos(-angle);
                const s = Math.sin(-angle);
                const nx = rx * c - ry * s;
                const ny = rx * s + ry * c;
                rx = nx;
                ry = ny;
            }
            const hw = b.bredd / 2;
            const hh = b.hojd / 2;
            // Closest point on rect to circle center
            const closestX = Math.max(-hw, Math.min(rx, hw));
            const closestY = Math.max(-hh, Math.min(ry, hh));
            const dx = rx - closestX;
            const dy = ry - closestY;
            return (dx * dx + dy * dy) <= (radius * radius);
        } catch (e) {
            return false;
        }
    }

    _circleIntersectsEllipse(px, py, radius, b) {
        try {
            const cx = b.x + (b.bredd || 0) / 2;
            const cy = b.y + (b.hojd || 0) / 2;
            const a = (b.bredd || 0) / 2;
            const bb = (b.hojd || 0) / 2;
            const angle = this._normalizeAngle(b.angle || 0);
            // Transform point into ellipse-local coordinates (centered and rotated)
            let rx = px - cx;
            let ry = py - cy;
            if (angle) {
                const c = Math.cos(-angle);
                const s = Math.sin(-angle);
                const nx = rx * c - ry * s;
                const ny = rx * s + ry * c;
                rx = nx; ry = ny;
            }
            // Quick inside test: point inside ellipse
            const v = (rx * rx) / (a * a + 1e-6) + (ry * ry) / (bb * bb + 1e-6);
            if (v <= 1) return true;
            // Approximate circle-ellipse collision by sampling perimeter points on ellipse
            const samples = 18;
            for (let i = 0; i < samples; i++) {
                const t = (i / samples) * Math.PI * 2;
                const ex = a * Math.cos(t);
                const ey = bb * Math.sin(t);
                const dx = rx - ex;
                const dy = ry - ey;
                if ((dx * dx + dy * dy) <= (radius * radius)) return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    _normalizeAngle(a) {
        // If angle is not numeric, return 0
        if (typeof a !== 'number') return 0;
        // If value seems large (greater than full circle in radians), assume degrees and convert
        if (Math.abs(a) > (2 * Math.PI)) return a * Math.PI / 180;
        return a;
    }

    // Draw the left-side lake options panel
    _drawSjoPanel(ctx) {
        try {
            // Only log when the visible/primed/index state changes to avoid spamming the console
            try {
                const state = `${!!this._sjoMenuPrimed}_${!!this._sjoMenuVisible}_${(this._sjoMenuIndex||0)}`;
                if (this._lastSjoPanelState !== state) {
                    this._lastSjoPanelState = state;
                    if (this._sjoMenuPrimed || this._sjoMenuVisible) {
                        console.log('[Skogen] _drawSjoPanel:', 'primed=', this._sjoMenuPrimed, 'visible=', this._sjoMenuVisible, 'index=', this._sjoMenuIndex);
                    }
                }
                // If the menu just became visible (transition from hidden->visible), ensure refills reset for this visit
                try {
                    const prevVisible = !!this._sjoMenuWasVisibleLastFrame;
                    const currVisible = !!(this._sjoMenuVisible || this._sjoMenuPrimed);
                    if (!prevVisible && currVisible) {
                        if ((this._lakeRefillsRemaining || 0) <= 0) {
                            this._lakeRefillsRemaining = 3;
                            try { console.log('[Skogen] _drawSjoPanel: menu opened, resetting _lakeRefillsRemaining to 3'); } catch (e) {}
                        }
                    }
                    this._sjoMenuWasVisibleLastFrame = currVisible;
                } catch (e) {}
            } catch (e) {}
            const canvas = this.canvas;
            const panelW = Math.max(200, Math.round(canvas.width * 0.22));
            const panelH = Math.max(160, Math.round(canvas.height * 0.4));
            const x = 8;
            const y = Math.round((canvas.height - panelH) / 2);
            ctx.save();
            // panel background
            ctx.fillStyle = 'rgba(10,25,40,0.85)';
            ctx.fillRect(x, y, panelW, panelH);
            ctx.strokeStyle = 'rgba(200,200,220,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, panelW, panelH);
            // Title
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Sjön', x + 12, y + 12);
            // Ensure menu state exists and is visible by default when drawing
            try {
                if (typeof this._sjoMenuVisible === 'undefined') this._sjoMenuVisible = true;
                if (!this._sjoMenuItems || this._sjoMenuItems.length === 0) this._sjoMenuItems = ['Fiska', 'Fyll flaskor', 'Gå vidare'];
                if (typeof this._sjoMenuIndex === 'undefined') this._sjoMenuIndex = 0;
                // If the menu was primed (preselected) ensure it's shown and the index is the first item
                if (this._sjoMenuPrimed) {
                    this._sjoMenuVisible = true;
                    this._sjoMenuIndex = 0;
                }
            } catch (e) {}
            // Menu (navigable)
            try {
                const items = (this._sjoMenuItems && this._sjoMenuItems.length > 0) ? this._sjoMenuItems : ['Fiska', 'Fyll flaskor', 'Gå vidare'];
                // If primed, ensure the index points to the first item so it is highlighted
                try { if (this._sjoMenuPrimed) this._sjoMenuIndex = 0; } catch (e) {}
                try { if (this._sjoMenuPrimed) console.log('[Skogen] _drawSjoPanel: primed -> showing initial selection', this._sjoMenuIndex, this._sjoMenuVisible); } catch (e) {}
                ctx.font = '14px Arial';
                for (let i = 0; i < items.length; i++) {
                    const iy = y + 48 + (i * 28);
                    const selected = ((this._sjoMenuVisible || this._sjoMenuPrimed) && i === (this._sjoMenuIndex || 0));
                    if (selected) {
                        // very visible highlight: solid yellow triangle + bold red text
                        try {
                            // triangle pointer
                            ctx.save();
                            ctx.fillStyle = 'rgba(255,215,0,1)';
                            ctx.beginPath();
                            ctx.moveTo(x + 6, iy + 6);
                            ctx.lineTo(x + 16, iy - 4);
                            ctx.lineTo(x + 16, iy + 16);
                            ctx.closePath();
                            ctx.fill();
                            ctx.restore();
                        } catch (e) {}
                        try { ctx.fillStyle = 'rgba(220,80,80,1)'; ctx.font = 'bold 14px Arial'; ctx.fillText(items[i], x + 26, iy); } catch (e) {}
                        try { ctx.font = '14px Arial'; } catch (e) {}
                    } else {
                        ctx.fillStyle = 'rgba(230,230,230,0.95)';
                        ctx.fillText(items[i], x + 16, iy);
                    }
                }
                ctx.fillStyle = 'rgba(180,180,200,0.9)';
                ctx.font = '12px Arial';
                try {
                    const hint = 'Använd pilarna eller W/S och tryck Enter eller E för att välja.';
                    const maxW = Math.max(40, panelW - 24);
                    const lines = (typeof wrapText === 'function') ? wrapText(ctx, hint, maxW) : [hint];
                    const lineHeight = 14;
                    const startY = y + panelH - 28 - Math.max(0, (lines.length - 1) * lineHeight);
                    for (let li = 0; li < lines.length; li++) {
                        ctx.fillText(lines[li], x + 12, startY + li * lineHeight);
                    }
                } catch (e) {
                    try { ctx.fillText('Använd pilarna eller W/S och tryck Enter eller E för att välja.', x + 12, y + panelH - 28); } catch (e) {}
                }
            } catch (e) {}
            ctx.restore();
        } catch (e) {}
    }

    // Simple fishing handler: tries to add one fish-type vara to player inventory and shows a message
    _handleFishing() {
        try {
            const spelare = this.hamtaSpelare();
            const gestalter = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
            this._lootMessages = this._lootMessages || [];
            const c = this.canvas || { width: 160, height: 120 };
            const px = Math.round((spelare && typeof spelare.x === 'number') ? spelare.x : (c.width / 2));
            const py = Math.round((spelare && typeof spelare.y === 'number') ? spelare.y : (c.height / 4));

            if (!spelare || !spelare.utrustning) {
                this._lootMessages.push({ text: 'Du kan inte fiska nu.', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                return;
            }

            // Require 1 energi
            if (typeof spelare.energi !== 'number' || spelare.energi < 1) {
                this._lootMessages.push({ text: 'Inte tillräckligt med energi för att fiska (cost: 1 energi).', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                return;
            }

            // Require 1 jarn (iron)
            let hasJarn = false;
            try {
                if (gestalter && typeof gestalter.harVaror === 'function') {
                    hasJarn = !!gestalter.harVaror(spelare, { jarn: 1 });
                } else {
                    // Manual inventory check
                    const inv = (spelare.utrustning && spelare.utrustning.inventory) ? spelare.utrustning.inventory : [];
                    let count = 0;
                    for (const it of inv) count += (it.id === 'jarn') ? (it.count || 1) : 0;
                    hasJarn = count >= 1;
                }
            } catch (e) { hasJarn = false; }

            if (!hasJarn) {
                this._lootMessages.push({ text: 'Du behöver 1 Järn för att fiska.', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                return;
            }

            // Consume costs
            try { spelare.energi = Math.max(0, (spelare.energi || 0) - 1); } catch (e) {}
            try {
                if (gestalter && typeof gestalter.taBortVaror === 'function') {
                    gestalter.taBortVaror(spelare, { jarn: 1 });
                } else {
                    // Manual remove one jarn
                    const inv = spelare.utrustning.inventory || [];
                    for (let i = inv.length - 1; i >= 0; i--) {
                        const it = inv[i];
                        if (it.id === 'jarn') {
                            if ((it.count || 1) > 1) { it.count = (it.count || 1) - 1; }
                            else { inv.splice(i, 1); }
                            break;
                        }
                    }
                }
            } catch (e) {}

            // Six possible outcomes (chance distribution):
            // 0-19: Nothing (20%)
            // 20-49: Small catch - 1× kottbit (30%)
            // 50-64: Big catch - 3× kottbit (15%)
            // 65-74: Iron find - 1-3 jarn (10%)
            // 75-89: Coins - 1-10 koppar (15%)
            // 90-99: Rare - 1× flaskaMedVatten or galdratVatten (10%)

            const roll = Math.floor(Math.random() * 100);
            let msg = 'Du fiskade men fick inget.';

            if (roll < 20) {
                // Nothing
                msg = 'Du fick inget den här gången.';
            } else if (roll < 50) {
                // Small catch
                const added = (spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') ? spelare.utrustning.laggTillForemal('kottbit') : false;
                msg = added ? 'Du fångade en liten fisk: 1× Köttbit.' : 'Du fångade något men kunde inte lägga till det i inventory.';
            } else if (roll < 65) {
                // Big catch
                try {
                    const tmpl = (spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal['kottbit'] : null;
                    if (tmpl && typeof spelare.utrustning.laggTillForemalObj === 'function') {
                        spelare.utrustning.laggTillForemalObj(Object.assign({ id: 'kottbit', count: 3 }, tmpl));
                        msg = 'Du fångade en stor fisk: 3× Köttbit.';
                    } else if (spelare.utrustning && typeof spelare.utrustning.laggTillForemalObj === 'function') {
                        spelare.utrustning.laggTillForemalObj({ id: 'kottbit', count: 3 });
                        msg = 'Du fångade en stor fisk: 3× Köttbit.';
                    } else {
                        msg = 'Du fångade en stor fisk men kunde inte lägga till den i inventory.';
                    }
                } catch (e) { msg = 'Du fångade en stor fisk men ett fel uppstod.'; }
            } else if (roll < 75) {
                // Iron find
                const n = 1 + Math.floor(Math.random() * 3);
                try {
                    const tmpl = (spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal['jarn'] : null;
                    if (tmpl && typeof spelare.utrustning.laggTillForemalObj === 'function') {
                        spelare.utrustning.laggTillForemalObj(Object.assign({ id: 'jarn', count: n }, tmpl));
                    } else if (spelare.utrustning && typeof spelare.utrustning.laggTillForemalObj === 'function') {
                        spelare.utrustning.laggTillForemalObj({ id: 'jarn', count: n });
                    }
                    msg = `Du hittade ${n}× Järn i sjön.`;
                } catch (e) { msg = 'Du hittade något men kunde inte lägga till det.'; }
            } else if (roll < 90) {
                // Coins
                const koppar = 1 + Math.floor(Math.random() * 10);
                try {
                    if (spelare && typeof spelare.laggTillPengar === 'function') {
                        spelare.laggTillPengar({ koppar }, { raknaSomIntakt: true });
                    } else {
                        spelare.pengar = spelare.pengar || { koppar: 0, silver: 0, guld: 0 };
                        spelare.pengar.koppar = (spelare.pengar.koppar || 0) + koppar;
                        if (spelare.prestationer && typeof spelare.prestationer.totaltGuldSamlat === 'number') {
                            spelare.prestationer.totaltGuldSamlat += koppar;
                        }
                        if (gestalter && typeof gestalter.normaliseraPengar === 'function') gestalter.normaliseraPengar(spelare);
                    }
                } catch (e) {}
                msg = `Du fann ${koppar} koppar i en gammal burk.`;
            } else {
                // Rare
                const rare = (Math.random() < 0.5) ? 'galdratVatten' : 'flaskaMedVatten';
                try {
                    const tmpl = (spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal[rare] : null;
                    if (tmpl && typeof spelare.utrustning.laggTillForemalObj === 'function') {
                        spelare.utrustning.laggTillForemalObj(Object.assign({ id: rare, count: 1 }, tmpl));
                    } else if (spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') {
                        spelare.utrustning.laggTillForemal(rare);
                    }
                    msg = 'Du drog upp något sällsynt från djupet!';
                } catch (e) { msg = 'Du drog upp något ovanligt men kunde inte lägga till det.'; }
            }

            this._lootMessages.push({ text: msg, created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
        } catch (e) {}
    }

    // Explicit refill handler: fill up to remaining per-visit empty bottles
    _handleRefillBottles() {
        try {
            const spelare = this.hamtaSpelare();
            const gestalter = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
            this._lootMessages = this._lootMessages || [];
            const c = this.canvas || { width: 160, height: 120 };
            const px = Math.round((spelare && typeof spelare.x === 'number') ? spelare.x : (c.width / 2));
            const py = Math.round((spelare && typeof spelare.y === 'number') ? spelare.y : (c.height / 4));

            if (!spelare || !spelare.utrustning) {
                this._lootMessages.push({ text: 'Du kan inte fylla flaskor nu.', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                return;
            }

            if (!(this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo')) {
                this._lootMessages.push({ text: 'Du måste vara vid sjön för att fylla flaskor.', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                return;
            }

            const remaining = this._lakeRefillsRemaining || 0;
            try { console.log('[Skogen] _handleRefillBottles: remaining=', remaining); } catch (e) {}
            if (remaining <= 0) {
                this._lootMessages.push({ text: 'Du kan inte fylla fler flaskor denna vistelse.', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                return;
            }

            const inv = (spelare.utrustning && spelare.utrustning.inventory) ? spelare.utrustning.inventory : [];
            let tomCount = 0;
            for (const it of inv) { try { if (it && it.id === 'tom flaska') tomCount += (it.count || 1); } catch (e) {} }
            try { console.log('[Skogen] _handleRefillBottles: tomCount=', tomCount); } catch (e) {}
            if (tomCount <= 0) {
                this._lootMessages.push({ text: 'Du har inga tomma flaskor att fylla.', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
                return;
            }

            const toFill = Math.min(tomCount, remaining);
            try {
                let removedOk = true;
                if (gestalter && typeof gestalter.taBortVaror === 'function') {
                    removedOk = !!gestalter.taBortVaror(spelare, { 'tom flaska': toFill });
                    try { console.log('[Skogen] _handleRefillBottles: taBortVaror returned', removedOk); } catch (e) {}
                } else {
                    // manual removal
                    let remainingToRemove = toFill;
                    for (let i = (spelare.utrustning.inventory || []).length - 1; i >= 0 && remainingToRemove > 0; i--) {
                        const it = spelare.utrustning.inventory[i];
                        if (!it) continue;
                        if (it.id !== 'tom flaska') continue;
                        const take = Math.min(remainingToRemove, it.count || 1);
                        it.count = (it.count || 1) - take;
                        remainingToRemove -= take;
                        if (it.count <= 0) spelare.utrustning.inventory.splice(i, 1);
                    }
                    removedOk = true;
                }
            } catch (e) {}

            try { if (!removedOk) { this._lootMessages.push({ text: 'Kunde inte ta bort tomma flaskor — kontrollera inventory.', created: Date.now(), duration: this._lootMessageDuration, x: px, y: py }); return; } } catch (e) {}

            try {
                const tmpl = (spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal['flaskaMedVatten'] : null;
                if (tmpl && typeof spelare.utrustning.laggTillForemalObj === 'function') {
                    spelare.utrustning.laggTillForemalObj(Object.assign({ id: 'flaskaMedVatten', count: toFill }, tmpl));
                } else if (spelare.utrustning && typeof spelare.utrustning.laggTillForemalObj === 'function') {
                    spelare.utrustning.laggTillForemalObj({ id: 'flaskaMedVatten', count: toFill });
                } else if (spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') {
                    for (let i = 0; i < toFill; i++) try { spelare.utrustning.laggTillForemal('flaskaMedVatten'); } catch (e) {}
                }
            } catch (e) {}

            try { this._lakeRefillsRemaining = Math.max(0, (this._lakeRefillsRemaining || 0) - toFill); } catch (e) {}
            this._lootMessages.push({ text: `Du fyllde på ${toFill} flaskor med vatten. (${this._lakeRefillsRemaining} kvar denna vistelse)`, created: Date.now(), duration: this._lootMessageDuration, x: px, y: py });
        try { if (typeof this._refreshSjoMenuLabels === 'function') this._refreshSjoMenuLabels(); } catch (e) {}
        } catch (e) {}
    }

    _handleYggdrasilInteract() {
        try {
            if (this._yggMenuVisible || this._yggMenuPrimed) {
                this._yggMenuVisible = false;
                this._yggMenuPrimed = false;
                return;
            }
            try { this._primeYggMenu(); } catch (e) {}
            return;
        } catch (e) {}
    }

    // Update the Sjö menu labels to reflect current refill state
    _refreshSjoMenuLabels() {
        try {
            const rem = (typeof this._lakeRefillsRemaining === 'number') ? this._lakeRefillsRemaining : 0;
            this._sjoMenuItems = ['Fiska', `Fyll flaskor (${rem} kvar)`, 'Gå vidare'];
        } catch (e) {}
    }

    _yggTravelTo(target) {
        try {
            if (!target) return;
            // If target is not in known worlds, ignore
            try {
                if (this._knownWorlds && Array.isArray(this._knownWorlds)) {
                    const found = this._knownWorlds.find(k => k && String(k).toLowerCase() === String(target).toLowerCase());
                    if (!found) return;
                    target = found;
                }
            } catch (e) {}
            // Close menu
            this._yggMenuVisible = false;
            this._yggMenuPrimed = false;
            // Prefer global navigator if available
            try {
                if (typeof window.gotoOmrade === 'function') {
                    window.gotoOmrade(target);
                    return;
                }
            } catch (e) {}
            // If target is a Skogen variant, switch internal variant
            try {
                if (String(target).indexOf('Skogen') === 0) {
                    this.startOmradeNamn = target;
                    this.bakgrundLaddad = false;
                    let nextImg = 'Skogen1.png';
                    if (this.startOmradeNamn === 'Skogen2') nextImg = 'Skogen2.png';
                    else if (this.startOmradeNamn === 'Skogen3') nextImg = 'Skogen3.png';
                    else if (this.startOmradeNamn === 'Skogen4') nextImg = 'Skogen4.png';
                    else if (this.startOmradeNamn === 'Skogen5') nextImg = 'Skogen5.png';
                    this.bakgrund.src = 'assets/platser/' + nextImg;
                    try { this._updateBarriers(); } catch (e) {}
                    try { const sp = this.hamtaSpelare(); if (sp) { sp.x = this.spawnX; sp.y = this.spawnY; } } catch (e) {}
                    try { this._prepareVariantSpawn(this.startOmradeNamn); this._spawnTraFynd(); } catch (e) {}
                    return;
                }
            } catch (e) {}
            // Fallback: call gaTillbaka to let main game handle navigation
            try { this._cleanupSpawnedObjectsForVariant(null); } catch (e) {}
            try { this.gaTillbaka(); } catch (e) {}
        } catch (e) {}
    }

    // Given an innerTarget like 'Skogen3', return the inner target that follows it
    // e.g. 'Skogen5' -> 'Skogen4', 'Skogen4' -> 'Skogen3', 'Skogen3' -> 'Skogen2', 'Skogen2' -> 'Skogen1'
    _nextInnerTarget(name) {
        try {
            if (!name || typeof name !== 'string') return null;
            if (name === 'Skogen5') return 'Skogen4';
            if (name === 'Skogen4') return 'Skogen3';
            if (name === 'Skogen3') return 'Skogen2';
            if (name === 'Skogen2') return 'Skogen1';
            return null;
        } catch (e) { return null; }
    }

    _getSpecialRoomReturnTarget() {
        try {
            const ps = this._previousSkogenState || null;
            if (!ps || !ps.variant || typeof ps.variant !== 'string') return null;
            if (ps.variant.toLowerCase().indexOf('skogen') !== 0) return null;
            const num = parseInt(ps.variant.replace(/[^0-9]/g, ''), 10);
            if (isNaN(num) || num <= 2) return null;
            return 'Skogen' + (num - 2);
        } catch (e) { return null; }
    }

    _resetSpecialRoomState() {
        try {
            this._sjoMenuVisible = false;
            this._sjoMenuItems = [];
            this._sjoMenuIndex = 0;
            this._sjoMenuPrimed = false;
        } catch (e) {}
        try {
            this._yggMenuVisible = false;
            this._yggMenuItems = [];
            this._yggMenuIndex = 0;
            this._yggMenuPrimed = false;
        } catch (e) {}
        try {
            if (this.exitRect && this.exitRect.meddelande && this.exitRect.meddelande.indexOf('sjön') !== -1) this.exitRect = null;
        } catch (e) {}
    }

    _leaveSpecialForestRoom() {
        try {
            if (!(this.startOmradeNamn === 'Sjö' || this.startOmradeNamn === 'Sjo' || this.startOmradeNamn === 'Yggdrasil')) return false;
            const target = this._getSpecialRoomReturnTarget();
            try { this._previousSkogenState = null; } catch (e) {}
            try { this._resetSpecialRoomState(); } catch (e) {}
            if (!target) {
                try { this._cleanupSpawnedObjectsForVariant(null); } catch (e) {}
                try { this.gaTillbaka(); } catch (e) {}
                this.eKnappNedtryckt = true;
                return true;
            }

            try { this._cleanupSpawnedObjectsForVariant(null); } catch (e) {}
            this.startOmradeNamn = target;
            this.bakgrundLaddad = false;
            try {
                let nextImg = 'Skogen1.png';
                if (this.startOmradeNamn === 'Skogen2') nextImg = 'Skogen2.png';
                else if (this.startOmradeNamn === 'Skogen3') nextImg = 'Skogen3.png';
                else if (this.startOmradeNamn === 'Skogen4') nextImg = 'Skogen4.png';
                else if (this.startOmradeNamn === 'Skogen5') nextImg = 'Skogen5.png';
                this.bakgrund.src = 'assets/platser/' + nextImg;
            } catch (e) {}
            try {
                if (this.startOmradeNamn === 'Skogen5') this.innerTarget = 'Skogen4';
                else if (this.startOmradeNamn === 'Skogen4') this.innerTarget = 'Skogen3';
                else if (this.startOmradeNamn === 'Skogen3') this.innerTarget = 'Skogen2';
                else if (this.startOmradeNamn === 'Skogen2') this.innerTarget = 'Skogen1';
                else this.innerTarget = null;
            } catch (e) {}
            try { this._updateBarriers(); } catch (e) {}
            try {
                const sp = this.hamtaSpelare();
                if (sp) { sp.x = this.spawnX; sp.y = this.spawnY; }
            } catch (e) {}
            try { this._randomEventTriggeredForThisVisit = false; this._triggerRandomEvent(); } catch (e) {}
            try { this._prepareVariantSpawn(this.startOmradeNamn); this._spawnTraFynd(); } catch (e) {}
            try { if (window.gestaltrutan && window.gestaltrutan.gestalter) window.gestaltrutan.gestalter.notaRutaBesokt(this.startOmradeNamn); } catch (e) {}
            this.eKnappNedtryckt = true;
            return true;
        } catch (e) { return false; }
    }

    // Return true if player has visited at least `n` distinct eligible worlds (exclude Skogen/Sjö/Yggdrasil)
    _hasVisitedAtLeast(n) {
        try {
            const g = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
            const visited = (g && Array.isArray(g.globalVisited)) ? g.globalVisited.slice() : [];
            const seen = new Set();
            for (let i = 0; i < visited.length; i++) {
                const name = visited[i];
                if (!name) continue;
                const nrm = String(name).trim();
                if (!nrm) continue;
                const low = nrm.toLowerCase();
                if (low.indexOf('skogen') === 0) continue;
                if (low === 'yggdrasil' || low === 'sjö' || low === 'sjo') continue;
                // keep only top-level non-skogen names
                seen.add(low);
                if (seen.size >= n) return true;
            }
            return seen.size >= n;
        } catch (e) { return false; }
    }

    _drawYggPanel(ctx) {
        try {
            const canvas = this.canvas;
            const panelW = Math.max(200, Math.round(canvas.width * 0.22));
            const panelH = Math.max(160, Math.round(canvas.height * 0.4));
            const x = 8;
            const y = Math.round((canvas.height - panelH) / 2);
            ctx.save();
            ctx.fillStyle = 'rgba(20,30,10,0.9)';
            ctx.fillRect(x, y, panelW, panelH);
            ctx.strokeStyle = 'rgba(220,220,200,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, panelW, panelH);
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Yggdrasil', x + 12, y + 12);
            ctx.font = '14px Arial';
            ctx.fillStyle = 'rgba(230,230,230,0.95)';
            if (!(this._yggMenuVisible || this._yggMenuPrimed)) {
                ctx.fillText('I - Interagera', x + 12, y + 50);
                ctx.fillText('Enter/E - Gå vidare', x + 12, y + 80);
                ctx.fillStyle = 'rgba(180,180,200,0.9)';
                ctx.font = '12px Arial';
                ctx.fillText('Känn världens uråldriga rötter.', x + 12, y + 110);
            } else {
                // Draw selectable list of visited worlds
                try {
                    if (typeof this._yggMenuIndex === 'undefined') this._yggMenuIndex = 0;
                    if (this._yggMenuPrimed) {
                        this._yggMenuVisible = true;
                        this._yggMenuIndex = 0;
                    }
                } catch (e) {}
                ctx.fillText('Välj värld att färdas till:', x + 12, y + 48);
                ctx.font = '13px Arial';
                const listYStart = y + 72;
                const lineH = 22;
                for (let i = 0; i < (this._yggMenuItems || []).length; i++) {
                    const it = this._yggMenuItems[i];
                    const yy = listYStart + i * lineH;
                    if (((this._yggMenuVisible || this._yggMenuPrimed) && i === (this._yggMenuIndex || 0))) {
                        try {
                            ctx.save();
                            ctx.fillStyle = 'rgba(255,215,0,1)';
                            ctx.beginPath();
                            ctx.moveTo(x + 6, yy + 6);
                            ctx.lineTo(x + 16, yy - 4);
                            ctx.lineTo(x + 16, yy + 16);
                            ctx.closePath();
                            ctx.fill();
                            ctx.restore();
                        } catch (e) {}
                        ctx.fillStyle = 'rgba(220,80,80,1)';
                        ctx.font = 'bold 13px Arial';
                        ctx.fillText(String(it), x + 26, yy);
                        ctx.font = '13px Arial';
                    } else {
                        ctx.fillStyle = 'rgba(220,220,220,0.95)';
                        ctx.fillText(String(it), x + 16, yy);
                    }
                }
                if (!this._yggMenuItems || this._yggMenuItems.length === 0) {
                    ctx.fillStyle = 'rgba(200,200,200,0.9)';
                    ctx.fillText('Inga tidigare besökta världar.', x + 12, y + 72);
                }
                ctx.font = '12px Arial';
                ctx.fillStyle = 'rgba(180,180,200,0.9)';
                try {
                    const hint = 'Använd pilarna eller W/S och tryck Enter eller E för att välja.';
                    const maxW = Math.max(40, panelW - 24);
                    const lines = (typeof wrapText === 'function') ? wrapText(ctx, hint, maxW) : [hint];
                    const lineHeight = 14;
                    const startY = y + panelH - 28 - Math.max(0, (lines.length - 1) * lineHeight);
                    for (let li = 0; li < lines.length; li++) {
                        ctx.fillText(lines[li], x + 12, startY + li * lineHeight);
                    }
                } catch (e) {
                    ctx.fillText('Använd pilarna eller W/S och tryck Enter eller E för att välja.', x + 12, y + panelH - 28);
                }
            }
            ctx.restore();
        } catch (e) {}
    }

    _drawAltarPanel(ctx) {
        try {
            const canvas = this.canvas;
            const panelW = Math.max(220, Math.round(canvas.width * 0.24));
            const panelH = Math.max(140, Math.round(canvas.height * 0.3));
            const x = Math.round((canvas.width - panelW) / 2);
            const y = Math.round((canvas.height - panelH) / 2);
            ctx.save();
            ctx.fillStyle = 'rgba(18,24,12,0.95)';
            ctx.fillRect(x, y, panelW, panelH);
            ctx.strokeStyle = 'rgba(200,200,180,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, panelW, panelH);
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Altaret', x + 12, y + 12);
            ctx.font = '13px Arial';
            ctx.fillStyle = 'rgba(230,230,230,0.95)';
            if (!this._altarMenuItems || this._altarMenuItems.length === 0) {
                ctx.fillText('Inga alternativ.', x + 12, y + 48);
            } else {
                const startY = y + 48;
                const lineH = 22;
                for (let i = 0; i < this._altarMenuItems.length; i++) {
                    const it = this._altarMenuItems[i];
                    const yy = startY + i * lineH;
                    if (i === (this._altarMenuIndex || 0)) {
                        ctx.fillStyle = 'rgba(80,100,40,0.95)';
                        ctx.fillRect(x + 8, yy - 2, panelW - 16, lineH);
                        ctx.fillStyle = 'rgba(255,255,255,1)';
                    } else {
                        ctx.fillStyle = 'rgba(220,220,220,0.95)';
                    }
                    ctx.fillText(String(it), x + 14, yy);
                }
                ctx.font = '12px Arial';
                ctx.fillStyle = 'rgba(180,180,200,0.9)';
                ctx.fillText('Piltangenter + Enter/E för att välja, Esc för att stänga.', x + 12, y + panelH - 26);
            }
            ctx.restore();
        } catch (e) {}
    }

    _drawAltarOfferPanel(ctx) {
        try {
            const canvas = this.canvas;
            const panelW = Math.max(320, Math.round(canvas.width * 0.34));
            const panelH = Math.max(220, Math.round(canvas.height * 0.36));
            const x = Math.round((canvas.width - panelW) / 2);
            const y = Math.round((canvas.height - panelH) / 2);
            ctx.save();
            ctx.fillStyle = 'rgba(12,18,8,0.96)';
            ctx.fillRect(x, y, panelW, panelH);
            ctx.strokeStyle = 'rgba(180,180,160,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, panelW, panelH);
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Offra vid altaret', x + 12, y + 12);
            ctx.font = '13px Arial';
            ctx.fillStyle = 'rgba(230,230,230,0.95)';
            if (!this._altarOfferMenuItems || this._altarOfferMenuItems.length === 0) {
                ctx.fillText('Inga alternativ.', x + 12, y + 48);
            } else {
                const startY = y + 48;
                const lineH = 22;
                for (let i = 0; i < this._altarOfferMenuItems.length; i++) {
                    const it = this._altarOfferMenuItems[i];
                    const yy = startY + i * lineH;
                    if (i === (this._altarOfferMenuIndex || 0)) {
                        ctx.fillStyle = 'rgba(80,100,40,0.95)';
                        ctx.fillRect(x + 8, yy - 2, panelW - 16, lineH);
                        ctx.fillStyle = 'rgba(255,255,255,1)';
                    } else {
                        ctx.fillStyle = 'rgba(220,220,220,0.95)';
                    }
                    ctx.fillText(String(it), x + 14, yy);
                }
                ctx.font = '12px Arial';
                ctx.fillStyle = 'rgba(180,180,200,0.9)';
                ctx.fillText('Använd Enter eller E för att välja, ESC för att gå tillbaka.', x + 12, y + panelH - 26);
            }
            ctx.restore();
        } catch (e) {}
    }

    _performAltarOffer(sel) {
        try {
            const spelare = this.hamtaSpelare();
            const gestalter = (window.gestaltrutan && window.gestaltrutan.gestalter) ? window.gestaltrutan.gestalter : null;
            if (!spelare || !spelare.utrustning) {
                if (gestalter) { gestalter.senasteMeddelande = 'Ingen spelare eller utrustning hittad.'; gestalter.senasteMeddelandeTid = 240; }
                this._altarOfferMenuVisible = false; this._altarOfferMode = null; return;
            }

            // Back
            if (sel && typeof sel === 'string' && sel.toLowerCase().indexOf('tillbaka') !== -1) {
                this._altarOfferMenuVisible = false;
                this._altarOfferMenuItems = [];
                this._altarOfferMode = null;
                this._altarMenuItems = this._altarMenuPrevItems || this._altarMenuItems;
                this._altarMenuPrevItems = null;
                this._altarMenuVisible = true;
                return;
            }

            // Blota: open secondary choose if selecting blota
            if (sel && typeof sel === 'string' && sel.toLowerCase().indexOf('blota') !== -1 && this._altarOfferMode !== 'blota') {
                this._altarOfferMode = 'blota';
                this._altarOfferMenuItems = ['Blota: Konstruktion', 'Blota: Reflex', 'Blota: Special', 'Tillbaka'];
                this._altarOfferMenuIndex = 0;
                return;
            }

            // If in blota mode and a specific stat chosen
            if (this._altarOfferMode === 'blota' && sel && typeof sel === 'string' && sel.toLowerCase().indexOf('blota:') === 0) {
                // map selection
                let key = null;
                if (sel.toLowerCase().indexOf('konstruktion') !== -1) key = 'konstruktion';
                else if (sel.toLowerCase().indexOf('reflex') !== -1) key = 'reflex';
                else if (sel.toLowerCase().indexOf('special') !== -1) key = 'special';
                if (!key) return;
                // require 9 kottbit
                const krav = {}; krav['kottbit'] = 9;
                if (!gestalter || !gestalter.harVaror(spelare, krav)) {
                    if (gestalter) { gestalter.senasteMeddelande = 'Du behöver 9 köttbitar.'; gestalter.senasteMeddelandeTid = 240; }
                    return;
                }
                const ok = gestalter.taBortVaror(spelare, krav);
                if (!ok) {
                    if (gestalter) { gestalter.senasteMeddelande = 'Kunde inte ta bort köttbitar.'; gestalter.senasteMeddelandeTid = 240; }
                    return;
                }
                // apply requirement increase
                spelare.krav = spelare.krav || { konstruktion: 1, reflex: 1, special: 1, max: 8 };
                const max = spelare.krav.max || 8;
                const cur = spelare.krav[key] || 0;
                if (cur >= max) {
                    if (gestalter) { gestalter.senasteMeddelande = 'Den nivån är redan max.'; gestalter.senasteMeddelandeTid = 240; }
                } else {
                    spelare.krav[key] = Math.min(max, cur + 1);
                    if (gestalter) { gestalter.senasteMeddelande = 'Kravnivå höjd!'; gestalter.senasteMeddelandeTid = 240; }
                }
                // close offer menu and return to main altar menu
                this._altarOfferMenuVisible = false; this._altarOfferMode = null; this._altarOfferMenuItems = [];
                this._altarMenuItems = this._altarMenuPrevItems || this._altarMenuItems; this._altarMenuPrevItems = null; this._altarMenuVisible = true;
                return;
            }

            // Offra resource exchanges
            if (sel && typeof sel === 'string') {
                const low = sel.toLowerCase();
                // Offra 3 Järn -> 1-20 Järn
                if (low.indexOf('offra 3 järn') !== -1) {
                    try {
                        if (this._globalAltarOffersUsed && this._globalAltarOffersUsed['jarn']) {
                            if (gestalter) { gestalter.senasteMeddelande = 'Denna offer av Järn kan endast användas en gång per skogsbesök.'; gestalter.senasteMeddelandeTid = 240; }
                            return;
                        }
                    } catch (e) {}
                    const krav = { jarn: 3 };
                    if (!gestalter || !gestalter.harVaror(spelare, krav)) { if (gestalter) { gestalter.senasteMeddelande = 'Du behöver 3 Järn.'; gestalter.senasteMeddelandeTid = 240; } return; }
                    const ok = gestalter.taBortVaror(spelare, krav);
                    if (!ok) { if (gestalter) { gestalter.senasteMeddelande = 'Kunde inte ta bort Järn.'; gestalter.senasteMeddelandeTid = 240; } return; }
                    const n = 1 + Math.floor(Math.random() * 20);
                    try {
                        const tmpl = (spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal['jarn'] : null;
                        if (tmpl) spelare.utrustning.laggTillForemalObj(Object.assign({ id: 'jarn', count: n }, tmpl));
                        else spelare.utrustning.laggTillForemalObj({ id: 'jarn', count: n });
                    } catch (e) { try { spelare.utrustning.laggTillForemalObj({ id: 'jarn', count: n }); } catch (ee) {} }
                    try { this._globalAltarOffersUsed = this._globalAltarOffersUsed || {}; this._globalAltarOffersUsed['jarn'] = true; } catch (e) {}
                    // Trigger Ragnar cooldown
                    try {
                        this._startaRagnarCooldown();
                        if (gestalter) { gestalter.senasteMeddelande = 'Ragnar har vaknat — hans kista kommer inte åter förrän du besökt 5 andra platser.'; gestalter.senasteMeddelandeTid = 360; }
                    } catch (e) {}
                    if (gestalter) { gestalter.senasteMeddelande = `Du offrade 3 Järn och fick ${n} Järn.`; gestalter.senasteMeddelandeTid = 240; }
                    this._altarOfferMenuVisible = false; this._altarMenuItems = this._altarMenuPrevItems || this._altarMenuItems; this._altarMenuPrevItems = null; this._altarMenuVisible = true; return;
                }
                // Offra 3 Sten -> 1-100 Sten
                if (low.indexOf('offra 3 sten') !== -1) {
                    try {
                        if (this._globalAltarOffersUsed && this._globalAltarOffersUsed['sten']) {
                            if (gestalter) { gestalter.senasteMeddelande = 'Denna offer av Sten kan endast användas en gång per skogsbesök.'; gestalter.senasteMeddelandeTid = 240; }
                            return;
                        }
                    } catch (e) {}
                    const krav = { sten: 3 };
                    if (!gestalter || !gestalter.harVaror(spelare, krav)) { if (gestalter) { gestalter.senasteMeddelande = 'Du behöver 3 Sten.'; gestalter.senasteMeddelandeTid = 240; } return; }
                    const ok = gestalter.taBortVaror(spelare, krav);
                    if (!ok) { if (gestalter) { gestalter.senasteMeddelande = 'Kunde inte ta bort Sten.'; gestalter.senasteMeddelandeTid = 240; } return; }
                    const n = 1 + Math.floor(Math.random() * 100);
                    try {
                        const tmpl = (spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal['sten'] : null;
                        if (tmpl) spelare.utrustning.laggTillForemalObj(Object.assign({ id: 'sten', count: n }, tmpl));
                        else spelare.utrustning.laggTillForemalObj({ id: 'sten', count: n });
                    } catch (e) { try { spelare.utrustning.laggTillForemalObj({ id: 'sten', count: n }); } catch (ee) {} }
                    try { this._globalAltarOffersUsed = this._globalAltarOffersUsed || {}; this._globalAltarOffersUsed['sten'] = true; } catch (e) {}
                    // Trigger Ragnar cooldown
                    try {
                        this._startaRagnarCooldown();
                        if (gestalter) { gestalter.senasteMeddelande = 'Ragnar har vaknat — hans kista kommer inte åter förrän du besökt 5 andra platser.'; gestalter.senasteMeddelandeTid = 360; }
                    } catch (e) {}
                    if (gestalter) { gestalter.senasteMeddelande = `Du offrade 3 Sten och fick ${n} Sten.`; gestalter.senasteMeddelandeTid = 240; }
                    this._altarOfferMenuVisible = false; this._altarMenuItems = this._altarMenuPrevItems || this._altarMenuItems; this._altarMenuPrevItems = null; this._altarMenuVisible = true; return;
                }
                // Offra 3 Trä -> 1-60 Trä
                if (low.indexOf('offra 3 trä') !== -1 || low.indexOf('offra 3 tr') !== -1) {
                    try {
                        if (this._globalAltarOffersUsed && this._globalAltarOffersUsed['tra']) {
                            if (gestalter) { gestalter.senasteMeddelande = 'Denna offer av Trä kan endast användas en gång per skogsbesök.'; gestalter.senasteMeddelandeTid = 240; }
                            return;
                        }
                    } catch (e) {}
                    const krav = { tra: 3 };
                    if (!gestalter || !gestalter.harVaror(spelare, krav)) { if (gestalter) { gestalter.senasteMeddelande = 'Du behöver 3 Trä.'; gestalter.senasteMeddelandeTid = 240; } return; }
                    const ok = gestalter.taBortVaror(spelare, krav);
                    if (!ok) { if (gestalter) { gestalter.senasteMeddelande = 'Kunde inte ta bort Trä.'; gestalter.senasteMeddelandeTid = 240; } return; }
                    const n = 1 + Math.floor(Math.random() * 60);
                    try {
                        const tmpl = (spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal['tra'] : null;
                        if (tmpl) spelare.utrustning.laggTillForemalObj(Object.assign({ id: 'tra', count: n }, tmpl));
                        else spelare.utrustning.laggTillForemalObj({ id: 'tra', count: n });
                    } catch (e) { try { spelare.utrustning.laggTillForemalObj({ id: 'tra', count: n }); } catch (ee) {} }
                    try { this._globalAltarOffersUsed = this._globalAltarOffersUsed || {}; this._globalAltarOffersUsed['tra'] = true; } catch (e) {}
                    // Trigger Ragnar cooldown
                    try {
                        this._startaRagnarCooldown();
                        if (gestalter) { gestalter.senasteMeddelande = 'Ragnar har vaknat — hans kista kommer inte åter förrän du besökt 5 andra platser.'; gestalter.senasteMeddelandeTid = 360; }
                    } catch (e) {}
                    if (gestalter) { gestalter.senasteMeddelande = `Du offrade 3 Trä och fick ${n} Trä.`; gestalter.senasteMeddelandeTid = 240; }
                    this._altarOfferMenuVisible = false; this._altarMenuItems = this._altarMenuPrevItems || this._altarMenuItems; this._altarMenuPrevItems = null; this._altarMenuVisible = true; return;
                }
                // Galdra 3 Flaskor med Vatten -> 3 Galdrat Vatten (transform)
                if (low.indexOf('galdra') !== -1 && low.indexOf('flaskor') !== -1) {
                    const krav = { flaskaMedVatten: 3 };
                    if (!gestalter || !gestalter.harVaror(spelare, krav)) { if (gestalter) { gestalter.senasteMeddelande = 'Du behöver 3 Flaskor med Vatten.'; gestalter.senasteMeddelandeTid = 240; } return; }
                    const ok = gestalter.taBortVaror(spelare, krav);
                    if (!ok) { if (gestalter) { gestalter.senasteMeddelande = 'Kunde inte ta bort flaskor med vatten.'; gestalter.senasteMeddelandeTid = 240; } return; }
                    // add 3 galdratVatten
                    try {
                        const tmpl = (spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal['galdratVatten'] : null;
                        if (tmpl) spelare.utrustning.laggTillForemalObj(Object.assign({ id: 'galdratVatten', count: 3 }, tmpl));
                        else spelare.utrustning.laggTillForemalObj({ id: 'galdratVatten', count: 3 });
                    } catch (e) { try { spelare.utrustning.laggTillForemalObj({ id: 'galdratVatten', count: 3 }); } catch (ee) {} }
                    if (gestalter) { gestalter.senasteMeddelande = 'Du galdade 3 flaskor till 3 Galdrat Vatten.'; gestalter.senasteMeddelandeTid = 240; }
                    this._altarOfferMenuVisible = false; this._altarMenuItems = this._altarMenuPrevItems || this._altarMenuItems; this._altarMenuPrevItems = null; this._altarMenuVisible = true; return;
                }
            }

        } catch (e) {
            try { console.error('[Skogen] altar offer failed', e, { selection: sel }); } catch (ee) {}
            try {
                if (window.gestaltrutan && window.gestaltrutan.gestalter) {
                    window.gestaltrutan.gestalter.senasteMeddelande = 'Offer misslyckades. Prova igen.';
                    window.gestaltrutan.gestalter.senasteMeddelandeTid = 240;
                }
            } catch (ee) {}
        }
    }
}
