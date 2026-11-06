import { useEffect, useState } from 'react';
import { loadKeyImageUrl } from '@/services/keyImages.service';

export const KeyImageThumbnail = ({ imageId }: { imageId: string }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;
        loadKeyImageUrl(imageId)
            .then(value => { if (active) setUrl(value); })
            .catch(() => { if (active) setFailed(true); });
        return () => { active = false; };
    }, [imageId]);

    if (!url) {
        return <div className="flex h-24 items-center justify-center bg-black text-xs text-gray-400">{failed ? 'Imagen no disponible' : 'Cargando…'}</div>;
    }
    return <img src={url} alt="Imagen clave" draggable={false} className="w-full h-auto object-cover bg-black" />;
};
