# 🗺️ NERVE Health Systems - Plan Maestro y Seguimiento 🚀

> **Nota para la IA:** Este archivo actúa como mi memoria principal y registro de curso para NERVE Health Systems. Antes de implementar grandes cambios, debo consultar y actualizar este archivo para asegurar que no nos desviemos de los objetivos, prioridades y acuerdos tomados con el usuario.

## 1. Visión y Objetivos 🎯
- **Objetivo Principal:** Crear la plataforma SaaS de gestión médica, expedientes clínicos y administración más moderna, rápida y escalable para médicos y hospitales en México.
- **Diferenciador:** Interfaces intuitivas, arquitectura multi-tenant real (hasta grandes hospitales jerárquicos) y experiencia premium en Web y Escritorio.

## 2. Estado Actual del Software (Actualizado: Marzo 2026) 🩺
- **Frontend:** Completado en su fase V1 (Landing responsiva, dashboard modular con Vanilla JS, interfaz veloz sin frameworks inyectados, comunicación robusta en `api.js`).
- **Backend:** Node.js + Express + Prisma + PostgreSQL. Altamente funcional y seguro.
  - Implementado Control de Roles (Superadmin, Dueño, Doctor, Asistente, Jefe, Paciente).
  - Implementados middlewares estrictos y Audit Logging.
- **Desktop Apps (Electron):** Windows listo (~276MB empaquetado). macOS en revisión notarial por parte de Apple.
- **Infraestructura de Servidor:** Scripts de despliegue listos para Hostinger (Ubuntu VPS, Node 20, Nginx, PM2, PostgreSQL aislado).
  - *Nota Interna de Seguridad*: Las credenciales de acceso al VPS (root, IP, Password) se encuentran respaldadas localmente en el archivo `vps_credentials.txt`, el cual está protegido bajo `.gitignore` para nunca ser subido a la nube.

## 3. Hoja de Ruta Inmediata (Camino a Producción) 🛤️
- [ ] **Definir Flujo de Ingresos / Mercado Pago:** Determinar si lanzamos primero de forma gratuita (beta trial genérico) o establecemos pasarela de pagos / cobro recurrente desde el día 1.
- [ ] **Correr Despliegue en VPS:** Ejecutar limpieza final y aplicar `setup-vps.sh` vía SSH en la IP `69.62.87.145`.
- [ ] **Conexión de Dominios:** Confirmar que `nervehealthsystems.com` resuelve correctamente a la IP del VPS.
- [ ] **Configurar SSL (Certbot):** Activar HTTPS una vez propagado el dominio en Nginx.
- [ ] **Revisión final de Variables de Entorno (.env) de Producción:** Sembrar contraseña definitiva de SuperAdmin y secretos.

## 4. Historial de Decisiones Críticas y Cambios Arquitectónicos 🧠
- **03/Mar/2026 - Robustecimiento para Tráfico Masivo (Picos de Tráfico):**
  - Se incrementó el `rateLimit` (límite de peticiones firewall de software) a 5000 peticiones cada 15 min por IP general, y 100 intentos de Auth, para evitar que grandes hospitales colapsen por compartir la misma IP pública.
  - Se cambió la configuración de PM2 (`deploy/setup-vps.sh`) de modo simple a `instances: 'max'` con `exec_mode: 'cluster'`. Esto balanceará inteligentemente la carga de trabajo en todos los núcleos del servidor automáticamente, haciéndolo ultra resistente y de alta concurrencia.
  - Se inyectó límite de conexiones de Prisma Database URL a `connection_limit=50`. De lo contrario, los límites internos ahogarían PostgreSQL.

## 5. Peticiones Pendientes (Backlog de Usuario) 📋
- *(Cualquier cosa fuera del orden inmediato que el usuario pida, se anota aquí)*.
- **[Alta Prioridad (Siguiente sesión)]** Continuar la auditoría visual exhaustiva de todas las pantallas, modales y flujos para asegurar que no haya botones "muertos" ni alertas genéricas en ningún perfil antes de montar el backend real.
- Definir qué pasará con el botón de descarga de Mac en el Landing Page en lo que tardan los notarios de Apple.
