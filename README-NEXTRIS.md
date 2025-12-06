# NextRIS Frontend - React

## 🎉 Aplicación React Funcionando

La aplicación frontend está corriendo en:
- **Local:** http://localhost:5173/
- **Red:** http://148.230.72.8:5173/

## 🚀 Estado Actual

✅ **Completado:**
- Proyecto React con Vite
- Tailwind CSS configurado
- React Router configurado
- Autenticación con JWT
- Context API para manejo de estado
- Servicios de API con Axios
- Interceptores para refresh token
- Página de Login funcional
- Dashboard principal
- Rutas protegidas (PrivateRoute)

## 📁 Estructura del Proyecto

```
src/
├── services/
│   └── api.js              # Cliente Axios + servicios API
├── contexts/
│   └── AuthContext.jsx     # Context de autenticación
├── components/
│   └── PrivateRoute.jsx    # Componente para rutas protegidas
├── pages/
│   ├── Login.jsx           # Página de login
│   └── Dashboard.jsx       # Dashboard principal
├── App.jsx                 # Componente principal con routing
└── index.css               # Estilos con Tailwind
```

## 🔧 Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🔐 Autenticación

### Login
- **Endpoint:** `POST /api/auth/login`
- Soporta dos tipos de usuarios:
  - **Staff:** Personal médico y administrativo
  - **Patient:** Pacientes

### Flujo de autenticación:
1. Usuario ingresa credenciales
2. Backend valida y retorna JWT tokens (access + refresh)
3. Tokens se almacenan en localStorage
4. Requests automáticamente incluyen token en header
5. Refresh automático cuando access token expira

## 📡 API Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/logout` - Logout

### Pacientes
- `GET /api/patients` - Lista con paginación
- `GET /api/patients/:guid` - Detalle
- `POST /api/patients` - Crear
- `PUT /api/patients/:guid` - Actualizar

### Estudios
- `GET /api/studies` - Lista con filtros
- `GET /api/studies/:guid` - Detalle
- `GET /api/studies/patient/:id` - Estudios por paciente

## 🎨 Personalización

### Colores
Los colores principales están en `tailwind.config.js`. El gradiente azul-púrpura se usa en:
- Logo y títulos
- Botones principales
- Elementos destacados

### Variables de Entorno
Editar `.env`:
```
VITE_API_URL=http://148.230.72.8:5001/api
```

## �� Próximas Funcionalidades a Implementar

### Alta Prioridad
- [ ] Página de listado de pacientes
- [ ] Página de detalle de paciente
- [ ] Página de estudios
- [ ] Visualizador DICOM básico

### Media Prioridad
- [ ] Gestión de citas
- [ ] Portal del paciente completo
- [ ] Historial de estudios
- [ ] Búsqueda avanzada

### Baja Prioridad
- [ ] Editor de informes
- [ ] Dashboard con estadísticas
- [ ] Gestión de usuarios
- [ ] Configuración avanzada

## 🐛 Debugging

### Ver logs del servidor de desarrollo:
```bash
# Ver terminal donde corre npm run dev
```

### Verificar API:
```bash
curl http://localhost:5001/api/health
```

### Common Issues:

**Error: Cannot connect to API**
- Verifica que el backend esté corriendo en puerto 5001
- Revisa CORS en el backend
- Verifica la URL en `.env`

**Error: Token expired**
- El refresh token se renueva automáticamente
- Si persiste, elimina localStorage y vuelve a hacer login

## 🔒 Seguridad

- Tokens JWT con expiración
- Refresh token automático
- LocalStorage para persistencia
- Rutas protegidas con PrivateRoute
- Interceptores de Axios para manejo de errores

## 📦 Dependencias Principales

```json
{
  "react": "^19.0.0",
  "react-router-dom": "^7.x",
  "axios": "^1.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^5.x",
  "tailwindcss": "^3.x"
}
```

## 🚀 Deploy a Producción

### Build
```bash
npm run build
```

### Servir con Nginx
Configuración en `/etc/nginx/sites-available/nextris`:
```nginx
server {
    listen 80;
    server_name nextris.example.com;

    # Frontend React
    location / {
        root /var/www/nextris-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## �� Soporte

Para más información, revisar:
- `/var/www/nextris-dev-react/MIGRACION_FASE_1_COMPLETADA.md`
- `/var/www/nextris-dev-react/SIGUIENTE_PASO_FRONTEND.md`

---

**Versión:** 1.0.0  
**Última actualización:** 4 de diciembre de 2025
