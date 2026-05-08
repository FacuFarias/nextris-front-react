import { useMutation } from "@tanstack/react-query";
import { postNextExam } from "../services/redactar-informe.service";

interface NextExamParams {
    modality_id?: string | null;
    body_part_id?: string | null;
    study_group_id?: string | null;
    facility_id?: string | null;
}

export const useNextExam = () => {
    return useMutation({
        mutationFn: (payload: NextExamParams) => postNextExam(payload),
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error: any) => {
            console.error('Error al obtener siguiente examen:', error);
        }
    });
};