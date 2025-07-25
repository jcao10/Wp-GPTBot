# Arquitectura del Chatbot de Reservas para Restaurante

Este documento detalla la arquitectura técnica del chatbot de WhatsApp, explicando el flujo de la aplicación, el rol de cada componente y la interacción con servicios externos.

## 1. Visión General

El sistema está diseñado como una aplicación Node.js con Express, que actúa como un backend para un chatbot de WhatsApp. Su propósito principal es gestionar reservas de mesas para un restaurante, respondiendo a las consultas de los clientes de manera conversacional a través de la inteligencia artificial de OpenAI y utilizando Google Sheets como una base de datos simple para la disponibilidad y el registro de reservas.

## 2. Inicio de la Aplicación y Flujo Principal

La aplicación se inicia ejecutando el archivo principal `index.js`, que configura y lanza un servidor Express. Este servidor expone un endpoint de webhook (`/webhook`) que es el punto de entrada para todos los mensajes entrantes desde la API de WhatsApp Business.

### Diagrama de Flujo de Datos

```mermaid
sequenceDiagram
    participant User as Usuario (WhatsApp)
    participant WhatsAppAPI as WhatsApp API
    participant Server as Servidor (webhook.js)
    participant OpenAI as openai.js
    participant GSheets as googleSheets.js
    participant ExtOpenAI as API de OpenAI
    participant ExtGSheets as API de Google Sheets

    User->>WhatsAppAPI: Envía mensaje ("Quiero una mesa para 2 mañana")
    WhatsAppAPI->>Server: POST /webhook con el mensaje
    Server->>OpenAI: Llama a getChatGptResponse(mensaje, telefono)
    
    subgraph "Fase 1: Extracción de Intención"
        OpenAI->>ExtOpenAI: Llama a gpt-4o para extraer datos (extractReservationDetails)
        ExtOpenAI-->>OpenAI: Devuelve JSON {"date": "...", "people": 2, ...}
    end

    subgraph "Fase 2: Verificación de Disponibilidad"
        OpenAI->>GSheets: Llama a getAvailabilitySummary(fecha)
        GSheets->>ExtGSheets: Lee el spreadsheet
        ExtGSheets-->>GSheets: Devuelve filas de disponibilidad
        GSheets-->>OpenAI: Devuelve resumen de horarios libres
    end
    
    subgraph "Fase 3: Generación de Respuesta"
        OpenAI->>ExtOpenAI: Llama a gpt-3.5-turbo con prompt (reglas + disponibilidad)
        ExtOpenAI-->>OpenAI: Devuelve respuesta conversacional
    end
    
    OpenAI-->>Server: Retorna la respuesta final
    Server->>WhatsAppAPI: Envía la respuesta al usuario
    WhatsAppAPI-->>User: Muestra la respuesta en WhatsApp

    Note over User,ExtGSheets: Si el usuario confirma la reserva, el flujo es similar, pero openai.js llama a makeReservation en googleSheets.js, que escribe en la hoja de cálculo.
```

## 3. Desglose de Componentes Clave

Los siguientes archivos son el núcleo de la lógica de la aplicación.

### `config/restaurant-rules.js`
- **Rol:** Archivo de configuración central.
- **Descripción:** Contiene toda la lógica de negocio y las reglas del restaurante en un objeto JavaScript. Esto incluye horarios, políticas de reserva, textos de respuesta estándar, menús, etc. Centralizar las reglas aquí permite modificar el comportamiento del bot sin tocar el código de la lógica principal.

### `src/utils/contextFormatter.js`
- **Rol:** Formateador de contexto para la IA.
- **Descripción:** Su única función (`buildContextPrompt`) es leer las reglas de `restaurant-rules.js` y formatearlas en un texto claro y estructurado (el "prompt de sistema"). Este prompt le da a OpenAI todo el contexto que necesita para comportarse como un asistente de reservas para ese restaurante específico.

### `src/utils/dateHelpers.js`
- **Rol:** Utilidades de manejo de fechas.
- **Descripción:** Proporciona funciones para interpretar lenguaje natural relacionado con fechas (`parseRelativeDate` convierte "mañana" o "el próximo viernes" a formato `YYYY-MM-DD`) y para validar que una fecha solicitada sea válida según las reglas del negocio (`validateReservationDate`).

### `src/services/googleSheets.js`
- **Rol:** Capa de acceso a datos (Base de Datos).
- **Comunicación Externa:** Se conecta a la **API de Google Sheets**.
- **Descripción:** Abstrae toda la interacción con la hoja de cálculo de Google.
    - `getAvailability(date)`: Lee la hoja para obtener los horarios y sectores disponibles para una fecha específica.
    - `getAvailabilitySummary(date)`: Formatea los datos de disponibilidad en un resumen legible para humanos que se inyecta en el prompt de la IA.
    - `makeReservation(reservation)`: Encuentra una fila disponible que coincida con la solicitud y la actualiza con los datos del cliente (nombre y teléfono) para confirmar la reserva.

### `src/services/openai.js`
- **Rol:** El cerebro de la aplicación. Orquesta toda la lógica.
- **Comunicación Externa:** Se conecta a la **API de OpenAI**.
- **Descripción:** Este es el archivo más importante y coordina a todos los demás.
    1.  **Gestión de Estado:** Mantiene un registro del estado de la conversación para cada usuario (`chatHistories` y `reservationStates`), permitiendo un flujo de reserva de varios pasos (p. ej., pedir fecha, luego hora, luego personas).
    2.  **Extracción de Datos Estructurados (`extractReservationDetails`):**
        - Llama a `gpt-4o` con un prompt muy específico y técnico para convertir una frase del usuario ("una mesa para 3 mañana a las 9 en la terraza") en un objeto JSON (`{date: "YYYY-MM-DD", people: 3, sector: "Terraza"}`).
        - Utiliza `dateHelpers.js` para procesar y validar las fechas extraídas.
    3.  **Generación de Respuestas (`getChatGptResponse`):**
        - Si el usuario pide disponibilidad, llama a `googleSheets.js` para obtener los datos.
        - Construye el prompt del sistema utilizando `contextFormatter.js` y los datos de disponibilidad.
        - Envía el historial de la conversación, el prompt del sistema y el nuevo mensaje del usuario a `gpt-3.5-turbo` para obtener una respuesta natural y contextual.
    4.  **Confirmación de Reservas:** Si el usuario confirma una reserva, `openai.js` llama a `googleSheets.js` para escribir los datos en la hoja.

### `src/api/webhook.js`
- **Rol:** Punto de entrada de la API.
- **Descripción:** Contiene el endpoint de Express que recibe las notificaciones de la API de WhatsApp. Su única responsabilidad es tomar el mensaje entrante y el número de teléfono y pasárselos a `openai.js` para que se procesen. Luego, toma la respuesta generada y la envía de vuelta al usuario a través del servicio de WhatsApp. 