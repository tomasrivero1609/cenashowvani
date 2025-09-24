import { NextRequest, NextResponse } from 'next/server';

// Inicializar el storage apropiado
let kv: any;

const isProduction = process.env.KV_REST_API_URL && 
                    process.env.KV_REST_API_TOKEN && 
                    !process.env.KV_REST_API_URL.includes('dummy') &&
                    !process.env.KV_REST_API_URL.includes('localhost');

if (isProduction) {
  const { kv: vercelKv } = require('@vercel/kv');
  kv = vercelKv;
} else {
  // Desarrollo local: usar Map en memoria
  const registrations = new Map();
  kv = {
    async get(key: string) {
      if (key.startsWith('registration:id:')) {
        return registrations.get(key);
      }
      return null;
    },
    async set(key: string, value: any) {
      registrations.set(key, value);
      return 'OK';
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { registrationId, mesa } = await request.json();

    if (!registrationId || !mesa) {
      return NextResponse.json(
        { error: 'ID de registro y mesa son requeridos' },
        { status: 400 }
      );
    }

    // Obtener el registro actual
    const registration = await kv.get(`registration:id:${registrationId}`);
    
    if (!registration) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar la mesa
    const updatedRegistration = {
      ...registration,
      mesa: mesa,
      fechaAsignacionMesa: new Date().toISOString()
    };

    // Guardar el registro actualizado
    await kv.set(`registration:id:${registrationId}`, updatedRegistration);

    return NextResponse.json({
      success: true,
      message: `Mesa ${mesa} asignada exitosamente`,
      registration: updatedRegistration
    });

  } catch (error) {
    console.error('Error asignando mesa:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// API para obtener todos los registros (para el panel de administración)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list-all') {
      // En desarrollo, necesitamos simular la obtención de todos los registros
      // En producción, usaríamos kv.keys() o similar
      
      if (isProduction) {
        // En producción con Vercel KV
        const keys = await kv.keys('registration:id:*');
        const registrations = [];
        
        for (const key of keys) {
          const registration = await kv.get(key);
          if (registration) {
            registrations.push(registration);
          }
        }
        
        return NextResponse.json({
          success: true,
          registrations: registrations
        });
      } else {
        // En desarrollo local
        return NextResponse.json({
          success: true,
          registrations: [],
          message: 'En desarrollo local - registra algunos invitados primero'
        });
      }
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error obteniendo registros:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}