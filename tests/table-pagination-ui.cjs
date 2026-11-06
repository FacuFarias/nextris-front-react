// Exercise the real user table with synthetic data; all API requests are intercepted.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PAGINATION_TEST_BASE || 'http://127.0.0.1:5173';
const operator = {
    id: 'synthetic-operator', username: 'synthetic-operator', user_type: 'Sysadmin',
    role_id: 'sysadmin', role_name: 'sysadmin', name: 'Synthetic', surname: 'Operator',
    permissions: ['*'], requires_password_change: false,
};
const users = Array.from({ length: 45 }, (_, index) => ({
    guid: `synthetic-${index + 1}`, username: `synthetic-${String(index + 1).padStart(3, '0')}`,
    name: index < 4 ? 'Subset' : 'Other', surname: 'Synthetic',
    role: index < 17 ? 'Medico' : 'Tecnico', role_id: index < 17 ? 'medico' : 'tecnico',
    email: '', phone: '', national_number: '', is_active: true,
}));

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(user => localStorage.setItem('authData', JSON.stringify({
        access_token: 'synthetic-not-a-real-token', refresh_token: 'synthetic', user,
    })), operator);
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        const endpoint = url.pathname.slice(4);
        let data = [];
        if (endpoint === '/auth/me') data = operator;
        else if (endpoint === '/config/me/modules') data = { module_codes: [], disabled_modules: [], facility_ids: [] };
        else if (endpoint === '/app-config') data = { id: 1, name: 'Synthetic NextRIS', app_name: 'NextRIS', logo_url: null };
        else if (endpoint === '/config/users') data = users;
        else if (endpoint.includes('/plan')) data = { plan: null, usage_monthly: {} };
        return route.fulfill({ json: { success: true, data } });
    });
    const button = name => page.getByRole('button', { name, exact: true });
    const rows = page.locator('tbody tr[data-row-kind="measure"]');
    const checkTotal = count => page.getByText(`${count} ${count === 1 ? 'resultado' : 'resultados'}`, { exact: true }).waitFor();
    const filter = async (header, value) => {
        await header.locator('button').filter({ has: page.locator('svg.lucide-search') }).click({ force: true });
        await header.locator('input').fill(value);
        await header.locator('input').press('Enter');
    };
    const clear = header => header.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();
    try {
        await page.goto(base + '/configuraciones/tablas');
        await page.getByRole('tab', { name: 'Usuarios / Personal', exact: true }).click();
        await checkTotal(45);
        // Capture header positions before filter text replaces their labels.
        const headers = page.locator('thead th');
        const headerFor = async label => headers.nth(await headers.evaluateAll((nodes, text) =>
            nodes.findIndex(node => node.textContent.trim() === text), label));
        const role = await headerFor('ROL');
        const name = await headerFor('NOMBRE');
        const username = await headerFor('USUARIO');

        await button('3').click();
        await button('4').click();
        await filter(role, 'medic');
        await checkTotal(17);
        assert.equal(await rows.count(), 8);
        assert.equal(await button('4').count(), 0);
        assert.equal(await button('Ir a la primera página').isDisabled(), true);
        await button('Ir a la última página').click();
        assert.equal(await rows.count(), 1);
        assert.match(await rows.first().innerText(), /synthetic-017/);
        assert.equal((await rows.first().locator('td').allTextContents())[2].trim(), '17');
        assert.equal(await button('Ir a la página siguiente').isDisabled(), true);
        console.log('PASS filtering from page 4 updates total, page count, row indices and last-page navigation');

        await filter(name, 'subset');
        await checkTotal(4);
        assert.equal(await rows.count(), 4);
        assert.equal(await button('2').count(), 0);
        assert.equal(await button('Ir a la primera página').isDisabled(), true);
        await filter(name, 'nonexistent');
        await checkTotal(0);
        await page.getByText('No hay datos disponibles', { exact: true }).waitFor();
        for (const direction of ['primera', 'anterior', 'siguiente', 'última']) {
            const label = ['anterior', 'siguiente'].includes(direction)
                ? `Ir a la página ${direction}` : `Ir a la ${direction} página`;
            assert.equal(await button(label).isDisabled(), true);
        }
        await clear(name);
        await checkTotal(17);
        await button('2').click();
        await clear(role);
        await checkTotal(45);
        assert.equal(await button('Ir a la primera página').isDisabled(), true);
        console.log('PASS combined filters, zero results and clearing filters');

        await button('3').click();
        await button('4').click();
        await filter(username, 'synthetic-00');
        await checkTotal(9);
        assert.equal(await button('3').count(), 0);
        await button('2').click();
        assert.equal(await rows.count(), 1);
        await clear(username);
        await checkTotal(45);
        await page.getByRole('combobox').click();
        await page.getByRole('option', { name: '5', exact: true }).click();
        assert.equal(await rows.count(), 5);
        await button('Ir a la última página').click();
        assert.match(await rows.last().innerText(), /synthetic-045/);
        assert.equal(await button('Ir a la página siguiente').isDisabled(), true);
        assert.deepEqual(errors, []);
        console.log('PASS first-column filters and page-size changes');
    } catch (error) {
        await page.screenshot({ path: '/tmp/nextris-table-pagination-failure.png', fullPage: true });
        console.error('UI URL', page.url(), 'ERRORS', errors);
        console.error((await page.locator('body').innerText()).slice(-3000));
        throw error;
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
