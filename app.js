const form = document.querySelector('#calculator-form');
const demoButton = document.querySelector('[data-fill-demo]');
const bestName = document.querySelector('[data-best-name]');
const bestNet = document.querySelector('[data-best-net]');
const bestDiff = document.querySelector('[data-best-diff]');
const bestNote = document.querySelector('[data-best-note]');
const heroSaving = document.querySelector('[data-hero-saving]');
const ryczaltLabel = document.querySelector('[data-ryczalt-label]');
const methodCards = document.querySelectorAll('.method-card');

const MIN_HEALTH = 381.78 * 12; // roczna minimalna składka zdrowotna 2024
const LUMP_SUM_HEALTH = [
  { limit: 60000, monthly: 419.46 },
  { limit: 300000, monthly: 699.11 },
  { limit: Infinity, monthly: 1258.39 },
];

const formatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const defaultState = {
  revenue: 180000,
  costs: 36000,
  social: 1600,
  lumpRate: 0.12,
  allowance: 30000,
  threshold: 120000,
};

function parseForm() {
  const data = new FormData(form);
  return {
    revenue: Number(data.get('revenue')) || 0,
    costs: Number(data.get('costs')) || 0,
    social: Number(data.get('social')) || 0,
    lumpRate: Number(data.get('lumpRate')) || defaultState.lumpRate,
    allowance: Number(data.get('allowance')) || defaultState.allowance,
    threshold: Number(data.get('threshold')) || defaultState.threshold,
  };
}

function calcLumpHealth(annualRevenue) {
  const rule = LUMP_SUM_HEALTH.find((tier) => annualRevenue <= tier.limit);
  return (rule?.monthly || LUMP_SUM_HEALTH[0].monthly) * 12;
}

function calcProgressive({ revenue, costs, social, allowance, threshold }) {
  const socialAnnual = social * 12;
  const baseIncome = Math.max(0, revenue - costs - socialAnnual);
  const taxable = Math.max(0, baseIncome - allowance);
  const firstBracket = threshold;
  let tax = 0;

  if (taxable <= firstBracket) {
    tax = taxable * 0.12;
  } else {
    tax = firstBracket * 0.12 + (taxable - firstBracket) * 0.32;
  }

  const health = Math.max(baseIncome * 0.09, MIN_HEALTH);
  const netAnnual = revenue - socialAnnual - health - tax;
  return {
    key: 'scale',
    label: 'Skala podatkowa',
    tax,
    health,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveRate: revenue > 0 ? (tax + health) / revenue : 0,
  };
}

function calcLinear({ revenue, costs, social }) {
  const socialAnnual = social * 12;
  const baseIncome = Math.max(0, revenue - costs - socialAnnual);
  const tax = baseIncome * 0.19;
  const health = Math.max(baseIncome * 0.049, MIN_HEALTH);
  const netAnnual = revenue - socialAnnual - health - tax;
  return {
    key: 'linear',
    label: 'Podatek liniowy',
    tax,
    health,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveRate: revenue > 0 ? (tax + health) / revenue : 0,
  };
}

function calcLump({ revenue, social, lumpRate }) {
  const socialAnnual = social * 12;
  const baseAfterSocial = Math.max(0, revenue - socialAnnual);
  const tax = baseAfterSocial * lumpRate;
  const health = calcLumpHealth(revenue);
  const netAnnual = revenue - socialAnnual - health - tax;
  return {
    key: 'lump',
    label: 'Ryczałt',
    tax,
    health,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveRate: revenue > 0 ? (tax + health) / revenue : 0,
  };
}

function calculate(payload) {
  const scale = calcProgressive(payload);
  const linear = calcLinear(payload);
  const lump = calcLump(payload);
  const results = { scale, linear, lump };
  const ordered = Object.values(results).sort((a, b) => b.netAnnual - a.netAnnual);
  const best = ordered[0];
  const runnerUp = ordered[1] || null;
  const diff = runnerUp ? best.netAnnual - runnerUp.netAnnual : 0;

  return {
    results,
    best: {
      ...best,
      diff,
    },
  };
}

function updateMethods(results) {
  methodCards.forEach((card) => {
    const key = card.getAttribute('data-method');
    const result = results[key];
    if (!result) return;

    const netText = `${formatter.format(result.netMonthly)} / mc`;
    card.querySelectorAll('[data-method-net]').forEach((node) => {
      node.textContent = netText;
    });

    const taxText = formatter.format(result.tax);
    const healthText = formatter.format(result.health);
    const rateText = percentFormatter.format(result.effectiveRate || 0);

    card.querySelector('[data-method-tax]').textContent = taxText;
    card.querySelector('[data-method-health]').textContent = healthText;
    card.querySelector('[data-method-rate]').textContent = rateText;

    if (result.netAnnual < 0) {
      card.classList.add('is-negative');
    } else {
      card.classList.remove('is-negative');
    }
  });
}

function updateBest(best) {
  bestName.textContent = best?.label || '—';
  bestNet.textContent = best ? `${formatter.format(best.netMonthly)} / mc` : '—';
  const diffText = best && best.diff > 0 ? `+${formatter.format(best.diff)} / rok` : 'Brak przewagi';
  bestDiff.textContent = diffText;
  heroSaving.textContent = best && best.diff > 0 ? `${formatter.format(best.diff)} / rok` : '0 zł / rok';

  if (best && best.diff > 0) {
    bestNote.textContent = 'Oszczędzasz względem kolejnej opcji.';
  } else if (best) {
    bestNote.textContent = 'Różnice są znikome – rozważ pozostałe czynniki.';
  } else {
    bestNote.textContent = 'Wypełnij formularz po lewej stronie, aby zobaczyć wynik.';
  }
}

function handleChange() {
  const payload = parseForm();
  updateRyczaltLabel(payload.lumpRate);
  const { results, best } = calculate(payload);
  updateMethods(results);
  updateBest(best);
}

function updateRyczaltLabel(rate) {
  if (!ryczaltLabel) return;
  ryczaltLabel.textContent = `${Math.round(rate * 1000) / 10}%`;
}

function fillDemo() {
  const demoValues = {
    revenue: 320000,
    costs: 60000,
    social: 1818,
    allowance: 30000,
    threshold: 120000,
    lumpRate: 0.12,
  };

  Object.entries(demoValues).forEach(([key, value]) => {
    const input = form.elements.namedItem(key);
    if (!input) return;
    input.value = value;
  });

  handleChange();
}

form.addEventListener('input', handleChange);
form.addEventListener('change', handleChange);

demoButton?.addEventListener('click', fillDemo);

// init
Object.entries(defaultState).forEach(([key, value]) => {
  const input = form.elements.namedItem(key);
  if (input && !input.value) {
    input.value = value;
  }
});

handleChange();
