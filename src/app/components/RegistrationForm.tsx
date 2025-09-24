'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const guestSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

const registrationSchema = z.object({
  // Datos del comprador
  compradorNombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  compradorEmail: z.string().email('Ingresa un email válido'),
  compradorTelefono: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').optional(),
  
  // Lista de invitados
  invitados: z.array(guestSchema).min(1, 'Debe agregar al menos un invitado'),
});

type RegistrationData = z.infer<typeof registrationSchema>;

export default function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      invitados: [{ nombre: '' }], // Empezar con un invitado
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invitados',
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
        setSubmitMessage(`¡Entradas generadas exitosamente! Se han enviado ${data.invitados.length} entradas al email: ${data.compradorEmail}`);
        reset({ invitados: [{ nombre: '' }] });
      } else {
        setSubmitMessage('Error al generar las entradas. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      setSubmitMessage('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Generar Entradas
      </h2>
      <p className="text-center text-gray-600 mb-6">
        Completa los datos del comprador y agrega todos los invitados
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos del Comprador */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Datos del Comprador</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="compradorNombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre y Apellido *
              </label>
              <input
                {...register('compradorNombre')}
                type="text"
                id="compradorNombre"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: María González"
              />
              {errors.compradorNombre && (
                <p className="text-red-500 text-sm mt-1">{errors.compradorNombre.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="compradorEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                {...register('compradorEmail')}
                type="email"
                id="compradorEmail"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ejemplo@email.com"
              />
              {errors.compradorEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.compradorEmail.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="compradorTelefono" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono (opcional)
            </label>
            <input
              {...register('compradorTelefono')}
              type="tel"
              id="compradorTelefono"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: 1123456789"
            />
            {errors.compradorTelefono && (
              <p className="text-red-500 text-sm mt-1">{errors.compradorTelefono.message}</p>
            )}
          </div>
        </div>

        {/* Lista de Invitados */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🎫 Lista de Invitados</h3>
            <button
              type="button"
              onClick={() => append({ nombre: '' })}
              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              + Agregar Invitado
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    {...register(`invitados.${index}.nombre`)}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Nombre y apellido del invitado ${index + 1}`}
                  />
                  {errors.invitados?.[index]?.nombre && (
                    <p className="text-red-500 text-sm mt-1">{errors.invitados[index]?.nombre?.message}</p>
                  )}
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="bg-red-500 text-white px-2 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {errors.invitados && (
            <p className="text-red-500 text-sm mt-2">{errors.invitados.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Generando entradas...' : `Generar ${fields.length} Entrada${fields.length > 1 ? 's' : ''}`}
        </button>
      </form>

      {submitMessage && (
        <div className={`mt-4 p-3 rounded-md text-center ${
          submitMessage.includes('exitosamente') 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {submitMessage}
        </div>
      )}
    </div>
  );
}