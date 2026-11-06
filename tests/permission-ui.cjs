/* Real UI with synthetic accounts and intercepted APIs. Never writes to NextRIS. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const backend = process.env.NEXTRIS_BACKEND_ROOT || path.resolve(__dirname, '../../backend');
const fixture = JSON.parse(execFileSync(process.env.NEXTRIS_TEST_PYTHON || path.join(backend, 'venv/bin/python'), ['-c', `
import importlib.util,json
s=importlib.util.spec_from_file_location('policy', '${backend}/apps/permission_policy.py')
p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
print(json.dumps(dict(catalog=p.PERMISSION_CATALOG,disabled=sorted(p.DISABLED_MODULES),roles=[
 dict(guid=role.lower(),description=role,default_permissions=p.get_default_permissions_for_role(role))
 for role in ['Sysadmin','Administrador','Administrativo','Medico','Tecnico']])))
`], { encoding: 'utf8' }));
const base = process.env.PERMISSION_TEST_BASE || 'http://127.0.0.1:5173';
const rootUser = { id: 'synthetic-operator', username: 'synthetic-operator', user_type: 'Sysadmin',
    role_id: 'sysadmin', role_name: 'sysadmin', name: 'Synthetic', surname: 'Operator', permissions: ['*'], requires_password_change: false };
const existing = { guid:'synthetic-doctor', username:'synthetic-doctor', role:'Medico',role_id:'medico',
    name:'Synthetic',surname:'Doctor',email:'',phone:'',national_number:'',is_active:true };
(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport:{width:1600,height:1100} });
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    const errors=[]; const saved=[];
    let failCatalog=false; let slowCatalog=false; let catalogGate; let releaseCatalog; let activeUser=structuredClone(rootUser);
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript((user) => localStorage.setItem('authData', JSON.stringify({
        access_token:'synthetic-not-a-real-token',refresh_token:'synthetic',user,
    })), rootUser);
    await page.route('**/*', async route => {
        const url=new URL(route.request().url());
        if (!['127.0.0.1','localhost'].includes(url.hostname)) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        const endpoint=url.pathname.slice(4); const method=route.request().method();
        let data=[];
        if(endpoint==='/auth/me') data=activeUser;
        else if(endpoint==='/config/me/modules') data={module_codes:['patient_portal','appointments','nexi','structured_reports'],disabled_modules:fixture.disabled,facility_ids:[],user_facilities_count:0,total_facilities:0,has_all_facilities:false};
        else if(endpoint==='/app-config') data={id:1,name:'Synthetic NextRIS',app_name:'NextRIS',logo_url:null};
        else if(endpoint==='/config/roles') data=fixture.roles;
        else if(endpoint==='/config/permissions') {
            if(slowCatalog) await catalogGate;
            if(failCatalog) return route.fulfill({status:503,json:{success:false,message:'Synthetic unavailable catalog'}});
            data=fixture.catalog;
        } else if(endpoint.endsWith('/permissions')) data={custom_permissions:['images.view'],effective_permissions:['images.view'],catalog:fixture.catalog};
        else if(endpoint.endsWith('/medical-data')) data={matricula_nacional:'SYNTHETIC',aclaracion_firma:'Synthetic Doctor',integration_id_1:''};
        else if(endpoint==='/config/users'&&method==='GET') data=[existing];
        else if(endpoint==='/config/users'&&method==='POST') {
            saved.push(route.request().postDataJSON());
            return route.fulfill({json:{success:true,message:'Synthetic account saved',data:{user_id:'synthetic-created',username:'synthetic-new',credentials_email_sent:true}}});
        } else if(endpoint==='/config/users/synthetic-doctor'&&method==='PUT') {
            saved.push(route.request().postDataJSON());
        } else if(endpoint.includes('/plan')) data={plan:null,usage_monthly:{}};
        return route.fulfill({json:{success:true,data}});
    });
    const checked = async dialog => (await dialog.locator('[role="checkbox"][id^="perm-"]:not([id^="perm-module-"])[data-state="checked"]').evaluateAll(nodes=>nodes.map(node=>node.id.slice(5)))).sort();
    const selectRole = async (dialog,role) => {
        await dialog.getByRole('combobox').click();
        await page.getByRole('option',{name:role,exact:true}).click();
    };
    const openUsers = async () => {
        await page.goto(base+'/configuraciones/tablas');
        await page.getByRole('tab',{name:'Usuarios / Personal',exact:true}).click();
        await page.getByRole('heading',{name:'Gestión de Usuarios',exact:true}).waitFor();
    };
    try {
        await openUsers();
        assert.equal(await page.getByRole('tab',{name:'Agenda de Medicos',exact:true}).count(),fixture.disabled.includes('appointments') ? 0 : 1);
        slowCatalog=true;
        catalogGate=new Promise(resolve=>{releaseCatalog=resolve;});
        await page.getByRole('button',{name:'Nuevo Usuario',exact:true}).click();
        let dialog=page.getByRole('dialog',{name:'Nuevo Usuario',exact:true});
        await dialog.getByRole('tab',{name:'Permisos',exact:true}).click();
        assert.equal(await dialog.getByRole('button',{name:'Guardar',exact:true}).isDisabled(),true);
        slowCatalog=false; releaseCatalog();
        await dialog.getByRole('combobox').waitFor();
        await page.waitForFunction(()=>!document.querySelector('[role="dialog"] [role="combobox"]')?.disabled);
        slowCatalog=false;
        for(const role of fixture.roles) {
            await selectRole(dialog,role.description);
            if(role.description==='Sysadmin') {
                await dialog.getByText('Sysadmin tiene acceso total al sistema.',{exact:true}).waitFor();
                assert.equal(await dialog.locator('[id^="perm-"]').count(),0);
            } else assert.deepEqual(await checked(dialog),role.default_permissions.slice().sort());
        }
        await selectRole(dialog,'Medico');
        await dialog.locator('[id="perm-reports.sign"]').click();
        assert(!(await checked(dialog)).includes('reports.sign'));
        await selectRole(dialog,'Tecnico');
        assert.deepEqual(await checked(dialog),fixture.roles.find(role=>role.guid==='tecnico').default_permissions.slice().sort());
        while((await checked(dialog)).length) await dialog.locator('[role="checkbox"][id^="perm-"]:not([id^="perm-module-"])[data-state="checked"]').first().click();
        assert.deepEqual(await checked(dialog),[]);
        await dialog.locator('#username').fill('synthetic-new');
        await dialog.locator('#name').fill('Synthetic');
        await dialog.locator('#surname').fill('New');
        await dialog.getByRole('button',{name:'Guardar',exact:true}).click();
        await dialog.waitFor({state:'detached'});
        assert.deepEqual(saved[0].permission_codes,[]);
        assert.equal(saved[0].role_id,'tecnico');
        console.log('PASS five templates, role changes, manual revocation, empty selection, atomic user payload');
        // Existing exceptions must remain selected when opening an unchanged role.
        await page.getByText('synthetic-doctor',{exact:true}).waitFor();
        await page.getByRole('button',{name:'Editar',exact:true}).click();
        dialog=page.getByRole('dialog',{name:'Editar Usuario',exact:true});
        await dialog.getByRole('tab',{name:'Permisos',exact:true}).click();
        await dialog.locator('[id="perm-images.view"]').waitFor();
        assert.deepEqual(await checked(dialog),['images.view']);
        assert(!await dialog.innerText().then(text=>/patients\.view|images\.view|reports\.write/.test(text)));
        await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
        console.log('PASS existing exceptions preserved, Spanish groups and descriptions without codes');
        // Catalog failure cannot accidentally wipe user permissions.
        failCatalog=true;
        await page.getByRole('button',{name:'Nuevo Usuario',exact:true}).click();
        dialog=page.getByRole('dialog',{name:'Nuevo Usuario',exact:true});
        await dialog.getByRole('tab',{name:'Permisos',exact:true}).click();
        await dialog.getByRole('button',{name:'Reintentar',exact:true}).waitFor();
        assert.equal(await dialog.getByRole('button',{name:'Guardar',exact:true}).isDisabled(),true);
        failCatalog=false;
        await dialog.getByRole('button',{name:'Reintentar',exact:true}).click();
        await dialog.locator('[id="perm-images.view"]').waitFor();
        await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
        console.log('PASS unavailable catalog blocks saving and retry recovers');
        // A technician can use DICOM when explicitly granted, without administrative tools.
        activeUser={...rootUser,user_type:'Tecnico',role_name:'tecnico',role_id:'tecnico',permissions:['dicom.studies.manage']};
        await page.goto(base+'/gestion/cargar-estudios');
        await page.getByRole('heading').filter({hasText:/Carg|Subir/i}).first().waitFor();
        assert.equal(new URL(page.url()).pathname,'/gestion/cargar-estudios');
        assert.equal(await page.getByRole('link',{name:'Unificación de Paciente',exact:true}).count(),0);
        console.log('PASS assigned permission permits another role; Gestión does not grant administrative tools');
        activeUser={...rootUser,user_type:'Tecnico',role_name:'tecnico',role_id:'tecnico',permissions:['tabs.config.view']};
        await page.goto(base+'/configuraciones/tablas');
        await page.getByRole('tab',{name:'Usuarios / Personal',exact:true}).click();
        assert.equal(await page.getByRole('tab',{name:'Gestion de Usuarios',exact:true}).count(),0);
        console.log('PASS configuration permission does not expose user management');
        activeUser={...rootUser,user_type:'Tecnico',role_name:'tecnico',role_id:'tecnico',permissions:['users.permissions.manage']};
        await openUsers();
        assert.equal(await page.getByRole('button',{name:'Nuevo Usuario',exact:true}).count(),0);
        assert.equal(await page.getByRole('button',{name:'Editar',exact:true}).count(),0);
        await page.getByRole('button',{name:'Permisos',exact:true}).click();
        dialog=page.getByRole('dialog',{name:'Permisos de synthetic-doctor',exact:true});
        await dialog.locator('[id="perm-images.view"]').waitFor();
        assert.deepEqual(await checked(dialog),['images.view']);
        await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
        console.log('PASS permission management works independently of profile management');
        activeUser={...rootUser,user_type:'Medico',role_name:'medico',role_id:'medico',permissions:[]};
        await page.goto(base+'/worklist');
        await page.waitForURL(base+'/inicio');
        console.log('PASS removed permission denies page access despite the Médico role');
        assert.deepEqual(errors,[]);
    } catch(error) {
        await page.screenshot({path:'/tmp/nextris-permissions-ui-failure.png',fullPage:true});
        console.error('UI URL',page.url(),'ERRORS',errors);
        console.error((await page.locator('body').innerText()).slice(-2500));
        throw error;
    } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
