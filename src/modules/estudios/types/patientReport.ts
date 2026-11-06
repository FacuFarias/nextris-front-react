import type { LocalReport } from '@/types/patientHistory';

export interface PatientReportView {
    source: 'nextris';
    report: LocalReport;
    document: {
        patient: { name: string; identifier: string | null; national_code: string | null };
        study: { description: string | null; accession_number: string | null; date: string | null };
        institution: { name: string | null; address: string | null; phone: string | null;
            email: string | null; logo: string | null };
        signatures: Array<{ professional: string; available: boolean; image: string | null; stamp_image: string | null;
            clarification: string | null; registration: string | null }>;
    };
}
