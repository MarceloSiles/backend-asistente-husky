const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Husky operativo' });
});

app.listen(PORT, () => console.log(`Servidor Husky escuchando en puerto ${PORT}`));
