const MIN_HEALTH = 381.78 * 12; // roczna minimalna skladka zdrowotna 2024
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

const RELIEF_OPTIONS = {
  standard: {
    label: 'Pelny ZUS',
    note: 'Pelne skladki spoleczne (ok. 1600 zl/mc).',
    socialMonthly: 1600,
  },
  ulgaStart: {
    label: 'Ulga na start',
    note: 'Przez pierwsze 6 miesiecy nie placisz skladek spolecznych (przyjmujemy 0 zl).',
    socialMonthly: 0,
    lockInput: true,
  },
  preferential: {
    label: 'Preferencyjny ZUS',
    note: 'Uproszczone 400 zl/mc w trakcie preferencji (mozesz nadpisac recznie).',
    socialMonthly: 400,
  },
  malyZusPlus: {
    label: 'Maly ZUS Plus',
    note: 'Przykladowo 1000 zl/mc (zalezne od dochodu, skoryguj jesli trzeba).',
    socialMonthly: 1000,
  },
  custom: {
    label: 'Wlasna kwota',
    note: 'Zachowujemy Twoja reczna kwote skladek.',
    socialMonthly: null,
  },
};

const DEFAULT_STATE = {
  revenue: 180000,
  costs: 36000,
  social: 1600,
  lumpRate: 0.12,
  allowance: 30000,
  threshold: 120000,
  relief: 'standard',
};

const DEMO_STATE = {
  revenue: 320000,
  costs: 60000,
  social: 0,
  allowance: 30000,
  threshold: 120000,
  lumpRate: 0.12,
  relief: 'ulgaStart',
};

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
    label: 'Ryczalt',
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

function initCalculator() {
  const form = document.querySelector('#calculator-form');
  if (!form) return;

  const demoButton = document.querySelector('[data-fill-demo]');
  const bestName = document.querySelector('[data-best-name]');
  const bestNet = document.querySelector('[data-best-net]');
  const bestDiff = document.querySelector('[data-best-diff]');
  const bestNote = document.querySelector('[data-best-note]');
  const heroSaving = document.querySelector('[data-hero-saving]');
  const ryczaltLabel = document.querySelector('[data-ryczalt-label]');
  const methodCards = document.querySelectorAll('.method-card');
  const socialInput = form.elements.namedItem('social');
  const reliefSelect = form.elements.namedItem('relief');
  const reliefNote = document.querySelector('[data-relief-note]');

  function applyReliefPreset(reliefKey, { forceValue = true } = {}) {
    if (!socialInput) return;
    const config = RELIEF_OPTIONS[reliefKey] || RELIEF_OPTIONS.standard;
    if (reliefNote) {
      reliefNote.textContent = config.note;
    }
    socialInput.readOnly = Boolean(config.lockInput);
    socialInput.classList.toggle('input-readonly', Boolean(config.lockInput));
    if (config.socialMonthly !== null && forceValue) {
      socialInput.value = config.socialMonthly;
    } else if (!socialInput.value) {
      socialInput.value = DEFAULT_STATE.social;
    }
  }

  function parseForm() {
    const data = new FormData(form);
    return {
      revenue: Number(data.get('revenue')) || 0,
      costs: Number(data.get('costs')) || 0,
      social: Number(data.get('social')) || 0,
      lumpRate: Number(data.get('lumpRate')) || DEFAULT_STATE.lumpRate,
      allowance: Number(data.get('allowance')) || DEFAULT_STATE.allowance,
      threshold: Number(data.get('threshold')) || DEFAULT_STATE.threshold,
      relief: data.get('relief') || DEFAULT_STATE.relief,
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
    bestName.textContent = best?.label || '-';
    bestNet.textContent = best ? `${formatter.format(best.netMonthly)} / mc` : '-';
    const diffText = best && best.diff > 0 ? `+${formatter.format(best.diff)} / rok` : 'Brak przewagi';
    bestDiff.textContent = diffText;
    heroSaving.textContent = best && best.diff > 0 ? `${formatter.format(best.diff)} / rok` : '0 zl / rok';

    if (best && best.diff > 0) {
      bestNote.textContent = 'Oszczedzasz wzgledem kolejnej opcji.';
    } else if (best) {
      bestNote.textContent = 'Roznice sa znikome - rozwaz pozostale czynniki.';
    } else {
      bestNote.textContent = 'Wypelnij formularz po lewej stronie, aby zobaczyc wynik.';
    }
  }

  function updateRyczaltLabel(rate) {
    if (!ryczaltLabel) return;
    ryczaltLabel.textContent = `${Math.round(rate * 1000) / 10}%`;
  }

  function handleChange() {
    const payload = parseForm();
    updateRyczaltLabel(payload.lumpRate);
    const { results, best } = calculate(payload);
    updateMethods(results);
    updateBest(best);
  }

  function fillDemo() {
    Object.entries(DEMO_STATE).forEach(([key, value]) => {
      const input = form.elements.namedItem(key);
      if (!input) return;
      if (key === 'relief') {
        input.value = value;
        applyReliefPreset(value);
        return;
      }
      input.value = value;
    });

    handleChange();
  }

  reliefSelect?.addEventListener('change', (event) => {
    applyReliefPreset(event.target.value);
  });

  form.addEventListener('input', handleChange);
  form.addEventListener('change', handleChange);

  demoButton?.addEventListener('click', fillDemo);

  Object.entries(DEFAULT_STATE).forEach(([key, value]) => {
    const input = form.elements.namedItem(key);
    if (input && !input.value) {
      input.value = value;
    }
  });

  applyReliefPreset(reliefSelect?.value || DEFAULT_STATE.relief);
  handleChange();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
