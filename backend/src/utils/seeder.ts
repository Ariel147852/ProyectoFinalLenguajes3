import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Tool } from '../models/Tool';
import { Loan } from '../models/Loan';
import { ChatMessage } from '../models/ChatMessage';
import { PaymentReceipt } from '../models/PaymentReceipt';
import { ENV } from '../config/env';

export const seedDatabase = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('[Seeder] Conectado exitosamente a MongoDB...');

    // 1. Limpieza total
    await Promise.all([
      User.deleteMany({}),
      Tool.deleteMany({}),
      Loan.deleteMany({}),
      ChatMessage.deleteMany({}),
      PaymentReceipt.deleteMany({})
    ]);
    console.log('[Seeder] Colecciones limpiadas.');

    // 2. Contraseñas
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('AdminPassword123!', salt);
    const userPass = await bcrypt.hash('UserPassword123!', salt);

    const now = new Date();
    const suscripcionInicio = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const suscripcionFin = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);

    // 3. Usuarios (solo 3)
    const admin = await User.create({
      nombre: 'Administrador General',
      email: 'admin@toollibrary.org',
      passwordHash: adminPass,
      rol: 'admin',
      cedula: '1710034065',
      cedulaFrontalUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      cedulaPosteriorUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      cedulaVerificada: true,
      telefono: '0991112233',
      direccionZona: 'Sector Iñaquito / La Carolina',
      estadoSuscripcion: 'activa',
      limiteHerramientasBase: 9999,
      datosFinancieros: {
        banco: 'Banco Pichincha',
        tipoCuenta: 'Cuenta Corriente',
        numeroCuenta: '2205849301',
        titular: 'Administrador General - ToolLibrary',
        telefonoDeUna: '0991112233',
        qrDeUnaUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DEUNA_PAGO_ADMIN_BIBLIOTECA'
      }
    });

    const carlos = await User.create({
      nombre: 'Carlos Mendoza',
      email: 'carlos@vecino.org',
      passwordHash: userPass,
      rol: 'user',
      cedula: '1718845629',
      cedulaFrontalUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      cedulaPosteriorUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
      cedulaVerificada: true,
      telefono: '0984445566',
      direccionZona: 'Sector La Floresta',
      reputacionPromedio: 4.9,
      estadoSuscripcion: 'activa',
      fechaInicioSuscripcion: suscripcionInicio,
      fechaFinSuscripcion: suscripcionFin,
      limiteHerramientasBase: 5,
      herramientasExtras: 0,
      datosFinancieros: {
        banco: 'Banco Pichincha',
        tipoCuenta: 'Cuenta de Ahorros',
        numeroCuenta: '2204598124',
        titular: 'Carlos Mendoza',
        telefonoDeUna: '0984445566',
        qrDeUnaUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DEUNA_PAGO_CARLOS_MENDOZA'
      }
    });

    const lucia = await User.create({
      nombre: 'Lucía Benítez',
      email: 'lucia@vecina.org',
      passwordHash: userPass,
      rol: 'user',
      cedula: '0915234710',
      cedulaFrontalUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      cedulaPosteriorUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      cedulaVerificada: true,
      telefono: '0977778899',
      direccionZona: 'Sector Iñaquito / La Carolina',
      reputacionPromedio: 5.0,
      estadoSuscripcion: 'activa',
      fechaInicioSuscripcion: suscripcionInicio,
      fechaFinSuscripcion: suscripcionFin,
      limiteHerramientasBase: 5,
      herramientasExtras: 0,
      datosFinancieros: {
        banco: 'Banco Guayaquil',
        tipoCuenta: 'Cuenta de Ahorros',
        numeroCuenta: '1109483721',
        titular: 'Lucía Benítez',
        telefonoDeUna: '0977778899',
        qrDeUnaUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DEUNA_PAGO_LUCIA_BENITEZ'
      }
    });

    console.log('[Seeder] 3 Usuarios creados: Admin, Carlos y Lucía.');

    // 4. Herramientas (3 de Carlos, 2 de Lucía)
    const createdTools = await Tool.insertMany([
      {
        propietarioId: carlos._id,
        nombre: 'Taladro Percutor Bosch 650W',
        descripcion: 'Taladro reversible con percusión para mampostería, madera y metal. Incluye set de 15 brocas.',
        categoria: 'electricas',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [-78.4871, -0.2032] },
        direccionZona: 'Sector La Floresta',
        maxDiasPrestamo: 5
      },
      {
        propietarioId: carlos._id,
        nombre: 'Sierra Circular DeWalt 7-1/4" 1800W',
        descripcion: 'Ideal para cortes rectos en tableros de madera contrachapada y melamina. Incluye guía paralela.',
        categoria: 'electricas',
        estadoFisico: 'bueno',
        imagenes: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [-78.4871, -0.2032] },
        direccionZona: 'Sector La Floresta',
        maxDiasPrestamo: 3
      },
      {
        propietarioId: carlos._id,
        nombre: 'Maletín de Herramientas de Mano (108 piezas)',
        descripcion: 'Juego completo con martillo, destornilladores, llaves allen, cinta métrica y alicate.',
        categoria: 'manuales',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [-78.4871, -0.2032] },
        direccionZona: 'Sector La Floresta',
        maxDiasPrestamo: 7
      },
      {
        propietarioId: lucia._id,
        nombre: 'Cortadora de Césped Black+Decker 1200W',
        descripcion: 'Cortacésped eléctrico ligero con bolsa recolectora de 35 litros y ajuste de altura de 3 niveles.',
        categoria: 'jardineria',
        estadoFisico: 'excelente',
        imagenes: ['https://images.unsplash.com/photo-1592417817098-8f3d69106095?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [-78.4852, -0.1785] },
        direccionZona: 'Sector Iñaquito / La Carolina',
        maxDiasPrestamo: 2
      },
      {
        propietarioId: lucia._id,
        nombre: 'Escalera Telescópica de Aluminio 3.8m',
        descripcion: 'Escalera plegable de aluminio reforzado. Soporta hasta 150 kg y se compacta a 90 cm.',
        categoria: 'construccion',
        estadoFisico: 'bueno',
        imagenes: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
        ubicacion: { type: 'Point', coordinates: [-78.4852, -0.1785] },
        direccionZona: 'Sector Iñaquito / La Carolina',
        maxDiasPrestamo: 6
      }
    ]);
    console.log(`[Seeder] ${createdTools.length} herramientas creadas (3 de Carlos, 2 de Lucía).`);

    // 5. Un préstamo de ejemplo: Lucía le pide el Taladro a Carlos (aprobado)
    const hoy = new Date();
    await Loan.create({
      herramientaId: createdTools[0]._id,
      solicitanteId: lucia._id,
      propietarioId: carlos._id,
      fechaInicio: new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000),
      fechaFin: new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000),
      estado: 'aprobado',
      notasSolicitante: 'Necesito armar unas repisas flotantes en mi estudio.',
      notasPropietario: 'Con mucho gusto, incluye brocas para concreto.'
    });
    console.log('[Seeder] 1 Préstamo de prueba creado (Lucía → Carlos, aprobado).');

    // 6. Mensajes de chat
    await ChatMessage.insertMany([
      {
        usuarioId: admin._id,
        nombreUsuario: 'Administrador General',
        rolUsuario: 'admin',
        mensaje: '¡Bienvenidos al chat comunitario de Tool Library!',
        sala: 'comunidad_general',
        createdAt: new Date(hoy.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        usuarioId: carlos._id,
        nombreUsuario: 'Carlos Mendoza',
        rolUsuario: 'user',
        mensaje: 'Hola vecinos, publiqué el taladro y la sierra circular. Disponibles en La Floresta.',
        sala: 'comunidad_general',
        createdAt: new Date(hoy.getTime() - 1 * 60 * 60 * 1000)
      },
      {
        usuarioId: lucia._id,
        nombreUsuario: 'Lucía Benítez',
        rolUsuario: 'user',
        mensaje: 'Gracias Carlos! Ya te envié la solicitud por el taladro.',
        sala: 'comunidad_general',
        createdAt: new Date(hoy.getTime() - 30 * 60 * 1000)
      }
    ]);
    console.log('[Seeder] Mensajes de chat insertados.');

    // 7. Comprobantes de pago (1 aprobado de Carlos, 1 pendiente de Lucía)
    await PaymentReceipt.create([
      {
        usuarioId: carlos._id,
        tipoPago: 'suscripcion_mensual',
        monto: 5.0,
        cantidadHerramientasExtras: 0,
        metodoPago: 'transferencia_bancaria',
        bancoOrigen: 'Banco Pichincha',
        numeroComprobante: 'PICH-8492019',
        comprobanteUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        estado: 'aprobado',
        verificadoPor: admin._id,
        fechaVerificacion: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        notas: 'Transferencia verificada. 30 días de suscripción otorgados.',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        usuarioId: lucia._id,
        tipoPago: 'suscripcion_mensual',
        monto: 5.0,
        cantidadHerramientasExtras: 0,
        metodoPago: 'transferencia_bancaria',
        bancoOrigen: 'Banco Guayaquil',
        numeroComprobante: 'GUAY-7719234',
        comprobanteUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
        estado: 'pendiente',
        notas: 'Transferencia de $5.00 para suscripción mensual.',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      }
    ]);
    console.log('[Seeder] Comprobantes de pago creados (1 aprobado, 1 pendiente).');

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
