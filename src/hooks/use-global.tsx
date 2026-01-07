import { getEquiposPorLocacion, getEstudios, getImagenesPorEstudio, getMedicosAll, getMedicosPorLocacion, getModalidades, getObrasSocialesPorLocacion, getPartesCuerpo } from '@/services/api-global.service';
import { useQuery } from '@tanstack/react-query';
import { globalKeys } from '@/constants/query-keys';


interface ParteCuerpo {
    guid: string;
    description: string;
}

interface Modalidad {
    guid: string;
    description: string;
    externalcode: string;
}

interface MedicosPorLocacion {
    guid: string;
    description: string;
}

interface MedicosAll {
    guid: string;
    name: string;
}


interface ImagenesPorEstudio {
    images: Array<{
        filename: string;
        path: string;
        size: number;
    }>;
    images_count: number;
    study_uid: string;
}
export const usePartesDelCuerpo = () => {
    const { data, isLoading } = useQuery<ParteCuerpo[]>({
        queryKey: globalKeys.partesDelCuerpo(),
        queryFn: () => getPartesCuerpo(),
    });
    return { data, isLoading };
}


export const useModalidades = () => {
    const { data, isLoading } = useQuery<Modalidad[]>({
        queryKey: globalKeys.modalidades(),
        queryFn: () => getModalidades(),
    });
    return { data, isLoading };
}


export const useEstudiosPorModalidad = () => {
    const { data, isLoading } = useQuery<any[]>({
        queryKey: globalKeys.estudios(),
        queryFn: () => getEstudios(),
        enabled: true, // Siempre ejecutar la consulta
    });
    return { data, isLoading };
}

export const useEquiposPorLocacion = (locationGuid: string, modalityId?: string) => {
    const { data, isLoading } = useQuery<any[]>({
        queryKey: globalKeys.equiposPorLocacion(locationGuid, modalityId),
        queryFn: () => getEquiposPorLocacion(locationGuid, modalityId),
        enabled: !!locationGuid, // Ejecutar solo si locationGuid está definido
    });
    return { data, isLoading };
}

export const useMedicosPorLocacion = (locationGuid: string) => {
    const { data, isLoading } = useQuery<MedicosPorLocacion[]>({
        queryKey: globalKeys.medicosPorLocacion(locationGuid),
        queryFn: () => getMedicosPorLocacion(locationGuid),
        enabled: !!locationGuid, // Ejecutar solo si locationGuid está definido
    });
    return { data, isLoading };
}
export const useMedicosAll = () => {
    const { data, isLoading } = useQuery<MedicosAll[]>({
        queryKey: globalKeys.medicosAll(),
        queryFn: () => getMedicosAll(),
        enabled: true, // Siempre ejecutar la consulta
    });
    return { data, isLoading };
}

export const useObrasSocialesPorLocacion = (locationGuid: string) => {
    const { data, isLoading } = useQuery<any[]>({
        queryKey: globalKeys.obrasSocialesPorLocacion(locationGuid),
        queryFn: () => getObrasSocialesPorLocacion(locationGuid),
        enabled: !!locationGuid, // Ejecutar solo si locationGuid está definido
    });
    return { data, isLoading };
}

export const useImagenesPorEstudio = (studyGuid: string) => {
    const { data, isLoading } = useQuery<ImagenesPorEstudio>({
        queryKey: globalKeys.imagenesPorEstudio(studyGuid),
        queryFn: () => getImagenesPorEstudio(studyGuid),
        enabled: !!studyGuid, // Ejecutar solo si studyGuid está definido
    });
    return { data, isLoading };
}