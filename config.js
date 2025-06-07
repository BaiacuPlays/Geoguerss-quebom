// Configuração do ambiente
export const config = {
    // Detectar se está em produção
    isProduction: () => {
        if (typeof window !== 'undefined') {
            return window.location.hostname !== 'localhost' && 
                   window.location.hostname !== '127.0.0.1' &&
                   !window.location.hostname.includes('192.168');
        }
        return process.env.NODE_ENV === 'production';
    },

    // URL do servidor Socket.IO
    getSocketUrl: () => {
        if (config.isProduction()) {
            // Em produção, usar a URL atual (Vercel)
            return typeof window !== 'undefined' ? window.location.origin : '';
        }
        // Em desenvolvimento, usar localhost
        return 'http://localhost:3004';
    },

    // Configurações do Socket.IO
    socketConfig: {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
        forceNew: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
    },

    // Configurações do jogo
    game: {
        roundDuration: 120000, // 2 minutos
        totalRounds: 5,
        maxPlayers: 8,
        minPlayers: 1
    }
};

// Função para debug
export const debug = {
    log: (...args) => {
        if (!config.isProduction()) {
            console.log('[DEBUG]', ...args);
        }
    },
    error: (...args) => {
        console.error('[ERROR]', ...args);
    },
    warn: (...args) => {
        console.warn('[WARN]', ...args);
    }
};
