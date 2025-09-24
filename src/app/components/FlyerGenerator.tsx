'use client';

import { useRef, useEffect } from 'react';
import QRCode from 'qrcode';

export interface FlyerData {
  nombre: string;
  registrationId: string;
  numeroInvitado: number;
  totalInvitados: number;
  compradorNombre: string;
}

interface FlyerGeneratorProps {
  data: FlyerData;
  onFlyerGenerated: (flyerBlob: Blob, qrBlob: Blob) => void;
}

export default function FlyerGenerator({ data, onFlyerGenerated }: FlyerGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateFlyer();
  }, [data]);

  const generateFlyer = async () => {
    console.log('🎨 Iniciando generación de flyer NUEVO DISEÑO para:', data.nombre);
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('❌ Canvas no disponible');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Contexto 2D no disponible');
      return;
    }

    console.log('✅ Canvas y contexto listos - NUEVO DISEÑO TRIBUTO RICKY MARTIN');

    // Dimensiones del flyer horizontal (optimizado para WhatsApp)
    const width = 800;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Fondo degradado elegante (colores dorado/marrón como en las imágenes)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#D4A574'); // Dorado claro
    gradient.addColorStop(0.5, '#B8860B'); // Dorado medio
    gradient.addColorStop(1, '#8B4513'); // Marrón oscuro
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Overlay semi-transparente para mejor legibilidad
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Borde decorativo elegante
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Título del evento - TRIBUTO A RICKY MARTIN
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRIBUTO A', width / 2, 50);
    
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Ricky Martin', width / 2, 90);

    // Subtítulo CENA SHOW
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('CENA SHOW', width / 2, 125);

    // Detalles del evento
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('MENÚ DE 3 PASOS + BEBIDA', width / 2, 150);
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('11 OCT | 20.00HS A 00.00HS', width / 2, 175);
    ctx.fillText('NICOLÁS VIDELA 328 | QUILMES CENTRO', width / 2, 195);

    // Línea divisoria elegante
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 210);
    ctx.lineTo(width - 50, 210);
    ctx.stroke();

    // Información del invitado (lado izquierdo)
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('🎫 ENTRADA PERSONAL', 50, 240);
    
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`👤 ${data.nombre}`, 50, 270);
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(`Entrada ${data.numeroInvitado} de ${data.totalInvitados}`, 50, 295);
    ctx.fillText(`Comprador: ${data.compradorNombre}`, 50, 315);

    // Información adicional
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('✨ Incluye: Menú completo + Show + Bebida', 50, 340);
    ctx.fillText('📱 Presenta este código QR en la entrada', 50, 360);
    ctx.fillText(`🆔 ID: ${data.registrationId.substring(0, 8)}...`, 50, 380);

    // Generar QR Code (lado derecho)
    const qrSize = 140;
    const qrX = width - qrSize - 40;
    const qrY = 230;

    try {
      console.log('🔄 Generando QR code...');
      // Generar QR de alta calidad
      const qrDataURL = await QRCode.toDataURL(`TRIBUTO-RICKY-MARTIN-${data.registrationId}`, {
        errorCorrectionLevel: 'H', // Máxima corrección de errores
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: qrSize * 2, // Alta resolución
      });

      console.log('✅ QR generado, creando imagen...');
      // Crear imagen del QR con crossOrigin para Vercel
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous'; // Importante para Vercel
      
      // Timeout para la carga de imagen
      const imageTimeout = setTimeout(() => {
        console.error('⏰ Timeout cargando imagen QR - usando fallback');
        // Usar fallback si la imagen no carga
        generateFallbackFlyer();
      }, 5000);
      
      qrImage.onload = async () => {
        clearTimeout(imageTimeout);
        console.log('✅ Imagen QR cargada, dibujando flyer...');
        // Fondo blanco para el QR con borde dorado
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
        
        // Marco dorado del QR
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
        
        // Dibujar el QR con alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // Texto del QR
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESCANEA PARA VALIDAR', qrX + qrSize/2, qrY + qrSize + 20);

        // Precio de la entrada
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('ENTRADA $50.000', qrX + qrSize/2, qrY - 15);

        // Decoraciones musicales elegantes
        const musicIcons = ['🎤', '🎵', '🎶', '⭐'];
        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = '#FFD700';
        
        // Posiciones más elegantes y espaciadas
        const iconPositions = [
          { x: 100, y: 390 },
          { x: 200, y: 385 },
          { x: 300, y: 390 },
          { x: 400, y: 385 },
          { x: 500, y: 390 },
          { x: 600, y: 385 }
        ];

        iconPositions.forEach((pos, i) => {
          const icon = musicIcons[i % musicIcons.length];
          ctx.fillText(icon, pos.x, pos.y);
        });

        // Convertir canvas a blobs con timeout para Vercel
        console.log('🔄 Convirtiendo canvas a blob...');
        
        // Timeout para evitar que se cuelgue en Vercel
        const timeoutId = setTimeout(() => {
          console.error('⏰ Timeout en generación de flyer - usando fallback');
          // Generar un flyer básico como fallback
          const fallbackCanvas = document.createElement('canvas');
          fallbackCanvas.width = 800;
          fallbackCanvas.height = 400;
          const fallbackCtx = fallbackCanvas.getContext('2d');
          
          if (fallbackCtx) {
            // Fondo simple
            fallbackCtx.fillStyle = '#667eea';
            fallbackCtx.fillRect(0, 0, 800, 400);
            
            // Texto básico
            fallbackCtx.fillStyle = '#ffffff';
            fallbackCtx.font = 'bold 24px Arial';
            fallbackCtx.textAlign = 'center';
            fallbackCtx.fillText('TRIBUTO A RICKY MARTIN', 400, 100);
            fallbackCtx.fillText(data.nombre, 400, 200);
            fallbackCtx.fillText('ENTRADA $50.000', 400, 300);
            
            fallbackCanvas.toBlob((fallbackBlob) => {
              if (fallbackBlob) {
                // QR simple como fallback
                const simpleQr = document.createElement('canvas');
                simpleQr.width = 200;
                simpleQr.height = 200;
                const qrCtx = simpleQr.getContext('2d');
                if (qrCtx) {
                  qrCtx.fillStyle = '#ffffff';
                  qrCtx.fillRect(0, 0, 200, 200);
                  qrCtx.fillStyle = '#000000';
                  qrCtx.font = '16px Arial';
                  qrCtx.textAlign = 'center';
                  qrCtx.fillText('QR CODE', 100, 100);
                  
                  simpleQr.toBlob((qrBlob) => {
                    if (qrBlob) {
                      console.log('🔄 Usando flyer fallback para Vercel');
                      onFlyerGenerated(fallbackBlob, qrBlob);
                    }
                  });
                }
              }
            });
          }
        }, 10000); // 10 segundos timeout
        
        canvas.toBlob(async (flyerBlob) => {
          clearTimeout(timeoutId); // Cancelar timeout si funciona
          console.log('✅ Flyer blob generado');
          if (flyerBlob) {
            // Generar QR individual de alta calidad
            console.log('🔄 Generando QR individual...');
            const qrCanvas = document.createElement('canvas');
            qrCanvas.width = 300;
            qrCanvas.height = 300;
            const qrCtx = qrCanvas.getContext('2d');
            
            if (qrCtx) {
              qrCtx.fillStyle = '#ffffff';
              qrCtx.fillRect(0, 0, 300, 300);
              qrCtx.imageSmoothingEnabled = true;
              qrCtx.imageSmoothingQuality = 'high';
              qrCtx.drawImage(qrImage, 0, 0, 300, 300);
              
              qrCanvas.toBlob((qrBlob) => {
                console.log('✅ QR blob generado');
                if (qrBlob) {
                  console.log('🎉 Llamando onFlyerGenerated para:', data.nombre);
                  onFlyerGenerated(flyerBlob, qrBlob);
                } else {
                  console.error('❌ Error generando QR blob');
                  // Fallback con QR simple
                  const simpleQr = document.createElement('canvas');
                  simpleQr.width = 200;
                  simpleQr.height = 200;
                  const fallbackQrCtx = simpleQr.getContext('2d');
                  if (fallbackQrCtx) {
                    fallbackQrCtx.fillStyle = '#ffffff';
                    fallbackQrCtx.fillRect(0, 0, 200, 200);
                    fallbackQrCtx.fillStyle = '#000000';
                    fallbackQrCtx.font = '16px Arial';
                    fallbackQrCtx.textAlign = 'center';
                    fallbackQrCtx.fillText('QR CODE', 100, 100);
                    
                    simpleQr.toBlob((fallbackQrBlob) => {
                      if (fallbackQrBlob) {
                        onFlyerGenerated(flyerBlob, fallbackQrBlob);
                      }
                    });
                  }
                }
              }, 'image/png', 0.9); // Reducir calidad para Vercel
            }
          }
        }, 'image/png', 0.9); // Reducir calidad para mejor compatibilidad
      };
      
      qrImage.onerror = () => {
        clearTimeout(imageTimeout);
        console.error('❌ Error cargando imagen QR - usando fallback');
        generateFallbackFlyer();
      };
      
      // Función para generar flyer fallback
      const generateFallbackFlyer = () => {
        console.log('🔄 Generando flyer fallback para Vercel...');
        
        // Dibujar QR simple directamente en el canvas principal
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
        
        // QR simple con texto
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', qrX + qrSize/2, qrY + qrSize/2 - 10);
        ctx.fillText(data.registrationId.substring(0, 8), qrX + qrSize/2, qrY + qrSize/2 + 10);
        
        // Texto del QR
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillText('ESCANEA PARA VALIDAR', qrX + qrSize/2, qrY + qrSize + 20);
        
        // Precio
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('ENTRADA $50.000', qrX + qrSize/2, qrY - 15);
        
        // Generar blobs del fallback
        canvas.toBlob((flyerBlob) => {
          if (flyerBlob) {
            // QR simple como blob separado
            const simpleQr = document.createElement('canvas');
            simpleQr.width = 200;
            simpleQr.height = 200;
            const qrCtx = simpleQr.getContext('2d');
            if (qrCtx) {
              qrCtx.fillStyle = '#ffffff';
              qrCtx.fillRect(0, 0, 200, 200);
              qrCtx.fillStyle = '#000000';
              qrCtx.font = '16px Arial';
              qrCtx.textAlign = 'center';
              qrCtx.fillText('QR CODE', 100, 90);
              qrCtx.fillText(data.registrationId.substring(0, 8), 100, 110);
              
              simpleQr.toBlob((qrBlob) => {
                if (qrBlob) {
                  console.log('✅ Flyer fallback generado para Vercel');
                  onFlyerGenerated(flyerBlob, qrBlob);
                }
              });
            }
          }
        }, 'image/png', 0.8);
      };
      
      qrImage.src = qrDataURL;

    } catch (error) {
      console.error('Error generando QR:', error);
      
      // Fallback: dibujar rectángulo con texto
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR CODE', qrX + qrSize/2, qrY + qrSize/2);
      ctx.fillText('ERROR', qrX + qrSize/2, qrY + qrSize/2 + 20);

      // Aún así generar el flyer con el fallback
      canvas.toBlob(async (flyerBlob) => {
        if (flyerBlob) {
          // Crear un QR simple como fallback
          const qrCanvas = document.createElement('canvas');
          qrCanvas.width = 300;
          qrCanvas.height = 300;
          const qrCtx = qrCanvas.getContext('2d');
          
          if (qrCtx) {
            qrCtx.fillStyle = '#ffffff';
            qrCtx.fillRect(0, 0, 300, 300);
            qrCtx.fillStyle = '#000000';
            qrCtx.font = '24px Arial, sans-serif';
            qrCtx.textAlign = 'center';
            qrCtx.fillText('QR ERROR', 150, 140);
            qrCtx.fillText(data.registrationId.substring(0, 8), 150, 180);
            
            qrCanvas.toBlob((qrBlob) => {
              if (qrBlob) {
                onFlyerGenerated(flyerBlob, qrBlob);
              }
            }, 'image/png', 1.0);
          }
        }
      }, 'image/png', 1.0);
    }
  };

  return (
    <div className="hidden">
      <canvas 
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}