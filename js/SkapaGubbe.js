class SkapaGubbe {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.aktiv = false;
        
        // Tillgängliga klasser
        this.klasser = [
            {
                namn: 'Alv',
                beskrivning: 'Skicklig i jakt och snabb som vinden',
                bildStig: 'assets/klasser/klass-alv.png',
                stats: { konstruktion: 6, styrka: 5, special: 8 },
                startForemal: [
                    { id: 'pilbage', count: 1 },
                    { id: 'tra', count: 3 },
                    { id: 'sten', count: 2 },
                    { id: 'jarn', count: 1 },
                    { id: 'flaskaMedVatten', count: 3 }
                ]
            },
            {
                namn: 'Bonde',
                beskrivning: 'Hårt arbetande och praktisk',
                bildStig: 'assets/klasser/klass-bonde.png',
                stats: { konstruktion: 8, styrka: 7, special: 4 },
                startForemal: [
                    { id: 'Högaffel', count: 1 },
                    { id: 'tra', count: 3 },
                    { id: 'sten', count: 2 },
                    { id: 'jarn', count: 1 },
                    { id: 'flaskaMedVatten', count: 3 }
                ]
            },
            {
                namn: 'Viking',
                beskrivning: 'Modig krigare med oöverträffad styrka',
                bildStig: 'assets/klasser/klass-viking.png',
                stats: { konstruktion: 5, styrka: 9, special: 5 },
                startForemal: [
                    { id: 'yxa', count: 1 },
                    { id: 'tra', count: 3 },
                    { id: 'sten', count: 2 },
                    { id: 'jarn', count: 1 },
                    { id: 'flaskaMedVatten', count: 3 }
                ]
            },
            {
                namn: 'Völva',
                beskrivning: 'Visa siare med kraftfull sejdmagi',
                bildStig: 'assets/klasser/klass-volva.png',
                stats: { konstruktion: 4, styrka: 4, special: 9 },
                startForemal: [
                    { id: 'stav', count: 1 },
                    { id: 'tra', count: 3 },
                    { id: 'sten', count: 2 },
                    { id: 'jarn', count: 1 },
                    { id: 'flaskaMedVatten', count: 3 }
                ]
            }
        ];

        this.foremalNamn = {
            'yxa': 'Strids Yxa',
            'stav': 'Völva Stav',
            'Högaffel': 'Högaffel',
            'pilbage': 'Pilbåge',
            'tra': 'Trä',
            'sten': 'Sten',
            'jarn': 'Järn',
            'flaskaMedVatten': 'Flaska med Vatten'
        };
        
        this.valdKlass = 0;
        this.klassbilder = {};
        this.hoverMalyta = null;
        this.laddaBilder();
    }
    
    laddaBilder() {
        this.klasser.forEach((klass, index) => {
            const img = new Image();
            img.src = klass.bildStig;
            img.onerror = () => {
                console.log(`Kunde inte ladda bild för ${klass.namn}`);
            };
            this.klassbilder[index] = img;
        });
    }
    
    hanteraInput(tangent) {
        if (!this.aktiv) return null;
        
        switch(tangent) {
            case 'ArrowLeft':
                this.valdKlass = (this.valdKlass - 1 + this.klasser.length) % this.klasser.length;
                break;
            case 'ArrowRight':
                this.valdKlass = (this.valdKlass + 1) % this.klasser.length;
                break;
            case 'Enter':
                return {
                    action: 'valdKlass',
                    klass: this.klasser[this.valdKlass]
                };
            case 'Escape':
                return {
                    action: 'tillbaka'
                };
        }
        return null;
    }

    hamtaInteraktivaYtor() {
        const canvas = this.canvas;
        const bildX = canvas.width / 2 - 100;
        const bildY = 150;
        const bildBredd = 200;
        const bildHojd = 200;

        return {
            vansterPil: { x: 55, y: 220, w: 90, h: 80 },
            hogerPil: { x: canvas.width - 145, y: 220, w: 90, h: 80 },
            klassKort: { x: canvas.width / 2 - 260, y: 88, w: 520, h: 360 },
            tillbaka: { x: canvas.width / 2 - 170, y: canvas.height - 48, w: 340, h: 32 },
            prickar: this.klasser.map((_, index) => {
                const prickY = 372;
                const prickMellanrum = 20;
                const totalBredd = this.klasser.length * prickMellanrum;
                const startX = canvas.width / 2 - totalBredd / 2;
                return {
                    index,
                    x: startX + index * prickMellanrum - 10,
                    y: prickY - 10,
                    w: 20,
                    h: 20
                };
            })
        };
    }

    arPunktIYta(musX, musY, yta) {
        return yta && musX >= yta.x && musX <= yta.x + yta.w && musY >= yta.y && musY <= yta.y + yta.h;
    }

    hanteraMusMove(musX, musY) {
        if (!this.aktiv) return;

        const ytor = this.hamtaInteraktivaYtor();
        this.hoverMalyta = null;

        if (this.arPunktIYta(musX, musY, ytor.vansterPil)) {
            this.hoverMalyta = 'vansterPil';
            return;
        }
        if (this.arPunktIYta(musX, musY, ytor.hogerPil)) {
            this.hoverMalyta = 'hogerPil';
            return;
        }
        if (this.arPunktIYta(musX, musY, ytor.klassKort)) {
            this.hoverMalyta = 'klassKort';
            return;
        }
        if (this.arPunktIYta(musX, musY, ytor.tillbaka)) {
            this.hoverMalyta = 'tillbaka';
            return;
        }

        const prick = ytor.prickar.find((yta) => this.arPunktIYta(musX, musY, yta));
        if (prick) {
            this.hoverMalyta = `prick-${prick.index}`;
            this.valdKlass = prick.index;
        }
    }

    hanteraKlick(musX, musY) {
        if (!this.aktiv) return null;

        const ytor = this.hamtaInteraktivaYtor();

        if (this.arPunktIYta(musX, musY, ytor.vansterPil)) {
            this.valdKlass = (this.valdKlass - 1 + this.klasser.length) % this.klasser.length;
            return null;
        }

        if (this.arPunktIYta(musX, musY, ytor.hogerPil)) {
            this.valdKlass = (this.valdKlass + 1) % this.klasser.length;
            return null;
        }

        const prick = ytor.prickar.find((yta) => this.arPunktIYta(musX, musY, yta));
        if (prick) {
            this.valdKlass = prick.index;
            return null;
        }

        if (this.arPunktIYta(musX, musY, ytor.tillbaka)) {
            return { action: 'tillbaka' };
        }

        if (this.arPunktIYta(musX, musY, ytor.klassKort)) {
            return {
                action: 'valdKlass',
                klass: this.klasser[this.valdKlass]
            };
        }

        return null;
    }
    
    rita() {
        if (!this.aktiv) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        const aktuellKlass = this.klasser[this.valdKlass];
        
        // Rita bakgrund
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rita titel
        ctx.fillStyle = '#eee';
        ctx.font = 'bold 42px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText('VÄLJ DIN KLASS', canvas.width / 2, 60);
        
        // Rita klassnamn
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 36px Times New Roman';
        ctx.fillText(aktuellKlass.namn, canvas.width / 2, 120);
        
        // Rita klassbild (centrerad)
        const bildX = canvas.width / 2 - 100;
        const bildY = 150;
        const bildBredd = 200;
        const bildHojd = 200;
        const ytor = this.hamtaInteraktivaYtor();
        
        // Rita ram för bilden
        ctx.strokeStyle = this.hoverMalyta === 'klassKort' ? '#7dffbf' : '#00ff88';
        ctx.lineWidth = 3;
        ctx.strokeRect(bildX - 5, bildY - 5, bildBredd + 10, bildHojd + 10);

        if (this.hoverMalyta === 'klassKort') {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
            ctx.fillRect(ytor.klassKort.x, ytor.klassKort.y, ytor.klassKort.w, ytor.klassKort.h);
        }
        
        // Rita bild om den är laddad
        if (this.klassbilder[this.valdKlass] && this.klassbilder[this.valdKlass].complete) {
            ctx.drawImage(this.klassbilder[this.valdKlass], bildX, bildY, bildBredd, bildHojd);
        } else {
            // Placeholder om bilden inte laddats
            ctx.fillStyle = '#16213e';
            ctx.fillRect(bildX, bildY, bildBredd, bildHojd);
            ctx.fillStyle = '#666';
            ctx.font = '16px Times New Roman';
            ctx.fillText('Laddar...', canvas.width / 2, bildY + bildHojd / 2);
        }
        
        // Rita beskrivning
        ctx.fillStyle = '#ccc';
        ctx.font = '20px Times New Roman';
        ctx.fillText(aktuellKlass.beskrivning, canvas.width / 2, 406);


        
        // Rita navigeringspil vänster
        ctx.fillStyle = this.hoverMalyta === 'vansterPil' ? '#7dffbf' : '#00ff88';
        ctx.font = 'bold 48px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText('◄', 100, 260);
        
        // Rita navigeringspil höger
        ctx.fillStyle = this.hoverMalyta === 'hogerPil' ? '#7dffbf' : '#00ff88';
        ctx.fillText('►', canvas.width - 100, 260);
        
        // Rita klassindikatorer (prickar)
        const prickY = 372;
        const prickMellanrum = 20;
        const totalBredd = this.klasser.length * prickMellanrum;
        const startX = canvas.width / 2 - totalBredd / 2;
        
        this.klasser.forEach((_, index) => {
            ctx.beginPath();
            ctx.arc(startX + index * prickMellanrum, prickY, 5, 0, Math.PI * 2);
            ctx.fillStyle = index === this.valdKlass ? '#00ff88' : (this.hoverMalyta === `prick-${index}` ? '#7dffbf' : '#555');
            ctx.fill();
        });
        
        // Rita instruktioner
        ctx.fillStyle = this.hoverMalyta === 'tillbaka' ? '#aaa' : '#666';
        ctx.font = '16px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText('◄ ► eller mus: Bläddra | Klick eller Enter: Välj | Escape: Tillbaka', canvas.width / 2, canvas.height - 20);
    }
    
    visaSkapaGubbe() {
        this.aktiv = true;
        this.valdKlass = 0;
        this.hoverMalyta = null;
    }
    
    doljSkapaGubbe() {
        this.aktiv = false;
        this.hoverMalyta = null;
    }
    
    getValdKlass() {
        return this.klasser[this.valdKlass];
    }
}
