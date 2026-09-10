# Manual Upload DICOM — Cómo funciona

> **Audiencia:** cualquier desarrollador que toque esta funcionalidad por primera vez.  
> **Backend:** `apps/api/dicom_routes.py`  
> **Frontend:** `src/modules/redaccion/cargar-estudios/`

---

## 1. ¿Qué es el Manual Upload?

Es el mecanismo que permite subir archivos DICOM (imágenes médicas) directamente al sistema sin pasar por el flujo WORKLIST automático del equipo de radiología. Lo usa el operador cuando:

- El equipo no tiene conectividad con el PACS en ese momento.
- La imagen llegó como archivo suelto (CD, pendrive, etc.).
- Se realizó el estudio en otro centro y hay que adjuntarlo a una orden RIS existente.

El flujo hace **tres cosas en paralelo**:

1. Guarda el archivo `.dcm` en disco.
2. Envía el archivo al **PACS** (DCM4CHEE) vía HTTP STOW-RS.
3. Registra el evento en la base de datos y, si hay coincidencia, **vincula la imagen a la orden RIS automáticamente**.

---

## 2. Diagrama de flujo completo

```
Usuario arrastra / selecciona archivo .dcm
              │
              ▼
  ┌─────────────────────┐
  │  POST /api/manual   │  — No requiere JWT (endpoint público)
  │  /upload            │
  └────────┬────────────┘
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  1. Validación previa                    │
  │  • ¿Tiene extension .dcm/.dicom/.dic?    │
  │  • ¿location_id presente en form-data?  │
  └──────────────┬──────────────────────────┘
                 │ OK
                 ▼
  ┌─────────────────────────────────────────┐
  │  2. Guardar archivo en disco             │
  │  Ruta: /uploads_dicom/YYYYMMDD_HH…_     │
  │         nombre_original.dcm             │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │  3. Parsear DICOM con pydicom            │
  │  Extrae: PatientName, PatientID,         │
  │  StudyDate, Modality, StudyInstanceUID,  │
  │  AccessionNumber, etc.                   │
  └──────────────┬──────────────────────────┘
                 │ DICOM inválido → 400 + borra el archivo
                 ▼
  ┌─────────────────────────────────────────┐
  │  4. Enviar al PACS vía STOW-RS (HTTP)    │
  │  POST http://localhost:8080/dcm4chee-   │
  │  arc/aets/DCM4CHEE/rs/studies           │
  │  Auth: Bearer token de Keycloak          │
  │  Resultado: success ó error             │
  └──────────────┬──────────────────────────┘
                 │ (continúa siempre, PACS opcional)
                 ▼
  ┌══════════════════════════════════════════╗
  ║  5. COMMIT BASE — INSERT tbmanual_uploads ║  ← siempre se hace
  ╚══════════════════════════════════════════╝
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │  6. ¿AccessionNumber y PatientID válidos?│
  │  (no vacío, no "unknown", no "null"…)   │
  └────┬────────────────────────────────────┘
       │ NO                  │ SÍ
       ▼                     ▼
  Sin auto-link     ┌──────────────────────────────────────┐
                    │  7. Buscar orden en tbexamination     │
                    │  WHERE localacc = AccessionNumber     │
                    │  AND (patientid OR nationalcode)      │
                    │       = PatientID del DICOM           │
                    │  AND isimage = 0 (aún sin imagen)     │
                    └────────┬─────────────────────────────┘
                             │ No encontrada
                             ▼
                        Sin auto-link
                             │
                             │ Encontrada
                             ▼
              ┌──────────────────────────────┐
              │  8. UPDATE tbmanual_uploads   │
              │     islinked = 1             │
              │     linked_examination_guid  │
              │     linked_date              │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  9. UPDATE tbexamination     │
              │     isimage = 1             │
              │     studyinstanceuid         │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────────────┐
              │  10. ¿Existe tbpacs_study_link?       │
              │  ¿El estudio ya está en public.study? │
              └────────┬─────────────────────────────┘
                       │ SÍ en ambos
                       ▼
              ┌──────────────────────────────────────┐
              │  11. UPDATE tbpacs_study_link (prev.) │
              │      link_status = 'unlinked'         │
              │  INSERT tbpacs_study_link nuevo        │
              │      source = 'auto', status = linked │
              └──────────────┬───────────────────────┘
                             │
                             ▼
                     COMMIT AUTO-LINK
                             │
                             ▼
                 ┌───────────────────────┐
                 │  Respuesta JSON 200   │
                 │  auto_link.linked=true│
                 └───────────────────────┘
```

---

## 3. Tablas de base de datos involucradas

### 3.1 Mapa de relaciones

```
nextris.tbmanual_uploads
        │ linked_examination_guid ──────────────────┐
        │                                           │
        │                                  nextris.tbexamination
        │                                           │ guid
        │                                           │
nextris.tbpacs_study_link                           │
    manual_upload_guid ──── guid (tbmanual_uploads)  │
    order_guid ──────────────────────────────── guid│
    pacs_study_pk ─────┐
                       │
              public.study (DCM4CHEE)
                  pk, study_iuid

nextris.datapatient ── guid ── tbexamination.idpatient
    patientid
    nationalcode
```

---

### 3.2 `nextris.tbmanual_uploads` — El registro central del upload

Cada fila = **una instancia DICOM** (un archivo `.dcm`). Varios archivos del mismo estudio (`study_instance_uid`) se agrupan al consultarlos.

| Columna | Tipo | Descripción |
|---|---|---|
| `guid` | UUID | Identificador único del registro |
| `filename` | text | Nombre guardado en disco (`YYYYMMDD_HHMMSS_original.dcm`) |
| `filepath` | text | Ruta absoluta en el servidor |
| `file_size` | bigint | Bytes del archivo |
| `patient_name` | text | `PatientName` extraído del DICOM |
| `patient_id` | text | `PatientID` extraído del DICOM |
| `study_date` | text | `StudyDate` del DICOM (YYYYMMDD) |
| `study_time` | text | `StudyTime` del DICOM |
| `study_description` | text | `StudyDescription` del DICOM |
| `modality` | text | `Modality` (CT, MR, US…) |
| `study_instance_uid` | text | `StudyInstanceUID` — agrupa todas las instancias del mismo estudio |
| `series_instance_uid` | text | `SeriesInstanceUID` |
| `sop_instance_uid` | text | `SOPInstanceUID` — identifica este archivo único |
| `accession_number` | text | `AccessionNumber` — clave para el auto-link |
| `uploaded_by_user_guid` | UUID | GUID del usuario que subió (NULL si anónimo) |
| `uploaded_by_username` | text | `'Manual Upload'` si fue por el endpoint público |
| `pacs_status` | text | `'success'` ó `'error'` según resultado del STOW-RS |
| `pacs_message` | text | Mensaje de respuesta del PACS |
| `pacs_sent_date` | timestamp | Cuándo llegó exitosamente al PACS |
| `location_id` | int/text | Sede / ubicación que hizo la carga |
| `upload_date` | timestamp | Cuándo se insertó este registro |
| `islinked` | int | `0` = sin vincular, `1` = vinculado a una orden |
| `linked_examination_guid` | text | GUID de la orden en `tbexamination` (si vinculada) |
| `linked_date` | timestamp | Cuándo se realizó el vínculo |

---

### 3.3 `nextris.tbexamination` — La orden RIS

Es la orden de estudio creada por el médico/recepción **antes** de que llegue la imagen.

| Columna relevante | Descripción |
|---|---|
| `guid` | Identificador de la orden |
| `localacc` | AccessionNumber local (se compara con el del DICOM) |
| `idpatient` | FK a `datapatient.guid` |
| `isimage` | `0` = sin imagen, `1` = imagen vinculada |
| `studyinstanceuid` | Se actualiza con el UID del estudio DICOM al vincular |

---

### 3.4 `nextris.datapatient` — El paciente

Contiene los identificadores del paciente. El auto-link busca coincidencia en **cualquiera** de los dos campos:

| Columna | Descripción |
|---|---|
| `guid` | FK usada por `tbexamination.idpatient` |
| `patientid` | ID del paciente en el HIS / RIS |
| `nationalcode` | DNI / cédula / número nacional de identidad |

> **Importante:** la comparación es case-insensitive y elimina espacios (`UPPER(TRIM(…))`), así que `ACC010` coincide con `acc010 `.

---

### 3.5 `nextris.tbpacs_study_link` — Registro de vinculación PACS↔RIS

Tabla puente entre el estudio que vive en DCM4CHEE (`public.study`) y la orden en NextRIS (`tbexamination`).

| Columna | Descripción |
|---|---|
| `id` | PK autoincremental |
| `pacs_study_pk` | FK a `public.study.pk` |
| `pacs_study_iuid` | `StudyInstanceUID` como texto |
| `order_guid` | FK a `tbexamination.guid` |
| `order_study_uuid` | `studyinstanceuid` histórico de la orden |
| `manual_upload_guid` | FK a `tbmanual_uploads.guid` |
| `link_status` | `'linked'` ó `'unlinked'` |
| `source` | **constraint**: solo `'manual'`, `'reconcile'` ó `'auto'` |
| `linked_at` | Timestamp del vínculo |
| `linked_by_username` | Quién vinculó (`'Auto Upload'` si fue automático) |
| `unlinked_at` / `unlinked_reason` | Si se desvínculó, cuándo y por qué |

---

### 3.6 `public.study` — Estudios en DCM4CHEE (PACS)

Tabla del sistema PACS. No la maneja NextRIS directamente; solo la consulta para obtener el `pk` del estudio una vez que el DICOM fue recibido.

| Columna | Descripción |
|---|---|
| `pk` | PK del estudio en el PACS |
| `study_iuid` | `StudyInstanceUID` |
| `accession_no` | AccessionNumber |
| `updated_time` | Última actualización |

---

## 4. Lógica de auto-vinculación en detalle

El sistema intenta vincular automáticamente cada vez que se sube un archivo. La condición de match es:

```sql
-- ¿Existe una orden RIS que corresponda a esta imagen?
SELECT e.guid
FROM nextris.tbexamination e
INNER JOIN nextris.datapatient dp ON dp.guid = e.idpatient
WHERE
  -- 1. AccessionNumber coincide (case-insensitive)
  UPPER(TRIM(e.localacc)) = UPPER(TRIM(:accession_from_dicom))
  AND
  -- 2. Paciente coincide por ID o por DNI
  (
    UPPER(TRIM(dp.patientid))    = UPPER(TRIM(:patient_id_from_dicom))
    OR
    UPPER(TRIM(dp.nationalcode)) = UPPER(TRIM(:patient_id_from_dicom))
  )
  AND
  -- 3. La orden aún no tiene imagen asignada
  (e.isimage IS NULL OR e.isimage = 0)
  AND
  -- 4. Misma ubicación (opcional, si se proporcionó location_id)
  COALESCE(e.location_id::text, '') = :location_id
ORDER BY e.createdon DESC
LIMIT 1;
```

### Valores que bloquean el auto-link

Si el DICOM viene con estos valores en `AccessionNumber` o `PatientID`, el auto-link **no se intenta**:

- cadena vacía `''`
- `unknown`
- `n/a`
- `none`
- `null`

### Árbol de decisión del auto-link

```
¿AccessionNumber y PatientID válidos?
├─ NO → se guarda el upload sin vincular (islinked=0)
└─ SÍ
    ¿Existe orden con ese accession + paciente sin imagen?
    ├─ NO → se guarda el upload sin vincular (islinked=0)
    └─ SÍ
        UPDATE tbmanual_uploads → islinked=1
        UPDATE tbexamination   → isimage=1
        ¿Existe el estudio en public.study (PACS)?
        ├─ NO → vínculo solo en RIS, no en tbpacs_study_link
        └─ SÍ
            Invalida link previo (tbpacs_study_link → 'unlinked')
            INSERT tbpacs_study_link source='auto'
```

---

## 5. Separación de transacciones (por qué es importante)

El registro base y el auto-link están en **dos transacciones separadas** a propósito:

```
┌─────────────────────────────────────────────────────┐
│  TRANSACCIÓN 1 — siempre exitosa                    │
│  INSERT nextris.tbmanual_uploads                    │
│  COMMIT  ◄──── el archivo SIEMPRE queda registrado  │
└─────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│  TRANSACCIÓN 2 — aislada, puede fallar              │
│  UPDATE tbmanual_uploads (islinked)                 │
│  UPDATE tbexamination (isimage)                     │
│  INSERT tbpacs_study_link                           │
│  COMMIT  ó  ROLLBACK (solo esta transacción)        │
└─────────────────────────────────────────────────────┘
```

**Si el auto-link falla** (por ejemplo, un constraint violado), solo hace rollback de la transaction 2. El upload ya está commiteado y aparece en la lista con badge **"Cargado sin vincular"** en lugar de desaparecer por completo.

---

## 6. Endpoint `POST /api/manual/upload`

**No requiere autenticación JWT** (endpoint público para cargas desde equipos).

### Request

```
POST /api/manual/upload
Content-Type: multipart/form-data

file        = <archivo .dcm>
location_id = <ID de la ubicación>   (obligatorio)
```

### Response exitosa

```json
{
  "success": true,
  "message": "Archivo DICOM procesado exitosamente",
  "data": {
    "guid": "a12f50db-0812-463a-8de5-d530d891f692",
    "filename": "20260326_051217_imagen.dcm",
    "original_filename": "imagen.dcm",
    "size": 452608,
    "size_mb": 0.43,
    "upload_time": "2026-03-26T05:12:17.000Z",
    "dicom_info": {
      "patient_name": "HERNANDEZ TORRES^PEDRO",
      "patient_id": "67890123F",
      "accession_number": "ACC010",
      "study_instance_uid": "1.2.840...",
      "modality": "US"
    },
    "pacs_status": "success",
    "pacs_message": "Enviado al PACS exitosamente",
    "uploaded_by": "Manual Upload",
    "auto_link": {
      "matched": true,
      "linked": true,
      "examination_guid": "b3c2d1e0-...",
      "reason": null
    }
  }
}
```

### Posibles valores de `auto_link`

| `matched` | `linked` | `reason` | Significado |
|---|---|---|---|
| `false` | `false` | `"DICOM sin accession…"` | El DICOM no tiene AccessionNumber o PatientID útiles |
| `false` | `false` | `"No se encontró una orden…"` | No existe orden con ese accession + paciente |
| `true` | `true` | `null` | Vinculación automática exitosa |
| `true` | `false` | _(error de BD log)_ | El auto-link falló en BD (rollback aislado) |

---

## 7. Endpoint `GET /api/manual/unlinked-studies`

Lista los estudios subidos. **No requiere JWT.**

### Query params

| Parámetro | Default | Descripción |
|---|---|---|
| `location_id` | `''` | Filtrar por sede. `all` para todas |
| `include_linked` | `0` | `1` = incluir también los ya vinculados |
| `include_pacs` | `1` | `0` = excluir estudios que vienen solo del PACS |

### Fuentes de datos que combina

```
include_linked=1, include_pacs=0   → solo tbmanual_uploads (vinculados + sin vincular)
include_linked=0, include_pacs=1   → sin vincular + PACS sin orden   (tab Vincular Imagen)
include_linked=1, include_pacs=1   → todo junto
```

### Campos relevantes en la respuesta

```json
{
  "guid": "a12f50db-...",
  "patient_name": "HERNANDEZ TORRES^PEDRO",
  "accession_number": "ACC010",
  "modality": "US",
  "instance_count": 4,
  "pacs_status": "success",
  "islinked": true,
  "linked_date": "2026-03-26T05:12:17",
  "linked_examination_guid": "b3c2d1e0-...",
  "linked_order_accession": "ACC010",
  "source": "manual"
}
```

---

## 8. ¿Qué ve el usuario en pantalla?

```
Archivos DICOM Subidos
────────────────────────────────────────────────────
Pedro Hernández Torres – 67890123F – US TESTICULAR
  0.43 MB  │  26/3/2026  │  US  │  [Cargado y vinculado]   ← badge verde
  Vinculado a orden: ACC010                               ← texto informativo

Racca^Thadius^^^ – OSD268138 – US TESTICULAR
  1.85 MB  │  26/3/2026  │  OT,SR,US  │  [Cargado sin vincular]  ← badge ámbar
────────────────────────────────────────────────────
```

El badge lo determina el campo `islinked` que devuelve el endpoint.

---

## 9. Envío al PACS — STOW-RS

El archivo se envía usando el protocolo **DICOM STOW-RS** (DICOM over HTTP):

```
POST http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs/studies
Authorization: Bearer <token de Keycloak>
Content-Type: multipart/related; type="application/dicom"; boundary=DICOMboundary

--DICOMboundary
Content-Type: application/dicom

<bytes del archivo .dcm>
--DICOMboundary--
```

- Si DCM4CHEE responde `200` ó `409` (ya existía), se considera **éxito**.
- Si falla, se guarda `pacs_status = 'error'` en `tbmanual_uploads`, pero el flujo continúa (el archivo queda en disco y en BD).

---

## 10. Archivos del proyecto

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Backend | `apps/api/dicom_routes.py` | Todos los endpoints DICOM (upload, list, link, unlink) |
| Frontend | `src/modules/redaccion/cargar-estudios/CargarEstudios.tsx` | Pantalla principal, dropzone, lista de subidos |
| Frontend | `hooks/use-cargar-estudios.ts` | React Query hooks |
| Frontend | `services/cargar-estudios.service.ts` | Llamadas HTTP al API |
| Frontend | `types/cargar-estudios.types.ts` | Tipos TypeScript |
| Frontend | `constants/query-keys.ts` | Claves de caché React Query |
| Disco | `/uploads_dicom/` | Archivos .dcm guardados en el servidor |
| Disco | _(sin almacenamiento de PDFs)_ | Los informes se generan bajo demanda |

---

## 11. Errores comunes y cómo diagnosticarlos

| Síntoma | Causa probable | Cómo verificar |
|---|---|---|
| El estudio llega al PACS pero **no aparece en la lista** | Falla el INSERT en `tbmanual_uploads` (rollback) | `journalctl -u nextris-dev-react -f \| grep ERROR` |
| El estudio aparece pero **badge "sin vincular"** aunque hay orden | AccessionNumber o PatientID del DICOM no coinciden exactamente | Comparar `tbmanual_uploads.accession_number` con `tbexamination.localacc` |
| El auto-link falla con **check constraint** | `source` inválido en `tbpacs_study_link` | Solo son válidos: `'manual'`, `'reconcile'`, `'auto'` |
| **500** en `/api/manual/unlinked-studies` | GROUP BY ambiguo o type mismatch en JOIN | Ver logs; cast explícito: `e.guid::text = mu.linked_examination_guid::text` |
| El PACS **rechaza** el archivo | Token Keycloak expirado o DCM4CHEE no disponible | `pacs_status: 'error'` en la respuesta JSON |

---

*Documento generado: 2026-03-26 — NextRIS backend v2*
