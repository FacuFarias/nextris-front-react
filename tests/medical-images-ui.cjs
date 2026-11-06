// Synthetic accounts and intercepted APIs only. No writes to NextRIS.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.MEDICAL_TEST_BASE || 'http://127.0.0.1:5173';
const operator = { id:'synthetic-admin', username:'synthetic-admin', user_type:'Sysadmin',
    role_id:'sysadmin', role_name:'Sysadmin', permissions:['*'], requires_password_change:false };
const doctor = { guid:'synthetic-doctor', username:'synthetic-doctor', role:'Medico', role_id:'medico',
    name:'Synthetic', surname:'Doctor', national_number:'', email:'', phone:'', is_active:true };
const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
(async () => {
    const browser = await chromium.launch({ args:['--no-sandbox'] });
    const context = await browser.newContext({ viewport:{ width:1600,height:1100 } });
    await context.addInitScript(user => {
        if (location.protocol === 'http:' || location.protocol === 'https:') {
            localStorage.setItem('authData', JSON.stringify({ access_token:'synthetic', user }));
        }
    }, operator);
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [], metadata = [], accounts = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (!['127.0.0.1','localhost'].includes(url.hostname)) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        const endpoint = url.pathname.slice(4), method = route.request().method();
        let data = [];
        if (endpoint === '/auth/me') data = operator;
        else if (endpoint === '/config/me/modules') data = { module_codes:[], disabled_modules:[], facility_ids:[] };
        else if (endpoint === '/app-config') data = { id:1, app_name:'Synthetic NextRIS' };
        else if (endpoint === '/config/roles') data = [
            { guid:'sysadmin',description:'Sysadmin',default_permissions:['*'] },
            { guid:'medico',description:'Medico',default_permissions:[] },
        ];
        else if (endpoint.endsWith('/permissions')) data = { custom_permissions:[], effective_permissions:[] };
        else if (endpoint === '/config/users' && method === 'GET') data = [doctor];
        else if (endpoint === '/config/users' && method === 'POST') {
            accounts.push(route.request().postDataJSON());
            return route.fulfill({ json:{ success:true, message:'Usuario sintético creado',
                data:{ user_id:'synthetic-created',username:'synthetic-new',credentials_email_sent:true } } });
        } else if (endpoint.endsWith('/medical-data')) {
            if (method === 'POST') metadata.push({ endpoint, body:route.request().postDataBuffer().toString('latin1') });
            else data = { matricula_nacional:'SYN123', aclaracion_firma:'Synthetic Doctor', integration_id_1:'63',
                firma_digital:'existing-signature.gif', sello_digital:'existing-stamp.gif', firma_habilitada:true };
        } else if (endpoint.includes('/plan')) data = { plan:null,usage_monthly:{} };
        return route.fulfill({ json:{ success:true,data } });
    });
    try {
        await page.goto(base + '/configuraciones/tablas');
        await page.getByRole('tab', { name:'Usuarios / Personal',exact:true }).click();
        await page.getByRole('button', { name:'Nuevo Usuario',exact:true }).click();
        let dialog = page.getByRole('dialog', { name:'Nuevo Usuario',exact:true });
        await dialog.getByRole('combobox').click();
        await page.getByRole('option', { name:'Medico',exact:true }).click();
        await dialog.locator('#username').fill('synthetic-new');
        await dialog.locator('#name').fill('Synthetic');
        await dialog.locator('#surname').fill('Doctor');
        await dialog.locator('#matricula_nacional').fill('SYN123');
        await dialog.locator('#aclaracion_firma').fill('Synthetic Doctor');
        await dialog.locator('#integration_id_1').fill('63');
        for (const field of ['firma_digital','sello_digital']) {
            assert((await dialog.locator('#' + field).getAttribute('accept')).includes('image/gif'));
            await dialog.locator('#' + field).setInputFiles({ name:field + '.gif',mimeType:'image/gif',buffer:gif });
        }
        await dialog.getByRole('button', { name:'Guardar',exact:true }).click();
        await dialog.waitFor({ state:'detached' });
        assert.equal(accounts.length, 1);
        assert.equal(metadata.length, 1);
        for (const field of ['firma_digital','sello_digital']) assert(metadata[0].body.includes(`name="${field}"; filename="${field}.gif"`));
        assert(metadata[0].body.includes('name="integration_id_1"'));

        await page.getByRole('button', { name:'Editar',exact:true }).click();
        dialog = page.getByRole('dialog', { name:'Editar Usuario',exact:true });
        await dialog.getByText('Firma actual: existing-signature.gif', { exact:true }).waitFor();
        await dialog.getByText('Sello actual: existing-stamp.gif', { exact:true }).waitFor();
        await dialog.getByRole('button', { name:'Guardar',exact:true }).click();
        await dialog.waitFor({ state:'detached' });
        assert.equal(metadata.length, 2);
        assert(!metadata[1].body.includes('filename='));

        await page.getByRole('button', { name:'Editar',exact:true }).click();
        dialog = page.getByRole('dialog', { name:'Editar Usuario',exact:true });
        await dialog.getByText('Sello actual: existing-stamp.gif', { exact:true }).waitFor();
        await dialog.locator('#sello_digital').setInputFiles({ name:'replacement.gif',mimeType:'image/gif',buffer:gif });
        await dialog.getByRole('button', { name:'Guardar',exact:true }).click();
        await dialog.waitFor({ state:'detached' });
        assert(metadata[2].body.includes('name="sello_digital"; filename="replacement.gif"'));
        assert(!metadata[2].body.includes('name="firma_digital"'));
        assert.deepEqual(errors, []);
        console.log('PASS medical create with signature/stamp GIFs, current files in edit, metadata-only save and stamp-only replacement');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
