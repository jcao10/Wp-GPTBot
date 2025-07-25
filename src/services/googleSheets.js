const { google } = require('googleapis');
const path = require('path');

// Path to your service account key file
const KEYFILE = path.join(__dirname, '../../config/google-credentials.json');

// Your Google Sheets ID (extracted from the URL)
const SPREADSHEET_ID = '1lVvwN7w8cpWq_iaDzDbmPRVb8_SitA8lf4hspAYCmAw';

// Initialize the Google Sheets API
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Normaliza fechas textuales (ej: 'Friday, 4 July 2025') a formato YYYY-MM-DD
 * @param {string} dateStr - Fecha en cualquier formato
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function normalizeSheetDate(dateStr) {
  if (!dateStr) return '';
  // Si ya es YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Si es DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Si es textual tipo 'Friday, 4 July 2025'
  const match = dateStr.match(/\w+,?\s*(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const year = match[3];
    const monthMap = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    const month = monthMap[monthName];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }
  // Si no se puede parsear, devolver original
  return dateStr;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD for easier comparison
 * @param {string} dateStr - Date in DD/MM/YYYY format
 * @returns {string} Date in YYYY-MM-DD format
 */
function convertDateFormat(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

/**
 * Reads availability data from the Google Sheet
 * @param {string} date - Date in YYYY-MM-DD format (optional)
 * @returns {Promise<Array>} Array of availability objects
 */
async function getAvailability(date = null) {
  try {
    console.log(`📊 Reading Google Sheets for date: ${date || 'all dates'}`);
    
    const range = 'A:G'; // Read columns A through G to get all data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('⚠️ No data found in the sheet.');
      return [];
    }

    console.log(`✅ Successfully read ${rows.length - 1} rows from Google Sheets`);

    // Skip the header row and convert to objects
    const availability = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowDate = normalizeSheetDate(row[0] || ''); // Normaliza cualquier formato a YYYY-MM-DD
      
      const availabilityData = {
        originalDate: row[0] || '', // Columna A: Fecha
        date: rowDate,             // Columna A: Fecha (normalizada)
        sector: row[1] || '',      // Columna B: Sector
        available: parseInt(row[2]) || 0, // Columna C: Capacidad mesa
        time: row[3] || '',        // Columna D: Hora
        reservedName: row[4] || '',  // Columna E: Nombre
        reservedPhone: row[5] || '', // Columna F: WhatsApp
        isReserved: !!(row[4] && row[4].trim()) // Está reservado si la columna E (Nombre) tiene contenido.
      };

      // Filter by date if provided
      if (!date || availabilityData.date === date) {
        availability.push(availabilityData);
      }
    }

    console.log(`📋 Filtered availability data:`, availability);
    return availability;
  } catch (error) {
    console.error('❌ Error reading from Google Sheets:', error);
    return [];
  }
}

/**
 * Gets a summary of availability for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<string>} Human-readable summary
 */
async function getAvailabilitySummary(date) {
  const availability = await getAvailability(date);
  
  if (availability.length === 0) {
    return `No se encontraron datos de disponibilidad para ${date}.`;
  }

  let summary = `Disponibilidad para ${availability[0].originalDate} (solo horarios y sectores libres):\n\n`;
  // Agrupar por hora y sector solo los libres
  const timeSlots = {};
  availability.forEach(slot => {
    if (!slot.reservedName && !slot.reservedPhone) { // Solo libres
      if (!timeSlots[slot.time]) {
        timeSlots[slot.time] = [];
      }
      timeSlots[slot.time].push(slot.sector);
    }
  });

  Object.keys(timeSlots).sort().forEach(time => {
    summary += `🕐 ${time}:00 hs\n`;
    timeSlots[time].forEach(sector => {
      summary += `  • ${sector}\n`;
    });
    summary += '\n';
  });

  if (Object.keys(timeSlots).length === 0) {
    summary += 'No hay disponibilidad para esta fecha.';
  }

  return summary.trim();
}

/**
 * Makes a reservation by updating an available slot
 * @param {Object} reservation - Reservation details
 * @param {string} reservation.phone - Customer's phone number
 * @param {string} reservation.name - Customer's name
 * @param {string} reservation.date - Reservation date (YYYY-MM-DD)
 * @param {string} reservation.time - Reservation time (HH)
 * @param {string} reservation.sector - Preferred sector (Interior/Terraza)
 * @returns {Promise<Object>} Result with success status and message
 */
async function makeReservation(reservation) {
  try {
    console.log(`📝 Making reservation:`, reservation);
    
    // First, get current availability
    const availability = await getAvailability(reservation.date);
    
    // Find available slot matching criteria
    const availableSlot = availability.find(slot => 
      parseInt(slot.time) === parseInt(reservation.time) && // Comparamos como números
      slot.sector.toLowerCase() === reservation.sector.toLowerCase() &&
      !slot.isReserved
    );

    if (!availableSlot) {
      return {
        success: false,
        message: `No hay disponibilidad para ${reservation.sector} el ${reservation.date} a las ${reservation.time}:00 hs.`
      };
    }

    // Find the exact row in the sheet to update
    const allData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:G',
    });

    let rowIndex = -1;
    for (let i = 1; i < allData.data.values.length; i++) {
      const row = allData.data.values[i];
      const rowDate = normalizeSheetDate(row[0] || '');
      // Compara con las columnas correctas: D para Hora (índice 3) y B para Sector (índice 1)
      if (rowDate === reservation.date && 
          parseInt(row[3]) === parseInt(reservation.time) && // Comparamos como números
          row[1] && row[1].toLowerCase() === reservation.sector.toLowerCase()) {
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        message: 'Error interno: no se pudo localizar el slot en la hoja.'
      };
    }

    // Update the row with reservation details
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `E${rowIndex}:F${rowIndex}`, // Columns E (Nombre reserva) y F (WhatsApp reserva)
      valueInputOption: 'RAW',
      resource: {
        values: [[reservation.name, reservation.phone]],
      },
    });

    console.log(`✅ Reservation confirmed for ${reservation.name} at row ${rowIndex}`);
    
    return {
      success: true,
      message: `¡Reserva confirmada! ${reservation.name}, tu mesa en ${reservation.sector} está reservada para el ${availableSlot.originalDate} a las ${reservation.time}:00 hs.`
    };

  } catch (error) {
    console.error('❌ Error making reservation:', error);
    return {
      success: false,
      message: 'Error interno al procesar la reserva. Por favor, inténtalo de nuevo.'
    };
  }
}

module.exports = {
  getAvailability,
  getAvailabilitySummary,
  makeReservation,
}; 