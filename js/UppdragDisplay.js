// UppdragDisplay.js
// Visar aktiva uppdrag i uppdragCanvas utan att påverka huvudmenyn

importOrRequire();

function importOrRequire() {
    // För att stödja både import och require
    if (typeof require !== 'undefined') {
        var { ritaUppdragsPlatser } = require('./Uppdrag');
    } else if (typeof window !== 'undefined' && window.ritaUppdragsPlatser) {
        var ritaUppdragsPlatser = window.ritaUppdragsPlatser;
    }
    window.ritaUppdragsPlatser = ritaUppdragsPlatser;
}

// Hämta aktiva uppdrag från Långhuset om det finns
function getAktivaUppdrag() {
    if (window.langhuset && Array.isArray(window.langhuset.aktivaUppdrag)) {
        // Konvertera till rätt format om nödvändigt
        return window.langhuset.aktivaUppdrag.map(u => ({
            id: u.id,
            namn: u.namn,
            beskrivning: u.beskrivning,
            beloning: u.Belöning || u.beloning,
            status: u.status,
            questChansType: u.questChansType || null,
            // inkludera baseline-värden så displaylogik kan räkna rätt
            acceptedKillsTotal: u.acceptedKillsTotal || 0,
            acceptedKillsByType: u.acceptedKillsByType || {},
            acceptedInteractionCounts: u.acceptedInteractionCounts || {}
        }));
    }
    return [];
}

// Rita när spelet är igång och inte i huvudmenyn
function uppdateraUppdragDisplay() {
    const doldaSkarmar = ['startskarm', 'huvudmeny', 'skapaGubbe', 'namnGubbe', 'startcutscene'];
    if (typeof window.aktuellSkarm === 'string' && doldaSkarmar.includes(window.aktuellSkarm)) {
        // Töm canvasen om menyn visas
        const canvas = document.getElementById('uppdragCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
    }
    const uppdrag = getAktivaUppdrag();
    if (window.ritaUppdragsPlatser) {
        window.ritaUppdragsPlatser(uppdrag);
    }
}

// Kör uppdatering varje gång spelet ritas om (eller med intervall)
setInterval(uppdateraUppdragDisplay, 500);