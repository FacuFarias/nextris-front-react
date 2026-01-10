export interface Examen {
    guid: string;
    fecha: string;              // Formato DD/MM/YYYY
    examen: string;             // Descripción del tipo de estudio
    paciente: string;           // Nombre completo del paciente
    mail: string;               // Email del paciente
    estado: "R" | "E";          // R = Reportado (pendiente), E = Enviado
    medico_autor: string;       // Médico que realizó el informe
    medico_solicitante: string; // Médico que solicitó el estudio
    urgencia: "S" | "N";        // S = Sí, N = No
}


export interface SendReportPayload {
    email: string;
}

export interface UpdateEmailPayload {
    email: string;
}

export interface ApiResponse {
    success: boolean;
    message: string;
}

export interface DICOMViewerData {
    study_uid: string;
    viewer_url: string;
    patient_name: string;
    study_description: string;
    study_date: string;
}

export interface DICOMViewerResponse {
    success: boolean;
    data: DICOMViewerData;
}
