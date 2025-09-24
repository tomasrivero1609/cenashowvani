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
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('camera');
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
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            📱 Escáner de Entradas
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Cena Show Vani - 11 de Octubre 2024
          </p>

          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => {
                  setScanMode('manual');
                  stopScanning();
                }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  scanMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📝 Ingreso Manual
              </button>
              <button
                onClick={() => setScanMode('camera')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  scanMode === 'camera'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📷 Escanear con Cámara
              </button>
            </div>

            {scanMode === 'manual' ? (
              <div>
                <label htmlFor="qrData" className="block text-sm font-medium text-gray-700 mb-2">
                  Datos del Código QR
                </label>
                <textarea
                  id="qrData"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="Pega aquí los datos del código QR escaneado..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <video
                    ref={videoRef}
                    className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
                    style={{ display: isScanning ? 'block' : 'none' }}
                  />
                  {!isScanning && (
                    <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📷</div>
                        <p>Presiona "Iniciar Escáner" para usar la cámara</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {!isScanning ? (
                  <button
                    onClick={startScanning}
                    className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    📷 Iniciar Escáner
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    ⏹️ Detener Escáner
                  </button>
                )}
                
                {qrData && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-600 mb-1">Código QR detectado:</p>
                    <p className="font-mono text-sm break-all">{qrData}</p>
                  </div>
                )}
              </div>
            )}

            {scanMode === 'manual' && (
              <div className="flex gap-4">
                <button
                  onClick={validateQR}
                  disabled={!qrData.trim() || isValidating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isValidating ? 'Validando...' : 'Validar Entrada'}
                </button>
                
                <button
                  onClick={resetValidation}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          {validationResult && (
            <div className="mt-8">
              {validationResult.valid ? (
                <div className="bg-green-500 text-white rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-3xl font-bold mb-6">
                    ACCESO PERMITIDO
                  </h2>
                  
                  {validationResult.registration && (
                    <div className="space-y-3">
                      {/* Información principal */}
                      <div className="bg-green-600 rounded-lg p-4 mb-4">
                        <p className="text-2xl font-bold">{validationResult.registration.nombre}</p>
                        <p className="text-green-100">Entrada {validationResult.registration.numeroInvitado} de {validationResult.registration.totalInvitados}</p>
                      </div>
                      
                      {/* Mesa asignada - DESTACADA */}
                      <div className="bg-white text-green-800 rounded-lg p-6 mb-4">
                        <p className="text-lg font-semibold mb-2">🍽️ MESA ASIGNADA</p>
                        <p className="text-3xl font-bold">
                          {validationResult.registration.mesa}
                        </p>
                      </div>
                      
                      {/* Información adicional */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-100">
                        <div className="bg-green-600 rounded p-3">
                          <p className="font-semibold">Comprador:</p>
                          <p>{validationResult.registration.compradorNombre}</p>
                        </div>
                        <div className="bg-green-600 rounded p-3">
                          <p className="font-semibold">Estado:</p>
                          <p>{validationResult.registration.estado}</p>
                        </div>
                      </div>
                      
                      <div className="bg-green-600 rounded p-3 text-green-100">
                        <p className="font-semibold">Evento:</p>
                        <p>{validationResult.registration.evento}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-500 text-white rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">❌</div>
                  <h2 className="text-3xl font-bold mb-4">
                    ACCESO DENEGADO
                  </h2>
                  
                  <p className="text-red-100 text-lg">
                    {validationResult.error || 'La entrada no es válida'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              📱 Instrucciones:
            </h4>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. Presiona "Iniciar Escáner" para activar la cámara</li>
              <li>2. Apunta la cámara al código QR de la entrada</li>
              <li>3. El sistema validará automáticamente el acceso</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}