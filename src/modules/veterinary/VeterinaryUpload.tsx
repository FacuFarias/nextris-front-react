import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Archive, CheckCircle2, FileUp, FolderOpen, Link2, Loader2, Plus, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '@/layouts/layout';
import { DynamicBreadcrumb } from '@/components/DynamicBreadcrumb';
import { Modal } from '@/components/Modal';
import { ExamViewerButton } from '@/components/ExamViewerButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { getDicomViewerUrl } from '@/services/dicomViewer';
import { prepareViewerWindow, openStudyInViewer, cancelPreparedViewer } from '@/services/viewerWindow';
import type { ViewerWindowTicket } from '@/services/viewerWindow';
import { VeterinaryForm } from './VeterinaryPatients';
import { get, post } from './api';
import type { Animal, Choice, Responsible, Study } from './api';
import { readDrop, transferFiles } from './upload-api';
import type { DroppedFile, UploadPreview, UploadResult, UploadSession, UploadTarget } from './upload-api';

// Revisar y confirmar leen las cabeceras de todas las instancias en el servidor.
const SLOW_REQUEST_MS=120000;
const busyStates=new Set(['queued_analysis','analyzing','queued_transfer','transferring','verifying']);
const labels:Record<UploadSession['state'],string>={receiving:'Recibiendo archivos',queued_analysis:'Análisis en espera',analyzing:'Analizando archivos',ready:'Pendiente de asociación',rejected:'Carga rechazada',queued_transfer:'Envío en espera',transferring:'Enviando al PACS',verifying:'Verificando imágenes',retryable:'Pendiente de recuperación',completed:'Estudio vinculado',cancelled:'Carga cancelada',expired:'Carga temporal vencida'};
const message=(error:unknown)=>isAxiosError(error)?String(error.response?.data?.message||error.message):error instanceof Error?error.message:'No se pudo completar la operación';
const selectClass='h-10 w-full rounded-md border border-purple-300 bg-background px-3 text-sm dark:border-purple-700';
type Order=Study&{isimage?:number;workflow_state?:string};

export function VeterinaryUpload(){
  const {authData}=useAuth();const navigate=useNavigate();const qc=useQueryClient();
  const can=(permission:string)=>Boolean(authData?.user.permissions?.some(code=>code==='*'||code===permission));
  const storageKey='cdivet-active-upload:'+authData?.user.id;
  const [activeId,setActiveId]=useState(()=>localStorage.getItem(storageKey)||'');
  const [uploading,setUploading]=useState(false);const [progress,setProgress]=useState(0);const [dragging,setDragging]=useState(false);
  const [animalSearch,setAnimalSearch]=useState('');const [patientId,setPatientId]=useState('');
  const [newAnimal,setNewAnimal]=useState(false);const [newResponsible,setNewResponsible]=useState(false);const [responsibleId,setResponsibleId]=useState('');
  const [mode,setMode]=useState<'link'|'create'|null>(null);const [examId,setExamId]=useState('');const [studyType,setStudyType]=useState('');
  const [orderSearch,setOrderSearch]=useState('');const [question,setQuestion]=useState('');const [preview,setPreview]=useState<UploadPreview|null>(null);
  const [confirmed,setConfirmed]=useState(false);const [submitting,setSubmitting]=useState(false);const [opening,setOpening]=useState(false);
  const fileInput=useRef<HTMLInputElement>(null);const folderInput=useRef<HTMLInputElement>(null);const abort=useRef<AbortController|null>(null);
  const openingSession=useRef('');const viewer=useRef<ViewerWindowTicket|null>(null);const openingPromise=useRef(false);
  const sessions=useQuery({queryKey:['veterinary','uploads'],queryFn:()=>get<UploadSession[]>('/veterinary/uploads'),refetchInterval:5000});
  const detail=useQuery({queryKey:['veterinary','upload',activeId],queryFn:()=>get<UploadSession>('/veterinary/uploads/'+activeId),enabled:Boolean(activeId),refetchInterval:query=>busyStates.has(query.state.data?.state||'')?1500:false});
  const current=detail.data;
  const patients=useQuery({queryKey:['veterinary','upload-patients',animalSearch],queryFn:()=>get<{data:Animal[]}>('/patients?paginated=true&page=1&per_page=20&search='+encodeURIComponent(animalSearch)),enabled:current?.state==='ready'||current?.state==='retryable'});
  const selectedId=patientId||current?.selection.patient_id||'';
  const animal=useQuery({queryKey:['veterinary','upload-animal',selectedId],queryFn:()=>get<Animal>('/patients/'+selectedId),enabled:Boolean(selectedId)});
  const orders=useQuery({queryKey:['veterinary','upload-orders',selectedId],queryFn:()=>get<Order[]>('/veterinary/patients/'+selectedId+'/orders'),enabled:Boolean(selectedId)});
  const studyTypes=useQuery({queryKey:['veterinary','study-types'],queryFn:async()=>(await get<string[][]>('/study-types')).map(row=>({id:row[0],name:row[2],modality:row[3]}))});
  const species=useQuery({queryKey:['veterinary','species'],queryFn:()=>get<Choice[]>('/veterinary/species')});
  const breeds=useQuery({queryKey:['veterinary','breeds'],queryFn:()=>get<Choice[]>('/veterinary/breeds')});
  const responsibles=useQuery({queryKey:['veterinary','upload-responsibles'],queryFn:()=>get<Responsible[]>('/veterinary/responsibles'),enabled:can('veterinary.responsibles.manage')&&newAnimal});
  const refresh=async()=>{await detail.refetch();await qc.invalidateQueries({queryKey:['veterinary','uploads']});};
  useEffect(()=>{if(activeId)localStorage.setItem(storageKey,activeId);else localStorage.removeItem(storageKey);},[activeId,storageKey]);

  const openReport=useCallback(async(result:UploadResult,ticket:ViewerWindowTicket|null)=>{
    if(openingPromise.current)return;
    openingPromise.current=true;setOpening(true);
    try{
      await api.post('/examinations/'+result.exam_id+'/block',{});
      if(ticket&&authData){try{const data=await getDicomViewerUrl(authData.user.id,result.exam_id);await openStudyInViewer(ticket,{studyInstanceUID:data.study_uid,viewerUrl:data.viewer_url});}catch(error){cancelPreparedViewer(ticket);toast.error(message(error)+'. Puede reabrir el visor desde el redactor.');}}
      navigate('/worklist/redactar-informe/'+result.exam_id+'/'+encodeURIComponent(result.study_uid)+'?upload=1');
    }catch(error){if(ticket)cancelPreparedViewer(ticket);toast.error(message(error));}
    finally{openingPromise.current=false;setOpening(false);}
  },[authData,navigate]);
  useEffect(()=>{
    if(current?.state==='completed'&&openingSession.current===current.id&&current.result.exam_id){
      openingSession.current='';const ticket=viewer.current;viewer.current=null;void openReport(current.result as UploadResult,ticket);
    }
  },[current,openReport]);

  useEffect(()=>{
    if(current?.state==='retryable'&&openingSession.current===current.id){
      openingSession.current='';if(viewer.current)cancelPreparedViewer(viewer.current);viewer.current=null;
    }
  },[current]);

  const choose=(upload:UploadSession)=>{setActiveId(upload.id);setPatientId(upload.selection.patient_id||'');setPreview(null);setMode(null);setProgress(0);};
  const receive=async(files:DroppedFile[])=>{
    if(uploading||busyStates.has(current?.state||'')||(current&&current.state!=='receiving'))return;
    setUploading(true);setProgress(0);const controller=new AbortController();abort.current=controller;
    try{
      const upload=current||await post<UploadSession>('/veterinary/uploads',{});setActiveId(upload.id);
      await transferFiles(upload,files,controller.signal,setProgress);
      await qc.invalidateQueries({queryKey:['veterinary','upload',upload.id]});await qc.invalidateQueries({queryKey:['veterinary','uploads']});
    }catch(error){if(!controller.signal.aborted)toast.error(message(error));}
    finally{setUploading(false);abort.current=null;}
  };
  const drop=async(event:React.DragEvent)=>{
    event.preventDefault();setDragging(false);
    try{await receive(await readDrop(event.dataTransfer.items,event.dataTransfer.files));}catch(error){toast.error(message(error));}
  };
  const cancel=async()=>{if(!activeId)return;abort.current?.abort();try{await post('/veterinary/uploads/'+activeId+'/cancel',{});await refresh();}catch(error){toast.error(message(error));}};
  const target=():UploadTarget=>({mode:mode||'link',patient_id:selectedId,...(mode==='link'?{exam_id:examId}:{study_type_id:studyType,clinical_question:question}),confirm_identity:confirmed});
  const beginAction=(next:'link'|'create')=>{
    setMode(next);setPreview(null);setConfirmed(false);setExamId(next==='link'&&current?.selection.mode==='link'?current.selection.exam_id||'':'');
    if(next==='create'){
      const matches=studyTypes.data?.filter(type=>type.name.trim().toLowerCase()===current?.summary.description?.trim().toLowerCase()&&(!type.modality||current.summary.modalities?.includes(type.modality)));
      setStudyType(current?.selection.study_type_id||(matches?.length===1?matches[0].id:''));
    }
  };
  const review=async()=>{setSubmitting(true);try{setPreview((await api.post<{data:UploadPreview}>('/veterinary/uploads/'+activeId+'/preview',target(),{timeout:SLOW_REQUEST_MS})).data.data);}catch(error){toast.error(message(error));}finally{setSubmitting(false);}};
  const finalize=async()=>{
    setSubmitting(true);
    const ticket=mode==='create'?prepareViewerWindow():null;
    if(mode==='create'&&!ticket)toast.info('El navegador bloqueó el visor. Podrá abrirlo desde el redactor.');
    try{
      const result=(await api.post<{data:UploadSession}>('/veterinary/uploads/'+activeId+'/finalize',target(),{timeout:SLOW_REQUEST_MS})).data.data;
      if(mode==='create'){openingSession.current=activeId;viewer.current=ticket;}
      setMode(null);setPreview(null);qc.setQueryData(['veterinary','upload',activeId],result);await refresh();
    }catch(error){if(ticket)cancelPreparedViewer(ticket);toast.error(message(error));}
    finally{setSubmitting(false);}
  };
  const newLoad=()=>{setActiveId('');setPatientId('');setMode(null);setPreview(null);setProgress(0);};
  const canReceive=!uploading&&(!current||current.state==='receiving');
  return <MainLayout mobileTitle="Cargar Estudio"><div className="page-dark-gradient z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg p-3 shadow-sm">
    <DynamicBreadcrumb/><header className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-lg bg-brand-purple p-2 text-white"><UploadCloud className="h-5 w-5"/></div><h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Cargar Estudio</h1></div>{current&&<Button variant="outline" onClick={newLoad} disabled={uploading}>Otra carga</Button>}</header>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      {(!current||current.state==='receiving')&&<section onDrop={event=>void drop(event)} onDragOver={event=>{event.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging?'border-brand-purple bg-purple-50 dark:bg-purple-950':'border-purple-300 bg-card/70 dark:border-purple-800'}`}>
        <UploadCloud className="mx-auto mb-3 h-12 w-12 text-brand-purple dark:text-purple-400"/><h2 className="text-lg font-semibold">Arrastrá una carpeta o ZIP con un solo estudio</h2><p className="mt-2 text-sm text-muted-foreground">Se incluyen las subcarpetas y todas las series del estudio. Hasta 2 GiB descomprimidos y 10.000 archivos.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3"><Button variant="outline" disabled={!canReceive} onClick={()=>folderInput.current?.click()}><FolderOpen className="h-4 w-4"/>Seleccionar carpeta</Button><Button variant="outline" disabled={!canReceive} onClick={()=>fileInput.current?.click()}><Archive className="h-4 w-4"/>Seleccionar ZIP o archivos</Button></div>
        <input ref={folderInput} {...{webkitdirectory:''}} type="file" multiple className="hidden" aria-label="Seleccionar carpeta DICOM" onChange={event=>{void receive(Array.from(event.target.files||[]).map(file=>({file,name:file.webkitRelativePath||file.name})));event.target.value='';}}/>
        <input ref={fileInput} type="file" multiple className="hidden" aria-label="Seleccionar ZIP o archivos DICOM" onChange={event=>{void receive(Array.from(event.target.files||[]).map(file=>({file,name:file.name})));event.target.value='';}}/>
      </section>}
      {uploading&&<section className="rounded-lg border bg-card p-4"><p role="status" className="mb-2 text-sm">Recibiendo archivos · {progress}%</p><Progress value={progress}/><Button variant="ghost" className="mt-2" onClick={()=>void cancel()}>Cancelar carga</Button></section>}
      {detail.isError&&<p role="alert" className="text-destructive">No se pudo recuperar la carga. Seleccione otra carga de la lista.</p>}
      {current&&<section className="space-y-3 rounded-xl border bg-card/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold">{busyStates.has(current.state)?<Loader2 className="h-4 w-4 animate-spin"/>:current.state==='completed'?<CheckCircle2 className="h-4 w-4 text-emerald-600"/>:<FileUp className="h-4 w-4"/>}{labels[current.state]}</h2><span className="text-sm text-muted-foreground">{current.summary.instance_count||current.instances||current.files} archivos · {Math.round(Number(current.total_bytes)/1024**2)} MiB recibidos</span></div>
        {current.error&&<p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{current.error}</p>}
        {current.summary.study_uid&&<><dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><div><dt className="text-muted-foreground">Identidad DICOM</dt><dd>{current.summary.patient_name||'Sin nombre'} · {current.summary.patient_id||'Sin ID'}</dd></div><div><dt className="text-muted-foreground">Descripción / modalidad</dt><dd>{current.summary.description||'Sin descripción'} · {current.summary.modalities?.join(', ')||'Sin informar'}</dd></div><div><dt className="text-muted-foreground">Contenido</dt><dd>{current.summary.series_count} series · {current.summary.instance_count} instancias · {current.summary.duplicate_count||0} duplicados omitidos</dd></div></dl><p className="break-all text-xs text-muted-foreground">StudyInstanceUID: {current.summary.study_uid}</p></>}
        {Boolean(current.summary.ignored_count)&&<details><summary className="cursor-pointer text-sm">{current.summary.ignored_count} archivos omitidos</summary><ul className="mt-2 max-h-40 overflow-auto text-xs text-muted-foreground">{current.summary.ignored?.map((file,index)=><li key={index}>{file.name} · {file.reason}</li>)}</ul></details>}
        {['transferring','verifying','queued_transfer'].includes(current.state)&&<><Progress value={current.instances?current.sent/current.instances*100:0}/><p className="text-sm text-muted-foreground">{current.sent} de {current.instances} instancias enviadas. Puede salir de esta pantalla; la transferencia continuará.</p></>}
        {(current.state==='ready'||current.state==='retryable')&&<div className="space-y-4 border-t pt-4"><p className="text-sm text-muted-foreground">{current.transfer_started?'La selección queda fijada para recuperar la transferencia sin duplicados.':'Los archivos están recibidos. Seleccione el animal antes de enviar las imágenes al PACS.'}</p>
          {!current.transfer_started&&<><div className="flex flex-wrap gap-2"><Input aria-label="Buscar animal para el estudio" placeholder="Buscar animal, ID o responsable" value={animalSearch} onChange={event=>setAnimalSearch(event.target.value)} className="min-w-48 flex-1"/>{can('patients.manage')&&<Button variant="outline" onClick={()=>setNewAnimal(true)}><Plus className="h-4 w-4"/>Nuevo animal</Button>}</div>
          <div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">{patients.data?.data.map(patient=><button type="button" key={patient.guid} onClick={()=>{setPatientId(patient.guid);setPreview(null);}} className={`rounded-lg border p-3 text-left text-sm ${selectedId===patient.guid?'border-brand-purple bg-purple-50 dark:bg-purple-950':'hover:bg-accent'}`}><strong>{patient.name} · {patient.patientid}</strong><span className="block text-muted-foreground">{patient.veterinary.species_name||'Especie pendiente'} · {patient.responsibles.map(owner=>owner.name).join(', ')||'Responsable pendiente'}</span></button>)}{patients.data?.data.length===0&&<p className="text-sm text-muted-foreground">No se encontraron animales. Puede registrar uno nuevo.</p>}</div></>}
          {animal.data&&<p className="rounded border border-purple-200 p-3 text-sm dark:border-purple-800">Animal seleccionado: <strong>{animal.data.name} · {animal.data.patientid}</strong> · Responsables: {animal.data.responsibles.map(owner=>owner.name).join(', ')||'Pendiente'}</p>}
          <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={!selectedId||Boolean(current.transfer_started&&current.selection.mode!=='link')} onClick={()=>beginAction('link')}><Link2 className="h-4 w-4"/>{current.transfer_started?'Reintentar vinculación':'Vincular a una orden'}</Button>{can('reports.write')&&can('admissions.create_spontaneous')&&can('images.view')&&<Button className="bg-brand-purple text-white hover:bg-brand-purple/90" disabled={!selectedId||Boolean(current.transfer_started&&current.selection.mode!=='create')} onClick={()=>beginAction('create')}><FileUp className="h-4 w-4"/>{current.transfer_started?'Reintentar y generar reporte':'Generar reporte'}</Button>}</div>
        </div>}
        {current.state==='completed'&&current.result.exam_id&&<div className="flex flex-wrap items-center gap-3 border-t pt-4"><span className="text-sm">Orden {current.result.accession}</span>{can('reports.write')&&can('images.view')&&<Button disabled={opening} onClick={()=>{const ticket=prepareViewerWindow();void openReport(current.result as UploadResult,ticket);}}>Abrir informe y visor</Button>}<ExamViewerButton examId={current.result.exam_id}/></div>}
        {(['receiving','ready','rejected','queued_analysis'].includes(current.state)||(current.state==='retryable'&&!current.transfer_started))&&!uploading&&<Button variant="ghost" size="sm" onClick={()=>void cancel()}>Cancelar esta carga</Button>}
      </section>}
      <section className="rounded-xl border bg-card/70 p-4"><h2 className="mb-3 font-semibold">Cargas recientes</h2><div className="space-y-2">{sessions.data?.map(upload=><button type="button" key={upload.id} onClick={()=>choose(upload)} disabled={uploading} className={`flex w-full flex-wrap items-center justify-between gap-2 rounded border p-3 text-left text-sm hover:bg-accent ${activeId===upload.id?'border-brand-purple':''}`}><span>{upload.summary.patient_name||'Estudio pendiente de analizar'} · {upload.summary.description||new Date(upload.created_at).toLocaleString()}</span><span className="text-muted-foreground">{labels[upload.state]}</span></button>)}{sessions.data?.length===0&&<p className="text-sm text-muted-foreground">Todavía no hay cargas.</p>}</div></section>
    </div>
    <Modal isOpen={Boolean(mode)} onClose={()=>{if(!submitting)setMode(null);}} title={mode==='create'?'Generar reporte':'Vincular a una orden'} size="xxl"><div className="space-y-4"><p className="text-sm"><strong>{animal.data?.name}</strong> · {animal.data?.patientid}</p>
      {!preview&&<>{mode==='link'?<><Input aria-label="Buscar orden" placeholder="Número de orden o tipo de estudio" value={orderSearch} onChange={event=>setOrderSearch(event.target.value)}/><label className="block text-sm">Orden existente<select aria-label="Orden existente" className={selectClass} value={examId} onChange={event=>setExamId(event.target.value)} disabled={current?.transfer_started}><option value="">Seleccione una orden del animal</option>{orders.data?.filter(order=>(order.localacc+' '+order.study_type).toLowerCase().includes(orderSearch.toLowerCase())).map(order=><option key={order.guid} value={order.guid} disabled={Boolean(order.isreported||order.workflow_state==='cancelled'||(order.isimage&&order.studyinstanceuid!==current?.summary.study_uid))}>{order.localacc} · {order.study_type}{order.isreported?' · Informada':order.workflow_state==='cancelled'?' · Cancelada':''}</option>)}</select></label></>:<><label className="block text-sm">Tipo de estudio<select aria-label="Tipo de estudio para generar reporte" className={selectClass} value={studyType} disabled={current?.transfer_started} onChange={event=>setStudyType(event.target.value)}><option value="">Confirme el tipo de estudio</option>{studyTypes.data?.map(type=><option value={type.id} key={type.id}>{type.name}</option>)}</select></label><label className="block text-sm">Motivo / pregunta clínica<Input value={question} disabled={current?.transfer_started} onChange={event=>setQuestion(event.target.value)}/></label><p className="text-xs text-muted-foreground">Se creará una orden y un informe en borrador cuando las imágenes estén disponibles. No se firmará automáticamente.</p></>}
        <Button disabled={submitting||Boolean(mode==='link'?!examId:!studyType)} onClick={()=>void review()}>{submitting?'Revisando…':'Revisar y continuar'}</Button></>}
      {preview&&<><p className="text-sm">Acceso RIS: <strong>{preview.accession}</strong>. Se conservará el DICOM original.</p>{preview.differences.length>0&&<><div className="overflow-auto rounded border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-2">Dato</th><th>DICOM recibido</th><th>RIS confirmado</th></tr></thead><tbody>{preview.differences.map((difference,index)=><tr className="border-t" key={index}><td className="p-2">{difference.field}</td><td>{difference.dicom||'Sin informar'}</td><td>{difference.ris||'Sin informar'}</td></tr>)}</tbody></table></div><label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>Confirmo que las imágenes corresponden a este animal y autorizo conciliar estos datos con la orden.</label></>}
        <div className="flex gap-2"><Button variant="outline" disabled={submitting} onClick={()=>setPreview(null)}>Volver</Button><Button disabled={submitting||(preview.differences.length>0&&!confirmed)} onClick={()=>void finalize()}>{submitting?'Confirmando…':mode==='create'?'Generar reporte':'Confirmar vinculación'}</Button></div></>}
    </div></Modal>
    <Modal isOpen={newAnimal} onClose={()=>setNewAnimal(false)} title="Nuevo animal para el estudio" size="xxl"><div className="space-y-4">{can('veterinary.responsibles.manage')&&<div className="space-y-2"><label className="block text-sm">Responsable (opcional)<select aria-label="Responsable opcional del nuevo animal" value={responsibleId} onChange={event=>setResponsibleId(event.target.value)} className={selectClass}><option value="">Responsable pendiente</option>{responsibles.data?.filter(owner=>owner.is_active).map(owner=><option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label><Button variant="outline" size="sm" onClick={()=>setNewResponsible(true)}>Nuevo responsable</Button></div>}
      <VeterinaryForm fields={[{key:'name',label:'Nombre del animal',required:true},{key:'species_id',label:'Especie',type:'select',required:true,options:(species.data||[]).map(item=>({value:item.id,label:item.name}))},{key:'breed_id',label:'Raza',type:'select',options:(breeds.data||[]).map(item=>({value:item.id,label:item.name,parent:item.species_id}))},{key:'gender',label:'Sexo',type:'select',options:[{value:'M',label:'Macho'},{value:'F',label:'Hembra'},{value:'O',label:'Desconocido'}]},{key:'birthdate',label:'Fecha de nacimiento',type:'date'},{key:'birthdate_estimated',label:'Nacimiento estimado',type:'checkbox'},{key:'weight_kg',label:'Peso registrado (kg)',type:'number'},{key:'reproductive_status',label:'Estado reproductivo',type:'select',options:[{value:'unknown',label:'Desconocido'},{value:'intact',label:'No esterilizado'},{value:'neutered',label:'Esterilizado'}]}]} initial={{gender:'O',reproductive_status:'unknown'}} onSubmit={async values=>{
        const saved=await post<Animal>('/patients',{name:values.name,gender:values.gender,birthdate:values.birthdate||null,veterinary:{species_id:values.species_id,breed_id:values.breed_id||null,birthdate_estimated:values.birthdate_estimated==='true',reproductive_status:values.reproductive_status||'unknown',...(values.weight_kg?{weight_kg:Number(values.weight_kg)}:{})}});
        setPatientId(saved.guid);setNewAnimal(false);
        if(responsibleId){try{await post('/veterinary/patients/'+saved.guid+'/responsibles',{responsible_id:responsibleId,role:'owner',is_primary:true,portal_authorized:false});}catch(error){toast.error('El animal fue creado, pero falta vincular el responsable: '+message(error));}}
        await qc.invalidateQueries({queryKey:['veterinary']});
      }}/></div></Modal>
    <Modal isOpen={newResponsible} onClose={()=>setNewResponsible(false)} title="Nuevo responsable" size="xxl"><VeterinaryForm fields={[{key:'name',label:'Nombre del responsable',required:true},{key:'email',label:'Email',type:'email'},{key:'phone',label:'Teléfono'}]} onSubmit={async values=>{const saved=await post<Responsible>('/veterinary/responsibles',{...values,kind:'person'});setResponsibleId(saved.id);setNewResponsible(false);await qc.invalidateQueries({queryKey:['veterinary','upload-responsibles']});}}/></Modal>
  </div></MainLayout>;
}
