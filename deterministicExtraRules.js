function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function hasAny(q, words) {
  return words.some((word) => q.includes(word));
}

const rules = [
  {
    id: 'stock-insuficiente',
    match: q => hasAny(q, ['stock insuficiente', 'no hay stock suficiente', 'facturar aunque no haya stock', 'remitir aunque no haya stock', 'quiero facturar igual']),
    answer: `Ese mensaje no es un error. Es solo un aviso del sistema.

Podés seguir trabajando normalmente.

Si estás haciendo una factura:
1) En la segunda pantalla de facturación, después de seleccionar el cliente, buscá la opción “Permitir facturar aunque no haya stock suficiente”.
2) Activala.
3) Continuá con la factura.

Si estás haciendo un remito:
1) Buscá la opción “Permitir remitir aunque no haya stock suficiente”.
2) Activala.
3) Continuá con el remito.

Al activar esa opción, el comprobante se emite igual y el stock puede quedar en cero o negativo.

No hace falta modificar artículos. Si querés controlar stock, ahí sí conviene revisar la ficha Kardex del artículo.`
  },
  {
    id: 'certificado-expirado',
    match: q => hasAny(q, ['certificado expirado', 'certificate expired']),
    answer: `El mensaje “certificado expirado” indica que venció el certificado digital .PFX que usa Husky para la facturación electrónica.

Mientras el certificado esté vencido, no se puede emitir ningún comprobante electrónico.

Qué hacer:
1) Avisale a tu estudio contable o a quien maneje la clave fiscal.
2) Contactá al soporte de Husky Software.
3) Husky coordina con el estudio contable y completa la parte necesaria para generar el nuevo archivo .PFX.
4) Una vez generado, Husky envía una actualización lista para instalar.

Husky Software normalmente envía un e-mail 20 o 30 días antes del vencimiento, con un instructivo para el estudio contable.

Importante: Husky Software no estará operativo entre el 20 de marzo y el 15 de abril de 2026. Si el certificado vence cerca de esas fechas, conviene renovarlo antes.`
  }
];

function findDeterministicExtraRuleAnswer(input) {
  const q = normalize(input);
  if (!q) return null;
  for (const rule of rules) {
    if (rule.match(q)) return { id: rule.id, answer: rule.answer };
  }
  return null;
}

module.exports = { findDeterministicExtraRuleAnswer, rules, normalize };
