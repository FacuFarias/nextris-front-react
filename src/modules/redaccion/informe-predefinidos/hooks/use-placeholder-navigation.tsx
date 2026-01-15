import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface EditorRef {
    getText: () => string;
    isFocused: boolean;
    isDestroyed: boolean;
    state: {
        selection: {
            from: number;
            to: number;
        };
    };
    commands: {
        focus: () => void;
        setTextSelection: (selection: { from: number; to: number }) => void;
    };
    view: {
        dom: HTMLElement;
    };
}

type EditorsRef<T extends string> = Record<T, EditorRef | null>;


export const usePlaceholderNavigation = <T extends string>(fieldOrder: T[]) => {
    const currentFieldRef = useRef<string>('');
    const findNextPlaceholderRef = useRef<(() => void) | null>(null);

    const editorsRef = useRef<EditorsRef<T>>(
        fieldOrder.reduce((acc, field) => {
            acc[field] = null;
            return acc;
        }, {} as EditorsRef<T>)
    );

    // Función auxiliar para seleccionar un placeholder
    const selectPlaceholder = useCallback((editor: EditorRef, match: { text: string; index: number }, fieldName: string) => {
        currentFieldRef.current = fieldName;

        const startPos = match.index + 2; // Después de [[
        const endPos = startPos + match.text.length;

        editor.commands.focus();

        setTimeout(() => {
            if (editor && !editor.isDestroyed) {
                editor.commands.setTextSelection({
                    from: startPos + 1,
                    to: endPos + 1
                });

                const editorElement = editor.view.dom;
                if (editorElement) {
                    editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 50);

        console.log(`✅ Placeholder encontrado: "${match.text}" en campo ${fieldName}`);
    }, []);

    const findNextPlaceholder = useCallback(() => {
        // Encontrar el índice del campo actual
        let currentFieldIndex = fieldOrder.indexOf(currentFieldRef.current as T);
        if (currentFieldIndex === -1) currentFieldIndex = 0;

        // Obtener el editor actual y la posición del cursor
        const currentEditor = editorsRef.current[currentFieldRef.current as T];
        let currentCursorPos = 0;

        if (currentEditor && !currentEditor.isDestroyed) {
            // Obtener la posición actual del cursor
            const { from } = currentEditor.state.selection;
            currentCursorPos = from;
        }

        // Buscar en todos los campos empezando por el actual
        for (let i = 0; i < fieldOrder.length; i++) {
            const fieldIndex = (currentFieldIndex + i) % fieldOrder.length;
            const fieldName = fieldOrder[fieldIndex];
            const editor = editorsRef.current[fieldName];

            if (!editor) continue;

            const text = editor.getText();
            const regex = /\[\[([^\]]+)\]\]/g;
            let match;
            const matches = [];

            // Recopilar todos los matches con sus posiciones
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[1],
                    index: match.index,
                    fullMatch: match[0]
                });
            }

            if (matches.length === 0) continue;

            // Si estamos en el mismo campo, buscar desde la posición del cursor
            if (i === 0 && fieldName === currentFieldRef.current) {
                // Buscar el primer placeholder después de la posición del cursor
                const nextMatch = matches.find(m => m.index >= currentCursorPos);

                if (nextMatch) {
                    // Encontramos un placeholder después del cursor en el mismo campo
                    selectPlaceholder(editor, nextMatch, fieldName);
                    return true;
                }
                // Si no hay más placeholders después del cursor, continuar al siguiente campo
                continue;
            } else {
                // En campos diferentes, seleccionar el primer placeholder
                if (matches.length > 0) {
                    selectPlaceholder(editor, matches[0], fieldName);
                    return true;
                }
            }
        }

        // No se encontraron más placeholders
        toast.info('No se encontraron más placeholders [[texto]]');
        return false;
    }, [fieldOrder, selectPlaceholder]);

    // Actualizar la referencia cuando cambia la función
    useEffect(() => {
        findNextPlaceholderRef.current = findNextPlaceholder;
    }, [findNextPlaceholder]);

    // Listener para detectar F3
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F3') {
                e.preventDefault();
                findNextPlaceholder();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [findNextPlaceholder]);

    return {
        editorsRef,
        findNextPlaceholder
    };
};
