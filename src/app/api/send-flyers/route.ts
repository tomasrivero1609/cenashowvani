import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 API send-flyers ejecutándose');
  
  try {
    const formData = await request.formData();
    
    const registrationIds = JSON.parse(formData.get('registrationIds') as string);
    const purchaseId = formData.get('purchaseId') as string;
    
    console.log('📋 Datos recibidos:', { registrationIds, purchaseId });
    
    // Contar cuántos flyers se procesaron
    let flyerCount = 0;
    let index = 0;
    
    while (formData.get(`flyer_${index}`)) {
      const flyerFile = formData.get(`flyer_${index}`) as File;
      const flyerDataStr = formData.get(`flyerData_${index}`) as string;
      
      if (flyerFile && flyerDataStr) {
        const flyerData = JSON.parse(flyerDataStr);
        console.log(`✅ Flyer procesado para: ${flyerData.nombre}`);
        flyerCount++;
      }
      
      index++;
    }

    console.log(`🎉 Total de flyers procesados: ${flyerCount}`);

    // Devolver éxito - los flyers ya se descargaron automáticamente en el frontend
    return NextResponse.json({
      success: true,
      message: `Flyers generados y descargados exitosamente`,
      emailSent: false, // No enviamos email, solo descarga directa
      totalFlyers: flyerCount
    });

  } catch (error) {
    console.error('❌ Error procesando flyers:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}