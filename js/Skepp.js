// Skepp.js
// Klass för att representera ett skepp i spelet

class Skepp {
    constructor({ id, namn, level = 1, egenskaper = {}, krav = [] } = {}) {
        this.id = id || null;
        this.namn = namn || 'Okänt skepp';
        this.level = level;
        this.egenskaper = egenskaper; // T.ex. { hastighet: 2, last: 1 }
        this.krav = Array.isArray(krav) ? krav : [];
    }

    uppgradera() {
        this.level += 1;
        // Här kan du lägga till logik för att förbättra egenskaper vid uppgradering
        // t.ex. this.egenskaper.hastighet += 1;
    }

    hamtaBeskrivning() {
        return `${this.namn} (Nivå ${this.level})`;
    }
}

// Exemplär lista med skeppstyper
const SKEPP_TYPER = [
    new Skepp({ id: 'tunna', namn: 'Tunna', egenskaper: { strid: { fysisk: 10, eld: 0, magi: 0 }, försvar: { fysisk: 60, eld: 0, magi: 0 },},
        krav: [{ id: 'sten', count: 5 }, { id: 'trä', count: 12 }, { id: 'järn', count: 2 }] }),
    new Skepp({ id: 'roddbåt', namn: 'Roddbåt', egenskaper: { strid: { fysisk: 50, eld: 0, magi: 0 }, försvar: { fysisk: 30, eld: 20, magi: 20 },},
        krav: [{ id: 'sten', count: 50 }, { id: 'trä', count: 30 }, { id: 'järn', count: 15 }] }),
    new Skepp({ id: 'drakskepp', namn: 'Drakskepp', egenskaper: { strid: { fysisk: 70, eld: 10, magi: 20 }, försvar: { fysisk: 80, eld: 30, magi: 40 },},
        krav: [{ id: 'sten', count: 120 }, { id: 'trä', count: 75 }, { id: 'järn', count: 30 }] })
];

// Exportera för Node och browser
if (typeof module !== 'undefined') {
    module.exports = Skepp;
    module.exports.SKEPP_TYPER = SKEPP_TYPER;
}
if (typeof window !== 'undefined') {
    window.Skepp = Skepp;
    window.SKEPP_TYPER = SKEPP_TYPER;
}
