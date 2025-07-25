const { sheets, SPREADSHEET_ID } = require('./googleSheets');
const { getAvailability, normalizeSheetDate } = require('./sheetsReader');

/**
 * Makes a reservation by updating an available slot in the Google Sheet.
 * @param {Object} reservation - Reservation details {phone, name, date, time, sector}
 * @returns {Promise<Object>} Result with success status and message
 */
async function makeReservation(reservation) {
  try {
    console.log(`[SheetsWriter] Attempting to make reservation:`, reservation);
    
    // Ahora llamamos a getAvailability con los valores por defecto (includeReserved = false)
    const availableSlots = await getAvailability(reservation.date);
    
    console.log(`[SheetsWriter] Found ${availableSlots.length} available slots. Searching for a matching one...`);
    const slotToBook = availableSlots.find(slot => 
      parseInt(slot.time) === parseInt(reservation.time) &&
      slot.sector.toLowerCase() === reservation.sector.toLowerCase()
    );

    if (!slotToBook) {
      console.log(`[SheetsWriter] No specific slot found matching time/sector.`);
      return {
        success: false,
        message: `No se encontró disponibilidad para ${reservation.sector} el ${reservation.date} a las ${reservation.time}:00 hs.`
      };
    }
    console.log(`[SheetsWriter] Slot to book found. Preparing to find row index.`);

    // Necesitamos leer la hoja completa para encontrar el índice de la fila
    const allData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:G',
    });

    let rowIndex = -1;
    for (let i = 1; i < allData.data.values.length; i++) {
      const row = allData.data.values[i];
      // Hacemos coincidir con la fila exacta del slot que encontramos
      if (normalizeSheetDate(row[0] || '') === slotToBook.date &&
          parseInt(row[3]) === parseInt(slotToBook.time) &&
          row[1].toLowerCase() === slotToBook.sector.toLowerCase() &&
          !(row[4] && row[4].trim())) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      console.log(`[SheetsWriter] Could not find the specific row index to update.`);
      return {
        success: false,
        message: 'Error interno: no se pudo localizar el slot disponible en la hoja.'
      };
    }
    console.log(`[SheetsWriter] Found row index: ${rowIndex}. Attempting to write...`);

    // Update the specific row with the reservation details
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `E${rowIndex}:F${rowIndex}`, // Columns E (Nombre) and F (WhatsApp)
      valueInputOption: 'RAW',
      resource: {
        values: [[reservation.name, reservation.phone]],
      },
    });

    console.log(`[SheetsWriter] Successfully wrote reservation to row ${rowIndex}`);
    
    return {
      success: true,
      message: `¡Reserva confirmada! ${reservation.name}, tu mesa en ${reservation.sector} está reservada para el ${slotToBook.originalDate} a las ${slotToBook.time}:00 hs.`
    };
  } catch (error) {
    console.error('❌ [SheetsWriter] Error making reservation in Google Sheets:', error);
    return {
      success: false,
      message: 'Error interno al procesar la reserva. Por favor, inténtalo de nuevo.'
    };
  }
}

module.exports = {
  makeReservation,
}; 