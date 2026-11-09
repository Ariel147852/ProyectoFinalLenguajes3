import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Tool } from '../models/Tool';
import { Loan } from '../models/Loan';
import { ENV } from '../config/env';

// Puntos geográficos distribuidos en diferentes barrios de la comunidad
const ubicacionesBarrios = [
  { zona: 'Sector La Floresta', lng: -78.4871, lat: -0.2032 },
  { zona: 'Sector Iñaquito / La Carolina', lng: -78.4852, lat: -0.1785 },
  { zona: 'Sector Centro Histórico', lng: -78.5023, lat: -0.2104 },
  { zona: 'Sector Cumbayá', lng: -78.4312, lat: -0.2045 },
  { zona: 'Sector Villaflora (Sur)', lng: -78.5201, lat: -0.2451 },
  { zona: 'Sector Monteserrín', lng: -78.4682, lat: -0.1610 },
  { zona: 'Sector Carcelén (Norte)', lng: -78.4725, lat: -0.1089 }
];

export const seedDatabase = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('[Seeder] Conectado exitosamente a MongoDB...');

    // 1. Limpieza de datos antiguos
    await Promise.all([
      User.deleteMany({}),
      Tool.deleteMany({}),
      Loan.deleteMany({})
    ]);
    console.log('[Seeder] Colecciones users, tools y loans limpiadas.');

    // 2. Cifrado de contraseñas de prueba
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('AdminPassword123!', salt);
    const userPass = await bcrypt.hash('UserPassword123!', salt);

    // 3. Crear Usuarios de la Comunidad
    const admin = await User.create({
      nombre: 'Administrador General',
      email: 'admin@toollibrary.org',
      passwordHash: adminPass,
      rol: 'admin',
      telefono: '0991112233',
      direccionZona: ubicacionesBarrios[1].zona
    });

    const carlos = await User.create({
      nombre: 'Carlos Mendoza',
      email: 'carlos@vecino.org',
      passwordHash: userPass,
      rol: 'user',
      telefono: '0984445566',
      direccionZona: ubicacionesBarrios[0].zona,
      reputacionPromedio: 4.9
    });

    const lucia = await User.create({
      nombre: 'Lucía Benítez',
      email: 'lucia@vecina.org',
      passwordHash: userPass,
      rol: 'user',
      telefono: '0977778899',
      direccionZona: ubicacionesBarrios[1].zona,
      reputacionPromedio: 5.0
    });

    const marcos = await User.create({
      nombre: 'Marcos Andrade',
      email: 'marcos@vecino.org',
      passwordHash: userPass,
      rol: 'user',
      telefono: '0963334455',
      direccionZona: ubicacionesBarrios[3].zona,
      reputacionPromedio: 4.8
    });

    const elena = await User.create({
      nombre: 'Elena Ramos',
      email: 'elena@vecina.org',
      passwordHash: userPass,
      rol: 'user',
      telefono: '0952221100',
      direccionZona: ubicacionesBarrios[4].zona,
      reputacionPromedio: 4.95
    });

    console.log('[Seeder] 5 Usuarios creados con credenciales seguras.');

    // 4. Catálogo Enriquecido de 16 Herramientas Comunitarias
    const toolsData = [
      // --- Herramientas Eléctricas ---
      {
        propietarioId: carlos._id,
        nombre: 'Taladro Percutor Bosch 650W con maletín y brocas',
        descripcion: 'Taladro reversible con selector de percusión para mampostería, madera y metal. Incluye set de 15 brocas y tope de profundidad.',
        categoria: 'electricas',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[0].lng, ubicacionesBarrios[0].lat] },
        direccionZona: ubicacionesBarrios[0].zona,
        maxDiasPrestamo: 5
      },
      {
        propietarioId: carlos._id,
        nombre: 'Sierra Circular DeWalt 7-1/4" 1800W',
        descripcion: 'Ideal para cortes rectos y longitudinales en tableros de madera contrachapada, melamina y vigas. Incluye guía paralela.',
        categoria: 'electricas',
        estadoFisico: 'bueno',
        imagenes: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[0].lng, ubicacionesBarrios[0].lat] },
        direccionZona: ubicacionesBarrios[0].zona,
        maxDiasPrestamo: 3
      },
      {
        propietarioId: marcos._id,
        nombre: 'Amoladora Angular Makita 4-1/2" 840W',
        descripcion: 'Esmeriladora potente para corte de metales, desbaste de soldadura y corte de baldosas cerámicas. Incluye guarda de seguridad y llave.',
        categoria: 'electricas',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[3].lng, ubicacionesBarrios[3].lat] },
        direccionZona: ubicacionesBarrios[3].zona,
        maxDiasPrestamo: 4
      },
      {
        propietarioId: elena._id,
        nombre: 'Lijadora Orbital Stanley 240W con recolector',
        descripcion: 'Lijadora de acabado fino para restauración de muebles de madera y puertas. Con bolsa recolectora de polvo y pinzas de sujeción rápida.',
        categoria: 'electricas',
        estadoFisico: 'bueno',
        imagenes: ['https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[4].lng, ubicacionesBarrios[4].lat] },
        direccionZona: ubicacionesBarrios[4].zona,
        maxDiasPrestamo: 4
      },

      // --- Jardinería ---
      {
        propietarioId: lucia._id,
        nombre: 'Cortadora de Césped Eléctrica Black+Decker 1200W',
        descripcion: 'Cortacésped ligero y maniobrable con ancho de corte de 32 cm, ajuste de altura de 3 niveles y bolsa recolectora de 35 litros.',
        categoria: 'jardineria',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1592417817098-8f3d69106095?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[1].lng, ubicacionesBarrios[1].lat] },
        direccionZona: ubicacionesBarrios[1].zona,
        maxDiasPrestamo: 2
      },
      {
        propietarioId: marcos._id,
        nombre: 'Hidrolavadora Kärcher K3 1600 PSI',
        descripcion: 'Máquina de agua a alta presión perfecta para lavar patios, adoquines, fachadas, terrazas y vehículos. Incluye manguera de 6m y lanza rotativa.',
        categoria: 'jardineria',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[3].lng, ubicacionesBarrios[3].lat] },
        direccionZona: ubicacionesBarrios[3].zona,
        maxDiasPrestamo: 3
      },
      {
        propietarioId: lucia._id,
        nombre: 'Cortasetos Telescópico a Batería Stihl',
        descripcion: 'Tijera cortasetos inalámbrica para podar arbustos y cercos vivos altos sin necesidad de cables peligrosos.',
        categoria: 'jardineria',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[1].lng, ubicacionesBarrios[1].lat] },
        direccionZona: ubicacionesBarrios[1].zona,
        maxDiasPrestamo: 3
      },

      // --- Herramientas Manuales ---
      {
        propietarioId: carlos._id,
        nombre: 'Maletín de Herramientas de Mano Completo (108 piezas)',
        descripcion: 'Juego exhaustivo con martillo de uña, llaves hexagonales allen, destornilladores magnéticos planos y philips, cinta métrica de 5m y alicate.',
        categoria: 'manuales',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[0].lng, ubicacionesBarrios[0].lat] },
        direccionZona: ubicacionesBarrios[0].zona,
        maxDiasPrestamo: 7
      },
      {
        propietarioId: elena._id,
        nombre: 'Juego de Llaves de Tubo y Carraca de 1/2" y 1/4"',
        descripcion: 'Juego de dados milimétricos en cromo vanadio de alta resistencia para mecánica doméstica, bicicletas y armado de estructuras.',
        categoria: 'manuales',
        estadoFisico: 'bueno',
        imagenes: ['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[4].lng, ubicacionesBarrios[4].lat] },
        direccionZona: ubicacionesBarrios[4].zona,
        maxDiasPrestamo: 5
      },

      // --- Construcción & Remodelación ---
      {
        propietarioId: lucia._id,
        nombre: 'Escalera Telescópica de Aluminio 3.8m Plegable',
        descripcion: 'Escalera articulada extensible de aluminio reforzado. Soporta hasta 150 kg de carga y se compacta a solo 90 cm para fácil transporte en coche.',
        categoria: 'construccion',
        estadoFisico: 'bueno',
        imagenes: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[1].lng, ubicacionesBarrios[1].lat] },
        direccionZona: ubicacionesBarrios[1].zona,
        maxDiasPrestamo: 6
      },
      {
        propietarioId: marcos._id,
        nombre: 'Nivel Láser Autonivelante 360° con Trípode',
        descripcion: 'Emite líneas verdes horizontales y verticales de alta visibilidad para alineación precisa de baldosas, cuadros, estantes y falsos techos.',
        categoria: 'construccion',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[5].lng, ubicacionesBarrios[5].lat] },
        direccionZona: ubicacionesBarrios[5].zona,
        maxDiasPrestamo: 4
      },
      {
        propietarioId: elena._id,
        nombre: 'Carretilla Reforzada para Obra y Tierra 90 Litros',
        descripcion: 'Tolva de acero embutido de alta durabilidad con rueda neumática. Ideal para mover escombros, tierra de jardín o sacos de cemento.',
        categoria: 'construccion',
        estadoFisico: 'regular',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[4].lng, ubicacionesBarrios[4].lat] },
        direccionZona: ubicacionesBarrios[4].zona,
        maxDiasPrestamo: 3
      },

      // --- Pintura & Acabados ---
      {
        propietarioId: carlos._id,
        nombre: 'Pistola para Pintar por Gravedad HVLP con Compresor',
        descripcion: 'Sistema de pulverización de pintura para paredes lisas, rejas metálicas y carpintería con acabado uniforme sin marcas de brocha.',
        categoria: 'pintura',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[0].lng, ubicacionesBarrios[0].lat] },
        direccionZona: ubicacionesBarrios[0].zona,
        maxDiasPrestamo: 4
      },
      {
        propietarioId: lucia._id,
        nombre: 'Kit Profesional de Pintura con Rodillos Antigota y Alargador',
        descripcion: 'Incluye pértiga telescópica de 2 metros, 3 rodillos de microfibra antigota, bandeja escurridora y cinta de enmascarar azul.',
        categoria: 'pintura',
        estadoFisico: 'bueno',
        imagenes: ['https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[1].lng, ubicacionesBarrios[1].lat] },
        direccionZona: ubicacionesBarrios[1].zona,
        maxDiasPrestamo: 5
      },

      // --- Fontanería ---
      {
        propietarioId: marcos._id,
        nombre: 'Desatascador de Tuberías Espiral 10m y Llave Stillson 14"',
        descripcion: 'Herramientas esenciales para mantenimiento de desagües en cocinas y baños. Cable de acero flexible de 10m con manivela giratoria.',
        categoria: 'fontaneria',
        estadoFisico: 'bueno',
        imagenes: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[3].lng, ubicacionesBarrios[3].lat] },
        direccionZona: ubicacionesBarrios[3].zona,
        maxDiasPrestamo: 2
      },
      {
        propietarioId: elena._id,
        nombre: 'Termofusora para Tuberías de Termofusión PPR 800W',
        descripcion: 'Máquina para soldar tuberías de agua fría y caliente PPR. Incluye boquillas de 20, 25 y 32 mm, soporte y tijera cortatubos.',
        categoria: 'fontaneria',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [ubicacionesBarrios[6].lng, ubicacionesBarrios[6].lat] },
        direccionZona: ubicacionesBarrios[6].zona,
        maxDiasPrestamo: 3
      }
    ];

    const createdTools = await Tool.insertMany(toolsData);
    console.log(`[Seeder] ${createdTools.length} herramientas creadas con éxito y georreferenciadas.`);

    // 5. Crear Préstamos de Ejemplo para Demostrar Estados
    const hoy = new Date();
    const proximaSemanaInicio = new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000);
    const proximaSemanaFin = new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000);

    // Préstamo 1: Aprobado (Lucía le pide el Taladro a Carlos)
    await Loan.create({
      herramientaId: createdTools[0]._id,
      solicitanteId: lucia._id,
      propietarioId: carlos._id,
      fechaInicio: proximaSemanaInicio,
      fechaFin: proximaSemanaFin,
      estado: 'aprobado',
      notasSolicitante: 'Necesito armar unas repisas flotantes en mi estudio.',
      notasPropietario: 'Con mucho gusto, incluye brocas para concreto.'
    });

    // Préstamo 2: Pendiente (Carlos le pide la Hidrolavadora a Marcos)
    await Loan.create({
      herramientaId: createdTools[5]._id,
      solicitanteId: carlos._id,
      propietarioId: marcos._id,
      fechaInicio: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000),
      fechaFin: new Date(hoy.getTime() + 9 * 24 * 60 * 60 * 1000),
      estado: 'pendiente',
      notasSolicitante: 'Para lavar el patio posterior durante el fin de semana.'
    });

    // Préstamo 3: Devuelto / Finalizado (Elena devolvió la Escalera a Lucía)
    await Loan.create({
      herramientaId: createdTools[9]._id,
      solicitanteId: elena._id,
      propietarioId: lucia._id,
      fechaInicio: new Date(hoy.getTime() - 10 * 24 * 60 * 60 * 1000),
      fechaFin: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000),
      fechaEntregaReal: new Date(hoy.getTime() - 10 * 24 * 60 * 60 * 1000),
      fechaDevolucionReal: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000),
      estado: 'devuelto',
      notasSolicitante: 'Para podar una buganvilla alta.',
      notasPropietario: 'Excelente cuidado del equipo.'
    });

    console.log('[Seeder] 3 Préstamos de prueba generados en estados: aprobado, pendiente y devuelto.');
    console.log('[Seeder] ¡Semillero completado con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error] Fallo durante la ejecución:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
