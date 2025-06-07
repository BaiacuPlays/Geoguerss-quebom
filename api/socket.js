import { Server } from 'socket.io';
import { createServer } from 'http';

// Estado global das salas (em produção, usar Vercel KV)
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
        this.gameState = 'waiting';
        this.currentRound = 0;
        this.totalRounds = 5;
        this.currentLocation = null;
        this.roundStartTime = null;
        this.roundDuration = 120000;
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

        this.selectedLocations = this.selectRandomLocations();
        this.gameState = 'starting';
        this.currentRound = 1;

        this.players.forEach(player => {
            player.score = 0;
            player.roundScores = [];
        });

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

        return roundResults;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
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

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

let io;

export default function handler(req, res) {
    if (!io) {
        console.log('🚀 Inicializando Socket.IO...');
        
        const httpServer = createServer();
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            },
            allowEIO3: true
        });

        io.on('connection', (socket) => {
            console.log(`🔌 Jogador conectado: ${socket.id}`);

            socket.on('create-room', (playerName) => {
                const roomCode = generateRoomCode();
                const room = new GameRoom(roomCode);

                gameRooms.set(roomCode, room);
                playerSockets.set(socket.id, { roomCode, playerName });

                const player = room.addPlayer(socket.id, playerName);
                socket.join(roomCode);

                socket.emit('room-created', {
                    roomCode,
                    player,
                    roomInfo: room.getRoomInfo()
                });

                console.log(`🏠 Sala criada: ${roomCode} por ${playerName}`);
            });

            socket.on('join-room', (data) => {
                const { roomCode, playerName } = data;

                if (!roomCode || !playerName) {
                    socket.emit('error', { message: 'Dados inválidos para entrar na sala!' });
                    return;
                }

                const room = gameRooms.get(roomCode);

                if (!room) {
                    socket.emit('error', { message: 'Sala não encontrada!' });
                    return;
                }

                if (room.gameState === 'playing') {
                    const existingPlayer = Array.from(room.players.values()).find(p => p.name === playerName);
                    if (!existingPlayer) {
                        socket.emit('error', { message: 'Jogo já em andamento!' });
                        return;
                    }
                }

                const existingPlayer = Array.from(room.players.values()).find(p => p.name === playerName);

                if (existingPlayer) {
                    room.players.delete(existingPlayer.socketId);
                    existingPlayer.socketId = socket.id;
                    existingPlayer.connected = true;
                    room.players.set(socket.id, existingPlayer);
                } else if (room.gameState !== 'waiting') {
                    socket.emit('error', { message: 'Jogo já em andamento!' });
                    return;
                } else {
                    room.addPlayer(socket.id, playerName);
                }

                playerSockets.set(socket.id, { roomCode, playerName });
                socket.join(roomCode);

                socket.emit('room-joined', {
                    roomCode,
                    player: room.players.get(socket.id),
                    roomInfo: room.getRoomInfo()
                });

                socket.to(roomCode).emit('player-joined', {
                    player: room.players.get(socket.id),
                    roomInfo: room.getRoomInfo()
                });
            });

            socket.on('start-game', () => {
                const playerInfo = playerSockets.get(socket.id);
                if (!playerInfo) return;

                const room = gameRooms.get(playerInfo.roomCode);
                if (!room) return;

                if (room.startGame()) {
                    io.to(playerInfo.roomCode).emit('game-started', {
                        roomInfo: room.getRoomInfo()
                    });

                    setTimeout(() => {
                        const currentRoom = gameRooms.get(playerInfo.roomCode);
                        if (currentRoom && currentRoom.gameState === 'playing') {
                            io.to(playerInfo.roomCode).emit('round-started', {
                                round: currentRoom.currentRound,
                                location: currentRoom.currentLocation,
                                timeLimit: currentRoom.roundDuration
                            });
                        }
                    }, 3000);
                }
            });

            socket.on('submit-guess', (guess) => {
                const playerInfo = playerSockets.get(socket.id);
                if (!playerInfo) return;

                const room = gameRooms.get(playerInfo.roomCode);
                if (!room) return;

                if (room.submitGuess(socket.id, guess)) {
                    socket.to(playerInfo.roomCode).emit('player-submitted', {
                        playerName: playerInfo.playerName,
                        submittedCount: room.roundGuesses.size,
                        totalPlayers: room.players.size
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Jogador desconectado: ${socket.id}`);
                const playerInfo = playerSockets.get(socket.id);
                if (playerInfo) {
                    const room = gameRooms.get(playerInfo.roomCode);
                    if (room) {
                        if (room.gameState === 'playing' || room.gameState === 'starting') {
                            const player = room.players.get(socket.id);
                            if (player) {
                                player.connected = false;
                                player.lastSeen = Date.now();
                            }
                        } else {
                            room.removePlayer(socket.id);
                            if (room.getPlayerCount() > 0) {
                                socket.to(playerInfo.roomCode).emit('player-left', {
                                    playerName: playerInfo.playerName,
                                    roomInfo: room.getRoomInfo()
                                });
                            }
                        }

                        if (room.getPlayerCount() === 0 && room.gameState !== 'playing' && room.gameState !== 'starting') {
                            gameRooms.delete(playerInfo.roomCode);
                        }
                    }
                    playerSockets.delete(socket.id);
                }
            });
        });
    }

    res.socket.server.io = io;
    res.end();
}
