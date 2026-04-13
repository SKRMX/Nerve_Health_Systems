// ================================================
// NERVE Health Systems — Register Flow JS (Refactored)
// ================================================

// ---- Zod Setup ----
const z = window.Zod;

// ---- Schemas ----
const Step2Schema = z.object({
    orgType: z.enum(['consultorio', 'clinica', 'hospital'], {
        required_error: "Debes seleccionar un tipo de organización"
    }),
    orgName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    orgSpecialty: z.string().min(1, "Selecciona una especialidad"),
    orgSpecialtyOther: z.string().optional(),
    orgCountry: z.string().min(1, "Selecciona un país"),
    orgCity: z.string().min(2, "Ingresa una ciudad válida"),
    orgPhone: z.string().optional()
}).superRefine((data, ctx) => {
    if (data.orgSpecialty === 'Otra especialidad...') {
        if (!data.orgSpecialtyOther || data.orgSpecialtyOther.length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Especifica la especialidad (mínimo 3 caracteres)",
                path: ["orgSpecialtyOther"]
            });
        }
    }
});

const Step3Schema = z.object({
    userFirst: z.string().min(2, "Ingresa tu nombre validamente"),
    userLast: z.string().min(2, "Ingresa tu apellido validamente"),
    userEmail: z.string().email("Ingresa un correo electrónico válido"),
    userPass: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    userPassConf: z.string(),
    userCedula: z.string().optional(),
    acceptTerms: z.boolean().refine(val => val === true, "Debes aceptar los términos de uso")
}).superRefine((data, ctx) => {
    if (data.userPass !== data.userPassConf) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Las contraseñas no coinciden",
            path: ["userPassConf"]
        });
    }
});

// ---- Centralized State (Proxy) ----
const rawState = {
    plan: null,         // starter, clinica, hospital
    billingCycle: 'monthly',
    orgType: null,      // consultorio, clinica, hospital
    orgName: '',
    orgSpecialty: 'Medicina General',
    orgSpecialtyOther: '',
    orgCountry: 'México',
    orgCity: '',
    orgPhone: '',
    userFirst: '',
    userLast: '',
    userEmail: '',
    userPass: '',
    userPassConf: '',
    userCedula: '',
    acceptTerms: false
};

const WizardState = new Proxy(rawState, {
    set(target, property, value) {
        target[property] = value;
        
        // Persist session if simple string/bool
        if(typeof value === 'string' || typeof value === 'boolean') {
            sessionStorage.setItem('nerve_wizard_' + property, value);
        }
        
        // Auto-triggers
        if (property === 'plan' || property === 'billingCycle') {
            updateSummary();
        }
        if (property === 'plan') {
            applyConditionalLogic();
        }
        
        return true;
    }
});

// ---- Validation UI Helpers ----
function showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('is-invalid');
    
    // Find or create error container
    let errEl = el.nextElementSibling;
    if (!errEl || !errEl.classList.contains('form-error')) {
        errEl = document.createElement('div');
        errEl.className = 'form-error';
        el.parentNode.insertBefore(errEl, el.nextSibling);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
}

function clearError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('is-invalid');
    const errEl = el.nextElementSibling;
    if (errEl && errEl.classList.contains('form-error')) {
        errEl.style.display = 'none';
    }
}

function clearAllErrors(stepId) {
    const step = document.getElementById(stepId);
    if (!step) return;
    step.querySelectorAll('.form-control').forEach(el => clearError(el.id));
    step.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
    
    // Special checkboxes
    clearError('acceptTerms');
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

// ---- Setup & Bootstrapping ----
let currentStep = 1;
const planPrices = {
    monthly: { starter: 999, clinica: 6999 },
    annual: { starter: 832, clinica: 5832 },
};

document.addEventListener('DOMContentLoaded', () => {
    bindInputs();
    loadPersistedState();
    
    // Default hiding for native error doms in HTML explicitly since we handle dynamically now
    document.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
});

// Bind inputs dynamically to WizardState
function bindInputs() {
    const ids = ['orgName','orgSpecialty','orgSpecialtyOther','orgCountry','orgCity','orgPhone',
                 'userFirst','userLast','userEmail','userPass','userPassConf','userCedula'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                WizardState[id] = e.target.value;
                clearError(id);
            });
        }
    });

    const terms = document.getElementById('acceptTerms');
    if(terms) {
        terms.addEventListener('change', (e) => {
            WizardState.acceptTerms = e.target.checked;
            clearError('acceptTerms');
        });
    }
}

function loadPersistedState() {
    Object.keys(rawState).forEach(key => {
        const val = sessionStorage.getItem('nerve_wizard_' + key);
        if (val !== null) {
            if (val === 'true' || val === 'false') {
                WizardState[key] = val === 'true';
            } else {
                WizardState[key] = val;
            }
        }
    });

    // Sync DOM Inputs
    const ids = ['orgName','orgSpecialty','orgSpecialtyOther','orgCountry','orgCity','orgPhone',
                 'userFirst','userLast','userEmail','userPass','userPassConf','userCedula'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && WizardState[id]) el.value = WizardState[id];
    });

    if(document.getElementById('acceptTerms')) document.getElementById('acceptTerms').checked = WizardState.acceptTerms;

    // Selections
    if (WizardState.plan) {
        const el = document.querySelector(`.plan-card[data-plan="${WizardState.plan}"]`);
        if (el) {
            document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
            el.classList.add('selected');
            document.getElementById('step1Next').disabled = false;
        }
    }
    

    
    setBilling(WizardState.billingCycle);
    toggleOtherSpecialty(document.getElementById('orgSpecialty'), 'orgSpecialtyOther');
}

// ---- Shared: specialty "other" toggle ----
window.toggleOtherSpecialty = function(select, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isOther = select.value === 'Otra especialidad...';
    input.style.display = isOther ? 'block' : 'none';
    if (isOther) input.focus();
    WizardState.orgSpecialty = select.value;
}

// ---- Step Transitions ----
window.nextStep = async function() {
    clearAllErrors('step' + currentStep);

    // Validation before proceed
    if (currentStep === 1) {
        if (!WizardState.plan) {
            showNotification('Selecciona un plan para continuar.', 'warning');
            return;
        }
        if (WizardState.plan === 'hospital') {
            window.location.href = 'index.html#contacto';
            return;
        }
    }
    
    if (currentStep === 2) {
        const result = Step2Schema.safeParse(WizardState);
        if (!result.success) {
            result.error.issues.forEach(issue => {
                showError(issue.path[0], issue.message);
            });
            showNotification('Completa correctamente los datos de la organización', 'warning');
            return;
        }
    }
    
    if (currentStep === 3) {
        // Validation goes through validateStep3 specifically to simulate Async loaders
        // Wait, validateStep3 is tied to the button. Handled there.
        return; 
    }

    if (currentStep === 4) return; 

    animateToStep(currentStep + 1);
}

window.prevStep = function() {
    if (currentStep > 1) {
        animateToStep(currentStep - 1);
    }
}

function animateToStep(n) {
    const currentEl = document.getElementById('step' + currentStep);
    const nextEl = document.getElementById('step' + n);
    
    // Slide out current
    currentEl.classList.remove('active', 'slide-in');
    currentEl.classList.add('slide-out');
    
    setTimeout(() => {
        currentEl.classList.remove('slide-out');
        currentEl.style.display = 'none'; // Ensure hidden completely
        
        // Slide in next
        currentStep = n;
        nextEl.style.display = 'block';
        nextEl.classList.add('active'); // active triggers animation in css
        
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300); // Wait for CSS animation
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
window.selectPlan = function(el, proceed = false) {
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    WizardState.plan = el.dataset.plan;
    
    const nextBtn = document.getElementById('step1Next');
    nextBtn.disabled = false;

    if (WizardState.plan === 'hospital') {
        nextBtn.textContent = 'Contactar ventas →';
    } else {
        nextBtn.textContent = 'Continuar →';
    }
    
    // optionally auto proceed if clicked manually
    if(proceed && WizardState.plan !== 'hospital') {
        // window.nextStep(); // if we want instant skip, but better just enable
    }
}

function applyConditionalLogic() {
    const title = document.getElementById('step2Title');
    const desc = document.getElementById('step2Desc');
    const lblName = document.getElementById('labelOrgName');
    const lblSpec = document.getElementById('labelOrgSpecialty');
    const lblPhone = document.getElementById('labelOrgPhone');
    const inputName = document.getElementById('orgName');

    if (WizardState.plan === 'starter') {
        WizardState.orgType = 'consultorio';
        if(title) {
            title.textContent = 'Tu consultorio';
            desc.textContent = 'Cuéntanos un poco sobre tu práctica médica principal.';
            lblName.textContent = 'Nombre del consultorio *';
            lblSpec.textContent = 'Tu Especialidad';
            lblPhone.textContent = 'Teléfono del consultorio';
            inputName.placeholder = 'Ej. Consultorio Dr. Juan Pérez';
        }
    } else if (WizardState.plan === 'clinica') {
        WizardState.orgType = 'clinica';
        if(title) {
            title.textContent = 'Tu clínica';
            desc.textContent = 'Cuéntanos sobre tu clínica para configurar el espacio de tu equipo médico.';
            lblName.textContent = 'Nombre de la clínica *';
            lblSpec.textContent = 'Especialidad principal';
            lblPhone.textContent = 'Teléfono de la clínica';
            inputName.placeholder = 'Ej. Clínica Santa Fe';
        }
    }
}

function updateSummary() {
    if (!WizardState.plan) return;
    
    // Label translations
    const labels = { starter: 'Doctor Solo', clinica: 'Clínica Pro', hospital: 'Hospital' };
    const price = planPrices[WizardState.billingCycle] ? planPrices[WizardState.billingCycle][WizardState.plan] || 0 : 0;
    
    const sumPlan = document.getElementById('summaryPlan');
    if(sumPlan) sumPlan.textContent = labels[WizardState.plan];
    
    const sumBill = document.getElementById('summaryBilling');
    if(sumBill) sumBill.textContent = WizardState.billingCycle === 'monthly' ? 'Facturación mensual' : 'Facturación anual (ahorra 17%)';
    
    const sumPrice = document.getElementById('summaryPrice');
    if(sumPrice) sumPrice.textContent = `$${price.toLocaleString()}/mes`;
    
    const sumLabel = document.getElementById('summaryLabel');
    if(sumLabel) sumLabel.textContent = WizardState.billingCycle === 'annual' ? 'Precio anual' : 'Después del trial';
}

// ---- Billing toggle ----
window.setBilling = function(cycle) {
    WizardState.billingCycle = cycle;
    document.getElementById('billMonthly').classList.toggle('active', cycle === 'monthly');
    document.getElementById('billAnnual').classList.toggle('active', cycle === 'annual');
}


// ---- Step 3 validation (Async wrapper) ----
window.validateStep3 = async function() {
    clearAllErrors('step3');
    
    const result = Step3Schema.safeParse(WizardState);
    if (!result.success) {
        result.error.issues.forEach(issue => {
            showError(issue.path[0], issue.message);
        });
        showNotification('Corrige los errores para continuar', 'warning');
        return;
    }
    
    // Create the account first, then move to payment
    await createAccountAndProceed();
}

// ---- Create account (Step 3 → Step 4) ----
async function createAccountAndProceed() {
    const btn = document.querySelector('#step3 .btn-primary');
    btn.disabled = true;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-right:8px;"></span> Creando cuenta...';

    if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    try {
        if (typeof API !== 'undefined') {
            const name = (WizardState.userFirst + ' ' + WizardState.userLast).trim();
            await API.register(
                name, 
                WizardState.userEmail, 
                WizardState.userPass, 
                WizardState.orgName, 
                WizardState.orgPhone, 
                WizardState.orgSpecialty, 
                WizardState.userCedula
            );

            // App State logic matching old setup
            localStorage.setItem('nerve_firsttime', '1');
            localStorage.setItem('nerve_email', WizardState.userEmail);
            localStorage.setItem('nerve_name', name);

            document.getElementById('confirmEmail').textContent = WizardState.userEmail;
            
            animateToStep(4);
        } else {
            throw new Error('API no disponible. Intenta de nuevo más tarde.');
        }
    } catch (err) {
        showNotification(err.message || 'Error al crear la cuenta', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ---- Activate with Mercado Pago (Step 4) ----
window.activateWithMercadoPago = async function() {
    if (!WizardState.plan) {
        showNotification('Selecciona un plan primero.', 'warning');
        return;
    }

    const btn = document.getElementById('mpPayButton');
    if(!btn) return;
    
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-right:8px;"></span> Redirigiendo...';

    try {
        const planMap = { starter: 'starter', clinica: 'clinica_pro' };
        const backendPlan = planMap[WizardState.plan] || WizardState.plan;

        const data = await API.createPaymentPreference(backendPlan, WizardState.billingCycle);

        if (data.initPoint) {
            window.location.href = data.initPoint;
        } else {
            throw new Error('No se pudo obtener el enlace de pago');
        }
    } catch (err) {
        showNotification(err.message || 'Error al conectar con Mercado Pago', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ---- Skip payment and start trial ----
window.skipPaymentAndStart = function() {
    localStorage.setItem('nerve_firsttime', '1');
    localStorage.setItem('nerve_role', 'org_owner');
    animateToStep(5);
}

window.setFirstTimeUser = function() {
    localStorage.setItem('nerve_firsttime', '1');
    localStorage.setItem('nerve_role', 'org_owner');
}

window.resendEmail = function(event) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    setTimeout(() => {
        btn.textContent = '✓ Correo enviado';
        setTimeout(() => { btn.textContent = 'Reenviar correo de verificación'; btn.disabled = false; }, 3000);
    }, 1200);
}

// ---- Analytics / Read URL Params ----
(function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam) {
        // Wait for DOM to be ready before selecting if it evaluates quickly
        setTimeout(()=> {
            const card = document.querySelector(`[data-plan="${planParam}"]`);
            if (card) selectPlan(card);
        }, 50);
    }
})();
