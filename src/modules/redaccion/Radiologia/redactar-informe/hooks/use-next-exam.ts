import { useMutation } from "@tanstack/react-query";
import { postNextExam } from "../services/redactar-informe.service";

interface NextExamParams {
    current_exam_id: string;
    show_ready?: boolean;
    show_reported?: boolean;
    assigned_to_me?: boolean;
    show_no_image?: boolean;
    show_without_order?: boolean;
    sort_column?: string;
    sort_direction?: 'asc' | 'desc';
    modality_id?: string | null;
    body_part_id?: string | null;
    study_group_id?: string | null;
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
