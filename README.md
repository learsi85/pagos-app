# PagosApp — Sistema de gestión de pagos

Stack: **React + Vite** (frontend) · **PHP 8.1 + Slim 4** (API REST) · **MySQL / MariaDB** (datos)

---

## Arquitectura multi-tenant

```
usuarios_app  (BD existente)
  └── applications   → identifica cada aplicación/empresa
  └── tenants        → un tenant por empresa, vinculado a su application
  └── user_tenants   → qué usuarios pertenecen a qué tenant
  └── users          → admins del sistema

pagos_app  (BD nueva)
  └── empresas       → TenantKey = tenants.TenantKey de usuarios_app
  └── clientes       → entidad global (puede tener fins con varias empresas)
  └── productos      → catálogo por empresa
  └── financiamientos→ plan de pago aceptado
  └── plan_pagos     → corrida financiera (una fila por cuota)
  └── pagos          → registro de cada pago realizado
  └── metodos_pago   → catálogo fijo ampliable
```

**Resolución de tenant en cada request admin:**
`JWT.sub (Usuario_Key)` → `user_tenants` → `tenants.TenantKey` → `empresas.TenantKey`

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| PHP         | 8.1            |
| Composer    | 2.x            |
| Node.js     | 18.x           |
| MySQL/MariaDB | 10.4 / 8.0   |
| Apache/Nginx | cualquiera    |

---

## 1 · Base de datos

### 1.1 Crear las BDs

```sql
CREATE DATABASE IF NOT EXISTS usuarios_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS pagos_app    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.2 Importar esquemas

```bash
# Esquema de usuarios (estructura ya existente)
mysql -u root -p usuarios_app < database/usuarios_app.sql

# Esquema de pagos (nuevo)
mysql -u root -p pagos_app < database/pagos_app.sql
```

### 1.3 Registrar primer tenant

Después de crear una aplicación en `usuarios_app.applications`, crea el tenant y registra la empresa:

```sql
-- En usuarios_app: crear tenant para la aplicación
INSERT INTO tenants (ApplicationId, TenantName, TenantKey, CreatedBy)
VALUES (1, 'Mi Empresa S.A.', 'mi-empresa', 'SYSTEM');

-- Asignar usuario al tenant
INSERT INTO user_tenants (TenantId, Usuario_Key, AssignedBy)
VALUES (1, 'ADMIN001', 'SYSTEM');

-- En pagos_app: crear registro de la empresa
-- (TenantKey debe coincidir con tenants.TenantKey)
INSERT INTO empresas (TenantKey, RazonSocial, RFC, Email)
VALUES ('mi-empresa', 'Mi Empresa S.A. de C.V.', 'MEM000000XXX', 'contacto@miempresa.com');
```

---

## 2 · Backend (PHP Slim 4)

```bash
cd backend

# Instalar dependencias
composer install

# Configurar variables de entorno
cp .env.example .env
# → Editar .env con tus credenciales de BD, JWT_SECRET, etc.

# Crear directorio de uploads
mkdir -p public/uploads/comprobantes
chmod 755 public/uploads/comprobantes

# Servidor de desarrollo
composer start
# API disponible en http://localhost:8080
```

### Configuración Apache (producción)

El `DocumentRoot` debe apuntar a `backend/public/`:

```apache
<VirtualHost *:80>
    ServerName api.tudominio.com
    DocumentRoot /var/www/pagos-app/backend/public

    <Directory /var/www/pagos-app/backend/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Configuración Nginx (producción)

```nginx
server {
    listen 80;
    server_name api.tudominio.com;
    root /var/www/pagos-app/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php$is_args$args;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Servir comprobantes directamente
    location /uploads/ {
        alias /var/www/pagos-app/backend/public/uploads/;
        expires 30d;
    }
}
```

---

## 3 · Frontend (React + Vite)

```bash
cd frontend

# Instalar dependencias
npm install

# Desarrollo (proxy automático a localhost:8080)
npm run dev
# App en http://localhost:5173

# Build para producción
npm run build
# Archivos en frontend/dist/
```

### Variables de entorno frontend (opcional)

Crea `frontend/.env.local` si el API no está en el mismo dominio:

```env
VITE_API_BASE_URL=https://api.tudominio.com
```

Y ajusta `frontend/src/services/api.js`:
```js
baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
```

### Deploy en producción

Sirve `frontend/dist/` como sitio estático. Configura el servidor para que todas las rutas regresen `index.html` (SPA):

**Nginx:**
```nginx
server {
    listen 80;
    server_name tudominio.com;
    root /var/www/pagos-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache** (`.htaccess` en `dist/`):
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

---

## 4 · Flujo de uso

### Administrador

1. Inicia sesión en `/login` con su `Usuario_Key` y contraseña
2. El sistema resuelve su tenant vía `user_tenants → tenants`
3. Gestiona clientes, productos y financiamientos
4. Al crear un cliente, obtiene un **enlace de primer acceso** con token de 72 h
5. Registra pagos con comprobante opcional

### Cliente

1. Recibe el enlace `/portal/acceso?token=...&email=...`
2. Valida su RFC y crea su contraseña
3. Inicia sesión en `/portal/login`
4. Consulta estado de cuenta, plan de pagos e historial

---

## 5 · Estructura de archivos

```
pagos-app/
├── database/
│   └── pagos_app.sql          ← esquema completo con trigger
├── backend/
│   ├── composer.json
│   ├── .env.example
│   ├── public/
│   │   ├── index.php          ← front controller
│   │   ├── .htaccess
│   │   └── uploads/           ← comprobantes (ignorado en git)
│   └── src/
│       ├── container.php      ← inyección de dependencias
│       ├── Controllers/
│       │   ├── AuthAdminController.php
│       │   ├── AuthClienteController.php
│       │   ├── FinanciamientoController.php  ← incluye simulador
│       │   ├── PagoController.php            ← manejo de comprobantes
│       │   ├── PortalClienteController.php
│       │   └── MiscControllers.php           ← Cliente, Producto, Empresa, Dashboard
│       ├── Middleware/
│       │   ├── AuthAdminMiddleware.php
│       │   ├── AuthClienteMiddleware.php
│       │   ├── CorsMiddleware.php
│       │   └── ErrorHandler.php
│       ├── Helpers/
│       │   └── Database.php
│       └── Routes/
│           └── routes.php
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx             ← rutas y guards
        ├── services/api.js     ← todos los endpoints
        ├── store/authStore.js  ← Zustand (admin + cliente)
        ├── utils/format.js     ← dinero, fechas, badges
        ├── components/layout/
        │   ├── AdminLayout.jsx
        │   └── PortalLayout.jsx
        └── pages/
            ├── admin/
            │   ├── LoginAdmin.jsx
            │   ├── Dashboard.jsx
            │   ├── Clientes.jsx
            │   ├── ClienteDetalle.jsx
            │   ├── Productos.jsx
            │   ├── Financiamientos.jsx
            │   ├── FinanciamientoNuevo.jsx    ← con simulador de corrida
            │   ├── FinanciamientoDetalle.jsx
            │   ├── RegistrarPago.jsx          ← con selector de cuota
            │   └── Empresa.jsx
            └── cliente/
                ├── LoginCliente.jsx
                ├── PrimerAcceso.jsx
                ├── EstadoCuenta.jsx
                ├── MisFinanciamientos.jsx
                └── DetalleFinanciamiento.jsx
```

---

## 6 · Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/admin/login` | Login admin |
| GET  | `/api/auth/admin/me` | Datos del admin autenticado |
| POST | `/api/auth/cliente/login` | Login cliente |
| POST | `/api/auth/cliente/primer-acceso` | Activar cuenta cliente |
| GET  | `/api/admin/dashboard` | KPIs y resumen |
| GET/PUT | `/api/admin/empresa` | Datos de la empresa |
| GET/POST | `/api/admin/clientes` | Listado y alta de clientes |
| GET/PUT | `/api/admin/clientes/{id}` | Detalle y edición |
| GET/POST | `/api/admin/productos` | Catálogo de productos |
| GET/POST | `/api/admin/financiamientos` | Listado y nuevo financiamiento |
| POST | `/api/admin/financiamientos/{id}/simular` | **Simulador de corrida** (sin guardar) |
| GET  | `/api/admin/financiamientos/{id}/plan` | Plan de pagos |
| GET/POST | `/api/admin/pagos` | Listado y registro de pago |
| GET  | `/api/cliente/estado-cuenta` | Resumen global del cliente |
| GET  | `/api/cliente/financiamientos` | Financiamientos del cliente |
| GET  | `/api/cliente/financiamientos/{id}/plan` | Plan de pagos (portal) |
| GET  | `/api/cliente/financiamientos/{id}/pagos` | Historial de pagos (portal) |

---

## 7 · Seguridad implementada

- **JWT firmado con HS256** — separado para admin y cliente, tipo validado en middleware
- **Bloqueo por intentos fallidos** — 5 intentos → bloqueo 15 min (ambos portales)
- **Hash de contraseñas** — SHA-256 con salt aleatorio de 32 bytes hex
- **Tenant isolation** — cada query admin filtra por `EmpresaId` extraído del JWT
- **Token de primer acceso** — expira en 72 h, se invalida tras el primer uso
- **Validación de archivos** — extensión + tamaño máximo configurable
- **CORS configurable** — lista blanca de orígenes en `.env`
- **Prepared statements** — PDO en todo el backend, sin concatenación de SQL

---

## 8 · Pendientes sugeridos para siguiente versión

- [ ] Notificaciones por email (vencimientos próximos)
- [ ] Exportar estado de cuenta a PDF
- [ ] Dashboard con filtros por rango de fechas
- [ ] Refresh token para sesiones largas
- [ ] Tests unitarios (PHPUnit backend / Vitest frontend)
- [ ] Rate limiting en endpoints de login
