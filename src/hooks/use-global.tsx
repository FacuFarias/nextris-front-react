import { getEquiposPorLocacion, getEstudios, getMedicosPorLocacion, getModalidades, getObrasSocialesPorLocacion, getPartesCuerpo } from '@/services/api-global.service';
import { useQuery } from '@tanstack/react-query';


interface ParteCuerpo {
    guid: string;
    description: string;
}

interface Modalidad {
    guid: string;
    description: string;
    externalcode: string;
}
export const usePartesDelCuerpo = () => {
    const { data, isLoading } = useQuery<ParteCuerpo[]>({
        queryKey: ['partes-del-cuerpo'],
        queryFn: () => getPartesCuerpo(),
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
    return { data, isLoading };
}


export const useModalidades = () => {
    const { data, isLoading } = useQuery<Modalidad[]>({
        queryKey: ['modalidades'],
        queryFn: () => getModalidades(),
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
    return { data, isLoading };
}


export const useEstudiosPorModalidad = () => {
    const { data, isLoading } = useQuery<any[]>({
        queryKey: ['estudios-por-modalidad'],
        queryFn: () => getEstudios(),
        staleTime: 10 * 60 * 1000, // 10 minutos
        enabled: true, // Siempre ejecutar la consulta
    });
    return { data, isLoading };
}

export const useEquiposPorLocacion = (locationGuid: string) => {
    const { data, isLoading } = useQuery<any[]>({
        queryKey: ['equipos-por-locacion', locationGuid],
        queryFn: () => getEquiposPorLocacion(locationGuid),
        staleTime: 10 * 60 * 1000, // 10 minutos
        enabled: !!locationGuid, // Ejecutar solo si locationGuid está definido
    });
    return { data, isLoading };
}

export const useMedicosPorLocacion = (locationGuid: string) => {
    const { data, isLoading } = useQuery<any[]>({
        queryKey: ['medicos-por-locacion', locationGuid],
        queryFn: () => getMedicosPorLocacion(locationGuid),
        staleTime: 10 * 60 * 1000, // 10 minutos
        enabled: !!locationGuid, // Ejecutar solo si locationGuid está definido
        retry: 1,

    });
    return { data, isLoading };
}

export const useObrasSocialesPorLocacion = (locationGuid: string) => {
    const { data, isLoading } = useQuery<any[]>({
        queryKey: ['obras-sociales-por-locacion', locationGuid],
        queryFn: () => getObrasSocialesPorLocacion(locationGuid),
        staleTime: 10 * 60 * 1000, // 10 minutos
        enabled: !!locationGuid, // Ejecutar solo si locationGuid está definido
        retry: 1,
    });
    return { data, isLoading };
}