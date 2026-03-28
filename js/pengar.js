// Valutasystem
// 10 koppar = 1 silver, 10 silver = 1 guld

const KOPPAR_PER_SILVER = 10;
const SILVER_PER_GULD = 10;
const KOPPAR_PER_GULD = KOPPAR_PER_SILVER * SILVER_PER_GULD;

function tillKoppar({ koppar = 0, silver = 0, guld = 0 } = {}) {
  return Math.max(0, koppar + silver * KOPPAR_PER_SILVER + guld * KOPPAR_PER_GULD);
}

function franKoppar(totalKoppar = 0) {
  totalKoppar = Math.max(0, totalKoppar);
  const guld = Math.floor(totalKoppar / KOPPAR_PER_GULD);
  const kvarEfterGuld = totalKoppar % KOPPAR_PER_GULD;
  const silver = Math.floor(kvarEfterGuld / KOPPAR_PER_SILVER);
  const koppar = kvarEfterGuld % KOPPAR_PER_SILVER;

  return { koppar, silver, guld };
}

const Valuta = {
  KOPPAR_PER_SILVER,
  SILVER_PER_GULD,
  KOPPAR_PER_GULD,
  tillKoppar,
  franKoppar,
};

// Om du använder moduler:
// export default Valuta;
