# CDIVET — NextRIS Frontend

Snapshot del frontend activo de `https://cdivet.cloud`, rama `cdivet`, derivada de `version/veterinaria`.
Usar con [backend `cdivet`](https://github.com/FacuFarias/nextris-backend-react/tree/cdivet).

```bash
npm ci
cp deployment/cdivet.env.example .env.production
npm run build
```

La marca CDIVET, los logotipos y las pantallas veterinarias están incluidos. Nginx sirve `dist/`; la API se configura en `/api`.

[Edición veterinaria](documentation/VETERINARY_EDITION.md).
[Configuración y migración](https://github.com/FacuFarias/nextris-backend-react/blob/cdivet/docs/CDIVET_MIGRATION.md).

Los datos institucionales, animales, responsables, informes y cuentas se recuperan del respaldo privado de PostgreSQL.
