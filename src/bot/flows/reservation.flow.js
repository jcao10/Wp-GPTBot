const openai = require('../../services/openai'); // Importamos el cliente central
const { getAvailability } = require('../../services/sheetsReader'); // Actualizado
const { makeReservation } = require('../../services/sheetsWriter'); // Nuevo
const restaurantRules = require('../../../config/restaurant-rules');
const { parseRelativeDate, validateReservationDate } = require('../../utils/dateHelpers');
const { getChatHistory, addMessageToHistory, getReservationState, clearReservationState } = require('../stateManager');

// Ya no necesitamos crear una instancia de OpenAI aquí
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const confirmationWords = ["sí", "si", "confirmo", "dale", "ok", "de acuerdo", "correcto", "afirmativo", "confirmar", "vale"];

// --- FUNCIONES DE AYUDA ESPECÍFICAS PARA RESERVAS ---

function isReservationComplete(state) {
  return state && state.name && state.date && state.time && state.sector && state.people;
}

function buildReservationSummary(state) {
  return `Por favor, confirma tu reserva:\nNombre: ${state.name}\nFecha: ${state.date}\nHora: ${state.time}:00\nSector: ${state.sector}\nPersonas: ${state.people}\n¿Confirmas estos datos?`;
}

function isConfirmationMessage(msg) {
  const normalized = msg.trim().toLowerCase();
  return confirmationWords.some(word => normalized.includes(word));
}

function buildReservationParserPrompt() {
  const rules = restaurantRules;
  
  return `Tu única y más importante tarea es extraer datos de un texto y devolverlos SIEMPRE en formato JSON. Eres un procesador de datos, no un chatbot. No respondas de forma conversacional. NUNCA saludes ni hagas preguntas. Responde solo con el objeto JSON.

Current date: ${new Date().toISOString().split('T')[0]}

La estructura del JSON debe ser la siguiente:
{
  "isReservation": boolean,
  "name": string,
  "date": string,
  "time": string,
  "sector": string,
  "people": number
}

### Reglas Críticas:
1.  **PRIORIDAD MÁXIMA:** Tu respuesta DEBE ser únicamente un objeto JSON válido. Nada más.
2.  **"isReservation"**: Pon \`true\` si el usuario muestra cualquier intención de reservar (menciona "reserva", "mesa", una fecha, hora, o número de personas). Pon \`false\` para saludos, preguntas generales o cualquier otra cosa.
3.  **Campos Vacíos**: Si no encuentras información para un campo, déjalo como un string vacío "" (o null para 'people' si lo prefieres, pero sé consistente). NO inventes datos.
4.  **No confundir**: "Hola" no es un nombre.

### Ejemplos:
- User: "Hola" -> {"isReservation": false, "name": "", "date": "", "time": "", "sector": "", "people": null}
- User: "quiero una mesa para mañana a las 9" -> {"isReservation": true, "name": "", "date": "tomorrow", "time": "21:00", "sector": "", "people": null}
- User: "para 2 en la terraza, me llamo juan" -> {"isReservation": true, "name": "juan", "date": "", "time": "", "sector": "Terraza", "people": 2}
- User: "perfecto entonces quiero hacer una reserva para mañana a las 21 horas" -> {"isReservation": true, "name": "", "date": "tomorrow", "time": "21:00", "sector": "", "people": null}`;
}

async function generateMissingInfoResponse(missingInfo) {
  let requestText;
  if (missingInfo.length === 1) {
    requestText = `el siguiente dato: ${missingInfo[0]}`;
  } else {
    const lastItem = missingInfo.pop();
    requestText = `los siguientes datos: ${missingInfo.join(', ')} y ${lastItem}`;
  }

  // Prompt mejorado para evitar saludos repetitivos
  const prompt = `Eres un asistente de restaurante. Estás en medio de una conversación para tomar una reserva. El usuario ya ha proporcionado algunos datos.
  Tu tarea es pedirle, de forma natural y directa, la información que falta para completar la reserva.
  
  **No saludes de nuevo.** Ve directo al grano.
  
  Pídele al cliente ${requestText}.
  
  Varía tus respuestas para no sonar robótico. Por ejemplo: "¡Perfecto! Para continuar, solo necesito que me digas...", "¡Genial! Ya casi lo tenemos. ¿Podrías indicarme...", "Entendido. Ahora, por favor, dime...".`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating missing info response:", error);
    return `¡Casi lo tenemos! Para completar tu reserva, me falta que me digas: ${requestText}.`;
  }
}

async function extractReservationDetails(userMessage, userPhone) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: buildReservationParserPrompt() },
        { role: "user", content: userMessage }
      ],
    });
    const response = completion.choices[0].message.content.trim();
    console.log(`🤖 AI reservation parsing result: ${response}`);
    try {
      const reservationData = JSON.parse(response);
      reservationData.phone = userPhone;

      // --- INICIO: Lógica de procesamiento de fecha reincorporada ---
      if (reservationData.date) {
        // Convertir fechas relativas ("mañana", "próximo viernes") a formato YYYY-MM-DD
        reservationData.date = parseRelativeDate(reservationData.date);
        
        // Validar que la fecha sea válida según las reglas del negocio
        const dateValidation = validateReservationDate(reservationData.date, restaurantRules);
        if (!dateValidation.valid) {
          // Si no es válida, devolvemos un error específico para manejarlo.
          return {
            type: "date_error",
            error: dateValidation.error,
          };
        }
      }
      // --- FIN: Lógica de procesamiento de fecha reincorporada ---

      return { extractedData: reservationData };
    } catch (parseError) {
      console.error('Error parsing reservation JSON:', parseError);
    }
    return null;
  } catch (error) {
    console.error('Error extracting reservation details:', error);
    return null;
  }
}

// --- FUNCIÓN PRINCIPAL DEL FLUJO DE RESERVA ---

async function handleReservationFlow(userMessage, userPhone) {
  const history = getChatHistory(userPhone);
  const state = getReservationState(userPhone);

  if (state.awaitingConfirmation && isConfirmationMessage(userMessage)) {
    if (!isReservationComplete(state)) {
        const missing = [];
        if (!state.name) missing.push('nombre');
        if (!state.date) missing.push('fecha');
        if (!state.time) missing.push('hora');
        if (!state.sector) missing.push('sector');
        if (!state.people) missing.push('personas');
        return `Antes de confirmar, necesito que me indiques: ${missing.join(', ')}.`;
    }

    // --- INICIO DE LA NUEVA LÓGICA DE DISPONIBILIDAD INTELIGENTE ---
    console.log(`[ReservationFlow] Verifying availability for:`, state);
    const availableSlots = await getAvailability(state.date); // Obtenemos TODOS los slots libres

    const requestedSlot = availableSlots.find(s =>
      parseInt(s.time) === parseInt(state.time) &&
      s.sector.toLowerCase() === state.sector.toLowerCase()
    );

    if (!requestedSlot) {
      // El slot solicitado ya no está disponible. Vamos a sugerir alternativas.
      console.log(`[ReservationFlow] Requested slot is no longer available. Searching for alternatives.`);
      
      let suggestion = `¡Uy! No hay disponibilidad para las ${state.time}:00 hs en ${state.sector}. `;
      const alternativeSectors = availableSlots.filter(s => parseInt(s.time) === parseInt(state.time));
      const alternativeTimes = [...new Set(availableSlots.map(s => s.time))].sort();

      if (alternativeSectors.length > 0) {
        const sectors = alternativeSectors.map(s => s.sector).join(' o ');
        suggestion += `A esa misma hora todavía tengo lugar en ${sectors}. `;
      } else if (alternativeTimes.length > 0) {
        const times = alternativeTimes.map(t => `${t}:00 hs`).join(', ');
        suggestion += `Para esa fecha, me quedan lugares disponibles a las: ${times}. `;
      } else {
        suggestion = `Lamentablemente, ya no me queda disponibilidad para el ${state.date}. ¿Te gustaría que busquemos para otro día?`;
      }

      if (alternativeTimes.length > 0) {
        suggestion += `¿Quieres reservar en alguna de estas opciones?`;
      }
      
      // Devolvemos la sugerencia sin limpiar el estado, para que el usuario pueda elegir.
      state.awaitingConfirmation = false; // Permitimos que el usuario responda a la nueva pregunta.
      addMessageToHistory(userPhone, { role: "assistant", content: suggestion });
      return suggestion;
    }

    // Si el slot está disponible, procedemos con la reserva.
    console.log(`[ReservationFlow] Slot is available. Proceeding to write reservation.`);
    const result = await makeReservation(state);
    clearReservationState(userPhone);
    const response = result.success ? `¡Reserva confirmada! ${result.message}` : `No se pudo confirmar la reserva: ${result.message}`;
    addMessageToHistory(userPhone, { role: "user", content: userMessage });
    addMessageToHistory(userPhone, { role: "assistant", content: response });
    return response;
    // --- FIN DE LA NUEVA LÓGICA ---
  }

  if (state.awaitingConfirmation && userMessage.trim().toLowerCase().startsWith("no")) {
    state.awaitingConfirmation = false;
    clearReservationState(userPhone);
    return "¡Entendido! Empecemos de nuevo. ¿Qué necesitas?";
  }

  const reservationDetails = await extractReservationDetails(userMessage, userPhone);
  if (reservationDetails && reservationDetails.type === 'date_error') {
    return reservationDetails.error;
  }

  // --- INICIO DE LA LÓGICA COMPLETADA ---
  const data = reservationDetails ? reservationDetails.extractedData : null;
  if (data) {
    console.log("📝 Updating reservation state with any extracted data:", data);
    if (data.name && data.name !== "") state.name = data.name;
    if (data.date) state.date = data.date;
    if (data.time) state.time = data.time;
    if (data.sector) state.sector = data.sector;
    if (data.people) state.people = data.people;
    if (data.phone) state.phone = data.phone;
  }
  // --- FIN DE LA LÓGICA COMPLETADA ---

  if (isReservationComplete(state)) {
    state.awaitingConfirmation = true;
    const summary = buildReservationSummary(state);
    addMessageToHistory(userPhone, { role: "user", content: userMessage });
    addMessageToHistory(userPhone, { role: "assistant", content: summary });
    return summary;
  }

  // --- INICIO DE LA LÓGICA COMPLETADA ---
  const missing = [];
  if (!state.name) missing.push('tu nombre');
  if (!state.date) missing.push('la fecha');
  if (!state.time) missing.push('la hora');
  if (!state.people) missing.push('la cantidad de personas');
  if (!state.sector) missing.push('el sector (Interior o Terraza)');
  // --- FIN DE LA LÓGICA COMPLETADA ---

  if (missing.length > 0) {
    const response = await generateMissingInfoResponse(missing);
    addMessageToHistory(userPhone, { role: "user", content: userMessage });
    addMessageToHistory(userPhone, { role: "assistant", content: response });
    return response;
  }

  return "Me he perdido un poco con la reserva. ¿Podemos intentarlo de nuevo?";
}

module.exports = {
    handleReservationFlow,
};
