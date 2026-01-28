import { api } from "@/lib/api";
import type { ReasignacionExamenesPacientesResponse, ReasignacionExamenesResponse } from "../types/reasignacion-examenes.type";

export const reasignacionExamenesService = {
    getAllEstudios: async (): Promise<ReasignacionExamenesResponse> => {
        const response = await api.get('/studies/reassign/list');
        return response.data;
    },
    getAllPacientes: async (): Promise<ReasignacionExamenesPacientesResponse> => {
        const response = await api.get('/patients/reassign/list');
        return response.data;
    },
    postReasignacion: async ({ estudio_id, paciente_id }: { estudio_id: string, paciente_id: string }): Promise<any> => {
        const response = await api.post('/studies/reassign', { estudio_id, paciente_id });
        return response.data;
    },
};