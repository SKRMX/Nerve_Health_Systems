// ================================================
// NERVE Health Systems — Register Flow JS
// ================================================

// ---- Shared: specialty "other" toggle ----
function toggleOtherSpecialty(select, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isOther = select.value === 'Otra especialidad...';
    input.style.display = isOther ? 'block' : 'none';
    if (isOther) input.focus();
}

let currentStep = 1;
let selectedPlan = null;
let billingCycle = 'monthly';

const planPrices = {
    monthly: { starter: 399, clinica: 1499 },
    annual: { starter: 319, clinica: 1199 },
};

// ---- Step navigation ----
function nextStep() {
    if (currentStep === 1 && !selectedPlan) return;
    if (currentStep === 4) return; // handled by submitPayment
    goToStep(currentStep + 1);
}

function prevStep() {
    if (currentStep > 1) goToStep(currentStep - 1);
}

function goToStep(n) {
    document.getElementById('step' + currentStep).classList.remove('active');
    currentStep = n;
    document.getElementById('step' + currentStep).classList.add('active');
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
    document.querySelectorAll('.prog-step').forEach(el => {
        const s = parseInt(el.dataset.step);
        el.classList.remove('active', 'done');
        if (s === currentStep) el.classList.add('active');
        else if (s < currentStep) el.classList.add('done');
    });
    document.querySelectorAll('.prog-line').forEach((el, i) => {
        el.classList.toggle('done', i + 1 < currentStep);
    });
}

// ---- Plan selection ----
function selectPlan(el) {
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedPlan = el.dataset;
    document.getElementById('step1Next').disabled = false;

    // If hospital plan → show contact instead of continue
    if (el.dataset.plan === 'hospital') {
        document.getElementById('step1Next').textContent = 'Contactar ventas →';
        document.getElementById('step1Next').onclick = () => {
            window.location.href = 'index.html#contacto';
        };
        return;
    }
    document.getElementById('step1Next').textContent = 'Continuar →';
    document.getElementById('step1Next').onclick = nextStep;

    // Update summary
    updateSummary();
}

function updateSummary() {
    if (!selectedPlan) return;
    const price = planPrices[billingCycle][selectedPlan.plan] || 0;
    document.getElementById('summaryPlan').textContent = selectedPlan.label;
    document.getElementById('summaryBilling').textContent = billingCycle === 'monthly' ? 'Facturación mensual' : 'Facturación anual (ahorra 20%)';
    document.getElementById('summaryPrice').textContent = `$${price.toLocaleString()}/mes`;
    document.getElementById('summaryLabel').textContent = billingCycle === 'annual' ? 'Precio anual' : 'Desde el día 31';
}

// ---- Billing toggle ----
function setBilling(cycle) {
    billingCycle = cycle;
    document.getElementById('billMonthly').classList.toggle('active', cycle === 'monthly');
    document.getElementById('billAnnual').classList.toggle('active', cycle === 'annual');
    updateSummary();
}

// ---- Org type selection ----
function selectOrgType(el) {
    document.querySelectorAll('.org-type-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

// ---- Step 3 validation ----
function validateStep3() {
    const email = document.getElementById('userEmail').value.trim();
    const pass = document.getElementById('userPass').value;
    const conf = document.getElementById('userPassConf').value;
    const terms = document.getElementById('acceptTerms').checked;
    let ok = true;

    // Email
    const emailErr = document.getElementById('emailError');
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
        emailErr.style.display = 'block'; ok = false;
    } else emailErr.style.display = 'none';

    // Password match
    const passErr = document.getElementById('passError');
    if (pass !== conf || pass.length < 8) {
        passErr.style.display = 'block'; ok = false;
    } else passErr.style.display = 'none';

    if (!terms) { alert('Debes aceptar los términos de uso.'); ok = false; }

    if (ok) {
        document.getElementById('confirmEmail').textContent = email;
        nextStep();
    }
}

// ---- Card formatting ----
function formatCard(el) {
    let v = el.value.replace(/\D/g, '').substring(0, 16);
    el.value = v.replace(/(.{4})/g, '$1 ').trim();
}
function formatExp(el) {
    let v = el.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
    el.value = v;
}

// ---- Submit payment ----
function submitPayment() {
    const num = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const exp = document.getElementById('cardExp').value;
    const cvv = document.getElementById('cardCvv').value;
    const name = document.getElementById('cardName').value.trim();

    if (num.length < 13 || !exp.includes('/') || cvv.length < 3 || !name) {
        alert('Por favor completa todos los datos de pago.'); return;
    }

    const btn = document.querySelector('.order-summary .btn');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    // Simulate payment processing
    setTimeout(() => {
        // Store session data for app.html
        const email = document.getElementById('userEmail')?.value?.trim() || '';
        const first = document.getElementById('userFirst')?.value?.trim() || '';
        const last = document.getElementById('userLast')?.value?.trim() || '';
        localStorage.setItem('nerve_firsttime', '1');
        localStorage.setItem('nerve_role', 'org_owner');
        localStorage.setItem('nerve_plan', selectedPlan?.plan || 'clinica');
        localStorage.setItem('nerve_email', email);
        localStorage.setItem('nerve_name', `${first} ${last}`.trim());
        goToStep(5);
        btn.disabled = false;
        btn.textContent = 'Activar prueba gratuita →';
    }, 2000);
}

function setFirstTimeUser() {
    localStorage.setItem('nerve_firsttime', '1');
    localStorage.setItem('nerve_role', 'org_owner');
}

function resendEmail() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    setTimeout(() => {
        btn.textContent = '✓ Correo enviado';
        setTimeout(() => { btn.textContent = 'Reenviar correo de verificación'; btn.disabled = false; }, 3000);
    }, 1200);
}

// ---- Pre-select plan from URL param ----
(function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam) {
        const card = document.querySelector(`[data-plan="${planParam}"]`);
        if (card) selectPlan(card);
    }
})();
