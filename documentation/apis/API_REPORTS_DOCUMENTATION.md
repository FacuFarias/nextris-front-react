# API Reports Documentation

## Overview
Este documento describe todos los endpoints disponibles para la gestión de reportes médicos, redacción de informes y plantillas predefinidas en el sistema NextRIS.

**Base URL:** `/api`
**Authentication:** Requerido JWT Token

---

## Endpoints de Redacción de Informes

### 1. GET /examinations/for-reporting
Obtiene lista de exámenes listos para reportar.

#### Description
Retrieves a paginated list of executed examinations that are not yet reported, filtered by user locations.

#### Parameters
**Query Parameters:**
- `status` (optional): Filtrar por estado del examen
- `show_reported` (optional): true para incluir exámenes reportados (finalizados, isreported=1)
- `show_ready` (optional): true para incluir exámenes listos para reportar (no reportados, isreported=0)
- `assigned_to_me` (optional): true para mostrar solo exámenes asignados al usuario actual
- `modality_id` (optional): GUID de la modalidad para filtrar
- `body_part_id` (optional): GUID de la parte del cuerpo para filtrar
- `study_group_id` (optional): GUID del grupo de estudio para filtrar
- `page` (optional): Número de página (default: 1)
- `per_page` (optional): Items por página (default: 50, máximo: 100)

**Nota sobre filtros de reporte:**
- Si `show_reported=true` y `show_ready=true` están activos simultáneamente: se muestran AMBOS tipos (reportados y no reportados)
- Si solo `show_reported=true`: muestra únicamente exámenes reportados
- Si solo `show_ready=true`: muestra únicamente exámenes listos para reportar (no reportados)
- Si ninguno está activo: se muestran todos los exámenes por defecto

#### Request
```http
GET /api/examinations/for-reporting?page=1&per_page=50
Authorization: Bearer <JWT_TOKEN>
```

**Ejemplos de uso:**
```http
# Todos los exámenes (por defecto)
GET /api/examinations/for-reporting

# Solo exámenes listos para reportar (no reportados)
GET /api/examinations/for-reporting?show_ready=true

# Solo exámenes ya finalizados/reportados
GET /api/examinations/for-reporting?show_reported=true

# Ambos: reportados y no reportados (todos)
GET /api/examinations/for-reporting?show_reported=true&show_ready=true

# Exámenes asignados a mí (listos para reportar)
GET /api/examinations/for-reporting?assigned_to_me=true&show_ready=true

# Exámenes reportados asignados a mí
GET /api/examinations/for-reporting?assigned_to_me=true&show_reported=true

# Filtrar por modalidad específica
GET /api/examinations/for-reporting?show_ready=true&modality_id=abc-123-guid

# Filtrar por parte del cuerpo
GET /api/examinations/for-reporting?show_ready=true&body_part_id=xyz-789-guid

# Filtrar por grupo de estudio
GET /api/examinations/for-reporting?show_ready=true&study_group_id=def-456-guid

# Combinar múltiples filtros
GET /api/examinations/for-reporting?show_ready=true&modality_id=abc-123&body_part_id=xyz-789&study_group_id=def-456&assigned_to_me=true
```

#### Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "guid": "f39710b4-7914-44ba-ab72-ad4ed5e22e98",
        "patient_name": "Juan García Pérez",
        "patient_dni": "12345678",
        "study_type": "Tomografía de Tórax",
        "admission_number": "ADM001",
        "accession_number": "ACC001",
        "created_on": "2025-12-18T14:00:00",
        "status": "A",
        "is_reported": false,
        "is_executed": true,
        "equipment": "CT-01",
        "location": "Sede Central",
        "assigned_to": "uuid-del-medico-asignado",
        "report_available": true,
        "modality_id": "abc-123-guid",
        "modality_description": "CT",
        "study_group_id": "def-456-guid",
        "study_group_description": "Radiología",
        "bodypart_id": "xyz-789-guid",
        "bodypart_description": "Tórax"
      }
    ],
    "page": 1,
    "per_page": 50,
    "total": 150
  }
}
```

#### Errors
```json
{
  "success": false,
  "message": "Error: {error_details}"
}
```

**Status Codes:**
- `200`: Success
- `500`: Error de configuración o servidor

---

### 2. GET /examinations/{exam_id}/report
Obtiene el reporte de un examen específico.

#### Description
Retrieves the medical report data for a specific examination, including findings, impressions, techniques, and conclusions.

#### Parameters
**Path Parameters:**
- `exam_id` (required): UUID del examen

#### Request
```http
GET /api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/report
Authorization: Bearer <JWT_TOKEN>
```

#### Response
**Status Code:** 200 OK

**Cuando existe un reporte:**
```json
{
  "success": true,
  "data": {
    "guid": "r1234567-8901-2345-6789-012345678901",
    "exam_id": "f39710b4-7914-44ba-ab72-ad4ed5e22e98",
    "patient_id": "p1234567-8901-2345-6789-012345678901",
    "admission_number": "ADM001",
    "findings": "Se observa infiltrado en lóbulo superior derecho...",
    "impressions": "Compatible con proceso inflamatorio...",
    "techniques": "TC de tórax sin contraste...",
    "conclusions": "Neumonía adquirida en la comunidad",
    "was_saved": true,
    "created_on": "2025-12-18T14:00:00",
    "updated_on": "2025-12-18T15:30:00"
  }
}
```

**Cuando no existe un reporte (estructura vacía):**
```json
{
  "success": true,
  "data": {
    "guid": null,
    "exam_id": "f39710b4-7914-44ba-ab72-ad4ed5e22e98",
    "patient_id": "p1234567-8901-2345-6789-012345678901",
    "admission_number": "ADM001",
    "findings": "",
    "impressions": "",
    "techniques": "",
    "conclusions": "",
    "was_saved": false,
    "created_on": null,
    "updated_on": null
  }
}
```

#### Errors
```json
{
  "success": false,
  "message": "Examen no encontrado"
}
```

**Status Codes:**
- `200`: Success
- `404`: Examen no encontrado
- `500`: Error de servidor

---

### 3. PUT/PATCH /examinations/{exam_id}/report
Actualiza o crea el reporte de un examen.

#### Description
Updates an existing report or creates a new one if it doesn't exist. Supports partial updates (only updates provided fields).

#### Parameters
**Path Parameters:**
- `exam_id` (required): UUID del examen

#### Request Body
```json
{
  "findings": "Se observa infiltrado en lóbulo superior derecho...",
  "impressions": "Compatible con proceso inflamatorio...",
  "techniques": "TC de tórax sin contraste...",
  "conclusions": "Neumonía adquirida en la comunidad",
  "mark_as_reported": false
}
```

**Campos del Body:**
- `findings` (optional): Texto de hallazgos
- `impressions` (optional): Texto de impresiones
- `techniques` (optional): Texto de técnicas utilizadas
- `conclusions` (optional): Texto de conclusiones
- `mark_as_reported` (optional): Boolean para marcar el examen como reportado (default: false)

#### Request
```http
PUT /api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/report
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "findings": "Se observa infiltrado...",
  "mark_as_reported": true
}
```

#### Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "message": "Reporte actualizado exitosamente",
  "data": {
    "report_id": "r1234567-8901-2345-6789-012345678901"
  }
}
```

#### Errors
```json
{
  "success": false,
  "message": "Examen no encontrado"
}
```

**Status Codes:**
- `200`: Success
- `404`: Examen no encontrado
- `500`: Error de servidor

**Notas:**
- Si el reporte no existe, se crea automáticamente
- Si `mark_as_reported` es `true`, se actualiza el campo `IsReported` en tbexamination
- Los campos no enviados no se modifican (actualización parcial)

---

### 4. GET /examinations/{exam_id}/notes
Obtiene las notas clínicas de un examen.

#### Description
Retrieves clinical notes for a specific examination, including history, clinical question, and other details.

#### Parameters
**Path Parameters:**
- `exam_id` (required): UUID del examen

#### Request
```http
GET /api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/notes
Authorization: Bearer <JWT_TOKEN>
```

#### Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "data": {
    "history": "Paciente con tos y fiebre de 3 días de evolución",
    "clinical_question": "Descartar neumonía",
    "others_details": "Antecedentes de diabetes",
    "number_of_views": "2",
    "stat": "Normal",
    "laterality": "Bilateral"
  }
}
```

#### Errors
```json
{
  "success": false,
  "message": "Examen no encontrado"
}
```

**Status Codes:**
- `200`: Success
- `404`: Examen no encontrado
- `500`: Error de servidor

---

### 5. PUT/PATCH /examinations/{exam_id}/notes
Actualiza las notas clínicas de un examen.

#### Description
Updates clinical notes for a specific examination. Supports partial updates.

#### Parameters
**Path Parameters:**
- `exam_id` (required): UUID del examen

#### Request Body
```json
{
  "history": "Paciente con tos y fiebre de 3 días de evolución",
  "clinical_question": "Descartar neumonía",
  "others_details": "Antecedentes de diabetes",
  "number_of_views": "2",
  "laterality_id": "uuid-de-lateralidad",
  "stat": "Urgente"
}
```

**Campos del Body (todos opcionales):**
- `history`: Historia clínica del paciente
- `clinical_question`: Pregunta clínica a resolver
- `others_details`: Otros detalles relevantes
- `number_of_views`: Número de vistas/proyecciones
- `laterality_id`: UUID de la lateralidad (referencia a islaterality)
- `stat`: Estado de urgencia

#### Request
```http
PUT /api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/notes
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "history": "Paciente con tos...",
  "clinical_question": "Descartar neumonía"
}
```

#### Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "message": "Notas actualizadas exitosamente"
}
```

#### Errors
```json
{
  "success": false,
  "message": "Examen no encontrado"
}
```

**Status Codes:**
- `200`: Success
- `400`: No hay campos para actualizar
- `404`: Examen no encontrado
- `500`: Error de servidor

**Notas:**
- Solo se actualizan los campos enviados en el request
- Los campos no enviados permanecen sin cambios

---

## Ejemplos de Uso

### Flujo completo: Redacción de un informe

#### 1. Obtener lista de exámenes pendientes de reportar
```bash
curl -X GET "http://localhost:5001/api/examinations/for-reporting?page=1&per_page=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Obtener reporte actual del examen
```bash
curl -X GET "http://localhost:5001/api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/report" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Obtener notas clínicas del examen
```bash
curl -X GET "http://localhost:5001/api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/notes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Actualizar notas clínicas (botón "Notas")
```bash
curl -X PUT "http://localhost:5001/api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/notes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "history": "Paciente con tos y fiebre de 3 días",
    "clinical_question": "Descartar neumonía"
  }'
```

#### 5. Guardar borrador del informe (botón "Guardar")
```bash
curl -X PUT "http://localhost:5001/api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/report" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "findings": "Se observa infiltrado en lóbulo superior derecho",
    "impressions": "Compatible con proceso inflamatorio",
    "mark_as_reported": false
  }'
```

#### 6. Finalizar y marcar como reportado (botón "Finalizar Informe")
```bash
curl -X PUT "http://localhost:5001/api/examinations/f39710b4-7914-44ba-ab72-ad4ed5e22e98/report" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "findings": "Se observa infiltrado en lóbulo superior derecho de aproximadamente 3cm",
    "impressions": "Compatible con proceso inflamatorio agudo",
    "techniques": "TC de tórax sin contraste, cortes de 5mm",
    "conclusions": "Neumonía adquirida en la comunidad. Se recomienda seguimiento clínico",
    "mark_as_reported": true
  }'
```

---

## Tablas de Base de Datos Relacionadas

### tbexamination
Tabla principal de exámenes:
- `IsExecuted`: 1 si el examen fue ejecutado
- `IsReported`: 1 si el examen tiene reporte finalizado
- `history`: Historia clínica
- `clinicalquestion`: Pregunta clínica
- `othersdetails`: Otros detalles
- `numberofviews`: Número de vistas
- `laterality_id`: Referencia a islaterality
- `stat`: Estado de urgencia

### tbreport
Tabla de reportes médicos:
- `IdExamination`: Referencia a tbexamination.Guid
- `Findings`: Hallazgos
- `Impressions`: Impresiones
- `Techniques`: Técnicas
- `Conclusions`: Conclusiones
- `WasSaved`: 1 si fue guardado
- `CreatedOn`: Fecha de creación
- `Date`: Fecha de última actualización

### islaterality
Catálogo de lateralidades (Izquierda, Derecha, Bilateral, etc.)

---

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren un token JWT válido
2. **Filtros por ubicación**: Los endpoints filtran automáticamente por las ubicaciones asignadas al usuario
3. **Paginación**: Por defecto se retornan 50 items, máximo 100
4. **Actualizaciones parciales**: PUT/PATCH solo actualizan los campos enviados
5. **Estado de reportado**: Use `mark_as_reported: true` solo cuando el informe esté completo
6. **Zona horaria**: Las fechas se manejan según la zona horaria de la ubicación

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Success - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos o faltantes |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## Changelog

### Version 1.2.0 (2026-01-31)
- Agregados endpoints POST /examinations/{exam_id}/block y POST /examinations/{exam_id}/unblock
- Sistema de bloqueo de exámenes para prevenir edición concurrente
- Campo `blocked_by` incluido en GET /examinations/for-reporting

### Version 1.1.0 (2026-01-15)
- Agregado campo `report_available` en GET /examinations/for-reporting
- El PDF se genera bajo demanda al visualizar, descargar o distribuir un informe firmado

### Version 1.0.0 (2026-01-03)
- Endpoints iniciales para redacción de informes
- GET /examinations/for-reporting
- GET /examinations/{exam_id}/report
- PUT/PATCH /examinations/{exam_id}/report
- GET /examinations/{exam_id}/notes
- PUT/PATCH /examinations/{exam_id}/notes

---

## Endpoints de Bloqueo de Exámenes

### 11. POST /examinations/{exam_id}/block
Bloquea un examen para edición exclusiva del usuario actual.

#### Description
Permite al usuario bloquear un examen para evitar que otros usuarios lo editen simultáneamente. Útil para prevenir conflictos al redactar reportes.

#### Parameters
**Path Parameters:**
- `exam_id` (required): GUID del examen a bloquear

#### Request
```http
POST /api/examinations/{exam_id}/block
Authorization: Bearer <JWT_TOKEN>
```

#### Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "message": "Examen bloqueado exitosamente",
  "blocked_by": "uuid-del-usuario-actual"
}
```

#### Errors
```json
// Examen no encontrado
{
  "success": false,
  "message": "Examen no encontrado"
}

// Ya bloqueado por otro usuario
{
  "success": false,
  "message": "El examen está bloqueado por otro usuario",
  "blocked_by": "uuid-del-otro-usuario"
}
```

**Status Codes:**
- `200`: Success - Examen bloqueado exitosamente
- `404`: Not Found - Examen no encontrado
- `409`: Conflict - Examen bloqueado por otro usuario
- `500`: Internal Server Error

#### Comportamiento
- Si el examen no está bloqueado: lo bloquea para el usuario actual
- Si el examen ya está bloqueado por el mismo usuario: permite re-bloquear (no da error)
- Si el examen está bloqueado por otro usuario: retorna error 409

---

### 12. POST /examinations/{exam_id}/unblock
Desbloquea un examen previamente bloqueado.

#### Description
Permite al usuario desbloquear un examen que previamente bloqueó, permitiendo que otros usuarios puedan editarlo.

#### Parameters
**Path Parameters:**
- `exam_id` (required): GUID del examen a desbloquear

#### Request
```http
POST /api/examinations/{exam_id}/unblock
Authorization: Bearer <JWT_TOKEN>
```

#### Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "message": "Examen desbloqueado exitosamente"
}
```

#### Errors
```json
// Examen no encontrado
{
  "success": false,
  "message": "Examen no encontrado"
}

// Bloqueado por otro usuario
{
  "success": false,
  "message": "Solo el usuario que bloqueó el examen puede desbloquearlo"
}
```

**Status Codes:**
- `200`: Success - Examen desbloqueado exitosamente
- `403`: Forbidden - Solo el usuario que bloqueó puede desbloquear
- `404`: Not Found - Examen no encontrado
- `500`: Internal Server Error

#### Comportamiento
- Solo el usuario que bloqueó el examen puede desbloquearlo
- Si el examen no está bloqueado: no genera error (retorna success)

#### Uso Recomendado desde Frontend
```javascript
// Al abrir un examen para editar
const blockExam = async (examId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/examinations/${examId}/block`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (response.status === 409) {
      alert('Este examen está siendo editado por otro usuario');
      return false;
    }
    
    return data.success;
  } catch (error) {
    console.error('Error bloqueando examen:', error);
    return false;
  }
};

// Al cerrar el editor o guardar
const unblockExam = async (examId) => {
  try {
    await fetch(`${API_BASE_URL}/api/examinations/${examId}/unblock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error desbloqueando examen:', error);
  }
};

// Uso en componente
useEffect(() => {
  blockExam(examId);
  
  // Cleanup al desmontar
  return () => {
    unblockExam(examId);
  };
}, [examId]);
```

---

## Endpoints de Firma de Reportes

### 13. POST /quitar_firma/{exam_id}
Quita la firma de un reporte y lo vuelve inmediatamente no disponible para visualización.

#### Description
Revierte completamente el proceso de firma de un reporte. Esta función es lo contrario de `sign_report`:
- Marca el examen como NO reportado (`IsReported=0`)
- Limpia la fecha de reporte (`reportdate=NULL`)
- No elimina archivos: los PDFs se generan únicamente bajo demanda
- Actualiza el estado del examen

#### Parameters
**Path Parameters:**
- `exam_id` (required): GUID del examen cuya firma se quiere remover

#### Request
```http
POST /api/quitar_firma/{exam_id}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "message": "Firma removida exitosamente"
}
```

**Posibles mensajes:**
- `"Firma removida exitosamente"` - La firma se removió y el informe dejó de estar disponible

#### Errors
```json
// Examen no encontrado
{
  "success": false,
  "message": "Examen no encontrado: {exam_id}"
}

// Error general
{
  "success": false,
  "message": "Error: {descripción del error}"
}
```

**Status Codes:**
- `200`: Success - Firma removida exitosamente
- `404`: Not Found - Examen no encontrado
- `500`: Internal Server Error

#### Comportamiento
1. Actualiza el examen: `IsReported=0`, `reportdate=NULL`
2. Actualiza el estado del examen mediante `updatestatus()`

#### Uso desde Frontend
```javascript
// Quitar firma de un reporte
const quitarFirmaReporte = async (examId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quitar_firma/${examId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Firma removida:', data.message);
      // Actualizar UI, recargar lista de exámenes, etc.
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error al quitar firma:', error);
  }
};
```

#### Casos de Uso
- **Corrección de errores**: Cuando se firmó un reporte por error y necesita ser revisado
- **Re-edición**: Cuando se necesita volver a editar un reporte ya firmado
- **Anulación de firma**: Para deshacer completamente la firma de un informe

#### Notas Importantes
- Esta acción es **reversible** - se puede volver a firmar el reporte después
- El informe queda inmediatamente sin PDF disponible hasta volver a firmarlo
- Los datos del informe (findings, impressions, etc.) **NO se eliminan** de la base de datos, solo se marca como no reportado
- Se recomienda solicitar confirmación al usuario antes de ejecutar esta acción
- Actualiza automáticamente el estado del examen en el sistema

---

## Endpoints de Visualización de PDFs

### 14. GET /pdfs/{filename}
Ruta retirada. Los nombres de archivo antiguos ya no identifican informes dinámicos.

#### Description
Responde `410 Gone`. Use `GET /api/pdfs/by-exam/{exam_id}` para compatibilidad pública por GUID o `GET /api/reports/{exam_id}/pdf` con JWT.

#### Parameters
**Path Parameters:**
- `filename` (required): Nombre histórico del archivo (ya no válido)

#### Request
```http
GET /api/pdfs/informe-antiguo.pdf
```

**Nota:** No requiere token de autenticación.

#### Response
**Status Code:** 410 Gone

#### Errors
```json
{
  "success": false,
  "message": "PDF no encontrado"
}
```

**Status Codes:**
- `410`: Endpoint retirado
- `400`: Bad Request - Archivo no válido (no es PDF)
- `404`: Not Found - PDF no encontrado
- `500`: Internal Server Error

#### Uso desde Frontend
```javascript
// Obtener un PDF dinámico autenticado
const pdfUrl = `${API_BASE_URL}/api/reports/${examId}/pdf`;

// Abrir en nueva pestaña
window.open(pdfUrl, '_blank');
```

#### Seguridad
- Los PDFs sólo se generan para informes firmados y con reporte persistido.
- La ruta por nombre de archivo antiguo responde `410 Gone`.
- Las respuestas incluyen `Cache-Control: no-store`.
