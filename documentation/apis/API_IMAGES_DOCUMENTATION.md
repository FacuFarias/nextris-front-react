# API Images Documentation

## Overview
Este documento describe todos los endpoints disponibles para la gestión de imágenes clave (key images) de estudios DICOM en el sistema NextRIS.

**Base URL:** `/api`
**Authentication:** Requerido JWT Token
**Ruta de imágenes:** `/var/local/dcm4chee-arc/key-images/<study_uid>/`

---

## Endpoints de Imágenes

### 1. GET /images/study/<study_uid>
Obtiene la lista de imágenes clave de un estudio específico.

#### Description
Retrieves all JPG key images for a given study. Can return either a list of image metadata or base64-encoded images.

#### Parameters

**Path Parameters:**
- `study_uid` (required): Study Instance UID del estudio DICOM

**Query Parameters:**
- `format` (optional): Formato de respuesta
  - `list` (default): Devuelve lista con metadatos
  - `base64`: Devuelve imágenes codificadas en base64

#### Request

**Ejemplo 1: Lista de imágenes**
```http
GET /api/images/study/1.2.840.113619.2.55.3.12345?format=list
Authorization: Bearer <JWT_TOKEN>
```

**Ejemplo 2: Imágenes en base64**
```http
GET /api/images/study/1.2.840.113619.2.55.3.12345?format=base64
Authorization: Bearer <JWT_TOKEN>
```

#### Response

**Status Code:** 200 OK

**Formato: list (default)**
```json
{
  "success": true,
  "data": {
    "study_uid": "1.2.840.113619.2.55.3.12345",
    "images_count": 3,
    "images": [
      {
        "filename": "image001.jpg",
        "path": "/api/images/study/1.2.840.113619.2.55.3.12345/file/image001.jpg",
        "size": 125648
      },
      {
        "filename": "image002.jpg",
        "path": "/api/images/study/1.2.840.113619.2.55.3.12345/file/image002.jpg",
        "size": 134567
      },
      {
        "filename": "image003.jpg",
        "path": "/api/images/study/1.2.840.113619.2.55.3.12345/file/image003.jpg",
        "size": 142890
      }
    ]
  }
}
```

**Formato: base64**
```json
{
  "success": true,
  "data": {
    "study_uid": "1.2.840.113619.2.55.3.12345",
    "images_count": 3,
    "images": [
      {
        "filename": "image001.jpg",
        "data": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a...",
        "size": 125648
      },
      {
        "filename": "image002.jpg",
        "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhg...",
        "size": 134567
      }
    ]
  }
}
```

#### Errors

**404 Not Found - No se encontraron imágenes**
```json
{
  "success": false,
  "message": "No se encontraron imágenes para este estudio"
}
```

**404 Not Found - No hay imágenes JPG**
```json
{
  "success": false,
  "message": "No se encontraron imágenes JPG en este estudio"
}
```

**400 Bad Request - Study UID inválido**
```json
{
  "success": false,
  "message": "Study UID inválido"
}
```

---

### 2. GET /images/study/<study_uid>/file/<filename>
Obtiene una imagen específica del estudio como archivo JPG.

#### Description
Returns a specific JPG image file from a study. Can be used directly in `<img>` tags.

#### Parameters

**Path Parameters:**
- `study_uid` (required): Study Instance UID del estudio DICOM
- `filename` (required): Nombre del archivo JPG (ejemplo: `image001.jpg`)

#### Request
```http
GET /api/images/study/1.2.840.113619.2.55.3.12345/file/image001.jpg
Authorization: Bearer <JWT_TOKEN>
```

#### Response

**Status Code:** 200 OK

**Content-Type:** `image/jpeg`

Devuelve el archivo de imagen JPG directamente.

**Uso en HTML:**
```html
<img src="/api/images/study/1.2.840.113619.2.55.3.12345/file/image001.jpg" 
     alt="Key Image" />
```

#### Errors

**404 Not Found - Imagen no encontrada**
```json
{
  "success": false,
  "message": "Imagen no encontrada"
}
```

**400 Bad Request - Nombre de archivo inválido**
```json
{
  "success": false,
  "message": "Nombre de archivo inválido"
}
```

**400 Bad Request - Solo archivos JPG**
```json
{
  "success": false,
  "message": "Solo se permiten archivos JPG"
}
```

---

### 3. GET /images/study/<study_uid>/thumbnail/<filename>
Obtiene una miniatura de una imagen específica.

#### Description
Returns a thumbnail version of a specific image. Currently returns the full image (thumbnail generation can be implemented with PIL/Pillow).

#### Parameters

**Path Parameters:**
- `study_uid` (required): Study Instance UID del estudio DICOM
- `filename` (required): Nombre del archivo JPG

**Query Parameters:**
- `size` (optional): Tamaño máximo del thumbnail en píxeles (default: 200)
  - *Nota: Este parámetro está preparado para futura implementación*

#### Request
```http
GET /api/images/study/1.2.840.113619.2.55.3.12345/thumbnail/image001.jpg?size=150
Authorization: Bearer <JWT_TOKEN>
```

#### Response

**Status Code:** 200 OK

**Content-Type:** `image/jpeg`

Devuelve el archivo de imagen JPG (actualmente imagen completa).

**Uso en HTML:**
```html
<img src="/api/images/study/1.2.840.113619.2.55.3.12345/thumbnail/image001.jpg?size=150" 
     alt="Thumbnail" 
     width="150" />
```

#### Errors
Los mismos errores que el endpoint `/file/<filename>`.

---

## Ejemplos de Uso

### Frontend - React/TypeScript

**Obtener lista de imágenes:**
```typescript
import { apiClient } from '@/services/api-client';

interface ImageData {
  filename: string;
  path: string;
  size: number;
}

interface StudyImagesResponse {
  success: boolean;
  data: {
    study_uid: string;
    images_count: number;
    images: ImageData[];
  };
}

export const getStudyImages = async (studyUid: string): Promise<ImageData[]> => {
  const response = await apiClient.get<StudyImagesResponse>(
    `/images/study/${studyUid}?format=list`
  );
  
  return response.data.data.images;
};
```

**Mostrar imágenes en galería:**
```tsx
import { useQuery } from '@tanstack/react-query';
import { getStudyImages } from '@/services/images.service';

function ImageGallery({ studyUid }: { studyUid: string }) {
  const { data: images, isLoading } = useQuery({
    queryKey: ['study-images', studyUid],
    queryFn: () => getStudyImages(studyUid),
  });

  if (isLoading) return <div>Cargando imágenes...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {images?.map((image) => (
        <div key={image.filename} className="border rounded p-2">
          <img 
            src={image.path} 
            alt={image.filename}
            className="w-full h-auto"
          />
          <p className="text-sm mt-2">{image.filename}</p>
          <p className="text-xs text-gray-500">
            {(image.size / 1024).toFixed(2)} KB
          </p>
        </div>
      ))}
    </div>
  );
}
```

**Obtener imágenes en base64:**
```typescript
interface Base64Image {
  filename: string;
  data: string;
  size: number;
}

export const getStudyImagesBase64 = async (studyUid: string): Promise<Base64Image[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      study_uid: string;
      images_count: number;
      images: Base64Image[];
    };
  }>(`/images/study/${studyUid}?format=base64`);
  
  return response.data.data.images;
};

// Uso en componente
function Base64Gallery({ studyUid }: { studyUid: string }) {
  const { data: images } = useQuery({
    queryKey: ['study-images-base64', studyUid],
    queryFn: () => getStudyImagesBase64(studyUid),
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {images?.map((image) => (
        <img 
          key={image.filename}
          src={`data:image/jpeg;base64,${image.data}`}
          alt={image.filename}
        />
      ))}
    </div>
  );
}
```

### cURL Examples

**Listar imágenes:**
```bash
curl -X GET "http://localhost:5005/api/images/study/1.2.840.113619.2.55.3.12345?format=list" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Descargar imagen específica:**
```bash
curl -X GET "http://localhost:5005/api/images/study/1.2.840.113619.2.55.3.12345/file/image001.jpg" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output image001.jpg
```

**Obtener imágenes en base64:**
```bash
curl -X GET "http://localhost:5005/api/images/study/1.2.840.113619.2.55.3.12345?format=base64" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Seguridad

### Validaciones Implementadas

1. **Autenticación JWT:** Todos los endpoints requieren token JWT válido
2. **Path Traversal Protection:** Validación contra `..` y `/` en paths
3. **Extensión de archivo:** Solo permite archivos `.jpg` y `.jpeg`
4. **Validación de rutas:** Verifica que sean archivos/directorios válidos

### Mejores Prácticas

- ✅ Siempre incluir el header `Authorization: Bearer <token>`
- ✅ Validar el formato del Study UID antes de hacer la petición
- ✅ Manejar errores 404 cuando no hay imágenes disponibles
- ✅ Usar `format=list` para obtener metadata y cargar imágenes on-demand
- ✅ Usar `format=base64` solo cuando sea necesario (mayor payload)

---

## Estructura de Directorios

```
/var/local/dcm4chee-arc/key-images/
├── 1.2.840.113619.2.55.3.12345/
│   ├── image001.jpg
│   ├── image002.jpg
│   └── image003.jpg
├── 1.2.840.113619.2.55.3.67890/
│   ├── slice001.jpg
│   ├── slice002.jpg
│   └── slice003.jpg
└── ...
```

Cada carpeta corresponde a un Study Instance UID y contiene las imágenes clave en formato JPG.

---

## Notas de Implementación

### Rendimiento

- Las imágenes se cargan directamente desde el sistema de archivos
- `format=list` es más eficiente para galerías grandes
- `format=base64` aumenta el payload en ~33% (overhead de codificación)
- Considerar implementar caché para imágenes frecuentemente accedidas

### Futuras Mejoras

1. **Generación de thumbnails:**
   ```python
   from PIL import Image
   
   def create_thumbnail(image_path, size=200):
       with Image.open(image_path) as img:
           img.thumbnail((size, size))
           return img
   ```

2. **Paginación para estudios con muchas imágenes**
3. **Streaming de imágenes grandes**
4. **Compresión adicional para transferencia**
5. **WebP support para mejor compresión**

---

## Soporte

Para reportar problemas o solicitar nuevas funcionalidades relacionadas con la API de imágenes, contactar al equipo de desarrollo.

**Versión:** 1.0  
**Última actualización:** Enero 2026
