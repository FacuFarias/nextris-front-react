// Local synthetic reports only. Every API is intercepted; no clinical endpoint is contacted.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PATIENT_TEST_BASE || 'http://127.0.0.1:5181';
const user = { id:'synthetic-patient', username:'synthetic', name:'Synthetic', surname:'Patient',
    user_type:'patient', role_name:'patient', role_id:'patient', permissions:[], requires_password_change:false };
const exam = { examination_id:'00000000-0000-4000-8000-000000000001', study_type:'Synthetic Study',
    patient_name:'Synthetic Patient', patient_id:'TEST-1', accession_number:'TEST-1', study_date:'2026-11-01',
    modality:'MR', has_images:false, has_report:true, status:'Informado' };
const report = { id_informe:exam.examination_id, procedimientos:'Synthetic Study', profesional:'Synthetic Doctor',
    accession_number:'TEST-1', textos:{content:{as:'Informe',contenido:'<p>Local synthetic findings</p><script>window.reportUnsafe=true</script>'},
        conclusion:{as:'Conclusión',contenido:'<p>Local synthetic conclusion</p>'}}, signatures:[] };
const document = { patient:{name:'Synthetic Patient',identifier:'TEST-1',national_code:null},
    study:{description:'Synthetic Study',accession_number:'TEST-1',date:'2026-11-01'},
    institution:{name:'Synthetic Institution',address:null,phone:null,email:null,logo:null}, signatures:[] };
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox']});
 try {
  for(const {width,staff} of [{width:1440,staff:false},{width:390,staff:false},{width:1440,staff:true}]) {
   const principal=staff ? {...user,user_type:"Medico",role_name:"medico",permissions:["patients.view"]} : user;
   const context=await browser.newContext({viewport:{width,height:900}});
   await context.addInitScript(user=>localStorage.setItem('authData',JSON.stringify({access_token:'synthetic',user})),principal);
   const page=await context.newPage();const errors=[];let unavailable=false;let reportCalls=0;
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(!['127.0.0.1','localhost'].includes(url.hostname))return route.abort();
    if(!url.pathname.startsWith('/api/'))return route.continue();
    const endpoint=url.pathname.slice(4);let data=[];
    if(endpoint==='/auth/me')data=principal;
    else if(endpoint==='/app-config')data={id:1,name:'Synthetic Institution'};
    else if(endpoint==='/config/me/modules')data={module_codes:['patient_portal'],disabled_modules:[],facility_ids:[]};
    else if(endpoint==='/patient-portal/my-profile')data={full_name:'Synthetic Patient',email:'synthetic@example.invalid',email_verified:true};
    else if(endpoint==='/patient-portal/my-studies')data={data:[exam],page:1,per_page:10,total:1,pages:1};
    else if(endpoint.endsWith('/report') || endpoint.endsWith('/view')) {
     reportCalls++;
     if(unavailable)return route.fulfill({status:404,json:{success:false,message:'Informe no disponible'}});
     data={source:'nextris',report,document};
    }
    return route.fulfill({json:{success:true,data}});
   });
   await page.goto(base+(staff ? '/informes/'+exam.examination_id : '/estudios'));
   if(!staff) await page.getByRole('button',{name:'Reporte',exact:true}).click();
   const dialog=page.getByRole('dialog');
   await dialog.getByText('Local synthetic findings',{exact:true}).waitFor();
   assert.equal(await dialog.getByText('Synthetic Institution',{exact:true}).count(),1);
   assert.equal(await page.evaluate(()=>Boolean(window.reportUnsafe)),false);
   assert(!/Clínica Parque|InfoParque/.test(await dialog.innerText()));
   await dialog.getByRole('button',{name:'Cerrar informe',exact:true}).click();
   unavailable=true;
   if(staff) await page.goto(base+'/informes/'+exam.examination_id);
   else await page.getByRole('button',{name:'Reporte',exact:true}).click();
   await page.getByText('Informe no disponible',{exact:true}).waitFor();
   assert.equal(reportCalls,2);assert.deepEqual(errors,[]);
   await context.close();
   console.log('PASS '+(staff?'staff report link':'patient report')+', safe HTML, unavailable state and institutional branding at width '+width);
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
