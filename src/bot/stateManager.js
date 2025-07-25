// src/bot/stateManager.js

/**
 * Módulo de Gestión de Estado en Memoria
 * --------------------------------------
 * Este módulo centraliza el estado de las conversaciones y las reservas
 * para que pueda ser compartido a través de los diferentes flujos del bot.
 * 
 * En un entorno de producción, esto sería reemplazado por una base de datos
 * como Redis o MongoDB para persistencia y escalabilidad.
 */

// Memoria conversacional por número de teléfono
const chatHistories = {}; // { telefono: [ {role, content}, ... ] }
const MAX_HISTORY = 20;   // Máximo de mensajes a recordar por usuario

// Estado de reserva en progreso por número de teléfono
const reservationStates = {}; // { telefono: { name, date, time, sector, people, awaitingConfirmation: bool } }

/**
 * Obtiene el historial de chat para un usuario.
 * @param {string} userPhone - El número de teléfono del usuario.
 * @returns {Array} - El array de mensajes del historial.
 */
function getChatHistory(userPhone) {
  if (!chatHistories[userPhone]) {
    chatHistories[userPhone] = [];
  }
  return chatHistories[userPhone];
}

/**
 * Añade un mensaje al historial de un usuario, manejando la rotación.
 * @param {string} userPhone - El número de teléfono del usuario.
 * @param {object} message - El mensaje a añadir (ej: { role: 'user', content: '...' }).
 */
function addMessageToHistory(userPhone, message) {
    const history = getChatHistory(userPhone);
    history.push(message);

    // Mantiene el historial con un tamaño máximo para no consumir demasiada memoria
    if (history.length > MAX_HISTORY * 2) {
        chatHistories[userPhone] = history.slice(-MAX_HISTORY * 2);
    }
}

/**
 * Obtiene el estado de reserva para un usuario.
 * @param {string} userPhone - El número de teléfono del usuario.
 * @returns {object} - El objeto de estado de la reserva.
 */
function getReservationState(userPhone) {
  if (!reservationStates[userPhone]) {
    reservationStates[userPhone] = { awaitingConfirmation: false };
  }
  return reservationStates[userPhone];
}

/**
 * Limpia o resetea el estado de reserva de un usuario.
 * @param {string} userPhone - El número de teléfono del usuario.
 */
function clearReservationState(userPhone) {
    if (reservationStates[userPhone]) {
        delete reservationStates[userPhone];
    }
}

module.exports = {
  getChatHistory,
  addMessageToHistory,
  getReservationState,
  clearReservationState,
  // Exportamos los objetos directamente para usos avanzados si es necesario,
  // pero se prefiere el uso de los getters/setters.
  _chatHistories: chatHistories,
  _reservationStates: reservationStates 
}; 