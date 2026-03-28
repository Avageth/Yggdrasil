// Hus.js
// Klass för att representera ett hus i spelet


class Hus {
    constructor({ id, namn, level = 1, egenskaper = {}, krav = [] } = {}) {
        this.id = id || null;
        this.namn = namn || 'Okänt hus';
        this.level = level;
        this.egenskaper = egenskaper; // T.ex. { skydd: 2, komfort: 1 }
        this.krav = Array.isArray(krav) ? krav : [];
    }

    uppgradera() {
        this.level += 1;
        // Här kan du lägga till logik för att förbättra egenskaper vid uppgradering
        // t.ex. this.egenskaper.skydd += 1;
    }

    hamtaBeskrivning() {
        return `${this.namn} (Nivå ${this.level})`;
    }
}

// Lista med tillgängliga hus
const HUS_TYPER = [
    new Hus({
        id: 'jordkällare',
        namn: 'Jordkällare',
        egenskaper: { strid: { fysisk: 10, eld: 0, magi: 0 }, jakt: { fysisk: 0, eld: 0, magi: 0 }, försvar: { fysisk: 10, eld: 0, magi: 10 },},
        krav: [{ id: 'sten', count: 3 }, { id: 'trä', count: 2 }]
    }),
    new Hus({
        id: 'förråd',
        namn: 'Förråd',
        egenskaper: { strid: { fysisk: 10, eld: 0, magi: 0 }, jakt: { fysisk: 0, eld: 0, magi: 0 }, försvar: { fysisk: 20, eld: 20, magi: 20 },},
        krav: [{ id: 'sten', count: 52 }, { id: 'trä', count: 18 }, { id: 'järn', count: 6 }]
    }),
    new Hus({
        id: 'lada',
        namn: 'Lada',
        egenskaper: { strid: { fysisk: 30, eld: 0, magi: 0 }, jakt: { fysisk: 10, eld: 0, magi: 0 }, försvar: { fysisk: 30, eld: 20, magi: 50 },},
        krav: [{ id: 'trä', count: 84 }, { id: 'järn', count: 15 }]
    }),
    new Hus({
        id: 'stuga',
        namn: 'Stuga',
        egenskaper: { strid: { fysisk: 50, eld: 0, magi: 0 }, jakt: { fysisk: 20, eld: 0, magi: 0 }, försvar: { fysisk: 50, eld: 30, magi: 70 },},
        krav: [{ id: 'sten', count: 36 }, { id: 'trä', count: 118 }, { id: 'järn', count: 43 }]
    })
];

// Exportera för Node och browser
if (typeof module !== 'undefined') {
    module.exports = Hus;
    module.exports.HUS_TYPER = HUS_TYPER;
}
if (typeof window !== 'undefined') {
    window.Hus = Hus;
    window.HUS_TYPER = HUS_TYPER;
}
