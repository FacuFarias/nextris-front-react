import DOMPurify from 'dompurify';
import { formatDate, formatDateTime } from '@/lib/fechaYhora';
import type { LocalReport } from '@/types/patientHistory';

const safeHtml = (value: string) => DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ol', 'ul', 'li', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'h1', 'h2', 'h3', 'blockquote', 'pre'],
    ALLOWED_ATTR: ['colspan', 'rowspan'],
});

function sectionType(key: string, label = ''): 'reason' | 'report' | 'conclusion' | 'other' {
    const name = `${label} ${key}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/conclusion|impresion/.test(name)) return 'conclusion';
    if (/motivo|study_reason/.test(name)) return 'reason';
    if (/informe|relato|hallazgo|content/.test(name)) return 'report';
    return 'other';
}

const sectionOrder = { reason: 0, report: 1, other: 2, conclusion: 3 };
const sectionTitles = { reason: 'Motivo', report: 'Informe', conclusion: 'Conclusión' };

export function LocalReportContent({ report, document = false }: { report: LocalReport; document?: boolean }) {
    const sections = Object.entries(report.textos || {})
        .map(([key, section]) => ({ key, section, type: sectionType(key, section.as) }))
        .sort((a, b) => sectionOrder[a.type] - sectionOrder[b.type]);
    return <>
        {sections.map(({ key, section, type }) => <section key={key}
            className={document ? `report-section report-section-${type}` : type === 'conclusion'
                ? 'rounded-lg border border-violet-200 border-l-4 border-l-violet-600 bg-violet-50/70 p-4 dark:border-violet-800 dark:border-l-violet-400 dark:bg-violet-950/30'
                : ''}>
            <h3 className={document ? undefined : type === 'conclusion'
                ? 'mb-2 text-base font-bold text-violet-900 dark:text-violet-200'
                : 'mb-2 font-semibold'}>
                {document && section.as ? section.as : type === 'other' ? section.as || key : sectionTitles[type]}
            </h3>
            <div className={document ? 'report-html' : 'report-html whitespace-pre-wrap [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto'}
                dangerouslySetInnerHTML={{ __html: safeHtml(section.contenido || '') }} />
        </section>)}
        {(report.apendices || []).map((appendix, index) => <section key={index}
            className={document ? 'report-section report-appendix' : 'border-t pt-3'}>
            <h3 className="font-semibold">Apéndice · {document && !/[T\s]\d{2}:\d{2}/.test(appendix.fecha || '')
                ? formatDate(appendix.fecha) : formatDateTime(appendix.fecha)}</h3>
            <p className="my-1">{appendix.motivo}</p>
            <div className="report-html whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: safeHtml(appendix.texto || '') }} />
        </section>)}
    </>;
}
