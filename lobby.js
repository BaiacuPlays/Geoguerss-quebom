// Importar configuração
import { config, debug } from './config.js';

// Conexão Socket.io
const socket = io(config.getSocketUrl(), config.socketConfig);

debug.log('🔌 Conectando ao servidor:', config.getSocketUrl());
debug.log('🌍 Ambiente:', config.isProduction() ? 'Produção' : 'Desenvolvimento');

// Estado do lobby
let lobbyState = {
    playerName: '',
    roomCode: '',
    isInRoom: false,
    players: [],
    isHost: false
};

// Elementos DOM
const elements = {
    // Telas
    nameScreen: document.getElementById('nameScreen'),
    joinScreen: document.getElementById('joinScreen'),
    roomScreen: document.getElementById('roomScreen'),

    // Inputs
    playerName: document.getElementById('playerName'),
    roomCode: document.getElementById('roomCode'),

    // Botões
    createRoomBtn: document.getElementById('createRoomBtn'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    joinRoomConfirmBtn: document.getElementById('joinRoomConfirmBtn'),
    backToNameBtn: document.getElementById('backToNameBtn'),
    startGameBtn: document.getElementById('startGameBtn'),
    leaveRoomBtn: document.getElementById('leaveRoomBtn'),

    // Displays
    displayRoomCode: document.getElementById('displayRoomCode'),
    playersList: document.getElementById('playersList'),
    connectionStatus: document.getElementById('connectionStatus'),
    errorMessage: document.getElementById('errorMessage'),
    successMessage: document.getElementById('successMessage')
};

// Event Listeners
elements.createRoomBtn.addEventListener('click', createRoom);
elements.joinRoomBtn.addEventListener('click', showJoinScreen);
elements.joinRoomConfirmBtn.addEventListener('click', joinRoom);
elements.backToNameBtn.addEventListener('click', showNameScreen);
elements.startGameBtn.addEventListener('click', startGame);
elements.leaveRoomBtn.addEventListener('click', leaveRoom);

// Enter key handlers
elements.playerName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (elements.playerName.value.trim()) {
            createRoom();
        }
    }
});

elements.roomCode.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinRoom();
    }
});

// Auto-uppercase room code
elements.roomCode.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Socket Events
socket.on('connect', () => {
    debug.log('🔌 Conectado ao servidor');
    updateConnectionStatus(true);
    clearMessages();
});

socket.on('disconnect', (reason) => {
    debug.log('🔌 Desconectado do servidor:', reason);
    updateConnectionStatus(false);

    // Mostrar mensagem apenas se não foi desconexão intencional
    if (reason !== 'io client disconnect') {
        showError('Conexão perdida com o servidor! Tentando reconectar...');
    }
});

socket.on('connect_error', (error) => {
    debug.error('❌ Erro de conexão:', error);
    updateConnectionStatus(false);
    showError('Erro ao conectar com o servidor. Verifique sua conexão.');
});

socket.on('reconnect', (attemptNumber) => {
    debug.log('🔄 Reconectado após', attemptNumber, 'tentativas');
    updateConnectionStatus(true);
    showSuccess('Reconectado ao servidor!');
});

socket.on('reconnect_error', (error) => {
    debug.error('❌ Erro de reconexão:', error);
});

socket.on('reconnect_failed', () => {
    debug.error('❌ Falha na reconexão');
    showError('Não foi possível reconectar ao servidor.');
});

socket.on('room-created', (data) => {
    console.log('🏠 Sala criada:', data);
    lobbyState.roomCode = data.roomCode;
    lobbyState.isInRoom = true;
    lobbyState.isHost = true;
    lobbyState.players = data.roomInfo.players;

    showRoomScreen();
    showSuccess(`Sala ${data.roomCode} criada com sucesso!`);
});

socket.on('room-joined', (data) => {
    console.log('👥 Entrou na sala:', data);
    lobbyState.roomCode = data.roomCode;
    lobbyState.isInRoom = true;
    lobbyState.isHost = false;
    lobbyState.players = data.roomInfo.players;

    showRoomScreen();
    showSuccess(`Entrou na sala ${data.roomCode}!`);
});

socket.on('player-joined', (data) => {
    console.log('👤 Novo jogador:', data.player);
    lobbyState.players = data.roomInfo.players;
    updatePlayersList();
    showSuccess(`${data.player.name} entrou na sala!`);
});

socket.on('player-left', (data) => {
    console.log('👋 Jogador saiu:', data.playerName);
    lobbyState.players = data.roomInfo.players;
    updatePlayersList();
    showError(`${data.playerName} saiu da sala.`);
});

socket.on('game-started', (data) => {
    console.log('🎮 Jogo iniciado!', data);
    showSuccess('Jogo iniciado! Redirecionando...');

    // Salvar dados completos da sala no localStorage
    localStorage.setItem('multiplayerRoom', JSON.stringify({
        roomCode: lobbyState.roomCode,
        playerName: lobbyState.playerName,
        isMultiplayer: true,
        gameStarted: true,
        timestamp: Date.now()
    }));

    // Desconectar socket do lobby antes de redirecionar
    socket.disconnect();

    // Redirecionar para o jogo
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
});

socket.on('error', (data) => {
    console.error('❌ Erro:', data.message);
    showError(data.message);
});

// Funções de UI
function showScreen(screenName) {
    elements.nameScreen.classList.add('hidden');
    elements.joinScreen.classList.add('hidden');
    elements.roomScreen.classList.add('hidden');

    elements[screenName].classList.remove('hidden');
}

function showNameScreen() {
    showScreen('nameScreen');
    clearMessages();
}

function showJoinScreen() {
    if (!validatePlayerName()) return;

    showScreen('joinScreen');
    elements.roomCode.focus();
    clearMessages();
}

function showRoomScreen() {
    showScreen('roomScreen');
    elements.displayRoomCode.textContent = lobbyState.roomCode;
    updatePlayersList();
    updateStartButton();
    clearMessages();
}

function validatePlayerName() {
    const name = elements.playerName.value.trim();
    if (!name) {
        showError('Por favor, digite seu nome!');
        elements.playerName.focus();
        return false;
    }
    if (name.length < 2) {
        showError('Nome deve ter pelo menos 2 caracteres!');
        elements.playerName.focus();
        return false;
    }
    lobbyState.playerName = name;
    return true;
}

function validateRoomCode() {
    const code = elements.roomCode.value.trim().toUpperCase();
    if (!code) {
        showError('Por favor, digite o código da sala!');
        elements.roomCode.focus();
        return false;
    }
    if (code.length !== 6) {
        showError('Código da sala deve ter 6 caracteres!');
        elements.roomCode.focus();
        return false;
    }
    return code;
}

function createRoom() {
    if (!validatePlayerName()) return;

    console.log('🏠 Criando sala para:', lobbyState.playerName);
    socket.emit('create-room', lobbyState.playerName);

    elements.createRoomBtn.disabled = true;
    elements.createRoomBtn.textContent = '🔄 Criando...';

    setTimeout(() => {
        elements.createRoomBtn.disabled = false;
        elements.createRoomBtn.textContent = '🏠 Criar Nova Sala';
    }, 3000);
}

function joinRoom() {
    if (!validatePlayerName()) return;

    const roomCode = validateRoomCode();
    if (!roomCode) return;

    console.log('🚪 Entrando na sala:', roomCode);
    socket.emit('join-room', {
        roomCode: roomCode,
        playerName: lobbyState.playerName
    });

    elements.joinRoomConfirmBtn.disabled = true;
    elements.joinRoomConfirmBtn.textContent = '🔄 Entrando...';

    setTimeout(() => {
        elements.joinRoomConfirmBtn.disabled = false;
        elements.joinRoomConfirmBtn.textContent = '🎮 Entrar';
    }, 3000);
}

function startGame() {
    if (!lobbyState.isHost) {
        showError('Apenas o criador da sala pode iniciar o jogo!');
        return;
    }

    if (lobbyState.players.length < 1) {
        showError('É necessário pelo menos 1 jogador para iniciar!');
        return;
    }

    console.log('🎮 Iniciando jogo...');
    socket.emit('start-game');

    elements.startGameBtn.disabled = true;
    elements.startGameBtn.textContent = '🔄 Iniciando...';
}

function leaveRoom() {
    lobbyState.isInRoom = false;
    lobbyState.roomCode = '';
    lobbyState.players = [];
    lobbyState.isHost = false;

    showNameScreen();
    showSuccess('Você saiu da sala.');
}

function updatePlayersList() {
    const container = elements.playersList;
    container.innerHTML = '';

    lobbyState.players.forEach((player, index) => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';

        const isCurrentPlayer = player.name === lobbyState.playerName;
        const isHost = index === 0; // Primeiro jogador é o host

        playerElement.innerHTML = `
            <div class="player-name">
                ${isHost ? '👑 ' : ''}${player.name}${isCurrentPlayer ? ' (Você)' : ''}
            </div>
            <div class="player-status">
                ✅ Conectado
            </div>
        `;

        if (isCurrentPlayer) {
            playerElement.style.background = '#e3f2fd';
            playerElement.style.borderColor = '#2196f3';
        }

        container.appendChild(playerElement);
    });

    updateStartButton();
}

function updateStartButton() {
    const canStart = lobbyState.isHost && lobbyState.players.length >= 1;
    elements.startGameBtn.disabled = !canStart;

    if (!lobbyState.isHost) {
        elements.startGameBtn.textContent = '⏳ Aguardando host iniciar...';
    } else if (lobbyState.players.length < 1) {
        elements.startGameBtn.textContent = '⏳ Aguardando jogadores...';
    } else {
        elements.startGameBtn.textContent = '🎮 Iniciar Jogo';
    }
}

function updateConnectionStatus(connected) {
    const status = elements.connectionStatus;
    if (connected) {
        status.textContent = '🟢 Conectado';
        status.className = 'connection-status status-connected';
    } else {
        status.textContent = '🔴 Desconectado';
        status.className = 'connection-status status-disconnected';
    }
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    elements.successMessage.classList.add('hidden');

    setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
    }, 5000);
}

function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successMessage.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');

    setTimeout(() => {
        elements.successMessage.classList.add('hidden');
    }, 3000);
}

function clearMessages() {
    elements.errorMessage.classList.add('hidden');
    elements.successMessage.classList.add('hidden');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    elements.playerName.focus();
    updateConnectionStatus(false);

    // Verificar se há dados de sessão
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        elements.playerName.value = savedName;
    }
});

// Salvar nome do jogador
elements.playerName.addEventListener('input', () => {
    localStorage.setItem('playerName', elements.playerName.value);
});
