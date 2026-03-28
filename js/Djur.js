class Djur {
    constructor() {
        // Definiera olika djurtyper med unika stats för strid
        // Djuren kan inte attackera tillbaka - de försöker bara rymma
        this.djurTyper = {
            'Björn': {
                namn: 'Björn',
                liv: 80,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 30,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 22,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 60,
                sprite: 'assets/gestalter/Björn.png',
                loot: ['5 köttbit', '9 köttbit', '5 köttbit och 6 silver', '9 köttbit', '4 köttbit', '5 köttbit och 2 silver']
            },
            'Hare': {
                namn: 'Hare',
                liv: 20,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 15,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 20,
                sprite: 'assets/gestalter/Hare.png',
                loot: ['2 köttbit och Pinne', '3 köttbit', '4 köttbit', '2 köttbit och Pinne', '2 köttbit', '3 köttbit']
            },
            'Lodjur': {
                namn: 'Lodjur',
                liv: 60,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 15,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 18,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 45,
                sprite: 'assets/gestalter/Lodjur.png',
                loot: ['6 köttbit', '8 köttbit', '4 köttbit', '10 köttbit', '3 köttbit', '11 köttbit']
            },
            'Ko': {
                namn: 'Ko',
                liv: 100,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 40,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 25,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 50,
                sprite: 'assets/gestalter/Ko.png',
                loot: ['5 köttbit och 5 trä', '7 köttbit', '8 köttbit', '5 köttbit och 9 sten', '9 köttbit', '6 köttbit och 2 trä']
            },
            'Vildsvin': {
                namn: 'Vildsvin',
                liv: 70,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 20,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 20,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 48,
                sprite: 'assets/gestalter/Vildsvin.png',
                loot: ['4 köttbit och slumpmässig utrustning', '9 köttbit', '5 köttbit och 1 flaskaMedVatten', '4 köttbit och slumpmässig utrustning', '6 köttbit och 2 tom flaska', '5 köttbit']
            },
            'Häst': {
                namn: 'Häst',
                liv: 90,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 25,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 24,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 52,
                sprite: 'assets/gestalter/Häst.png',
                loot: ['4 köttbit', '6 köttbit', '5 köttbit och 10 trä', '4 köttbit', '11 köttbit', '4 köttbit']
            },
            'Rådjur': {
                namn: 'Rådjur',
                liv: 50,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 10,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 16,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 38,
                sprite: 'assets/gestalter/Rådjur.png',
                loot: ['4 köttbit och 6 trä', '5 köttbit', '3 köttbit', '4 köttbit och Pinne', '9 köttbit', '5 köttbit']
            },
            'Gädda': {
                namn: 'Gädda',
                liv: 40,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 5,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 14,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 35,
                sprite: 'assets/gestalter/Gädda.png',
                loot: ['2 köttbit och 3 silver', '1 köttbit och 4 järn', '3 köttbit och 1 järn', '2 köttbit och 5 silver', '2 köttbit och 3 järn', '1 köttbit och 3 guld']
            },
            'Älg': {
                namn: 'Älg',
                liv: 110,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 50,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 28,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 65,
                sprite: 'assets/gestalter/Älg.png',
                loot: ['10 köttbit', '9 köttbit', '11 köttbit och 3 trä', '13 köttbit', '10 köttbit', '9 köttbit']
            },
            'Varg': {
                namn: 'Varg',
                liv: 75,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 25,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 19,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 55,
                sprite: 'assets/gestalter/Varg.png',
                loot: ['4 köttbit', '5 köttbit och 5 silver', '3 köttbit', '3 köttbit och 7 silver', '8 köttbit', '3 köttbit']
            },
            'Kråka': {
                namn: 'Kråka',
                liv: 15,
                skada: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                skadaElement: 'fysisk',
                motstånd: {
                    fysisk: 0,
                    eld: 0,
                    magi: 0
                },
                hastighet: 0,
                storlek: 12,
                attackRackvidd: 0,
                attackHastighet: 0,
                jakt: 15,
                sprite: 'assets/gestalter/Kråka.png',
                loot: ['1 köttbit och 4 silver', '2 köttbit och 5 silver', '1 köttbit och 1 guld', '1 köttbit och 15 silver', '2 köttbit och 1 guld', '1 köttbit och 1 guld']
            }
        };
    }

    hamtaDjurStats(djurTyp) {
        const stats = this.djurTyper[djurTyp];
        if (stats) {
            const copy = { ...stats };
            // Alla djur har 0 motstand
            copy.motstand = {
                fysisk: 0,
                eld: 0,
                magi: 0
            };
            return copy;
        }
        return null;
    }
}
