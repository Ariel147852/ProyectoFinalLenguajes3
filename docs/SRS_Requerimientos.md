# Especificación de Requisitos de Software (SRS) — Tool Library
**Asignatura:** Lenguajes de Programación III  
**Enfoque:** Economía Circular, Sostenibilidad y Comunicación Comunitaria en Tiempo Real

---

## 1. Reglas de Negocio del Sistema (RN)

* **RN01 (Anti-Solapamiento de Reservas):** Una herramienta no puede reservarse si el intervalo $[F_{inicio\_nueva}, F_{fin\_nueva}]$ colisiona con cualquier préstamo existente en estado `aprobado` o `en_curso`.  
  $$\text{Colisión si: } (F_{inicio\_nueva} \le F_{fin\_existente}) \land (F_{fin\_nueva} \ge F_{inicio\_existente})$$
* **RN02 (Prohibición de Autopréstamo):** Un usuario no puede solicitar el préstamo de una herramienta de la cual es propietario (`solicitanteId != propietarioId`).
* **RN03 (Máquina de Estados de Préstamos):** El ciclo de vida de un préstamo es estrictamente secuencial:  
  $$\text{Pendiente} \rightarrow (\text{Aprobado} \lor \text{Rechazado}) \rightarrow \text{En Curso} \rightarrow \text{Devuelto}$$
* **RN04 (Privacidad Geográfica):** El mapa público y las fichas de catálogo solo muestran la zona/barrio y coordenadas aproximadas (`direccionZona`).
* **RN05 (Límite Temporal):** Ningún préstamo puede exceder el `maxDiasPrestamo` configurado por el propietario.
* **RN06 (Comunicación en Tiempo Real):** Todo mensaje emitido al chat comunitario se transmite instantáneamente por WebSocket y se almacena persistentemente en MongoDB para consulta histórica.
* **RN07 (Membresías y Límites de Publicación):** La publicación de herramientas requiere una suscripción mensual activa ($5.00 USD / 30 días) que incluye hasta 5 herramientas publicadas. Para publicar herramientas adicionales sobre dicho cupo, el usuario debe adquirir cupos extras por un valor unitario de $0.50 USD.
* **RN08 (Verificación de Transferencias Bancarias):** Todo pago de suscripción o herramientas extras se procesa mediante transferencia bancaria y permanece en estado `pendiente` hasta que un Administrador valida el comprobante en su panel y acredita el beneficio al usuario.
* **RN09 (Identidad Fidedigna con Cédula Módulo 10 y Fotografías de Dos Lados):** El registro comunitario exige una cédula de identidad ecuatoriana válida calculada mediante el algoritmo oficial Módulo 10 y la carga de imágenes nítidas de ambos lados (frontal y posterior).
* **RN10 (Ventana de Pago de 15 Minutos y Liberación de Herramientas):** Toda solicitud de préstamo provisional dispone de un reloj de cuenta regresiva estricto de 15 minutos (`fechaLimitePago`). Si el solicitante no adjunta el comprobante (DeUna o transferencia) antes de que el reloj llegue a 00:00, la reserva se cancela de forma automática y la herramienta se libera inmediatamente.

---

## 2. Requerimientos Funcionales (RF)

| Código | Requerimiento Funcional | Rol | Descripción y Criterios de Aceptación |
| :---: | :--- | :---: | :--- |
| **RF01** | Registro e Identificación de Usuarios | Visitante | Registro con nombre, email único, contraseña cifrada con bcrypt, teléfono y zona. |
| **RF02** | Autenticación y Control de Sesión | Usuario | Login con JWT y manejo de sesiones reactivo con Angular Signals. |
| **RF03** | Gestión de Perfil y Reputación | Usuario | Consulta de datos, histórico de actividad y puntuación (1 a 5 estrellas). |
| **RF04** | Publicación de Herramientas | Propietario | Formulario completo con fotos, estado físico, categoría y días máximos permitidos. Valida suscripción activa y cupo disponible. |
| **RF05** | Georreferenciación Interactiva | Propietario | Selección interactiva de coordenadas en mapa Leaflet al publicar la herramienta. |
| **RF06** | Edición y Baja Lógica de Herramientas | Propietario / Admin | Modificación y baja lógica (`activa: false`) para preservar integridad histórica. |
| **RF07** | Catálogo con Filtros Multicriterio | Usuario | Búsqueda textual y filtrado reactivo por categorías. |
| **RF08** | Búsqueda por Proximidad Geográfica | Usuario | Búsqueda por radio en km (1 a 30 km) con índice `2dsphere` y operador `$near` de MongoDB. |
| **RF09** | Mapa Interactivo Comunitario | Usuario | Visor Leaflet + OpenStreetMap con pines temáticos según categoría y radar de usuario. |
| **RF10** | Consulta de Calendario de Disponibilidad | Usuario | Ficha del equipo con cálculo de fechas comprometidas / bloqueadas. |
| **RF11** | Solicitud de Préstamo con Validador | Prestatario | Selección de fechas con validación inmediata de días solicitados y anti-solapamiento. |
| **RF12** | Gestión de Solicitudes Recibidas | Propietario | Panel para aprobar o rechazar solicitudes de sus herramientas. |
| **RF13** | Control de Entrega y Devolución | Propietario | Registro de fecha y hora exacta de retiro (`En Curso`) y entrega (`Devuelto`). |
| **RF14** | Historial y Trazabilidad de Préstamos | Usuario | Pestañas independientes para préstamos solicitados y herramientas prestadas. |
| **RF15** | Calificación Comunitaria | Usuario | Calificación y reseña mutua al concluir un préstamo devuelto. |
| **RF16** | Panel de Supervisión (Dashboard Admin) | Administrador | Métricas globales (usuarios, herramientas, préstamos, comprobantes pendientes) y moderación de cuentas. |
| **RF17** | **Chat Comunitario en Tiempo Real (WebSocket)** | Usuario / Visitante | Chatbox interactivo con Socket.IO para comunicarse al instante con vecinos conectados. Persistencia completa en MongoDB. |
| **RF18** | **Soporte Multimedia y Visor Lightbox en Chat** | Usuario | Envío de imágenes y videos en el chatbox con apertura en pantalla completa (Lightbox), descarga y reproducción de video. |
| **RF19** | **Planes de Suscripción y Cuotas Extras ($5 / $0.50)** | Usuario | Membresía mensual ($5/mes por 5 herramientas) y compra de herramientas extras ($0.50 c/u) con monitoreo visual de cupos y días restantes. |
| **RF20** | **Comprobantes Bancarios y Verificación por Admin** | Usuario / Admin | Envío de comprobantes de transferencia con captura/voucher bancario, y módulo administrativo para aprobar (acreditación automática) o rechazar con motivo. |
| **RF21** | **Registro con Cédula Verificada y Fotos de 2 Lados** | Visitante | Verificación algorítmica de cédula ecuatoriana (Módulo 10) con feedback en tiempo real y subida obligatoria de fotografías de ambos lados (frontal y posterior). |
| **RF22** | **Gestión de Datos Financieros y Código QR DeUna** | Usuario | Módulo en Navbar para configurar cuenta bancaria y subir la imagen del Código QR personal de DeUna para cobros instantáneos. |
| **RF23** | **Reloj de Pago de 15 Minutos y Validación por Prestador** | Prestatario / Prestador | Temporizador en vivo de 15 minutos para que el prestatario pague mediante el QR DeUna del dueño y suba el voucher; si expira se libera el producto. El prestador revisa el comprobante y valida el préstamo. |

---

## 3. Requerimientos No Funcionales (RNF)

| Código | Categoría | Requerimiento No Funcional |
| :---: | :--- | :--- |
| **RNF01** | Seguridad | Contraseñas cifradas con `bcrypt` (10 rondas de salt). Sanitización NoSQL. |
| **RNF02** | Autenticación | Rutas privadas protegidas con Bearer JWT tokens e interceptor HTTP. |
| **RNF03** | Indexación Geoespacial | Coordenadas GeoJSON con índice `2dsphere` en MongoDB. |
| **RNF04** | Tiempo Real (WebSockets) | Comunicación bidireccional de baja latencia con **Socket.IO** y reconexión automática. |
| **RNF05** | Usabilidad y Diseño | Paleta "Taller Maker", responsive mobile-first, microinteracciones. |
| **RNF06** | Reactividad Frontend | Angular Signals en modo Zoneless para detección inmediata de cambios. |
| **RNF07** | Arquitectura MVC | Separación estricta de Modelos, Vistas y Controladores en backend. |
| **RNF08** | Independencia Cartográfica | Mapas OpenStreetMap + Leaflet sin costos de licencias ni APIs de pago. |

