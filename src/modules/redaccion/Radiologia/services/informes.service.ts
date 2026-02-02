import { api } from "@/lib/api"

export const getInformes = async ({ page = 1, per_page = 8, search = "", show_reported = false, show_ready = false, modality_id = "", bodypart_id = "", study_group_id = "" }) => {

    try {
        const response = await api.get(`/examinations/for-reporting?page=${page}&per_page=${per_page}&search=${search}&show_reported=${show_reported}&show_ready=${show_ready}&modality_id=${modality_id}&body_part_id=${bodypart_id}&study_group_id=${study_group_id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getInformeDetalle = async (guid: string | undefined) => {
    try {
        const response = await api.get(`/examinations/${guid}/report`);
        return response.data;
    } catch (error) {
        throw error;
    }
}


export interface UpdateReportPayload {
    findings?: string;
    impressions?: string;
    techniques?: string;
    conclusions?: string;
    mark_as_reported?: boolean;
}

export const putRedactarInforme = async (exam_id: string, data: UpdateReportPayload) => {
    try {
        const response = await api.put(`/examinations/${exam_id}/report`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const blockExam = async (exam_id: string) => {
    try {
        const response = await api.post(`/examinations/${exam_id}/block`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const unblockExam = async (exam_id: string) => {
    try {
        const response = await api.post(`/examinations/${exam_id}/unblock`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Versión para desbloquear al cerrar la ventana - usa fetch con keepalive
export const unblockExamOnUnload = (exam_id: string): void => {
    // Obtener baseURL de manera más confiable
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const url = `${baseURL}/examinations/${exam_id}/unblock`;

    console.log('🔓 Intentando desbloquear examen:', exam_id);
    console.log('URL:', url);

    try {
        // fetch con keepalive: true garantiza que el request se complete incluso si la página se cierra
        // A diferencia de sendBeacon, SÍ permite headers personalizados
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({}),
            keepalive: true // Esta es la clave - mantiene la request viva al cerrar la página
        })
            .then(response => {
                console.log('✅ Response status:', response.status);
                if (response.ok) {
                    console.log('✅ Informe desbloqueado exitosamente');
                } else {
                    console.error('❌ Error al desbloquear. Status:', response.status);
                }
            })
            .catch(error => {
                console.error('❌ Error en fetch:', error);
            });

        console.log('📤 Request de desbloqueo enviado con keepalive');
    } catch (error) {
        console.error('❌ Excepción al desbloquear:', error);
    }
}
