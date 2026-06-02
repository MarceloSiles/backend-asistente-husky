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
    id: 'reindexa-23-deposito',
    match: (q) => q.includes('reindexa') && q.includes('23'),
    answer: `Ese error corresponde a REINDEXA línea 23 e indica un problema con el archivo auxiliar DEPOSITO.DBF.

Hacé esto:

1) Cerrá Husky en todas las PCs.
2) En la carpeta del sistema, abrí DATOS.ZIP o BACKUP_ANTERIOR.ZIP.
3) Extraé únicamente el archivo DEPOSITO.DBF.
4) Reemplazá el DEPOSITO.DBF que está en la carpeta del sistema.
5) Volvé a abrir Husky y probá nuevamente.

No hace falta restaurar todo el backup ni tocar otros archivos.`
  },
  {
    id: 'reindexa-clientes',
    match: (q) => (q.includes('reindexa') && ['90', '91', '92', '93'].some((line) => q.includes(line))) || (q.includes('ver_stru_fe') && q.includes('136')),
    answer: `Ese error indica un problema en el maestro de clientes: CLIENTES.DBF y/o CLIENTES.FPT.

La recomendación principal es:

1) No seguir usando el sistema, para no agravar el problema.
2) Enviar al soporte de Husky Software los archivos CLIENTES.BAK y CLIENTES.TBK para intentar su reparación.

Alternativa de urgencia, solo si necesitás salir del paso:

1) Cerrá Husky en todas las PCs.
2) En la carpeta del sistema, cortá CLIENTES.DBF y CLIENTES.FPT y guardalos en otra carpeta.
3) Renombrá CLIENTES.BAK como CLIENTES.DBF.
4) Renombrá CLIENTES.TBK como CLIENTES.FPT.
5) Volvé a abrir Husky y verificá.

En la enorme mayoría de los casos se recupera todo. Muy rara vez puede faltar algún cliente cargado en la última sesión previa al error.`
  },
  {
    id: 'stock-insuficiente',
    match: (q) => includesAny(q, ['no hay stock suficiente', 'stock insuficiente', 'no me deja facturar por stock', 'me frena por stock', 'quiero facturar igual', 'yo no llevo stock']),
    answer: `Ese mensaje no es un error. Es solo un aviso preventivo del sistema.

Podés seguir trabajando normalmente.

Si estás haciendo una factura:

1) En la segunda pantalla del proceso de facturación, después de seleccionar el cliente, buscá la casilla:
“Permitir facturar aunque no haya stock suficiente”.
2) Activala y continuá con la factura.

Si estás haciendo un remito:

Activá la casilla:
“Permitir remitir aunque no haya stock suficiente”.

Al activar estas opciones, el comprobante se emite igual y el stock puede quedar en cero o negativo.

No hace falta modificar artículos ni borrar comprobantes. Si querés controlar stock, ahí sí conviene revisar la ficha Kardex del artículo.`
  },
  {
    id: 'factura-en-blanco',
    match: (q) => includesAny(q, ['factura sale en blanco', 'factura se imprime en blanco', 'factura sale sin articulos', 'factura se imprime sin articulos', 'no salen los articulos', 'factura sale vacia', 'imprime solo totales']),
    answer: `Esto ocurre cuando el comprobante fue recuperado desde AFIP sin rehacerlo completo. AFIP devuelve los datos generales, pero no devuelve el detalle de artículos. Por eso la factura puede imprimirse sin artículos.

Procedimiento correcto:

1) Entrá a Clientes / Facturación → Consultar / Anular Comprobantes.
2) Buscá el comprobante por letra, punto de venta y número.
3) Borrá el comprobante, aunque el sistema avise que es electrónico.
   Si el comprobante no existe, seguí con el paso siguiente.
4) Entrá a Facturas–Créditos–Débitos y rehacé el comprobante completo.
5) Verificá que coincidan cliente, CUIT, fecha de emisión e importes totales.
6) Cuando aparezca la ventana para solicitar el CAE, no pidas un CAE normal.
7) Elegí la opción “Pedir un Reproceso indicando Nº de Comprobante”.
8) Indicá el número del comprobante original y solicitá el reproceso.
9) Imprimí normalmente.

Importante: no cambies la fecha de Windows. Si necesitás cambiar la fecha de emisión, hacelo desde la segunda pantalla de facturación.`
  },
  {
    id: 'duplicidad-numeracion',
    match: (q) => q.includes('duplicidad') && q.includes('numeracion'),
    answer: `En duplicidad de numeración pueden darse dos casos:

Caso 1: AFIP informa que el próximo número es 1

En ese caso el problema es del servicio de AFIP/ARCA. No es un problema del sistema Husky.

Solución:
- Esperar a que AFIP/ARCA se normalice.
- Volver a intentar más tarde.
- No borrar comprobantes.
- No hacer reproceso.

Caso 2: AFIP informa un próximo número distinto de 1

Probablemente en algún momento ese punto de venta estuvo configurado como no electrónico y se emitió un comprobante inválido que ocupó esa numeración.

Solución:
1) Localizar ese comprobante.
2) Verificar el impacto en cuenta corriente y stock.
3) Borrarlo para liberar el número.
4) Emitir nuevamente desde el punto de venta electrónico correcto.

Este caso no debe tratarse como reproceso.`
  },
  {
    id: 'factura-sin-membrete',
    match: (q) => includesAny(q, ['sin membrete', 'sin datos de la empresa', 'sin encabezado', 'no aparece el qr', 'factura pelada', 'factura sin logo', 'factura sin datos fiscales']),
    answer: `Eso pasa cuando el comprobante fue emitido con un punto de venta manual, no electrónico.

Un comprobante manual:
- no imprime membrete fiscal completo,
- no tiene CAE,
- no tiene código QR,
- no es un comprobante electrónico válido fiscalmente.

No es un problema de impresora ni de configuración de impresión.

Si la factura debía ser electrónica:

1) Entrá a Clientes / Facturación → Consultar / Anular Comprobantes.
2) Buscá y borrá ese comprobante.
3) Rehacelo usando un punto de venta electrónico RECE dado de alta en AFIP/ARCA.

Si era solo un comprobante interno y no necesitaba validez fiscal, no hace falta hacer nada.`
  },
  {
    id: 'impresion-cortada-ticket',
    match: (q) => includesAny(q, ['factura sale cortada', 'factura imprime chiquito', 'sale como ticket', 'sale en la impresora equivocada', 'no sale en a4', 'imprime mal', 'sale en la comandera', 'ticket sale raro', 'ticket sale cortado']),
    answer: `En la mayoría de los casos esto se corrige desde la configuración interna de Husky, no desde Windows.

Entrá a:

Herramientas → Configuración → Puestos de Trabajo / Impresoras

Configuración correcta para facturas en hoja A4:
- En Facturas A, Facturas B y Facturas C debe estar seleccionada una impresora A4.
- El campo Ticket-Factura (electrónico) debe quedar en blanco.

Configuración correcta para ticket-factura en comandera térmica de 8 cm:
- En Ticket-Factura (electrónico) debe estar seleccionada la comandera térmica.
- Facturas A, Facturas B y Facturas C deben quedar en blanco.

Causa más común:
Si una impresora A4 está asignada en “Ticket-Factura (electrónico)”, el sistema imprime una factura con formato ticket y por eso sale cortada o chiquita.

Si después de corregir esto sigue igual, ahí sí conviene que un técnico en PC revise driver, tamaño de papel y configuración de la impresora.`
  },
  {
    id: 'error-10242',
    match: (q) => q.includes('10242') || (q.includes('condicion iva receptor') && q.includes('obligatorio')),
    answer: `El error 10242 aparece porque AFIP/ARCA empezó a exigir obligatoriamente la condición frente al IVA del receptor en el WebService de facturación electrónica.

La solución es actualizar Husky a una versión compatible con el nuevo WebService.

Husky Software envió el aviso correspondiente a los clientes. AFIP/ARCA todavía puede permitir facturar sin actualizar durante un tiempo, pero esa posibilidad es temporal.

A partir del 1 de abril de 2026 no será posible emitir comprobantes electrónicos si el sistema no está actualizado al WebService nuevo.

Recomendación:
Coordiná la actualización con Husky Software con anticipación.`
  },
  {
    id: 'error-10243',
    match: (q) => q.includes('10243') || (q.includes('condicion iva receptor') && q.includes('no es valido')),
    answer: `El error 10243 significa que se intentó emitir una Factura B a un cliente Monotributista.

Cuando el emisor es Responsable Inscripto y el cliente es Monotributista, corresponde emitir Factura A, salvo casos particulares que determine AFIP/ARCA.

Por eso Husky debe emitir automáticamente Factura A en esa situación.

Qué revisar:

1) Verificá que la condición frente al IVA del emisor esté correctamente configurada.
2) Verificá que la condición frente al IVA del cliente esté bien cargada.
3) Si el sistema no permite facturar correctamente a monotributistas, hay que actualizar Husky a una versión compatible.

Si necesitás emitir la factura de inmediato, podés hacerla desde Facturación en Línea de AFIP/ARCA, pero esa factura no podrá ingresarse correctamente al sistema Husky y deberá manejarse por fuera de la cuenta corriente.`
  },
  {
    id: 'gmail-config',
    match: (q) => includesAny(q, ['gmail', 'smtp.gmail.com', 'contraseña de aplicaciones', 'contrasena de aplicaciones', 'configurar cuenta de correo', 'correo saliente']),
    answer: `Para usar una cuenta de Gmail en Husky necesitás crear una contraseña de aplicaciones. La contraseña normal de Gmail no sirve para aplicaciones externas.

Pasos:

1) Entrá a tu Cuenta de Google.
2) Andá a Seguridad.
3) Activá la Verificación en 2 pasos si todavía no está activa.
4) Buscá Contraseñas de aplicaciones.
5) Generá una contraseña para Husky.
6) Copiá el código de 16 caracteres que genera Google.
7) En Husky, entrá a Configurar cuenta de correo y pegá esa contraseña.

Datos de configuración:

- Servidor de correo saliente: smtp.gmail.com
- Puerto SMTP: 465
- Si no funciona con 465, probar 587
- El servidor requiere autenticación: activado
- El servidor requiere cifrado SSL: activado

Si está todo bien configurado y aun así no envía, probablemente el antivirus o firewall esté bloqueando los puertos. En ese caso debe revisarlo un técnico en PC, agregando una excepción al puerto o a la carpeta del sistema Husky.`
  },
  {
    id: 'no-es-una-tabla',
    match: (q) => q.includes('no es una tabla') || q.includes('.dbf') && q.includes('tabla'),
    answer: `El mensaje “No es una tabla” indica que un archivo DBF está dañado.

No conviene reindexar, reinstalar ni restaurar archivos al azar.

Qué hacer:

1) No seguir usando el sistema si el error impide trabajar.
2) Contactar al soporte técnico de Husky Software para revisar el archivo afectado.

Solo si necesitás identificar el archivo con ayuda de un técnico:

- Presioná Cancelar las veces necesarias hasta que el sistema muestre el nombre exacto de la tabla afectada.
- Anotá ese nombre.

Si el archivo afectado es CLIENTES.DBF, se puede intentar recuperar enviando CLIENTES.BAK y CLIENTES.TBK al soporte de Husky Software.

Si es otro DBF, no hagas reemplazos sin indicación del soporte.`
  },
  {
    id: 'archivo-raro-dbf',
    match: (q) => /[a-z0-9]+\s*\(\d+\)\s*\.(dbf|fpt)/i.test(q) || /[a-z0-9]+\s+-\s+[a-z0-9]+\s*\.(dbf|fpt)/i.test(q),
    answer: `Ese archivo no pertenece al sistema Husky con ese nombre. Los archivos con paréntesis, espacios o guiones suelen ser copias duplicadas o archivos movidos accidentalmente dentro de la carpeta del sistema.

Qué hacer:

1) Cerrá Husky en todas las PCs.
2) Entrá a la carpeta del sistema en el servidor.
3) Borrá solo los archivos raros, por ejemplo CLIENTES(1).DBF, FAMILIAS (2).FPT o similares.
4) No borres los archivos originales sin paréntesis ni caracteres extraños.
5) Volvé a abrir Husky y probá nuevamente.

No corresponde reindexar ni restaurar backups por este caso, salvo que el error continúe después de borrar esos duplicados.`
  },
  {
    id: 'archivo-recursos',
    match: (q) => includesAny(q, ['archivo de recursos no es valido', 'archivo de recursos invalido', 'desea sobreescribirlo con uno vacio']),
    answer: `Ese aviso no es grave y no afecta los datos. Da igual si respondés Sí o No: el resultado es el mismo.

Lo importante es revisar permisos de Windows/red.

Qué hacer:

1) Pedí ayuda a un técnico en PC o redes.
2) Verificá que la carpeta del sistema Husky en el servidor esté compartida para todos los usuarios.
3) Verificá permisos de lectura y escritura sobre esa carpeta y sus subcarpetas.
4) Volvé a abrir Husky.

Con los permisos correctos, el aviso debería dejar de aparecer.`
  },
  {
    id: 'ticket-expiracion-hora',
    match: (q) => includesAny(q, ['tiempo de expiracion es inferior', 'ticket expira en el futuro', 'generationtime', 'generation time', 'fecha hora', 'zona horaria']) && (q.includes('afip') || q.includes('cae') || q.includes('ticket')),
    answer: `Ese error no está relacionado con el vencimiento del certificado.

Indica que Windows tiene mal configurada la fecha, la hora o la zona horaria. AFIP/ARCA rechaza el ticket porque la PC está trabajando con una hora incorrecta.

Solución:

1) En la PC donde aparece el error, corregí Fecha y hora de Windows.
2) Verificá la zona horaria: debe ser (UTC-03:00) Ciudad de Buenos Aires.
3) Confirmá que la hora sea correcta.
4) Si aparece la opción de horario de verano, desactivala.
5) Cerrá Husky y volvé a abrirlo.
6) Intentá solicitar el CAE nuevamente.`
  },
  {
    id: 'certificado-expirado',
    match: (q) => q.includes('certificado expirado'),
    answer: `El mensaje “certificado expirado” indica que venció el certificado digital PFX usado para facturación electrónica.

Hay que generar un nuevo certificado desde AFIP/ARCA y reemplazar el archivo PFX anterior en la carpeta del sistema Husky.

Los certificados tienen validez limitada, por eso conviene renovarlos antes del vencimiento.

Recomendación: contactá al soporte técnico de Husky Software para que te ayude con el proceso y evitar reemplazar un archivo incorrecto.`
  },
  {
    id: 'no-token-afip',
    match: (q) => includesAny(q, ['fallo al intentar obtener el ticket', 'no se puede obtener el ticket', 'no se puede resolver el nombre remoto', 'wsaa.afip.gov.ar', 'error en token', 'no es posible conectar con el servidor remoto', 'unable to connect']),
    answer: `Ese mensaje indica un problema de conectividad con los servidores de AFIP/ARCA. No es un error propio del sistema Husky.

Causas frecuentes:

- Internet inestable o sin conexión.
- Router con problemas.
- Antivirus o firewall bloqueando a Husky.
- Problemas de DNS.
- Servidores de AFIP/ARCA momentáneamente caídos.

Qué hacer:

1) Reiniciá el router, no solo la PC.
2) Esperá unos minutos e intentá facturar nuevamente.
3) Si sigue igual, verificá que el antivirus o firewall no estén bloqueando la carpeta del sistema Husky.
4) Agregá la carpeta del sistema como excepción.

Si persiste, debe revisarlo un técnico en PC o redes.`
  },
  {
    id: 'reproceso',
    match: (q) => includesAny(q, ['reproceso', 'retroceso', 'alerta de reproceso', 'alerta de retroceso', 'saltos en la numeracion', 'numeracion se saltea', 'faltan numeros']),
    answer: `Cuando aparece una alerta de reproceso o saltos en la numeración, significa que AFIP/ARCA otorgó el CAE, pero el comprobante quedó incompleto en Husky.

Podés seguir facturando si necesitás, pero conviene corregirlo después.

Modo 1 recomendado: rehacer el comprobante completo

1) Anotá el número de comprobante que aparece en la alerta.
2) Entrá a Clientes / Facturación → Consultar / Anular Comprobantes.
3) Buscá el comprobante.
4) Si existe, borrarlo aunque el sistema advierta que es electrónico.
5) Entrá a Facturas–Créditos–Débitos.
6) Rehacé el comprobante completo, con el mismo cliente, CUIT, fecha e importes.
7) Cuando aparezca la ventana de pedir CAE, elegí “Pedir un Reproceso indicando Nº de Comprobante”.
8) Ingresá el número original y solicitá el reproceso.

Modo 2: rescatar desde AFIP/ARCA

Clientes / Facturación → Herramientas Fact. Electrónica → Consultar comprobantes registrados en AFIP.

Este modo recupera solo datos generales y totales. No recupera el detalle de artículos.

Importante: si quedaron dos facturas iguales, puede ser necesario hacer una Nota de Crédito para cancelar una de ellas y balancear cuenta corriente e IVA ventas.`
  },
  {
    id: 'factura-dolares',
    match: (q) => includesAny(q, ['facturar en dolares', 'factura en dolares', 'tipo de cambio', 'cancela en dolares', 'error 10240']),
    answer: `Para emitir una factura electrónica en dólares, la factura se carga normalmente en pesos.

La moneda no se elige al principio.

Procedimiento:

1) Cargá la factura como cualquier otra, con artículos e importes en pesos.
2) Avanzá hasta la pantalla final de Solicitar CAE.
3) Ahí seleccioná la moneda: Dólares.
4) El sistema propone el tipo de cambio vendedor del Banco Nación del día hábil anterior.
5) En ese momento Husky convierte los importes de pesos a dólares y envía el comprobante a AFIP/ARCA.

Sobre “Cancela en dólares”:

- Si NO se marca: la factura está expresada en dólares pero se cobrará en pesos. Si cambia el tipo de cambio entre facturación y cobro, corresponde ajustar con Nota de Débito o Nota de Crédito por diferencia de cambio.

- Si SE marca: se informa que el comprobante se cancelará en dólares. En ese caso no hay diferencias de cambio ni necesidad de ND/NC por ajuste.

La conversión a dólares se hace únicamente al solicitar el CAE.`
  }
];

function findCriticalRuleAnswer(input) {
  const q = normalize(input);
  if (!q) return null;

  for (const rule of rules) {
    if (rule.match(q)) {
      return { id: rule.id, answer: rule.answer };
    }
  }

  return null;
}

module.exports = { findCriticalRuleAnswer, rules, normalize };
