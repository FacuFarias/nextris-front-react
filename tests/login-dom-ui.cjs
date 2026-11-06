// Synthetic accounts only. All API traffic is intercepted; no real login is sent.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.PATIENT_TEST_BASE || 'http://127.0.0.1:5173';
const user = { id: 'synthetic-login', username: 'synthetic', name: 'Paciente', surname: 'Sintético',
    email: 'patient@example.invalid', user_type: 'patient', role_id: 'patient', role_name: 'patient',
    permissions: [], requires_password_change: false };

// Browser translators replace React-owned text nodes with <font> elements.
async function translateButton(button) {
    return button.evaluate(element => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) {
            if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
        }
        for (const node of nodes) {
            const font = document.createElement('font');
            font.textContent = node.textContent;
            node.replaceWith(font);
        }
        return nodes.length;
    });
}

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    try {
        for (const width of [390, 1440]) {
            const context = await browser.newContext({ viewport: { width, height: 844 } });
            const page = await context.newPage();
            page.setDefaultTimeout(30000);
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            let loginCalls = 0;
            let successfulLogin = false;
            let releaseLogin;
            await context.route('**/*', async route => {
                const url = new URL(route.request().url());
                if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
                if (!url.pathname.startsWith('/api/')) return route.continue();
                if (url.pathname === '/api/auth/login') {
                    loginCalls++;
                    await new Promise(resolve => { releaseLogin = resolve; });
                    if (successfulLogin) return route.fulfill({ json: { success: true, data: {
                        access_token: 'synthetic', refresh_token: 'synthetic', user, message: 'Inicio de sesión exitoso',
                    } } });
                    return route.fulfill({ status: 401, json: { success: false, message: 'Credenciales inválidas' } });
                }
                if (url.pathname === '/api/auth/me') return route.fulfill({ json: { success: true, data: user } });
                if (url.pathname === '/api/config/me/modules') return route.fulfill({ json: { success: true,
                    data: { module_codes: ['patient_portal'], disabled_modules: [], facility_ids: [] } } });
                if (url.pathname === '/api/patient-portal/my-profile') return route.fulfill({ json: { success: true,
                    data: { full_name: 'Paciente Sintético', email: user.email, email_verified: true } } });
                if (url.pathname === '/api/patient-portal/my-studies') return route.fulfill({ json: { success: true,
                    data: { data: [], total: 0, page: 1, per_page: 10, pages: 0 } } });
                return route.fulfill({ json: { success: true, data: {} } });
            });
            try {
                await page.goto(base + '/pacientes');
                for (const patient of [true, false, true]) {
                    await page.getByRole('button', { name: patient ? 'Paciente' : 'Personal Médico', exact: true }).click();
                    const button = page.locator('button[type="submit"]');
                    await page.getByLabel(patient ? 'ID del paciente' : 'Usuario médico', { exact: true }).fill('synthetic');
                    await page.getByLabel('Contraseña', { exact: true }).fill('invalid-synthetic');
                    assert(await translateButton(button) > 0);
                    const requestPromise = page.waitForRequest('**/api/auth/login');
                    await button.click();
                    await page.waitForFunction(() => document.querySelector('button[type="submit"]')?.disabled || document.body.textContent.includes('removeChild'));
                    assert.equal(await page.getByText('Unexpected Application Error!', { exact: true }).count(), 0,
                        'Login crashed after a translator replaced its text: ' + (await page.locator('body').innerText()).slice(0, 500));
                    const request = await requestPromise;
                    assert.equal(request.postDataJSON().user_type, patient ? 'patient' : 'staff');
                    assert(await translateButton(button) > 0);
                    releaseLogin();
                    await button.waitFor({ state: 'visible' });
                    await page.waitForFunction(() => document.querySelector('button[type="submit"]')?.disabled === false);
                    assert.equal(await page.getByText('Unexpected Application Error!', { exact: true }).count(), 0);
                    assert(await page.getByRole('heading', { name: patient ? 'Portal del Paciente' : 'Portal Médico', exact: true }).isVisible());
                    assert(await page.getByText('Credenciales inválidas. Por favor, intenta de nuevo.', { exact: true }).first().isVisible());
                    assert.equal(await button.innerText(), patient ? 'Acceder a mis estudios' : 'Ingresar al Sistema');
                }
                assert.equal(loginCalls, 3);
                assert.equal(await page.locator('html').getAttribute('translate'), 'no');
                assert.equal(await page.locator('meta[name="google"]').getAttribute('content'), 'notranslate');
                successfulLogin = true;
                const button = page.locator('button[type="submit"]');
                assert(await translateButton(button) > 0);
                const requestPromise = page.waitForRequest('**/api/auth/login');
                await button.click();
                await requestPromise;
                assert(await translateButton(button) > 0);
                releaseLogin();
                await page.waitForURL('**/estudios');
                await page.getByRole('heading', { name: 'Paciente Sintético', exact: true }).waitFor();
                await page.getByText('No se encontraron estudios', { exact: true }).waitFor();
                assert.equal(loginCalls, 4);
                assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('authData')).user.id), user.id);
                assert.deepEqual(errors, []);
                console.log(`Translated login: retries, portal switching and successful patient access OK (${width}px)`);
            } catch (error) {
                console.error('Synthetic login page:', (await page.locator('body').innerText()).slice(0, 1000));
                console.error('Browser errors:', errors);
                throw error;
            } finally {
                if (releaseLogin) releaseLogin();
                await context.close();
            }
        }
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
