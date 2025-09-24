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

  const assignTableToGroup = async (purchaseId: string, tableNumber: string) => {
    if (!tableNumber.trim()) return;
    
    setAssigningTable(purchaseId);
    
    try {
      // Obtener todos los registros del mismo comprador
      const groupRegistrations = registrations.filter(reg => 
        reg.compradorNombre === purchaseId // Usamos compradorNombre como identificador del grupo
      );

      // Asignar la misma mesa a todos los registros del grupo
      const promises = groupRegistrations.map(registration => 
        fetch('/api/assign-table', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registrationId: registration.id,
            mesa: `Mesa ${tableNumber}`
          }),
        })
      );

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(response => response.ok);
      
      if (allSuccessful) {
        // Actualizar la lista local
        setRegistrations(prev => 
          prev.map(reg => 
            groupRegistrations.some(groupReg => groupReg.id === reg.id)
              ? { ...reg, mesa: `Mesa ${tableNumber}` }
              : reg
          )
        );
        alert(`Mesa ${tableNumber} asignada a ${groupRegistrations.length} entrada(s) del grupo "${purchaseId}"`);
      } else {
        alert('Error asignando mesa al grupo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setAssigningTable(null);
    }
  };

  const handleIndividualTableAssignment = (registrationId: string) => {
    const tableNumber = prompt('Asignar mesa individual.\nIngresa el número de mesa (ej: 1, 2, 3...):');
    if (tableNumber) {
      assignTable(registrationId, tableNumber);
    }
  };

  const handleGroupTableAssignment = (compradorNombre: string) => {
    const tableNumber = prompt(`Asignar mesa al grupo de "${compradorNombre}".\nIngresa el número de mesa (ej: 1, 2, 3...):`);
    if (tableNumber) {
      assignTableToGroup(compradorNombre, tableNumber);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🍽️ Administración de Mesas
            </h1>
            <button
              onClick={loadRegistrations}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium border border-blue-500"
            >
              🔄 Actualizar
            </button>
          </div>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              📊 Resumen del Evento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-gray-800">
                <span className="font-bold text-gray-900">Total Registros:</span> <span className="font-medium">{registrations.length}</span>
              </div>
              <div className="text-gray-800">
                <span className="font-bold text-gray-900">Mesas Asignadas:</span> <span className="font-medium">{registrations.filter(r => r.mesa !== 'Sin asignar').length}</span>
              </div>
              <div className="text-gray-800">
                <span className="font-bold text-gray-900">Sin Asignar:</span> <span className="font-medium">{registrations.filter(r => r.mesa === 'Sin asignar').length}</span>
              </div>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700 text-lg font-medium">
                No hay registros disponibles
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Los registros aparecerán aquí después de que se generen entradas
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Agrupar registros por comprador */}
              {Object.entries(
                registrations.reduce((groups, registration) => {
                  const comprador = registration.compradorNombre;
                  if (!groups[comprador]) {
                    groups[comprador] = [];
                  }
                  groups[comprador].push(registration);
                  return groups;
                }, {} as Record<string, Registration[]>)
              ).map(([compradorNombre, groupRegistrations]) => (
                <div key={compradorNombre} className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                  {/* Header del grupo */}
                  <div className="bg-blue-100 px-6 py-4 border-b-2 border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-blue-900">
                          👤 {compradorNombre}
                        </h3>
                        <p className="text-blue-700 font-medium">
                          {groupRegistrations.length} entrada{groupRegistrations.length > 1 ? 's' : ''} • 
                          Mesa actual: <span className="font-bold">
                            {groupRegistrations[0].mesa}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleGroupTableAssignment(compradorNombre)}
                        disabled={assigningTable === compradorNombre}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 font-bold border border-purple-500"
                      >
                        {assigningTable === compradorNombre ? '⏳ Asignando...' : '🍽️ Asignar Mesa al Grupo'}
                      </button>
                    </div>
                  </div>

                  {/* Lista de invitados del grupo */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-900">Invitado</th>
                          <th className="border border-gray-300 px-4 py-2 text-center font-bold text-gray-900">Entrada</th>
                          <th className="border border-gray-300 px-4 py-2 text-center font-bold text-gray-900">Mesa</th>
                          <th className="border border-gray-300 px-4 py-2 text-center font-bold text-gray-900">Acción Individual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupRegistrations.map((registration) => (
                          <tr key={registration.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">
                              <div>
                                <div className="font-bold text-gray-900">{registration.nombre}</div>
                                <div className="text-sm text-gray-600">
                                  ID: {registration.id.substring(0, 8)}...
                                </div>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center text-gray-800 font-medium">
                              {registration.numeroInvitado} de {registration.totalInvitados}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-sm font-bold border ${
                                registration.mesa === 'Sin asignar' 
                                  ? 'bg-red-100 text-red-900 border-red-300' 
                                  : 'bg-green-100 text-green-900 border-green-300'
                              }`}>
                                {registration.mesa}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <button
                                onClick={() => handleIndividualTableAssignment(registration.id)}
                                disabled={assigningTable === registration.id}
                                className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors disabled:opacity-50 border border-gray-400"
                              >
                                {assigningTable === registration.id ? '⏳' : '✏️'} Individual
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              💡 Instrucciones
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1 font-medium">
              <li>• <strong>🍽️ Asignar Mesa al Grupo:</strong> Asigna la misma mesa a todas las entradas del comprador</li>
              <li>• <strong>✏️ Individual:</strong> Cambia la mesa de una sola entrada específica</li>
              <li>• Los grupos se organizan por comprador para facilitar la asignación</li>
              <li>• El staff verá la información de mesa al escanear cada QR individual</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}