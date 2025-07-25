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
    // "policies", // Eliminado porque las políticas ahora se manejan en faq-data.txt
    // "botBehavior", // Eliminado, las respuestas estándar están en faq-data.txt
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
  // La mayoría de estas políticas ahora se manejan a través del archivo faq-data.txt
  // para permitir una edición más sencilla por parte del personal no técnico.
  policies: {
    // Las políticas específicas como mascotas, código de vestimenta, etc., se han movido.
    // Dejamos la estructura por si se necesita alguna política técnica en el futuro.
  },

  // Bot Behavior Rules
  // Esta sección ha sido eliminada. Las respuestas estándar se encuentran en 'config/faq-data.txt'.
  // El tono y comportamiento se definirá directamente en los prompts de cada flujo.

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