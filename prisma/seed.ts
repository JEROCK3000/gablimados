import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de GABLIMADOS...')

  // ─── Usuario admin ─────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('gablimados2024', 12)

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@gablimados.com' },
    update: {},
    create: {
      nombre: 'Administrador GABLIMADOS',
      email: 'admin@gablimados.com',
      password: passwordHash,
      rol: 'ADMIN',
      activo: true,
    },
  })
  console.log('✅ Usuario admin creado:', admin.email)

  // ─── Categorías ───────────────────────────────────────────────────────────
  const categorias = [
    { nombre: 'Textil', icono: '👕', color: '#5cb830', orden: 1 },
    { nombre: 'Cerámica', icono: '☕', color: '#8b6bc4', orden: 2 },
    { nombre: 'Gorras', icono: '🧢', color: '#d4a520', orden: 3 },
    { nombre: 'Rígidos', icono: '📋', color: '#3b82f6', orden: 4 },
    { nombre: 'Madera', icono: '🪵', color: '#92400e', orden: 5 },
    { nombre: 'Metales', icono: '🔩', color: '#6b7280', orden: 6 },
    { nombre: 'Fundas', icono: '📱', color: '#ec4899', orden: 7 },
    { nombre: 'Otros', icono: '📦', color: '#9ca3af', orden: 8 },
  ]

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    })
  }
  console.log('✅ Categorías creadas:', categorias.length)

  // ─── Base de datos tiempos y temperaturas ─────────────────────────────────
  const productos_sublimables = [
    // Textil
    { nombre: 'Camiseta básica (100% poliéster)', categoria: 'Textil', tempC: 180, tempF: 356, tiempoSeg: 45, presion: 'MEDIA', notas: 'Proteger con papel de horno' },
    { nombre: 'Camiseta algodón-poliéster 50/50', categoria: 'Textil', tempC: 185, tempF: 365, tiempoSeg: 55, presion: 'MEDIA', notas: 'El algodón no sublima, resultado desaturado' },
    { nombre: 'Camiseta manga larga poliéster', categoria: 'Textil', tempC: 180, tempF: 356, tiempoSeg: 50, presion: 'MEDIA', notas: null },
    { nombre: 'Sudadera/hoodie sublimable', categoria: 'Textil', tempC: 185, tempF: 365, tiempoSeg: 60, presion: 'MEDIA', notas: 'Mayor tiempo por grosor del material' },
    { nombre: 'Polo sublimable', categoria: 'Textil', tempC: 180, tempF: 356, tiempoSeg: 45, presion: 'MEDIA', notas: null },
    { nombre: 'Delantal de cocina sublimable', categoria: 'Textil', tempC: 180, tempF: 356, tiempoSeg: 50, presion: 'MEDIA', notas: null },
    { nombre: 'Bolsa tela sublimable', categoria: 'Textil', tempC: 185, tempF: 365, tiempoSeg: 45, presion: 'MEDIA', notas: null },
    { nombre: 'Calcetines sublimables', categoria: 'Textil', tempC: 190, tempF: 374, tiempoSeg: 50, presion: 'ALTA', notas: 'Usar accesorio específico para calcetines' },
    { nombre: 'Medias sublimables', categoria: 'Textil', tempC: 185, tempF: 365, tiempoSeg: 45, presion: 'MEDIA', notas: null },
    { nombre: 'Shorts/bermudas sublimables', categoria: 'Textil', tempC: 180, tempF: 356, tiempoSeg: 45, presion: 'MEDIA', notas: null },
    { nombre: 'Leggings sublimables', categoria: 'Textil', tempC: 185, tempF: 365, tiempoSeg: 55, presion: 'MEDIA', notas: null },
    { nombre: 'Cojín (funda de tela)', categoria: 'Textil', tempC: 185, tempF: 365, tiempoSeg: 50, presion: 'MEDIA', notas: null },
    { nombre: 'Pañuelo sublimable', categoria: 'Textil', tempC: 180, tempF: 356, tiempoSeg: 40, presion: 'MEDIA', notas: null },
    { nombre: 'Gorro polar sublimable', categoria: 'Textil', tempC: 190, tempF: 374, tiempoSeg: 55, presion: 'ALTA', notas: 'Usar accesorio de gorro' },
    { nombre: 'Bufanda sublimable', categoria: 'Textil', tempC: 185, tempF: 365, tiempoSeg: 45, presion: 'MEDIA', notas: null },

    // Cerámica
    { nombre: 'Taza blanca cerámica 11oz', categoria: 'Cerámica', tempC: 190, tempF: 374, tiempoSeg: 210, presion: 'ALTA', notas: 'Usar prensa cilíndrica o horno de tazas' },
    { nombre: 'Taza blanca cerámica 15oz', categoria: 'Cerámica', tempC: 190, tempF: 374, tiempoSeg: 240, presion: 'ALTA', notas: 'Mayor tiempo por volumen' },
    { nombre: 'Taza mágica (color cambia)', categoria: 'Cerámica', tempC: 195, tempF: 383, tiempoSeg: 240, presion: 'ALTA', notas: 'Usar ligeramente menos temperatura para mejor contraste' },
    { nombre: 'Taza en caja de regalo', categoria: 'Cerámica', tempC: 190, tempF: 374, tiempoSeg: 210, presion: 'ALTA', notas: null },
    { nombre: 'Plato cerámico', categoria: 'Cerámica', tempC: 200, tempF: 392, tiempoSeg: 360, presion: 'ALTA', notas: 'Usar prensa plana con accesorio o horno' },
    { nombre: 'Azulejo cerámico 15x15', categoria: 'Cerámica', tempC: 200, tempF: 392, tiempoSeg: 360, presion: 'ALTA', notas: 'Usar cinta resistente al calor' },
    { nombre: 'Azulejo cerámico 10x10', categoria: 'Cerámica', tempC: 200, tempF: 392, tiempoSeg: 300, presion: 'ALTA', notas: null },
    { nombre: 'Tazón de cerámica', categoria: 'Cerámica', tempC: 190, tempF: 374, tiempoSeg: 250, presion: 'ALTA', notas: null },
    { nombre: 'Taza animal print', categoria: 'Cerámica', tempC: 190, tempF: 374, tiempoSeg: 220, presion: 'ALTA', notas: null },

    // Gorras
    { nombre: 'Gorra béisbol frente plano', categoria: 'Gorras', tempC: 180, tempF: 356, tiempoSeg: 40, presion: 'ALTA', notas: 'Usar prensa específica para gorras' },
    { nombre: 'Gorra 5 paneles frente plano', categoria: 'Gorras', tempC: 180, tempF: 356, tiempoSeg: 45, presion: 'ALTA', notas: null },
    { nombre: 'Gorra trucker sublimable', categoria: 'Gorras', tempC: 185, tempF: 365, tiempoSeg: 45, presion: 'ALTA', notas: 'Solo paneles sublimables, malla no sublima' },
    { nombre: 'Gorra snapback sublimable', categoria: 'Gorras', tempC: 180, tempF: 356, tiempoSeg: 40, presion: 'ALTA', notas: null },

    // Rígidos
    { nombre: 'Mousepad sublimable', categoria: 'Rígidos', tempC: 185, tempF: 365, tiempoSeg: 45, presion: 'MEDIA', notas: 'Superficie de neopreno' },
    { nombre: 'Mousepad XL (desk pad)', categoria: 'Rígidos', tempC: 185, tempF: 365, tiempoSeg: 60, presion: 'MEDIA', notas: 'Requiere prensa grande' },
    { nombre: 'Placa de aluminio', categoria: 'Rígidos', tempC: 210, tempF: 410, tiempoSeg: 90, presion: 'ALTA', notas: 'Temperatura alta, verificar acabado' },
    { nombre: 'Placa de aluminio brillante', categoria: 'Rígidos', tempC: 205, tempF: 401, tiempoSeg: 75, presion: 'ALTA', notas: null },
    { nombre: 'Placa acero inoxidable', categoria: 'Rígidos', tempC: 220, tempF: 428, tiempoSeg: 120, presion: 'ALTA', notas: 'Muy alta temperatura' },
    { nombre: 'Cubierta para laptop (skin)', categoria: 'Rígidos', tempC: 185, tempF: 365, tiempoSeg: 50, presion: 'MEDIA', notas: null },
    { nombre: 'Tapete de baño sublimable', categoria: 'Rígidos', tempC: 185, tempF: 365, tiempoSeg: 60, presion: 'MEDIA', notas: null },
    { nombre: 'Puzzle sublimable', categoria: 'Rígidos', tempC: 200, tempF: 392, tiempoSeg: 90, presion: 'ALTA', notas: 'Temperatura y tiempo varían por tamaño' },
    { nombre: 'Lienzo imprimible MDF', categoria: 'Rígidos', tempC: 200, tempF: 392, tiempoSeg: 120, presion: 'ALTA', notas: 'Usar cinta aluminizada para fijar papel' },
    { nombre: 'Porta retrato sublimable', categoria: 'Rígidos', tempC: 200, tempF: 392, tiempoSeg: 100, presion: 'ALTA', notas: null },
    { nombre: 'Imán rectangular sublimable', categoria: 'Rígidos', tempC: 190, tempF: 374, tiempoSeg: 60, presion: 'ALTA', notas: null },
    { nombre: 'Llavero sublimable acero', categoria: 'Rígidos', tempC: 200, tempF: 392, tiempoSeg: 75, presion: 'ALTA', notas: null },
    { nombre: 'Llavero sublimable MDF', categoria: 'Rígidos', tempC: 195, tempF: 383, tiempoSeg: 60, presion: 'MEDIA', notas: null },
    { nombre: 'Botón prendedor sublimable', categoria: 'Rígidos', tempC: 190, tempF: 374, tiempoSeg: 60, presion: 'ALTA', notas: null },

    // Madera
    { nombre: 'Tabla de madera (corte láser)', categoria: 'Madera', tempC: 200, tempF: 392, tiempoSeg: 90, presion: 'ALTA', notas: 'Superficie debe estar recubierta' },
    { nombre: 'Porta vasos de madera', categoria: 'Madera', tempC: 200, tempF: 392, tiempoSeg: 80, presion: 'ALTA', notas: null },
    { nombre: 'Caja de madera sublimable', categoria: 'Madera', tempC: 205, tempF: 401, tiempoSeg: 90, presion: 'ALTA', notas: null },

    // Metales
    { nombre: 'Botella de aluminio', categoria: 'Metales', tempC: 210, tempF: 410, tiempoSeg: 120, presion: 'ALTA', notas: 'Usar horno o prensa cilíndrica' },
    { nombre: 'Termo de acero sublimable', categoria: 'Metales', tempC: 220, tempF: 428, tiempoSeg: 150, presion: 'ALTA', notas: 'Temperatura muy alta, precaución' },
    { nombre: 'Tarjeta de aluminio', categoria: 'Metales', tempC: 210, tempF: 410, tiempoSeg: 90, presion: 'ALTA', notas: null },
    { nombre: 'Plato de aluminio redondo', categoria: 'Metales', tempC: 205, tempF: 401, tiempoSeg: 90, presion: 'ALTA', notas: null },

    // Fundas
    { nombre: 'Funda iPhone (policarbonato)', categoria: 'Fundas', tempC: 175, tempF: 347, tiempoSeg: 90, presion: 'MEDIA', notas: 'Temperatura baja para evitar deformación' },
    { nombre: 'Funda Samsung (policarbonato)', categoria: 'Fundas', tempC: 175, tempF: 347, tiempoSeg: 90, presion: 'MEDIA', notas: null },
    { nombre: 'Funda universal 2D sublimable', categoria: 'Fundas', tempC: 180, tempF: 356, tiempoSeg: 90, presion: 'MEDIA', notas: null },
    { nombre: 'Funda 3D iPhone', categoria: 'Fundas', tempC: 180, tempF: 356, tiempoSeg: 180, presion: 'ALTA', notas: 'Usar prensa 3D específica' },
    { nombre: 'Funda tablet sublimable', categoria: 'Fundas', tempC: 180, tempF: 356, tiempoSeg: 90, presion: 'MEDIA', notas: null },

    // Otros
    { nombre: 'Paraguas sublimable', categoria: 'Otros', tempC: 200, tempF: 392, tiempoSeg: 45, presion: 'ALTA', notas: 'Usar accesorio específico para paraguas' },
    { nombre: 'Bandera o pendón sublimable', categoria: 'Otros', tempC: 185, tempF: 365, tiempoSeg: 50, presion: 'MEDIA', notas: null },
    { nombre: 'Casco de ciclista sublimable', categoria: 'Otros', tempC: 185, tempF: 365, tiempoSeg: 45, presion: 'MEDIA', notas: null },
    { nombre: 'Patineta (tabla)', categoria: 'Otros', tempC: 200, tempF: 392, tiempoSeg: 120, presion: 'ALTA', notas: null },
    { nombre: 'Almohadilla de asiento', categoria: 'Otros', tempC: 185, tempF: 365, tiempoSeg: 55, presion: 'MEDIA', notas: null },
    { nombre: 'Funda para almohada', categoria: 'Otros', tempC: 185, tempF: 365, tiempoSeg: 50, presion: 'MEDIA', notas: null },
    { nombre: 'Toalla de playa sublimable', categoria: 'Otros', tempC: 185, tempF: 365, tiempoSeg: 60, presion: 'MEDIA', notas: 'Resultado mejor en microfibra' },
    { nombre: 'Cuaderno/libreta sublimable', categoria: 'Otros', tempC: 195, tempF: 383, tiempoSeg: 60, presion: 'ALTA', notas: null },
  ]

  await prisma.productoSublimable.deleteMany()

  await prisma.productoSublimable.createMany({
    data: productos_sublimables,
    skipDuplicates: true,
  })
  console.log('✅ Productos sublimables creados:', productos_sublimables.length)

  // ─── Costos fijos de ejemplo ───────────────────────────────────────────────
  const ahora = new Date()
  await prisma.costoFijo.upsert({
    where: { mes_anio: { mes: ahora.getMonth() + 1, anio: ahora.getFullYear() } },
    update: {},
    create: {
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
      alquiler: 500,
      electricidad: 80,
      salarios: 0,
      internet: 30,
      agua: 15,
      transporte: 50,
      otros: 25,
      horasMes: 160,
      piezasMes: 200,
    },
  })
  console.log('✅ Costos fijos de ejemplo creados')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('📧 Email: admin@gablimados.com')
  console.log('🔑 Password: gablimados2024')
  console.log('⚠️  Cambia la contraseña en producción')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
