class Animationer {
    constructor() {
        this.animationer = {};
        this.spelarAnimationer = {};
    }

    normaliseraFilnamn(namn) {
        return String(namn || '')
            .replace(/å/gi, 'a')
            .replace(/ä/gi, 'a')
            .replace(/ö/gi, 'o')
            .replace(/é/gi, 'e');
    }

    skapaBildMedFallback(kandidater) {
        const img = new Image();
        const giltigaKandidater = (kandidater || []).filter((stig, index, arr) => stig && arr.indexOf(stig) === index);
        let kandidatIndex = 0;
        const laddaNasta = () => {
            if (kandidatIndex >= giltigaKandidater.length) return;
            img.src = encodeURI(giltigaKandidater[kandidatIndex++]);
        };
        img.onerror = () => {
            laddaNasta();
        };
        laddaNasta();
        return img;
    }

    // Ladda animationsbilder för en specifik gubbe/klass
    laddaAnimationer(klassNamn) {
        if (!this.animationer[klassNamn]) {
            this.animationer[klassNamn] = {
                walking: [],
                currentFrame: 0,
                frameTimer: 0,
                frameDelay: 8 // Antal frames mellan bildbyten
            };

            // Ladda walking-animationsbilder
            const klassFilnamn = this.normaliseraFilnamn(klassNamn);
            const klassFilnamnKapitaliserad = klassFilnamn.charAt(0).toUpperCase() + klassFilnamn.slice(1).toLowerCase();
            for (let i = 1; i <= 4; i++) {
                const kandidater = [
                    `assets/animations/${klassFilnamnKapitaliserad}_walking${i}.png`,
                    `assets/animations/${klassFilnamn.toLowerCase()}_walking${i}.png`
                ];
                if (i === 1) {
                    kandidater.push(`assets/animations/${klassFilnamnKapitaliserad}.png`);
                    kandidater.push(`assets/animations/${klassFilnamn.toLowerCase()}.png`);
                }
                const img = this.skapaBildMedFallback(kandidater);
                this.animationer[klassNamn].walking.push(img);
            }
        }
        return this.animationer[klassNamn];
    }

    // Uppdatera animationen för en spelare
    uppdateraAnimering(spelare, isMoving) {
        const klassNamn = spelare.klass.namn;
        spelare.visarGangAnimation = !!isMoving;
        
        if (!this.spelarAnimationer[spelare.namn]) {
            this.spelarAnimationer[spelare.namn] = this.laddaAnimationer(klassNamn);
        }

        const animation = this.spelarAnimationer[spelare.namn];

        if (isMoving) {
            // Öka timer och byt ram när det är dags
            animation.frameTimer++;
            if (animation.frameTimer >= animation.frameDelay) {
                animation.frameTimer = 0;
                animation.currentFrame = (animation.currentFrame + 1) % animation.walking.length;
            }
        } else {
            // Nollställ animation när spelaren står stilla
            animation.currentFrame = 0;
            animation.frameTimer = 0;
        }
    }

    // Få den nuvarande animationsbilden för en spelare
    getNuvarandeAnimationsBild(spelare) {
        const klassNamn = spelare.klass.namn;
        
        if (!this.spelarAnimationer[spelare.namn]) {
            this.spelarAnimationer[spelare.namn] = this.laddaAnimationer(klassNamn);
        }

        const animation = this.spelarAnimationer[spelare.namn];
        return animation.walking[animation.currentFrame];
    }

    // Kontrollera om animationen är laddad
    animationarladdad(spelare) {
        const klassNamn = spelare.klass.namn;
        
        if (!this.animationer[klassNamn]) {
            return false;
        }

        const animation = this.animationer[klassNamn];
        return animation.walking.every(img => img.complete);
    }

    // Få höjd och bredd på animationsbilden
    getAnimationsDimensioner(spelare) {
        const bild = this.getNuvarandeAnimationsBild(spelare);
        if (bild && bild.complete) {
            return {
                width: bild.width,
                height: bild.height
            };
        }
        return { width: 0, height: 0 };
    }

    // Rensa animationer för en spelare (när spelaren tas bort från spelet)
    renserAnimering(spelarNamn) {
        delete this.spelarAnimationer[spelarNamn];
    }

    // Rensa alla animationer
    renserAllaAnimationer() {
        this.animationer = {};
        this.spelarAnimationer = {};
    }
}

// Skapa global instans av Animationer
const animationer = new Animationer();
