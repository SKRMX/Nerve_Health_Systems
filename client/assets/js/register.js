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

// ---- Notifications ----
window.showNotification = function (msg, type = 'success') {
    const container = document.getElementById('notification-container') || (function () {
        const div = document.createElement('div');
        div.id = 'notification-container';
        div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(div);
        return div;
    })();
    const notif = document.createElement('div');
    const bg = type === 'error' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#06cfd7');
    const icon = type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : '✅');
    notif.style.cssText = `background:${bg};color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:10px;font-size:0.9rem;font-weight:500;transform:translateY(20px);opacity:0;transition:all 0.3s ease;`;
    notif.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    container.appendChild(notif);
    setTimeout(() => { notif.style.transform = 'translateY(0)'; notif.style.opacity = '1'; }, 10);
    setTimeout(() => {
        notif.style.transform = 'translateY(10px)'; notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

let currentStep = 1;
let selectedPlan = null;
let billingCycle = 'monthly';

const planPrices = {
    monthly: { starter: 699, clinica: 4999 },
    annual: { starter: 559, clinica: 3999 },
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
    document.getElementById('summaryLabel').textContent = billingCycle === 'annual' ? 'Precio anual' : 'Desde el día 16';
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

    if (!terms) { showNotification('Debes aceptar los términos de uso.', 'warning'); ok = false; }

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

// ---- Submit registration (Step 4) ----
async function submitPayment() {
    const email = document.getElementById('userEmail')?.value?.trim();
    const password = document.getElementById('userPass')?.value;
    const name = (document.getElementById('userFirst')?.value?.trim() + ' ' + document.getElementById('userLast')?.value?.trim()).trim();
    const orgName = document.getElementById('orgName')?.value?.trim();
    const phone = document.getElementById('orgPhone')?.value?.trim();
    const specialty = document.getElementById('orgSpecialty')?.value;

    // We don't strictly validate CC for the demo trial in this version, 
    // but we check if the user filled something to keep the "feeling" of a real signup.
    const num = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const exp = document.getElementById('cardExp').value;
    const cvv = document.getElementById('cardCvv').value;
    const cardName = document.getElementById('cardName').value.trim();

    if (num.length < 13 || !exp.includes('/') || cvv.length < 3 || !cardName) {
        showNotification('Por favor completa todos los datos de pago para activar tu prueba.', 'warning'); return;
    }

    const btn = document.querySelector('.order-summary .btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-right:8px;"></span> Procesando...';

    // Add spinner style if it doesn't exist
    if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    try {
        const license = document.getElementById('userCedula')?.value?.trim();
        // CALL REAL API
        if (typeof API !== 'undefined') {
            await API.register(name, email, password, orgName, phone, specialty, license);

            // Store some UI state for the app
            localStorage.setItem('nerve_firsttime', '1');
            localStorage.setItem('nerve_email', email);
            localStorage.setItem('nerve_name', name);

            document.getElementById('confirmEmail').textContent = email;
            goToStep(5);
        } else {
            throw new Error('API no disponible. Intenta de nuevo más tarde.');
        }
    } catch (err) {
        showNotification(err.message || 'Error al crear la cuenta', 'error');
        btn.disabled = false;
        btn.textContent = 'Activar prueba gratuita →';
    }
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
