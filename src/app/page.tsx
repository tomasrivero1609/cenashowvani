import RegistrationForm from './components/RegistrationForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎭 Sistema de Registro - Cena Show Vani
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Panel de Administración - 11 de Octubre de 2024
          </p>
          <p className="text-lg text-gray-500">
            Registra invitados y genera confirmaciones automáticas
          </p>
        </div>
        
        <RegistrationForm />
        
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              📝 Cómo funciona
            </h3>
            <ol className="text-gray-600 space-y-2 text-sm">
              <li>1. Registra los datos del invitado</li>
              <li>2. Se genera automáticamente un QR único</li>
              <li>3. Se envía por email la confirmación con el QR</li>
              <li>4. El invitado presenta el QR en el evento</li>
            </ol>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              🎫 Qué incluye la entrada
            </h3>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>✨ Cena completa de 3 tiempos</li>
              <li>🎭 Show en vivo</li>
              <li>🍷 Bebidas incluidas</li>
              <li>📱 Confirmación digital con QR</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/validate" 
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            🔍 Ir al Validador de Entradas
          </a>
        </div>
      </div>
    </div>
  );
}
