# Guía de cambios — Jrepuestos Sistema

---

## 1. Sistema de Permisos y Roles como módulos

### `backend/src/models/permisos.js`
**Qué:** Se agregaron dos campos nuevos al modelo: `isSystem` (boolean) y `moduleKey` (string).  
**Para qué:** Distinguir entre permisos del sistema (uno por cada módulo de la app, no eliminables) y permisos personalizados creados por el admin.

---

### `backend/src/controllers/permisosController.js`
**Qué:** Se reescribió completamente. Se definió la lista canónica `SYSTEM_MODULES` con los 16 módulos del sistema. Se agregaron dos endpoints nuevos: `POST /sync-modules` y `GET /system-modules`. Se protegió el DELETE para permisos del sistema (devuelve 403). Se agregó manejo de FK en DELETE (devuelve 409 si el permiso está asignado a un rol).  
**Para qué:** Que cada módulo de la app exista como un permiso en la BD, y que al crear un rol se puedan asignar esos módulos como permisos.

---

### `backend/src/routes/permisosRoutes.js`
**Qué:** Se registraron las rutas `GET /system-modules` y `POST /sync-modules`.  
**Para qué:** Exponer los nuevos endpoints del controlador.

---

### `backend/src/validators/permisosValidator.js` *(archivo nuevo)*
**Qué:** Funciones `validateCreatePermiso` y `validateUpdatePermiso`. Validan nombre (2-50 chars, solo letras/números/espacios/guiones), descripción (máx 200 chars). El update respeta si el permiso es del sistema (no valida nombre).  
**Para qué:** Centralizar las reglas de validación del módulo de permisos en el backend.

---

### `backend/src/controllers/rolesController.js`
**Qué:** Se mejoró `deleteRoles` para capturar `SequelizeForeignKeyConstraintError` y el código PostgreSQL `23503`, devolviendo 409 con mensaje descriptivo en lugar de 500 genérico.  
**Para qué:** Cuando un rol tiene usuarios asignados y se intenta eliminar, el usuario ve un mensaje claro en lugar de un error genérico.

---

### `backend/seed.js`
**Qué:** Se reescribió. Ahora:
1. Sincroniza todos los permisos de módulos del sistema
2. Crea el rol Administrador con todos esos permisos
3. Crea el usuario `admin@example.com / 123456`
4. Crea el rol Superadmin con todos los permisos
5. Crea el usuario `superadmin@jrepuestos.com / Super@2024`

**Para qué:** Tener datos iniciales listos al arrancar el proyecto por primera vez.  
**Cómo ejecutar:** `cd backend && node seed.js`

---

## 2. Autenticación

### `backend/src/validators/authValidator.js` *(archivo nuevo)*
**Qué:** Funciones puras de validación: `validateLoginBody`, `validateRegisterBody`, `validateResetPasswordBody`, `validateVerifyCodeBody`, `validateEmail`, `validatePassword`. La contraseña requiere 8+ chars, 1 mayúscula, 2 números, 1 especial.  
**Para qué:** Centralizar todas las reglas de validación de auth. El controlador solo llama una función y si hay errores responde 400 con array de mensajes.

---

### `backend/src/controllers/authController.js`
**Qué:** Se integraron los validadores en todos los endpoints. El login ahora hace JOIN con la tabla `roles` para obtener el nombre del rol y devuelve `userType: 'client'` si el rol se llama `'Cliente'`, o `'admin'` para cualquier otro rol (Administrador, Superadmin, etc.).  
**Para qué:** Que el frontend no dependa de `rolesId === 1` para saber si es admin. Ahora se basa en el nombre del rol, lo que soporta múltiples roles de admin.

---

### `backend/src/models/index.js`
**Qué:** Se agregó `Usuarios.belongsTo(Roles, { as: 'rol' })` y `Roles.hasMany(Usuarios, { as: 'usuarios' })`.  
**Para qué:** Permitir el JOIN en el login para obtener el nombre del rol del usuario.

---

### `frontend/src/features/auth/services/authService.ts`
**Qué:** El tipo del payload de `register` se actualizó para incluir todos los campos reales: `nombres`, `apellidos`, `razon_social`, `tipo_documento`, `numero_documento`, `telefono`, `ciudad`, `direccion`.  
**Para qué:** El registro enviaba solo email/password antes. Ahora envía todos los datos del cliente al backend.

---

### `frontend/src/features/auth/pages/LoginPage.tsx`
**Qué:** Se reescribió la lógica de validación del formulario de registro. Se crearon funciones puras fuera del componente: `validateNameField`, `validateDocumentNumber`, `validatePhone`, `validateEmail`, `validateCity`, `validateAddress`, `validatePassword`, `validateConfirmPassword`. Se agregó estado `fieldErrors` con un mensaje por campo. Cada `Input` tiene `onBlur` que valida al salir del foco, `onChange` que limpia el error, borde rojo si hay error y mensaje debajo. El `handleRegister` corre todas las validaciones al submit. El login usa `userType` que viene del backend.  
**Para qué:** Feedback inmediato por campo en lugar de toasts genéricos. Validaciones de espacios al inicio/fin, solo letras, longitudes mínimas/máximas.

---

## 3. Usuarios

### `backend/src/validators/usuariosValidator.js` *(archivo nuevo)*
**Qué:** `validateCreateUsuario` (email válido, contraseña mín 6 chars, rol numérico positivo) y `validateUpdateUsuario` (mismos campos pero opcionales).  
**Para qué:** Validación centralizada del CRUD de usuarios.

---

### `backend/src/controllers/usuariosController.js`
**Qué:** Se integraron los validadores. Se agregó verificación de email duplicado en crear (con `findOne`) y en actualizar (excluyendo el propio usuario). Se mejoró `deleteUsuarios` para capturar FK violations y devolver 409.  
**Para qué:** Evitar usuarios duplicados y dar mensajes claros cuando no se puede eliminar.

---

### `frontend/src/features/users/pages/UserManagement.tsx`
**Qué:** Reconstruido completamente. Incluye:
- Banner global de notificaciones (igual que Clientes)
- Banner de fila para usuarios inactivos
- Dialog sin `DialogTrigger`
- `AlertDialogDescription asChild` para evitar `<p>` anidado
- Validación de email en tiempo real con borde rojo
- Indicador de fortaleza de contraseña al crear
- Campo de contraseña opcional en edición con toggle show/hide
- Filtro de estado activo/inactivo
- Tabla con ADN visual de Clientes (`bg-blue-900` en thead, `hover:bg-blue-50`)
- Paginación

**Para qué:** Módulo funcional completo con la misma calidad visual y UX que el módulo de Clientes.

---

## 4. Módulo de Permisos — Frontend

### `frontend/src/features/permisos/services/permisosService.ts`
**Qué:** Se actualizó el tipo `Permiso` para incluir `isSystem` y `moduleKey`. Se agregó la función `syncSystemModules()`.  
**Para qué:** El frontend puede saber si un permiso es del sistema y llamar al endpoint de sincronización.

---

### `frontend/src/features/permisos/pages/PermissionManagement.tsx`
**Qué:** Reconstruido. Incluye:
- Dialog sin `DialogTrigger` (fix warning de refs)
- `AlertDialogDescription asChild` (fix `<p>` anidado)
- Botón "Sincronizar Módulos"
- Filtro por tipo (Todos/Sistema/Personalizados) con `<select>` nativo
- Badge "Sistema" con candado en permisos del sistema
- Botón eliminar deshabilitado para permisos del sistema
- Contador de caracteres en el formulario
- Paginación
- Tabla con ADN de Clientes

**Para qué:** Módulo funcional con UX consistente y sin los 3 bugs de React reportados.

---

## 5. Módulo de Roles — Frontend

### `frontend/src/features/roles/services/rolesService.ts`
**Qué:** Se agregaron `getRolPermisos()` y `setRolPermisos()`.  
**Para qué:** Cargar y guardar los permisos asignados a un rol.

---

### `frontend/src/features/roles/pages/RoleManagement.tsx`
**Qué:** Reconstruido. Incluye:
- Fix del bucle infinito: se reemplazó `<Checkbox>` de Radix por `<input type="checkbox">` nativo dentro de `<label>`, y se agregó `useRef<number[]>` para trackear permisos sin depender del estado de React en el callback
- `useCallback` en todos los handlers
- Dialog sin `DialogTrigger`
- `AlertDialogDescription asChild`
- Tabla con ADN de Clientes
- Modal de detalle que carga permisos reales del backend

**Para qué:** El `Checkbox` de Radix disparaba `onCheckedChange` en cada re-render causando el bucle infinito. El `useRef` rompe ese ciclo.

---

## 6. Unificación visual (ADN de Clientes)

### Archivos afectados:
- `frontend/src/features/roles/pages/RoleManagement.tsx`
- `frontend/src/features/permisos/pages/PermissionManagement.tsx`
- `frontend/src/features/users/pages/UserManagement.tsx`

**Qué:** Se aplicó el mismo sistema visual del módulo de Clientes:
- `thead bg-blue-900` con texto blanco
- Filas con `border-b border-blue-100` y `hover:bg-blue-50`
- Barra de búsqueda con ícono `<Search>` posicionado absolutamente y `pl-10` en el input
- Filtro como `<select>` nativo con `border border-gray-200 rounded-md`
- `<Card><CardContent>` como contenedores
- Botones de acción con colores semánticos (azul para ver/editar, rojo para eliminar)
- Título `text-blue-900 font-bold`, subtítulo `text-blue-800`

**Para qué:** Consistencia visual entre todos los módulos de gestión.

---

## 7. Landing Page y flujo del cliente

### `frontend/src/features/dashboard/pages/LandingPage.tsx`
**Qué:** El botón de navegación en navbar (desktop y móvil) cambió de "Ir al Sistema" / "Ver Productos" a **"Ver Sistema"** cuando hay función de navegación. La condición simplificó de `userType && onGoToSystem` a solo `onGoToSystem`.  
**Para qué:** Que el cliente recién registrado pueda entrar al sistema desde la landing con un botón claro.

---

### `frontend/src/App.tsx`
**Qué:** Múltiples cambios:
- `onGoToSystem` siempre recibe `toggleLandingPage` (antes era `undefined` para clientes)
- El guard de landing cambió de `showLandingPage || userType === 'client'` a solo `showLandingPage` — el cliente ya puede ver el sistema
- `handleLogin` setea `currentModule = 'client-purchases'` para clientes (entran directo a Mis Compras)
- Módulos del cliente: Dashboard, **Productos**, Mis Compras (`client-purchases`), Mis Pedidos (`client-orders`)
- `renderModule` mapea `client-purchases` → `SalesModule clientMode` y `client-orders` → `OrderModule clientMode`
- `getModuleTitle` incluye los títulos de los nuevos módulos de cliente

**Para qué:** Flujo completo del cliente: login → sistema → ve sus módulos → puede crear/editar pero no eliminar.

---

## 8. Restricciones del cliente en módulos

### `frontend/src/features/sales/pages/SalesModule.tsx`
**Qué:** Se agregó prop `clientMode?: boolean`. Cuando es `true`:
- El botón "Anular venta" no se renderiza
- El título cambia a "Mis Compras"
- El subtítulo cambia a "Historial de tus compras"

**Para qué:** El cliente puede ver y crear ventas pero no anularlas.

---

### `frontend/src/features/orders/pages/OrderModule.tsx`
**Qué:** Se agregó prop `clientMode?: boolean`. Cuando es `true`:
- El botón "Cancelar pedido" no se renderiza
- El título cambia a "Mis Pedidos"
- El subtítulo cambia a "Historial de tus pedidos"

**Para qué:** El cliente puede ver y crear pedidos pero no cancelarlos.

---

## 9. Corrección de bugs de React

Tres bugs corregidos en Roles, Permisos y Usuarios:

| Bug | Causa | Solución |
|-----|-------|----------|
| `Maximum update depth exceeded` | `Checkbox` de Radix disparaba `onCheckedChange` en cada re-render | `<input type="checkbox">` nativo + `useRef` para permisos |
| `Function components cannot be given refs` | `DialogTrigger` dentro de `Dialog` con `open` controlado | Botón fuera del `Dialog`, sin `DialogTrigger` |
| `<p> cannot appear as descendant of <p>` | `<div>` dentro de `AlertDialogDescription` que renderiza `<p>` | `AlertDialogDescription asChild` con `<div>` como hijo |

---

## 10. Credenciales del sistema

| Usuario | Contraseña | Rol | Acceso |
|---------|-----------|-----|--------|
| `admin@example.com` | `123456` | Administrador | Todos los módulos |
| `superadmin@jrepuestos.com` | `Super@2024` | Superadmin | Todos los módulos, sin restricciones |
| Cualquier registro desde la app | La que defina | Cliente | Dashboard, Productos, Mis Compras, Mis Pedidos |

> **Para crear las credenciales en la BD:** `cd backend && node seed.js`

---

## 11. Módulos disponibles por tipo de usuario

### Admin / Superadmin
Dashboard · Productos · Categorías de productos · Configuración (Usuarios, Roles, Permisos) · Clientes · Proveedores · Insumos · Compras de insumos · Ventas · Pedidos · Novedades · Producción (Empleados, Órdenes de Producción, Fichas Técnicas)

### Cliente
Dashboard · Productos · Mis Compras · Mis Pedidos

---

## 12. Endpoints nuevos del backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/permisos/system-modules` | Lista los 16 módulos del sistema |
| `POST` | `/api/permisos/sync-modules` | Crea en BD los permisos de módulos que no existan |
| `GET` | `/api/roles/:id/permisos` | Obtiene los permisos asignados a un rol |
| `PUT` | `/api/roles/:id/permisos` | Reemplaza los permisos de un rol (body: `{ permisosIds: [1,2,3] }`) |

Todos los endpoints están protegidos con `verifyToken` excepto los de auth.
