# Tool Library — Biblioteca Comunitaria de Herramientas
> Plataforma de préstamo comunitario de herramientas enfocada en la sostenibilidad y la economía circular.  
> **Asignatura:** Lenguajes de Programación III  
> **Arquitectura:** Modelo-Vista-Controlador (MVC) en Backend + Arquitectura Modular y Componentes Standalone en Frontend.

---

## 📁 Estructura del Proyecto

El repositorio está dividido estrictamente en dos carpetas principales, manteniendo una separación limpia de responsabilidades:

```
Biblioteca/
├── backend/                       # Servidor API REST con Arquitectura MVC
│   ├── src/
│   │   ├── config/                # Conexión a MongoDB y variables de entorno
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── models/                # [M] MODELOS: Esquemas Mongoose y GeoJSON
│   │   │   ├── User.ts            # Usuarios, roles, hash de contraseñas
│   │   │   ├── Tool.ts            # Herramientas con índice geoespacial 2dsphere
│   │   │   ├── Loan.ts            # Préstamos y estados (pendiente, aprobado, devuelto)
│   │   │   └── Review.ts          # Calificaciones comunitarias
│   │   ├── views/                 # [V] VISTAS: Formateadores y respuestas estándar REST
│   │   │   └── apiResponse.ts     # Envoltura estándar (success, error, meta)
│   │   ├── controllers/           # [C] CONTROLADORES: Lógica de negocio y endpoints
│   │   │   ├── authController.ts  # Registro, login JWT, perfiles
│   │   │   ├── toolController.ts  # Catálogo, CRUD y búsqueda por proximidad ($near)
│   │   │   ├── loanController.ts  # Solicitud, validación anti-solapamiento y ciclo de entrega
│   │   │   └── adminController.ts # Panel de control, estadísticas y moderación
│   │   ├── routes/                # Enrutador REST Express
│   │   │   ├── authRoutes.ts
│   │   │   ├── toolRoutes.ts
│   │   │   ├── loanRoutes.ts
│   │   │   ├── adminRoutes.ts
│   │   │   └── index.ts
│   │   ├── middlewares/           # Seguridad e intercepción
│   │   │   ├── authMiddleware.ts  # Verificación de token JWT
│   │   │   ├── roleMiddleware.ts  # Control de acceso basado en roles (RBAC)
│   │   │   └── errorMiddleware.ts # Manejo global de excepciones y validaciones Mongo
│   │   ├── services/              # Lógica algorítmica especializada
│   │   │   └── loanService.ts     # Algoritmo matemático anti-solapamiento de fechas
│   │   ├── utils/
│   │   │   └── seeder.ts          # Semillero con datos de prueba reales y coordenadas
│   │   ├── app.ts                 # Configuración de Express y middlewares
│   │   └── server.ts              # Inicio del servidor HTTP y base de datos
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/                      # Aplicación Web SPA con Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/              # Núcleo de la aplicación
│   │   │   │   ├── guards/        # Guardas de ruta (AuthGuard)
│   │   │   │   ├── interceptors/  # Interceptor HTTP para adjuntar JWT automáticamente
│   │   │   │   ├── models/        # Interfaces TypeScript (User, Tool, Loan, ApiResponse)
│   │   │   │   └── services/      # Servicios HTTP (AuthService con Signals, ToolService, LoanService)
│   │   │   ├── features/          # Módulos funcionales
│   │   │   │   ├── home/          # Página de bienvenida y explicación del concepto
│   │   │   │   ├── auth/          # Iniciar sesión y Registro
│   │   │   │   ├── tools/         # Catálogo interactivo, Detalle y Publicación con mapa
│   │   │   │   ├── map/           # Visor interactivo Leaflet + OpenStreetMap con radio dinámico
│   │   │   │   └── loans/         # Dashboard de préstamos solicitados y recibidos
│   │   │   ├── shared/            # Componentes reutilizables
│   │   │   │   ├── navbar/        # Barra de navegación adaptable
│   │   │   │   └── footer/        # Pie de página académico
│   │   │   ├── app.routes.ts      # Enrutamiento de la SPA
│   │   │   └── app.config.ts      # Proveedores de Angular (HttpClient + Interceptores)
│   ├── package.json
│   └── angular.json
│
└── docs/                          # Documentación formal de la propuesta
    └── tool_library_blueprint.md  # Requerimientos RF/RNF, diagramas y diseño técnico
```

---

## 🚀 Puesta en Marcha Rápida

### 1. Iniciar el Backend (Node.js + Express + MongoDB)

```bash
cd backend

# Instalar dependencias (ya instaladas)
npm install

# (Opcional) Cargar datos de prueba con usuarios y coordenadas
npm run seed

# Iniciar servidor en modo desarrollo con recarga automática
npm run dev
```

El backend se iniciará en `http://localhost:5000`.  
Endpoint de verificación: `http://localhost:5000/api/v1/health`.

#### Cuentas preconfiguradas del Seeder:
* **Administrador:** `admin@toollibrary.org` | Contraseña: `AdminPassword123!`
* **Usuario (Carlos):** `carlos@vecino.org` | Contraseña: `UserPassword123!`
* **Usuaria (Lucía):** `lucia@vecina.org` | Contraseña: `UserPassword123!`

---

### 2. Iniciar el Frontend (Angular + Leaflet)

En otra terminal:

```bash
cd frontend

# Iniciar servidor de desarrollo de Angular
npm start
```

Abrir en el navegador: **`http://localhost:4200`**

---

## 🛠️ Aspectos Técnicos Destacados para la Sustentación

1. **Arquitectura MVC Limpia:**
   - **Modelos:** En `backend/src/models`, definiendo esquemas fuertemente tipados con Mongoose y coordenadas GeoJSON estándar `[longitud, latitud]`.
   - **Vistas:** En `backend/src/views/apiResponse.ts`, garantizando un formato de respuesta REST unificado (`success`, `data`, `message`, `meta`, `errors`).
   - **Controladores:** En `backend/src/controllers`, abstrayendo la lógica HTTP y delegando reglas complejas a servicios.

2. **Geolocalización con Leaflet & MongoDB `2dsphere`:**
   - La colección `tools` cuenta con un índice geoespacial `2dsphere`.
   - El endpoint `GET /api/v1/tools/nearby` ejecuta una búsqueda geográfica con `$near` / `$geometry`, calculando cercanías por radio en kilómetros.
   - En el frontend, **Leaflet** renderiza el mapa sin depender de claves de pago ni cuotas de Google Maps.
   - Al publicar una herramienta (`/tools/new`), el usuario puede **hacer clic en el mapa** para ubicar con precisión el equipo.

3. **Algoritmo Anti-Solapamiento de Fechas (RN-01):**
   - Implementado en `backend/src/services/loanService.ts`.
   - Evalúa si el intervalo solicitado colisiona con cualquier préstamo activo mediante:
     `{ fechaInicio: { $lte: finNuevo }, fechaFin: { $gte: inicioNuevo } }`.
   - Previene reservas duplicadas tanto al solicitar como al momento de ser aprobado por el propietario.

4. **Seguridad y Estado:**
   - Hash de contraseñas con `bcrypt` (10 rondas de salt).
   - Autenticación mediante tokens JWT y middleware de protección en rutas privadas.
   - Manejo de estado en Angular con **Signals** (`currentUser`, `isAuthenticated`, `isAdmin`).

