import { useState } from 'react';
import { Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getDicomViewerUrl } from '@/services/dicomViewer';
import { prepareViewerWindow, openStudyInViewer, cancelPreparedViewer } from '@/services/viewerWindow';
import { toast } from 'sonner';

export function ExamViewerButton({examId}:{examId:string}) {
  const {authData}=useAuth();const [busy,setBusy]=useState(false);
  if(!authData?.user.permissions?.some(permission=>permission==='*'||permission==='images.view'))return null;
  const open=async()=>{
    const ticket=prepareViewerWindow();
    if(!ticket){toast.error('Permita las ventanas emergentes y vuelva a pulsar Abrir visor.');return;}
    setBusy(true);
    try{const data=await getDicomViewerUrl(authData.user.id,examId);await openStudyInViewer(ticket,{studyInstanceUID:data.study_uid,viewerUrl:data.viewer_url});}
    catch(error){cancelPreparedViewer(ticket);toast.error(error instanceof Error?error.message:'No se pudo abrir el visor.');}
    finally{setBusy(false);}
  };
  return <Button variant="outline" size="sm" disabled={busy} onClick={()=>void open()}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Image className="h-4 w-4"/>}Abrir visor</Button>;
}
