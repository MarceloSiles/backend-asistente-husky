// Base inicial de conocimiento del asistente Husky Software.
// Se puede ampliar sin tocar el frontend del sitio web.

const faq = [
  {
    keywords: ["factura", "hacer factura", "primera factura", "facturar"],
    answer: `¡Hola! 😊 Te guío paso a paso para hacer una factura en Husky.

1. Entrá al módulo Clientes / Facturación.
2. Elegí el cliente que va a recibir la factura. Si ya está cargado, hacé doble clic. Si no está, usá Nuevo y completá sus datos principales.
3. Cargá los artículos, cantidades y precios.
4. Revisá la fecha de emisión.
5. Si es factura electrónica, tocá Solicitar CAE.
6. Cuando el CAE esté aprobado, ya podés imprimir o guardar la factura.

Si algo no aparece igual en pantalla, contame qué ves y te ayudo.`
  },
  {
    keywords: ["duplicidad", "numero duplicado", "numeracion", "cae duplicado"],
    answer: `Este caso suele estar relacionado con duplicidad en la numeración al emitir comprobantes electrónicos. No conviene seguir intentando emitir comprobantes hasta revisar el punto de venta, el último número utilizado y la respuesta de AFIP/ARCA. Te recomiendo contactar al soporte técnico de Husky Software para verificar la secuencia y evitar inconsistencias.`
  },
  {
    keywords: ["no es una tabla", "dbf", "auxmov3", "tabla dañada", "archivo dañado"],
    answer: `Ese mensaje indica que un archivo DBF puede estar dañado, faltante o fuera de sincronía. Puede ocurrir con distintos archivos, por ejemplo AUXMOV3.DBF u otros.

Recomendación: no seguir usando el sistema hasta que soporte técnico de Husky revise los archivos. Copiar archivos sueltos o intentar reparaciones sin asistencia puede empeorar el problema.`
  },
  {
    keywords: ["clientes.dbf", "clientes bak", "clientes tbk", "clientes dañado"],
    answer: `Si se dañó CLIENTES.DBF, la primera recomendación es no hacer más nada con el sistema y adjuntar los archivos CLIENTES.BAK y CLIENTES.TBK al soporte de Husky Software para intentar su reparación. Luego, soporte evaluará otras alternativas según el estado de los archivos.`
  },
  {
    keywords: ["memoria está dañado", "foxuser", "archivo de memoria", "foxuser.dbf"],
    answer: `El mensaje "el archivo de memoria está dañado" suele relacionarse con archivos temporales del sistema, como FOXUSER.DBF.

Solución habitual:
1. Cerrar Husky en todas las PCs.
2. Eliminar los archivos temporales indicados por soporte.
3. Volver a abrir el sistema.

Esto no implica pérdida de información comercial.`
  },
  {
    keywords: ["param.mem", "config.mem", "param dañado", "config dañado", "datos.zip"],
    answer: `Si aparece que PARAM.MEM o CONFIG.MEM está dañado, no se debe indicar que se regenera automáticamente.

Procedimiento recomendado:
1. Cerrar Husky en todas las PCs.
2. Verificar que exista un backup actualizado.
3. Abrir el archivo DATOS.ZIP dentro de la carpeta del sistema.
4. Extraer únicamente PARAM.MEM y CONFIG.MEM.
5. Reemplazar los archivos existentes.

Si no estás seguro de cómo hacerlo, conviene contactar al soporte técnico de Husky Software.`
  },
  {
    keywords: ["gve.exe", "gvw.exe", "icono", "acceso directo", "antivirus", "cuarentena", "windows movió"],
    answer: `Si desaparece el ícono o Windows indica que se movió GVW.EXE, normalmente no es un error del sistema Husky. Suele ser un falso positivo del antivirus, que envió el ejecutable a Cuarentena.

Debe intervenir un técnico en PC para restaurar el archivo desde la cuarentena y agregar una excepción del antivirus para la carpeta del sistema. No hay pérdida de información, porque las bases de datos de Husky no fueron afectadas.`
  },
  {
    keywords: ["certificado expirado", "pfx vencido", "certificado vencido"],
    answer: `El mensaje "certificado expirado" indica que el certificado digital .PFX venció. Hay que generar uno nuevo desde AFIP/ARCA y reemplazar el anterior en la carpeta del sistema.

Los certificados tienen validez limitada, por eso conviene renovarlos antes del vencimiento. Se recomienda contactar al soporte técnico de Husky Software para recibir asistencia en el proceso.`
  },
  {
    keywords: ["pfx", "certificado", "firewall", "router", "antivirus"],
    answer: `Los certificados digitales de AFIP/ARCA usados por Husky son archivos .PFX que deben estar dentro de la carpeta del sistema. No se instalan en Windows como otros certificados.

Salvo el caso específico de "certificado expirado", muchos problemas relacionados con el PFX se resuelven agregando una excepción en antivirus/firewall para la carpeta del sistema. Si eso no alcanza, también puede ayudar reiniciar el router.`
  },
  {
    keywords: ["ticket acceso", "falló al intentar obtener", "servidor afip", "servidor arca", "cae"],
    answer: `El mensaje "Falló al intentar obtener el Ticket de Acceso al Servidor de la AFIP" generalmente indica un problema de conectividad con los servidores de AFIP/ARCA.

Puede deberse a conexión a internet inestable, servidores momentáneamente caídos, antivirus o firewall bloqueando, PFX dañado o vencido, o fecha/hora incorrecta en la PC.

Revisá conexión, reiniciá el router, verificá excepciones del antivirus/firewall y comprobá la fecha y hora del equipo.`
  },
  {
    keywords: ["error inesperado de recepción", "se ha terminado la conexión", "conexion afip", "conexion arca"],
    answer: `Este error suele estar relacionado con problemas de conectividad entre Husky y los servidores de AFIP/ARCA.

Recomendaciones:
1. Verificar conexión estable a internet.
2. Reiniciar el router.
3. Agregar excepción en antivirus/firewall para la carpeta del sistema.
4. Revisar fecha y hora de la PC.
5. Verificar que el archivo .PFX esté en la carpeta del sistema.

Si persiste, contactar al soporte técnico de Husky Software.`
  },
  {
    keywords: ["borrar factura", "eliminar factura", "anular factura", "nota de credito"],
    answer: `No es posible eliminar una factura electrónica que ya tiene CAE. Para anular su efecto contable y comercial debe emitirse una Nota de Crédito Electrónica.

La nota puede aplicarse o no en cuenta corriente según el caso.`
  },
  {
    keywords: ["asteriscos", "importe", "factura impresa", "sale con estrellas"],
    answer: `Cuando aparecen asteriscos en los importes de una factura impresa, suele deberse a que el espacio previsto en el diseño del comprobante ya no alcanza para mostrar importes actuales, muchas veces por efecto de la inflación.

Puede requerir ajustar el diseño o migrar a la última versión del sistema.`
  },
  {
    keywords: ["remito", "remitos", "preimpreso", "cai"],
    answer: `Los remitos deben ser prenumerados y preimpresos por una imprenta, incluyendo número, datos fiscales, CAI, vencimiento y código de barras.

Por eso Husky no imprime el encabezado del remito: debe coincidir con el formulario preimpreso. La imprenta debe respetar el formato del sistema y completar solo los datos fijos.`
  },
  {
    keywords: ["pedido", "pedidos", "cargar pedido", "pedido cliente"],
    answer: `Sí, Husky permite registrar pedidos de clientes desde el módulo de Clientes o Ventas. Luego esos pedidos pueden convertirse en facturas.

El stock se descuenta al facturar, no al cargar el pedido.`
  },
  {
    keywords: ["articulo", "artículo", "agregar artículo", "nuevo articulo", "maestro de articulos"],
    answer: `Para agregar un artículo:

1. Entrá al módulo correspondiente.
2. Ingresá al maestro de artículos.
3. Tocá Nuevo.
4. Completá los datos principales del artículo.
5. Guardá los cambios.

Si trabajás con stock, revisá también los datos de existencia, precio y rubro.`
  },
  {
    keywords: ["retencion", "retenciones", "orden de pago"],
    answer: `En las órdenes de pago, Husky no realiza el cálculo automático de retenciones. Solo permite informar manualmente el monto total retenido.`
  },
  {
    keywords: ["impuestos internos", "percepciones", "iva compras"],
    answer: `En Clientes/Ventas, Husky no permite trabajar con impuestos internos ni percepciones.

En Compras, esos datos sí pueden informarse con fines contables para el registro del IVA Compras.`
  },
  {
    keywords: ["actualizar", "actualización", "nueva version", "reinstalacion"],
    answer: `La actualización de Husky implica una reinstalación completa. Se instala una nueva versión que hereda los datos de la versión anterior, conservando la información.

Este procedimiento tiene un costo y debe coordinarse con el soporte técnico de Husky Software.`
  },
  {
    keywords: ["windows server", "multiusuario", "terminales", "escritorio remoto", "requisitos"],
    answer: `Husky Gestión Comercial requiere Windows 10 o superior. Para uso multiusuario, se necesita un servidor con Windows Server 2016 o superior, al que las terminales acceden mediante Escritorio Remoto.

Esta configuración debe realizarla un técnico en PC con conocimientos de redes, ya que no forma parte del soporte de Husky Software.`
  },
  {
    keywords: ["ticket factura", "ticket electrónico", "comandera", "impresora térmica", "8 cm", "qr"],
    answer: `Husky permite emitir ticket-factura electrónico en formato ticket de 8 cm usando una impresora comandera térmica, incluyendo QR, CAE y datos fiscales.

También permite configurar la comandera para definir si imprime en formato ticket o en hoja A4.`
  }
];

function findFaqAnswer(question) {
  const text = String(question || "").toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const item of faq) {
    const score = item.keywords.reduce((acc, keyword) => {
      return acc + (text.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best.answer : null;
}

module.exports = { faq, findFaqAnswer };
