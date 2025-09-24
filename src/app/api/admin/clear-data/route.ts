import { NextRequest, NextResponse } from 'next/server';

// Inicializar el storage apropiado
let kv: any;

const isProduction = process.env.KV_REST_API_URL && 
                    process.env.KV_REST_API_TOKEN && 
                    !process.env.KV_REST_API_URL.includes('dummy') &&
                    !process.env.KV_REST_API_URL.includes('localhost');

if (isProduction) {
  // Producción: usar Vercel KV
  const { kv: vercelKv } = require('@vercel/kv');
  kv = vercelKv;
} else {
  // Desarrollo local: usar Map en memoria
  const registrations = new Map();
  kv = {
    async keys(pattern: string) {
      const keys = [];
      for (const key of registrations.keys()) {
        if (pattern === '*' || key.includes(pattern.replace('*', ''))) {
          keys.push(`registration:dni:${key}`);
        }
      }
      return keys;
    },
    async del(...keys: string[]) {
      let deleted = 0;
      for (const key of keys) {
        if (key.startsWith('registration:dni:')) {
          const dni = key.replace('registration:dni:', '');
          if (registrations.delete(dni)) {
            deleted++;
          }
        }
      }
      return deleted;
    },
    async flushall() {
      registrations.clear();
      return 'OK';
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { action, adminKey } = await request.json();

    // Verificar clave administrativa (opcional, para seguridad)
    if (adminKey !== process.env.ADMIN_KEY && process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Clave administrativa incorrecta' },
        { status: 401 }
      );
    }

    if (action === 'clear-all') {
      // Borrar todos los datos
      if (isProduction) {
        await kv.flushall();
      } else {
        await kv.flushall();
      }
      
      return NextResponse.json({
        success: true,
        message: 'Todos los datos han sido eliminados'
      });
    }

    if (action === 'clear-registrations') {
      // Borrar solo registraciones
      const registrationKeys = await kv.keys('registration:*');
      const purchaseKeys = await kv.keys('purchase:*');
      
      const allKeys = [...registrationKeys, ...purchaseKeys];
      
      if (allKeys.length > 0) {
        await kv.del(...allKeys);
      }
      
      return NextResponse.json({
        success: true,
        message: `${allKeys.length} registros eliminados`,
        deletedKeys: allKeys.length
      });
    }

    if (action === 'list-keys') {
      // Listar todas las keys para ver qué hay
      const registrationKeys = await kv.keys('registration:*');
      const purchaseKeys = await kv.keys('purchase:*');
      
      return NextResponse.json({
        success: true,
        registrationKeys,
        purchaseKeys,
        total: registrationKeys.length + purchaseKeys.length
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use: clear-all, clear-registrations, o list-keys' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en admin endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}