import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PrimaryButton, SecondaryButton } from "@/components"

interface SavePresetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (name: string) => void
    isLoading?: boolean
}

export const SavePresetDialog = ({ open, onOpenChange, onSave, isLoading }: SavePresetDialogProps) => {
    const [name, setName] = useState("")

    const handleSave = () => {
        const trimmed = name.trim()
        if (!trimmed) return
        onSave(trimmed)
        setName("")
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && name.trim()) {
            handleSave()
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) setName("")
            onOpenChange(isOpen)
        }}>
            <DialogContent className="sm:max-w-md bg-brand-purple text-white">
                <DialogHeader>
                    <DialogTitle className="text-white">Guardar como nueva pestaña</DialogTitle>
                    <DialogDescription className="text-white/70">
                        Ingrese un nombre para guardar la configuración actual de filtros.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 py-2">
                    <Label htmlFor="preset-name" className="text-white/90">Nombre</Label>
                    <Input
                        id="preset-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ej: Cardiología, Urgencias..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50"
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <SecondaryButton onClick={() => onOpenChange(false)}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton
                        onClick={handleSave}
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? "Guardando..." : "Guardar"}
                    </PrimaryButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
