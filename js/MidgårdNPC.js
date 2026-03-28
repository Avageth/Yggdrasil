class MidgardNPC {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.npcs = [
            {
                id: 'modgunn',
                namn: 'Modgunn',
                x: 300,
                y: 400,
                radie: 78,
                sprite: this.skapaBild('assets/NPC/Modgun.png'),
                portrattBild: this.skapaBild('assets/NPC/ModgunDialog.png'),
                repliker: [
                    'Jag är Modgunn, broväktare över Gjallarbron.',
                    'De levande passerar inte bron ovarsamt. Håll dina steg stadiga.',
                    'Förleden dag hade fem flockar döda människor ridit över Gjallarbron, men icke dånar bron mindre under dig allena; ej heller haver du dödsfärg; hur rider du då här på de dödas väg?'
                ]
            }
        ];
        this.narmasteNPC = null;
        this.dialogAktiv = false;
        this.aktivNPC = null;
        this.dialogIndex = 0;
        this.dialogFas = 'intro';
        this.svarRepliker = [];
        this.svarIndex = 0;
    }

    skapaBild(src) {
        const bild = new Image();
        bild._laddad = false;
        bild.onload = () => { bild._laddad = true; };
        bild.onerror = () => { bild._laddad = false; };
        bild.src = src;
        return bild;
    }

    arDialogAktiv() {
        return !!this.dialogAktiv;
    }

    beraknaAvstand(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    uppdateraNarhet(spelare) {
        if (!spelare) {
            this.narmasteNPC = null;
            return;
        }

        let narmast = null;
        let minstaAvstand = Infinity;
        for (const npc of this.npcs) {
            const avstand = this.beraknaAvstand(spelare.x || 0, spelare.y || 0, npc.x, npc.y);
            if (avstand <= npc.radie && avstand < minstaAvstand) {
                minstaAvstand = avstand;
                narmast = npc;
            }
        }
        this.narmasteNPC = narmast;
    }

    oppnaDialog(npc) {
        if (!npc) return false;
        this.dialogAktiv = true;
        this.aktivNPC = npc;
        this.dialogIndex = 0;
        this.dialogFas = 'intro';
        this.svarRepliker = [];
        this.svarIndex = 0;
        return true;
    }

    stangDialog() {
        this.dialogAktiv = false;
        this.aktivNPC = null;
        this.dialogIndex = 0;
        this.dialogFas = 'intro';
        this.svarRepliker = [];
        this.svarIndex = 0;
    }

    harRunaO() {
        try {
            return typeof window !== 'undefined' && !!window._runaOActivated;
        } catch (e) {
            return false;
        }
    }

    startaIdentifiering() {
        if (this.harRunaO()) {
            this.svarRepliker = [
                'Jag ser tecknet på dig. Ditt ursprung är styrkt.',
                'Du får passera vidare, men minns att Gjallarbron aldrig glömmer ett namn.'
            ];
        } else {
            this.svarRepliker = [
                'Vänd tillbaka.',
                'Jag kan inte släppa in någon som inte kan identifiera sig och sitt ursprung.'
            ];
        }
        this.dialogFas = 'svar';
        this.svarIndex = 0;
    }

    hanteraTangent(tangent) {
        const arInteraktion = tangent === 'e' || tangent === 'E' || tangent === 'Enter';
        if (this.dialogAktiv) {
            if (tangent === 'Escape') {
                this.stangDialog();
                return true;
            }
            if (arInteraktion) {
                if (this.dialogFas === 'intro') {
                    const repliker = (this.aktivNPC && this.aktivNPC.repliker) || [];
                    if (this.dialogIndex < repliker.length - 1) {
                        this.dialogIndex += 1;
                    } else {
                        this.dialogFas = 'identifiera';
                    }
                    return true;
                }

                if (this.dialogFas === 'identifiera') {
                    this.startaIdentifiering();
                    return true;
                }

                if (this.dialogFas === 'svar') {
                    if (this.svarIndex < this.svarRepliker.length - 1) {
                        this.svarIndex += 1;
                    } else {
                        this.stangDialog();
                    }
                } else {
                    this.stangDialog();
                }
                return true;
            }
            return true;
        }

        if (arInteraktion && this.narmasteNPC) {
            this.oppnaDialog(this.narmasteNPC);
            return true;
        }

        return false;
    }

    ritaNPC(spelare) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const spelareY = spelare ? (spelare.y || canvas.height) : canvas.height;

        const ritaLista = (fore) => {
            for (const npc of this.npcs) {
                const skaRitasNu = fore ? npc.y <= spelareY : npc.y > spelareY;
                if (!skaRitasNu) continue;

                const skala = 0.5;
                const bredd = (npc.sprite && npc.sprite.complete && npc.sprite.naturalWidth > 0)
                    ? Math.round(npc.sprite.naturalWidth * skala)
                    : 48;
                const hojd = (npc.sprite && npc.sprite.complete && npc.sprite.naturalHeight > 0)
                    ? Math.round(npc.sprite.naturalHeight * skala)
                    : 48;
                const x = Math.round(npc.x - bredd / 2);
                const y = Math.round(npc.y - hojd * 0.88);

                ctx.save();
                if (npc === this.narmasteNPC && !this.dialogAktiv) {
                    ctx.fillStyle = 'rgba(0, 255, 136, 0.14)';
                    ctx.beginPath();
                    ctx.ellipse(npc.x, npc.y + 4, 28, 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (npc.sprite && npc.sprite.complete && npc.sprite.naturalWidth > 0) {
                    ctx.drawImage(npc.sprite, x, y, bredd, hojd);
                } else {
                    ctx.fillStyle = '#8892a0';
                    ctx.fillRect(x, y, bredd, hojd);
                }

                ctx.fillStyle = '#f6e7c1';
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.lineWidth = 3;
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                const namnY = y - 8;
                ctx.strokeText(npc.namn, npc.x, namnY);
                ctx.fillText(npc.namn, npc.x, namnY);
                ctx.restore();
            }
        };

        return {
            ritaBakomSpelare: () => ritaLista(true),
            ritaFramforSpelare: () => ritaLista(false)
        };
    }

    ritaInteraktionsmeddelande(spelare) {
        if (!this.narmasteNPC || this.dialogAktiv || !spelare) return;

        const ctx = this.ctx;
        const text = `Tryck [E] for att prata med ${this.narmasteNPC.namn}`;

        ctx.save();
        ctx.font = 'bold 14px Arial';
        const textBredd = ctx.measureText(text).width + 24;
        const x = Math.round((spelare.x || this.narmasteNPC.x) - textBredd / 2);
        const y = Math.round((spelare.y || this.narmasteNPC.y) - 62);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, textBredd, 30, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + textBredd / 2, y + 15);
        ctx.restore();
    }

    wrapText(ctx, text, maxWidth) {
        const ord = String(text || '').split(' ');
        const rader = [];
        let rad = '';
        for (const ordet of ord) {
            const test = rad ? `${rad} ${ordet}` : ordet;
            if (ctx.measureText(test).width > maxWidth && rad) {
                rader.push(rad);
                rad = ordet;
            } else {
                rad = test;
            }
        }
        if (rad) rader.push(rad);
        return rader;
    }

    trimLinesToHeight(ctx, text, maxWidth, maxLines) {
        const rader = this.wrapText(ctx, text, maxWidth);
        if (rader.length <= maxLines) return rader;

        const klippta = rader.slice(0, maxLines);
        let sistaRad = klippta[maxLines - 1] || '';
        while (sistaRad.length > 0 && ctx.measureText(`${sistaRad}...`).width > maxWidth) {
            sistaRad = sistaRad.slice(0, -1);
        }
        klippta[maxLines - 1] = `${sistaRad}...`;
        return klippta;
    }

    ritaDialog() {
        if (!this.dialogAktiv || !this.aktivNPC) return;

        const ctx = this.ctx;
        const canvas = this.canvas;
        const npc = this.aktivNPC;
        const boxW = Math.min(660, canvas.width - 70);
        const boxH = 188;
        const boxX = Math.round((canvas.width - boxW) / 2);
        const boxY = canvas.height - boxH - 28;
        const textStartX = boxX + 240;
        const textStartY = boxY + 78;
        const textMaxW = Math.max(120, boxW - 270);
        const textMaxH = 74;
        const lineH = 18;
        const maxLines = Math.max(1, Math.floor(textMaxH / lineH));

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (npc.portrattBild && npc.portrattBild.complete && npc.portrattBild.naturalWidth > 0) {
            ctx.drawImage(npc.portrattBild, boxX, boxY, boxW, boxH);
        } else {
            ctx.fillStyle = 'rgba(12, 16, 24, 0.95)';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = '#332e23';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);
        }

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#e022c7';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.strokeText(npc.namn, textStartX, boxY + 52);
        ctx.fillText(npc.namn, textStartX, boxY + 52);

        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        const repliker = npc.repliker || [];
        let text = repliker[this.dialogIndex] || '';
        if (this.dialogFas === 'identifiera') {
            text = 'Identifiera dig och uppge ditt ursprung.';
        } else if (this.dialogFas === 'svar') {
            text = this.svarRepliker[this.svarIndex] || '';
        }
        const rader = this.trimLinesToHeight(ctx, text, textMaxW, maxLines);
        for (let i = 0; i < rader.length; i++) {
            ctx.fillText(rader[i], textStartX, textStartY + i * lineH);
        }

        const sistaReplik = this.dialogFas === 'svar' && this.svarIndex >= this.svarRepliker.length - 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.font = '11px Arial';
        let hintText = 'Tryck [E] eller [Enter] for att fortsatta';
        if (this.dialogFas === 'identifiera') {
            hintText = 'Tryck [E] eller [Enter] for att identifiera dig';
        } else if (sistaReplik) {
            hintText = 'Tryck [E], [Enter] eller [Esc] for att avsluta';
        }
        ctx.fillText(hintText, textStartX, boxY + boxH - 34);
        ctx.restore();
    }
}

if (typeof module !== 'undefined') module.exports = MidgardNPC;
if (typeof window !== 'undefined') window.MidgardNPC = MidgardNPC;