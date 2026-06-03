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
  facturaNoElectronica: `Ese aviso normalmente aparece porque se usó un punto de venta manual, no electrónico.

La respuesta correcta es revisar el punto de venta usado.

Hacé esto:

1) Verificá con qué punto de venta se hizo el comprobante.
2) Si la factura debía ser electrónica, debe emitirse con un punto de venta electrónico configurado como RECE.
3) No lo resuelvas cambiando datos del cliente.
4) No lo resuelvas revisando el certificado PFX.

En pocas palabras: el problema está en el punto de venta seleccionado o configurado.

Si ya se generó el comprobante y no correspondía, conviene que lo revise soporte de Husky antes de tocar cuenta corriente, stock o numeración.`,

  duplicidad: `Ese mensaje indica un problema con la numeración del punto de venta electrónico.

Hay dos casos posibles:

Caso 1: AFIP informa que el próximo número es 1

En ese caso el problema es del servicio de AFIP/ARCA. No es un problema del sistema Husky.

Qué hacer:
1) No borres comprobantes.
2) No hagas reproceso.
3) Esperá a que AFIP/ARCA se normalice.
4) No intentes cada 5 minutos, porque eso puede provocar otros problemas.
5) Volvé a intentar más tarde.

Caso 2: AFIP informa un próximo número distinto de 1

En ese caso probablemente en algún momento ese punto de venta estuvo configurado como no electrónico y se generó un comprobante inválido que ocupó esa numeración.

Qué hacer:
1) Hay que localizar ese comprobante inválido.
2) Antes de borrarlo, verificar si afectó cuenta corriente o stock.
3) Luego se debe eliminar ese comprobante para liberar el número.
4) Después hay que emitir nuevamente desde el punto de venta electrónico correcto.

Importante:
Este caso no debe tratarse como reproceso. Si no estás seguro, conviene que lo revise soporte de Husky antes de borrar comprobantes, porque puede afectar stock, cuenta corriente o numeración.`,

  reindexaClientes: `Ese error corresponde al archivo de clientes. Los archivos relacionados son CLIENTES.DBF y CLIENTES.FPT.

Primero: no sigas usando Husky hasta resolverlo. Si se sigue trabajando, el problema puede empeorar.

Procedimiento recomendado:
1) Cerrá Husky en todas las PCs.
2) Entrá a la carpeta donde está instalado el sistema.
3) Buscá estos dos archivos: CLIENTES.BAK y CLIENTES.TBK.
4) Envialos al soporte de Husky Software para intentar repararlos.

Procedimiento de apuro o urgencia:
Usá esto solo si necesitan salir del paso y no pueden esperar soporte.

1) Cerrá Husky en todas las PCs.
2) Entrá a la carpeta del sistema.
3) Copiá CLIENTES.DBF y CLIENTES.FPT a otra carpeta, como resguardo.
4) Borrá de la carpeta del sistema los archivos CLIENTES.DBF y CLIENTES.FPT.
5) Renombrá CLIENTES.BAK como CLIENTES.DBF.
6) Renombrá CLIENTES.TBK como CLIENTES.FPT.
7) Abrí Husky y probá si permite trabajar.

En la gran mayoría de los casos se recupera todo. Muy rara vez puede faltar algún cliente cargado en la última sesión previa al error.

Última alternativa:
Si lo anterior no sirve, se puede intentar recuperar CLIENTES.DBF y CLIENTES.FPT desde DATOS.ZIP, pero solo si ese backup está actualizado. Como máximo debería tener 1 día de antigüedad.

En ese caso:
1) Cerrá Husky en todas las PCs.
2) Abrí DATOS.ZIP.
3) Extraé únicamente CLIENTES.DBF y CLIENTES.FPT.
4) Copialos en la carpeta del sistema reemplazando los existentes.

Si DATOS.ZIP está dañado:
Podés usar BACKUP_ANTERIOR.ZIP, pero solamente si también está actualizado. Como máximo debería tener 1 día de antigüedad.

Importante:
No extraigas CLIENTES.BAK ni CLIENTES.TBK desde DATOS.ZIP para reemplazar CLIENTES.DBF y CLIENTES.FPT. Si usás DATOS.ZIP o BACKUP_ANTERIOR.ZIP, extraé únicamente CLIENTES.DBF y CLIENTES.FPT.

Si no estás seguro, es mejor consultar al soporte de Husky antes de tocar archivos.`,

  reindexaDeposito: `Ese error corresponde a REINDEXA línea 23 e indica un problema con el archivo auxiliar DEPOSITO.DBF.

Hacé esto:

1) Cerrá Husky en todas las PCs.
2) En la carpeta del sistema, abrí DATOS.ZIP.
3) Si DATOS.ZIP está dañado, podés usar BACKUP_ANTERIOR.ZIP, siempre que esté actualizado.
4) Extraé únicamente el archivo DEPOSITO.DBF.
5) Copialo en la carpeta del sistema, reemplazando el DEPOSITO.DBF actual.
6) Volvé a abrir Husky y probá nuevamente.

No hace falta restaurar todo el backup ni tocar otros archivos.`,

  mem: `Tranquilo, vamos paso a paso 😊

Ese mensaje indica un problema con archivos de memoria del sistema.

En este caso siempre hay que recuperar estos tres archivos desde el backup:

PARAM.MEM
CONFIG.MEM
RECE.MEM

Pasos:
1) Cerrá Husky en todas las PCs.
2) Entrá a la carpeta donde está instalado el sistema.
3) Abrí DATOS.ZIP.
4) Tomá solamente estos tres archivos: PARAM.MEM, CONFIG.MEM y RECE.MEM.
5) Pasalos a la carpeta del sistema, reemplazando los archivos dañados.
6) Abrí Husky.
7) Entrá a Herramientas / Configuración y revisá los datos.
8) Si se usa correo desde Husky, puede ser necesario configurar nuevamente la cuenta de correo.

Si DATOS.ZIP está dañado, puede usarse BACKUP_ANTERIOR.ZIP, solamente si está actualizado.

Importante: estos archivos no se regeneran automáticamente. No se pierden facturas, clientes, artículos ni movimientos.`,

  gvw: `Tranquilo, esto generalmente no significa que se hayan perdido los datos.

Lo más probable es que el antivirus se haya actualizado y haya confundido el archivo GVW.EXE con un virus. Eso se llama falso positivo.

GVW.EXE es el programa de Husky. Muchas veces el antivirus no lo borra, sino que lo manda a una carpeta llamada Cuarentena.

Qué hacer:
1) No reinstales Husky.
2) Pedile a tu técnico en PC que revise la Cuarentena del antivirus.
3) Si ahí aparece GVW.EXE, debe restaurarlo a la carpeta original del sistema Husky.
4) Después debe crear una excepción en el antivirus para la carpeta del sistema Husky.
5) Luego abrir Husky nuevamente.

Importante:
Esto no implica pérdida de información. Las bases de datos del sistema no fueron afectadas. Lo que pasó es que el antivirus movió el programa de lugar.

Si el antivirus vuelve a detectarlo, el técnico debe revisar que la excepción haya quedado bien aplicada.`,

  excel: `Te paso el formato correcto 😊

Para importar artículos desde Excel, el archivo debe tener este formato exacto. No sirve otro orden de columnas.

Antes de armarlo, tené en cuenta esto:

1) Tiene que estar en la Hoja 1.
2) No pongas títulos ni encabezados.
3) La primera fila con datos debe ser la fila 1.
4) No pongas filas intercaladas con aclaraciones.
5) No uses fórmulas en las celdas.
6) Las columnas opcionales igual deben existir, aunque queden vacías.
7) De las columnas A, B y C, al menos una debe tener datos.
8) No se pueden importar más de 16384 filas.

Formato obligatorio:

A: Código de artículo interno - Texto
B: Código de artículo del proveedor - Texto
C: Código de barras - Texto
D: Descripción del artículo - Texto
E: Precio unitario de costo o compra - Número
F: Familia o rubro - Texto
G: Subfamilia - Texto
H: Moneda, 1=Pesos y 2=Dólares - Texto
I: Tasa o porcentaje de IVA - Número
J: Nombre del proveedor - Texto
K: Precio de venta 1 - Número
L: Precio de venta 2 - Número
M: Precio de venta 3 - Número
N: Precio de venta 4 - Número
O: Unidad de medida de compra - Texto
P: Unidad de medida de venta - Texto
Q: Coeficiente que relaciona ambas unidades - Número

Ejemplo: si comprás en cajas de 12 y vendés por unidad, en Q va 12. Si comprás y vendés en la misma unidad, en Q va 1.`,

  errorLeerArchivo: `Ese mensaje no significa que el archivo esté dañado.

Generalmente indica que esa PC no puede acceder correctamente a la carpeta del sistema en el servidor.

Qué hacer:
1) Verificá que el servidor esté encendido.
2) Verificá que la red esté funcionando.
3) Cerrá Husky y volvé a abrirlo.
4) Si sigue igual, debe revisarlo un técnico en PC o redes.

No conviene restaurar backups ni tocar archivos DBF por este mensaje.`,

  noTabla: `El mensaje “No es una tabla” indica que un archivo DBF está dañado.

Qué hacer:
1) No sigas usando el sistema si el error impide trabajar.
2) Presioná Cancelar las veces necesarias hasta que el sistema muestre el nombre exacto de la tabla afectada.
3) Anotá ese nombre o sacá una captura.
4) Contactá al soporte técnico de Husky Software para revisar el archivo afectado.

Si el archivo afectado es CLIENTES.DBF, se puede intentar recuperar enviando CLIENTES.BAK y CLIENTES.TBK al soporte de Husky Software.

No hagas reemplazos de archivos sin indicación del soporte.`,

  pdf: `Vamos paso a paso 😊

Para problemas al generar PDF, primero hay que ver qué versión de Husky estás usando.

Si usás Husky versión 35 o anterior:
El sistema usa PDF Creator. En ese caso corresponde reinstalar y configurar PDF Creator.

Descarga:
https://www.mcsiles.com.ar/app/PDFCreator-1_2_3_setup.rar

Pasos:
1) Cerrá Husky.
2) Entrá en Panel de Control / Programas / Desinstalar un programa.
3) Si hay alguna versión de PDF Creator instalada, desinstalala.
4) Si pregunta si querés borrar preferencias o ajustes, respondé que sí.
5) Descargá PDF Creator desde el link indicado.
6) Instalá PDFCreator-1_2_3_setup.exe.
7) Abrí PDF Creator.
8) Entrá en Impresora / Opciones.
9) En Ajustes generales 2, configurá Comprobar actualizaciones en Nunca.
10) En AutoGuardado, activá AutoGuardado y elegí formato PDF.
11) Guardá y probá nuevamente desde Husky.

Si usás Husky versión 36 o superior:
Ya no se usa PDF Creator como solución principal. Se usa la impresora nativa de Windows llamada Microsoft Print to PDF.

En ese caso hay que revisar que Windows 10 o superior tenga activa esa impresora. Si no aparece, debe revisarlo un técnico en PC.`,

  gmail: `Vamos paso a paso 😊

Para usar Gmail en Husky no alcanza con poner la contraseña común del correo. Google pide una contraseña de aplicaciones.

Primero hay que activar la verificación en 2 pasos:
1) Entrá a tu cuenta de Google.
2) Andá a Seguridad.
3) Buscá Verificación en 2 pasos.
4) Activala siguiendo los pasos de Google.

Si no ves esa opción, entrá desde este link de Google:
https://notifications.google.com/g/p/ANiao5oYQDkzKtgudHTjY7XN9bIvU6wAMmjcZlFsbAHsRzX_Y9CSooJHeMU4si0cTiUszMt76w4rJuqyyPx3Gz8V1HkHA6dJasrKuWDs8Io24vgBrpMQ2KsEBlMU3F2IaQNBFi4KzsM5V4Z1KGj_ocixSAuIDRE06HTV7VZGDZWAOy3bMLiIYhG34HOEWLW5hH95nlDj0hUMqX63zotDy33KkXfs

Después generá la contraseña de aplicaciones:
1) Volvé a Seguridad.
2) Buscá Contraseñas de aplicaciones.
3) Generá una nueva contraseña para Husky.
4) Google te va a mostrar una clave de 16 caracteres.
5) Copiala y pegala en Husky.

Datos para cargar en Husky:
- Servidor SMTP: smtp.gmail.com
- Puerto: 465
- SSL: activado
- El servidor requiere autenticación: activado
- Contraseña: la contraseña de aplicaciones, no la contraseña común de Gmail.

Si con esto no envía, probablemente haya un bloqueo de antivirus, firewall o red. En ese caso conviene que lo vea un técnico en PC.`,

  wsafipfe: `Vamos paso a paso 😊

Ese mensaje indica que el componente de facturación electrónica de Husky está desactualizado o mal instalado.

La versión correcta es WSAFIPFE10081.

Descarga:
https://www.mcsiles.com.ar/app/WSAFIPFE10081.zip

Pasos:
1) Cerrá Husky en todas las PCs.
2) En Windows, entrá a Panel de Control / Programas / Desinstalar un programa.
3) Buscá todas las versiones de WSAFIPFE.
4) Desinstalalas todas. A veces puede haber más de una.
5) Descargá el ZIP desde el link de arriba.
6) Abrí el ZIP.
7) Ejecutá Setup.exe.
8) Cuando termine, abrí Husky y probá pedir el CAE nuevamente.

Importante: esto no es un problema de internet ni de AFIP/ARCA. Es una actualización del componente de facturación electrónica.`
};

const rules = [
  { id: 'mem', answer: answers.mem, match: q => hasAny(q, ['archivo de memoria', 'archivo mem', '.mem', 'param.mem', 'config.mem', 'rece.mem']) },
  { id: 'factura-no-electronica', answer: answers.facturaNoElectronica, match: q => hasAny(q, ['factura no electronica', 'factura no electrónica', 'atencion factura no electronica', 'atención factura no electrónica', 'comprobante no electronico', 'comprobante no electrónico']) },
  { id: 'duplicidad-numeracion', answer: answers.duplicidad, match: q => hasAny(q, ['duplicidad en la numeracion', 'duplicidad en la numeración', 'duplicidad de numeracion', 'duplicidad de numeración', 'numeracion duplicada', 'numeración duplicada']) || (q.includes('afip') && q.includes('proximo numero')) },
  { id: 'reindexa-clientes', answer: answers.reindexaClientes, match: q => (q.includes('reindexa') && ['90','91','92','93'].some(n => q.includes(n))) || (q.includes('ver_stru_fe') && q.includes('136')) },
  { id: 'reindexa-deposito', answer: answers.reindexaDeposito, match: q => q.includes('reindexa') && q.includes('23') },
  { id: 'programa-desaparecido', answer: answers.gvw, match: q => hasAny(q, ['desaparecio el programa', 'desapareció el programa', 'desaparecio husky', 'desapareció husky', 'desaparecio el icono', 'desapareció el ícono', 'no encuentro el programa', 'gvw.exe', 'se movio el elemento', 'se movió el elemento']) },
  { id: 'importacion-excel', answer: answers.excel, match: q => hasAny(q, ['importar articulos', 'importar artículos', 'importacion de articulos', 'importación de artículos', 'formato excel', 'plantilla articulos', 'plantilla artículos']) },
  { id: 'error-leer-archivo', answer: answers.errorLeerArchivo, match: q => hasAny(q, ['error al leer el archivo', 'error leyendo archivo']) },
  { id: 'no-es-una-tabla', answer: answers.noTabla, match: q => hasAny(q, ['no es una tabla', 'no es tabla']) },
  { id: 'pdf', answer: answers.pdf, match: q => hasAny(q, ['no genera pdf', 'generar pdf', 'pdf creator', 'pdfcreator', 'microsoft print to pdf']) },
  { id: 'gmail', answer: answers.gmail, match: q => hasAny(q, ['gmail', 'smtp.gmail.com', 'contraseña de aplicaciones', 'contrasena de aplicaciones', 'correo gmail']) },
  { id: 'wsafipfe', answer: answers.wsafipfe, match: q => hasAny(q, ['wsafipfe', 'wafipfe', 'dll de factura electronica', 'dll de factura electrónica', 'componente de factura electronica', 'componente de factura electrónica']) }
];

function findDeterministicRuleAnswer(input) {
  const q = normalize(input);
  if (!q) return null;
  for (const rule of rules) {
    if (rule.match(q)) return { id: rule.id, answer: rule.answer };
  }
  return null;
}

module.exports = { findDeterministicRuleAnswer, rules, normalize };
