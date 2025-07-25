/**
 * Date Helper Functions for Spanish Date Processing
 */

/**
 * Converts relative date expressions in Spanish to YYYY-MM-DD format
 * @param {string} dateExpression - Date expression like "hoy", "mañana", "pasado mañana"
 * @returns {string} Date in YYYY-MM-DD format
 */
function parseRelativeDate(dateExpression) {
  // Si la entrada ya es YYYY-MM-DD, devolverla tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateExpression.trim())) {
    console.log(`[parseRelativeDate] Entrada: '${dateExpression}' => ${dateExpression.trim()} (sin cambios)`);
    return dateExpression.trim();
  }
  const today = new Date();
  const expression = dateExpression.toLowerCase().trim();

  // Remove common words
  const cleanExpression = expression
    .replace(/\b(el|la|para|de|del|en)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let targetDate = new Date(today);

  if (cleanExpression.includes('hoy') || cleanExpression.includes('today')) {
    // Today - no change needed
  } else if (cleanExpression.includes('mañana') || cleanExpression.includes('tomorrow')) {
    targetDate.setDate(today.getDate() + 1);
  } else if (cleanExpression.includes('pasado mañana') || cleanExpression.includes('day after tomorrow')) {
    targetDate.setDate(today.getDate() + 2);
  } else if (cleanExpression.includes('esta noche') || cleanExpression.includes('tonight')) {
    // Tonight = today
  } else if (cleanExpression.includes('próximo') || cleanExpression.includes('proximo') || cleanExpression.includes('next')) {
    // Handle "próximo viernes", "next friday", etc.
    const dayNames = {
      'lunes': 1, 'monday': 1,
      'martes': 2, 'tuesday': 2,
      'miércoles': 3, 'miercoles': 3, 'wednesday': 3,
      'jueves': 4, 'thursday': 4,
      'viernes': 5, 'friday': 5,
      'sábado': 6, 'sabado': 6, 'saturday': 6,
      'domingo': 0, 'sunday': 0
    };
    for (const [dayName, dayNum] of Object.entries(dayNames)) {
      if (cleanExpression.includes(dayName)) {
        const daysUntilTarget = (dayNum - today.getDay() + 7) % 7;
        const finalDays = daysUntilTarget === 0 ? 7 : daysUntilTarget; // Next week if same day
        targetDate.setDate(today.getDate() + finalDays);
        break;
      }
    }
  } else {
    // Try to parse specific dates like "2 de julio", "15/07", etc.
    const datePatterns = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/,  // DD/MM/YYYY or DD-MM-YYYY
      /^(\d{1,2})\s+de\s+(\w+)/,  // "2 de julio"
    ];
    for (const pattern of datePatterns) {
      const match = cleanExpression.match(pattern);
      if (match) {
        if (pattern.source.includes('de')) {
          // Handle "2 de julio" format
          const day = parseInt(match[1]);
          const monthName = match[2].toLowerCase();
          const monthMap = {
            'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
            'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
            'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
          };
          if (monthMap.hasOwnProperty(monthName)) {
            const year = today.getFullYear();
            targetDate = new Date(year, monthMap[monthName], day);
            // Si la fecha ya pasó este año, usar el año siguiente
            if (targetDate < today) {
              targetDate.setFullYear(year + 1);
            }
          }
        } else {
          // Handle DD/MM/YYYY or DD-MM-YYYY format
          let day = parseInt(match[1]);
          let month = parseInt(match[2]);
          let year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
          // Si el año es claramente mayor a 31, asumimos que el formato es YYYY-MM-DD
          if (day > 31) {
            // swap day/year
            [year, day] = [day, year];
          }
          // JS months are 0-based
          targetDate = new Date(year, month - 1, day);
        }
        break;
      }
    }
  }
  // DEBUG: Log la fecha final parseada
  console.log(`[parseRelativeDate] Entrada: '${dateExpression}' => ${targetDate.toISOString().split('T')[0]}`);
  return targetDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

/**
 * Formats a date for display in Spanish
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date in Spanish
 */
function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Check if it's today or tomorrow
  if (dateStr === today.toISOString().split('T')[0]) {
    return 'hoy';
  } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
    return 'mañana';
  }
  
  // Format as DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Validates if a date is within acceptable booking range
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {Object} rules - Restaurant rules object
 * @returns {Object} Validation result
 */
function validateReservationDate(dateStr, rules) {
  // Create dates in a consistent way to avoid timezone issues
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone edge cases
  const today = new Date();
  
  // Reset both dates to start of day for fair comparison
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  console.log(`🔍 Date validation: comparing ${dateStr} (${date.toISOString()}) with today (${today.toISOString()})`);
  
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  
  // Check if restaurant is closed that day
  if (rules.schedule.closedDays.includes(dayOfWeek)) {
    return {
      valid: false,
      error: `Los ${dayOfWeek === 'Monday' ? 'lunes' : 'días seleccionados'} permanecemos cerrados.`
    };
  }
  
  // Check if date is in the past
  if (date < today) {
    console.log(`❌ Date ${dateStr} is in the past`);
    return {
      valid: false,
      error: 'No podemos hacer reservas para fechas pasadas.'
    };
  }
  
  // Check if date is too far in the future
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + rules.reservationRules.maxAdvanceDays);
  
  if (date > maxDate) {
    return {
      valid: false,
      error: `Solo aceptamos reservas hasta ${rules.reservationRules.maxAdvanceDays} días de anticipación.`
    };
  }
  
  console.log(`✅ Date ${dateStr} is valid for reservation`);
  return { valid: true };
}

module.exports = {
  parseRelativeDate,
  formatDateForDisplay,
  validateReservationDate
}; 