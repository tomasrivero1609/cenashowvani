import RegistrationForm from './components/RegistrationForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎭 Panel de Ventas - Cena Show Vani
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Sistema de Gestión de Entradas - 11 de Octubre de 2024
          </p>
          <p className="text-lg text-gray-500">
            Genera entradas personalizadas para enviar por WhatsApp
          </p>
        </div>
        
        <RegistrationForm />
        
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              📝 Cómo usar el sistema
            </h3>
            <ol className="text-gray-600 space-y-2 text-sm">
              <li>1. Ingresa los datos del comprador</li>
              <li>2. Agrega todos los invitados (nombre y apellido)</li>
              <li>3. Se generan automáticamente las entradas con QR</li>
              <li>4. Se envían por email para compartir por WhatsApp</li>
            </ol>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              🎫 Qué incluye cada entrada
            </h3>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>✨ Cena completa de 3 tiempos</li>
              <li>🎭 Show en vivo</li>
              <li>🍷 Bebidas incluidas</li>
              <li>📱 Flyer horizontal con QR para WhatsApp</li>
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
