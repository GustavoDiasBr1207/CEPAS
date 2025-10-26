// backend/server.js
console.log('🚀 Iniciando backend...');

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');
const authRoutes = require('./routes/authRoutes');

// Importa o módulo Oracle (apenas para garantir a inicialização)
require('./oracle'); 

const app = express();

// Middleware para confiança em proxies (para capturar IP real)
app.set('trust proxy', true);

// CORS configurado para aceitar múltiplas origens
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:80',
        'http://localhost',
        'http://127.0.0.1:80',
        'http://127.0.0.1'
    ],
    credentials: true
}));

app.use(express.json()); // Middleware essencial para receber dados JSON no body

// Aplica as rotas de autenticação
app.use('/api/auth', authRoutes);

// Aplica as rotas gerais com um prefixo '/api'
app.use('/api', apiRoutes); 

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});