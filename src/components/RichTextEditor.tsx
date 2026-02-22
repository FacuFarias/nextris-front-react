import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Undo,
    Redo,
    Lock
} from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    dragOver?: boolean;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent) => void;
    onEditorReady?: (editor: any) => void;
    readOnly?: boolean;
    showToolbar?: boolean;
}

export const RichTextEditor = ({
    value,
    onChange,
    placeholder = 'Escribe aquí...',
    className = '',
    dragOver = false,
    onDragOver,
    onDragLeave,
    onDrop,
    onEditorReady,
    readOnly = false,
    showToolbar = true
}: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                underline: false,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Image,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose max-w-none focus:outline-none min-h-[120px] p-2 dark:prose-invert dark:text-gray-200',
            },
        },
    });

    // Sincronizar el valor externo con el editor
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    // Notificar cuando el editor esté listo
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`relative border dark:border-gray-700 rounded-md bg-white dark:bg-[#2a2e32] ${dragOver ? 'border-purple-500 border-2 bg-purple-50 dark:bg-purple-900/20' : ''} ${className}`}>
            {/* Indicador de solo lectura */}
            {readOnly && (
                <div className="relative z-10 flex items-center gap-2 px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800">
                    <Lock className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                        Campo bloqueado - Documento firmado
                    </span>
                </div>
            )}

            {/* Barra de herramientas */}
            {showToolbar && <div className="relative z-10 flex items-center gap-0.5 px-1.5 py-1 border-b dark:border-gray-700 bg-gray-50 dark:bg-[#2a2e32] flex-wrap">
                {/* Formato de texto */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
                    type="button"
                    title="Negrita"
                    disabled={readOnly}
                >
                    <Bold className="w-4 h-4 dark:text-gray-200" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
                    type="button"
                    title="Cursiva"
                    disabled={readOnly}
                >
                    <Italic className="w-4 h-4 dark:text-gray-200" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('underline') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
                    type="button"
                    title="Subrayado"
                    disabled={readOnly}
                >
                    <UnderlineIcon className="w-4 h-4 dark:text-gray-200" />
                </button>

                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
                    type="button"
                    title="Lista numerada"
                    disabled={readOnly}
                >
                    <ListOrdered className="w-4 h-4 dark:text-gray-200" />
                </button>

                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Alineación */}
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
                    type="button"
                    title="Alinear a la izquierda"
                    disabled={readOnly}
                >
                    <AlignLeft className="w-4 h-4 dark:text-gray-200" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
                    type="button"
                    title="Centrar"
                    disabled={readOnly}
                >
                    <AlignCenter className="w-4 h-4 dark:text-gray-200" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
                    type="button"
                    title="Alinear a la derecha"
                    disabled={readOnly}
                >
                    <AlignRight className="w-4 h-4 dark:text-gray-200" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
                    type="button"
                    title="Justificar"
                    disabled={readOnly}
                >
                    <AlignJustify className="w-4 h-4 dark:text-gray-200" />
                </button>

                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Deshacer/Rehacer */}
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    type="button"
                    title="Deshacer"
                    disabled={!editor.can().undo() || readOnly}
                >
                    <Undo className="w-4 h-4 dark:text-gray-200" />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    type="button"
                    title="Rehacer"
                    disabled={!editor.can().redo() || readOnly}
                >
                    <Redo className="w-4 h-4 dark:text-gray-200" />
                </button>
            </div>}

            {/* Editor con overlay cuando está bloqueado */}
            <div className={`relative ${readOnly ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                {/* Marca de agua BLOQUEADO - detrás del texto */}
                {readOnly && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <span className="text-white font-bold text-[40px] select-none transform -rotate-30 text-shadow-md">
                            BLOQUEADO
                        </span>
                    </div>
                )}
                {readOnly && (
                    <div className="absolute inset-0 bg-transparent bg-opacity-50 cursor-not-allowed z-10" />
                )}
                <div
                    className={`relative z-1 ${readOnly ? 'opacity-70' : ''}`}
                    onDragOver={readOnly ? undefined : onDragOver}
                    onDragLeave={readOnly ? undefined : onDragLeave}
                    onDrop={readOnly ? undefined : onDrop}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};