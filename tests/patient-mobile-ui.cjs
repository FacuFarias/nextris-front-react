// Synthetic fixtures only; every API request is intercepted.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PATIENT_TEST_BASE || 'http://127.0.0.1:5173';
const examId = '00000000-0000-4000-8000-000000000001';
const user = { id: 'synthetic-mobile', username: 'Paciente de prueba', name: 'Paciente',
    user_type: 'patient', role_name: 'patient', role_id: 'patient', permissions: [], requires_password_change: false };
const longName = 'Paciente Sintético ' + 'ApellidoExtenso'.repeat(8);
const description = 'Resonancia de columna cervical y dorsal con descripción extensa ' + 'Referencia'.repeat(10);
const study = { examination_id: examId, patient_name: longName, patient_id: '123', study_type: description,
    accession_number: 'ACC-123', study_date: '2026-10-21', study_time: '10:30', modality: 'MR',
    has_images: true, study_uid: '1.2.3', has_report: false, status: 'Pendiente' };

async function fixture(browser, width, options = {}) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    const calls = [];
    let posts = 0;
    let failApi = false;
    let ttl = 3600000;
    let release;
    let hold = false;
    let profile = { full_name: longName, patient_id_number: '123', email: 'patient@example.invalid',
        email_verified: true, can_change_password: true, email_verification_enabled: true, phone: '555123', address: 'Dirección '.repeat(15) };
    await context.addInitScript(({ user, options }) => {
        localStorage.setItem('authData', JSON.stringify({ access_token: 'synthetic', user }));
        window.copyStarts = 0;
        window.copied = [];
        window.shared = [];
        window.denyCopy = false;
        window.cancelShare = false;
        window.failShare = false;
        window.qrFails = 0;
        if (!options.realClipboard) {
        window.ClipboardItem = class { constructor(data) { if (options.brokenItem) throw new Error("Unsupported deferred clipboard"); this.data = data; } };
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: options.noClipboard ? undefined : {
            write: options.textOnly ? undefined : async items => {
                window.copyStarts++;
                const blob = await items[0].data['text/plain'];
                if (window.denyCopy) throw new DOMException('Denied', 'NotAllowedError');
                window.copied.push(await blob.text());
            },
            writeText: async text => {
                window.copyStarts++;
                if (window.denyCopy) throw new DOMException('Denied', 'NotAllowedError');
                window.copied.push(text);
            },
        } });
        }
        Object.defineProperty(navigator, 'share', { configurable: true, value: options.noShare ? undefined : async data => {
            if (window.cancelShare) throw new DOMException('Cancelled', 'AbortError');
            if (window.failShare) throw new DOMException('Denied', 'NotAllowedError');
            window.shared.push(data);
        } });
        const original = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function (...args) {
            if (window.qrFails > 0) { window.qrFails--; throw new Error('Synthetic QR failure'); }
            return original.apply(this, args);
        };
    }, { user, options });
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        const path = url.pathname.slice(4);
        calls.push(path + url.search);
        let data = [];
        if (path === '/auth/me') data = user;
        else if (path === '/auth/logout') return route.fulfill({ json: { success: true } });
        else if (path === '/config/me/modules') data = { module_codes: ['patient_portal'], disabled_modules: [], facility_ids: [] };
        else if (path === '/app-config') data = { id: 1, app_name: 'NextRIS', name: 'Synthetic' };
        else if (path === '/patient-portal/my-profile') {
            if (route.request().method() === 'PUT') profile = { ...profile, ...route.request().postDataJSON() };
            data = profile;
        } else if (path.startsWith('/patient-portal/my-studies')) data = { data: url.searchParams.get('search') === 'sin coincidencias' ? [] : [study, { ...study, examination_id: 'no-images', has_images: false, study_uid: null, has_report: true }], total: 2, page: 1, per_page: 10, pages: 1 };
        else if (path.endsWith('/case-link')) {
            posts++;
            if (hold) await new Promise(resolve => { release = resolve; });
            if (failApi) return route.fulfill({ status: 502, json: { success: false, message: 'Error sintético al generar enlace' } });
            data = { case_url: base + '/case/synthetic-' + posts, expires_at: new Date(Date.now() + ttl).toISOString(), expires_hours: 1 };
        } else if (path.startsWith('/s/')) {
            if (path.includes('expired')) return route.fulfill({ status: 410, json: { success: false } });
            if (path.includes('error')) return route.fulfill({ status: 502, json: { success: false, message: 'Error sintético de consulta' } });
            data = { expires_at: new Date(Date.now() + ttl).toISOString(), patient: { name: longName, id: '123', sex: 'F', birthdate: '19900101' },
                study: { description, accession_number: 'ACC-123', date: '20261021', time: '103000', modality: 'MR', image_count: 10 },
                exam: { id: examId, facility: 'Sede de prueba', institution: 'Institución de prueba', referring_physician: longName },
                report_available: false, viewer_url: base + '/synthetic-viewer', report_url: null };
        }
        return route.fulfill({ json: { success: true, data } });
    });
    const open = async (twice = false) => {
        const button = page.getByRole('button', { name: 'Compartir', exact: true, disabled: false }).filter({ visible: true });
        if (twice) await button.evaluate(el => { el.click(); el.click(); });
        else await button.click();
        await page.getByRole('dialog', { name: 'Compartir estudio' }).waitFor();
    };
    const ready = async () => {
        await page.getByAltText('Código QR del enlace del estudio').waitFor();
        await page.getByText('Enlace copiado al portapapeles', { exact: true }).waitFor();
    };
    const noOverflow = async () => {
        const offenders = await page.evaluate(() => Array.from(document.querySelectorAll('main, article, [role="dialog"], .patient-portal header, .patient-portal nav')).filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.tagName + ':' + el.className));
        assert.deepEqual(offenders, [], `Overflow at ${width}px`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    };
    return { context, page, errors, calls, open, ready, noOverflow, get posts() { return posts; }, set hold(v) { hold = v; }, release: () => release(), set failApi(v) { failApi = v; }, set ttl(v) { ttl = v; } };
}

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    try {
        for (const width of (process.env.PATIENT_TEST_WIDTHS || "320,390,430,768,1440").split(",").map(Number)) {
            const f = await fixture(browser, width);
            const { page } = f;
            try {
                await page.goto(base + '/estudios');
                await page.getByRole('heading', { name: longName, exact: true }).waitFor();
                await f.noOverflow();
                const navigation = page.getByRole('navigation', { name: 'Navegación del paciente' });
                assert.equal(await navigation.isVisible(), width < 1024);
                if (width < 1024) {
                    assert.equal(await navigation.getByRole('link', { name: 'Mis estudios' }).getAttribute('aria-current'), 'page');
                    await navigation.getByRole('link', { name: 'Inicio', exact: true }).click();
                    await page.getByRole('heading', { name: 'Bienvenido, Paciente' }).waitFor();
                    await f.noOverflow();
                    assert(!f.calls.some(path => path.includes('/plan')));
                    await page.getByRole('main').getByRole('link', { name: /Mis estudios/ }).click();
                    await page.getByRole('button', { name: 'Filtrar por fecha' }).click();
                    await page.getByLabel('Desde', { exact: true }).fill('01/10/26');
                    await Promise.all([page.waitForResponse(response => response.url().includes('date_to=2026-10-26')), page.getByLabel('Hasta', { exact: true }).fill('26/10/26')]);
                    await f.noOverflow();
                    await page.getByRole('button', { name: 'Limpiar filtros' }).click();
                }
                await page.getByLabel('Buscar estudios').fill('sin coincidencias');
                await page.getByText('No se encontraron estudios', { exact: true }).waitFor();
                assert(await page.getByRole('heading', { name: longName, exact: true }).isVisible());
                await page.getByRole('button', { name: 'Limpiar filtros' }).click();
                // Images can be shared with the report still pending.
                f.hold = true;
                await f.open(width === 390);
                await page.waitForFunction(() => window.copyStarts === 1);
                assert.equal(f.posts, 1);
                // Closing/reopening during the request reuses the in-flight generation.
                await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
                await f.open();
                assert.equal(f.posts, 1);
                f.hold = false;
                f.release();
                await f.ready();
                assert.equal(await page.getByLabel('Enlace del estudio').inputValue(), base + '/case/synthetic-1');
                assert.equal(await page.getByAltText('Código QR del enlace del estudio').evaluate(img => img.naturalWidth), 320);
                await f.noOverflow();
                if (process.env.PATIENT_TEST_ARTIFACTS) await page.screenshot({ path: `${process.env.PATIENT_TEST_ARTIFACTS}/patient-share-${width}.png` });
                await page.getByRole('button', { name: 'Compartir en aplicaciones' }).click();
                assert.deepEqual(await page.evaluate(() => window.shared), [{ title: 'Estudio médico compartido', url: base + '/case/synthetic-1' }]);
                await page.evaluate(() => { window.cancelShare = true; });
                await page.getByRole('button', { name: 'Compartir en aplicaciones' }).click();
                assert.equal(await page.getByRole('alert').count(), 0);
                const downloadEvent = page.waitForEvent('download');
                await page.getByRole('button', { name: 'Descargar QR' }).click();
                const download = await downloadEvent;
                assert.equal(download.suggestedFilename(), `qr-estudio-${examId}.png`);
                await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
                // Navigation unmounts Estudios; the session cache must still reuse its link.
                if (width < 1024) {
                    await navigation.getByRole('link', { name: 'Mis datos' }).click();
                    await page.getByRole('heading', { name: 'Seguridad' }).waitFor();
                    await f.noOverflow();
                    await page.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
                    await page.getByLabel('Contraseña actual', { exact: true }).fill('synthetic');
                    await f.noOverflow();
                    await page.keyboard.press('Escape');
                    await navigation.getByRole('link', { name: 'Mis estudios' }).click();
                    await f.open();
                    await f.ready();
                    assert.equal(f.posts, 1);
                    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
                    await page.getByRole('button', { name: 'Opciones de cuenta' }).click();
                    await page.getByRole('menuitem', { name: 'Oscuro' }).click();
                    assert(await page.locator('html').evaluate(el => el.classList.contains('dark')));
                }
                await page.goto(base + '/case/synthetic-1');
                await page.getByRole('button', { name: 'Ver estudio', exact: true }).waitFor();
                await f.noOverflow();
                assert(await page.getByRole('button', { name: 'Ver reporte' }).isDisabled());
                assert.deepEqual(f.errors, []);
                console.log(`PASS patient mobile layout and share ${width}px`);
            } catch (error) {
                console.error("Patient fixture errors:", f.errors, await page.locator("body").innerText());
                await page.screenshot({ path: `/tmp/patient-mobile-failure-${width}.png` });
                throw error;
            } finally { await f.context.close(); }
        }

        const f = await fixture(browser, 390);
        try {
            await f.page.goto(base + '/estudios');
            f.failApi = true;
            await f.open();
            await f.page.getByText('Error sintético al generar enlace').waitFor();
            f.failApi = false;
            await f.page.evaluate(() => { window.denyCopy = true; window.qrFails = 1; });
            await f.page.getByRole('button', { name: 'Reintentar enlace' }).click();
            await f.page.getByText(/No se pudo copiar automáticamente/).waitFor();
            await f.page.getByRole('button', { name: 'Reintentar QR' }).click();
            await f.page.getByAltText('Código QR del enlace del estudio').waitFor();
            assert.equal(f.posts, 2, 'QR retry must not generate another link');
            await f.page.evaluate(() => { window.denyCopy = false; });
            await f.page.getByRole('button', { name: 'Copiar enlace', exact: true }).click();
            await f.ready();
            await f.page.evaluate(() => { window.failShare = true; });
            await f.page.getByRole('button', { name: 'Compartir en aplicaciones' }).click();
            await f.page.getByText(/No se pudo abrir el menú/).waitFor();
            await f.page.getByRole('button', { name: 'Cerrar', exact: true }).click();
            // A new page clears the JS cache, allowing a short-lived fixture.
            f.ttl = 1500;
            await f.page.reload();
            await f.open();
            await f.ready();
            await f.page.getByText('Este enlace venció.', { exact: true }).waitFor();
            f.ttl = 3600000;
            await f.page.getByRole('button', { name: 'Generar nuevo enlace' }).click();
            await f.ready();
            assert.equal(f.posts, 4);
            await f.page.goto(base + '/case/expired');
            await f.page.getByText(/Este enlace venció/).waitFor();
            await f.page.goto(base + '/case/error');
            await f.page.getByText('Error sintético de consulta').waitFor();
            await f.noOverflow();
            assert.deepEqual(f.errors, []);
            console.log('PASS API, clipboard, QR and native-share failures, isolated retries and expiration');
        } finally { await f.context.close(); }

        for (const options of [{ noShare: true, textOnly: true }, { noShare: true, noClipboard: true }, { noShare: true, brokenItem: true }]) {
            const f = await fixture(browser, 320, options);
            try {
                await f.page.goto(base + '/estudios');
                await f.open();
                await f.page.getByAltText('Código QR del enlace del estudio').waitFor();
                assert.equal(await f.page.getByRole('button', { name: 'Compartir en aplicaciones' }).count(), 0);
                if (options.noClipboard || options.brokenItem) await f.page.getByText(/No se pudo copiar automáticamente/).waitFor();
                else await f.ready();
                if (options.brokenItem) {
                    await f.page.getByRole("button", { name: "Copiar enlace", exact: true }).click();
                    await f.ready();
                }
                await f.noOverflow();
                assert.deepEqual(f.errors, []);
            } finally { await f.context.close(); }
        }
        console.log('PASS clipboard text fallback, missing clipboard and missing native share');

        const real = await fixture(browser, 390, { realClipboard: true });
        try {
            await real.context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
            await real.page.goto(base + '/estudios');
            await real.open();
            await real.ready();
            assert.equal(await real.page.evaluate(() => navigator.clipboard.readText()), base + '/case/synthetic-1');
            assert.deepEqual(real.errors, []);
            console.log('PASS actual Chromium clipboard with deferred API result');
        } finally { await real.context.close(); }

        const context = await browser.newContext({ viewport: { width: 320, height: 568 } });
        await context.route('**/*', route => {
            const url = new URL(route.request().url());
            if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
            if (url.pathname.startsWith('/api/')) return route.fulfill({ json: { success: true, data: {} } });
            return route.continue();
        });
        try {
            const page = await context.newPage();
            await page.goto(base + '/pacientes');
            await page.getByRole('heading', { name: 'Portal del Paciente' }).waitFor();
            await page.getByLabel('ID del paciente', { exact: true }).fill('synthetic');
            await page.getByLabel('Contraseña', { exact: true }).fill('synthetic');
            assert.equal(await page.getByLabel('Contraseña', { exact: true }).evaluate(el => getComputedStyle(el).fontSize), '12px');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.setViewportSize({ width: 320, height: 360 });
            await page.getByRole('button', { name: 'Acceder a mis estudios' }).scrollIntoViewIfNeeded();
            assert(await page.getByRole('button', { name: 'Acceder a mis estudios' }).isVisible());
            console.log('PASS patient login labels, mobile input sizing and reduced viewport');
        } finally { await context.close(); }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
