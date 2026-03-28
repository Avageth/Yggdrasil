// Uppdrag.js
// Modul för att hantera uppdragsdata och logik

class Uppdrag {
    constructor({ id, namn, beskrivning, beloning, status = 'ledig' }) {
        this.id = id;
        this.namn = namn;
        this.beskrivning = beskrivning;
        this.beloning = beloning;
        this.status = status; // 'ledig' eller 'tagen'
    }

    // Exempelmetod: kontrollera om uppdraget är klart
    arKlar(spelare) {
        // Implementera logik beroende på uppdragstyp
        return false;
    }
}

function normaliseraUppdragsText(text) {
    return (text || '')
        .toLowerCase()
        .trim()
        .replace(/[.,!?]/g, '')
        .replace(/å/g, 'a')
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/é/g, 'e');
}

function hamtaSpelarInteraktionsRakning(spelare) {
    const interaktioner = spelare && spelare.prestationer && spelare.prestationer.interaktioner
        ? spelare.prestationer.interaktioner
        : {};

    return {
        hjalpareMoten: Number(interaktioner.hjalpareMoten) || 0,
        lognareMoten: Number(interaktioner.lognareMoten) || 0,
        behovAvHjalpHjalpta: Number(interaktioner.behovAvHjalpHjalpta) || 0,
        behovAvHjalpForradda: Number(interaktioner.behovAvHjalpForradda) || 0
    };
}

function parseInteraktionsKrav(desc) {
    const beskrivning = desc || '';
    const krav = [];
    const textTillTal = {
        'ett': 1,
        'en': 1,
        'två': 2,
        'tre': 3,
        'fyra': 4,
        'fem': 5,
        'sex': 6,
        'sju': 7,
        'åtta': 8,
        'nio': 9,
        'tio': 10
    };
    const lasAntal = (matchGrupp) => {
        if (!matchGrupp) return 1;
        const tal = parseInt(matchGrupp, 10);
        return Number.isNaN(tal) ? (textTillTal[matchGrupp.toLowerCase()] || 1) : tal;
    };

    let match = beskrivning.match(/stöt på\s+(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio)?\s*(hjälpare|hjalpare|lögnare|lognare)/i);
    if (match) {
        const mal = normaliseraUppdragsText(match[2]);
        if (mal.indexOf('hjalpare') !== -1) {
            krav.push({ key: 'hjalpareMoten', namn: 'Hjälpare', antal: lasAntal(match[1]) });
        } else if (mal.indexOf('lognare') !== -1) {
            krav.push({ key: 'lognareMoten', namn: 'Lögnare', antal: lasAntal(match[1]) });
        }
    }

    match = beskrivning.match(/hjälp\s+(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio|någon)?\s*(?:person|personer)?\s*som är i behov av hjälp/i);
    if (match) {
        krav.push({ key: 'behovAvHjalpHjalpta', namn: 'Hjälpta', antal: lasAntal(match[1] === 'någon' ? 'en' : match[1]) });
    }

    match = beskrivning.match(/föråd\s+(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio|någon)?\s*(?:person|personer)?\s*som är i behov av hjälp/i);
    if (match) {
        krav.push({ key: 'behovAvHjalpForradda', namn: 'Förrådda', antal: lasAntal(match[1] === 'någon' ? 'en' : match[1]) });
    }

    return krav;
}

function beraknaInteraktionsProgress(desc, spelare, uppdrag) {
    try {
        const krav = parseInteraktionsKrav(desc);
        if (!krav.length) return null;

        const rakning = hamtaSpelarInteraktionsRakning(spelare);
        const baseline = (uppdrag && uppdrag.acceptedInteractionCounts) || {};
        let allDone = true;
        const progressText = krav.map((kravPost) => {
            const bas = Number(baseline[kravPost.key]) || 0;
            const total = Number(rakning[kravPost.key]) || 0;
            const antalHar = Math.max(0, total - bas);
            if (antalHar < kravPost.antal) {
                allDone = false;
            }
            return `${kravPost.namn}: ${antalHar}/${kravPost.antal}`;
        }).join(', ');

        return { krav, allDone, progressText };
    } catch (e) {
        try {
            if (typeof console !== 'undefined') {
                console.error('Kunde inte räkna interaktionsprogress', { desc, uppdrag, error: e });
            }
        } catch (ignored) {}
        return null;
    }
}

function raknaQuestTaggedItemsForUppdrag(spelare, uppdragId) {
    if (!spelare || !spelare.utrustning || !Array.isArray(spelare.utrustning.inventory) || !uppdragId) return 0;
    return spelare.utrustning.inventory.reduce((sum, item) => {
        if (!item || item.questFor !== uppdragId) return sum;
        return sum + (item.count || 1);
    }, 0);
}

// Funktion för att rita uppdragsrutor på uppdragCanvas
function ritaUppdragsPlatser(uppdragLista = []) {
    const canvas = document.getElementById('uppdragCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Initiera canvas-styrning för scroll/hover (enda gången)
    if (!window._uppdragCanvasState) {
        window._uppdragCanvasState = { mouseX: 0, mouseY: 0, hoverIndex: -1, scrollTarget: 0, scrollOffset: 0, scrollMax: 0, showDescriptionIndex: null, _buttonBounds: {} };
        const state = window._uppdragCanvasState;
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            state.mouseX = e.clientX - rect.left;
            state.mouseY = e.clientY - rect.top;
        });
        canvas.addEventListener('wheel', (e) => {
            // Determine which slot to scroll: expanded description if open, otherwise hovered slot
            const targetIndex = (state.showDescriptionIndex !== null) ? state.showDescriptionIndex : state.hoverIndex;
            if (typeof targetIndex === 'number' && targetIndex >= 0 && state.scrollMax > 0) {
                const multiplier = 1.2;
                state.scrollTarget = Math.max(0, Math.min(state.scrollTarget + e.deltaY * multiplier, state.scrollMax));
                e.preventDefault();
            }
        }, { passive: false });

        // Click handler for buttons (Visa beskrivning / Stäng)
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            // Check stored button bounds for each slot
            const bounds = state._buttonBounds || {};
            for (const key of Object.keys(bounds)) {
                const b = bounds[key];
                if (!b) continue;
                if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
                    // If the button is a show button, toggle the description view for that index
                    if (b.type === 'show') {
                        state.showDescriptionIndex = Number(key);
                        // reset scroll when showing description
                        state.scrollTarget = 0;
                        state.scrollOffset = 0;
                    } else if (b.type === 'close') {
                        state.showDescriptionIndex = null;
                    }
                    // prevent other handlers
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
            // If click outside any button, and a description is open, close it
            if (state.showDescriptionIndex !== null) {
                state.showDescriptionIndex = null;
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }
    const state = window._uppdragCanvasState;
    // Reset button bounds each frame to avoid stale hit targets
    state._buttonBounds = {};
    state._pengarHoverInfo = null;

    // Dela in i 4 lika stora rutor
    const platsBredd = canvas.width / 4;
    const platsHojd = canvas.height;
    for (let i = 0; i < 4; i++) {
        const x = i * platsBredd;
        // Bakgrundsplatta
        ctx.save();
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(30,40,40,0.92)';
        ctx.beginPath();
        ctx.roundRect(x + 12, 18, platsBredd - 24, platsHojd - 36, 18);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        try {
        // Rita uppdragets info om det finns ett uppdrag på platsen
        if (uppdragLista[i]) {
            const uppdrag = uppdragLista[i];
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            // Automatisk radbrytning för namn, men försök först att skala ner textstorleken så den får plats på en rad
            const maxWidth = platsBredd - 36;
            let nameLines = [];
            let nameY = 48;
            // Adaptive title size: try to fit on one line by reducing font size
            const baseFontSize = 18;
            const minFontSize = 12;
            let fontSize = baseFontSize;
            let measured = 0;
            let usedFont = `bold ${baseFontSize}px Arial`;
            while (fontSize >= minFontSize) {
                usedFont = `bold ${fontSize}px Arial`;
                ctx.font = usedFont;
                measured = ctx.measureText(uppdrag.namn).width;
                if (measured <= maxWidth) break;
                fontSize--;
            }
            ctx.font = usedFont;
            if (measured <= maxWidth) {
                nameLines = [uppdrag.namn];
                ctx.fillText(uppdrag.namn, x + platsBredd / 2, nameY);
            } else {
                // Fallback: om den fortfarande är för lång, radbryt som tidigare
                nameLines = wrapText(ctx, uppdrag.namn, maxWidth);
                nameLines.forEach((line, idx) => {
                    ctx.fillText(line, x + platsBredd / 2, nameY + idx * 22);
                });
            }

            ctx.font = '14px Arial';
            ctx.fillStyle = '#9be7ff';

            // Automatisk radbrytning för beskrivning (med scrollbar-stöd)
            const desc = uppdrag.beskrivning || '';
            let descLines = wrapText(ctx, desc, maxWidth);
            let descY = 80 + (nameLines.length - 1) * 22;
            // Bestäm synlig area för beskrivningen, reservera utrymme längst ner för progress + belöning
            // Öka reserverat utrymme så progress-text inte kan överlappa beskrivningen
            const reservedBottom = 110; // plats för progress + belöning + status
            const descVisibleH = Math.max(40, platsHojd - descY - reservedBottom);
            // Mät total höjd och uppdatera scroll-max i delat state
            const totalH = descLines.length * 18;
            state.scrollMax = Math.max(0, totalH - descVisibleH);
            // Klampa scroll-target och offset så de alltid ligger i giltigt intervall
            state.scrollTarget = Math.max(0, Math.min(state.scrollTarget || 0, state.scrollMax));
            state.scrollOffset = Math.max(0, Math.min(state.scrollOffset || 0, state.scrollMax));
            // Om musen är över denna ruta, markera hoverIndex
            if (state.mouseX >= x + 12 && state.mouseX <= x + platsBredd - 12 && state.mouseY >= 18 && state.mouseY <= platsHojd - 18) {
                state.hoverIndex = i;
            } else if (state.hoverIndex === i) {
                state.hoverIndex = -1;
            }
            // Smooth-scroll update (faster interpolation for snappier feel)
            state.scrollOffset += (state.scrollTarget - state.scrollOffset) * 0.45;
            if (Math.abs(state.scrollTarget - state.scrollOffset) < 0.5) state.scrollOffset = state.scrollTarget;

            // If the user opened the big description view for this slot, render alternate flipped view
            if (state.showDescriptionIndex === i) {
                // Draw a full-description view without dark background (integrated with card)
                ctx.save();
                // Description area (no dark overlay)
                ctx.font = '14px Arial';
                ctx.fillStyle = '#dfefff';
                ctx.textBaseline = 'top';
                const pad = 24;
                const descAreaX = x + 18 + pad/2;
                const descAreaY = 80;
                const descAreaW = platsBredd - 36 - pad;
                // Place close button a fixed distance from bottom, and let description area extend up to it
                const btnH = 32;
                const btnBottomMargin = 16;
                const btnY = platsHojd - btnH - btnBottomMargin;
                const descAreaH = Math.max(0, btnY - descAreaY - 8);
                ctx.beginPath();
                ctx.rect(descAreaX, descAreaY, descAreaW, descAreaH);
                ctx.clip();
                const lines = wrapText(ctx, desc, descAreaW);
                // Render lines left-aligned and allow them to occupy the full desc area down to the bottom.
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffffff';
                const lineH = 20;
                for (let idx = 0; idx < lines.length; idx++) {
                    const yLine = descAreaY + idx * lineH;
                    // Stop drawing when reaching bottom of the description area
                    if (yLine > descAreaY + descAreaH - lineH) break;
                    ctx.fillText(lines[idx], descAreaX, yLine);
                }

                // Draw close button inside card (position consistent with descAreaH)
                const btnW = 100;
                const btnX = x + platsBredd / 2 - btnW/2;
                ctx.fillStyle = '#16213e';
                ctx.fillRect(btnX, btnY, btnW, btnH);
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2;
                ctx.strokeRect(btnX, btnY, btnW, btnH);
                ctx.fillStyle = '#00ff88';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Stäng', btnX + btnW/2, btnY + btnH/2);
                // Store close-button bounds
                state._buttonBounds[i] = { x: btnX, y: btnY, w: btnW, h: btnH, type: 'close' };
                ctx.restore();
                // Don't render the rest of the small card elements
                continue;
            }

            // Draw 'Visa beskrivning' button placed where the description starts
            const showBtnW = 160;
            const showBtnH = 30;
            const showBtnX = x + (platsBredd - showBtnW) / 2;
            const showBtnY = descY; // place at top of description area
            ctx.fillStyle = '#16213e';
            ctx.fillRect(showBtnX, showBtnY, showBtnW, showBtnH);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(showBtnX, showBtnY, showBtnW, showBtnH);
            ctx.fillStyle = '#00ff88';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Visa beskrivning', showBtnX + showBtnW/2, showBtnY + showBtnH/2);
            // Store button bounds for click handling
            state._buttonBounds[i] = { x: showBtnX, y: showBtnY, w: showBtnW, h: showBtnH, type: 'show' };

            // If the small card isn't flipped open, hide the regular description text (user requested)
            // but still render the scrollbar preview area (empty) so layout stays consistent.
            if (state.showDescriptionIndex !== i) {
                // draw empty clipped area to keep visuals consistent
                ctx.save();
                ctx.beginPath();
                ctx.rect(x + 18, descY + showBtnH + 6, maxWidth, descVisibleH - showBtnH - 6);
                ctx.clip();
                ctx.textBaseline = 'top';
                // Optionally, could draw a short teaser here; for now leave empty as requested
                ctx.restore();
            } else {
                // If flipped, the flipped view code above already handled full description and continue'd
            }

            // Visa progress för "lämna in"-uppdrag och förbered displaytext
            let progressText = '';
            let allDone = false;
            if (uppdrag.status === 'tagen') {
                const world = (typeof window !== 'undefined' && window.varlden) || (typeof varlden !== 'undefined' && varlden) || null;
                if (/lämna(?:\s+\S+){0,4}\s+in/i.test(desc)) {
                    const uppdragsBeskrivningLower = (uppdrag.beskrivning || '').toLowerCase();
                    const arChansQuest = uppdragsBeskrivningLower.includes('chansruta') || uppdragsBeskrivningLower.includes('chansrutan');
                    const questChansType = uppdrag.questChansType || (arChansQuest
                        ? (uppdragsBeskrivningLower.includes('vara')
                            ? 'vara'
                            : (uppdragsBeskrivningLower.includes('utrustning') ? 'utrustning' : null))
                        : null);
                    if (questChansType) {
                        const spelare = world && world.spelare;
                        const antalQuestItems = raknaQuestTaggedItemsForUppdrag(spelare, uppdrag.id);
                        allDone = antalQuestItems > 0;
                        progressText = `Uppdragsföremål: ${Math.min(antalQuestItems, 1)}/1`;
                    } else {
                    let krav = parseLaminaInKrav(desc);
                    // Räkna endast föremål i inventory (ej utrustade)
                    let inventory = [];
                    if (world && world.spelare && world.spelare.utrustning) {
                        inventory = world.spelare.utrustning.inventory || [];
                    }
                    allDone = true;
                    krav.forEach((k, idx) => {
                    // Debug: logga krav och inventory för felsökning (endast om inventory är tomt)
                    try {
                        if (typeof console !== 'undefined') {
                            const invSummary = inventory.filter(Boolean).map(it => ({ id: it.id, namn: it.namn, count: it.count || 1 }));
                            if (invSummary.length === 0) {
                                if (typeof window !== 'undefined' && window.UPPDRAG_DEBUG) console.log('[Uppdrag DEBUG] krav:', k, 'inventorySummary:', invSummary, 'worldPresent:', !!world);
                            }
                        }
                    } catch (e) {}
                    // Matcha på id och namn, normalisera svenska tecken
                    const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                    let namnNorm = normalize(k.namn);
                    let antalHar = inventory.filter(f => f && (() => {
                        let idMatch = normalize(f.id) === namnNorm;
                        let namnMatch = normalize(f.namn) === namnNorm;
                        return idMatch || namnMatch;
                    })()).reduce((sum, f) => sum + (f.count || 1), 0);
                    if (antalHar < k.antal) allDone = false;
                    // Visa svenska namn med stor bokstav
                    let visningsnamn = k.namn.charAt(0).toUpperCase() + k.namn.slice(1);
                    progressText += `${visningsnamn}: ${antalHar}/${k.antal}` + (idx < krav.length-1 ? ', ' : '');
                    });
                    }
                } else {
                    const interactionProgress = beraknaInteraktionsProgress(desc, world && world.spelare, uppdrag);
                    if (interactionProgress) {
                        allDone = interactionProgress.allDone;
                        progressText = interactionProgress.progressText;
                    } else if (/(?:döda|dräpa|dräp|drapa|slå ihjäl)/i.test(desc)) {
                    // Döda/dräpa-uppdrag: räkna via prestationer (fiendesBesegrade)
                    let krav = parseDodaKrav(desc);
                    const totalKills = (world && world.spelare && world.spelare.prestationer && world.spelare.prestationer.fiendesBesegrade) || 0;
                    const killsByType = (world && world.spelare && world.spelare.prestationer && world.spelare.prestationer.killsByType) || {};
                    // Hämta baseline från uppdraget (sattes vid accept i Långhuset)
                    const baselineTotal = (uppdrag && uppdrag.acceptedKillsTotal) || 0;
                    const baselineByType = (uppdrag && uppdrag.acceptedKillsByType) || {};
                    const effectiveTotal = Math.max(0, totalKills - baselineTotal);
                    try {
                        if (typeof window !== 'undefined' && window.UPPDRAG_DEBUG) console.log('[Uppdrag DEBUG] kill-quest parsed krav=', krav, 'playerKillsTotal=', totalKills, 'baselineTotal=', baselineTotal, 'effectiveTotal=', effectiveTotal, 'killsByType=', killsByType, 'baselineByType=', baselineByType, 'desc=', desc);
                    } catch (e) {}
                    allDone = true;
                    krav.forEach((k, idx) => {
                        // Försök matcha per-typ först (post-acceptance), annars fallback till post-acceptance total
                        const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                        const key = normalize(k.namn);
                        const rawByType = killsByType[key] || 0;
                        const baselineForKey = baselineByType[key] || 0;
                        const byType = Math.max(0, rawByType - baselineForKey);
                        // Bestäm om kravet är generiskt (t.ex. "fiende" eller "djur").
                        // Endast mer generiska krav får falla tillbaka till totalantal;
                        // specifika namn måste matchas per-typ.
                        const isGeneric = /fiend|djur/i.test(k.namn);
                        let antalHar = isGeneric ? effectiveTotal : byType;
                        if (antalHar < k.antal) allDone = false;
                        let visningsnamn = k.namn.charAt(0).toUpperCase() + k.namn.slice(1);
                        progressText += `${visningsnamn}: ${antalHar}/${k.antal}` + (idx < krav.length-1 ? ', ' : '');
                    });
                    }
                }
            }

            // Rita en tunn scrollbar om det finns overflow
            if (state.scrollMax > 0) {
                const barX = x + 18 + maxWidth - 6;
                // If we're showing the small-card button, draw scrollbar below it
                const barY = descY + showBtnH + 6;
                const barH = Math.max(12, descVisibleH - showBtnH - 6);
                const thumbH = Math.max(12, Math.round(barH * (descVisibleH / (totalH || descVisibleH))));
                const thumbY = barY + Math.round((state.scrollOffset / (state.scrollMax || 1)) * Math.max(0, (barH - thumbH)));
                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.fillRect(barX, barY, 6, barH);
                ctx.fillStyle = 'rgba(255,255,255,0.22)';
                ctx.fillRect(barX, thumbY, 6, thumbH);
                ctx.restore();
            }
// Hjälpfunktion för att tolka "lämna in"-krav från beskrivning
function normaliseraLaminaInForemalNamn(namn) {
    const normalize = (s) => (s || '')
        .toLowerCase()
        .trim()
        .replace(/[.,!?]/g, '')
        .replace(/å/g, 'a')
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/é/g, 'e');

    const namnNorm = normalize(namn);
    const namnMap = {
        'kottbit': 'kottbit',
        'kottbitar': 'kottbit',
        'kott': 'kottbit',
        'jarn': 'jarn',
        'sten': 'sten',
        'tra': 'tra',
        'titanit': 'titanit',
        'tom flaska': 'tom flaska',
        'tom flaska': 'tom flaska',
        'tomma flaskor': 'tom flaska',
        'flaska med vatten': 'flaskaMedVatten',
        'flaska med vatten': 'flaskaMedVatten',
        'flaskor med vatten': 'flaskaMedVatten',
        'galdrat vatten': 'galdratVatten'
    };

    return namnMap[namnNorm] || namnNorm;
}

function parseLaminaInKrav(desc) {
    // Exempel: "Lämna in två kött och två järn till ett långhus."
    let krav = [];
    let match = desc.match(/lämna in ([^.]*) till/i);
    if (match) {
        let delar = match[1].split(' och ');
        delar.forEach(del => {
            let m = del.trim().match(/(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio)\s+([a-zåäöA-ZÅÄÖ\s]+)/i);
            if (m) {
                let antal = isNaN(parseInt(m[1])) ? textTillSiffra(m[1].toLowerCase()) : parseInt(m[1]);
                krav.push({ namn: normaliseraLaminaInForemalNamn(m[2]), antal });
            }
        });
    }
    return krav;
}

function normaliseraDodaKravNamn(namn) {
    const normaliserat = normaliseraUppdragsText(namn);
    const namnMap = {
        bandit: 'bandit',
        banditer: 'bandit',
        blodvarg: 'blodvarg',
        blodvargar: 'blodvarg',
        barsark: 'barsark',
        barsarker: 'barsark',
        'bärsärk': 'barsark',
        'bärsärker': 'barsark',
        bonde: 'bonde',
        bonder: 'bonde',
        bönder: 'bonde',
        prast: 'prast',
        praster: 'prast',
        'präst': 'prast',
        'präster': 'prast',
        viking: 'viking',
        vikingar: 'viking',
        fiende: 'fiende',
        fiender: 'fiende',
        djur: 'djur'
    };
    return namnMap[normaliserat] || normaliserat;
}

// Parser för "döda/dräpa"-krav, ex: "Döda två vargar och en björn."
function parseDodaKrav(desc) {
    let krav = [];
    // Matcha flera verbvarianter: döda, dräpa, dräp, drapa, slå ihjäl
    let match = desc.match(/(?:döda|dräpa|dräp|drapa|slå ihjäl) ([^.]*)/i);
    if (match) {
        let delar = match[1].split(' och ');
        delar.forEach(del => {
            let m = del.trim().match(/(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio)?\s*([a-zåäöA-ZÅÄÖ]+)/i);
            if (m) {
                let antal = m[1] ? (isNaN(parseInt(m[1])) ? textTillSiffra(m[1].toLowerCase()) : parseInt(m[1])) : 1;
                krav.push({ namn: normaliseraDodaKravNamn(m[2]), antal });
            }
        });
    }
    return krav;
}

function textTillSiffra(txt) {
    const map = { 'ett': 1, 'en': 1, 'två': 2, 'tre': 3, 'fyra': 4, 'fem': 5, 'sex': 6, 'sju': 7, 'åtta': 8, 'nio': 9, 'tio': 10 };
    return map[txt] || 1;
}
// Hjälpfunktion för att radbryta text automatiskt
function wrapText(ctx, text, maxWidth) {
    let words = text.split(' ');
    let lines = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
        let testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function ritaPengarTooltipUppdrag(ctx, canvas, valuta, musX, musY) {
    const infoMap = {
        guld: { namn: 'Guld', beskrivning: 'Den mest vardefulla valutan. Anvands for dyra kop och storre beloningar.' },
        silver: { namn: 'Silver', beskrivning: 'En vanlig valuta for handel, uppdrag och utrustning.' },
        koppar: { namn: 'Koppar', beskrivning: 'Den minsta valutan. Anvands ofta for billiga varor och mindre kostnader.' }
    };
    const info = infoMap[valuta];
    if (!info) return;

    const img = new window.Image();
    img.src = `assets/ikoner/${valuta.charAt(0).toUpperCase() + valuta.slice(1)}.png`;
    const iconSize = 52;
    const boxW = 210;
    const maxWidth = 176;

    ctx.save();
    ctx.font = '12px Arial';
    const rader = wrapText(ctx, info.beskrivning, maxWidth);
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
    if (img.complete) {
        ctx.drawImage(img, ikonX, ikonY, iconSize, iconSize);
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


            // Placera progress-text inom det reserverade området (nära belöningen)
            const progressY = platsHojd - 70; // justera denna siffra om du vill ha mer/ mindre luft
            ctx.font = '13px Arial';
            ctx.fillStyle = allDone ? '#7fff7f' : '#ffe066';
            if (progressText) ctx.fillText(allDone ? 'Klar att lämna in!' : progressText, x + platsBredd / 2, progressY);

            // Belöning med ikoner
            ctx.font = '13px Arial';
            ctx.fillStyle = '#ffe066';
            let beloningStr = uppdrag.beloning || '';
            let iconMap = {
                guld: 'assets/ikoner/Guld.png',
                silver: 'assets/ikoner/Silver.png',
                koppar: 'assets/ikoner/Koppar.png'
            };
            // Parsar belöningstexten till [{antal, typ}, ...]
            function parseBeloning(str) {
                let parts = str.split(' och ');
                let result = [];
                for (let p of parts) {
                    let match = p.trim().match(/(\d+)\s*(guld|silver|koppar)/i);
                    if (match) {
                        result.push({ antal: match[1], typ: match[2].toLowerCase() });
                    }
                }
                return result;
            }
            let parsed = parseBeloning(beloningStr);
            let startX = x + platsBredd / 2;
            let y = platsHojd - 58; // Flytta upp belöningsraden 10px
            let totalWidth = 0;
            let iconSize = 18;
            let spacing = 8;
            // För att mäta total bredd
            parsed.forEach((b, i) => {
                let text = b.antal;
                totalWidth += ctx.measureText(text).width + iconSize + (i > 0 ? spacing : 0);
            });
            let drawX = startX - totalWidth / 2;
            parsed.forEach((b, i) => {
                let text = b.antal;
                ctx.fillText(text, drawX, y + 12);
                drawX += ctx.measureText(text).width + 2;
                let img = new window.Image();
                img.src = iconMap[b.typ];
                // Rita synkront om redan laddad, annars asynkront
                if (img.complete) {
                    ctx.drawImage(img, drawX, y - 4, iconSize, iconSize);
                } else {
                    img.onload = () => {
                        ctx.drawImage(img, drawX, y - 4, iconSize, iconSize);
                    };
                }
                if (state.mouseX >= drawX && state.mouseX <= drawX + iconSize && state.mouseY >= y - 4 && state.mouseY <= y - 4 + iconSize) {
                    state._pengarHoverInfo = { valuta: b.typ, x: state.mouseX, y: state.mouseY };
                }
                drawX += iconSize + spacing;
            });
            if (parsed.length === 0) {
                ctx.fillText('Belöning: ' + beloningStr, x + platsBredd / 2, platsHojd - 58);
            }

            // Status
            ctx.font = '12px Arial';
            const statusText = 'Status: ' + (uppdrag.status === 'tagen' ? 'Pågående' : 'Ledig');
            ctx.fillStyle = uppdrag.status === 'tagen' ? '#ff9999' : '#9be7ff';
            // Flytta upp statusraden lika mycket
            ctx.fillText(statusText, x + platsBredd / 2, platsHojd - 28);
            ctx.restore();
        } else {
            // Tom plats: visa ikon eller text
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('+', x + platsBredd / 2, platsHojd / 2 + 16);
            ctx.font = '12px Arial';
            ctx.fillText('Tom plats', x + platsBredd / 2, platsHojd / 2 + 44);
            ctx.restore();
        }
        } catch (e) {
            try {
                if (typeof console !== 'undefined') {
                    console.error('Kunde inte rita uppdragsruta', { index: i, uppdrag: uppdragLista[i], error: e });
                }
            } catch (ignored) {}
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.font = '12px Arial';
            ctx.fillStyle = '#ffb347';
            ctx.textAlign = 'center';
            ctx.fillText('Kunde inte visa uppdrag', x + platsBredd / 2, platsHojd / 2 + 8);
            ctx.restore();
        }
    }

    if (state._pengarHoverInfo) {
        ritaPengarTooltipUppdrag(ctx, canvas, state._pengarHoverInfo.valuta, state._pengarHoverInfo.x, state._pengarHoverInfo.y);
    }
}


// Export för användning i andra filer
if (typeof module !== 'undefined') {
    module.exports = { Uppdrag, ritaUppdragsPlatser, parseLaminaInKrav, parseDodaKrav, parseInteraktionsKrav, beraknaInteraktionsProgress, hamtaSpelarInteraktionsRakning, textTillSiffra };
}

// Gör ritaUppdragsPlatser alltid tillgänglig globalt för browsern
if (typeof window !== 'undefined') {
    window.ritaUppdragsPlatser = ritaUppdragsPlatser;
    window.Uppdrag = Uppdrag;
    window.parseLaminaInKrav = parseLaminaInKrav;
    window.parseDodaKrav = parseDodaKrav;
    window.parseInteraktionsKrav = parseInteraktionsKrav;
    window.beraknaInteraktionsProgress = beraknaInteraktionsProgress;
    window.hamtaSpelarInteraktionsRakning = hamtaSpelarInteraktionsRakning;
    window.textTillSiffra = textTillSiffra;
}
