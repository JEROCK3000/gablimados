# Reporte de Diagnóstico y Corrección de Fallos (28 de Junio de 2026)

Este documento actúa como un reporte de auditoría sobre los dos últimos fallos identificados en el sistema y las medidas correctivas que se aplicaron.

---

## 1. Fallo de Hidratación en el Navegador (Hydration Mismatch)

### Síntoma
La consola del navegador mostraba el siguiente error:
`Uncaught Error: Hydration failed because the server rendered text didn't match the client.`
- **Valor renderizado en Servidor**: `6/28/2026` (Formato norteamericano/default de Node).
- **Valor esperado en Cliente**: `28/6/2026` (Formato local del navegador del usuario).

### Causa Raíz
En `KanbanBoard.tsx` se realizaba la conversión de la fecha directamente en el navegador con:
`{new Date(pedido.fecha).toLocaleDateString()}`
Al no coincidir la configuración regional (locale) del servidor de Node con la configuración regional del navegador de Chrome del usuario, React detecta una discrepancia en el árbol de renderizado inicial (SSR vs. CSR) y fuerza una regeneración completa, lo que disminuye el rendimiento y lanza errores en la consola.

### Solución Implementada
- **Pre-formateo del lado del Servidor**: Movimos la lógica de conversión a la consulta del servidor en `src/app/(app)/pedidos/page.tsx`, utilizando la librería `date-fns` para formatear de forma fija la fecha como `dd/MM/yyyy` (`fecha: format(p.createdAt, 'dd/MM/yyyy')`).
- **Renderizado Estático**: En `KanbanBoard.tsx` se removió la conversión local y ahora se pinta directamente el string pre-formateado `{pedido.fecha}`. Esto elimina al 100% el error de hidratación.

---

## 2. Timeout / Lentitud del Servicio Web de Autorización del SRI

### Síntoma
Al hacer clic en "Emitir Factura SRI", aparecía una alerta de error:
`No se recibió respuesta de autorización del SRI (comprobante pendiente).`

### Causa Raíz
El SRI de Ecuador en ambiente de **Pruebas** (celcer) suele experimentar demoras de procesamiento severas. La lógica anterior enviaba el XML a Recepción, esperaba 2.5 segundos de forma estática y realizaba una única consulta de Autorización. Si en ese lapso de tiempo el SRI no había procesado aún el documento, la API del SRI devolvía una respuesta vacía (comprobante en cola/pendiente), haciendo que el sistema lanzara una excepción y el usuario pensara que la factura falló definitivamente.

### Solución Implementada
- **Ciclo de Reintentos (Polling)**: Implementamos un bucle en el servidor que realiza hasta 5 consultas de autorización consecutivas (cada 2 segundos) antes de rendirse. Esto da un margen de hasta 12.5 segundos para que los servidores del SRI respondan.
- **Estado PENDIENTE**: Si tras los 5 intentos el SRI sigue sin responder, la factura **no se marca como fallida**. Se guarda en la base de datos con el estado `PENDIENTE` y un mensaje informativo.
- **Consulta Previa Inteligente**: Al reintentar o hacer clic en "Consultar SRI", el servidor **primero realiza una consulta de autorización al SRI usando la clave de acceso anterior**. Si el SRI ya la autorizó en segundo plano, se actualiza la base de datos y se da por exitosa sin necesidad de volver a enviar o firmar un XML duplicado (lo que causaría error de clave de acceso registrada).
- **Control Visual en el Kanban**: Se agregó el estado `⏳ SRI Pendiente` a las tarjetas del tablero junto a un botón para volver a consultar el estado directamente.
