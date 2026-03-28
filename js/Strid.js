class Strid {
    constructor() {
        // Tillgängliga element
        this.element = ['fysisk', 'eld', 'magi'];

        // Definiera olika fiendetyper med unika stats
        this.fiendeTyper = {
            'bandit': {
                namn: 'Bandit',
                liv: 100,
                skada: {
                    fysisk: 50,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                hastighet: 1.2,
                storlek: 22,
                attackRackvidd: 40,
                attackHastighet: 60,
                erfarenhet: 15,
                sprite: 'assets/Gestalter/Bandit.png'
            },
            'blodvarg': {
                namn: 'Blodvarg',
                liv: 100,
                skada: {
                    fysisk: 130,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 50,
                    eld: 0,
                    magi: 0
                },
                hastighet: 2,
                storlek: 20,
                attackRackvidd: 35,
                attackHastighet: 45,
                erfarenhet: 20,
                sprite: 'assets/Gestalter/Blodvarg.png'
            },
            'bärsärk': {
                namn: 'Bärsärk',
                liv: 100,
                skada: {
                    fysisk: 130,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 60,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0.8,
                storlek: 28,
                attackRackvidd: 50,
                attackHastighet: 90,
                erfarenhet: 40,
                sprite: 'assets/Gestalter/Bärsärk.png'
            },
            'bonde': {
                namn: 'Bonde',
                liv: 100,
                skada: {
                    fysisk: 20,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                hastighet: 1.5,
                storlek: 20,
                attackRackvidd: 45,
                attackHastighet: 50,
                erfarenhet: 12,
                sprite: 'assets/Gestalter/Bonde.png'
            },
            'präst': {
                namn: 'Präst',
                liv: 100,
                skada: {
                    fysisk: 10,
                    eld: 0,
                    magi: 20
                },
                skadaElement: 'magi',
                motstånd: {
                    fysisk: 10,
                    eld: 0,
                    magi: 20
                },
                hastighet: 1.5,
                storlek: 20,
                attackRackvidd: 45,
                attackHastighet: 50,
                erfarenhet: 12,
                sprite: 'assets/Gestalter/Präst.png'
            },
            'viking': {
                namn: 'Viking',
                liv: 100,
                skada: {
                    fysisk: 100,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 40,
                    eld: 0,
                    magi: 0
                },
                hastighet: 1.5,
                storlek: 20,
                attackRackvidd: 45,
                attackHastighet: 50,
                erfarenhet: 12,
                sprite: 'assets/Gestalter/Viking.png',
                loot: ['Träsvärd', 'sten', 'tra', 'jarn', 'hälsoDryck', 'sten']
            }
        };

        // Loot-tabeller för varje fiende
        this.lootTabeller = {
            'bandit': ['1 tom flaska', '1 silver och 2 koppar', '2 kottbit', '7 koppar', '4 koppar', '1 silver'],
            'blodvarg': ['2 kottbit', '1 jarn', '1 kottbit', '2 sten', '1 titanit', '3 jarn'],
            'bärsärk': ['3 silver', '2 kottbit', '4 koppar', '2 silver och 6 koppar', '1 jarn', '2 silver'],
            'bonde': ['Pinne', '2 koppar', '1 silver', '2 silver', '1 kottbit', '1 tra'],
            'präst': ['energiDryck', 'hälsoDryck', 'titanit', 'sko', 'Träsköld', 'energiDryck'],
            'viking': ['2 silver', '2 jarn', '1 guld', '5 silver och 7 koppar', '8 koppar', '3 silver och 5 koppar']
        };
    }

    hamtaFiendeStats(typ) {
        return this.fiendeTyper[typ] || this.fiendeTyper['bandit'];
    }

    hamtaSlumpmassigLoot(fiendeId) {
        const loot = this.lootTabeller[fiendeId];
        if (loot && loot.length > 0) {
            const index = Math.floor(Math.random() * loot.length);
            return loot[index];
        }
        return 'sten'; // fallback
    }

    parsaLoot(lootString) {
        // Returnerar objekt med typ: 'item', 'pengar' eller 'mixed'
        // För pengar: { typ: 'pengar', koppar: X, silver: Y, guld: Z }
        // För items: { typ: 'item', itemId: 'xxx', antal: N }
        
        const result = {
            typ: null,
            koppar: 0,
            silver: 0,
            guld: 0,
            itemId: null,
            antal: 1
        };

        // Kolla om det är pengar (innehåller "koppar", "silver", eller "guld")
        const harPengar = /koppar|silver|guld/.test(lootString);
        
        if (harPengar) {
            result.typ = 'pengar';
            
            // Extrahera koppar
            const kopparMatch = lootString.match(/(\d+)\s*koppar/);
            if (kopparMatch) result.koppar = parseInt(kopparMatch[1]);
            
            // Extrahera silver
            const silverMatch = lootString.match(/(\d+)\s*silver/);
            if (silverMatch) result.silver = parseInt(silverMatch[1]);
            
            // Extrahera guld
            const guldMatch = lootString.match(/(\d+)\s*guld/);
            if (guldMatch) result.guld = parseInt(guldMatch[1]);
        } else {
            // Det är ett item
            result.typ = 'item';
            
            // Kolla om det finns antal i början (t.ex. "2 köttbit")
            const antalMatch = lootString.match(/^(\d+)\s+(.+)/);
            if (antalMatch) {
                result.antal = parseInt(antalMatch[1]);
                result.itemId = antalMatch[2].trim();
            } else {
                result.itemId = lootString.trim();
            }
        }
        
        return result;
    }

    kontrolleraKollision(fiende, spelare) {
        const dx = fiende.x - spelare.x;
        const dy = fiende.y - spelare.y;
        const avstand = Math.sqrt(dx * dx + dy * dy);
        return avstand <= (fiende.storlek + spelare.storlek);
    }

    beraknaAvstand(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    kanAttackera(fiende, spelare) {
        const avstand = this.beraknaAvstand(fiende.x, fiende.y, spelare.x, spelare.y);
        return avstand <= fiende.attackRackvidd;
    }

    beraknaDodsChans(basSkada, skadaElement, mal) {
        // Beräkna chansen att döda: summera all skada som går igenom respektive motstånd.
        if (basSkada && typeof basSkada === 'object') {
            const motstånd = (mal && mal.motstånd && typeof mal.motstånd === 'object') ? mal.motstånd : {};
            let dodsChans = 0;
            for (const element of this.element) {
                const skada = typeof basSkada[element] === 'number' ? basSkada[element] : 0;
                const elementMotstånd = typeof motstånd[element] === 'number' ? motstånd[element] : 0;
                dodsChans += Math.max(0, skada - elementMotstånd);
            }
            return Math.max(0, Math.min(100, dodsChans));
        }

        const motstånd = (mal && mal.motstånd && mal.motstånd[skadaElement]) ? mal.motstånd[skadaElement] : 0;
        return Math.max(0, Math.min(100, (typeof basSkada === 'number' ? basSkada : 0) - motstånd));
    }

    beraknaFiendeTraffChans(basSkada, skadaElement, spelare) {
        const motstand = (spelare && spelare.motstånd && typeof spelare.motstånd[skadaElement] === 'number')
            ? spelare.motstånd[skadaElement]
            : 0;
        const numeriskSkada = typeof basSkada === 'number' ? basSkada : 0;

        if (motstand > numeriskSkada) {
            return 0;
        }

        return Math.max(0, Math.min(100, numeriskSkada - motstand));
    }

    utforAttack(fiende, spelare, appliceraSkada = true) {
        if (!fiende.levande || !spelare) return false;

        // Kolla om fienden kan attackera
        if (fiende.attackTimer > 0) {
            fiende.attackTimer--;
            return false;
        }

        if (this.kanAttackera(fiende, spelare)) {
            // Beräkna träffchans baserat på element och spelarens motstånd.
            const element = fiende.skadaElement || 'fysisk';
            const basSkada = fiende.skada && typeof fiende.skada === 'object'
                ? (typeof fiende.skada[element] === 'number' ? fiende.skada[element] : 0)
                : (fiende.skada || 0);
            const dodsChans = this.beraknaFiendeTraffChans(basSkada, element, spelare);

            // Slumpa om attacken lyckas döda
            const slump = Math.random() * 100;
            
            if (slump < dodsChans) {
                if (!appliceraSkada) {
                    console.log(`${fiende.namn} attackerar med ${element}! Dödschans: ${dodsChans.toFixed(1)}% - TRÄFF!`);
                } else if (typeof spelare.taSkada === 'function') {
                    const skadeResultat = spelare.taSkada(Math.max(1, spelare.liv || 1), { element });
                    if (skadeResultat && skadeResultat.undvekSkada && skadeResultat.passiv) {
                        console.log(`${fiende.namn} attackerar med ${element}! Dödschans: ${dodsChans.toFixed(1)}% - UNDVEKS via ${skadeResultat.passiv.namn}!`);
                    } else {
                        console.log(`${fiende.namn} attackerar med ${element}! Dödschans: ${dodsChans.toFixed(1)}% - TRÄFF! Spelaren dör!`);
                    }
                } else {
                    spelare.liv = 0;
                    console.log(`${fiende.namn} attackerar med ${element}! Dödschans: ${dodsChans.toFixed(1)}% - TRÄFF! Spelaren dör!`);
                }
            } else {
                // Attacken misslyckas
                console.log(`${fiende.namn} attackerar med ${element}! Dödschans: ${dodsChans.toFixed(1)}% - MISS!`);
            }

            // Återställ attack-timer
            fiende.attackTimer = fiende.attackHastighet;
            return slump < dodsChans;
        }

        return false;
    }

    hanteraFiendeDod(fiende, spelare) {
        if (fiende.levande || fiende.erfarenhetGiven) return;

        // Ge erfarenhet till spelaren
        if (spelare && fiende.erfarenhet) {
            console.log(`Spelaren får ${fiende.erfarenhet} erfarenhet!`);
            // Här kan du lägga till erfarenhetssystem senare
        }

        fiende.erfarenhetGiven = true;
    }
}
