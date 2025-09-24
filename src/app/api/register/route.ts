import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Para desarrollo local, usamos Map en memoria
// En producción con Vercel KV, se usará la base de datos real
let kv: any;
let registrations: Map<string, any>;

// Inicializar el storage apropiado
if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN && 
    process.env.KV_REST_API_URL !== 'https://dummy-url-for-local-dev.upstash.io') {
  // Producción: usar Vercel KV
  const { kv: vercelKv } = require('@vercel/kv');
  kv = vercelKv;
} else {
  // Desarrollo local: usar Map en memoria
  registrations = new Map();
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
    const { nombre, telefono, dni, email } = await request.json();

    // Validación básica
    if (!nombre || !telefono || !dni || !email) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un registro con este DNI
    const existingRegistration = await kv.get(`registration:dni:${dni}`);
    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Ya existe un registro con este DNI' },
        { status: 409 }
      );
    }

    // Generar ID único para el registro
    const registrationId = crypto.randomUUID();
    
    // Crear datos del registro
    const registrationData = {
      id: registrationId,
      nombre,
      telefono,
      dni,
      email,
      fechaRegistro: new Date().toISOString(),
      evento: 'Cena Show Vani - 11 de Octubre 2024',
    };

    // Generar código QR solo con el ID de registro
    const qrData = `CENA-SHOW-VANI-${registrationId}`;

    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    });

    // Guardar el registro en Vercel KV
    // Guardamos por DNI para verificar duplicados
    await kv.set(`registration:dni:${dni}`, registrationData);
    // Guardamos por ID para validación de QR
    await kv.set(`registration:id:${registrationId}`, registrationData);

    // Preparar el email
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación Cena Show Vani</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .qr-section { text-align: center; margin: 30px 0; }
          .qr-code { max-width: 200px; border: 3px solid #667eea; border-radius: 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎭 Cena Show Vani</h1>
            <h2>¡Confirmación de Registro!</h2>
          </div>
          
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            
            <p>¡Gracias por registrarte para nuestra Cena Show! Tu entrada ha sido confirmada.</p>
            
            <div class="details">
              <h3>📅 Detalles del Evento</h3>
              <p><strong>Fecha:</strong> 11 de Octubre de 2024</p>
              <p><strong>Evento:</strong> Cena Show Vani</p>
              <p><strong>Nombre:</strong> ${nombre}</p>
              <p><strong>DNI:</strong> ${dni}</p>
              <p><strong>Teléfono:</strong> ${telefono}</p>
              <p><strong>Email:</strong> ${email}</p>
            </div>
            
            <div class="qr-section">
              <h3>📱 Tu Código QR de Entrada</h3>
              <p>Presenta este código QR en la entrada del evento:</p>
              <img src="cid:qrcode" alt="Código QR" class="qr-code" />
              <p><small>ID de Registro: ${registrationId}</small></p>
            </div>
            
            <div class="details">
              <h3>✨ ¿Qué incluye tu entrada?</h3>
              <ul>
                <li>🍽️ Cena completa de 3 tiempos</li>
                <li>🎭 Show en vivo</li>
                <li>🍷 Bebidas incluidas</li>
                <li>🎵 Música y entretenimiento</li>
              </ul>
            </div>
            
            <p><strong>Importante:</strong> Guarda este email y presenta el código QR en la entrada del evento.</p>
            
            <div class="details">
              <h3>📱 Para compartir por WhatsApp</h3>
              <p>Puedes reenviar este email o compartir el código QR por WhatsApp con el invitado.</p>
              <p><strong>Mensaje sugerido:</strong></p>
              <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; font-style: italic;">
                "¡Hola ${nombre}! Aquí tienes tu confirmación para la Cena Show Vani del 11 de octubre. 
                Presenta este código QR en la entrada. ¡Te esperamos! 🎭"
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>¡Te esperamos para una noche inolvidable!</p>
            <p>Cena Show Vani - 11 de Octubre de 2024</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email (solo si están configuradas las credenciales)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          from: `"Cena Show Vani" <${process.env.SMTP_USER}>`,
          to: email, // Enviar directamente al email del invitado
          subject: '🎭 Confirmación Cena Show Vani - 11 de Octubre',
          html: emailHTML,
          attachments: [
            {
              filename: 'qr-code.png',
              content: qrCodeBuffer,
              cid: 'qrcode' // Content ID para referenciar en el HTML
            }
          ]
        });
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // Continuamos aunque falle el email
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registro exitoso',
      registrationId,
      qrCode: qrCodeBuffer.toString('base64'),
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
          dni: registration.dni,
          evento: registration.evento,
          fechaRegistro: registration.fechaRegistro,
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