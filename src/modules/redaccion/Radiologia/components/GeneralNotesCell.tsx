import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, MessageSquare, MessageSquareDashed, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExaminationNotes } from "../hooks/use-informes";
import type { StudyNote } from "../types/informes.types";

interface GeneralNotesCellProps {
    examId: string;
    recentNotes: StudyNote[];
    notesCount: number;
    onUpdate: (examId: string, notes: string) => void;
    onDelete: (examId: string, noteId: string) => void;
    canDeleteNotes: boolean;
    isPending?: boolean;
    isDeletePending?: boolean;
}

const formatNoteDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
};

const NoteItem = ({ note, compact = false }: { note: StudyNote; compact?: boolean }) => (
    <div className={cn(
        "min-w-0",
        compact ? "space-y-0.5" : "border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700"
    )}>
        <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500 dark:text-gray-400">
            <span className="truncate font-semibold">{note.author_display_name || note.author_username}</span>
            <span className="shrink-0">{formatNoteDate(note.created_on)}</span>
        </div>
        <p className={cn(
            "whitespace-pre-wrap break-words text-xs text-gray-700 dark:text-gray-200",
            compact && "line-clamp-3"
        )}>
            {note.message}
        </p>
    </div>
);

export const GeneralNotesCell = ({
    examId,
    recentNotes,
    notesCount,
    onUpdate,
    onDelete,
    canDeleteNotes,
    isPending,
    isDeletePending,
}: GeneralNotesCellProps) => {
    const [open, setOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { notes: historyNotes, isLoading: isLoadingHistory, error: historyError } = useExaminationNotes(examId, historyOpen);
    const hasNotes = recentNotes.length > 0;

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            setDraft("");
            setValidationError(null);
        }
    };

    useEffect(() => {
        if (open) {
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    }, [open]);

    const handleSave = () => {
        const message = draft.trim();
        if (!message) {
            setValidationError("Escribe un mensaje antes de guardar");
            return;
        }

        onUpdate(examId, message);
        setOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleSave();
        }
        if (event.key === "Escape") {
            setOpen(false);
        }
    };

    const handleDelete = (note: StudyNote) => {
        if (!canDeleteNotes || isDeletePending) return;
        if (window.confirm("¿Eliminar esta nota? Esta acción no se puede deshacer.")) {
            onDelete(examId, note.id);
        }
    };

    return (
        <>
            <Popover open={open} onOpenChange={handleOpenChange}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <button
                                    aria-label={hasNotes ? "Ver notas del estudio" : "Agregar nota al estudio"}
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none",
                                        "hover:bg-brand-purple/10 dark:hover:bg-purple-800/30",
                                        isPending && "cursor-not-allowed opacity-50"
                                    )}
                                    disabled={isPending}
                                >
                                    {hasNotes ? (
                                        <MessageSquare className="h-4 w-4 text-brand-purple dark:text-purple-400" />
                                    ) : (
                                        <MessageSquareDashed className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    )}
                                </button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center" sideOffset={6} className="w-80 max-w-[calc(100vw-2rem)] p-3">
                            {hasNotes ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Últimas {recentNotes.length} notas
                                    </p>
                                    {recentNotes.map((note) => <NoteItem key={note.id} note={note} compact />)}
                                </div>
                            ) : (
                                <span>Sin notas. Haz clic para agregar una.</span>
                            )}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <PopoverContent
                    className="w-96 max-w-[calc(100vw-2rem)] p-3"
                    align="end"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                            Nueva nota
                        </p>
                        {notesCount > 3 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    setHistoryOpen(true);
                                }}
                                className="text-xs font-semibold text-brand-purple hover:underline dark:text-purple-300"
                            >
                                Ver todos ({notesCount})
                            </button>
                        )}
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(event) => {
                            setDraft(event.target.value);
                            if (validationError) setValidationError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribir nota..."
                        rows={4}
                        className={cn(
                            "w-full resize-none rounded-md border bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-gray-100",
                            validationError
                                ? "border-red-300 focus:ring-red-400/50 dark:border-red-700"
                                : "border-gray-200 focus:ring-brand-purple/50 dark:border-gray-600 dark:focus:ring-purple-500/50",
                            "placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        )}
                    />
                    {validationError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationError}</p>}
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Ctrl+Enter para guardar</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isPending}
                                className="rounded-md bg-brand-purple px-2.5 py-1 text-xs text-white transition-colors hover:bg-brand-purple/90 disabled:opacity-50 dark:bg-purple-600 dark:hover:bg-purple-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>

                    {hasNotes && (
                        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                                Últimas notas
                            </p>
                            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                {recentNotes.map((note) => <NoteItem key={note.id} note={note} />)}
                            </div>
                            {notesCount > 3 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        setHistoryOpen(true);
                                    }}
                                    className="mt-3 text-xs font-semibold text-brand-purple hover:underline dark:text-purple-300"
                                >
                                    Ver todos los registros ({notesCount})
                                </button>
                            )}
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Historial completo de notas</DialogTitle>
                        <DialogDescription>
                            {notesCount} {notesCount === 1 ? "nota registrada" : "notas registradas"} para este estudio.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                        {isLoadingHistory && (
                            <div className="flex items-center gap-2 py-6 text-sm text-gray-500 dark:text-gray-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando historial...
                            </div>
                        )}
                        {historyError && <p className="py-6 text-sm text-red-600 dark:text-red-400">No se pudo cargar el historial.</p>}
                        {!isLoadingHistory && !historyError && historyNotes.length === 0 && (
                            <p className="py-6 text-sm text-gray-500 dark:text-gray-400">Todavía no hay notas para este estudio.</p>
                        )}
                        {!isLoadingHistory && !historyError && historyNotes.map((note) => (
                            <div key={note.id} className="flex items-start gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                                <div className="min-w-0 flex-1">
                                    <NoteItem note={note} />
                                </div>
                                {canDeleteNotes && (
                                    <button
                                        type="button"
                                        aria-label="Eliminar nota"
                                        title="Eliminar nota"
                                        onClick={() => handleDelete(note)}
                                        disabled={isDeletePending}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
