# 🚀 Guía de Despliegue en Vercel con Base de Datos Persistente

## 📋 Resumen
Esta aplicación ahora usa **Vercel KV (Redis)** para almacenamiento persistente de registros, garantizando que los datos no se pierdan entre deploys.

## 🔧 Configuración en Vercel

### 1. **Crear Proyecto en Vercel**
```bash
# Conecta tu repositorio a Vercel
# Vercel detectará automáticamente que es Next.js
```

### 2. **Habilitar Vercel KV**
1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Storage** → **Create Database**
3. Selecciona **KV (Redis)**
4. Crea la base de datos
5. **¡Las variables de entorno se configuran automáticamente!**

### 3. **Variables de Entorno Requeridas**

#### 📧 **Email (Configurar manualmente):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

#### 🗄️ **Vercel KV (Automático):**
```env
# Estas se configuran automáticamente al crear la KV database:
KV_REST_API_URL=https://your-kv-url.upstash.io
KV_REST_API_TOKEN=your-kv-token
```

## 🏠 Desarrollo Local vs 🌐 Producción

### **Desarrollo Local:**
- ✅ Usa `Map` en memoria (datos temporales)
- ✅ No requiere configuración de KV real
- ✅ Variables dummy en `.env.local`

### **Producción en Vercel:**
- ✅ Usa Vercel KV (Redis) automáticamente
- ✅ Datos persistentes entre deploys
- ✅ Variables configuradas automáticamente

## 🎯 Flujo de Datos

### **Almacenamiento:**
```
registration:dni:12345678 → Datos completos del registro
registration:id:uuid-123 → Datos completos del registro
```

### **Búsquedas:**
- **Por DNI:** Verificar duplicados al registrar
- **Por ID:** Validar QR codes

## ✅ Verificación Post-Deploy

1. **Registrar un usuario** → Debe enviar email con QR
2. **Reiniciar la aplicación** → Los datos deben persistir
3. **Validar QR code** → Debe encontrar el registro
4. **Escanear con cámara** → Debe funcionar con HTTPS

## 🚨 Troubleshooting

### **Error: "Missing required environment variables"**
- ✅ Verifica que KV esté habilitado en Vercel
- ✅ Redeploy después de crear la KV database

### **QR codes no funcionan después del deploy**
- ✅ Verifica que los registros estén en KV
- ✅ Revisa los logs de Vercel Functions

### **Escáner de cámara no funciona**
- ✅ Verifica que tengas HTTPS (automático en Vercel)
- ✅ Prueba en diferentes navegadores

## 🎉 ¡Listo para Producción!

Una vez desplegado en Vercel con KV habilitado:
- 📱 **Registros persistentes** entre deploys
- 📧 **Emails con QR codes** funcionando
- 📷 **Escáner de cámara** con HTTPS
- 🔍 **Validación en tiempo real**