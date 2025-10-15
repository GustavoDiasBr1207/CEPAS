// backend/server.js
console.log('🚀 Iniciando backend...');

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes'); // <--- Importa as rotas do novo arquivo
// Nenhuma necessidade de importar 'oracledb', 'path', ou 'fs' aqui

// Importa o módulo Oracle (apenas para garantir a inicialização)
// O arquivo oracle.js é importado indiretamente via apiRoutes, 
// mas você pode chamá-lo diretamente aqui para garantir a inicialização se preferir:
require('./oracle'); 

const app = express();
app.use(cors());
app.use(express.json()); // Middleware essencial para receber dados JSON no body


// Aplica as rotas com um prefixo '/api'
// Todos os seus endpoints agora começarão com /api
// Ex: http://localhost:3001/api/ping
app.use('/api', apiRoutes); 

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});