function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(q, words) {
  return words.some((word) => q.includes(word));
}

const answers = {
  borrarRecibo: `Hola 😊 Sí, se puede revisar el recibo, pero hay que hacerlo con cuidado.

Primero te aclaro algo importante: un recibo no es lo mismo que una factura electrónica.

Una factura electrónica con CAE no se borra como si nunca hubiera existido. En cambio, un recibo es un movimiento de cobranza y se trata desde la parte de recibos o cuenta corriente.

Para borrar o corregir un recibo:

1) Entrá al módulo de Clientes.
2) Buscá el cliente correspondiente.
3) Revisá la cuenta corriente o los recibos emitidos.
4) Ubicá el recibo que querés corregir.
5) Si el sistema permite anularlo o borrarlo desde esa pantalla, hacelo desde ahí.
6) Después verificá que la cuenta corriente del cliente haya quedado bien.

Importante:
No borres facturas, notas de crédito ni otros comprobantes para corregir un recibo.

Si el recibo está aplicado a una factura, o si no estás seguro, conviene que lo revise soporte de Husky antes de tocarlo, para no desacomodar la cuenta corriente del cliente.`,

  stockInsuficiente: `Hola 😊 Ese mensaje no es grave. El sistema te está avisando que no hay stock suficiente para ese artículo.

Si necesitás facturar igual, no hace falta hacer un ajuste de stock en ese momento.

Hacé esto:

1) Volvé a la pantalla de facturación.
2) Buscá la casilla que dice algo parecido a “Permitir facturar aunque no haya stock suficiente”.
3) Marcá esa casilla.
4) Continuá con la factura normalmente.

Si el caso es un remito, buscá la opción similar:
“Permitir remitir aunque no haya stock suficiente”.

¿Qué pasa al marcar esa opción?
El comprobante se puede hacer igual, aunque el stock quede en cero o negativo.

Después, con más tranquilidad, podés revisar el stock del artículo o hacer un ajuste si corresponde.

Pero para salir del paso, la primera opción es marcar esa casilla y continuar.`,

  estilo: `Hola 😊 Te ayudo paso a paso.

Necesito que me indiques un poco más de detalle para darte la respuesta correcta:

1) ¿En qué pantalla aparece el problema?
2) ¿Qué mensaje exacto muestra Husky?
3) Si podés, enviá una captura de pantalla.

Con eso puedo orientarte mejor sin hacerte tocar cosas que no corresponden.`
};

const rules = [
  {
    id: 'borrar-recibo',
    answer: answers.borrarRecibo,
    match: q => (hasAny(q, ['borrar recibo', 'eliminar recibo', 'anular recibo', 'corregir recibo', 'recibo mal hecho']) || (q.includes('recibo') && hasAny(q, ['borrar', 'eliminar', 'anular', 'corregir'])))
  },
  {
    id: 'stock-insuficiente-prioritario',
    answer: answers.stockInsuficiente,
    match: q => hasAny(q, ['stock insuficiente', 'no hay stock suficiente', 'sin stock suficiente', 'no tiene stock', 'no hay stock', 'permitir facturar aunque no haya stock', 'permitir facturar igual', 'permitir remitir aunque no haya stock'])
  }
];

function findDeterministicTopRuleAnswer(input) {
  const q = normalize(input);
  if (!q) return null;
  for (const rule of rules) {
    if (rule.match(q)) return { id: rule.id, answer: rule.answer };
  }
  return null;
}

module.exports = { findDeterministicTopRuleAnswer, rules, normalize };
