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
    Redo
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
    onEditorReady
}: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Deshabilitamos las extensiones que vamos a personalizar
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
                class: 'prose max-w-none focus:outline-none min-h-[150px] p-3',
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
        <div className={`border rounded-md bg-white ${dragOver ? 'border-purple-500 border-2 bg-purple-50' : ''} ${className}`}>
            {/* Barra de herramientas */}
            <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
                {/* Formato de texto */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
                    type="button"
                    title="Negrita"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
                    type="button"
                    title="Cursiva"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
                    type="button"
                    title="Subrayado"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
                    type="button"
                    title="Lista numerada"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Alineación */}
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
                    type="button"
                    title="Alinear a la izquierda"
                >
                    <AlignLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
                    type="button"
                    title="Centrar"
                >
                    <AlignCenter className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
                    type="button"
                    title="Alinear a la derecha"
                >
                    <AlignRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''}`}
                    type="button"
                    title="Justificar"
                >
                    <AlignJustify className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Deshacer/Rehacer */}
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    className="p-2 rounded hover:bg-gray-200"
                    type="button"
                    title="Deshacer"
                    disabled={!editor.can().undo()}
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    className="p-2 rounded hover:bg-gray-200"
                    type="button"
                    title="Rehacer"
                    disabled={!editor.can().redo()}
                >
                    <Redo className="w-4 h-4" />
                </button>
            </div>

            {/* Editor */}
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
