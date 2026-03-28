// Hämta canvas och kontext
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const characterCanvas = document.getElementById('characterCanvas');
const characterCtx = characterCanvas.getContext('2d');
const statsCanvas = document.getElementById('statsCanvas');
const statsCtx = statsCanvas.getContext('2d');
const inventoryCanvas = document.getElementById('inventoryCanvas');
const inventoryCtx = inventoryCanvas.getContext('2d');
const inventorySubCanvas = document.getElementById('inventorySubCanvas');
const inventorySubCtx = inventorySubCanvas ? inventorySubCanvas.getContext('2d') : null;

let harLoggatLagringsFel = false;

function rensaGameplayInputVidSkarmbyte(foregaendeSkarm, nySkarm) {
    if (foregaendeSkarm === nySkarm) return;

    const spelare = hamtaAktivSpelare();
    if (spelare && typeof spelare.rensaInput === 'function') {
        spelare.rensaInput();
    }

    if (varlden && typeof varlden.rensaInput === 'function') {
        varlden.rensaInput();
    }
}

function hamtaLokalLagring() {
    try {
        return window.localStorage;
    } catch (error) {
        if (!harLoggatLagringsFel) {
            console.warn('localStorage ar inte tillgangligt i den har webblasaren for den aktuella sidan.', error);
            harLoggatLagringsFel = true;
        }
        return null;
    }
}

function hamtaLagradData(key) {
    const lagring = hamtaLokalLagring();
    if (!lagring) return null;

    try {
        return lagring.getItem(key);
    } catch (error) {
        if (!harLoggatLagringsFel) {
            console.warn('Kunde inte lasa fran localStorage.', error);
            harLoggatLagringsFel = true;
        }
        return null;
    }
}

function sparaLagradData(key, value) {
    const lagring = hamtaLokalLagring();
    if (!lagring) return false;

    try {
        lagring.setItem(key, value);
        return true;
    } catch (error) {
        if (!harLoggatLagringsFel) {
            console.warn('Kunde inte skriva till localStorage.', error);
            harLoggatLagringsFel = true;
        }
        return false;
    }
}

function visaLagringsFel() {
    showModalAlert('Sparning ar inte tillganglig i den har webblasaren nar spelet oppnas direkt fran fil. Starta sidan via en lokal server for save/load.');
}

function arLagringTillganglig() {
    return !!hamtaLokalLagring();
}

window.hamtaLagradData = hamtaLagradData;
window.sparaLagradData = sparaLagradData;
window.arLagringTillganglig = arLagringTillganglig;

// Spelets tillstånd
let aktuellSkarm = 'startskarm'; // 'startskarm', 'huvudmeny', 'spel', 'kontroller', 'skapaGubbe', 'namnGubbe' etc.
Object.defineProperty(window, 'aktuellSkarm', {
    get: function() { return aktuellSkarm; },
    set: function(val) {
        const foregaendeSkarm = aktuellSkarm;
        aktuellSkarm = val;
        rensaGameplayInputVidSkarmbyte(foregaendeSkarm, val);
        uppdateraBakgrundsmusik();
    }
});
let huvudmeny;
let skapaGubbe;
let namnGubbe;
let varlden;
let forrad;
let karaktarssida;
let stats;
let smeden;
let druidenochsierskan;
let lotteriet;
let langhuset;
let byggarbetsplatsen;
let inventorySummary;
let varldskartan;
Object.defineProperty(window, 'langhuset', {
    get: function() { return langhuset; },
    set: function(val) { langhuset = val; }
});
let kartan;
let gjallarbron;
let stigen;
let jaktmarken;
let chansrutan;
let gestaltrutan;
let bandit;
let skogen;
let startcutscene;
let stridSystem;
let djurSystem;
let huvudmenyReturnSkarm = null;
let kartaReturnSkarm = 'spel';
let kartaReturnPlats = 'Fyrmille';
let valdSpelareKlass = null;
let valdSpelareNamn = null;
let forhandsvisningForemalDef = null;
let harFortsattbartSpel = false;
let huvudmenyMusik = null;
let midgardMusik = null;
let skogenMusik = null;
let gjallarbronMusik = null;
let gaLjud = null;
let huvudmenyMusikAktiverad = false;
const bakgrundsFadeHastighet = 0.02;
const ljudEffektCache = {};
const standardLjudEffekter = {
    dryck: { sokvag: 'assets/Audio/Dryck.mp3', volym: 0.58 },
    skada: { sokvag: 'assets/Audio/Skada.mp3', volym: 0.5 },
    badaSkadas: { sokvag: 'assets/Audio/Båda Skadas.mp3', volym: 0.52 },
    fiendeDor: { sokvag: 'assets/Audio/Fiende Dör.mp3', volym: 0.58 },
    fiendeFlyr: { sokvag: 'assets/Audio/Fiende Flyr.mp3', volym: 0.52 },
    pengar: { sokvag: 'assets/Audio/Pengar.mp3', volym: 0.48 }
};

function spelaLjudEffekt(sokvag, volym = 1) {
    if (!sokvag) return;

    try {
        let ljud = ljudEffektCache[sokvag];
        if (!ljud) {
            ljud = new Audio(encodeURI(sokvag));
            ljud.preload = 'auto';
            ljudEffektCache[sokvag] = ljud;
        }

        const spelbartLjud = ljud.cloneNode();
        spelbartLjud.volume = Math.max(0, Math.min(1, volym));
        const playPromise = spelbartLjud.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    } catch (e) {}
}

function spelaStandardLjud(namn, volym = null) {
    const ljudDef = standardLjudEffekter[namn];
    if (!ljudDef || !ljudDef.sokvag) return;
    spelaLjudEffekt(ljudDef.sokvag, typeof volym === 'number' ? volym : ljudDef.volym);
}

window.spelaLjudEffekt = spelaLjudEffekt;
window.spelaStandardLjud = spelaStandardLjud;

function skapaBakgrundsTrack(sokvag, basVolym) {
    try {
        const ljud = new Audio(encodeURI(sokvag));
        ljud.loop = true;
        ljud.volume = 0;
        ljud._baseVolume = basVolym;
        ljud._targetVolume = 0;
        ljud._playingIntent = false;
        return ljud;
    } catch (e) {
        return null;
    }
}

function initHuvudmenyMusik() {
    if (huvudmenyMusik) return huvudmenyMusik;
    huvudmenyMusik = skapaBakgrundsTrack('assets/Audio/Huvudmeny.mp3', 0.45);
    return huvudmenyMusik;
}

function initMidgardMusik() {
    if (midgardMusik) return midgardMusik;
    midgardMusik = skapaBakgrundsTrack('assets/Audio/Midgård/Midgård.mp3', 0.38);
    return midgardMusik;
}

function initSkogenMusik() {
    if (skogenMusik) return skogenMusik;
    skogenMusik = skapaBakgrundsTrack('assets/Audio/Midgård/Skogen.mp3', 0.38);
    return skogenMusik;
}

function initGjallarbronMusik() {
    if (gjallarbronMusik) return gjallarbronMusik;
    gjallarbronMusik = skapaBakgrundsTrack('assets/Audio/Midgård/Gjallarbron.mp3', 0.38);
    return gjallarbronMusik;
}

function initGaLjud() {
    if (gaLjud) return gaLjud;
    gaLjud = skapaBakgrundsTrack('assets/Audio/Midgård/Gåljud.mp3', 0.46);
    return gaLjud;
}

function sattBakgrundsTrackMalvolym(ljud, ratio) {
    if (!ljud) return;
    const klampadRatio = Math.max(0, Math.min(1, ratio));
    ljud._targetVolume = (typeof ljud._baseVolume === 'number' ? ljud._baseVolume : 0.4) * klampadRatio;
    ljud._playingIntent = klampadRatio > 0;
}

function uppdateraBakgrundsTrackFade(ljud) {
    if (!ljud) return;
    const target = typeof ljud._targetVolume === 'number' ? ljud._targetVolume : 0;
    const current = typeof ljud.volume === 'number' ? ljud.volume : 0;

    if (ljud._playingIntent && ljud.paused) {
        const playPromise = ljud.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    }

    if (Math.abs(current - target) <= bakgrundsFadeHastighet) {
        ljud.volume = target;
    } else if (current < target) {
        ljud.volume = Math.min(target, current + bakgrundsFadeHastighet);
    } else {
        ljud.volume = Math.max(target, current - bakgrundsFadeHastighet);
    }

    if (!ljud._playingIntent && ljud.volume <= 0.001) {
        ljud.volume = 0;
        try { ljud.pause(); } catch (e) {}
    }
}

function uppdateraBakgrundsmusik() {
    const menyMusik = initHuvudmenyMusik();
    const midgardTrack = initMidgardMusik();
    const skogenTrack = initSkogenMusik();
    const gjallarbronTrack = initGjallarbronMusik();

    if (!huvudmenyMusikAktiverad) {
        [menyMusik, midgardTrack, skogenTrack, gjallarbronTrack].forEach((track) => {
            sattBakgrundsTrackMalvolym(track, 0);
            uppdateraBakgrundsTrackFade(track);
        });
        return;
    }

    const menySkarmar = ['huvudmeny', 'kontroller', 'skapaGubbe', 'namnGubbe'];
    const midgardSkarmar = ['spel', 'smeden', 'druidenochsierskan', 'lotteriet', 'langhuset', 'byggarbetsplatsen', 'kartan', 'stigen', 'jaktmarken', 'chansrutan', 'gestaltrutan', 'bandit', 'gjallarbron'];

    if (menySkarmar.includes(aktuellSkarm)) {
        sattBakgrundsTrackMalvolym(menyMusik, 1);
        sattBakgrundsTrackMalvolym(midgardTrack, 0);
        sattBakgrundsTrackMalvolym(skogenTrack, 0);
        sattBakgrundsTrackMalvolym(gjallarbronTrack, 0);
    } else if (aktuellSkarm === 'gjallarbron') {
        sattBakgrundsTrackMalvolym(menyMusik, 0);
        sattBakgrundsTrackMalvolym(midgardTrack, 0);
        sattBakgrundsTrackMalvolym(skogenTrack, 0);
        sattBakgrundsTrackMalvolym(gjallarbronTrack, 1);
    } else if (aktuellSkarm === 'skogen') {
        sattBakgrundsTrackMalvolym(menyMusik, 0);
        sattBakgrundsTrackMalvolym(midgardTrack, 0);
        sattBakgrundsTrackMalvolym(skogenTrack, 1);
        sattBakgrundsTrackMalvolym(gjallarbronTrack, 0);
    } else if (midgardSkarmar.includes(aktuellSkarm)) {
        sattBakgrundsTrackMalvolym(menyMusik, 0);
        sattBakgrundsTrackMalvolym(midgardTrack, 1);
        sattBakgrundsTrackMalvolym(skogenTrack, 0);
        sattBakgrundsTrackMalvolym(gjallarbronTrack, 0);
    } else {
        sattBakgrundsTrackMalvolym(menyMusik, 0);
        sattBakgrundsTrackMalvolym(midgardTrack, 0);
        sattBakgrundsTrackMalvolym(skogenTrack, 0);
        sattBakgrundsTrackMalvolym(gjallarbronTrack, 0);
    }

    [menyMusik, midgardTrack, skogenTrack, gjallarbronTrack].forEach(uppdateraBakgrundsTrackFade);
}

function uppdateraGaljud(spelare) {
    const galjudTrack = initGaLjud();
    if (!galjudTrack) return;

    const rorelseSkarmar = ['spel', 'stigen', 'skogen', 'jaktmarken', 'chansrutan', 'gestaltrutan', 'bandit', 'gjallarbron'];
    const arRorelseSkarm = rorelseSkarmar.includes(aktuellSkarm);
    const visarGangAnimation = !!(spelare && spelare.visarGangAnimation);
    const skaSpela = huvudmenyMusikAktiverad && arRorelseSkarm && visarGangAnimation && !arGlobalGameOverAktivt();

    sattBakgrundsTrackMalvolym(galjudTrack, skaSpela ? 1 : 0);
    uppdateraBakgrundsTrackFade(galjudTrack);
}

function aktiveraHuvudmenyFranStartskarm() {
    if (aktuellSkarm !== 'startskarm') return;
    huvudmenyMusikAktiverad = true;
    window.aktuellSkarm = 'huvudmeny';
    if (huvudmeny && typeof huvudmeny.visaMeny === 'function') {
        huvudmeny.visaMeny();
    }
}

function ritaStartskarm() {
    ctx.fillStyle = '#080814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 56px Times New Roman';
    ctx.fillText('YGGDRASIL', canvas.width / 2, canvas.height / 2 - 70);

    ctx.fillStyle = '#00ff88';
    ctx.font = '28px Times New Roman';
    ctx.fillText('Tryck på valfri knapp', canvas.width / 2, canvas.height / 2 + 10);

    ctx.fillStyle = '#888';
    ctx.font = '18px Times New Roman';
    ctx.restore();
}

function rensaAllaPopups() {
    try { if (kartan && typeof kartan.rensaMeddelanden === 'function') kartan.rensaMeddelanden(); } catch (e) {}
    try { if (bandit && typeof bandit.rensaMeddelanden === 'function') bandit.rensaMeddelanden(); } catch (e) {}
    try { if (chansrutan && typeof chansrutan.rensaMeddelanden === 'function') chansrutan.rensaMeddelanden(); } catch (e) {}
    try { if (jaktmarken && typeof jaktmarken.rensaMeddelanden === 'function') jaktmarken.rensaMeddelanden(); } catch (e) {}
    try { if (skogen) skogen._lootMessages = []; } catch (e) {}
    try {
        if (gestaltrutan && gestaltrutan.gestalter && typeof gestaltrutan.gestalter.rensaMeddelanden === 'function') {
            gestaltrutan.gestalter.rensaMeddelanden();
        }
    } catch (e) {}
    try { if (byggarbetsplatsen) byggarbetsplatsen.meddelande = null; } catch (e) {}
    try { if (druidenochsierskan) druidenochsierskan.meddelande = null; } catch (e) {}
    try { if (smeden) smeden.meddelande = null; } catch (e) {}
    try { if (langhuset) langhuset.meddelande = null; } catch (e) {}
    try { if (forrad) forrad.meddelande = null; } catch (e) {}
}

function arNyttSpelPreviewSkarm() {
    return aktuellSkarm === 'skapaGubbe' || aktuellSkarm === 'namnGubbe';
}

function nollstallAktivaUppdragForNyttSpel() {
    if (!langhuset) return;

    langhuset.aktivaUppdrag = [];
    langhuset.completedThisVisit = new Set();
    langhuset.shopValdIndex = 0;
    langhuset.shopHoverIndex = -1;
    langhuset.scrollOffset = 0;
    langhuset.scrollTarget = 0;
    langhuset.meddelande = null;
}

// Enkel in-game modal manager (alert/confirm) — används istället för browser alert/confirm
window._gameModal = { active: false, type: null, text: '', okCb: null, cancelCb: null };

function showModalAlert(text, okCb) {
    window._gameModal = { active: true, type: 'alert', text: String(text || ''), okCb: okCb || null, cancelCb: null, focused: 'ok', _btnBounds: null };
    _ensureModalLoop();
}

function showModalConfirm(text, okCb, cancelCb) {
    window._gameModal = { active: true, type: 'confirm', text: String(text || ''), okCb: okCb || null, cancelCb: cancelCb || null, focused: 'ok', _btnBounds: null };
    _ensureModalLoop();
}

function hamtaKlassDefinition(klassNamn, fallbackKlass) {
    let klassDef = null;
    try {
        if (typeof skapaGubbe !== 'undefined' && skapaGubbe && Array.isArray(skapaGubbe.klasser)) {
            klassDef = skapaGubbe.klasser.find(k => k && k.namn === klassNamn) || null;
            if (!klassDef && skapaGubbe.klasser.length > 0) klassDef = skapaGubbe.klasser[0];
        }
    } catch (e) {}

    if (!klassDef && fallbackKlass) {
        klassDef = fallbackKlass;
    }

    if (!klassDef) {
        klassDef = { namn: 'Anon', stats: { konstruktion: 1, styrka: 1, special: 1 }, startForemal: [] };
    }

    return klassDef;
}

function hamtaAktivSpelare() {
    return (varlden && varlden.spelare) ? varlden.spelare : null;
}

function arGlobalGameOverAktivt() {
    const spelare = hamtaAktivSpelare();
    return !!(spelare && spelare.gameOverAktiv);
}

function kanFortsattaSpel() {
    return !!(huvudmenyReturnSkarm || harFortsattbartSpel);
}

function aktiveraGlobalGameOver() {
    const spelare = hamtaAktivSpelare();
    if (!spelare) return;

    if (typeof spelare.synkroniseraLivstatus === 'function') {
        spelare.synkroniseraLivstatus();
    } else {
        spelare.liv = 0;
        spelare.arDod = true;
        spelare.gameOverAktiv = true;
    }

    if (typeof spelare.rensaInput === 'function') {
        spelare.rensaInput();
    }
    if (varlden && typeof varlden.rensaInput === 'function') {
        varlden.rensaInput();
    }
}

function aterstallNySpelStartTillFyrmille() {
    kartaReturnSkarm = 'spel';
    kartaReturnPlats = 'Fyrmille';

    if (varlden) {
        varlden.placeraSpelareVidSpawn();
        if (varlden.spelare) {
            varlden.spelare.aktuellKartaOmrade = 'Fyrmille';
            if (typeof varlden.spelare.rensaInput === 'function') {
                varlden.spelare.rensaInput();
            }
        }
        if (typeof varlden.rensaInput === 'function') {
            varlden.rensaInput();
        }
    }

    if (kartan) {
        const fyrmille = typeof kartan.hamtaOmradeMedNamn === 'function'
            ? kartan.hamtaOmradeMedNamn('Fyrmille')
            : null;

        kartan._pendingTravelOmrade = null;
        if (typeof kartan.sattAktuelltOmrade === 'function') {
            kartan.sattAktuelltOmrade(fyrmille);
        } else {
            kartan.aktuelltOmrade = fyrmille;
            kartan.valtOmrade = fyrmille;
        }
        if (typeof kartan.sattValtOmrade === 'function') {
            kartan.sattValtOmrade(fyrmille);
        } else {
            kartan.valtOmrade = fyrmille;
        }
        if (typeof kartan.dolj === 'function') {
            kartan.dolj();
        }
    }
}

function borjaOmEfterDod() {
    const spelare = hamtaAktivSpelare();
    if (!spelare) return;

    if (!spelare._dodRegistrerad && spelare.prestationer) {
        spelare.prestationer.antalDodsfall += 1;
        spelare._dodRegistrerad = true;
    }

    if (typeof spelare.aterstallEfterDod === 'function') {
        spelare.aterstallEfterDod(3, 3);
    } else {
        spelare.liv = 3;
        spelare.maxLiv = 8;
        spelare.energi = 3;
        spelare.maxEnergi = 8;
        spelare.arDod = false;
        spelare.gameOverAktiv = false;
    }

    spelare.maxLiv = 8;
    spelare.maxEnergi = 8;

    if (spelare.utrustning) {
        spelare.utrustning.vapen = null;
        spelare.utrustning.rustning = null;
        spelare.utrustning.hjalm = null;
        spelare.utrustning.skold = null;
        spelare.utrustning.accessoar = null;
        spelare.utrustning.uppdateraStats();
    }

    if (gestaltrutan && gestaltrutan.gestalter) {
        gestaltrutan.gestalter.gameOver = false;
    }
    if (varlden && typeof varlden.rensaInput === 'function') {
        varlden.rensaInput();
    }

    huvudmenyReturnSkarm = null;
    harFortsattbartSpel = false;
    window.aktuellSkarm = 'huvudmeny';
    if (gestaltrutan) gestaltrutan.dolj();
    if (kartan) kartan.dolj();
    if (huvudmeny && typeof huvudmeny.visaMeny === 'function') huvudmeny.visaMeny();
}

function ritaGlobalGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('Du har förlorat alla dina liv!', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Tryck [ESC] för att börja om', canvas.width / 2, canvas.height / 2 + 60);
    ctx.restore();
}

function renderModal(ctx) {
    const m = window._gameModal;
    if (!m || !m.active) return;
    const canvas = ctx.canvas;
    // Dim background
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Modal box
    const boxW = Math.min(700, canvas.width - 120);
    const boxH = 180;
    const boxX = (canvas.width - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;
    ctx.fillStyle = '#16213e';
    roundRect(ctx, boxX, boxY, boxW, boxH, 10, true, false);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    roundRect(ctx, boxX, boxY, boxW, boxH, 10, false, true);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    const padding = 20;
    const textX = boxX + padding;
    const textY = boxY + padding;
    wrapFillText(ctx, m.text, textX, textY, boxW - padding * 2, 22);

    // Buttons
    ctx.textAlign = 'center';
    const btnW = 120;
    const btnH = 36;
    const btnY = boxY + boxH - padding - btnH;
    const okX = boxX + boxW / 2 - btnW - 10;
    const cancelX = boxX + boxW / 2 + 10;
    // Draw OK button
    const okBounds = { x: okX, y: btnY, w: btnW, h: btnH };
    const cancelBounds = m.type === 'confirm' ? { x: cancelX, y: btnY, w: btnW, h: btnH } : null;
    // Button backgrounds
    ctx.fillStyle = (m.focused === 'ok') ? '#0fa066' : '#00aa55';
    ctx.fillRect(okBounds.x, okBounds.y, okBounds.w, okBounds.h);
    ctx.fillStyle = '#fff';
    ctx.fillText('OK', okBounds.x + okBounds.w / 2, okBounds.y + okBounds.h / 2 + 6);
    if (cancelBounds) {
        ctx.fillStyle = (m.focused === 'cancel') ? '#666' : '#444';
        ctx.fillRect(cancelBounds.x, cancelBounds.y, cancelBounds.w, cancelBounds.h);
        ctx.fillStyle = '#fff';
        ctx.fillText('Avbryt', cancelBounds.x + cancelBounds.w / 2, cancelBounds.y + cancelBounds.h / 2 + 6);
    }

    // Focus rectangle
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    if (m.focused === 'ok') {
        ctx.strokeRect(okBounds.x - 4, okBounds.y - 4, okBounds.w + 8, okBounds.h + 8);
    } else if (m.focused === 'cancel' && cancelBounds) {
        ctx.strokeRect(cancelBounds.x - 4, cancelBounds.y - 4, cancelBounds.w + 8, cancelBounds.h + 8);
    }
    ctx.restore();

    // Attach last-drawn button bounds for click handler
    window._gameModal._btnBounds = { ok: okBounds, cancel: cancelBounds };
}

function wrapFillText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + (line ? ' ' : '') + words[n];
        if (ctx.measureText(testLine).width > maxWidth && line) {
            ctx.fillText(line, x, curY);
            line = words[n];
            curY += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (line) ctx.fillText(line, x, curY);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function oppnaHuvudmenyFran(skarm) {
    huvudmenyReturnSkarm = skarm || null;
    window.aktuellSkarm = 'huvudmeny';
    if (huvudmeny && typeof huvudmeny.visaMeny === 'function') huvudmeny.visaMeny();
}

function atergaFranHuvudmeny() {
    const returnSkarm = huvudmenyReturnSkarm;
    if (!returnSkarm) return false;

    if (huvudmeny && typeof huvudmeny.doljMeny === 'function') huvudmeny.doljMeny();
    window.aktuellSkarm = returnSkarm;
    huvudmenyReturnSkarm = null;
    return true;
}

function visaLaddaSpelSubmeny(slotNum) {
    if (!huvudmeny || typeof huvudmeny.visaMeny !== 'function') return;
    const slotIndex = Math.max(0, Number(slotNum || 1) - 1);
    huvudmeny.visaMeny();
    huvudmeny.valdtAlternativ = huvudmeny.menyAlternativ.indexOf('Ladda spel');
    huvudmeny.submenu = 'load';
    huvudmeny.submenuSelected = slotIndex;
    window.aktuellSkarm = 'huvudmeny';
}

// Initialisera huvudmenyn
function init() {
    initHuvudmenyMusik();
    initMidgardMusik();
    initSkogenMusik();
    initGjallarbronMusik();
    huvudmeny = new Huvudmeny(canvas, ctx);
    skapaGubbe = new SkapaGubbe(canvas, ctx);
    namnGubbe = new NamnGubbe(canvas, ctx);
    startcutscene = new Startcutscene(canvas, ctx, () => {
        aterstallNySpelStartTillFyrmille();
        window.aktuellSkarm = 'spel';
    });
    smeden = new Smeden(canvas, ctx, () => (varlden ? varlden.spelare : null));
    druidenochsierskan = new DruidenochSierskan(canvas, ctx, () => (varlden ? varlden.spelare : null));
    lotteriet = new Lotteriet(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        window.aktuellSkarm = 'spel';
        lotteriet.dolj();
    });
    // Byggarbetsplatsen (tidig instansiering så callback finns när Varlden skapar Fyrmille)
    byggarbetsplatsen = new Byggarbetsplatsen(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        if (varlden) varlden.rensaInput();
        window.aktuellSkarm = 'spel';
        byggarbetsplatsen.dolj();
    });
    langhuset = new Langhuset(canvas, ctx, () => {
        if (varlden) {
            varlden.rensaInput();
        }
        window.aktuellSkarm = 'spel';
        langhuset.dolj();
    }, () => stridSystem, () => (varlden ? varlden.spelare : null));
    window.langhuset = langhuset;
    stridSystem = new Strid();
    djurSystem = new Djur();
    varlden = new Varlden(canvas, ctx, () => {
        if (varlden) {
            varlden.rensaInput();
        }
        window.aktuellSkarm = 'smeden';
        smeden.visa();
    }, () => {
        if (varlden) {
            varlden.rensaInput();
        }
        kartaReturnSkarm = 'spel';
        kartaReturnPlats = 'Fyrmille';
        window.aktuellSkarm = 'kartan';
        kartan.visa(kartaReturnPlats);
    }, () => {
        if (varlden) {
            varlden.rensaInput();
        }
        window.aktuellSkarm = 'langhuset';
        langhuset.visa();
    }, () => {
        // Öppna Byggarbetsplatsen
        if (varlden) varlden.rensaInput();
        window.aktuellSkarm = 'byggarbetsplatsen';
        byggarbetsplatsen.visa();
    }, () => {
        if (varlden) {
            varlden.rensaInput();
        }
        window.aktuellSkarm = 'druidenochsierskan';
        druidenochsierskan.visa();
    }, () => {
        if (varlden) {
            varlden.rensaInput();
        }
        window.aktuellSkarm = 'lotteriet';
        lotteriet.visa();
    });
    stigen = new Stigen(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        kartaReturnSkarm = 'stigen';
        kartaReturnPlats = stigen.startOmradeNamn || 'Stigen1';
        const status = stigen && stigen.rumStatus ? stigen.rumStatus[kartaReturnPlats] : null;
        const avklarat = !!(status && (status.rensadVid !== null || (Array.isArray(status.fynd) && status.fynd.length === 0)));
        if (kartan && typeof kartan.hanteraRumslut === 'function') {
            kartan.hanteraRumslut(kartaReturnPlats, avklarat);
        }
        rensaAllaPopups();
        window.aktuellSkarm = 'kartan';
        stigen.dolj();
        kartan.visa(kartan && kartan.aktuelltOmrade ? kartan.aktuelltOmrade.namn : kartaReturnPlats);
    });
    jaktmarken = new Jaktmarken(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        kartaReturnSkarm = 'jaktmarken';
        kartaReturnPlats = 'Jaktmarken';
        const avklarat = !!(jaktmarken && !jaktmarken.iStrid && jaktmarken.stridMeddelande);
        if (kartan && typeof kartan.hanteraRumslut === 'function') {
            kartan.hanteraRumslut(kartaReturnPlats, avklarat);
        }
        rensaAllaPopups();
        window.aktuellSkarm = 'kartan';
        jaktmarken.dolj();
        kartan.visa(kartan && kartan.aktuelltOmrade ? kartan.aktuelltOmrade.namn : kartaReturnPlats);
    }, stridSystem, djurSystem);
    chansrutan = new Chansrutan(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        kartaReturnSkarm = 'chansrutan';
        kartaReturnPlats = (kartan && kartan._pendingTravelOmrade && kartan._pendingTravelOmrade.namn) ? kartan._pendingTravelOmrade.namn : 'Chansrutan';
        const avklarat = !!(chansrutan && chansrutan.utgangAktiv);
        if (kartan && typeof kartan.hanteraRumslut === 'function') {
            kartan.hanteraRumslut(kartaReturnPlats, avklarat);
        }
        rensaAllaPopups();
        window.aktuellSkarm = 'kartan';
        chansrutan.dolj();
        kartan.visa(kartan && kartan.aktuelltOmrade ? kartan.aktuelltOmrade.namn : kartaReturnPlats);
    }, stridSystem, djurSystem);
    bandit = new Bandit(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        kartaReturnSkarm = 'bandit';
        kartaReturnPlats = 'Banditläger';
        const avklarat = !!(bandit && bandit.exitOpen);
        if (kartan && typeof kartan.hanteraRumslut === 'function') {
            kartan.hanteraRumslut(kartaReturnPlats, avklarat);
        }
        rensaAllaPopups();
        window.aktuellSkarm = 'kartan';
        bandit.dolj();
        kartan.visa(kartan && kartan.aktuelltOmrade ? kartan.aktuelltOmrade.namn : kartaReturnPlats);
    }, stridSystem);
    // Skogen (instantiate lazily if class is available)
    try {
        if (typeof Skogen !== 'undefined') {
            skogen = new Skogen(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
                // When exiting Skogen, return to the map focused on the Skogen tile
                kartaReturnSkarm = 'kartan';
                kartaReturnPlats = 'Skogen';
                if (kartan && typeof kartan.hanteraRumslut === 'function') {
                    kartan.hanteraRumslut(kartaReturnPlats, true);
                }
                rensaAllaPopups();
                window.aktuellSkarm = 'kartan';
                if (skogen) skogen.dolj();
                if (kartan) kartan.visa(kartan.aktuelltOmrade ? kartan.aktuelltOmrade.namn : kartaReturnPlats);
            });
        } else {
            skogen = null;
            try { console.log('[Game] Skogen class not defined at init; will create lazily on entry.'); } catch (e) {}
        }
    } catch (e) {
        skogen = null;
    }
    gjallarbron = new Gjallarbron(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        kartaReturnSkarm = 'kartan';
        kartaReturnPlats = 'Gjallarbron';
        if (kartan && typeof kartan.hanteraRumslut === 'function') {
            kartan.hanteraRumslut(kartaReturnPlats, true);
        }
        rensaAllaPopups();
        window.aktuellSkarm = 'kartan';
        if (gjallarbron) gjallarbron.dolj();
        if (kartan) kartan.visa(kartan.aktuelltOmrade ? kartan.aktuelltOmrade.namn : kartaReturnPlats);
    });
    varldskartan = new Varldskartan(canvas, ctx, () => {
        rensaAllaPopups();
        window.aktuellSkarm = 'kartan';
        if (varldskartan) varldskartan.dolj();
        if (kartan) kartan.visa(kartan && kartan.valtOmrade ? kartan.valtOmrade.namn : kartaReturnPlats);
    });
    kartan = new Kartan(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        rensaAllaPopups();
        if (kartaReturnSkarm === 'stigen') {
            window.aktuellSkarm = 'stigen';
        } else if (kartaReturnSkarm === 'jaktmarken') {
            window.aktuellSkarm = 'jaktmarken';
        } else if (kartaReturnSkarm === 'chansrutan') {
            window.aktuellSkarm = 'chansrutan';
        } else {
            window.aktuellSkarm = 'spel';
        }
        kartan.dolj();
    }, (stigenNamn) => {
        // Count this specific ruta as visited for gestalter room reset
        try { if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.notaRutaBesokt(stigenNamn); try { console.log('[Game] noted ruta visit for gestalter ->', stigenNamn); } catch(e){} } } catch (e) {}
        try { if (chansrutan && typeof chansrutan.notaRutaBesokt === 'function') { chansrutan.notaRutaBesokt(stigenNamn); } } catch (e) {}
        rensaAllaPopups();
        window.aktuellSkarm = 'stigen';
        stigen.visa(stigenNamn);
    }, (platsNamn) => {
        if (platsNamn === 'Fyrmille') {
            try { if (chansrutan && typeof chansrutan.notaRutaBesokt === 'function') { chansrutan.notaRutaBesokt('Fyrmille'); } } catch (e) {}
            rensaAllaPopups();
            window.aktuellSkarm = 'spel';
            kartan.dolj();
            if (varlden) {
                varlden.placeraSpelareVidSpawn();
            }
        } else if (platsNamn === 'Skogen') {
            // Determine if player gets lost: probability to NOT get lost = energi/10
            try {
                const spelare = varlden ? varlden.spelare : null;
                const energy = Math.max(0, Math.min(10, (spelare && typeof spelare.energi === 'number') ? spelare.energi : 0));
                const rnd = Math.floor(Math.random() * 10);
                const notLost = rnd < energy; // rnd 0..9
                const target = notLost ? 'Skogen3' : 'Skogen5';
                try { if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.notaRutaBesokt(target); } } catch (e) {}
                try { if (chansrutan && typeof chansrutan.notaRutaBesokt === 'function') { chansrutan.notaRutaBesokt(target); } } catch (e) {}
                rensaAllaPopups();
                window.aktuellSkarm = 'skogen';
                kartan.dolj();
                try {
                    if (!skogen && typeof Skogen !== 'undefined') {
                        skogen = new Skogen(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
                            // Ensure we return to the Skogen tile on the map when leaving
                            kartaReturnSkarm = 'kartan';
                            kartaReturnPlats = 'Skogen';
                            if (kartan && typeof kartan.hanteraRumslut === 'function') {
                                kartan.hanteraRumslut(kartaReturnPlats, true);
                            }
                            rensaAllaPopups();
                            window.aktuellSkarm = 'kartan';
                            if (skogen) skogen.dolj();
                            if (kartan) kartan.visa(kartan.aktuelltOmrade ? kartan.aktuelltOmrade.namn : kartaReturnPlats);
                        });
                    }
                    if (skogen) {
                        // remember which skogen-variant we chose (for tracking/debug)
                        try { skogen.startOmradeNamn = target; } catch (e) {}
                        skogen.visa();
                        // Demo: set center exit after showing Skogen so the override persists
                        try {
                            if (skogen && typeof skogen.setCenterExit === 'function') {
                                skogen.setCenterExit(200, 150, 80, 80, 'Tryck Enter för att gå ut');
                            }
                        } catch (e) {}
                    } else {
                        try { console.warn('[Game] Unable to open Skogen: class not available.'); } catch(e){}
                    }
                } catch (e) {}
                return;
            } catch (e) {}
        } else if (platsNamn === 'Gjallarbron') {
            try { if (chansrutan && typeof chansrutan.notaRutaBesokt === 'function') { chansrutan.notaRutaBesokt('Gjallarbron'); } } catch (e) {}
            rensaAllaPopups();
            window.aktuellSkarm = 'gjallarbron';
            kartan.dolj();
            if (gjallarbron) gjallarbron.visa();
        }
    }, (gestaltNamn) => {
            kartaReturnSkarm = 'kartan';
            kartaReturnPlats = gestaltNamn;
            rensaAllaPopups();
            window.aktuellSkarm = 'gestaltrutan';
            kartan.dolj();
            if (gestaltrutan) {
                try { if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.notaRutaBesokt(gestaltNamn); } } catch (e) {}
                try { if (chansrutan && typeof chansrutan.notaRutaBesokt === 'function') { chansrutan.notaRutaBesokt(gestaltNamn); } } catch (e) {}
                gestaltrutan.visa(gestaltNamn);
            }
    }, () => {
        // Require 1 energi to enter Banditlägret, similar to Jaktmarken
        if (varlden && varlden.spelare) {
            if (varlden.spelare.energi >= 1) {
                varlden.spelare.energi -= 1;
                rensaAllaPopups();
                window.aktuellSkarm = 'bandit';
                kartan.dolj();
                try { if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.notaRutaBesokt('Banditläger'); } } catch (e) {}
                try { if (chansrutan && typeof chansrutan.notaRutaBesokt === 'function') { chansrutan.notaRutaBesokt('Banditläger'); } } catch (e) {}
                if (bandit) bandit.visa();
            } else {
                kartan.visaMeddelande('Du behöver minst 1 energi för att gå in i Banditlägret!');
            }
        }
    }, () => {
        // Kolla om spelaren har tillräckligt med energi
        if (varlden && varlden.spelare) {
            if (varlden.spelare.energi >= 1) {
                varlden.spelare.energi -= 1;
                rensaAllaPopups();
                window.aktuellSkarm = 'jaktmarken';
                try { if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.notaRutaBesokt('Jaktmarken'); } } catch (e) {}
                try { if (chansrutan && typeof chansrutan.notaRutaBesokt === 'function') { chansrutan.notaRutaBesokt('Jaktmarken'); } } catch (e) {}
                jaktmarken.visa();
            } else {
                // Inte tillräckligt med energi - visa det i kartan
                kartan.visaMeddelande('Du behöver minst 1 energi för att gå in i Jaktmarken!');
            }
        }
    }, (chansNamn) => {
        try { if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.notaRutaBesokt(chansNamn); } } catch (e) {}
        rensaAllaPopups();
        window.aktuellSkarm = 'chansrutan';
        chansrutan.visa(chansNamn);
    }, () => {
        rensaAllaPopups();
        if (kartan) kartan.dolj();
        if (varldskartan) varldskartan.visa();
        window.aktuellSkarm = 'varldskartan';
    });
    gestaltrutan = new Gestaltrutan(canvas, ctx, () => (varlden ? varlden.spelare : null), () => {
        rensaAllaPopups();
        window.aktuellSkarm = 'kartan';
        if (kartan && typeof kartan.hanteraRumslut === 'function') {
            kartan.hanteraRumslut(kartaReturnPlats, true);
        }
        gestaltrutan.dolj();
        kartan.visa(kartan && kartan.aktuelltOmrade ? kartan.aktuelltOmrade.namn : kartaReturnPlats);
    }, null, () => {
        borjaOmEfterDod();
    });
    // Expose for legacy callers (e.g. `Stigen.visa` used `window.gestaltrutan`)
    try { if (typeof window !== 'undefined') window.gestaltrutan = gestaltrutan; } catch (e) {}
    karaktarssida = new Karaktarssida(characterCanvas, characterCtx);
    karaktarssida.visa();
    stats = new Stats(statsCanvas, statsCtx, () => (varlden ? varlden.spelare : null));
    stats.visa();
    forrad = new Forrad(inventoryCanvas, inventoryCtx);
    forrad.visa();
    if (inventorySubCanvas && typeof InventorySummary !== 'undefined') {
        inventorySummary = new InventorySummary(inventorySubCanvas, inventorySubCtx, () => (varlden ? varlden.spelare : null));
        inventorySummary.visa();
    }
    forhandsvisningForemalDef = new Utrustning(null).tillgangligaForemal;
    gameLoop();
}

// Huvudloop
function gameLoop() {
    uppdateraBakgrundsmusik();
    const spelare = hamtaAktivSpelare();
    uppdateraGaljud(spelare);
    if (spelare && typeof spelare.normaliseraPengar === 'function') {
        spelare.normaliseraPengar();
    }
    if (spelare && ((typeof spelare.synkroniseraLivstatus === 'function' && spelare.synkroniseraLivstatus()) || spelare.liv <= 0)) {
        aktiveraGlobalGameOver();
    }

    const globalGameOver = arGlobalGameOverAktivt();

    // Rensa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Rita baserat på aktuell skärm
    switch(aktuellSkarm) {
        case 'startskarm':
            ritaStartskarm();
            break;
        case 'huvudmeny':
            huvudmeny.rita();
            break;
        case 'skapaGubbe':
            skapaGubbe.rita();
            break;
        case 'namnGubbe':
            namnGubbe.rita();
            break;
        case 'startcutscene':
            if (startcutscene && !globalGameOver) startcutscene.uppdatera();
            if (startcutscene) startcutscene.rita();
            break;
        case 'spel':
            if (!globalGameOver) {
                varlden.uppdateraRorelse();
                varlden.uppdateraPosition();
            }
            varlden.rita();
            break;
        case 'smeden':
            smeden.rita();
            break;
        case 'druidenochsierskan':
            druidenochsierskan.rita();
            break;
        case 'lotteriet':
            lotteriet.rita();
            break;
        case 'langhuset':
            langhuset.rita();
            break;
        case 'kartan':
            kartan.rita();
            break;
        case 'varldskartan':
            if (varldskartan) varldskartan.rita();
            break;
        case 'stigen':
            if (!globalGameOver) stigen.uppdateraRorelse();
            stigen.rita();
            break;
        case 'skogen':
            if (skogen) {
                if (!globalGameOver) {
                    try { skogen.uppdateraRorelse(); } catch (e) {}
                }
                try { skogen.rita(); } catch (e) {}
            }
            break;
        case 'jaktmarken':
            if (!globalGameOver) jaktmarken.uppdateraRorelse();
            jaktmarken.rita();
            break;
        case 'chansrutan':
            if (!globalGameOver) chansrutan.uppdateraRorelse();
            chansrutan.rita();
            break;
        case 'bandit':
            if (bandit) {
                if (!globalGameOver) {
                    try { bandit.uppdateraRorelse(); } catch (e) {}
                }
                try { bandit.rita(); } catch (e) {}
            }
            break;
        case 'gjallarbron':
            if (gjallarbron) {
                if (!globalGameOver) {
                    try { gjallarbron.uppdateraRorelse(); } catch (e) {}
                }
                try { gjallarbron.rita(); } catch (e) {}
            }
            break;
        case 'gestaltrutan':
            if (!globalGameOver) gestaltrutan.uppdateraRorelse();
            gestaltrutan.rita();
            break;
        case 'byggarbetsplatsen':
            byggarbetsplatsen.rita();
            break;
        case 'kontroller':
            ritaKontroller();
            break;
    }

    if (forrad && aktuellSkarm !== 'startcutscene' && aktuellSkarm !== 'startskarm') {
        if (arNyttSpelPreviewSkarm()) {
            const klass = aktuellSkarm === 'skapaGubbe' ? skapaGubbe.getValdKlass() : valdSpelareKlass;
            const startForemal = klass ? klass.startForemal : [];
            forrad.sattForhandsvisning(byggForhandsvisning(startForemal));
            const kravPreview = typeof Krav === 'function' ? new Krav() : { konstruktion: 1, reflex: 1, special: 1, max: 8 };
            if (typeof forrad.sattPreviewKrav === 'function') {
                forrad.sattPreviewKrav(kravPreview);
            }

            if (karaktarssida) {
                karaktarssida.setPreviewKrav(kravPreview);
            }
        } else {
            forrad.rensaForhandsvisning();
            if (typeof forrad.sattPreviewKrav === 'function') {
                forrad.sattPreviewKrav(null);
            }

            if (karaktarssida) {
                karaktarssida.setPreviewKrav(null);
            }
        }
    }
    
    if (forrad && aktuellSkarm !== 'startcutscene' && aktuellSkarm !== 'startskarm') {
        forrad.rita();
    }

    if (inventorySummary && aktuellSkarm !== 'startcutscene' && aktuellSkarm !== 'startskarm') {
        if (!arNyttSpelPreviewSkarm()) {
            inventorySummary.rita();
        }
    }

    if (karaktarssida && aktuellSkarm !== 'startcutscene' && aktuellSkarm !== 'startskarm') {
        karaktarssida.rita();
    }
    if (stats && aktuellSkarm !== 'startcutscene' && aktuellSkarm !== 'startskarm') {
        if (!arNyttSpelPreviewSkarm()) {
            stats.rita();
        }
    }

    if (globalGameOver) {
        ritaGlobalGameOver();
    }
    
    requestAnimationFrame(gameLoop);
}

// Render modal overlay after drawing -- ensure it's visible every frame
function _renderGameModal() {
    try {
        if (window._gameModal && window._gameModal.active) {
            renderModal(ctx);
        }
    } catch (e) {
        console.warn('Modal render error', e);
    }
}

// Hook into animation frame by wrapping requestAnimationFrame calls in gameLoop via a small override
// We call _renderGameModal at end of each frame by monkey-patching requestAnimationFrame usage above.
// To keep change minimal, call modal renderer from the existing loop using setInterval fallback if needed.
// Instead simply ensure modal is rendered each frame by scheduling a small RAF loop when active.
let _modalRAFActive = false;
function _ensureModalLoop() {
    if (_modalRAFActive) return;
    _modalRAFActive = true;
    function loop() {
        if (window._gameModal && window._gameModal.active) {
            renderModal(ctx);
            requestAnimationFrame(loop);
        } else {
            _modalRAFActive = false;
        }
    }
    requestAnimationFrame(loop);
}

function byggForhandsvisning(startForemal) {
    if (!startForemal || startForemal.length === 0) return [];
    const result = [];
    const pushStack = (foremalId, count) => {
        const def = forhandsvisningForemalDef ? forhandsvisningForemalDef[foremalId] : null;
        if (!def) {
            result.push({ id: foremalId, namn: foremalId, count });
            return;
        }
        const maxStack = def.maxStack || (def.typ === 'konsumerbar' ? 10 : (def.typ === 'vara' ? 99 : 1));
        let kvar = count;
        while (kvar > 0) {
            const stackCount = Math.min(maxStack, kvar);
            result.push({ id: foremalId, count: stackCount, ...def });
            kvar -= stackCount;
        }
    };

    startForemal.forEach((entry) => {
        const foremalId = typeof entry === 'string' ? entry : entry.id;
        const count = typeof entry === 'string' ? 1 : (entry.count || 1);
        pushStack(foremalId, count);
    });

    return result;
}

// Hantera tangentbordsinput
document.addEventListener('keydown', (e) => {
    if (aktuellSkarm === 'startskarm') {
        aktiveraHuvudmenyFranStartskarm();
        return;
    }

    if (arGlobalGameOverAktivt()) {
        if (e.key === 'Escape') {
            borjaOmEfterDod();
        }
        return;
    }

    if (!e.repeat && karaktarssida && typeof karaktarssida.hanteraTangent === 'function' && karaktarssida.hanteraTangent(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    if (!e.repeat && forrad && typeof forrad.hanteraTangent === 'function' && forrad.hanteraTangent(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    if (aktuellSkarm === 'huvudmeny') {
        if (e.key === 'Escape' && (!huvudmeny || !huvudmeny.submenu) && atergaFranHuvudmeny()) {
            return;
        }
        const valtAlternativ = huvudmeny.hanteraInput(e.key);
        
        if (valtAlternativ) {
            hanteraMenyVal(valtAlternativ);
        }
    } else if (aktuellSkarm === 'skapaGubbe') {
        const resultat = skapaGubbe.hanteraInput(e.key);
        
        if (resultat) {
            if (resultat.action === 'valdKlass') {
                valdSpelareKlass = resultat.klass;
                window.aktuellSkarm = 'namnGubbe';
                namnGubbe.visaNamnSkarm(valdSpelareKlass);
            } else if (resultat.action === 'tillbaka') {
                window.aktuellSkarm = 'huvudmeny';
                skapaGubbe.doljSkapaGubbe();
            }
        }
    } else if (aktuellSkarm === 'namnGubbe') {
        const resultat = namnGubbe.hanteraInput(e);
        
        if (resultat) {
            if (resultat.action === 'namnValt') {
                valdSpelareNamn = resultat.namn;
                startaNyttSpel();
                if (startcutscene) {
                    window.aktuellSkarm = 'startcutscene';
                    startcutscene.visa();
                } else {
                    window.aktuellSkarm = 'spel';
                }
            } else if (resultat.action === 'tillbaka') {
                window.aktuellSkarm = 'skapaGubbe';
                namnGubbe.doljNamnSkarm();
            }
        }
    } else if (aktuellSkarm === 'startcutscene') {
        if (startcutscene && typeof startcutscene.tangentNed === 'function') {
            startcutscene.tangentNed(e.key);
        }
    } else if (aktuellSkarm === 'kontroller' || aktuellSkarm === 'spel' || aktuellSkarm === 'smeden' || aktuellSkarm === 'druidenochsierskan' || aktuellSkarm === 'lotteriet' || aktuellSkarm === 'langhuset' || aktuellSkarm === 'kartan' || aktuellSkarm === 'varldskartan' || aktuellSkarm === 'stigen' || aktuellSkarm === 'jaktmarken' || aktuellSkarm === 'chansrutan' || aktuellSkarm === 'gestaltrutan' || aktuellSkarm === 'byggarbetsplatsen' || aktuellSkarm === 'gjallarbron' || aktuellSkarm === 'bandit' || aktuellSkarm === 'skogen') {
        if (aktuellSkarm === 'gestaltrutan') {
            // Låt gestaltrutan hantera alla tangenter (inklusive Escape för game over)
            gestaltrutan.tangentNed(e.key);
        } else if (e.key === 'Escape') {
            // Escape för att återgå till menyn (för andra skärmar)
            if (aktuellSkarm === 'kontroller') {
                window.aktuellSkarm = 'huvudmeny';
                if (huvudmeny && typeof huvudmeny.visaMeny === 'function') huvudmeny.visaMeny();
                return;
            }
            if (aktuellSkarm === 'kartan') {
                return;
            }
            if (aktuellSkarm === 'varldskartan') {
                const hanterad = varldskartan && typeof varldskartan.hanteraEscape === 'function' ? varldskartan.hanteraEscape() : false;
                if (!hanterad) {
                    window.aktuellSkarm = 'kartan';
                    if (varldskartan) varldskartan.dolj();
                    if (kartan) kartan.visa(kartan && kartan.valtOmrade ? kartan.valtOmrade.namn : kartaReturnPlats);
                }
                return;
            }
            if (aktuellSkarm === 'smeden') {
                const hanterad = smeden.hanteraEscape();
                if (!hanterad) {
                    aktuellSkarm = 'spel';
                    smeden.dolj();
                }
            } else if (aktuellSkarm === 'druidenochsierskan') {
                const hanterad = druidenochsierskan.hanteraEscape();
                if (!hanterad) {
                    aktuellSkarm = 'spel';
                    druidenochsierskan.dolj();
                }
            } else if (aktuellSkarm === 'lotteriet') {
                const hanterad = lotteriet.hanteraEscape();
                if (!hanterad) {
                    aktuellSkarm = 'spel';
                    lotteriet.dolj();
                }
            } else if (aktuellSkarm === 'langhuset') {
                const hanterad = langhuset.hanteraEscape();
                if (!hanterad) {
                    aktuellSkarm = 'spel';
                    langhuset.dolj();
                }
            } else if (aktuellSkarm === 'byggarbetsplatsen') {
                // Forward Escape to byggarbetsplatsen so it can decide how to close
                try {
                    const hanterad = byggarbetsplatsen && typeof byggarbetsplatsen.hanteraEscape === 'function' ? byggarbetsplatsen.hanteraEscape() : false;
                    if (!hanterad) {
                        if (varlden) varlden.rensaInput();
                        aktuellSkarm = 'spel';
                        if (byggarbetsplatsen && typeof byggarbetsplatsen.dolj === 'function') byggarbetsplatsen.dolj();
                    }
                } catch (e) {
                    // Fallback: return to spel
                    if (varlden) varlden.rensaInput();
                    aktuellSkarm = 'spel';
                    if (byggarbetsplatsen && typeof byggarbetsplatsen.dolj === 'function') byggarbetsplatsen.dolj();
                }
            } else {
                oppnaHuvudmenyFran(aktuellSkarm);
            }
        } else if (aktuellSkarm === 'smeden') {
            smeden.hanteraTangent(e.key);
        } else if (aktuellSkarm === 'druidenochsierskan') {
            druidenochsierskan.hanteraTangent(e.key);
        } else if (aktuellSkarm === 'lotteriet') {
            lotteriet.hanteraTangent(e.key);
        } else if (aktuellSkarm === 'langhuset') {
            langhuset.hanteraTangent(e.key);
        } else if (aktuellSkarm === 'byggarbetsplatsen') {
            if (byggarbetsplatsen && typeof byggarbetsplatsen.tangentNed === 'function') byggarbetsplatsen.tangentNed(e.key);
        } else if (aktuellSkarm === 'kartan') {
            kartan.hanteraTangent(e.key);
        } else if (aktuellSkarm === 'varldskartan') {
            if (varldskartan && typeof varldskartan.tangentNed === 'function') varldskartan.tangentNed(e.key);
        } else if (aktuellSkarm === 'gjallarbron') {
            if (gjallarbron && typeof gjallarbron.tangentNed === 'function') gjallarbron.tangentNed(e.key);
        } else if (aktuellSkarm === 'skogen') {
            if (skogen && typeof skogen.tangentNed === 'function') skogen.tangentNed(e.key);
        } else if (aktuellSkarm === 'bandit') {
            if (bandit && typeof bandit.tangentNed === 'function') bandit.tangentNed(e.key);
        } else if (aktuellSkarm === 'stigen') {
            stigen.tangentNed(e.key);
        } else if (aktuellSkarm === 'jaktmarken') {
            jaktmarken.tangentNed(e.key);
        } else if (aktuellSkarm === 'chansrutan') {
            chansrutan.tangentNed(e.key);
        } else if (aktuellSkarm === 'spel') {
            varlden.tangentNed(e.key);
        }
    }
});

// Hantera när tangent släpps
document.addEventListener('keyup', (e) => {
    if (arGlobalGameOverAktivt()) {
        return;
    }

    if (aktuellSkarm === 'spel') {
        varlden.tangentUpp(e.key);
    } else if (aktuellSkarm === 'stigen') {
        stigen.tangentUpp(e.key);
    } else if (aktuellSkarm === 'jaktmarken') {
        jaktmarken.tangentUpp(e.key);
    } else if (aktuellSkarm === 'chansrutan') {
        chansrutan.tangentUpp(e.key);
    } else if (aktuellSkarm === 'bandit') {
        if (bandit && typeof bandit.tangentUpp === 'function') bandit.tangentUpp(e.key);
    } else if (aktuellSkarm === 'gjallarbron') {
        if (gjallarbron && typeof gjallarbron.tangentUpp === 'function') gjallarbron.tangentUpp(e.key);
    } else if (aktuellSkarm === 'gestaltrutan') {
        gestaltrutan.tangentUpp(e.key);
    } else if (aktuellSkarm === 'skogen') {
        if (skogen && typeof skogen.tangentUpp === 'function') skogen.tangentUpp(e.key);
    } else if (aktuellSkarm === 'byggarbetsplatsen') {
        if (byggarbetsplatsen && typeof byggarbetsplatsen.tangentUpp === 'function') byggarbetsplatsen.tangentUpp(e.key);
    } else if (aktuellSkarm === 'varldskartan') {
        if (varldskartan && typeof varldskartan.tangentUpp === 'function') varldskartan.tangentUpp(e.key);
    }
});

// Hantera menyval
function hanteraMenyVal(val) {
    switch(val) {
        case 'Nytt spel':
            valdSpelareKlass = null;
            valdSpelareNamn = null;
            window.aktuellSkarm = 'skapaGubbe';
            skapaGubbe.visaSkapaGubbe();
            break;
        case 'Fortsätt':
            if (!kanFortsattaSpel()) {
                showModalAlert('Du har inget spel att fortsätta.');
                break;
            }
            if (!atergaFranHuvudmeny()) {
                window.aktuellSkarm = 'spel';
                fortsattSpel();
            }
            break;
        case 'Ladda spel':
            laddaSpel();
            break;
        case 'Spara spel':
            sparaSpel();
            break;
        case 'Kontroller':
            window.aktuellSkarm = 'kontroller';
            break;
        case 'Avsluta':
            huvudmenyReturnSkarm = null;
            avslutaSpel();
            break;
    }
}

// Enkel savefunktion som skriver en reducerad spelstat till localStorage
function serialiseraByggnadsLista(lista) {
    if (!Array.isArray(lista)) return [];
    return lista.map((entry) => {
        if (!entry || typeof entry !== 'object') return entry;
        try {
            return JSON.parse(JSON.stringify(entry));
        } catch (e) {
            return {
                id: entry.id || null,
                namn: entry.namn || null,
                level: entry.level || 1,
                egenskaper: entry.egenskaper || {},
                krav: Array.isArray(entry.krav) ? entry.krav : []
            };
        }
    });
}

function normaliseraPlaceradByggnadLista(lista, fallbackType) {
    if (!Array.isArray(lista)) return [];
    return lista
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => ({
            key: entry.key || null,
            x: typeof entry.x === 'number' ? entry.x : 0,
            y: typeof entry.y === 'number' ? entry.y : 0,
            type: entry.type || fallbackType
        }));
}

function hittaByggnadsObjektByKey(lista, key) {
    if (!Array.isArray(lista) || !key) return null;
    return lista.find((entry) => entry && ((entry.id && String(entry.id) === String(key)) || (entry.namn && String(entry.namn) === String(key)))) || null;
}

function laggTillBonusEgenskaper(target, source) {
    if (!target || !source || typeof source !== 'object') return;
    for (const [nyckel, varde] of Object.entries(source)) {
        if (varde && typeof varde === 'object' && !Array.isArray(varde)) {
            if (!target[nyckel] || typeof target[nyckel] !== 'object') target[nyckel] = {};
            laggTillBonusEgenskaper(target[nyckel], varde);
        } else if (typeof varde === 'number') {
            target[nyckel] = (target[nyckel] || 0) + varde;
        }
    }
}

function aterstallByggnadsbonusar(spelare) {
    if (!spelare) return;
    const husLista = Array.isArray(spelare.egnaHus) ? spelare.egnaHus : [];
    const skeppLista = Array.isArray(spelare.egnaSkepp) ? spelare.egnaSkepp : [];
    const husBonus = {};
    const skeppBonus = {};

    const husPlaced = Array.isArray(spelare.husPlaced) ? spelare.husPlaced : [];
    const flottaPlaced = Array.isArray(spelare.flottaPlaced) ? spelare.flottaPlaced : [];

    husPlaced.forEach((entry) => {
        const byggnad = hittaByggnadsObjektByKey(husLista, entry.key);
        if (byggnad && byggnad.egenskaper) {
            laggTillBonusEgenskaper(husBonus, byggnad.egenskaper);
        }
    });

    flottaPlaced.forEach((entry) => {
        const byggnad = hittaByggnadsObjektByKey(skeppLista, entry.key);
        if (byggnad && byggnad.egenskaper) {
            laggTillBonusEgenskaper(skeppBonus, byggnad.egenskaper);
        }
    });

    spelare.bonusKallor = { hus: husBonus, skepp: skeppBonus };
    if (typeof spelare.uppdateraAktivaBonusEgenskaper === 'function') {
        spelare.uppdateraAktivaBonusEgenskaper();
    }
}

function hamtaSparbarSpelskarm() {
    if (aktuellSkarm === 'huvudmeny' || aktuellSkarm === 'kontroller') {
        return huvudmenyReturnSkarm || 'spel';
    }

    if (arNyttSpelPreviewSkarm() || aktuellSkarm === 'startskarm' || aktuellSkarm === 'startcutscene') {
        return huvudmenyReturnSkarm || 'spel';
    }

    return aktuellSkarm;
}

function byggSparadPlatsData(spelare) {
    const sparSkarm = hamtaSparbarSpelskarm();
    return {
        screen: sparSkarm,
        mapArea: spelare && typeof spelare.aktuellKartaOmrade === 'string' ? spelare.aktuellKartaOmrade : null,
        playerX: spelare && typeof spelare.x === 'number' ? spelare.x : null,
        playerY: spelare && typeof spelare.y === 'number' ? spelare.y : null,
        stigenRoom: stigen && typeof stigen.startOmradeNamn === 'string' ? stigen.startOmradeNamn : null,
        chansRoom: chansrutan && typeof chansrutan.startOmradeNamn === 'string' ? chansrutan.startOmradeNamn : null,
        skogenRoom: skogen && typeof skogen.startOmradeNamn === 'string' ? skogen.startOmradeNamn : null,
        gestaltRoom: gestaltrutan && typeof gestaltrutan.aktuellGestaltOmrade === 'string' ? gestaltrutan.aktuellGestaltOmrade : null,
        kartaAktuelltOmrade: kartan && kartan.aktuelltOmrade && typeof kartan.aktuelltOmrade.namn === 'string' ? kartan.aktuelltOmrade.namn : null,
        kartaValtOmrade: kartan && kartan.valtOmrade && typeof kartan.valtOmrade.namn === 'string' ? kartan.valtOmrade.namn : null
    };
}

function kopieraSomSparData(data, fallback) {
    try {
        return JSON.parse(JSON.stringify(data));
    } catch (e) {
        return typeof fallback === 'undefined' ? null : fallback;
    }
}

function byggSparatRumstillstandData() {
    const gestaltSystem = gestaltrutan && gestaltrutan.gestalter ? gestaltrutan.gestalter : null;
    let ragnarVisitedSnapshot = [];
    let ragnarVisitedStartIndex = null;
    try {
        if (skogen && skogen._ragnarVisitedSnapshot instanceof Set) {
            ragnarVisitedSnapshot = Array.from(skogen._ragnarVisitedSnapshot);
        } else if (skogen && Array.isArray(skogen._ragnarVisitedSnapshot)) {
            ragnarVisitedSnapshot = skogen._ragnarVisitedSnapshot.slice();
        }
        if (skogen && typeof skogen._ragnarVisitedStartIndex === 'number') {
            ragnarVisitedStartIndex = skogen._ragnarVisitedStartIndex;
        }
    } catch (e) {}

    return {
        stigen: stigen ? {
            rumStatus: kopieraSomSparData(stigen.rumStatus, {}),
            rumBesokRaknare: typeof stigen.rumBesokRaknare === 'number' ? stigen.rumBesokRaknare : 0,
            senastRum: typeof stigen.senastRum === 'string' ? stigen.senastRum : null,
            aktuelltRum: typeof stigen.aktuelltRum === 'string' ? stigen.aktuelltRum : null
        } : null,
        chansrutan: chansrutan ? {
            rumStatus: kopieraSomSparData(chansrutan.rumStatus, {}),
            rutaBesokRaknare: typeof chansrutan.rutaBesokRaknare === 'number' ? chansrutan.rutaBesokRaknare : 0,
            senastBesoktRuta: typeof chansrutan.senastBesoktRuta === 'string' ? chansrutan.senastBesoktRuta : null,
            aktuelltRum: typeof chansrutan.aktuelltRum === 'string' ? chansrutan.aktuelltRum : null
        } : null,
        gestalter: gestaltSystem ? {
            rumStatus: kopieraSomSparData(gestaltSystem.rumStatus, {}),
            rumBesokRaknare: typeof gestaltSystem.rumBesokRaknare === 'number' ? gestaltSystem.rumBesokRaknare : 0,
            senastRum: typeof gestaltSystem.senastRum === 'string' ? gestaltSystem.senastRum : null,
            aktuelltRum: typeof gestaltSystem.aktuelltRum === 'string' ? gestaltSystem.aktuelltRum : null,
            globalVisited: kopieraSomSparData(gestaltSystem.globalVisited, [])
        } : null,
        skogen: skogen ? {
            spawnedObjects: kopieraSomSparData(skogen._spawnedObjects, []),
            spawnedFyndAttempted: kopieraSomSparData(skogen._spawnedFyndAttempted, {}),
            globalAltarOffersUsed: kopieraSomSparData(skogen._globalAltarOffersUsed, { jarn: false, sten: false, tra: false }),
            ragnarKistaClaimed: !!skogen._ragnarKistaClaimed,
            ragnarVisitedSnapshot: kopieraSomSparData(ragnarVisitedSnapshot, []),
            ragnarVisitedStartIndex: ragnarVisitedStartIndex
        } : null
    };
}

function aterstallSkogenRumstillstand(skogsData) {
    if (!skogen || !skogsData || typeof skogsData !== 'object') return;
    skogen._spawnedObjects = kopieraSomSparData(skogsData.spawnedObjects, []);
    skogen._spawnedFyndAttempted = kopieraSomSparData(skogsData.spawnedFyndAttempted, {});
    skogen._globalAltarOffersUsed = Object.assign(
        { jarn: false, sten: false, tra: false },
        kopieraSomSparData(skogsData.globalAltarOffersUsed, {}) || {}
    );
    skogen._ragnarKistaClaimed = !!skogsData.ragnarKistaClaimed;
    skogen._ragnarVisitedSnapshot = new Set(Array.isArray(skogsData.ragnarVisitedSnapshot) ? skogsData.ragnarVisitedSnapshot : []);
    skogen._ragnarVisitedStartIndex = (typeof skogsData.ragnarVisitedStartIndex === 'number') ? skogsData.ragnarVisitedStartIndex : null;
    skogen._lootMessages = [];
}

function aterstallRumstillstandData(rumstillstand) {
    if (!rumstillstand || typeof rumstillstand !== 'object') return;

    if (stigen && rumstillstand.stigen && typeof rumstillstand.stigen === 'object') {
        stigen.rumStatus = kopieraSomSparData(rumstillstand.stigen.rumStatus, {});
        stigen.rumBesokRaknare = typeof rumstillstand.stigen.rumBesokRaknare === 'number' ? rumstillstand.stigen.rumBesokRaknare : 0;
        stigen.senastRum = typeof rumstillstand.stigen.senastRum === 'string' ? rumstillstand.stigen.senastRum : null;
        stigen.aktuelltRum = typeof rumstillstand.stigen.aktuelltRum === 'string' ? rumstillstand.stigen.aktuelltRum : null;
        stigen.varorPaMarken = [];
        stigen.narmasteFynd = null;
    }

    if (chansrutan && rumstillstand.chansrutan && typeof rumstillstand.chansrutan === 'object') {
        chansrutan.rumStatus = kopieraSomSparData(rumstillstand.chansrutan.rumStatus, {});
        chansrutan.rutaBesokRaknare = typeof rumstillstand.chansrutan.rutaBesokRaknare === 'number' ? rumstillstand.chansrutan.rutaBesokRaknare : 0;
        chansrutan.senastBesoktRuta = typeof rumstillstand.chansrutan.senastBesoktRuta === 'string' ? rumstillstand.chansrutan.senastBesoktRuta : null;
        chansrutan.aktuelltRum = typeof rumstillstand.chansrutan.aktuelltRum === 'string' ? rumstillstand.chansrutan.aktuelltRum : null;
        chansrutan.spawnadItem = null;
        chansrutan.aktivFiende = null;
        chansrutan.utgangAktiv = false;
    }

    const gestaltSystem = gestaltrutan && gestaltrutan.gestalter ? gestaltrutan.gestalter : null;
    if (gestaltSystem && rumstillstand.gestalter && typeof rumstillstand.gestalter === 'object') {
        gestaltSystem.rumStatus = kopieraSomSparData(rumstillstand.gestalter.rumStatus, {});
        gestaltSystem.rumBesokRaknare = typeof rumstillstand.gestalter.rumBesokRaknare === 'number' ? rumstillstand.gestalter.rumBesokRaknare : 0;
        gestaltSystem.senastRum = typeof rumstillstand.gestalter.senastRum === 'string' ? rumstillstand.gestalter.senastRum : null;
        gestaltSystem.aktuelltRum = typeof rumstillstand.gestalter.aktuelltRum === 'string' ? rumstillstand.gestalter.aktuelltRum : null;
        gestaltSystem.globalVisited = kopieraSomSparData(rumstillstand.gestalter.globalVisited, []);
        gestaltSystem.pendingMission = null;
        gestaltSystem.gestalter = [];
        gestaltSystem.narmasteGestalt = null;
        gestaltSystem.kraverRumsinteraktion = false;
        gestaltSystem.harRumsinteragerat = false;
        gestaltSystem.lockExit = false;
    }

    if (rumstillstand.skogen && typeof rumstillstand.skogen === 'object') {
        aterstallSkogenRumstillstand(rumstillstand.skogen);
    }
}

function harGiltigtRumstillstand(rumstillstand) {
    return !!(rumstillstand && typeof rumstillstand === 'object'
        && (rumstillstand.stigen || rumstillstand.chansrutan || rumstillstand.gestalter || rumstillstand.skogen));
}

function uppdateraSynligtRumEfterLoad(data) {
    const rumstillstand = data && data.rumstillstand;
    if (!harGiltigtRumstillstand(rumstillstand)) return;

    try {
        if (window.aktuellSkarm === 'stigen' && stigen && typeof stigen.initieraRumFynd === 'function') {
            stigen.initieraRumFynd(stigen.aktuelltRum || stigen.startOmradeNamn || 'Stigen1');
        }
    } catch (e) {}

    try {
        if (window.aktuellSkarm === 'chansrutan' && chansrutan && typeof chansrutan.initieraRumStatus === 'function') {
            chansrutan.initieraRumStatus(chansrutan.aktuelltRum || chansrutan.startOmradeNamn || 'Chans1');
        }
    } catch (e) {}

    try {
        if (window.aktuellSkarm === 'gestaltrutan' && gestaltrutan && gestaltrutan.gestalter && typeof gestaltrutan.gestalter.laddaGestalter === 'function') {
            const omrade = gestaltrutan.aktuellGestaltOmrade || (data.position && data.position.gestaltRoom) || 'Gestalt1';
            gestaltrutan.gestalter.laddaGestalter(omrade);
        }
    } catch (e) {}

    try {
        if (window.aktuellSkarm === 'skogen') {
            aterstallSkogenRumstillstand(rumstillstand.skogen);
        }
    } catch (e) {}
}

function migreraRumstillstandTillSparfil(key, data) {
    if (!key || !data || harGiltigtRumstillstand(data.rumstillstand)) return;
    try {
        data.rumstillstand = byggSparatRumstillstandData();
        sparaLagradData(key, JSON.stringify(data));
    } catch (e) {
        console.warn('Kunde inte migrera sparfil med rumstillstand.', e);
    }
}

function doljAllaSpelskarmarInnanLoad() {
    try { if (startcutscene) startcutscene.dolj(); } catch (e) {}
    try { if (smeden) smeden.dolj(); } catch (e) {}
    try { if (druidenochsierskan) druidenochsierskan.dolj(); } catch (e) {}
    try { if (lotteriet) lotteriet.dolj(); } catch (e) {}
    try { if (langhuset) langhuset.dolj(); } catch (e) {}
    try { if (byggarbetsplatsen) byggarbetsplatsen.dolj(); } catch (e) {}
    try { if (kartan) kartan.dolj(); } catch (e) {}
    try { if (varldskartan) varldskartan.dolj(); } catch (e) {}
    try { if (stigen) stigen.dolj(); } catch (e) {}
    try { if (jaktmarken) jaktmarken.dolj(); } catch (e) {}
    try { if (chansrutan) chansrutan.dolj(); } catch (e) {}
    try { if (gestaltrutan) gestaltrutan.dolj(); } catch (e) {}
    try { if (bandit) bandit.dolj(); } catch (e) {}
    try { if (gjallarbron) gjallarbron.dolj(); } catch (e) {}
    try { if (skogen) skogen.dolj(); } catch (e) {}
}

function aterstallSparadPlats(data) {
    const plats = data && data.position && typeof data.position === 'object' ? data.position : {};
    const spelare = varlden ? varlden.spelare : null;
    if (!spelare) return;

    const sparadSkarm = typeof plats.screen === 'string' ? plats.screen : 'spel';
    const mapAreaNamn = typeof plats.mapArea === 'string' ? plats.mapArea : (typeof spelare.aktuellKartaOmrade === 'string' ? spelare.aktuellKartaOmrade : 'Fyrmille');
    const sattSpelarPosition = () => {
        if (typeof plats.playerX === 'number') spelare.x = plats.playerX;
        if (typeof plats.playerY === 'number') spelare.y = plats.playerY;
    };

    huvudmenyReturnSkarm = null;
    rensaAllaPopups();
    if (varlden && typeof varlden.rensaInput === 'function') {
        varlden.rensaInput();
    }
    doljAllaSpelskarmarInnanLoad();

    if (kartan) {
        const aktuelltOmrade = typeof kartan.hamtaOmradeMedNamn === 'function'
            ? kartan.hamtaOmradeMedNamn(typeof plats.kartaAktuelltOmrade === 'string' ? plats.kartaAktuelltOmrade : mapAreaNamn)
            : null;
        const valtOmrade = typeof kartan.hamtaOmradeMedNamn === 'function'
            ? kartan.hamtaOmradeMedNamn(typeof plats.kartaValtOmrade === 'string' ? plats.kartaValtOmrade : mapAreaNamn)
            : null;

        kartan._pendingTravelOmrade = null;
        if (aktuelltOmrade && typeof kartan.sattAktuelltOmrade === 'function') {
            kartan.sattAktuelltOmrade(aktuelltOmrade, { behallVal: true });
        }
        if (valtOmrade && typeof kartan.sattValtOmrade === 'function') {
            kartan.sattValtOmrade(valtOmrade);
        }
    }

    switch (sparadSkarm) {
        case 'kartan':
            if (kartan) {
                window.aktuellSkarm = 'kartan';
                kartan.visa(typeof plats.kartaAktuelltOmrade === 'string' ? plats.kartaAktuelltOmrade : mapAreaNamn);
                if (typeof plats.kartaValtOmrade === 'string' && typeof kartan.hamtaOmradeMedNamn === 'function' && typeof kartan.sattValtOmrade === 'function') {
                    kartan.sattValtOmrade(kartan.hamtaOmradeMedNamn(plats.kartaValtOmrade));
                }
                return;
            }
            break;
        case 'varldskartan':
            if (varldskartan) {
                window.aktuellSkarm = 'varldskartan';
                varldskartan.visa();
                return;
            }
            break;
        case 'stigen':
            if (stigen) {
                window.aktuellSkarm = 'stigen';
                stigen.visa(typeof plats.stigenRoom === 'string' ? plats.stigenRoom : 'Stigen1');
                sattSpelarPosition();
                return;
            }
            break;
        case 'chansrutan':
            if (chansrutan) {
                window.aktuellSkarm = 'chansrutan';
                chansrutan.visa(typeof plats.chansRoom === 'string' ? plats.chansRoom : 'Chans1');
                sattSpelarPosition();
                return;
            }
            break;
        case 'skogen':
            if (skogen) {
                if (typeof plats.skogenRoom === 'string') {
                    skogen.startOmradeNamn = plats.skogenRoom;
                }
                window.aktuellSkarm = 'skogen';
                skogen.visa();
                aterstallSkogenRumstillstand(data && data.rumstillstand ? data.rumstillstand.skogen : null);
                sattSpelarPosition();
                return;
            }
            break;
        case 'gestaltrutan':
            if (gestaltrutan) {
                window.aktuellSkarm = 'gestaltrutan';
                gestaltrutan.visa(typeof plats.gestaltRoom === 'string' ? plats.gestaltRoom : 'Gestalt1');
                sattSpelarPosition();
                return;
            }
            break;
        case 'jaktmarken':
            if (jaktmarken) {
                window.aktuellSkarm = 'jaktmarken';
                jaktmarken.visa();
                sattSpelarPosition();
                return;
            }
            break;
        case 'bandit':
            if (bandit) {
                window.aktuellSkarm = 'bandit';
                bandit.visa();
                sattSpelarPosition();
                return;
            }
            break;
        case 'gjallarbron':
            if (gjallarbron) {
                window.aktuellSkarm = 'gjallarbron';
                gjallarbron.visa();
                sattSpelarPosition();
                return;
            }
            break;
        case 'smeden':
            if (smeden) {
                window.aktuellSkarm = 'smeden';
                smeden.visa();
                return;
            }
            break;
        case 'druidenochsierskan':
            if (druidenochsierskan) {
                window.aktuellSkarm = 'druidenochsierskan';
                druidenochsierskan.visa();
                return;
            }
            break;
        case 'lotteriet':
            if (lotteriet) {
                window.aktuellSkarm = 'lotteriet';
                lotteriet.visa();
                return;
            }
            break;
        case 'langhuset':
            if (langhuset) {
                window.aktuellSkarm = 'langhuset';
                langhuset.visa();
                return;
            }
            break;
        case 'byggarbetsplatsen':
            if (byggarbetsplatsen) {
                window.aktuellSkarm = 'byggarbetsplatsen';
                byggarbetsplatsen.visa();
                return;
            }
            break;
        case 'spel':
        default:
            break;
    }

    window.aktuellSkarm = 'spel';
    sattSpelarPosition();
}

function sparaSpel(slot) {
    if (!varlden || !varlden.spelare) {
        alert('Inget spel att spara.');
        return;
    }
    const slotNum = slot && Number.isInteger(slot) ? slot : 1;
    const key = 'yggdrasil_save_slot_' + slotNum;
    try {
        const spelare = varlden.spelare;
        const saveObj = {
            tid: Date.now(),
            position: byggSparadPlatsData(spelare),
            rumstillstand: byggSparatRumstillstandData(),
            spelare: {
                namn: spelare.namn,
                klass: (spelare.klass && spelare.klass.namn) ? spelare.klass.namn : spelare.klass,
                nivå: spelare.nivå,
                    konstruktion: spelare.konstruktion,
                    styrka: spelare.styrka,
                    special: spelare.special,
                    krav: spelare.krav ? { konstruktion: spelare.krav.konstruktion, reflex: spelare.krav.reflex, special: spelare.krav.special, max: spelare.krav.max } : null,
                liv: spelare.liv,
                maxLiv: spelare.maxLiv,
                    energi: spelare.energi,
                    maxEnergi: spelare.maxEnergi,
                aktuellKartaOmrade: spelare.aktuellKartaOmrade,
                x: spelare.x,
                y: spelare.y,
                pengar: spelare.pengar,
                prestationer: spelare.prestationer,
                egnaHus: serialiseraByggnadsLista(spelare.egnaHus),
                egnaSkepp: Array.isArray(spelare.egnaSkepp) ? spelare.egnaSkepp : [],
                husPlaced: normaliseraPlaceradByggnadLista(spelare.husPlaced, 'hus'),
                flottaPlaced: Array.isArray(spelare.flottaPlaced) ? spelare.flottaPlaced : []
            },
            utrustning: {
                inventory: (spelare.utrustning && spelare.utrustning.inventory) ? spelare.utrustning.inventory : [],
                vapen: spelare.utrustning && spelare.utrustning.vapen ? { id: spelare.utrustning.vapen.id } : null,
                rustning: spelare.utrustning && spelare.utrustning.rustning ? { id: spelare.utrustning.rustning.id } : null,
                hjalm: spelare.utrustning && spelare.utrustning.hjalm ? { id: spelare.utrustning.hjalm.id } : null,
                skold: spelare.utrustning && spelare.utrustning.skold ? { id: spelare.utrustning.skold.id } : null
                    ,accessoar: spelare.utrustning && spelare.utrustning.accessoar ? { id: spelare.utrustning.accessoar.id } : null
            },
            aktivaUppdrag: (window.langhuset && Array.isArray(window.langhuset.aktivaUppdrag)) ? window.langhuset.aktivaUppdrag : []
        };

        let doSave = true;
        if (hamtaLagradData(key)) {
            // Ask via in-game modal
            showModalConfirm('Slot ' + slotNum + ' innehåller redan en sparning. Vill du skriva över den?', () => {
                try {
                    if (!sparaLagradData(key, JSON.stringify(saveObj))) {
                        visaLagringsFel();
                        return;
                    }
                    showModalAlert('Spelet sparat i slot ' + slotNum + '.');
                } catch (e) {
                    console.error('Kunde inte spara spelet:', e);
                    showModalAlert('Sparningen misslyckades (se konsol).');
                }
            }, () => {
                // avbruten
            });
            return;
        }
        try {
            if (!sparaLagradData(key, JSON.stringify(saveObj))) {
                visaLagringsFel();
                return;
            }
            showModalAlert('Spelet sparat i slot ' + slotNum + '.');
        } catch (e) {
            console.error('Kunde inte spara spelet:', e);
            showModalAlert('Sparningen misslyckades (se konsol).');
        }
    } catch (e) {
        console.error('Kunde inte spara spelet:', e);
        alert('Sparningen misslyckades (se konsol).');
    }
}

// Ladda sparning från localStorage och återställ enkel spelstat
function laddaSpel(slot) {
    const slotNum = slot && Number.isInteger(slot) ? slot : 1;
    const key = 'yggdrasil_save_slot_' + slotNum;
    const raw = hamtaLagradData(key);
    if (!hamtaLokalLagring()) {
        visaLagringsFel();
        return;
    }
    if (!raw) {
        showModalAlert('Ingen sparning i slot ' + slotNum + '.');
        return;
    }
    if (!varlden) {
        showModalAlert('Spelmotorn är inte initialiserad. Ladda om sidan eller starta ett nytt spel.');
        return;
    }
    try {
        const data = JSON.parse(raw);
        const s = data.spelare || {};

        const doLoad = () => {
            try {
                const fallbackKlass = (varlden && varlden.spelare && varlden.spelare.klass) ? varlden.spelare.klass : null;
                const klassDef = hamtaKlassDefinition(s.klass, fallbackKlass);
                varlden.initieraSpelare(s.namn || 'Spelare', klassDef);
                if (forrad && varlden && varlden.spelare) forrad.sattSpelare(varlden.spelare);
                if (karaktarssida && varlden && varlden.spelare) karaktarssida.sattSpelare(varlden.spelare);
                valdSpelareKlass = klassDef;
                valdSpelareNamn = s.namn || 'Spelare';
            } catch (e) {
                console.warn('Kunde inte initiera spelare automatiskt från sparfil:', e);
            }

            const p = varlden.spelare;
            // Restore basic stats and krav if present in save
            if (typeof s.konstruktion !== 'undefined') p.konstruktion = s.konstruktion;
            if (typeof s.styrka !== 'undefined') p.styrka = s.styrka;
            if (typeof s.special !== 'undefined') p.special = s.special;
            if (s.krav) {
                try {
                    p.krav = new Krav({ konstruktion: s.krav.konstruktion, reflex: s.krav.reflex, special: s.krav.special, max: s.krav.max });
                } catch (e) {
                    p.krav = new Krav();
                }
            }
            p.namn = s.namn || p.namn;
            p.nivå = s.nivå || p.nivå;
            p.liv = typeof s.liv === 'number' ? s.liv : p.liv;
            p.maxLiv = typeof s.maxLiv === 'number' ? s.maxLiv : p.maxLiv;
            p.energi = typeof s.energi === 'number' ? s.energi : (typeof s.mana === 'number' ? s.mana : p.energi);
            p.maxEnergi = typeof s.maxEnergi === 'number' ? s.maxEnergi : (typeof s.maxMana === 'number' ? s.maxMana : p.maxEnergi);
            if (typeof p.normaliseraEnergi === 'function') {
                p.normaliseraEnergi();
            }
            p.aktuellKartaOmrade = typeof s.aktuellKartaOmrade === 'string' ? s.aktuellKartaOmrade : p.aktuellKartaOmrade;
            p.x = typeof s.x === 'number' ? s.x : p.x;
            p.y = typeof s.y === 'number' ? s.y : p.y;
            p.pengar = data.spelare && data.spelare.pengar ? data.spelare.pengar : p.pengar;
            p.prestationer = data.spelare && data.spelare.prestationer ? data.spelare.prestationer : p.prestationer;
            p.egnaHus = Array.isArray(s.egnaHus) ? s.egnaHus : (Array.isArray(p.egnaHus) ? p.egnaHus : []);
            p.egnaSkepp = Array.isArray(s.egnaSkepp) ? s.egnaSkepp : (Array.isArray(p.egnaSkepp) ? p.egnaSkepp : []);
            p.husPlaced = normaliseraPlaceradByggnadLista(s.husPlaced, 'hus');
            p.flottaPlaced = Array.isArray(s.flottaPlaced) ? s.flottaPlaced : (Array.isArray(p.flottaPlaced) ? p.flottaPlaced : []);
            if (typeof p.sakerstallPrestationsfalt === 'function') {
                p.sakerstallPrestationsfalt();
            }
            aterstallByggnadsbonusar(p);

            // Återställ inventory (ersätt helt)
            if (varlden.spelare && varlden.spelare.utrustning) {
                const utrustning = varlden.spelare.utrustning;
                const normaliseraForemal = (foremal) => {
                    if (!foremal || typeof foremal !== 'object') return foremal;
                    if (utrustning && typeof utrustning.normaliseraForemalData === 'function') {
                        return utrustning.normaliseraForemalData(foremal);
                    }
                    return Object.assign({}, foremal);
                };

                utrustning.inventory = (data.utrustning && data.utrustning.inventory)
                    ? data.utrustning.inventory.map((foremal) => foremal ? normaliseraForemal(foremal) : null)
                    : utrustning.inventory;
                const inv = utrustning.inventory || [];
                const findInInv = (id) => inv.find(it => it && it.id === id);
                if (data.utrustning) {
                        ['vapen','rustning','hjalm','skold'].forEach(slotName => {
                            const slotData = data.utrustning[slotName];
                            if (slotData && slotData.id) {
                                let item = findInInv(slotData.id);
                                if (item) {
                                    utrustning[slotName] = normaliseraForemal(item);
                                    const idx = inv.indexOf(item);
                                    if (idx >= 0) inv.splice(idx, 1);
                                } else {
                                    // If the equipped item isn't present in the saved inventory,
                                    // try to reconstruct it from the available definitions.
                                    try {
                                        const defs = (varlden.spelare && varlden.spelare.utrustning && varlden.spelare.utrustning.tillgangligaForemal) ? varlden.spelare.utrustning.tillgangligaForemal : null;
                                        const def = defs && defs[slotData.id] ? defs[slotData.id] : null;
                                        if (def) {
                                            item = normaliseraForemal(Object.assign({ id: slotData.id, count: 1 }, slotData, def));
                                            utrustning[slotName] = item;
                                        } else {
                                            utrustning[slotName] = null;
                                        }
                                    } catch (e) {
                                        console.warn('Kunde inte återskapa utrustningsobjekt för', slotData.id, e);
                                        utrustning[slotName] = null;
                                    }
                                }
                            }
                        });
                    // Restore accessory slot if saved
                    if (data.utrustning.accessoar && data.utrustning.accessoar.id) {
                        const aItem = findInInv(data.utrustning.accessoar.id);
                        if (aItem) {
                            utrustning.accessoar = normaliseraForemal(aItem);
                            const idxA = inv.indexOf(aItem);
                            if (idxA >= 0) inv.splice(idxA, 1);
                        } else {
                            utrustning.accessoar = null;
                        }
                    }
                }
                // Recompute stats from equipment after equipping
                try {
                    if (varlden.spelare.utrustning && typeof varlden.spelare.utrustning.uppdateraStats === 'function') {
                        varlden.spelare.utrustning.uppdateraStats();
                    }
                } catch (e) {
                    console.warn('Kunde inte uppdatera stats efter load:', e);
                }
                // Ensure UI components know about updated player
                if (forrad && varlden && varlden.spelare) forrad.sattSpelare(varlden.spelare);
                if (karaktarssida && varlden && varlden.spelare) karaktarssida.sattSpelare(varlden.spelare);
            }

            // Aktiva uppdrag
            if (window.langhuset && Array.isArray(data.aktivaUppdrag)) {
                window.langhuset.aktivaUppdrag = data.aktivaUppdrag;
            }

            aterstallRumstillstandData(data.rumstillstand);

            showModalAlert('Sparning från slot ' + slotNum + ' laddad. Fortsätter spelet.', () => {
                harFortsattbartSpel = true;
                aterstallSparadPlats(data);
                uppdateraSynligtRumEfterLoad(data);
                migreraRumstillstandTillSparfil(key, data);
                fortsattSpel();
            });
        };

        // Ask for confirmation via modal before loading
        showModalConfirm(
            'Vill du ladda sparning från slot ' + slotNum + '? Ditt nuvarande spel kommer ersättas.',
            doLoad,
            () => {
                visaLaddaSpelSubmeny(slotNum);
            }
        );
    } catch (e) {
        console.error('Kunde inte läsa sparfil:', e);
        showModalAlert('Kunde inte läsa sparfil (se konsol).');
    }
}

// Spellogik (placeholder)
function startaNyttSpel() {
    if (valdSpelareKlass && valdSpelareNamn) {
        console.log('Startar nytt spel med:', valdSpelareNamn, '(', valdSpelareKlass.namn, ')');
        huvudmenyReturnSkarm = null;
        nollstallAktivaUppdragForNyttSpel();
        rensaAllaPopups();
        if (varlden && typeof varlden.rensaInput === 'function') {
            varlden.rensaInput();
        }
        // Initialisera världen och spelaren
        varlden.initieraSpelare(valdSpelareNamn, valdSpelareKlass);
        aterstallNySpelStartTillFyrmille();
        harFortsattbartSpel = true;
        if (forrad && varlden && varlden.spelare) {
            forrad.sattSpelare(varlden.spelare);
        }
		if (karaktarssida && varlden && varlden.spelare) {
			karaktarssida.sattSpelare(varlden.spelare);
		}
    }
}

function fortsattSpel() {
    console.log('Fortsätter spel...');
    // Här läggs logik för att fortsätta ett sparat spel
}

function ritaKontroller() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 36px Times New Roman';
    ctx.textAlign = 'center';
    ctx.fillText('KONTROLLER', canvas.width / 2, 80);
    
    ctx.font = '24px Times New Roman';
    ctx.textAlign = 'left';
    
    const kontroller = [
        'Piltangenter eller WASD: Navigera i menyer och kartor',
        'Enter eller E: Välj, bekräfta och interagera',
        'WASD eller piltangenter: Rörelse i världen',
        'Escape: Gå tillbaka eller öppna huvudmenyn',
        'F: Fiska i Sjön när alternativet finns'
    ];
    
    let y = 160;
    kontroller.forEach(text => {
        ctx.fillText(text, 120, y);
        y += 50;
    });
    
    ctx.font = '16px Times New Roman';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Tryck Escape för att återgå till huvudmenyn', canvas.width / 2, canvas.height - 30);
}

function avslutaSpel() {
    showModalConfirm('Är du säker på att du vill avsluta?', () => {
        try {
            window.close();
        } catch (e) {}
        // Om window.close() inte fungerar, visa ett meddelande i modal
        showModalAlert('Tack för att du spelade!');
    }, () => {});
}

// Starta spelet när sidan laddas
window.addEventListener('load', init);

canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'startskarm') return;
    aktiveraHuvudmenyFranStartskarm();
    e.preventDefault();
    e.stopPropagation();
}, true);

canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'huvudmeny' || !huvudmeny) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    const valtAlternativ = huvudmeny.hanteraKlick(musX, musY);
    if (valtAlternativ) {
        hanteraMenyVal(valtAlternativ);
        e.preventDefault();
        e.stopImmediatePropagation();
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'huvudmeny' || !huvudmeny) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    huvudmeny.hanteraMusMove(musX, musY);
});

canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'skapaGubbe' || !skapaGubbe) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    const resultat = skapaGubbe.hanteraKlick(musX, musY);

    if (resultat) {
        if (resultat.action === 'valdKlass') {
            valdSpelareKlass = resultat.klass;
            window.aktuellSkarm = 'namnGubbe';
            namnGubbe.visaNamnSkarm(valdSpelareKlass);
            e.preventDefault();
            e.stopImmediatePropagation();
        } else if (resultat.action === 'tillbaka') {
            window.aktuellSkarm = 'huvudmeny';
            skapaGubbe.doljSkapaGubbe();
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'skapaGubbe' || !skapaGubbe) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    skapaGubbe.hanteraMusMove(musX, musY);
});

// Hantera musklick
canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'smeden' || !smeden) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    smeden.hanteraKlick(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'smeden' || !smeden) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    smeden.hanteraMusMove(musX, musY);
});

canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'kartan' || !kartan) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    kartan.hanteraKlick(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'kartan' || !kartan) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    kartan.hanteraMusMove(musX, musY);
});

canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'varldskartan' || !varldskartan) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    varldskartan.hanteraKlick(musX, musY);
});

canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'druidenochsierskan' || !druidenochsierskan) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    druidenochsierskan.hanteraKlick(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'druidenochsierskan' || !druidenochsierskan) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    druidenochsierskan.hanteraMusMove(musX, musY);
});

// Modal click handler (capture phase so it intercepts other click handlers)
function _modalClickHandler(e) {
    try {
        const m = window._gameModal;
        if (!m || !m.active) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const bounds = m._btnBounds;
        if (bounds && bounds.ok && x >= bounds.ok.x && x <= bounds.ok.x + bounds.ok.w && y >= bounds.ok.y && y <= bounds.ok.y + bounds.ok.h) {
            // OK clicked
            const cb = m.okCb;
            window._gameModal.active = false;
            window._gameModal._btnBounds = null;
            if (typeof cb === 'function') cb();
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (bounds && bounds.cancel && x >= bounds.cancel.x && x <= bounds.cancel.x + bounds.cancel.w && y >= bounds.cancel.y && y <= bounds.cancel.y + bounds.cancel.h) {
            const cb = m.cancelCb;
            window._gameModal.active = false;
            window._gameModal._btnBounds = null;
            if (typeof cb === 'function') cb();
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        // Click outside modal: close cancel for confirm, or close alert
        if (m.type === 'confirm') {
            const cb = m.cancelCb;
            window._gameModal.active = false;
            window._gameModal._btnBounds = null;
            if (typeof cb === 'function') cb();
            e.preventDefault();
            e.stopPropagation();
            return;
        } else {
            const cb = m.okCb;
            window._gameModal.active = false;
            window._gameModal._btnBounds = null;
            if (typeof cb === 'function') cb();
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    } catch (err) {
        console.warn('Modal click handler error', err);
    }
}

canvas.addEventListener('click', _modalClickHandler, true);

// Keyboard navigation for modal (capture so it overrides game controls)
document.addEventListener('keydown', (e) => {
    const m = window._gameModal;
    if (!m || !m.active) return;
    const k = e.key;
    const leftKeys = ['ArrowLeft','a','A'];
    const rightKeys = ['ArrowRight','d','D'];
    const upKeys = ['ArrowUp','w','W'];
    const downKeys = ['ArrowDown','s','S'];

    // Navigation between buttons (only for confirm)
    if (m.type === 'confirm') {
        if (leftKeys.includes(k) || upKeys.includes(k)) {
            m.focused = 'ok';
            renderModal(ctx);
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (rightKeys.includes(k) || downKeys.includes(k)) {
            m.focused = 'cancel';
            renderModal(ctx);
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    }

    // Activation keys
    if (k === 'Enter' || k === 'e' || k === 'E') {
        // Trigger the currently focused button in confirm dialogs
        const skaAvbryta = m.type === 'confirm' && m.focused === 'cancel';
        const cb = skaAvbryta ? m.cancelCb : m.okCb;
        m.active = false;
        m._btnBounds = null;
        if (typeof cb === 'function') cb();
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    if (k === 'Escape') {
        // Cancel for confirm, or OK for alert
        if (m.type === 'confirm') {
            const cb = m.cancelCb;
            m.active = false;
            m._btnBounds = null;
            if (typeof cb === 'function') cb();
            e.preventDefault();
            e.stopPropagation();
            return;
        } else {
            const cb = m.okCb;
            m.active = false;
            m._btnBounds = null;
            if (typeof cb === 'function') cb();
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    }
}, true);

canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'lotteriet' || !lotteriet) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    lotteriet.hanteraKlick(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'lotteriet' || !lotteriet) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    lotteriet.hanteraMusMove(musX, musY);
});


canvas.addEventListener('wheel', (e) => {
    if (aktuellSkarm !== 'smeden' || !smeden) return;
    e.preventDefault();
    const delta = e.deltaY;
    smeden.hanteraScroll(delta);
}, { passive: false });

canvas.addEventListener('wheel', (e) => {
    if (aktuellSkarm !== 'druidenochsierskan' || !druidenochsierskan) return;
    e.preventDefault();
    const delta = e.deltaY;
    druidenochsierskan.hanteraScroll(delta);
}, { passive: false });

canvas.addEventListener('wheel', (e) => {
    if (aktuellSkarm !== 'lotteriet' || !lotteriet) return;
    e.preventDefault();
    const delta = e.deltaY;
    lotteriet.hanteraScroll(delta);
}, { passive: false });

canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'langhuset' || !langhuset) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    langhuset.hanteraKlick(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'langhuset' || !langhuset) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    langhuset.hanteraMusMove(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'gestaltrutan' || !gestaltrutan) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    gestaltrutan.hanteraMusMove(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'jaktmarken' || !jaktmarken) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    jaktmarken.hanteraMusMove(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'chansrutan' || !chansrutan || typeof chansrutan.hanteraMusMove !== 'function') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    chansrutan.hanteraMusMove(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'bandit' || !bandit || typeof bandit.hanteraMusMove !== 'function') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    bandit.hanteraMusMove(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'skogen' || !window.gestaltrutan || !window.gestaltrutan.gestalter || typeof window.gestaltrutan.gestalter.hanteraMusMove !== 'function') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    window.gestaltrutan.gestalter.hanteraMusMove(musX, musY);
});

canvas.addEventListener('wheel', (e) => {
    if (aktuellSkarm !== 'langhuset' || !langhuset) return;
    e.preventDefault();
    const delta = e.deltaY;
    langhuset.hanteraScroll(delta);
}, { passive: false });

// Byggarbetsplatsen mouse/key handlers
canvas.addEventListener('click', (e) => {
    if (aktuellSkarm !== 'byggarbetsplatsen' || !byggarbetsplatsen) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    byggarbetsplatsen.hanteraKlick(musX, musY);
});

canvas.addEventListener('mousemove', (e) => {
    if (aktuellSkarm !== 'byggarbetsplatsen' || !byggarbetsplatsen) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    byggarbetsplatsen.hanteraMusMove(musX, musY);
});

canvas.addEventListener('wheel', (e) => {
    if (aktuellSkarm !== 'byggarbetsplatsen' || !byggarbetsplatsen) return;
    e.preventDefault();
    const delta = e.deltaY;
    byggarbetsplatsen.hanteraScroll(delta);
}, { passive: false });

inventoryCanvas.addEventListener('click', (e) => {
    if (!forrad) return;
    const rect = inventoryCanvas.getBoundingClientRect();
    const scaleX = inventoryCanvas.width / rect.width;
    const scaleY = inventoryCanvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    forrad.hanteraKlick(musX, musY);
});

inventoryCanvas.addEventListener('mousedown', (e) => {
    if (!forrad) return;
    const rect = inventoryCanvas.getBoundingClientRect();
    const scaleX = inventoryCanvas.width / rect.width;
    const scaleY = inventoryCanvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    forrad.hanteraMusNed(musX, musY);
});

window.addEventListener('mouseup', (e) => {
    if (!forrad) return;
    const rect = inventoryCanvas.getBoundingClientRect();
    const scaleX = inventoryCanvas.width / rect.width;
    const scaleY = inventoryCanvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    forrad.hanteraMusUpp(musX, musY);
});

characterCanvas.addEventListener('click', (e) => {
    if (!karaktarssida) return;
    const rect = characterCanvas.getBoundingClientRect();
    const scaleX = characterCanvas.width / rect.width;
    const scaleY = characterCanvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    karaktarssida.hanteraKlick(musX, musY);
});

characterCanvas.addEventListener('mousemove', (e) => {
    if (!karaktarssida) return;
    const rect = characterCanvas.getBoundingClientRect();
    const scaleX = characterCanvas.width / rect.width;
    const scaleY = characterCanvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    karaktarssida.hanteraMusMove(musX, musY);
});

characterCanvas.addEventListener('mouseleave', () => {
    if (!karaktarssida) return;
    karaktarssida.rensaHover();
});

statsCanvas.addEventListener('mousemove', (e) => {
    if (!stats) return;
    const rect = statsCanvas.getBoundingClientRect();
    const scaleX = statsCanvas.width / rect.width;
    const scaleY = statsCanvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    stats.hanteraMusMove(musX, musY);
});

statsCanvas.addEventListener('mouseleave', () => {
    if (!stats) return;
    stats.rensaHover();
});

inventoryCanvas.addEventListener('mousemove', (e) => {
    if (!forrad) return;
    const rect = inventoryCanvas.getBoundingClientRect();
    const scaleX = inventoryCanvas.width / rect.width;
    const scaleY = inventoryCanvas.height / rect.height;
    const musX = (e.clientX - rect.left) * scaleX;
    const musY = (e.clientY - rect.top) * scaleY;
    forrad.hanteraMusMove(musX, musY);
});

inventoryCanvas.addEventListener('mouseleave', () => {
    if (!forrad) return;
    forrad.rensaHover();
});

canvas.addEventListener('mouseleave', () => {
    try { if (gestaltrutan && typeof gestaltrutan.rensaHover === 'function') gestaltrutan.rensaHover(); } catch (e) {}
    try { if (jaktmarken && typeof jaktmarken.rensaHover === 'function') jaktmarken.rensaHover(); } catch (e) {}
    try { if (chansrutan && typeof chansrutan.rensaHover === 'function') chansrutan.rensaHover(); } catch (e) {}
    try { if (bandit && typeof bandit.rensaHover === 'function') bandit.rensaHover(); } catch (e) {}
    try { if (window.gestaltrutan && window.gestaltrutan.gestalter && typeof window.gestaltrutan.gestalter.rensaHover === 'function') window.gestaltrutan.gestalter.rensaHover(); } catch (e) {}
});
