import type { LocalReport } from '@/types/patientHistory';

export function ReportProfessionalSignatures({ report }: { report: LocalReport }) {
    return <section className="border-t pt-4" aria-label="Firmas de los profesionales">
        <div className="flex flex-wrap gap-8">{report.signatures?.map((signature, index) => <div key={index} className="max-w-xs space-y-2">
            <div className="flex flex-wrap items-end gap-3">
                {signature.image && <img src={signature.image} alt={`Firma de ${signature.professional}`} className="max-h-24 max-w-40 object-contain" />}
                {signature.stamp_image && <img src={signature.stamp_image} alt={`Sello de ${signature.professional}`} className="max-h-24 max-w-40 object-contain" />}
            </div>
            <p className="font-medium">{signature.professional}</p>
            {signature.registration && <p>{signature.registration}</p>}
            {!signature.image && <p className="text-xs text-muted-foreground">Firma no disponible</p>}
        </div>)}</div>
    </section>;
}
