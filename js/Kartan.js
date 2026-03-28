class Kartan {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka, gaTillStigen, gaTillPlats, gaTillGestalt, gaTillBandit, gaTillJaktmarken, gaTillChansrutan, gaTillVarldskartan) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);
        this.gaTillStigen = gaTillStigen || (() => null);
        this.gaTillPlats = gaTillPlats || (() => null);
        this.gaTillGestalt = gaTillGestalt || (() => null);
        this.gaTillBandit = gaTillBandit || (() => null);
        this.gaTillJaktmarken = gaTillJaktmarken || (() => null);
        this.gaTillChansrutan = gaTillChansrutan || (() => null);
        this.gaTillVarldskartan = gaTillVarldskartan || (() => null);

        // Definiera integrerings-/interaktionspunkter från världen
        this.integreringspunkter = [
            { namn: 'Fyrmille', x: 524, y: 328, radie: 30, farg: 'rgba(121, 121, 121, 0.77)' },
            { namn: 'Stigen1', x: 466, y: 307, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen2', x: 639, y: 285, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen3', x: 544, y: 361, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen4', x: 496, y: 425, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen5', x: 626, y: 252, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen6', x: 539, y: 204, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen7', x: 430, y: 249, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen8', x: 389, y: 220, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen9', x: 295, y: 161, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen10', x: 142, y: 187, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen11', x: 132, y: 220, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen12', x: 160, y: 253, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen13', x: 189, y: 316, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen14', x: 301, y: 323, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen15', x: 208, y: 371, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen16', x: 170, y: 436, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Chans1', x: 581, y: 300, radie: 30, farg: 'rgba(217, 70, 167, 0.6)' },
            { namn: 'Chans2', x: 416, y: 281, radie: 30, farg: 'rgba(217, 70, 167, 0.6)' },
            { namn: 'Chans3', x: 236, y: 144, radie: 30, farg: 'rgba(217, 70, 167, 0.6)' },
            { namn: 'Chans4', x: 170, y: 400, radie: 30, farg: 'rgba(217, 70, 167, 0.6)' },
            { namn: 'Gestalt1', x: 523, y: 393, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt2', x: 343, y: 187, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt3', x: 567, y: 236, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt4', x: 178, y: 160, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt5', x: 179, y: 284, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt6', x: 236, y: 339, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Sjöfart1', x: 159, y: 474, radie: 30, farg: 'rgba(104, 164, 255, 0.6)' },
            { namn: 'Sjöfart2', x: 235, y: 515, radie: 30, farg: 'rgba(104, 164, 255, 0.6)' },
            { namn: 'Sjöfart3', x: 496, y: 456, radie: 30, farg: 'rgba(104, 164, 255, 0.6)' },
            { namn: 'Sjöfart4', x: 625, y: 483, radie: 30, farg: 'rgba(104, 164, 255, 0.6)' },
            { namn: 'Skogen', x: 359, y: 295, radie: 30, farg: 'rgba(44, 92, 0, 0.6)' },
            { namn: 'Banditläger', x: 668, y: 515, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Jaktmarken', x: 495, y: 176, radie: 30, farg: 'rgba(136, 255, 112, 0.6)' },
            { namn: 'Bifrost', x: 582, y: 178, radie: 30, farg: 'rgba(53, 255, 255, 0.6)' },
            { namn: 'Gjallarbron', x: 130, y: 336, radie: 30, farg: 'rgba(255, 185, 105, 0.6)' },
            { namn: 'Runa-R', x: 257, y: 553, radie: 30, farg: 'rgba(255, 200, 50, 0.6)' }
        ];

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Midgård.png';
        this.bild.onload = () => {
            this.bildLaddad = true;
            console.log('Kartan-bild laddad!');
        };
        this.bild.onerror = () => {
            console.log('Kunde inte ladda Kartan-bild från: assets/platser/Midgård.png');
        };

        this.runaRIkon = new Image();
        this.runaRIkonLaddad = false;
        this.runaRIkon.src = 'assets/Ikoner/Sjöfart.png';
        this.runaRIkon.onload = () => {
            this.runaRIkonLaddad = true;
        };
        this.runaRIkon.onerror = () => {
            this.runaRIkonLaddad = false;
        };
        this.runaRHoverIkon = new Image();
        this.runaRHoverIkonLaddad = false;
        this.runaRHoverIkon.src = 'assets/Ikoner/HoverSjöfart.png';
        this.runaRHoverIkon.onload = () => {
            this.runaRHoverIkonLaddad = true;
        };
        this.runaRHoverIkon.onerror = () => {
            this.runaRHoverIkonLaddad = false;
        };
        this._runaRIkonHover = false;

        // world map overlay (from assets/kartor) - try several candidate filenames
        this._mapVisible = false;
        this._mapImage = new Image();
        this._mapImageLoaded = false;
        this._mapCandidates = [
            'assets/kartor/varldskarta.png',
            'assets/kartor/Varldskarta.png',
            'assets/kartor/WorldMap.png',
            'assets/kartor/map.png'
        ];
        this._mapCandidateIndex = 0;
        this._tryLoadMap = () => {
            if (this._mapCandidateIndex >= this._mapCandidates.length) return;
            const src = this._mapCandidates[this._mapCandidateIndex++];
            this._mapImage.onload = () => { this._mapImageLoaded = true; };
            this._mapImage.onerror = () => { this._mapImageLoaded = false; this._tryLoadMap(); };
            this._mapImage.src = src;
        };
        this._tryLoadMap();

        this.meddelande = null;
        this.meddelandeTid = 0;
        this._runaRIkonRect = null;
        this.aktuelltOmrade = null;
        this._pendingTravelOmrade = null;

        // Brädspelsystem
        this.rutorHorizontalt = 6; // Antal kolumner
        this.rutorVertikal = 5;    // Antal rader
        this.rutBredd = canvas.width / this.rutorHorizontalt;
        this.rutHojd = canvas.height / this.rutorVertikal;
        this.spelareKol = Math.floor(this.rutorHorizontalt / 2); // Start i mitten
        this.spelareRad = Math.floor(this.rutorVertikal / 2);
        this.maxStegAvstandSidled = 70;
        this.maxStegAvstandVertikalt = 50;

        // Definiera områdena/regionerna på kartan
        this.omraden = [
            { namn: 'Fyrmille', x: 524, y: 328, radie: 30, farg: 'rgba(121, 121, 121, 0.77)' },
            { namn: 'Stigen1', x: 466, y: 307, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen2', x: 639, y: 285, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen3', x: 544, y: 361, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen4', x: 496, y: 425, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen5', x: 626, y: 252, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen6', x: 539, y: 204, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen7', x: 430, y: 249, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen8', x: 389, y: 220, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen9', x: 295, y: 161, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen10', x: 142, y: 187, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen11', x: 132, y: 220, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen12', x: 160, y: 253, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen13', x: 189, y: 316, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen14', x: 301, y: 323, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen15', x: 208, y: 371, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Stigen16', x: 170, y: 436, radie: 30, farg: 'rgba(136, 136, 136, 0.6)' },
            { namn: 'Chans1', x: 581, y: 300, radie: 30, farg: 'rgba(217, 70, 167, 0.6)' },
            { namn: 'Chans2', x: 416, y: 281, radie: 30, farg: 'rgba(217, 70, 167, 0.6)' },
            { namn: 'Chans3', x: 236, y: 144, radie: 30, farg: 'rgba(217, 70, 167, 0.6)' },
            { namn: 'Chans4', x: 170, y: 400, radie: 30, farg: 'rgba(217, 70, 167, 0.6)' },
            { namn: 'Gestalt1', x: 523, y: 393, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt2', x: 343, y: 187, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt3', x: 567, y: 236, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt4', x: 178, y: 160, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt5', x: 179, y: 284, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Gestalt6', x: 236, y: 339, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Sjöfart1', x: 159, y: 474, radie: 30, farg: 'rgba(104, 164, 255, 0.6)' },
            { namn: 'Sjöfart2', x: 235, y: 515, radie: 30, farg: 'rgba(104, 164, 255, 0.6)' },
            { namn: 'Sjöfart3', x: 496, y: 456, radie: 30, farg: 'rgba(104, 164, 255, 0.6)' },
            { namn: 'Sjöfart4', x: 625, y: 483, radie: 30, farg: 'rgba(104, 164, 255, 0.6)' },
            { namn: 'Skogen', x: 359, y: 295, radie: 30, farg: 'rgba(44, 92, 0, 0.6)' },
            { namn: 'Banditläger', x: 668, y: 515, radie: 30, farg: 'rgba(255, 104, 104, 0.6)' },
            { namn: 'Jaktmarken', x: 495, y: 176, radie: 30, farg: 'rgba(136, 255, 112, 0.6)' },
            { namn: 'Bifrost', x: 582, y: 178, radie: 30, farg: 'rgba(53, 255, 255, 0.6)' },
            { namn: 'Gjallarbron', x: 130, y: 336, radie: 30, farg: 'rgba(255, 185, 105, 0.6)' },
            { namn: 'Runa-R', x: 257, y: 553, radie: 30, farg: 'rgba(255, 200, 50, 0.6)' }
        ];

        this.valtOmrade = null; // Det område spelaren är på
    }

    hamtaOmradeMedNamn(namn) {
        if (!namn) return null;
        return this.omraden.find((omrade) => omrade.namn === namn) || null;
    }

    hamtaSpelarensKartposition() {
        const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
        if (!spelare || !spelare.aktuellKartaOmrade) return null;
        return this.hamtaOmradeMedNamn(spelare.aktuellKartaOmrade);
    }

    sattAktuelltOmrade(omrade, options = {}) {
        this.aktuelltOmrade = omrade || null;

        const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
        if (spelare) {
            spelare.aktuellKartaOmrade = this.aktuelltOmrade ? this.aktuelltOmrade.namn : null;
            if (typeof spelare.uppdateraAktivaBonusEgenskaper === 'function') {
                spelare.uppdateraAktivaBonusEgenskaper();
            }
        }

        if (!options.behallVal || !this.valtOmrade || !this.kanValjaOmrade(this.valtOmrade)) {
            this.valtOmrade = this.aktuelltOmrade;
        }
    }

    sattValtOmrade(omrade) {
        if (omrade && !this.kanValjaOmrade(omrade)) return false;
        this.valtOmrade = omrade || null;
        return true;
    }

    kanValjaOmrade(omrade) {
        if (!omrade) return false;
        if (!this.aktuelltOmrade) return true;
        if (omrade === this.aktuelltOmrade) return true;
        return this.kanGaTillOmrade(omrade);
    }

    harTillgangTillSjofart() {
        const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
        const harEgnaSkepp = !!(spelare && Array.isArray(spelare.egnaSkepp) && spelare.egnaSkepp.length > 0);
        const harPlaceratSkepp = !!(
            spelare
            && Array.isArray(spelare.flottaPlaced)
            && spelare.flottaPlaced.some((entry) => !entry || !entry.type || entry.type === 'skepp')
        );
        return harEgnaSkepp && harPlaceratSkepp;
    }

    registreraPaborjadResa(omrade) {
        this._pendingTravelOmrade = omrade || null;
    }

    hanteraRumslut(omradeNamn, avklarat) {
        const pending = this._pendingTravelOmrade;
        const fallback = this.hamtaOmradeMedNamn(omradeNamn);
        const target = pending && (!omradeNamn || pending.namn === omradeNamn) ? pending : fallback;

        if (avklarat && target && (target === this.aktuelltOmrade || this.kanGaTillOmrade(target))) {
            this.sattAktuelltOmrade(target);
        } else if (this.aktuelltOmrade) {
            this.sattValtOmrade(this.aktuelltOmrade);
        }

        this._pendingTravelOmrade = null;
    }

    visa(startOmradeNamn) {
        this.visas = true;
        const fromPlayer = this.hamtaSpelarensKartposition();
        const fromStart = this.hamtaOmradeMedNamn(startOmradeNamn);
        const fallback = this.omraden.length > 0 ? this.omraden[Math.floor(this.omraden.length / 2)] : null;
        const aktuellt = this.aktuelltOmrade || fromPlayer || fromStart || fallback;
        if (aktuellt) {
            this.sattAktuelltOmrade(aktuellt);
        }
    }

    dolj() {
        this.visas = false;
    }

    rita() {
        if (!this.visas) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        if (this.bildLaddad) {
            ctx.drawImage(this.bild, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        this.ritaOmraden();
        this.ritaSpelare();
        this.ritaRunaRIkon();
        this.ritaIntegrieringspunkter();
        this.ritaMeddelande();
        this.ritaTillbakaTips();

    }

    hamtaRunaRIkonRect() {
        if (typeof window === 'undefined' || !window._runaRActivated) return null;
        if (!this.aktuelltOmrade || !this.aktuelltOmrade.namn || !String(this.aktuelltOmrade.namn).toLowerCase().startsWith('sjöfart')) return null;
        const ikonStorlek = 108;
        return { x: 16, y: this.canvas.height - ikonStorlek - 16, w: ikonStorlek, h: ikonStorlek };
    }

    ritaOmraden() {
        const ctx = this.ctx;
        if (!this.aktuelltOmrade) return;
        for (const omrade of this.omraden) {
            if (omrade === this.aktuelltOmrade) continue;
            const can = this.kanGaTillOmrade(omrade);

            if (can) {
                ctx.save();
                const radX = omrade.radie;
                const radY = omrade.radie * 0.6;
                const gradient = ctx.createRadialGradient(omrade.x, omrade.y, 0, omrade.x, omrade.y, radX);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
                gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.22)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(omrade.x, omrade.y, radX, radY, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                continue;
            }

            // If area is a sjöfartsruta but not reachable, draw a locked indicator instead
            if (omrade.namn && String(omrade.namn).toLowerCase().startsWith('sjöfart')) {
                ctx.save();
                const radX = omrade.radie * 0.9;
                const radY = omrade.radie * 0.5;
                ctx.fillStyle = 'rgba(80,120,200,0.22)';
                ctx.beginPath(); ctx.ellipse(omrade.x, omrade.y, radX, radY, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(80,120,200,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(omrade.x, omrade.y, radX, radY, 0, 0, Math.PI * 2); ctx.stroke();
                // lock icon removed — background already indicates locked state
                ctx.restore();
            }
        }
    }

    kanGaTillOmrade(omrade) {
        if (!this.aktuelltOmrade || !omrade || omrade === this.aktuelltOmrade) return false;
        return this.omradeInomRiktning(omrade, 'upp')
            || this.omradeInomRiktning(omrade, 'ner')
            || this.omradeInomRiktning(omrade, 'vanster')
            || this.omradeInomRiktning(omrade, 'hoger');
    }

    omradeInomRiktning(omrade, riktning) {
        if (!this.aktuelltOmrade) return false;
        const dx = omrade.x - this.aktuelltOmrade.x;
        const dy = omrade.y - this.aktuelltOmrade.y;

        if (riktning === 'upp' && dy >= 0) return false;
        if (riktning === 'ner' && dy <= 0) return false;
        if (riktning === 'vanster' && dx >= 0) return false;
        if (riktning === 'hoger' && dx <= 0) return false;

        const maxVinkel = Math.PI / 4;
        let vinkel = 0;
        if (riktning === 'hoger') vinkel = Math.abs(Math.atan2(dy, dx));
        if (riktning === 'vanster') vinkel = Math.abs(Math.atan2(dy, -dx));
        if (riktning === 'ner') vinkel = Math.abs(Math.atan2(dx, dy));
        if (riktning === 'upp') vinkel = Math.abs(Math.atan2(dx, -dy));
        if (vinkel > maxVinkel) return false;

        const avstand = Math.sqrt(dx * dx + dy * dy);
        const maxAvstand = (riktning === 'upp' || riktning === 'ner')
            ? this.maxStegAvstandVertikalt
            : this.maxStegAvstandSidled;
        return avstand <= maxAvstand;
    }

    ritaSpelare() {
        if (!this.aktuelltOmrade) return;

        const spelare = this.hamtaSpelare();
        if (this.valtOmrade && this.valtOmrade !== this.aktuelltOmrade) {
            this.ritaResvag(this.aktuelltOmrade, this.valtOmrade);
            this.ritaSpelarePaOmrade(this.aktuelltOmrade, spelare, 0.35, false);
            this.ritaSpelarePaOmrade(this.valtOmrade, spelare, 1, true);
            return;
        }

        this.ritaSpelarePaOmrade(this.aktuelltOmrade, spelare, 1, false);
    }

    ritaSpelarePaOmrade(omrade, spelare, alpha = 1, arDestination = false) {
        if (!omrade) return;

        const ctx = this.ctx;
        const x = omrade.x;
        const y = omrade.y;

        if (spelare && spelare.sprite && spelare.sprite.complete && spelare.sprite.naturalWidth > 0) {
            const targetSize = 40;
            const maxDim = Math.max(spelare.sprite.naturalWidth, spelare.sprite.naturalHeight);
            const scale = maxDim > 0 ? targetSize / maxDim : 1;
            const drawW = Math.max(1, Math.round(spelare.sprite.naturalWidth * scale));
            const drawH = Math.max(1, Math.round(spelare.sprite.naturalHeight * scale));
            const drawX = x - drawW / 2;
            const drawY = y - drawH / 2 - 12;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.imageSmoothingEnabled = false;
            if (arDestination) {
                ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
                ctx.shadowBlur = 12;
            }
            ctx.drawImage(spelare.sprite, drawX, drawY, drawW, drawH);
            ctx.restore();
            return;
        }

        const radie = omrade.radie * 0.3;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = arDestination ? '#ffffff' : '#00ff88';
        ctx.beginPath();
        ctx.arc(x, y, radie, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radie, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    ritaResvag(franOmrade, tillOmrade) {
        if (!franOmrade || !tillOmrade) return;

        const ctx = this.ctx;
        const dx = tillOmrade.x - franOmrade.x;
        const dy = tillOmrade.y - franOmrade.y;
        const langd = Math.sqrt(dx * dx + dy * dy);
        if (langd <= 0) return;

        const ux = dx / langd;
        const uy = dy / langd;
        const startX = franOmrade.x + ux * 18;
        const startY = franOmrade.y + uy * 18;
        const endX = tillOmrade.x - ux * 18;
        const endY = tillOmrade.y - uy * 18;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        const pilStorlek = 10;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - ux * pilStorlek - uy * (pilStorlek * 0.7), endY - uy * pilStorlek + ux * (pilStorlek * 0.7));
        ctx.lineTo(endX - ux * pilStorlek + uy * (pilStorlek * 0.7), endY - uy * pilStorlek - ux * (pilStorlek * 0.7));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ritaRunaRIkon() {
        try {
            const rect = this.hamtaRunaRIkonRect();
            this._runaRIkonRect = rect;
            if (!rect) return;

            const ctx = this.ctx;
            const ikonStorlek = rect.w;
            const boxX = rect.x;
            const boxY = rect.y;

            ctx.save();
            const anvandHoverIkon = this._runaRIkonHover && this.runaRHoverIkonLaddad && this.runaRHoverIkon.complete && this.runaRHoverIkon.naturalWidth > 0;
            const ikonBild = anvandHoverIkon ? this.runaRHoverIkon : this.runaRIkon;
            const ikonLaddad = anvandHoverIkon || (this.runaRIkonLaddad && this.runaRIkon.complete && this.runaRIkon.naturalWidth > 0);
            if (ikonLaddad) {
                ctx.drawImage(ikonBild, boxX, boxY, ikonStorlek, ikonStorlek);
            } else {
                ctx.fillStyle = '#00ff88';
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('R', boxX + ikonStorlek / 2, boxY + ikonStorlek / 2);
            }

            ctx.restore();
        } catch (e) {}
    }

    ritaIntegrieringspunkter() {
        // Integration points hidden for now
        return;
        // const ctx = this.ctx;

        for (const punkt of this.integreringspunkter) {
            // Rita cirkel
            ctx.fillStyle = punkt.farg;
            ctx.beginPath();
            ctx.arc(punkt.x, punkt.y, punkt.radie, 0, Math.PI * 2);
            ctx.fill();

            // Rita kant
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(punkt.x, punkt.y, punkt.radie, 0, Math.PI * 2);
            ctx.stroke();

            // Rita namn
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(punkt.namn, punkt.x, punkt.y);
        }
    }

    ritaTillbakaTips() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        // Instruktioner
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Klicka på en upplyst ruta eller använd piltangenter för att välja nästa steg', canvas.width / 2, canvas.height - 18);
        ctx.fillText('Tryck Enter eller E för att gå till markerad ruta', canvas.width / 2, canvas.height - 38);
        // removed: hint for ESC (back) to reduce on-screen text
        // removed: hint for jumping to nearest sjöfartsruta (Enter now does this when standing on one)

    }

    flyttaTillNarmstaSjofart() {
        if (!this.aktuelltOmrade) return;
        const name = this.aktuelltOmrade.namn || '';
        if (!name.toLowerCase().startsWith('sjöfart')) {
            this.visaMeddelande('Du måste stå på en sjöfartsruta för att hoppa till nästa');
            return;
        }

        const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
        if (!this.harTillgangTillSjofart()) {
            this.visaMeddelande('Du måste äga och placera ett skepp i din flotta för att färdas till sjöfartsrutor');
            return;
        }

        let nearest = null;
        let bestDist = Infinity;
        for (const o of this.omraden) {
            if (!o.namn || String(o.namn).toLowerCase().indexOf('sjöfart') !== 0) continue;
            if (o === this.aktuelltOmrade) continue; // must move to a different sjöfartsruta
            const dx = o.x - this.aktuelltOmrade.x;
            const dy = o.y - this.aktuelltOmrade.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestDist) { bestDist = d; nearest = o; }
        }
        if (nearest) {
            this.sattAktuelltOmrade(nearest);
        } else {
            this.visaMeddelande('Ingen annan sjöfartsruta hittades');
        }
    }

    visaMeddelande(text, seconds) {
        this.meddelande = String(text || '');
        const secs = (typeof seconds === 'number' && seconds > 0) ? Math.max(5, seconds) : 5;
        this.meddelandeTid = Math.max(1, Math.round(secs * 60)); // default 5 seconds (60 FPS)
    }

    rensaMeddelanden() {
        this.meddelande = '';
        this.meddelandeTid = 0;
    }

    ritaMeddelande() {
        if (!this.meddelande || this.meddelandeTid <= 0) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        const alpha = Math.min(1, this.meddelandeTid / 30);

        // Font and alignment
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Wrap long text into multiple lines to fit within a max width
        const maxWidth = Math.max(200, Math.floor(canvas.width * 0.7));
        const words = String(this.meddelande).split(' ');
        const lines = [];
        let current = '';
        for (let i = 0; i < words.length; i++) {
            const w = words[i];
            const test = current ? (current + ' ' + w) : w;
            const wwidth = ctx.measureText(test).width;
            if (wwidth > maxWidth && current) {
                lines.push(current);
                current = w;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);

        const lineHeight = 28; // px, a bit larger than font for spacing
        const textHeight = lines.length * lineHeight;
        let maxLineWidth = 0;
        for (let i = 0; i < lines.length; i++) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(lines[i]).width);
        }
        const padding = 20;

        // Center box
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const boxWidth = maxLineWidth + padding * 2;
        const boxHeight = textHeight + padding * 2;
        const boxX = centerX - boxWidth / 2;
        const boxY = centerY - boxHeight / 2;

        // Draw background box
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Border
        ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw each line centered
        ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
        const startY = centerY - textHeight / 2 + lineHeight / 2;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], centerX, startY + i * lineHeight);
        }

        this.meddelandeTid--;
    }

    hanteraTangent(tangent) {
        if (!this.visas) return;

        if (tangent === 'Escape') {
            this.dolj();
            this.gaTillbaka();
        } else if (tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W') {
            this.flyttaTillNarmsteOmrade('upp');
        } else if (tangent === 'ArrowDown' || tangent === 's' || tangent === 'S') {
            this.flyttaTillNarmsteOmrade('ner');
        } else if (tangent === 'ArrowLeft' || tangent === 'a' || tangent === 'A') {
            this.flyttaTillNarmsteOmrade('vanster');
        } else if (tangent === 'ArrowRight' || tangent === 'd' || tangent === 'D') {
            this.flyttaTillNarmsteOmrade('hoger');
        } else if (tangent === 'Enter' || tangent === 'e' || tangent === 'E') {
            console.log('Kartan: activation key pressed, valtOmrade=', (this.valtOmrade && this.valtOmrade.namn) || null);
            if (!this.valtOmrade) return;
            // If on a Sjöfart tile, and player has placed fleet, move to the next sjöfartsruta.
            // If a neighboring Sjöfart tile is selected, move onto it directly.
            if (this.valtOmrade.namn && String(this.valtOmrade.namn).toLowerCase().startsWith('sjöfart')) {
                if (this.harTillgangTillSjofart() && this.valtOmrade === this.aktuelltOmrade) {
                    this.flyttaTillNarmstaSjofart();
                    return;
                }
                if (this.harTillgangTillSjofart() && this.valtOmrade !== this.aktuelltOmrade && this.kanGaTillOmrade(this.valtOmrade)) {
                    this.sattAktuelltOmrade(this.valtOmrade);
                    this._pendingTravelOmrade = null;
                    return;
                }
                this.visaMeddelande('Du måste äga och placera ett skepp i din flotta för att färdas här');
                return;
            }

            if (this.valtOmrade !== this.aktuelltOmrade && !this.kanGaTillOmrade(this.valtOmrade)) {
                this.visaMeddelande('Du kan bara resa till de upplysta rutorna');
                return;
            }

            this.registreraPaborjadResa(this.valtOmrade);

            if (this.valtOmrade && this.valtOmrade.namn === 'Bifrost') {
                this._pendingTravelOmrade = null;
                this.visaMeddelande('Kraften i Bifrost har bleknat. Återställ den i Alvheim');
                return;
            }

            if (this.valtOmrade && this.valtOmrade.namn === 'Gjallarbron') {
                try {
                    if (typeof this.gaTillPlats === 'function') {
                        this.gaTillPlats('Gjallarbron');
                        return;
                    }
                } catch (e) {}
                this.visaMeddelande('Gjallarbron är inte tillgänglig');
                return;
            }

            if (this.valtOmrade && this.valtOmrade.namn.startsWith('Stigen')) {
                this.gaTillStigen(this.valtOmrade.namn);
            } else if (this.valtOmrade && this.valtOmrade.namn === 'Banditläger') {
                // Enter the Bandit room via provided callback (handled by game.js)
                try {
                    if (typeof this.gaTillBandit === 'function') {
                        this.gaTillBandit();
                        return;
                    }
                } catch (e) {
                    // fall through to message below
                }
                this.visaMeddelande('Banditlägret är inte tillgängligt');
                return;
            } else if (this.valtOmrade && this.valtOmrade.namn === 'Fyrmille') {
                this.sattAktuelltOmrade(this.valtOmrade);
                this._pendingTravelOmrade = null;
                this.gaTillPlats('Fyrmille');
            } else if (this.valtOmrade && this.valtOmrade.namn === 'Skogen') {
                // Forward Skogen selection to the game-level handler so it can
                // decide which Skogen-variant (Skogen3/Skogen5) to open.
                try {
                    if (typeof this.gaTillPlats === 'function') {
                        this.gaTillPlats('Skogen');
                        return;
                    }
                } catch (e) {}
            } else if (this.valtOmrade && this.valtOmrade.namn === 'Runa-R') {
                const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
                try {
                    if (window._runaRActivated) {
                        this._pendingTravelOmrade = null;
                        this.visaMeddelande('Denna runa är redan aktiverad.');
                        return;
                    }
                } catch (e) {}
                // Show the discovery message and apply the rune immediately
                try {
                    this.sattAktuelltOmrade(this.valtOmrade);
                    this._pendingTravelOmrade = null;
                    this.visaMeddelande('Du har nu hittat runan Raidho! Du kan nu färdas till andra världar från sjöfartsrutorna!');
                    try { if (window.runor && typeof window.runor.applyRune === 'function') window.runor.applyRune('runa_r', spelare); } catch (e) {}
                    try { window._runaRActivated = true; } catch (e) {}
                    return;
                } catch (e) {}
            } else if (this.valtOmrade && this.valtOmrade.namn.startsWith('Gestalt')) {
                this.gaTillGestalt(this.valtOmrade.namn);
            } else if (this.valtOmrade && this.valtOmrade.namn === 'Jaktmarken') {
                this.gaTillJaktmarken();
            } else if (this.valtOmrade && this.valtOmrade.namn.startsWith('Chans')) {
                this.gaTillChansrutan(this.valtOmrade.namn);
            }
        }
        
    }

    flyttaTillNarmsteOmrade(riktning) {
        if (!this.valtOmrade) {
            // Om ingen område är vald, välj den första
            this.sattValtOmrade(this.aktuelltOmrade || this.omraden[0]);
            return;
        }

        if (!this.aktuelltOmrade) {
            return;
        }

        const utgangsOmrade = this.valtOmrade || this.aktuelltOmrade;

        let narmsteOmrade = null;
        let narmsteAvstand = Infinity;
        const maxVinkel = Math.PI / 4; // 45 grader kon
        const arIRiktning = (dx, dy) => {
            if (riktning === 'upp' && dy >= 0) return false;
            if (riktning === 'ner' && dy <= 0) return false;
            if (riktning === 'vanster' && dx >= 0) return false;
            if (riktning === 'hoger' && dx <= 0) return false;

            let vinkel = 0;
            if (riktning === 'hoger') vinkel = Math.abs(Math.atan2(dy, dx));
            if (riktning === 'vanster') vinkel = Math.abs(Math.atan2(dy, -dx));
            if (riktning === 'ner') vinkel = Math.abs(Math.atan2(dx, dy));
            if (riktning === 'upp') vinkel = Math.abs(Math.atan2(dx, -dy));
            if (vinkel > maxVinkel) return false;

            const avstand = Math.sqrt(dx * dx + dy * dy);
            const maxAvstand = (riktning === 'upp' || riktning === 'ner')
                ? this.maxStegAvstandVertikalt
                : this.maxStegAvstandSidled;
            return avstand <= maxAvstand;
        };

        for (const omrade of this.omraden) {
            if (omrade === utgangsOmrade) continue;
            if (!this.kanGaTillOmrade(omrade)) continue;

            const dx = omrade.x - utgangsOmrade.x;
            const dy = omrade.y - utgangsOmrade.y;
            if (!arIRiktning(dx, dy)) continue;

            const avstand = Math.sqrt(dx * dx + dy * dy);
            if (avstand < narmsteAvstand) {
                narmsteAvstand = avstand;
                narmsteOmrade = omrade;
            }
        }

        if (narmsteOmrade) {
            this.sattValtOmrade(narmsteOmrade);
            return;
        }

        if (this.valtOmrade && this.aktuelltOmrade && this.valtOmrade !== this.aktuelltOmrade) {
            const tillbakaDx = this.aktuelltOmrade.x - this.valtOmrade.x;
            const tillbakaDy = this.aktuelltOmrade.y - this.valtOmrade.y;
            if (arIRiktning(tillbakaDx, tillbakaDy)) {
                this.sattValtOmrade(this.aktuelltOmrade);
            }
        }
    }

    hanteraKlick(musX, musY) {
        if (!this.visas) return;

        const ikonRect = this.hamtaRunaRIkonRect();
        if (ikonRect) {
            const inomIkon = musX >= ikonRect.x && musX <= ikonRect.x + ikonRect.w && musY >= ikonRect.y && musY <= ikonRect.y + ikonRect.h;
            if (inomIkon) {
                if (typeof this.gaTillVarldskartan === 'function') this.gaTillVarldskartan();
                return;
            }
        }

        // Kontrollera om klicket är på ett område
        for (const omrade of this.omraden) {
            const dx = musX - omrade.x;
            const dy = musY - omrade.y;
            const avstand = Math.sqrt(dx * dx + (dy / 0.6) * (dy / 0.6));

            if (avstand <= omrade.radie) {
                this.sattValtOmrade(omrade);
                return;
            }
        }
    }

    hanteraMusMove(musX, musY) {
        if (!this.visas) return;
        const ikonRect = this.hamtaRunaRIkonRect();
        this._runaRIkonHover = !!(ikonRect
            && musX >= ikonRect.x
            && musX <= ikonRect.x + ikonRect.w
            && musY >= ikonRect.y
            && musY <= ikonRect.y + ikonRect.h);
    }

    uppdatera() {
        // Kallas varje frame för eventuella uppdateringar
    }
}
