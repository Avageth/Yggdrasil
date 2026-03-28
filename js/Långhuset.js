class Langhuset {
    constructor(canvas, ctx, onExit, getStridSystem, getSpelare) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onExit = onExit || (() => {});
        this.getStridSystem = getStridSystem || (() => null);
        this.getSpelare = getSpelare || null;
        this.visas = false;

        this.lage = 'start';
        this.tavernPrefix = '';
        this.tavernSuffix = '';
        this.tavernNamn = '';
        this.startAlternativ = [
            { namn: 'Uppdrag', action: 'uppdrag' },
            { namn: 'Mottagna uppdrag', action: 'mottagna' },
            { namn: 'Tillbaka', action: 'tillbaka' }
        ];
        this.uppdragLista = [];
        this.aktivaUppdrag = [];
        this.completedThisVisit = new Set();
        this.tavernDelar = {
            prefix: ['Tors', 'Frejas', 'Odens', 'Lokes', 'Skades', 'Balders'],
            suffix: ['Dansande Jättar', 'Glödande Horn', 'Fallna Einherjar', 'Järnhjärtan', 'Viskande Valkyrior', 'Inn']
        };
        this.uppdragPool = {
            Tors: [
                { id: 'tors_provningar_lognare', namn: 'Tors Prövningar', beskrivning: 'Stöt på en lögnare för att lära dig mer om dina fiender.' },
                { id: 'tors_styrkans_vag_banditer', namn: 'Styrkans Väg', beskrivning: 'Dräp tre fiender i Banditlägret.' },
                { id: 'tors_jarn_aska_djur', namn: 'Järn och Åska', beskrivning: 'Dräp två djur i Jaktmarken.' },
                { id: 'tors_varnare_hjalp', namn: 'Värnaren av Midgård', beskrivning: 'Hjälp två personer som är i behov av hjälp.' },
                { id: 'tors_hammarslag_bandit', namn: 'Hammarslaget', beskrivning: 'Dräp en Bandit i Banditlägret.' },
                { id: 'tors_rattradig_kott_jarn', namn: 'Den Rättrådigas Stig', beskrivning: 'Lämna in två köttbitar och två järn till ett långhus.' }
            ],
            Frejas: [
                { id: 'frejas_valsignelse_hjalpare', namn: 'Frejas Välsignelse', beskrivning: 'Stöt på en Hjälpare.' },
                { id: 'frejas_karlek_krigstid_hjalp', namn: 'Kärlek i Krigstid', beskrivning: 'Hjälp en person som är i behov av hjälp.' },
                { id: 'frejas_blomma_blod_barsark', namn: 'Blomma och Blod', beskrivning: 'Dräp en Bärsärk.' },
                { id: 'frejas_hjarta_svard_banditer', namn: 'Hjärtats och Svärdets Väg', beskrivning: 'Dräp två Banditer.' },
                { id: 'frejas_gyllene_tarar_hjalp', namn: 'Gyllene Tårar', beskrivning: 'Hjälp två personer som är i behov av hjälp.' },
                { id: 'frejas_svanar_bandit', namn: 'När Svanarna Sjunger', beskrivning: 'Dräp en Bandit.' }
            ],
            Odens: [
                { id: 'odens_odets_vaktare_praster', namn: 'Ödets Väktare', beskrivning: 'Dräp två Präster.' },
                { id: 'odens_valhall_blodvarg', namn: 'Vägen till Valhall', beskrivning: 'Dräp en Blodvarg.' },
                { id: 'odens_korparna_utrustning', namn: 'När Korparna Ser', beskrivning: 'Hitta en utrustning på chansrutan och lämna sedan in det till ett långhus.' },
                { id: 'odens_provningar_djur', namn: 'Odens Prövningar', beskrivning: 'Dräp två djur i Jaktmarken.' },
                { id: 'odens_runor_kallelse_hjalp', namn: 'Runornas Kallelse', beskrivning: 'Hjälp tre personer som är i behov av hjälp.' },
                { id: 'odens_visdom_blod_barsark', namn: 'Visdom genom Blod', beskrivning: 'Dräp en Bärsärk.' }
            ],
            Lokes: [
                { id: 'lokes_skuggor_gava_bonde', namn: 'Skuggornas Gåva', beskrivning: 'Dräp en Bonde.' },
                { id: 'lokes_lekar_forrad', namn: 'Lokes Lekar', beskrivning: 'Föråd någon som är i behov av hjälp.' },
                { id: 'lokes_listig_kraka', namn: 'Den Listiges Stig', beskrivning: 'Dräp en Kråka.' },
                { id: 'lokes_svek_sang_forrad', namn: 'Svekets Sång', beskrivning: 'Föråd någon som är i behov av hjälp.' },
                { id: 'lokes_provningar_bonder', namn: 'Lokes Prövningar', beskrivning: 'Dräp två Bönder.' },
                { id: 'lokes_blod_prest', namn: 'Blod i Lokes Namn', beskrivning: 'Dräp en Präst.' }
            ],
            Skades: [
                { id: 'skades_vinterblod_fiende', namn: 'Vinterblod', beskrivning: 'Dräp en fiende i Banditlägret.' },
                { id: 'skades_isen_himmel_vara', namn: 'Under Isens Himmel', beskrivning: 'Hitta en vara på chansrutan och lämna sedan in det till ett långhus.' },
                { id: 'skades_jagarens_ed_djur', namn: 'Jägarens Ed', beskrivning: 'Dräp ett djur i Jaktmarken.' },
                { id: 'skades_frost_provning_sten_kott', namn: 'Frostens Prövning', beskrivning: 'Lämna in 1 Sten och 2 Köttbitar till ett långhus.' },
                { id: 'skades_vinterstig_sten', namn: 'Skades Vinterstig', beskrivning: 'Lämna in 10 Sten till ett långhus.' },
                { id: 'skades_harda_landet_tra', namn: 'Det Hårda Landet', beskrivning: 'Lämna in 3 Trä till ett långhus.' }
            ],
            Balders: [
                { id: 'balders_ljus_blod_djur', namn: 'Ljuset i Blodets Spår', beskrivning: 'Dräp två djur i Jaktmarken.' },
                { id: 'balders_vita_flamman_hjalpare', namn: 'Den Vita Flamman', beskrivning: 'Stöt på en Hjälpare.' },
                { id: 'balders_skuggor_blodvarg', namn: 'Skuggornas Upplösning', beskrivning: 'Dräp en Blodvarg.' },
                { id: 'balders_hoppets_vaktare_kott', namn: 'Hoppets Väktare', beskrivning: 'Lämna in tre köttbitar till ett långhus.' },
                { id: 'balders_renhet_gadda', namn: 'Renhetens Prövning', beskrivning: 'Dräp en Gädda.' },
                { id: 'balders_dagen_vagrar_titanit', namn: 'När Dagen Vägrar Dö', beskrivning: 'Lämna in 1 Titanit till ett långhus.' }
            ]
        };
        this.beloningsPool = {
            'Dansande Jättar': [
                '2 guld',
                '1 guld och 8 silver och 5 koppar',
                '1 guld',
                '8 silver och 6 koppar',
                '1 guld och 4 koppar',
                '7 silver och 1 koppar'
            ],
            'Glödande Horn': [
                '2 silver',
                '6 koppar',
                '6 silver',
                '1 silver och 2 koppar',
                '1 guld',
                '4 silver och 9 koppar'
            ],
            'Fallna Einherjar': [
                '4 silver och 4 koppar',
                '2 silver',
                '7 silver och 8 koppar',
                '8 silver och 9 koppar',
                '7 silver',
                '3 silver och 5 koppar'
            ],
            'Järnhjärtan': [
                '2 silver och 2 koppar',
                '5 silver',
                '1 guld och 8 silver',
                '9 silver och 2 koppar',
                '7 silver',
                '3 silver'
            ],
            'Viskande Valkyrior': [
                '3 silver och 5 koppar',
                '1 guld och 9 silver och 9 koppar',
                '7 silver',
                '1 silver',
                '5 silver och 8 koppar',
                '4 silver och 4 koppar'
            ],
            'Inn': [
                '8 silver',
                '1 guld',
                '8 silver',
                '2 silver och 9 koppar',
                '1 silver',
                '7 silver'
            ]
        };

        this.shopValdIndex = 0;
        this.shopItemBounds = [];
        this.shopHoverIndex = -1;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.meddelande = null;
        this.ikonCache = {};
        this.valutaIkoner = {
            guld: 'assets/ikoner/Guld.png',
            silver: 'assets/ikoner/Silver.png',
            koppar: 'assets/ikoner/Koppar.png'
        };
        this.elementIkoner = {
            fysisk: 'assets/Ikoner/Element Fysisk.png',
            eld: 'assets/Ikoner/Element Eld.png',
            magi: 'assets/Ikoner/Element Magi.png'
        };
        this.elementInfo = {
            fysisk: {
                namn: 'Fysisk',
                beskrivning: 'Vanlig skada och motstånd från vapen, slag och rå styrka.'
            },
            eld: {
                namn: 'Eld',
                beskrivning: 'Brännande skada och skydd mot hetta, lågor och eldattacker.'
            },
            magi: {
                namn: 'Magi',
                beskrivning: 'Mystisk skada och motstånd mot besvärjelser och magiska krafter.'
            }
        };
        this.pengarInfo = {
            guld: { namn: 'Guld', beskrivning: 'Den mest vardefulla valutan. Anvands for dyra kop och storre beloningar.' },
            silver: { namn: 'Silver', beskrivning: 'En vanlig valuta for handel, uppdrag och utrustning.' },
            koppar: { namn: 'Koppar', beskrivning: 'Den minsta valutan. Anvands ofta for billiga varor och mindre kostnader.' }
        };

        this.entitetMapping = {
            'bandit': { typ: 'fiende', id: 'bandit' },
            'banditer': { typ: 'fiende', id: 'bandit' },
            'blodvarg': { typ: 'fiende', id: 'blodvarg' },
            'bärsärk': { typ: 'fiende', id: 'bärsärk' },
            'bonde': { typ: 'fiende', id: 'bonde' },
            'bönder': { typ: 'fiende', id: 'bonde' },
            'präst': { typ: 'fiende', id: 'prast' },
            'präster': { typ: 'fiende', id: 'prast' },
            'viking': { typ: 'fiende', id: 'viking' },
            'vildsvin': { typ: 'djur', id: 'Vildsvin', sprite: 'assets/Gestalter/Vildsvin.png' },
            'gädda': { typ: 'djur', id: 'Gädda', sprite: 'assets/Gestalter/Gädda.png' },
            'kråka': { typ: 'djur', id: 'Kråka', sprite: 'assets/Gestalter/Kråka.png' }
        };

        this.tooltipData = null;
        this.elementTooltipData = null;
        this.pengarTooltipData = null;
        this.infoBounds = [];
        this.tooltipElementBounds = [];
        this.pengarHoverBounds = [];
        this.tooltipPanelBounds = null;
        this.infoPanelBounds = null;
        this.infoScroll = 0;
        this.infoScrollTarget = 0;
        this.infoMaxScroll = 0;
        this.infoHover = false;
        this.infoUppdragNyckel = null;

        this.bild = new Image();
        this.bildLaddad = false;
        this.bild.src = 'assets/platser/Långhuset.png';
        this.bild.onload = () => {
            this.bildLaddad = true;
            console.log('Langhuset-bild laddad!');
        };
        this.bild.onerror = () => {
            console.log('Kunde inte ladda Langhuset-bild från: assets/platser/Långhuset.png');
        };
        if (typeof window !== 'undefined') {
            window.langhuset = this;
        }
    }

    // Mäter höjden som behövs för att rita beskrivningen inom en given bredd
    mataBeskrivningHojd(text, maxBredd) {
        const ctx = this.ctx;
        ctx.font = '12px Arial';
        const textDelar = (text || '').split(' ');
        let textX = 0;
        let textY = 0;
        const lineHeight = 16;
        for (let i = 0; i < textDelar.length; i++) {
            const ordText = textDelar[i];
            const ordLower = ordText.toLowerCase().replace(/[.,!?]/g, '');
            const entitet = this.entitetMapping[ordLower];
            let ordBredd = ctx.measureText(ordText).width;
            if (entitet) ordBredd += 22; // plats för ikon + mellanrum
            if (textX + ordBredd > maxBredd) {
                textX = 0;
                textY += lineHeight;
            }
            textX += ordBredd + ctx.measureText(' ').width;
        }
        return textY + lineHeight;
    }

    visa() {
        this.visas = true;
        this.lage = 'start';
        this.shopValdIndex = 0;
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.meddelande = null;
        if (typeof window !== 'undefined') {
            window.langhuset = this;
        }
        this.skapaTavernNamn();
        // Ny visit -> rensa listan över slutförda uppdrag från tidigare besök
        this.completedThisVisit = new Set();
        this.byggUppdragLista();
        // Debug: dump current inventory and active quests when entering Långhuset
        try {
            const spelare = this.getSpelare ? this.getSpelare() : (window.varlden && window.varlden.spelare);
            const inv = spelare && spelare.utrustning && Array.isArray(spelare.utrustning.inventory) ? spelare.utrustning.inventory : [];
            try {
                console.log('Långhuset DEBUG: entering; inventory: ' + JSON.stringify(inv, null, 2) + '\naktivaUppdrag: ' + JSON.stringify(this.aktivaUppdrag, null, 2));
            } catch (e) {
                console.log('Långhuset DEBUG: entering; (stringify failed)', inv, this.aktivaUppdrag);
            }
        } catch (e) { /* ignore */ }
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
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Långhuset', canvas.width / 2, canvas.height / 2);
        }

        if (this.lage === 'start') {
            this.ritaMenyLista(this.tavernNamn || 'LANGHUSET');
        } else if (this.lage === 'uppdrag') {
            this.ritaMenyLista(this.tavernNamn || 'UPPDRAG');
            this.ritaUppdragInfo();
        } else if (this.lage === 'mottagna') {
            this.ritaMenyLista('MOTTAGNA UPPDRAG');
            this.ritaUppdragInfo();
        }

        this.ritaMeddelande();
    }

    hanteraTangent(tangent) {
        if (!this.visas) return;

        const upp = tangent === 'ArrowUp' || tangent === 'w' || tangent === 'W';
        const ner = tangent === 'ArrowDown' || tangent === 's' || tangent === 'S';
        const lista = this.hamtaAktivLista();
        const harLista = lista.length > 0;

        if (upp && harLista) {
            this.shopValdIndex = (this.shopValdIndex - 1 + lista.length) % lista.length;
            this.justeraScrollForVal();
            return;
        }

        if (ner && harLista) {
            this.shopValdIndex = (this.shopValdIndex + 1) % lista.length;
            this.justeraScrollForVal();
            return;
        }

        if (tangent === 'Enter') {
            if (this.lage === 'start') {
                return this.hanteraStartVal(this.shopValdIndex);
            }
            if (this.lage === 'uppdrag') {
                return this.hanteraUppdragVal(this.shopValdIndex);
            }
            if (this.lage === 'mottagna') {
                return this.hanteraMottagnVal(this.shopValdIndex);
            }
        }

        if (tangent === 'Escape') {
            this.hanteraEscape();
        }
    }

    hanteraEscape() {
        if (!this.visas) return false;

        if (this.lage !== 'start') {
            this.lage = 'start';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return true;
        }

        this.onExit();
        return true;
    }

    hanteraKlick(musX, musY) {
        if (!this.visas) return null;

        // Om vi är i mottagna-läge, kolla om man klickar på "Överge"-knappen
        if (this.lage === 'mottagna' && this.overgeKnappBounds) {
            const b = this.overgeKnappBounds;
            if (
                musX >= b.x && musX <= b.x + b.bredd &&
                musY >= b.y && musY <= b.y + b.hojd
            ) {
                this.overgeUppdrag(b.index);
                return null;
            }
        }

        const index = this.hamtaIndexFranMus(musX, musY);
        if (index === null) return null;

        this.shopValdIndex = index;
        this.justeraScrollForVal();

        if (this.lage === 'start') {
            return this.hanteraStartVal(index);
        }
        if (this.lage === 'uppdrag') {
            return this.hanteraUppdragVal(index);
        }
        if (this.lage === 'mottagna') {
            return this.hanteraMottagnVal(index);
        }
        return null;
    }

    // Ta bort ett uppdrag ur aktivaUppdrag
    overgeUppdrag(index) {
        if (index == null || index < 0 || index >= this.aktivaUppdrag.length) return;
        const borttaget = this.aktivaUppdrag.splice(index, 1)[0];
        const spelare = this.getSpelare ? this.getSpelare() : null;
        if (spelare && borttaget && borttaget.id) {
            this.taBortQuestItemsForUppdrag(spelare, borttaget.id, Infinity);
        }
        // Sätt status till ledig i uppdragLista om det finns där
        const iLista = this.uppdragLista.find(u => u.id === borttaget.id);
        if (iLista) { iLista.status = 'ledig'; }
        this.visaMeddelande('Uppdrag övergett!');
        // Justera vald index om det behövs
        if (this.shopValdIndex >= this.aktivaUppdrag.length) {
            this.shopValdIndex = Math.max(0, this.aktivaUppdrag.length - 1);
        }
        // Rita om direkt så att listan uppdateras
        this.rita();
    }

    hamtaQuestItemsForUppdrag(spelare, uppdragId) {
        if (!spelare || !spelare.utrustning || !Array.isArray(spelare.utrustning.inventory) || !uppdragId) return [];
        const items = [];
        for (let i = 0; i < spelare.utrustning.inventory.length; i++) {
            const item = spelare.utrustning.inventory[i];
            if (item && item.questFor === uppdragId) {
                items.push({ index: i, item });
            }
        }
        return items;
    }

    raknaQuestItemsForUppdrag(spelare, uppdragId) {
        return this.hamtaQuestItemsForUppdrag(spelare, uppdragId)
            .reduce((sum, entry) => sum + (entry.item.count || 1), 0);
    }

    taBortQuestItemsForUppdrag(spelare, uppdragId, antal = 1) {
        if (!spelare || !spelare.utrustning || !Array.isArray(spelare.utrustning.inventory) || !uppdragId) return 0;
        let kvarAttTaBort = Number.isFinite(antal) ? Math.max(0, antal) : Infinity;
        let borttaget = 0;
        for (let i = spelare.utrustning.inventory.length - 1; i >= 0 && kvarAttTaBort > 0; i--) {
            const item = spelare.utrustning.inventory[i];
            if (!item || item.questFor !== uppdragId) continue;
            const count = item.count || 1;
            const take = Number.isFinite(kvarAttTaBort) ? Math.min(count, kvarAttTaBort) : count;
            if (count > take) {
                item.count = count - take;
            } else {
                spelare.utrustning.inventory[i] = null;
            }
            borttaget += take;
            if (Number.isFinite(kvarAttTaBort)) kvarAttTaBort -= take;
        }
        if (typeof spelare.utrustning.stadaTommaSvansrutor === 'function') {
            spelare.utrustning.stadaTommaSvansrutor();
        }
        return borttaget;
    }

    hanteraMusMove(musX, musY) {
        if (!this.visas) return;
        const index = this.hamtaIndexFranMus(musX, musY);
        this.shopHoverIndex = index === null ? -1 : index;
        if (index !== null) {
            this.shopValdIndex = index;
            this.justeraScrollForVal();
        }

        // Kolla om musen är över en info-symbol
        this.tooltipData = null;
        this.elementTooltipData = null;
        this.pengarTooltipData = null;
        for (let bound of this.infoBounds) {
            if (musX >= bound.x && musX <= bound.x + bound.w &&
                musY >= bound.y && musY <= bound.y + bound.h) {
                this.tooltipData = {
                    x: musX,
                    y: musY,
                    entitet: bound.entitet
                };
                break;
            }
        }

        if (!this.tooltipData && this.tooltipPanelBounds) {
            const panel = this.tooltipPanelBounds;
            if (musX >= panel.x && musX <= panel.x + panel.w &&
                musY >= panel.y && musY <= panel.y + panel.h) {
                this.tooltipData = {
                    x: panel.anchorX,
                    y: panel.anchorY,
                    entitet: panel.entitet
                };
            }
        }

        if (this.tooltipData) {
            for (let bound of this.tooltipElementBounds) {
                if (musX >= bound.x && musX <= bound.x + bound.w &&
                    musY >= bound.y && musY <= bound.y + bound.h) {
                    this.elementTooltipData = {
                        x: musX,
                        y: musY,
                        element: bound.element
                    };
                    break;
                }
            }
        }

        for (const bound of this.pengarHoverBounds) {
            if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
                this.pengarTooltipData = { valuta: bound.valuta, x: musX, y: musY };
                break;
            }
        }

        // Uppdatera om musen hovrar över info-panelen (för scrollning)
        this.infoHover = false;
        if (this.infoPanelBounds) {
            const b = this.infoPanelBounds;
            if (musX >= b.x && musX <= b.x + b.w && musY >= b.y && musY <= b.y + b.h) {
                this.infoHover = true;
            }
        }
    }

    hanteraScroll(delta) {
        if (!this.visas) return;
        // If hovering the info panel, scroll its content; otherwise scroll the main list
        if (this.infoHover && this.lage !== 'start') {
            const maxInfo = this.infoMaxScroll || 0;
            this.infoScrollTarget = Math.max(0, Math.min(this.infoScrollTarget + delta, maxInfo));
        } else {
            const maxScroll = this.beraknaMaxScroll();
            this.scrollTarget = Math.max(0, Math.min(this.scrollTarget + delta, maxScroll));
        }
    }

    hamtaInfoUppdragIndex() {
        const lista = this.hamtaAktivLista();
        if (!Array.isArray(lista) || lista.length === 0) return -1;
        if (this.lage !== 'start' && this.shopHoverIndex >= 0 && this.shopHoverIndex < lista.length) {
            return this.shopHoverIndex;
        }
        if (this.shopValdIndex >= 0 && this.shopValdIndex < lista.length) {
            return this.shopValdIndex;
        }
        return -1;
    }

    kanLamnaInUppdrag(uppdrag) {
        if (!uppdrag) return false;

        const spelare = this.getSpelare ? this.getSpelare() : (window.varlden && window.varlden.spelare);
        const beskrivning = uppdrag.beskrivning || '';
        const normalize = (text) => (text || '')
            .toLowerCase()
            .replace(/[.,!?]/g, '')
            .replace(/å/g, 'a')
            .replace(/ä/g, 'a')
            .replace(/ö/g, 'o')
            .replace(/é/g, 'e');
        const textTillSiffra = (txt) => {
            const map = { 'ett': 1, 'en': 1, 'två': 2, 'tre': 3, 'fyra': 4, 'fem': 5, 'sex': 6, 'sju': 7, 'åtta': 8, 'nio': 9, 'tio': 10 };
            return map[txt] || 1;
        };
        const normaliseraLaminaInNamn = (namn) => {
            const namnNorm = normalize(namn).trim();
            const namnMap = {
                'kottbit': 'kottbit',
                'kottbitar': 'kottbit',
                'kott': 'kottbit',
                'jarn': 'jarn',
                'sten': 'sten',
                'tra': 'tra',
                'titanit': 'titanit',
                'tom flaska': 'tom flaska',
                'tomma flaskor': 'tom flaska',
                'flaska med vatten': 'flaskaMedVatten',
                'flaskor med vatten': 'flaskaMedVatten',
                'galdrat vatten': 'galdratVatten'
            };
            return namnMap[namnNorm] || namnNorm;
        };

        const lamnaInMatch = beskrivning.match(/lämna(?:\s+\S+){0,4}\s+in/i);
        if (lamnaInMatch) {
            if (!spelare || !spelare.utrustning) return false;

            const isChans = uppdrag.questChansType || /(chansrutan|chansruta|chans)/i.test(beskrivning);
            if (isChans) {
                if (this.raknaQuestItemsForUppdrag(spelare, uppdrag.id) < 1) {
                    return false;
                }
            } else {
                let krav = [];
                const globalParseLaminaInKrav = (typeof parseLaminaInKrav === 'function')
                    ? parseLaminaInKrav
                    : ((typeof window !== 'undefined' && typeof window.parseLaminaInKrav === 'function') ? window.parseLaminaInKrav : null);
                if (globalParseLaminaInKrav) {
                    krav = globalParseLaminaInKrav(beskrivning);
                } else {
                    const match = beskrivning.match(/lämna in ([^.]*) till/i);
                    const delar = match ? match[1].split(/och/i) : [];
                    for (let del of delar) {
                        const kravMatch = del.trim().match(/(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio)\s+([a-zåäöA-ZÅÄÖ\s]+)/i);
                        if (!kravMatch) continue;
                        const antal = isNaN(parseInt(kravMatch[1], 10))
                            ? textTillSiffra(kravMatch[1].toLowerCase())
                            : parseInt(kravMatch[1], 10);
                        krav.push({ namn: normaliseraLaminaInNamn(kravMatch[2]), antal });
                    }
                }

                for (let kravRad of krav) {
                    const krNamnNorm = normaliseraLaminaInNamn(kravRad.namn);
                    let foremalId = null;
                    for (const [id, def] of Object.entries(spelare.utrustning.tillgangligaForemal || {})) {
                        if (normalize(def.namn) === krNamnNorm || normalize(id) === krNamnNorm) {
                            foremalId = id;
                            break;
                        }
                    }

                    let totalCount = 0;
                    for (const item of spelare.utrustning.inventory || []) {
                        if (!item) continue;
                        if (foremalId) {
                            if (normalize(item.id) === normalize(foremalId) || normalize(item.namn) === krNamnNorm) {
                                totalCount += item.count || 1;
                            }
                        } else if (normalize(item.namn) === krNamnNorm || normalize(item.id) === krNamnNorm) {
                            totalCount += item.count || 1;
                        }
                    }

                    if (totalCount < kravRad.antal) {
                        return false;
                    }
                }
            }
        }

        if (/(?:döda|dräpa|dräp|drapa|slå ihjäl)/i.test(beskrivning)) {
            let krav = [];
            if (typeof parseDodaKrav === 'function') {
                krav = parseDodaKrav(beskrivning);
            } else {
                const match = beskrivning.match(/(?:döda|dräpa|dräp|drapa|slå ihjäl) ([^.]*)/i);
                const delar = match ? match[1].split(/och/i) : beskrivning.split(/och/i);
                for (let del of delar) {
                    const kravMatch = del.trim().match(/(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio)?\s*([a-zåäöA-ZÅÄÖ]+)/i);
                    if (!kravMatch) continue;
                    const antal = kravMatch[1]
                        ? (isNaN(parseInt(kravMatch[1], 10)) ? textTillSiffra(kravMatch[1].toLowerCase()) : parseInt(kravMatch[1], 10))
                        : 1;
                    krav.push({ namn: kravMatch[2].toLowerCase(), antal });
                }
            }

            const totalKills = (spelare && spelare.prestationer && spelare.prestationer.fiendesBesegrade) || 0;
            const killsByType = (spelare && spelare.prestationer && spelare.prestationer.killsByType) || {};
            const baselineTotal = uppdrag.acceptedKillsTotal || 0;
            const baselineByType = uppdrag.acceptedKillsByType || {};
            const effectiveTotal = Math.max(0, totalKills - baselineTotal);

            for (let kravRad of krav) {
                const key = normalize(kravRad.namn);
                const byTypeRaw = killsByType[key] || 0;
                const baselineForKey = baselineByType[key] || 0;
                let usedByType = Math.max(0, byTypeRaw - baselineForKey);
                if (usedByType === 0) {
                    for (const recordedKey of Object.keys(killsByType || {})) {
                        if (!recordedKey || recordedKey === key) continue;
                        if (recordedKey.includes(key) || key.includes(recordedKey)) {
                            const raw = killsByType[recordedKey] || 0;
                            const base = baselineByType[recordedKey] || 0;
                            usedByType += Math.max(0, raw - base);
                        }
                    }
                }
                const isGeneric = /fiend|djur/i.test(kravRad.namn);
                const have = isGeneric ? effectiveTotal : usedByType;
                if (have < kravRad.antal) {
                    return false;
                }
            }
        }

        const globalBeraknaInteraktionsProgress = (typeof beraknaInteraktionsProgress === 'function')
            ? beraknaInteraktionsProgress
            : ((typeof window !== 'undefined' && typeof window.beraknaInteraktionsProgress === 'function') ? window.beraknaInteraktionsProgress : null);
        if (globalBeraknaInteraktionsProgress) {
            const interaktionsProgress = globalBeraknaInteraktionsProgress(beskrivning, spelare, uppdrag);
            if (interaktionsProgress && interaktionsProgress.krav && interaktionsProgress.krav.length > 0 && !interaktionsProgress.allDone) {
                return false;
            }
        }

        return true;
    }

    ritaMenyLista(titel) {
        const ctx = this.ctx;
        const panelBredd = 320;
        const panelHojd = 240;
        const panelX = 20;
        const panelY = 20;
        const headerHojd = 36;
        const footerHojd = 26;
        const listTop = panelY + headerHojd + 12;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;

        ctx.save();

        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(titel, panelX + 16, panelY + 12);

        ctx.font = '14px Arial';
        const radHojd = 28;

        this.uppdateraScroll();

        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 6, listTop - 6, panelBredd - 12, listHojd + 12);
        ctx.clip();

        this.shopItemBounds = [];
        const lista = this.hamtaAktivLista();
        if (lista.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('Inga uppdrag', panelX + panelBredd / 2, listTop + listHojd / 2);
            ctx.textAlign = 'left';
        } else {
            lista.forEach((rad, index) => {
                const y = listTop + index * radHojd - this.scrollOffset;
                const itemX = panelX + 10;
                const itemY = y - 4;
                const itemBredd = panelBredd - 20;
                const itemHojd = 22;
                const kanLamnasIn = this.lage === 'mottagna' && this.kanLamnaInUppdrag(rad);

                if (kanLamnasIn) {
                    const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 220);
                    const glowAlpha = 0.14 + pulse * 0.18;
                    ctx.fillStyle = 'rgba(255, 214, 102, ' + glowAlpha.toFixed(3) + ')';
                    ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
                    ctx.strokeStyle = 'rgba(255, 214, 102, ' + (0.35 + pulse * 0.35).toFixed(3) + ')';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(itemX + 0.5, itemY + 0.5, itemBredd - 1, itemHojd - 1);
                }

                if (index === this.shopValdIndex) {
                    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
                    ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
                } else if (index === this.shopHoverIndex) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.fillRect(itemX, itemY, itemBredd, itemHojd);
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.textAlign = 'left';
                ctx.fillText(rad.namn, panelX + 16, y);

                if (kanLamnasIn) {
                    ctx.fillStyle = '#ffd666';
                    ctx.textAlign = 'right';
                    ctx.fillText('Klar', panelX + panelBredd - 16, y);
                    ctx.textAlign = 'left';
                }

                if (this.lage === 'uppdrag') {
                    if (rad.questChansType) {
                        // Räkna om spelaren har motsvarande item (antingen quest-märkt eller vilken vara/utrustning som helst från chansrutan)
                        let hasItem = false;
                        try {
                            const spelare = this.getSpelare ? this.getSpelare() : (window.varlden && window.varlden.spelare);
                            const inv = spelare && spelare.utrustning && Array.isArray(spelare.utrustning.inventory) ? spelare.utrustning.inventory : [];
                                // Helper: matcha om inventory-item uppfyller kravet
                                // When viewing the available-quests list (`lage === 'uppdrag'`), only count items that are explicitly quest-marked (questFor).
                                const requireQuestTag = (this.lage === 'uppdrag');
                                const matchesRequirement = (item) => {
                                    if (!item) return false;
                                    if (item.questFor === rad.id) return true;
                                    if (requireQuestTag) return false; // do not count generic matches when browsing available quests
                                    // If chansrutan lists are available, use them
                                    const chans = (typeof window !== 'undefined' && window.chansrutan) ? window.chansrutan : null;
                                    if (rad.questChansType === 'vara') {
                                        if (chans && Array.isArray(chans.varor) && chans.varor.includes(item.id)) return true;
                                        // fallback: check item's type
                                        const def = (spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal[item.id] : null;
                                        if (def && def.typ === 'vara') return true;
                                    }
                                    if (rad.questChansType === 'utrustning') {
                                        if (chans && Array.isArray(chans.utrustning) && chans.utrustning.includes(item.id)) return true;
                                        const def = (spelare && spelare.utrustning && spelare.utrustning.tillgangligaForemal) ? spelare.utrustning.tillgangligaForemal[item.id] : null;
                                        if (def && (def.typ === 'vapen' || def.typ === 'rustning' || def.typ === 'skold' || def.typ === 'hjalm')) return true;
                                    }
                                    return false;
                                };
                            for (const it of inv) {
                                if (matchesRequirement(it)) { hasItem = true; break; }
                            }
                        } catch (e) { /* ignore */ }
                            // Show status in the available-quests list (keep 0/1 in the detailed panel)
                            const status = rad.status === 'tagen' ? 'Tagen' : 'Ledig';
                            ctx.fillStyle = rad.status === 'tagen' ? '#ff9999' : '#9be7ff';
                            ctx.textAlign = 'right';
                            ctx.fillText(status, panelX + panelBredd - 16, y);
                            ctx.textAlign = 'left';
                    } else {
                        const status = rad.status === 'tagen' ? 'Tagen' : 'Ledig';
                        ctx.fillStyle = rad.status === 'tagen' ? '#ff9999' : '#9be7ff';
                        ctx.textAlign = 'right';
                        ctx.fillText(status, panelX + panelBredd - 16, y);
                        ctx.textAlign = 'left';
                    }
                }

                if (y + itemHojd >= listTop && y <= listTop + listHojd) {
                    this.shopItemBounds.push({ index, x: itemX, y: itemY, bredd: itemBredd, hojd: itemHojd });
                }
            });
        }

        ctx.restore();

        ctx.fillStyle = 'rgba(170, 170, 170, 0.9)';
        ctx.font = '12px Arial';
        let footerText = 'Enter/klick: valj | ESC: lamna';
        if (this.lage === 'uppdrag') {
            footerText = 'Enter/klick: ta emot | ESC: tillbaka';
        } else if (this.lage === 'mottagna') {
            footerText = 'ESC: tillbaka';
        }
        ctx.fillText(footerText, panelX + 16, panelY + panelHojd - 22);

        ctx.restore();
    }

    ritaUppdragInfo() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const panelBredd = 360;
        const panelHojd = 180;
        const panelX = canvas.width - panelBredd - 20;
        const panelY = 20;

        const aktivLista = this.hamtaAktivLista();
        const infoIndex = this.hamtaInfoUppdragIndex();
        const uppdrag = aktivLista[infoIndex];
        if (!uppdrag) return;

        const uppdragNyckel = uppdrag.id || uppdrag.namn || String(infoIndex);
        if (this.infoUppdragNyckel !== uppdragNyckel) {
            this.infoUppdragNyckel = uppdragNyckel;
            this.infoScroll = 0;
            this.infoScrollTarget = 0;
        }

        this.infoBounds = [];
        this.pengarHoverBounds = [];

        ctx.save();

        ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelBredd, panelHojd, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(uppdrag.namn, panelX + 16, panelY + 12);

        ctx.fillStyle = '#ddd';
        ctx.font = '12px Arial';
        
        // Rita beskrivning med info-symboler (klippbar + scrollbar stöd)
        const descX = panelX + 16;
        const descY = panelY + 44;
        const descW = panelBredd - 32;
        const descVisibleH = panelHojd - 44 - 56; // lämna plats för belöning/status och knappar

        // Spara infoPanelBounds för mus/scroll-hantering
        this.infoPanelBounds = { x: descX, y: descY, w: descW, h: descVisibleH };

        // Mät total höjd för beskrivningen och uppdatera max scroll
        try {
            const totalH = this.mataBeskrivningHojd(uppdrag.beskrivning, descW);
            this.infoMaxScroll = Math.max(0, totalH - descVisibleH);
            // Clamp infoScrollTarget
            this.infoScrollTarget = Math.max(0, Math.min(this.infoScrollTarget, this.infoMaxScroll));
        } catch (e) { this.infoMaxScroll = 0; }

        // Clip och translate för scrollad rendering
        ctx.save();
        ctx.beginPath();
        ctx.rect(descX, descY, descW, descVisibleH);
        ctx.clip();
        ctx.translate(0, -this.infoScroll);
        this.ritaBeskrivningMedInfo(uppdrag.beskrivning, descX, descY, descW);
        ctx.restore();

        ctx.fillStyle = '#9be7ff';
        ctx.fillText('Belöning: ', panelX + 16, panelY + 60);
        this.ritaBeloning(uppdrag.Belöning, panelX + 85, panelY + 60);

        // Visa status eller progress för chansruta-uppdrag
        if (uppdrag.questChansType) {
            // Räkna om spelaren har motsvarande item (antingen quest-märkt eller vilken vara/utrustning som helst från chansrutan)
            let hasItem = false;
            let questItemCount = 0;
            try {
                const spelare = this.getSpelare ? this.getSpelare() : (window.varlden && window.varlden.spelare);
                const inv = spelare && spelare.utrustning && Array.isArray(spelare.utrustning.inventory) ? spelare.utrustning.inventory : [];
                const chans = (typeof window !== 'undefined' && window.chansrutan) ? window.chansrutan : null;
                const defMap = spelare && spelare.utrustning ? spelare.utrustning.tillgangligaForemal : {};

                // In the detailed panel we want to show progress only when the player has the quest-linked item.
                const requireQuestTagInfo = true;
                const matchesRequirement = (item) => {
                    if (!item) return false;
                    if (item.questFor === uppdrag.id) return true;
                    if (requireQuestTagInfo) return false;
                    if (uppdrag.questChansType === 'vara') {
                        if (chans && Array.isArray(chans.varor) && chans.varor.includes(item.id)) return true;
                        const def = defMap && defMap[item.id];
                        if (def && def.typ === 'vara') return true;
                    }
                    if (uppdrag.questChansType === 'utrustning') {
                        if (chans && Array.isArray(chans.utrustning) && chans.utrustning.includes(item.id)) return true;
                        const def = defMap && defMap[item.id];
                        if (def && (def.typ === 'vapen' || def.typ === 'rustning' || def.typ === 'skold' || def.typ === 'hjalm')) return true;
                    }
                    return false;
                };

                for (const it of inv) {
                    if (matchesRequirement(it)) { hasItem = true; break; }
                }
                questItemCount = this.raknaQuestItemsForUppdrag(spelare, uppdrag.id);
            } catch (e) {}
            ctx.fillStyle = hasItem ? '#9be7ff' : '#ff9999';
            ctx.fillText('Progress: ' + (hasItem ? '1/1' : '0/1') + (questItemCount > 1 ? ' (flera i inventory)' : ''), panelX + 16, panelY + 78);
        } else {
            ctx.fillStyle = uppdrag.status === 'tagen' ? '#ff9999' : '#9be7ff';
            ctx.fillText('Status: ' + (uppdrag.status === 'tagen' ? 'Tagen' : 'Ledig'), panelX + 16, panelY + 78);
        }

        // Om vi är i mottagna-läge, rita "Överge"-knapp
        if (this.lage === 'mottagna') {
            const knappBredd = 90;
            const knappHojd = 28;
            const knappX = panelX + panelBredd - knappBredd - 16;
            const knappY = panelY + panelHojd - knappHojd - 16;
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = '#a33';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.roundRect(knappX, knappY, knappBredd, knappHojd, 7);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Överge', knappX + knappBredd / 2, knappY + knappHojd / 2);
            ctx.restore();
            // Spara knappens position för klickhantering
            this.overgeKnappBounds = { x: knappX, y: knappY, bredd: knappBredd, hojd: knappHojd, index: infoIndex };
        } else {
            this.overgeKnappBounds = null;
        }

        ctx.restore();

        // Rita tooltip om musen hovrar över en info-symbol
        this.tooltipElementBounds = [];
        this.tooltipPanelBounds = null;
        if (this.tooltipData) {
            this.ritaTooltip(this.tooltipData.entitet, this.tooltipData.x, this.tooltipData.y);
            if (this.elementTooltipData) {
                this.ritaElementTooltip(this.elementTooltipData.element, this.elementTooltipData.x, this.elementTooltipData.y);
            }
        } else if (this.pengarTooltipData) {
            this.ritaPengarTooltip(this.pengarTooltipData.valuta, this.pengarTooltipData.x, this.pengarTooltipData.y);
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
        const ctx = this.ctx;
        const info = this.elementInfo[element];
        const ikon = this.hamtaIkonBild(this.elementIkoner[element]);
        if (!info) return;

        const iconSize = 54;
        const textMaxBredd = 180;

        ctx.save();
        ctx.font = '12px Arial';
        const beskrivningsRader = this.brytTextTillRader(info.beskrivning, textMaxBredd);
        const tooltipBredd = 210;
        const tooltipHojd = 24 + iconSize + 14 + (beskrivningsRader.length * 15) + 18;

        let tooltipX = musX + 18;
        let tooltipY = musY - tooltipHojd / 2;

        if (tooltipX + tooltipBredd > this.canvas.width) {
            tooltipX = musX - tooltipBredd - 18;
        }
        if (tooltipY < 0) tooltipY = 0;
        if (tooltipY + tooltipHojd > this.canvas.height) {
            tooltipY = this.canvas.height - tooltipHojd;
        }

        ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipBredd, tooltipHojd, 10);
        ctx.fill();
        ctx.stroke();

        const ikonX = tooltipX + (tooltipBredd - iconSize) / 2;
        const ikonY = tooltipY + 12;
        ctx.fillStyle = 'rgba(77, 109, 140, 0.28)';
        ctx.fillRect(tooltipX + 16, ikonY - 6, tooltipBredd - 32, iconSize + 12);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(info.namn, tooltipX + tooltipBredd / 2, ikonY + iconSize + 10);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#d9ecff';
        let textY = ikonY + iconSize + 30;
        for (const rad of beskrivningsRader) {
            ctx.fillText(rad, tooltipX + tooltipBredd / 2, textY);
            textY += 15;
        }

        ctx.restore();
    }
    parsaBeloning(beloningText) {
        const result = { guld: 0, silver: 0, koppar: 0 };
        const delar = (beloningText || '').split(/och/i);
        for (let del of delar) {
            const match = del.match(/(\d+)\s+(guld|silver|koppar)/);
            if (match) {
                const antal = parseInt(match[1]);
                const typ = match[2];
                result[typ] = antal;
            }
        }
        return result;
    }

    ritaBeloning(beloningText, startX, startY) {
        const ctx = this.ctx;
        const Belöning = this.parsaBeloning(beloningText);
        const ikonStorlek = 16;
        const mellanrum = 5;
        let x = startX;

        const ordning = ['guld', 'silver', 'koppar'];
        for (let valuta of ordning) {
            if (Belöning[valuta] > 0) {
                const ikonBild = this.hamtaIkonBild(this.valutaIkoner[valuta]);
                if (ikonBild && ikonBild.complete && ikonBild.naturalWidth > 0) {
                    ctx.drawImage(ikonBild, x, startY, ikonStorlek, ikonStorlek);
                }
                this.pengarHoverBounds.push({ x, y: startY, w: ikonStorlek, h: ikonStorlek, valuta });
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(Belöning[valuta].toString(), x + ikonStorlek + 3, startY + 2);
                
                const textBredd = ctx.measureText(Belöning[valuta].toString()).width;
                x += ikonStorlek + textBredd + mellanrum + 8;
            }
        }
    }

    ritaPengarTooltip(valuta, musX, musY) {
        const info = this.pengarInfo[valuta];
        const ikon = this.hamtaIkonBild(this.valutaIkoner[valuta]);
        if (!info) return;

        const ctx = this.ctx;
        const iconSize = 52;
        const maxTextBredd = 176;
        ctx.save();
        ctx.font = '12px Arial';
        const beskrivningsRader = this.brytTextTillRader(info.beskrivning, maxTextBredd);
        const tooltipBredd = 210;
        const tooltipHojd = 24 + iconSize + 14 + beskrivningsRader.length * 15 + 18;
        let tooltipX = musX + 16;
        let tooltipY = musY - tooltipHojd / 2;

        if (tooltipX + tooltipBredd > this.canvas.width) tooltipX = musX - tooltipBredd - 16;
        if (tooltipY < 0) tooltipY = 0;
        if (tooltipY + tooltipHojd > this.canvas.height) tooltipY = this.canvas.height - tooltipHojd;

        ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
        ctx.strokeStyle = '#8bd3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipBredd, tooltipHojd, 10);
        ctx.fill();
        ctx.stroke();

        const ikonX = tooltipX + (tooltipBredd - iconSize) / 2;
        const ikonY = tooltipY + 12;
        ctx.fillStyle = 'rgba(77, 109, 140, 0.28)';
        ctx.fillRect(tooltipX + 16, ikonY - 6, tooltipBredd - 32, iconSize + 12);
        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
            ctx.drawImage(ikon, ikonX, ikonY, iconSize, iconSize);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(info.namn, tooltipX + tooltipBredd / 2, ikonY + iconSize + 10);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#d9ecff';
        let textY = ikonY + iconSize + 30;
        for (const rad of beskrivningsRader) {
            ctx.fillText(rad, tooltipX + tooltipBredd / 2, textY);
            textY += 15;
        }

        ctx.restore();
    }

    hamtaIkonBild(src) {
        if (!src) return null;
        if (!this.ikonCache[src]) {
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
            this.ikonCache[src] = img;
        }
        return this.ikonCache[src];
    }

    ritaBeskrivningMedInfo(text, x, y, maxBredd) {
        const ctx = this.ctx;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ddd';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const textDelar = text.split(' ');
        let textX = x;
        let textY = y;
        
        for (let i = 0; i < textDelar.length; i++) {
            const ordText = textDelar[i];
            const ordLower = ordText.toLowerCase().replace(/[.,!?]/g, '');
            
            // Rita ordet
            ctx.fillStyle = '#ddd';
            ctx.font = '12px Arial';
            ctx.fillText(ordText, textX, textY);
            const ordBredd = ctx.measureText(ordText).width;
            textX += ordBredd;

            // Kolla om detta ord är en entitet
            const entitet = this.entitetMapping[ordLower];
            if (entitet) {
                // Rita info-symbol
                const symbolX = textX + 3;
                const symbolStorlek = 10;
                
                ctx.fillStyle = '#4a9eff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('ⓘ', symbolX, textY - 1);
                
                // Spara bounds för hover-detektering
                this.infoBounds.push({
                    x: symbolX,
                    y: textY,
                    w: symbolStorlek,
                    h: 12,
                    entitet: entitet
                });
                
                textX += symbolStorlek + 4;
            }

            // Lägg till mellanrum
            textX += ctx.measureText(' ').width;
        }
    }

    ritaTooltip(entitet, musX, musY) {
        const ctx = this.ctx;
        this.tooltipElementBounds = [];
        
        // Hämta sprite och namn först för att bestämma storlek
        let sprite = null;
        let namn = '';
        
        if (entitet.typ === 'fiende') {
            const stridSystem = this.getStridSystem();
            if (stridSystem) {
                const stats = stridSystem.hamtaFiendeStats(entitet.id);
                if (stats) {
                    sprite = this.hamtaIkonBild(stats.sprite);
                    namn = stats.namn;
                }
            }
        } else if (entitet.typ === 'djur') {
            sprite = this.hamtaIkonBild(entitet.sprite);
            namn = entitet.id;
        }

        // Använd bildens naturliga storlek med maxgräns
        let bildBredd = (sprite && sprite.complete && sprite.naturalWidth > 0) ? sprite.naturalWidth : 60;
        let bildHojd = (sprite && sprite.complete && sprite.naturalHeight > 0) ? sprite.naturalHeight : 60;
        
        // Begränsa bildstorlek (max 250x200)
        const maxBildBredd = 250;
        const maxBildHojd = 200;
        if (bildBredd > maxBildBredd || bildHojd > maxBildHojd) {
            const skala = Math.min(maxBildBredd / bildBredd, maxBildHojd / bildHojd);
            bildBredd = bildBredd * skala;
            bildHojd = bildHojd * skala;
        }
        
        const tooltipBredd = Math.max(200, bildBredd + 20);
        const namnHojd = 20;
        const statsHojd = entitet.typ === 'fiende' ? 40 : 0;
        const tooltipHojd = bildHojd + namnHojd + statsHojd + 20;
        
        let tooltipX = musX + 15;
        let tooltipY = musY - tooltipHojd / 2;

        // Håll tooltips inom canvas
        if (tooltipX + tooltipBredd > this.canvas.width) {
            tooltipX = musX - tooltipBredd - 15;
        }
        if (tooltipY < 0) tooltipY = 0;
        if (tooltipY + tooltipHojd > this.canvas.height) {
            tooltipY = this.canvas.height - tooltipHojd;
        }

        this.tooltipPanelBounds = {
            x: tooltipX,
            y: tooltipY,
            w: tooltipBredd,
            h: tooltipHojd,
            entitet: entitet,
            anchorX: musX,
            anchorY: musY
        };

        ctx.save();

        // Rita bakgrund
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipBredd, tooltipHojd, 8);
        ctx.fill();
        ctx.stroke();

        // Rita sprite i 1:1 skala
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            const bildX = tooltipX + (tooltipBredd - bildBredd) / 2;
            const bildY = tooltipY + 10;
            
            // Rita ljusare bakgrund bakom bilden (nästan lika bred som rutan)
            const bakgrundBredd = tooltipBredd - 10;
            const bakgrundX = tooltipX + 5;
            ctx.fillStyle = 'rgba(60, 60, 70, 0.8)';
            ctx.fillRect(bakgrundX, bildY - 5, bakgrundBredd, bildHojd + 10);
            
            ctx.drawImage(sprite, bildX, bildY, bildBredd, bildHojd);
        }

        // Rita namn
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        const namnY = tooltipY + 10 + bildHojd + 25;
        ctx.fillText(namn, tooltipX + tooltipBredd / 2, namnY);

        // Rita stats för fiender
        if (entitet.typ === 'fiende') {
            const stridSystem = this.getStridSystem();
            if (stridSystem) {
                const stats = stridSystem.hamtaFiendeStats(entitet.id);
                if (stats) {
                    let statY = namnY + 18;
                    
                    // Rita Skada med element-ikoner
                    ctx.fillStyle = '#ffa94d';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText('Skada:', tooltipX + 10, statY);
                    
                    const skada = typeof stats.skada === 'object' ? stats.skada : { fysisk: stats.skada, eld: 0, magi: 0 };
                    let skadaX = tooltipX + 60;
                    const ikonStorlek = 14;
                    const mellanrum = 3;
                    
                    for (let element of ['fysisk', 'eld', 'magi']) {
                        const textBaselineOffset = 9; // empiriskt värde för 11px Arial
                        const ikonY = statY - textBaselineOffset;
                        const ikon = this.hamtaIkonBild(this.elementIkoner[element]);
                        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                            ctx.drawImage(ikon, skadaX, ikonY, ikonStorlek, ikonStorlek);
                        }
                        this.tooltipElementBounds.push({
                            x: skadaX,
                            y: ikonY,
                            w: ikonStorlek,
                            h: ikonStorlek,
                            element: element
                        });
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '11px Arial';
                        ctx.fillText(skada[element] ? skada[element].toString() : '0', skadaX + ikonStorlek + 2, statY);
                        const textBredd = ctx.measureText(skada[element] ? skada[element].toString() : '0').width;
                        skadaX += ikonStorlek + textBredd + mellanrum + 6;
                    }
                    
                    statY += 16;
                    
                    // Rita Motstånd med element-ikoner
                    ctx.fillStyle = '#74c0fc';
                    ctx.font = 'bold 11px Arial';
                    ctx.fillText('Motstånd:', tooltipX + 10, statY);
                    
                    let motstX = tooltipX + 70;
                    
                    for (let element of ['fysisk', 'eld', 'magi']) {
                        const textBaselineOffset = 9; // empiriskt värde för 11px Arial
                        const ikonY = statY - textBaselineOffset;
                        const ikon = this.hamtaIkonBild(this.elementIkoner[element]);
                        if (ikon && ikon.complete && ikon.naturalWidth > 0) {
                            ctx.drawImage(ikon, motstX, ikonY, ikonStorlek, ikonStorlek);
                        }
                        this.tooltipElementBounds.push({
                            x: motstX,
                            y: ikonY,
                            w: ikonStorlek,
                            h: ikonStorlek,
                            element: element
                        });
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '11px Arial';
                        ctx.fillText(stats.motstånd[element] ? stats.motstånd[element].toString() : '0', motstX + ikonStorlek + 2, statY);
                        const textBredd = ctx.measureText(stats.motstånd[element] ? stats.motstånd[element].toString() : '0').width;
                        motstX += ikonStorlek + textBredd + mellanrum + 6;
                    }
                }
            }
        }

        ctx.restore();
    }

    uppdateraScroll() {
        const maxScroll = this.beraknaMaxScroll();
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget, maxScroll));
        this.scrollOffset += (this.scrollTarget - this.scrollOffset) * 0.2;
        if (Math.abs(this.scrollTarget - this.scrollOffset) < 0.5) {
            this.scrollOffset = this.scrollTarget;
        }
        // Smooth-update for info panel scroll
        if (typeof this.infoScrollTarget === 'number') {
            this.infoScrollTarget = Math.max(0, Math.min(this.infoScrollTarget, this.infoMaxScroll || 0));
            this.infoScroll += (this.infoScrollTarget - this.infoScroll) * 0.2;
            if (Math.abs(this.infoScrollTarget - this.infoScroll) < 0.5) this.infoScroll = this.infoScrollTarget;
        }
    }

    beraknaMaxScroll() {
        const panelHojd = 240;
        const headerHojd = 36;
        const footerHojd = 26;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 28;
        const contentHojd = this.hamtaAktivLista().length * radHojd;
        return Math.max(0, contentHojd - listHojd);
    }

    justeraScrollForVal() {
        const panelHojd = 240;
        const headerHojd = 36;
        const footerHojd = 26;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 28;
        const itemTop = this.shopValdIndex * radHojd;
        const itemBottom = itemTop + radHojd;

        if (itemTop < this.scrollTarget) {
            this.scrollTarget = itemTop;
        } else if (itemBottom > this.scrollTarget + listHojd) {
            this.scrollTarget = itemBottom - listHojd;
        }

        const maxScroll = this.beraknaMaxScroll();
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget, maxScroll));
    }

    hamtaIndexFranMus(musX, musY) {
        const panelX = 20;
        const panelY = 20;
        const panelBredd = 320;
        const panelHojd = 240;
        const headerHojd = 36;
        const footerHojd = 26;
        const listTop = panelY + headerHojd + 12;
        const listHojd = panelHojd - headerHojd - footerHojd - 20;
        const radHojd = 28;

        const inomPanel = musX >= panelX && musX <= panelX + panelBredd && musY >= listTop && musY <= listTop + listHojd;
        if (!inomPanel) return null;

        const relY = musY - listTop + this.scrollOffset;
        const index = Math.floor(relY / radHojd);
        if (index < 0 || index >= this.hamtaAktivLista().length) return null;
        return index;
    }

    hamtaAktivLista() {
        if (this.lage === 'start') return this.startAlternativ;
        if (this.lage === 'mottagna') {
            return this.aktivaUppdrag;
        }
        return this.uppdragLista;
    }

    hanteraStartVal(index) {
        const alternativ = this.startAlternativ[index];
        if (!alternativ) return null;

        if (alternativ.action === 'uppdrag') {
            this.lage = 'uppdrag';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return null;
        }

        if (alternativ.action === 'mottagna') {
            this.lage = 'mottagna';
            this.shopValdIndex = 0;
            this.scrollOffset = 0;
            this.scrollTarget = 0;
            return null;
        }

        if (alternativ.action === 'tillbaka') {
            this.onExit();
            return null;
        }

        return null;
    }

    hanteraUppdragVal(index) {
        const uppdrag = this.uppdragLista[index];
        if (!uppdrag) return null;

        if (uppdrag.status === 'tagen') {
            this.visaMeddelande('Du har redan tagit detta uppdrag.');
            return null;
        }

        // Kolla om spelaren redan har max antal uppdrag
        if (this.aktivaUppdrag.length >= 4) {
            this.visaMeddelande('Du kan bara ha 4 uppdrag samtidigt!');
            return null;
        }

        // Förhindra att samma uppdrag åter tas under samma besök efter slutfört
        if (this.completedThisVisit && this.completedThisVisit.has(uppdrag.id)) {
            this.visaMeddelande('Detta uppdrag återkommer nästa gång du besöker långhuset.');
            return null;
        }
        // Lägg bara till om uppdraget inte redan finns i aktivaUppdrag
        const finnsRedan = this.aktivaUppdrag.some(aktiv => aktiv.id === uppdrag.id);
        if (!finnsRedan) {
            // Avgör om detta uppdrag kräver en vara/utrustning från chansrutan
            let chansType = null;
            const desc = (uppdrag.beskrivning || '').toLowerCase();
            if (desc.includes('chansrutan') || desc.includes('chansruta') || desc.includes('chansrutan')) {
                if (desc.includes('vara')) chansType = 'vara';
                if (desc.includes('utrustning')) chansType = 'utrustning';
            }
            // Snapshot current kill counts so quest only counts kills after acceptance
            const spelForSnapshot = this.getSpelare ? this.getSpelare() : (window.varlden && window.varlden.spelare);
            const acceptedKillsTotal = (spelForSnapshot && spelForSnapshot.prestationer && spelForSnapshot.prestationer.fiendesBesegrade) || 0;
            const acceptedKillsByType = (spelForSnapshot && spelForSnapshot.prestationer && spelForSnapshot.prestationer.killsByType) ? JSON.parse(JSON.stringify(spelForSnapshot.prestationer.killsByType)) : ((spelForSnapshot && spelForSnapshot.prestationer && spelForSnapshot.prestationer.killsByType) || {});
            const globalHamtaSpelarInteraktionsRakning = (typeof hamtaSpelarInteraktionsRakning === 'function')
                ? hamtaSpelarInteraktionsRakning
                : ((typeof window !== 'undefined' && typeof window.hamtaSpelarInteraktionsRakning === 'function') ? window.hamtaSpelarInteraktionsRakning : null);
            const acceptedInteractionCounts = globalHamtaSpelarInteraktionsRakning
                ? JSON.parse(JSON.stringify(globalHamtaSpelarInteraktionsRakning(spelForSnapshot)))
                : ((spelForSnapshot && spelForSnapshot.prestationer && spelForSnapshot.prestationer.interaktioner)
                    ? JSON.parse(JSON.stringify(spelForSnapshot.prestationer.interaktioner))
                    : {});
            this.aktivaUppdrag.push({
                id: uppdrag.id,
                namn: uppdrag.namn,
                beskrivning: uppdrag.beskrivning,
                Belöning: uppdrag.Belöning,
                status: 'tagen',
                questChansType: chansType,
                acceptedKillsTotal: acceptedKillsTotal,
                acceptedKillsByType: acceptedKillsByType,
                acceptedInteractionCounts: acceptedInteractionCounts
            });
        }
        
        uppdrag.status = 'tagen';
        this.visaMeddelande('Uppdrag accepterat! Belöning: ' + uppdrag.Belöning);
        return null;
    }

    hanteraMottagnVal(index) {
        const uppdrag = this.aktivaUppdrag[index];
        if (!uppdrag) return null;

        // Debug: log selected uppdrag and current inventory for diagnosis
        try {
            const spelareDebug = this.getSpelare ? this.getSpelare() : (window.varlden && window.varlden.spelare);
            const invDebug = spelareDebug && spelareDebug.utrustning && Array.isArray(spelareDebug.utrustning.inventory) ? spelareDebug.utrustning.inventory : [];
            try {
                console.log('Långhuset DEBUG: attempting turn-in for ' + (uppdrag && uppdrag.id) + ' selectedIndex: ' + index + '\ninventory: ' + JSON.stringify(invDebug, null, 2) + '\naktivaUppdrag: ' + JSON.stringify(this.aktivaUppdrag, null, 2));
            } catch (e) {
                console.log('Långhuset DEBUG: attempting turn-in for', uppdrag && uppdrag.id, 'selectedIndex:', index, 'inventory:', invDebug, 'aktivaUppdrag:', this.aktivaUppdrag);
            }
        } catch (e) { /* ignore */ }

        // Kolla om det är ett "lämna in"-uppdrag
        const beskrivning = uppdrag.beskrivning || '';
        // Match common Swedish phrasing for "lämna in" including variants like "lämna sedan in"
        const lamnaInMatch = beskrivning.match(/lämna(?:\s+\S+){0,4}\s+in/i);
        if (lamnaInMatch && this.getSpelare) {
            const spelare = this.getSpelare();
            if (spelare && spelare.utrustning) {
                // If this is a chansruta-type quest (either flagged or mentioned in description), require the quest-linked item (questFor)
                const isChans = uppdrag.questChansType || /(chansrutan|chansruta|chans)/i.test(uppdrag.beskrivning || '');
                if (isChans) {
                    const inv = Array.isArray(spelare.utrustning.inventory) ? spelare.utrustning.inventory : [];
                    const questItemCount = this.raknaQuestItemsForUppdrag(spelare, uppdrag.id);
                    if (questItemCount < 1) {
                        // Debug: print inventory and active quest to console to help diagnose why quest-item isn't present
                        try { console.warn('Långhuset: turn-in nekad, saknar quest-item\n' + JSON.stringify({ uppdragId: uppdrag.id, inventory: spelare.utrustning.inventory, aktivaUppdrag: this.aktivaUppdrag }, null, 2)); } catch (e) { try { console.warn('Långhuset: turn-in nekad, saknar quest-item', { uppdragId: uppdrag.id, inventory: spelare.utrustning.inventory, aktivaUppdrag: this.aktivaUppdrag }); } catch (e2) {} }
                        this.visaMeddelande('Du måste ha uppdragsföremålet för att lämna in!');
                        return null;
                    }
                    // Ta bort alla quest-märkta kopior för uppdraget för att städa upp tidigare dubbletter.
                    this.taBortQuestItemsForUppdrag(spelare, uppdrag.id, Infinity);
                    // Ge belöning
                    if (this.getSpelare) {
                        const spel = this.getSpelare();
                        if (spel && spel.pengar) {
                            const beloning = this.parsaBeloning(uppdrag.Belöning);
                            if (typeof spel.laggTillPengar === 'function') {
                                spel.laggTillPengar(beloning, { raknaSomIntakt: true });
                            } else {
                                if (typeof spel.pengar.guld === 'number') spel.pengar.guld += beloning.guld || 0;
                                if (typeof spel.pengar.silver === 'number') spel.pengar.silver += beloning.silver || 0;
                                if (typeof spel.pengar.koppar === 'number') spel.pengar.koppar += beloning.koppar || 0;
                                if (spel.prestationer && typeof spel.prestationer.totaltGuldSamlat === 'number') {
                                    const totaltKoppar = (beloning.koppar || 0) + (beloning.silver || 0) * 10 + (beloning.guld || 0) * 100;
                                    spel.prestationer.totaltGuldSamlat += totaltKoppar;
                                }
                                if (typeof spel.normaliseraPengar === 'function') {
                                    spel.normaliseraPengar();
                                }
                            }
                            if (((beloning.koppar || 0) + (beloning.silver || 0) + (beloning.guld || 0)) > 0 && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                                window.spelaStandardLjud('pengar');
                            }
                        }
                    }
                    // Markera som slutfört under denna visit
                    if (!this.completedThisVisit) this.completedThisVisit = new Set();
                    this.completedThisVisit.add(uppdrag.id);
                    // Ta bort uppdraget från aktiva
                    this.aktivaUppdrag.splice(index, 1);
                    this.byggUppdragLista();
                    this.visaMeddelande('Uppdrag inlämnat!');
                    this.rita();
                    return null;
                }

                const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
                const normaliseraLaminaInNamn = (namn) => {
                    const namnNorm = normalize(namn).trim();
                    const namnMap = {
                        'kottbit': 'kottbit',
                        'kottbitar': 'kottbit',
                        'kott': 'kottbit',
                        'jarn': 'jarn',
                        'sten': 'sten',
                        'tra': 'tra',
                        'titanit': 'titanit',
                        'tom flaska': 'tom flaska',
                        'tomma flaskor': 'tom flaska',
                        'flaska med vatten': 'flaskaMedVatten',
                        'flaskor med vatten': 'flaskaMedVatten',
                        'galdrat vatten': 'galdratVatten'
                    };
                    return namnMap[namnNorm] || namnNorm;
                };
                // Hitta krav antingen via global parseLaminaInKrav eller fallback
                let krav = [];
                const globalParseLaminaInKrav = (typeof parseLaminaInKrav === 'function')
                    ? parseLaminaInKrav
                    : ((typeof window !== 'undefined' && typeof window.parseLaminaInKrav === 'function') ? window.parseLaminaInKrav : null);
                if (globalParseLaminaInKrav) {
                    krav = globalParseLaminaInKrav(beskrivning);
                } else {
                    // Fallback: parsar bara delen mellan "lämna in" och "till"
                    const match = beskrivning.match(/lämna in ([^.]*) till/i);
                    const delar = match ? match[1].split(/och/i) : [];
                    for (let del of delar) {
                        const m = del.trim().match(/(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio)\s+([a-zåäöA-ZÅÄÖ\s]+)/i);
                        if (m) {
                            const antal = isNaN(parseInt(m[1])) ? textTillSiffra(m[1].toLowerCase()) : parseInt(m[1]);
                            krav.push({ namn: normaliseraLaminaInNamn(m[2]), antal });
                        }
                    }
                }

                // Kontrollera att spelaren har tillräckligt av varje krav
                let alltFanns = true;
                // Extra säkerhet: om beskrivningen nämner chansrutan men isChans av någon anledning var falsk,
                // avvisa inlämning här så vi inte accepterar generiska items.
                const descIsChans = /(chansrutan|chansruta|chans)/i.test(beskrivning || '');
                if (descIsChans && !isChans) {
                    try { console.warn('Långhuset: chans-uppdrag men isChans var falsk, avbryter turn-in', { beskrivning, uppdragId: uppdrag.id }); } catch (e) {}
                    this.visaMeddelande('Du måste ha uppdragsföremålet för att lämna in!');
                    return null;
                }
                for (let k of krav) {
                    const krNamnNorm = normaliseraLaminaInNamn(k.namn);
                    // Försök hitta id i tillgangligaForemal
                    let foremalId = null;
                    for (const [id, def] of Object.entries(spelare.utrustning.tillgangligaForemal || {})) {
                        if (normalize(def.namn) === krNamnNorm || normalize(id) === krNamnNorm) {
                            foremalId = id;
                            break;
                        }
                    }
                    // Räkna totalt i inventory
                    let totalCount = 0;
                    for (const item of spelare.utrustning.inventory || []) {
                        if (!item) continue;
                        if (foremalId) {
                            if (normalize(item.id) === normalize(foremalId) || normalize(item.namn) === krNamnNorm) {
                                totalCount += item.count || 1;
                            }
                        } else {
                            // Om vi inte hittade ett id, matcha mot namnet direkt
                            if (normalize(item.namn) === krNamnNorm || normalize(item.id) === krNamnNorm) {
                                totalCount += item.count || 1;
                            }
                        }
                    }
                    if (totalCount < k.antal) {
                        alltFanns = false;
                        break;
                    }
                }

                if (!alltFanns) {
                    this.visaMeddelande('Du har inte alla föremål som krävs!');
                    return null;
                }

                // Ta bort de items som krävs
                for (let k of krav) {
                    const krNamnNorm = normaliseraLaminaInNamn(k.namn);
                    let foremalId = null;
                    for (const [id, def] of Object.entries(spelare.utrustning.tillgangligaForemal || {})) {
                        if (normalize(def.namn) === krNamnNorm || normalize(id) === krNamnNorm) {
                            foremalId = id;
                            break;
                        }
                    }
                    let toRemove = k.antal;
                    // Först: ta från items som är markerade som quest-item för detta uppdrag
                    for (let i = spelare.utrustning.inventory.length - 1; i >= 0 && toRemove > 0; i--) {
                        const item = spelare.utrustning.inventory[i];
                        if (!item) continue;
                        if (!item.questFor || item.questFor !== uppdrag.id) continue;
                        if (foremalId) {
                            if (!(normalize(item.id) === normalize(foremalId) || normalize(item.namn) === krNamnNorm)) continue;
                        } else {
                            if (!(normalize(item.namn) === krNamnNorm || normalize(item.id) === krNamnNorm)) continue;
                        }
                        const count = item.count || 1;
                        const take = Math.min(count, toRemove);
                        if (item.count && item.count > take) {
                            item.count -= take;
                        } else {
                            spelare.utrustning.inventory[i] = null;
                        }
                        toRemove -= take;
                    }
                    // Andra pass: ta från vanliga stacks
                    for (let i = spelare.utrustning.inventory.length - 1; i >= 0 && toRemove > 0; i--) {
                        const item = spelare.utrustning.inventory[i];
                        if (!item) continue;
                        if (item.questFor && item.questFor === uppdrag.id) continue; // redan behandlade
                        if (foremalId) {
                            if (!(normalize(item.id) === normalize(foremalId) || normalize(item.namn) === krNamnNorm)) continue;
                        } else {
                            if (!(normalize(item.namn) === krNamnNorm || normalize(item.id) === krNamnNorm)) continue;
                        }
                        const count = item.count || 1;
                        const take = Math.min(count, toRemove);
                        if (item.count && item.count > take) {
                            item.count -= take;
                        } else {
                            spelare.utrustning.inventory[i] = null;
                        }
                        toRemove -= take;
                    }
                    if (typeof spelare.utrustning.stadaTommaSvansrutor === 'function') {
                        spelare.utrustning.stadaTommaSvansrutor();
                    }
                }
            }
        }
        function textTillSiffra(txt) {
            const map = { 'ett': 1, 'en': 1, 'två': 2, 'tre': 3, 'fyra': 4, 'fem': 5, 'sex': 6, 'sju': 7, 'åtta': 8, 'nio': 9, 'tio': 10 };
            return map[txt] || 1;
        }
        // Kontrollera särskilda krav för "döda/dräpa"-uppdrag innan belöning ges
        const beskrivningLower = (uppdrag.beskrivning || '').toLowerCase();
        if (/(?:döda|dräpa|dräp|drapa|slå ihjäl)/i.test(uppdrag.beskrivning || '')) {
            // Använd parseDodaKrav om tillgänglig
            let krav = [];
            if (typeof parseDodaKrav === 'function') {
                krav = parseDodaKrav(uppdrag.beskrivning || '');
            } else {
                // Robust fallback: strip the verb (döda/dräpa/...) then parse targets
                const match = (uppdrag.beskrivning || '').match(/(?:döda|dräpa|dräp|drapa|slå ihjäl) ([^.]*)/i);
                if (match) {
                    const delar = match[1].split(/och/i);
                    for (let del of delar) {
                        const m = del.trim().match(/(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio)?\s*([a-zåäöA-ZÅÄÖ]+)/i);
                        if (m) {
                            const antal = m[1] ? (isNaN(parseInt(m[1])) ? textTillSiffra(m[1].toLowerCase()) : parseInt(m[1])) : 1;
                            krav.push({ namn: m[2].toLowerCase(), antal });
                        }
                    }
                } else {
                    // Very defensive fallback: try simple split-by-words
                    const delar2 = (uppdrag.beskrivning || '').split(/och/i);
                    for (let del of delar2) {
                        const m = del.trim().match(/(\d+|ett|en|två|tre|fyra|fem|sex|sju|åtta|nio|tio)?\s*([a-zåäöA-ZÅÄÖ]+)/i);
                        if (m) {
                            const antal = m[1] ? (isNaN(parseInt(m[1])) ? textTillSiffra(m[1].toLowerCase()) : parseInt(m[1])) : 1;
                            krav.push({ namn: m[2].toLowerCase(), antal });
                        }
                    }
                }
            }
            const spel = this.getSpelare ? this.getSpelare() : (window.varlden && window.varlden.spelare);
            const totalKills = (spel && spel.prestationer && spel.prestationer.fiendesBesegrade) || 0;
            const killsByType = (spel && spel.prestationer && spel.prestationer.killsByType) || {};
            // Subtract baseline from when the quest was accepted so only kills after acceptance count
            const baselineTotal = uppdrag.acceptedKillsTotal || 0;
            const baselineByType = uppdrag.acceptedKillsByType || {};
            const effectiveTotal = Math.max(0, totalKills - baselineTotal);
            const normalize = s => (s || '').toLowerCase().replace(/[.,!?]/g, '').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
            // Kontrollera varje krav mot per-typ först, annars mot effektiva total
            let ok = true;
            for (let k of krav) {
                const key = normalize(k.namn);
                const byTypeRaw = killsByType[key] || 0;
                const baselineForKey = baselineByType[key] || 0;
                const byType = Math.max(0, byTypeRaw - baselineForKey);
                // If exact per-type count is zero, try tolerant matching against recorded keys
                let usedByType = byType;
                if (usedByType === 0) {
                    try {
                        for (const recordedKey of Object.keys(killsByType || {})) {
                            if (!recordedKey) continue;
                            if (recordedKey === key) continue;
                            if (recordedKey.includes(key) || key.includes(recordedKey)) {
                                const raw = killsByType[recordedKey] || 0;
                                const base = baselineByType[recordedKey] || 0;
                                usedByType += Math.max(0, raw - base);
                            }
                        }
                    } catch (e) {}
                }
                const isGeneric = /fiend|djur/i.test(k.namn);
                const have = isGeneric ? effectiveTotal : usedByType;
                console.log('Långhuset DEBUG: kill-check', { namn: k.namn, key, byTypeRaw, baselineForKey, usedByType, isGeneric, effectiveTotal, require: k.antal });
                if (have < k.antal) { ok = false; break; }
            }
            if (!ok) {
                this.visaMeddelande('Du har inte dödat tillräckligt många fiender för detta uppdrag!');
                return null;
            }
        }

        const globalBeraknaInteraktionsProgress = (typeof beraknaInteraktionsProgress === 'function')
            ? beraknaInteraktionsProgress
            : ((typeof window !== 'undefined' && typeof window.beraknaInteraktionsProgress === 'function') ? window.beraknaInteraktionsProgress : null);
        if (globalBeraknaInteraktionsProgress) {
            const spelare = this.getSpelare ? this.getSpelare() : (window.varlden && window.varlden.spelare);
            const interaktionsProgress = globalBeraknaInteraktionsProgress(uppdrag.beskrivning || '', spelare, uppdrag);
            if (interaktionsProgress && interaktionsProgress.krav && interaktionsProgress.krav.length > 0 && !interaktionsProgress.allDone) {
                this.visaMeddelande('Du har inte gjort klart interaktionskravet: ' + interaktionsProgress.progressText);
                return null;
            }
        }

        // Ge belöning om möjligt
        if (this.getSpelare) {
            const spelare = this.getSpelare();
            if (spelare && spelare.pengar) {
                const beloning = this.parsaBeloning(uppdrag.Belöning);
                if (typeof spelare.laggTillPengar === 'function') {
                    spelare.laggTillPengar(beloning, { raknaSomIntakt: true });
                } else {
                    if (typeof spelare.pengar.guld === 'number') spelare.pengar.guld += beloning.guld || 0;
                    if (typeof spelare.pengar.silver === 'number') spelare.pengar.silver += beloning.silver || 0;
                    if (typeof spelare.pengar.koppar === 'number') spelare.pengar.koppar += beloning.koppar || 0;
                    if (spelare.prestationer && typeof spelare.prestationer.totaltGuldSamlat === 'number') {
                        const totaltKoppar = (beloning.koppar || 0) + (beloning.silver || 0) * 10 + (beloning.guld || 0) * 100;
                        spelare.prestationer.totaltGuldSamlat += totaltKoppar;
                    }
                    if (typeof spelare.normaliseraPengar === 'function') {
                        spelare.normaliseraPengar();
                    }
                }
                if (((beloning.koppar || 0) + (beloning.silver || 0) + (beloning.guld || 0)) > 0 && typeof window !== 'undefined' && typeof window.spelaStandardLjud === 'function') {
                    window.spelaStandardLjud('pengar');
                }
            }
        }
        // Markera som slutfört under denna visit så det inte åter tas
        if (!this.completedThisVisit) this.completedThisVisit = new Set();
        this.completedThisVisit.add(uppdrag.id);
        // Ta bort uppdraget från aktiva
        this.aktivaUppdrag.splice(index, 1);
        // Uppdatera listan med uppdrag så att huvudlistan visar status korrekt direkt
        this.byggUppdragLista();
        this.visaMeddelande('Uppdrag inlämnat!');
        // Rita om direkt så att listan uppdateras
        this.rita();
        return null;
    }

    skapaTavernNamn() {
        const prefixLista = this.tavernDelar.prefix;
        const suffixLista = this.tavernDelar.suffix;
        const prefix = prefixLista[Math.floor(Math.random() * prefixLista.length)];
        const suffix = suffixLista[Math.floor(Math.random() * suffixLista.length)];
        this.tavernPrefix = prefix;
        this.tavernSuffix = suffix;
        this.tavernNamn = prefix + "'s " + suffix;
    }

    byggUppdragLista() {
        const prefix = this.tavernPrefix;
        const suffix = this.tavernSuffix;
        const mallar = this.uppdragPool[prefix] || [];
        const beloningsLista = this.beloningsPool[suffix] || ['20 silver'];

        // Filtrera bort mallar som redan slutförts under denna visit så de inte visas i "Uppdrag"
        const visibleMallar = (mallar || []).filter(mall => !(this.completedThisVisit && this.completedThisVisit.has(mall.id)));
        this.uppdragLista = visibleMallar.map((mall) => {
            const arTagen = this.aktivaUppdrag.some(aktiv => aktiv.id === mall.id);
            // Bestäm om detta mall kräver ett föremål/utrustning från chansrutan
            const desc = (mall.beskrivning || '').toLowerCase();
            let questChansType = null;
            if (desc.includes('chansrutan') || desc.includes('chansruta') || desc.includes('chans')) {
                if (desc.includes('vara')) questChansType = 'vara';
                if (desc.includes('utrustning')) questChansType = 'utrustning';
            }
            return {
                id: mall.id,
                namn: mall.namn,
                beskrivning: mall.beskrivning,
                Belöning: beloningsLista[Math.floor(Math.random() * beloningsLista.length)],
                status: arTagen ? 'tagen' : 'ledig',
                questChansType: questChansType
            };
        });

        if (this.uppdragLista.length === 0) {
            this.uppdragLista = [
                {
                    id: 'uppdrag_standard',
                    namn: 'Hjalp langhuset',
                    beskrivning: 'Samla 5 tra till langhuset.',
                    Belöning: beloningsLista[0] || '20 silver',
                    status: 'ledig'
                }
            ];
        }
    }

    visaMeddelande(text) {
        this.meddelande = { text, tills: Date.now() + 5000 };
    }

    ritaMeddelande() {
        if (!this.meddelande) return;
        if (Date.now() > this.meddelande.tills) {
            this.meddelande = null;
            return;
        }

        const ctx = this.ctx;
        const canvas = this.canvas;
        const text = this.meddelande.text;

        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const paddingX = 16;
        const paddingY = 10;
        const textWidth = ctx.measureText(text).width;
        const boxW = textWidth + paddingX * 2;
        const boxH = 32 + paddingY;
        const x = canvas.width / 2 - boxW / 2;
        const y = canvas.height - 90;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x + boxW / 2, y + boxH / 2);
        ctx.restore();
    }
}
