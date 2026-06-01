BACKEND ASISTENTE HUSKY SOFTWARE
================================

Este repositorio contiene el backend inicial del asistente técnico inteligente de Husky Software.

ARCHIVOS
--------
package.json      Dependencias y comando de inicio
server.js         Servidor principal Express
faq.js            Base inicial de preguntas frecuentes
.env.example      Ejemplo de variables de entorno para Render
README.TXT        Esta guía

FUNCIONES INCLUIDAS
-------------------
1) Endpoint de prueba:
   GET /health

2) Endpoint compatible con intento anterior:
   GET /api/health

3) Endpoint del asistente:
   POST /chat
   Body JSON de ejemplo:
   { "message": "No puedo pedir CAE" }

4) Estadísticas básicas:
   GET /stats
   Guarda consultas en data/consultas.jsonl

CONFIGURACIÓN EN RENDER
-----------------------
Tipo de servicio:
   Web Service

Runtime:
   Node

Branch:
   deploy

Build Command:
   npm install

Start Command:
   npm start

Variables de entorno:
   OPENAI_API_KEY   Clave de OpenAI
   OPENAI_MODEL     gpt-4o-mini
   ALLOWED_ORIGIN   *

IMPORTANTE
----------
La clave de OpenAI no debe colocarse dentro del código ni subirse a GitHub.
Debe cargarse como variable de entorno en Render.

NOTAS DE USO
------------
Si OPENAI_API_KEY no está configurada, el backend igual funciona usando la base FAQ incluida.
Si OPENAI_API_KEY está configurada, el backend usa GPT con la base de conocimiento inicial de Husky.

Contacto: huskysoftware@gmail.com
