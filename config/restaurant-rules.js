// Restaurant Configuration and Business Rules
// =============================================
// PERSONALIZA ESTA INFORMACIÓN CON LOS DATOS REALES DE TU RESTAURANTE
// =============================================

module.exports = {
  // Orden y prioridad de las secciones de contexto para el prompt de OpenAI
  contextSections: [
    "restaurantInfo",
    "schedule",
    "reservationRules",
    "policies",
    "botBehavior",
    "validation",
    "features",
    "specialties",
    "detailedSchedule"
  ],

  // Basic Restaurant Information
  restaurantInfo: {
    name: "La Parrilla del Sur", // 🍖 Cambia por el nombre real de tu restaurante
    address: "Av. San Martín 567, Palermo, Buenos Aires", // 📍 Dirección real
    phone: "+54 11 4567-8901", // 📞 Teléfono real
    email: "reservas@laparrilladelsur.com", // 📧 Email real
    website: "www.laparrilladelsur.com", // 🌐 Sitio web (opcional)
    instagram: "@laparrilladelsur" // 📱 Instagram (opcional)
  },

  // Operating Hours and Days
  schedule: {
    operatingDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    closedDays: ["Monday"],
    openTime: "19:00",
    closeTime: "23:30",
    availableTimes: ["20", "21", "22"], // Horarios de reserva: 8pm, 9pm, 10pm
    lastReservationTime: "22:00",
    kitchenCloses: "23:00" // La cocina cierra antes que el restaurante
  },

  // Reservation Policies
  reservationRules: {
    maxPeoplePerReservation: 8, // Máximo personas por reserva
    minAdvanceHours: 2, // Mínimo 2 horas de anticipación
    maxAdvanceDays: 14, // Máximo 14 días de anticipación
    cancellationHours: 3, // Puede cancelar hasta 3 horas antes
    defaultPeopleCount: 2, // Por defecto 2 personas si no se especifica
    holdTime: 15, // Tiempo de espera para llegar (minutos)
    specialRequests: true // Permite pedidos especiales
  },

  // Restaurant Policies
  policies: {
    petsAllowed: {
      interior: false, // No mascotas en interior
      terraza: true    // Sí mascotas en terraza
    },
    dressCode: "Casual elegante - No shorts ni ojotas",
    paymentMethods: [
      "Efectivo", 
      "Tarjeta de débito", 
      "Tarjeta de crédito", 
      "Transferencia bancaria",
      "Mercado Pago"
    ],
    smokingPolicy: "Solo en terraza - No fumar en interior",
    parking: "Estacionamiento gratuito disponible",
    accessibility: "Acceso para sillas de ruedas disponible",
    wifi: "WiFi gratuito disponible"
  },

  // Bot Behavior Rules
  botBehavior: {
    defaultLanguage: "spanish",
    tone: "amigable y profesional, con toque argentino",
    alwaysAskFor: ["name", "date", "time", "sector", "people"],
    confirmationPolicy: "Antes de confirmar una reserva, debes asegurarte de que el cliente haya proporcionado y reconfirmado explícitamente su nombre, la fecha, la hora, el sector (interior o terraza) y la cantidad de personas. Si falta algún dato o hay dudas, vuelve a preguntar y confirma cada punto antes de finalizar la reserva.",
    
    // Standard responses - Personaliza estos mensajes
    standardResponses: {
      greeting: "¡Hola! Bienvenido/a a La Parrilla del Sur 🍖 ¿En qué puedo ayudarte hoy?",
      menuInquiry: "¡Tenemos las mejores carnes de la zona! Nuestras especialidades incluyen bife de chorizo, entraña y costilla. También tenemos opciones vegetarianas. ¿Te gustaría hacer una reserva para probarlas?",
      locationRequest: "Estamos en Av. San Martín 567, Palermo, Buenos Aires. Fácil acceso por colectivo o subte. ¿Te gustaría hacer una reserva?",
      closedDay: "Los lunes permanecemos cerrados para descansar y preparar todo para la semana. Atendemos de martes a domingo de 19:00 a 23:30 hs.",
      invalidTime: "Nuestros horarios de reserva son a las 20:00, 21:00 y 22:00 hs únicamente. ¿Cuál te resulta mejor?",
      tooManyPeople: "El máximo por reserva es de 8 personas. Para grupos más grandes, por favor contactanos directamente al +54 11 4567-8901 y te ayudaremos con gusto.",
      fullyBooked: "Lamentablemente no tenemos disponibilidad en ese horario. ¿Te gustaría ver otras opciones disponibles?",
      thankYou: "¡Gracias por elegir La Parrilla del Sur! 🍖 Te esperamos con las mejores carnes y el mejor servicio.",
      cancellationConfirm: "Tu reserva ha sido cancelada exitosamente. ¡Esperamos verte pronto en La Parrilla del Sur!",
      specialRequest: "¡Por supuesto! Anotamos tu pedido especial. Nuestros chefs se encargarán de prepararlo especialmente para vos.",
      parkingInfo: "Tenemos estacionamiento gratuito disponible. Solo avísanos cuando llegues.",
      dressCodeInfo: "El código de vestimenta es casual elegante. No se permiten shorts ni ojotas."
    }
  },

  // Validation Rules
  validation: {
    validSectors: ["Interior", "Terraza"],
    validTimes: ["20", "21", "22"],
    maxPeople: 8,
    minPeople: 1
  },

  // Special Features (for future expansion)
  features: {
    enableSpecialRequests: true, // Pedidos especiales
    enableBirthdayPackages: true, // Paquetes de cumpleaños
    enableGroupDiscounts: true, // Descuentos para grupos
    enableOnlineMenu: true, // Menú online
    enableTakeaway: false, // Para llevar (por ahora no)
    enableDelivery: false, // Delivery (por ahora no)
    enableEvents: true, // Eventos especiales
    enableWinePairing: true // Maridaje de vinos
  },

  // Additional Information
  specialties: [
    "Bife de Chorizo Premium",
    "Entraña a la Parrilla", 
    "Costilla de Res",
    "Pollo a la Parrilla",
    "Ensalada César",
    "Papas Fritas Caseras"
  ]
}; 