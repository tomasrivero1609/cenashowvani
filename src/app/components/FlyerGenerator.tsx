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
    // Agregar delay para evitar problemas de concurrencia en múltiples flyers
    const delay = Math.random() * 1000; // Delay aleatorio entre 0-1 segundo
    const timeoutId = setTimeout(() => {
      generateFlyer();
    }, delay);
    
    return () => clearTimeout(timeoutId);
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

    console.log('✅ Canvas y contexto listos');

    // Dimensiones del flyer horizontal (optimizado para WhatsApp)
    const width = 800;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Fondo degradado original
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Borde decorativo
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Título del evento
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRIBUTO A RICKY MARTIN', width / 2, 60);

    // Fecha del evento
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('11 de Octubre 2025', width / 2, 95);

    // Línea divisoria
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 120);
    ctx.lineTo(width - 50, 120);
    ctx.stroke();

    // Información del evento (centrado)
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('CENA SHOW', width / 2, 150);
    
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('MENÚ DE 3 PASOS + BEBIDA', width / 2, 175);
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('NICOLÁS VIDELA 225 | QUILMES CENTRO', width / 2, 200);

    // Información del invitado (lado izquierdo)
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('🎫 ENTRADA PERSONAL', 50, 240);
    
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(`👤 ${data.nombre}`, 50, 270);
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(`Entrada ${data.numeroInvitado} de ${data.totalInvitados}`, 50, 295);
    ctx.fillText(`Comprador: ${data.compradorNombre}`, 50, 315);

    // Información adicional
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('✨ Incluye: Menú completo + Show + Bebida', 50, 340);
    ctx.fillText('📱 Presenta este código QR en la entrada', 50, 365);
    ctx.fillText(`🆔 ID: ${data.registrationId.substring(0, 8)}...`, 50, 385);

    // Generar QR Code (lado derecho)
    const qrSize = 150;
    const qrX = width - qrSize - 50;
    const qrY = 150;

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
        // Fondo blanco para el QR
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
        
        // Dibujar el QR con alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        
        // Marco del QR
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

        // Texto del QR
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESCANEA PARA VALIDAR', qrX + qrSize/2, qrY + qrSize + 25);

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