class Stigen {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);
        this.startOmradeNamn = null;
        this.spawnX = 250;
        this.spawnY = 540;
        this.minSpelarSkala = 0.5;
        this.maxSpelarSkala = 2;
        this.visaBarriarer = false;
        this.visaUtgangar = false;
        this.narmasteUtgang = null;
        this.narmasteFynd = null;
        this.eKnappNedtryckt = false;
        this.itemIkonCache = {};
        this.scenarioIndex = 0;
        this.rumStatus = {};
        this.rumBesokRaknare = 0;
        this.senastRum = null;
        this.aktuelltRum = null;
        this.scenarioFynd = [
            { id: 'sten', count: 2 },
            { id: 'sten', count: 3 },
            { id: 'jarn', count: 1 },
            { id: 'sten', count: 4 },
            { id: 'jarn', count: 2 },
            { id: 'titanit', count: 1 }
        ];
        this.dropPlatser = [
            { x: 100, y: 451 },
            { x: 100, y: 233 },
            { x: 300, y: 420 },
            { x: 420, y: 360 },
            { x: 520, y: 420 },
            { x: 610, y: 300 },
            { x: 660, y: 220 },
            { x: 659, y: 511 }
        ];

        this.utgangar = [
            {
                namn: 'Utgång',
                x: 440,
                y: 100,
                radie: 120,
                meddelande: 'Tryck på [E] för att gå vidare',
                action: () => this.lamnaStigen()
            }
        ];

        this.varorPaMarken = [];

        this.barriarer = [
            { x: 0, y: 150, bredd: canvas.width, hojd: 20 },
            { x: 240, y: 220, bredd: 120, hojd: 20, rotation: 15 },
            { typ: 'oval', x: 0, y: 270, bredd: 360, hojd: 120, rotation: 10 },
            { typ: 'oval', x: 580, y: 350, bredd: 360, hojd: 120, rotation: 10 },
            { typ: 'oval', x: 0, y: 520, bredd: 100, hojd: 60, rotation: 45 },
            { typ: 'oval', x: 690, y: 120, bredd: 100, hojd: 80, rotation: 10 },
            { x: 0, y: 0, bredd: 20, hojd: canvas.height },
            { x: 0, y: 580, bredd: canvas.width, hojd: 20 },
            { x: canvas.width - 20, y: 0, bredd: 20, hojd: canvas.height }
        ];

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Stigen.png';
        this.bild.onload = () => {
            this.bildLaddad = true;
            console.log('Stigen-bild laddad!');
        };
        this.bild.onerror = () => {
            console.log('Kunde inte ladda Stigen-bild från: assets/platser/Stigen.png');
        };
    }

    visa(startOmradeNamn) {
        this.visas = true;
        const rumNamn = startOmradeNamn || this.startOmradeNamn || 'Stigen1';
        this.startOmradeNamn = rumNamn;
        this.aktuelltRum = rumNamn;
        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.x = this.spawnX;
            spelare.y = this.spawnY;
        }
        // DEBUG: trace Stigen.visa calls and attempt to notify Gestalter
        try { console.log('[Stigen] visa called for', rumNamn); } catch (e) {}
        try {
            if (typeof window !== 'undefined' && window.gestaltrutan) {
                try { console.log('[Stigen] window.gestaltrutan found, gestalter=', !!window.gestaltrutan.gestalter); } catch (e) {}
                if (window.gestaltrutan.gestalter && typeof window.gestaltrutan.gestalter.notaRutaBesokt === 'function') {
                    try {
                        window.gestaltrutan.gestalter.notaRutaBesokt(rumNamn);
                        try { console.log('[Stigen] noted ruta via window.gestaltrutan ->', rumNamn); } catch (e) {}
                    } catch (e) { try { console.error('[Stigen] failed calling notaRutaBesokt on window.gestaltrutan', e); } catch (e2) {} }
                } else {
                    try { console.log('[Stigen] window.gestaltrutan.gestalter.notaRutaBesokt not available'); } catch (e) {}
                }
            } else {
                try { console.log('[Stigen] window.gestaltrutan not defined'); } catch (e) {}
            }
        } catch (e) {}
        this.initieraRumFynd(rumNamn);
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
            ctx.fillStyle = '#20301f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#dfe8d4';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Stigen', canvas.width / 2, canvas.height / 2);
        }

        const spelare = this.hamtaSpelare();
        if (spelare) {
            const clampY = Math.max(0, Math.min(canvas.height, spelare.y));
            const t = clampY / canvas.height;
            const skala = this.minSpelarSkala + (this.maxSpelarSkala - this.minSpelarSkala) * t;

            ctx.save();
            ctx.translate(spelare.x, spelare.y);
            ctx.scale(skala, skala);
            ctx.translate(-spelare.x, -spelare.y);
            spelare.rita(ctx);
            ctx.restore();
        }

        this.ritaFynd();

        if (this.visaUtgangar) {
            this.ritaUtgangar();
        }

        this.ritaInteraktionsmeddelande();

        if (this.visaBarriarer) {
            this.ritaBarriarer();
        }

    }

    tangentNed(tangent) {
        if (!this.visas) return;
        if ((tangent === 'e' || tangent === 'E') && this.narmasteUtgang && !this.eKnappNedtryckt) {
            const spelare = this.hamtaSpelare();
            if (spelare && typeof spelare.rensaInput === 'function') {
                spelare.rensaInput();
            }
            if (this.narmasteFynd) {
                this.eKnappNedtryckt = true;
                this.plockaUppFynd(this.narmasteFynd);
                return;
            }
            this.eKnappNedtryckt = true;
            this.narmasteUtgang.action();
            return;
        }
        if ((tangent === 'e' || tangent === 'E') && this.narmasteFynd && !this.eKnappNedtryckt) {
            this.eKnappNedtryckt = true;
            this.plockaUppFynd(this.narmasteFynd);
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

                if (!this.kolliderarPos(nyttX, nyttY, radie)) {
                    spelare.x = nyttX;
                    spelare.y = nyttY;
                } else {
                    let flyttad = false;

                    if (dx !== 0 && !this.kolliderarPos(spelare.x + dx, spelare.y, radie)) {
                        spelare.x += dx;
                        flyttad = true;
                    }
                    if (dy !== 0 && !this.kolliderarPos(spelare.x, spelare.y + dy, radie)) {
                        spelare.y += dy;
                        flyttad = true;
                    }

                    if (!flyttad) {
                        const kollision = this.hittaKollision(nyttX, nyttY, radie);
                        if (kollision) {
                            const tangentX = -kollision.normal.y;
                            const tangentY = kollision.normal.x;
                            const proj = dx * tangentX + dy * tangentY;
                            const slideX = tangentX * proj;
                            const slideY = tangentY * proj;

                            if (!this.kolliderarPos(spelare.x + slideX, spelare.y + slideY, radie)) {
                                spelare.x += slideX;
                                spelare.y += slideY;
                            }
                        }
                    }
                }
            }

            if (animationer) {
                animationer.uppdateraAnimering(spelare, rorelse);
            }

            this.kontrolleraNarhet(spelare.x, spelare.y);
            this.kontrolleraFynd(spelare.x, spelare.y);
        }
    }

    kontrolleraNarhet(spelareX, spelareY) {
        this.narmasteUtgang = null;
        let minstaAvstand = Infinity;

        for (const punkt of this.utgangar) {
            const dx = spelareX - punkt.x;
            const dy = spelareY - punkt.y;
            const avstand = Math.sqrt(dx * dx + dy * dy);
            if (avstand <= punkt.radie && avstand < minstaAvstand) {
                minstaAvstand = avstand;
                this.narmasteUtgang = punkt;
            }
        }
    }

    kontrolleraFynd(spelareX, spelareY) {
        this.narmasteFynd = null;
        let minstaAvstand = Infinity;

        for (const fynd of this.varorPaMarken) {
            const radie = fynd.radie || 24;
            const dx = spelareX - fynd.x;
            const dy = spelareY - fynd.y;
            const avstand = Math.sqrt(dx * dx + dy * dy);
            if (avstand <= radie && avstand < minstaAvstand) {
                minstaAvstand = avstand;
                this.narmasteFynd = fynd;
            }
        }
    }

    ritaInteraktionsmeddelande() {
        if (!this.narmasteUtgang && !this.narmasteFynd) return;

        const ctx = this.ctx;
        const spelare = this.hamtaSpelare();
        if (!spelare) return;

        const text = this.narmasteFynd
            ? 'Tryck på [E] för att plocka upp'
            : this.narmasteUtgang.meddelande;
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;

        ctx.font = 'bold 14px Arial';
        const textBredd = ctx.measureText(text).width + 20;
        const textHojd = 30;
        const x = spelare.x - textBredd / 2;
        const y = spelare.y - 60;

        ctx.beginPath();
        ctx.roundRect(x, y, textBredd, textHojd, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, spelare.x, y + textHojd / 2);

        ctx.restore();
    }

    ritaFynd() {
        const ctx = this.ctx;
        for (const fynd of this.varorPaMarken) {
            const def = this.hamtaFyndDef(fynd.id);
            const ikon = def ? this.hamtaIkonBild(def.ikon) : null;
            const storlek = 36;
            const x = fynd.x - storlek / 2;
            const y = fynd.y - storlek / 2;

            if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                ctx.drawImage(ikon, x, y, storlek, storlek);
            } else {
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(fynd.x, fynd.y, 12, 0, Math.PI * 2);
                ctx.fill();
            }

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

        if (this.narmasteFynd) {
            this.ritaGlitterMarkor(this.narmasteFynd);
        }
    }

    ritaGlitterMarkor(fynd) {
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
            ctx.beginPath();
            ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    skapaScenarioFynd() {
        const index = Math.floor(Math.random() * this.scenarioFynd.length);
        this.scenarioIndex = index;
        const scenario = this.scenarioFynd[index];
        const radie = 28;
        const plats = this.hamtaSlumpadDropPlats(radie) || { x: 520, y: 360 };
        return [
            { id: scenario.id, x: plats.x, y: plats.y, count: scenario.count, radie }
        ];
    }

    initieraRumFynd(rumNamn) {
        if (rumNamn !== this.senastRum) {
            this.rumBesokRaknare += 1;
            this.senastRum = rumNamn;
        }

        const status = this.rumStatus[rumNamn];
        if (!status) {
            const fynd = this.skapaScenarioFynd();
            this.rumStatus[rumNamn] = { fynd, rensadVid: null };
            this.varorPaMarken = fynd;
            return;
        }

        if (status.rensadVid !== null && this.rumBesokRaknare - status.rensadVid >= 5) {
            const fynd = this.skapaScenarioFynd();
            this.rumStatus[rumNamn] = { fynd, rensadVid: null };
            this.varorPaMarken = fynd;
            return;
        }

        this.varorPaMarken = status.fynd || [];
    }

    hamtaSlumpadDropPlats(radie) {
        if (this.dropPlatser.length === 0) return null;
        const kandidat = [...this.dropPlatser];
        for (let i = kandidat.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = kandidat[i];
            kandidat[i] = kandidat[j];
            kandidat[j] = temp;
        }

        for (const plats of kandidat) {
            if (!this.kolliderarPos(plats.x, plats.y, radie)) {
                return plats;
            }
        }

        return null;
    }

    hamtaIkonBild(src) {
        if (!src) return null;
        if (!this.itemIkonCache[src]) {
            const img = new Image();
            img.src = src;
            this.itemIkonCache[src] = img;
        }
        return this.itemIkonCache[src];
    }

    hamtaFyndDef(id) {
        const spelare = this.hamtaSpelare();
        if (spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal) {
            return spelare.utrustning.tillgangligaForemal[id] || null;
        }
        return null;
    }

    plockaUppFynd(fynd) {
        const spelare = this.hamtaSpelare();
        if (!spelare || !spelare.utrustning) return;

        let kvar = fynd.count || 1;
        while (kvar > 0) {
            const lyckades = spelare.utrustning.laggTillForemal(fynd.id);
            if (!lyckades) break;
            kvar -= 1;
        }

        if (kvar <= 0) {
            const index = this.varorPaMarken.indexOf(fynd);
            if (index >= 0) {
                this.varorPaMarken.splice(index, 1);
            }
            this.narmasteFynd = null;
        } else {
            fynd.count = kvar;
        }

        if (this.aktuelltRum) {
            const status = this.rumStatus[this.aktuelltRum] || { fynd: [], rensadVid: null };
            status.fynd = this.varorPaMarken;
            if (this.varorPaMarken.length === 0) {
                status.rensadVid = this.rumBesokRaknare;
            }
            this.rumStatus[this.aktuelltRum] = status;
        }
    }

    markeraAktuelltRumAvklarat() {
        if (!this.aktuelltRum) return;

        const status = this.rumStatus[this.aktuelltRum] || { fynd: [], rensadVid: null };
        status.fynd = this.varorPaMarken;
        if (status.rensadVid === null) {
            status.rensadVid = this.rumBesokRaknare;
        }
        this.rumStatus[this.aktuelltRum] = status;
    }

    ritaUtgangar() {
        const ctx = this.ctx;
        ctx.save();

        for (const utgang of this.utgangar) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(utgang.x, utgang.y, utgang.radie, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(utgang.namn, utgang.x, utgang.y);
        }

        ctx.restore();
    }

    lamnaStigen() {
        this.markeraAktuelltRumAvklarat();
        this.dolj();
        this.gaTillbaka();
    }

    kolliderarPos(x, y, radie) {
        return this.hittaKollision(x, y, radie) !== null;
    }

    hittaKollision(x, y, radie) {
        for (const barriar of this.barriarer) {
            const kollision = this.kollisionInfoBarriar(x, y, radie, barriar);
            if (kollision) {
                return kollision;
            }
        }
        return null;
    }

    kollisionInfoBarriar(x, y, radie, barriar) {
        if (barriar.typ === 'oval') {
            return this.kollisionInfoOval(x, y, radie, barriar);
        }
        return this.kollisionInfoRoteradRektangel(x, y, radie, barriar);
    }

    kollisionInfoRoteradRektangel(x, y, radie, barriar) {
        const rotation = (barriar.rotation || 0) * Math.PI / 180;
        const cx = barriar.x + barriar.bredd / 2;
        const cy = barriar.y + barriar.hojd / 2;

        const dx = x - cx;
        const dy = y - cy;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const lokalX = dx * cos + dy * sin;
        const lokalY = -dx * sin + dy * cos;

        const halvaBredd = barriar.bredd / 2;
        const halvaHojd = barriar.hojd / 2;
        const narmastX = Math.max(-halvaBredd, Math.min(lokalX, halvaBredd));
        const narmastY = Math.max(-halvaHojd, Math.min(lokalY, halvaHojd));

        const diffX = lokalX - narmastX;
        const diffY = lokalY - narmastY;
        const dist2 = diffX * diffX + diffY * diffY;
        if (dist2 > radie * radie) return null;

        let normalLokalX = 0;
        let normalLokalY = 0;
        const diffLen = Math.sqrt(dist2);

        if (diffLen > 0.0001) {
            normalLokalX = diffX / diffLen;
            normalLokalY = diffY / diffLen;
        } else {
            const distX = halvaBredd - Math.abs(lokalX);
            const distY = halvaHojd - Math.abs(lokalY);
            if (distX < distY) {
                normalLokalX = lokalX >= 0 ? 1 : -1;
                normalLokalY = 0;
            } else {
                normalLokalX = 0;
                normalLokalY = lokalY >= 0 ? 1 : -1;
            }
        }

        const normalVarldX = normalLokalX * cos - normalLokalY * sin;
        const normalVarldY = normalLokalX * sin + normalLokalY * cos;

        return {
            normal: { x: normalVarldX, y: normalVarldY }
        };
    }

    kollisionInfoOval(x, y, radie, barriar) {
        const rotation = (barriar.rotation || 0) * Math.PI / 180;
        const cx = barriar.x + barriar.bredd / 2;
        const cy = barriar.y + barriar.hojd / 2;

        const dx = x - cx;
        const dy = y - cy;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const lokalX = dx * cos + dy * sin;
        const lokalY = -dx * sin + dy * cos;

        const a = barriar.bredd / 2 + radie;
        const b = barriar.hojd / 2 + radie;
        if (a <= 0 || b <= 0) return null;

        const normX = lokalX / a;
        const normY = lokalY / b;
        const dist = normX * normX + normY * normY;
        if (dist > 1) return null;

        let normalLokalX = normX / (a || 1);
        let normalLokalY = normY / (b || 1);
        const len = Math.hypot(normalLokalX, normalLokalY);
        if (len > 0.0001) {
            normalLokalX /= len;
            normalLokalY /= len;
        } else {
            normalLokalX = Math.abs(lokalX) > Math.abs(lokalY) ? (lokalX >= 0 ? 1 : -1) : 0;
            normalLokalY = normalLokalX === 0 ? (lokalY >= 0 ? 1 : -1) : 0;
        }

        const normalVarldX = normalLokalX * cos - normalLokalY * sin;
        const normalVarldY = normalLokalX * sin + normalLokalY * cos;

        return {
            normal: { x: normalVarldX, y: normalVarldY }
        };
    }

    ritaBarriarer() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;

        for (const barriar of this.barriarer) {
            const rotation = (barriar.rotation || 0) * Math.PI / 180;
            const cx = barriar.x + barriar.bredd / 2;
            const cy = barriar.y + barriar.hojd / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotation);
            ctx.beginPath();
            if (barriar.typ === 'oval') {
                ctx.ellipse(0, 0, barriar.bredd / 2, barriar.hojd / 2, 0, 0, Math.PI * 2);
            } else {
                ctx.rect(-barriar.bredd / 2, -barriar.hojd / 2, barriar.bredd, barriar.hojd);
            }
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}
