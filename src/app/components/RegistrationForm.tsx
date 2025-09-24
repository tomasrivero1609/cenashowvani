'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registrationSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  dni: z.string().min(7, 'El DNI debe tener al menos 7 caracteres').max(8, 'El DNI no puede tener más de 8 caracteres'),
  email: z.string().email('Ingresa un email válido'),
});

type RegistrationData = z.infer<typeof registrationSchema>;

export default function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationData) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitMessage(`¡Registro exitoso! Se ha enviado la confirmación con el código QR al email: ${data.email}`);
        reset();
      } else {
        setSubmitMessage('Error al procesar el registro. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      setSubmitMessage('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Registrar Invitado
      </h2>
      <p className="text-center text-gray-600 mb-6">
        Completa los datos para generar la confirmación
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ejemplo@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo
          </label>
          <input
            {...register('nombre')}
            type="text"
            id="nombre"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ingresa tu nombre completo"
          />
          {errors.nombre && (
            <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            {...register('telefono')}
            type="tel"
            id="telefono"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 1123456789"
          />
          {errors.telefono && (
            <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
            DNI
          </label>
          <input
            {...register('dni')}
            type="text"
            id="dni"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 12345678"
          />
          {errors.dni && (
            <p className="text-red-500 text-sm mt-1">{errors.dni.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Generando confirmación...' : 'Registrar y Enviar Confirmación'}
        </button>
      </form>

      {submitMessage && (
        <div className={`mt-4 p-3 rounded-md text-center ${
          submitMessage.includes('exitoso') 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {submitMessage}
        </div>
      )}
    </div>
  );
}