const openai = require('../services/openai'); // Importamos la instancia única
const { handleFaqFlow } = require('./flows/faq.flow.js');
const { handleReservationFlow } = require('./flows/reservation.flow.js');

const INTENTS = [
    'RESERVAR', 'CONFIRMAR', 'CANCELAR_ACCION', 
    'PREGUNTAR_FAQ', 'SALUDO', 'DESPEDIDA', 'OTRO',
];

function buildIntentClassifierPrompt() {
    return `Tu única tarea es clasificar el mensaje del usuario en una de las siguientes categorías: ${INTENTS.join(', ')}. Responde únicamente con una de esas palabras en mayúsculas.

    ### Guía de Clasificación:
    - RESERVAR: Si el mensaje contiene detalles de una reserva (fecha, hora, personas) o si el usuario está respondiendo a una pregunta sobre su reserva (ej: "para 4 personas").
    - PREGUNTAR_FAQ: Para preguntas generales sobre el restaurante.
    - CONFIRMAR: **MUY IMPORTANTE:** Úsalo para afirmaciones cortas y directas como "sí", "dale", "ok", "correcto", "confirmo", "perfecto", especialmente si el mensaje anterior fue una pregunta de confirmación.
    - CANCELAR_ACCION: Para negaciones como "no", "cancela".
    - SALUDO: Para saludos simples como "hola".
    - DESPEDIDA: Para despedidas como "gracias".
    - OTRO: Si ninguna de las anteriores aplica.

    ### Ejemplos:
    - User: "Quiero una mesa para 2" -> RESERVAR
    - User: "para el viernes" -> RESERVAR
    - User: "¿Abren los lunes?" -> PREGUNTAR_FAQ
    - User: "sí" -> CONFIRMAR
    - User: "dale confirmo" -> CONFIRMAR
    - User: "no, mejor no" -> CANCELAR_ACCION`;
}

async function getIntent(userMessage) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: buildIntentClassifierPrompt() },
                { role: "user", content: userMessage }
            ],
            temperature: 0,
        });
        const intent = completion.choices[0].message.content.trim().toUpperCase();
        if (INTENTS.includes(intent)) {
            console.log(`[Orchestrator] Intención identificada: ${intent}`);
            return intent;
        }
        console.warn(`[Orchestrator] Intención no válida: ${intent}. Usando 'OTRO'.`);
        return 'OTRO';
    } catch (error) {
        console.error("Error al clasificar la intención:", error);
        return 'OTRO';
    }
}

/**
 * Orquesta la respuesta del bot, primero clasificando la intención
 * y luego delegando a la función de manejo apropiada.
 * @param {string} userMessage The message sent by the user.
 * @param {string} userPhone The user's phone number.
 * @returns {Promise<string>} The final AI-generated response.
 */
async function orchestrateResponse(userMessage, userPhone) {
  try {
    const intent = await getIntent(userMessage);

    switch (intent) {
      case 'RESERVAR':
      case 'CONFIRMAR':
      case 'CANCELAR_ACCION':
        return handleReservationFlow(userMessage, userPhone);

      case 'PREGUNTAR_FAQ':
      case 'SALUDO':
      case 'DESPEDIDA':
      case 'OTRO':
      default:
        return handleFaqFlow(userMessage, userPhone);
    }
  } catch (error) {
    console.error("Error en orchestrateResponse:", error);
    return "Lo siento, estoy teniendo un problema interno. Por favor, intenta de nuevo.";
  }
}

module.exports = {
    orchestrateResponse,
};
