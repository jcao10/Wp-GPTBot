const fs = require('fs').promises;
const path = require('path');
const openai = require('../../services/openai'); // Importamos el cliente central
const { getChatHistory, addMessageToHistory } = require('../stateManager');

// Ya no necesitamos crear una instancia de OpenAI aquí
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const FAQ_FILE_PATH = path.join(__dirname, '../../../config/faq-data.txt');

/**
 * Lee la base de conocimiento desde el archivo de texto.
 * @returns {Promise<string>} El contenido del archivo de FAQs.
 */
async function getFaqKnowledgeBase() {
    try {
        const content = await fs.readFile(FAQ_FILE_PATH, 'utf-8');
        return content;
    } catch (error) {
        console.error('Error al leer el archivo de FAQ:', error);
        return 'Error interno: No pude acceder a mi base de conocimiento.';
    }
}

/**
 * Construye el prompt de sistema para el flujo de FAQ.
 * @param {string} knowledgeBase - La base de conocimiento leída del archivo.
 * @returns {string} El prompt de sistema completo.
 */
function buildFaqSystemPrompt(knowledgeBase) {
    return `Eres un asistente de inteligencia artificial para el restaurante "La Parrilla del Sur".
    Tu tono debe ser amigable, profesional y con un toque argentino.
    Tu tarea es responder a las preguntas del usuario basándote únicamente en la siguiente información de tu base de conocimiento.
    No inventes información que no esté escrita aquí. Si no sabes la respuesta, di que no tienes esa información y que pueden contactar al restaurante.

    ### Base de Conocimiento ###
    ${knowledgeBase}
    ############################`;
}

/**
 * Maneja las preguntas frecuentes y conversaciones generales.
 * @param {string} userMessage - El mensaje del usuario.
 * @param {string} userPhone - El número de teléfono del usuario.
 * @returns {Promise<string>} La respuesta generada por la IA.
 */
async function handleFaqFlow(userMessage, userPhone) {
    try {
        const knowledgeBase = await getFaqKnowledgeBase();
        const systemPrompt = buildFaqSystemPrompt(knowledgeBase);
        const history = getChatHistory(userPhone);

        const messages = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userMessage }
        ];
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
        });

        const response = completion.choices[0].message.content;

        // Actualizamos el historial con la interacción actual
        addMessageToHistory(userPhone, { role: "user", content: userMessage });
        addMessageToHistory(userPhone, { role: "assistant", content: response });

        return response;

    } catch (error) {
        console.error("Error en handleFaqFlow:", error);
        return "Lo siento, estoy teniendo un problema para responder. Por favor, intenta de nuevo.";
    }
}

module.exports = {
    handleFaqFlow,
};
