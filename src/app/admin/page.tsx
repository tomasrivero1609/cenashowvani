'use client';

import { useState } from 'react';

interface AdminResponse {
  success: boolean;
  message?: string;
  error?: string;
  registrationKeys?: string[];
  purchaseKeys?: string[];
  total?: number;
  deletedKeys?: number;
}

export default function AdminPage() {
  const [response, setResponse] = useState<AdminResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  const executeAction = async (action: string) => {
    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminKey: adminKey || undefined
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        error: 'Error de conexión'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔧 Panel Administrativo
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Gestión de Base de Datos - Cena Show Vani
          </p>
          <p className="text-lg text-red-500 font-semibold">
            ⚠️ USAR CON PRECAUCIÓN - ACCIONES IRREVERSIBLES
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clave Administrativa (opcional)
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ingresa la clave administrativa si está configurada"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => executeAction('list-keys')}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📋 Ver Datos
            </button>

            <button
              onClick={() => executeAction('clear-registrations')}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Borrar Registros
            </button>

            <button
              onClick={() => executeAction('clear-all')}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💥 Borrar Todo
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Procesando...</p>
            </div>
          )}

          {response && (
            <div className={`p-4 rounded-lg ${response.success ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'}`}>
              <h3 className={`font-bold ${response.success ? 'text-green-800' : 'text-red-800'}`}>
                {response.success ? '✅ Éxito' : '❌ Error'}
              </h3>
              
              {response.message && (
                <p className={response.success ? 'text-green-700' : 'text-red-700'}>
                  {response.message}
                </p>
              )}
              
              {response.error && (
                <p className="text-red-700">{response.error}</p>
              )}

              {response.total !== undefined && (
                <p className="text-gray-700 mt-2">
                  <strong>Total de registros:</strong> {response.total}
                </p>
              )}

              {response.deletedKeys !== undefined && (
                <p className="text-gray-700 mt-2">
                  <strong>Registros eliminados:</strong> {response.deletedKeys}
                </p>
              )}

              {response.registrationKeys && (
                <div className="mt-4">
                  <p className="font-semibold text-gray-700">Registraciones ({response.registrationKeys.length}):</p>
                  <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
                    {response.registrationKeys.map((key, index) => (
                      <div key={index} className="text-gray-600">{key}</div>
                    ))}
                  </div>
                </div>
              )}

              {response.purchaseKeys && (
                <div className="mt-4">
                  <p className="font-semibold text-gray-700">Compras ({response.purchaseKeys.length}):</p>
                  <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
                    {response.purchaseKeys.map((key, index) => (
                      <div key={index} className="text-gray-600">{key}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            ℹ️ Información sobre las acciones
          </h3>
          <ul className="text-yellow-700 space-y-2 text-sm">
            <li><strong>Ver Datos:</strong> Muestra todas las keys almacenadas sin borrar nada</li>
            <li><strong>Borrar Registros:</strong> Elimina solo las registraciones y compras, mantiene otros datos</li>
            <li><strong>Borrar Todo:</strong> Elimina TODOS los datos de la base de datos (irreversible)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}