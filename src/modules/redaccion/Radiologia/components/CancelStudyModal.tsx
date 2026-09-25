import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Button } from '@/components/ui/button';
import type { CancellationReason } from '../services/informes.service';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    reasons: CancellationReason[];
    isLoading?: boolean;
    onConfirm: (reasonCode: string, detail?: string) => Promise<void>;
};

export const CancelStudyModal = ({ isOpen, onClose, reasons, isLoading = false, onConfirm }: Props) => {
    const [reasonCode, setReasonCode] = useState('');
    const [detail, setDetail] = useState('');

    const selectedReason = reasons.find((reason) => reason.code === reasonCode);
    const needsDetail = selectedReason?.code === 'OTHER';
    const canSubmit = Boolean(reasonCode) && (!needsDetail || detail.trim().length > 0) && !isLoading;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cancelar estudio" description="Seleccione el motivo de cancelación." size="md">
            <div className="space-y-5">
                <label className="block space-y-2 text-sm">
                    <span className="font-medium">Motivo <span className="text-red-600">*</span></span>
                    <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
                        <option value="">Seleccione un motivo...</option>
                        {reasons.map((reason) => <option key={reason.guid} value={reason.code}>{reason.description}</option>)}
                    </select>
                </label>
                {needsDetail && (
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Detalle <span className="text-red-600">*</span></span>
                        <textarea value={detail} onChange={(event) => setDetail(event.target.value)} className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Explique el motivo..." />
                    </label>
                )}
                <div className="flex justify-end gap-3 border-t pt-4">
                    <SecondaryButton onClick={onClose} disabled={isLoading}><X className="mr-2 h-5 w-5" />Cerrar</SecondaryButton>
                    <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => void onConfirm(reasonCode, detail.trim() || undefined)} disabled={!canSubmit}>
                        {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cancelando...</> : 'Cancelar estudio'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
