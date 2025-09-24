import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';

export interface FlyerData {
  nombre: string;
  registrationId: string;
  numeroInvitado: number;
  totalInvitados: number;
  compradorNombre: string;
}

export async function generateHorizontalFlyer(data: FlyerData): Promise<Buffer> {
  // Dimensiones del flyer horizontal (optimizado para WhatsApp)
  const width = 800;
  const height = 400;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo degradado
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Borde decorativo
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Título del evento - CON EMOJIS RESTAURADOS
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎭 CENA SHOW VANI', width / 2, 60);

  // Fecha del evento
  ctx.font = 'bold 24px Arial';
  ctx.fillText('11 de Octubre 2024', width / 2, 95);

  // Línea divisoria
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 120);
  ctx.lineTo(width - 50, 120);
  ctx.stroke();

  // Información del invitado (lado izquierdo) - CON EMOJIS RESTAURADOS
  ctx.textAlign = 'left';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('🎫 ENTRADA PERSONAL', 50, 160);
  
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`👤 ${data.nombre}`, 50, 200);
  
  ctx.font = '18px Arial';
  ctx.fillText(`Entrada ${data.numeroInvitado} de ${data.totalInvitados}`, 50, 230);
  ctx.fillText(`Comprador: ${data.compradorNombre}`, 50, 255);

  // Información adicional - CON EMOJIS RESTAURADOS
  ctx.font = '16px Arial';
  ctx.fillText('✨ Incluye: Cena completa + Show + Bebidas', 50, 290);
  ctx.fillText('📱 Presenta este codigo QR en la entrada', 50, 315);
  ctx.fillText(`🆔 ID: ${data.registrationId.substring(0, 8)}...`, 50, 340);

  // Generar QR Code (lado derecho)
  const qrSize = 150;
  const qrX = width - qrSize - 50;
  const qrY = 150;

  try {
    // Generar QR como buffer
    const qrBuffer = await QRCode.toBuffer(`CENA-SHOW-VANI-${data.registrationId}`, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: qrSize,
    });

    // Cargar la imagen del QR y dibujarla en el canvas
    const qrImage = await loadImage(qrBuffer);
    
    // Fondo blanco para el QR
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    
    // Dibujar el QR
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    
    // Marco del QR
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

  } catch (error) {
    console.error('Error generando QR:', error);
    // Fallback: dibujar un rectángulo con texto
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR CODE', qrX + qrSize/2, qrY + qrSize/2);
  }

  // Texto del QR
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ESCANEA PARA VALIDAR', qrX + qrSize/2, qrY + qrSize + 25);

  // Decoraciones adicionales
  // Estrellas decorativas
  const stars = ['⭐', '✨', '🎭', '🎵'];
  ctx.font = '20px Arial';
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * (width - 100) + 50;
    const y = Math.random() * 50 + 350;
    const star = stars[Math.floor(Math.random() * stars.length)];
    ctx.fillText(star, x, y);
  }

  // Convertir canvas a buffer PNG
  return canvas.toBuffer('image/png');
}

export async function generateMultipleFlyers(registrations: FlyerData[]): Promise<Buffer[]> {
  const flyers: Buffer[] = [];
  
  for (const registration of registrations) {
    try {
      const flyerBuffer = await generateHorizontalFlyer(registration);
      flyers.push(flyerBuffer);
    } catch (error) {
      console.error(`Error generando flyer para ${registration.nombre}:`, error);
      // Continuar con los demás aunque uno falle
    }
  }
  
  return flyers;
}