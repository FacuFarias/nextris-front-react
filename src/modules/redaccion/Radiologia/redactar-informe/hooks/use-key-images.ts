import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteKeyImage, getKeyImages } from '@/services/keyImages.service';

// El visor abre en otra ventana, a veces en otro monitor: sin sondeo la imagen nueva no aparecería.
const REFRESH_MS = 5000;

export const useKeyImages = (studyUid: string) => {
    const queryClient = useQueryClient();
    const queryKey = ['key-images', studyUid];
    const { data, refetch } = useQuery({
        queryKey,
        queryFn: () => getKeyImages(studyUid),
        enabled: !!studyUid,
        refetchInterval: REFRESH_MS,
    });
    const { mutateAsync: deleteImage } = useMutation({
        mutationFn: deleteKeyImage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
    return { keyImages: data ?? [], refetch, deleteImage };
};
