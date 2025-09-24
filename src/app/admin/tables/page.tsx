'use client';

import { useState, useEffect } from 'react';

interface Registration {
  id: string;
  nombre: string;
  compradorNombre: string;
  numeroInvitado: number;
  totalInvitados: number;
  mesa: string;
  estado: string;
  fechaRegistro: string;
}

export default function TablesAdmin() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningTable, setAssigningTable] = useState<string | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const response = await fetch('/api/assign-table?action=list-all');
      const data = await response.json();
      
      if (data.success) {
        setRegistrations(data.registrations || []);
      }
    } catch (error) {
      console.error('Error cargando registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignTable = async (registrationId: string, tableNumber: string) => {
    if (!tableNumber.trim()) return;
    
    setAssigningTable(registrationId);
    
    try {
      const response = await fetch('/api/assign-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          mesa: `Mesa ${tableNumber}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar la lista local
        setRegistrations(prev => 
          prev.map(reg => 
            reg.id === registrationId 
              ? { ...reg, mesa: `Mesa ${tableNumber}` }
              : reg
          )
        );
        alert(`Mesa ${tableNumber} asignada exitosamente`);
      } else {
        alert('Error asignando mesa: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setAssigningTable(null);
    }
  };

  const handleTableAssignment = (registrationId: string) => {
    const tableNumber = prompt('Ingresa el número de mesa (ej: 1, 2, 3...):');
    if (tableNumber) {
      assignTable(registrationId, tableNumber);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              🍽️ Administración de Mesas
            </h1>
            <button
              onClick={loadRegistrations}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              📊 Resumen del Evento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Registros:</span> {registrations.length}
              </div>
              <div>
                <span className="font-medium">Mesas Asignadas:</span> {registrations.filter(r => r.mesa !== 'Sin asignar').length}
              </div>
              <div>
                <span className="font-medium">Sin Asignar:</span> {registrations.filter(r => r.mesa === 'Sin asignar').length}
              </div>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay registros disponibles
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Los registros aparecerán aquí después de que se generen entradas
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Invitado</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Comprador</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Entrada</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Mesa Actual</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <div className="font-medium">{registration.nombre}</div>
                          <div className="text-sm text-gray-500">
                            ID: {registration.id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {registration.compradorNombre}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {registration.numeroInvitado} de {registration.totalInvitados}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          registration.mesa === 'Sin asignar' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {registration.mesa}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => handleTableAssignment(registration.id)}
                          disabled={assigningTable === registration.id}
                          className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                        >
                          {assigningTable === registration.id ? '⏳' : '🍽️'} 
                          {registration.mesa === 'Sin asignar' ? 'Asignar Mesa' : 'Cambiar Mesa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              💡 Instrucciones
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Haz clic en "Asignar Mesa" para asignar una mesa a un invitado</li>
              <li>• Puedes cambiar la mesa de un invitado en cualquier momento</li>
              <li>• El staff verá la información de mesa al escanear el QR</li>
              <li>• Los registros se actualizan automáticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}