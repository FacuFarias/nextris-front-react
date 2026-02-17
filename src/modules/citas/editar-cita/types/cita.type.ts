export interface Cita {
    guid: string;
    patient_name: string;
    start: string;
    end: string;
    exam: string;
    doctor: string;
    equipment: string;
    status: string;
    is_admitted: boolean;
    exam_id: string;
    location_id: string;
    doctor_id?: string;
    requesting_physician_id?: string;
    equipment_id?: string;

}
