// Exercise server pagination with synthetic API responses; no real patient data.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PAGINATION_TEST_BASE || 'http://127.0.0.1:5173';
const operator = { id: 'synthetic-operator', username: 'synthetic-operator', user_type: 'Sysadmin',
    name: 'Synthetic', surname: 'Operator', permissions: ['*'], requires_password_change: false };
const patients = Array.from({ length: 23 }, (_, index) => ({
    guid: `synthetic-${index + 1}`, username: `synthetic-${String(index + 1).padStart(3, '0')}`,
    name: index < 4 ? 'Subset Synthetic' : 'Other Synthetic', is_active: true,
}));

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    try {
        const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
        const page = await context.newPage();
        const requests = [];
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await context.addInitScript(user => localStorage.setItem('authData', JSON.stringify({
            access_token: 'synthetic', refresh_token: 'synthetic', user,
        })), operator);
        await context.route('**/*', route => {
            const url = new URL(route.request().url());
            if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
            if (!url.pathname.startsWith('/api/')) return route.continue();
            const endpoint = url.pathname.slice(4);
            let data = [];
            if (endpoint === '/config/patients') {
                const params = Object.fromEntries(url.searchParams);
                requests.push(params);
                const pageSize = Number(params.per_page);
                assert.ok(pageSize >= 1 && pageSize <= 100, 'Every request must be bounded');
                const filters = JSON.parse(params.column_filters);
                let filtered = patients.filter(row => Object.entries(filters).every(([key, value]) =>
                    String(row[key] ?? '').toLowerCase().includes(value.trim().toLowerCase())));
                if (params.sort_column) filtered = [...filtered].sort((a, b) =>
                    String(a[params.sort_column]).localeCompare(String(b[params.sort_column])) *
                    (params.sort_direction === 'desc' ? -1 : 1));
                const pages = Math.ceil(filtered.length / pageSize);
                const current = Math.min(Number(params.page), Math.max(1, pages));
                return route.fulfill({ json: { success: true,
                    data: filtered.slice((current - 1) * pageSize, current * pageSize),
                    total: filtered.length, page: current, per_page: pageSize, pages } });
            }
            if (endpoint === '/auth/me') data = operator;
            else if (endpoint === '/config/me/modules') data = { module_codes: [], disabled_modules: [], facility_ids: [] };
            else if (endpoint === '/app-config') data = { id: 1, name: 'Synthetic NextRIS' };
            return route.fulfill({ json: { success: true, data } });
        });
        const button = name => page.getByRole('button', { name, exact: true });
        const rowSelector = 'tbody tr[data-row-kind="measure"]:has(td:nth-child(2))';
        const rows = page.locator(rowSelector);
        const settled = () => page.waitForFunction(() => !document.querySelector('svg.animate-spin'));
        const expectRows = async count => {
            await settled();
            await page.waitForFunction(({ selector, n }) => document.querySelectorAll(selector).length === n,
                { selector: rowSelector, n: count });
        };
        const total = count => page.getByText(`${count} resultados`, { exact: true }).waitFor();
        await page.goto(base + '/configuraciones/tablas');
        await page.getByRole('tab', { name: 'Usuarios / Personal', exact: true }).click();
        await page.getByRole('tab', { name: 'Gestion de Pacientes', exact: true }).click();
        await total(23);
        await expectRows(8);
        assert.equal(requests[0].page, '1');
        assert.equal(requests[0].per_page, '8');
        await button('Ir a la página siguiente').click();
        await page.getByText('synthetic-009', { exact: true }).waitFor();
        assert.equal(requests.at(-1).page, '2');
        assert.equal((await rows.first().locator('td').allTextContents())[2].trim(), '9');
        await page.getByRole('combobox').click();
        await page.getByRole('option', { name: '5', exact: true }).click();
        await expectRows(5);
        assert.equal(requests.at(-1).per_page, '5');
        assert.equal(requests.at(-1).page, '1');
        await button('Ir a la última página').click();
        await page.getByText('synthetic-023', { exact: true }).waitFor();
        await expectRows(3);
        assert.equal(requests.at(-1).page, '5');
        assert.equal(await button('Ir a la página siguiente').isDisabled(), true);
        console.log('PASS bounded requests, page navigation, row indices, page size and last page');

        const headers = page.locator('thead th');
        const headerFor = async label => headers.nth(await headers.evaluateAll((nodes, text) =>
            nodes.findIndex(node => node.textContent.trim() === text), label));
        const name = await headerFor('NOMBRE');
        const username = await headerFor('USUARIO');
        await name.locator('button').filter({ has: page.locator('svg.lucide-search') }).click({ force: true });
        await name.locator('input').fill('Subset');
        await name.locator('input').press('Enter');
        await total(4);
        await expectRows(4);
        assert.equal(requests.at(-1).page, '1');
        assert.equal(JSON.parse(requests.at(-1).column_filters).name, 'Subset');
        await name.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();
        await total(23);
        await expectRows(5);
        await button('Ir a la página siguiente').click();
        await page.getByText('synthetic-006', { exact: true }).waitFor();
        await username.click(); // ascending
        await page.getByText('synthetic-001', { exact: true }).waitFor();
        await username.click(); // descending across the entire dataset
        await page.getByText('synthetic-023', { exact: true }).waitFor();
        assert.equal(requests.at(-1).sort_column, 'username');
        assert.equal(requests.at(-1).sort_direction, 'desc');
        assert.equal(requests.at(-1).page, '1');
        assert.match(await rows.first().innerText(), /synthetic-023/);
        await name.locator('button').filter({ has: page.locator('svg.lucide-search') }).click({ force: true });
        await name.locator('input').fill('nonexistent');
        await name.locator('input').press('Enter');
        await total(0);
        await page.getByText('No hay datos disponibles', { exact: true }).waitFor();
        assert.equal(await button('Ir a la página siguiente').isDisabled(), true);
        assert.deepEqual(errors, []);
        console.log('PASS global filtering and sorting, page resets and zero results');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
