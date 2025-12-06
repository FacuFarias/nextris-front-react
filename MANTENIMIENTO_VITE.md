# Guía de Mantenimiento - Servicio Vite Frontend

## 📋 Información del Servicio

**Nombre del servicio:** `nextris-frontend.service`  
**Ubicación del servicio:** `/etc/systemd/system/nextris-frontend.service`  
**Directorio de trabajo:** `/var/www/nextris-frontend`  
**Usuario/Grupo:** `nextris:nextris`  
**Puerto:** `5173`  
**URL de acceso:** `http://148.230.72.8:5173`

---

## 🔧 Comandos Básicos de Gestión

### Ver Estado del Servicio
```bash
systemctl status nextris-frontend
```

### Iniciar el Servicio
```bash
systemctl start nextris-frontend
```

### Detener el Servicio
```bash
systemctl stop nextris-frontend
```

### Reiniciar el Servicio
```bash
systemctl restart nextris-frontend
```

### Recargar Configuración (sin reiniciar)
```bash
systemctl reload nextris-frontend
```

### Habilitar Inicio Automático
```bash
systemctl enable nextris-frontend
```

### Deshabilitar Inicio Automático
```bash
systemctl disable nextris-frontend
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real
```bash
journalctl -u nextris-frontend -f
```

### Ver Últimos 50 Logs
```bash
journalctl -u nextris-frontend -n 50
```

### Ver Logs de las Últimas 2 Horas
```bash
journalctl -u nextris-frontend --since "2 hours ago"
```

### Ver Logs de Hoy
```bash
journalctl -u nextris-frontend --since today
```

### Ver Logs con Filtro de Errores
```bash
journalctl -u nextris-frontend -p err
```

### Limpiar Logs Antiguos
```bash
journalctl --vacuum-time=7d  # Mantener solo últimos 7 días
journalctl --vacuum-size=500M  # Mantener máximo 500MB
```

---

## 🔄 Actualización del Código Frontend

### 1. Detener el Servicio
```bash
systemctl stop nextris-frontend
```

### 2. Actualizar Código (desde Git)
```bash
cd /var/www/nextris-frontend
git pull origin main  # o la rama correspondiente
```

### 3. Instalar/Actualizar Dependencias
```bash
npm install
```

### 4. Verificar Permisos
```bash
chown -R nextris:nextris /var/www/nextris-frontend
```

### 5. Reiniciar el Servicio
```bash
systemctl start nextris-frontend
```

### 6. Verificar que Funciona
```bash
systemctl status nextris-frontend
curl http://localhost:5173
```

---

## 🛠️ Modificar Configuración del Servicio

### 1. Editar el Archivo del Servicio
```bash
nano /etc/systemd/system/nextris-frontend.service
```

### 2. Recargar Systemd
```bash
systemctl daemon-reload
```

### 3. Reiniciar el Servicio
```bash
systemctl restart nextris-frontend
```

### Ejemplo: Cambiar el Puerto
```ini
[Service]
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0 --port 5174  # Cambiar puerto
```

---

## 🚨 Solución de Problemas Comunes

### El Servicio No Inicia

**1. Verificar logs detallados:**
```bash
journalctl -u nextris-frontend -n 100 --no-pager
```

**2. Verificar permisos:**
```bash
ls -la /var/www/nextris-frontend
# Si el propietario no es nextris:
chown -R nextris:nextris /var/www/nextris-frontend
```

**3. Verificar que npm existe:**
```bash
which npm
# Debe mostrar: /usr/bin/npm
```

**4. Probar ejecución manual:**
```bash
su - nextris
cd /var/www/nextris-frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

### El Puerto 5173 Está Ocupado

**1. Ver qué proceso usa el puerto:**
```bash
lsof -i :5173
# o
netstat -tlnp | grep 5173
```

**2. Matar el proceso si es necesario:**
```bash
kill -9 <PID>
```

**3. O cambiar el puerto en el servicio**

### Errores de Permisos (EACCES)

```bash
# Cambiar propietario completo
chown -R nextris:nextris /var/www/nextris-frontend

# Cambiar permisos de node_modules
chmod -R 755 /var/www/nextris-frontend/node_modules

# Limpiar caché de Vite
rm -rf /var/www/nextris-frontend/node_modules/.vite
```

### El Servicio se Reinicia Constantemente

**1. Ver logs para identificar el error:**
```bash
journalctl -u nextris-frontend -f
```

**2. Verificar configuración de Vite:**
```bash
cat /var/www/nextris-frontend/vite.config.js
```

**3. Verificar variables de entorno:**
```bash
cat /var/www/nextris-frontend/.env
```

### Memoria Insuficiente

**1. Verificar uso de memoria:**
```bash
systemctl status nextris-frontend
free -h
```

**2. Aumentar límite de memoria en el servicio:**
```bash
nano /etc/systemd/system/nextris-frontend.service
```

Agregar:
```ini
[Service]
Environment="NODE_OPTIONS=--max-old-space-size=2048"
```

### Dependencias Desactualizadas o Rotas

```bash
cd /var/www/nextris-frontend

# Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar todo
npm install

# Verificar integridad
npm audit

# Reiniciar servicio
systemctl restart nextris-frontend
```

---

## 🔍 Verificación de Salud

### Script de Verificación Rápida
```bash
#!/bin/bash
echo "=== Estado del Servicio ==="
systemctl status nextris-frontend --no-pager

echo -e "\n=== Puerto 5173 ==="
netstat -tlnp | grep 5173 || ss -tlnp | grep 5173

echo -e "\n=== Últimos Logs ==="
journalctl -u nextris-frontend -n 10 --no-pager

echo -e "\n=== Prueba HTTP ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5173

echo -e "\n=== Uso de Recursos ==="
ps aux | grep -E "PID|vite" | grep -v grep
```

Guardar como `/usr/local/bin/check-vite.sh` y dar permisos:
```bash
chmod +x /usr/local/bin/check-vite.sh
```

Ejecutar:
```bash
/usr/local/bin/check-vite.sh
```

---

## 📈 Monitoreo con Watch

### Ver Estado en Tiempo Real
```bash
watch -n 2 'systemctl status nextris-frontend --no-pager | head -20'
```

### Ver Logs en Tiempo Real
```bash
journalctl -u nextris-frontend -f --since "5 minutes ago"
```

---

## 🔐 Seguridad y Mejores Prácticas

### 1. Nunca Correr como Root
✅ El servicio ya está configurado para correr como usuario `nextris`

### 2. Firewall (si aplica)
```bash
# Permitir puerto 5173
ufw allow 5173/tcp
```

### 3. Logs Rotativos
El servicio usa `systemd-journald` que maneja rotación automática

### 4. Backups del Código
```bash
# Backup manual
tar -czf /backups/nextris-frontend-$(date +%Y%m%d).tar.gz /var/www/nextris-frontend
```

### 5. Variables de Entorno Sensibles
```bash
# Nunca commitear .env
echo ".env" >> /var/www/nextris-frontend/.gitignore
```

---

## 🔄 Automatización de Despliegue

### Script de Actualización Automática
```bash
#!/bin/bash
# /usr/local/bin/update-vite-frontend.sh

set -e

echo "🔄 Actualizando Frontend Nextris..."

# Detener servicio
systemctl stop nextris-frontend

# Ir al directorio
cd /var/www/nextris-frontend

# Backup del estado actual
tar -czf /tmp/nextris-frontend-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Actualizar código
git pull origin main

# Actualizar dependencias
npm install

# Verificar permisos
chown -R nextris:nextris /var/www/nextris-frontend

# Iniciar servicio
systemctl start nextris-frontend

# Esperar 5 segundos
sleep 5

# Verificar estado
if systemctl is-active --quiet nextris-frontend; then
    echo "✅ Servicio iniciado correctamente"
    systemctl status nextris-frontend --no-pager | head -10
else
    echo "❌ Error al iniciar el servicio"
    journalctl -u nextris-frontend -n 20 --no-pager
    exit 1
fi

echo "✅ Actualización completada"
```

Dar permisos:
```bash
chmod +x /usr/local/bin/update-vite-frontend.sh
```

---

## 📞 Checklist de Mantenimiento

### Diario
- [ ] Verificar que el servicio está activo
- [ ] Revisar logs en busca de errores

### Semanal
- [ ] Verificar uso de recursos (memoria/CPU)
- [ ] Limpiar logs antiguos si es necesario
- [ ] Revisar actualizaciones de dependencias

### Mensual
- [ ] Actualizar dependencias de npm
- [ ] Hacer backup del código
- [ ] Revisar y optimizar configuración
- [ ] Probar recuperación ante fallos

---

## 📝 Registro de Cambios

Mantener un registro de cambios importantes:

```bash
# En /var/www/nextris-frontend/CHANGELOG.md
```

Formato sugerido:
```markdown
## [Fecha] - YYYY-MM-DD
### Cambios
- Descripción del cambio

### Versiones
- Vite: X.X.X
- React: X.X.X
- Node: X.X.X
```

---

## 🆘 Contacto y Soporte

**Ubicación de archivos importantes:**
- Servicio: `/etc/systemd/system/nextris-frontend.service`
- Código: `/var/www/nextris-frontend`
- Logs: `journalctl -u nextris-frontend`
- Configuración Vite: `/var/www/nextris-frontend/vite.config.js`
- Variables entorno: `/var/www/nextris-frontend/.env`

**Para reportar problemas:**
1. Capturar logs: `journalctl -u nextris-frontend -n 100 > /tmp/vite-error.log`
2. Verificar estado: `systemctl status nextris-frontend`
3. Documentar pasos para reproducir el error
