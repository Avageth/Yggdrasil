class Gestalt {
    constructor(def, stridSystem) {
        this.id = def.id || def.namn || 'gestalt';
        this.namn = def.namn || 'Gestalt';
        this.x = def.x || 0;
        this.y = def.y || 0;
        this.radie = def.radie || 60;
        this.spriteBredd = def.spriteBredd || 70;
        this.spriteHojd = def.spriteHojd || 70;
        this.spegelvand = def.spegelvand || false;
        this.meddelande = def.meddelande || `Tryck pa [E] for att interagera med ${this.namn}`;
        this.onInteragera = def.onInteragera || null;
        // Är gestalten fientlig? (standard: true)
        this.hostil = (typeof def.hostil === 'boolean') ? def.hostil : true;
        this.engangsMote = !!def.engangsMote;
        this.banditStridslogik = !!def.banditStridslogik;

        // Hämta stridsegenskaper från Strid-systemet
        let stats = null;
        let mappedId = this.id;
        if (stridSystem && this.hostil !== false) {
            // Map id to correct fiende-namn (med speciella tecken)
            const idMap = {
                'barsark': 'bärsärk',
                'prast': 'präst'
            };
            mappedId = idMap[this.id] || this.id;
            stats = stridSystem.hamtaFiendeStats(mappedId);
        }
        
        // Spara mappat id för loot-lookup
        this.mappedId = mappedId;
        if (stats) {
            // Använd stats från Strid-systemet
            this.namn = stats.namn || this.namn;
            const skadaElement = stats.skadaElement || 'fysisk';
            const skadaValue = stats.skada && typeof stats.skada === 'object'
                ? (typeof stats.skada[skadaElement] === 'number' ? stats.skada[skadaElement] : 0)
                : (stats.skada || 25);
            this.liv = stats.liv || 50;
            this.maxLiv = stats.liv || 50;
            this.skada = skadaValue;
            this.skadaElement = skadaElement;
            this.motstånd = stats.motstånd || { fysisk: 0, eld: 0, magi: 0 };
            // Copy additional combat properties from Strid stats when available
            try {
                this.storlek = (typeof stats.storlek === 'number') ? stats.storlek : (this.spriteBredd || 20);
                this.hastighet = (typeof stats.hastighet === 'number') ? stats.hastighet : (this.hastighet || 1);
                this.attackRackvidd = (typeof stats.attackRackvidd === 'number') ? stats.attackRackvidd : (stats.attackRackvidd || 40);
                this.attackHastighet = (typeof stats.attackHastighet === 'number') ? stats.attackHastighet : (stats.attackHastighet || 60);
                this.erfarenhet = stats.erfarenhet || 0;
                // attack timer used by Strid system
                this.attackTimer = 0;
            } catch (e) {}
        } else {
            // Fallback defaults
            this.liv = def.liv || 50;
            this.maxLiv = def.liv || 50;
            this.skada = def.skada || 25;
            this.skadaElement = def.skadaElement || 'fysisk';
            this.motstånd = def.motstånd || { fysisk: 0, eld: 0, magi: 0 };
        }
        this.levande = true;

        this.sprite = new Image();
        this.spriteLaddad = false;
        try {
            const initialSrc = def.sprite || '';
            // Encode URI to handle diacritics in filenames when running from file://
            this.sprite.src = initialSrc ? encodeURI(initialSrc) : '';
            try { console.debug('[Gestalt] loading sprite for', this.namn || this.id, '->', this.sprite.src); } catch (e) {}
        } catch (e) {
            this.sprite.src = def.sprite || '';
        }
        this._spriteTriedEncoded = false;
        this._spriteTriedAscii = false;
        this._spriteTriedMapped = false;
        this.sprite.onload = () => {
            this.spriteLaddad = true;
            // Om ingen explicit bredd/hojd satts i definitionen, använd bildens naturliga storlek (1:1)
            if (!def.spriteBredd) this.spriteBredd = this.sprite.naturalWidth || this.spriteBredd;
            if (!def.spriteHojd) this.spriteHojd = this.sprite.naturalHeight || this.spriteHojd;
        };
        this.sprite.onerror = () => {
            try { console.warn('[Gestalt] sprite load failed for', this.namn || this.id, 'src=', this.sprite.src); } catch (e) {}
            // Försök att ladda med encodeURI om vi inte redan provat
            try {
                const src = def.sprite || '';
                if (src && !this._spriteTriedEncoded) {
                    this._spriteTriedEncoded = true;
                    try {
                        const enc = encodeURI(src);
                        console.debug('[Gestalt] retrying encoded src=', enc);
                        this.sprite.src = enc;
                        return;
                    } catch (e) {}
                }
                // Försök ASCII-fallback: ersätt åäö och accenter
                if (src && !this._spriteTriedAscii) {
                    this._spriteTriedAscii = true;
                    const ascii = String(src)
                        .replace(/å/g,'a').replace(/Å/g,'A')
                        .replace(/ä/g,'a').replace(/Ä/g,'A')
                        .replace(/ö/g,'o').replace(/Ö/g,'O')
                        .replace(/é/g,'e').replace(/É/g,'E')
                        .replace(/ó/g,'o').replace(/Ó/g,'O');
                    console.debug('[Gestalt] retrying ascii src=', ascii);
                    if (ascii !== src) {
                        this.sprite.src = ascii;
                        return;
                    }
                }
                // Försök använda mappat id (t.ex. prast -> präst) om det finns
                try {
                    if (!this._spriteTriedMapped && this.mappedId) {
                        this._spriteTriedMapped = true;
                        const cap = String(this.mappedId).charAt(0).toUpperCase() + String(this.mappedId).slice(1);
                        const alt = 'assets/Gestalter/' + cap + '.png';
                        const altEnc = encodeURI(alt);
                        console.debug('[Gestalt] retrying mapped src=', altEnc);
                        this.sprite.src = altEnc;
                        return;
                    }
                } catch (e) {}
            } catch (e) {}
            this.spriteLaddad = false;
        };
        // Skalfaktor som kan användas för att rita gestalten mindre/större (multiplicativ)
        // Standard: 0.35 för att göra gestalter något mindre
        this.spriteSkal = (typeof def.spriteSkal === 'number') ? def.spriteSkal : 0.35;
    }

    // Registrera att en viss "ruta" (område) blivit besökt — används för att räkna
    // unika andra rutor som besökts sedan ett rum rensades.
    notaRutaBesokt(rutaNamn) {
        if (!rutaNamn) return;
        try {
            // DEBUG: trace calls to notaRutaBesokt
            try { console.log('[Gestalt] notaRutaBesokt called with', rutaNamn); } catch (e) {}
            // Append to globalVisited for robust tracking
            try { this.globalVisited = this.globalVisited || []; this.globalVisited.push(rutaNamn); try { console.log('[Gestalt] globalVisited appended', rutaNamn, 'len=', this.globalVisited.length); } catch(e){} } catch(e) {}

            for (const [key, status] of Object.entries(this.rumStatus || {})) {
                try {
                    if (!status) continue;
                    // Vi bryr oss endast om rum som är markerade som rensade eller som
                    // redan har en pågående visitedSince-lista
                    if (status.rensadVid === null && !status.visitedSince) continue;
                    if (key === rutaNamn) continue; // don't count self
                    status.visitedSince = status.visitedSince || [];
                    if (status.visitedSince.indexOf(rutaNamn) === -1) {
                        status.visitedSince.push(rutaNamn);
                    }
                    // spara tillbaka och logga för synlighet
                    this.rumStatus[key] = status;
                    try { console.log('[Gestalt] notaRutaBesokt -', rutaNamn, 'updated status for', key, 'visitedSince=', status.visitedSince); } catch (e) {}
                } catch (e) {}
            }
        } catch (e) {}
    }

    arNara(spelareX, spelareY) {
        const dx = spelareX - this.x;
        const dy = spelareY - this.y;
        const avstand = Math.sqrt(dx * dx + dy * dy);
        return avstand <= this.radie;
    }

    rita(ctx, skala) {
        // Rita spriten i en skalad kontext så bilden ser korrekt ut i 1:1*skal
        const effektivSkal = skala * (this.spriteSkal || 1);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(effektivSkal, effektivSkal);
        ctx.translate(-this.x, -this.y);

        if (this.sprite && this.spriteLaddad && this.sprite.naturalWidth > 0) {
            if (this.spegelvand) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.scale(-1, 1);
                ctx.translate(-this.x, -this.y);
                ctx.drawImage(
                    this.sprite,
                    this.x - this.spriteBredd / 2,
                    this.y - this.spriteHojd / 2,
                    this.spriteBredd,
                    this.spriteHojd
                );
                ctx.restore();
            } else {
                ctx.drawImage(
                    this.sprite,
                    this.x - this.spriteBredd / 2,
                    this.y - this.spriteHojd / 2,
                    this.spriteBredd,
                    this.spriteHojd
                );
            }
        } else {
            ctx.fillStyle = '#ff8866';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();

        // Rita namn i odlad (icke-scalad) kontext men positionera det precis ovanför spriten
        try {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            // Placera texten precis ovanför spriten baserat på spritehöjd och aktuell skala
            let offset = Math.round((this.spriteHojd / 2) * effektivSkal) + 8;
            try {
                const idLower = String(this.id || '').toLowerCase();
                const namnLower = String(this.namn || '').toLowerCase();
                const mappedLower = String(this.mappedId || '').toLowerCase();
                if (idLower.indexOf('lognare') !== -1 || idLower.indexOf('lögnare') !== -1 || namnLower.indexOf('lognare') !== -1 || namnLower.indexOf('lögnare') !== -1 || mappedLower.indexOf('lognare') !== -1 || mappedLower.indexOf('lögnare') !== -1) {
                    // Flytta texten högre för lögnare så den inte kolliderar med huvudet
                    offset += 14;
                }
            } catch (e) {}
            const textY = this.y - offset;
            ctx.strokeText(this.namn, this.x, textY);
            ctx.fillText(this.namn, this.x, textY);
            ctx.restore();
        } catch (e) {}
    }
}

// Enkel text-wrapping helper för canvas
function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const test = cur ? (cur + ' ' + w) : w;
        const wWidth = ctx.measureText(test).width;
        if (wWidth > maxWidth && cur) {
            lines.push(cur);
            cur = w;
        } else {
            cur = test;
        }
    }
    if (cur) lines.push(cur);
    return lines;
}

class Gestalter {
    constructor() {
        this.stridSystem = new Strid();
        // Legacy-lås för äldre uppdragsflöden.
        this.lockExit = false;
        this.kraverRumsinteraktion = false;
        this.harRumsinteragerat = false;
        // Uppdragsmallar för 'Behov av hjälp' - slumpas när en sådan gestalt skapas
        this.behovUppdrag = [
            { text: 'Hör mig, krigare! Konung Harald Hårfager kräver att jarlarna böjer knä. Fäll tre hövdingar som trotsar honom och för deras guld till vår kista!', accept: function(spelare, gestalt, gestalter, gestaltrutan){ gestalter.gePengabeloning(spelare, { koppar: 5 }); gestalt.levande = false; if (gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Tack! Du fick 5 koppar.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } } },
            { text: 'På Gorms den Gamles befallning ska en minnessten resas! Lämna in tio sten och tre trä.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { sten: 10, tra: 3 };
                            if (!gestalter.harVaror(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du saknar varor: behöver 10 Sten och 3 Trä.');
                                return;
                            }
                            const ok = gestalter.taBortVaror(spelare, krav);
                            if (ok) {
                                gestalter.gePengabeloning(spelare, { koppar: 10 });
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Tack! Du fick 10 koppar för hjälpen!'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Kunde inte ta bort varor från inventory.');
                            }
                        } catch (e) { console.error('Gorms accept error', e); }
                    } },
            { text: 'Konung Harald Blåtand kräver lydnad och silver! Betala fem silver i tribut och slå ner två upprorsmän som vägrar svära trohet.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { silver: 5 };
                            if (!gestalter.harPengar(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du behöver 5 silver för att betala tribut.');
                                return;
                            }
                            const ok = gestalter.draAvPengar(spelare, krav);
                            if (ok) {
                                if (spelare) { spelare.liv = Math.min((spelare.maxLiv||10), (spelare.liv||0) + 2); }
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du betalade tribut och fick 2 liv tillbaka.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Betalning misslyckades.');
                            }
                        } catch (e) { console.error('Harald accept error', e); }
                    } },
            { text: 'Erik Segersäll kräver styrka! Dräp fyra banditer som plågar landet och bringa två stycken kött till blotet.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { kottbit: 2 };
                            if (!gestalter.harVaror(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du behöver 2 köttbitar för detta uppdrag.');
                                return;
                            }
                            const ok = gestalter.taBortVaror(spelare, krav);
                            if (ok) {
                                if (spelare && spelare.prestationer) { spelare.prestationer.hjalptBonde = (spelare.prestationer.hjalptBonde||0) + 1; }
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Tack! Gården är säker för natten.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Kunde inte ta bort kött från inventory.');
                            }
                        } catch (e) { console.error('Erik accept error', e); }
                    } },
            { text: 'Olav Tryggvason tolererar inte hedningar! Fäll två krigare som vägrar omvända sig och överlämna en titanit som bevis på din trohet.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { titanit: 1 };
                            if (!gestalter.harVaror(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du måste ha 1 Titanit för att ta detta uppdrag.');
                                return;
                            }
                            const ok = gestalter.taBortVaror(spelare, krav);
                            if (ok) {
                                gestalter.gePengabeloning(spelare, { silver: 1 });
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du fick 1 silver för din trohet.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Kunde inte ta titanit från inventory.');
                            }
                        } catch (e) { console.error('Olav accept error', e); }
                    } },
            { text: 'Kyrkan behöver medel! Lämna åtta silver till prästerna så Olav den Heliges verk kan fortsätta.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { silver: 8 };
                            if (!gestalter.harPengar(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du behöver 8 silver för detta uppdrag.');
                                return;
                            }
                            const ok = gestalter.draAvPengar(spelare, krav);
                            if (ok) {
                                if (spelare && spelare.prestationer) { spelare.prestationer.uppdragUtf = (spelare.prestationer.uppdragUtf||0) + 1; }
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Brev levererat. Tack!'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Betalning misslyckades.');
                            }
                        } catch (e) { console.error('Olav accept error', e); }
                    } },
            { text: 'Helge Hundingsbane törstar efter byte! Dräp tre kustvakter och fyll dina fickor med guld innan du återvänder.', accept: function(spelare, gestalt, gestalter, gestaltrutan){ gestalter.gePengabeloning(spelare, { koppar: 15 }); gestalt.levande = false; if (gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du hittade armbandet och fick 15 koppar!'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } } },
            { text: 'Kung Björn har seglat långt och kräver sällsynta varor! Lämna tre sten som bevisas dugligt till Götavirke.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { sten: 3 };
                            if (!gestalter.harVaror(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du saknar 3 Sten.');
                                return;
                            }
                            const ok = gestalter.taBortVaror(spelare, krav);
                            if (ok) {
                                if (spelare && spelare.prestationer) { spelare.prestationer.nötterSamlade = (spelare.prestationer.nötterSamlade||0) + 10; }
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du samlade nötter åt byborna.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Kunde inte ta bort sten från inventory.');
                            }
                        } catch (e) { console.error('Kung Björn accept error', e); }
                    } },
            { text: 'Frihetskämpen Tore Hunds fana vajar över slagfältet! Deltag i upproret och fäll två präster så fiendens murar skälver.', accept: function(spelare, gestalt, gestalter, gestaltrutan){ gestalter.gePengabeloning(spelare, { koppar: 8 }); gestalt.levande = false; if (gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du fann sonen och fick 8 koppar.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } } },
            { text: 'Knut den Store härskar över haven! Lämna två silver till kronans skattkista.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { silver: 2 };
                            if (!gestalter.harPengar(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du har inte tillräckligt med silver.', 200);
                                return;
                            }
                            const ok = gestalter.draAvPengar(spelare, krav);
                            if (ok) {
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Tack! Du lämnade 2 silver.'; gestaltrutan.gestalter.senasteMeddelandeTid = 200; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Betalning misslyckades.', 200);
                            }
                        } catch (e) { console.error('Knut accept error', e); }
                    } },
            { text: 'Brage Boddasson arbetar med ett nästan omöjligt verk och behöver fem järn för att kunna fortsätta.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { jarn: 5 };
                            if (!gestalter.harVaror(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du saknar 5 järn.');
                                return;
                            }
                            const ok = gestalter.taBortVaror(spelare, krav);
                            if (ok) {
                                if (spelare && spelare.prestationer) { spelare.prestationer.staketLagade = (spelare.prestationer.staketLagade||0) + 1; }
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Staketet lagat. Tack!'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Kunde inte ta bort järn från inventory.');
                            }
                        } catch (e) { console.error('Brage accept error', e); }
                    } },
            { text: 'Sven Tveskägg kräver Englands rikedomar! Dräp tre banditer som plågar landet och betala en guld som tribut till hans krigskassa.', accept: function(spelare, gestalt, gestalter, gestaltrutan){
                        try {
                            const krav = { guld: 1 };
                            if (!gestalter.harPengar(spelare, krav)) {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du måste betala 1 guld för att ta uppdraget.');
                                return;
                            }
                            const ok = gestalter.draAvPengar(spelare, krav);
                            if (ok) {
                                gestalter.gePengabeloning(spelare, { silver: 2 });
                                gestalt.levande = false;
                                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du vaktade byn och fick 2 silver.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                            } else {
                                gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Betalning misslyckades.');
                            }
                        } catch (e) { console.error('Sven accept error', e); }
                    } }
        ];
        // Varianter av lögnare med olika texter och handlingar
        this.lognareTyper = [
            {
                text: 'En niding distraherar dig medans han plundrar dina fickor! Du märker det inte förrän han är långt borta.',
                action: function(spelare, gestalt, gestalter, gestaltrutan) {
                    if (spelare && spelare.pengar) {
                        spelare.pengar.koppar = (spelare.pengar.koppar||0) - 6;
                        spelare.pengar.silver = (spelare.pengar.silver||0) - 2;
                        spelare.pengar.guld = (spelare.pengar.guld||0) - 1;
                        gestalter.normaliseraPengar(spelare);
                    }
                    if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Lögnaren stal en guld, två silver och 6 koppar från dig.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                    gestalt.levande = false;
                }
            },
            {
                text: 'En bonde ber dig att flytta på ett brunslock som fastnat. När du enkelt får upp locket så blir du nerputtad i brunnen. Du lyckas ta dig upp, men du har ansträngt dig mycket och känner dig svagare än innan. Du förlorar all din energi.',
                action: function(spelare, gestalt, gestalter, gestaltrutan) {
                    try {
                        if (spelare && typeof spelare.energi === 'number') {
                            spelare.energi = Math.max(0, (spelare.energi || 0) - 8);
                        }
                        if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du föll i brunnen och förlorade all din energi.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                        gestalt.levande = false;
                    } catch (e) {}
                }
            },
            {
                text: 'En främling lurar dig att det finns en skatt gömd på ett fält med högt gräs. När du kommer dit så dyker en blodvarg upp och anfaller dig!',
                action: function(spelare, gestalt, gestalter, gestaltrutan) {
                    try {
                        // Flytta spelaren till områdets spawnpunkt så denne inte står där blodvargen spawnar
                        try {
                            const area = (gestaltrutan && gestaltrutan.aktuellGestaltOmrade) ? gestaltrutan.aktuellGestaltOmrade : null;
                            const spawn = area ? gestalter.hamtaSpelareSpawn(area) : null;
                            if (spawn && spelare) { spelare.x = spawn.x; spelare.y = spawn.y; }
                        } catch (e) {}
                        const cx = (gestaltrutan && gestaltrutan.canvas) ? (gestaltrutan.canvas.width/2) : 320;
                        const cy = (gestaltrutan && gestaltrutan.canvas) ? (gestaltrutan.canvas.height/2) : 400;
                        gestalter.spawnMissionEnemies('blodvarg', 1, cx, cy, { engangsMote: true });
                        gestalter.pendingMission = {
                            enemyId: 'blodvarg',
                            requiredCount: 1,
                            acceptFunction: function(spelareArg, gestaltArg, gestalterArg, gestaltrutanArg){
                                try {
                                    // Markera origin-gestalt som död/avslutad när spelaren belönas
                                    try { if (gestaltArg) gestaltArg.levande = false; } catch (e) {}
                                    if (gestaltrutanArg && gestaltrutanArg.gestalter) { gestaltrutanArg.gestalter.senasteMeddelande = 'Du besegrade blodvargen.'; gestaltrutanArg.gestalter.senasteMeddelandeTid = 240; }
                                } catch (e) {}
                            },
                            originGestalt: gestalt,
                            gestaltrutan: gestaltrutan,
                            rewarded: false
                        };
                        if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Ett uppdrag aktiverat — döda blodvargen!'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                    } catch (e) {}
                }
            },
            {
                text: 'Jag kan dubbla dina pengar genom galdring, om du ger mig 5 silver...',
                action: function(spelare, gestalt, gestalter, gestaltrutan) {
                    try {
                        if (!spelare || !spelare.pengar) return;
                        const p = spelare.pengar;
                        // Konvertera allt till koppar för jämförelse (1 silver = 10 koppar, 1 guld = 100 koppar)
                        let totalKoppar = (p.guld || 0) * 100 + (p.silver || 0) * 10 + (p.koppar || 0);
                        const behov = 5 * 10; // 5 silver i koppar
                        if (totalKoppar < behov) {
                            if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du har inte tillräckligt med silver.'; gestaltrutan.gestalter.senasteMeddelandeTid = 200; }
                            return;
                        }
                        totalKoppar -= behov;
                        // Sätt tillbaka i separata valutor
                        p.guld = Math.floor(totalKoppar / 100);
                        const efter = totalKoppar % 100;
                        p.silver = Math.floor(efter / 10);
                        p.koppar = efter % 10;
                        // Lögnaren tar pengarna och försvinner
                        if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Lögnaren sprang iväg med dina 5 silver.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                        gestalter.normaliseraPengar(spelare);
                        gestalt.levande = false;
                    } catch (e) {}
                }
            },
            {
                text: 'En niding håller upp en märklig artefakt och påstår att den kan ge dig kraft. När du rör vid den så känner du en kall våg av energi och blir förlamad av smärta. Nidingen plundrar din förlamade kropp och du förlorar ett liv.',
                action: function(spelare, gestalt, gestalter, gestaltrutan) {
                    try {
                        // Förlora ett liv
                        if (spelare && typeof spelare.liv === 'number') {
                            spelare.liv = Math.max(0, (spelare.liv || 0) - 1);
                        }
                        // Stjäl en slumpmässig summa upp till 1 guld (100 koppar)
                        if (spelare && spelare.pengar) {
                            const p = spelare.pengar;
                            let totalK = (p.guld || 0) * 100 + (p.silver || 0) * 10 + (p.koppar || 0);
                            const steal = Math.min(totalK, Math.floor(Math.random() * 100) + 1);
                            totalK = Math.max(0, totalK - steal);
                            p.guld = Math.floor(totalK / 100);
                            const after = totalK % 100;
                            p.silver = Math.floor(after / 10);
                            p.koppar = after % 10;
                            gestalter.normaliseraPengar(spelare);

                            // Bygg ett läsbart meddelande för det stulna beloppet
                            const stolenG = Math.floor(steal / 100);
                            const stolenAfter = steal % 100;
                            const stolenS = Math.floor(stolenAfter / 10);
                            const stolenK = stolenAfter % 10;
                            const delar = [];
                            if (stolenG > 0) delar.push(stolenG + ' guld');
                            if (stolenS > 0) delar.push(stolenS + ' silver');
                            if (stolenK > 0) delar.push(stolenK + ' koppar');
                            const stText = delar.length ? delar.join(' och ') : 'inget';
                            if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du förlorade 1 liv och ' + stText + '.'; gestaltrutan.gestalter.senasteMeddelandeTid = 260; }
                        } else {
                            if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Du förlorade 1 liv.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                        }
                        gestalt.levande = false;
                    } catch (e) {}
                }
            }
        ];
        // Typer av Hjälpare (tjänster/aktioner) - välj en slumpvis när en hjälpare spawnas
        this.hjalpareTyper = [
            { text: 'Du passerar en stuga med en man som arbetar utanför. Mannen ropar efter dig och säger att han har hört mycket gott om dig. Han erbjuder därefter följande gåvor: 1 Titanit, 2 Trä och 1 Järn.', action: function(spelare, gestalt, gestalter, gestaltrutan){ try{ if (spelare) {
                    // Använd `Utrustning.laggTillForemal` om möjligt så att item-metadata (ikon, namn etc.) följer med.
                    if (spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') {
                        try { spelare.utrustning.laggTillForemal('titanit'); } catch (e) {}
                        try { spelare.utrustning.laggTillForemal('tra'); spelare.utrustning.laggTillForemal('tra'); } catch (e) {}
                        try { spelare.utrustning.laggTillForemal('jarn'); } catch (e) {}
                    } else {
                        spelare.utrustning = spelare.utrustning || {};
                        spelare.utrustning.inventory = spelare.utrustning.inventory || [];
                        const inv = spelare.utrustning.inventory;
                        function addItem(id, count) {
                            for (let i = 0; i < inv.length; i++) {
                                if (inv[i].id === id) { inv[i].count = (inv[i].count || 0) + count; return; }
                            }
                            inv.push({ id: id, count: count });
                        }
                        addItem('titanit', 1);
                        addItem('tra', 2);
                        addItem('jarn', 1);
                    }
                }
                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Hjälparen gav dig: 1 Titanit, 2 Trä, 1 Järn.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } if (gestalt) gestalt.levande = false; } catch(e){} } },
            { text: 'Du stöter på en vis gammal man vid namn Tjodolv av Hvine som berättar en gammal historia om Ynglingaätten. Du känner en starkare koppling till dina förfäder och inkasserar ett liv.', action: function(spelare, gestalt, gestalter, gestaltrutan){ try{ if (spelare && typeof spelare.liv === 'number') { spelare.liv = Math.min((spelare.maxLiv||10), (spelare.liv||0) + 1); } if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Hjälparen helade dig +2 liv.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } if (gestalt) gestalt.levande = false; } catch(e){} } },
            { text: 'Du stöter på en klok skald vid namn Brage Boddasson längs vägen och utmanar dig på Hnefatafl. Du känner dig klokare och starkare efter partiets avslut och inkasserar ett liv och en energi', action: function(spelare, gestalt, gestalter, gestaltrutan){ try{ if (spelare && typeof spelare.liv === 'number') { spelare.liv = Math.min((spelare.maxLiv||10), (spelare.liv||0) + 1); } if (spelare && typeof spelare.energi === 'number') { spelare.energi = Math.min((spelare.maxEnergi||10), (spelare.energi||0) + 1); } if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Hjälparen gav dig +1 liv och +1 energi.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } if (gestalt) gestalt.levande = false; } catch(e){} } },
            { text: 'Efter en lång färd så känner du för att vila en stund. En völva kommer fram till dig och frågar om du vill veta hur Nornorna har spunnit ditt öde i deras trådar. Inkassera en energi.', action: function(spelare, gestalt, gestalter, gestaltrutan){ try{ if (spelare && typeof spelare.energi === 'number') { spelare.energi = Math.min((spelare.maxEnergi||10), (spelare.energi||0) + 1); } if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Hjälparen gav dig 1 energi.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } if (gestalt) gestalt.levande = false; } catch(e){} } },
            { text: 'En person från ditt förflutna kommer fram till dig och säger att denne vill återgällda den tjänst som du gjorde för länge sedan. Personen ger dig två stenar och en trä.', action: function(spelare, gestalt, gestalter, gestaltrutan){ try{ try{ const area = (gestaltrutan && gestaltrutan.aktuellGestaltOmrade) ? gestaltrutan.aktuellGestaltOmrade : null; const spawn = area ? gestalter.hamtaSpelareSpawn(area) : null; if (spawn && spelare) { spelare.x = spawn.x; spelare.y = spawn.y; } }catch(e){}
                // Lägg till 2 sten och 1 trä i spelarens inventory (använd Utrustning API om möjligt)
                try {
                    if (spelare && spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') {
                        try { spelare.utrustning.laggTillForemal('sten'); } catch(e) {}
                        try { spelare.utrustning.laggTillForemal('sten'); } catch(e) {}
                        try { spelare.utrustning.laggTillForemal('tra'); } catch(e) {}
                    } else if (spelare) {
                        spelare.utrustning = spelare.utrustning || {};
                        spelare.utrustning.inventory = spelare.utrustning.inventory || [];
                        const inv = spelare.utrustning.inventory;
                        function addItem(id, count) {
                            for (let i = 0; i < inv.length; i++) {
                                if (inv[i].id === id) { inv[i].count = (inv[i].count || 0) + count; return; }
                            }
                            inv.push({ id: id, count: count });
                        }
                        addItem('sten', 2);
                        addItem('tra', 1);
                    }
                } catch(e) {}
                if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Personen gav dig 2 Sten och 1 Trä.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                if (gestalt) gestalt.levande = false; } catch(e){} } },
            { text: 'En kvinna längs vägen vid namn Thora Borgarhjort ser att du är utmattad och behöver vila. Kvinnan erbjuder sig att berätta om den gången hon räddades av Ragnar Loddbrok från Ljungormen. Du känner dig exalterad och utvilad efter historien och inkasserar där med en energi.', action: function(spelare, gestalt, gestalter, gestaltrutan){ try{ if (spelare && typeof spelare.energi === 'number') { spelare.energi = Math.min((spelare.maxEnergi||10), (spelare.energi||0) + 1); } if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Hjälparen gav dig 1 energi.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } if (gestalt) gestalt.levande = false; } catch(e){} } },
            { text: 'Under en kall natt så kommer det en kvinna med många pälsar som frågar ifall du fryser och ger dig en päls att värma dig med. I pälsen ligger det två järn.', action: function(spelare, gestalt, gestalter, gestaltrutan){ try{
                    // Ge spelaren 2 järn (använd Utrustning API om möjligt)
                    if (spelare && spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') {
                        try { spelare.utrustning.laggTillForemal('jarn'); } catch(e) {}
                        try { spelare.utrustning.laggTillForemal('jarn'); } catch(e) {}
                    } else if (spelare) {
                        spelare.utrustning = spelare.utrustning || {};
                        spelare.utrustning.inventory = spelare.utrustning.inventory || [];
                        const inv = spelare.utrustning.inventory;
                        function addItem(id, count) {
                            for (let i = 0; i < inv.length; i++) {
                                if (inv[i].id === id) { inv[i].count = (inv[i].count || 0) + count; return; }
                            }
                            inv.push({ id: id, count: count });
                        }
                        addItem('jarn', 2);
                    }
                    if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Hjälparen gav dig 2 Järn.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; }
                    if (gestalt) gestalt.levande = false;
                } catch(e){} } },
            { text: 'Du träffar en gammal vän vid namn Gånge Rolv som är skyldig dig 5 silvermynt från ett parti Hnefatafl. Du slår läger medans din vän går och skaffar fram pengarna.', action: function(spelare, gestalt, gestalter, gestaltrutan){ try{ gestalter.gePengabeloning(spelare, { silver: 5 }); if (gestaltrutan && gestaltrutan.gestalter) { gestaltrutan.gestalter.senasteMeddelande = 'Hjälparen gav dig 5 silver.'; gestaltrutan.gestalter.senasteMeddelandeTid = 240; } if (gestalt) gestalt.levande = false; } catch(e){} } }
        ];
        this.spawnPunkter = {
            Gestalt1: [
                { id: 'bandit', namn: 'Bandit', x: 450, y: 420, radie: 60, sprite: 'assets/Gestalter/Bandit.png', spegelvand: true }
            ],
            Gestalt2: [
                { id: 'blodvarg', namn: 'Blodvarg', x: 450, y: 420, radie: 60, sprite: 'assets/Gestalter/Blodvarg.png', spegelvand: true }
            ],
            Gestalt3: [
                { id: 'barsark', namn: 'Bärsärk', x: 450, y: 420, radie: 70, sprite: 'assets/Gestalter/Bärsärk.png', spegelvand: true }
            ],
            Gestalt4: [
                { id: 'prast', namn: 'Präst', x: 450, y: 420, radie: 60, sprite: 'assets/Gestalter/Präst.png', spegelvand: true }
            ],
            Gestalt5: [
                { id: 'viking', namn: 'Viking', x: 450, y: 420, radie: 70, sprite: 'assets/Gestalter/Viking.png', spegelvand: true }
            ],
            Gestalt6: [
                { id: 'bonde', namn: 'Bonde', x: 450, y: 420, radie: 70, sprite: 'assets/Gestalter/Bonde.png', spegelvand: true }
            ],
            // Nya typer: Behov av hjälp, Hjälpare, Lögnare
            BehovAvHjalp: [
                { id: 'behov_av_hjalp', namn: 'Behov av hjälp', x: 400, y: 380, radie: 60, sprite: 'assets/Gestalter/BehovAvHjalp.png', spegelvand: false, hostil: false, meddelande: 'Hjälp! [E]', onInteragera: function(gestalt, spelare, gestalter, gestaltrutan) {
                        const text = gestalt.meddelande || 'Denne behöver hjälp. Vill du hjälpa?';
                        gestaltrutan.openModal(text,
                            function() {
                                // Accept: ge liten belöning och ta bort gestalten
                                try {
                                    gestalter.gePengabeloning(spelare, { koppar: 5 });
                                    gestalt.levande = false;
                                    if (gestaltrutan.gestalter) {
                                        gestaltrutan.gestalter.senasteMeddelande = 'Du hjälpte ' + (gestalt.namn || '') + ' och fick 5 koppar!';
                                        gestaltrutan.gestalter.senasteMeddelandeTid = 240;
                                    }
                                } catch (e) {}
                            },
                            function() {
                                try {
                                    if (gestalter && typeof gestalter.registreraQuestInteraktion === 'function') {
                                        gestalter.registreraQuestInteraktion(spelare, 'behovAvHjalpForradda');
                                    }
                                    gestalt.levande = false;
                                } catch (e) {}
                                if (gestaltrutan.gestalter) {
                                    gestaltrutan.gestalter.senasteMeddelande = 'Du tackade nej och förrådde den behövande.';
                                    gestaltrutan.gestalter.senasteMeddelandeTid = 180;
                                }
                            }
                        );
                    } }
            ],
            Hjalpare: [
                { id: 'hjalpare', namn: 'Hjälpare', x: 500, y: 380, radie: 60, sprite: 'assets/Gestalter/Hjalpare.png', spegelvand: true, hostil: false, meddelande: 'Behöver du hjälp? Tryck [E] för att tala.' }
            ],
            Lognare: [
                { id: 'lognare', namn: 'Lögnare', x: 400, y: 330, radie: 60, sprite: 'assets/Gestalter/Lögnare.png', spegelvand: false, hostil: false, meddelande: 'Jag har nyheter... Tryck [E] för att lyssna.' }
            ],
            standard: [
                { id: 'bandit', namn: 'Bandit', x: 450, y: 420, radie: 60, sprite: 'assets/Gestalter/Bandit.png', spegelvand: true },
                { id: 'behov_av_hjalp', namn: 'Behov av hjälp', x: 400, y: 380, radie: 60, sprite: 'assets/Gestalter/BehovAvHjalp.png', spegelvand: false, hostil: false, meddelande: 'Jag behöver hjälp! Tryck [E] för att hjälpa.', onInteragera: function(gestalt, spelare, gestalter, gestaltrutan) {
                        const text = gestalt.meddelande || 'Denne behöver hjälp. Vill du hjälpa?';
                        gestaltrutan.openModal(text,
                            function() {
                                try {
                                    gestalter.gePengabeloning(spelare, { koppar: 5 });
                                    gestalt.levande = false;
                                    if (gestaltrutan.gestalter) {
                                        gestaltrutan.gestalter.senasteMeddelande = 'Du hjälpte ' + (gestalt.namn || '') + ' och fick 5 koppar!';
                                        gestaltrutan.gestalter.senasteMeddelandeTid = 240;
                                    }
                                } catch (e) {}
                            },
                            function() {
                                try {
                                    if (gestalter && typeof gestalter.registreraQuestInteraktion === 'function') {
                                        gestalter.registreraQuestInteraktion(spelare, 'behovAvHjalpForradda');
                                    }
                                    gestalt.levande = false;
                                } catch (e) {}
                                if (gestaltrutan.gestalter) {
                                    gestaltrutan.gestalter.senasteMeddelande = 'Du tackade nej och förrådde den behövande.';
                                    gestaltrutan.gestalter.senasteMeddelandeTid = 180;
                                }
                            }
                        );
                    } },
                { id: 'hjalpare', namn: 'Hjälpare', x: 500, y: 380, radie: 60, sprite: 'assets/Gestalter/Hjalpare.png', spegelvand: true, hostil: false, meddelande: 'Behöver du hjälp? Tryck [E] för att tala.', onInteragera: function(gestalt, spelare, gestalter, gestaltrutan) {
                        const text = gestalt.meddelande || 'Vill du ha hjälp?';
                        gestaltrutan.openModal(text,
                            function() {
                                try {
                                    gestalter.gePengabeloning(spelare, { koppar: 5 });
                                    gestalt.levande = false;
                                    if (gestaltrutan.gestalter) {
                                        gestaltrutan.gestalter.senasteMeddelande = 'Du hjälpte ' + (gestalt.namn || '') + ' och fick 5 koppar!';
                                        gestaltrutan.gestalter.senasteMeddelandeTid = 240;
                                    }
                                } catch (e) {}
                            },
                            function() {
                                if (gestaltrutan.gestalter) {
                                    gestaltrutan.gestalter.senasteMeddelande = 'Du valde att inte hjälpa.';
                                    gestaltrutan.gestalter.senasteMeddelandeTid = 180;
                                }
                            }
                        );
                    } },
                { id: 'lognare', namn: 'Lögnare', x: 400, y: 330, radie: 60, sprite: 'assets/Gestalter/Lögnare.png', spegelvand: false, hostil: false, meddelande: 'Jag har nyheter... Tryck [E] för att lyssna.' }
            ]
        };

        this.spelareSpawn = {
            Gestalt1: { x: 320, y: 550 },
            Gestalt2: { x: 320, y: 550 },
            Gestalt3: { x: 320, y: 550 },
            Gestalt4: { x: 320, y: 550 },
            Gestalt5: { x: 320, y: 550 },
            Gestalt6: { x: 320, y: 550 }
        };

        this.gestalter = [];
        this.narmasteGestalt = null;
        this.senasteMeddelande = '';
        this.senasteMeddelandeTid = 0;
        this._senasteMeddelandeNyckel = '';
        
        // Stridsstatus
        this.stridAktiv = false;
        this.stridfiendeIndex = -1;
        this.stridsmeddelande = '';
        this.stridsmeddelandeTid = 0;
        this.stridsLootVisual = null;
        this._stridsmeddelandeNyckel = '';
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
        this.stridTillaten = true;
        this.gameOver = false;
        // Rum-/visit-tracking för att kunna rensa och återställa gestaltrum efter N andra rum
        this.rumStatus = {}; // { [rumNamn]: { tpl: [...], rensadVid: number|null } }
        this.rumBesokRaknare = 0;
        this.senastRum = null;
        this.aktuelltRum = null;
        // Per-room visited unique-ruta tracking uses arrays of ruta names
        this.globalVisited = [];
    }

    gePengabeloning(spelare, pengarObj) {
        if (!spelare || !pengarObj) return 0;

        if (typeof spelare.laggTillPengar === 'function') {
            return spelare.laggTillPengar(pengarObj, { raknaSomIntakt: true });
        }

        spelare.pengar = spelare.pengar || { koppar: 0, silver: 0, guld: 0 };
        spelare.pengar.koppar = (spelare.pengar.koppar || 0) + (pengarObj.koppar || 0);
        spelare.pengar.silver = (spelare.pengar.silver || 0) + (pengarObj.silver || 0);
        spelare.pengar.guld = (spelare.pengar.guld || 0) + (pengarObj.guld || 0);
        this.normaliseraPengar(spelare);

        if (spelare.prestationer) {
            const totaltKoppar = Math.max(0, (pengarObj.koppar || 0) + ((pengarObj.silver || 0) * 10) + ((pengarObj.guld || 0) * 100));
            spelare.prestationer.totaltGuldSamlat = (spelare.prestationer.totaltGuldSamlat || 0) + totaltKoppar;
            return totaltKoppar;
        }

        return 0;
    }

    normaliseraPengar(spelare) {
        if (!spelare || !spelare.pengar) return;

        const totalKoppar = Math.max(0, (spelare.pengar.koppar || 0)
            + (spelare.pengar.silver || 0) * 10
            + (spelare.pengar.guld || 0) * 100);

        const guld = Math.floor(totalKoppar / 100);
        const kvarEfterGuld = totalKoppar % 100;
        const silver = Math.floor(kvarEfterGuld / 10);
        const koppar = kvarEfterGuld % 10;

        spelare.pengar.guld = guld;
        spelare.pengar.silver = silver;
        spelare.pengar.koppar = koppar;
    }

    // Kontrollera om spelaren har specificerade varor (objekt: { id: count })
    harVaror(spelare, kravObj) {
        if (!spelare || !spelare.utrustning || !kravObj) return false;
        const inv = spelare.utrustning.inventory || [];
        const counts = {};
        for (const it of inv) {
            if (!it || !it.id) continue;
            counts[it.id] = (counts[it.id] || 0) + (it.count || 1);
        }
        for (const [id, cnt] of Object.entries(kravObj)) {
            if ((counts[id] || 0) < cnt) return false;
        }
        return true;
    }

    // Ta bort specificerade varor från spelarens inventory. Returnerar true om lyckades.
    taBortVaror(spelare, kravObj) {
        if (!spelare || !spelare.utrustning || !kravObj) return false;
        const inv = spelare.utrustning.inventory || [];
        // bygg initial counts
        const needed = Object.assign({}, kravObj);
        for (let i = inv.length - 1; i >= 0; i--) {
            const it = inv[i];
            if (!it || !it.id) continue;
            const need = needed[it.id] || 0;
            if (need > 0) {
                const take = Math.min(need, it.count || 1);
                it.count = (it.count || 1) - take;
                needed[it.id] = need - take;
                if (it.count <= 0) {
                    inv[i] = null;
                }
            }
        }
        if (typeof spelare.utrustning.stadaTommaSvansrutor === 'function') {
            spelare.utrustning.stadaTommaSvansrutor();
        }
        // kolla att allt tagits
        for (const v of Object.values(needed)) {
            if (v > 0) return false;
        }
        return true;
    }

    // Kontrollera om spelaren har tillräckligt med pengar (objekt { guld, silver, koppar })
    harPengar(spelare, pengarObj) {
        if (!spelare || !spelare.pengar || !pengarObj) return false;
        const p = spelare.pengar;
        // Konvertera allt till koppar för jämförelse
        const total = (p.guld || 0) * 100 + (p.silver || 0) * 10 + (p.koppar || 0);
        const need = ((pengarObj.guld || 0) * 100) + ((pengarObj.silver || 0) * 10) + (pengarObj.koppar || 0);
        return total >= need;
    }

    // Dra av pengar från spelaren enligt objekt { guld, silver, koppar }
    draAvPengar(spelare, pengarObj) {
        if (!spelare || !spelare.pengar || !pengarObj) return false;
        let total = ((spelare.pengar.guld || 0) * 100) + ((spelare.pengar.silver || 0) * 10) + (spelare.pengar.koppar || 0);
        const need = ((pengarObj.guld || 0) * 100) + ((pengarObj.silver || 0) * 10) + (pengarObj.koppar || 0);
        if (total < need) return false;
        total = Math.max(0, total - need);
        // sätt tillbaka i separata valutor
        const guld = Math.floor(total / 100);
        const after = total % 100;
        const silver = Math.floor(after / 10);
        const koppar = after % 10;
        spelare.pengar.guld = guld; spelare.pengar.silver = silver; spelare.pengar.koppar = koppar;
        return true;
    }

    hamtaSpelareSpawn(gestaltNamn) {
        if (this.spelareSpawn[gestaltNamn]) {
            return this.spelareSpawn[gestaltNamn];
        }
        return { x: 320, y: 550 };
    }

    // Registrera att en viss "ruta" (område) blivit besökt — används för att räkna
    // unika andra rutor som besökts sedan ett rum rensades.
    notaRutaBesokt(rutaNamn) {
        if (!rutaNamn) return;
        try {
            try { console.log('[Gestalt] notaRutaBesokt called on Gestalter with', rutaNamn); } catch (e) {}
            this.globalVisited = this.globalVisited || [];
            this.globalVisited.push(rutaNamn);
            try { console.log('[Gestalt] globalVisited appended', rutaNamn, 'len=', this.globalVisited.length); } catch (e) {}

            for (const [key, status] of Object.entries(this.rumStatus || {})) {
                try {
                    if (!status) continue;
                    if (status.rensadVid === null && !status.visitedSince) continue;
                    if (key === rutaNamn) continue;
                    status.visitedSince = status.visitedSince || [];
                    if (status.visitedSince.indexOf(rutaNamn) === -1) {
                        status.visitedSince.push(rutaNamn);
                    }
                    this.rumStatus[key] = status;
                    try { console.log('[Gestalt] notaRutaBesokt -', rutaNamn, 'updated status for', key, 'visitedSince=', status.visitedSince); } catch (e) {}
                } catch (e) {}
            }
        } catch (e) {}
    }

    laddaGestalter(gestaltNamn) {
        // reset exit lock each time vi laddar gestalter för ett område
        this.lockExit = false;
        this.kraverRumsinteraktion = false;
        this.harRumsinteragerat = false;
        this.aktivStridInfo = null;
        this.aktivStridInfoTid = 0;
        // Besöksräknare: öka när vi går in i ett nytt rum
        try {
            if (gestaltNamn !== this.senastRum) {
                this.rumBesokRaknare += 1;
                this.senastRum = gestaltNamn;
            }
        } catch (e) {}

        // Uppdatera rum-status: om alla gestalter i rummet är döda, markera rensadVid
        try {
            if (this.aktuelltRum) {
                const status = this.rumStatus[this.aktuelltRum] || { tpl: null, rensadVid: null };
                const anyAlive = this.gestalter && this.gestalter.some(g => g.levande);
                if (!anyAlive) {
                    if (status.rensadVid === null) {
                        status.rensadVid = this.rumBesokRaknare;
                        status.visitedSince = [];
                        status.clearedGlobalIndex = (this.globalVisited && this.globalVisited.length) ? this.globalVisited.length : 0;
                        try { console.log('[Gestalt] mark room cleared', this.aktuelltRum, 'rensadVid=', status.rensadVid, 'clearedGlobalIndex=', status.clearedGlobalIndex); } catch (e) {}
                    }
                }
                this.rumStatus[this.aktuelltRum] = status;
            }
        } catch (e) {}
        this.aktuelltRum = gestaltNamn;
        // Välj först kategori slumpmässigt: fiende, hjälpare, behov_av_hjalp eller lognare
        let lista = [];
        try {
            const categories = ['fiende', 'hjalpare', 'behov', 'lognare'];
            const chosenCat = categories[Math.floor(Math.random() * categories.length)];
            if (chosenCat === 'hjalpare' && this.spawnPunkter && this.spawnPunkter.Hjalpare) {
                lista = this.spawnPunkter.Hjalpare.slice();
            } else if (chosenCat === 'behov' && this.spawnPunkter && this.spawnPunkter.BehovAvHjalp) {
                lista = this.spawnPunkter.BehovAvHjalp.slice();
            } else if (chosenCat === 'lognare' && this.spawnPunkter && this.spawnPunkter.Lognare) {
                lista = this.spawnPunkter.Lognare.slice();
            } else {
                // fiende -> välj en av Gestalt1..GestaltN eller standard
                const keys = Object.keys(this.spawnPunkter || {});
                const enemyKeys = keys.filter(k => /^Gestalt/i.test(k));
                if (gestaltNamn && this.spawnPunkter[gestaltNamn]) {
                    lista = (this.spawnPunkter[gestaltNamn] || []).slice();
                } else if (enemyKeys.length > 0) {
                    const pick = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
                    lista = (this.spawnPunkter[pick] || []).slice();
                } else {
                    lista = (this.spawnPunkter[gestaltNamn] || this.spawnPunkter.standard || []).slice();
                }
            }
            // Om vi inte hittade någon lista ovan (t.ex. ny area), fallback till area-specific eller standard
            if (!lista || lista.length === 0) {
                lista = (this.spawnPunkter[gestaltNamn] || this.spawnPunkter.standard || []).slice();
            }
        } catch (e) {
            lista = (this.spawnPunkter[gestaltNamn] || this.spawnPunkter.standard || []).slice();
        }

        // Hantera rum-status: om rummet var rensat tidigare, håll det tomt i N besök,
        // annars återanvänd tidigare mall eller spara mall för framtida återställning.
        try {
            const status = this.rumStatus[gestaltNamn];
            if (status) {
                if (status.rensadVid !== null) {
                    // Preferera att använda globalVisited-slicen för att räkna unika andra rutor
                    let uniqueCount = 0;
                    try {
                        if (status.clearedGlobalIndex != null && Array.isArray(this.globalVisited)) {
                            const slice = this.globalVisited.slice(status.clearedGlobalIndex || 0);
                            const s = new Set();
                            for (const n of slice) {
                                if (!n) continue;
                                if (String(n) === String(gestaltNamn)) continue;
                                s.add(String(n));
                            }
                            uniqueCount = s.size;
                        } else if (status.visitedSince && Array.isArray(status.visitedSince)) {
                            uniqueCount = status.visitedSince.length;
                        } else {
                            uniqueCount = (this.rumBesokRaknare - status.rensadVid);
                        }
                    } catch (e) { uniqueCount = (status.visitedSince && status.visitedSince.length) ? status.visitedSince.length : (this.rumBesokRaknare - status.rensadVid); }
                    // Håll kvar tomt så länge det inte nått 5 olika andra rutor
                    if (uniqueCount < 5) {
                        try { console.log('[Gestalt] keeping room empty', gestaltNamn, 'uniqueDiff=', uniqueCount); } catch (e) {}
                        this.gestalter = [];
                        this.narmasteGestalt = null;
                        return;
                    }
                    // annars återställ rummet: spara ny mall och rensa rensadVid + visitedSince
                    try { console.log('[Gestalt] respawning room', gestaltNamn, 'uniqueDiff=', uniqueCount); } catch (e) {}
                    status.rensadVid = null;
                    status.visitedSince = null;
                    status.tpl = (lista || []).slice();
                    this.rumStatus[gestaltNamn] = status;
                } else {
                    // Om rummet inte varit rensat, använd tidigare mall om den finns
                    if (status.tpl && status.tpl.length > 0) {
                        lista = status.tpl.slice();
                    } else {
                        status.tpl = (lista || []).slice();
                        this.rumStatus[gestaltNamn] = status;
                    }
                }
            } else {
                // Spara mall för detta rum
                this.rumStatus[gestaltNamn] = { tpl: (lista || []).slice(), rensadVid: null };
            }
        } catch (e) {}
        const gestaltSpritePool = [
            'assets/Gestalter/Gestalt1.png',
            'assets/Gestalter/Gestalt2.png',
            'assets/Gestalter/Gestalt3.png',
            'assets/Gestalter/Gestalt4.png'
        ];

        this.gestalter = lista.map((def) => {
            const d = Object.assign({}, def);
            const idLower = (d.id || '').toLowerCase();
            if (idLower === 'behov_av_hjalp' || idLower === 'hjalpare' || idLower === 'lognare' || idLower === 'lögnare') {
                // Välj en slumpmässig 'Gestalt'-sprite från poolen.
                // För `Lögnare`-typen inkludera även den specifika Lognare-ikonen.
                let spritePool = gestaltSpritePool;
                try {
                    if (idLower === 'lognare' || idLower === 'lögnare') {
                        spritePool = gestaltSpritePool.slice();
                        spritePool.push('assets/Gestalter/Lögnare.png');
                    }
                } catch (e) {}
                const idx = Math.floor(Math.random() * spritePool.length);
                d.sprite = spritePool[idx];
                // Dessa typer är inte fientliga
                d.hostil = false;
                // Rita i halva storleken (1:2) för vänliga gestalter
                d.spriteSkal = 0.5;
                // Om detta är en 'Hjälpare' spawn, välj en slumpvis hjälpare-typ och fäst en enkel modal (endast "Okej")
                if (idLower === 'hjalpare') {
                    try {
                        if (this.hjalpareTyper && this.hjalpareTyper.length > 0) {
                            const hi = Math.floor(Math.random() * this.hjalpareTyper.length);
                            d.hjalpare = this.hjalpareTyper[hi];
                        }
                    } catch (e) {}
                    d.onInteragera = function(gestalt, spelare, gestalter, gestaltrutan) {
                        const text = (d.hjalpare && d.hjalpare.text) ? d.hjalpare.text : (gestalt.meddelande || '');
                        if (!gestaltrutan) return;
                        gestaltrutan.openModal(text, function() {
                            try {
                                if (gestalter && typeof gestalter.registreraQuestInteraktion === 'function') {
                                    gestalter.registreraQuestInteraktion(spelare, 'hjalpareMoten');
                                }
                                if (d.hjalpare && typeof d.hjalpare.action === 'function') {
                                    d.hjalpare.action(spelare, gestalt, gestalter, gestaltrutan);
                                }
                            } catch (e) {}
                            gestaltrutan.closeModal();
                        });
                    };
                    // Begränsa sprite-val för vissa hjälpare-texter
                    try {
                        if (d.hjalpare && typeof d.hjalpare.text === 'string') {
                            const txt = d.hjalpare.text;
                            // Völva / Thora / päls -> Gestalt1/2
                            if (/nornorna|völva|nornor|thora|borgarhjort|päls|pälsar/i.test(txt)) {
                                const allowed = [
                                    'assets/Gestalter/Gestalt1.png',
                                    'assets/Gestalter/Gestalt2.png'
                                ];
                                d.sprite = allowed[Math.floor(Math.random() * allowed.length)];
                            }
                            // Första tre hjälpare: stuga/man, Tjodolv, Brage -> Gestalt3/4
                            else if (/stuga|passerar en stuga|man som arbetar|tjodolv|brage|brage boddasson/i.test(txt)) {
                                const allowed2 = [
                                    'assets/Gestalter/Gestalt3.png',
                                    'assets/Gestalter/Gestalt4.png'
                                ];
                                d.sprite = allowed2[Math.floor(Math.random() * allowed2.length)];
                            }
                            // Gånge Rolv / Gånge -> Gestalt3/4 (redundant but kept for name-based matching)
                            else if (/gånge|gange|rolv/i.test(txt)) {
                                const allowed2 = [
                                    'assets/Gestalter/Gestalt3.png',
                                    'assets/Gestalter/Gestalt4.png'
                                ];
                                d.sprite = allowed2[Math.floor(Math.random() * allowed2.length)];
                            }
                        }
                    } catch (e) {}
                }
                // Om detta är en 'Behov av hjälp' spawn, fäst ett slumpmässigt uppdrag och
                // ge en interaktionshandler som visar missions-texten och kör accept-logik
                if (idLower === 'behov_av_hjalp') {
                    if (this.behovUppdrag && this.behovUppdrag.length > 0) {
                        const mi = Math.floor(Math.random() * this.behovUppdrag.length);
                        d.mission = this.behovUppdrag[mi];
                    }
                    d.onInteragera = function(gestalt, spelare, gestalter, gestaltrutan) {
                        const mission = d.mission || { text: d.meddelande || 'Vill du hjälpa?', accept: function(sp) { if (sp && sp.pengar) { sp.pengar.koppar = (sp.pengar.koppar||0) + 5; } } };
                        if (gestaltrutan) {
                            gestaltrutan.openModal(mission.text, function() {
                                try {
                                    // Kolla om uppdraget innehåller en 'dräp/fäll/slå ner'-indikator
                                    let parsed = null;
                                    try {
                                        parsed = (typeof gestalter.parseMissionForCombat === 'function') ? gestalter.parseMissionForCombat(mission.text) : null;
                                    } catch (e) { parsed = null; }

                                    // Respawn spelaren i området
                                    try {
                                        const area = (gestaltrutan && gestaltrutan.aktuellGestaltOmrade) ? gestaltrutan.aktuellGestaltOmrade : null;
                                        const spawn = area ? gestalter.hamtaSpelareSpawn(area) : null;
                                        if (spawn && spelare) { spelare.x = spawn.x; spelare.y = spawn.y; }
                                    } catch (e) {}

                                    if (parsed && parsed.enemyId) {
                                        // If mission text requires specific items (e.g. Titanit), enforce before spawning
                                        try {
                                            if (typeof mission === 'object' && /titanit/i.test(mission.text)) {
                                                const krav = { titanit: 1 };
                                                if (!gestalter.harVaror(spelare, krav)) {
                                                    gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Du måste ha 1 Titanit för att ta detta uppdrag.');
                                                    return;
                                                }
                                                // Ta bort titanit nu så spelaren inte startar uppdraget utan kostnad
                                                const removed = gestalter.taBortVaror(spelare, krav);
                                                if (!removed) {
                                                    gestalter.misslyckatBehovUppdrag(gestalt, gestaltrutan, 'Kunde inte ta titanit från inventory.');
                                                    return;
                                                }
                                            }
                                        } catch (e) { console.error('Pre-spawn item check error', e); }
                                        // Spawna fiender kring spawnpunkter (spawnMissionEnemies använder spawnPunkter för plats)
                                        const cx = (gestaltrutan && gestaltrutan.canvas) ? (gestaltrutan.canvas.width/2) : 320;
                                        const cy = (gestaltrutan && gestaltrutan.canvas) ? (gestaltrutan.canvas.height/2) : 550;
                                        try {
                                            gestalter.spawnMissionEnemies(parsed.enemyId, parsed.count || 1, cx, cy);
                                        } catch (e) { console.error('spawn mission enemies error', e); }

                                        // Registrera pending mission så belöning ges först när fienderna är döda
                                        const originalAccept = mission.accept;
                                        gestalter.pendingMission = {
                                            enemyId: parsed.enemyId,
                                            requiredCount: parsed.count || 1,
                                            acceptFunction: function(spelareArg, gestaltArg, gestalterArg, gestaltrutanArg) {
                                                try {
                                                    if (typeof originalAccept === 'function') {
                                                        originalAccept(spelareArg, gestaltArg, gestalterArg, gestaltrutanArg);
                                                    }
                                                } finally {
                                                    if (gestalterArg && typeof gestalterArg.registreraQuestInteraktion === 'function') {
                                                        gestalterArg.registreraQuestInteraktion(spelareArg, 'behovAvHjalpHjalpta');
                                                    }
                                                }
                                            },
                                            originGestalt: gestalt,
                                            gestaltrutan: gestaltrutan,
                                            rewarded: false
                                        };
                                        if (gestalter) {
                                            gestalter.lockExit = true;
                                            gestalter.senasteMeddelande = 'Uppdrag aktiverat — döda fienderna för att få belöning.';
                                            gestalter.senasteMeddelandeTid = 300;
                                        }
                                    } else {
                                        // Vanligt uppdrag: kör accept direkt
                                        mission.accept(spelare, gestalt, gestalter, gestaltrutan);
                                        if (gestalt && gestalt.levande === false && gestalter && typeof gestalter.registreraQuestInteraktion === 'function') {
                                            gestalter.registreraQuestInteraktion(spelare, 'behovAvHjalpHjalpta');
                                        }
                                    }
                                } catch (e) { console.error(e); }
                                gestaltrutan.closeModal();
                            }, function() {
                                try {
                                    if (gestalter && typeof gestalter.registreraQuestInteraktion === 'function') {
                                        gestalter.registreraQuestInteraktion(spelare, 'behovAvHjalpForradda');
                                    }
                                    if (gestalt) {
                                        gestalt.levande = false;
                                    }
                                    if (gestaltrutan && gestaltrutan.gestalter) {
                                        gestaltrutan.gestalter.senasteMeddelande = 'Du tackade nej och förrådde den behövande.';
                                        gestaltrutan.gestalter.senasteMeddelandeTid = 180;
                                    }
                                } catch (e) {}
                                gestaltrutan.closeModal();
                            });
                        }
                    };
                }
                // markera att en lögnare finns i detta område så spelaren inte kan lämna
                else if (idLower === 'lognare' || idLower === 'lögnare') {
                    this.lockExit = true;
                    if (this.lognareTyper && this.lognareTyper.length > 0) {
                        const li = Math.floor(Math.random() * this.lognareTyper.length);
                        d.lognare = this.lognareTyper[li];
                    }
                    d.onInteragera = function(gestalt, spelare, gestalter, gestaltrutan) {
                        const text = (d.lognare && d.lognare.text) ? d.lognare.text : gestalt.meddelande || 'Jag vet något intressant... Vill du höra?';
                        if (!gestaltrutan) return;
                        gestaltrutan.openModal(text, function() {
                            try {
                                if (gestalter && typeof gestalter.registreraQuestInteraktion === 'function') {
                                    gestalter.registreraQuestInteraktion(spelare, 'lognareMoten');
                                }
                                if (d.lognare && typeof d.lognare.action === 'function') {
                                    d.lognare.action(spelare, gestalt, gestalter, gestaltrutan);
                                }
                                // Om action inte skapade en pendingMission, lås upp utgången direkt
                                try {
                                    if (!gestalter.pendingMission) {
                                        gestalter.lockExit = false;
                                    }
                                } catch (e) {}
                            } catch (e) {}
                            gestaltrutan.closeModal();
                        });
                    };
                }
                
            }
            else if (d.hostil !== false) {
                d.engangsMote = true;
                d.banditStridslogik = true;
            }
            return new Gestalt(d, this.stridSystem);
        });

        this.kraverRumsinteraktion = this.gestalter.some(g => this.arInteraktionskravGestalt(g));
        this.harRumsinteragerat = !this.kraverRumsinteraktion;
        this.narmasteGestalt = null;
    }

    arInteraktionskravGestalt(gestalt) {
        if (!gestalt) return false;
        const id = String(gestalt.id || gestalt.mappedId || gestalt.namn || '').toLowerCase();
        return id === 'behov_av_hjalp'
            || id === 'hjalpare'
            || id === 'lognare'
            || id === 'lögnare';
    }

    registreraRumsinteraktion(gestalt) {
        if (!this.arInteraktionskravGestalt(gestalt)) return false;
        this.harRumsinteragerat = true;
        this.lockExit = false;
        return true;
    }

    misslyckatBehovUppdrag(gestalt, gestaltrutan, meddelande, tid = 240) {
        if (gestalt) {
            gestalt.levande = false;
        }
        if (gestaltrutan && gestaltrutan.gestalter) {
            gestaltrutan.gestalter.senasteMeddelande = meddelande || 'Du kunde inte slutföra uppdraget.';
            gestaltrutan.gestalter.senasteMeddelandeTid = tid;
        }
        try {
            this.rensaDeadGestals();
        } catch (e) {}
    }

    kanLamnaRum() {
        if (this.pendingMission && !this.pendingMission.rewarded) return false;
        if (this.lockExit) return false;
        return !this.kraverRumsinteraktion || this.harRumsinteragerat;
    }

    // Parsar missions-text för stridsuppdrag: leta efter verb (fäll/dräp/slå ner) + antal + måltyp
    parseMissionForCombat(text) {
        if (!text) return null;
        const s = String(text).toLowerCase();
        // verbs that indicate killing
        const killVerbs = ['fäll', 'falla', 'dräp', 'dräpa', 'slå ner', 'slagna', 'drep', 'dräp', 'dräpa', 'dräpt'];
        let verbFound = false;
        for (const v of killVerbs) {
            if (s.indexOf(v) !== -1) { verbFound = true; break; }
        }
        if (!verbFound) return null;

        // extract number (digits or swedish words)
        const numMap = { 'ett':1, 'en':1, 'två':2, 'tva':2, 'tre':3, 'fyra':4, 'fem':5, 'sex':6, 'sju':7, 'åtta':8, 'atta':8, 'nio':9, 'tio':10, 'femton':15 };
        let count = null;
        const digitMatch = s.match(/\b(\d{1,2})\b/);
        if (digitMatch) {
            count = parseInt(digitMatch[1],10);
        }
        // If no digit found, normalize diacritics and search for number words with word boundaries
        if (!count) {
            try {
                const normalized = s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
                // Also replace non-word chars with spaces to help boundary matches
                const cleaned = normalized.replace(/[^a-z0-9\s]/gi, ' ');
                for (const [k,v] of Object.entries(numMap)) {
                    // check both raw key and its normalized (diacritics-removed) form
                    const keyNorm = k.normalize ? k.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : k;
                    const re = new RegExp('\\b' + keyNorm + '\\b', 'i');
                    if (re.test(cleaned)) { count = v; break; }
                }
            } catch (e) {
                // fallback naive search
                for (const [k,v] of Object.entries(numMap)) {
                    if (s.indexOf(k) !== -1) { count = v; break; }
                }
            }
        }
        if (!count) count = 1;

        // map enemy keywords to spawn id
        const enemyCandidates = [
            { keys: ['bandit','banditer','banditen'], id: 'bandit' },
            { keys: ['varg','vargar','blodvarg'], id: 'blodvarg' },
            { keys: ['präst','praster','prast'], id: 'prast' },
            { keys: ['bärsärk','barsark','barsarker'], id: 'barsark' },
            { keys: ['viking','krigare','krigare'], id: 'viking' },
            { keys: ['kustvakt','kustvakter','kustvaktare'], id: 'bandit' },
            { keys: ['hövding','hövdingar','hovding','hovdingar'], id: 'barsark' }
        ];
        let enemyId = null;
        // Also capture which keyword and its index so we can find the number closest to that target
        let foundKey = null;
        let foundIndex = -1;
        for (const ec of enemyCandidates) {
            for (const k of ec.keys) {
                const idx = s.indexOf(k);
                if (idx !== -1) {
                    enemyId = ec.id;
                    foundKey = k;
                    foundIndex = idx;
                    break;
                }
            }
            if (enemyId) break;
        }
        if (!enemyId) {
            // fallback: if text mentions 'dräp' but no known type, default to 'bandit'
            enemyId = 'bandit';
        }
        // If there are multiple numbers in the text (e.g. "Dräp fyra banditer ... bringa två ..."),
        // try to pick the number closest to the enemy keyword (search left of the enemy occurrence).
        try {
            if (foundIndex !== -1) {
                // normalize and take substring up to the enemy
                const prefix = s.slice(0, foundIndex);
                // look for digits last occurrence
                const digitMatches = prefix.match(/\b(\d{1,2})\b/g);
                if (digitMatches && digitMatches.length > 0) {
                    count = parseInt(digitMatches[digitMatches.length - 1], 10);
                } else {
                    // look for number words in prefix
                    const numWords = Object.keys(numMap).map(k => k.replace(/å/g,'a').replace(/ä/g,'a').replace(/ö/g,'o'));
                    const prefixNorm = prefix.normalize ? prefix.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : prefix;
                    // build regex to find all number words
                    const reWords = new RegExp('\\b(' + numWords.join('|') + ')\\b', 'gi');
                    const words = prefixNorm.match(reWords);
                    if (words && words.length > 0) {
                        const last = String(words[words.length - 1]).toLowerCase();
                        // map back from normalized to value
                        for (const [k,v] of Object.entries(numMap)) {
                            const kNorm = k.normalize ? k.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : k;
                            if (kNorm.toLowerCase() === last) { count = v; break; }
                        }
                    }
                }
            }
        } catch (e) {}
        try { console.log('[Gestalt] parseMissionForCombat ->', { text: text, count: count, enemyId: enemyId, foundKey: foundKey, foundIndex: foundIndex }); } catch (e) {}
        return { count: count, enemyId: enemyId };
    }

    // Spawna ett antal fiender (gestalter) kring en given punkt
    spawnMissionEnemies(enemyId, count, centerX, centerY, options = {}) {
        try {
            try { console.log('[Gestalt] spawnMissionEnemies called', { enemyId: enemyId, count: count, centerX: centerX, centerY: centerY }); } catch (e) {}
            // Ensure enemyId and count are valid and coerce count to integer
            count = parseInt(count, 10);
            if (isNaN(count) || count < 1) count = 1;
            if (!enemyId || !count) return;
            const forceEngangsMote = !!(options && options.engangsMote);
            const skogenEngangsMote = (typeof window !== 'undefined'
                && window.aktuellSkarm === 'skogen'
                && (!this.pendingMission || this.pendingMission.rewarded));
            // Samla möjliga spawn-definitioner: föredra BehovAvHjalp, Hjalpare eller fiender
            const preferredKeys = ['behovavhjalp','hjalpare','fiender'];
            let spawnDefs = [];
            try {
                const keys = Object.keys(this.spawnPunkter || {});
                for (const k of keys) {
                    if (preferredKeys.indexOf(k.toLowerCase()) !== -1) {
                        const arr = this.spawnPunkter[k] || [];
                        spawnDefs = spawnDefs.concat(arr.map(d => Object.assign({ __sourceKey: k }, d)));
                    }
                }
            } catch (e) { spawnDefs = []; }
            // fallback till standard om inga prefererade finns
            if ((!spawnDefs || spawnDefs.length === 0) && this.spawnPunkter && this.spawnPunkter.standard) {
                spawnDefs = this.spawnPunkter.standard.slice();
            }
            // Hitta template (metadata) för enemy-typen i standard-listan om möjligt
            const template = (this.spawnPunkter && this.spawnPunkter.standard) ? this.spawnPunkter.standard.find(d => (d.id||'').toLowerCase() === enemyId.toLowerCase()) : null;
            try { console.log('[Gestalt] spawnMissionEnemies will spawn', count, 'instances; spawnDefs.length=', (spawnDefs && spawnDefs.length)); } catch (e) {}
            const beforeLen = this.gestalter.length;
            for (let i = 0; i < count; i++) {
                try { console.log('[Gestalt] spawn loop i=', i); } catch (e) {}
                // välj en spawn-definition att placera denna fiende vid
                const chosen = (spawnDefs && spawnDefs.length > 0) ? spawnDefs[Math.floor(Math.random() * spawnDefs.length)] : null;
                let baseX = (chosen && typeof chosen.x === 'number') ? chosen.x : (centerX || 320);
                const baseY = (chosen && typeof chosen.y === 'number') ? chosen.y : (centerY || 400);
                // If this spawn point comes from 'Hjalpare', offset 20px to the left
                try {
                    if (chosen && chosen.__sourceKey && String(chosen.__sourceKey).toLowerCase() === 'hjalpare') {
                        baseX = baseX - 20;
                    }
                } catch (e) {}
                // Place spawned enemies closer to the chosen/base point so they're reachable.
                const angle = Math.random() * Math.PI * 2;
                const dist = 10 + Math.random() * 40; // smaller spread (10..50)
                const x = Math.round(baseX + Math.cos(angle) * dist);
                const y = Math.round(baseY + Math.sin(angle) * dist);
                const defBase = template ? Object.assign({}, template) : (chosen ? Object.assign({}, chosen) : null);
                const def = defBase ? Object.assign({}, defBase) : { x: x, y: y, radie: 60 };
                // Force spawned gestalt to use the mission enemy type
                def.id = enemyId;
                if (template) {
                    // Use canonical name and sprite from standard template
                    if (template.namn) def.namn = template.namn;
                    if (template.sprite) def.sprite = template.sprite;
                } else {
                    // Fallback: derive a simple display name and sprite path
                    const cap = enemyId.charAt(0).toUpperCase() + enemyId.slice(1);
                    def.namn = cap;
                    def.sprite = `assets/Gestalter/${cap}.png`;
                }
                // Ensure usable interaction radius and set mission enemies to a smaller scale
                def.x = x; def.y = y;
                def.radie = def.radie || 40;
                def.spriteSkal = 0.35;
                // säkerställ att fienden är fientlig
                def.hostil = true;
                def.engangsMote = forceEngangsMote || skogenEngangsMote;
                def.banditStridslogik = forceEngangsMote || skogenEngangsMote;
                // skapa gestalt och lägg till
                const g = new Gestalt(def, this.stridSystem);
                try { console.log('[Gestalt] spawned', { id: def.id, namn: def.namn, x: def.x, y: def.y, sprite: def.sprite, source: chosen && chosen.__sourceKey ? chosen.__sourceKey : 'template' }); } catch (e) {}
                this.gestalter.push(g);
            }
            try { console.log('[Gestalt] spawnMissionEnemies added', this.gestalter.length - beforeLen, 'new gestalters; total now', this.gestalter.length); } catch (e) {}
            // tillåt strid om det tidigare var låst
            this.stridTillaten = true;
        } catch (e) { console.error('spawnMissionEnemies failed', e); }
    }

    uppdatera(spelare) {
        if (this.senasteMeddelande) {
            const senasteNyckel = `${this.senasteMeddelande}`;
            if (senasteNyckel !== this._senasteMeddelandeNyckel) {
                this._senasteMeddelandeNyckel = senasteNyckel;
                this.senasteMeddelandeTid = Math.max(this.senasteMeddelandeTid || 0, 300);
            }
        } else {
            this._senasteMeddelandeNyckel = '';
        }

        if (this.stridsmeddelande) {
            const stridsNyckel = `${this.stridsmeddelande}`;
            if (stridsNyckel !== this._stridsmeddelandeNyckel) {
                this._stridsmeddelandeNyckel = stridsNyckel;
                this.stridsmeddelandeTid = Math.max(this.stridsmeddelandeTid || 0, 300);
            }
        } else {
            this._stridsmeddelandeNyckel = '';
        }

        if (this.senasteMeddelandeTid > 0) {
            this.senasteMeddelandeTid -= 1;
        }
        
        if (this.stridsmeddelandeTid > 0) {
            this.stridsmeddelandeTid -= 1;
        }
        if (this.aktivStridInfoTid > 0) {
            this.aktivStridInfoTid -= 1;
        }
        
        // Starta automatisk strid om spelaren är nära en levande, fientlig gestalt
        if (!this.stridAktiv && this.narmasteGestalt && this.narmasteGestalt.levande && this.narmasteGestalt.hostil && spelare) {
            const gestaltIndex = this.gestalter.indexOf(this.narmasteGestalt);
            this.startsStrid(gestaltIndex, spelare);
        }
        
        // Hantera aktiv strid
        if (this.stridAktiv && this.stridfiendeIndex >= 0) {
            const gestalt = this.gestalter[this.stridfiendeIndex];
            if (gestalt && gestalt.levande && spelare) {
                const gameOver = this.utforStrid(gestalt, spelare);
                if (gameOver) {
                    this.gameOver = true;
                }
            } else {
                this.stridAktiv = false;
                this.stridfiendeIndex = -1;
            }
        }

        // Kontrollera om ett pending mission kräver att fiender dödas för belöning
        try {
            if (this.pendingMission && !this.pendingMission.rewarded) {
                const p = this.pendingMission;
                const normalize = s => (s || '').toLowerCase().replace(/[.,!?\s]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                const target = normalize(p.enemyId);
                const remaining = this.gestalter.filter(g => g.levande && (normalize(g.mappedId || g.id || '') === target || normalize(g.id || g.mappedId || '') === target));
                if (!remaining || remaining.length === 0) {
                    // Ge belöning nu
                    try {
                        if (typeof p.acceptFunction === 'function') {
                            // acceptFunction(spelare, gestalt, gestalter, gestaltrutan)
                            p.acceptFunction(spelare, p.originGestalt, this, p.gestaltrutan);
                        }
                    } catch (e) { console.error('pendingMission accept failed', e); }
                    this.pendingMission.rewarded = true;
                    this.senasteMeddelande = 'Uppdrag slutfört! Belöning erhållen.';
                    this.senasteMeddelandeTid = 240;
                    // lås upp utgången när pending mission är klar
                    try { this.lockExit = false; } catch (e) {}
                    // clear pending after rewarding
                    try { delete this.pendingMission; } catch (e) { this.pendingMission = null; }
                }
            }
        } catch (e) {}
        // Direktmarkera rum som rensade om alla gestalter i aktuell vy är döda.
        try {
            if (this.aktuelltRum) {
                const status = this.rumStatus[this.aktuelltRum] || { tpl: null, rensadVid: null };
                const anyAlive = this.gestalter && this.gestalter.some(g => g.levande);
                if (!anyAlive && status.rensadVid === null) {
                    status.rensadVid = this.rumBesokRaknare;
                    status.visitedSince = [];
                    status.clearedGlobalIndex = (this.globalVisited && this.globalVisited.length) ? this.globalVisited.length : 0;
                    this.rumStatus[this.aktuelltRum] = status;
                    try { console.log('[Gestalt] immediate room cleared', this.aktuelltRum, 'rensadVid=', status.rensadVid, 'clearedGlobalIndex=', status.clearedGlobalIndex); } catch (e) {}
                }
            }
        } catch (e) {}
    }

    rensaMeddelanden() {
        this.senasteMeddelande = '';
        this.senasteMeddelandeTid = 0;
        this.stridsmeddelande = '';
        this.stridsmeddelandeTid = 0;
        this.stridsLootVisual = null;
        this._senasteMeddelandeNyckel = '';
        this._stridsmeddelandeNyckel = '';
    }
    
    hamtaSpelareStrid(spelare) {
        if (!spelare) return { fysisk: 0, eld: 0, magi: 0 };

        const basStrid = spelare.strid && typeof spelare.strid === 'object'
            ? spelare.strid
            : null;
        const vapenStrid = spelare.utrustning && spelare.utrustning.vapen && typeof spelare.utrustning.vapen.strid === 'object'
            ? spelare.utrustning.vapen.strid
            : null;
        const strid = basStrid || vapenStrid || {};

        return {
            fysisk: typeof strid.fysisk === 'number' ? strid.fysisk : 0,
            eld: typeof strid.eld === 'number' ? strid.eld : 0,
            magi: typeof strid.magi === 'number' ? strid.magi : 0
        };
    }

    beraknaSpelarSkadaMedPassiv(spelare, grundSkada, element = 'fysisk') {
        const numeriskGrundSkada = typeof grundSkada === 'number' ? grundSkada : 0;
        if (!spelare || !spelare.utrustning || typeof spelare.utrustning.rullaVapenPassivSkada !== 'function') {
            return { skada: numeriskGrundSkada, passivUtlost: false, passiv: null };
        }
        const effekt = spelare.utrustning.rullaVapenPassivSkada(element);
        return {
            skada: numeriskGrundSkada * (effekt.multiplikator || 1),
            passivUtlost: !!effekt.utlöst,
            passiv: effekt.passiv || null
        };
    }

    beraknaSpelarAttackData(spelare, mal, stridStats = null) {
        const stats = stridStats || this.hamtaSpelareStrid(spelare);
        const elementOrdning = ['fysisk', 'eld', 'magi'];
        const motstand = mal && mal.motstånd && typeof mal.motstånd === 'object'
            ? mal.motstånd
            : {};

        let totalSkada = 0;
        let dominerandeElement = spelare && spelare.skadaElement ? spelare.skadaElement : 'fysisk';
        let dominerandeBidrag = -1;
        let passiv = null;
        let passivUtlost = false;

        for (const element of elementOrdning) {
            const grundSkada = typeof stats[element] === 'number' ? stats[element] : 0;
            if (grundSkada <= 0) continue;

            const attackData = this.beraknaSpelarSkadaMedPassiv(spelare, grundSkada, element);
            const elementMotstand = typeof motstand[element] === 'number' ? motstand[element] : 0;
            const bidrag = Math.max(0, attackData.skada - elementMotstand);
            totalSkada += bidrag;

            if (bidrag > dominerandeBidrag) {
                dominerandeBidrag = bidrag;
                dominerandeElement = element;
            }

            if (attackData.passivUtlost && attackData.passiv && !passivUtlost) {
                passivUtlost = true;
                passiv = attackData.passiv;
            }
        }

        return {
            skada: Math.max(0, Math.min(100, totalSkada)),
            element: dominerandeElement,
            passivUtlost,
            passiv
        };
    }

    valjSpelarElement(spelare, stridStats) {
        const foredraget = spelare && spelare.skadaElement ? spelare.skadaElement : null;
        if (foredraget && typeof stridStats[foredraget] === 'number' && stridStats[foredraget] > 0) {
            return foredraget;
        }

        let valt = 'fysisk';
        let maxVarde = typeof stridStats.fysisk === 'number' ? stridStats.fysisk : 0;
        if (typeof stridStats.eld === 'number' && stridStats.eld > maxVarde) {
            valt = 'eld';
            maxVarde = stridStats.eld;
        }
        if (typeof stridStats.magi === 'number' && stridStats.magi > maxVarde) {
            valt = 'magi';
        }
        return valt;
    }

    avslutaAktivStrid(meddelande, tid = 180) {
        if (typeof meddelande === 'string' && meddelande.length > 0) {
            this.stridsmeddelande = meddelande;
        }
        this.stridsmeddelandeTid = tid;
        this.stridAktiv = false;
        this.stridfiendeIndex = -1;
        this.stridTillaten = true;
    }

    avslutaEngangsMote(gestalt, meddelande, tid = 180) {
        if (gestalt) {
            gestalt.levande = false;
        }
        this.avslutaAktivStrid(meddelande, tid);
    }

    skadaSpelare(spelare, skada = 1) {
        if (!spelare) return null;
        if (typeof spelare.taSkada === 'function') {
            return spelare.taSkada(skada);
        }
        if (typeof spelare.forloraLiv === 'function') {
            spelare.forloraLiv(skada);
            return { togSkada: true, undvekSkada: false, skada, passiv: null, dog: !!(spelare && spelare.liv <= 0) };
        }
        spelare.liv = Math.max(0, (spelare.liv || 0) - skada);
        return { togSkada: true, undvekSkada: false, skada, passiv: null, dog: !!(spelare && spelare.liv <= 0) };
    }

    hamtaQuestInteraktioner(spelare) {
        if (!spelare) return {};
        if (typeof spelare.sakerstallPrestationsfalt === 'function') {
            spelare.sakerstallPrestationsfalt();
        } else {
            spelare.prestationer = spelare.prestationer || {};
            spelare.prestationer.interaktioner = spelare.prestationer.interaktioner || {};
        }

        const interaktioner = spelare.prestationer.interaktioner;
        const standardInteraktioner = {
            hjalpareMoten: 0,
            lognareMoten: 0,
            behovAvHjalpHjalpta: 0,
            behovAvHjalpForradda: 0
        };

        for (const [nyckel, standardVarde] of Object.entries(standardInteraktioner)) {
            if (typeof interaktioner[nyckel] !== 'number') {
                interaktioner[nyckel] = standardVarde;
            }
        }

        return interaktioner;
    }

    registreraQuestInteraktion(spelare, typ, antal = 1) {
        if (!spelare || !typ) return 0;
        const interaktioner = this.hamtaQuestInteraktioner(spelare);
        const okning = Math.max(0, Number.isFinite(antal) ? antal : 0);
        interaktioner[typ] = (interaktioner[typ] || 0) + okning;
        if (typeof window !== 'undefined' && window.UPPDRAG_DEBUG) {
            console.log('[Uppdrag DEBUG] interaktion registrerad:', typ, 'nyttVarde=', interaktioner[typ]);
        }
        return interaktioner[typ];
    }

    registreraSpelarKill(gestalt, spelare, badaTraffar = false) {
        if (!spelare || !spelare.prestationer) return;
        if (typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
            window.spelaStandardLjud('fiendeDor');
        }
        spelare.prestationer.fiendesBesegrade += 1;
        spelare.prestationer.striderVunna += 1;
        if (badaTraffar) {
            spelare.prestationer.striderForlorade += 1;
        }
        try {
            const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
            const keyRaw = (gestalt.mappedId || gestalt.namn || '');
            const key = normalize(keyRaw);
            spelare.prestationer.killsByType = spelare.prestationer.killsByType || {};
            spelare.prestationer.killsByType[key] = (spelare.prestationer.killsByType[key] || 0) + 1;
            if (typeof window !== 'undefined' && window.UPPDRAG_DEBUG) console.log(`[Uppdrag DEBUG] fiende besegrad:`, key, 'totalKills=', spelare.prestationer.fiendesBesegrade, 'killsByType=', spelare.prestationer.killsByType[key]);
        } catch (e) {}
    }

    geGestaltLootMeddelande(gestalt, spelare) {
        if (!this.stridSystem || !spelare) return '';
        this.stridsLootVisual = null;
        try {
            const lootString = this.stridSystem.hamtaSlumpmassigLoot(gestalt.mappedId);
            const lootData = this.stridSystem.parsaLoot ? this.stridSystem.parsaLoot(lootString) : null;
            if (!lootData) return '';

            if (lootData.typ === 'pengar') {
                this.stridsLootVisual = this.hamtaPengarVisual(lootData);
                if (spelare) {
                    this.gePengabeloning(spelare, lootData);
                    if (((lootData.koppar || 0) + (lootData.silver || 0) + (lootData.guld || 0)) > 0 && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('pengar');
                    }
                }
                const delar = [];
                if (lootData.guld > 0) delar.push(`${lootData.guld} guld`);
                if (lootData.silver > 0) delar.push(`${lootData.silver} silver`);
                if (lootData.koppar > 0) delar.push(`${lootData.koppar} koppar`);
                return delar.join(' och ');
            }

            if (lootData.typ === 'item' && spelare.utrustning && spelare.utrustning.laggTillForemal) {
                for (let i = 0; i < (lootData.antal || 1); i++) {
                    try { spelare.utrustning.laggTillForemal(lootData.itemId); } catch (e) {}
                }
                const foremaletData = spelare.utrustning.tillgangligaForemal && spelare.utrustning.tillgangligaForemal[lootData.itemId];
                const itemNamn = foremaletData ? foremaletData.namn : lootData.itemId;
                this.stridsLootVisual = this.hamtaLootVisual(spelare, lootData.itemId, lootData.antal);
                if (spelare.prestationer) {
                    spelare.prestationer.foremalPlockade += (lootData.antal || 1);
                }
                return (lootData.antal || 1) > 1 ? `${lootData.antal} ${itemNamn}` : itemNamn;
            }
        } catch (e) {
            try { console.error('Error awarding Gestalt loot', e); } catch (ee) {}
        }
        return '';
    }

    utforStrid(gestalt, spelare) {
        if (!gestalt.levande || !spelare) return false;
        this.stridsLootVisual = null;

        if (gestalt.banditStridslogik) {
            const stridStats = this.hamtaSpelareStrid(spelare);
            const spelarAttack = this.beraknaSpelarAttackData(spelare, gestalt, stridStats);
            const spelarElement = spelarAttack.element;
            const spelarDodsChans = spelarAttack.skada;
            const spelarenTraffar = Math.random() * 100 < spelarDodsChans;

            const fiendeSkada = typeof gestalt.skada === 'number'
                ? gestalt.skada
                : ((gestalt.skada && gestalt.skada.fysisk) || 0);
            const fiendeElement = gestalt.skadaElement || 'fysisk';
            const fiendeDodsChans = this.stridSystem && typeof this.stridSystem.beraknaFiendeTraffChans === 'function'
                ? this.stridSystem.beraknaFiendeTraffChans(fiendeSkada, fiendeElement, spelare)
                : Math.max(0, Math.min(100, fiendeSkada - ((spelare.motstånd && spelare.motstånd[fiendeElement]) || 0)));
            const fiendenTraffar = Math.random() * 100 < fiendeDodsChans;

            if (spelarenTraffar && fiendenTraffar) {
                gestalt.liv = 0;
                const skadeResultat = (typeof spelare.taSkada === 'function')
                    ? spelare.taSkada(1, { tystLjud: true })
                    : this.skadaSpelare(spelare, 1);
                if ((!skadeResultat || !skadeResultat.undvekSkada) && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                    window.spelaStandardLjud('badaSkadas');
                }
                const efterTraffResultat = spelare && spelare.liv > 0 && spelare.utrustning && typeof spelare.utrustning.tillampaVapenPassiverEfterTraff === 'function'
                    ? spelare.utrustning.tillampaVapenPassiverEfterTraff(spelarElement)
                    : null;
                this.registreraSpelarKill(gestalt, spelare, true);
                const lootMeddelande = this.geGestaltLootMeddelande(gestalt, spelare);
                const passivText = spelarAttack.passivUtlost && spelarAttack.passiv
                    ? `${spelarAttack.passiv.namn}! Dubbel skada!\n`
                    : '';
                const efterTraffText = efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0
                    ? `${efterTraffResultat.meddelanden.join('\n')}\n`
                    : '';
                const forsvarsText = skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande
                    ? `${skadeResultat.meddelande}\n`
                    : '';
                const resultatRubrik = `${passivText}${efterTraffText}${forsvarsText}Båda träffar! ${gestalt.namn} besegrad${forsvarsText ? '' : '\nDu förlorade 1 liv!'}`;
                const resultat = this.byggStridsLootMeddelande(resultatRubrik, lootMeddelande, resultatRubrik);
                this.avslutaEngangsMote(gestalt, resultat, 180);
                return spelare.liv <= 0;
            }

            if (spelarenTraffar) {
                gestalt.liv = 0;
                const efterTraffResultat = spelare && spelare.utrustning && typeof spelare.utrustning.tillampaVapenPassiverEfterTraff === 'function'
                    ? spelare.utrustning.tillampaVapenPassiverEfterTraff(spelarElement)
                    : null;
                this.registreraSpelarKill(gestalt, spelare, false);
                const lootMeddelande = this.geGestaltLootMeddelande(gestalt, spelare);
                const passivText = spelarAttack.passivUtlost && spelarAttack.passiv
                    ? `${spelarAttack.passiv.namn}! Dubbel skada!\n`
                    : '';
                const efterTraffText = efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0
                    ? `${efterTraffResultat.meddelanden.join('\n')}\n`
                    : '';
                const resultatRubrik = `${passivText}${efterTraffText}${gestalt.namn} besegrad!`;
                const resultat = this.byggStridsLootMeddelande(resultatRubrik, lootMeddelande, resultatRubrik);
                this.avslutaEngangsMote(gestalt, resultat, 180);
                return false;
            }

            if (fiendenTraffar) {
                const skadeResultat = this.skadaSpelare(spelare, 1);
                if (spelare.prestationer && !(skadeResultat && skadeResultat.undvekSkada)) {
                    spelare.prestationer.striderForlorade += 1;
                }
                const meddelande = (skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande)
                    ? `${skadeResultat.meddelande}\n${gestalt.namn} träffade dig inte.`
                    : `Du förlorade striden mot ${gestalt.namn}!\nDu förlorade 1 liv!`;
                this.avslutaEngangsMote(gestalt, meddelande, 180);
                return spelare.liv <= 0;
            }

            if (typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                window.spelaStandardLjud('fiendeFlyr');
            }
            this.avslutaEngangsMote(gestalt, `Båda missade! ${gestalt.namn} flydde.`, 180);
            return false;
        }
        
        // Gestalt och spelare attackerar oberoende av varandra
        const fiendeElement = gestalt.skadaElement || 'fysisk';
        const fiendeSkada = typeof gestalt.skada === 'number'
            ? gestalt.skada
            : ((gestalt.skada && typeof gestalt.skada[fiendeElement] === 'number') ? gestalt.skada[fiendeElement] : 0);
        const fiendeChans = this.stridSystem && typeof this.stridSystem.beraknaFiendeTraffChans === 'function'
            ? this.stridSystem.beraknaFiendeTraffChans(fiendeSkada, fiendeElement, spelare)
            : Math.max(0, Math.min(100, fiendeSkada - ((spelare.motstånd && spelare.motstånd[fiendeElement]) || 0)));

        const stridStats = this.hamtaSpelareStrid(spelare);
        const spelarAttack = this.beraknaSpelarAttackData(spelare, gestalt, stridStats);
        const spelarElement = spelarAttack.element;
        const spelarChans = spelarAttack.skada;

        // Use Strid system for enemy attack behavior (range, timer, chance)
        let fiendeTraffar = false;
        try {
            if (this.stridSystem && typeof this.stridSystem.utforAttack === 'function') {
                fiendeTraffar = !!this.stridSystem.utforAttack(gestalt, spelare, false);
            } else {
                fiendeTraffar = Math.random() * 100 < fiendeChans;
            }
        } catch (e) {
            fiendeTraffar = Math.random() * 100 < fiendeChans;
        }
        const spelareTraffar = Math.random() * 100 < spelarChans;

        if (fiendeTraffar && spelareTraffar) {
            const skadeResultat = (typeof spelare.taSkada === 'function')
                ? spelare.taSkada(1, { element: fiendeElement })
                : (spelare.liv -= 1, { togSkada: true, undvekSkada: false, skada: 1, passiv: null, dog: spelare.liv <= 0 });
            const efterTraffResultat = spelare && spelare.liv > 0 && spelare.utrustning && typeof spelare.utrustning.tillampaVapenPassiverEfterTraff === 'function'
                ? spelare.utrustning.tillampaVapenPassiverEfterTraff(spelarElement)
                : null;
            gestalt.liv = 0;
            gestalt.levande = false;
            
            // Uppdatera prestationer - båda dor
            if (spelare.prestationer) {
                spelare.prestationer.fiendesBesegrade += 1;
                spelare.prestationer.striderVunna += 1;  // Räknas som vinst eftersom fienden dog
                spelare.prestationer.striderForlorade += 1; // Men också som förlust
                // Uppdatera per-typ räknare
                try {
                    const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                    const keyRaw = (gestalt.mappedId || gestalt.namn || '');
                    const key = normalize(keyRaw);
                    spelare.prestationer.killsByType = spelare.prestationer.killsByType || {};
                    spelare.prestationer.killsByType[key] = (spelare.prestationer.killsByType[key] || 0) + 1;
                    if (typeof window !== 'undefined' && window.UPPDRAG_DEBUG) console.log(`[Uppdrag DEBUG] fiende besegrad (båda dog):`, key, 'totalKills=', spelare.prestationer.fiendesBesegrade, 'killsByType=', spelare.prestationer.killsByType[key]);
                } catch (e) {}
            }
            
            // Ge loot även när båda dör
            try {
                const lootString = this.stridSystem.hamtaSlumpmassigLoot(gestalt.mappedId);
                const lootData = this.stridSystem.parsaLoot ? this.stridSystem.parsaLoot(lootString) : null;
                let lootMeddelande = '';
                // If we're currently in Skogen, spawn a chest containing the loot instead of directly awarding it
                const skogenActive = (typeof window !== 'undefined' && window.aktuellSkarm === 'skogen' && window.skogen && typeof window.skogen.spawnObject === 'function');
                if (skogenActive && lootData) {
                    try {
                        const s = window.skogen;
                        const given = {};
                        if (lootData.typ === 'pengar') {
                            // For money, store as message and still award directly (money isn't represented as varor)
                            this.stridsLootVisual = null;
                            this.gePengabeloning(spelare, lootData);
                            // Put a readable message in chest loot metadata so opening chest shows same text
                            given.varor = [];
                            lootMeddelande = (lootData.guld ? lootData.guld + ' guld ' : '') + (lootData.silver ? lootData.silver + ' silver ' : '') + (lootData.koppar ? lootData.koppar + ' koppar' : '');
                        } else if (lootData.typ === 'item') {
                            this.stridsLootVisual = null;
                            // Represent items as varor array of item ids (repeat for antal)
                            const arr = [];
                            for (let i = 0; i < (lootData.antal || 1); i++) arr.push(lootData.itemId);
                            given.varor = arr;
                            lootMeddelande = arr.length > 0 ? (arr.length > 1 ? `${arr.length}× ${arr[0]}` : arr[0]) : '';
                        }
                        const idx = s.spawnObject('kista', Math.round(gestalt.x || 0), Math.round(gestalt.y || 0), { special: false });
                        // Preserve the defeated enemy's actual loot so opening the chest cannot reroll into unrelated rewards.
                        try { s.updateSpawnedObject(idx, { loot: { fromEnemy: true, given: given, enemyLoot: lootData, alreadyAwarded: lootData.typ === 'pengar' } }); } catch (e) {}
                        this.stridsmeddelande = `Ni slog ihjäl varandra!\nEn kista blev kvar.`; 
                    } catch (e) {
                        // fallback to direct award
                        if (lootData && lootData.typ === 'pengar') {
                            this.stridsLootVisual = null;
                            this.gePengabeloning(spelare, lootData);
                        } else if (lootData && lootData.typ === 'item') {
                            if (spelare && spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') {
                                for (let i = 0; i < (lootData.antal || 1); i++) try { spelare.utrustning.laggTillForemal(lootData.itemId); } catch (e) {}
                            }
                            this.stridsLootVisual = this.hamtaLootVisual(spelare, lootData.itemId, lootData.antal);
                        }
                        this.stridsmeddelande = `Ni slog ihjäl varandra i striden!`;
                    }
                } else {
                    // Not in Skogen: award directly to player as before
                    if (lootData) {
                        if (lootData.typ === 'pengar') {
                            this.stridsLootVisual = this.hamtaPengarVisual(lootData);
                            this.gePengabeloning(spelare, lootData);
                            const delar = [];
                            if (lootData.guld > 0) delar.push(`${lootData.guld} guld`);
                            if (lootData.silver > 0) delar.push(`${lootData.silver} silver`);
                            if (lootData.koppar > 0) delar.push(`${lootData.koppar} koppar`);
                            lootMeddelande = delar.join(' och ');
                        } else if (lootData.typ === 'item') {
                            if (spelare.utrustning && spelare.utrustning.laggTillForemal) {
                                for (let i = 0; i < (lootData.antal || 1); i++) {
                                    try { spelare.utrustning.laggTillForemal(lootData.itemId); } catch (e) {}
                                }
                                const foremaletData = spelare.utrustning.tillgangligaForemal && spelare.utrustning.tillgangligaForemal[lootData.itemId];
                                const itemNamn = foremaletData ? foremaletData.namn : lootData.itemId;
                                this.stridsLootVisual = this.hamtaLootVisual(spelare, lootData.itemId, lootData.antal);
                                lootMeddelande = (lootData.antal || 1) > 1 ? `${lootData.antal} ${itemNamn}` : itemNamn;
                                if (spelare.prestationer) {
                                    spelare.prestationer.foremalPlockade += (lootData.antal || 1);
                                }
                            }
                        }
                        this.stridsmeddelande = this.byggStridsLootMeddelande('Ni slog ihjäl varandra!', lootMeddelande, 'Ni slog ihjäl varandra i striden!');
                    } else {
                        this.stridsmeddelande = `Ni slog ihjäl varandra i striden!`;
                    }
                }
            } catch (e) {
                try { console.error('Error handling mutual kill loot', e); } catch (ee) {}
                this.stridsmeddelande = `Ni slog ihjäl varandra i striden!`;
            }
            if (skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande) {
                this.stridsLootVisual = null;
                this.stridsmeddelande = `${skadeResultat.meddelande}\nDu besegrade ${gestalt.namn}!`;
            } else if (efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0) {
                this.stridsLootVisual = null;
                this.stridsmeddelande = `${efterTraffResultat.meddelanden.join('\n')}\nDu besegrade ${gestalt.namn}!`;
            }
            this.avslutaAktivStrid(this.stridsmeddelande, 180);
            return spelare.liv <= 0;
        }

        if (fiendeTraffar) {
            const skadeResultat = (typeof spelare.taSkada === 'function')
                ? spelare.taSkada(1, { element: gestalt.skadaElement || 'fysisk' })
                : (spelare.liv -= 1, { togSkada: true, undvekSkada: false, skada: 1, passiv: null, dog: spelare.liv <= 0 });
            
            // Uppdatera prestationer - förlust
            if (spelare.prestationer && !(skadeResultat && skadeResultat.undvekSkada)) {
                spelare.prestationer.striderForlorade += 1;
            }

            if (gestalt.engangsMote) {
                const meddelande = (skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande)
                    ? `${skadeResultat.meddelande}\n${gestalt.namn} missade dig.`
                    : `${gestalt.namn} vann striden och försvann efter slaget! Du har ${spelare.liv} liv kvar.`;
                this.avslutaEngangsMote(gestalt, meddelande, 180);
            } else {
                const meddelande = (skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande)
                    ? `${skadeResultat.meddelande}\n${gestalt.namn} missade dig.`
                    : `${gestalt.namn} vann striden! Du har ${spelare.liv} liv kvar.`;
                this.avslutaAktivStrid(meddelande, 180);
            }
            console.log(`${gestalt.namn} segrade i striden! Spelarens liv: ${spelare.liv}`);
            return spelare.liv <= 0;
        }

        if (spelareTraffar) {
            gestalt.liv = 0;
            gestalt.levande = false;
            const efterTraffResultat = spelare && spelare.utrustning && typeof spelare.utrustning.tillampaVapenPassiverEfterTraff === 'function'
                ? spelare.utrustning.tillampaVapenPassiverEfterTraff(spelarElement)
                : null;
            
            // Uppdatera prestationer - vinst
            if (spelare.prestationer) {
                spelare.prestationer.fiendesBesegrade += 1;
                spelare.prestationer.striderVunna += 1;
                try {
                    const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                    const keyRaw = (gestalt.mappedId || gestalt.namn || '');
                    const key = normalize(keyRaw);
                    spelare.prestationer.killsByType = spelare.prestationer.killsByType || {};
                    spelare.prestationer.killsByType[key] = (spelare.prestationer.killsByType[key] || 0) + 1;
                    if (typeof window !== 'undefined' && window.UPPDRAG_DEBUG) console.log(`[Uppdrag DEBUG] fiende besegrad (spelaren vann):`, key, 'totalKills=', spelare.prestationer.fiendesBesegrade, 'killsByType=', spelare.prestationer.killsByType[key]);
                } catch (e) {}
            }
            
            // Hämta slumpmässig loot från fienden
            const lootString = this.stridSystem.hamtaSlumpmassigLoot(gestalt.mappedId);
            console.log(`Loot string från ${gestalt.mappedId}: "${lootString}"`);
            const lootData = this.stridSystem.parsaLoot(lootString);
            console.log('Parsed loot data:', lootData);
            
            let lootMeddelande = '';
            
            try {
                const skogenActive = (typeof window !== 'undefined' && window.aktuellSkarm === 'skogen' && window.skogen && typeof window.skogen.spawnObject === 'function');
                if (skogenActive && lootData) {
                    try {
                        const s = window.skogen;
                        const given = {};
                        if (lootData.typ === 'pengar') {
                            // Award money immediately (money not modeled as 'varor'), but still spawn a chest for message/visual
                            this.stridsLootVisual = null;
                            this.gePengabeloning(spelare, lootData);
                            given.varor = [];
                            lootMeddelande = (lootData.guld ? lootData.guld + ' guld ' : '') + (lootData.silver ? lootData.silver + ' silver ' : '') + (lootData.koppar ? lootData.koppar + ' koppar' : '');
                        } else if (lootData.typ === 'item') {
                            this.stridsLootVisual = null;
                            const arr = [];
                            for (let i = 0; i < (lootData.antal || 1); i++) arr.push(lootData.itemId);
                            given.varor = arr;
                            lootMeddelande = arr.length > 0 ? (arr.length > 1 ? `${arr.length}× ${arr[0]}` : arr[0]) : '';
                        }
                        const idx = s.spawnObject('kista', Math.round(gestalt.x || 0), Math.round(gestalt.y || 0), { special: false });
                        try { s.updateSpawnedObject(idx, { loot: { fromEnemy: true, given: given, enemyLoot: lootData, alreadyAwarded: lootData.typ === 'pengar' } }); } catch (e) {}
                        this.stridsmeddelande = `Du slog ihjal ${gestalt.namn}!\nEn kista blev kvar.`;
                    } catch (e) {
                        // fallback to direct awarding
                        if (lootData.typ === 'pengar') {
                            this.stridsLootVisual = null;
                            this.gePengabeloning(spelare, lootData);
                        } else if (lootData.typ === 'item') {
                            if (spelare && spelare.utrustning && typeof spelare.utrustning.laggTillForemal === 'function') {
                                for (let i = 0; i < (lootData.antal || 1); i++) try { spelare.utrustning.laggTillForemal(lootData.itemId); } catch (e) {}
                            }
                            this.stridsLootVisual = this.hamtaLootVisual(spelare, lootData.itemId, lootData.antal);
                        }
                        this.stridsmeddelande = this.byggStridsLootMeddelande(`Du slog ihjal ${gestalt.namn}!`, lootMeddelande, `Du slog ihjal ${gestalt.namn}! Strid vunnen!`);
                    }
                } else {
                    if (lootData.typ === 'pengar') {
                        // Ge pengar till spelaren
                        this.stridsLootVisual = null;
                        this.gePengabeloning(spelare, lootData);
                        
                        // Skapa meddelande
                        const delar = [];
                        if (lootData.guld > 0) delar.push(`${lootData.guld} guld`);
                        if (lootData.silver > 0) delar.push(`${lootData.silver} silver`);
                        if (lootData.koppar > 0) delar.push(`${lootData.koppar} koppar`);
                        lootMeddelande = delar.join(' och ');
                    } else if (lootData.typ === 'item') {
                        // Lägg till föremål i inventory
                        if (spelare.utrustning && spelare.utrustning.laggTillForemal) {
                            for (let i = 0; i < lootData.antal; i++) {
                                const success = spelare.utrustning.laggTillForemal(lootData.itemId);
                            }
                            const foremaletData = spelare.utrustning.tillgangligaForemal && spelare.utrustning.tillgangligaForemal[lootData.itemId];
                            const itemNamn = foremaletData ? foremaletData.namn : lootData.itemId;
                            this.stridsLootVisual = this.hamtaLootVisual(spelare, lootData.itemId, lootData.antal);
                            lootMeddelande = lootData.antal > 1 ? `${lootData.antal} ${itemNamn}` : itemNamn;
                            
                            // Uppdatera föremål plockade
                            if (spelare.prestationer) {
                                spelare.prestationer.foremalPlockade += lootData.antal;
                            }
                        }
                    }
                    
                    const efterTraffText = efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0
                        ? `${efterTraffResultat.meddelanden.join('\n')}\n`
                        : '';
                    this.stridsmeddelande = this.byggStridsLootMeddelande(
                        `${efterTraffText}Du slog ihjal ${gestalt.namn}!`,
                        lootMeddelande,
                        `${efterTraffText}Du slog ihjal ${gestalt.namn}! Strid vunnen!`
                    );
                }
            } catch (e) {
                try { console.error('Error awarding loot on victory', e); } catch (ee) {}
                const efterTraffText = efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0
                    ? `${efterTraffResultat.meddelanden.join('\n')}\n`
                    : '';
                this.stridsmeddelande = this.byggStridsLootMeddelande(
                    `${efterTraffText}Du slog ihjal ${gestalt.namn}!`,
                    lootMeddelande,
                    `${efterTraffText}Du slog ihjal ${gestalt.namn}! Strid vunnen!`
                );
            }

            this.avslutaAktivStrid(this.stridsmeddelande, 180);
            console.log(`${gestalt.namn} besegrades! Fick loot: ${lootString}`);
        }

        if (gestalt.engangsMote && gestalt.levande) {
            this.avslutaEngangsMote(gestalt, `${gestalt.namn} försvann efter striden.`, 180);
        }
        
        return false;
    }
    
    startsStrid(gestaltIndex, spelare) {
        if (gestaltIndex < 0 || gestaltIndex >= this.gestalter.length) return;
        if (!this.stridTillaten) return;
        const gestalt = this.gestalter[gestaltIndex];
        if (!gestalt) return;
        // Om gestalten inte är fientlig ska ingen strid starta
        if (gestalt.hostil === false) return;
        if (!gestalt.levande) return;
        
        this.stridAktiv = true;
        this.stridfiendeIndex = gestaltIndex;
        this.stridTillaten = false;
        this.uppdateraAktivStridInfo(gestalt);
        this.stridsmeddelande = `Du angripas av ${gestalt.namn}!`;
        this.stridsmeddelandeTid = 120;
        console.log(`Strid startar med ${gestalt.namn}!`);
    }

    kontrolleraNarhet(spelareX, spelareY) {
        this.narmasteGestalt = null;
        let minstaAvstand = Infinity;

        for (let i = 0; i < this.gestalter.length; i++) {
            const gestalt = this.gestalter[i];
            if (!gestalt.levande) continue;
            if (!gestalt.arNara(spelareX, spelareY)) continue;

            const dx = spelareX - gestalt.x;
            const dy = spelareY - gestalt.y;
            const avstand = Math.sqrt(dx * dx + dy * dy);
            if (avstand < minstaAvstand) {
                minstaAvstand = avstand;
                this.narmasteGestalt = gestalt;
            }
        }
    }



    rita(ctx, canvas, minSkala, maxSkala) {
        this.elementHoverBounds = [];
        // Rita gestalterna i ordning efter Y så de som är "lägre" (större Y)
        // hamnar överst — sortera en kopia för att inte mutera originalordningen.
        try {
            // Try to find current player position from common globals (Skogen or window.spelare)
            let _playerForFacing = null;
            try {
                if (typeof window !== 'undefined') {
                    if (window.skogen && typeof window.skogen.hamtaSpelare === 'function') _playerForFacing = window.skogen.hamtaSpelare();
                    else if (window.gestaltrutan && typeof window.gestaltrutan.hamtaSpelare === 'function') _playerForFacing = window.gestaltrutan.hamtaSpelare();
                    else if (window.spelare) _playerForFacing = window.spelare;
                }
            } catch (e) {}
            const visible = (this.gestalter || []).filter(g => g && g.levande);
            visible.sort((a, b) => {
                const ay = (typeof a.y === 'number') ? a.y : 0;
                const by = (typeof b.y === 'number') ? b.y : 0;
                return ay - by; // lägre y först, högre y sist (överst)
            });
            for (const gestalt of visible) {
                const clampY = Math.max(0, Math.min(canvas.height, gestalt.y));
                const t = clampY / canvas.height;
                const skala = minSkala + (maxSkala - minSkala) * t;
                try {
                    if (_playerForFacing && typeof _playerForFacing.x === 'number') {
                        let facing = (_playerForFacing.x < (gestalt.x || 0));
                        try {
                            const idCheck = String(gestalt.id || gestalt.mappedId || '').toLowerCase();
                            if (idCheck === 'blodvarg') facing = !facing;
                        } catch (ee) {}
                        gestalt.spegelvand = facing;
                    }
                } catch (e) {}
                gestalt.rita(ctx, skala);
            }
        } catch (e) {
            // Fallback: rita i befintlig ordning om något går fel
            for (const gestalt of this.gestalter) {
                if (!gestalt.levande) continue;
                const clampY = Math.max(0, Math.min(canvas.height, gestalt.y));
                const t = clampY / canvas.height;
                const skala = minSkala + (maxSkala - minSkala) * t;
                gestalt.rita(ctx, skala);
            }
        }
        try { this.ritaFiendeStridsinfo(ctx, canvas); } catch (e) {}
        if (this.elementHoverInfo) {
            this.ritaElementTooltip(ctx, canvas, this.elementHoverInfo.element, this.elementHoverInfo.x, this.elementHoverInfo.y);
        }
    }

    skapaGestaltStridsinfo(gestalt) {
        if (!gestalt) return null;
        return {
            id: gestalt.id || gestalt.mappedId || gestalt.namn || '',
            namn: gestalt.namn || 'Fiende',
            liv: gestalt.liv || 0,
            maxLiv: gestalt.maxLiv || gestalt.liv || 0,
            skada: {
                fysisk: gestalt.skadaElement === 'fysisk' ? (gestalt.skada || 0) : 0,
                eld: gestalt.skadaElement === 'eld' ? (gestalt.skada || 0) : 0,
                magi: gestalt.skadaElement === 'magi' ? (gestalt.skada || 0) : 0
            },
            motstand: gestalt.motstånd || { fysisk: 0, eld: 0, magi: 0 },
            erfarenhet: gestalt.erfarenhet || 0
        };
    }

    uppdateraAktivStridInfo(gestalt) {
        if (!gestalt || this.arInteraktionskravGestalt(gestalt)) {
            this.aktivStridInfo = null;
            this.aktivStridInfoTid = 0;
            return;
        }
        this.aktivStridInfo = this.skapaGestaltStridsinfo(gestalt);
        this.aktivStridInfoTid = 180;
    }

    ritaFiendeStridsinfo(ctx, canvas) {
        const aktivGestalt = (this.stridAktiv && this.stridfiendeIndex >= 0) ? this.gestalter[this.stridfiendeIndex] : null;
        const narmasteHostilaGestalt = (!aktivGestalt && this.narmasteGestalt && this.narmasteGestalt.levande && this.narmasteGestalt.hostil)
            ? this.narmasteGestalt
            : null;
        const fallbackHostilGestalt = (!aktivGestalt && !narmasteHostilaGestalt && Array.isArray(this.gestalter))
            ? this.gestalter.find((gestalt) => gestalt && gestalt.levande && gestalt.hostil && !this.arInteraktionskravGestalt(gestalt))
            : null;
        const info = aktivGestalt
            ? this.skapaGestaltStridsinfo(aktivGestalt)
                : ((narmasteHostilaGestalt ? this.skapaGestaltStridsinfo(narmasteHostilaGestalt) : null)
                    || (fallbackHostilGestalt ? this.skapaGestaltStridsinfo(fallbackHostilGestalt) : null)
                    || this.aktivStridInfo);
        if (!info || (!aktivGestalt && !narmasteHostilaGestalt && !fallbackHostilGestalt && this.aktivStridInfoTid <= 0)) return;
        if ((aktivGestalt && this.arInteraktionskravGestalt(aktivGestalt)) || this.arInteraktionskravGestalt(info)) return;

        const boxW = 210;
        const boxH = 98;
        const x = canvas.width - boxW - 12;
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

    brytTextTillRader(ctx, text, maxBredd) {
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

    ritaElementTooltip(ctx, canvas, element, musX, musY) {
        const info = this.elementInfo[element];
        if (!info) return;
        const ikon = this.hamtaIkonBild(this.elementIkoner[element]);
        const iconSize = 52;
        const maxText = 176;
        ctx.save();
        ctx.font = '12px Arial';
        const rader = this.brytTextTillRader(ctx, info.beskrivning, maxText);
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

    hamtaLootVisual(spelare, itemId, antal = 1) {
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

    byggStridsLootMeddelande(rubrik, lootMeddelande, fallbackText) {
        if (this.stridsLootVisual) {
            return `${rubrik}\nFick:`;
        }
        if (lootMeddelande) {
            return `${rubrik}\nFick: ${lootMeddelande}`;
        }
        return fallbackText;
    }

    ritaStridsLootVisual(ctx, lootVisual, centerX, topY) {
        if (!lootVisual) return 0;

        if (Array.isArray(lootVisual.valutor) && lootVisual.valutor.length > 0) {
            const boxStorlek = 56;
            const mellanrum = 8;
            const totalBredd = (lootVisual.valutor.length * boxStorlek) + ((lootVisual.valutor.length - 1) * mellanrum);
            const startX = Math.round(centerX - totalBredd / 2);
            ctx.save();
            for (let i = 0; i < lootVisual.valutor.length; i++) {
                const valuta = lootVisual.valutor[i];
                const boxX = startX + (i * (boxStorlek + mellanrum));
                const boxY = Math.round(topY);
                const ikon = this.hamtaIkonBild(valuta.ikon);
                ctx.fillStyle = 'rgba(15, 22, 18, 0.92)';
                ctx.strokeStyle = '#ffcc66';
                ctx.lineWidth = 2;
                ctx.fillRect(boxX, boxY, boxStorlek, boxStorlek);
                ctx.strokeRect(boxX, boxY, boxStorlek, boxStorlek);
                if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                    ctx.drawImage(ikon, boxX + 10, boxY + 5, 36, 36);
                }
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(valuta.antal), boxX + boxStorlek / 2, boxY + boxStorlek - 10);
            }
            ctx.restore();
            return boxStorlek;
        }

        if (!lootVisual.ikon) return 0;

        const bgStorlek = 70;
        const ikonStorlek = 48;
        const boxX = Math.round(centerX - bgStorlek / 2);
        const boxY = Math.round(topY);
        const ikonX = Math.round(centerX - ikonStorlek / 2);
        const ikonY = Math.round(boxY + (bgStorlek - ikonStorlek) / 2);

        ctx.save();
        ctx.fillStyle = 'rgba(15, 22, 18, 0.92)';
        ctx.strokeStyle = '#ffcc66';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, bgStorlek, bgStorlek);
        ctx.strokeRect(boxX, boxY, bgStorlek, bgStorlek);

        const ikon = this.hamtaIkonBild(lootVisual.ikon);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            ctx.drawImage(ikon, ikonX, ikonY, ikonStorlek, ikonStorlek);
        }

        if (lootVisual.antal > 1) {
            const badgeText = `x${lootVisual.antal}`;
            ctx.font = 'bold 14px Arial';
            const badgeW = Math.max(26, Math.ceil(ctx.measureText(badgeText).width + 12));
            const badgeH = 22;
            const badgeX = Math.round(boxX + bgStorlek - badgeW - 4);
            const badgeY = Math.round(boxY + bgStorlek - badgeH - 4);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
        }
        ctx.restore();
        return bgStorlek;
    }

    ritaInteraktionsmeddelande(ctx, spelareX, spelareY) {
        if (!this.narmasteGestalt || !this.narmasteGestalt.levande) return;
        const gestalt = this.narmasteGestalt;
        const text = gestalt.meddelande || `Tryck pa [E] for att interagera med ${gestalt.namn}`;
        try {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.strokeStyle = '#00ccff';
            ctx.lineWidth = 2;
            ctx.font = 'bold 14px Arial';

            const maxW = 260;
            const lines = wrapText(ctx, text, maxW - 20);
            let textBredd = 0;
            for (const ln of lines) textBredd = Math.max(textBredd, ctx.measureText(ln).width);
            textBredd += 20;
            const lineH = 18;
            const textHojd = Math.max(30, lines.length * lineH + 10);
            const x = spelareX - textBredd / 2;
            const y = spelareY - 60;

            ctx.beginPath();
            ctx.roundRect(x, y, textBredd, textHojd, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], spelareX, y + 8 + i * lineH + lineH / 2);
            }
            ctx.restore();
        } catch (e) {}
    }

    ritaSenasteMeddelande(ctx, spelareX, spelareY) {
        if (this.senasteMeddelandeTid <= 0 || !this.senasteMeddelande) return;

        const text = this.senasteMeddelande;
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#ffcc66';
        ctx.lineWidth = 2;
        ctx.font = 'bold 14px Arial';

        const maxW = 320;
        const lines = wrapText(ctx, text, maxW - 20);
        let textBredd = 0;
        for (const ln of lines) textBredd = Math.max(textBredd, ctx.measureText(ln).width);
        textBredd += 20;
        const lineH = 18;
        const textHojd = Math.max(30, lines.length * lineH + 10);
        const x = spelareX - textBredd / 2;
        const y = spelareY - 125;

        ctx.beginPath();
        ctx.roundRect(x, y, textBredd, textHojd, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], spelareX, y + 8 + i * lineH + lineH / 2);
        }

        ctx.restore();
    }
    
    ritaStridsmeddelande(ctx, X, Y) {
        if (this.stridsmeddelandeTid <= 0 || !this.stridsmeddelande) return;

        const text = this.stridsmeddelande;
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 2;
        ctx.font = 'bold 16px Arial';

        const rader = [];
        for (const rad of String(text).split('\n')) {
            const inslag = wrapText(ctx, rad, 280);
            if (inslag.length > 0) {
                rader.push(...inslag);
            } else {
                rader.push('');
            }
        }
        let textBredd = 0;
        for (const rad of rader) {
            textBredd = Math.max(textBredd, ctx.measureText(rad).width);
        }
        const radHojd = 20;
        const lootHojd = this.stridsLootVisual ? 82 : 0;
        const boxBredd = Math.max(textBredd + 30, this.stridsLootVisual ? 96 : 0);
        const boxHojd = 14 + (rader.length * radHojd) + lootHojd;
        const x = X - boxBredd / 2;
        const y = Y - (125 + boxHojd);

        ctx.beginPath();
        ctx.roundRect(x, y, boxBredd, boxHojd, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        let textY = y + 10;
        for (const rad of rader) {
            ctx.fillText(rad, X, textY);
            textY += radHojd;
        }

        if (this.stridsLootVisual) {
            this.ritaStridsLootVisual(ctx, this.stridsLootVisual, X, y + boxHojd - 78);
        }

        ctx.restore();
    }
    
    rensaDeadGestals() {
        this.gestalter = this.gestalter.filter(g => g.levande);
        try {
            // If no hostile gestalters remain, unlock exits
            const anyHostile = this.gestalter && this.gestalter.some(g => g.levande && g.hostil !== false);
            if (!anyHostile) this.lockExit = false;
        } catch (e) {}
    }
}
