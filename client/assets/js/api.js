// ================================================
// NERVE Health Systems — API Client
// Connects frontend to backend REST API
// ================================================

const API = (() => {
    // The base URL for the API
    // Auto-detects if we are running locally or in production (Hostinger VPS)
    const isProd = window.location.hostname === 'nervehealthsystems.com' || window.location.hostname === 'www.nervehealthsystems.com';
    const BASE_URL = isProd
        ? 'https://nervehealthsystems.com/api'
        : 'http://localhost:3001/api';

    let accessToken = localStorage.getItem('nerve_token') || null;
    let refreshToken = localStorage.getItem('nerve_refresh') || null;

    // ---- Token Management ----
    function setTokens(access, refresh) {
        accessToken = access;
        refreshToken = refresh;
        localStorage.setItem('nerve_token', access);
        localStorage.setItem('nerve_refresh', refresh);
    }

    function clearTokens() {
        accessToken = null;
        refreshToken = null;
        localStorage.removeItem('nerve_token');
        localStorage.removeItem('nerve_refresh');
        localStorage.removeItem('nerve_user');
    }

    function getUser() {
        try {
            return JSON.parse(localStorage.getItem('nerve_user'));
        } catch { return null; }
    }

    function setUser(user) {
        localStorage.setItem('nerve_user', JSON.stringify(user));
    }

    function isLoggedIn() {
        return !!accessToken;
    }

    // ---- Core Fetch Wrapper ----
    async function request(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        let res = await fetch(url, config);

        // If token expired, try refresh
        if (res.status === 401 && refreshToken) {
            const refreshed = await tryRefresh();
            if (refreshed) {
                config.headers.Authorization = `Bearer ${accessToken}`;
                res = await fetch(url, config);
            } else {
                clearTokens();
                window.location.href = 'app.html';
                throw new Error('Sesión expirada');
            }
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error del servidor');
        }

        return data;
    }

    async function tryRefresh() {
        try {
            const res = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            setTokens(data.accessToken, data.refreshToken);
            return true;
        } catch {
            return false;
        }
    }

    // ---- Generic Methods ----
    async function get(endpoint, options = {}) {
        return request(endpoint, { ...options, method: 'GET' });
    }
    async function post(endpoint, body = {}, options = {}) {
        return request(endpoint, { ...options, method: 'POST', body });
    }
    async function put(endpoint, body = {}, options = {}) {
        return request(endpoint, { ...options, method: 'PUT', body });
    }
    async function patch(endpoint, body = {}, options = {}) {
        return request(endpoint, { ...options, method: 'PATCH', body });
    }
    async function _delete(endpoint, options = {}) {
        return request(endpoint, { ...options, method: 'DELETE' });
    }

    // ---- Auth ----
    async function login(email, password) {
        const data = await request('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        setTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        return data.user;
    }

    async function register(name, email, password, orgName, phone, specialty, license) {
        const data = await request('/auth/register', {
            method: 'POST',
            body: { name, email, password, orgName, phone, specialty, license },
        });
        setTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        return data.user;
    }

    async function registerInvite(data) {
        const resData = await request('/auth/register-invite', {
            method: 'POST',
            body: data,
        });
        setTokens(resData.accessToken, resData.refreshToken);
        setUser(resData.user);
        return resData.user;
    }

    async function getMe() {
        return request('/auth/me');
    }

    function logout() {
        clearTokens();
        window.location.href = 'app.html';
    }

    // ---- Patients ----
    async function getPatients(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/patients${query ? '?' + query : ''}`);
    }

    async function getPatient(id) {
        return request(`/patients/${id}`);
    }

    async function createPatient(data) {
        return request('/patients', { method: 'POST', body: data });
    }

    async function updatePatient(id, data) {
        return request(`/patients/${id}`, { method: 'PUT', body: data });
    }

    async function updatePatientInfo(id, data) {
        return request(`/patients/${id}/info`, { method: 'PUT', body: data });
    }

    async function deletePatient(id) {
        return request(`/patients/${id}`, { method: 'DELETE' });
    }

    // ---- Appointments ----
    async function getAppointments(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/appointments${query ? '?' + query : ''}`);
    }

    async function createAppointment(data) {
        return request('/appointments', { method: 'POST', body: data });
    }

    async function updateAppointment(id, data) {
        return request(`/appointments/${id}`, { method: 'PUT', body: data });
    }

    async function deleteAppointment(id) {
        return request(`/appointments/${id}`, { method: 'DELETE' });
    }

    // ---- Prescriptions ----
    async function getPrescriptions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/prescriptions${query ? '?' + query : ''}`);
    }

    async function createPrescription(data) {
        return request('/prescriptions', { method: 'POST', body: data });
    }

    async function updatePrescription(id, data) {
        return request(`/prescriptions/${id}`, { method: 'PUT', body: data });
    }

    // ---- Users ----
    async function getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/users${query ? '?' + query : ''}`);
    }

    async function inviteUser(data) {
        return request('/users/invite', { method: 'POST', body: data });
    }

    async function createUser(data) {
        return request('/users/create', { method: 'POST', body: data });
    }

    async function updateUser(id, data) {
        return request(`/users/${id}`, { method: 'PUT', body: data });
    }

    async function deleteUser(id) {
        return request(`/users/${id}`, { method: 'DELETE' });
    }

    // ---- Organizations ----
    async function getOrganizations() {
        return request('/organizations');
    }

    async function getOrganization(id) {
        return request(`/organizations/${id}`);
    }

    async function updateOrganization(id, data) {
        return request(`/organizations/${id}`, { method: 'PUT', body: data });
    }

    // ---- Departments ----
    async function getDepartments() {
        return request('/departments');
    }

    async function createDepartment(data) {
        return request('/departments', { method: 'POST', body: data });
    }

    async function deleteDepartment(id) {
        return request(`/departments/${id}`, { method: 'DELETE' });
    }

    // ---- Admin ----
    async function getAdminStats() {
        return request('/admin/stats');
    }

    async function getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/admin/audit${query ? '?' + query : ''}`);
    }

    async function updateOrgPlan(orgId, data) {
        return request(`/admin/organizations/${orgId}/plan`, { method: 'PUT', body: data });
    }

    async function getOrganizationUsers(orgId) {
        return request(`/organizations/${orgId}/users`);
    }

    async function getOrganizationAudit(orgId) {
        return request(`/admin/organizations/${orgId}/audit`);
    }

    // ---- Health Check ----
    async function healthCheck() {
        try {
            const res = await fetch(`${BASE_URL}/health`);
            return res.ok;
        } catch {
            return false;
        }
    }

    // ---- Public Interface ----
    return {
        // Auth
        login, register, registerInvite, logout, getMe, isLoggedIn, getUser, setUser,
        // Patients
        getPatients, getPatient, createPatient, updatePatient, updatePatientInfo, deletePatient,
        // Appointments
        getAppointments, createAppointment, updateAppointment, deleteAppointment,
        // Prescriptions
        getPrescriptions, createPrescription, updatePrescription,
        // Users
        getUsers, inviteUser, createUser, updateUser, deleteUser,
        getUserById: (id) => request(`/users/${id}`),
        // Organizations
        getOrganizations, getOrganization, updateOrganization,
        getOrganizationUsers, getOrganizationAudit,
        // Departments
        getDepartments, createDepartment, deleteDepartment,
        // Admin
        getAdminStats, getAuditLogs, updateOrgPlan,
        // Generic
        get, post, put, patch, delete: _delete,
        // Utility
        healthCheck, clearTokens, request,
    };
})();
