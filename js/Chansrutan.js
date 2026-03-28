class Chansrutan {
    constructor(canvas, ctx, hamtaSpelare, gaTillbaka, stridSystem, djurSystem) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.visas = false;
        this.hamtaSpelare = hamtaSpelare || (() => null);
        this.gaTillbaka = gaTillbaka || (() => null);
        if (typeof window !== 'undefined') {
            window.chansrutan = this;
        }
        this.stridSystem = stridSystem;
        this.djurSystem = djurSystem;
        
        this.stridAktiv = false;
        this.aktivFiende = null;
        this.stridTurCounter = 0;
        this.attackCooldown = 0;
        this.attackCooldownMax = 15; // 15 frames = ~0.25 sekund
        this.startOmradeNamn = null;
        this.aktuelltRum = null;
        this.rumStatus = {};
        this.rutaBesokRaknare = 0;
        this.senastBesoktRuta = null;
        
        this.spawnX = 400;
        this.spawnY = 530;
        this.minSpelarSkala = 0.5;
        this.maxSpelarSkala = 2;
        
        this.resultMeddelande = '';
        this.resultMeddelandeTid = 0;
        this.resultMeddelandeDuration = 5000;
        this.resultLootVisual = null;
        
        this.eKnappNedtryckt = false;
        this.narmasteUtgang = null;
        
        // Item spawn
        this.spawnadItem = null;
        this.itemUpphämtad = false;
        
        // Barriärer
        this.barriarar = [
            { x: 0, y: 220, bredd: canvas.width, hojd: 20 }, // Topp
            { x: 0, y: canvas.height - 20, bredd: canvas.width, hojd: 20 }, // Botten
            { x: 0, y: 0, bredd: 20, hojd: canvas.height }, // Vänster
            { x: canvas.width - 20, y: 0, bredd: 20, hojd: canvas.height }, // Höger
            { x: 490, y: 170, bredd: 20, hojd: 150 },
            { x: 280, y: 150, bredd: 20, hojd: 150 },
            { typ: 'oval', x: 480, y: 280, bredd: 400, hojd: 40, rotation: -10 },
            { typ: 'oval', x: 20, y: 240, bredd: 300, hojd: 40, rotation: 15 }
        ];
        this.visaBarriarer = false;
        
        // Bakgrund
        this.bakgrund = new Image();
        this.bakgrundLaddad = false;
        this.bakgrund.src = 'assets/platser/Chansrutan.png';
        this.bakgrund.onload = () => {
            this.bakgrundLaddad = true;
        };
        this.bakgrund.onerror = () => {
            console.log('Kunde inte ladda Chansrutan-bakgrund från: assets/platser/Chansrutan.png');
        };
        
        // Möjliga utfall
        this.fiendeTyper = ['bandit', 'bärsärk', 'blodvarg', 'bonde', 'präst', 'viking'];
        this.varor = ['energiDryck', 'hälsoDryck', 'galdratVatten', 'flaskaMedVatten', 'tom flaska', 'kottbit', 'sten', 'tra', 'jarn', 'titanit'];
        this.utrustning = ['Träsvärd', 'järnsvärd', 'Träklubba', 'Järnklubba', 'Högaffel', 'hammare', 'Träspjut', 'Järnspjut', 'Dolk', 'sko', 'Ringbrynja', 'Träsköld', 'Järnsköld', 'vikingHjalm', 'Pinne'];
        
        // Utgångar
        this.utgang = {
            x: 0,
            y: canvas.height - 60,
            bredd: canvas.width,
            hojd: 40,
            meddelande: 'Tryck på [E] för att lämna Chansrutan'
        };
        this.utgangAktiv = false;
        this.spelareVidUtgang = false;
        this.slumpUtfall = null;
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
    }
    
    notaRutaBesokt(rutaNamn) {
        if (!rutaNamn) return;
        if (rutaNamn !== this.senastBesoktRuta) {
            this.rutaBesokRaknare += 1;
            this.senastBesoktRuta = rutaNamn;
        }
    }

    hamtaAktivtQuestForChansTyp(questTyp) {
        try {
            const langhuset = (typeof window !== 'undefined') ? window.langhuset : null;
            const aktiva = langhuset && Array.isArray(langhuset.aktivaUppdrag) ? langhuset.aktivaUppdrag : [];
            const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
            for (const quest of aktiva) {
                if (!quest || quest.questChansType !== questTyp) continue;
                if (langhuset && typeof langhuset.raknaQuestItemsForUppdrag === 'function') {
                    if (langhuset.raknaQuestItemsForUppdrag(spelare, quest.id) > 0) continue;
                } else if (spelare && spelare.utrustning && Array.isArray(spelare.utrustning.inventory)) {
                    const harRedan = spelare.utrustning.inventory.some((item) => item && item.questFor === quest.id);
                    if (harRedan) continue;
                }
                return quest.id;
            }
        } catch (e) {}
        return null;
    }

    skapaSlumpatRumData() {
        const rand = Math.random();
        if (rand < 0.33) {
            const fiendeTyp = this.fiendeTyper[Math.floor(Math.random() * this.fiendeTyper.length)];
            return { utfall: 'fiende', fiendeTyp };
        }
        if (rand < 0.66) {
            const vara = this.varor[Math.floor(Math.random() * this.varor.length)];
            const stackbaraVaror = ['sten', 'tra', 'jarn'];
            const antal = stackbaraVaror.includes(vara)
                ? (Math.floor(Math.random() * 5) + 3)
                : 1;
            const questFor = this.hamtaAktivtQuestForChansTyp('vara');
            return { utfall: 'vara', item: { typ: 'vara', id: vara, antal, questFor: questFor || null } };
        }

        const utrustning = this.utrustning[Math.floor(Math.random() * this.utrustning.length)];
        const questFor = this.hamtaAktivtQuestForChansTyp('utrustning');
        return { utfall: 'utrustning', item: { typ: 'utrustning', id: utrustning, antal: 1, questFor: questFor || null } };
    }

    appliceraRumStatus(status) {
        this.aktivFiende = null;
        this.spawnadItem = null;
        this.itemUpphämtad = false;
        this.utgangAktiv = false;
        this.slumpUtfall = null;

        if (!status) return;

        if (status.rensadVid !== null) {
            this.utgangAktiv = true;
            return;
        }

        const data = status.data || null;
        if (!data) return;

        this.slumpUtfall = data.utfall || null;
        if (data.utfall === 'fiende' && data.fiendeTyp && this.stridSystem) {
            this.aktivFiende = new Fiende(data.fiendeTyp, this.spawnX - 10, this.spawnY - 280, this.stridSystem);
            return;
        }

        if (data.item) {
            this.spawnadItem = {
                typ: data.item.typ,
                id: data.item.id,
                antal: data.item.antal,
                x: this.spawnX - 10,
                y: this.spawnY - 280,
                radie: 30,
                questFor: data.item.questFor || null
            };
        }
    }

    initieraRumStatus(rumNamn) {
        const status = this.rumStatus[rumNamn];
        if (!status) {
            const nyStatus = { data: this.skapaSlumpatRumData(), rensadVid: null };
            this.rumStatus[rumNamn] = nyStatus;
            this.appliceraRumStatus(nyStatus);
            return;
        }

        if (status.rensadVid !== null && (this.rutaBesokRaknare - status.rensadVid) >= 5) {
            const nyStatus = { data: this.skapaSlumpatRumData(), rensadVid: null };
            this.rumStatus[rumNamn] = nyStatus;
            this.appliceraRumStatus(nyStatus);
            return;
        }

        this.appliceraRumStatus(status);
    }

    markeraAktuelltRumRensat() {
        if (!this.aktuelltRum) return;
        const status = this.rumStatus[this.aktuelltRum] || { data: null, rensadVid: null };
        status.rensadVid = this.rutaBesokRaknare;
        this.rumStatus[this.aktuelltRum] = status;
    }

    aktiveraUtgang() {
        this.utgangAktiv = true;
        this.markeraAktuelltRumRensat();
    }

    visa(startOmradeNamn) {
        this.visas = true;
        this.rensaMeddelanden();
        const rumNamn = startOmradeNamn || this.startOmradeNamn || 'Chans1';
        this.startOmradeNamn = rumNamn;
        this.aktuelltRum = rumNamn;
        this.stridAktiv = false;
        this.aktivFiende = null;
        this.eKnappNedtryckt = false;
        this.spawnadItem = null;
        this.itemUpphämtad = false;
        this.attackCooldown = 0;
        this.utgangAktiv = false;
        this.spelareVidUtgang = false;
        this.slumpUtfall = null;

        // Placera spelaren på spawn-punkten
        const spelare = this.hamtaSpelare();
        if (spelare) {
            spelare.x = this.spawnX;
            spelare.y = this.spawnY;
        }

        this.initieraRumStatus(rumNamn);
        this.notaRutaBesokt(rumNamn);
    }
    
    dolj() {
        this.visas = false;
        this.stridAktiv = false;
        this.aktivFiende = null;
        this.spawnadItem = null;
        this.rensaMeddelanden();
    }

    rensaMeddelanden() {
        this.resultMeddelande = '';
        this.resultMeddelandeTid = 0;
        this.resultLootVisual = null;
        this.aktivStridInfo = null;
        this.aktivStridInfoTid = 0;
    }
    
    spawnaSlumpadFiende() {
        if (!this.stridSystem) return;
        
        const fiendeTyp = this.fiendeTyper[Math.floor(Math.random() * this.fiendeTyper.length)];
        
        // Skapa ny fiende
        this.aktivFiende = new Fiende(fiendeTyp, this.spawnX - 10, this.spawnY - 280, this.stridSystem);

    }
    
    spawnaSlumpadVara() {
        const vara = this.varor[Math.floor(Math.random() * this.varor.length)];
        const stackbaraVaror = ['sten', 'tra', 'jarn'];
        const antal = stackbaraVaror.includes(vara)
            ? (Math.floor(Math.random() * 5) + 3) // 3-7 av varan
            : 1;
        // Kolla om någon aktivt uppdrag kräver en vara från chansrutan
        const questFor = this.hamtaAktivtQuestForChansTyp('vara');

        this.spawnadItem = {
            typ: 'vara',
            id: vara,
            antal: antal,
            x: this.spawnX - 10,
            y: this.spawnY - 280,
            radie: 30,
            questFor: questFor || null
        };
    }
    
    spawnaSlumpadUtrustning() {
        const utrustning = this.utrustning[Math.floor(Math.random() * this.utrustning.length)];
        // Kolla om någon aktivt uppdrag kräver utrustning från chansrutan
        const questFor = this.hamtaAktivtQuestForChansTyp('utrustning');

        this.spawnadItem = {
            typ: 'utrustning',
            id: utrustning,
            antal: 1,
            x: this.spawnX - 10,
            y: this.spawnY - 280,
            radie: 30,
            questFor: questFor || null
        };
    }
    
    hamtaVaraText(vara, antal = 1) {
        const varAr = {
            'energiDryck': 'Energi Dryck',
            'hälsoDryck': 'Livs Dryck',
            'galdratVatten': 'Galdrat Vatten',
            'flaskaMedVatten': 'Flaska med Vatten',
            'tom flaska': 'Tom Flaska',
            'kottbit': 'Köttbitar',
            'sten': 'Stenar',
            'tra': 'Trä',
            'jarn': 'Järn',
            'titanit': 'Titanit',
            'Pinne': 'Pinne'
        };
        const varEn = {
            'energiDryck': 'Energi Dryck',
            'hälsoDryck': 'Livs Dryck',
            'galdratVatten': 'Galdrat Vatten',
            'flaskaMedVatten': 'Flaska med Vatten',
            'tom flaska': 'Tom Flaska',
            'kottbit': 'Köttbit',
            'sten': 'Sten',
            'tra': 'Trä',
            'jarn': 'Järn',
            'titanit': 'Titanit',
            'Pinne': 'Pinne'
        };
        if (antal === 1 && varEn[vara]) return varEn[vara];
        return varAr[vara] || vara;
    }
    
    hamtaUtrustningText(utrustning) {
        const namn = {
            'Träsvärd': 'Träsvärd',
            'järnsvärd': 'Järnsvärd',
            'yxa': 'Strids Yxa',
            'Träklubba': 'Träklubba',
            'Järnklubba': 'Järnklubba',
            'stav': 'Völva Stav',
            'pilbage': 'Pilbåge',
            'Högaffel': 'Högaffel',
            'hammare': 'Stridshammare',
            'Träspjut': 'Träspjut',
            'Järnspjut': 'Järnspjut',
            'Dolk': 'Dolk',
            'sko': 'Sko',
            'Ringbrynja': 'Ringbrynja',
            'Träsköld': 'Träsköld',
            'Järnsköld': 'Järnsköld',
            'vikingHjalm': 'Viking Hjälm',
            'Pinne': 'Pinne'
        };
        return namn[utrustning] || utrustning;
    }

    lampnaChansrutan() {
        const spelare = this.hamtaSpelare();
        if (spelare && typeof spelare.rensaInput === 'function') {
            spelare.rensaInput();
        }
        this.dolj();
        this.gaTillbaka();
    }

    uppdateraRorelse() {
        if (!this.visas) return;

        if (this.aktivStridInfoTid > 0) {
            this.aktivStridInfoTid -= 1;
        }

        const spelare = this.hamtaSpelare();
        if (!spelare) return;

        // Hantera spelarens rörelse
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

            // Kontrollera barriärkollision på nya positionen
            if (!this.kolliderarPos(nyttX, nyttY, radie)) {
                spelare.x = nyttX;
                spelare.y = nyttY;
            } else {
                // Försök glidande rörelse separat i båda riktningar
                if (dx !== 0 && !this.kolliderarPos(spelare.x + dx, spelare.y, radie)) {
                    spelare.x += dx;
                }
                if (dy !== 0 && !this.kolliderarPos(spelare.x, spelare.y + dy, radie)) {
                    spelare.y += dy;
                }
            }
        }

        // Uppdatera animationer
        if (animationer) {
            animationer.uppdateraAnimering(spelare, rorelse);
        }

        // Uppdatera strid om fiende finns
        if (this.aktivFiende) {
            this.uppdateraStrid(spelare);
        }

        // Kolla om spelaren är nära spawnad item
        if (this.spawnadItem && !this.itemUpphämtad) {
            const itemDx = spelare.x - this.spawnadItem.x;
            const itemDy = spelare.y - this.spawnadItem.y;
            const avstand = Math.sqrt(itemDx * itemDx + itemDy * itemDy);

            if (avstand < this.spawnadItem.radie) {
                this.plockaUppItem();
            }
        }

        // Uppdatera utgång (gömd)
        this.spelareVidUtgang = false;
        if (this.utgangAktiv && this.utgang) {
            if (spelare.x > this.utgang.x && spelare.x < this.utgang.x + this.utgang.bredd &&
                spelare.y > this.utgang.y && spelare.y < this.utgang.y + this.utgang.hojd) {
                this.spelareVidUtgang = true;
            }
        }
    }

    uppdateraStrid(spelare) {
        if (!this.aktivFiende || !spelare || !this.stridSystem) return;

        // Kolla om fienden är död
        if (this.aktivFiende.liv <= 0) {
            this.aktivFiende.levande = false;

            // Ge loot om fienden har loot i stridSystem
            if (this.stridSystem.hamtaSlumpmassigLoot) {
                const lootString = this.stridSystem.hamtaSlumpmassigLoot(this.aktivFiende.typ);
                const lootData = this.stridSystem.parsaLoot(lootString);

                if (lootData.typ === 'pengar' && spelare) {
                    this.resultLootVisual = this.hamtaPengarVisual(lootData);
                    if (typeof spelare.laggTillPengar === 'function') {
                        spelare.laggTillPengar(lootData, { raknaSomIntakt: true });
                    } else if (spelare.pengar) {
                        spelare.pengar.koppar += lootData.koppar;
                        spelare.pengar.silver += lootData.silver;
                        spelare.pengar.guld += lootData.guld;
                    }
                    if ((lootData.koppar + lootData.silver + lootData.guld) > 0 && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('pengar');
                    }

                    const delar = [];
                    if (lootData.guld > 0) delar.push(`${lootData.guld} guld`);
                    if (lootData.silver > 0) delar.push(`${lootData.silver} silver`);
                    if (lootData.koppar > 0) delar.push(`${lootData.koppar} koppar`);
                    const passivText = this.passivTraffMeddelande ? `${this.passivTraffMeddelande}\n` : '';
                    this.resultMeddelande = this.resultLootVisual
                        ? `${passivText}Fienden besegrad!\nFick:`
                        : `${passivText}Fienden besegrad! Fick: ${delar.join(' och ')}`;
                } else if (lootData.typ === 'item' && spelare.utrustning) {
                    for (let i = 0; i < lootData.antal; i++) {
                        spelare.utrustning.laggTillForemal(lootData.itemId);
                    }
                    const passivText = this.passivTraffMeddelande ? `${this.passivTraffMeddelande}\n` : '';
                    this.resultLootVisual = this.hamtaLootVisual(lootData.itemId, lootData.antal);
                    this.resultMeddelande = `${passivText}Fienden besegrad!\nFick:`;
                } else {
                    this.resultLootVisual = null;
                    const passivText = this.passivTraffMeddelande ? `${this.passivTraffMeddelande}\n` : '';
                    this.resultMeddelande = `${passivText}Fienden besegrad!`;
                }
            } else {
                this.resultLootVisual = null;
                const passivText = this.passivTraffMeddelande ? `${this.passivTraffMeddelande}\n` : '';
                this.resultMeddelande = `${passivText}Fienden besegrad!`;
            }
            this.passivTraffMeddelande = '';

            // Uppdatera prestationer så att dödade fiender från chansrutan räknas
            try {
                if (spelare && spelare.prestationer) {
                    if (typeof spelare.registreraStridsresultat === 'function') {
                        spelare.registreraStridsresultat({ vann: true, forlorade: false });
                    }
                    spelare.prestationer.fiendesBesegrade = (spelare.prestationer.fiendesBesegrade || 0) + 1;
                    const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                    const keyRaw = this.aktivFiende && (this.aktivFiende.typ || this.aktivFiende.namn) ? (this.aktivFiende.typ || this.aktivFiende.namn) : '';
                    const key = normalize(keyRaw);
                    spelare.prestationer.killsByType = spelare.prestationer.killsByType || {};
                    spelare.prestationer.killsByType[key] = (spelare.prestationer.killsByType[key] || 0) + 1;
                    if (typeof window !== 'undefined' && window.UPPDRAG_DEBUG) console.log('[Uppdrag DEBUG] Chansrutan fiende besegrad:', key, 'totalKills=', spelare.prestationer.fiendesBesegrade, 'killsByType=', spelare.prestationer.killsByType[key]);
                }
            } catch (e) {}

            this.aktivFiende = null;
            this.stridAktiv = false;
            this.aktiveraUtgang();
            this.resultMeddelandeTid = Date.now();
            return;
        }

        // Kolla avstånd till fiende
        const dx = spelare.x - this.aktivFiende.x;
        const dy = spelare.y - this.aktivFiende.y;
        const avstand = Math.sqrt(dx * dx + dy * dy);
        const attackRackvidd = 100;

        // Starta strid om nära nog och ännu inte startad
        if (avstand < attackRackvidd && !this.stridAktiv) {
            this.stridAktiv = true;
            this.uppdateraAktivStridInfo(this.aktivFiende);
            this.attackCooldown = 1; // Första attacken sker direkt nästa frame
        }

        // Avsluta strid om för långt bort
        if (avstand > attackRackvidd + 50) {
            this.stridAktiv = false;
        }

        // Utför automatisk strid med one-shot-system
        if (this.stridAktiv) {
            this.attackCooldown--;

            if (this.attackCooldown <= 0) {
                // === SPELAREN ATTACKERAR FIENDEN ===
                // Beräkna spelarens skada (fysisk från vapen)
                let spelarElement = spelare.skadaElement || 'fysisk';
                let spelarSkada = 0;
                const stridStats = (spelare.strid && typeof spelare.strid === 'object')
                    ? spelare.strid
                    : (spelare.utrustning && spelare.utrustning.vapen && spelare.utrustning.vapen.strid ? spelare.utrustning.vapen.strid : null);
                let vapenPassivEffekt = { multiplikator: 1, utlöst: false, passiv: null };
                if (stridStats && typeof stridStats === 'object') {
                    const motstand = (this.aktivFiende.motstånd && typeof this.aktivFiende.motstånd === 'object')
                        ? this.aktivFiende.motstånd
                        : {};
                    let hogstBidrag = -1;
                    for (const element of ['fysisk', 'eld', 'magi']) {
                        const grundSkada = typeof stridStats[element] === 'number' ? stridStats[element] : 0;
                        if (grundSkada <= 0) continue;
                        const passivEffekt = (spelare.utrustning && typeof spelare.utrustning.rullaVapenPassivSkada === 'function')
                            ? spelare.utrustning.rullaVapenPassivSkada(element)
                            : { multiplikator: 1, utlöst: false, passiv: null };
                        const elementMotstand = typeof motstand[element] === 'number' ? motstand[element] : 0;
                        const bidrag = Math.max(0, (grundSkada * (passivEffekt.multiplikator || 1)) - elementMotstand);
                        spelarSkada += bidrag;
                        if (bidrag > hogstBidrag) {
                            hogstBidrag = bidrag;
                            spelarElement = element;
                        }
                        if (passivEffekt.utlöst && passivEffekt.passiv && !vapenPassivEffekt.utlöst) {
                            vapenPassivEffekt = passivEffekt;
                        }
                    }
                } else if (typeof stridStats === 'number') {
                    spelarSkada = stridStats;
                }

                // Beräkna one-shot chans för spelaren att döda fienden
                const spelarDodsChans = Math.max(0, Math.min(100, spelarSkada));

                // Slumpa om spelarens attack dödar fienden
                const spelarSlump = Math.random() * 100;
                const spelarenTraffar = spelarSlump <= spelarDodsChans;

                // === FIENDEN ATTACKERAR SPELAREN (SAMTIDIGT) ===
                // Beräkna fiendens skada
                const fiendeSkada = (this.aktivFiende.skada && this.aktivFiende.skada.fysisk) || 0;
                const fiendeElement = this.aktivFiende.skadaElement || 'fysisk';

                // Beräkna one-shot chans för fienden att träffa spelaren
                const spelarMotstand = (spelare.motstånd && spelare.motstånd[fiendeElement]) || 0;
                const fiendeDodsChans = Math.max(0, Math.min(100, fiendeSkada - spelarMotstand));

                // Slumpa om fiendens attack träffar spelaren
                const fiendeSlump = Math.random() * 100;
                const fiendenTraffar = fiendeSlump <= fiendeDodsChans;

                // === UTVÄRDERA RESULTAT ===
                let resultatMeddelande = '';
                this.passivTraffMeddelande = '';
                
                if (spelarenTraffar && fiendenTraffar) {
                    // Båda träffar
                    this.aktivFiende.liv = 0;
                    if (typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('fiendeDor');
                    }
                    const skadeResultat = (spelare && typeof spelare.taSkada === 'function')
                        ? spelare.taSkada(1, { element: fiendeElement, tystLjud: true })
                        : (spelare && typeof spelare.forloraLiv === 'function' ? (spelare.forloraLiv(1), { togSkada: true, undvekSkada: false, passiv: null }) : (spelare.liv = Math.max(0, spelare.liv - 1), { togSkada: true, undvekSkada: false, passiv: null }));
                    if ((!skadeResultat || !skadeResultat.undvekSkada) && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('badaSkadas');
                    }
                    const efterTraffResultat = spelare && spelare.liv > 0 && spelare.utrustning && typeof spelare.utrustning.tillampaVapenPassiverEfterTraff === 'function'
                        ? spelare.utrustning.tillampaVapenPassiverEfterTraff(spelarElement)
                        : null;
                    console.log(`Båda träffar! Fienden dör, men du förlorar 1 liv!`);
                    resultatMeddelande = (efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0
                        ? `${efterTraffResultat.meddelanden.join('\n')}\n`
                        : '') + ((skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande)
                            ? `${skadeResultat.meddelande}\nBåda träffar! Fienden besegrad!`
                            : 'Båda träffar! Fienden besegrad\nDu förlorade 1 liv!');
                    // Loot hanteras av uppdateraStrid när aktivFiende.liv <= 0
                } else if (spelarenTraffar) {
                    // Bara spelaren träffar
                    this.aktivFiende.liv = 0;
                    if (typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('fiendeDor');
                    }
                    const efterTraffResultat = spelare && spelare.utrustning && typeof spelare.utrustning.tillampaVapenPassiverEfterTraff === 'function'
                        ? spelare.utrustning.tillampaVapenPassiverEfterTraff(spelarElement)
                        : null;
                    this.passivTraffMeddelande = efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0
                        ? efterTraffResultat.meddelanden.join('\n')
                        : '';
                    const passivInfo = (vapenPassivEffekt.utlöst && vapenPassivEffekt.passiv) ? ` ${vapenPassivEffekt.passiv.namn} utlöst!` : '';
                    console.log(`Spelaren attackerar ${this.aktivFiende.namn}! Dödschans: ${spelarDodsChans.toFixed(1)}% - TRÄFF!${passivInfo}${(efterTraffResultat && efterTraffResultat.meddelanden && efterTraffResultat.meddelanden.length > 0) ? ` ${efterTraffResultat.meddelanden.join(' ')}` : ''}`);
                    // Loot hanteras av uppdateraStrid när aktivFiende.liv <= 0
                } else if (fiendenTraffar) {
                    // Bara fienden träffar
                    const skadeResultat = (spelare && typeof spelare.taSkada === 'function')
                        ? spelare.taSkada(1, { element: fiendeElement })
                        : (spelare && typeof spelare.forloraLiv === 'function' ? (spelare.forloraLiv(1), { togSkada: true, undvekSkada: false, passiv: null }) : (spelare.liv = Math.max(0, spelare.liv - 1), { togSkada: true, undvekSkada: false, passiv: null }));
                    if (spelare && typeof spelare.registreraStridsresultat === 'function') {
                        spelare.registreraStridsresultat({ vann: false, forlorade: true });
                    }
                    console.log(`${this.aktivFiende.namn} attackerar med ${fiendeElement}! Dödschans: ${fiendeDodsChans.toFixed(1)}% - TRÄFF!${(skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande) ? ` ${skadeResultat.meddelande}` : ' Spelaren förlorar 1 liv!'}`);
                    resultatMeddelande = (skadeResultat && skadeResultat.undvekSkada && skadeResultat.meddelande)
                        ? skadeResultat.meddelande
                        : 'Du förlorade striden och 1 liv!';
                    this.resultLootVisual = null;
                    this.resultMeddelande = resultatMeddelande;
                    this.resultMeddelandeTid = Date.now();
                    this.aktivFiende = null;
                    this.stridAktiv = false;
                    this.aktiveraUtgang();
                } else {
                    // Båda missar
                    if (spelare && typeof spelare.registreraStridsresultat === 'function') {
                        spelare.registreraStridsresultat({ vann: false, forlorade: true });
                    }
                    console.log(`Båda missar! Fienden flydde.`);
                    if (typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                        window.spelaStandardLjud('fiendeFlyr');
                    }
                    resultatMeddelande = 'Båda missade! Fienden flydde.';
                    this.resultLootVisual = null;
                    this.resultMeddelande = resultatMeddelande;
                    this.resultMeddelandeTid = Date.now();
                    this.aktivFiende = null;
                    this.stridAktiv = false;
                    this.aktiveraUtgang();
                }

                // Avsluta striden oavsett resultat
                this.stridAktiv = false;
            }
        }
    }
    
    kolliderarPos(x, y, radie) {
        for (const barr of this.barriarar) {
            if (barr.typ === 'oval') {
                // Kollision för oval barriär
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
                // Kollision för rektangulär barriär
                const rotation = (barr.rotation || 0) * Math.PI / 180;
                
                if (rotation === 0) {
                    // Optimerad version utan rotation
                    const narmastX = Math.max(barr.x, Math.min(x, barr.x + barr.bredd));
                    const narmastY = Math.max(barr.y, Math.min(y, barr.y + barr.hojd));
                    
                    const dx = x - narmastX;
                    const dy = y - narmastY;
                    const avstand = Math.sqrt(dx * dx + dy * dy);
                    
                    if (avstand < radie) {
                        return true;
                    }
                } else {
                    // Roterad rektangel
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
        }
        return false;
    }
    
    plockaUppItem() {
        const spelare = this.hamtaSpelare();
        if (!spelare || !spelare.utrustning || !this.spawnadItem) return;
        
        const item = this.spawnadItem;
        
        // Lägg till i inventory
        if (item.questFor) {
            // Ett chansruteuppdrag ska bara ge ett questmärkt föremål, även om droppen är stackbar.
            spelare.utrustning.laggTillForemal(item.id, { questFor: item.questFor });
            for (let i = 1; i < item.antal; i++) {
                spelare.utrustning.laggTillForemal(item.id);
            }
        } else {
            for (let i = 0; i < item.antal; i++) {
                spelare.utrustning.laggTillForemal(item.id);
            }
        }
        
        // Visa meddelande
        if (item.typ === 'vara') {
            this.resultLootVisual = this.hamtaLootVisual(item.id, item.antal);
            this.resultMeddelande = 'Du hittade:';
        } else {
            this.resultLootVisual = this.hamtaLootVisual(item.id, item.antal);
            this.resultMeddelande = 'Du hittade:';
        }
        
        this.aktiveraUtgang();
        this.resultMeddelandeTid = Date.now();
        this.itemUpphämtad = true;
        this.spawnadItem = null;
    }
    
    rita() {
        if (!this.visas) return;
        this.elementHoverBounds = [];
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Rita bakgrund
        if (this.bakgrundLaddad) {
            ctx.drawImage(this.bakgrund, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Rita spelare med skalning
        const spelare = this.hamtaSpelare();
        if (spelare) {
            const clampY = Math.max(0, Math.min(canvas.height, spelare.y));
            const t = clampY / canvas.height;
            const minSkala = 0.8;
            const maxSkala = 1.5;
            const skala = minSkala + (maxSkala - minSkala) * t;

            ctx.save();
            ctx.translate(spelare.x, spelare.y);
            ctx.scale(skala, skala);
            ctx.translate(-spelare.x, -spelare.y);
            spelare.rita(ctx);
            ctx.restore();
        }
        
        // Rita spawnad item
        if (this.spawnadItem && !this.itemUpphämtad) {
            ctx.save();
            
            // Glödande effekt
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 3) * 0.3 + 0.7;
            
            // Rita glow (färga annorlunda om detta är ett quest-item)
            ctx.shadowBlur = 20;
            const isQuest = !!this.spawnadItem.questFor;
            ctx.shadowColor = isQuest ? ('rgba(80, 220, 180, ' + pulse + ')') : ('rgba(255, 215, 0, ' + pulse + ')');
            ctx.fillStyle = isQuest ? ('rgba(80, 220, 180, ' + (pulse * 0.5) + ')') : ('rgba(255, 215, 0, ' + (pulse * 0.5) + ')');
            ctx.beginPath();
            ctx.arc(this.spawnadItem.x, this.spawnadItem.y, this.spawnadItem.radie * 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Rita själva cirkeln
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255, 215, 0, ' + pulse + ')';
            ctx.beginPath();
            ctx.arc(this.spawnadItem.x, this.spawnadItem.y, this.spawnadItem.radie, 0, Math.PI * 2);
            ctx.fill();
            
            // Rita frågemärke eller ikon (byter till '!' för quest-items)
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (isQuest) {
                ctx.fillText('!', this.spawnadItem.x, this.spawnadItem.y);
                // liten badge
                const badgeSize = 18;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.beginPath();
                ctx.arc(this.spawnadItem.x + this.spawnadItem.radie * 0.7, this.spawnadItem.y - this.spawnadItem.radie * 0.7, badgeSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#50DCA4';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('Q', this.spawnadItem.x + this.spawnadItem.radie * 0.7, this.spawnadItem.y - this.spawnadItem.radie * 0.7);
            } else {
                ctx.fillText('?', this.spawnadItem.x, this.spawnadItem.y);
            }
            
            ctx.restore();
        }
        
        // Rita fiende om den finns och lever
        if (this.aktivFiende && this.aktivFiende.levande !== false) {
            this.ritaFiende();
        }
        this.ritaFiendeStats();
        
        // Rita resultatmeddelande
        this.ritaResultatMeddelande();
        if (this.elementHoverInfo) {
            this.ritaElementTooltip(this.elementHoverInfo.element, this.elementHoverInfo.x, this.elementHoverInfo.y);
        }

        // Visa utgangsmeddelande nar spelaren star i utgangen
        if (this.utgangAktiv && this.spelareVidUtgang && this.utgang) {
            const meddelande = this.utgang.meddelande || 'Tryck pa [E] for att lamna';
            const boxBredd = 380;
            const boxHojd = 40;
            const boxX = (canvas.width - boxBredd) / 2;
            const boxY = canvas.height - 80;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(boxX, boxY, boxBredd, boxHojd);
            ctx.strokeStyle = 'rgba(0, 200, 0, 0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxBredd, boxHojd);

            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(meddelande, canvas.width / 2, boxY + boxHojd / 2);
        }
        
        // Rita barriärer
        if (this.visaBarriarer) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            
            this.barriarar.forEach(barr => {
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
            });
            
            ctx.restore();
        }
        
        // Utgång är gömd - visas endast via meddelande när fiende död
    }
    
    ritaFiende() {
        const ctx = this.ctx;
        const fiende = this.aktivFiende;
        
        if (!fiende) return;
        
        // Rita fiende-sprite
        if (fiende.sprite && fiende.sprite.complete && fiende.sprite.naturalWidth > 0) {
            const fiendeSkala = 0.5;
            const fiendeBroj = fiende.sprite.width * fiendeSkala;
            const fiendeHoj = fiende.sprite.height * fiendeSkala;
            
            ctx.drawImage(
                fiende.sprite,
                fiende.x - fiendeBroj / 2,
                fiende.y - fiendeHoj / 2,
                fiendeBroj,
                fiendeHoj
            );
        } else {
            // Fallback: röd cirkel om sprite inte laddad
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(fiende.x, fiende.y, fiende.storlek || 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    skapaFiendeStridsinfo(fiende) {
        if (!fiende) return null;
        const skada = (fiende.skada && typeof fiende.skada === 'object')
            ? {
                fysisk: fiende.skada.fysisk || 0,
                eld: fiende.skada.eld || 0,
                magi: fiende.skada.magi || 0
            }
            : {
                fysisk: fiende.skadaElement === 'fysisk' ? (fiende.skada || 0) : 0,
                eld: fiende.skadaElement === 'eld' ? (fiende.skada || 0) : 0,
                magi: fiende.skadaElement === 'magi' ? (fiende.skada || 0) : 0
            };
        return {
            namn: fiende.namn || 'Fiende',
            liv: fiende.liv || 0,
            maxLiv: fiende.maxLiv || fiende.liv || 0,
            skada,
            motstand: fiende.motstånd || { fysisk: 0, eld: 0, magi: 0 },
            erfarenhet: fiende.erfarenhet || 0
        };
    }

    uppdateraAktivStridInfo(fiende) {
        this.aktivStridInfo = this.skapaFiendeStridsinfo(fiende);
        this.aktivStridInfoTid = 180;
    }

    ritaFiendeStats() {
        const info = this.aktivFiende
            ? this.skapaFiendeStridsinfo(this.aktivFiende)
            : this.aktivStridInfo;
        if (!info || (!this.aktivFiende && this.aktivStridInfoTid <= 0)) return;

        const ctx = this.ctx;
        const boxW = 210;
        const boxH = 98;
        const x = this.canvas.width - boxW - 12;
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

    hamtaLootVisual(itemId, antal = 1) {
        const spelare = this.hamtaSpelare ? this.hamtaSpelare() : null;
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

    ritaLootVisual(ctx, lootVisual, centerX, topY, opacity) {
        if (!lootVisual) return 0;

        if (Array.isArray(lootVisual.valutor) && lootVisual.valutor.length > 0) {
            const boxStorlek = 62;
            const mellanrum = 10;
            const totalBredd = (lootVisual.valutor.length * boxStorlek) + ((lootVisual.valutor.length - 1) * mellanrum);
            const startX = Math.round(centerX - totalBredd / 2);

            ctx.save();
            ctx.globalAlpha = opacity;
            for (let i = 0; i < lootVisual.valutor.length; i++) {
                const valuta = lootVisual.valutor[i];
                const boxX = startX + (i * (boxStorlek + mellanrum));
                const boxY = Math.round(topY);
                const ikon = this.hamtaIkonBild(valuta.ikon);

                ctx.fillStyle = 'rgba(15, 22, 18, 0.92)';
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
                ctx.lineWidth = 2;
                ctx.fillRect(boxX, boxY, boxStorlek, boxStorlek);
                ctx.strokeRect(boxX, boxY, boxStorlek, boxStorlek);
                if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                    ctx.drawImage(ikon, boxX + 11, boxY + 6, 40, 40);
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(valuta.antal), boxX + boxStorlek / 2, boxY + boxStorlek - 11);
            }
            ctx.restore();
            return boxStorlek;
        }

        if (!lootVisual.ikon) return 0;

        const bgStorlek = 78;
        const ikonStorlek = 54;
        const boxX = Math.round(centerX - bgStorlek / 2);
        const boxY = Math.round(topY);
        const ikonX = Math.round(centerX - ikonStorlek / 2);
        const ikonY = Math.round(boxY + (bgStorlek - ikonStorlek) / 2);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(15, 22, 18, 0.92)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, bgStorlek, bgStorlek);
        ctx.strokeRect(boxX, boxY, bgStorlek, bgStorlek);

        const ikon = this.hamtaIkonBild(lootVisual.ikon);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            ctx.drawImage(ikon, ikonX, ikonY, ikonStorlek, ikonStorlek);
        }

        if (lootVisual.antal > 1) {
            const badgeText = `x${lootVisual.antal}`;
            ctx.font = 'bold 16px Arial';
            const badgeW = Math.max(28, Math.ceil(ctx.measureText(badgeText).width + 14));
            const badgeH = 24;
            const badgeX = Math.round(boxX + bgStorlek - badgeW - 4);
            const badgeY = Math.round(boxY + bgStorlek - badgeH - 4);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
        }
        ctx.restore();
        return bgStorlek;
    }
    
    ritaResultatMeddelande() {
        if (!this.resultMeddelande || this.resultMeddelande === '') return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        const elapsed = Date.now() - this.resultMeddelandeTid;
        
        if (elapsed > this.resultMeddelandeDuration) {
            this.resultMeddelande = '';
            this.resultLootVisual = null;
            return;
        }
        
        const fadeStart = this.resultMeddelandeDuration - 500;
        let opacity = 1;
        if (elapsed > fadeStart) {
            opacity = 1 - ((elapsed - fadeStart) / 500);
        }
        
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;

        const rader = String(this.resultMeddelande).split('\n');
        const radHojd = 34;
        const lootHojd = this.resultLootVisual ? 92 : 0;
        const totalHojd = (radHojd * rader.length) + lootHojd;
        const startY = (canvas.height / 2) - (totalHojd / 2) + (radHojd / 2);

        rader.forEach((rad, index) => {
            ctx.fillText(rad, canvas.width / 2, startY + (index * radHojd));
        });

        if (this.resultLootVisual) {
            const lootTopY = startY + (rader.length * radHojd) + 8;
            this.ritaLootVisual(ctx, this.resultLootVisual, canvas.width / 2, lootTopY, opacity);
        }
    }
    
    beraknaSpelareSkala() {
        const spelare = this.hamtaSpelare();
        if (!spelare || !spelare.stats) return 1;
        
        const pixelPerLvl = (this.maxSpelarSkala - this.minSpelarSkala) / 100;
        return this.minSpelarSkala + (spelare.stats.level * pixelPerLvl);
    }
    
    tangentNed(tangent) {
        if (!this.visas) return;
        
        if ((tangent === 'e' || tangent === 'E') && !this.eKnappNedtryckt && this.utgangAktiv && this.spelareVidUtgang) {
            this.eKnappNedtryckt = true;
            const spelare = this.hamtaSpelare();
            if (spelare && typeof spelare.rensaInput === 'function') {
                spelare.rensaInput();
            }
            this.lampnaChansrutan();
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
}
