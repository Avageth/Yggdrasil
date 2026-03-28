class Karaktarssida {
	constructor(canvas, ctx) {
		this.canvas = canvas;
		this.ctx = ctx;
		this.visas = true;
		this.spelare = null;
		this.previewKrav = null;
		this.ikonCache = {};
		this.slotBounds = [];
		this.hoverInfo = null;
		this.elementIkoner = {
			fysisk: 'assets/Ikoner/Element Fysisk.png',
			eld: 'assets/Ikoner/Element Eld.png',
			magi: 'assets/Ikoner/Element Magi.png'
		};
		this.statusIkoner = {
			liv: {
				aktiv: 'assets/Ikoner/Liv_Aktiv.png',
				inaktiv: 'assets/Ikoner/Liv_Inaktiv.png'
			},
			energi: {
				aktiv: 'assets/Ikoner/Energi_Aktiv.png',
				inaktiv: 'assets/Ikoner/Energi_Inaktiv.png'
			},
			konstruktion: {
				aktiv: 'assets/Ikoner/Konstruktion_Aktiv.png',
				inaktiv: 'assets/Ikoner/Konstruktion_Inaktiv.png'
			},
			reflex: {
				aktiv: 'assets/Ikoner/Reflex_Aktiv.png',
				inaktiv: 'assets/Ikoner/Reflex_Inaktiv.png'
			},
			special: {
				aktiv: 'assets/Ikoner/Special_Aktiv.png',
				inaktiv: 'assets/Ikoner/Special_Inaktiv.png'
			}
		};
		this.kravIkoner = {
			konstruktion: 'assets/Ikoner/Konstruktion_Aktiv.png',
			reflex: 'assets/Ikoner/Reflex_Aktiv.png',
			special: 'assets/Ikoner/Special_Aktiv.png'
		};
		this.kravInfo = {
			konstruktion: { namn: 'Konstruktion', beskrivning: 'Anvands som utrustningskrav for robusta foremal och vissa passiver.' },
			reflex: { namn: 'Reflex', beskrivning: 'Anvands som utrustningskrav for smidiga foremal och vissa passiver.' },
			special: { namn: 'Special', beskrivning: 'Anvands som utrustningskrav for sarskilda foremal och vissa passiver.' }
		};
		this.statInfo = {
			konstruktion: { namn: 'Konstruktion', beskrivning: 'Din niva i Konstruktion. Anvands for utrustningskrav och vissa effekter.' },
			reflex: { namn: 'Reflex', beskrivning: 'Din niva i Reflex. Anvands for utrustningskrav och vissa effekter.' },
			special: { namn: 'Special', beskrivning: 'Din niva i Special. Anvands for utrustningskrav och vissa effekter.' },
			energi: { namn: 'Energi', beskrivning: 'Din nuvarande energi i forhallande till max energi.' },
			liv: { namn: 'Liv', beskrivning: 'Ditt nuvarande liv i forhallande till max liv.' }
		};
		this.elementInfo = {
			fysisk: { namn: 'Fysisk', beskrivning: 'Vanlig skada och motstånd från vapen, slag och rå styrka.' },
			eld: { namn: 'Eld', beskrivning: 'Brännande skada och skydd mot hetta, lågor och eldattacker.' },
			magi: { namn: 'Magi', beskrivning: 'Mystisk skada och motstånd mot besvärjelser och magiska krafter.' }
		};
		this.elementHoverInfo = null;
		this.elementHoverBounds = [];
		this.kravHoverInfo = null;
		this.kravHoverBounds = [];
		this.statHoverInfo = null;
		this.statHoverBounds = [];
		this.hoverBoxBounds = null;
		this.hoverLasAktiv = false;
		this.senasteMusX = null;
		this.senasteMusY = null;

		// Position och storlek för karaktärsrutan
		this.ruta = {
			x: 0,
			y: 0,
			bredd: canvas.width,
			hojd: canvas.height
		};

		// Justera dessa värden så de matchar den vita rutan i bakgrunden
		this.karaktarBildRuta = {
			x: 90,
			y: 120,
			bredd: 420,
			hojd: 420
		};
	}

	// Visa/dölj karaktärssidan
	toggle() {
		this.visas = !this.visas;
	}

	visa() {
		this.visas = true;
	}

	dolj() {
		this.visas = false;
	}

	// Rita karaktärsrutan
	rita() {
		if (!this.visas) return;

		const ctx = this.ctx;
		this.statHoverBounds = [];

		// Rensa canvas (bakgrundsbilden ligger i CSS)
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.ritaKaraktarBild();
		this.ritaUtrustning();
		this.ritaKrav();
		this.ritaLivOchEnergi();
		this.ritaHoverInfo();
		if (this.statHoverInfo) {
			this.ritaStatTooltip(this.statHoverInfo.stat, this.statHoverInfo.x, this.statHoverInfo.y);
		}
	}

	setPreviewKrav(krav) {
		this.previewKrav = krav || null;
	}

	arIForhandsvisningslage() {
		return !!this.previewKrav;
	}

	sattSpelare(spelare) {
		this.spelare = spelare;
	}

	// Rita vald karaktär i den vita rutan
	ritaKaraktarBild() {
		if (this.arIForhandsvisningslage()) return;
		if (!this.spelare || !this.spelare.sprite) return;

		const img = this.spelare.sprite;
		const ruta = this.karaktarBildRuta;

		if (!img.complete || img.naturalWidth === 0) return;

		// Behall proportioner och centrera i rutan
		const scale = Math.min(ruta.bredd / img.naturalWidth, ruta.hojd / img.naturalHeight) * 0.4;
		const drawW = img.naturalWidth * scale;
		const drawH = img.naturalHeight * scale;
		const offsetX = 120;
		const offsetY = -130;
		const drawX = ruta.x + (ruta.bredd - drawW) / 2 + offsetX;
		const drawY = ruta.y + (ruta.hojd - drawH) / 2 + offsetY;

		this.ctx.drawImage(img, drawX, drawY, drawW, drawH);

		if (this.spelare.namn) {
			const nameX = drawX + drawW / 2;
			const nameY = drawY - 25;
			this.ctx.font = 'bold 24px Arial';
			this.ctx.textAlign = 'center';
			this.ctx.textBaseline = 'bottom';
			this.ctx.strokeStyle = '#000';
			this.ctx.lineWidth = 3;
			this.ctx.strokeText(this.spelare.namn, nameX, nameY);
			this.ctx.fillStyle = '#f0d18f';
			this.ctx.fillText(this.spelare.namn, nameX, nameY);
		}
	}

	// Rita utrustning (vapen/rustning) som ikoner
	ritaUtrustning() {
		if (this.arIForhandsvisningslage()) return;
		if (!this.spelare || !this.spelare.utrustning) return;

		const ctx = this.ctx;
		const panelX = this.canvas.width - 560;
		const panelY = 22;
		const panelBredd = 260;
		const panelHojd = 260;
		const slotStorlek = 85;
		const kolumnGap = 10;
		const radGap = 0;

		ctx.save();

		const slots = [
			{ key: 'skold', label: 'Sköld', foremal: this.spelare.utrustning.skold, col: 0, row: 0 },
			{ key: 'vapen', label: 'Vapen', foremal: this.spelare.utrustning.vapen, col: 1, row: 0 },
			{ key: 'rustning', label: 'Rustning', foremal: this.spelare.utrustning.rustning, col: 0, row: 1 },
			{ key: 'hjalm', label: 'Hjälm', foremal: this.spelare.utrustning.hjalm, col: 1, row: 1 }
		];

		this.slotBounds = [];
		const startX = panelX + 20;
		const startY = panelY + 50;

		slots.forEach((slot) => {
			const slotX = startX + slot.col * (slotStorlek + kolumnGap);
			const slotY = startY + slot.row * (slotStorlek + radGap + 18);

			if (slot.foremal) {
				ctx.fillStyle = 'rgba(5, 5, 10, 0.65)';
				ctx.fillRect(slotX, slotY, slotStorlek, slotStorlek);
			}

			if (slot.foremal) {
				const ikonStig = slot.foremal.ikon || (slot.foremal.namn ? `assets/Utrustning/${slot.foremal.namn}.png` : null);
				const ikon = this.hamtaIkonBild(ikonStig);
				if (ikon && ikon.complete && ikon.naturalWidth > 0) {
					const padding = 6;
					const maxBredd = slotStorlek - padding * 2;
					const maxHojd = slotStorlek - padding * 2;
					const scale = Math.min(maxBredd / ikon.naturalWidth, maxHojd / ikon.naturalHeight);
					const drawW = ikon.naturalWidth * scale;
					const drawH = ikon.naturalHeight * scale;
					const drawX = slotX + (slotStorlek - drawW) / 2;
					const drawY = slotY + (slotStorlek - drawH) / 2;
					ctx.drawImage(ikon, drawX, drawY, drawW, drawH);
				} else {
					ctx.fillStyle = '#00ff88';
					ctx.font = 'bold 12px Arial';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					const kortnamn = slot.foremal.namn ? slot.foremal.namn.substring(0, 3).toUpperCase() : '?';
					ctx.fillText(kortnamn, slotX + slotStorlek / 2, slotY + slotStorlek / 2);
				}
			}

			this.slotBounds.push({
				key: slot.key,
				x: slotX,
				y: slotY,
				bredd: slotStorlek,
				hojd: slotStorlek
			});
		});

		ctx.restore();
	}

	// Rita hover-info for utrustning
	ritaHoverInfo() {
		this.elementHoverBounds = [];
		this.kravHoverBounds = [];
		this.hoverBoxBounds = null;
		if (!this.hoverInfo || !this.hoverInfo.foremal) return;

		const ctx = this.ctx;
		const foremal = this.hoverInfo.foremal;
		const rows = this.hamtaHoverRader(foremal);
		for (let i = 1; i < rows.length; i++) {
			if (rows[i - 1] && rows[i - 1].description && rows[i] && rows[i].type === 'elements') {
				rows.splice(i, 0, { type: 'spacer' });
				break;
			}
		}
		if (!rows.some((row) => row && row.type === 'text' && !row.text)) {
			for (let i = 1; i < rows.length; i++) {
				if (rows[i] && rows[i].type === 'krav' && rows[i - 1] && rows[i - 1].type !== 'spacer') {
					rows.splice(i, 0, { type: 'spacer' });
					break;
				}
			}
		}
		if (rows.length === 0) return;

		ctx.save();
		ctx.font = '14px Arial';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';

		const padding = 12;
		const lineHeight = 20;
		const iconSize = 14;
		const iconGap = 6;
		const pairGap = 10;
		let maxWidth = 0;
		rows.forEach((row) => {
			let width = 0;
			if (row.type === 'elements') {
				width += ctx.measureText(row.label).width + iconGap;
				const values = [row.values.fysisk || 0, row.values.eld || 0, row.values.magi || 0];
				values.forEach((value, index) => {
					width += iconSize + iconGap + ctx.measureText(String(value)).width;
					if (index < values.length - 1) width += pairGap;
				});
			} else if (row.type === 'krav') {
				width += ctx.measureText(row.label).width + iconGap;
				const values = [row.values.konstruktion || 0, row.values.reflex || 0, row.values.special || 0];
				values.forEach((value, index) => {
					width += iconSize + iconGap + ctx.measureText(String(value)).width;
					if (index < values.length - 1) width += pairGap;
				});
			} else if (row.type === 'spacer') {
				width = 0;
			} else {
				ctx.font = row.italic ? 'italic 14px Arial' : '14px Arial';
				width = ctx.measureText(row.text).width;
			}
			if (width > maxWidth) maxWidth = width;
		});
		ctx.font = '14px Arial';

		const boxW = maxWidth + padding * 2;
		const boxH = rows.length * lineHeight + padding * 2;
		let boxX = this.hoverInfo.x + 12;
		let boxY = this.hoverInfo.y + 12;

		if (boxX + boxW > this.canvas.width) {
			boxX = this.hoverInfo.x - boxW - 12;
		}
		if (boxY + boxH > this.canvas.height) {
			boxY = this.hoverInfo.y - boxH - 12;
		}
		boxX = Math.max(0, Math.min(boxX, this.canvas.width - boxW));
		boxY = Math.max(0, Math.min(boxY, this.canvas.height - boxH));
		this.hoverBoxBounds = { x: boxX, y: boxY, w: boxW, h: boxH, foremal };

		ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
		ctx.strokeStyle = '#00ff88';
		ctx.lineWidth = 2;
		ctx.fillRect(boxX, boxY, boxW, boxH);
		ctx.strokeRect(boxX, boxY, boxW, boxH);

		ctx.fillStyle = '#fff';
		rows.forEach((row, index) => {
			const textY = boxY + padding + index * lineHeight;
			if (row.type === 'elements') {
				let drawX = boxX + padding;
				ctx.fillText(row.label, drawX, textY);
				drawX += ctx.measureText(row.label).width + 6;

				const entries = [
					{ key: 'fysisk', value: row.values.fysisk || 0 },
					{ key: 'eld', value: row.values.eld || 0 },
					{ key: 'magi', value: row.values.magi || 0 }
				];

				entries.forEach((entry, entryIndex) => {
					const ikon = this.hamtaIkonBild(this.elementIkoner[entry.key]);
					if (ikon && ikon.complete && ikon.naturalWidth > 0) {
						ctx.drawImage(ikon, drawX, textY + 2, 14, 14);
					}
					this.elementHoverBounds.push({ x: drawX, y: textY + 2, w: 14, h: 14, element: entry.key });
					drawX += 14 + 6;
					ctx.fillText(String(entry.value), drawX, textY);
					drawX += ctx.measureText(String(entry.value)).width;
					if (entryIndex < entries.length - 1) drawX += 10;
				});
			} else if (row.type === 'krav') {
				let drawX = boxX + padding;
				ctx.fillText(row.label, drawX, textY);
				drawX += ctx.measureText(row.label).width + 6;

				const entries = [
					{ key: 'konstruktion', value: row.values.konstruktion || 0 },
					{ key: 'reflex', value: row.values.reflex || 0 },
					{ key: 'special', value: row.values.special || 0 }
				];

				entries.forEach((entry, entryIndex) => {
					const ikon = this.hamtaIkonBild(this.kravIkoner[entry.key]);
					if (ikon && ikon.complete && ikon.naturalWidth > 0) {
						ctx.drawImage(ikon, drawX, textY + 2, 14, 14);
					}
					this.kravHoverBounds.push({ x: drawX, y: textY + 2, w: 14, h: 14, krav: entry.key });
					drawX += 14 + 6;
					ctx.fillText(String(entry.value), drawX, textY);
					drawX += ctx.measureText(String(entry.value)).width;
					if (entryIndex < entries.length - 1) drawX += 10;
				});
			} else if (row.type === 'spacer') {
				return;
			} else {
				ctx.font = row.italic ? 'italic 14px Arial' : '14px Arial';
				ctx.fillText(row.text, boxX + padding, textY);
				ctx.font = '14px Arial';
			}
		});

		if (this.elementHoverInfo) {
			this.ritaElementTooltip(this.elementHoverInfo.element, this.elementHoverInfo.x, this.elementHoverInfo.y);
		} else if (this.kravHoverInfo) {
			this.ritaKravTooltip(this.kravHoverInfo.krav, this.kravHoverInfo.x, this.kravHoverInfo.y);
		}

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
		const iconSize = 104;
		const maxTextBredd = 204;

		ctx.save();
		ctx.font = '12px Arial';
		const rader = this.brytTextTillRader(info.beskrivning, maxTextBredd);
		const boxW = 268;
		const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
		let boxX = musX + 16;
		let boxY = musY - boxH / 2;

		if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
		if (boxY < 0) boxY = 0;
		if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

		ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
		ctx.strokeStyle = '#8bd3ff';
		ctx.lineWidth = 2;
		ctx.fillRect(boxX, boxY, boxW, boxH);
		ctx.strokeRect(boxX, boxY, boxW, boxH);

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

	ritaKravTooltip(krav, musX, musY) {
		const info = this.kravInfo[krav];
		if (!info) return;

		const ctx = this.ctx;
		const ikon = this.hamtaIkonBild(this.kravIkoner[krav]);
		const iconSize = 104;
		const maxTextBredd = 204;

		ctx.save();
		ctx.font = '12px Arial';
		const rader = this.brytTextTillRader(info.beskrivning, maxTextBredd);
		const boxW = 268;
		const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
		let boxX = musX + 16;
		let boxY = musY - boxH / 2;

		if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
		if (boxY < 0) boxY = 0;
		if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

		ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
		ctx.strokeStyle = '#8bd3ff';
		ctx.lineWidth = 2;
		ctx.fillRect(boxX, boxY, boxW, boxH);
		ctx.strokeRect(boxX, boxY, boxW, boxH);

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

	uppdateraElementHover(musX, musY) {
		this.elementHoverInfo = null;
		this.kravHoverInfo = null;
		for (const bound of this.elementHoverBounds) {
			if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
				this.elementHoverInfo = { element: bound.element, x: musX, y: musY };
				break;
			}
		}
		if (this.elementHoverInfo) return;
		for (const bound of this.kravHoverBounds) {
			if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
				this.kravHoverInfo = { krav: bound.krav, x: musX, y: musY };
				break;
			}
		}
	}

	uppdateraStatHover(musX, musY) {
		this.statHoverInfo = null;
		for (const bound of this.statHoverBounds) {
			if (musX >= bound.x && musX <= bound.x + bound.w && musY >= bound.y && musY <= bound.y + bound.h) {
				this.statHoverInfo = { stat: bound.stat, x: musX, y: musY };
				break;
			}
		}
	}

	hanteraTangent(tangent) {
		if (!this.visas || !this.spelare || !this.spelare.utrustning) return false;
		if (tangent !== 'e' && tangent !== 'E') return false;

		if (this.hoverLasAktiv) {
			this.hoverLasAktiv = false;
			if (this.senasteMusX !== null && this.senasteMusY !== null) {
				this.uppdateraHoverFranMus(this.senasteMusX, this.senasteMusY);
			} else {
				this.rensaHover();
			}
			return true;
		}

		if (!this.hoverInfo || !this.hoverInfo.foremal) return false;

		this.hoverLasAktiv = true;
		this.hoverInfo = {
			foremal: this.hoverInfo.foremal,
			x: this.hoverInfo.x,
			y: this.hoverInfo.y
		};

		if (this.senasteMusX !== null && this.senasteMusY !== null) {
			this.uppdateraElementHover(this.senasteMusX, this.senasteMusY);
		}

		return true;
	}

	uppdateraHoverFranMus(musX, musY) {
		this.uppdateraStatHover(musX, musY);
		const slot = this.hittaSlot(musX, musY, 6);

		if (slot) {
			const foremal = this.spelare.utrustning[slot.key] || null;
			if (foremal) {
				this.hoverInfo = {
					foremal,
					x: musX,
					y: musY
				};
				this.uppdateraElementHover(musX, musY);
				return;
			}
		}

		if (this.hoverBoxBounds && musX >= this.hoverBoxBounds.x && musX <= this.hoverBoxBounds.x + this.hoverBoxBounds.w && musY >= this.hoverBoxBounds.y && musY <= this.hoverBoxBounds.y + this.hoverBoxBounds.h) {
			this.hoverInfo = {
				foremal: this.hoverBoxBounds.foremal,
				x: musX,
				y: musY
			};
			this.uppdateraElementHover(musX, musY);
			return;
		}

		this.hoverInfo = null;
		this.elementHoverInfo = null;
		this.kravHoverInfo = null;
	}

	hamtaHoverRader(foremal) {
		const rows = [];
		if (!foremal) return rows;

		if (foremal.namn) rows.push({ type: 'text', text: foremal.namn });
		if (foremal.beskrivning) rows.push({ type: 'text', text: foremal.beskrivning, italic: true, description: true });

		if (foremal.strid && typeof foremal.strid === 'object') {
			rows.push({
				type: 'elements',
				label: 'Strid:',
				values: {
					fysisk: foremal.strid.fysisk || 0,
					eld: foremal.strid.eld || 0,
					magi: foremal.strid.magi || 0
				}
			});
		}
		if (foremal.jakt && typeof foremal.jakt === 'object') {
			rows.push({
				type: 'elements',
				label: 'Jakt:',
				values: {
					fysisk: foremal.jakt.fysisk || 0,
					eld: foremal.jakt.eld || 0,
					magi: foremal.jakt.magi || 0
				}
			});
		}
		const forsvar = foremal.forsvar || foremal['försvar'];
		if (forsvar && typeof forsvar === 'object') {
			rows.push({
				type: 'elements',
				label: 'Försvar:',
				values: {
					fysisk: forsvar.fysisk || 0,
					eld: forsvar.eld || 0,
					magi: forsvar.magi || 0
				}
			});
		}

		if (foremal.passiv && typeof foremal.passiv === 'object') {
			const passivRader = this.spelare && this.spelare.utrustning && typeof this.spelare.utrustning.hamtaPassivTooltipRader === 'function'
				? this.spelare.utrustning.hamtaPassivTooltipRader(foremal)
				: [];
			if (passivRader.length > 0) {
				passivRader.forEach((rad) => {
					if (rad && typeof rad === 'object' && rad.type) {
						rows.push(rad);
					} else {
						rows.push({ type: 'text', text: rad });
					}
				});
			} else {
				rows.push({ type: 'text', text: `Passiv: ${foremal.passiv.namn || 'Passiv'}` });
				if (foremal.passiv.beskrivning) {
					rows.push({ type: 'text', text: foremal.passiv.beskrivning });
				}
			}
		}

		if (typeof Krav === 'function') {
			const krav = Krav.hamtaKravForForemal(foremal);
			rows.push({
				type: 'krav',
				label: 'Krav:',
				values: {
					konstruktion: krav.konstruktion || 0,
					reflex: krav.reflex || 0,
					special: krav.special || 0
				}
			});
		}

		return rows;
	}

	// Rita liv och energi som lysande prickar
	ritaLivOchEnergi() {
		if (this.arIForhandsvisningslage()) return;
		if (!this.spelare) return;

		const startX = 157;
		const startY = 465;
		const prickStorlek = 30;
		const gap = 11;
		const radGap = 39;

		const maxEnergi = Math.max(0, this.spelare.maxEnergi || 0);
		const maxLiv = Math.max(this.spelare.maxLiv || 0, this.spelare.liv || 0);

		this.ritaIkonRad(startX + 60, startY, prickStorlek, gap, maxEnergi, this.spelare.energi || 0, this.statusIkoner.energi);
		this.ritaIkonRad(startX + 60, startY + radGap, prickStorlek, gap, maxLiv, this.spelare.liv || 0, this.statusIkoner.liv);
	}

	// Rita krav som lysande prickar ovanfor liv och energi
	ritaKrav() {
		const kravKalla = this.spelare ? this.spelare.krav : this.previewKrav;
		if (!kravKalla) return;

		const krav = kravKalla || { konstruktion: 1, reflex: 1, special: 1, max: 8 };
		const max = krav.max || 8;
		const startX = 157;
		const startY = 350;
		const prickStorlek = 30;
		const gap = 11;
		const radGap = 39;

		const rader = [
			{ value: krav.konstruktion || 0, ikoner: this.statusIkoner.konstruktion },
			{ value: krav.reflex || 0, ikoner: this.statusIkoner.reflex },
			{ value: krav.special || 0, ikoner: this.statusIkoner.special }
		];

		rader.forEach((rad, radIndex) => {
			this.ritaIkonRad(startX + 60, startY + radIndex * radGap, prickStorlek, gap, max, rad.value, rad.ikoner);
		});
	}

	beraknaIkonX(startX, index, storlek, gap) {
		let extraGap = 0;
		if (index === 4) extraGap = 2;
		else if (index === 5) extraGap = 6;
		else if (index === 6) extraGap = 10;
		else if (index >= 6) extraGap = 15;
		return startX + index * (storlek + gap) + extraGap;
	}

	ritaIkonRad(startX, centerY, storlek, gap, maxAntal, aktivtAntal, ikonPar) {
		const totalt = Math.max(0, maxAntal || 0);
		const aktivt = Math.max(0, Math.min(totalt, aktivtAntal || 0));
		const halvStorlek = storlek / 2;
		const statNyckel = this.hamtaStatNyckelFranIkonPar(ikonPar);

		for (let i = 0; i < totalt; i++) {
			const ikonStig = i < aktivt ? ikonPar.aktiv : ikonPar.inaktiv;
			const ikon = this.hamtaIkonBild(ikonStig);
			const x = this.beraknaIkonX(startX, i, storlek, gap) - halvStorlek;
			const y = centerY - halvStorlek;

			if (statNyckel) {
				this.statHoverBounds.push({ x, y, w: storlek, h: storlek, stat: statNyckel });
			}

			if (ikon && ikon.complete && ikon.naturalWidth > 0) {
				this.ctx.drawImage(ikon, x, y, storlek, storlek);
			}
		}
	}

	hamtaStatNyckelFranIkonPar(ikonPar) {
		if (ikonPar === this.statusIkoner.konstruktion) return 'konstruktion';
		if (ikonPar === this.statusIkoner.reflex) return 'reflex';
		if (ikonPar === this.statusIkoner.special) return 'special';
		if (ikonPar === this.statusIkoner.energi) return 'energi';
		if (ikonPar === this.statusIkoner.liv) return 'liv';
		return null;
	}

	ritaStatTooltip(stat, musX, musY) {
		const info = this.statInfo[stat];
		if (!info) return;

		const ikonPar = this.statusIkoner[stat];
		const ikon = ikonPar ? this.hamtaIkonBild(ikonPar.aktiv) : null;
		const ctx = this.ctx;
		const iconSize = 104;
		const maxTextBredd = 204;

		ctx.save();
		ctx.font = '12px Arial';
		const rader = this.brytTextTillRader(info.beskrivning, maxTextBredd);
		const boxW = 268;
		const boxH = 24 + iconSize + 14 + rader.length * 15 + 18;
		let boxX = musX + 16;
		let boxY = musY - boxH / 2;

		if (boxX + boxW > this.canvas.width) boxX = musX - boxW - 16;
		if (boxY < 0) boxY = 0;
		if (boxY + boxH > this.canvas.height) boxY = this.canvas.height - boxH;

		ctx.fillStyle = 'rgba(8, 14, 24, 0.96)';
		ctx.strokeStyle = '#8bd3ff';
		ctx.lineWidth = 2;
		ctx.fillRect(boxX, boxY, boxW, boxH);
		ctx.strokeRect(boxX, boxY, boxW, boxH);

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

	hanteraKlick(musX, musY) {
		if (!this.visas || !this.spelare || !this.spelare.utrustning) return false;

		const slot = this.hittaSlot(musX, musY, 6);

		if (!slot) return false;

		return this.spelare.utrustning.avUtrustaPlats(slot.key);
	}

	hanteraMusMove(musX, musY) {
		if (!this.visas || !this.spelare || !this.spelare.utrustning) {
			this.hoverInfo = null;
			this.elementHoverInfo = null;
			this.kravHoverInfo = null;
			this.statHoverInfo = null;
			return;
		}

		this.senasteMusX = musX;
		this.senasteMusY = musY;

		if (this.hoverLasAktiv) {
			if (!this.hoverInfo || !this.hoverInfo.foremal) {
				this.hoverLasAktiv = false;
				this.uppdateraHoverFranMus(musX, musY);
				return;
			}

			if (this.hoverBoxBounds && musX >= this.hoverBoxBounds.x && musX <= this.hoverBoxBounds.x + this.hoverBoxBounds.w && musY >= this.hoverBoxBounds.y && musY <= this.hoverBoxBounds.y + this.hoverBoxBounds.h) {
				this.uppdateraElementHover(musX, musY);
			} else {
				this.elementHoverInfo = null;
				this.kravHoverInfo = null;
			}
			this.uppdateraStatHover(musX, musY);
			return;
		}

		this.uppdateraHoverFranMus(musX, musY);
	}

	rensaHover() {
		this.hoverInfo = null;
		this.elementHoverInfo = null;
		this.kravHoverInfo = null;
		this.statHoverInfo = null;
		this.elementHoverBounds = [];
		this.kravHoverBounds = [];
		this.statHoverBounds = [];
		this.hoverBoxBounds = null;
		this.hoverLasAktiv = false;
	}

	hittaSlot(musX, musY, padding) {
		const pad = typeof padding === 'number' ? padding : 0;
		return this.slotBounds.find((bound) =>
			musX >= bound.x - pad && musX <= bound.x + bound.bredd + pad &&
			musY >= bound.y - pad && musY <= bound.y + bound.hojd + pad
		);
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
}

