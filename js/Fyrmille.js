class Fyrmille {
    constructor(onEnterSmeden, onEnterKartan, onEnterLanghuset, onEnterByggarbetsplatsen, onEnterDruidenochSierskan, onEnterLotteriet) {
        this.onEnterSmeden = onEnterSmeden;
        this.onEnterKartan = onEnterKartan;
        this.onEnterLanghuset = onEnterLanghuset;
        this.onEnterByggarbetsplatsen = onEnterByggarbetsplatsen;
        this.onEnterDruidenochSierskan = onEnterDruidenochSierskan;
        this.onEnterLotteriet = onEnterLotteriet;
        // Definiera interaktionspunkter i Fyrmille
        this.interaktionspunkter = [
            {
                namn: 'Smeden',
                x: 630,
                y: 450,
                radie: 60,
                knapptext: 'E',
                meddelande: 'Tryck på [E] för att träda in',
                action: () => this.gaInTillSmeden()
            },
            {
                namn: 'Långhuset',
                x: 200,
                y: 470,
                radie: 100,
                knapptext: 'E',
                meddelande: 'Tryck på [E] för att träda in',
                action: () => this.gaInTillLanghuset()
            },
            {
                namn: 'Lotteriet',
                x: 650,
                y: 240,
                radie: 70,
                knapptext: 'E',
                meddelande: 'Tryck på [E] för att träda in',
                action: () => this.gaInTillLotteriet()
            },
            {
                namn: 'Byggarbetsplatsen',
                x: 220,
                y: 210,
                radie: 70,
                knapptext: 'E',
                meddelande: 'Tryck på [E] för att träda in',
                action: () => this.gaInTillByggarbetsplatsen()
            },
            {
                namn: 'Druiden & Sierskan',
                x: 420,
                y: 120,
                radie: 130,
                knapptext: 'E',
                meddelande: 'Tryck på [E] för att träda in',
                action: () => this.gaInTillDruidenOchSierskan()
            },
            {
                namn: 'Kartan',
                x: 420,
                y: 670,
                radie: 130,
                form: 'fyrkantig',
                knapptext: 'E',
                meddelande: 'Tryck på [E] för att se kartan',
                action: () => this.gaInTillKartan()
            }
        ];
        
        this.narmastePunkt = null;
        this.eKnappNedtryckt = false;
    }
    
    // Kontrollera närhet till interaktionspunkter
    kontrolleraNarhet(spelareX, spelareY) {
        const tidigarePunkt = this.narmastePunkt;
        this.narmastePunkt = null;
        let minstaAvstand = Infinity;
        
        for (let punkt of this.interaktionspunkter) {
            const avstand = this.beraknaAvstand(spelareX, spelareY, punkt.x, punkt.y);
            
            if (avstand <= punkt.radie && avstand < minstaAvstand) {
                minstaAvstand = avstand;
                this.narmastePunkt = punkt;
            }
        }

        if (this.narmastePunkt !== tidigarePunkt) {
            this.eKnappNedtryckt = false;
        }
    }
    
    // Beräkna avstånd mellan två punkter
    beraknaAvstand(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Rita zoner (för debug/positionering)
    ritaZoner(ctx) {
        ctx.save();
        
        for (let punkt of this.interaktionspunkter) {
            ctx.fillStyle = 'rgba(138, 43, 226, 0.3)'; // Lila med transparens
            ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)'; // Lila kant
            ctx.lineWidth = 2;
            
            if (punkt.form === 'fyrkantig') {
                // Rita fyrkantig zon
                const storlek = punkt.radie * 2;
                ctx.fillRect(punkt.x - punkt.radie, punkt.y - punkt.radie, storlek, storlek);
                ctx.strokeRect(punkt.x - punkt.radie, punkt.y - punkt.radie, storlek, storlek);
            } else {
                // Rita rund zon (standard)
                ctx.beginPath();
                ctx.arc(punkt.x, punkt.y, punkt.radie, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            
            // Rita namn på punkten
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(punkt.namn, punkt.x, punkt.y);
        }
        
        ctx.restore();
    }
    
    // Rita interaktionsmeddelande
    ritaInteraktionsmeddelande(ctx, spelareX, spelareY) {
        if (!this.narmastePunkt) return;
        
        const punkt = this.narmastePunkt;
        
        // Rita meddelandet ovanför spelaren
        ctx.save();
        
        // Bakgrund
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        
        const textBredd = ctx.measureText(punkt.meddelande).width + 20;
        const textHojd = 30;
        const x = spelareX - textBredd / 2;
        const y = spelareY - 60;
        
        // Rita rektangel med rundade hörn
        ctx.beginPath();
        ctx.roundRect(x, y, textBredd, textHojd, 5);
        ctx.fill();
        ctx.stroke();
        
        // Rita text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(punkt.meddelande, spelareX, y + textHojd / 2);
        
        ctx.restore();
    }
    
    // Hantera tangentnedtryckning
    tangentNed(tangent) {
        if ((tangent === 'e' || tangent === 'E') && this.narmastePunkt && !this.eKnappNedtryckt) {
            this.eKnappNedtryckt = true;
            this.narmastePunkt.action();
        }
    }
    
    // Hantera tangentuppåt
    tangentUpp(tangent) {
        if (tangent === 'e' || tangent === 'E') {
            this.eKnappNedtryckt = false;
        }
    }
    
    // Gå in till smeden
    gaInTillSmeden() {
        console.log('Går in till Smeden...');
        if (this.onEnterSmeden) {
            this.onEnterSmeden();
            return;
        }
        // Fallback
        alert('Välkommen till Smeden!');
    }
    
    // Gå in till långhuset
    gaInTillLanghuset() {
        console.log('Går in till Långhuset...');
        if (this.onEnterLanghuset) {
            this.onEnterLanghuset();
            return;
        }
        // Fallback
        alert('Välkommen till Långhuset! (Inomhusskärm kommer snart)');
    }
    
    // Gå in till lotteriet
    gaInTillLotteriet() {
        console.log('Går in till Lotteriet...');
        if (this.onEnterLotteriet) {
            this.onEnterLotteriet();
            return;
        }
        // Fallback
        alert('Välkommen till Lotteriet! (Inomhusskärm kommer snart)');
    }
    
    // Gå in till byggarbetsplatsen
    gaInTillByggarbetsplatsen() {
        console.log('Går in till Byggarbetsplatsen...');
        if (this.onEnterByggarbetsplatsen) {
            this.onEnterByggarbetsplatsen();
            return;
        }
        // Fallback
        alert('Välkommen till Byggarbetsplatsen! (Inomhusskärm kommer snart)');
    }
    
    // Gå in till druiden och sierskan
    gaInTillDruidenOchSierskan() {
        console.log('Går in till Druiden & Sierskan...');
        if (this.onEnterDruidenochSierskan) {
            this.onEnterDruidenochSierskan();
            return;
        }
        // Fallback
        alert('Välkommen till Druiden & Sierskan! (Inomhusskärm kommer snart)');
    }

    // Gå till kartan
    gaInTillKartan() {
        console.log('Öppnar kartan...');
        if (this.onEnterKartan) {
            this.onEnterKartan();
            return;
        }
        // Fallback
        alert('Kartan öppnas!');
    }
}
