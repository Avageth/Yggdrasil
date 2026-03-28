class Spelare {
    constructor(namn, klass, startX, startY) {
        this.namn = namn;
        this.klass = klass;
        this.nivå = 1;
        this.liv = 3;
        this.maxLiv = 8;
        this.arDod = false;
        this.gameOverAktiv = false;
        this._dodRegistrerad = false;
        this._energi = 3;
        this._maxEnergi = 8;
        Object.defineProperty(this, 'energi', {
            configurable: true,
            enumerable: true,
            get: () => this._energi,
            set: (value) => {
                this._energi = Number.isFinite(value) ? value : (Number(value) || 0);
                this.normaliseraEnergi();
            }
        });
        Object.defineProperty(this, 'maxEnergi', {
            configurable: true,
            enumerable: true,
            get: () => this._maxEnergi,
            set: (value) => {
                this._maxEnergi = Number.isFinite(value) ? value : (Number(value) || 0);
                this.normaliseraEnergi();
            }
        });
        Object.defineProperty(this, 'mana', {
            configurable: true,
            enumerable: false,
            get: () => this.energi,
            set: (value) => { this.energi = value; }
        });
        Object.defineProperty(this, 'maxMana', {
            configurable: true,
            enumerable: false,
            get: () => this.maxEnergi,
            set: (value) => { this.maxEnergi = value; }
        });
        this.styrka = klass.stats.styrka;
        this.konstruktion = klass.stats.konstruktion;
        this.special = klass.stats.special;
        this.krav = new Krav();
        this.x = startX;
        this.y = startY;
        this.hastighet = 3;
        this.storlek = 25; // Kollisionsradie
        this.riktning = 'höger'; // 'höger' eller 'vänster'

        // Element-egenskaper
        this.skadaElement = 'fysisk'; // Vilket element spelaren gör skada i
        this.motstånd = {
            fysisk: 0,
            eld: 0,
            magi: 0
        };

        // Spelarens pengar (valuta)
        this.pengar = {
            koppar: 0,
            silver: 0,
            guld: 0
        };

        this.aktuellKartaOmrade = null;
        this.bonusKallor = {
            hus: {},
            skepp: {}
        };
        this.bonusEgenskaper = {};
        this._synkarBonusStats = false;
        
        // Prestations-statistik
        this.prestationer = {
            fiendesBesegrade: 0,
            striderVunna: 0,
            striderForlorade: 0,
            antalDodsfall: 0,
            lyckadeJakter: 0,
            totaltGuldSamlat: 0,
            foremalPlockade: 0
        };
        this.sakerstallPrestationsfalt();
        
        // Tangentbordstillstånd
        this.tangenter = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.arIrorelse = false;
        this.visarGangAnimation = false;
        
        // Initiera utrustning
        this.utrustning = new Utrustning(this);
        
        // Ladda spelarens klassbild
        this.sprite = new Image();
        const klassNamn = klass.namn.toLowerCase();
        const normaliseraFilnamn = (namn) => String(namn || '')
            .replace(/å/gi, 'a')
            .replace(/ä/gi, 'a')
            .replace(/ö/gi, 'o')
            .replace(/é/gi, 'e');
        const klassFilnamn = normaliseraFilnamn(klass.namn || '');
        const klassFilnamnKapitaliserad = klassFilnamn.charAt(0).toUpperCase() + klassFilnamn.slice(1).toLowerCase();
        const spriteKandidater = [
            klass.spriteStig || null,
            'assets/klasser/' + klassFilnamnKapitaliserad + '.png',
            'assets/klasser/' + klassFilnamn.toLowerCase() + '.png',
            klass.bildStig || null
        ].filter((stig, index, arr) => stig && arr.indexOf(stig) === index);
        this._spriteKandidatIndex = 0;
        const laddaNastaSprite = () => {
            if (this._spriteKandidatIndex >= spriteKandidater.length) {
                console.log('Kunde inte ladda sprite för ' + klassNamn);
                return;
            }
            this.sprite.src = encodeURI(spriteKandidater[this._spriteKandidatIndex++]);
        };
        laddaNastaSprite();
        this.sprite.onload = () => {
            console.log('Spelare-sprite laddad: ' + klassNamn);
        };
        this.sprite.onerror = () => {
            laddaNastaSprite();
        };

        this.normaliseraEnergi();
    }

    normaliseraEnergi() {
        const maxEnergi = Number.isFinite(this._maxEnergi) ? this._maxEnergi : (Number(this._maxEnergi) || 0);
        const energi = Number.isFinite(this._energi) ? this._energi : (Number(this._energi) || 0);
        this._maxEnergi = Math.max(0, Math.floor(maxEnergi));
        this._energi = Math.max(0, Math.min(this._maxEnergi, Math.floor(energi)));
        return this._energi;
    }

    sakerstallPrestationsfalt() {
        if (!this.prestationer || typeof this.prestationer !== 'object') {
            this.prestationer = {};
        }

        const standardFalt = {
            fiendesBesegrade: 0,
            striderVunna: 0,
            striderForlorade: 0,
            antalDodsfall: 0,
            lyckadeJakter: 0,
            totaltGuldSamlat: 0,
            foremalPlockade: 0
        };

        for (const [nyckel, standardVarde] of Object.entries(standardFalt)) {
            if (typeof this.prestationer[nyckel] !== 'number') {
                this.prestationer[nyckel] = standardVarde;
            }
        }

        if (!this.prestationer.killsByType || typeof this.prestationer.killsByType !== 'object') {
            this.prestationer.killsByType = {};
        }

        if (!this.prestationer.interaktioner || typeof this.prestationer.interaktioner !== 'object') {
            this.prestationer.interaktioner = {};
        }

        const standardInteraktioner = {
            hjalpareMoten: 0,
            lognareMoten: 0,
            behovAvHjalpHjalpta: 0,
            behovAvHjalpForradda: 0
        };

        for (const [nyckel, standardVarde] of Object.entries(standardInteraktioner)) {
            if (typeof this.prestationer.interaktioner[nyckel] !== 'number') {
                this.prestationer.interaktioner[nyckel] = standardVarde;
            }
        }

        return this.prestationer;
    }

    registreraStridsresultat({ vann = false, forlorade = false } = {}) {
        this.sakerstallPrestationsfalt();
        if (vann) {
            this.prestationer.striderVunna = (this.prestationer.striderVunna || 0) + 1;
        }
        if (forlorade) {
            this.prestationer.striderForlorade = (this.prestationer.striderForlorade || 0) + 1;
        }
    }

    registreraPlockadeForemal(antal = 1) {
        this.sakerstallPrestationsfalt();
        const numerisktAntal = Math.max(0, Number.isFinite(antal) ? Math.floor(antal) : 0);
        if (numerisktAntal > 0) {
            this.prestationer.foremalPlockade = (this.prestationer.foremalPlockade || 0) + numerisktAntal;
        }
    }

    registreraIntjanadePengar(pengarObj = {}) {
        this.sakerstallPrestationsfalt();
        const koppar = Number(pengarObj.koppar) || 0;
        const silver = Number(pengarObj.silver) || 0;
        const guld = Number(pengarObj.guld) || 0;
        const totaltKoppar = Math.max(0, koppar + (silver * 10) + (guld * 100));

        if (totaltKoppar > 0) {
            this.prestationer.totaltGuldSamlat = (this.prestationer.totaltGuldSamlat || 0) + totaltKoppar;
        }

        return totaltKoppar;
    }

    laggTillPengar(pengarObj = {}, { raknaSomIntakt = false, normalisera = true } = {}) {
        if (!this.pengar || typeof this.pengar !== 'object') {
            this.pengar = { koppar: 0, silver: 0, guld: 0 };
        }

        const koppar = Number(pengarObj.koppar) || 0;
        const silver = Number(pengarObj.silver) || 0;
        const guld = Number(pengarObj.guld) || 0;

        this.pengar.koppar = (this.pengar.koppar || 0) + koppar;
        this.pengar.silver = (this.pengar.silver || 0) + silver;
        this.pengar.guld = (this.pengar.guld || 0) + guld;

        if (raknaSomIntakt) {
            this.registreraIntjanadePengar({ koppar, silver, guld });
        }

        if (normalisera) {
            this.normaliseraPengar();
        }

        return this.pengar;
    }

    arPaSjofartsruta() {
        const omrade = this.aktuellKartaOmrade;
        return typeof omrade === 'string' && omrade.toLowerCase().startsWith('sjöfart');
    }

    normaliseraPengar() {
        if (!this.pengar || typeof this.pengar !== 'object') {
            this.pengar = { koppar: 0, silver: 0, guld: 0 };
            return this.pengar;
        }

        const totalKoppar = Math.max(
            0,
            (this.pengar.koppar || 0)
            + (this.pengar.silver || 0) * 10
            + (this.pengar.guld || 0) * 100
        );

        const guld = Math.floor(totalKoppar / 100);
        const kvarEfterGuld = totalKoppar % 100;
        const silver = Math.floor(kvarEfterGuld / 10);
        const koppar = kvarEfterGuld % 10;

        this.pengar.guld = guld;
        this.pengar.silver = silver;
        this.pengar.koppar = koppar;
        return this.pengar;
    }

    rensaInput() {
        if (!this.tangenter) return;
        this.tangenter.up = false;
        this.tangenter.down = false;
        this.tangenter.left = false;
        this.tangenter.right = false;
        this.arIrorelse = false;
        this.visarGangAnimation = false;
    }

    synkroniseraLivstatus() {
        const liv = typeof this.liv === 'number' ? this.liv : 0;
        if (liv <= 0) {
            this.liv = 0;
            this.arDod = true;
            this.gameOverAktiv = true;
            this.rensaInput();
            return true;
        }

        this.arDod = false;
        return false;
    }

    taSkada(antal = 1, options = {}) {
        const skada = Math.max(0, Number.isFinite(antal) ? antal : 0);
        const undvikbar = options.undvikbar !== false;

        if (skada > 0 && undvikbar && this.utrustning && typeof this.utrustning.rullaVapenPassivForsvar === 'function') {
            const forsvarsEffekt = this.utrustning.rullaVapenPassivForsvar();
            if (forsvarsEffekt.undvekSkada) {
                const passiv = forsvarsEffekt.passiv || null;
                const meddelande = passiv
                    ? `${passiv.namn}! Du undvek skadan med Pilbågens ability.`
                    : 'Du undvek skadan.';
                this.senasteSkadeHandelse = {
                    togSkada: false,
                    undvekSkada: true,
                    skada: 0,
                    passiv,
                    meddelande,
                    dog: false
                };
                return this.senasteSkadeHandelse;
            }
        }

        this.liv = Math.max(0, (typeof this.liv === 'number' ? this.liv : 0) - skada);
        const dog = this.synkroniseraLivstatus();
        this.senasteSkadeHandelse = {
            togSkada: skada > 0,
            undvekSkada: false,
            skada,
            passiv: null,
            meddelande: '',
            dog
        };
        if (skada > 0 && !options.tystLjud && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
            window.spelaStandardLjud('skada');
        }
        return this.senasteSkadeHandelse;
    }

    forloraLiv(antal = 1, options = {}) {
        const resultat = this.taSkada(antal, options);
        return !!(resultat && resultat.dog);
    }

    aterstallEfterDod(liv = 3, energi = 3) {
        this.liv = liv;
        this.maxLiv = Math.max(this.maxLiv || 0, liv);
        this.energi = energi;
        this.maxEnergi = Math.max(this.maxEnergi || 0, energi);
        this.normaliseraEnergi();
        this.arDod = false;
        this.gameOverAktiv = false;
        this._dodRegistrerad = false;
        this.rensaInput();
    }

    uppdateraAktivaBonusEgenskaper() {
        if (!this.bonusKallor || typeof this.bonusKallor !== 'object') {
            this.bonusKallor = { hus: {}, skepp: {} };
        }

        if (
            this.bonusEgenskaper
            && Object.keys(this.bonusEgenskaper).length > 0
            && (!this.bonusKallor.hus || Object.keys(this.bonusKallor.hus).length === 0)
            && (!this.bonusKallor.skepp || Object.keys(this.bonusKallor.skepp).length === 0)
        ) {
            this.bonusKallor.hus = JSON.parse(JSON.stringify(this.bonusEgenskaper));
        }

        const sammanlagdaBonusar = {};
        const laggTillBonusar = (mal, kalla) => {
            if (!kalla || typeof kalla !== 'object') return;
            for (const nyckel in kalla) {
                if (!Object.prototype.hasOwnProperty.call(kalla, nyckel)) continue;
                const varde = kalla[nyckel];
                if (varde && typeof varde === 'object' && !Array.isArray(varde)) {
                    if (!mal[nyckel] || typeof mal[nyckel] !== 'object') mal[nyckel] = {};
                    laggTillBonusar(mal[nyckel], varde);
                } else if (typeof varde === 'number') {
                    mal[nyckel] = (mal[nyckel] || 0) + varde;
                }
            }
        };

        if (this.arPaSjofartsruta()) {
            laggTillBonusar(sammanlagdaBonusar, this.bonusKallor.skepp);
        } else {
            laggTillBonusar(sammanlagdaBonusar, this.bonusKallor.hus);
        }

        this.bonusEgenskaper = sammanlagdaBonusar;

        if (!this._synkarBonusStats && this.utrustning && typeof this.utrustning.uppdateraStats === 'function') {
            this._synkarBonusStats = true;
            try {
                this.utrustning.uppdateraStats();
            } finally {
                this._synkarBonusStats = false;
            }
        }

        return this.bonusEgenskaper;
    }
    
    tangentNed(tangent) {
        if (this.arDod || this.gameOverAktiv) return;
        switch(tangent) {
            case 'w':
            case 'W':
            case 'ArrowUp':
                this.tangenter.up = true;
                break;
            case 's':
            case 'S':
            case 'ArrowDown':
                this.tangenter.down = true;
                break;
            case 'a':
            case 'A':
            case 'ArrowLeft':
                this.tangenter.left = true;
                break;
            case 'd':
            case 'D':
            case 'ArrowRight':
                this.tangenter.right = true;
                break;
        }
    }
    
    tangentUpp(tangent) {
        if (this.arDod || this.gameOverAktiv) return;
        switch(tangent) {
            case 'w':
            case 'W':
            case 'ArrowUp':
                this.tangenter.up = false;
                break;
            case 's':
            case 'S':
            case 'ArrowDown':
                this.tangenter.down = false;
                break;
            case 'a':
            case 'A':
            case 'ArrowLeft':
                this.tangenter.left = false;
                break;
            case 'd':
            case 'D':
            case 'ArrowRight':
                this.tangenter.right = false;
                break;
        }
    }
    
    uppdateraRorelse(barriarer) {
        if (this.arDod || this.gameOverAktiv) {
            this.rensaInput();
            this.arIrorelse = false;
            if (animationer) {
                animationer.uppdateraAnimering(this, false);
            }
            return;
        }

        // Spara gammal position
        const gammalX = this.x;
        const gammalY = this.y;
        
        // Kontrollera om spelaren rör sig
        let rorelse = false;
        
        // Compute desired move vector
        let dx = 0;
        let dy = 0;
        if (this.tangenter.left) { dx -= this.hastighet; this.riktning = 'vänster'; rorelse = true; }
        if (this.tangenter.right) { dx += this.hastighet; this.riktning = 'höger'; rorelse = true; }
        if (this.tangenter.up) { dy -= this.hastighet; rorelse = true; }
        if (this.tangenter.down) { dy += this.hastighet; rorelse = true; }

        // Try full vector move first (best-case, keeps diagonal movement)
        if (dx !== 0 || dy !== 0) {
            if (this._tryMoveVector(dx, dy, barriarer)) {
                // moved successfully
            } else {
                // try axis-resolve to slide along one axis
                if (dx !== 0) this._tryMoveAxis('x', dx, barriarer);
                if (dy !== 0) this._tryMoveAxis('y', dy, barriarer);
                // if still didn't move, attempt tangent slide for oval collisions
                if (this.x === gammalX && this.y === gammalY) {
                    const col = this.hittarKollidering(barriarer);
                    if (col && col.typ === 'oval') {
                        // compute tangent at nearest point and try sliding along it
                        const cx = (col.x || 0) + (col.bredd || 0) / 2;
                        const cy = (col.y || 0) + (col.hojd || 0) / 2;
                        const rot = (col.rotation || 0) * Math.PI / 180;
                        // vector from center to player
                        const relX = this.x - cx;
                        const relY = this.y - cy;
                        // rotate into ellipse-local coords
                        const cosR = Math.cos(-rot);
                        const sinR = Math.sin(-rot);
                        const localX = cosR * relX - sinR * relY;
                        const localY = sinR * relX + cosR * relY;
                        // tangent in local coords roughly (-y, x)
                        let tx = -localY;
                        let ty = localX;
                        // rotate tangent back
                        const cosF = Math.cos(rot);
                        const sinF = Math.sin(rot);
                        const worldTx = cosF * tx - sinF * ty;
                        const worldTy = sinF * tx + cosF * ty;
                        // normalize
                        const len = Math.hypot(worldTx, worldTy) || 1;
                        const stepX = (worldTx / len) * this.hastighet;
                        const stepY = (worldTy / len) * this.hastighet;
                        // choose direction consistent with desired movement
                        const dot = stepX * (dx || 0) + stepY * (dy || 0);
                        const dir = dot >= 0 ? 1 : -1;
                        // try sliding along tangent with decreasing magnitudes
                        for (let scale = 1; scale >= 0.125; scale /= 2) {
                            if (this._tryMoveVector(dir * stepX * scale, dir * stepY * scale, barriarer)) break;
                        }
                    }
                }
            }
        }

        this.arIrorelse = this.x !== gammalX || this.y !== gammalY;
        
        // Uppdatera animation baserat på rörelse
        if (animationer) {
            animationer.uppdateraAnimering(this, this.arIrorelse || rorelse);
        }
    }

    _tryMoveAxis(axis, delta, barriarer) {
        // Attempt to move along one axis by delta. If collision, reduce delta
        // progressively to allow sliding along obstacles instead of snapping back.
        const original = (axis === 'x') ? this.x : this.y;
        let remaining = delta;
        // Try progressively smaller steps (binary reduction) until movement fits
        for (let i = 0; i < 6; i++) {
            // Try full remaining step
            if (axis === 'x') this.x = original + remaining; else this.y = original + remaining;
            if (!this.kolliderar(barriarer)) return true;
            // reduce remaining step and try again
            remaining = remaining / 2;
        }
        // As a last resort, try tiny incremental steps in the sign direction
        const sign = delta > 0 ? 1 : -1;
        for (let step = Math.abs(delta) / 8; step > 0.25; step = step / 2) {
            if (axis === 'x') this.x = original + sign * step; else this.y = original + sign * step;
            if (!this.kolliderar(barriarer)) return true;
        }
        // Could not move along axis: revert
        if (axis === 'x') this.x = original; else this.y = original;
        return false;
    }

    _tryMoveVector(dx, dy, barriarer) {
        const origX = this.x;
        const origY = this.y;
        this.x = origX + dx;
        this.y = origY + dy;
        if (!this.kolliderar(barriarer)) return true;

        // Identify which barrier causes the collision at the attempted position
        let col = null;
        try {
            col = this.hittarKollidering(barriarer || []);
        } catch (e) { col = null; }

        // restore original position before attempting sliding
        this.x = origX;
        this.y = origY;

        // If blocked by a rotated rectangle, compute contact normal at attempted position
        try {
            if (col && (col.typ === 'rotated' || (col.rotation && col.rotation !== 0))) {
                const cx = col.cx || (col.x + (col.bredd || 0) / 2);
                const cy = col.cy || (col.y + (col.hojd || 0) / 2);
                const rot = (col.rotation || 0) * Math.PI / 180;

                // Transform attempted world position into barrier-local coordinates
                const relX = (origX + dx) - cx;
                const relY = (origY + dy) - cy;
                const cosR = Math.cos(-rot);
                const sinR = Math.sin(-rot);
                const localX = cosR * relX - sinR * relY;
                const localY = sinR * relX + cosR * relY;

                const hx = (col.bredd || 0) / 2;
                const hy = (col.hojd || 0) / 2;

                // Closest point on (possibly expanded) rectangle to the attempted local position
                const clampX = Math.max(-hx, Math.min(localX, hx));
                const clampY = Math.max(-hy, Math.min(localY, hy));

                // Local normal from rectangle to attempted point
                let nLocalX = localX - clampX;
                let nLocalY = localY - clampY;

                // If inside the rect (zero vector), pick shortest escape axis
                if (Math.abs(nLocalX) < 1e-6 && Math.abs(nLocalY) < 1e-6) {
                    const distX = hx - Math.abs(localX);
                    const distY = hy - Math.abs(localY);
                    if (distX < distY) {
                        nLocalX = (localX >= 0) ? 1 : -1;
                        nLocalY = 0;
                    } else {
                        nLocalX = 0;
                        nLocalY = (localY >= 0) ? 1 : -1;
                    }
                }

                // Rotate normal back to world coords
                const cosF = Math.cos(rot);
                const sinF = Math.sin(rot);
                const nWorldX = cosF * nLocalX - sinF * nLocalY;
                const nWorldY = sinF * nLocalX + cosF * nLocalY;

                // Tangent is perpendicular to normal
                const tX = -nWorldY;
                const tY = nWorldX;
                const tLen = Math.hypot(tX, tY) || 1;
                const ux = tX / tLen;
                const uy = tY / tLen;

                // Try sliding along tangent and nearby angles to avoid getting stuck on corners
                const proj = dx * ux + dy * uy;
                const desiredLen = Math.hypot(dx, dy) || 1;
                if (Math.abs(proj) > 0.001) {
                    const baseDir = (proj >= 0) ? 1 : -1;
                    const angles = [0, 15, -15, 30, -30, 45, -45].map(a => a * Math.PI / 180);
                    const tryScales = [1, 0.5, 0.25, 0.125];

                    const rotate = (vx, vy, a) => {
                        const c = Math.cos(a), s = Math.sin(a);
                        return [vx * c - vy * s, vx * s + vy * c];
                    };

                    for (const a of angles) {
                        const [rx, ry] = rotate(ux, uy, a);
                        for (const scale of tryScales) {
                            this.x = origX + rx * this.hastighet * baseDir * scale;
                            this.y = origY + ry * this.hastighet * baseDir * scale;
                            if (!this.kolliderar(barriarer)) return true;
                        }
                    }

                    // If still stuck, try small outward nudge away from the barrier normal
                    const nLen = Math.hypot(nWorldX, nWorldY) || 1;
                    const nx = nWorldX / nLen;
                    const ny = nWorldY / nLen;
                    // push slightly away from barrier and along tangent
                    const outwardScales = [0.5, 1];
                    for (const o of outwardScales) {
                        for (const a of [0, 15, -15].map(d => d * Math.PI / 180)) {
                            const [trx, tryy] = rotate(ux, uy, a);
                            this.x = origX + (trx * this.hastighet * 0.5) + (nx * this.hastighet * o);
                            this.y = origY + (tryy * this.hastighet * 0.5) + (ny * this.hastighet * o);
                            if (!this.kolliderar(barriarer)) return true;
                        }
                    }
                }
                // restore if sliding attempts failed
                this.x = origX;
                this.y = origY;
            }
        } catch (e) {}

        return false;
            // If blocked by a rotated rectangle, compute contact normal at attempted position
            try {
                if (col && (col.typ === 'rotated' || (col.rotation && col.rotation !== 0))) {
                    const cx = col.cx || (col.x + (col.bredd || 0) / 2);
                    const cy = col.cy || (col.y + (col.hojd || 0) / 2);
                    const rot = (col.rotation || 0) * Math.PI / 180;

                    // Transform attempted world position into barrier-local coordinates
                    const relX = (origX + dx) - cx;
                    const relY = (origY + dy) - cy;
                    const cosR = Math.cos(-rot);
                    const sinR = Math.sin(-rot);
                    const localX = cosR * relX - sinR * relY;
                    const localY = sinR * relX + cosR * relY;

                    const hx = (col.bredd || 0) / 2;
                    const hy = (col.hojd || 0) / 2;

                    // Closest point on (possibly expanded) rectangle to the attempted local position
                    const clampX = Math.max(-hx, Math.min(localX, hx));
                    const clampY = Math.max(-hy, Math.min(localY, hy));

                    // Local normal from rectangle to attempted point
                    let nLocalX = localX - clampX;
                    let nLocalY = localY - clampY;

                    // If inside the rect (zero vector), pick shortest escape axis
                    if (Math.abs(nLocalX) < 1e-6 && Math.abs(nLocalY) < 1e-6) {
                        const distX = hx - Math.abs(localX);
                        const distY = hy - Math.abs(localY);
                        if (distX < distY) {
                            nLocalX = (localX >= 0) ? 1 : -1;
                            nLocalY = 0;
                        } else {
                            nLocalX = 0;
                            nLocalY = (localY >= 0) ? 1 : -1;
                        }
                    }

                    // Rotate normal back to world coords
                    const cosF = Math.cos(rot);
                    const sinF = Math.sin(rot);
                    const nWorldX = cosF * nLocalX - sinF * nLocalY;
                    const nWorldY = sinF * nLocalX + cosF * nLocalY;

                    // Tangent is perpendicular to normal
                    const tX = -nWorldY;
                    const tY = nWorldX;
                    const tLen = Math.hypot(tX, tY) || 1;
                    const ux = tX / tLen;
                    const uy = tY / tLen;

                    // Project desired movement onto tangent direction (preserve sign)
                    const proj = dx * ux + dy * uy;
                    if (Math.abs(proj) > 0.001) {
                        const dir = proj >= 0 ? 1 : -1;
                        const stepX = ux * this.hastighet * dir;
                        const stepY = uy * this.hastighet * dir;
                        for (let scale = 1; scale >= 0.125; scale /= 2) {
                            this.x = origX + stepX * scale;
                            this.y = origY + stepY * scale;
                            if (!this.kolliderar(barriarer)) return true;
                        }
                    }
                    // restore if sliding attempts failed
                    this.x = origX;
                    this.y = origY;
                }
            } catch (e) {}

            return false;
    }

    hittarKollidering(barriarer) {
        for (let barriär of barriarer) {
            try {
                // reuse existing collision test by temporarily checking nearby
                const savedX = this.x;
                const savedY = this.y;
                // if currently colliding with this barrier, return it
                // check by testing collision isolated to this barrier
                let collides = false;
                try {
                    // perform same checks as in kolliderar but only for this barrier
                    if (barriär.typ === 'oval') {
                        const cx = (barriär.x || 0) + (barriär.bredd || 0) / 2;
                        const cy = (barriär.y || 0) + (barriär.hojd || 0) / 2;
                        const a = (barriär.bredd || 0) / 2;
                        const b = (barriär.hojd || 0) / 2;
                        const rot = -((barriär.rotation || 0) * Math.PI / 180);
                        const cos = Math.cos(rot);
                        const sin = Math.sin(rot);
                        const relX = this.x - cx;
                        const relY = this.y - cy;
                        const localX = cos * relX - sin * relY;
                        const localY = sin * relX + cos * relY;
                        const rx = a + this.storlek;
                        const ry = b + this.storlek;
                        if (rx > 0 && ry > 0 && (localX * localX) / (rx * rx) + (localY * localY) / (ry * ry) <= 1) collides = true;
                    } else if (barriär.typ === 'rotated') {
                        const cx = barriär.cx || (barriär.x + (barriär.bredd || 0) / 2);
                        const cy = barriär.cy || (barriär.y + (barriär.hojd || 0) / 2);
                        const rad = -((barriär.rotation || 0) * Math.PI / 180);
                        const cos = Math.cos(rad);
                        const sin = Math.sin(rad);
                        const relX = this.x - cx;
                        const relY = this.y - cy;
                        const localX = cos * relX - sin * relY;
                        const localY = sin * relX + cos * relY;
                        const hx = (barriär.bredd || 0) / 2;
                        const hy = (barriär.hojd || 0) / 2;
                        const absX = Math.abs(localX);
                        const absY = Math.abs(localY);
                        if (absX <= hx + this.storlek && absY <= hy + this.storlek) collides = true;
                        const dxCorner = Math.max(0, absX - hx);
                        const dyCorner = Math.max(0, absY - hy);
                        if (dxCorner * dxCorner + dyCorner * dyCorner <= this.storlek * this.storlek) collides = true;
                    } else {
                        if (this.x + this.storlek > (barriär.x || 0) &&
                            this.x - this.storlek < ((barriär.x || 0) + (barriär.bredd || 0)) &&
                            this.y + this.storlek > (barriär.y || 0) &&
                            this.y - this.storlek < ((barriär.y || 0) + (barriär.hojd || 0))) {
                            collides = true;
                        }
                    }
                } catch (e) {}
                if (collides) return barriär;
            } catch (e) {
                // ignore
            }
        }
        return null;
    }
    
    kolliderar(barriarer) {
        // Kontrollera om spelaren kolliderar med någon barriär
        for (let barriär of barriarer) {
            try {
                if (barriär.typ === 'oval') {
                    // Rotated ellipse collision: transform player into ellipse-local coords
                    const cx = (barriär.x || 0) + (barriär.bredd || 0) / 2;
                    const cy = (barriär.y || 0) + (barriär.hojd || 0) / 2;
                    const a = (barriär.bredd || 0) / 2;
                    const b = (barriär.hojd || 0) / 2;
                    const rot = -((barriär.rotation || 0) * Math.PI / 180);
                    const cos = Math.cos(rot);
                    const sin = Math.sin(rot);
                    const relX = this.x - cx;
                    const relY = this.y - cy;
                    const localX = cos * relX - sin * relY;
                    const localY = sin * relX + cos * relY;
                    // Expand ellipse radii by player radius
                    const rx = a + this.storlek;
                    const ry = b + this.storlek;
                    if (rx > 0 && ry > 0 && (localX * localX) / (rx * rx) + (localY * localY) / (ry * ry) <= 1) return true;
                    continue;
                }

                if (barriär.typ === 'rotated') {
                    // Circle vs rotated rectangle collision
                    const cx = barriär.cx || (barriär.x + (barriär.bredd || 0) / 2);
                    const cy = barriär.cy || (barriär.y + (barriär.hojd || 0) / 2);
                    const rad = -((barriär.rotation || 0) * Math.PI / 180);
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const relX = this.x - cx;
                    const relY = this.y - cy;
                    const localX = cos * relX - sin * relY;
                    const localY = sin * relX + cos * relY;
                    const hx = (barriär.bredd || 0) / 2;
                    const hy = (barriär.hojd || 0) / 2;
                    const absX = Math.abs(localX);
                    const absY = Math.abs(localY);
                    // Overlap with expanded rect
                    if (absX <= hx + this.storlek && absY <= hy + this.storlek) return true;
                    // Corner check
                    const dxCorner = Math.max(0, absX - hx);
                    const dyCorner = Math.max(0, absY - hy);
                    if (dxCorner * dxCorner + dyCorner * dyCorner <= this.storlek * this.storlek) return true;
                    continue;
                }

                // Default AABB check (expand by player radius)
                if (this.x + this.storlek > (barriär.x || 0) &&
                    this.x - this.storlek < ((barriär.x || 0) + (barriär.bredd || 0)) &&
                    this.y + this.storlek > (barriär.y || 0) &&
                    this.y - this.storlek < ((barriär.y || 0) + (barriär.hojd || 0))) {
                    return true;
                }
            } catch (e) {
                // ignore malformed barrier
            }
        }
        return false;
    }

    beraknaSpriteStorlek(bild, maxBredd, maxHojd) {
        if (!bild || !bild.naturalWidth || !bild.naturalHeight) {
            return { bredd: 0, hojd: 0 };
        }

        const scale = Math.min(maxBredd / bild.naturalWidth, maxHojd / bild.naturalHeight);
        return {
            bredd: Math.max(1, Math.round(bild.naturalWidth * scale)),
            hojd: Math.max(1, Math.round(bild.naturalHeight * scale))
        };
    }
    
    rita(ctx) {
        // Försök att rita animationsbilden om spelaren rör sig
        let bildRitad = false;
        if (animationer) {
            const animationsBild = animationer.getNuvarandeAnimationsBild(this);
            if (animationsBild && animationsBild.complete && animationsBild.naturalWidth > 0) {
                const storlek = this.beraknaSpriteStorlek(animationsBild, 56, 56);
                const hojd = storlek.hojd;
                const bredd = storlek.bredd;
                
                // Spegelvända om gubben går åt vänster
                if (this.riktning === 'vänster') {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(
                        animationsBild,
                        -(this.x + bredd / 2),
                        this.y - hojd / 2,
                        bredd,
                        hojd
                    );
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        animationsBild,
                        this.x - bredd / 2,
                        this.y - hojd / 2,
                        bredd,
                        hojd
                    );
                }
                bildRitad = true;
            }
        }
        
        // Fallback: Rita spelarens klassbild om animationen inte är tillgänglig
        if (!bildRitad) {
            if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
                const storlek = this.beraknaSpriteStorlek(this.sprite, 72, 96);
                const hojd = storlek.hojd;
                const bredd = storlek.bredd;
                
                // Spegelvända om gubben går åt vänster
                if (this.riktning === 'vänster') {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(
                        this.sprite,
                        -(this.x + bredd / 2),
                        this.y - hojd / 2,
                        bredd,
                        hojd
                    );
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        this.sprite, 
                        this.x - bredd / 2, 
                        this.y - hojd / 2, 
                        bredd, 
                        hojd
                    );
                }
            } else {
                // Fallback: Rita en grön cirkel om bilden inte är laddad
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        // Rita namn ovanför spelaren
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.namn, this.x, this.y - 40);
        ctx.fillText(this.namn, this.x, this.y - 40);
    }
}
