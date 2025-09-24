import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { generateMultipleFlyers, FlyerData } from '@/lib/flyerGenerator';

// Para desarrollo local, usamos Map en memoria
// En producción con Vercel KV, se usará la base de datos real
let kv: any;
let registrations: Map<string, any>;

// Inicializar el storage apropiado
// Usar Vercel KV si las variables están disponibles y no son dummy values
const isProduction = process.env.KV_REST_API_URL && 
                    process.env.KV_REST_API_TOKEN && 
                    !process.env.KV_REST_API_URL.includes('dummy') &&
                    !process.env.KV_REST_API_URL.includes('localhost');

if (isProduction) {
  // Producción: usar Vercel KV
  const { kv: vercelKv } = require('@vercel/kv');
  kv = vercelKv;
  console.log('🚀 Using Vercel KV for storage');
} else {
  // Desarrollo local: usar Map en memoria
  registrations = new Map();
  console.log('💾 Using in-memory storage for development');
  kv = {
    async get(key: string) {
      if (key.startsWith('registration:dni:')) {
        const dni = key.replace('registration:dni:', '');
        return registrations.get(dni);
      } else if (key.startsWith('registration:id:')) {
        const id = key.replace('registration:id:', '');
        for (const [dni, registration] of registrations.entries()) {
          if (registration.id === id) {
            return registration;
          }
        }
        return null;
      }
      return null;
    },
    async set(key: string, value: any) {
      if (key.startsWith('registration:dni:')) {
        const dni = key.replace('registration:dni:', '');
        registrations.set(dni, value);
      }
      // Para registration:id: no necesitamos almacenar por separado en desarrollo
      return 'OK';
    }
  };
}

// Configuración del transportador de email (ajustar según tu proveedor)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { compradorNombre, compradorEmail, compradorTelefono, invitados, generateFlyers = true } = await request.json();

    // Validación básica - email ahora es opcional
    if (!compradorNombre || !invitados || !Array.isArray(invitados) || invitados.length === 0) {
      return NextResponse.json(
        { error: 'Datos del comprador e invitados son requeridos' },
        { status: 400 }
      );
    }

    // Validar que todos los invitados tengan nombre
    for (const invitado of invitados) {
      if (!invitado.nombre || invitado.nombre.trim() === '') {
        return NextResponse.json(
          { error: 'Todos los invitados deben tener nombre' },
          { status: 400 }
        );
      }
    }

    // Generar ID único para la compra
    const purchaseId = crypto.randomUUID();
    const fechaCompra = new Date().toISOString();
    
    // Crear registros individuales para cada invitado
    const registrations: any[] = [];
    const qrCodes: { registrationId: string; qrCodeBuffer: Buffer; nombre: string; }[] = [];

    for (let i = 0; i < invitados.length; i++) {
      const invitado = invitados[i];
      const registrationId = crypto.randomUUID();
      
      // Crear datos del registro individual
      const registrationData = {
        id: registrationId,
        purchaseId, // ID de la compra grupal
        nombre: invitado.nombre.trim(),
        compradorNombre,
        compradorEmail,
        compradorTelefono: compradorTelefono || '',
        fechaRegistro: fechaCompra,
        evento: 'Tributo a Ricky Martin - 11 de Octubre 2024',
        numeroInvitado: i + 1,
        totalInvitados: invitados.length,
        mesa: 'Sin asignar', // Campo para asignación de mesa
        estado: 'Activo', // Estado del registro
      };

      // Generar código QR individual
      const qrData = `CENA-SHOW-VANI-${registrationId}`;
      const qrCodeBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });

      // Guardar el registro individual
      await kv.set(`registration:id:${registrationId}`, registrationData);
      
      registrations.push(registrationData);
      qrCodes.push({
        registrationId,
        qrCodeBuffer,
        nombre: invitado.nombre.trim(),
      });
    }

    // Guardar información de la compra grupal
    const purchaseData = {
      id: purchaseId,
      compradorNombre,
      compradorEmail,
      compradorTelefono: compradorTelefono || '',
      fechaCompra,
      totalInvitados: invitados.length,
      registrationIds: registrations.map(r => r.id),
    };
    
    await kv.set(`purchase:${purchaseId}`, purchaseData);

    // Condicional: generar flyers solo si se solicita (para compatibilidad con frontend)
    let flyerBuffers: Buffer[] = [];
    
    if (generateFlyers) {
      console.log('Saltando generación de flyers - se generarán en el frontend');
    } else {
      console.log('Generación de flyers deshabilitada - solo creando registros');
    }

    // Si no se generan flyers, solo devolver los datos de registro
    if (!generateFlyers) {
      return NextResponse.json({
        success: true,
        message: 'Registros creados exitosamente',
        purchaseId,
        totalTickets: invitados.length,
        emailSent: false,
        registrations: registrations.map(r => ({
          id: r.id,
          nombre: r.nombre,
          numeroInvitado: r.numeroInvitado,
          purchaseId: purchaseId
        })),
      });
    }

    // Preparar el email con múltiples entradas
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Entradas Cena Show Vani</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket { background: white; margin: 20px 0; padding: 20px; border-radius: 10px; border-left: 5px solid #667eea; }
          .qr-section { text-align: center; margin: 20px 0; }
          .qr-code { max-width: 150px; border: 2px solid #667eea; border-radius: 8px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .whatsapp-tip { background: #25D366; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎭 Cena Show Vani</h1>
            <h2>¡Entradas Generadas!</h2>
          </div>
          
          <div class="content">
            <p>Hola <strong>${compradorNombre}</strong>,</p>
            
            <p>¡Gracias por tu compra! Se han generado <strong>${invitados.length} entrada${invitados.length > 1 ? 's' : ''}</strong> para la Cena Show.</p>
            
            <div class="details">
              <h3>📅 Detalles del Evento</h3>
              <p><strong>Fecha:</strong> 11 de Octubre de 2024</p>
              <p><strong>Evento:</strong> Cena Show Vani</p>
              <p><strong>Comprador:</strong> ${compradorNombre}</p>
              <p><strong>Email:</strong> ${compradorEmail}</p>
              ${compradorTelefono ? `<p><strong>Teléfono:</strong> ${compradorTelefono}</p>` : ''}
              <p><strong>Total de entradas:</strong> ${invitados.length}</p>
            </div>

            ${qrCodes.map((qr, index) => `
            <div class="ticket">
              <h3>🎫 Entrada ${index + 1} - ${qr.nombre}</h3>
              <div class="qr-section">
                <img src="cid:qrcode${index}" alt="Código QR para ${qr.nombre}" class="qr-code" />
                <p><strong>${qr.nombre}</strong></p>
                <p><small>ID: ${qr.registrationId}</small></p>
              </div>
            </div>
            `).join('')}
            
            <div class="details">
              <h3>✨ ¿Qué incluye cada entrada?</h3>
              <ul>
                <li>🍽️ Cena completa de 3 tiempos</li>
                <li>🎭 Show en vivo</li>
                <li>🍷 Bebidas incluidas</li>
                <li>🎵 Música y entretenimiento</li>
              </ul>
            </div>

            <div class="whatsapp-tip">
               <h3>📱 Distribución por WhatsApp - VENDEDOR</h3>
               <p><strong>¡Hola! Este email es para ti como vendedor.</strong></p>
               <p>🎨 <strong>Entradas listas para distribuir:</strong> Hemos incluido flyers horizontales optimizados para WhatsApp como archivos adjuntos.</p>
               <p><strong>Comprador:</strong> ${compradorNombre}</p>
               <p><strong>Total de entradas:</strong> ${invitados.length}</p>
               <p>Cada invitado tiene:</p>
               <ul>
                 <li>📧 Su código QR individual (visible arriba)</li>
                 <li>🖼️ Su flyer horizontal personalizado (archivo adjunto)</li>
               </ul>
               <p><strong>Instrucciones para distribución:</strong></p>
               <ol>
                 <li>Descarga los archivos adjuntos de este email</li>
                 <li>Envía el flyer correspondiente a cada invitado por WhatsApp</li>
                 <li>Cada flyer ya incluye el QR code integrado</li>
                 <li>Confirma que cada persona recibió su entrada</li>
               </ol>
               <p><strong>Mensaje sugerido para WhatsApp:</strong></p>
               <p style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; font-style: italic;">
                 "¡Hola [Nombre]! Aquí tienes tu entrada para la Cena Show Vani del 11 de octubre. 
                 Presenta este flyer en la entrada (tiene tu QR integrado). ¡Te esperamos! 🎭"
               </p>
             </div>
            
            <p><strong>Importante:</strong> Cada invitado debe presentar su código QR individual en la entrada del evento.</p>
          </div>
          
          <div class="footer">
            <p>¡Los esperamos para una noche inolvidable!</p>
            <p>Cena Show Vani - 11 de Octubre de 2024</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email al vendedor con todas las entradas generadas
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Attachments: QR codes individuales + flyers horizontales
        const qrAttachments = qrCodes.map((qr, index) => ({
          filename: `entrada-${qr.nombre.replace(/\s+/g, '-')}-qr.png`,
          content: qr.qrCodeBuffer,
          cid: `qrcode${index}` // Content ID para referenciar en el HTML
        }));

        const flyerAttachments = flyerBuffers.map((buffer, index) => ({
          filename: `flyer-${qrCodes[index].nombre.replace(/\s+/g, '-')}.png`,
          content: buffer,
        }));

        const allAttachments = [...qrAttachments, ...flyerAttachments];

        await transporter.sendMail({
          from: `"Cena Show Vani" <${process.env.SMTP_USER}>`,
          to: 'triverodev@gmail.com',
          subject: `🎭 ${invitados.length} Entrada${invitados.length > 1 ? 's' : ''} Cena Show Vani - 11 de Octubre - Comprador: ${compradorNombre}`,
          html: emailHTML,
          attachments: allAttachments
        });
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // Continuamos aunque falle el email
      }
    }

    return NextResponse.json({
      success: true,
      message: `${invitados.length} entrada${invitados.length > 1 ? 's' : ''} generada${invitados.length > 1 ? 's' : ''} exitosamente y enviada${invitados.length > 1 ? 's' : ''} al vendedor`,
      purchaseId,
      totalTickets: invitados.length,
      emailSent: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      registrations: registrations.map(r => ({
        id: r.id,
        nombre: r.nombre,
        numeroInvitado: r.numeroInvitado,
      })),
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para validar QR codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('id');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'ID de registro requerido' },
        { status: 400 }
      );
    }

    // Buscar el registro por ID en Vercel KV
    const registration = await kv.get(`registration:id:${registrationId}`);
    
    if (registration) {
      return NextResponse.json({
        valid: true,
        registration: {
          nombre: registration.nombre,
          evento: registration.evento,
          fechaRegistro: registration.fechaRegistro,
          compradorNombre: registration.compradorNombre,
          numeroInvitado: registration.numeroInvitado,
          totalInvitados: registration.totalInvitados,
          purchaseId: registration.purchaseId,
        },
      });
    }

    return NextResponse.json(
      { valid: false, error: 'Registro no encontrado' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error validating registration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}