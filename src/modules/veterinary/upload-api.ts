import { api } from '@/lib/api';

export type UploadState = 'receiving'|'queued_analysis'|'analyzing'|'ready'|'rejected'|'queued_transfer'|'transferring'|'verifying'|'retryable'|'completed'|'cancelled'|'expired';
export interface UploadResult { exam_id: string; patient_id: string; study_uid: string; mode: 'create'|'link'; accession: string }
export interface UploadSession {
  id: string; state: UploadState; total_bytes: number; received_bytes: number; files: number; instances: number;
  sent: number; verified: number; error?: string; transfer_started: boolean; created_at: string;
  summary: { study_uid?: string; patient_name?: string; patient_id?: string; accession?: string; description?: string;
    modalities?: string[]; series_count?: number; instance_count?: number; ignored_count?: number; duplicate_count?: number;
    veterinary?: {species?: string; breed?: string}; ignored?: {name:string; reason:string}[] };
  selection: { mode?: 'create'|'link'; patient_id?: string; exam_id?: string; study_type_id?: string };
  result: UploadResult | Record<string, never>;
  limits: {max_bytes:number; max_files:number; chunk_bytes:number};
}
export interface UploadTarget { mode: 'link'|'create'; patient_id: string; exam_id?: string; study_type_id?: string; clinical_question?: string; confirm_identity?: boolean }
export interface UploadPreview { differences: {field:string; dicom:string; ris:string}[]; exam_id: string; accession: string }
export interface DroppedFile { file: File; name: string }
interface Entry { isFile: boolean; isDirectory: boolean; name: string; file: (success:(file:File)=>void,fail:(error:DOMException)=>void)=>void;
  createReader:()=>{readEntries:(success:(entries:Entry[])=>void,fail:(error:DOMException)=>void)=>void} }

export async function readDrop(items: DataTransferItemList, fallback: FileList): Promise<DroppedFile[]> {
  // webkitGetAsEntry solo es válido de forma síncrona durante el evento drop.
  const entries=Array.from(items).map(item=>item.webkitGetAsEntry() as unknown as Entry|null).filter((entry):entry is Entry=>Boolean(entry));
  if (!entries.length) return Array.from(fallback).map(file=>({file,name:file.webkitRelativePath||file.name}));
  const files:DroppedFile[]=[];
  const visit=async(entry:Entry,prefix=''):Promise<void>=>{
    const name=prefix+entry.name;
    if(entry.isFile){const file=await new Promise<File>((resolve,reject)=>entry.file(resolve,reject));files.push({file,name});if(files.length>10000)throw Error('La carpeta supera el límite de 10.000 archivos.');}
    if(entry.isDirectory){const reader=entry.createReader();while(true){const children=await new Promise<Entry[]>((resolve,reject)=>reader.readEntries(resolve,reject));if(!children.length)break;for(const child of children)await visit(child,name+'/');}}
  };
  for(const entry of entries)await visit(entry);
  return files;
}

export async function transferFiles(session:UploadSession,files:DroppedFile[],signal:AbortSignal,onProgress:(value:number)=>void){
  const valid=files.filter(item=>item.file.size>0);
  const total=valid.reduce((sum,item)=>sum+item.file.size,0);
  if(!total)throw Error('No se encontraron archivos con contenido.');
  if(valid.length>session.limits.max_files||total>session.limits.max_bytes)throw Error('La carga supera el límite de archivos o tamaño.');
  let sent=0;
  for(const item of valid){
    const created=await api.post<{data:{id:string}}>('/veterinary/uploads/'+session.id+'/files',{name:item.name,size:item.file.size},{signal});
    const fileId=created.data.data.id;
    // Replaying acknowledged blocks compares their contents server-side, preventing mixed files on resume.
    for(let offset=0;offset<item.file.size;offset+=session.limits.chunk_bytes){
      const block=item.file.slice(offset,offset+session.limits.chunk_bytes);
      await api.put('/veterinary/uploads/'+session.id+'/files/'+fileId,block,{params:{offset},headers:{'Content-Type':'application/octet-stream'},signal,timeout:120000});
      sent+=block.size;onProgress(Math.round(sent/total*100));
    }
  }
  await api.post('/veterinary/uploads/'+session.id+'/analyze',{}, {signal});
}
