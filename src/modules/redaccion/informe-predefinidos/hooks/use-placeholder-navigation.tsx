import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface EditorRef {
    getText: () => string;
    isFocused: boolean;
    isDestroyed: boolean;
    commands: {
        focus: () => void;
        setTextSelection: (selection: { from: number; to: number }) => void;
    };
    view: {
        dom: HTMLElement;
    };
}

type EditorsRef<T extends string> = Record<T, EditorRef | null>;

/**
 * Hook para navegar entre placeholders [[texto]] usando F3
 * @param fieldOrder - Array con el orden de los campos a navegar
 * @returns Objeto con la función findNextPlaceholder y editorsRef
 */
export const usePlaceholderNavigation = <T extends string>(fieldOrder: T[]) => {
    const lastPlaceholderIndexRef = useRef<number>(-1);
    const currentFieldRef = useRef<string>('');
    const findNextPlaceholderRef = useRef<(() => void) | null>(null);

    const editorsRef = useRef<EditorsRef<T>>(
        fieldOrder.reduce((acc, field) => {
            acc[field] = null;
            return acc;
        }, {} as EditorsRef<T>)
    );

    const findNextPlaceholder = useCallback(() => {
        // Detectar en qué campo está el foco actualmente
        let focusedFieldName: string | null = null;
        for (const fieldName of fieldOrder) {
            const editor = editorsRef.current[fieldName];
            if (editor && editor.isFocused) {
                focusedFieldName = fieldName;
                break;
            }
        }

        // Si hay un campo con foco y es diferente al último usado, reiniciar desde ese campo
        if (focusedFieldName && focusedFieldName !== currentFieldRef.current) {
            currentFieldRef.current = focusedFieldName;
            lastPlaceholderIndexRef.current = -1;
        }

        let currentFieldIndex = fieldOrder.indexOf(currentFieldRef.current as T);
        if (currentFieldIndex === -1) currentFieldIndex = 0;

        // Buscar en todos los campos empezando por el actual
        for (let i = 0; i < fieldOrder.length; i++) {
            const fieldIndex = (currentFieldIndex + i) % fieldOrder.length;
            const fieldName = fieldOrder[fieldIndex];
            const editor = editorsRef.current[fieldName];

            if (!editor) continue;

            const text = editor.getText();
            const regex = /\[\[([^\]]+)\]\]/g;
            const matches = Array.from(text.matchAll(regex));

            if (matches.length === 0) continue;

            let targetIndex = 0;

            if (fieldName === currentFieldRef.current && i === 0) {
                targetIndex = (lastPlaceholderIndexRef.current + 1) % matches.length;
            } else {
                targetIndex = 0;
            }

            const match = matches[targetIndex] as RegExpMatchArray;
            if (!match || match.index === undefined) continue;

            currentFieldRef.current = fieldName;
            lastPlaceholderIndexRef.current = targetIndex;

            const startPos = match.index + 2;
            const endPos = startPos + match[1].length;

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

            console.log(`✅ Placeholder encontrado: "${match[1]}" en campo ${fieldName}`);
            return true;
        }

        lastPlaceholderIndexRef.current = -1;
        toast.info('No se encontraron más placeholders [[texto]]');
        return false;
    }, [fieldOrder]);

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
