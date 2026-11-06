import { useState } from 'react';
import { brand } from '@/lib/brand';
import { LocalReportContent } from '@/components/LocalReportContent';
import { formatDate, formatDateTime } from '@/lib/fechaYhora';
import type { PatientReportView } from '../types/patientReport';

// Shared by the screen and isolated print frame; no application styles are needed.
export const patientReportStyles = `
@page { size: A4; margin: 16mm; }
.patient-report { color: #171717; background: #fff; font: 14px/1.6 Arial, sans-serif;
    max-width: 780px; margin: auto; padding: 28px; overflow-wrap: anywhere; box-sizing: border-box; }
.patient-report * { box-sizing: border-box; }
.patient-report h1, .patient-report h2, .patient-report h3 { font-weight: 700; }
.patient-report h1 { font-size: 23px; line-height: 1.3; margin: 0; }
.patient-report h2 { font-size: 19px; line-height: 1.4; margin: 20px 0 12px; }
.patient-report h3 { font-size: 15px; margin: 0 0 8px; break-after: avoid; }
.patient-report p { margin: 0 0 8px; }
.patient-report dl, .patient-report dd { margin: 0; }
.patient-report dt { font-size: 12px; color: #555; }
.patient-report .report-header { padding-bottom: 16px; border-bottom: 2px solid #555; }
.patient-report .report-letterhead { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.patient-report .report-institution { flex: 1; min-width: 0; }
.patient-report .report-study-title { max-width: 42%; text-align: right; margin: 0; font-size: 18px; }
.patient-report .report-patient-name dd { font-weight: 700; }
.patient-report .report-metadata + .report-metadata { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e5; }
.patient-report .report-logo { width: 96px; height: 80px; flex-shrink: 0; object-fit: contain; }
.patient-report .report-letterhead p { margin: 4px 0 0; color: #555; font-size: 13px; }
.patient-report .report-metadata { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px 18px; line-height: 1.45; }
.patient-report .report-section { margin-top: 20px; }
.patient-report .report-appendix { padding-top: 16px; border-top: 1px solid #ddd; }
.patient-report .report-html { white-space: pre-wrap; }
.patient-report .report-html p { margin: 0 0 8px; }
.patient-report .report-html ul { list-style: disc; padding-left: 24px; }
.patient-report .report-html ol { list-style: decimal; padding-left: 24px; }
.patient-report .report-html table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.patient-report .report-html th, .patient-report .report-html td { border: 1px solid #bbb; padding: 6px; }
.patient-report .report-html pre { white-space: pre-wrap; }
.patient-report .report-signatures { display: flex; justify-content: flex-end; flex-wrap: wrap;
    gap: 28px; margin-top: 36px; }
.patient-report .report-signature { text-align: center; max-width: 280px; break-inside: avoid; }
.patient-report .report-signature img { display: block; width: 190px; height: 85px;
    object-fit: contain; margin: 0 auto 8px; }
.patient-report .report-unavailable { color: #555; font-size: 12px; }
.patient-report .report-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #aaa;
    text-align: center; font-size: 12px; color: #444; }
@media screen and (max-width: 540px) {
    .patient-report { padding: 18px; font-size: 14px; }
    .patient-report .report-metadata { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .patient-report .report-letterhead { flex-wrap: wrap; }
    .patient-report .report-study-title { max-width: 100%; width: 100%; text-align: left; }
    .patient-report h1 { font-size: 20px; }
    .patient-report .report-logo { width: 76px; height: 64px; }
}
@media print {
    html, body { margin: 0; padding: 0; background: #fff; }
    .patient-report { padding: 0; max-width: none; font-size: 11pt; }
    .patient-report .report-html table { display: table; overflow: visible; }
    .patient-report .report-header, .patient-report .report-metadata, .patient-report .report-letterhead,
    .patient-report .report-footer { break-inside: avoid; }
    .patient-report .report-html p { orphans: 3; widows: 3; }
}
`;

const validImage = (src: string) => /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src);

function DocumentImage({ src, alt, className, onError }: {
    src: string; alt: string; className?: string; onError?: () => void;
}) {
    const [failed, setFailed] = useState(false);
    // Only image data produced by the authorized backend, never arbitrary URLs.
    if (failed || !validImage(src)) return null;
    return <img src={src} alt={alt} className={className} onError={() => { setFailed(true); onError?.(); }} />;
}

function Signature({ signature }: { signature: PatientReportView['document']['signatures'][number] }) {
    const [failed, setFailed] = useState(false);
    const [stampFailed, setStampFailed] = useState(false);
    const stampAvailable = signature.stamp_image && validImage(signature.stamp_image) && !stampFailed;
    const available = signature.available && signature.image && validImage(signature.image) && !failed;
    return <div className="report-signature">
        {available && <DocumentImage src={signature.image!} alt={`Firma de ${signature.professional}`}
            onError={() => setFailed(true)} />}
        {stampAvailable && <DocumentImage src={signature.stamp_image!} alt={`Sello de ${signature.professional}`}
            onError={() => setStampFailed(true)} />}
        <p><strong>{signature.professional}</strong></p>
        {!available && <p className="report-unavailable">Firma no disponible</p>}
        {(available || stampAvailable) && signature.clarification && signature.clarification !== signature.professional &&
            <p>{signature.clarification}</p>}
    </div>;
}

export function PatientReportDocument({ view }: { view: PatientReportView }) {
    const { report, document: { patient, study, institution, signatures } } = view;
    const footer = [institution.address, institution.phone, institution.email].filter(Boolean);
    return <article className="patient-report" aria-label="Documento del informe">
        <header className="report-header">
          <div className="report-letterhead">
            <img src={institution.logo && validImage(institution.logo) ? institution.logo : brand.logo}
                alt={`Logo de ${brand.name}`} className="report-logo" />
            <div className="report-institution">
                <h1>{institution.name || brand.name}</h1>
                {institution.address && <p>{institution.address}</p>}
            </div>
            <h2 className="report-study-title">{report.procedimientos || study.description || 'Informe médico'}</h2>
          </div>
        <dl className="report-metadata">
            <div className="report-patient-name"><dt>{brand.veterinary ? 'Animal' : 'Paciente'}</dt><dd>{patient.name}</dd></div>
            {patient.identifier && <div><dt>{brand.veterinary ? 'ID del animal' : 'ID del paciente'}</dt><dd>{patient.identifier}</dd></div>}
            {patient.national_code && <div><dt>Documento</dt><dd>{patient.national_code}</dd></div>}
        </dl>
        <dl className="report-metadata">
            {study.date && <div><dt>Fecha del estudio</dt><dd>{formatDate(study.date)}</dd></div>}
            {report.accession_number || study.accession_number
                ? <div><dt>Número de acceso</dt><dd>{report.accession_number || study.accession_number}</dd></div>
                : <div><dt>Número de informe</dt><dd>{report.id_informe}</dd></div>}
            {report.fecha && <div><dt>Fecha del informe</dt><dd>{/[T\s]\d{2}:\d{2}/.test(report.fecha)
                ? formatDateTime(report.fecha) : formatDate(report.fecha)}</dd></div>}
            <div><dt>Profesional</dt><dd>{[report.profesional, report.profesional2].filter(Boolean).join(' / ') || 'No informado'}</dd></div>
            {report.solicitante && <div><dt>Solicitante</dt><dd>{report.solicitante}</dd></div>}
            {report.categoria && <div><dt>Categoría</dt><dd>{report.categoria}</dd></div>}
            {report.modalidad && <div><dt>Modalidad</dt><dd>{report.modalidad}</dd></div>}
            {report.materiales && <div><dt>Materiales</dt><dd>{report.materiales}</dd></div>}
        </dl>
        </header>
        <LocalReportContent report={report} document />
        <div className="report-signatures">
            {signatures.length ? signatures.map((signature, i) => <Signature key={i} signature={signature} />)
                : <p className="report-unavailable">Firma no disponible</p>}
        </div>
        {footer.length > 0 && <footer className="report-footer">{footer.join(' · ')}</footer>}
    </article>;
}
