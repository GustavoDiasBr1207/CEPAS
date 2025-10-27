// Configuração PM2 para Oracle Cloud Always Free (1GB RAM)
module.exports = {
  apps: [{
    name: 'cepas-backend',
    script: './backend/server.js',
    
    // OTIMIZADO PARA 1GB RAM
    instances: 1,  // Apenas 1 instância (não usar cluster mode)
    exec_mode: 'fork',  // Modo fork (mais leve que cluster)
    
    // Limites de memória - reinicia se passar de 256MB
    max_memory_restart: '256M',
    
    // Variáveis de ambiente
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      NODE_OPTIONS: '--max-old-space-size=256'  // Limita heap do V8 a 256MB
    },
    
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    
    // Logs
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto-restart e monitoramento
    autorestart: true,
    watch: false,  // Desabilitado para economizar recursos
    max_restarts: 10,
    min_uptime: '10s',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Configurações adicionais
    ignore_watch: ['node_modules', 'logs', 'instant', 'wallet'],
    max_old_space_size: 256
  }]
};
