class Jaktmarken {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka, stridSystem, djurSystem) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);
        this.stridSystem = stridSystem;
        this.djurSystem = djurSystem;
        this.iStrid = false;
        this.aktivFiende = null;
        this.aktivDjur = null;
        this.stridUtvecklad = false; // Tracks if combat has been resolved
        this.stridTurCounter = 0;
        this.spawnX = 250;
        this.spawnY = 530;
        this.minSpelarSkala = 0.5;
        this.maxSpelarSkala = 2;
        this.visaBarriarer = false;
        this.visaUtgangar = false;
        this.narmasteUtgang = null;
        this.eKnappNedtryckt = false;
        this.stridNärhet = 60; // Avstånd för att trigga strid
        this.stridMeddelande = ''; // Meddelande efter strid
        this.stridMeddelndeTid = 0; // Tid när meddelandet visades
        this.stridMeddelndeDuration = 5000; // Visa meddelandet i minst 5 sekunder
        this.felMeddelande = ''; // Felmeddelande
        this.felMeddelandeTid = 0; // Tid när felmeddelandet visades
        this.felMeddelandeDuration = 5000; // Visa felmeddelandet i minst 5 sekunder

        // Djur som kan spawna
        this.djurTyper = [
            'Björn',
            'Hare',
            'Lodjur',
            'Ko',
            'Vildsvin',
            'Häst',
            'Rådjur',
            'Gädda',
            'Älg',
            'Varg',
            'Kråka',
        ];

        // Skala för varje djur - justerar höjden
        this.djurSkala = {
            'Björn': 0.2,
            'Hare': 0.1,
            'Lodjur': 0.4,
            'Ko': 0.3,
            'Vildsvin': 0.4,
            'Häst': 0.3,
            'Rådjur': 0.2,
            'Gädda': 0.2,
            'Älg': 0.4,
            'Varg': 0.8,
            'Kråka': 0.1
        };

        // Spawnpunkter för varje djur - justera här för att placera djuren
        this.spawnPunkter = {
            'Björn': { x: 130, y: 300 },
            'Hare': { x: 100, y: 480 },
            'Lodjur': { x: 350, y: 420 },
            'Ko': { x: 600, y: 370 },
            'Vildsvin': { x: 250, y: 380 },
            'Häst': { x: 430, y: 370 },
            'Rådjur': { x: 450, y: 400 },
            'Gädda': { x: 520, y: 350 },
            'Älg': { x: 125, y: 380 },
            'Varg': { x: 545, y: 450 },
            'Kråka': { x: 600, y: 550 }
        };

        // Lista över aktiva djur i området
        this.djur = [];

        // Barriärer
        this.barriarer = [
            { x: 0, y: 150, bredd: canvas.width, hojd: 20 },
            { x: 0, y: 270, bredd: 500, hojd: 20, rotation: 10 },
            { x: 495, y: 290, bredd: 400, hojd: 20, rotation: -7 },
            { x: 0, y: 0, bredd: 20, hojd: canvas.height },
            { x: 0, y: 580, bredd: canvas.width, hojd: 20 },
            { x: canvas.width - 20, y: 0, bredd: 20, hojd: canvas.height }
        ];

        // Utgång
        this.utgangar = [
            {
                namn: 'Utgång',
                x: 0,
                y: 540,
                bredd: canvas.width,
                hojd: 40,
                meddelande: 'Tryck på [E] för att lämna Jaktmarken',
                action: () => this.lamnaJaktmarken()
            }
        ];

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

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Jaktmarken.png';
        this.bild.onload = () => {
            this.bildLaddad = true;
            console.log('Jaktmarken-bild laddad!');
        };
        this.bild.onerror = () => {
            console.log('Kunde inte ladda Jaktmarken-bild, använder placeholder');
        };
    }

    visa() {
        this.visas = true;
        this.rensaMeddelanden();
        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.x = this.spawnX;
            spelare.y = this.spawnY;
        }
        // Spawna djur när man kommer in
        this.spawnaSlumpDjur();
    }

    dolj() {
        this.visas = false;
        // Rensa djur när man lämnar området
        this.djur = [];
        this.aktivDjur = null;
        this.aktivFiende = null;
        this.iStrid = false;
        this.stridUtvecklad = false;
        this.rensaMeddelanden();
    }

    rensaMeddelanden() {
        this.stridMeddelande = '';
        this.stridMeddelndeTid = 0;
        this.felMeddelande = '';
        this.felMeddelandeTid = 0;
    }

    rita() {
        if (!this.visas) return;
        this.elementHoverBounds = [];

        const ctx = this.ctx;
        const canvas = this.canvas;

        if (this.bildLaddad) {
            ctx.drawImage(this.bild, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#20301f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#dfe8d4';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Jaktmarken', canvas.width / 2, canvas.height / 2);
        }

        // Rita djur och spelare sorterat efter Y-position för korrekt djup
        this.ritaDjurOchSpelareISorterad();

        // Rita djurets stats om det finns ett aktivt djur
        if (this.aktivDjur) {
            this.ritaDjurStats();
        }

        // Rita djurets hälsa om striden är aktiv
        if (this.iStrid && this.aktivFiende) {
            this.ritaDjuretHalsa();
        }

        if (this.visaUtgangar) {
            this.ritaUtgangar();
        }

        this.ritaInteraktionsmeddelande();

        if (this.visaBarriarer) {
            this.ritaBarriarer();
        }

        // Rita stridmeddelande och felmeddelande
        this.ritaStridMeddelande();
        this.ritaFelMeddelande();
        if (this.elementHoverInfo) {
            this.ritaElementTooltip(this.elementHoverInfo.element, this.elementHoverInfo.x, this.elementHoverInfo.y);
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

    ritaDjurStats() {
        if (!this.aktivDjur) return;

        const skada = this.aktivDjur.skada || { fysisk: 0, eld: 0, magi: 0 };
        const motstand = this.aktivDjur.motstand || { fysisk: 0, eld: 0, magi: 0 };

        const ctx = this.ctx;
        const boxW = 210;
        const boxH = 98;
        const x = this.canvas.width - boxW - 12;
        const y = 12;

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
        ctx.fillText(`Fiende: ${this.aktivDjur.namn}`, x + 10, y + 8);

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
                if (index < 2) {
                    drawX += 4;
                }
            });
        };

        drawRow('Skada', skada, y + 30);
        drawRow('Försvar', motstand, y + 52);

        ctx.restore();
    }

    hamtaSpelareJakt(spelare) {
        const tommaStats = { fysisk: 0, eld: 0, magi: 0 };
        if (!spelare) return tommaStats;

        if (spelare.jakt && typeof spelare.jakt === 'object') {
            return {
                fysisk: spelare.jakt.fysisk || 0,
                eld: spelare.jakt.eld || 0,
                magi: spelare.jakt.magi || 0
            };
        }

        if (typeof spelare.jakt === 'number') {
            return { fysisk: spelare.jakt, eld: 0, magi: 0 };
        }

        if (spelare.utrustning && spelare.utrustning.vapen && spelare.utrustning.vapen.jakt) {
            const vapenJakt = spelare.utrustning.vapen.jakt;
            if (typeof vapenJakt === 'number') {
                return { fysisk: vapenJakt, eld: 0, magi: 0 };
            }
            if (typeof vapenJakt === 'object') {
                return {
                    fysisk: vapenJakt.fysisk || 0,
                    eld: vapenJakt.eld || 0,
                    magi: vapenJakt.magi || 0
                };
            }
        }

        return tommaStats;
    }

    valjJaktElement(spelare, jaktStats) {
        const foredraget = spelare && spelare.skadaElement ? spelare.skadaElement : null;
        if (foredraget && typeof jaktStats[foredraget] === 'number' && jaktStats[foredraget] > 0) {
            return foredraget;
        }

        return ['fysisk', 'eld', 'magi'].reduce((bast, element) => {
            const kandidat = typeof jaktStats[element] === 'number' ? jaktStats[element] : 0;
            const bastVarde = typeof jaktStats[bast] === 'number' ? jaktStats[bast] : 0;
            return kandidat > bastVarde ? element : bast;
        }, 'fysisk');
    }

    beraknaJaktChansData(spelare, fiende) {
        const jaktStats = this.hamtaSpelareJakt(spelare);
        const motstand = (fiende && (fiende.motstand || fiende.motstånd)) || {};
        let jaktElement = spelare && spelare.skadaElement ? spelare.skadaElement : 'fysisk';
        let jaktStat = typeof jaktStats[jaktElement] === 'number' ? jaktStats[jaktElement] : 0;
        let djurMotstand = typeof motstand[jaktElement] === 'number' ? motstand[jaktElement] : 0;
        let dominerandeBidrag = -1;
        let oneShootChans = 0;
        const bidragPerElement = {};

        for (const element of ['fysisk', 'eld', 'magi']) {
            const skada = typeof jaktStats[element] === 'number' ? jaktStats[element] : 0;
            const elementMotstand = typeof motstand[element] === 'number' ? motstand[element] : 0;
            const bidrag = Math.max(0, skada - elementMotstand);
            bidragPerElement[element] = bidrag;
            oneShootChans += bidrag;

            if (bidrag > dominerandeBidrag) {
                dominerandeBidrag = bidrag;
                jaktElement = element;
                jaktStat = skada;
                djurMotstand = elementMotstand;
            }
        }

        return {
            jaktStats,
            jaktElement,
            jaktStat,
            djurMotstand,
            oneShootChans: Math.max(0, Math.min(100, oneShootChans)),
            bidragPerElement
        };
    }

    hamtaBestamdDjurNamn(namn) {
        const map = {
            'Björn': 'Björnen',
            'Hare': 'Haren',
            'Lodjur': 'Lodjuret',
            'Ko': 'Kon',
            'Vildsvin': 'Vildsvinet',
            'Häst': 'Hästen',
            'Rådjur': 'Rådjuret',
            'Gädda': 'Gäddan',
            'Älg': 'Älgen',
            'Varg': 'Vargen',
            'Kråka': 'Kråkan'
        };
        return map[namn] || namn;
    }

    hanteraLoot(spelare, lootText) {
        if (!spelare || !spelare.utrustning || !lootText) return;

        const delar = String(lootText).split(' och ').map((del) => del.trim()).filter(Boolean);

        delar.forEach((del) => {
            const match = del.match(/^(\d+)\s+(.+)$/);
            const antal = match ? Number(match[1]) : 1;
            const namn = match ? match[2] : del;

            // Handle slumpmässig utrustning specially
            if (namn.toLowerCase().includes('slumpmässig') && namn.toLowerCase().includes('utrustning')) {
                for (let i = 0; i < antal; i += 1) {
                    const randomEquipment = this.hämtaSlumpmässigUtrustning();
                    spelare.utrustning.laggTillForemal(randomEquipment);
                }
                return;
            }

            const normaliserat = this.normaliseraLootNamn(namn);

            if (normaliserat === 'silver' || normaliserat === 'koppar' || normaliserat === 'guld') {
                const valuta = normaliserat;
                const pengarObj = { koppar: 0, silver: 0, guld: 0 };
                pengarObj[valuta] = antal;
                if (spelare && typeof spelare.laggTillPengar === 'function') {
                    spelare.laggTillPengar(pengarObj, { raknaSomIntakt: true });
                } else {
                    if (spelare.pengar && typeof spelare.pengar[valuta] === 'number') {
                        spelare.pengar[valuta] += antal;
                    }
                    if (spelare.prestationer && typeof spelare.prestationer.totaltGuldSamlat === 'number') {
                        const kopparVarde = valuta === 'guld' ? 100 : (valuta === 'silver' ? 10 : 1);
                        spelare.prestationer.totaltGuldSamlat += antal * kopparVarde;
                    }
                }
                return;
            }

            for (let i = 0; i < antal; i += 1) {
                spelare.utrustning.laggTillForemal(normaliserat);
            }
        });

        // Normalisera pengar (konvertera silver till guld osv)
        this.normaliseraPengar(spelare);
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

    hämtaSlumpmässigUtrustning() {
        // Lista över möjlig utrustning som djur kan droppa
        const utrustning = ['Träsvärd', 'Träklubba', 'Högaffel', 'hammare'];
        return utrustning[Math.floor(Math.random() * utrustning.length)];
    }

    normaliseraLootNamn(namn) {
        const lower = String(namn).toLowerCase().trim();
        const map = {
            'köttbit': 'kottbit',
            'kottbit': 'kottbit',
            'trä': 'tra',
            'tra': 'tra',
            'järn': 'jarn',
            'jarn': 'jarn',
            'titanit': 'titanit',
            'sten': 'sten',
            'Pinne': 'Pinne',
            'silver': 'silver',
            'koppar': 'koppar',
            'guld': 'guld'
        };
        return map[lower] || lower;
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

    ritaDjuretHalsa() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        if (!this.aktivFiende) return;

        // Hälsobalk längst upp
        const balkBredd = 200;
        const balkHojd = 20;
        const balkX = canvas.width / 2 - balkBredd / 2;
        const balkY = 50;

        // Background för hälsobalk
        ctx.fillStyle = '#444444';
        ctx.fillRect(balkX, balkY, balkBredd, balkHojd);

        // Hälsobalk (grön -> röd beroende på hälsa)
        const halsoPercent = Math.max(0, this.aktivFiende.liv / this.aktivFiende.maxLiv);
        const fargG = 255 * halsoPercent;
        const fargR = 255 * (1 - halsoPercent);
        ctx.fillStyle = `rgb(${fargR}, ${fargG}, 0)`;
        ctx.fillRect(balkX, balkY, balkBredd * halsoPercent, balkHojd);

        // Kanter för hälsobalk
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(balkX, balkY, balkBredd, balkHojd);

        // Hälsotext
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.aktivFiende.namn}: ${this.aktivFiende.liv}/${this.aktivFiende.maxLiv}`, canvas.width / 2, balkY + balkHojd / 2);

        // DEBUG: Visa attackchans
        const spelare = this.hamtaSpelare();
        if (spelare) {
            const { bidragPerElement, oneShootChans } = this.beraknaJaktChansData(spelare, this.aktivFiende);
            const chansDetaljer = ['fysisk', 'eld', 'magi']
                .map((element) => `${element}: ${bidragPerElement[element] || 0}`)
                .join(' | ');
            
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`CHANS: ${oneShootChans.toFixed(0)}% (${chansDetaljer})`, canvas.width / 2, balkY + balkHojd + 40);
        }
    }

    ritaStridMeddelande() {
        if (!this.stridMeddelande || this.stridMeddelande === '') return;

        const ctx = this.ctx;
        const canvas = this.canvas;
        const elapsed = Date.now() - this.stridMeddelndeTid;
        
        // Fade out efter 3 sekunder
        if (elapsed > this.stridMeddelndeDuration) {
            this.stridMeddelande = '';
            return;
        }
        
        // Beräkna opacity
        const fadeStart = this.stridMeddelndeDuration - 500; // Börja fade 500ms innan
        let opacity = 1;
        if (elapsed > fadeStart) {
            opacity = 1 - ((elapsed - fadeStart) / 500);
        }
        
        // Rita bakgrund
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rita meddelande
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`; // Guldfärg
        
        const lines = this.stridMeddelande.split('\n');
        const lineHeight = 35;
        const totalHeight = lines.length * lineHeight;
        const startY = canvas.height / 2 - totalHeight / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });
    }

    visaFelMeddelande(text) {
        this.felMeddelande = text;
        this.felMeddelandeTid = Date.now();
    }

    ritaFelMeddelande() {
        if (!this.felMeddelande || this.felMeddelande === '') return;

        const ctx = this.ctx;
        const canvas = this.canvas;
        const elapsed = Date.now() - this.felMeddelandeTid;
        
        // Fade out efter 2,5 sekunder
        if (elapsed > this.felMeddelandeDuration) {
            this.felMeddelande = '';
            return;
        }
        
        // Beräkna opacity
        const fadeStart = this.felMeddelandeDuration - 400;
        let opacity = 1;
        if (elapsed > fadeStart) {
            opacity = 1 - ((elapsed - fadeStart) / 400);
        }
        
        // Rita meddelande
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 100, 100, ${opacity})`; // Röd färg för fel
        
        ctx.fillText(this.felMeddelande, canvas.width / 2, canvas.height / 2);
    }

    tangentNed(tangent) {
        if (!this.visas) return;
        if ((tangent === 'e' || tangent === 'E') && this.narmasteUtgang && !this.eKnappNedtryckt) {
            this.eKnappNedtryckt = true;
            this.narmasteUtgang.action();
            return;
        }

        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.tangentNed(tangent);
        }
    }

    tangentUpp(tangent) {
        if (!this.visas) return;
        if (tangent === 'e' || tangent === 'E') {
            this.eKnappNedtryckt = false;
        }
        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.tangentUpp(tangent);
        }
    }

    uppdateraRorelse() {
        if (!this.visas) return;
        
        const spelare = this.hamtaSpelare();
        
        // Om strid är aktiv, hantera stridslogik först
        if (this.iStrid) {
            this.uppdateraDjurStrid(spelare);
            return; // Ingen rörelse under strid
        }
        
        // Annars, normal rörelse
        this.uppdateraDjur();
        
        // Kontrollera närhet till djur för att starta strid
        this.kontrolleraStridNarhet();
        
        if (spelare) {
            let rorelse = false;

            const dx = (spelare.tangenter.left ? -spelare.hastighet : 0) + (spelare.tangenter.right ? spelare.hastighet : 0);
            const dy = (spelare.tangenter.up ? -spelare.hastighet : 0) + (spelare.tangenter.down ? spelare.hastighet : 0);

            if (dx !== 0) {
                spelare.riktning = dx < 0 ? 'vänster' : 'höger';
                rorelse = true;
            }
            if (dy !== 0) {
                rorelse = true;
            }

            if (dx !== 0 || dy !== 0) {
                const radie = spelare.storlek;
                const nyttX = spelare.x + dx;
                const nyttY = spelare.y + dy;

                // Kontrollera barriärer
                if (!this.kolliderarPos(nyttX, nyttY, radie)) {
                    spelare.x = nyttX;
                    spelare.y = nyttY;
                } else {
                    // försök glidande rörelse
                    if (dx !== 0 && !this.kolliderarPos(spelare.x + dx, spelare.y, radie)) {
                        spelare.x += dx;
                    } else if (dy !== 0 && !this.kolliderarPos(spelare.x, spelare.y + dy, radie)) {
                        spelare.y += dy;
                    }
                }
            }

            if (animationer) {
                animationer.uppdateraAnimering(spelare, rorelse);
            }

            this.kontrolleraNarhet(spelare.x, spelare.y);
        }
    }
    
    uppdateraDjurStrid(spelare) {
        if (!spelare || !this.aktivFiende) return;
        
        // Om striden inte är utvecklad ännu, gör en automatisk attack
        if (!this.stridUtvecklad) {
            this.stridUtvecklad = true;
            this.spelareAttackerar();
            
            const djurNamnBestamd = this.hamtaBestamdDjurNamn(this.aktivFiende.namn);

            // Kolla resultatet direkt efter attacken
            if (this.aktivFiende.liv <= 0) {
                // Träff - djuret dog
                if (spelare.prestationer) {
                    spelare.prestationer.lyckadeJakter = (spelare.prestationer.lyckadeJakter || 0) + 1;
                }
                if (typeof spelare.registreraStridsresultat === 'function') {
                    spelare.registreraStridsresultat({ vann: true, forlorade: false });
                }
                // Uppdatera globala prestationer så att dödade djur från Jaktmarken räknas
                try {
                    if (spelare && spelare.prestationer) {
                        spelare.prestationer.fiendesBesegrade = (spelare.prestationer.fiendesBesegrade || 0) + 1;
                        const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                        const omradeKey = 'jaktmarken';
                        const keyRaw = this.aktivFiende && (this.aktivFiende.typ || this.aktivFiende.namn) ? (this.aktivFiende.typ || this.aktivFiende.namn) : '';
                        const key = normalize(keyRaw);
                        spelare.prestationer.killsByType = spelare.prestationer.killsByType || {};
                        spelare.prestationer.killsByArea = spelare.prestationer.killsByArea || {};
                        spelare.prestationer.killsByAreaType = spelare.prestationer.killsByAreaType || {};
                        spelare.prestationer.killsByType[key] = (spelare.prestationer.killsByType[key] || 0) + 1;
                        spelare.prestationer.killsByArea[omradeKey] = (spelare.prestationer.killsByArea[omradeKey] || 0) + 1;
                        spelare.prestationer.killsByAreaType[omradeKey] = spelare.prestationer.killsByAreaType[omradeKey] || {};
                        spelare.prestationer.killsByAreaType[omradeKey][key] = (spelare.prestationer.killsByAreaType[omradeKey][key] || 0) + 1;
                        if (typeof window !== 'undefined' && window.UPPDRAG_DEBUG) console.log('[Uppdrag DEBUG] Jaktmarken fiende besegrad:', key, 'totalKills=', spelare.prestationer.fiendesBesegrade, 'killsByType=', spelare.prestationer.killsByType[key]);
                    }
                } catch (e) {}
                const djurStats = this.djurSystem.hamtaDjurStats(this.aktivFiende.namn);
                if (djurStats && djurStats.loot) {
                    const slumpLoot = djurStats.loot[Math.floor(Math.random() * djurStats.loot.length)];
                    this.hanteraLoot(spelare, slumpLoot);
                    this.stridMeddelande = `${djurNamnBestamd} är besegrad!\nDu fick: ${slumpLoot}`;
                    this.stridMeddelndeTid = Date.now();
                    console.log(`${djurNamnBestamd} är besegrad! Du fick: ${slumpLoot}`);
                }
                this.iStrid = false;
                this.aktivFiende = null;
                this.aktivDjur = null;
                this.djur = [];
                this.stridUtvecklad = false;
            } else {
                // Miss - djuret försvinner
                if (typeof spelare.registreraStridsresultat === 'function') {
                    spelare.registreraStridsresultat({ vann: false, forlorade: true });
                }
                this.stridMeddelande = `${djurNamnBestamd} kom undan...`;
                this.stridMeddelndeTid = Date.now();
                console.log(`${djurNamnBestamd} försvinner in i skogarna...`);
                this.iStrid = false;
                this.aktivFiende = null;
                this.aktivDjur = null;
                this.djur = [];
                this.stridUtvecklad = false;
            }
        }
    }

    spelareAttackerar() {
        if (!this.iStrid || !this.aktivFiende) return;

        const spelare = this.hamtaSpelare();
        if (!spelare) return;

        const { jaktElement, jaktStat, oneShootChans } = this.beraknaJaktChansData(spelare, this.aktivFiende);

        // Slumpa om attacken lyckas one-shota
        const slump = Math.random() * 100;
        if (slump < oneShootChans) {
            // One-shot! Djuret dör
            this.aktivFiende.liv = 0;
            console.log(`Du attackerar ${this.aktivFiende.namn}! One-shot chans: ${oneShootChans.toFixed(1)}% med ${jaktElement} - TRÄFF! ${this.aktivFiende.namn} är besegrad!`);
        } else {
            console.log(`Du attackerar ${this.aktivFiende.namn}! One-shot chans: ${oneShootChans.toFixed(1)}% med ${jaktElement} - MISS! ${this.aktivFiende.namn} är fortfarande vid liv.`);
        }
    }

    kolliderarPos(x, y, radie) {
        for (const barr of this.barriarer) {
            if (barr.typ === 'oval') {
                const a = barr.bredd / 2;
                const b = barr.hojd / 2;
                const cx = barr.x + a;
                const cy = barr.y + b;

                const rotation = (barr.rotation || 0) * Math.PI / 180;
                const sinR = Math.sin(rotation);
                const cosR = Math.cos(rotation);

                const dx = x - cx;
                const dy = y - cy;
                const rotX = dx * cosR + dy * sinR;
                const rotY = -dx * sinR + dy * cosR;

                const ellipseVal = (rotX * rotX) / (a * a) + (rotY * rotY) / (b * b);
                if (ellipseVal <= 1) {
                    return true;
                }
            } else {
                const rotation = (barr.rotation || 0) * Math.PI / 180;
                const sinR = Math.sin(rotation);
                const cosR = Math.cos(rotation);

                const dx = x - (barr.x + barr.bredd / 2);
                const dy = y - (barr.y + barr.hojd / 2);
                const rotX = dx * cosR + dy * sinR;
                const rotY = -dx * sinR + dy * cosR;

                const halfBredd = barr.bredd / 2;
                const halfHojd = barr.hojd / 2;

                const clampX = Math.max(-halfBredd, Math.min(halfBredd, rotX));
                const clampY = Math.max(-halfHojd, Math.min(halfHojd, rotY));

                const closestX = clampX * cosR - clampY * sinR + (barr.x + barr.bredd / 2);
                const closestY = clampX * sinR + clampY * cosR + (barr.y + barr.hojd / 2);

                const distSq = (x - closestX) * (x - closestX) + (y - closestY) * (y - closestY);
                if (distSq < radie * radie) {
                    return true;
                }
            }
        }
        return false;
    }

    hittaKollision(x, y, radie) {
        for (const barr of this.barriarer) {
            if (barr.typ === 'oval') {
                const a = barr.bredd / 2;
                const b = barr.hojd / 2;
                const cx = barr.x + a;
                const cy = barr.y + b;

                const rotation = (barr.rotation || 0) * Math.PI / 180;
                const sinR = Math.sin(rotation);
                const cosR = Math.cos(rotation);

                const dx = x - cx;
                const dy = y - cy;
                const rotX = dx * cosR + dy * sinR;
                const rotY = -dx * sinR + dy * cosR;

                const ellipseVal = (rotX * rotX) / (a * a) + (rotY * rotY) / (b * b);
                if (ellipseVal <= 1) {
                    const nx = (2 * rotX) / (a * a);
                    const ny = (2 * rotY) / (b * b);
                    const len = Math.sqrt(nx * nx + ny * ny);
                    const normalX = (nx / len) * cosR - (ny / len) * sinR;
                    const normalY = (nx / len) * sinR + (ny / len) * cosR;

                    return { normal: { x: normalX, y: normalY } };
                }
            } else {
                const rotation = (barr.rotation || 0) * Math.PI / 180;
                const sinR = Math.sin(rotation);
                const cosR = Math.cos(rotation);

                const dx = x - (barr.x + barr.bredd / 2);
                const dy = y - (barr.y + barr.hojd / 2);
                const rotX = dx * cosR + dy * sinR;
                const rotY = -dx * sinR + dy * cosR;

                const halfBredd = barr.bredd / 2;
                const halfHojd = barr.hojd / 2;

                const clampX = Math.max(-halfBredd, Math.min(halfBredd, rotX));
                const clampY = Math.max(-halfHojd, Math.min(halfHojd, rotY));

                const closestX = clampX * cosR - clampY * sinR + (barr.x + barr.bredd / 2);
                const closestY = clampX * sinR + clampY * cosR + (barr.y + barr.hojd / 2);

                const distSq = (x - closestX) * (x - closestX) + (y - closestY) * (y - closestY);
                if (distSq < radie * radie) {
                    const dist = Math.sqrt(distSq);
                    return {
                        normal: {
                            x: (x - closestX) / dist,
                            y: (y - closestY) / dist
                        }
                    };
                }
            }
        }
        return null;
    }

    kontrolleraNarhet(x, y) {
        this.narmasteUtgang = null;
        let minAvstand = Infinity;

        for (const utgang of this.utgangar) {
            // Kontrollera om spelaren är inom rektangeln
            if (x >= utgang.x && x <= utgang.x + utgang.bredd &&
                y >= utgang.y && y <= utgang.y + utgang.hojd) {
                const dx = x - (utgang.x + utgang.bredd / 2);
                const dy = y - (utgang.y + utgang.hojd / 2);
                const avstand = Math.sqrt(dx * dx + dy * dy);
                if (avstand < minAvstand) {
                    minAvstand = avstand;
                    this.narmasteUtgang = utgang;
                }
            }
        }
    }

    ritaUtgangar() {
        const ctx = this.ctx;
        for (const utgang of this.utgangar) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'yellow';
            ctx.fillRect(utgang.x, utgang.y, utgang.bredd, utgang.hojd);
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 3;
            ctx.strokeRect(utgang.x, utgang.y, utgang.bredd, utgang.hojd);
            ctx.restore();
        }
    }

    ritaInteraktionsmeddelande() {
        if (!this.narmasteUtgang) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.narmasteUtgang.meddelande, canvas.width / 2, canvas.height - 30);
    }

    ritaBarriarer() {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.3;

        for (const barr of this.barriarer) {
            if (barr.typ === 'oval') {
                ctx.save();
                ctx.translate(barr.x + barr.bredd / 2, barr.y + barr.hojd / 2);
                ctx.rotate((barr.rotation || 0) * Math.PI / 180);
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.ellipse(0, 0, barr.bredd / 2, barr.hojd / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else {
                ctx.save();
                ctx.translate(barr.x + barr.bredd / 2, barr.y + barr.hojd / 2);
                ctx.rotate((barr.rotation || 0) * Math.PI / 180);
                ctx.fillStyle = 'red';
                ctx.fillRect(-barr.bredd / 2, -barr.hojd / 2, barr.bredd, barr.hojd);
                ctx.restore();
            }
        }
        ctx.restore();
    }

    lamnaJaktmarken() {
        this.dolj();
        this.gaTillbaka();
    }

    spawnaSlumpDjur() {
        // Spawna ett slumpat djur
        this.djur = [];
        
        // Välj ett slumpmässigt djur
        const slumpTyp = this.djurTyper[Math.floor(Math.random() * this.djurTyper.length)];
        const spawnPunkt = this.spawnPunkter[slumpTyp];
        
        if (!spawnPunkt) return;
        
        // Hämta djurens stats (inklusive slumpat motstand)
        const djurStats = this.djurSystem.hamtaDjurStats(slumpTyp);
        if (!djurStats) return;
        
        // Ladda bild
        const bild = new Image();
        bild.src = `assets/gestalter/${slumpTyp}.png`;
        
        // Bestäm riktning (björn och älg går åt vänster)
        const riktning = (slumpTyp === 'Björn' || slumpTyp === 'Älg') ? 'vänster' : 'höger';
        
        const djur = {
            namn: slumpTyp,
            x: spawnPunkt.x,
            y: spawnPunkt.y,
            skala: this.djurSkala[slumpTyp] || 1.0,
            liv: djurStats.liv,
            maxLiv: djurStats.liv,
            riktning: riktning,
            bild: bild,
            motstand: djurStats.motstand
        };
        this.djur.push(djur);
        this.aktivDjur = djur; // Spara referens så vi kan visa stats
    }

    ritaDjurOchSpelareISorterad() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const spelare = this.hamtaSpelare();
        
        // Skapa lista med alla objekt som ska ritas
        const ritObjekt = [];
        
        // Lägg till spelare
        if (spelare) {
            ritObjekt.push({
                typ: 'spelare',
                y: spelare.y,
                objekt: spelare
            });
        }
        
        // Lägg till djur
        for (const djur of this.djur) {
            ritObjekt.push({
                typ: 'djur',
                y: djur.y,
                objekt: djur
            });
        }
        
        // Sortera efter Y-position (från låg till hög = från bak till fram)
        ritObjekt.sort((a, b) => a.y - b.y);
        
        // Rita allt i sorterad ordning
        for (const obj of ritObjekt) {
            if (obj.typ === 'spelare') {
                const clampY = Math.max(0, Math.min(canvas.height, obj.objekt.y));
                const t = clampY / canvas.height;
                const skala = this.minSpelarSkala + (this.maxSpelarSkala - this.minSpelarSkala) * t;

                ctx.save();
                ctx.translate(obj.objekt.x, obj.objekt.y);
                ctx.scale(skala, skala);
                ctx.translate(-obj.objekt.x, -obj.objekt.y);
                obj.objekt.rita(ctx);
                ctx.restore();
            } else if (obj.typ === 'djur') {
                this.ritaEnDjur(obj.objekt);
            }
        }
    }

    ritaEnDjur(djur) {
        const ctx = this.ctx;
        
        ctx.save();
        
        // Rita djur-bild med skalning
        if (djur.bild && djur.bild.complete && djur.bild.naturalWidth > 0) {
            const bredd = djur.bild.naturalWidth * djur.skala;
            const hojd = djur.bild.naturalHeight * djur.skala;
            
            if (djur.riktning === 'vänster') {
                ctx.scale(-1, 1);
                ctx.drawImage(djur.bild, -djur.x - bredd / 2, djur.y - hojd / 2, bredd, hojd);
            } else {
                ctx.drawImage(djur.bild, djur.x - bredd / 2, djur.y - hojd / 2, bredd, hojd);
            }
        } else {
            // Fallback: rita grå cirkel om bild inte laddats
            ctx.fillStyle = '#cccccc';
            ctx.beginPath();
            ctx.arc(djur.x, djur.y, 30, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    u

    kontrolleraStridNarhet() {
        if (!this.visas || this.iStrid || this.djur.length === 0) return;
        
        const spelare = this.hamtaSpelare();
        if (!spelare) return;
        
        const djur = this.djur[0]; // Det finns endast ett djur
        const dx = spelare.x - djur.x;
        const dy = spelare.y - djur.y;
        const avstand = Math.sqrt(dx * dx + dy * dy);
        
        if (avstand <= this.stridNärhet) {
            this.startaDjurStrid(djur);
        }
    }

    startaDjurStrid(djur) {
        if (!this.stridSystem || !this.djurSystem || this.iStrid) return;
        
        this.iStrid = true;
        this.aktivDjur = djur;
        
        const djurStats = this.djurSystem.hamtaDjurStats(djur.namn);
        if (!djurStats) return;
        
        // Skapa fiende med djurens stats
        this.aktivFiende = djur; // Använd djur-objektet som fiende i striden
        this.aktivFiende.liv = djurStats.liv;
        this.aktivFiende.maxLiv = djurStats.liv;
        this.aktivFiende.skada = djurStats.skada;
        this.aktivFiende.skadaElement = 'fysisk';
        // Behåll det motstand-värde som redan är satt på djur-objektet
        // this.aktivFiende.motstand = djurStats.motstand;
        this.aktivFiende.hastighet = djurStats.hastighet;
        this.aktivFiende.attackRackvidd = djurStats.attackRackvidd;
        this.aktivFiende.attackHastighet = djurStats.attackHastighet;
        this.aktivFiende.erfarenhet = djurStats.erfarenhet;
        this.aktivFiende.levande = true;
        this.aktivFiende.attackTimer = 0;
    }

    uppdateraDjur() {
        if (!this.visas) return;
        // Djur stannar stilla - ingen rörelse
    }
}
