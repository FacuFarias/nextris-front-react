// hooks/use-cross-windows.ts
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { informesKeys } from '../../constants/query-keys';

const CHANNEL_NAME = 'informe-updates';

type InformeEventType =
    | 'INFORME_SIGNED'
    | 'INFORME_UPDATED'
    | 'INFORME_DELETED'
    | 'INFORME_UNBLOCKED'
    | 'GUID_UPDATE'
    | 'VIEWER_UPDATE';

interface BroadcastMessage {
    type: InformeEventType;
    windowId?: string;
    guid?: string;
    studyInstanceUid?: string;
    timestamp?: number;
}

// ✅ SINGLETON - Canal compartido para toda la aplicación
let broadcastChannel: BroadcastChannel | null = null;

const getBroadcastChannel = (): BroadcastChannel => {
    if (!broadcastChannel) {
        broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    }
    return broadcastChannel;
};

/**
 * Hook para sincronizar cambios entre ventanas/pestañas
 */
export const useCrossWindowSync = () => {
    const queryClient = useQueryClient();
    const listenerAdded = useRef(false);

    useEffect(() => {
        // Evitar agregar el listener múltiples veces

        const channel = getBroadcastChannel();

        const handleMessage = (event: MessageEvent<BroadcastMessage>) => {
            const { type, windowId, guid } = event.data;


            switch (type) {
                case 'INFORME_SIGNED':
                case 'INFORME_UPDATED':
                case 'INFORME_DELETED':
                case 'INFORME_UNBLOCKED':
                    queryClient.invalidateQueries({
                        queryKey: informesKeys.lists()
                    });
                    break;

                case 'GUID_UPDATE':
                    if (windowId) {
                        if (guid) {
                            localStorage.setItem(windowId, guid);
                        } else {
                            localStorage.removeItem(windowId);
                        }

                    }
                    break;

                case 'VIEWER_UPDATE':
                    // Este evento es manejado en el componente Radiologia.tsx
                    // Aquí solo lo dejamos pasar para que el listener específico lo capture
                    break;
            }
        };

        channel.addEventListener('message', handleMessage);
        listenerAdded.current = true;

        return () => {
            channel.removeEventListener('message', handleMessage);
            listenerAdded.current = false;
        };
    }, [queryClient]);
};

/**
 * Notifica cambio de GUID
 */
export const notifyGuidChange = (windowId: string, guid: string) => {
    const channel = getBroadcastChannel();
    channel.postMessage({
        type: 'GUID_UPDATE',
        windowId,
        guid: guid || undefined,
        timestamp: Date.now(),
    });
}

/**
 * Notifica eventos de informe
 */
export const notifyInformeChange = (
    type: 'INFORME_SIGNED' | 'INFORME_UPDATED' | 'INFORME_DELETED' | 'INFORME_UNBLOCKED'
) => {
    const channel = getBroadcastChannel();
    channel.postMessage({
        type,
        timestamp: Date.now()
    });
};

/**
 * Limpia storage y notifica
 */
export const clearWindowStorage = (windowId: string) => {
    localStorage.removeItem(windowId);
    notifyGuidChange(windowId, '');
};

/**
 * Notifica cambio del visor de imágenes
 */
export const notifyViewerUpdate = (windowId: string, studyInstanceUid: string, guid: string) => {
    const channel = getBroadcastChannel();
    channel.postMessage({
        type: 'VIEWER_UPDATE',
        windowId,
        studyInstanceUid,
        guid,
        timestamp: Date.now(),
    });
};