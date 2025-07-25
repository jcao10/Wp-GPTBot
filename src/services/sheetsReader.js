const { sheets, SPREADSHEET_ID } = require('./googleSheets');

// --- Helper Functions for Reading ---

function normalizeSheetDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const match = dateStr.match(/\w+,?\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const year = match[3];
    // Mapa bilingüe para los meses
    const monthMap = { 
      'enero': '01', 'january': '01',
      'febrero': '02', 'february': '02',
      'marzo': '03', 'march': '03',
      'abril': '04', 'april': '04', 
      'mayo': '05', 'may': '05',
      'junio': '06', 'june': '06',
      'julio': '07', 'july': '07',
      'agosto': '08', 'august': '08',
      'septiembre': '09', 'september': '09',
      'octubre': '10', 'october': '10',
      'noviembre': '11', 'november': '11',
      'diciembre': '12', 'december': '12'
    };
    const month = monthMap[monthName];
    if (month) return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// --- Main Reading Functions ---

/**
 * Reads availability data from the Google Sheet.
 * @param {string} date - Date in YYYY-MM-DD format (optional).
 * @param {boolean} includeReserved - If true, includes slots that are already reserved. Defaults to false.
 * @returns {Promise<Array>} Array of availability objects.
 */
async function getAvailability(date = null, includeReserved = false) {
  try {
    console.log(`[SheetsReader] Querying Google Sheets for date: ${date || 'all dates'}`);
    const range = 'A:G';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
        console.log('[SheetsReader] No data found in the sheet.');
        return [];
    }
    console.log(`[SheetsReader] Found ${rows.length - 1} total rows.`);

    const availability = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const isReserved = !!(row[4] && row[4].trim()); // Columna E (Nombre) tiene contenido

      // Si no debemos incluir reservados y el slot está reservado, lo saltamos.
      if (!includeReserved && isReserved) {
        continue;
      }
      
      const rowDate = normalizeSheetDate(row[0] || '');
      const availabilityData = {
        originalDate: row[0] || '',
        date: rowDate,
        sector: row[1] || '',
        available: parseInt(row[2]) || 0,
        time: row[3] || '',
        reservedName: row[4] || '',
        reservedPhone: row[5] || '',
        isReserved: isReserved,
      };

      if (!date || availabilityData.date === date) {
        availability.push(availabilityData);
      }
    }
    console.log(`[SheetsReader] Filtered down to ${availability.length} slots for the requested date (Include Reserved: ${includeReserved}).`);
    return availability;
  } catch (error) {
    console.error('❌ [SheetsReader] Error reading from Google Sheets:', error);
    return [];
  }
}

async function getAvailabilitySummary(date) {
  const availability = await getAvailability(date);
  if (availability.length === 0) return `No se encontraron datos de disponibilidad para ${date}.`;

  let summary = `Disponibilidad para ${availability[0].originalDate} (solo horarios y sectores libres):\n\n`;
  const timeSlots = {};
  availability.forEach(slot => {
    if (!slot.isReserved) {
      if (!timeSlots[slot.time]) timeSlots[slot.time] = [];
      timeSlots[slot.time].push(slot.sector);
    }
  });

  if (Object.keys(timeSlots).length === 0) {
    return `No hay disponibilidad para esta fecha.`;
  }

  Object.keys(timeSlots).sort().forEach(time => {
    summary += `🕐 ${time}:00 hs\n`;
    timeSlots[time].forEach(sector => {
      summary += `  • ${sector}\n`;
    });
    summary += '\n';
  });

  return summary.trim();
}

module.exports = {
  getAvailability,
  getAvailabilitySummary,
  normalizeSheetDate, // Exportamos por si el writer lo necesita
}; 