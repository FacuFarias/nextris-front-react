import { useEffect, useRef, useState } from "react";

type Snapshot = { scope: string; values?: Map<string, string> };
const NO_HIGHLIGHTS = new Set<string>();

/** Compares displayed row values only after a successful load in the same view. */
export function useRowHighlights<T>(
    rows: T[],
    scope: string,
    ready: boolean,
    getId: (row: T) => string | null,
    getValue: (row: T) => unknown,
) {
    const previous = useRef<Snapshot>({ scope });
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [highlighted, setHighlighted] = useState<{ scope: string; ids: Set<string> }>({ scope, ids: NO_HIGHLIGHTS });

    useEffect(() => {
        if (previous.current.scope !== scope) {
            previous.current = { scope };
            if (timeout.current) clearTimeout(timeout.current);
        }
        if (!ready) return;

        const next = new Map<string, string>();
        for (const row of rows) {
            const id = getId(row);
            if (id !== null) next.set(id, JSON.stringify(getValue(row)));
        }

        const before = previous.current.values;
        previous.current.values = next;
        if (!before) return;

        const changed = new Set<string>();
        for (const [id, value] of next) {
            if (before.get(id) !== value) changed.add(id);
        }
        if (changed.size === 0) return;

        queueMicrotask(() => {
            if (previous.current.scope === scope) setHighlighted({ scope, ids: changed });
        });
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
            setHighlighted({ scope, ids: NO_HIGHLIGHTS });
            timeout.current = null;
        }, 1400);
    }, [rows, scope, ready, getId, getValue]);

    useEffect(() => () => {
        if (timeout.current) clearTimeout(timeout.current);
    }, []);

    return highlighted.scope === scope ? highlighted.ids : NO_HIGHLIGHTS;
}
