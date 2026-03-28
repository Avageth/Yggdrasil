// Runa_R.js
// Registrerar en enkel "Runa R" hos Runor-managern när filen laddas.

(function(){
    const runeDef = {
        id: 'runa_r',
        namn: 'Raidho',
        beskrivning: 'Ger spelaren möjligheten att resa till andra världar från sjöfartsrutor.',
        apply: function(spelare) {
            try {
                if (!spelare) return false;
                if (typeof spelare.maxEnergi !== 'number') spelare.maxEnergi = (spelare.maxEnergi || 0);
                spelare.maxEnergi = (spelare.maxEnergi || 0) + 1;
                if (typeof spelare.energi !== 'number') spelare.energi = 0;
                spelare.energi = Math.min(spelare.maxEnergi, spelare.energi + 1);
                try { console.log('[Runa_R] applied: maxEnergi=', spelare.maxEnergi, 'energi=', spelare.energi); } catch(e){}
                // Försök aktivera motsvarande ruta i runor-canvas om manager finns
                try {
                    if (typeof window !== 'undefined' && window.runor && Array.isArray(window.runor._runorRegions)) {
                        // Först försök hitta region med matching id (t.ex. om någon definierat samma id)
                        let region = window.runor._runorRegions.find(r => r.id === runeDef.id);
                        if (region) {
                            try { window.runor.setRegionState(region.id, true); } catch (e) {}
                            try { if (typeof window.runor.setRegionRune === 'function') window.runor.setRegionRune(region.id, runeDef.id); } catch (e) {}
                        } else {
                            // Aktivera specifik region: femte från vänster (index 4)
                            try {
                                const desiredIndex = 4; // femte från vänster
                                if (window.runor._runorRegions.length > desiredIndex) {
                                    const target = window.runor._runorRegions[desiredIndex];
                                    if (target) {
                                        try { window.runor.setRegionState(target.id, true); } catch (e) {}
                                        try { if (typeof window.runor.setRegionRune === 'function') window.runor.setRegionRune(target.id, runeDef.id); } catch (e) {}
                                        try { console.log('[Runa_R] enabled region at index', desiredIndex, 'id=', target.id); } catch (e) {}
                                    }
                                } else {
                                    // Fallback: aktivera sista (högra) inaktiva regionen
                                    let lastOff = null;
                                    for (let i = window.runor._runorRegions.length - 1; i >= 0; i--) {
                                        const rr = window.runor._runorRegions[i];
                                        if (!rr.enabled) { lastOff = rr; break; }
                                    }
                                    if (lastOff) {
                                        try { window.runor.setRegionState(lastOff.id, true); } catch (e) {}
                                        try { if (typeof window.runor.setRegionRune === 'function') window.runor.setRegionRune(lastOff.id, runeDef.id); } catch (e) {}
                                        try { console.log('[Runa_R] enabled rightmost/off region', lastOff.id, 'for rune', runeDef.id); } catch (e) {}
                                    } else {
                                        const last = window.runor._runorRegions[window.runor._runorRegions.length - 1];
                                        if (last) {
                                            try { window.runor.setRegionState(last.id, true); } catch (e) {}
                                            try { if (typeof window.runor.setRegionRune === 'function') window.runor.setRegionRune(last.id, runeDef.id); } catch (e) {}
                                            try { console.log('[Runa_R] enabled fallback last region', last.id, 'for rune', runeDef.id); } catch (e) {}
                                        }
                                    }
                                }
                            } catch (e) { try { console.warn('[Runa_R] could not enable desired region', e); } catch (ee) {} }
                        }
                    }
                } catch (e) { try { console.warn('[Runa_R] could not enable runor region', e); } catch (ee) {} }
                return true;
            } catch (e) { try { console.error('[Runa_R] apply failed', e); } catch (ee) {} return false; }
        }
    };

    // Försök registrera runan i flera miljöer (browser global, CommonJS require)
    try {
        if (typeof window !== 'undefined' && window.runor && typeof window.runor.registerRune === 'function') {
            window.runor.registerRune(runeDef);
            try { console.log('[Runa_R] registered via window.runor'); } catch(e){}
        } else if (typeof require === 'function') {
            try {
                const r = require('./Runor.js');
                if (r && typeof r.registerRune === 'function') r.registerRune(runeDef);
            } catch (e) {}
        }
    } catch (e) {}

    // Exponera definitionen som modul om möjligt
    if (typeof module !== 'undefined' && module.exports) module.exports = runeDef;
    if (typeof define === 'function' && define.amd) define([], function(){ return runeDef; });
})();
