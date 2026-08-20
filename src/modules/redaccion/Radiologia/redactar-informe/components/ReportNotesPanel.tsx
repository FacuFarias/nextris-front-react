import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useExaminationNotes, useUpdateGeneralNotes } from "../../hooks/use-informes";

const formatNoteDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
};

export const ReportNotesPanel = ({ examId }: { examId: string }) => {
    const [draft, setDraft] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const { notes, isLoading, error } = useExaminationNotes(examId, Boolean(examId));
    const updateNotes = useUpdateGeneralNotes();
    const recentNotes = notes.slice(0, 1);

    const handleSave = () => {
        const message = draft.trim();
        if (!message) {
            setValidationError("Escribe una nota antes de guardar");
            return;
        }

        updateNotes.mutate(
            { examId, notes: message },
            {
                onSuccess: () => {
                    setDraft("");
                    setValidationError(null);
                },
            },
        );
    };

    return (
        <section className="relative w-full rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-[#0f1218] md:w-[360px] lg:w-[420px]" aria-label="Notas del estudio">
            {notes.length > 0 && (
                <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-brand-purple/10 px-1.5 py-0.5 text-[9px] font-semibold text-brand-purple dark:bg-purple-500/15 dark:text-purple-300">
                    {notes.length}
                </span>
            )}

            <div className="mb-1.5 max-h-10 overflow-y-auto pr-1 table-scrollbar-purple">
                {isLoading && (
                    <div className="flex items-center gap-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Cargando notas...
                    </div>
                )}
                {!isLoading && error && (
                    <p className="py-1 text-xs text-red-600 dark:text-red-400">No se pudieron cargar las notas.</p>
                )}
                {!isLoading && !error && recentNotes.map((note) => (
                    <article key={note.id} className="rounded-md border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-[#151922]">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                            <span className="truncate font-semibold">{note.author_display_name || note.author_username}</span>
                            <time className="mr-5 shrink-0" dateTime={note.created_on}>{formatNoteDate(note.created_on)}</time>
                        </div>
                        <p className="truncate text-xs text-gray-700 dark:text-gray-200">{note.message}</p>
                    </article>
                ))}
            </div>

            <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                    <textarea
                        value={draft}
                        onChange={(event) => {
                            setDraft(event.target.value);
                            if (validationError) setValidationError(null);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                                event.preventDefault();
                                if (!updateNotes.isPending) handleSave();
                            }
                        }}
                        placeholder="Escribir una nota..."
                        rows={1}
                        className={`block h-10 w-full resize-none rounded-md border bg-white px-2.5 py-2.5 text-xs text-gray-800 outline-none transition focus:ring-2 dark:bg-[#151922] dark:text-gray-100 ${
                            validationError
                                ? "border-red-400 focus:ring-red-300/50 dark:border-red-700"
                                : "border-gray-200 focus:border-brand-purple focus:ring-brand-purple/20 dark:border-gray-700"
                        }`}
                    />
                    {validationError && <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">{validationError}</p>}
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!examId || updateNotes.isPending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-purple text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Guardar nota (Ctrl+Enter)"
                    aria-label="Guardar nota"
                >
                    {updateNotes.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
            </div>
        </section>
    );
};
