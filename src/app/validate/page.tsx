'use client';

import { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

interface ValidationResult {
  valid: boolean;
  registration?: {
    nombre: string;
    evento: string;
    fechaRegistro: string;
    mesa: string;
    estado: string;
    compradorNombre: string;
    numeroInvitado: number;
    totalInvitados: number;
  };
  error?: string;
}

export default function ValidatePage() {
  const [qrData, setQrData] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const validateQR = async () => {
    if (!qrData.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      let registrationId = '';

      // Verificar si es el formato de QR
      if (qrData.startsWith('TRIBUTO-RICKY-MARTIN-')) {
        registrationId = qrData.replace('TRIBUTO-RICKY-MARTIN-', '');
      } else if (qrData.startsWith('CENA-SHOW-VANI-')) {
        registrationId = qrData.replace('CENA-SHOW-VANI-', '');
      } else {
        // Intentar parsear como JSON (formato anterior)
        try {
          const parsedData = JSON.parse(qrData);
          registrationId = parsedData.id;
        } catch {
          setValidationResult({
            valid: false,
            error: 'Código QR inválido: formato no reconocido'
          });
          return;
        }
      }

      if (!registrationId) {
        setValidationResult({
          valid: false,
          error: 'Código QR inválido: falta ID de registro'
        });
        return;
      }

      // Validar con el servidor
      const response = await fetch(`/api/register?id=${registrationId}`);
      const result = await response.json();

      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Error al validar el código QR'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setValidationResult(null);

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          setQrData(result.data);
          stopScanning();
          // Auto-validate after scanning
          setTimeout(() => {
            validateQR();
          }, 100);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current = qrScanner;
      await qrScanner.start();
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      setIsScanning(false);
      alert('Error al acceder a la cámara. Asegúrate de dar permisos de cámara.');
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const resetValidation = () => {
    setQrData('');
    setValidationResult(null);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header minimalista */}
      <div className="p-4 text-center">
        <h1 className="text-white text-xl font-bold">
          Validador de Entradas
        </h1>
        <p className="text-gray-300 text-sm">
          Tributo a Ricky Martin - 11 de Octubre 2025
        </p>
      </div>

      {/* Área principal del escáner */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!validationResult ? (
          <>
            {/* Video del escáner en pantalla completa */}
            <div className="w-full max-w-lg aspect-square relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                style={{ display: isScanning ? 'block' : 'none' }}
              />
              
              {!isScanning && (
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-lg">Toca para escanear</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de control */}
            <div className="mt-8">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  className="bg-blue-600 text-white py-4 px-8 rounded-full text-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  📷 Iniciar Escáner
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="bg-red-600 text-white py-4 px-8 rounded-full text-xl font-bold hover:bg-red-700 transition-colors shadow-lg"
                >
                  ⏹️ Detener
                </button>
              )}
            </div>

            {/* Indicador de carga */}
            {isValidating && (
              <div className="mt-4 text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Validando entrada...</p>
              </div>
            )}
          </>
        ) : (
          /* Resultado en pantalla completa */
          <div className="w-full max-w-lg">
            {validationResult.valid ? (
              <div className="bg-green-500 text-white rounded-lg p-8 text-center shadow-2xl">
                <div className="text-8xl mb-6">✅</div>
                <h2 className="text-4xl font-bold mb-6">
                  ACCESO PERMITIDO
                </h2>
                
                {validationResult.registration && (
                  <div className="space-y-4">
                    {/* Información principal */}
                    <div className="bg-green-600 rounded-lg p-4">
                      <p className="text-3xl font-bold">{validationResult.registration.nombre}</p>
                      <p className="text-green-100 text-lg">Entrada {validationResult.registration.numeroInvitado} de {validationResult.registration.totalInvitados}</p>
                    </div>
                    
                    {/* Mesa asignada - DESTACADA */}
                    <div className="bg-white text-green-800 rounded-lg p-6">
                      <p className="text-xl font-semibold mb-2">🍽️ MESA ASIGNADA</p>
                      <p className="text-4xl font-bold">
                        {validationResult.registration.mesa}
                      </p>
                    </div>
                    
                    {/* Información adicional */}
                    <div className="bg-green-600 rounded p-4 text-green-100">
                      <p className="font-semibold">Comprador:</p>
                      <p className="text-lg">{validationResult.registration.compradorNombre}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-500 text-white rounded-lg p-8 text-center shadow-2xl">
                <div className="text-8xl mb-6">❌</div>
                <h2 className="text-4xl font-bold mb-6">
                  ACCESO DENEGADO
                </h2>
                
                <p className="text-red-100 text-xl">
                  {validationResult.error || 'La entrada no es válida'}
                </p>
              </div>
            )}
            
            {/* Botón para volver a escanear */}
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setValidationResult(null);
                  setQrData('');
                }}
                className="bg-gray-700 text-white py-3 px-6 rounded-full text-lg hover:bg-gray-600 transition-colors"
              >
                🔄 Escanear Otra Entrada
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}