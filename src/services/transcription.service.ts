import { api } from '@/lib/api';

interface TranscriptionOptions {
    language?: string;
    task?: 'transcribe' | 'translate';
}

interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
}

interface TranscriptionData {
    text: string;
    language: string;
    duration: number;
    segments?: TranscriptionSegment[];
}

interface TranscriptionResponse {
    success: boolean;
    data: TranscriptionData;
    message: string;
}

export const transcriptionService = {
    /**
     * Transcribe un archivo de audio
     * @param {Blob} audioBlob - Blob de audio a transcribir
     * @param {Object} options - Opciones de transcripción
     * @returns {Promise} - Promesa con la transcripción
     */
    async transcribeAudio(
        audioBlob: Blob,
        options: TranscriptionOptions = {}
    ): Promise<TranscriptionResponse> {
        const formData = new FormData();

        // Convertir blob a archivo
        const audioFile = new File(
            [audioBlob],
            `recording_${Date.now()}.webm`,
            { type: audioBlob.type }
        );

        formData.append('audio', audioFile);
        formData.append('language', options.language || 'es');
        formData.append('task', options.task || 'transcribe');

        try {
            const response = await api.post<TranscriptionResponse>(
                '/transcription/upload',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    // Timeout largo para archivos grandes
                    timeout: 300000 // 5 minutos
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error en transcripción:', error);
            throw error;
        }
    },

    /**
     * Verifica el estado del servicio de transcripción
     * @returns {Promise} - Estado del servicio
     */
    async checkStatus(): Promise<any> {
        try {
            const response = await api.get('/transcription/status');
            return response.data;
        } catch (error) {
            console.error('Error verificando estado:', error);
            throw error;
        }
    }
};
