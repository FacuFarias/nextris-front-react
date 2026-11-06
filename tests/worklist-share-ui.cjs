// Synthetic data only: intercept every API, including link creation.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SHARE_TEST_BASE || 'http://127.0.0.1:5173';
const staff = { id: 'synthetic', username: 'synthetic', user_type: 'staff',
    role_name: 'tecnico', permissions: ['tabs.worklist.view', 'worklist.share'], requires_password_change: false };
const exams = [
    { guid: 'synthetic-first', patient_name: 'Synthetic First', study_instance_uid: '1.2.3', is_image: true },
    { guid: 'synthetic-second', patient_name: 'Synthetic Second', study_instance_uid: '1.2.4', is_image: true },
    { guid: 'synthetic-empty', patient_name: 'Synthetic Empty', study_instance_uid: '', is_image: false },
    { guid: 'synthetic-uid', patient_name: 'Synthetic UID', study_instance_uid: '1.2.5', is_image: false },
].map(exam => ({ ...exam, patient_id: exam.guid, study_type: 'Synthetic Study', flags: [], tags: [], workflow_state: 'pending' }));

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [], calls = [];
    let user = structuredClone(staff);
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(user => localStorage.setItem('authData', JSON.stringify({ access_token: 'synthetic-token', user })), user);
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        const endpoint = url.pathname.slice(4);
        let data = [];
        if (endpoint === '/auth/me') data = user;
        else if (endpoint === '/config/me/modules') data = { module_codes: ['worklist'], disabled_modules: [], facility_ids: [] };
        else if (endpoint === '/app-config') data = { id: 1, app_name: 'Synthetic', name: 'Synthetic' };
        else if (endpoint.includes('/plan')) data = { plan: null, usage_monthly: {} };
        else if (endpoint === '/examinations/for-reporting') data = { data: exams, total: exams.length, page: 1, per_page: 50, pages: 1 };
        else if (endpoint === '/general/viewer-share-links' || endpoint.endsWith('/case-link')) {
            calls.push({ endpoint, body: route.request().postDataJSON() });
            data = { share_url: 'https://example.invalid/s/synthetic', case_url: 'https://example.invalid/case/synthetic', expires_at: '2026-12-01T00:00:00Z' };
        }
        return route.fulfill({ json: { success: true, data } });
    });
    const openMenu = async name => {
        await page.getByText(name, { exact: true }).filter({ visible: true }).first().click({ button: 'right' });
        await page.getByRole('menuitem', { name: 'Compartir', exact: true }).hover();
        await page.getByRole('menuitem', { name: 'Estudio', exact: true }).waitFor();
    };
    try {
        await page.goto(base + '/worklist');
        await openMenu('Synthetic Second');
        await page.getByRole('menuitem', { name: 'Imágenes', exact: true }).click();
        let dialog = page.getByRole('dialog', { name: 'Compartir imágenes', exact: true });
        await dialog.getByText('Enlace generado', { exact: true }).waitFor();
        assert((await dialog.innerText()).includes('Synthetic Second'));
        assert.equal(calls.length, 1);
        assert.equal(calls[0].body.study_iuid, '1.2.4');
        assert.equal(await page.getByRole('menu').count(), 0);
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
        await openMenu('Synthetic First');
        await page.getByRole('menuitem', { name: 'Estudio', exact: true }).click();
        dialog = page.getByRole('dialog', { name: 'Compartir estudio', exact: true });
        await dialog.getByText('Enlace generado', { exact: true }).waitFor();
        assert.equal(calls.length, 2);
        assert.equal(calls[1].endpoint, '/reports/synthetic-first/case-link');
        assert.equal(await dialog.locator('input[readonly]').inputValue(), 'https://example.invalid/case/synthetic');
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
        console.log('PASS image and Case Link dialogs, clicked study, exactly one request per action');
        await openMenu('Synthetic Empty');
        for (const name of ['Imágenes', 'Estudio']) assert.equal(await page.getByRole('menuitem', { name, exact: true }).getAttribute('aria-disabled'), 'true');
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await openMenu('Synthetic UID');
        assert.equal(await page.getByRole('menuitem', { name: 'Imágenes', exact: true }).getAttribute('aria-disabled'), 'true');
        assert.notEqual(await page.getByRole('menuitem', { name: 'Estudio', exact: true }).getAttribute('aria-disabled'), 'true');
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        console.log('PASS unavailable images and UID states');
        for (const permissions of [['tabs.worklist.view'], ['tabs.worklist.view', 'images.share_link'], ['*']]) {
            user = { ...staff, permissions };
            await page.evaluate(user => localStorage.setItem('authData', JSON.stringify({ access_token: 'synthetic-token', user })), user);
            await page.reload();
            await page.getByText('Synthetic First', { exact: true }).first().click({ button: 'right' });
            await page.getByText('Acciones del estudio', { exact: true }).waitFor();
            assert.equal(await page.getByRole('menuitem', { name: 'Compartir', exact: true }).count(), permissions.includes('*') ? 1 : 0);
            await page.keyboard.press('Escape');
        }
        assert.deepEqual(errors, []);
        console.log('PASS images, Case Link, clicked row, unavailable images/UID, revocation, legacy permission isolation and Sysadmin');
    } catch (error) {
        console.error(error);
        if (!page.isClosed()) console.error('Page:', page.url(), (await page.locator('body').innerText().catch(() => '')).slice(0, 2500), errors);
        throw error;
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exit(1); });
