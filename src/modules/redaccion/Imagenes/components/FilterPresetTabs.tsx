import { useEffect, useRef, useState } from "react"
import { Eye, EyeOff, Loader2, Plus, Save, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmationModal } from "@/modules/redaccion/Radiologia/components/ConfirmationModal"
import { SavePresetDialog } from "@/modules/redaccion/Radiologia/components/SavePresetDialog"
import {
  useActivateImageFilterPreset,
  useCreateImageFilterPreset,
  useDeactivateAllImagePresets,
  useDeleteImageFilterPreset,
  useImageFilterPresets,
  useUpdateImageFilterPreset,
} from "../hooks/use-filter-presets"
import type { ImageFilterPreset, ImageFilterPresetFilters } from "../types/filter-preset.types"

interface FilterPresetTabsProps {
  activePresetId: string | null
  onPresetChange: (preset: ImageFilterPreset | null) => void
  currentFilters: ImageFilterPresetFilters
  filtersVisible: boolean
  onToggleFilters: () => void
  activeFilterCount?: number
}

export const FilterPresetTabs = ({
  activePresetId,
  onPresetChange,
  currentFilters,
  filtersVisible,
  onToggleFilters,
  activeFilterCount = 0,
}: FilterPresetTabsProps) => {
  const { presets, isLoading } = useImageFilterPresets()
  const { mutateAsync: createPreset, isPending: isCreating } = useCreateImageFilterPreset()
  const { mutateAsync: updatePreset, isPending: isUpdating } = useUpdateImageFilterPreset()
  const { mutateAsync: deletePreset } = useDeleteImageFilterPreset()
  const { mutateAsync: activatePreset } = useActivateImageFilterPreset()
  const { mutateAsync: deactivateAll } = useDeactivateAllImagePresets()

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [presetToDelete, setPresetToDelete] = useState<ImageFilterPreset | null>(null)
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingPresetId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingPresetId])

  const handleTabClick = async (preset: ImageFilterPreset | null) => {
    if (preset === null) {
      await deactivateAll()
      onPresetChange(null)
      return
    }

    await activatePreset(preset.guid)
    onPresetChange(preset)
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

  const handleDeleteClick = (e: React.MouseEvent, preset: ImageFilterPreset) => {
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

  const handleDoubleClick = (preset: ImageFilterPreset) => {
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
      <div className="mb-2 flex items-center gap-2 border-b border-gray-200 pb-1.5">
        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">Cargando pestañas...</span>
      </div>
    )
  }

  return (
    <>
      <div className="mb-2 flex min-w-0 items-center gap-2 border-b border-gray-200">
        <div className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto overscroll-x-contain pb-1 table-scrollbar-purple">
          <button
            onClick={() => handleTabClick(null)}
            className={`-mb-px min-h-11 whitespace-nowrap border-b-2 px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-0 ${
              activePresetId === null
                ? "border-brand-purple text-brand-purple dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Todos
          </button>

          {presets.map((preset) => (
            <div
              key={preset.guid}
              className={`group -mb-px flex min-h-11 cursor-pointer items-center gap-0.5 whitespace-nowrap border-b-2 px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-0 ${
                activePresetId === preset.guid
                  ? "border-brand-purple text-brand-purple dark:border-purple-400 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
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
                  className="w-24 rounded border border-gray-300 bg-gray-50 px-1 py-0 text-xs text-gray-800 outline-none"
                />
              ) : (
                <span onDoubleClick={() => handleDoubleClick(preset)}>{preset.name}</span>
              )}
              <button
                onClick={(e) => handleDeleteClick(e, preset)}
                className={`ml-0.5 rounded-full p-0.5 transition-opacity ${
                  activePresetId === preset.guid
                    ? "opacity-50 hover:bg-purple-100 hover:opacity-100"
                    : "opacity-0 group-hover:opacity-50 hover:bg-gray-200 hover:opacity-100!"
                }`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 pb-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSaveLayout}
                  disabled={activePresetId === null || isUpdating}
                  className="h-11 w-11 p-1 text-gray-400 transition-colors hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-30 sm:h-auto sm:w-auto"
                >
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {activePresetId === null ? "Seleccione una pestaña para guardar" : "Guardar layout actual en esta pestaña"}
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
                  <Plus className="h-3.5 w-3.5" />
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
                  className="h-11 w-11 p-1 text-gray-400 transition-colors hover:text-brand-purple sm:h-auto sm:w-auto"
                >
                  {filtersVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-brand-purple px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>{filtersVisible ? "Ocultar filtros" : "Mostrar filtros"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <SavePresetDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleCreatePreset}
        isLoading={isCreating}
      />

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
