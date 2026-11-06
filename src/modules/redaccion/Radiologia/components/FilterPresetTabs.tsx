import { useState, useRef, useEffect } from "react"
import { Save, Plus, X, Loader2, Eye, EyeOff } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    useFilterPresets,
    useCreateFilterPreset,
    useUpdateFilterPreset,
    useDeleteFilterPreset,
    useActivateFilterPreset,
    useDeactivateAllPresets,
} from "../hooks/use-filter-presets"
import type { FilterPreset, FilterPresetFilters } from "../types/filter-preset.types"
import { SavePresetDialog } from "./SavePresetDialog"
import { ConfirmationModal } from "./ConfirmationModal"

interface FilterPresetTabsProps {
    activePresetId: string | null
    onPresetChange: (preset: FilterPreset | null) => void
    currentFilters: FilterPresetFilters
    filtersVisible: boolean
    onToggleFilters: () => void
    activeFilterCount?: number
}

export const FilterPresetTabs = ({ activePresetId, onPresetChange, currentFilters, filtersVisible, onToggleFilters, activeFilterCount = 0 }: FilterPresetTabsProps) => {
    const { presets, isLoading } = useFilterPresets()
    const { mutateAsync: createPreset, isPending: isCreating } = useCreateFilterPreset()
    const { mutateAsync: updatePreset, isPending: isUpdating } = useUpdateFilterPreset()
    const { mutateAsync: deletePreset } = useDeleteFilterPreset()
    const { mutateAsync: activatePreset } = useActivateFilterPreset()
    const { mutateAsync: deactivateAll } = useDeactivateAllPresets()

    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [presetToDelete, setPresetToDelete] = useState<FilterPreset | null>(null)
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")
    const editInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (editingPresetId && editInputRef.current) {
            editInputRef.current.focus()
            editInputRef.current.select()
        }
    }, [editingPresetId])

    const handleTabClick = async (preset: FilterPreset | null) => {
        if (preset === null) {
            // Tab "Todos"
            await deactivateAll()
            onPresetChange(null)
        } else {
            await activatePreset(preset.guid)
            onPresetChange(preset)
        }
    }

    const handleSaveLayout = async () => {
        if (!activePresetId) return
        await updatePreset({ guid: activePresetId, data: { filters: currentFilters } })
    }

    const handleCreatePreset = async (name: string) => {
        const response = await createPreset({ name, filters: currentFilters })
        setIsSaveDialogOpen(false)
        if (response?.data) {
            onPresetChange(response.data)
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, preset: FilterPreset) => {
        e.stopPropagation()
        setPresetToDelete(preset)
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!presetToDelete) return
        await deletePreset(presetToDelete.guid)
        setIsDeleteModalOpen(false)
        setPresetToDelete(null)
        if (activePresetId === presetToDelete.guid) {
            await deactivateAll()
            onPresetChange(null)
        }
    }

    const handleDoubleClick = (preset: FilterPreset) => {
        setEditingPresetId(preset.guid)
        setEditingName(preset.name)
    }

    const handleRenameSubmit = async () => {
        if (!editingPresetId || !editingName.trim()) {
            setEditingPresetId(null)
            return
        }
        await updatePreset({ guid: editingPresetId, data: { name: editingName.trim() } })
        setEditingPresetId(null)
    }

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleRenameSubmit()
        } else if (e.key === "Escape") {
            setEditingPresetId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400">Cargando pestañas...</span>
            </div>
        )
    }

    return (
        <>
            <div className="mb-2 flex min-w-0 items-center gap-2 border-b border-gray-200">
                {/* Tabs container */}
                <div className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto overscroll-x-contain pb-1 table-scrollbar-purple">
                    {/* Tab "Todos" - siempre presente */}
                    <button
                        onClick={() => handleTabClick(null)}
                        className={`min-h-11 px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border-b-2 -mb-px sm:min-h-0 ${activePresetId === null
                            ? "border-brand-purple text-brand-purple dark:border-purple-400 dark:text-purple-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300"
                            }`}
                    >
                        Todos
                    </button>

                    {/* Tabs del usuario */}
                    {presets.map((preset) => (
                        <div
                            key={preset.guid}
                            className={`group flex min-h-11 items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 -mb-px sm:min-h-0 ${activePresetId === preset.guid
                                ? "border-brand-purple text-brand-purple dark:border-purple-400 dark:text-purple-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300"
                                }`}
                            onClick={() => handleTabClick(preset)}
                        >
                            {editingPresetId === preset.guid ? (
                                <input
                                    ref={editInputRef}
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={handleRenameSubmit}
                                    onKeyDown={handleRenameKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-gray-50 border border-gray-300 rounded px-1 py-0 text-xs w-24 outline-none text-gray-800"
                                />
                            ) : (
                                <span onDoubleClick={() => handleDoubleClick(preset)}>
                                    {preset.name}
                                </span>
                            )}
                            <button
                                onClick={(e) => handleDeleteClick(e, preset)}
                                className={`ml-0.5 rounded-full p-0.5 transition-opacity ${activePresetId === preset.guid
                                    ? "opacity-50 hover:opacity-100 hover:bg-purple-100"
                                    : "opacity-0 group-hover:opacity-50 hover:opacity-100! hover:bg-gray-200"
                                    }`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Botones de acción */}
                <div className="ml-auto flex shrink-0 items-center gap-1 pb-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleSaveLayout}
                                    disabled={activePresetId === null || isUpdating}
                                    className="h-11 w-11 p-1 text-gray-400 hover:text-brand-purple disabled:opacity-30 disabled:cursor-not-allowed transition-colors sm:h-auto sm:w-auto"
                                >
                                    {isUpdating ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Save className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {activePresetId === null
                                    ? "Seleccione una pestaña para guardar"
                                    : "Guardar filtros actuales en esta pestaña"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsSaveDialogOpen(true)}
                                    className="flex h-11 w-11 items-center justify-center p-1 text-gray-400 transition-colors hover:text-brand-purple sm:h-auto sm:w-auto"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Guardar como nueva pestaña</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onToggleFilters}
                                    className="h-11 w-11 p-1 text-gray-400 hover:text-brand-purple transition-colors sm:h-auto sm:w-auto"
                                >
                                    {filtersVisible
                                        ? <EyeOff className="w-3.5 h-3.5" />
                                        : <Eye className="w-3.5 h-3.5" />
                                    }
                                    {activeFilterCount > 0 && (
                                        <span className="ml-0.5 rounded-full bg-brand-purple px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {filtersVisible ? "Ocultar filtros" : "Mostrar filtros"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Dialog para crear nuevo preset */}
            <SavePresetDialog
                open={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
                onSave={handleCreatePreset}
                isLoading={isCreating}
            />

            {/* Modal de confirmación para eliminar */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false)
                    setPresetToDelete(null)
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar pestaña"
                message={`¿Está seguro que desea eliminar la pestaña "${presetToDelete?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </>
    )
}
