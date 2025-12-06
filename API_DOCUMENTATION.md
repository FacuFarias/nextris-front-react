# API Documentation - NextRIS Backend

Documentación completa de los endpoints REST API disponibles para el frontend React.

**Base URL:** `http://148.230.72.8:5001/api`

---

## 🧪 Usuarios de Prueba

Para realizar testing, puedes utilizar las siguientes credenciales:

### Usuario Administrador (Acceso completo)
- **Username:** `sysadmin`
- **Password:** `1234`
- **Tipo:** `staff`
- **Permisos:** Acceso a todos los dominios de pacientes

### Usuario Médico (Acceso limitado)
- **Username:** `DrParedes`
- **Password:** `123456`
- **Tipo:** `staff`
- **Permisos:** Acceso solo a un dominio de pacientes específico

---

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Pacientes](#pacientes)
3. [Estudios](#estudios)
4. [Formato de Respuestas](#formato-de-respuestas)
5. [Manejo de Errores](#manejo-de-errores)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🔐 Autenticación

Todos los endpoints (excepto `/auth/login`) requieren autenticación JWT.

### Headers Requeridos

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Tokens

- **Access Token:** Válido por 1 hora (usar para todas las peticiones)
- **Refresh Token:** Válido por 30 días (usar para obtener nuevo access token)

---

## 📡 Endpoints

### Health Check

#### `GET /health`

Verificar que la API está funcionando.

**Sin autenticación requerida**

**Respuesta:**
```json
{
  "success": true,
  "message": "NextRIS API is running",
  "version": "1.0.0"
}
```

---

## 🔑 Autenticación

### Login

#### `POST /auth/login`

Autenticar usuario y obtener tokens JWT.

**Body:**
```json
{
  "username": "usuario",
  "password": "contraseña",
  "user_type": "staff" // o "patient"
}
```

**Campos:**
- `username` (string, requerido): Nombre de usuario
- `password` (string, requerido): Contraseña
- `user_type` (string, opcional): `"staff"` o `"patient"` (default: `"staff"`)

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "uuid-guid",
      "username": "usuario",
      "name": "Nombre",
      "surname": "Apellido",
      "email": "email@example.com",
      "user_type": "staff",
      "role_id": 1,
      "requires_password_change": false
    }
  },
  "message": "Login exitoso"
}
```

**Errores:**
- `400`: Datos faltantes o inválidos
- `401`: Credenciales inválidas o usuario inactivo
- `500`: Error del servidor

---

### Obtener Usuario Actual

#### `GET /auth/me`

Obtener información del usuario autenticado.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-guid",
    "username": "usuario",
    "name": "Nombre",
    "surname": "Apellido",
    "email": "email@example.com",
    "user_type": "staff",
    "role_id": 1
  }
}
```

**Errores:**
- `401`: Token inválido o expirado
- `404`: Usuario no encontrado

---

### Refrescar Token

#### `POST /auth/refresh`

Obtener un nuevo access token usando el refresh token.

**Headers:**
```http
Authorization: Bearer <refresh_token>
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Errores:**
- `401`: Refresh token inválido o expirado

---

### Logout

#### `POST /auth/logout`

Cerrar sesión (el frontend debe eliminar los tokens).

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

**Nota:** En JWT stateless, el logout se maneja en el cliente eliminando los tokens del localStorage.

---

## 👥 Pacientes

**⚠️ Importante:** Todos los endpoints de pacientes implementan filtrado automático por dominios de pacientes (`id_patientdomain`) basado en los permisos del usuario autenticado. Los usuarios solo pueden ver y acceder a pacientes que pertenecen a los dominios asignados en la tabla `rel_user_patientdomain`.

### Listar Pacientes

#### `GET /patients`

Obtener lista de pacientes con paginación y búsqueda. Solo retorna pacientes de los dominios a los que el usuario tiene acceso.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (int, opcional): Número de página (default: 1)
- `per_page` (int, opcional): Resultados por página (default: 20, max: 100)
- `search` (string, opcional): Término de búsqueda (busca en nombre, apellido, DNI)

**Ejemplo:**
```
GET /patients?page=1&per_page=20&search=juan
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "guid": "uuid-guid",
        "name": "Juan",
        "surname": "Pérez",
        "email": "juan@example.com",
        "phone": "+1234567890",
        "nationalcode": "12345678",
        "patientid": "12345678",
        "birthdate": "1990-05-15",
        "gender": "M",
        "id_patientdomain": "domain-uuid-guid"
      }
    ],
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

---

### Obtener Paciente

#### `GET /patients/{guid}`

Obtener detalles completos de un paciente específico.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `guid` (string): GUID del paciente

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "guid": "uuid-guid",
    "name": "Juan",
    "surname": "Pérez",
    "email": "juan@example.com",
    "phone": "+1234567890",
    "nationalcode": "12345678",
    "patientid": "12345678",
    "birthdate": "1990-05-15",
    "gender": "M",
    "healthcard": "CARD123",
    "id_patientdomain": "domain-uuid-guid",
    "ismerged": 0,
    "isanonymous": 0
  }
}
```

**Errores:**
- `404`: Paciente no encontrado

---

### Crear Paciente

#### `POST /patients`

Crear un nuevo paciente.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Juan",
  "surname": "Pérez",
  "nationalcode": "12345678",
  "patientid": "12345678",
  "email": "juan@example.com",
  "phone": "+1234567890",
  "birthdate": "1990-05-15",
  "gender": "M",
  "address": "Calle 123",
  "city": "Ciudad",
  "state": "Estado",
  "country": "País",
  "postalcode": "12345"
}
```

**Campos Requeridos:**
- `name` (string): Nombre
- `surname` (string): Apellido
- `nationalcode` (string): DNI/Documento nacional
- `patientid` (string): ID del paciente

**Campos Opcionales:**
- `email` (string): Email
- `phone` (string): Teléfono
- `birthdate` (string): Fecha de nacimiento (formato: YYYY-MM-DD)
- `gender` (string): Género (`M`, `F`, `O`)
- `healthcard` (string): Número de tarjeta de salud
- `id_patientdomain` (string): GUID del dominio del paciente

**Respuesta (201):**
```json
{
  "success": true,
  "data": {
    "guid": "nuevo-uuid-guid"
  },
  "message": "Paciente creado exitosamente"
}
```

**Errores:**
- `400`: Campos requeridos faltantes
- `500`: Error al crear paciente

---

### Actualizar Paciente

#### `PUT /patients/{guid}`

Actualizar un paciente existente.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `guid` (string): GUID del paciente

**Body:**
```json
{
  "email": "nuevo@email.com",
  "phone": "+9876543210",
  "address": "Nueva Dirección"
}
```

**Campos Actualizables:**
- Todos los campos del modelo (excepto `guid`)

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Paciente actualizado exitosamente"
}
```

**Errores:**
- `400`: Sin campos para actualizar
- `404`: Paciente no encontrado

---

## 📊 Estudios

### Listar Estudios

#### `GET /studies`

Obtener lista de estudios médicos con filtros.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (int, opcional): Número de página (default: 1)
- `per_page` (int, opcional): Resultados por página (default: 20, max: 100)
- `patient_id` (string, opcional): Filtrar por GUID del paciente
- `modality` (string, opcional): Filtrar por modalidad (ej: `CT`, `MR`, `CR`, `DX`)
- `date_from` (string, opcional): Fecha inicio (formato: YYYY-MM-DD)
- `date_to` (string, opcional): Fecha fin (formato: YYYY-MM-DD)

**Ejemplo:**
```
GET /studies?patient_id=uuid-guid&modality=CT&date_from=2025-01-01&page=1&per_page=20
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "studies": [
      {
        "guid": "uuid-guid",
        "study_instance_uid": "1.2.840.113619...",
        "study_description": "TC de Tórax",
        "modality": "CT",
        "study_date": "2025-01-15",
        "study_time": "14:30:00",
        "accession_number": "ACC12345",
        "patient_id": "patient-uuid",
        "patient_name": "Juan Pérez",
        "number_of_series": 3,
        "number_of_instances": 150
      }
    ],
    "page": 1,
    "per_page": 20,
    "total": 50
  }
}
```

---

### Obtener Estudio

#### `GET /studies/{guid}`

Obtener detalles completos de un estudio específico, incluyendo sus series.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `guid` (string): GUID del estudio

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "study": {
      "guid": "uuid-guid",
      "study_instance_uid": "1.2.840.113619...",
      "study_description": "TC de Tórax",
      "modality": "CT",
      "study_date": "2025-01-15",
      "study_time": "14:30:00",
      "accession_number": "ACC12345",
      "patient_id": "patient-uuid",
      "patient_name": "Juan Pérez",
      "patient_nationalcode": "12345678",
      "number_of_series": 3,
      "number_of_instances": 150
    },
    "series": [
      {
        "guid": "series-uuid",
        "series_instance_uid": "1.2.840.113619...",
        "series_description": "Axial",
        "modality": "CT",
        "series_number": 1,
        "number_of_instances": 50
      }
    ]
  }
}
```

**Errores:**
- `404`: Estudio no encontrado

---

### Obtener Estudios de un Paciente

#### `GET /studies/patient/{patient_id}`

Obtener todos los estudios de un paciente específico.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `patient_id` (string): GUID del paciente

**Nota:** Si el usuario autenticado es un paciente, solo puede consultar sus propios estudios.

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "studies": [
      {
        "guid": "uuid-guid",
        "study_instance_uid": "1.2.840.113619...",
        "study_description": "TC de Tórax",
        "modality": "CT",
        "study_date": "2025-01-15",
        "study_time": "14:30:00",
        "accession_number": "ACC12345",
        "number_of_series": 3,
        "number_of_instances": 150
      }
    ]
  }
}
```

**Errores:**
- `403`: No autorizado (paciente intentando ver estudios de otro paciente)

---

## 📝 Formato de Respuestas

Todas las respuestas de la API siguen el siguiente formato:

### Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    // Datos específicos del endpoint
  },
  "message": "Mensaje opcional"
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

---

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP

- `200` - OK: Solicitud exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Datos inválidos o faltantes
- `401` - Unauthorized: Token inválido, expirado o faltante
- `403` - Forbidden: No tiene permisos para esta acción
- `404` - Not Found: Recurso no encontrado
- `500` - Internal Server Error: Error del servidor

### Errores Comunes

#### Token Expirado (401)

```json
{
  "msg": "Token has expired"
}
```

**Solución:** Usar el refresh token para obtener un nuevo access token.

#### Token Inválido (401)

```json
{
  "msg": "Invalid token"
}
```

**Solución:** Redirigir al usuario al login.

#### Datos Faltantes (400)

```json
{
  "success": false,
  "message": "El campo name es requerido"
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Flujo Completo de Autenticación

```javascript
// 1. Login
const loginResponse = await fetch('http://148.230.72.8:5001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'usuario',
    password: 'password123',
    user_type: 'staff'
  })
});

const loginData = await loginResponse.json();

if (loginData.success) {
  // Guardar tokens
  localStorage.setItem('access_token', loginData.data.access_token);
  localStorage.setItem('refresh_token', loginData.data.refresh_token);
  localStorage.setItem('user', JSON.stringify(loginData.data.user));
}

// 2. Hacer petición autenticada
const token = localStorage.getItem('access_token');

const patientsResponse = await fetch('http://148.230.72.8:5001/api/patients?page=1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const patientsData = await patientsResponse.json();

// 3. Manejar token expirado
if (patientsResponse.status === 401) {
  // Intentar refrescar token
  const refreshToken = localStorage.getItem('refresh_token');
  
  const refreshResponse = await fetch('http://148.230.72.8:5001/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (refreshResponse.ok) {
    const refreshData = await refreshResponse.json();
    localStorage.setItem('access_token', refreshData.data.access_token);
    // Reintentar petición original
  } else {
    // Redirigir a login
    window.location.href = '/login';
  }
}
```

---

### Ejemplo 2: Configuración de Axios con Interceptors

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://148.230.72.8:5001/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró y no hemos reintentado
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          'http://148.230.72.8:5001/api/auth/refresh',
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          }
        );

        const { access_token } = response.data.data;
        localStorage.setItem('access_token', access_token);

        // Reintentar petición original con nuevo token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token también expiró, redirigir a login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

### Ejemplo 3: Buscar y Crear Paciente

```javascript
import api from './services/api';

// Buscar pacientes
async function searchPatients(searchTerm) {
  try {
    const response = await api.get('/patients', {
      params: {
        search: searchTerm,
        page: 1,
        per_page: 20
      }
    });
    
    if (response.data.success) {
      return response.data.data.patients;
    }
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    throw error;
  }
}

// Crear nuevo paciente
async function createPatient(patientData) {
  try {
    const response = await api.post('/patients', {
      name: patientData.name,
      surname: patientData.surname,
      nationalcode: patientData.nationalcode,
      patientid: patientData.patientid,
      email: patientData.email,
      phone: patientData.phone,
      birthdate: patientData.birthdate,
      gender: patientData.gender
    });
    
    if (response.data.success) {
      return response.data.data.guid;
    }
  } catch (error) {
    console.error('Error creando paciente:', error);
    throw error;
  }
}
```

---

### Ejemplo 4: Obtener Estudios con Filtros

```javascript
import api from './services/api';

async function getStudies(filters = {}) {
  try {
    const params = {
      page: filters.page || 1,
      per_page: filters.perPage || 20
    };
    
    if (filters.patientId) params.patient_id = filters.patientId;
    if (filters.modality) params.modality = filters.modality;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;
    
    const response = await api.get('/studies', { params });
    
    if (response.data.success) {
      return {
        studies: response.data.data.studies,
        total: response.data.data.total,
        page: response.data.data.page
      };
    }
  } catch (error) {
    console.error('Error obteniendo estudios:', error);
    throw error;
  }
}

// Uso:
const studies = await getStudies({
  patientId: 'uuid-paciente',
  modality: 'CT',
  dateFrom: '2025-01-01',
  dateTo: '2025-12-31',
  page: 1,
  perPage: 20
});
```

---

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca almacenar tokens en cookies sin httpOnly**
2. **Usar HTTPS en producción**
3. **Implementar refresh token rotation** (recomendado)
4. **Validar y sanitizar inputs** antes de enviar
5. **Manejar errores de forma segura** (no exponer detalles internos)

### CORS

El backend ya tiene CORS configurado para aceptar peticiones desde:
- `http://localhost:5173` (desarrollo local)
- `http://148.230.72.8:5173` (servidor de desarrollo)

---

## 📚 Recursos Adicionales

### Modalidades DICOM Comunes

- `CT` - Tomografía Computarizada
- `MR` - Resonancia Magnética
- `CR` - Radiografía Computarizada
- `DX` - Radiografía Digital
- `US` - Ultrasonido
- `XA` - Angiografía por Rayos X
- `MG` - Mamografía

### Tipos de Usuario

- `staff` - Personal médico/administrativo (acceso completo)
- `patient` - Paciente (acceso limitado a sus propios datos)

---

## 🆘 Soporte

**Errores o problemas con la API:**
1. Verificar logs del backend: `journalctl -u nextris-dev-react -f`
2. Probar endpoint con curl o Postman
3. Revisar formato de datos enviados

**Servidor Backend:**
- URL: `http://148.230.72.8:5001`
- Health Check: `http://148.230.72.8:5001/api/health`

**Logs del servidor:**
```bash
ssh nextris@148.230.72.8
journalctl -u nextris-dev-react -f
```

---

**Última actualización:** 2025-12-04  
**Versión API:** 1.0.0
