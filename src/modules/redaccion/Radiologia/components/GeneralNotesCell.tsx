import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquare, MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneralNotesCellProps {
    examId: string;
    currentNotes: string | null;
    onUpdate: (examId: string, notes: string) => void;
    isPending?: boolean;
}

export const GeneralNotesCell = ({ examId, currentNotes, onUpdate, isPending }: GeneralNotesCellProps) => {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(currentNotes || "");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasNotes = !!(currentNotes && currentNotes.trim());

    // Sync draft when popover opens
    useEffect(() => {
        if (open) {
            setDraft(currentNotes || "");
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    }, [open, currentNotes]);

    const handleSave = () => {
        onUpdate(examId, draft);
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    title={hasNotes ? currentNotes! : "Agregar nota"}
                    className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-md transition-colors focus:outline-none",
                        "hover:bg-brand-purple/10 dark:hover:bg-purple-800/30",
                        isPending && "opacity-50 cursor-not-allowed"
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
            <PopoverContent
                className="w-72 p-3"
                align="end"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 dark:text-gray-300">
                    Nota general
                </p>
                <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribir nota..."
                    rows={4}
                    className={cn(
                        "w-full resize-none rounded-md border border-gray-200 dark:border-gray-600",
                        "bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100",
                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                        "px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 dark:focus:ring-purple-500/50"
                    )}
                />
                <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Ctrl+Enter para guardar</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setOpen(false)}
                            className="px-2.5 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="px-2.5 py-1 text-xs rounded-md bg-brand-purple text-white hover:bg-brand-purple/90 dark:bg-purple-600 dark:hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
