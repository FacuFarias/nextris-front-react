import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postQuitarFirma } from '../services/redactar-informe.service';
import { toast } from 'sonner';
import { informesKeys } from '../../constants/query-keys';
import { notifyInformeChange } from './use-cross-windows';

export const useQuitarFirma = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId }: { examId: string }) => postQuitarFirma({ examId: examId }),
        onSuccess: (response) => {
            toast.success(response.message || 'Se quitó la firma del informe');
            queryClient.invalidateQueries({ queryKey: informesKeys.all });
            notifyInformeChange('INFORME_SIGNED');

        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al quitar la firma del informe');
        }
    });
}
