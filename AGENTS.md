# AGENTS.md

## Propósito

Este archivo define las reglas obligatorias que debe seguir cualquier agente de IA, asistente de código o desarrollador que trabaje dentro de este proyecto.

Debe leerse antes de crear, modificar, refactorizar, eliminar o documentar cualquier parte del sistema.

El objetivo es mantener consistencia técnica, arquitectónica, visual y documental en todas las implementaciones, evitando que la IA pierda contexto, use tecnologías no aprobadas o genere soluciones genéricas.

---

# 1. Principios generales

Todas las aplicaciones deben tratarse como productos SaaS profesionales, escalables, mantenibles y preparados para producción.

Cada implementación debe considerar:

- arquitectura SaaS
- multitenancy
- seguridad
- escalabilidad
- mantenibilidad
- experiencia de usuario profesional
- documentación continua
- trazabilidad mediante logs
- modo claro y oscuro
- diseño responsive
- posibilidad futura de PWA
- reportes profesionales
- separación entre usuario final, tenant admin y superadministrador

No se deben generar soluciones improvisadas, incompletas, visualmente pobres o con apariencia genérica típica de IA.

---

# 2. Stack obligatorio

## Frontend

Usar preferentemente:

- Next.js con App Router
- React
- TypeScript
- Tailwind CSS
- Server Components cuando aplique
- Client Components solo cuando sean necesarios
- Componentes reutilizables
- Diseño responsive
- Soporte completo para modo claro y oscuro

## Backend

Usar preferentemente:

- Server Actions
- Route Handlers
- Servicios internos organizados por dominio
- Validaciones estrictas
- Control de permisos
- Logs centralizados
- Documentación de cambios

No crear una API separada si no existe una justificación técnica real.

## Lenguaje

El lenguaje principal es:

```txt
TypeScript
```

No usar JavaScript plano en archivos nuevos salvo justificación técnica documentada.

---

# 3. Base de datos

## Permitido

Solo están permitidos:

- MariaDB
- MySQL

## Prohibido

No usar:

- PostgreSQL
- SQLite para producción
- MongoDB como base principal
- bases no relacionales como reemplazo del modelo principal sin aprobación explícita

## Regla estricta

PostgreSQL no debe ser sugerido, instalado, configurado ni usado.

Si una plantilla, librería, tutorial o código generado propone PostgreSQL, reemplazarlo por MariaDB o MySQL.

## ORM

Usar preferentemente:

- Prisma ORM

El diseño debe considerar:

- multitenancy
- auditoría
- roles
- permisos
- timestamps
- soft deletes cuando aplique
- integridad referencial
- índices correctos
- relaciones claras

---

# 4. SaaS y multitenancy

Toda aplicación debe asumirse como SaaS multitenant salvo indicación explícita contraria.

Debe existir separación lógica por tenant y un superadministrador global.

## Debe contemplar

- tenants
- usuarios
- roles
- permisos
- tenant settings
- auditoría
- logs
- planes o suscripciones si aplica
- módulos por tenant si aplica

## Superadministrador

Debe existir un rol `superadmin` global capaz de orquestar la aplicación completa.

Puede gestionar:

- tenants
- usuarios globales
- planes
- configuraciones generales
- módulos activos
- auditoría
- métricas
- estado del sistema
- soporte operativo

## Seguridad multitenant

Toda consulta debe considerar `tenantId` cuando aplique.

No se permite que un usuario de un tenant acceda a información de otro tenant.

Toda operación sensible debe validar:

- usuario autenticado
- tenant activo
- rol
- permisos
- propiedad del recurso
- estado del tenant

---

# 5. Autenticación y autorización

La autenticación debe ser segura y controlada.

Se permite:

- cookies httpOnly
- JWT firmado de forma segura
- sesiones propias
- proveedores externos solo si el proyecto lo requiere

Las cookies de sesión deben ser:

- httpOnly
- secure en producción
- sameSite adecuado
- con expiración definida

Las contraseñas deben almacenarse solo con hash seguro.

Está prohibido guardar:

- contraseñas en texto plano
- tokens sensibles sin cifrar
- secretos en logs
- claves privadas en repositorio

Los permisos deben validarse en servidor, no solo en la UI.

---

# 6. UI, UX y estilos

Toda interfaz debe verse profesional, moderna y actual.

Debe cuidar:

- jerarquía visual
- espaciado
- tipografía
- botones
- tablas
- formularios
- tarjetas
- navegación
- estados hover/focus/disabled
- estados vacíos
- loaders
- mensajes de error y éxito

## Responsive obligatorio

Toda pantalla debe funcionar correctamente en:

- móvil
- tablet
- laptop
- desktop grande

No construir solo para escritorio dejando responsive para después.

## Modo claro y oscuro

Todo componente debe funcionar correctamente en:

- light mode
- dark mode

No aceptar componentes que se vean bien solo en un modo.

## Evitar

- diseños genéricos
- componentes sin estructura
- pantallas pobres
- colores sin criterio
- gradientes excesivos
- sombras exageradas
- formularios desordenados

## Regla UX obligatoria para modulos CRUD

En cualquier modulo con operaciones CRUD (crear, listar, editar, eliminar), se debe seguir este flujo base:

1. Primera vista: listado de registros existentes (con búsqueda/filtros si aplica).
2. Desde el listado: botón visible `+ Nuevo` / `Crear`.
3. Edición: debe abrirse en vista dedicada o modal dedicado por registro.
4. No mezclar creación y edición masiva dentro de la misma vista de listado.

Objetivo: reducir fricción operativa, evitar confusión del usuario y mantener consistencia funcional en todos los modulos del sistema.

---

# 7. PWA

Las aplicaciones deben diseñarse pensando en una posible evolución a PWA.

Cuando se implemente PWA, considerar:

- `manifest.json`
- iconos adecuados
- theme color
- background color
- service worker
- estrategia de caché
- soporte instalable
- comportamiento offline si aplica

La experiencia instalada debe sentirse como aplicación, no como web improvisada.

---

# 8. Reportes

Los reportes deben ser profesionales, ordenados y bien formateados.

## Formatos principales

- Excel `.xlsx`
- PDF profesional

## CSV

CSV no debe usarse como formato principal.

Solo puede usarse como formato auxiliar o técnico si el usuario lo solicita explícitamente.

## Excel

Los reportes Excel deben usar extensión:

```txt
.xlsx
```

Deben incluir cuando aplique:

- título
- subtítulo o contexto
- fecha de generación
- filtros aplicados
- encabezados claros
- anchos adecuados
- formato de moneda
- formato de fechas
- totales
- subtotales
- estilos en encabezados
- alineación correcta
- bordes suaves
- hojas separadas si aplica
- nombre de archivo claro y fechado

## PDF

Los reportes PDF deben incluir cuando aplique:

- encabezado
- logo o nombre del sistema
- título
- rango de fechas
- filtros aplicados
- tablas bien formateadas
- totales
- numeración de páginas
- fecha de generación
- pie de página
- orientación adecuada

## Librerías recomendadas

Excel:

- exceljs

PDF:

- jsPDF con autotable
- @react-pdf/renderer
- Puppeteer para reportes avanzados

La elección debe documentarse en `/docs/reports.md`.

---

# 9. Documentación obligatoria

Toda documentación debe estar en:

```txt
/docs
```

Todo cambio importante debe documentarse.

Documentar:

- nuevas funcionalidades
- arquitectura
- base de datos
- migraciones
- correcciones
- errores resueltos
- decisiones técnicas
- permisos
- reportes
- UI relevante
- integraciones
- despliegue

La documentación debe permitir que otra IA o desarrollador continúe el proyecto sin perder contexto.

---

# 10. Logs

Los logs deben almacenarse en:

```txt
/storage/logs
```

Formato de archivo por fecha:

```txt
may-25-2026.log
```

Registrar:

- errores
- warnings
- ejecuciones correctas importantes
- accesos no autorizados
- fallos de autenticación
- generación de reportes
- procesos automáticos
- fallos de base de datos
- eventos del superadministrador

Niveles:

- INFO
- WARN
- ERROR
- DEBUG solo en desarrollo
- SECURITY
- AUDIT

Formato recomendado:

```txt
[2026-05-25 14:32:10] [INFO] [tenant:acme] [user:42] Reporte XLSX generado correctamente: monthly-sales
```

Nunca registrar:

- passwords
- tokens
- JWT completos
- cookies
- claves API
- secretos
- variables sensibles
- tarjetas
- datos bancarios sensibles
- payloads privados completos

Sanitizar campos como:

```txt
password
token
secret
authorization
cookie
apiKey
accessToken
refreshToken
creditCard
cardNumber
cvv
```

---

# 11. Estructura recomendada

```txt
/
├─ app/
├─ components/
│  ├─ ui/
│  ├─ forms/
│  ├─ tables/
│  ├─ layout/
│  ├─ reports/
│  ├─ admin/
│  └─ tenant/
├─ lib/
│  ├─ auth/
│  ├─ db/
│  ├─ logs/
│  ├─ reports/
│  ├─ security/
│  ├─ validators/
│  └─ utils/
├─ modules/
├─ prisma/
├─ public/
├─ storage/
│  └─ logs/
├─ docs/
├─ AGENTS.md
├─ package.json
└─ README.md
```

---

# 12. Reglas para agentes IA

Antes de modificar código:

1. Leer este archivo.
2. Revisar `/docs`.
3. Entender el módulo afectado.
4. Identificar impacto en base de datos, permisos, UI, logs y documentación.
5. Evitar cambios innecesarios.
6. Mantener el estilo existente.

Después de modificar código:

1. Actualizar `/docs` si aplica.
2. Implementar logs si aplica.
3. Mantener el stack.
4. No introducir PostgreSQL.
5. No usar CSV como reporte principal.
6. Validar responsive.
7. Validar light/dark mode.
8. Considerar multitenancy.
9. Considerar superadmin si aplica.

## Prohibido

El agente no debe:

- cambiar el stack sin documentarlo
- sugerir PostgreSQL
- usar CSV como reemplazo de Excel
- ignorar `tenantId` en consultas multitenant
- crear pantallas genéricas o pobres
- eliminar documentación sin motivo
- omitir logs en procesos importantes
- registrar información sensible
- mezclar superadmin con usuario final sin permisos claros
- crear JavaScript plano si el proyecto usa TypeScript

---

# 13. Checklist obligatorio por tarea

```txt
[ ] Respeta el stack definido
[ ] No introduce PostgreSQL
[ ] Usa MariaDB/MySQL si toca base de datos
[ ] Considera SaaS/multitenant
[ ] Valida permisos y roles
[ ] Considera superadministrador si aplica
[ ] UI profesional, moderna y no genérica
[ ] Responsive en móvil, tablet y escritorio
[ ] Compatible con modo claro y oscuro
[ ] Reportes en .xlsx si son Excel
[ ] PDF profesional si aplica
[ ] No usa CSV como formato principal
[ ] Registra logs relevantes
[ ] No registra información sensible
[ ] Documenta cambios en /docs
[ ] Actualiza changelog si aplica
[ ] Maneja errores correctamente
[ ] No expone detalles internos al usuario
[ ] Mantiene TypeScript estricto
[ ] Valida entradas externas
[ ] Considera performance
[ ] Considera accesibilidad básica
```

---

# 14. Regla final

Este proyecto debe tratarse como un producto SaaS profesional.

Cada cambio debe mejorar o mantener:

- calidad técnica
- seguridad
- claridad
- escalabilidad
- experiencia de usuario
- documentación
- trazabilidad
- consistencia visual
