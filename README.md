# NextRIS Frontend

React 19, TypeScript y Vite 7 para NextRIS de **una institución**. Esta rama `ui2`
se utiliza con `main` de [nextris-backend-react](https://github.com/FacuFarias/nextris-backend-react).

```bash
npm ci
cp .env.example .env
npm run dev
npm run typecheck
npm run build
npm run lint
```

Definir `VITE_API_URL` y el destino `/api`; los orígenes permitidos y HMR del servidor
de desarrollo se configuran en `.env.example`. El resultado de compilación está en
`dist/`. El despliegue debe usar la misma edición del backend y aplicar sus migraciones.

Los informes, historial, firmas y documentos del portal usan datos locales de NextRIS.
El nombre y los datos institucionales se configuran en Configuración → Institucional.
Las pruebas de navegador deben usar APIs interceptadas y un servidor de prueba.

[Guía de instalación y migración del backend](https://github.com/FacuFarias/nextris-backend-react/blob/main/docs/GENERAL_EDITION.md).

Para las pruebas de permisos, definir `NEXTRIS_BACKEND_ROOT` con el checkout del
backend y `NEXTRIS_TEST_PYTHON` con su Python. Usar `PERMISSION_TEST_BASE`,
`SHARE_TEST_BASE` y `PATIENT_TEST_BASE` para apuntar al frontend de prueba.

[Resultados y limitaciones de validación](https://github.com/FacuFarias/nextris-backend-react/blob/main/docs/GENERAL_EDITION_VALIDATION.md).
