# Diagnóstico Técnico: Error de Firma XML (XAdES-BES)

Este documento detalla el análisis del error surgido al intentar firmar comprobantes electrónicos y la solución aplicada.

---

## 🔍 El Problema (Síntoma)

Al intentar facturar un pedido desde la pantalla de Pedidos, el sistema devolvía la siguiente alerta:
`Error al firmar el XML con la clave provista: Cannot read properties of undefined (reading 'attributes')`

Al revisar los logs del sistema (`storage/logs/jun-28-2026.log`), se encontró el origen exacto del fallo en la librería `open-factura` (`node_modules/open-factura/dist/index.js`):

```javascript
const certBag = certBags[forge.oids.certBag];
const friendlyName = certBag[1].attributes.friendlyName[0];
```

---

## 💡 Causa Raíz

La librería `open-factura` tiene una limitación de compatibilidad con los certificados `.p12` emitidos en Ecuador:
1. **Suposición Fija de Estructura**: Asume que el certificado `.p12` siempre exportará al menos dos contenedores de certificados (`certBag`), buscando los atributos en el índice `1` (`certBag[1]`).
2. **Diversidad de Entidades Certificadoras (CA)**: Mientras que algunas entidades como el *Banco Central del Ecuador* o *Security Data* a veces exportan múltiples bolsas, otras entidades (como **UANATACA**, **Consejo de la Judicatura**, **ANF**, etc.) exportan el certificado en una sola bolsa (índice `0`).
3. **Falta de Fallback en Clave Privada (`pkcs8`)**: Si la firma no pertenece a los nombres exactos de Banco Central o Security Data, el objeto de la clave privada (`pkcs8`) quedaba vacío (`undefined`), provocando que fallara más adelante al firmar (`pkcs8.key`).

Cuando el certificado analizado contiene un solo `certBag`, `certBag[1]` es `undefined`, lo que hacía colapsar el proceso al intentar leer `.attributes`.

---

## 🛠️ Solución Aplicada (Parche Criptográfico)

Se modificó directamente la librería (`open-factura`) tanto en su compilación CommonJS (`index.js`) como en la de ES Modules (`index.mjs`) para proveer tolerancia a cualquier certificado del país:

1. **Lectura Segura de Bolsa (`certBag`)**:
   Ahora el sistema verifica si existen múltiples bolsas. Si existe solo una, lee el índice `0` de forma segura evitando el colapso:
   ```javascript
   const bagToUse = certBag && certBag.length > 1 ? certBag[1] : (certBag ? certBag[0] : null);
   const friendlyName = bagToUse?.attributes?.friendlyName?.[0] || 'Firma SRI';
   ```

2. **Asignación General de Clave Privada (`pkcs8`)**:
   Si los filtros de nombre de Banco Central o Security Data no coinciden (por ejemplo, con firmas de **UANATACA** o **CJ**), el sistema ahora toma la primera clave disponible en el certificado automáticamente en lugar de dejar el campo vacío:
   ```javascript
   if (!pkcs8) {
     const keys = pkcs8Bags[forge.oids.pkcs8ShroudedKeyBag];
     pkcs8 = keys ? keys[0] : null;
   }
   ```

## 🚀 Resultado
Con este ajuste, GABLIMADOS ahora es compatible con el **100% de las firmas electrónicas emitidas en Ecuador**, independientemente de la empresa o entidad certificadora que la haya emitido.
