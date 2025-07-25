// test-sheets.js
// Un script simple para probar la integración con Google Sheets directamente desde la terminal.

// Cargar variables de entorno (importante para las credenciales de Google)
require('dotenv').config();

const { getAvailability } = require('./src/services/sheetsReader.js');
const { makeReservation } = require('./src/services/sheetsWriter.js');

// --- CONFIGURACIÓN DE LA PRUEBA ---
// Cambia esta fecha para probar diferentes días.
// Usa el formato YYYY-MM-DD.
// Déjalo en null para traer TODOS los datos de la hoja.
const TEST_DATE = '2025-07-27'; // Podemos ajustar esta fecha para las pruebas.

// Objeto de reserva simulado para la prueba de escritura
const MOCK_RESERVATION = {
  name: 'TESTTT',
  phone: 'XXXXYYYY',
  date: TEST_DATE,
  time: '21', // Probará reservar a las 21:00 hs
  sector: 'Terraza' // Probará reservar en el Interior
};


async function runReadTest() {
  console.log(`--- Iniciando prueba de LECTURA de Google Sheets para la fecha: ${TEST_DATE || 'TODAS'} ---`);

  try {
    const availability = await getAvailability(TEST_DATE);

    if (availability.length === 0) {
      console.log("\nPrueba finalizada: No se encontró disponibilidad para la fecha especificada.");
    } else {
      console.log(`\nPrueba exitosa. Se encontraron ${availability.length} slots de disponibilidad:`);
      // console.table() es una excelente manera de visualizar arrays de objetos.
      console.table(availability);
    }
  } catch (error) {
    console.error("\n--- La prueba falló con un error: ---");
    console.error(error);
  }
}

async function runWriteTest() {
  console.log(`\n--- Iniciando prueba de ESCRITURA en Google Sheets ---`);
  console.log('Datos de la reserva a crear:', MOCK_RESERVATION);

  try {
    const result = await makeReservation(MOCK_RESERVATION);

    if (result.success) {
      console.log("\n✅ Prueba de escritura exitosa:");
      console.log(result.message);
    } else {
      console.error("\n❌ La prueba de escritura falló:");
      console.error(result.message);
    }
  } catch (error) {
    console.error("\n--- La prueba de escritura falló con un error inesperado: ---");
    console.error(error);
  }
}

// --- EJECUCIÓN DE PRUEBAS ---
async function runAllTests() {
  await runReadTest();
  await runWriteTest();
  // Podríamos hacer una segunda lectura para ver el cambio, pero es mejor verificarlo en la hoja directamente.
}

runAllTests(); 