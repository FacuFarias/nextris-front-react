import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/layouts/layout';
import { getReportPdfUrl, staffReportPdfLink } from '@/services/reportPdf';

export function LocalReportPage() {
    const { examId } = useParams();
    const [error, setError] = useState('');
    useEffect(() => {
        if (!examId) return;
        let active = true;
        getReportPdfUrl(staffReportPdfLink(examId))
            .then(url => { if (active) window.location.replace(url); })
            .catch((failure: Error) => { if (active) setError(failure.message); });
        return () => { active = false; };
    }, [examId]);
    return <MainLayout>
        <h1 className="text-xl font-semibold">Informe</h1>
        {error ? <p role="alert">{error}</p> : <p role="status">Abriendo informe…</p>}
    </MainLayout>;
}
