import { openReportPdf } from '@/services/reportPdf';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/layouts/layout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { get,post,put } from './api';
import type { Animal,Study } from './api';
import { VeterinaryForm } from './VeterinaryPatients';

export function ResponsibleProfile(){
 const {data,isLoading}=useQuery({queryKey:['responsible-profile'],queryFn:()=>get<{name:string;email:string;phone:string;address:string}>('/veterinary/portal/profile')});
 return <MainLayout><div className="mx-auto max-w-2xl space-y-4 p-6"><h1 className="text-2xl font-bold">Mis datos de responsable</h1>{isLoading?<p>Cargando…</p>:data&&<><p>{data.name}</p><VeterinaryForm fields={[{key:'email',label:'Email',type:'email',required:true},{key:'phone',label:'Teléfono'},{key:'address',label:'Dirección'}]} initial={{email:data.email,phone:data.phone,address:data.address}} onSubmit={async d=>{await put('/veterinary/portal/profile',d)}}/></>}</div></MainLayout>
}
export function ResponsiblePortal(){
 const {authData,markPasswordChanged}=useAuth();const [selected,setSelected]=useState<string|null>(null);const [error,setError]=useState('');
 const needsPassword=Boolean(authData?.user.requires_password_change);
 const animals=useQuery({queryKey:['responsible-animals'],queryFn:()=>get<Animal[]>('/veterinary/portal/animals'),enabled:!needsPassword});
 const studies=useQuery({queryKey:['responsible-studies',selected],queryFn:()=>get<Study[]>('/veterinary/portal/animals/'+selected+'/studies'),enabled:!!selected&&!needsPassword});
 const run=async(fn:()=>Promise<void>)=>{setError('');try{await fn()}catch{setError('No se pudo acceder. Verifique que su autorización continúe vigente.')}};
 return <MainLayout><div className="mx-auto max-w-5xl space-y-6 p-5 md:p-8"><h1 className="text-2xl font-bold">Mis animales</h1><p className="text-muted-foreground">Estudios e informes de los animales para los que tiene autorización vigente.</p>
 {needsPassword?<section className="rounded-xl border p-5"><h2 className="mb-4 font-semibold">Cambie su contraseña inicial</h2><VeterinaryForm fields={[{key:'new_password',label:'Contraseña nueva (mínimo 8 caracteres)',type:'password',required:true},{key:'confirmation',label:'Repetir contraseña',type:'password',required:true}]} onSubmit={async d=>{if((d.new_password||'').length<8||d.new_password!==d.confirmation)throw Error('Las contraseñas deben coincidir y tener al menos 8 caracteres');await post('/auth/change-password',{new_password:d.new_password});markPasswordChanged()}} label="Actualizar contraseña"/></section>:<>
 {animals.error&&<p role="alert">No se pudieron cargar sus animales.</p>}{animals.data?.length===0&&<p>Todavía no tiene animales con acceso autorizado. Solicite la vinculación al centro.</p>}
 <div className="grid gap-3 sm:grid-cols-2">{animals.data?.map(a=><button className="rounded-xl border p-5 text-left hover:bg-muted" key={a.guid} onClick={()=>{setSelected(a.guid)}}><strong>{a.name}</strong><p className="text-sm">{a.patientid} · {a.veterinary.species_name||'Especie pendiente'} · {a.veterinary.breed_name||'Raza desconocida'}</p></button>)}</div>
 {selected&&<section className="space-y-3"><h2 className="text-xl font-semibold">Estudios</h2>{studies.error&&<p role="alert">No tiene acceso a los estudios de este animal.</p>}{studies.data?.length===0&&<p>No hay estudios disponibles.</p>}{studies.data?.map(s=><div key={s.guid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><span>{s.study_type} · {new Date(s.createdon).toLocaleDateString()}</span><div className="flex gap-2">{Boolean(s.isreported)&&<><Button variant="outline" onClick={()=>run(()=>openReportPdf('/veterinary/portal/reports/'+s.guid+'/pdf'))}>Ver informe</Button><Button variant="outline" onClick={()=>run(async()=>{const r=await api.get('/veterinary/portal/reports/'+s.guid+'/pdf',{responseType:'blob'});const url=URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download='informe-veterinario.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})}>Descargar PDF</Button></>}{s.has_images&&<Button onClick={()=>run(async()=>{const result=await post<{viewer_url:string}>('/veterinary/portal/images/'+s.guid,{});window.open(result.viewer_url,'_blank','noopener,noreferrer')})}>Ver imágenes</Button>}</div></div>)}</section>}
 {error&&<p role="alert" className="text-red-600">{error}</p>}
 </>}
 </div></MainLayout>
}
