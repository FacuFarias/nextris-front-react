const fs = require('fs');
const crypto = require('crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const origin = process.env.VETERINARY_BROWSER_URL || 'http://127.0.0.1:8083';
if (!['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname)) throw new Error('Browser write tests require a local isolated server');
const fixtures = JSON.parse(fs.readFileSync(process.env.VETERINARY_BROWSER_FIXTURES, 'utf8'));

(async () => {
 const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const errors=[];
 const configure=page=>{
  page.setDefaultTimeout(30000);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=500)errors.push(r.status()+' '+new URL(r.url()).pathname)});
 };
 try {
  const staff = await browser.newContext();const page=await staff.newPage();configure(page);
  await page.goto(origin+'/login',{waitUntil:'networkidle'});
  await page.getByPlaceholder(/Usuario del personal|Usuario médico/).fill(fixtures.staff.username);
  await page.getByPlaceholder('Contraseña',{exact:true}).fill(fixtures.staff.password);
  await page.getByRole('button',{name:'Ingresar al Sistema'}).click();
  await page.waitForURL('**/inicio');
  await page.goto(origin+'/buscar-pacientes',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Pacientes veterinarios'}).waitFor();
  if(await page.locator('a[href="/nexi"],a[href^="/reportes-estructurados"]').count()) throw Error('Disabled modules visible');
  await page.getByRole('button',{name:'Nuevo animal',exact:true}).click();
  const animalName='Synthetic browser '+crypto.randomBytes(4).toString('hex');
  await page.getByLabel('Nombre del animal',{exact:true}).fill(animalName);
  await page.getByLabel('Especie',{exact:true}).selectOption(fixtures.animal.veterinary.species_id);
  await page.getByLabel('Peso registrado (kg)',{exact:true}).fill('6.5');
  const creation=page.waitForResponse(r=>r.url().endsWith('/api/patients')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Guardar',exact:true}).click();
  const created=await creation;if(created.status()!==201)throw Error('Browser animal creation failed');
  const animal=(await created.json()).data;
  await page.getByRole('heading',{name:animalName+' · '+animal.patientid}).waitFor();
  await page.getByLabel('Tipo de estudio / especialidad',{exact:true}).selectOption(fixtures.study_type);
  await page.getByLabel('Motivo / pregunta clínica',{exact:true}).fill('Synthetic browser order');
  const orderResponse=page.waitForResponse(r=>r.url().endsWith('/orders')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Crear orden / turno',exact:true}).click();
  if((await orderResponse).status()!==201)throw Error('Browser order creation failed');
  await page.getByRole('button',{name:'Redactar',exact:true}).click();
  await page.getByText('Paciente veterinario',{exact:true}).waitFor({timeout:30000});
  await staff.close();

  const owner=await browser.newContext();const portal=await owner.newPage();configure(portal);
  await portal.goto(origin+'/pacientes',{waitUntil:'networkidle'});
  await portal.getByPlaceholder(/Usuario del responsable|ID del paciente/).fill(fixtures.responsible.username);
  await portal.getByPlaceholder('Contraseña',{exact:true}).fill(fixtures.responsible.password);
  await portal.getByRole('button',{name:/Acceder a mis animales|Acceder a mis estudios/}).click();
  await portal.getByRole('heading',{name:'Cambie su contraseña inicial'}).waitFor();
  const password=crypto.randomBytes(16).toString('hex');
  await portal.getByLabel('Contraseña nueva (mínimo 8 caracteres)',{exact:true}).fill(password);
  await portal.getByLabel('Repetir contraseña',{exact:true}).fill(password);
  await portal.getByRole('button',{name:'Actualizar contraseña'}).click();
  await portal.getByRole('button',{name:new RegExp(fixtures.animal.name)}).click();
  await portal.getByRole('button',{name:'Ver informe',exact:true}).click();
  await portal.getByRole('heading',{name:'Informe de '+fixtures.animal.name}).waitFor();
  await portal.getByText('Synthetic browser veterinary findings',{exact:true}).waitFor();
  await portal.goto(origin+'/mis-datos',{waitUntil:'networkidle'});
  await portal.getByRole('heading',{name:'Mis datos de responsable'}).waitFor();
  await owner.close();
  if(errors.length)throw Error(JSON.stringify(errors));
  console.log('PASS: veterinary staff creates an animal and order and opens report writing; responsible changes initial password, views authorized report and own profile. No JavaScript or HTTP 5xx errors.');
 } finally {await browser.close()}
})().catch(error=>{console.error(error.message);process.exit(1)});
