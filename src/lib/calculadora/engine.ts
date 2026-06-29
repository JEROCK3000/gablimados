// ─── Motor de Cálculo de Sublimación ─────────────────────────────────────────

export interface InputCalculo {
  // Insumo / producto en blanco
  costoInsumo: number        // precio del producto en blanco
  costoPapel: number         // costo del papel transfer usado
  
  // Tinta (costo total de tinta por pieza)
  mlTintaCian: number
  mlTintaMagenta: number
  mlTintaAmarillo: number
  mlTintaNegro: number
  precioPorMlTinta: number   // precio promedio por ml de tinta
  
  // Electricidad
  wattsPrensadora: number    // consumo en watts
  tiempoPresnadoSeg: number  // segundos de prensado
  costoKwh: number           // precio por kWh
  
  // Costos fijos proporcionales
  totalCostosFijos: number   // suma de todos los costos fijos mensuales
  piezasMes: number          // piezas que produce por mes (para dividir costo fijo)
  
  // Margen de ganancia deseado
  margen: number             // porcentaje (ej: 30 = 30%)
}

export interface ResultadoCalculo {
  // Desglose de costos
  costoInsumo: number
  costoPapel: number
  costoTinta: number
  costoElectrico: number
  costoFijoPieza: number
  costoOtros: number
  
  // Totales
  costoTotal: number
  precioMinimo: number
  precioSugerido: number
  gananciaPieza: number
  margenEfectivo: number
  
  // Métricas adicionales
  costoTintaDetalle: {
    cian: number
    magenta: number
    amarillo: number
    negro: number
  }
  porcentajeDesglose: {
    insumo: number
    papel: number
    tinta: number
    electrico: number
    fijos: number
  }
}

// ─── Función principal de cálculo ─────────────────────────────────────────────
export function calcularPrecio(input: InputCalculo): ResultadoCalculo {
  // Tinta por pieza
  const mlTotal = input.mlTintaCian + input.mlTintaMagenta + input.mlTintaAmarillo + input.mlTintaNegro
  const costoTinta = mlTotal * input.precioPorMlTinta
  
  const costoTintaDetalle = {
    cian:     input.mlTintaCian * input.precioPorMlTinta,
    magenta:  input.mlTintaMagenta * input.precioPorMlTinta,
    amarillo: input.mlTintaAmarillo * input.precioPorMlTinta,
    negro:    input.mlTintaNegro * input.precioPorMlTinta,
  }

  // Electricidad por pieza
  // Fórmula: (watts / 1000) * (segundos / 3600) * costo_kWh
  const horasPresando = input.tiempoPresnadoSeg / 3600
  const costoElectrico = (input.wattsPrensadora / 1000) * horasPresando * input.costoKwh

  // Costo fijo por pieza
  const costoFijoPieza = input.piezasMes > 0
    ? input.totalCostosFijos / input.piezasMes
    : 0

  // Costo total
  const costoTotal =
    input.costoInsumo +
    input.costoPapel +
    costoTinta +
    costoElectrico +
    costoFijoPieza

  // Precio mínimo = costo total (0% ganancia)
  const precioMinimo = costoTotal

  // Precio sugerido con margen
  // Fórmula: precio = costo / (1 - margen/100)
  const precioSugerido = input.margen < 100
    ? costoTotal / (1 - input.margen / 100)
    : costoTotal * 2

  const gananciaPieza = precioSugerido - costoTotal
  const margenEfectivo = costoTotal > 0
    ? ((precioSugerido - costoTotal) / precioSugerido) * 100
    : 0

  // Porcentajes de desglose
  const porcentajeDesglose = costoTotal > 0 ? {
    insumo:   (input.costoInsumo / costoTotal) * 100,
    papel:    (input.costoPapel / costoTotal) * 100,
    tinta:    (costoTinta / costoTotal) * 100,
    electrico: (costoElectrico / costoTotal) * 100,
    fijos:    (costoFijoPieza / costoTotal) * 100,
  } : { insumo: 0, papel: 0, tinta: 0, electrico: 0, fijos: 0 }

  return {
    costoInsumo: round(input.costoInsumo),
    costoPapel: round(input.costoPapel),
    costoTinta: round(costoTinta),
    costoElectrico: round(costoElectrico),
    costoFijoPieza: round(costoFijoPieza),
    costoOtros: 0,
    costoTotal: round(costoTotal),
    precioMinimo: round(precioMinimo),
    precioSugerido: round(precioSugerido),
    gananciaPieza: round(gananciaPieza),
    margenEfectivo: round(margenEfectivo),
    costoTintaDetalle: {
      cian:     round(costoTintaDetalle.cian),
      magenta:  round(costoTintaDetalle.magenta),
      amarillo: round(costoTintaDetalle.amarillo),
      negro:    round(costoTintaDetalle.negro),
    },
    porcentajeDesglose: {
      insumo:   round(porcentajeDesglose.insumo),
      papel:    round(porcentajeDesglose.papel),
      tinta:    round(porcentajeDesglose.tinta),
      electrico: round(porcentajeDesglose.electrico),
      fijos:    round(porcentajeDesglose.fijos),
    },
  }
}

function round(n: number, decimals = 2): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

// ─── Formatear como moneda ─────────────────────────────────────────────────────
export function formatMoneda(valor: number, simbolo = '$'): string {
  return `${simbolo}${valor.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}
