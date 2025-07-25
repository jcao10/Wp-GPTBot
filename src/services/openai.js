const OpenAI = require('openai');

/**
 * Instancia única (Singleton) del cliente de OpenAI.
 * 
 * Al centralizar la creación del cliente aquí, nos aseguramos de que toda la
 * aplicación utilice una única configuración y conexión a la API de OpenAI.
 * Esto mejora la consistencia y la eficiencia.
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openai; 