// Sistema Multiplayer para GeoGuessr
class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.isMultiplayer = false;
        this.roomData = null;
        this.currentRound = 0;
        this.roundTimer = null;
        this.players = [];
        this.roundResults = [];
        this.gameEnded = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.isConnecting = false;

        this.init();
    }

    init() {
        // Verificar se está em modo multiplayer
        const roomData = localStorage.getItem('multiplayerRoom');
        if (roomData) {
            try {
                this.roomData = JSON.parse(roomData);
                this.isMultiplayer = this.roomData.isMultiplayer;

                // Verificar se os dados são válidos
                if (this.isMultiplayer && this.isValidRoomData()) {
                    console.log('🎮 Inicializando modo multiplayer para sala:', this.roomData.roomCode);
                    this.connectToServer();
                    this.setupMultiplayerUI();
                } else if (this.isMultiplayer) {
                    console.log('⚠️ Dados de multiplayer inválidos, limpando...');
                    this.clearMultiplayerData();
                }
            } catch (error) {
                console.error('❌ Erro ao carregar dados da sala:', error);
                localStorage.removeItem('multiplayerRoom');
                this.isMultiplayer = false;
            }
        }
    }

    connectToServer() {
        // Verificar novamente se os dados são válidos antes de conectar
        if (!this.isValidRoomData()) {
            console.log('⚠️ Dados inválidos, cancelando conexão');
            this.clearMultiplayerData();
            return;
        }

        console.log('🔌 Conectando ao servidor multiplayer...');
        this.socket = io('http://localhost:3004');

        this.socket.on('connect', () => {
            console.log('✅ Conectado ao servidor multiplayer');
            this.rejoinRoom();
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Desconectado do servidor');
            this.showMultiplayerMessage('Conexão perdida com o servidor!', 'error');
        });

        this.socket.on('round-started', (data) => {
            console.log('🎮 Round iniciado:', data);
            this.handleRoundStart(data);
        });

        this.socket.on('round-ended', (data) => {
            console.log('📊 Round finalizado:', data);
            this.handleRoundEnd(data);
        });

        this.socket.on('game-ended', (data) => {
            console.log('🏁 Jogo finalizado:', data);
            this.handleGameEnd(data);
        });

        this.socket.on('player-submitted', (data) => {
            console.log('✅ Jogador enviou palpite:', data);
            this.updateSubmissionStatus(data);
        });

        this.socket.on('room-joined', (data) => {
            console.log('✅ Reconectado à sala:', data.roomCode);
            this.showMultiplayerMessage('Reconectado à sala!', 'success');

            // Reset tentativas de reconexão
            this.reconnectAttempts = 0;
            this.isConnecting = false;

            // Atualizar dados da sala
            this.roomData = {
                ...this.roomData,
                roomCode: data.roomCode
            };

            // Se o jogo já está em andamento, aguardar próximo round
            if (data.roomInfo && data.roomInfo.gameState === 'playing') {
                this.updateMultiplayerStatus('Jogo em andamento - aguardando próximo round...');
            }
        });

        this.socket.on('error', (data) => {
            console.error('❌ Erro multiplayer:', data.message);

            // Se a sala não foi encontrada
            if (data.message.includes('Sala não encontrada')) {
                this.reconnectAttempts++;

                // Verificar se o jogo acabou de ser iniciado e ainda temos tentativas
                const gameJustStarted = this.roomData?.gameStarted &&
                                       this.roomData?.timestamp &&
                                       (Date.now() - this.roomData.timestamp) < 20000;

                if (gameJustStarted && this.reconnectAttempts <= this.maxReconnectAttempts) {
                    console.log(`🔄 Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts} - Sala não encontrada, mas jogo acabou de iniciar...`);
                    this.showMultiplayerMessage(`Conectando... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');

                    // Tentar reconectar após alguns segundos (tempo crescente)
                    const delay = this.reconnectAttempts * 2000; // 2s, 4s, 6s
                    setTimeout(() => {
                        if (this.socket && this.socket.connected && !this.isConnecting) {
                            this.attemptRejoin();
                        }
                    }, delay);
                    return;
                } else {
                    console.log('🔄 Máximo de tentativas atingido ou tempo expirado. Limpando dados...');
                    this.clearMultiplayerData();
                    this.showMultiplayerMessage('Não foi possível conectar ao jogo. Voltando ao menu...', 'error');

                    // Voltar ao menu após alguns segundos
                    setTimeout(() => {
                        window.location.href = 'lobby.html';
                    }, 3000);
                }
            } else if (data.message.includes('Jogo já em andamento')) {
                // Jogo já em andamento - aguardar
                this.showMultiplayerMessage('Jogo em andamento. Aguardando...', 'info');
            } else {
                // Mostrar outros erros normalmente
                this.showMultiplayerMessage(data.message, 'error');
            }
        });
    }

    rejoinRoom() {
        if (!this.isValidRoomData()) {
            console.log('⚠️ Dados da sala inválidos, não é possível reentrar');
            this.clearMultiplayerData();
            return;
        }

        // Verificar se o jogo acabou de ser iniciado (menos de 10 segundos)
        const gameJustStarted = this.roomData.gameStarted &&
                               this.roomData.timestamp &&
                               (Date.now() - this.roomData.timestamp) < 10000;

        if (gameJustStarted) {
            console.log('🎮 Jogo recém iniciado, aguardando primeiro round...');
            this.updateMultiplayerStatus('Aguardando primeiro round...');

            // Aguardar um pouco antes de tentar reconectar
            setTimeout(() => {
                this.attemptRejoin();
            }, 2000);
        } else {
            this.attemptRejoin();
        }
    }

    attemptRejoin() {
        if (this.isConnecting) {
            console.log('⏳ Já tentando conectar, ignorando tentativa duplicada');
            return;
        }

        this.isConnecting = true;
        console.log('🔄 Tentando reentrar na sala:', this.roomData.roomCode);

        // Reentrar na sala após reconexão
        this.socket.emit('join-room', {
            roomCode: this.roomData.roomCode,
            playerName: this.roomData.playerName
        });

        // Reset flag após timeout
        setTimeout(() => {
            this.isConnecting = false;
        }, 5000);
    }

    setupMultiplayerUI() {
        // Adicionar elementos de UI multiplayer
        this.addMultiplayerElements();
        this.updateGameTitle();
    }

    addMultiplayerElements() {
        // Adicionar painel de jogadores
        const gameArea = document.getElementById('gameArea');
        if (gameArea && !document.getElementById('multiplayerPanel')) {
            const multiplayerPanel = document.createElement('div');
            multiplayerPanel.id = 'multiplayerPanel';
            multiplayerPanel.className = 'multiplayer-panel';
            multiplayerPanel.innerHTML = `
                <div class="multiplayer-header">
                    <h3>👥 Jogadores</h3>
                    <div class="room-code">Sala: ${this.roomData.roomCode}</div>
                </div>
                <div id="multiplayerPlayersList" class="multiplayer-players"></div>
                <div id="multiplayerTimer" class="multiplayer-timer hidden">
                    <div class="timer-label">Tempo restante:</div>
                    <div class="timer-value">2:00</div>
                </div>
                <div id="multiplayerStatus" class="multiplayer-status">
                    Aguardando início do jogo...
                </div>
            `;
            gameArea.appendChild(multiplayerPanel);
        }

        // Adicionar estilos CSS
        this.addMultiplayerStyles();
    }

    addMultiplayerStyles() {
        if (document.getElementById('multiplayerStyles')) return;

        const style = document.createElement('style');
        style.id = 'multiplayerStyles';
        style.textContent = `
            .multiplayer-panel {
                position: fixed;
                top: 80px;
                left: 20px;
                width: 280px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                padding: 1rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
                z-index: 1000;
                border: 2px solid rgba(255,255,255,0.3);
            }

            .multiplayer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #eee;
            }

            .multiplayer-header h3 {
                margin: 0;
                font-size: 1.1rem;
                color: #333;
            }

            .room-code {
                font-size: 0.8rem;
                color: #667eea;
                font-weight: bold;
            }

            .multiplayer-players {
                max-height: 200px;
                overflow-y: auto;
                margin-bottom: 1rem;
            }

            .multiplayer-player {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem;
                margin-bottom: 0.25rem;
                background: #f8f9fa;
                border-radius: 8px;
                font-size: 0.9rem;
            }

            .multiplayer-player.current-player {
                background: #e3f2fd;
                border: 1px solid #2196f3;
            }

            .player-name {
                font-weight: 600;
                color: #333;
            }

            .player-score {
                color: #667eea;
                font-weight: bold;
            }

            .player-status {
                font-size: 0.8rem;
                color: #28a745;
            }

            .multiplayer-timer {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 0.75rem;
                text-align: center;
                margin-bottom: 1rem;
            }

            .timer-label {
                font-size: 0.8rem;
                color: #856404;
                margin-bottom: 0.25rem;
            }

            .timer-value {
                font-size: 1.2rem;
                font-weight: bold;
                color: #856404;
            }

            .timer-value.warning {
                color: #dc3545;
                animation: pulse 1s infinite;
            }

            .multiplayer-status {
                text-align: center;
                font-size: 0.9rem;
                color: #666;
                padding: 0.5rem;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .multiplayer-message {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                font-weight: 600;
                z-index: 1001;
                max-width: 300px;
                animation: slideIn 0.3s ease;
            }

            .multiplayer-message.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .multiplayer-message.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .multiplayer-message.info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }

            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @media (max-width: 768px) {
                .multiplayer-panel {
                    position: relative;
                    top: auto;
                    left: auto;
                    width: 100%;
                    margin-bottom: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    updateGameTitle() {
        const titleElement = document.querySelector('h1');
        if (titleElement && this.roomData) {
            titleElement.textContent = `🌍 GeoGuessr Multiplayer - Sala ${this.roomData.roomCode}`;
        }
    }

    handleRoundStart(data) {
        console.log('🎮 Recebido round-started:', data);
        this.currentRound = data.round;

        // Se é o primeiro round, iniciar o jogo
        if (data.round === 1) {
            console.log('🎮 Primeiro round recebido, iniciando jogo...');

            // Inicializar o jogo se ainda não foi iniciado
            if (window.gameState && !window.gameState.gameStarted) {
                window.startGame();
            }

            // Aguardar um pouco para o jogo inicializar
            setTimeout(() => {
                this.processRoundStart(data);
            }, 1000);
        } else {
            this.processRoundStart(data);
        }
    }

    processRoundStart(data) {
        // Atualizar localização no gameState global
        if (window.gameState) {
            window.gameState.currentLocation = data.location;
            window.gameState.currentRound = data.round;
        }

        // Iniciar timer
        this.startRoundTimer(data.timeLimit);

        // Atualizar status
        this.updateMultiplayerStatus(`Round ${data.round}/5 - Faça seu palpite!`);

        // Carregar Street View para a localização
        if (window.loadStreetView) {
            console.log('🗺️ Carregando Street View para localização:', data.location);
            window.loadStreetView();
        }

        // Mostrar tela do jogo
        if (window.showScreen) {
            window.showScreen('game');
        }

        this.showMultiplayerMessage(`Round ${data.round} iniciado!`, 'info');
    }

    handleRoundEnd(data) {
        // Parar timer
        this.stopRoundTimer();

        // Salvar resultados
        this.roundResults.push(data);

        // Atualizar pontuações dos jogadores
        this.updatePlayersScores(data.results);

        // Mostrar resultados
        this.showRoundResults(data);

        if (data.isLastRound) {
            this.updateMultiplayerStatus('Jogo finalizado! Aguarde os resultados finais...');
        } else {
            this.updateMultiplayerStatus(`Próximo round em 5 segundos...`);
        }
    }

    handleGameEnd(data) {
        this.gameEnded = true;

        // Mostrar resultados finais
        this.showFinalResults(data);

        // Limpar dados da sala
        setTimeout(() => {
            localStorage.removeItem('multiplayerRoom');
        }, 10000);
    }

    startRoundTimer(timeLimit) {
        const timerElement = document.getElementById('multiplayerTimer');
        const timerValue = timerElement?.querySelector('.timer-value');

        if (!timerElement || !timerValue) return;

        timerElement.classList.remove('hidden');

        let timeLeft = Math.floor(timeLimit / 1000);

        this.roundTimer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;

            timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 30) {
                timerValue.classList.add('warning');
            }

            if (timeLeft <= 0) {
                this.stopRoundTimer();
                this.autoSubmitGuess();
            }

            timeLeft--;
        }, 1000);
    }

    stopRoundTimer() {
        if (this.roundTimer) {
            clearInterval(this.roundTimer);
            this.roundTimer = null;
        }

        const timerElement = document.getElementById('multiplayerTimer');
        if (timerElement) {
            timerElement.classList.add('hidden');
        }
    }

    autoSubmitGuess() {
        // Se o jogador não enviou palpite, enviar palpite vazio
        if (window.gameState && !window.gameState.playerGuess) {
            this.showMultiplayerMessage('Tempo esgotado! Palpite não enviado.', 'error');
        }
    }

    submitMultiplayerGuess(guess) {
        if (!this.socket || !guess) return;

        this.socket.emit('submit-guess', guess);
        this.showMultiplayerMessage('Palpite enviado!', 'success');
        this.updateMultiplayerStatus('Aguardando outros jogadores...');
    }

    updateSubmissionStatus(data) {
        this.updateMultiplayerStatus(
            `${data.submittedCount}/${data.totalPlayers} jogadores enviaram palpites`
        );
    }

    updatePlayersScores(results) {
        this.players = results.map(result => ({
            name: result.playerName,
            score: result.totalScore,
            lastRoundScore: result.score
        }));

        this.updatePlayersDisplay();
    }

    updatePlayersDisplay() {
        const container = document.getElementById('multiplayerPlayersList');
        if (!container) return;

        // Ordenar por pontuação
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);

        container.innerHTML = sortedPlayers.map(player => {
            const isCurrentPlayer = player.name === this.roomData?.playerName;
            return `
                <div class="multiplayer-player ${isCurrentPlayer ? 'current-player' : ''}">
                    <div class="player-name">${player.name}</div>
                    <div class="player-score">${player.score.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    }

    updateMultiplayerStatus(message) {
        const statusElement = document.getElementById('multiplayerStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    showMultiplayerMessage(message, type = 'info') {
        // Remover mensagem anterior
        const existingMessage = document.querySelector('.multiplayer-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Criar nova mensagem
        const messageElement = document.createElement('div');
        messageElement.className = `multiplayer-message ${type}`;
        messageElement.textContent = message;

        document.body.appendChild(messageElement);

        // Remover após 4 segundos
        setTimeout(() => {
            messageElement.remove();
        }, 4000);
    }

    showRoundResults(data) {
        // Integrar com o sistema de resultados existente
        if (window.showResult) {
            const playerResult = data.results.find(r => r.playerName === this.roomData?.playerName);
            if (playerResult) {
                window.showResult(playerResult.distance, playerResult.score);
            }
        }
    }

    showFinalResults(data) {
        // Mostrar ranking final
        const ranking = data.finalRanking;
        const currentPlayer = ranking.find(p => p.name === this.roomData?.playerName);

        if (currentPlayer) {
            this.showMultiplayerMessage(
                `Jogo finalizado! Você ficou em ${currentPlayer.position}º lugar!`,
                currentPlayer.position <= 3 ? 'success' : 'info'
            );
        }

        // Integrar com tela final existente
        if (window.showFinalResult) {
            window.showFinalResult();
        }
    }

    // Método público para verificar se está em modo multiplayer
    isMultiplayerMode() {
        return this.isMultiplayer;
    }

    // Método público para obter dados da sala
    getRoomData() {
        return this.roomData;
    }

    // Método para limpar dados de multiplayer
    clearMultiplayerData() {
        console.log('🧹 Limpando dados de multiplayer...');
        localStorage.removeItem('multiplayerRoom');
        this.isMultiplayer = false;
        this.roomData = null;
        this.players = [];
        this.roundResults = [];
        this.gameEnded = false;

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        // Remover painel multiplayer se existir
        const panel = document.getElementById('multiplayerPanel');
        if (panel) {
            panel.remove();
        }
    }

    // Método para verificar se os dados da sala são válidos
    isValidRoomData() {
        return this.roomData &&
               this.roomData.roomCode &&
               this.roomData.playerName &&
               this.roomData.isMultiplayer;
    }
}

// Instância global do gerenciador multiplayer
window.multiplayerManager = new MultiplayerManager();
