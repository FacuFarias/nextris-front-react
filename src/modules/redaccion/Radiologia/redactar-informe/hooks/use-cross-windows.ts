// hooks/useCrossWindowSync.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { informesKeys } from '../../constants/query-keys';

export const useCrossWindowSync = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = new BroadcastChannel('informe-updates');

        channel.onmessage = (event) => {
            switch (event.data.type) {
                case 'INFORME_SIGNED':
                case 'INFORME_UPDATED':
                case 'INFORME_DELETED':
                    queryClient.invalidateQueries({
                        queryKey: informesKeys.lists()
                    });
                    break;
            }
        };

        return () => {
            channel.close();
        };
    }, [queryClient]);
};

// Función helper para notificar cambios
export const notifyInformeChange = (type: 'INFORME_SIGNED' | 'INFORME_UPDATED' | 'INFORME_DELETED') => {
    const channel = new BroadcastChannel('informe-updates');
    channel.postMessage({ type });
    channel.close();
};