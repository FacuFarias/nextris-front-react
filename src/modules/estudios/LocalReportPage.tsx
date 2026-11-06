import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/layouts/layout';
import { getReportView } from '@/services/reportView';
import { PatientReportDialog } from './components/PatientReportDialog';

export function LocalReportPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, error } = useQuery({
        queryKey: ['local-report', examId],
        queryFn: () => getReportView(examId!),
        enabled: Boolean(examId),
        retry: false,
    });
    return <MainLayout>
        <h1 className="text-xl font-semibold">Informe médico</h1>
        {isLoading && <p role="status">Consultando informe…</p>}
        {error && <p role="alert">{error.message}</p>}
        <PatientReportDialog view={data || null} onClose={() => navigate('/worklist')} />
    </MainLayout>;
}
