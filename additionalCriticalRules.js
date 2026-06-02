function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

const rules = [
  {
    id: 'certificado-expirado-actualizado',
    match: (q) => includesAny(q, ['certificado expirado', 'certificate expired']),
    answer: `El mensaje “certificado expirado” indica que venció el certificado digital .PFX que usa Husky para la facturación electrónica.

Mientras el certificado esté vencido, no se puede emitir ningún comprobante electrónico.

La renovación se hace en conjunto entre el estudio contable del usuario, o el mismo usuario, y Husky Software. El usuario no necesita conocer los detalles técnicos del proceso: Husky coordina con el estudio contable y completa la parte necesaria para generar el nuevo archivo .PFX.

Husky Software normalmente envía un e-mail 20 o 30 días antes del vencimiento, avisando la fecha límite y enviando un instructivo paso a paso para el estudio contable. Una vez que el estudio realiza su parte, Husky genera el nuevo certificado y envía una actualización del sistema lista para instalar.

Importante: Husky Software no estará operativo entre el 20 de marzo y el 15 de abril de 2026. Si el certificado vence cerca de esas fechas, conviene gestionar la renovación con anticipación para no quedar sin facturación electrónica.`
  },
  {
    id: 'ticket-factura-comandera',
    match: (q) => (includesAny(q, ['ticket factura', 'ticket-factura', 'factura electronica como ticket', 'factura electrónica como ticket', 'comandera', 'termica', 'térmica', '80 mm', '8 cm']) && !q.includes('fiscal')) || includesAny(q, ['necesito impresora fiscal epson para ticket', 'solo puedo imprimir ticket con fiscal epson']),
    answer: `Sí. Husky permite emitir e imprimir una factura electrónica en formato ticket de 8 cm usando una comandera térmica.

No es obligatorio usar una impresora fiscal Epson para este caso.

Hay dos circuitos distintos:

1) Ticket fiscal / controlador fiscal
Usa una impresora fiscal Epson o Hasar.

2) Ticket-factura electrónico
Es una factura electrónica autorizada por ARCA/AFIP, con CAE y QR, impresa en formato ticket de 8 cm mediante una comandera térmica.

Si el usuario esperaba ticket y sale A4, o esperaba A4 y sale ticket, hay que revisar la configuración de impresión del puesto. Si la comandera no imprime, no aparece en Windows, corta mal o tiene problemas de conexión, debe intervenir un técnico en PC o impresoras.`
  },
  {
    id: 'correo-yahoo',
    match: (q) => includesAny(q, ['yahoo', 'smtp.mail.yahoo.com', 'correo yahoo', 'mail yahoo']),
    answer: `Para usar una cuenta de Yahoo en Husky tenés que generar una contraseña para aplicaciones desde Yahoo.

Pasos en Yahoo:

1) Entrá en la administración de tu cuenta de Yahoo.
2) Seleccioná Seguridad de la cuenta.
3) Buscá Generar contraseñas para aplicaciones.
4) Elegí Empecemos.
5) Cuando pregunte el nombre de la aplicación, escribí Husky.
6) Generá la contraseña.
7) Copiá esa contraseña y usala en Husky.

Parámetros en Husky:

- Servidor SMTP: smtp.mail.yahoo.com
- Puerto: 465
- SSL: activado
- El servidor requiere autenticación: activado
- Contraseña: la contraseña generada por Yahoo, no la contraseña normal de la cuenta.

Si no funciona con esos datos, probablemente haya un bloqueo de antivirus, firewall o red, y debería revisarlo un técnico en PC.`
  },
  {
    id: 'pdf-creator-instalacion',
    match: (q) => includesAny(q, ['pdf creator', 'pdfcreator', 'makepdf', 'print2pdf', 'no genera pdf', 'no puedo generar pdf']),
    answer: `Para problemas con PDF Creator, lo correcto es reinstalarlo y configurarlo como requiere Husky.

Procedimiento:

1) Verificá que no haya otra versión de PDF Creator instalada.
2) Si existe, desinstalala completamente desde Panel de Control → Programas → Desinstalar un programa.
3) Si el desinstalador pregunta si querés eliminar preferencias o ajustes, respondé que sí.
4) Instalá la versión PDFCreator 1.2.3 usada por Husky.
5) Abrí PDF Creator.
6) Entrá en Impresora → Opciones.
7) En Ajustes generales 2, configurá Comprobar actualizaciones en Nunca.
8) Guardá.
9) En AutoGuardado, activá el autoguardado y seleccioná formato PDF.
10) Guardá y cerrá.

Es importante que no quede instalada una versión anterior o distinta, porque puede generar conflictos con Husky.

Si después de reinstalar correctamente sigue fallando, puede haber un problema de Windows, permisos o incompatibilidad, y debería revisarlo un técnico en PC o soporte Husky.`
  },
  {
    id: 'nota-debito-cheque-rechazado',
    match: (q) => includesAny(q, ['cheque rechazado', 'nota de debito por cheque', 'nota de débito por cheque', 'rechazo de cheque']),
    answer: `El débito por cheque rechazado no se genera automáticamente.

Debe hacerse una Nota de Débito manual, no electrónica, como comprobante interno desde el módulo de facturación.

Procedimiento:

1) Entrá al módulo de facturación.
2) Seleccioná el cliente.
3) Usá un punto de venta no electrónico. Para este caso nunca debe usarse un punto de venta electrónico.
4) Indicá Nota de Débito.
5) No cargues artículos.
6) Usá la opción Texto.
7) Detallá los datos del cheque, el importe y cargá IVA 0.

Esto permite reflejar el débito en cuenta corriente, pero no en IVA Ventas, porque no corresponde.

Si la condición de venta es cuenta corriente, la Nota de Débito queda pendiente y luego debe cancelarse con un recibo cuando el cliente reponga el cheque.

Si la condición de venta es Contado, al finalizar la Nota de Débito se informan los medios de pago para que quede cancelada en el momento.`
  },
  {
    id: 'nota-credito-cuenta-corriente',
    match: (q) => includesAny(q, ['nota de credito aparece en cuenta corriente', 'nota de crédito aparece en cuenta corriente', 'nota de credito resta saldo', 'nota de crédito resta saldo', 'nota de credito debe haber', 'nota de crédito debe haber']),
    answer: `Hay que corregir la nota de crédito rehaciéndola con reproceso y eligiendo correctamente si actualiza o no cuenta corriente.

Caso 1: era para cancelar una factura de contado y quedó restando en cuenta corriente

1) Entrá en Consultar / Anular Comprobantes.
2) Borrá la nota de crédito, aunque sea electrónica.
3) Si aparece alerta de reproceso, ignorala.
4) Rehacé la nota de crédito igual que antes.
5) Al final, cuando pregunte Actualizar Cuenta Corriente o No actualizar cuenta corriente, elegí No actualizar cuenta corriente.
6) Cuando aparezca Solicitar CAE o Pedir reproceso, elegí Pedir reproceso e indicá el número de la nota de crédito que estás ajustando.

Caso 2: era para cancelar una factura de cuenta corriente y aparece en Debe y Haber sin afectar saldo

1) Borrá la nota de crédito desde Consultar / Anular Comprobantes, aunque sea electrónica.
2) Rehacela.
3) Al final elegí Actualizar Cuenta Corriente.
4) Pedí reproceso indicando el número de la nota de crédito que estás ajustando.`
  },
  {
    id: 'percepciones-retenciones-impuestos-internos',
    match: (q) => includesAny(q, ['percepcion', 'percepción', 'retencion', 'retención', 'impuestos internos', 'iibb', 'ganancias']) && !includesAny(q, ['recibo usando la opcion retenciones']),
    answer: `Husky no calcula automáticamente percepciones ni retenciones de ningún tipo, ya sean IIBB, IVA, Ganancias u otras.

Compras:
Si una factura de compra trae percepciones, el sistema permite ingresarlas con fines contables y para IVA Compras.

Órdenes de pago a proveedores:
El sistema no calcula retenciones automáticamente. Si corresponde informar una retención, debe calcularse manualmente e ingresarse en la orden de pago usando la opción Retenciones.

Ventas:
El sistema no calcula percepciones en facturas de venta.

Si un cliente paga aplicando una retención, el importe de esa retención debe informarse en el recibo usando la opción Retenciones.

Impuestos internos:
El sistema no está preparado para procesar impuestos internos en facturas de venta.`
  },
  {
    id: 'tmusb64-integridad-memoria',
    match: (q) => includesAny(q, ['tmusb64', 'no se puede cargar un controlador', 'integridad de memoria', 'aislamiento del nucleo', 'aislamiento del núcleo']),
    answer: `Ese mensaje suele aparecer porque Windows está bloqueando el controlador TMUSB64.sys, generalmente asociado a impresoras térmicas o dispositivos de punto de venta.

La causa más común es la función de seguridad Integridad de memoria.

Qué hacer:

1) En Windows, hacé clic en Inicio.
2) Escribí Aislamiento del núcleo.
3) Abrí esa opción dentro de Seguridad de Windows.
4) Buscá Integridad de memoria.
5) Cambiala a Desactivado.
6) Reiniciá la PC.

TMUSB64.sys casi seguro corresponde al driver de la impresora. Si después del reinicio la impresora sigue sin funcionar, reinstalá el driver oficial de la impresora con Integridad de memoria ya desactivada.

Si el usuario no está seguro, debe hacerlo un técnico en PC, porque desactivar Integridad de memoria reduce una capa de protección de Windows.`
  }
];

function findAdditionalRuleAnswer(input) {
  const q = normalize(input);
  if (!q) return null;

  for (const rule of rules) {
    if (rule.match(q)) return { id: rule.id, answer: rule.answer };
  }

  return null;
}

module.exports = { findAdditionalRuleAnswer, rules, normalize };
