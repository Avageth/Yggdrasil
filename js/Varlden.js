class Varlden {
    constructor(canvas, ctx, onEnterSmeden, onEnterKartan, onEnterLanghuset, onEnterByggarbetsplatsen, onEnterDruidenochSierskan, onEnterLotteriet) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.spelare = null;
        this.spawnX = 400;
        this.spawnY = 500;
        this.eNer = false;
        
        // Initiera Fyrmille-interaktioner (inkl. Byggarbetsplatsen)
        this.fyrmille = new Fyrmille(onEnterSmeden, onEnterKartan, onEnterLanghuset, onEnterByggarbetsplatsen, onEnterDruidenochSierskan, onEnterLotteriet);
        
        // Ladda Fyrmille-bilden
        this.fyrmilleBild = new Image();
        this.fyrmilleBild.src = 'assets/platser/Fyrmille.png';
        this.fyrmilleBild.onload = () => {
            console.log('Fyrmille-bild laddad!');
        };
        this.fyrmilleBild.onerror = () => {
            console.log('Kunde inte ladda Fyrmille-bild från: assets/platser/Fyrmille.png');
        };
        
        // Definiera barriärer i Fyrmille baserat på de vita linjerna
        this.barriarer = [
            // DRUIDEN & SIERSKAN område (överst)
            { x: 0, y: 0, bredd: 500, hojd: 150 },
            
            // LOTTERIET område (överst höger)
            { x: 500, y: 30, bredd: 300, hojd: 160 },
            
            // Vänstersida byggnad
            { x: 20, y: 200, bredd: 130, hojd: 140 },
            
            // Skogen ovanför LÅNGHUSET
            { x: 120, y: 260, bredd: 150, hojd: 40 },

            // Skogen brevid LÅNGHUSET
            { x: 80, y: 380, bredd: 50, hojd: 200 },

            // Skogen under LÅNGHUSET
            { x: 105, y: 520, bredd: 150, hojd: 40 },

            // LÅNGHUSET område (nedre vänster)
            { x: 60, y: 300, bredd: 300, hojd: 140 },
            
            // SMEDEN område (nedre höger)
            { x: 540, y: 500, bredd: 170, hojd: 60 },
            
            // SMEDEN område (mitten höger)
            { x: 510, y: 270, bredd: 150, hojd: 140 },

            // Högersida område
            { x: 700, y: 200, bredd: 80, hojd: 250 },
            
            // Skärmkanter
            { x: 0, y: 0, bredd: 800, hojd: 20 },      // Övre kant
            { x: 0, y: 580, bredd: 800, hojd: 20 },    // Nedre kant
            { x: 0, y: 0, bredd: 20, hojd: 600 },      // Vänster kant
            { x: 780, y: 0, bredd: 20, hojd: 600 }     // Höger kant
        ];
    }
    
    initieraSpelare(namn, klass) {
        // Skapa en ny spelare
        this.spelare = new Spelare(namn, klass, this.spawnX, this.spawnY);

        const startForemal = klass.startForemal || [];
        startForemal.forEach((entry) => {
            const foremalId = typeof entry === 'string' ? entry : entry.id;
            const count = typeof entry === 'string' ? 1 : (entry.count || 1);
            for (let i = 0; i < count; i++) {
                this.spelare.utrustning.laggTillForemal(foremalId, { source: 'start' });
            }
        });
    }

    placeraSpelareVidSpawn() {
        if (!this.spelare) return;
        this.spelare.x = this.spawnX;
        this.spelare.y = this.spawnY;
    }

    rensaInput() {
        if (this.spelare) {
            if (typeof this.spelare.rensaInput === 'function') {
                this.spelare.rensaInput();
            } else if (this.spelare.tangenter) {
                this.spelare.tangenter.up = false;
                this.spelare.tangenter.down = false;
                this.spelare.tangenter.left = false;
                this.spelare.tangenter.right = false;
            }
        }
        this.eNer = false;
        if (this.fyrmille) {
            this.fyrmille.eKnappNedtryckt = false;
        }
    }
    
    tangentNed(tangent) {
        if (tangent === 'e' || tangent === 'E') {
            this.eNer = true;
        }
        if (this.spelare) {
            this.spelare.tangentNed(tangent);
        }
        // Hantera Fyrmille-interaktioner
        if (this.spelare) {
            this.fyrmille.kontrolleraNarhet(this.spelare.x, this.spelare.y);
        }
        this.fyrmille.tangentNed(tangent);
    }
    
    tangentUpp(tangent) {
        if (tangent === 'e' || tangent === 'E') {
            this.eNer = false;
        }
        if (this.spelare) {
            this.spelare.tangentUpp(tangent);
        }
        // Hantera Fyrmille-interaktioner
        this.fyrmille.tangentUpp(tangent);
    }
    
    uppdateraRorelse() {
        if (this.spelare) {
            this.spelare.uppdateraRorelse(this.barriarer);
            // Kontrollera närhet till interaktionspunkter
            this.fyrmille.kontrolleraNarhet(this.spelare.x, this.spelare.y);
            if (this.eNer) {
                this.fyrmille.tangentNed('e');
            }
        }
    }
    
    rita() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Rita Fyrmille-bakgrunden
        if (this.fyrmilleBild.complete && this.fyrmilleBild.naturalWidth > 0) {
            ctx.drawImage(this.fyrmilleBild, 0, 0, canvas.width, canvas.height);
        } else {
            // Placeholder medan bilden laddar
            ctx.fillStyle = '#2a4a3a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Fyrmille', canvas.width / 2, canvas.height / 2);
        }
        
        // Rita interaktionszoner (temporärt för positionering)
        // this.fyrmille.ritaZoner(ctx);
        
        // Rita spelaren
        if (this.spelare) {
            this.spelare.rita(ctx);
            // Rita interaktionsmeddelande
            this.fyrmille.ritaInteraktionsmeddelande(ctx, this.spelare.x, this.spelare.y);
        }
        
        // Rita UI
        this.ritaUI();
    }
    
    ritaUI() {
        const ctx = this.ctx;
        const spelare = this.spelare;
        
        if (!spelare) return;
    }
    
    uppdateraPosition() {
        // Kan användas för kollisionsdetektering senare
    }
}
