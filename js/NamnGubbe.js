class NamnGubbe {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.aktiv = false;
        this.namn = '';
        this.maxLangd = 20;
        this.klass = null;
        this.blinkTid = 0;
        this.blinkSynlig = true;
    }
    
    hanteraInput(e) {
        if (!this.aktiv) return null;
        
        const tangent = e.key;
        
        if (tangent === 'Enter') {
            if (this.namn.trim().length > 0) {
                return {
                    action: 'namnValt',
                    namn: this.namn.trim()
                };
            }
        } else if (tangent === 'Backspace') {
            this.namn = this.namn.slice(0, -1);
        } else if (tangent === 'Escape') {
            return {
                action: 'tillbaka'
            };
        } else if (tangent.length === 1 && this.namn.length < this.maxLangd) {
            // Lägg till tecken om det är ett skrivtecken
            this.namn += tangent;
        }
        
        return null;
    }
    
    rita() {
        if (!this.aktiv) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Rita bakgrund
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rita titel
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 48px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText('NAMNGE DIN HJÄLTE', canvas.width / 2, 80);
        
        // Rita klassinformation
        if (this.klass) {
            ctx.fillStyle = '#aaa';
            ctx.font = '28px Times New Roman';
            ctx.fillText('Du valde klassen: ' + this.klass.namn, canvas.width / 2, 140);
        }
        
        // Rita instruktion
        ctx.fillStyle = '#ccc';
        ctx.font = '20px Times New Roman';
        ctx.fillText('Vad vill du kalla din hjälte?', canvas.width / 2, 220);
        
        // Rita textinmatningsfält
        const inputY = 300;
        const inputBredd = 400;
        const inputHojd = 50;
        const inputX = canvas.width / 2 - inputBredd / 2;
        
        // Rita ram
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.strokeRect(inputX, inputY, inputBredd, inputHojd);
        
        // Rita bakgrund för input
        ctx.fillStyle = '#16213e';
        ctx.fillRect(inputX, inputY, inputBredd, inputHojd);
        
        // Rita namn
        ctx.fillStyle = '#eee';
        ctx.font = '32px Times New Roman';
        ctx.textAlign = 'left';
        ctx.fillText(this.namn, inputX + 20, inputY + 35);
        
        // Rita blinkande cursor
        this.blinkTid += 1;
        if (Math.floor(this.blinkTid / 15) % 2 === 0) {
            const textBredd = ctx.measureText(this.namn).width;
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(inputX + 20 + textBredd, inputY + 10, 2, 30);
        }
        
        // Rita exempel på namn längd
        ctx.fillStyle = '#666';
        ctx.font = '14px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText(`(${this.namn.length}/${this.maxLangd} tecken)`, canvas.width / 2, inputY + inputHojd + 30);
        
        // Rita instruktioner
        ctx.fillStyle = '#666';
        ctx.font = '16px Times New Roman';
        ctx.fillText('Enter: Bekräfta namn | Escape: Gå tillbaka', canvas.width / 2, canvas.height - 30);
    }
    
    visaNamnSkarm(klass) {
        this.aktiv = true;
        this.namn = '';
        this.klass = klass;
        this.blinkTid = 0;
    }
    
    doljNamnSkarm() {
        this.aktiv = false;
        this.namn = '';
        this.klass = null;
    }
}
