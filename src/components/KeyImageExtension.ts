import Image from '@tiptap/extension-image';
import { loadKeyImageUrl } from '@/services/keyImages.service';

/** En el HTML del informe queda solo el ID; el PDF y el editor resuelven el archivo por separado. */
export const KeyImageExtension = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            keyImageId: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('data-key-image-id'),
                renderHTML: (attributes: { keyImageId?: string | null }) =>
                    attributes.keyImageId ? { 'data-key-image-id': attributes.keyImageId } : {},
            },
        };
    },
    parseHTML() {
        return [{ tag: 'img[data-key-image-id]' }, ...(this.parent?.() ?? [])];
    },
    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement('img');
            dom.alt = node.attrs.alt || 'Imagen clave';
            if (node.attrs.keyImageId) {
                loadKeyImageUrl(node.attrs.keyImageId)
                    .then(url => { dom.src = url; })
                    .catch(() => { dom.alt = 'Imagen clave no disponible'; });
            } else if (node.attrs.src) {
                dom.src = node.attrs.src;
            }
            return { dom };
        };
    },
});
