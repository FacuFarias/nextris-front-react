import { api } from '@/lib/api';

export const getModalidades = async () => {
    try {
        const response = await api.get(`/config/modalities`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};



export const getPartesCuerpo = async () => {
    try {
        const response = await api.get(`/config/body-parts`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const getEstudios = async () => {
    try {
        const response = await api.get(`/study-types`);
        const data = response.data.data;

        return data.map((item: any[]) => ({
            guid: item[0],
            externalcode: item[1],
            description: item[2],
            modality: item[3],
            bodypart: item[4],
            studygroup: item[5],
            modalityName: item[3] === 'RX' ? 'RAYOS X' : item[3] === 'CT' ? 'TOMOGRAFIA' : item[3] === 'RMN' ? 'RESONANCIA' : item[3] === 'US' ? 'ECOGRAFIA' : item[3] === 'MG' ? 'MAMOGRAFÍA' : 'OTRO',
        }));
    } catch (error) {
        throw error;
    }
};


export const getEquiposPorLocacion = async (locationGuid: string, modalityId?: string) => {
    try {
        const response = await api.get(`/config/equipment?location_id=${locationGuid}&modality_id=${modalityId || ''}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};


export const getMedicosPorLocacion = async (locationGuid: string) => {
    try {
        const response = await api.get(`/institutional/locations/${locationGuid}/physicians`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const getRadsPerLocation = async (locationGuid: string) => {
    try {
        const response = await api.get(`/institutional/locations/${locationGuid}/rads_per_location`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};


export const getMedicosAll = async () => {
    try {
        const response = await api.get(`/users_physician`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};
export const getObrasSocialesPorLocacion = async (locationGuid: string) => {
    try {
        const response = await api.get(`/institutional/locations/${locationGuid}/health-insurances`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export const getImagenesPorEstudio = async (studyGuid: string) => {
    try {
        const response = await api.get(`/images/study/${studyGuid}?format=base64`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
}