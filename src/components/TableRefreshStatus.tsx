import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function TableRefreshStatus({ refreshing, error }: { refreshing?: boolean; error?: boolean }) {
    const [linger, setLinger] = useState(Boolean(refreshing));

    useEffect(() => {
        if (refreshing) {
            let active = true;
            queueMicrotask(() => { if (active) setLinger(true); });
            return () => { active = false; };
        }
        const timeout = setTimeout(() => setLinger(false), 900);
        return () => clearTimeout(timeout);
    }, [refreshing]);

    const showSpinner = Boolean(refreshing || (linger && !error));
    if (!showSpinner && !error) return null;
    return (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[50] flex items-center gap-2 rounded-md border border-brand-purple/35 bg-white px-3 py-2 text-sm font-medium text-brand-purple shadow-md dark:border-purple-300/40 dark:bg-[#201735] dark:text-purple-200" role="status" aria-live="polite">
            {showSpinner ? <><Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" /><span>Actualizando…</span></> : <span>No se pudo actualizar</span>}
        </div>
    );
}
