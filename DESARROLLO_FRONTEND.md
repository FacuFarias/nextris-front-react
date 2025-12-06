# Guía de Desarrollo Frontend - Nextris

## 🎯 Configuración del Entorno de Desarrollo

### Opción 1: Desarrollo Local (Recomendado)

Puedes trabajar desde su computadora local sin necesidad de acceder al servidor.

#### Requisitos
- Node.js 18+ 
- npm o yarn
- Git
- Editor de código (VS Code recomendado)

#### Pasos de Configuración

**1. Clonar el repositorio**
```bash
git clone https://github.com/FacuFarias/nextris-front-react nextris-frontend
cd nextris-frontend
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar variables de entorno**
```bash
# Crear archivo .env
cp .env.example .env  # o crear manualmente
```

Contenido del `.env` para desarrollo local:
```env
VITE_API_URL=http://148.230.72.8:5001/api
VITE_API_BASE_URL=http://148.230.72.8:5001
```

**4. Iniciar servidor de desarrollo**
```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

**5. Desarrollo con Hot Reload**
- Cualquier cambio en los archivos se reflejará automáticamente
- No necesita reiniciar el servidor manualmente
- El navegador se recargará automáticamente

---

---

## 📁 Estructura del Proyecto

```
nextris-frontend/
├── src/
│   ├── assets/          # Imágenes, iconos, estilos globales
│   ├── components/      # Componentes reutilizables
│   │   ├── common/      # Componentes comunes (Button, Input, etc)
│   │   ├── layout/      # Layout components (Header, Sidebar, etc)
│   │   └── ...
│   ├── contexts/        # React Contexts (AuthContext, etc)
│   ├── hooks/           # Custom React Hooks
│   ├── pages/           # Páginas/Vistas principales
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Licitaciones/
│   │   └── ...
│   ├── services/        # Servicios API (axios, fetch)
│   │   └── api.js       # Configuración de API
│   ├── utils/           # Funciones utilitarias
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Entry point
│   └── index.css        # Estilos globales
├── public/              # Archivos estáticos
├── .env                 # Variables de entorno
├── vite.config.js       # Configuración de Vite
├── package.json         # Dependencias
└── index.html           # HTML base
```

---

## 🔧 Comandos Útiles

### Desarrollo
```bash
npm run dev              # Iniciar servidor de desarrollo
npm run dev -- --port 3000  # Cambiar puerto
npm run build            # Compilar para producción
npm run preview          # Previsualizar build de producción
```

### Calidad de Código
```bash
npm run lint             # Verificar errores de linting
npm run lint:fix         # Corregir errores automáticamente
npm run format           # Formatear código con Prettier
```

### Testing (si está configurado)
```bash
npm run test             # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Cobertura de tests
```

---

## 🌐 Conexión con el Backend

### Configuración de API

**Archivo:** `src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true  // Para cookies/sesiones
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Ejemplo de uso
```javascript
import api from '../services/api';

// GET
const data = await api.get('/licitaciones');

// POST
const result = await api.post('/licitaciones', { nombre: 'Nueva Licitación' });

// PUT
await api.put('/licitaciones/123', { nombre: 'Actualizada' });

// DELETE
await api.delete('/licitaciones/123');
```

---

## 🔄 Flujo de Trabajo Git

### Configuración Inicial
```bash
git config user.name "Nombre del Desarrollador"
git config user.email "email@ejemplo.com"
```

### Flujo Recomendado

**1. Crear rama para nueva funcionalidad**
```bash
git checkout -b feature/nombre-funcionalidad
```

**2. Hacer cambios y commits frecuentes**
```bash
git add .
git commit -m "feat: descripción del cambio"
```

**3. Sincronizar con main**
```bash
git checkout main
git pull origin main
git checkout feature/nombre-funcionalidad
git merge main
```

**4. Push y crear Pull Request**
```bash
git push origin feature/nombre-funcionalidad
```

### Convenciones de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
style: cambios de estilos/formato
refactor: refactorización de código
docs: actualización de documentación
test: agregar o modificar tests
chore: tareas de mantenimiento
```

---

## 🎨 Guías de Estilo

### Componentes React

**Estructura de Componente:**
```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './MiComponente.css';

/**
 * Descripción del componente
 * @param {Object} props - Props del componente
 */
const MiComponente = ({ titulo, onAction }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Lógica de efecto
  }, []);

  const handleClick = () => {
    onAction?.();
  };

  return (
    <div className="mi-componente">
      <h2>{titulo}</h2>
      <button onClick={handleClick}>Acción</button>
    </div>
  );
};

MiComponente.propTypes = {
  titulo: PropTypes.string.isRequired,
  onAction: PropTypes.func,
};

MiComponente.defaultProps = {
  onAction: null,
};

export default MiComponente;
```

### Naming Conventions
- **Componentes:** PascalCase (`UserProfile.jsx`)
- **Hooks:** camelCase con prefijo 'use' (`useAuth.js`)
- **Utilidades:** camelCase (`formatDate.js`)
- **Constantes:** UPPER_SNAKE_CASE (`API_ENDPOINTS`)
- **CSS Modules:** kebab-case (`user-profile.module.css`)

---

## 🐛 Debugging

### React DevTools
Instalar extensión de navegador:
- Chrome: React Developer Tools
- Firefox: React Developer Tools

### Vite DevTools
```bash
# Ver en terminal mensajes detallados
npm run dev -- --debug
```

### Console Logs Útiles
```javascript
console.log('Valor:', valor);
console.table(array);      // Para arrays/objetos
console.error('Error:', error);
console.warn('Advertencia');
```

### Network Debugging
- Abrir DevTools → Network
- Filtrar por XHR/Fetch
- Verificar requests/responses del API

---

## 📦 Agregar Nuevas Dependencias

### Instalación
```bash
# Dependencia de producción
npm install nombre-paquete

# Dependencia de desarrollo
npm install -D nombre-paquete
```

### Librerías Comunes

**UI/Componentes:**
```bash
npm install @mui/material @emotion/react @emotion/styled  # Material-UI
npm install react-bootstrap bootstrap                      # Bootstrap
npm install antd                                           # Ant Design
```

**Formularios:**
```bash
npm install react-hook-form                                # Manejo de forms
npm install yup                                            # Validación
```

**Estado Global:**
```bash
npm install zustand                                        # State management (simple)
npm install @tanstack/react-query                          # Server state
```

**Utilidades:**
```bash
npm install date-fns                                       # Manejo de fechas
npm install lodash                                         # Utilidades JS
npm install axios                                          # HTTP client
```

---

## 🚀 Despliegue/Actualización

### Proceso de Actualización en Servidor

**Opción A: Manual**
```bash
# En el servidor
ssh nextris@148.230.72.8
cd /var/www/nextris-frontend
git pull origin main
npm install
sudo systemctl restart nextris-frontend
```

**Opción B: Script Automático**
```bash
ssh nextris@148.230.72.8
sudo /usr/local/bin/update-vite-frontend.sh
```

### Build de Producción
```bash
npm run build
# Genera carpeta dist/ con archivos optimizados
```

---

## 🔐 Acceso y Permisos

### Crear Usuario para Desarrollador Frontend

**En el servidor (como root):**
```bash
# Crear usuario
sudo adduser frontend-dev

# Agregar a grupo nextris
sudo usermod -aG nextris frontend-dev

# Dar permisos al directorio
sudo chown -R nextris:nextris /var/www/nextris-frontend
sudo chmod -R 775 /var/www/nextris-frontend

# Agregar frontend-dev al grupo nextris
sudo usermod -aG nextris frontend-dev
```

### SSH con Key (más seguro)

**En la computadora del desarrollador:**
```bash
# Generar SSH key
ssh-keygen -t ed25519 -C "frontend-dev@nextris"

# Copiar key al servidor
ssh-copy-id frontend-dev@148.230.72.8
```

**Conectar:**
```bash
ssh frontend-dev@148.230.72.8
```

---

## 📊 Monitoreo Durante Desarrollo

### Ver logs del backend
```bash
# Backend en puerto 5001
curl http://148.230.72.8:5001/api/health

# Ver logs del backend
ssh nextris@148.230.72.8
journalctl -u nextris-dev-react -f
```

### Verificar CORS
Si hay problemas de CORS, verificar en el backend:
```python
# apps/api/__init__.py o config.py
from flask_cors import CORS

CORS(app, origins=['http://localhost:5173', 'http://148.230.72.8:5173'])
```

---

## 🆘 Solución de Problemas Comunes

### El servidor no inicia
```bash
# Verificar puerto ocupado
lsof -i :5173
# Matar proceso si es necesario
kill -9 <PID>

# O cambiar puerto
npm run dev -- --port 3000
```

### Errores de dependencias
```bash
# Limpiar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Caché de Vite
```bash
# Limpiar caché
rm -rf node_modules/.vite
npm run dev
```

### API no responde
```bash
# Verificar backend
curl http://148.230.72.8:5001/api/health

# Verificar configuración .env
cat .env
```

### Hot Reload no funciona
```bash
# Aumentar límite de watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 📚 Recursos y Documentación

### Documentación Oficial
- **Vite:** https://vitejs.dev/
- **React:** https://react.dev/
- **React Router:** https://reactrouter.com/

### Herramientas Recomendadas
- **VS Code Extensions:**
  - ES7+ React/Redux/React-Native snippets
  - ESLint
  - Prettier
  - Auto Rename Tag
  - Path Intellisense
  - GitLens

### Tutoriales
- Vite + React: https://vitejs.dev/guide/
- React Hooks: https://react.dev/reference/react

---

## 📞 Comunicación con Backend

### Endpoints Disponibles
Ver documentación completa en: `/var/www/nextris-dev-react/apps/api/`

**Autenticación:**
- POST `/api/login` - Login
- POST `/api/register` - Registro
- POST `/api/logout` - Logout
- GET `/api/user` - Usuario actual

**Licitaciones:**
- GET `/api/licitaciones` - Listar
- POST `/api/licitaciones` - Crear
- GET `/api/licitaciones/:id` - Detalle
- PUT `/api/licitaciones/:id` - Actualizar
- DELETE `/api/licitaciones/:id` - Eliminar

---

## ✅ Checklist de Inicio

Antes de empezar a desarrollar:

- [ ] Node.js instalado (verificar: `node --version`)
- [ ] Git configurado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` configurado
- [ ] Servidor dev corriendo (`npm run dev`)
- [ ] Backend accesible (probar con curl/Postman)
- [ ] Editor de código configurado
- [ ] Extensiones instaladas
- [ ] Acceso a documentación del proyecto

---

## 🎓 Onboarding para Nuevo Desarrollador

### Día 1: Configuración
1. Configurar entorno local
2. Clonar repositorio
3. Instalar dependencias
4. Revisar estructura del proyecto
5. Ejecutar aplicación localmente

### Día 2-3: Familiarización
1. Revisar componentes existentes
2. Entender flujo de autenticación
3. Explorar conexión con API
4. Hacer cambio pequeño de prueba

### Día 4-5: Primera Tarea
1. Asignar issue/tarea pequeña
2. Crear rama feature
3. Implementar y testear
4. Crear Pull Request
5. Code review

---

## 📝 Contacto y Soporte

**Ubicaciones importantes:**
- Código frontend: `/var/www/nextris-frontend`
- Backend API: `http://148.230.72.8:5001/api`
- Documentación backend: `/var/www/nextris-dev-react/apps/api/`
- Logs: `journalctl -u nextris-frontend`

**Para preguntas:**
1. Revisar esta documentación
2. Revisar logs de errores
3. Contactar al lead developer
4. Documentar soluciones encontradas
