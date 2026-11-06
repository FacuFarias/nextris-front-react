import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components";
import { UserCheck, Tags, Flag, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMedicosAll } from "@/services/api-global.service";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface MultiSelectActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: 'assign' | 'tags' | 'flags' | null;
    selectedCount: number;
    onAssign: (userId: string) => Promise<void>;
    onAddTags: (tagIds: string[]) => Promise<void>;
    onAddFlags: (flags: string[]) => Promise<void>;
    availableTags: { guid: string; name: string; color: string }[];
}

export const MultiSelectActionsModal = ({
    isOpen,
    onClose,
    action,
    selectedCount,
    onAssign,
    onAddTags,
    onAddFlags,
    availableTags,
}: MultiSelectActionsModalProps) => {
    const { data: medicos, isLoading: isLoadingMedicos } = useQuery({
        queryKey: ['medicos-all'],
        queryFn: getMedicosAll,
        staleTime: 5 * 60 * 1000,
    });

    const [selectedUserId, setSelectedUserId] = React.useState<string>("");
    const [selectedTagIds, setSelectedTagIds] = React.useState<Set<string>>(new Set());
    const [selectedFlags, setSelectedFlags] = React.useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) {
            setSelectedUserId("");
            setSelectedTagIds(new Set());
            setSelectedFlags(new Set());
        }
    }, [isOpen]);

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error("Seleccione un radiólogo");
            return;
        }
        setIsProcessing(true);
        try {
            await onAssign(selectedUserId);
            onClose();
        } catch {
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddTags = async () => {
        if (selectedTagIds.size === 0) {
            toast.error("Seleccione al menos un tag");
            return;
        }
        setIsProcessing(true);
        try {
            await onAddTags(Array.from(selectedTagIds));
            onClose();
        } catch {
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddFlags = async () => {
        if (selectedFlags.size === 0) {
            toast.error("Seleccione al menos una bandera");
            return;
        }
        setIsProcessing(true);
        try {
            await onAddFlags(Array.from(selectedFlags));
            onClose();
        } catch {
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTagIds(prev => {
            const next = new Set(prev);
            if (next.has(tagId)) {
                next.delete(tagId);
            } else {
                next.add(tagId);
            }
            return next;
        });
    };

    const toggleFlag = (flag: string) => {
        setSelectedFlags(prev => {
            const next = new Set(prev);
            if (next.has(flag)) {
                next.delete(flag);
            } else {
                next.add(flag);
            }
            return next;
        });
    };

    const renderContent = () => {
        switch (action) {
            case 'assign':
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                            <UserCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">
                                    Asignar {selectedCount} estudio{selectedCount !== 1 ? 's' : ''} a radiólogo
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Seleccione el radiólogo al cual asignar los estudios seleccionados.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Radiólogo
                            </label>
                            {isLoadingMedicos ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Cargando radiólogos...</span>
                                </div>
                            ) : (
                                <select
                                    className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:border-brand-purple focus:ring-brand-purple text-base"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <option value="">Seleccione un radiólogo...</option>
                                    {medicos?.map((medico: { guid: string; name: string }) => (
                                        <option key={medico.guid} value={medico.guid}>
                                            {medico.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2 justify-end">
                            <SecondaryButton onClick={onClose}>
                                <X className="h-5 w-5 mr-2" />
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton
                                onClick={handleAssign}
                                disabled={!selectedUserId || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Asignando...
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="h-5 w-5 mr-2" />
                                        Asignar
                                    </>
                                )}
                            </PrimaryButton>
                        </div>
                    </div>
                );

            case 'tags':
                return (
                    <div className="space-y-6">
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                            <Tags className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-purple-900">
                                    Agregar tags a {selectedCount} estudio{selectedCount !== 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-purple-700 mt-1">
                                    Seleccione los tags que desea agregar a los estudios seleccionados.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                                {availableTags.map(tag => (
                                    <label
                                        key={tag.guid}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                                        style={{ borderColor: selectedTagIds.has(tag.guid) ? tag.color : undefined, backgroundColor: selectedTagIds.has(tag.guid) ? `${tag.color}15` : undefined }}
                                    >
                                        <Checkbox
                                            checked={selectedTagIds.has(tag.guid)}
                                            onCheckedChange={() => toggleTag(tag.guid)}
                                        />
                                        <span className="text-sm font-medium" style={{ color: tag.color }}>{tag.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2 justify-end">
                            <SecondaryButton onClick={onClose}>
                                <X className="h-5 w-5 mr-2" />
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton
                                onClick={handleAddTags}
                                disabled={selectedTagIds.size === 0 || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Agregando...
                                    </>
                                ) : (
                                    <>
                                        <Tags className="h-5 w-5 mr-2" />
                                        Agregar Tags
                                    </>
                                )}
                            </PrimaryButton>
                        </div>
                    </div>
                );

            case 'flags':
                return (
                    <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <Flag className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-900">
                                    Agregar banderas a {selectedCount} estudio{selectedCount !== 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-amber-700 mt-1">
                                    Seleccione las banderas que desea agregar a los estudios seleccionados.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Banderas
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { color: 'red', label: 'Rojo' },
                                    { color: 'green', label: 'Verde' },
                                    { color: 'blue', label: 'Azul' },
                                    { color: 'yellow', label: 'Amarillo' },
                                ].map(flag => (
                                    <label
                                        key={flag.color}
                                        className="flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                                        style={{
                                            borderColor: selectedFlags.has(flag.color) ? flag.color === 'red' ? '#ef4444' : flag.color === 'green' ? '#22c55e' : flag.color === 'blue' ? '#3b82f6' : '#eab308' : '#d1d5db',
                                            backgroundColor: selectedFlags.has(flag.color) ? (flag.color === 'red' ? '#fef2f2' : flag.color === 'green' ? '#f0fdf4' : flag.color === 'blue' ? '#eff6ff' : '#fefce8') : undefined
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedFlags.has(flag.color)}
                                            onCheckedChange={() => toggleFlag(flag.color)}
                                        />
                                        <span className="text-sm font-medium">{flag.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2 justify-end">
                            <SecondaryButton onClick={onClose}>
                                <X className="h-5 w-5 mr-2" />
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton
                                onClick={handleAddFlags}
                                disabled={selectedFlags.size === 0 || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Agregando...
                                    </>
                                ) : (
                                    <>
                                        <Flag className="h-5 w-5 mr-2" />
                                        Agregar Banderas
                                    </>
                                )}
                            </PrimaryButton>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (action) {
            case 'assign':
                return 'Asignar Estudios';
            case 'tags':
                return 'Agregar Tags';
            case 'flags':
                return 'Agregar Banderas';
            default:
                return '';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            size="md"
        >
            {renderContent()}
        </Modal>
    );
};

import React from "react";
