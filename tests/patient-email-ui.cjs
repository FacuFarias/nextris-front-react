// Synthetic fixtures; API is intercepted and no email is sent.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    try {
        for (const width of [1400, 390]) {
          for (const verificationEnabled of [true, false]) {
            const context = await browser.newContext({ viewport: { width, height: 1000 } });
            const user = { id: 'synthetic', username: 'synthetic', user_type: 'patient', permissions: [], requires_password_change: true };
            await context.addInitScript(user => localStorage.setItem('authData', JSON.stringify({ access_token: 'synthetic', user })), user);
            let profile = { full_name: 'Paciente de prueba', email: '', email_verified: false, email_verification_enabled: verificationEnabled, can_change_password: false };
            let sent = 0;
            await context.route('**/api/**', route => {
                const path = new URL(route.request().url()).pathname;
                let data = [];
                if (path === '/api/auth/me') data = user;
                if (path === '/api/config/me/modules') data = { module_codes: ['patient_portal'], disabled_modules: [], facility_ids: [] };
                if (path === '/api/patient-portal/my-profile') {
                    if (route.request().method() === 'PUT') profile = { ...profile, ...route.request().postDataJSON(), email_verified: false };
                    profile.can_change_password = verificationEnabled ? profile.email_verified : !!profile.email;
                    data = profile;
                }
                if (path.endsWith('/email-verification/send')) {
                    sent++;
                    return route.fulfill({ json: { success: true, message: 'Código enviado' } });
                }
                if (path.endsWith('/email-verification/confirm')) {
                    if (route.request().postDataJSON().code !== '123456') return route.fulfill({ status: 400, json: { success: false, message: 'Código incorrecto' } });
                    profile.email_verified = true;
                    return route.fulfill({ json: { success: true, message: 'Email validado correctamente' } });
                }
                return route.fulfill({ json: { success: true, data } });
            });
            const page = await context.newPage();
            page.setDefaultTimeout(10000);
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto((process.env.PATIENT_TEST_BASE || 'http://127.0.0.1:5173') + '/mis-datos');
            const change = page.getByRole('button', { name: 'Cambiar contraseña', exact: true });
            await change.waitFor();
            assert(await change.isDisabled());
            if (verificationEnabled) assert(await page.getByRole('button', { name: 'Validar email', exact: true }).isDisabled());
            else assert.equal(await page.getByRole('button', { name: 'Validar email', exact: true }).count(), 0);
            const editEmail = async email => {
                const field = page.locator('.group').filter({ has: page.getByText('Email', { exact: true }) });
                await field.getByRole('button', { name: 'Editar' }).click({ force: true });
                await page.getByPlaceholder('ejemplo@email.com').fill(email);
                await field.getByRole('button').nth(0).click();
                await page.getByText(email, { exact: true }).waitFor();
            };
            await editEmail('patient@example.invalid');
            if (verificationEnabled) {
            await page.getByRole('button', { name: 'Validar email', exact: true }).click();
            await page.getByText('Código enviado', { exact: true }).waitFor();
            assert.equal(sent, 1);
            await page.getByLabel('Código de validación del email').fill('000000');
            await page.getByRole('button', { name: 'Confirmar código', exact: true }).click();
            await page.getByText('Código incorrecto', { exact: true }).waitFor();
            assert(await change.isDisabled());
            await page.getByLabel('Código de validación del email').fill('123456');
            await page.getByRole('button', { name: 'Confirmar código', exact: true }).click();
            await page.getByText('Email validado', { exact: true }).waitFor();
            } else {
                assert.equal(sent, 0);
                assert.equal(await page.getByLabel('Código de validación del email').count(), 0);
            }
            assert(await change.isEnabled());
            await change.click();
            await page.getByLabel('Contraseña actual', { exact: true }).waitFor();
            await page.keyboard.press('Escape');
            await editEmail('other@example.invalid');
            assert.equal(await change.isDisabled(), verificationEnabled);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
            assert.deepEqual(errors, []);
            console.log(`Patient email UI OK (${width}px, verification ${verificationEnabled ? "enabled" : "disabled"})`);
            await context.close();
          }
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
