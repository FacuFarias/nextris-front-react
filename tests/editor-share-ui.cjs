// Synthetic data only: intercept every API, including link creation.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SHARE_TEST_BASE || 'http://127.0.0.1:5173';
const staff = { id: 'synthetic', username: 'synthetic', user_type: 'staff',
    role_name: 'tecnico', permissions: ['reports.write', 'reports.sign', 'worklist.share'], requires_password_change: false };

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [], calls = [], writes = [];
    let user = structuredClone(staff);
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(user => localStorage.setItem('authData', JSON.stringify({ access_token: 'synthetic-token', user })), user);
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        const endpoint = url.pathname.slice(4);
        if ((endpoint.endsWith('/report') && route.request().method() !== 'GET') || endpoint.endsWith('/sign')) writes.push(endpoint);
        let data = [];
        if (endpoint === '/auth/me') data = user;
        else if (endpoint === '/config/me/modules') data = { module_codes: ['worklist'], disabled_modules: [], facility_ids: [] };
        else if (endpoint === '/app-config') data = { id: 1, app_name: 'Synthetic', name: 'Synthetic' };
        else if (endpoint.includes('/plan')) data = { plan: null, usage_monthly: {} };
        else if (endpoint === '/examinations/synthetic-first/report') data = {
            exam_id: 'synthetic-first', guid: 'synthetic-report', patient_name: 'Synthetic First',
            patient_id: 'synthetic-patient', study_type_description: 'Synthetic Study',
            study_reason: '<p>Synthetic reason</p>', content: '<p>Synthetic findings</p>', conclusion: '<p>Synthetic conclusion</p>',
            was_saved: true, is_reported: false, flags: [], tag_ids: [], workflow_state: 'pending',
        };
        else if (endpoint === '/general/viewer-share-links' || endpoint.endsWith('/case-link')) {
            calls.push({ endpoint, body: route.request().postDataJSON() });
            data = { share_url: 'https://example.invalid/s/synthetic', case_url: 'https://example.invalid/case/synthetic', expires_at: '2026-12-01T00:00:00Z' };
        }
        return route.fulfill({ json: { success: true, data } });
    });
    const openEditor = async (uid = '1.2.3') => {
        await page.goto(base + '/worklist/redactar-informe/synthetic-first' + (uid ? '/' + uid : ''));
        await page.getByRole('button', { name: /FIRMAR/ }).waitFor();
    };
    try {
        await openEditor();
        const share = page.getByRole('button', { name: 'Compartir', exact: true });
        assert.equal((await share.innerText()).trim(), '');
        const sign = page.getByRole('button', { name: /FIRMAR/ });
        assert(await share.evaluate((node, sign) => Boolean(node.compareDocumentPosition(sign) & Node.DOCUMENT_POSITION_FOLLOWING), await sign.elementHandle()));
        await share.click();
        await page.getByRole('menuitem', { name: 'Estudio', exact: true }).click();
        let dialog = page.getByRole('dialog', { name: 'Compartir estudio', exact: true });
        await dialog.getByText('Enlace generado', { exact: true }).waitFor();
        assert.equal(calls.length, 1);
        assert.equal(calls[0].endpoint, '/reports/synthetic-first/case-link');
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
        await share.click();
        await page.getByRole('menuitem', { name: 'Imágenes', exact: true }).click();
        dialog = page.getByRole('dialog', { name: 'Compartir imágenes', exact: true });
        await dialog.getByText('Enlace generado', { exact: true }).waitFor();
        assert.equal(calls.length, 2);
        assert.equal(calls[1].body.study_iuid, '1.2.3');
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
        console.log('PASS icon-only button before Sign, Case Link and image sharing without signing/saving');
        await openEditor('');
        await share.click();
        for (const name of ['Estudio', 'Imágenes']) assert.equal(await page.getByRole('menuitem', { name, exact: true }).getAttribute('aria-disabled'), 'true');
        await page.keyboard.press('Escape');
        user = { ...staff, permissions: ['reports.write', 'reports.sign'] };
        await openEditor();
        assert.equal(await share.count(), 0);
        assert.equal(calls.length, 2);
        assert.deepEqual(errors, []);
        assert.deepEqual(writes, []);
        console.log('PASS missing UID disables sharing and revoked permission hides button');
    } catch (error) {
        console.error('Page:', page.url(), await page.locator('body').innerText().catch(() => ''), errors);
        throw error;
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
