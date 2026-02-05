# API REST - NextRIS DICOM

APIs RESTful para consumo desde aplicaciones React y clientes externos.

## Base URL

```
http://148.230.72.8:5001/api
```

## Autenticación

Todas las APIs requieren autenticación mediante sesión de Flask (cookies).

---

## Endpoints Disponibles

### 1. Health Check

**GET** `/api/health`

Verifica que la API está funcionando.

**Response:**
```json
{
  "success": true,
  "message": "NextRIS API is running",
  "version": "1.0.0"
}
```

---

### 2. Subir Estudio DICOM

**POST** `/api/dicom/upload`

Sube un archivo DICOM, lo valida y lo envía al PACS.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (archivo DICOM)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Archivo DICOM procesado exitosamente",
  "data": {
    "guid": "uuid-del-registro",
    "filename": "20260205_120000_estudio.dcm",
    "original_filename": "estudio.dcm",
    "size": 1048576,
    "size_mb": 1.0,
    "upload_time": "2026-02-05T12:00:00",
    "dicom_info": {
      "patient_name": "PEREZ JUAN",
      "patient_id": "12345678",
      "study_date": "20260205",
      "study_time": "120000",
      "modality": "CT",
      "study_instance_uid": "1.2.3.4.5...",
      "accession_number": "ACC001"
    },
    "pacs_status": "success",
    "pacs_message": "Enviado al PACS exitosamente",
    "uploaded_by": "username"
  }
}
```

**Response Error (400/500):**
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

---

### 3. Listar Estudios No Vinculados

**GET** `/api/dicom/unlinked-studies`

Lista todos los estudios DICOM cargados que NO están vinculados a ninguna orden.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "studies": [
      {
        "guid": "uuid",
        "filename": "20260205_120000_estudio.dcm",
        "patient_name": "PEREZ JUAN",
        "patient_id": "12345678",
        "study_date": "20260205",
        "study_time": "120000",
        "study_description": "TC ABDOMEN",
        "modality": "CT",
        "study_instance_uid": "1.2.3.4.5...",
        "accession_number": "ACC001",
        "upload_date": "2026-02-05T12:00:00",
        "uploaded_by": "username",
        "pacs_status": "success",
        "file_size_mb": 1.5
      }
    ],
    "total": 1
  }
}
```

---

### 4. Buscar Exámenes Sin Imagen

**GET** `/api/dicom/search-examinations`

Busca exámenes existentes en el sistema que NO tienen imágenes asociadas (isimage = 0).

**Query Parameters:**
- `patient_name` (opcional): Nombre del paciente (búsqueda parcial)
- `patient_id` (opcional): DNI/ID del paciente
- `accession` (opcional): Número de acceso
- `date_from` (opcional): Fecha desde (YYYY-MM-DD)
- `date_to` (opcional): Fecha hasta (YYYY-MM-DD)

**Ejemplo:**
```
GET /api/dicom/search-examinations?patient_name=Juan&patient_id=12345678
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "examinations": [
      {
        "guid": "uuid-del-examen",
        "accession": "ACC001",
        "patient_name": "PEREZ JUAN",
        "patient_id": "12345678",
        "date": "2026-02-05T10:00:00",
        "study_type": "TC ABDOMEN",
        "is_image": 0
      }
    ],
    "total": 1
  }
}
```

---

### 5. Vincular Estudio con Orden

**POST** `/api/dicom/link-study`

Vincula un estudio DICOM cargado manualmente con un examen/orden existente.

**Request:**
- Content-Type: `application/json`

**Body:**
```json
{
  "upload_guid": "uuid-del-estudio-cargado",
  "examination_guid": "uuid-del-examen-destino"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Estudio vinculado exitosamente",
  "data": {
    "upload_guid": "uuid",
    "filename": "estudio.dcm",
    "patient_name": "PEREZ JUAN",
    "study_instance_uid": "1.2.3.4.5...",
    "linked_to": "uuid-del-examen"
  }
}
```

**Efectos:**
- Actualiza `islinked = 1` en `tbmanual_uploads`
- Actualiza `isimage = 1` en `tbexamination`
- Establece `linked_examination_guid` y `linked_date`

**Response Error (400/404/500):**
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

---

## Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `400 Bad Request`: Datos inválidos o faltantes
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

---

## Ejemplos de Uso

### JavaScript/React

```javascript
// 1. Subir archivo DICOM
const uploadDicom = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://148.230.72.8:5001/api/dicom/upload', {
    method: 'POST',
    credentials: 'include', // Para incluir cookies de sesión
    body: formData
  });
  
  const data = await response.json();
  return data;
};

// 2. Obtener estudios no vinculados
const getUnlinkedStudies = async () => {
  const response = await fetch('http://148.230.72.8:5001/api/dicom/unlinked-studies', {
    credentials: 'include'
  });
  
  const data = await response.json();
  return data.data.studies;
};

// 3. Buscar exámenes sin imagen
const searchExams = async (patientName) => {
  const params = new URLSearchParams({ patient_name: patientName });
  const response = await fetch(
    `http://148.230.72.8:5001/api/dicom/search-examinations?${params}`,
    { credentials: 'include' }
  );
  
  const data = await response.json();
  return data.data.examinations;
};

// 4. Vincular estudio
const linkStudy = async (uploadGuid, examGuid) => {
  const response = await fetch('http://148.230.72.8:5001/api/dicom/link-study', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      upload_guid: uploadGuid,
      examination_guid: examGuid
    })
  });
  
  const data = await response.json();
  return data;
};
```

### cURL

```bash
# Health Check
curl http://148.230.72.8:5001/api/health

# Subir archivo (requiere sesión autenticada)
curl -X POST \
  -F "file=@estudio.dcm" \
  --cookie "session=..." \
  http://148.230.72.8:5001/api/dicom/upload

# Listar estudios no vinculados
curl --cookie "session=..." \
  http://148.230.72.8:5001/api/dicom/unlinked-studies

# Buscar exámenes
curl --cookie "session=..." \
  "http://148.230.72.8:5001/api/dicom/search-examinations?patient_name=Juan"

# Vincular estudio
curl -X POST \
  -H "Content-Type: application/json" \
  --cookie "session=..." \
  -d '{"upload_guid":"uuid1","examination_guid":"uuid2"}' \
  http://148.230.72.8:5001/api/dicom/link-study
```

---

## Notas Importantes

1. **CORS**: Si consumes la API desde un dominio diferente, necesitas configurar CORS en el servidor Flask
2. **Autenticación**: Todas las APIs requieren una sesión autenticada (login previo)
3. **Límites**: El endpoint de búsqueda retorna máximo 100 resultados
4. **PACS**: Los archivos se envían automáticamente al PACS en `148.230.72.8:11112`
5. **Almacenamiento**: Los archivos DICOM se guardan en `/var/www/nextris-dev-react/uploads_dicom/`

---

## Ubicación de Archivos

- **API Routes**: `/var/www/nextris-dev-react/apps/api/dicom_routes.py`
- **Blueprint**: `/var/www/nextris-dev-react/apps/api/__init__.py`
- **Uploads**: `/var/www/nextris-dev-react/uploads_dicom/`
- **Database**: PostgreSQL - `pacsdb.nextris.tbmanual_uploads` y `pacsdb.nextris.tbexamination`
