import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Configuração CORS mais permissiva para desenvolvimento e produção
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sem origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        // Lista de origens permitidas
        const allowedOrigins = [
            'http://localhost:3004',
            'http://127.0.0.1:3004',
            'http://localhost:5173', // Vite dev server
            'http://127.0.0.1:5173'
        ];

        // Permitir qualquer subdomínio .vercel.app
        if (origin.includes('.vercel.app') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(null, true); // Para desenvolvimento, permitir tudo
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
};

const io = new Server(server, {
    cors: corsOptions,
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('.'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        rooms: gameRooms.size,
        players: playerSockets.size
    });
});

// Endpoint para listar salas (para debug)
app.get('/api/rooms', (req, res) => {
    const rooms = Array.from(gameRooms.entries()).map(([code, room]) => ({
        code,
        players: room.getPlayerCount(),
        state: room.gameState,
        round: room.currentRound
    }));
    res.json(rooms);
});

// Estado do servidor
const gameRooms = new Map();
const playerSockets = new Map();

// Locais pré-definidos para o jogo
const gameLocations = [
    { lat: 40.7589, lng: -73.9851, name: 'Times Square, Nova York' },
    { lat: 48.8584, lng: 2.2945, name: 'Torre Eiffel, Paris' },
    { lat: 51.5014, lng: -0.1419, name: 'Big Ben, Londres' },
    { lat: 35.6762, lng: 139.6503, name: 'Tóquio, Japão' },
    { lat: -22.9068, lng: -43.1729, name: 'Cristo Redentor, Rio de Janeiro' },
    { lat: 55.7558, lng: 37.6176, name: 'Praça Vermelha, Moscou' },
    { lat: 41.8902, lng: 12.4922, name: 'Coliseu, Roma' },
    { lat: 37.9755, lng: 23.7348, name: 'Acrópole, Atenas' },
    { lat: 40.4319, lng: 116.5704, name: 'Grande Muralha, China' },
    { lat: -33.8568, lng: 151.2153, name: 'Sydney Opera House, Austrália' },
    { lat: 27.1751, lng: 78.0421, name: 'Taj Mahal, Índia' },
    { lat: 25.1972, lng: 55.2744, name: 'Burj Khalifa, Dubai' },
    { lat: -13.1631, lng: -72.5450, name: 'Machu Picchu, Peru' },
    { lat: 29.9792, lng: 31.1342, name: 'Pirâmides de Gizé, Egito' },
    { lat: 64.1466, lng: -21.9426, name: 'Reykjavik, Islândia' }
];

class GameRoom {
    constructor(roomCode) {
        this.roomCode = roomCode;
        this.players = new Map();
        this.gameState = 'waiting'; // waiting, playing, finished
        this.currentRound = 0;
        this.totalRounds = 5;
        this.currentLocation = null;
        this.roundStartTime = null;
        this.roundDuration = 120000; // 2 minutos
        this.roundTimer = null;
        this.selectedLocations = [];
        this.roundGuesses = new Map();
        this.gameResults = [];
    }

    addPlayer(socketId, playerName) {
        const player = {
            socketId,
            name: playerName,
            score: 0,
            ready: false,
            connected: true,
            roundScores: []
        };
        this.players.set(socketId, player);
        return player;
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
    }

    getPlayerCount() {
        return this.players.size;
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    startGame() {
        if (this.gameState !== 'waiting' || this.players.size < 1) {
            return false;
        }

        // Selecionar 5 locais aleatórios
        this.selectedLocations = this.selectRandomLocations();
        this.gameState = 'starting'; // Estado intermediário
        this.currentRound = 1;

        // Resetar pontuações
        this.players.forEach(player => {
            player.score = 0;
            player.roundScores = [];
        });

        // Aguardar um pouco antes de iniciar o primeiro round
        setTimeout(() => {
            this.gameState = 'playing';
            this.startRound();
        }, 2000);

        return true;
    }

    selectRandomLocations() {
        const shuffled = [...gameLocations].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, this.totalRounds);
    }

    startRound() {
        if (this.currentRound > this.totalRounds) {
            this.endGame();
            return;
        }

        this.currentLocation = this.selectedLocations[this.currentRound - 1];
        this.roundStartTime = Date.now();
        this.roundGuesses.clear();

        // Timer para finalizar o round automaticamente
        this.roundTimer = setTimeout(() => {
            this.endRound();
        }, this.roundDuration);
    }

    submitGuess(socketId, guess) {
        if (this.gameState !== 'playing' || this.roundGuesses.has(socketId)) {
            return false;
        }

        this.roundGuesses.set(socketId, {
            ...guess,
            timestamp: Date.now()
        });

        // Se todos os jogadores enviaram palpites, finalizar round
        if (this.roundGuesses.size === this.players.size) {
            clearTimeout(this.roundTimer);
            this.endRound();
        }

        return true;
    }

    endRound() {
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }

        // Calcular pontuações
        const roundResults = [];
        this.players.forEach((player, socketId) => {
            const guess = this.roundGuesses.get(socketId);
            let score = 0;
            let distance = 0;

            if (guess) {
                distance = this.calculateDistance(
                    this.currentLocation.lat,
                    this.currentLocation.lng,
                    guess.lat,
                    guess.lng
                );
                score = this.calculateScore(distance);
            }

            player.score += score;
            player.roundScores.push(score);

            roundResults.push({
                socketId,
                playerName: player.name,
                guess: guess || null,
                score,
                distance,
                totalScore: player.score
            });
        });

        this.gameResults.push({
            round: this.currentRound,
            location: this.currentLocation,
            results: roundResults
        });

        // Enviar resultados do round
        const roundData = {
            round: this.currentRound,
            location: this.currentLocation,
            results: roundResults,
            isLastRound: this.currentRound >= this.totalRounds
        };

        // Emitir resultados para todos na sala
        const roomSockets = Array.from(this.players.keys());
        roomSockets.forEach(socketId => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('round-ended', roundData);
            }
        });

        // Próximo round ou fim do jogo
        if (this.currentRound < this.totalRounds) {
            this.currentRound++;
            setTimeout(() => {
                this.startRound();
                // Enviar próximo round
                const nextRoundData = {
                    round: this.currentRound,
                    location: this.currentLocation,
                    timeLimit: this.roundDuration
                };
                roomSockets.forEach(socketId => {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.emit('round-started', nextRoundData);
                    }
                });
            }, 5000); // 5 segundos para ver resultados
        } else {
            setTimeout(() => {
                this.endGame();
            }, 3000);
        }
    }

    endGame() {
        this.gameState = 'finished';

        // Calcular ranking final
        const finalRanking = this.getAllPlayers()
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                position: index + 1,
                ...player
            }));

        // Enviar resultados finais
        const gameEndData = {
            finalRanking,
            gameResults: this.gameResults,
            totalRounds: this.totalRounds
        };

        const roomSockets = Array.from(this.players.keys());
        roomSockets.forEach(socketId => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('game-ended', gameEndData);
            }
        });

        return finalRanking;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    calculateScore(distanceKm) {
        if (distanceKm < 1) return 5000;
        if (distanceKm < 10) return Math.round(5000 - (distanceKm * 100));
        if (distanceKm < 100) return Math.round(4000 - (distanceKm * 20));
        if (distanceKm < 1000) return Math.round(2000 - (distanceKm * 1.5));
        return Math.max(0, Math.round(500 - (distanceKm * 0.1)));
    }

    getRoomInfo() {
        return {
            roomCode: this.roomCode,
            gameState: this.gameState,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            playerCount: this.getPlayerCount(),
            players: this.getAllPlayers(),
            currentLocation: this.gameState === 'playing' ? this.currentLocation : null,
            roundTimeLeft: this.roundStartTime ?
                Math.max(0, this.roundDuration - (Date.now() - this.roundStartTime)) : 0
        };
    }
}

// Gerar código de sala aleatório
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.io eventos
io.on('connection', (socket) => {
    console.log(`🔌 Jogador conectado: ${socket.id} de ${socket.handshake.address}`);

    // Timeout para conexões inativas
    const connectionTimeout = setTimeout(() => {
        console.log(`⏰ Timeout para socket ${socket.id}`);
        socket.disconnect(true);
    }, 300000); // 5 minutos

    // Limpar timeout quando socket desconectar
    socket.on('disconnect', () => {
        clearTimeout(connectionTimeout);
    });

    // Criar sala
    socket.on('create-room', (playerName) => {
        try {
            if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
                socket.emit('error', { message: 'Nome do jogador inválido!' });
                return;
            }

            const roomCode = generateRoomCode();
            const room = new GameRoom(roomCode);

            gameRooms.set(roomCode, room);
            playerSockets.set(socket.id, { roomCode, playerName: playerName.trim() });

            const player = room.addPlayer(socket.id, playerName.trim());
            socket.join(roomCode);

            socket.emit('room-created', {
                roomCode,
                player,
                roomInfo: room.getRoomInfo()
            });

            console.log(`🏠 Sala criada: ${roomCode} por ${playerName.trim()}`);
        } catch (error) {
            console.error('❌ Erro ao criar sala:', error);
            socket.emit('error', { message: 'Erro interno ao criar sala.' });
        }
    });

    // Entrar em sala
    socket.on('join-room', (data) => {
        try {
            if (!data || typeof data !== 'object') {
                socket.emit('error', { message: 'Dados inválidos!' });
                return;
            }

            const { roomCode, playerName } = data;

            if (!roomCode || !playerName ||
                typeof roomCode !== 'string' || typeof playerName !== 'string' ||
                roomCode.trim().length === 0 || playerName.trim().length === 0) {
                socket.emit('error', { message: 'Código da sala e nome do jogador são obrigatórios!' });
                return;
            }

            const cleanRoomCode = roomCode.trim().toUpperCase();
            const cleanPlayerName = playerName.trim();

            const room = gameRooms.get(cleanRoomCode);

            if (!room) {
                console.log(`❌ Tentativa de entrar em sala inexistente: ${cleanRoomCode} por ${cleanPlayerName}`);
                socket.emit('error', { message: 'Sala não encontrada! Verifique o código.' });
                return;
            }

            console.log(`🔄 ${cleanPlayerName} tentando entrar na sala ${cleanRoomCode} (estado: ${room.gameState})`);

            // Se o jogo já está em andamento, permitir reconexão apenas para jogadores existentes
            if (room.gameState === 'playing') {
                const existingPlayer = Array.from(room.players.values()).find(p => p.name === cleanPlayerName);
                if (!existingPlayer) {
                    socket.emit('error', { message: 'Jogo já em andamento! Não é possível entrar agora.' });
                    return;
                }
            }

            // Verificar se o jogador já está na sala (reconexão)
            const existingPlayer = Array.from(room.players.values()).find(p => p.name === cleanPlayerName);

            if (existingPlayer) {
                // Reconexão permitida mesmo durante o jogo
                room.players.delete(existingPlayer.socketId);
                existingPlayer.socketId = socket.id;
                existingPlayer.connected = true;
                room.players.set(socket.id, existingPlayer);
                console.log(`🔄 ${cleanPlayerName} reconectou à sala ${cleanRoomCode} (estado: ${room.gameState})`);

                // Se o jogo está em andamento, enviar o round atual
                if (room.gameState === 'playing' && room.currentLocation) {
                    console.log(`📍 Enviando round atual ${room.currentRound} para ${cleanPlayerName} que reconectou`);
                    setTimeout(() => {
                        socket.emit('round-started', {
                            round: room.currentRound,
                            location: room.currentLocation,
                            timeLimit: room.roundDuration
                        });
                    }, 1000);
                }
            } else if (room.gameState !== 'waiting') {
                // Novo jogador não pode entrar se o jogo já começou
                socket.emit('error', { message: 'Jogo já em andamento! Não é possível entrar agora.' });
                return;
            } else {
                // Novo jogador
                const player = room.addPlayer(socket.id, cleanPlayerName);
                console.log(`👥 ${cleanPlayerName} entrou na sala ${cleanRoomCode}`);
            }

            playerSockets.set(socket.id, { roomCode: cleanRoomCode, playerName: cleanPlayerName });
            socket.join(cleanRoomCode);

            socket.emit('room-joined', {
                roomCode: cleanRoomCode,
                player: room.players.get(socket.id),
                roomInfo: room.getRoomInfo()
            });

            // Notificar outros jogadores
            socket.to(cleanRoomCode).emit('player-joined', {
                player: room.players.get(socket.id),
                roomInfo: room.getRoomInfo()
            });
        } catch (error) {
            console.error('❌ Erro ao entrar na sala:', error);
            socket.emit('error', { message: 'Erro interno ao entrar na sala.' });
        }
    });

    // Iniciar jogo
    socket.on('start-game', () => {
        const playerInfo = playerSockets.get(socket.id);
        if (!playerInfo) return;

        const room = gameRooms.get(playerInfo.roomCode);
        if (!room) return;

        console.log(`🎮 Iniciando jogo na sala ${playerInfo.roomCode} com ${room.players.size} jogadores`);

        if (room.startGame()) {
            // Notificar que o jogo foi iniciado
            io.to(playerInfo.roomCode).emit('game-started', {
                roomInfo: room.getRoomInfo()
            });

            console.log(`✅ Jogo iniciado na sala ${playerInfo.roomCode}`);

            // Aguardar um pouco para os clientes se reconectarem, então enviar primeiro round
            setTimeout(() => {
                // Verificar se a sala ainda existe antes de enviar o round
                const currentRoom = gameRooms.get(playerInfo.roomCode);
                if (currentRoom && currentRoom.gameState === 'playing') {
                    console.log(`📍 Enviando primeiro round para sala ${playerInfo.roomCode}`);
                    io.to(playerInfo.roomCode).emit('round-started', {
                        round: currentRoom.currentRound,
                        location: currentRoom.currentLocation,
                        timeLimit: currentRoom.roundDuration
                    });
                } else {
                    console.log(`⚠️ Sala ${playerInfo.roomCode} não existe mais ou não está em jogo`);
                }
            }, 3000); // Aumentado para 3 segundos
        }
    });

    // Enviar palpite
    socket.on('submit-guess', (guess) => {
        const playerInfo = playerSockets.get(socket.id);
        if (!playerInfo) return;

        const room = gameRooms.get(playerInfo.roomCode);
        if (!room) return;

        if (room.submitGuess(socket.id, guess)) {
            // Notificar que o jogador enviou palpite
            socket.to(playerInfo.roomCode).emit('player-submitted', {
                playerName: playerInfo.playerName,
                submittedCount: room.roundGuesses.size,
                totalPlayers: room.players.size
            });
        }
    });

    // Desconexão
    socket.on('disconnect', () => {
        console.log(`🔌 Jogador desconectado: ${socket.id}`);

        const playerInfo = playerSockets.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomCode);
            if (room) {
                // Se o jogo está iniciando ou em andamento, não remover o jogador imediatamente
                if (room.gameState === 'playing' || room.gameState === 'starting') {
                    console.log(`⏳ Jogador ${playerInfo.playerName} desconectou durante o jogo. Mantendo na sala para reconexão.`);
                    // Marcar como desconectado mas manter na sala
                    const player = room.players.get(socket.id);
                    if (player) {
                        player.connected = false;
                        player.lastSeen = Date.now();
                    }
                } else {
                    // Remover jogador normalmente se o jogo não começou
                    room.removePlayer(socket.id);

                    // Notificar outros jogadores se ainda há jogadores
                    if (room.getPlayerCount() > 0) {
                        socket.to(playerInfo.roomCode).emit('player-left', {
                            playerName: playerInfo.playerName,
                            roomInfo: room.getRoomInfo()
                        });
                    }
                }

                // Remover sala apenas se vazia E não está em jogo
                if (room.getPlayerCount() === 0 && room.gameState !== 'playing' && room.gameState !== 'starting') {
                    gameRooms.delete(playerInfo.roomCode);
                    console.log(`🗑️ Sala ${playerInfo.roomCode} removida (vazia)`);
                }
            }
            playerSockets.delete(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌍 Acesse: http://localhost:${PORT}`);
    console.log(`👥 Lobby: http://localhost:${PORT}/lobby.html`);
    console.log(`🎮 Jogo: http://localhost:${PORT}/index.html`);
});
