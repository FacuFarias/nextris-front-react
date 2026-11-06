import { api } from '@/lib/api';

export interface KeyImage {
    id: string;
    author_name: string;
    created_at: string;
    can_delete: boolean;
}

export const getKeyImages = async (studyUid: string): Promise<KeyImage[]> => {
    const response = await api.get(`/key-images/study/${encodeURIComponent(studyUid)}`);
    return response.data.data;
};

export const deleteKeyImage = async (imageId: string) => {
    await api.delete(`/key-images/${encodeURIComponent(imageId)}`);
};

// Las imágenes clave son inmutables y requieren JWT, por eso se piden una sola vez como blob.
const objectUrls = new Map<string, Promise<string>>();

export const loadKeyImageUrl = (imageId: string): Promise<string> => {
    let url = objectUrls.get(imageId);
    if (!url) {
        url = api.get(`/key-images/${encodeURIComponent(imageId)}/file`, { responseType: 'blob' })
            .then(response => URL.createObjectURL(response.data as Blob));
        objectUrls.set(imageId, url);
        url.catch(() => objectUrls.delete(imageId));
    }
    return url;
};
