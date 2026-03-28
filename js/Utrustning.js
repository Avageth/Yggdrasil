class Utrustning {
    constructor(spelare) {
        this.spelare = spelare;
        
        // Utrustningsplatser
        this.vapen = null;
        this.rustning = null;
        this.hjalm = null;
        this.skold = null;
        this.accessoar = null;
        
        // Inventory - ryggsäck
        this.inventory = [];
        this.maxInventory = 25;
        
        // Snabbvalsknappar (1-5)
        this.snabbval = [null, null, null, null, null];
        
        // Tillgängliga föremål
        this.tillgangligaForemal = {
            // Vapen
            'Träsvärd': { typ: 'vapen', maxStack: 1, strid: { fysisk: 20, eld: 0, magi: 0 }, jakt: { fysisk: 10, eld: 0, magi: 0 }, namn: 'Träsvärd', ikon: 'assets/Utrustning/Träsvärd.png', beskrivning: 'Ett enkelt träsvärd' },
            'järnsvärd': { typ: 'vapen', maxStack: 1, strid: { fysisk: 50, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, namn: 'Järnsvärd', ikon: 'assets/Utrustning/Järnsvärd.png', beskrivning: 'Ett järnsvärd' },
            'yxa': { typ: 'vapen', maxStack: 1, strid: { fysisk: 100, eld: 0, magi: 0 }, jakt: { fysisk: 30, eld: 0, magi: 0 }, namn: 'Strids Yxa', ikon: 'assets/Utrustning/Strids Yxa.png', beskrivning: 'En tung stridsyxa', passiv: { typ: 'dubbel_skada_chans', namn: 'Klyvning', beskrivning: '25% chans att göra dubbel fysisk skada i strid.', chans: 25, multiplikator: 2, element: 'fysisk' } },
            'Träklubba': { typ: 'vapen', maxStack: 1, strid: { fysisk: 30, eld: 0, magi: 0 }, jakt: { fysisk: 10, eld: 0, magi: 0 }, namn: 'Träklubba', ikon: 'assets/Utrustning/Träklubba.png', beskrivning: 'En träklubba' },
            'Järnklubba': { typ: 'vapen', maxStack: 1, strid: { fysisk: 60, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, namn: 'Järnklubba', ikon: 'assets/Utrustning/Järnklubba.png', beskrivning: 'En Järnklubba' },
            'stav': {
                typ: 'vapen',
                maxStack: 1,
                strid: { fysisk: 10, eld: 0, magi: 50 },
                jakt: { fysisk: 0, eld: 0, magi: 20 },
                namn: 'Völva Stav',
                ikon: 'assets/Utrustning/Völva Stav.png',
                beskrivning: 'En magisk stav',
                passiv: {
                    typ: 'flerstegs_passiver',
                    namn: 'Naturväv',
                    beskrivning: 'Völva Staven väcker fler krafter när Konstruktion, Reflex och Special höjs tillsammans.',
                    passiver: [
                        {
                            typ: 'energi_aterflode',
                            namn: 'Energiflöde',
                            beskrivning: '40% chans att återfå 1 energi när din magi träffar.',
                            chans: 40,
                            energi: 1,
                            element: 'magi',
                            krav: { konstruktion: 3, reflex: 3, special: 3 }
                        },
                        {
                            typ: 'livsstjal',
                            namn: 'Livsväv',
                            beskrivning: '35% chans att återfå 1 liv när din magi träffar.',
                            chans: 35,
                            liv: 1,
                            element: 'magi',
                            krav: { konstruktion: 5, reflex: 5, special: 5 }
                        },
                        {
                            typ: 'dubbel_skada_chans',
                            namn: 'Sejdblixt',
                            beskrivning: '20% chans att göra dubbel magisk skada i strid.',
                            chans: 20,
                            multiplikator: 2,
                            element: 'magi',
                            krav: { konstruktion: 8, reflex: 8, special: 8 }
                        }
                    ]
                }
            },
            'pilbage': { typ: 'vapen', maxStack: 1, strid: { fysisk: 50, eld: 0, magi: 0 }, jakt: { fysisk: 60, eld: 0, magi: 0 }, namn: 'Pilbåge', ikon: 'assets/Utrustning/Pilbåge.png', beskrivning: 'En enkel pilbåge', passiv: { typ: 'undvik_skada_chans', namn: 'Undanflykt', beskrivning: '10% chans per Special-nivå att undvika all skada när du blir träffad.', chansPerSpecial: 10 } },
            'Högaffel': { typ: 'vapen', maxStack: 1, strid: { fysisk: 20, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, namn: 'Högaffel', ikon: 'assets/Utrustning/Högaffel.png', beskrivning: 'För att gräva' },
            'hammare': { typ: 'vapen', maxStack: 1, strid: { fysisk: 80, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, namn: 'Stridshammare', ikon: 'assets/Utrustning/Stridshammare.png', beskrivning: 'För att bygga' },
            'Träspjut': { typ: 'vapen', maxStack: 1, strid: { fysisk: 20, eld: 0, magi: 0 }, jakt: { fysisk: 50, eld: 0, magi: 0 }, namn: 'Träspjut', ikon: 'assets/Utrustning/Träspjut.png', beskrivning: 'Ett enkelt träspjut' },
            'Järnspjut': { typ: 'vapen', maxStack: 1, strid: { fysisk: 50, eld: 0, magi: 0 }, jakt: { fysisk: 70, eld: 0, magi: 0 }, namn: 'Järnspjut', ikon: 'assets/Utrustning/Järnspjut.png', beskrivning: 'Ett järnspjut' },
            'Dolk': { typ: 'vapen', maxStack: 1, strid: { fysisk: 50, eld: 0, magi: 0 }, jakt: { fysisk: 50, eld: 0, magi: 0 }, namn: 'Dolk', ikon: 'assets/Utrustning/Dolk.png', beskrivning: 'En dolk' },
            'Pinne': { typ: 'vapen', maxStack: 1, strid: { fysisk: 10, eld: 0, magi: 0 }, jakt: { fysisk: 0, eld: 0, magi: 0 }, namn: 'Pinne', ikon: 'assets/Utrustning/Pinne.png', beskrivning: 'En träpinne' },
            
            // Rustningar
            'sko': { typ: 'rustning', maxStack: 1, försvar: { fysisk: 10, eld: 0, magi: 0 }, namn: 'Sko', ikon: 'assets/Utrustning/Sko.png', beskrivning: 'Lätt rustning' },
            'Ringbrynja': { typ: 'rustning', maxStack: 1, försvar: { fysisk: 30, eld: 0, magi: 0 }, namn: 'Ringbrynja', ikon: 'assets/Utrustning/Ringbrynja.png', beskrivning: 'Tung rustning' },
            'Träsköld': { typ: 'skold', maxStack: 1, försvar: { fysisk: 10, eld: 0, magi: 0 }, namn: 'Träsköld', ikon: 'assets/Utrustning/Trä Sköld.png', beskrivning: 'En träsköld' },
            'Järnsköld': { typ: 'skold', maxStack: 1, försvar: { fysisk: 20, eld: 0, magi: 0 }, namn: 'Järnsköld', ikon: 'assets/Utrustning/Järn Sköld.png', beskrivning: 'En järnsköld' },
            'vikingHjalm': { typ: 'hjalm', maxStack: 1, försvar: { fysisk: 30, eld: 0, magi: 0 }, namn: 'Viking Hjälm', ikon: 'assets/Utrustning/Viking Hjälm.png', beskrivning: 'En tung hjälm' },
            
            // Konsumerbara
            'hälsoDryck': { typ: 'konsumerbar', maxStack: 10, effekt: 'liv', värde: 1, namn: 'Livs Dryck', ikon: 'assets/Varor/Livs Dryck.png', beskrivning: 'Återställer 1 liv', lämnarKvar: 'tom flaska' },
            'energiDryck': { typ: 'konsumerbar', maxStack: 10, effekt: 'energi', värde: 25, namn: 'Energi Dryck', ikon: 'assets/Varor/Energi Dryck.png', beskrivning: 'Återställer 25 energi', lämnarKvar: 'tom flaska' },
            'flaskaMedVatten': { typ: 'konsumerbar', maxStack: 99, effekt: 'energi', värde: 1, namn: 'Flaska med Vatten', ikon: 'assets/Varor/Flaska med Vatten.png', beskrivning: 'En flaska med vatten', lämnarKvar: 'tom flaska' },
            'galdratVatten': { typ: 'konsumerbar', maxStack: 10, effekt: 'galdrat', värde: 2, namn: 'Galdrat Vatten', ikon: 'assets/Varor/Galdrat Vatten.png', beskrivning: 'Återställer full energi och 2 liv', lämnarKvar: 'tom flaska' },
            
            // Varor
            'kottbit': { typ: 'vara', maxStack: 99, namn: 'Köttbit', ikon: 'assets/Varor/Köttbit.png', beskrivning: 'En bit kött' },
            'sten': { typ: 'vara', maxStack: 99, namn: 'Sten', ikon: 'assets/Varor/Sten.png', beskrivning: 'En bit sten' },
            'tra': { typ: 'vara', maxStack: 99, namn: 'Trä', ikon: 'assets/Varor/Trä.png', beskrivning: 'En bit trä' },
            'jarn': { typ: 'vara', maxStack: 99, namn: 'Järn', ikon: 'assets/Varor/Järn.png', beskrivning: 'En bit järn' },
            'titanit': { typ: 'vara', maxStack: 99, namn: 'Titanit', ikon: 'assets/Varor/Titanit.png', beskrivning: 'En bit titanit' },
            'tom flaska': { typ: 'vara', maxStack: 99, namn: 'Tom Flaska', ikon: 'assets/Varor/Tom Flaska.png', beskrivning: 'En tom flaska' }
        };
    }

    skaRaknaForemalSomPlockat(source) {
        const normalized = String(source || '').toLowerCase();
        return !['purchase', 'start', 'internal', 'consume-return', 'craft', 'transmute'].includes(normalized);
    }

    raknaUpptagnaInventoryPlatser() {
        if (!Array.isArray(this.inventory)) return 0;
        return this.inventory.reduce((sum, item) => sum + (item ? 1 : 0), 0);
    }

    hamtaForstaTommaInventoryIndex() {
        if (!Array.isArray(this.inventory)) return 0;
        for (let i = 0; i < this.maxInventory; i++) {
            if (!this.inventory[i]) return i;
        }
        return -1;
    }

    stadaTommaSvansrutor() {
        if (!Array.isArray(this.inventory)) return;
        while (this.inventory.length > 0 && !this.inventory[this.inventory.length - 1]) {
            this.inventory.pop();
        }
    }

    placeraForemalIForstaTommaRuta(foremal) {
        if (!foremal) return false;
        const ledigIndex = this.hamtaForstaTommaInventoryIndex();
        if (ledigIndex === -1) return false;
        this.inventory[ledigIndex] = foremal;
        return true;
    }
    
    // Lägg till föremål i inventory
    laggTillForemal(foremalId, options) {
        // options can include additional properties like { questFor: 'questId' }
        if (foremalId === 'manaDryck') foremalId = 'energiDryck';
        const foremal = this.tillgangligaForemal[foremalId];
        if (foremal) {
            const skaRaknasSomPlockat = this.skaRaknaForemalSomPlockat(options && options.source);
            const maxStack = this.hamtaMaxStack(foremal);
            const befintlig = this.inventory.find((item) => item && item.id === foremalId && item.count < maxStack && !item.questFor);
            if (befintlig && !(options && options.questFor)) {
                // only stack into non-quest stacks unless we're adding a non-quest item
                befintlig.count += 1;
                if (skaRaknasSomPlockat && this.spelare && typeof this.spelare.registreraPlockadeForemal === 'function') {
                    this.spelare.registreraPlockadeForemal(1);
                }
                return true;
            }
            if (this.raknaUpptagnaInventoryPlatser() >= this.maxInventory) {
                console.log('Inventoryt är fullt!');
                return false;
            }
            const newItem = Object.assign({ id: foremalId, count: 1 }, foremal);
            if (options) Object.assign(newItem, options);
            this.placeraForemalIForstaTommaRuta(newItem);
            console.log('La till ' + foremal.namn + ' i inventory');
            if (skaRaknasSomPlockat && this.spelare && typeof this.spelare.registreraPlockadeForemal === 'function') {
                this.spelare.registreraPlockadeForemal(1);
            }
            return true;
        }
        return false;
    }
    
    // Ta bort föremål från inventory
    taBortForemal(index) {
        if (index >= 0 && index < this.inventory.length) {
            const foremal = this.inventory[index];
            if (!foremal) return false;
            if (foremal.count && foremal.count > 1) {
                foremal.count -= 1;
            } else {
                this.inventory[index] = null;
                this.stadaTommaSvansrutor();
            }
            console.log('Tog bort ' + foremal.namn + ' från inventory');
            return true;
        }
        return false;
    }
    
    // Utrusta vapen
    utrustaVapen(foremalIndex) {
        const foremal = this.inventory[foremalIndex];
        if (foremal && (foremal.typ === 'vapen' || foremal.typ === 'verktyg')) {
            if (!this.uppfyllerKrav(foremal)) {
                console.log('Krav ej uppfyllda för att utrusta ' + foremal.id);
                return false;
            }
            // Ta av gammalt vapen om det finns
            if (this.vapen) {
                this.placeraForemalIForstaTommaRuta(this.vapen);
            }
            this.vapen = foremal;
            this.inventory[foremalIndex] = null;
            this.stadaTommaSvansrutor();
            this.uppdateraStats();
            return true;
        }
        return false;
    }
    
    // Utrusta rustning
    utrustaRustning(foremalIndex) {
        const foremal = this.inventory[foremalIndex];
        if (foremal && foremal.typ === 'rustning') {
            if (!this.uppfyllerKrav(foremal)) {
                console.log('Krav ej uppfyllda för att utrusta ' + foremal.id);
                return false;
            }
            if (this.rustning) {
                this.placeraForemalIForstaTommaRuta(this.rustning);
            }
            this.rustning = foremal;
            this.inventory[foremalIndex] = null;
            this.stadaTommaSvansrutor();
            this.uppdateraStats();
            return true;
        }
        return false;
    }

    // Utrusta sköld
    utrustaSkold(foremalIndex) {
        const foremal = this.inventory[foremalIndex];
        if (foremal && foremal.typ === 'skold') {
            if (!this.uppfyllerKrav(foremal)) {
                console.log('Krav ej uppfyllda för att utrusta ' + foremal.id);
                return false;
            }
            if (this.skold) {
                this.placeraForemalIForstaTommaRuta(this.skold);
            }
            this.skold = foremal;
            this.inventory[foremalIndex] = null;
            this.stadaTommaSvansrutor();
            this.uppdateraStats();
            return true;
        }
        return false;
    }

    // Utrusta hjälm
    utrustaHjalm(foremalIndex) {
        const foremal = this.inventory[foremalIndex];
        if (foremal && foremal.typ === 'hjalm') {
            if (!this.uppfyllerKrav(foremal)) {
                console.log('Krav ej uppfyllda för att utrusta ' + foremal.id);
                return false;
            }
            if (this.hjalm) {
                this.placeraForemalIForstaTommaRuta(this.hjalm);
            }
            this.hjalm = foremal;
            this.inventory[foremalIndex] = null;
            this.stadaTommaSvansrutor();
            this.uppdateraStats();
            return true;
        }
        return false;
    }

    // Utrusta valfri utrustning från inventory
    utrustaForemal(foremalIndex) {
        const foremal = this.inventory[foremalIndex];
        if (!foremal) return false;
        if (foremal.typ === 'vapen' || foremal.typ === 'verktyg') {
            return this.utrustaVapen(foremalIndex);
        }
        if (foremal.typ === 'rustning') {
            return this.utrustaRustning(foremalIndex);
        }
        if (foremal.typ === 'skold') {
            return this.utrustaSkold(foremalIndex);
        }
        if (foremal.typ === 'hjalm') {
            return this.utrustaHjalm(foremalIndex);
        }
        if (foremal.typ === 'konsumerbar') {
            return this.användForemal(foremalIndex);
        }
        return false;
    }

    uppfyllerKrav(foremal) {
        if (!foremal) return false;
        if (typeof Krav !== 'function' || !this.spelare || !this.spelare.krav) return true;

        const krav = Krav.hamtaKravForForemal(foremal);
        const spelarKrav = this.spelare.krav;

        return (spelarKrav.konstruktion || 0) >= (krav.konstruktion || 1)
            && (spelarKrav.reflex || 0) >= (krav.reflex || 1)
            && (spelarKrav.special || 0) >= (krav.special || 1);
    }

    hamtaSaknadeKrav(foremal) {
        if (!foremal) return [];
        if (typeof Krav !== 'function' || !this.spelare || !this.spelare.krav) return [];

        const krav = Krav.hamtaKravForForemal(foremal);
        const spelarKrav = this.spelare.krav;
        const saknas = [];

        if ((spelarKrav.konstruktion || 0) < (krav.konstruktion || 1)) saknas.push('Konstruktion');
        if ((spelarKrav.reflex || 0) < (krav.reflex || 1)) saknas.push('Reflex');
        if ((spelarKrav.special || 0) < (krav.special || 1)) saknas.push('Special');

        return saknas;
    }

    laggTillForemalObj(foremal, options) {
        if (!foremal) return false;
        const skaRaknasSomPlockat = this.skaRaknaForemalSomPlockat((options && options.source) || foremal.source);
        const maxStack = this.hamtaMaxStack(foremal);
        let remaining = (foremal.count && Number.isFinite(foremal.count)) ? Math.max(0, Math.floor(foremal.count)) : 1;
        const requested = remaining;
        let addedTotal = 0;

        if (foremal.id) {
            // Fill existing partial stacks first
            while (remaining > 0) {
                const bef = this.inventory.find((item) => item && item.id === foremal.id && (item.count || 1) < maxStack);
                if (bef) {
                    const space = maxStack - (bef.count || 1);
                    const take = Math.min(space, remaining);
                    bef.count = (bef.count || 1) + take;
                    remaining -= take;
                    addedTotal += take;
                    continue;
                }
                // No existing stack with space: create new stack if inventory has room
                if (this.raknaUpptagnaInventoryPlatser() >= this.maxInventory) {
                    if (addedTotal > 0 && skaRaknasSomPlockat && this.spelare && typeof this.spelare.registreraPlockadeForemal === 'function') {
                        this.spelare.registreraPlockadeForemal(addedTotal);
                    }
                    // Could not add all; return true if we added any, false if none
                    return remaining < requested;
                }
                const createCount = Math.min(remaining, maxStack);
                const newItem = Object.assign({}, foremal);
                newItem.count = createCount;
                this.placeraForemalIForstaTommaRuta(newItem);
                remaining -= createCount;
                addedTotal += createCount;
            }
            if (addedTotal > 0 && skaRaknasSomPlockat && this.spelare && typeof this.spelare.registreraPlockadeForemal === 'function') {
                this.spelare.registreraPlockadeForemal(addedTotal);
            }
            return true;
        }

        // Fallback for items without id
        if (this.raknaUpptagnaInventoryPlatser() >= this.maxInventory) {
            console.log('Inventoryt är fullt!');
            return false;
        }
        this.placeraForemalIForstaTommaRuta(foremal);
        if (skaRaknasSomPlockat && this.spelare && typeof this.spelare.registreraPlockadeForemal === 'function') {
            this.spelare.registreraPlockadeForemal((foremal.count && Number.isFinite(foremal.count)) ? Math.max(1, Math.floor(foremal.count)) : 1);
        }
        return true;
    }

    flyttaForemal(franIndex, tillIndex) {
        if (!Array.isArray(this.inventory)) return false;
        if (!Number.isInteger(franIndex) || !Number.isInteger(tillIndex)) return false;
        if (franIndex < 0 || franIndex >= this.maxInventory) return false;
        if (tillIndex < 0 || tillIndex >= this.maxInventory) return false;

        const foremal = this.inventory[franIndex];
        if (!foremal) return false;

        while (this.inventory.length <= Math.max(franIndex, tillIndex)) {
            this.inventory.push(null);
        }

        if (franIndex === tillIndex) return true;

        const malForemal = this.inventory[tillIndex] || null;
        this.inventory[tillIndex] = foremal;
        this.inventory[franIndex] = malForemal;
        this.stadaTommaSvansrutor();
        return true;
    }

    avUtrustaPlats(plats) {
        let foremal = null;
        if (plats === 'vapen') {
            foremal = this.vapen;
        } else if (plats === 'rustning') {
            foremal = this.rustning;
        } else if (plats === 'skold') {
            foremal = this.skold;
        } else if (plats === 'hjalm') {
            foremal = this.hjalm;
        }
        if (!foremal) return false;

        if (!this.laggTillForemalObj(foremal, { source: 'internal' })) return false;

        if (plats === 'vapen') {
            this.vapen = null;
        } else if (plats === 'rustning') {
            this.rustning = null;
        } else if (plats === 'skold') {
            this.skold = null;
        } else if (plats === 'hjalm') {
            this.hjalm = null;
        }
        this.uppdateraStats();
        return true;
    }
    
    // Använd konsumerbart föremål
    användForemal(foremalIndex) {
        const foremal = this.inventory[foremalIndex];
        if (foremal && foremal.typ === 'konsumerbar') {
            const skaSpelaDryckLjud = ['flaskaMedVatten', 'energiDryck', 'hälsoDryck', 'galdratVatten'].includes(foremal.id);
            console.log(`Använder ${foremal.namn} (id: ${foremal.id}) med effekt: ${foremal.effekt}, värde: ${foremal.värde}`);
            console.log(`Före: liv=${this.spelare.liv}, energi=${this.spelare.energi}`);
            
            if (foremal.effekt === 'liv') {
                this.spelare.liv = Math.min(this.spelare.liv + foremal.värde, this.spelare.maxLiv);
            } else if (foremal.effekt === 'energi') {
                this.spelare.energi = Math.min(this.spelare.energi + foremal.värde, this.spelare.maxEnergi);
            } else if (foremal.effekt === 'galdrat') {
                this.spelare.liv = Math.min(this.spelare.liv + foremal.värde, this.spelare.maxLiv);
                this.spelare.energi = this.spelare.maxEnergi;
            }
            
            console.log(`Efter: liv=${this.spelare.liv}, energi=${this.spelare.energi}`);

            if (skaSpelaDryckLjud && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                window.spelaStandardLjud('dryck');
            }
            
            // Ta bort föremålet
            this.taBortForemal(foremalIndex);
            
            // Om föremålet lämnar kvar något (t.ex. tom flaska), lägg till det
            if (foremal.lämnarKvar) {
                this.laggTillForemal(foremal.lämnarKvar, { source: 'consume-return' });
            }
            
            return true;
        }
        return false;
    }
    
    // Lägg till i snabbval
    laggTillSnabbval(plats, foremalIndex) {
        if (plats >= 0 && plats < 5) {
            this.snabbval[plats] = foremalIndex;
            return true;
        }
        return false;
    }
    
    // Använd snabbval
    användSnabbval(plats) {
        if (plats >= 0 && plats < 5 && this.snabbval[plats] !== null) {
            this.användForemal(this.snabbval[plats]);
        }
    }
    
    // Uppdatera spelarens stats baserat på utrustning
    uppdateraStats() {
        // Grundstats från klass
        let baseStyrka = this.spelare.klass.stats.styrka;
        let baseKonstruktion = this.spelare.klass.stats.konstruktion;
        let baseSpecial = this.spelare.klass.stats.special;
        
        // Lägg till bonus från utrustning
        let bonusStyrka = 0;
        let bonusKonstruktion = 0;
        let bonusSpecial = 0;
        let bonusUthållighet = 0;
        
        if (this.vapen) {
            bonusStyrka += this.vapen.styrka || 0;
            bonusKonstruktion += this.vapen.konstruktion || 0;
            bonusSpecial += this.vapen.special || 0;
        }
        
        if (this.rustning) {
            bonusUthållighet += this.rustning.uthållighet || 0;
        }

        if (this.skold) {
            bonusUthållighet += this.skold.uthållighet || 0;
        }

        if (this.hjalm) {
            bonusUthållighet += this.hjalm.uthållighet || 0;
        }
        
        // Uppdatera spelarens stats
        this.spelare.styrka = baseStyrka + bonusStyrka;
        this.spelare.konstruktion = baseKonstruktion + bonusKonstruktion;
        this.spelare.special = baseSpecial + bonusSpecial;

        if (typeof this.spelare.uppdateraAktivaBonusEgenskaper === 'function' && !this.spelare._synkarBonusStats) {
            this.spelare.uppdateraAktivaBonusEgenskaper();
        }

        const skapaTommaElementStats = () => ({ fysisk: 0, eld: 0, magi: 0 });
        const laggTillElementStats = (mal, kalla) => {
            if (!kalla) return;
            if (typeof kalla === 'number') {
                mal.fysisk += kalla;
                return;
            }
            if (typeof kalla !== 'object') return;
            mal.fysisk += kalla.fysisk || 0;
            mal.eld += kalla.eld || 0;
            mal.magi += kalla.magi || 0;
        };

        // Uppdatera elementbaserad strid och jakt från utrustning och aktiva bonusar
        const totalStrid = skapaTommaElementStats();
        if (this.vapen) {
            laggTillElementStats(totalStrid, this.vapen.strid);
        }

        const totalJakt = skapaTommaElementStats();
        if (this.vapen) {
            laggTillElementStats(totalJakt, this.vapen.jakt);
        }

        const bonus = this.spelare.bonusEgenskaper || {};
        laggTillElementStats(totalStrid, bonus.strid);
        laggTillElementStats(totalJakt, bonus.jakt);

        this.spelare.strid = totalStrid;
        this.spelare.jakt = totalJakt;

        const totalmotstånd = skapaTommaElementStats();
        const addForsvar = (foremal) => {
            if (!foremal) return;
            const forsvar = foremal.forsvar || foremal['försvar'];
            laggTillElementStats(totalmotstånd, forsvar);
        };

        addForsvar(this.rustning);
        addForsvar(this.skold);
        addForsvar(this.hjalm);
        laggTillElementStats(totalmotstånd, bonus.försvar || bonus.forsvar);

        this.spelare.motstånd = totalmotstånd;
    }
    
    // Hämta total vikt
    getTotalVikt() {
        let vikt = 0;
        for (let foremal of this.inventory) {
            if (!foremal) continue;
            const count = foremal.count || 1;
            vikt += (foremal.vikt || 1) * count;
        }
        return vikt;
    }
    
    // Kontrollera om spelare har specifikt föremål
    harForemal(foremalId) {
        return this.inventory.some(f => f.id === foremalId && (f.count || 1) > 0);
    }

    hamtaMaxStack(foremal) {
        if (foremal.maxStack) return foremal.maxStack;
        if (foremal.typ === 'konsumerbar') return 10;
        if (foremal.typ === 'vara') return 99;
        return 1;
    }

    normaliseraForemalData(foremal) {
        if (!foremal || typeof foremal !== 'object') return foremal;
        if (foremal.id === 'manaDryck') {
            foremal = Object.assign({}, foremal, { id: 'energiDryck' });
        }
        const def = foremal.id && this.tillgangligaForemal && this.tillgangligaForemal[foremal.id]
            ? this.tillgangligaForemal[foremal.id]
            : null;
        if (!def) return Object.assign({}, foremal);

        const normaliserat = Object.assign({}, foremal, def, { id: foremal.id });
        if (def.typ === 'konsumerbar') {
            normaliserat.typ = def.typ;
            normaliserat.effekt = def.effekt;
            normaliserat.namn = def.namn;
            normaliserat.beskrivning = def.beskrivning;
            normaliserat.ikon = def.ikon;
            normaliserat.lämnarKvar = def.lämnarKvar;
            normaliserat.värde = def.värde;
            normaliserat.maxStack = def.maxStack;
        }
        return normaliserat;
    }

    hamtaVapenPassiv() {
        if (!this.vapen || !this.vapen.passiv || typeof this.vapen.passiv !== 'object') return null;
        return this.vapen.passiv;
    }

    hamtaPassivNivaer() {
        const krav = this.spelare && this.spelare.krav ? this.spelare.krav : null;
        return {
            konstruktion: Math.max(0, krav && typeof krav.konstruktion === 'number'
                ? krav.konstruktion
                : (this.spelare && typeof this.spelare.konstruktion === 'number' ? this.spelare.konstruktion : 0)),
            reflex: Math.max(0, krav && typeof krav.reflex === 'number' ? krav.reflex : 0),
            special: Math.max(0, krav && typeof krav.special === 'number'
                ? krav.special
                : (this.spelare && typeof this.spelare.special === 'number' ? this.spelare.special : 0))
        };
    }

    hamtaPassivLista(foremal = null) {
        const passivKalla = foremal && foremal.passiv && typeof foremal.passiv === 'object'
            ? foremal.passiv
            : this.hamtaVapenPassiv();
        if (!passivKalla || typeof passivKalla !== 'object') return [];
        if (Array.isArray(passivKalla.passiver)) {
            return passivKalla.passiver.filter((passiv) => passiv && typeof passiv === 'object');
        }
        return [passivKalla];
    }

    arPassivUpplast(passiv) {
        if (!passiv || !passiv.krav || typeof passiv.krav !== 'object') return true;
        const nivaer = this.hamtaPassivNivaer();
        return nivaer.konstruktion >= (passiv.krav.konstruktion || 0)
            && nivaer.reflex >= (passiv.krav.reflex || 0)
            && nivaer.special >= (passiv.krav.special || 0);
    }

    hamtaAktivaVapenPassiver() {
        return this.hamtaPassivLista().filter((passiv) => this.arPassivUpplast(passiv));
    }

    hamtaPassivTooltipRader(foremal = null) {
        const passivKalla = foremal && foremal.passiv && typeof foremal.passiv === 'object'
            ? foremal.passiv
            : this.hamtaVapenPassiv();
        if (!passivKalla || typeof passivKalla !== 'object') return [];

        const rader = [];
        const passivNamn = passivKalla.namn || 'Passiv';
        rader.push('Passiv: ' + passivNamn);

        if (Array.isArray(passivKalla.passiver)) {
            const nivaer = this.hamtaPassivNivaer();
            if (passivKalla.beskrivning) {
                rader.push(passivKalla.beskrivning);
            }
            rader.push({
                type: 'krav',
                label: 'Nivåer:',
                values: {
                    konstruktion: nivaer.konstruktion || 0,
                    reflex: nivaer.reflex || 0,
                    special: nivaer.special || 0
                }
            });
            rader.push('');
            passivKalla.passiver.forEach((passiv, index) => {
                if (!passiv || typeof passiv !== 'object') return;
                const upplast = this.arPassivUpplast(passiv);
                const krav = passiv.krav || {};
                if (index > 0) {
                    rader.push('');
                }
                rader.push(`Steg ${index + 1}: ${passiv.namn}`);
                if (upplast) {
                    rader.push('Status: Aktiv');
                    rader.push(`Effekt: ${passiv.beskrivning || 'Aktiv.'}`);
                } else {
                    rader.push('Status: Låst');
                    rader.push({
                        type: 'krav',
                        label: 'Krav:',
                        values: {
                            konstruktion: krav.konstruktion || 0,
                            reflex: krav.reflex || 0,
                            special: krav.special || 0
                        }
                    });
                    rader.push(`Effekt: ${passiv.beskrivning || 'Aktiv.'}`);
                }
            });
            rader.push('');
            return rader;
        }

        if (passivKalla.beskrivning) {
            rader.push(passivKalla.beskrivning);
        }
        return rader;
    }

    rullaVapenPassivSkada(element = 'fysisk') {
        const passiver = this.hamtaAktivaVapenPassiver().filter((passiv) => passiv.typ === 'dubbel_skada_chans');
        for (const passiv of passiver) {
            if (passiv.element && passiv.element !== element) continue;

            const chans = typeof passiv.chans === 'number' ? Math.max(0, Math.min(100, passiv.chans)) : 0;
            const multiplikator = typeof passiv.multiplikator === 'number' ? Math.max(1, passiv.multiplikator) : 2;
            const utlöst = Math.random() * 100 < chans;

            if (utlöst) {
                return {
                    multiplikator,
                    utlöst: true,
                    passiv
                };
            }
        }

        return { multiplikator: 1, utlöst: false, passiv: null };
    }

    rullaVapenPassivForsvar() {
        const passiver = this.hamtaAktivaVapenPassiver().filter((passiv) => passiv.typ === 'undvik_skada_chans');
        if (!passiver.length) return { undvekSkada: false, utlöst: false, passiv: null };

        const passiv = passiver[0];

        const specialNiva = this.spelare
            ? Math.max(0,
                this.spelare.krav && typeof this.spelare.krav.special === 'number'
                    ? this.spelare.krav.special
                    : (typeof this.spelare.special === 'number' ? this.spelare.special : 0)
            )
            : 0;
        const chansPerSpecial = typeof passiv.chansPerSpecial === 'number'
            ? Math.max(0, passiv.chansPerSpecial)
            : (typeof passiv.chans === 'number' ? Math.max(0, passiv.chans) : 0);
        const chans = Math.max(0, Math.min(100, specialNiva * chansPerSpecial));
        const utlöst = Math.random() * 100 < chans;

        return {
            undvekSkada: utlöst,
            utlöst,
            passiv,
            chans,
            specialNiva
        };
    }

    tillampaVapenPassiverEfterTraff(element = 'fysisk') {
        const resultat = { utlostaPassiver: [], meddelanden: [] };
        if (!this.spelare) return resultat;

        const passiver = this.hamtaAktivaVapenPassiver().filter((passiv) => passiv.typ === 'livsstjal' || passiv.typ === 'energi_aterflode');
        for (const passiv of passiver) {
            if (passiv.element && passiv.element !== element) continue;

            const chans = typeof passiv.chans === 'number' ? Math.max(0, Math.min(100, passiv.chans)) : 0;
            if (!(Math.random() * 100 < chans)) continue;

            if (passiv.typ === 'livsstjal') {
                const maxLiv = typeof this.spelare.maxLiv === 'number' ? this.spelare.maxLiv : 0;
                const nuvarandeLiv = typeof this.spelare.liv === 'number' ? this.spelare.liv : 0;
                const livAttFa = typeof passiv.liv === 'number' ? Math.max(0, passiv.liv) : 0;
                const faktiskLiv = Math.min(livAttFa, Math.max(0, maxLiv - nuvarandeLiv));
                if (faktiskLiv > 0) {
                    this.spelare.liv = nuvarandeLiv + faktiskLiv;
                    resultat.utlostaPassiver.push({ passiv, liv: faktiskLiv, energi: 0 });
                    resultat.meddelanden.push(`${passiv.namn}! Du återfick ${faktiskLiv} liv.`);
                }
            }

            if (passiv.typ === 'energi_aterflode') {
                const maxEnergi = typeof this.spelare.maxEnergi === 'number' ? this.spelare.maxEnergi : 0;
                const nuvarandeEnergi = typeof this.spelare.energi === 'number' ? this.spelare.energi : 0;
                const energiAttFa = typeof passiv.energi === 'number' ? Math.max(0, passiv.energi) : 0;
                const faktiskEnergi = Math.min(energiAttFa, Math.max(0, maxEnergi - nuvarandeEnergi));
                if (faktiskEnergi > 0) {
                    this.spelare.energi = nuvarandeEnergi + faktiskEnergi;
                    resultat.utlostaPassiver.push({ passiv, liv: 0, energi: faktiskEnergi });
                    resultat.meddelanden.push(`${passiv.namn}! Du återfick ${faktiskEnergi} energi.`);
                }
            }
        }

        return resultat;
    }
}
