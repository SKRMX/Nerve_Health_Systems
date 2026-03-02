# NERVE Health Systems

Plataforma SaaS de gestión médica para clínicas y hospitales en México.

## Estructura del Proyecto

```
nerve-health-systems/
├── client/          → Frontend (HTML/CSS/JS)
├── server/          → Backend API (Node.js + Express + Prisma)
└── package.json     → Scripts de desarrollo
```

## Desarrollo Local

### Requisitos
- Node.js 20+
- PostgreSQL 15+

### Configuración
```bash
# 1. Clonar el repo
git clone https://github.com/SKRMX/Nerve_Health_Systems.git
cd Nerve_Health_Systems

# 2. Configurar variables de entorno
cp server/.env.example server/.env
# Editar server/.env con tus credenciales de PostgreSQL

# 3. Instalar dependencias del servidor
cd server && npm install

# 4. Crear base de datos y correr migraciones
npx prisma migrate dev

# 5. Iniciar el servidor API
npm run dev
# → http://localhost:3001

# 6. En otra terminal, servir el frontend
cd ../client
npx http-server -p 3000 -c-1
# → http://localhost:3000
```

## API
- `POST /api/auth/register` — Registrar organización
- `POST /api/auth/login` — Iniciar sesión
- `GET /api/health` — Health check

## Stack
- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **Pagos:** Mercado Pago (próximamente)

## Licencia
Privado — Todos los derechos reservados.
