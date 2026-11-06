// Synthetic sessions only. All APIs are intercepted; no patient records are accessed.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PATIENT_TEST_BASE || 'http://127.0.0.1:5173';
const operator = { id: 'operator-id', username: 'operator', name: 'Operador', surname: 'Prueba',
    user_type: 'Sysadmin', permissions: ['*'], requires_password_change: false };
const patient = { guid: 'portal-id', username: 'patient', name: 'Paciente Prueba', status: 'Active', is_active: true };

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    try {
        const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
        const page = await context.newPage();
        const errors = [];
        const switches = [];
        let denied = true;
        let logoutCalls = 0;
        let currentUser = operator;
        await context.addInitScript(user => {
            if (!localStorage.getItem('authData')) localStorage.setItem('authData', JSON.stringify({
                access_token: 'operator-access', refresh_token: 'operator-refresh', user,
            }));
        }, operator);
        page.on('pageerror', error => errors.push(error.message));
        await context.route('**/*', async route => {
            const url = new URL(route.request().url());
            if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
            if (!url.pathname.startsWith('/api/')) return route.continue();
            const endpoint = url.pathname.slice(4);
            let data = [];
            if (endpoint === '/auth/me') data = currentUser;
            else if (endpoint === '/config/me/modules') data = { module_codes: ['patient_portal'], disabled_modules: [], facility_ids: [] };
            else if (endpoint === '/app-config') data = { id: 1, name: 'Synthetic NextRIS' };
            else if (endpoint === '/config/patients') return route.fulfill({ json: {
                success: true,
                data: [patient, { ...patient, guid: 'inactive', username: 'inactive', is_active: false }],
                total: 2, page: 1, per_page: Number(url.searchParams.get('per_page')), pages: 1,
            } });
            else if (endpoint === '/config/users') data = [{ ...operator, guid: operator.id, role: 'Sysadmin', is_active: true }];
            else if (endpoint === '/auth/impersonate') {
                switches.push(route.request().postDataJSON());
                if (denied) return route.fulfill({ status: 404, json: { success: false, message: 'Cuenta del paciente no encontrada o inactiva' } });
                currentUser = { id: patient.guid, username: patient.username, name: patient.name, surname: '',
                    user_type: 'patient', permissions: [], requires_password_change: false,
                    impersonation: { actor_id: operator.id, actor_username: operator.username, session_id: 'synthetic-audit' } };
                data = { access_token: 'patient-access', refresh_token: 'patient-refresh', user: currentUser };
            } else if (endpoint === '/auth/logout') { logoutCalls++; }
            else if (endpoint === '/patient-portal/my-profile') data = { full_name: patient.name };
            else if (endpoint.startsWith('/patient-portal/my-studies')) data = { data: [], total: 0, page: 1, pages: 0 };
            return route.fulfill({ json: { success: true, data } });
        });
        const openPatients = async () => {
            await page.goto(base + '/configuraciones/tablas');
            await page.getByRole('tab', { name: 'Usuarios / Personal', exact: true }).click();
            await page.getByRole('tab', { name: 'Gestion de Pacientes', exact: true }).click();
            await page.getByRole('heading', { name: 'Gestión de Pacientes', exact: true }).waitFor();
        };
        await openPatients();
        let actions = page.getByRole('button', { name: 'Conectarse como paciente', exact: true });
        await actions.first().waitFor();
        assert.equal(await actions.count(), 2);
        assert.equal(await actions.nth(1).isDisabled(), true);
        await actions.first().click();
        let dialog = page.getByRole('dialog', { name: 'Conectarse como paciente', exact: true });
        await dialog.getByText(/al portal del paciente/).waitFor();
        await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
        assert.equal(switches.length, 0);
        await actions.first().click();
        await dialog.getByRole('button', { name: 'Conectarme como este paciente', exact: true }).click();
        await page.getByText('Cuenta del paciente no encontrada o inactiva', { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.authData).user.id), operator.id);
        denied = false;
        await dialog.getByRole('button', { name: 'Conectarme como este paciente', exact: true }).click();
        await page.waitForURL(base + '/inicio');
        await page.getByText('operator conectado como patient', { exact: true }).waitFor();
        assert.deepEqual(switches[1], { target_user_id: patient.guid, target_type: 'patient', refresh_token: 'operator-refresh' });
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.authData).access_token), 'patient-access');
        await page.reload();
        await page.getByText('operator conectado como patient', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Desconectarse', exact: true }).click();
        await page.waitForURL(base + '/');
        assert.equal(logoutCalls, 1);
        assert.equal(await page.evaluate(() => localStorage.getItem('authData')), null);

        // Configuration access alone must not grant session switching.
        currentUser = { ...operator, permissions: ['tabs.config.view'] };
        await page.evaluate(user => localStorage.setItem('authData', JSON.stringify({ access_token: 'limited', refresh_token: 'limited', user })), currentUser);
        await openPatients();
        assert.equal(await page.getByRole('button', { name: 'Conectarse como paciente', exact: true }).count(), 0);
        assert.deepEqual(errors, []);
        await context.close();
        console.log('Patient switching UI passed: active/inactive accounts, cancel, error, redirect, persistence, logout, permissions.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
