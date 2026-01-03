# NextRIS Documentation

Documentación completa del proyecto NextRIS.

## 📁 Estructura

### `/apis`
Documentación de todos los endpoints disponibles en la API REST.

Includes:
- API General
- API de Admisiones
- API de Citas
- API de Pacientes
- API de Ejecuciones
- API de Visor DICOM

## 🚀 Quick Links

- [API Documentation](./apis/README.md) - Guía completa de todos los endpoints
- [API Admissions](./apis/API_ADMISSIONS.md) - Gestión de admisiones
- [API Appointments](./apis/API_APPOINTMENTS_DOCUMENTATION.md) - Gestión de citas
- [API Patients](./apis/API_PATIENTS_DOCUMENTATION.md) - Gestión de pacientes

## 📖 Cómo Usar

1. Consulta la documentación de la API que necesites
2. Verifica los parámetros requeridos y opcionales
3. Usa los ejemplos de curl o Python para probar
4. Revisa los códigos de estado HTTP esperados

## 🔐 Autenticación

Todos los endpoints requieren un token JWT. Obtén el token con:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

Luego usa el token en futuras solicitudes:

```bash
GET /api/admissions
Authorization: Bearer <TOKEN>
```

## 📝 Version

- **NextRIS Version:** 1.0.0
- **Last Updated:** 2025-12-31

---

Para reportar issues o solicitar features, contactar al equipo de desarrollo.
