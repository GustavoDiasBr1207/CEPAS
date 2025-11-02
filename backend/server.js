// backend/server.js
console.log('🚀 Iniciando backend (Modo RAM Otimizado)...');

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const apiRoutes = require('./routes/apiRoutes');
const authRoutes = require('./routes/authRoutes');

// Importa o módulo Oracle (apenas para garantir a inicialização)
require('./oracle'); 

const app = express();

// Compressão de respostas HTTP (reduz tráfego e economiza RAM)
app.use(compression({
    level: 6, // Nível médio de compressão (balanço CPU/tamanho)
    threshold: 1024 // Apenas para respostas > 1KB
}));

// Middleware para confiança em proxies (para capturar IP real)
app.set('trust proxy', true);

// CORS configurado para aceitar múltiplas origens (incluindo IP público)
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:80',
    'http://localhost',
    'http://127.0.0.1:80',
    'http://127.0.0.1'
];

// Adiciona origens extras definidas por variável de ambiente (separadas por vírgula)
if (process.env.EXTRA_ALLOWED_ORIGINS) {
  process.env.EXTRA_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean).forEach(origin => {
    allowedOrigins.push(origin);
  });
}

// Adicionar IP público se definido
if (process.env.PUBLIC_IP) {
    allowedOrigins.push(`http://${process.env.PUBLIC_IP}`);
    allowedOrigins.push(`http://${process.env.PUBLIC_IP}:80`);
    allowedOrigins.push(`http://${process.env.PUBLIC_IP}:3001`);
    console.log(`✅ CORS configurado para IP público: ${process.env.PUBLIC_IP}`);
}

console.log('✅ CORS allowedOrigins:', allowedOrigins);
if (process.env.EXTRA_ALLOWED_ORIGINS) {
  console.log('✅ CORS EXTRA_ALLOWED_ORIGINS:', process.env.EXTRA_ALLOWED_ORIGINS);
}

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // Verificar se a origem está na lista permitida
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Em produção com IP público, permitir qualquer origem do mesmo IP
            if (process.env.PUBLIC_IP && origin.includes(process.env.PUBLIC_IP)) {
                callback(null, true);
            } else {
                console.log(`⚠️  Origem bloqueada pelo CORS: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '2mb' })); // Limitar payload para economizar RAM

// Aplica as rotas de autenticação
app.use('/api/auth', authRoutes);

// Aplica as rotas gerais com um prefixo '/api'
app.use('/api', apiRoutes); 

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
  console.log('⚙️  Modo: RAM Otimizado (1GB)');
});

// Limitar conexões simultâneas para economizar RAM
server.maxConnections = 50;

// Timeout para requisições longas
server.timeout = 30000; // 30 segundos

// Graceful shutdown para liberar recursos corretamente
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando gracefully...');
  server.close(() => {
    console.log('✅ Server fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando gracefully...');
  server.close(() => {
    console.log('✅ Server fechado');
    process.exit(0);
  });
});