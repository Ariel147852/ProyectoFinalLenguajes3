# Diccionario de Base de Datos — Tool Library
**Motor:** MongoDB (NoSQL Documental)  
**Base de Datos:** `tool_library`  
**Cadena de Conexión Local:** `mongodb://127.0.0.1:27017/tool_library`  
**ORM / ODM:** Mongoose 8.x

---

## 1. Colección: `users`
Almacena los miembros de la comunidad que pueden actuar como prestamistas (propietarios), prestatarios o administradores.

| Campo | Tipo BSON | Restricciones / Índices | Descripción |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key (Autogenerado) | Identificador único del usuario. |
| `nombre` | String | Requerido, Trim | Nombre completo del usuario. |
| `email` | String | Requerido, Único (`index: unique`), Lowercase | Correo electrónico para login y notificaciones. |
| `passwordHash` | String | Requerido, `select: false` | Contraseña encriptada con `bcrypt` (10 rondas de salt). |
| `rol` | String | Enum: `['user', 'admin']`, Default: `'user'` | Nivel de permisos en la plataforma. |
| `telefono` | String | Opcional | Contacto telefónico para coordinar entregas. |
| `direccionZona` | String | Requerido, Default: `'Comunidad Central'` | Barrio o sector de residencia (protege la privacidad). |
| `reputacionPromedio` | Number | Min: 0, Max: 5, Default: 5.0 | Promedio de valoraciones otorgadas por otros vecinos. |
| `activo` | Boolean | Default: `true` | Estado del usuario (permite bloqueo por administradores). |
| `createdAt` | Date | Autogenerado por timestamps | Fecha de creación del registro. |
| `updatedAt` | Date | Autogenerado por timestamps | Fecha de última modificación. |

---

## 2. Colección: `tools`
Almacena las herramientas compartidas en la comunidad. Incluye geometría GeoJSON para la búsqueda geoespacial.

| Campo | Tipo BSON | Restricciones / Índices | Descripción |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key (Autogenerado) | Identificador único de la herramienta. |
| `propietarioId` | ObjectId | Requerido, Ref: `User` | Clave foránea del usuario que publica la herramienta. |
| `nombre` | String | Requerido, Trim | Título comercial o descriptivo del equipo. |
| `descripcion` | String | Requerido | Detalles técnicos, accesorios incluidos y condiciones de uso. |
| `categoria` | String | Enum: `['electricas', 'manuales', 'jardineria', 'fontaneria', 'pintura', 'construccion', 'otros']` | Categoría principal de la herramienta. |
| `estadoFisico` | String | Enum: `['excelente', 'bueno', 'regular']` | Estado de desgaste y operatividad del equipo. |
| `imagenes` | Array de String | Opcional | Lista de URLs con fotos del equipo. |
| `ubicacion` | Documento GeoJSON | **Índice `2dsphere`** | Formato estándar GeoJSON: `{ type: "Point", coordinates: [longitud, latitud] }`. |
| `ubicacion.type` | String | Requerido, Valor fijo: `'Point'` | Tipo de geometría espacial. |
| `ubicacion.coordinates` | Array de 2 Numbers | Requerido, `[lng, lat]` | Coordenadas exactas en orden **[Longitud, Latitud]**. |
| `direccionZona` | String | Requerido | Barrio o sector de referencia público en el mapa. |
| `activa` | Boolean | Default: `true` | Si está activa para aparecer en búsquedas. |
| `maxDiasPrestamo` | Number | Min: 1, Max: 30, Default: 7 | Límite máximo de días continuos de préstamo permitido. |
| `createdAt` | Date | Timestamp | Fecha de publicación. |

> **Índices en `tools`:**
> 1. `{ ubicacion: "2dsphere" }`: Permite consultas `$near` y `$geoNear` en radio de kilómetros.
> 2. `{ categoria: 1, activa: 1 }`: Optimiza filtros de catálogo.
> 3. `{ nombre: "text", descripcion: "text" }`: Búsqueda textual por palabras clave.

---

## 3. Colección: `loans`
Gestiona el ciclo de vida de las solicitudes y préstamos de herramientas.

| Campo | Tipo BSON | Restricciones / Índices | Descripción |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Identificador del préstamo. |
| `herramientaId` | ObjectId | Requerido, Ref: `Tool` | Herramienta solicitada. |
| `solicitanteId` | ObjectId | Requerido, Ref: `User` | Vecino que solicita el préstamo. |
| `propietarioId` | ObjectId | Requerido, Ref: `User` | Vecino dueño de la herramienta. |
| `fechaInicio` | Date | Requerido | Fecha en la que iniciará el préstamo. |
| `fechaFin` | Date | Requerido | Fecha límite pactada para la devolución. |
| `estado` | String | Enum: `['pendiente', 'aprobado', 'rechazado', 'en_curso', 'devuelto', 'cancelado']` | Estado actual en la máquina de estados. |
| `fechaEntregaReal` | Date | Opcional | Fecha/hora exacta en la que el dueño entrega físicamente la herramienta. |
| `fechaDevolucionReal` | Date | Opcional | Fecha/hora exacta en la que la herramienta regresa al dueño. |
| `notasSolicitante` | String | Opcional | Mensaje explicativo enviado al solicitar. |
| `notasPropietario` | String | Opcional | Respuestas o condiciones dadas por el dueño. |

---

## 4. Colección: `reviews`
Registra la reputación y comentarios comunitarios tras la finalización de un préstamo.

| Campo | Tipo BSON | Restricciones / Índices | Descripción |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Identificador de la reseña. |
| `prestamoId` | ObjectId | Requerido, Ref: `Loan` | Préstamo asociado. |
| `emisorId` | ObjectId | Requerido, Ref: `User` | Usuario que califica. |
| `receptorId` | ObjectId | Requerido, Ref: `User` | Usuario calificado. |
| `calificacion` | Number | Requerido, Min: 1, Max: 5 | Puntuación comunitaria otorgada. |
| `comentario` | String | Requerido | Opinión sobre el cuidado del equipo o la puntualidad. |

