# Reportes en GABLIMADOS

Este documento detalla las librerías seleccionadas y los flujos implementados para la generación de reportes profesionales en el sistema.

## Librerías Utilizadas

### 1. Excel (xlsx)
- **Librería**: `exceljs`
- **Uso**: 
  - **Lista de Precios**: Exportación del catálogo completo de productos con costos, precios mínimos, sugeridos y márgenes de ganancia.
  - **Reporte General de Ventas**: Exportación del historial completo de pedidos con datos de clientes (RUC/cédula), estados de pedido, formas de pago, estados de facturación del SRI y desglose financiero de subtotales, descuentos, IVA y totales.
- **Estilos**: Incluye formatos de moneda, anchos de columnas específicos para legibilidad, diferenciación de cabeceras en color carbón/azul marino, y resaltado de estados del SRI con colores semánticos (verde para autorizado, naranja para pendiente y rojo para rechazado).

### 2. PDF
- **Librería**: `jsPDF` con `jspdf-autotable`
- **Uso**: 
  - **Reporte de Costos**: Detalle completo con costos fijos, análisis de márgenes y últimos cálculos.
  - **Representación Impresa de Documentos Electrónicos (RIDE)**: PDF oficial del SRI generado en caliente con el logotipo de la empresa, cabecera de datos del emisor libre de solapamientos (maxWidth: 45) y fecha de emisión.
- **Razón de Selección**: Se ejecuta directamente en el lado del cliente (navegador), eliminando el consumo de recursos de CPU en el servidor y permitiendo descargas instantáneas sin necesidad de almacenamiento temporal de archivos PDF.
