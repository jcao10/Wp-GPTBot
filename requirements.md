# Requerimientos del Chatbot de Reservas para Restaurante

## 1. Funcionalidades Principales

- **Gestión de Reservas:**
  - Crear nuevas reservas (solicitar fecha, hora, número de personas).
  - Modificar reservas existentes.
  - Cancelar reservas.

- **Confirmaciones y Recordatorios:**
  - Enviar una confirmación inmediata por WhatsApp al crear la reserva.
  - Enviar recordatorios automáticos 24 horas antes de la reserva.

- **Preguntas Frecuentes (FAQs):**
  - Responder preguntas comunes sobre horarios, ubicación, menú, etc.

- **Derivación a un Agente Humano (Human Handoff):**
  - Permitir al usuario solicitar hablar con una persona en cualquier momento.

- **Soporte Multilingüe:**
  - Capacidad para interactuar en español e inglés (inicialmente).

- **Integración con Sistema del Restaurante:**
  - Sincronizar la disponibilidad de mesas con el sistema de gestión interno.

## 2. Requerimientos Técnicos

- **Plataforma de Mensajería:** WhatsApp Business API.
- **Backend:** Node.js con el framework Express.
- **Base de Datos:** MongoDB (utilizando MongoDB Atlas para el despliegue).
- **Procesamiento de Lenguaje Natural (PLN):** Dialogflow, Rasa, o una API similar (por definir).
- **Despliegue:** Plataforma en la nube como Heroku, AWS o Vercel.
- **Pruebas Locales:** Ngrok para exponer el webhook local.
- **Cumplimiento Normativo:** Adherencia a las normativas de protección de datos (GDPR). 