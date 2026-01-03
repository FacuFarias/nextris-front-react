# API Documentation

Esta carpeta contiene toda la documentación de los endpoints disponibles en NextRIS.

## Documentos Disponibles

### 📋 API General
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentación general de todos los endpoints principales

### 👥 APIs Específicas

- **[API_ADMISSIONS.md](./API_ADMISSIONS.md)** - Gestión de admisiones y worklist DICOM
  - GET /admissions - Listar admisiones
  - GET /admissions/{id} - Detalles de admisión
  - GET /appointments_to_admit - Citas para admitir
  - POST /admissions/appointment/{id}/admit - Admisionar cita
  - POST /admission/create-order - Crear orden de admisión
  - DELETE /admissions/{id} - Cancelar admisión

- **[API_APPOINTMENTS_DOCUMENTATION.md](./API_APPOINTMENTS_DOCUMENTATION.md)** - Gestión de citas y calendarios
  - GET /appointments - Listar citas
  - POST /appointments - Crear cita
  - PUT /appointments/{id} - Actualizar cita
  - DELETE /appointments/{id} - Cancelar cita

- **[API_PATIENTS_DOCUMENTATION.md](./API_PATIENTS_DOCUMENTATION.md)** - Gestión de pacientes
  - GET /patients - Listar pacientes
  - POST /patients - Crear paciente
  - PUT /patients/{id} - Actualizar paciente
  - GET /patients/{id} - Detalles de paciente

- **[API_EXECUTION.md](./API_EXECUTION.md)** - Ejecución de órdenes y estudios
  - GET /executions - Listar ejecuciones
  - POST /executions - Crear ejecución
  - PUT /executions/{id} - Actualizar ejecución

- **[API_VISOR_DICOM.md](./API_VISOR_DICOM.md)** - Visor DICOM y gestión de imágenes
  - GET /dicom/studies - Listar estudios DICOM
  - GET /dicom/studies/{id} - Detalles de estudio DICOM
  - GET /dicom/images - Obtener imágenes DICOM

## Autenticación

Todos los endpoints requieren autenticación mediante JWT token. Incluir en el header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Base URL

```
http://localhost:5001/api
```

## Estructura de Respuesta

### Respuesta Exitosa
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación realizada exitosamente"
}
```

### Respuesta con Error
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## Versionamiento

Consulta el archivo de cada API para ver su versión y historial de cambios.

---

**Última actualización:** 2025-12-31
**NextRIS Version:** 1.0.0
