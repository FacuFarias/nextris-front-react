# Nextris Frontend - React + Vite

Sistema de gestión de licitaciones - Frontend moderno construido con React y Vite.

[![Repositorio](https://img.shields.io/badge/github-nextris--front--react-blue?logo=github)](https://github.com/FacuFarias/nextris-front-react)
[![Vite](https://img.shields.io/badge/vite-7.2.6-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-18.3-61DAFB?logo=react)](https://react.dev/)

## 🚀 Tecnologías

- **React 19** - Librería UI
- **Vite 7** - Build tool y dev server ultrarrápido
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **CSS Modules** - Estilos

## 📋 Requisitos

- Node.js 18 o superior
- npm 9 o superior

## 🔧 Instalación

```bash
# Clonar repositorio
git clone https://github.com/FacuFarias/nextris-front-react.git
cd nextris-front-react

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

## ⚙️ Configuración

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://tu-servidor:5001/api
VITE_API_BASE_URL=http://tu-servidor:5001
```

## 🏃 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa del build de producción
npm run preview
```

El servidor de desarrollo estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
src/
├── assets/          # Recursos estáticos (imágenes, iconos)
├── components/      # Componentes reutilizables
│   ├── common/      # Componentes comunes (Button, Input, etc)
│   └── layout/      # Componentes de layout (Header, Sidebar, etc)
├── contexts/        # React Contexts (AuthContext, etc)
├── hooks/           # Custom React Hooks
├── pages/           # Páginas/Vistas principales
├── services/        # Servicios API (axios, fetch)
├── utils/           # Funciones utilitarias
├── App.jsx          # Componente principal
├── main.jsx         # Entry point
└── index.css        # Estilos globales
```

## 🔌 Backend API

Este frontend se conecta con el backend Nextris Flask:
- **Repository:** [nextris-dev-react](https://github.com/FacuFarias/nextris-dev-react)
- **API Base URL:** `http://148.230.72.8:5001/api`
- **Health Check:** `http://148.230.72.8:5001/api/health`

### 📡 Endpoints Disponibles:

**Autenticación:**
- `POST /api/auth/login` - Login y obtener JWT tokens
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Refrescar access token
- `POST /api/auth/logout` - Cerrar sesión

**Pacientes:**
- `GET /api/patients` - Listar pacientes (con paginación y búsqueda)
- `GET /api/patients/{guid}` - Obtener paciente
- `POST /api/patients` - Crear paciente
- `PUT /api/patients/{guid}` - Actualizar paciente

**Estudios:**
- `GET /api/studies` - Listar estudios (con filtros)
- `GET /api/studies/{guid}` - Obtener estudio con series
- `GET /api/studies/patient/{patient_id}` - Estudios de un paciente

📖 **[Ver documentación completa de la API](API_DOCUMENTATION.md)** con ejemplos de uso, códigos de error y mejores prácticas.

## 🚀 Despliegue

### Opción 1: Build Estático

```bash
# Generar build de producción
npm run build

# Los archivos estarán en la carpeta dist/
# Puedes servirlos con cualquier servidor web (nginx, apache, etc)
```

### Opción 2: Servicio Systemd (Linux)

Ver documentación completa en `MANTENIMIENTO_VITE.md`

```bash
# Crear servicio
sudo nano /etc/systemd/system/nextris-frontend.service

# Habilitar e iniciar
sudo systemctl enable nextris-frontend
sudo systemctl start nextris-frontend
```

## 📚 Documentación

- **[API Documentation](API_DOCUMENTATION.md)** - 📡 Documentación completa de endpoints REST
- **[Guía de Desarrollo](DESARROLLO_FRONTEND.md)** - 💻 Setup y flujo de trabajo para desarrolladores
- **[Guía de Mantenimiento](MANTENIMIENTO_VITE.md)** - 🔧 Administración del servicio Vite
- **[Comandos Git](GIT_COMMANDS.md)** - 📝 Referencia rápida de Git

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convenciones de Commits

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `style:` Cambios de formato/estilo
- `refactor:` Refactorización de código
- `docs:` Actualización de documentación
- `test:` Agregar o modificar tests
## 👥 Autores

- Facu Farias - [@FacuFarias](https://github.com/FacuFarias)

## 🔗 Enlaces

- [Repositorio](https://github.com/FacuFarias/nextris-front-react)
- [Backend API](https://github.com/FacuFarias/nextris-dev-react)
- [Guía de Desarrollo](./DESARROLLO_FRONTEND.md)
- [Guía de Mantenimiento](./MANTENIMIENTO_VITE.md)

---

**🌐 Demo:** http://148.230.72.8:5173  
**📧 Contacto:** facu@nextris.com
- Tu Nombre - [Tu GitHub](https://github.com/TU_USUARIO)

## 🔗 Enlaces

- [Backend API](https://github.com/TU_USUARIO/nextris-dev-react)
- [Documentación completa](./DESARROLLO_FRONTEND.md)
