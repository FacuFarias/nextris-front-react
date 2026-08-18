import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Session ID (shared with AnalyticsContext) ───────────────────────────────
const SESSION_KEY = 'nextris_session_id';
function getSessionId(): string {
    try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) return stored;
        const id =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);
        sessionStorage.setItem(SESSION_KEY, id);
        return id;
    } catch {
        return '';
    }
}

// Variable para controlar si ya se está refrescando el token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Crear instancia de axios con configuración por defecto
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
    (config) => {
        let token = null;

        // Método 1: Buscar en authData (método correcto)
        const authDataStr = localStorage.getItem('authData');
        if (authDataStr) {
            try {
                const parsedData = JSON.parse(authDataStr);
                token = parsedData?.access_token;
            } catch (e) {
                console.error('Error parsing authData:', e);
            }
        }

        // Método 2: Fallback - buscar en clave separada access_token (por compatibilidad)
        if (!token) {
            token = localStorage.getItem('access_token');
        }

        // Configurar header de Authorization si hay token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Forward session ID to backend analytics middleware
        const sid = getSessionId();
        if (sid) {
            config.headers['X-Session-ID'] = sid;
        }

        // Si es FormData, eliminar el Content-Type para que axios lo configure automáticamente
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de respuesta y refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el 401 viene del login, no intentar refresh — dejar que onError lo maneje
        if (originalRequest.url?.includes('/auth/login')) {
            return Promise.reject(error);
        }

        // Si el error es 401 y no hemos intentado refrescar aún
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Si ya se está refrescando, agregar a la cola
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const authDataStr = localStorage.getItem('authData');
            if (!authDataStr) {
                isRefreshing = false;
                // No hay refresh token, redirigir al login
                // Avoid redirect — prevent infinite reload loop
                return Promise.reject(error);
            }

            const authData = JSON.parse(authDataStr);
            const refreshToken = authData?.refresh_token;

            if (!refreshToken) {
                isRefreshing = false;
                // No hay refresh token, redirigir al login
                localStorage.removeItem('authData');
                // Avoid redirect — prevent infinite reload loop
                return Promise.reject(error);
            }

            try {
                // Llamar al endpoint de refresh token
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${refreshToken}`,
                    }
                });

                const newAccessToken = response.data.data.access_token;
                const newAuthData = {
                    ...authData,
                    access_token: newAccessToken,
                };

                // Actualizar localStorage
                localStorage.setItem('authData', JSON.stringify(newAuthData));

                // Actualizar el header de la petición original
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Procesar cola de peticiones pendientes
                processQueue(null, newAccessToken);
                isRefreshing = false;

                // Reintentar la petición original
                return api(originalRequest);
            } catch (refreshError) {
                // Si falla el refresh, cerrar sesión
                processQueue(refreshError, null);
                isRefreshing = false;
                localStorage.removeItem('authData');
                // Avoid redirect — prevent infinite reload loop
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);