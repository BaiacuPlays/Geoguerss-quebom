// Script de teste para funcionalidade multiplayer
import { io } from 'socket.io-client';

const TEST_SERVER = 'http://localhost:3004';

class MultiplayerTester {
    constructor() {
        this.players = [];
        this.roomCode = null;
    }

    async createTestRoom() {
        console.log('🧪 Iniciando teste de multiplayer...');
        
        // Criar primeiro jogador (host)
        const host = io(TEST_SERVER);
        
        return new Promise((resolve, reject) => {
            host.on('connect', () => {
                console.log('✅ Host conectado');
                
                host.emit('create-room', 'TestHost');
                
                host.on('room-created', (data) => {
                    console.log('🏠 Sala criada:', data.roomCode);
                    this.roomCode = data.roomCode;
                    this.players.push({ socket: host, name: 'TestHost', role: 'host' });
                    resolve(data.roomCode);
                });
                
                host.on('error', (error) => {
                    console.error('❌ Erro do host:', error);
                    reject(error);
                });
            });
            
            host.on('connect_error', (error) => {
                console.error('❌ Erro de conexão do host:', error);
                reject(error);
            });
        });
    }

    async addTestPlayer(playerName) {
        if (!this.roomCode) {
            throw new Error('Sala não criada ainda');
        }

        const player = io(TEST_SERVER);
        
        return new Promise((resolve, reject) => {
            player.on('connect', () => {
                console.log(`✅ ${playerName} conectado`);
                
                player.emit('join-room', {
                    roomCode: this.roomCode,
                    playerName: playerName
                });
                
                player.on('room-joined', (data) => {
                    console.log(`👥 ${playerName} entrou na sala`);
                    this.players.push({ socket: player, name: playerName, role: 'player' });
                    resolve(data);
                });
                
                player.on('error', (error) => {
                    console.error(`❌ Erro de ${playerName}:`, error);
                    reject(error);
                });
            });
        });
    }

    async startTestGame() {
        const host = this.players.find(p => p.role === 'host');
        if (!host) {
            throw new Error('Host não encontrado');
        }

        console.log('🎮 Iniciando jogo de teste...');
        
        // Configurar listeners para todos os jogadores
        this.players.forEach(player => {
            player.socket.on('game-started', (data) => {
                console.log(`🎮 ${player.name} recebeu game-started`);
            });
            
            player.socket.on('round-started', (data) => {
                console.log(`📍 ${player.name} recebeu round-started:`, data.round);
                
                // Simular palpite após 2 segundos
                setTimeout(() => {
                    const randomGuess = {
                        lat: Math.random() * 180 - 90,
                        lng: Math.random() * 360 - 180
                    };
                    
                    player.socket.emit('submit-guess', randomGuess);
                    console.log(`🎯 ${player.name} enviou palpite`);
                }, 2000);
            });
            
            player.socket.on('round-ended', (data) => {
                console.log(`📊 ${player.name} recebeu round-ended:`, data.round);
            });
            
            player.socket.on('game-ended', (data) => {
                console.log(`🏁 ${player.name} recebeu game-ended`);
                console.log('🏆 Ranking final:', data.finalRanking);
            });
        });

        // Iniciar o jogo
        host.socket.emit('start-game');
    }

    async runFullTest() {
        try {
            console.log('🚀 Iniciando teste completo...');
            
            // Criar sala
            await this.createTestRoom();
            
            // Adicionar jogadores
            await this.addTestPlayer('TestPlayer1');
            await this.addTestPlayer('TestPlayer2');
            
            console.log(`👥 Sala ${this.roomCode} com ${this.players.length} jogadores`);
            
            // Aguardar um pouco
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Iniciar jogo
            await this.startTestGame();
            
            console.log('✅ Teste iniciado com sucesso!');
            console.log('⏳ Aguardando conclusão do jogo...');
            
            // Aguardar 30 segundos para o jogo terminar
            setTimeout(() => {
                console.log('🔚 Finalizando teste...');
                this.cleanup();
            }, 30000);
            
        } catch (error) {
            console.error('❌ Erro no teste:', error);
            this.cleanup();
        }
    }

    cleanup() {
        console.log('🧹 Limpando conexões...');
        this.players.forEach(player => {
            player.socket.disconnect();
        });
        process.exit(0);
    }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new MultiplayerTester();
    
    console.log('🧪 Teste de Multiplayer GeoGuessr');
    console.log('📡 Servidor:', TEST_SERVER);
    console.log('⏰ Iniciando em 2 segundos...');
    
    setTimeout(() => {
        tester.runFullTest();
    }, 2000);
    
    // Cleanup em caso de interrupção
    process.on('SIGINT', () => {
        console.log('\n🛑 Teste interrompido pelo usuário');
        tester.cleanup();
    });
}

export default MultiplayerTester;
