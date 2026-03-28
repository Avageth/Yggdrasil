class Krav {
    constructor({ konstruktion = 1, reflex = 1, special = 1, max = 8 } = {}) {
        this.max = typeof max === 'number' ? max : 8;
        this.konstruktion = this.clamp(konstruktion);
        this.reflex = this.clamp(reflex);
        this.special = this.clamp(special);
    }

    clamp(value) {
        const num = Number(value);
        if (Number.isNaN(num)) return 1;
        return Math.min(this.max, Math.max(1, Math.floor(num)));
    }

    static hamtaKravForItem(itemId) {
        if (!itemId) return { konstruktion: 1, reflex: 1, special: 1 };
        const krav = Krav.hamtaKravFranTabell(itemId);
        if (!krav) return { konstruktion: 1, reflex: 1, special: 1 };
        return {
            konstruktion: typeof krav.konstruktion === 'number' ? krav.konstruktion : 1,
            reflex: typeof krav.reflex === 'number' ? krav.reflex : 1,
            special: typeof krav.special === 'number' ? krav.special : 1
        };
    }

    static hamtaKravForForemal(foremal) {
        if (!foremal) return { konstruktion: 1, reflex: 1, special: 1 };
        const namn = foremal.namn || '';
        if (namn) {
            const normaliserad = Krav.normaliseraNyckel(namn);
            const krav = Krav.hamtaKravFranTabell(normaliserad);
            if (krav) return Krav.hamtaKravForItem(normaliserad);
        }
        const id = foremal.id || '';
        if (id) {
            const krav = Krav.hamtaKravFranTabell(id);
            if (krav) return Krav.hamtaKravForItem(id);
        }
        return { konstruktion: 1, reflex: 1, special: 1 };
    }

    static hamtaKravFranTabell(key) {
        if (!key) return null;
        if (Krav.kravTabell[key]) return Krav.kravTabell[key];
        const lowerKey = String(key).toLowerCase();
        if (Krav.kravTabell[lowerKey]) return Krav.kravTabell[lowerKey];
        const matchKey = Object.keys(Krav.kravTabell).find((tabKey) => tabKey.toLowerCase() === lowerKey);
        return matchKey ? Krav.kravTabell[matchKey] : null;
    }

    static normaliseraNyckel(text) {
        return String(text)
            .toLowerCase()
            .replace(/\s+/g, '');
    }
}

Krav.kravTabell = {
    'dolk': { konstruktion: 1, reflex: 4, special: 4 },
    'träsvärd': { konstruktion: 1, reflex: 1, special: 1 },
    'järnsvärd': { konstruktion: 1, reflex: 1, special: 4 },
    'stridsyxa': { konstruktion: 1, reflex: 3, special: 8 },
    'Järnklubba': { konstruktion: 1, reflex: 1, special: 4 },
    'träklubba': { konstruktion: 1, reflex: 1, special: 2 },
    'druidstav': { konstruktion: 1, reflex: 1, special: 1 },
    'pilbåge': { konstruktion: 1, reflex: 1, special: 1 },
    'högaffel': { konstruktion: 1, reflex: 1, special: 1 },
    'stridshammare': { konstruktion: 1, reflex: 1, special: 6 },
    'träspjut': { konstruktion: 1, reflex: 4, special: 1 },
    'järnspjut': { konstruktion: 1, reflex: 6, special: 4 },
    'sko': { konstruktion: 1, reflex: 1, special: 1 },
    'ringbrynja': { konstruktion: 3, reflex: 1, special: 1 },
    'träsköld': { konstruktion: 1, reflex: 1, special: 1 },
    'järnsköld': { konstruktion: 2, reflex: 1, special: 1 },
    'vikingHjälm': { konstruktion: 3, reflex: 1, special: 1 }
};
