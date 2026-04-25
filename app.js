const form = document.querySelector('#savings-form');
const steps = [...document.querySelectorAll('.step')];
const stepIndicator = document.querySelector('#step-indicator');
const stepTitle = document.querySelector('#step-title');
const progressFill = document.querySelector('#progress-fill');
const errorBox = document.querySelector('#form-error');

const prevBtn = document.querySelector('#prev-btn');
const nextBtn = document.querySelector('#next-btn');
const submitBtn = document.querySelector('#submit-btn');

const wizardCard = document.querySelector('#wizard-card');
const resultCard = document.querySelector('#result-card');
const restartBtn = document.querySelector('#restart-btn');

const resultCompany = document.querySelector('#result-company');
const resultAmount = document.querySelector('#result-amount');
const resultBreakdown = document.querySelector('#result-breakdown');
const resultEmail = document.querySelector('#result-email');

const titles = {
  1: 'Bedrijfsgegevens',
  2: 'Kostenoverzicht',
  3: 'Besparingsfocus',
  4: 'Contactgegevens'
};

let currentStep = 1;

function getCurrentStepElement() {
  return steps.find((el) => Number(el.dataset.step) === currentStep);
}

function validateCurrentStep() {
  const stepEl = getCurrentStepElement();
  if (!stepEl) return true;

  if (currentStep === 3) {
    const checked = stepEl.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length > 0) {
      errorBox.textContent = '';
      return true;
    }

    errorBox.textContent = 'Selecteer minimaal één focusgebied.';
    return false;
  }

  const controls = [...stepEl.querySelectorAll('input, select')];
  for (const control of controls) {
    if (!control.checkValidity()) {
      control.reportValidity();
      errorBox.textContent = 'Controleer de gemarkeerde velden en probeer opnieuw.';
      return false;
    }
  }

  errorBox.textContent = '';
  return true;
}

function updateButtons() {
  prevBtn.disabled = currentStep === 1;
  nextBtn.classList.toggle('is-hidden', currentStep === 4);
  submitBtn.classList.toggle('is-hidden', currentStep !== 4);
}

function updateProgress() {
  const percentage = (currentStep / steps.length) * 100;
  progressFill.style.width = `${percentage}%`;
  stepIndicator.textContent = `Stap ${currentStep} van ${steps.length}`;
  stepTitle.textContent = titles[currentStep];
}

function renderStep() {
  for (const step of steps) {
    step.classList.toggle('is-active', Number(step.dataset.step) === currentStep);
  }

  updateButtons();
  updateProgress();
}

function toEuro(value) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

function getFormValues() {
  const data = new FormData(form);
  const selectedAreas = data.getAll('focusAreas');

  return {
    companyName: data.get('companyName')?.toString().trim() || 'jouw bedrijf',
    industry: data.get('industry')?.toString() || '',
    employees: Number(data.get('employees') || 0),
    locations: Number(data.get('locations') || 0),
    energyCost: Number(data.get('energyCost') || 0),
    telecomCost: Number(data.get('telecomCost') || 0),
    insuranceCost: Number(data.get('insuranceCost') || 0),
    focusAreas: selectedAreas,
    contactName: data.get('contactName')?.toString().trim() || '',
    email: data.get('email')?.toString().trim() || ''
  };
}

function estimateSavings(values) {
  const baseRates = {
    energie: 0.16,
    telecom: 0.14,
    verzekeringen: 0.12,
    automatisering: 0.08
  };

  const domainCosts = {
    energie: values.energyCost,
    telecom: values.telecomCost,
    verzekeringen: values.insuranceCost,
    automatisering: values.energyCost + values.telecomCost + values.insuranceCost
  };

  const sizeMultiplier = Math.min(1.25, 1 + values.employees / 300 + values.locations / 35);

  let total = 0;
  const breakdown = [];

  for (const area of values.focusAreas) {
    const saving = Math.round((domainCosts[area] || 0) * (baseRates[area] || 0) * sizeMultiplier);
    total += saving;
    breakdown.push({
      area,
      saving
    });
  }

  return {
    total,
    breakdown
  };
}

function displayResults(values, result) {
  resultCompany.textContent = values.companyName;
  resultAmount.textContent = `${toEuro(result.total)} / maand`;
  resultEmail.textContent = values.email || 'je opgegeven e-mailadres';

  resultBreakdown.innerHTML = '';

  for (const item of result.breakdown) {
    const readableName = item.area.charAt(0).toUpperCase() + item.area.slice(1);
    const row = document.createElement('div');
    row.className = 'result__item';
    row.innerHTML = `<span>${readableName}</span><strong>${toEuro(item.saving)}</strong>`;
    resultBreakdown.append(row);
  }

  wizardCard.classList.add('is-hidden');
  resultCard.classList.remove('is-hidden');
}

nextBtn.addEventListener('click', () => {
  if (!validateCurrentStep()) return;

  currentStep += 1;
  renderStep();
});

prevBtn.addEventListener('click', () => {
  currentStep -= 1;
  errorBox.textContent = '';
  renderStep();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  const values = getFormValues();
  const result = estimateSavings(values);
  displayResults(values, result);
});

restartBtn.addEventListener('click', () => {
  form.reset();

  document
    .querySelectorAll('input[name="focusAreas"]')
    .forEach((input) => (input.checked = ['energie', 'telecom', 'verzekeringen'].includes(input.value)));

  currentStep = 1;
  wizardCard.classList.remove('is-hidden');
  resultCard.classList.add('is-hidden');
  errorBox.textContent = '';
  renderStep();
});

renderStep();
