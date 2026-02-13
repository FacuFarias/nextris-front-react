# API de Obras Sociales y Dominios de Pacientes - Documentación

## Descripción General

API REST para la gestión de obras sociales, sus relaciones con ubicaciones, y dominios de pacientes en el sistema NextRIS.

**Autenticación:** Todos los endpoints requieren un token JWT válido en el header:
```
Authorization: Bearer <access_token>
```

---

## Tabla de Contenidos

1. [CRUD de Obras Sociales](#crud-de-obras-sociales)
   - [Listar obras sociales](#1-listar-obras-sociales)
   - [Crear obra social](#2-crear-obra-social)
   - [Actualizar obra social](#3-actualizar-obra-social)
   - [Eliminar obra social](#4-eliminar-obra-social)
2. [Relación Obras Sociales - Ubicaciones](#relación-obras-sociales---ubicaciones)
   - [Listar ubicaciones de una obra social](#5-listar-ubicaciones-de-una-obra-social)
   - [Agregar ubicación a una obra social](#6-agregar-ubicación-a-una-obra-social)
   - [Eliminar ubicación de una obra social](#7-eliminar-ubicación-de-una-obra-social)
3. [Consulta de obras sociales por ubicación](#consulta-de-obras-sociales-por-ubicación)
   - [Obtener obras sociales (todas o por ubicación)](#8-obtener-obras-sociales-todas-o-filtradas-por-ubicación)
4. [CRUD de Dominios de Pacientes](#crud-de-dominios-de-pacientes)
   - [Listar dominios](#9-listar-dominios-de-pacientes)
   - [Crear dominio](#10-crear-dominio-de-pacientes)
   - [Actualizar dominio](#11-actualizar-dominio-de-pacientes)
   - [Eliminar dominio](#12-eliminar-dominio-de-pacientes)
5. [Modelos de Datos](#modelos-de-datos)
6. [Códigos de Respuesta](#códigos-de-respuesta)

---

## CRUD de Obras Sociales

### 1. Listar obras sociales

Obtiene todas las obras sociales del sistema.

**Endpoint:** `GET /api/config/insurances`

**Ejemplo de Petición:**
```bash
GET /api/config/insurances
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "guid": "058bf097-4749-4adc-be6f-9e40d52b2ae7",
      "description": "OSDE",
      "isactive": 1,
      "externalcode": null,
      "headerdescription": null
    },
    {
      "guid": "356fc022-82b4-4650-a115-76f19002538f",
      "description": "Galeno",
      "isactive": 1,
      "externalcode": null,
      "headerdescription": null
    }
  ]
}
```

---

### 2. Crear obra social

Crea una nueva obra social en el sistema.

**Endpoint:** `POST /api/config/insurances`

**Body JSON:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `description` | string | Sí | Nombre de la obra social |
| `externalcode` | string | No | Código externo |
| `headerdescription` | string | No | Descripción para encabezados |

**Ejemplo de Petición:**
```bash
POST /api/config/insurances
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "description": "Medifé",
  "externalcode": "MDF"
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Obra social creada exitosamente",
  "data": {
    "guid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 3. Actualizar obra social

Actualiza los datos de una obra social existente. Soporta actualización parcial (solo enviar los campos que se desean modificar).

**Endpoint:** `PUT /api/config/insurances/<insurance_id>`
**Alternativo:** `PATCH /api/config/insurances/<insurance_id>`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `insurance_id` | string (UUID) | GUID de la obra social |

**Body JSON (todos opcionales):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `description` | string | Nombre de la obra social |
| `isactive` | int (0\|1) | Estado activo/inactivo |
| `externalcode` | string | Código externo |
| `headerdescription` | string | Descripción para encabezados |

**Ejemplo de Petición:**
```bash
PUT /api/config/insurances/058bf097-4749-4adc-be6f-9e40d52b2ae7
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "description": "OSDE 210",
  "isactive": 1
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Obra social actualizada exitosamente"
}
```

**Respuesta Error - No encontrada (404):**
```json
{
  "success": false,
  "message": "Obra social no encontrada"
}
```

---

### 4. Eliminar obra social

Elimina una obra social y todas sus relaciones con ubicaciones.

**Endpoint:** `DELETE /api/config/insurances/<insurance_id>`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `insurance_id` | string (UUID) | GUID de la obra social |

**Ejemplo de Petición:**
```bash
DELETE /api/config/insurances/058bf097-4749-4adc-be6f-9e40d52b2ae7
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Obra social eliminada exitosamente"
}
```

> **Nota:** Al eliminar una obra social, se eliminan automáticamente todas sus relaciones en la tabla `rel_insurance_location`.

---

## Relación Obras Sociales - Ubicaciones

### 5. Listar ubicaciones de una obra social

Obtiene todas las ubicaciones (locations) asociadas a una obra social específica.

**Endpoint:** `GET /api/config/insurances/<insurance_id>/locations`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `insurance_id` | string (UUID) | GUID de la obra social |

**Ejemplo de Petición:**
```bash
GET /api/config/insurances/058bf097-4749-4adc-be6f-9e40d52b2ae7/locations
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "guid": "rel-uuid-001",
      "location_id": "7629ed0a-9f3c-47fa-9c27-3fb2aa41dc61",
      "location_name": "Consultorios Externos",
      "is_default": false
    },
    {
      "guid": "rel-uuid-002",
      "location_id": "1a5caedd-5a62-4ae1-ac2f-8f19c0bdae91",
      "location_name": "Diagnóstico por Imágenes",
      "is_default": true
    }
  ]
}
```

---

### 6. Agregar ubicación a una obra social

Crea una nueva relación entre una obra social y una ubicación.

**Endpoint:** `POST /api/config/insurances/<insurance_id>/locations`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `insurance_id` | string (UUID) | GUID de la obra social |

**Body JSON:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `location_id` | string (UUID) | Sí | GUID de la ubicación a asociar |
| `is_default` | boolean | No | Si es la ubicación por defecto (default: false) |

**Ejemplo de Petición:**
```bash
POST /api/config/insurances/058bf097-4749-4adc-be6f-9e40d52b2ae7/locations
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "location_id": "72c76916-5952-4c25-a18c-f958c2a19893",
  "is_default": false
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Ubicación asociada exitosamente",
  "data": {
    "guid": "new-relation-uuid"
  }
}
```

**Respuesta Error - Relación duplicada (409):**
```json
{
  "success": false,
  "message": "La relación ya existe"
}
```

**Respuesta Error - Obra social no encontrada (404):**
```json
{
  "success": false,
  "message": "Obra social no encontrada"
}
```

---

### 7. Eliminar ubicación de una obra social

Elimina la relación entre una obra social y una ubicación.

**Endpoint:** `DELETE /api/config/insurances/<insurance_id>/locations/<relation_id>`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `insurance_id` | string (UUID) | GUID de la obra social |
| `relation_id` | string (UUID) | GUID de la relación (`rel_insurance_location.guid`) |

**Ejemplo de Petición:**
```bash
DELETE /api/config/insurances/058bf097-4749-4adc-be6f-9e40d52b2ae7/locations/rel-uuid-001
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Ubicación desasociada exitosamente"
}
```

**Respuesta Error - Relación no encontrada (404):**
```json
{
  "success": false,
  "message": "Relación no encontrada"
}
```

---

## Consulta de obras sociales por ubicación

### 8. Obtener obras sociales (todas o filtradas por ubicación)

Obtiene obras sociales activas. Si se pasa un `location_id`, filtra solo las que están asociadas a esa ubicación via `rel_insurance_location`.

**Endpoints:**
- `GET /api/institutional/health-insurances` — Todas las obras sociales activas
- `GET /api/institutional/locations/<location_id>/health-insurances` — Filtradas por ubicación

**Path Parameters (opcional):**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `location_id` | string (UUID) | GUID de la ubicación para filtrar |

**Ejemplo sin filtro:**
```bash
GET /api/institutional/health-insurances
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Ejemplo con filtro por ubicación:**
```bash
GET /api/institutional/locations/7629ed0a-9f3c-47fa-9c27-3fb2aa41dc61/health-insurances
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "guid": "356fc022-82b4-4650-a115-76f19002538f",
      "description": "Galeno"
    },
    {
      "guid": "058bf097-4749-4adc-be6f-9e40d52b2ae7",
      "description": "OSDE"
    }
  ]
}
```

---

## CRUD de Dominios de Pacientes

### 9. Listar dominios de pacientes

Obtiene todos los dominios de pacientes del sistema.

**Endpoint:** `GET /api/config/patient-domains`

**Ejemplo de Petición:**
```bash
GET /api/config/patient-domains
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "guid": "09c0cbce-9f3c-4156-9cd8-fe34f672a15b",
      "description": "GENERAL",
      "note": "Identificación principal en Argentina",
      "code": "GEN"
    },
    {
      "guid": "5828f3bc-ccbc-4226-961c-9592e9f7a4c5",
      "description": "CLINICA DEL SOL",
      "note": "Identificación internacional",
      "code": "CDS"
    }
  ]
}
```

---

### 10. Crear dominio de pacientes

Crea un nuevo dominio de pacientes.

**Endpoint:** `POST /api/config/patient-domains`

**Body JSON:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `description` | string | Sí | Nombre del dominio (max 45 chars) |
| `code` | string | No | Código corto (max 8 chars) |
| `note` | string | No | Nota descriptiva |

**Ejemplo de Petición:**
```bash
POST /api/config/patient-domains
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "description": "HOSPITAL CENTRAL",
  "code": "HC",
  "note": "Dominio del hospital central"
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Dominio de pacientes creado exitosamente",
  "data": {
    "guid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 11. Actualizar dominio de pacientes

Actualiza un dominio existente. Soporta actualización parcial.

**Endpoint:** `PUT /api/config/patient-domains/<domain_id>`
**Alternativo:** `PATCH /api/config/patient-domains/<domain_id>`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `domain_id` | string (UUID) | GUID del dominio |

**Body JSON (todos opcionales):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `description` | string | Nombre del dominio |
| `code` | string | Código corto |
| `note` | string | Nota descriptiva |

**Ejemplo de Petición:**
```bash
PUT /api/config/patient-domains/09c0cbce-9f3c-4156-9cd8-fe34f672a15b
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "description": "GENERAL ACTUALIZADO",
  "note": "Dominio principal actualizado"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Dominio de pacientes actualizado exitosamente"
}
```

**Respuesta Error - No encontrado (404):**
```json
{
  "success": false,
  "message": "Dominio de pacientes no encontrado"
}
```

---

### 12. Eliminar dominio de pacientes

Elimina un dominio de pacientes. No se permite eliminar si hay pacientes asignados a este dominio. Las relaciones con usuarios (`rel_user_patientdomain`) se eliminan en cascada automáticamente.

**Endpoint:** `DELETE /api/config/patient-domains/<domain_id>`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `domain_id` | string (UUID) | GUID del dominio |

**Ejemplo de Petición:**
```bash
DELETE /api/config/patient-domains/09c0cbce-9f3c-4156-9cd8-fe34f672a15b
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Dominio de pacientes eliminado exitosamente"
}
```

**Respuesta Error - Tiene pacientes asignados (400):**
```json
{
  "success": false,
  "message": "No se puede eliminar: hay 25 pacientes asignados a este dominio"
}
```

> **Nota:** Las relaciones en `rel_user_patientdomain` se eliminan en cascada por la FK de la base de datos. Pero si existen pacientes en `datapatient.id_patientdomain`, la eliminación es rechazada.

---

## Modelos de Datos

### Tabla: `nextris.ishealthinsurances`

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `guid` | varchar(45) | NO | Primary key |
| `description` | varchar(45) | SI | Nombre de la obra social |
| `isactive` | smallint | SI | 1 = activa, 0 = inactiva |
| `isauthnummandatory` | smallint | SI | Si requiere número de autorización |
| `externalcode` | varchar(45) | SI | Código externo |
| `headerdescription` | varchar(45) | SI | Descripción para encabezados |

### Tabla: `nextris.rel_insurance_location`

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `guid` | varchar(45) | NO | uuid_generate_v4() | Primary key |
| `insurance_id` | varchar(45) | NO | — | FK a `ishealthinsurances.guid` |
| `location_id` | varchar(45) | NO | — | FK a `tblocation.guid` |
| `is_default` | boolean | SI | false | Si es la ubicación por defecto |
| `created_at` | timestamp | SI | now() | Fecha de creación |
| `updated_at` | timestamp | SI | now() | Fecha de actualización |

### Tabla: `nextris.ispatientdomain`

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `guid` | varchar(45) | NO | Primary key (default uuid_generate_v4()) |
| `description` | varchar(45) | NO | Nombre del dominio |
| `note` | text | SI | Nota descriptiva |
| `code` | varchar(8) | SI | Código corto |

### Tabla: `nextris.rel_user_patientdomain`

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `guid` | varchar(45) | NO | uuid_generate_v4() | Primary key |
| `user_id` | varchar(45) | NO | — | FK a `tbuser.guid` (ON DELETE CASCADE) |
| `patientdomain_id` | varchar(45) | NO | — | FK a `ispatientdomain.guid` (ON DELETE CASCADE) |
| `is_default` | boolean | SI | false | Si es el dominio por defecto del usuario |
| `created_at` | timestamp | SI | now() | Fecha de creación |
| `updated_at` | timestamp | SI | now() | Fecha de actualización |

### Diagramas de relación

```
ishealthinsurances (1) ──── (*) rel_insurance_location (*) ──── (1) tblocation
       guid          ←──── insurance_id    location_id ────→      guid
```

```
ispatientdomain (1) ──── (*) rel_user_patientdomain (*) ──── (1) tbuser
       guid       ←──── patientdomain_id      user_id ────→    guid

ispatientdomain (1) ──── (*) datapatient
       guid       ←──── id_patientdomain
```

---

## Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `400` | Error de validación (campos faltantes o inválidos) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (relación duplicada) |
| `500` | Error interno del servidor |
