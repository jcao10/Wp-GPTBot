// Utilidad para formatear el contexto de reglas para el prompt de OpenAI
// Lee el array contextSections y arma el texto con títulos y contenido de cada sección

function formatSectionTitle(sectionName) {
  // Puedes personalizar los títulos aquí si lo deseas
  const titles = {
    restaurantInfo: "INFORMACIÓN DEL RESTAURANTE",
    schedule: "HORARIOS Y DÍAS DE APERTURA",
    reservationRules: "POLÍTICAS DE RESERVA",
    policies: "POLÍTICAS DEL RESTAURANTE",
    botBehavior: "COMPORTAMIENTO DEL BOT",
    validation: "REGLAS DE VALIDACIÓN",
    features: "FUNCIONALIDADES ESPECIALES",
    specialties: "ESPECIALIDADES",
    detailedSchedule: "HORARIO DETALLADO POR DÍA"
  };
  return titles[sectionName] || sectionName.toUpperCase();
}

function formatSectionContent(sectionName, sectionData) {
  if (!sectionData) return '';
  // Formateo especial para algunos tipos de sección
  if (sectionName === 'restaurantInfo') {
    return `Nombre: ${sectionData.name}\nDirección: ${sectionData.address}\nTeléfono: ${sectionData.phone}\nEmail: ${sectionData.email}` +
      (sectionData.website ? `\nWeb: ${sectionData.website}` : '') +
      (sectionData.instagram ? `\nInstagram: ${sectionData.instagram}` : '');
  }
  if (sectionName === 'schedule') {
    return `Días abiertos: ${sectionData.operatingDays?.join(', ')}\nDías cerrados: ${sectionData.closedDays?.join(', ')}\nHorario: ${sectionData.openTime} a ${sectionData.closeTime}`;
  }
  if (sectionName === 'reservationRules') {
    return Object.entries(sectionData).map(([k, v]) => `- ${k}: ${v}`).join('\n');
  }
  if (sectionName === 'policies') {
    return Object.entries(sectionData).map(([k, v]) => {
      if (typeof v === 'object') return `- ${k}: ${JSON.stringify(v)}`;
      return `- ${k}: ${v}`;
    }).join('\n');
  }
  if (sectionName === 'botBehavior') {
    return `Tono: ${sectionData.tone}\nSiempre pedir: ${sectionData.alwaysAskFor?.join(', ')}\nRespuestas estándar: ${Object.entries(sectionData.standardResponses || {}).map(([k, v]) => `\n  • ${k}: ${v}`).join('')}`;
  }
  if (sectionName === 'validation') {
    return Object.entries(sectionData).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
  }
  if (sectionName === 'features') {
    return Object.entries(sectionData).map(([k, v]) => `- ${k}: ${v ? 'Sí' : 'No'}`).join('\n');
  }
  if (sectionName === 'specialties') {
    return Array.isArray(sectionData) ? sectionData.map(e => `- ${e}`).join('\n') : '';
  }
  if (sectionName === 'detailedSchedule') {
    return Object.entries(sectionData).map(([day, obj]) => `${day}: ${Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ')}`).join('\n');
  }
  // Por defecto, mostrar como JSON
  return JSON.stringify(sectionData, null, 2);
}

function buildContextPrompt(rules) {
  let prompt = '';
  const sections = rules.contextSections || [];
  sections.forEach(sectionName => {
    if (rules[sectionName]) {
      prompt += `\n\n### ${formatSectionTitle(sectionName)}\n`;
      prompt += formatSectionContent(sectionName, rules[sectionName]);
    }
  });
  return prompt.trim();
}

module.exports = { buildContextPrompt }; 