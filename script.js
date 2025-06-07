// Configuração da API
function getApiKey() {
    const savedApiKey = localStorage.getItem('google_maps_api_key');
    // Usar a chave do .env.example como padrão (sua chave que está funcionando)
    return savedApiKey || 'AIzaSyCkbttMXoWm2qshh71vYni_nN2K_9C-N7o';
}

// Estado do jogo
let gameState = {
    currentRound: 1,
    totalRounds: 5,
    totalScore: 0,
    currentLocation: null,
    playerGuess: null,
    useRealStreetView: false,
    googleMapsLoaded: false,
    panorama: null,
    googleMap: null,
    // Novos controles
    checkpoint: null,
    initialPosition: null,
    isUIHidden: false,
    // Cache de locais válidos encontrados
    validLocations: [],
    // Regiões com alta probabilidade de Street View
    streetViewRegions: [
        // América do Norte
        { name: 'Estados Unidos', bounds: { north: 49, south: 25, east: -66, west: -125 } },
        { name: 'Canadá', bounds: { north: 60, south: 49, east: -52, west: -141 } },
        { name: 'México', bounds: { north: 32, south: 14, east: -86, west: -117 } },

        // Europa
        { name: 'Reino Unido', bounds: { north: 61, south: 49, east: 2, west: -8 } },
        { name: 'França', bounds: { north: 51, south: 42, east: 8, west: -5 } },
        { name: 'Alemanha', bounds: { north: 55, south: 47, east: 15, west: 5 } },
        { name: 'Itália', bounds: { north: 47, south: 36, east: 19, west: 6 } },
        { name: 'Espanha', bounds: { north: 44, south: 36, east: 4, west: -10 } },
        { name: 'Países Baixos', bounds: { north: 54, south: 50, east: 7, west: 3 } },
        { name: 'Suécia', bounds: { north: 69, south: 55, east: 24, west: 11 } },
        { name: 'Noruega', bounds: { north: 71, south: 58, east: 31, west: 4 } },

        // Ásia-Pacífico
        { name: 'Japão', bounds: { north: 46, south: 24, east: 146, west: 129 } },
        { name: 'Coreia do Sul', bounds: { north: 39, south: 33, east: 130, west: 124 } },
        { name: 'Austrália', bounds: { north: -10, south: -44, east: 154, west: 113 } },
        { name: 'Nova Zelândia', bounds: { north: -34, south: -47, east: 179, west: 166 } },
        { name: 'Singapura', bounds: { north: 1.5, south: 1.2, east: 104.1, west: 103.6 } },

        // América do Sul
        { name: 'Brasil', bounds: { north: 5, south: -34, east: -34, west: -74 } },
        { name: 'Argentina', bounds: { north: -22, south: -55, east: -53, west: -73 } },
        { name: 'Chile', bounds: { north: -17, south: -56, east: -66, west: -76 } },

        // África
        { name: 'África do Sul', bounds: { north: -22, south: -35, east: 33, west: 16 } },

        // Outros
        { name: 'Israel', bounds: { north: 33.4, south: 29.5, east: 35.9, west: 34.3 } },
        { name: 'Emirados Árabes', bounds: { north: 26.1, south: 22.6, east: 56.4, west: 51.0 } }
    ]
};

// Elementos DOM
const screens = {
    start: document.getElementById('startScreen'),
    game: document.getElementById('gameScreen'),
    result: document.getElementById('resultScreen'),
    final: document.getElementById('finalScreen')
};

const elements = {
    startBtn: document.getElementById('startBtn'),
    currentRound: document.getElementById('currentRound'),
    totalScore: document.getElementById('totalScore'),
    loading: document.getElementById('loading'),
    loadingTitle: document.getElementById('loadingTitle'),
    loadingText: document.getElementById('loadingText'),
    gameArea: document.getElementById('gameArea'),
    streetView: document.getElementById('streetView'),
    map: document.getElementById('map'),
    guessMapContainer: document.getElementById('guessMapContainer'),

    // Novos controles
    compass: document.getElementById('compass'),
    compassNeedle: document.getElementById('compassNeedle'),
    checkpointBtn: document.getElementById('checkpointBtn'),
    resetPositionBtn: document.getElementById('resetPositionBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    hideUIBtn: document.getElementById('hideUIBtn'),
    streetviewControls: document.getElementById('streetviewControls'),
    personBtn: document.getElementById('personBtn'),

    submitBtn: document.getElementById('submitBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pinMapBtn: document.getElementById('pinMapBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    // Status API
    apiStatus: document.getElementById('apiStatus'),
    currentMode: document.getElementById('currentMode')
};

// Event Listeners
elements.startBtn.addEventListener('click', startGame);
elements.submitBtn.addEventListener('click', submitGuess);
elements.nextBtn.addEventListener('click', nextRound);
elements.playAgainBtn.addEventListener('click', resetGame);
elements.map.addEventListener('click', handleMapClick);

// Novo event listener para multiplayer
const multiplayerBtn = document.getElementById('multiplayerBtn');
if (multiplayerBtn) {
    multiplayerBtn.addEventListener('click', () => {
        window.location.href = 'lobby.html';
    });
}

// Novos event listeners
elements.checkpointBtn.addEventListener('click', handleCheckpoint);
elements.resetPositionBtn.addEventListener('click', resetToInitialPosition);
elements.zoomInBtn.addEventListener('click', handleZoomIn);
elements.zoomOutBtn.addEventListener('click', handleZoomOut);
elements.hideUIBtn.addEventListener('click', toggleUI);
elements.personBtn.addEventListener('click', () => {
    console.log('👤 Botão de pessoa clicado - funcionalidade futura');
});
elements.pinMapBtn.addEventListener('click', toggleMapPin);



function checkApiConfiguration() {
    // Verificar se o Google Maps está carregado e funcionando
    const googleMapsWorking = gameState.googleMapsLoaded && window.google && window.google.maps;

    if (googleMapsWorking) {
        gameState.useRealStreetView = true;
        elements.currentMode.textContent = '🌍 Street View Real Ativado!';
        elements.apiStatus.style.color = '#4CAF50';
        elements.apiStatus.style.fontWeight = 'bold';
    } else {
        gameState.useRealStreetView = false;
        elements.currentMode.textContent = '🎨 Street View Simulado';
        elements.apiStatus.style.color = '#666';
        elements.apiStatus.style.fontWeight = 'normal';
    }
}

// Verificar se o Google Maps está carregado
function waitForGoogleMaps() {
    return new Promise((resolve) => {
        if (window.google && window.google.maps) {
            gameState.googleMapsLoaded = true;
            resolve(true);
        } else {
            // Aguardar até 10 segundos
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.google && window.google.maps) {
                    gameState.googleMapsLoaded = true;
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts > 50) { // 10 segundos
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 200);
        }
    });
}

// Funções principais
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

function startGame() {
    // Verificar se está em modo multiplayer
    if (window.multiplayerManager && window.multiplayerManager.isMultiplayerMode()) {
        // Em modo multiplayer, aguardar o servidor iniciar o jogo
        showScreen('game');
        elements.loading.classList.remove('hidden');
        elements.gameArea.classList.add('hidden');

        if (elements.loadingTitle) {
            elements.loadingTitle.textContent = 'Aguardando início do jogo...';
        }
        if (elements.loadingText) {
            elements.loadingText.textContent = 'O jogo será iniciado automaticamente pelo servidor';
        }

        return;
    }

    // Modo single player
    showScreen('game');
    elements.loading.classList.remove('hidden');
    elements.gameArea.classList.add('hidden');

    // Simular loading
    setTimeout(() => {
        loadRound();
    }, 2000);
}

async function loadRound() {
    // Resetar palpite
    gameState.playerGuess = null;

    // Atualizar UI
    elements.currentRound.textContent = gameState.currentRound;
    elements.totalScore.textContent = gameState.totalScore.toLocaleString();

    // Buscar local aleatório com Street View
    await findRandomStreetViewLocation();

    // Carregar Street View
    loadStreetView();

    // Carregar mapa
    loadMap();

    // Mostrar área do jogo
    elements.loading.classList.add('hidden');
    elements.gameArea.classList.remove('hidden');

    // Reset controles
    resetMapControls();
    resetStreetViewControls();
}

// Função para encontrar local aleatório com Street View
async function findRandomStreetViewLocation() {
    console.log('🔍 Procurando local aleatório com Street View...');

    // Atualizar texto de loading
    if (elements.loadingText) {
        elements.loadingText.textContent = 'Procurando local aleatório com Street View real...';
    }

    // Se temos locais válidos no cache, usar um deles
    if (gameState.validLocations.length > 0) {
        const randomIndex = Math.floor(Math.random() * gameState.validLocations.length);
        gameState.currentLocation = gameState.validLocations[randomIndex];
        console.log('✅ Usando local do cache:', gameState.currentLocation.name);

        if (elements.loadingText) {
            elements.loadingText.textContent = `Carregando ${gameState.currentLocation.name}...`;
        }
        return;
    }

    // Tentar encontrar novo local
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
        attempts++;
        console.log(`🎲 Tentativa ${attempts}/${maxAttempts}`);

        if (elements.loadingText) {
            elements.loadingText.textContent = `Procurando local válido... (${attempts}/${maxAttempts})`;
        }

        // Escolher região aleatória
        const region = gameState.streetViewRegions[Math.floor(Math.random() * gameState.streetViewRegions.length)];

        // Gerar coordenadas aleatórias dentro da região
        const lat = region.bounds.south + Math.random() * (region.bounds.north - region.bounds.south);
        const lng = region.bounds.west + Math.random() * (region.bounds.east - region.bounds.west);

        // Verificar se tem Street View
        const location = await checkStreetViewAvailability(lat, lng, region.name);
        if (location) {
            gameState.currentLocation = location;
            // Adicionar ao cache
            gameState.validLocations.push(location);
            console.log('✅ Local encontrado:', location.name);

            if (elements.loadingText) {
                elements.loadingText.textContent = `Local encontrado: ${location.name}`;
            }
            return;
        }
    }

    // Se não encontrou, usar local padrão
    console.log('⚠️ Usando local padrão');
    gameState.currentLocation = {
        lat: 40.7589,
        lng: -73.9851,
        name: 'Times Square, Nova York'
    };

    if (elements.loadingText) {
        elements.loadingText.textContent = 'Carregando local padrão...';
    }
}

// Função para verificar disponibilidade do Street View
function checkStreetViewAvailability(lat, lng, regionName) {
    return new Promise((resolve) => {
        if (!gameState.googleMapsLoaded || !window.google) {
            resolve(null);
            return;
        }

        const streetViewService = new google.maps.StreetViewService();

        streetViewService.getPanorama({
            location: { lat, lng },
            radius: 50000, // 50km de raio
            source: google.maps.StreetViewSource.OUTDOOR
        }, (data, status) => {
            if (status === 'OK' && data && data.location) {
                // Verificar se é um panorama com movimento (não estático)
                const panoId = data.location.pano;
                if (panoId) {
                    const location = {
                        lat: data.location.latLng.lat(),
                        lng: data.location.latLng.lng(),
                        name: `${regionName} - Local Aleatório`,
                        panoId: panoId
                    };
                    resolve(location);
                } else {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
}

async function loadStreetView() {
    const location = gameState.currentLocation;
    console.log('Carregando Street View para:', location);

    if (!location) {
        console.error('Localização não encontrada!');
        return;
    }

    // Verificar se deve usar Street View real
    if (gameState.useRealStreetView) {
        await loadRealStreetView(location);
    } else {
        loadSimulatedStreetView(location);
    }
}

async function loadRealStreetView(location) {
    try {
        // Aguardar Google Maps carregar
        const mapsLoaded = await waitForGoogleMaps();

        if (!mapsLoaded) {
            console.log('Google Maps não carregou, usando Street View simulado');
            loadSimulatedStreetView(location);
            return;
        }

        // Limpar container
        elements.streetView.innerHTML = '<div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center;"><div style="text-align: center;"><div style="font-size: 2rem; margin-bottom: 1rem;">🌍</div><div>Carregando Street View Real...</div></div></div>';

        // Se já temos um panoId, usar diretamente
        if (location.panoId) {
            createGoogleStreetView({ lat: location.lat, lng: location.lng }, location.panoId);
            return;
        }

        // Caso contrário, buscar Street View na localização
        const streetViewService = new google.maps.StreetViewService();

        streetViewService.getPanorama({
            location: { lat: location.lat, lng: location.lng },
            radius: 50000, // 50km de raio para buscar
            source: google.maps.StreetViewSource.OUTDOOR
        }, (data, status) => {
            if (status === 'OK') {
                // Street View encontrado, criar panorama
                createGoogleStreetView(data.location.latLng, data.location.pano);
            } else {
                console.log('Street View não disponível para esta localização, usando simulação');
                loadSimulatedStreetView(location);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar Google Street View:', error);
        loadSimulatedStreetView(location);
    }
}

function createGoogleStreetView(position, panoId = null) {
    // Limpar container
    elements.streetView.innerHTML = '';

    const streetViewOptions = {
        position: position,
        pov: {
            heading: Math.random() * 360, // Direção aleatória
            pitch: Math.random() * 20 - 10 // Pitch ligeiramente aleatório (-10 a +10)
        },
        zoom: 1,
        // Controles para navegação completa
        addressControl: false,
        linksControl: true, // Permitir movimento entre panoramas
        panControl: false, // Desabilitar controle de pan nativo
        zoomControl: false, // Desabilitar controle de zoom nativo
        enableCloseButton: false,
        showRoadLabels: false,
        clickToGo: true, // Permitir clique para mover
        scrollwheel: true, // Permitir zoom com scroll
        disableDoubleClickZoom: false,
        // Remover controles desnecessários
        motionTracking: false,
        motionTrackingControl: false,
        fullscreenControl: false,
        imageDateControl: false,
        // Desabilitar todos os controles nativos da UI
        disableDefaultUI: true
    };

    // Se temos um panoId específico, usar ele
    if (panoId) {
        streetViewOptions.pano = panoId;
        delete streetViewOptions.position;
    }

    // Criar panorama do Google Street View
    gameState.panorama = new google.maps.StreetViewPanorama(
        elements.streetView,
        streetViewOptions
    );

    // Salvar posição inicial após o panorama carregar
    gameState.panorama.addListener('position_changed', () => {
        const newPosition = gameState.panorama.getPosition();
        if (newPosition) {
            // Salvar como posição inicial se ainda não foi salva
            if (!gameState.initialPosition) {
                gameState.initialPosition = newPosition;
                console.log('🏠 Posição inicial salva');
            }

            console.log('📍 Posição do Street View atualizada:', {
                lat: newPosition.lat(),
                lng: newPosition.lng()
            });
        }
    });

    // Listener para atualizar bússola quando a direção mudar
    gameState.panorama.addListener('pov_changed', () => {
        updateCompass();
    });

    // Inicializar bússola após carregar
    gameState.panorama.addListener('position_changed', () => {
        // Aguardar um pouco para garantir que o POV está disponível
        setTimeout(() => {
            updateCompass();
        }, 100);
    });

    // Resetar controles para nova localização
    gameState.checkpoint = null;
    gameState.initialPosition = null;
    if (elements.checkpointBtn) {
        elements.checkpointBtn.classList.remove('active');
        elements.checkpointBtn.title = 'Criar checkpoint';
    }

    console.log('✅ Google Street View REAL carregado com navegação completa!');
}

function loadSimulatedStreetView(location) {
    const scenery = getSceneryForLocation(location);
    const regionEmoji = getRegionEmoji(location);
    const regionHint = getRegionHint(location);

    // Criar o HTML do Street View simulado
    const streetViewHTML = `
        <div class="streetview-scene" style="
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #98FB98 100%);
        ">
            <!-- Céu -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 40%;
                background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 100%);
            "></div>

            <!-- Terreno -->
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 60%;
                background: ${scenery.ground};
            "></div>

            <!-- Prédios -->
            ${scenery.buildings}

            <!-- Estrada -->
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 20%;
                background: linear-gradient(to bottom, #666 0%, #333 100%);
            "></div>

            <!-- Linhas da estrada -->
            <div style="
                position: absolute;
                bottom: 10%;
                left: 50%;
                transform: translateX(-50%);
                width: 60%;
                height: 3px;
                background: #FFD700;
                border-radius: 2px;
            "></div>

            <!-- Emoji da região (fundo) -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 10rem;
                opacity: 0.08;
                user-select: none;
                pointer-events: none;
            ">${regionEmoji}</div>

            <!-- Painel de informações -->
            <div style="
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 15px 20px;
                border-radius: 12px;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                backdrop-filter: blur(10px);
            ">
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 8px;">
                    📍 Localização Misteriosa
                </div>
                <div style="font-size: 1rem; opacity: 0.9; margin-bottom: 5px;">
                    Procure pistas ${regionHint}
                </div>
                <div style="font-size: 0.8rem; opacity: 0.7;">
                    Modo: Street View Simulado
                </div>
            </div>

            <!-- Controles simulados -->
            <div style="
                position: absolute;
                bottom: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
            ">
                <div style="
                    width: 45px;
                    height: 45px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.2rem;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.3);
                ">↻</div>
                <div style="
                    width: 45px;
                    height: 45px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.2rem;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.3);
                ">🔍</div>
            </div>
        </div>
    `;

    elements.streetView.innerHTML = streetViewHTML;
    console.log('🎨 Street View simulado carregado');
}

function getSceneryForLocation(location) {
    const { lat, lng } = location;

    // Europa - Arquitetura clássica
    if (lat > 23.5 && lng > -10 && lng < 40) {
        return {
            background: 'linear-gradient(to bottom, #87CEEB, #DEB887)',
            ground: 'linear-gradient(to bottom, #8FBC8F, #556B2F)',
            buildings: `
                <div style="position: absolute; bottom: 20%; left: 8%; width: 18%; height: 45%; background: linear-gradient(to bottom, #8B4513, #654321); border-radius: 8px 8px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; left: 30%; width: 22%; height: 55%; background: linear-gradient(to bottom, #A0522D, #8B4513); border-radius: 6px 6px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; right: 18%; width: 20%; height: 40%; background: linear-gradient(to bottom, #CD853F, #A0522D); border-radius: 10px 10px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; right: 5%; width: 12%; height: 35%; background: linear-gradient(to bottom, #D2691E, #A0522D); border-radius: 4px 4px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
            `
        };
    }

    // América do Norte - Arranha-céus modernos
    if (lat > 25 && lng > -125 && lng < -66) {
        return {
            background: 'linear-gradient(to bottom, #87CEEB, #F0E68C)',
            ground: 'linear-gradient(to bottom, #90EE90, #228B22)',
            buildings: `
                <div style="position: absolute; bottom: 20%; left: 12%; width: 14%; height: 65%; background: linear-gradient(to bottom, #708090, #2F4F4F); border-radius: 2px 2px 0 0; box-shadow: 3px 0 15px rgba(0,0,0,0.4);"></div>
                <div style="position: absolute; bottom: 20%; left: 32%; width: 28%; height: 75%; background: linear-gradient(to bottom, #2F4F4F, #1C1C1C); border-radius: 4px 4px 0 0; box-shadow: 3px 0 15px rgba(0,0,0,0.4);"></div>
                <div style="position: absolute; bottom: 20%; right: 12%; width: 22%; height: 50%; background: linear-gradient(to bottom, #696969, #2F4F4F); border-radius: 3px 3px 0 0; box-shadow: 3px 0 15px rgba(0,0,0,0.4);"></div>
                <div style="position: absolute; bottom: 20%; right: 38%; width: 16%; height: 60%; background: linear-gradient(to bottom, #778899, #2F4F4F); border-radius: 2px 2px 0 0; box-shadow: 3px 0 15px rgba(0,0,0,0.4);"></div>
            `
        };
    }

    // Ásia - Arquitetura oriental
    if (lng > 26 && lng < 180) {
        return {
            background: 'linear-gradient(to bottom, #FFB6C1, #FFA07A)',
            ground: 'linear-gradient(to bottom, #98FB98, #32CD32)',
            buildings: `
                <div style="position: absolute; bottom: 20%; left: 15%; width: 18%; height: 50%; background: linear-gradient(to bottom, #B22222, #8B0000); border-radius: 12px 12px 0 0; box-shadow: 2px 0 12px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; left: 38%; width: 24%; height: 60%; background: linear-gradient(to bottom, #DC143C, #B22222); border-radius: 15px 15px 0 0; box-shadow: 2px 0 12px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; right: 20%; width: 20%; height: 45%; background: linear-gradient(to bottom, #8B0000, #654321); border-radius: 10px 10px 0 0; box-shadow: 2px 0 12px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; right: 5%; width: 14%; height: 38%; background: linear-gradient(to bottom, #A0522D, #8B0000); border-radius: 8px 8px 0 0; box-shadow: 2px 0 12px rgba(0,0,0,0.3);"></div>
            `
        };
    }

    // América do Sul - Arquitetura tropical
    if (lat < 13 && lng > -82 && lng < -34) {
        return {
            background: 'linear-gradient(to bottom, #87CEEB, #FFE4B5)',
            ground: 'linear-gradient(to bottom, #98FB98, #228B22)',
            buildings: `
                <div style="position: absolute; bottom: 20%; left: 10%; width: 16%; height: 42%; background: linear-gradient(to bottom, #F4A460, #D2691E); border-radius: 6px 6px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; left: 30%; width: 20%; height: 48%; background: linear-gradient(to bottom, #FF6347, #CD5C5C); border-radius: 8px 8px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; right: 25%; width: 18%; height: 38%; background: linear-gradient(to bottom, #DDA0DD, #BA55D3); border-radius: 5px 5px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; bottom: 20%; right: 8%; width: 14%; height: 35%; background: linear-gradient(to bottom, #20B2AA, #008B8B); border-radius: 4px 4px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
            `
        };
    }

    // Default - Genérico
    return {
        background: 'linear-gradient(to bottom, #87CEEB, #98FB98)',
        ground: 'linear-gradient(to bottom, #90EE90, #228B22)',
        buildings: `
            <div style="position: absolute; bottom: 20%; left: 20%; width: 18%; height: 45%; background: linear-gradient(to bottom, #696969, #2F4F4F); border-radius: 6px 6px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
            <div style="position: absolute; bottom: 20%; right: 25%; width: 22%; height: 55%; background: linear-gradient(to bottom, #778899, #2F4F4F); border-radius: 8px 8px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
            <div style="position: absolute; bottom: 20%; right: 8%; width: 15%; height: 38%; background: linear-gradient(to bottom, #A9A9A9, #696969); border-radius: 4px 4px 0 0; box-shadow: 2px 0 10px rgba(0,0,0,0.3);"></div>
        `
    };
}

function getRegionEmoji(location) {
    if (!location) return '🌍';
    const { lat, lng } = location;
    if (lat > 23.5 && lng > -10 && lng < 40) return '🏰';
    if (lat > 25 && lng > -125 && lng < -66) return '🗽';
    if (lat < 13 && lng > -82 && lng < -34) return '🌴';
    if (lat > -35 && lng > 26 && lng < 51) return '🏛️';
    if (lng > 26 && lng < 180) return '🏯';
    if (lat < -10 && lng > 113) return '🦘';
    return '🌍';
}

function getRegionHint(location) {
    const { lat, lng } = location;
    if (lat > 23.5 && lng > -10 && lng < 40) return 'da Europa';
    if (lat > 25 && lng > -125 && lng < -66) return 'da América do Norte';
    if (lat < 13 && lng > -82 && lng < -34) return 'da América do Sul';
    if (lat > -35 && lng > 26 && lng < 51) return 'da África';
    if (lng > 26 && lng < 180) return 'da Ásia';
    if (lat < -10 && lng > 113) return 'da Oceania';
    return 'do mundo';
}

async function loadMap() {
    // Limpar marcadores existentes antes de carregar novo mapa
    resetMapControls();

    // Verificar se deve usar Google Maps real
    if (gameState.useRealStreetView && gameState.googleMapsLoaded) {
        await loadRealMap();
    } else {
        loadSimulatedMap();
    }
}

async function loadRealMap() {
    try {
        // Limpar container
        elements.map.innerHTML = '';

        // Criar mapa do Google
        gameState.googleMap = new google.maps.Map(elements.map, {
            zoom: 2,
            center: { lat: 20, lng: 0 },
            mapTypeId: 'roadmap',
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: false, // Desabilitar controles nativos
            scaleControl: false
        });

        // Adicionar listener de clique
        gameState.googleMap.addListener('click', (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();

            // Remover marcador anterior do Google Maps se existir
            if (gameState.mapMarker) {
                gameState.mapMarker.setMap(null);
            }

            // Remover marcadores do mapa simulado se existirem
            const existingMarkers = elements.map.querySelectorAll('.guess-marker');
            existingMarkers.forEach(marker => marker.remove());

            // Criar novo marcador no Google Maps
            gameState.mapMarker = new google.maps.Marker({
                position: { lat, lng },
                map: gameState.googleMap,
                title: 'Seu palpite - Clique em outro local para mover',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="14" fill="#ff4444" stroke="white" stroke-width="3"/>
                            <circle cx="16" cy="16" r="5" fill="white"/>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 16)
                },
                animation: google.maps.Animation.DROP
            });

            gameState.playerGuess = { lat, lng };

            // Habilitar botão de confirmar
            if (elements.submitBtn) {
                elements.submitBtn.disabled = false;
                console.log('✅ Botão de confirmar habilitado (Google Maps)');
            } else {
                console.error('❌ Elemento submitBtn não encontrado!');
            }
        });

        console.log('✅ Google Maps carregado com sucesso!');

    } catch (error) {
        console.error('Erro ao carregar Google Maps:', error);
        loadSimulatedMap();
    }
}

function loadSimulatedMap() {
    elements.map.innerHTML = `
        <div id="mapCanvas" style="
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, #4A90E2, #357ABD);
            position: relative;
            border-radius: 10px;
            overflow: hidden;
            cursor: crosshair;
        ">
            <!-- Oceanos -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #4A90E2;"></div>

            <!-- América do Norte -->
            <div style="position: absolute; top: 20%; left: 15%; width: 18%; height: 30%; background: #228B22; border-radius: 60% 40% 70% 30%; transform: rotate(-10deg); opacity: 0.9;" title="América do Norte"></div>

            <!-- América do Sul -->
            <div style="position: absolute; top: 55%; left: 22%; width: 12%; height: 35%; background: #32CD32; border-radius: 40% 60% 30% 70%; transform: rotate(15deg); opacity: 0.9;" title="América do Sul"></div>

            <!-- Europa -->
            <div style="position: absolute; top: 15%; left: 48%; width: 12%; height: 18%; background: #90EE90; border-radius: 50% 30% 60% 40%; opacity: 0.9;" title="Europa"></div>

            <!-- África -->
            <div style="position: absolute; top: 35%; left: 50%; width: 14%; height: 35%; background: #98FB98; border-radius: 30% 70% 40% 60%; opacity: 0.9;" title="África"></div>

            <!-- Ásia -->
            <div style="position: absolute; top: 10%; left: 65%; width: 25%; height: 40%; background: #ADFF2F; border-radius: 40% 60% 50% 50%; transform: rotate(5deg); opacity: 0.9;" title="Ásia"></div>

            <!-- Oceania -->
            <div style="position: absolute; top: 65%; left: 78%; width: 8%; height: 12%; background: #7CFC00; border-radius: 50%; opacity: 0.9;" title="Oceania"></div>

            <!-- Grid lines mais visíveis -->
            <div style="position: absolute; top: 0; left: 33%; width: 1px; height: 100%; background: rgba(255,255,255,0.4);"></div>
            <div style="position: absolute; top: 0; left: 66%; width: 1px; height: 100%; background: rgba(255,255,255,0.4);"></div>
            <div style="position: absolute; top: 33%; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.4);"></div>
            <div style="position: absolute; top: 66%; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.4);"></div>

            <!-- Linha do Equador -->
            <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: rgba(255,255,255,0.6);"></div>

            <!-- Meridiano de Greenwich -->
            <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 100%; background: rgba(255,255,255,0.6);"></div>

            <!-- Instruções -->
            <div id="mapInstructions" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                text-align: center;
                pointer-events: none;
                opacity: 0.8;
                background: rgba(0,0,0,0.3);
                padding: 1rem;
                border-radius: 10px;
                backdrop-filter: blur(5px);
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
                <div style="font-size: 1rem; font-weight: bold;">Clique no mapa</div>
                <div style="font-size: 0.8rem; opacity: 0.9;">para fazer seu palpite</div>
            </div>
        </div>
    `;
}

function handleMapClick(event) {
    // Se Ctrl estiver pressionado, não marcar palpite (apenas navegar)
    if (event.ctrlKey) {
        return;
    }

    // Verificar se estamos usando Google Maps real
    if (gameState.useRealStreetView && gameState.googleMap) {
        // Para Google Maps real, não fazer nada aqui - o listener do Google Maps cuida disso
        return;
    }

    const rect = elements.map.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Converter para coordenadas aproximadas
    const lng = ((x / rect.width) * 360) - 180;
    const lat = 90 - ((y / rect.height) * 180);

    // Remover marcador anterior se existir
    const existingMarker = elements.map.querySelector('.guess-marker');
    if (existingMarker) {
        existingMarker.remove();
    }

    // Atualizar palpite
    gameState.playerGuess = { lat, lng, x, y };

    // Criar novo marcador apenas para mapa simulado
    const marker = document.createElement('div');
    marker.className = 'guess-marker';
    marker.style.cssText = `
        position: absolute;
        left: ${x - 12}px;
        top: ${y - 12}px;
        width: 24px;
        height: 24px;
        background: #ff4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 15px rgba(0,0,0,0.4);
        z-index: 10;
        cursor: pointer;
        transition: transform 0.2s ease;
    `;

    // Animação de entrada
    marker.style.transform = 'scale(0)';
    elements.map.appendChild(marker);

    // Animar entrada
    setTimeout(() => {
        marker.style.transform = 'scale(1)';
    }, 10);

    // Efeito hover
    marker.addEventListener('mouseenter', () => {
        marker.style.transform = 'scale(1.2)';
    });

    marker.addEventListener('mouseleave', () => {
        marker.style.transform = 'scale(1)';
    });

    // Habilitar botão de confirmar
    if (elements.submitBtn) {
        elements.submitBtn.disabled = false;
        console.log('✅ Botão de confirmar habilitado (Mapa simulado)');
    } else {
        console.error('❌ Elemento submitBtn não encontrado!');
    }
}

function resetMapControls() {
    // Remover marcadores do mapa simulado
    const existingMarkers = elements.map.querySelectorAll('.guess-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Remover marcador do Google Maps se existir
    if (gameState.mapMarker) {
        gameState.mapMarker.setMap(null);
        gameState.mapMarker = null;
    }

    // Resetar palpite
    gameState.playerGuess = null;

    // Desabilitar botão de confirmar
    elements.submitBtn.disabled = true;
    console.log('🔄 Botão de confirmar desabilitado');
}

// Função para resetar controles do Street View
function resetStreetViewControls() {
    // Resetar checkpoint
    gameState.checkpoint = null;
    gameState.initialPosition = null;

    // Resetar UI dos controles
    if (elements.checkpointBtn) {
        elements.checkpointBtn.classList.remove('active');
        elements.checkpointBtn.title = 'Criar checkpoint';
    }

    // Resetar bússola
    if (elements.compassNeedle) {
        elements.compassNeedle.style.transform = 'rotate(0deg)';
    }

    if (elements.compass) {
        elements.compass.title = 'Bússola - Direção atual';
    }

    // Mostrar interface se estava oculta
    if (gameState.isUIHidden) {
        toggleUI();
    }

    console.log('🔄 Controles do Street View resetados');
}

// Função para alternar tamanho do mapa
// Função para lidar com checkpoint
function handleCheckpoint() {
    if (!gameState.panorama) return;

    if (gameState.checkpoint) {
        // Voltar ao checkpoint
        gameState.panorama.setPosition(gameState.checkpoint);
        console.log('📍 Voltando ao checkpoint');
        elements.checkpointBtn.title = 'Criar checkpoint';
        elements.checkpointBtn.classList.remove('active');
        gameState.checkpoint = null;
    } else {
        // Criar checkpoint
        const currentPos = gameState.panorama.getPosition();
        if (currentPos) {
            gameState.checkpoint = currentPos;
            console.log('📍 Checkpoint criado');
            elements.checkpointBtn.title = 'Voltar ao checkpoint';
            elements.checkpointBtn.classList.add('active');
        }
    }
}

// Função para voltar à posição inicial
function resetToInitialPosition() {
    if (!gameState.panorama || !gameState.initialPosition) return;

    gameState.panorama.setPosition(gameState.initialPosition);
    console.log('🏠 Voltando à posição inicial');
}

// Função para zoom in no Street View
function handleZoomIn() {
    if (gameState.useRealStreetView && gameState.panorama) {
        // Zoom no Street View
        const currentZoom = gameState.panorama.getZoom();
        gameState.panorama.setZoom(Math.min(currentZoom + 1, 5));
        console.log('🔍 Zoom In no Street View:', currentZoom + 1);
    } else {
        console.log('🔍 Zoom In - funciona apenas com Google Street View real');
    }
}

// Função para zoom out no Street View
function handleZoomOut() {
    if (gameState.useRealStreetView && gameState.panorama) {
        // Zoom no Street View
        const currentZoom = gameState.panorama.getZoom();
        gameState.panorama.setZoom(Math.max(currentZoom - 1, 0));
        console.log('🔍 Zoom Out no Street View:', currentZoom - 1);
    } else {
        console.log('🔍 Zoom Out - funciona apenas com Google Street View real');
    }
}

// Função para ocultar/mostrar interface
function toggleUI() {
    gameState.isUIHidden = !gameState.isUIHidden;

    const elementsToHide = [
        elements.guessMapContainer,
        document.querySelector('.header')
    ];

    // Ocultar/mostrar outros controles, mas manter o botão de toggle visível
    const otherControls = elements.streetviewControls.children;
    for (let i = 0; i < otherControls.length; i++) {
        const control = otherControls[i];
        if (control !== elements.hideUIBtn) {
            if (gameState.isUIHidden) {
                control.style.opacity = '0';
                control.style.pointerEvents = 'none';
            } else {
                control.style.opacity = '';
                control.style.pointerEvents = '';
            }
        }
    }

    elementsToHide.forEach(element => {
        if (element) {
            if (gameState.isUIHidden) {
                element.style.opacity = '0';
                element.style.pointerEvents = 'none';
            } else {
                element.style.opacity = '';
                element.style.pointerEvents = '';
            }
        }
    });

    // Atualizar botão
    elements.hideUIBtn.textContent = gameState.isUIHidden ? '👁️‍🗨️' : '👁️';
    elements.hideUIBtn.title = gameState.isUIHidden ? 'Mostrar interface' : 'Ocultar interface';
}

// Função para fixar/desfixar o mapa expandido
function toggleMapPin() {
    const isExpanded = elements.guessMapContainer.classList.contains('expanded');

    if (isExpanded) {
        // Desfixar - remover classe expanded
        elements.guessMapContainer.classList.remove('expanded');
        elements.pinMapBtn.classList.remove('pinned');
        elements.pinMapBtn.textContent = '📌';
        elements.pinMapBtn.title = 'Fixar mapa expandido';
        console.log('📌 Mapa desfixado');
    } else {
        // Fixar - adicionar classe expanded
        elements.guessMapContainer.classList.add('expanded');
        elements.pinMapBtn.classList.add('pinned');
        elements.pinMapBtn.textContent = '📍';
        elements.pinMapBtn.title = 'Desfixar mapa';
        console.log('📍 Mapa fixado expandido');
    }
}

// Função para atualizar a bússola
function updateCompass() {
    if (!gameState.panorama || !elements.compassNeedle) {
        return;
    }

    try {
        const pov = gameState.panorama.getPov();
        const position = gameState.panorama.getPosition();

        if (!pov || typeof pov.heading !== 'number' || !position) {
            return;
        }

        // Calcular o Norte magnético real baseado na posição geográfica
        const lat = position.lat();
        const lng = position.lng();

        // Calcular declinação magnética (simplificada)
        const magneticDeclination = calculateMagneticDeclination(lat, lng);

        // Normalizar heading do Street View (0-360°)
        let heading = ((pov.heading % 360) + 360) % 360;

        // Ajustar para declinação magnética
        const trueNorth = heading + magneticDeclination;

        // A agulha sempre aponta para o Norte verdadeiro
        // Rotacionar no sentido oposto ao heading para manter o Norte fixo
        const needleRotation = -trueNorth;

        // Aplicar rotação suave
        elements.compassNeedle.style.transform = `rotate(${needleRotation}deg)`;

        // Atualizar título
        const direction = getCardinalDirection(heading);
        elements.compass.title = `Bússola - Olhando ${direction} | Norte magnético`;

        console.log(`🧭 Bússola: pos(${lat.toFixed(2)}, ${lng.toFixed(2)}) heading=${heading.toFixed(1)}° declination=${magneticDeclination.toFixed(1)}° needle=${needleRotation.toFixed(1)}°`);

    } catch (error) {
        console.error('Erro na bússola:', error);
    }
}

// Função para calcular declinação magnética aproximada
function calculateMagneticDeclination(lat, lng) {
    // Fórmula simplificada baseada na posição geográfica
    // Esta é uma aproximação - uma implementação real usaria dados IGRF

    // Declinação varia geograficamente
    // Valores aproximados para diferentes regiões:

    // América do Norte
    if (lat > 25 && lat < 70 && lng > -170 && lng < -50) {
        return -15 + (lng + 100) * 0.1 + (lat - 45) * 0.2;
    }

    // Europa
    if (lat > 35 && lat < 70 && lng > -10 && lng < 40) {
        return 2 + (lng - 15) * 0.1 + (lat - 50) * 0.1;
    }

    // Ásia
    if (lat > 10 && lat < 70 && lng > 40 && lng < 180) {
        return -5 + (lng - 110) * 0.05 + (lat - 40) * 0.1;
    }

    // América do Sul
    if (lat > -60 && lat < 15 && lng > -85 && lng < -30) {
        return -20 + (lng + 60) * 0.1 + (lat + 20) * 0.2;
    }

    // África
    if (lat > -35 && lat < 40 && lng > -20 && lng < 55) {
        return -10 + (lng - 20) * 0.1 + (lat - 5) * 0.1;
    }

    // Oceania
    if (lat > -50 && lat < -10 && lng > 110 && lng < 180) {
        return 10 + (lng - 145) * 0.1 + (lat + 30) * 0.1;
    }

    // Padrão global (aproximação)
    return 0;
}

// Função para converter graus em direção cardinal
function getCardinalDirection(heading) {
    // Normalizar heading para 0-360
    const normalizedHeading = ((heading % 360) + 360) % 360;

    if (normalizedHeading >= 337.5 || normalizedHeading < 22.5) return 'Norte';
    if (normalizedHeading >= 22.5 && normalizedHeading < 67.5) return 'Nordeste';
    if (normalizedHeading >= 67.5 && normalizedHeading < 112.5) return 'Leste';
    if (normalizedHeading >= 112.5 && normalizedHeading < 157.5) return 'Sudeste';
    if (normalizedHeading >= 157.5 && normalizedHeading < 202.5) return 'Sul';
    if (normalizedHeading >= 202.5 && normalizedHeading < 247.5) return 'Sudoeste';
    if (normalizedHeading >= 247.5 && normalizedHeading < 292.5) return 'Oeste';
    if (normalizedHeading >= 292.5 && normalizedHeading < 337.5) return 'Noroeste';
    return 'Norte';
}

function submitGuess() {
    if (!gameState.playerGuess) return;

    // Verificar se está em modo multiplayer
    if (window.multiplayerManager && window.multiplayerManager.isMultiplayerMode()) {
        // Enviar palpite para o servidor multiplayer
        window.multiplayerManager.submitMultiplayerGuess(gameState.playerGuess);

        // Desabilitar botão de envio
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = 'ENVIADO ✓';

        return;
    }

    // Modo single player
    const distance = calculateDistance(
        gameState.currentLocation.lat,
        gameState.currentLocation.lng,
        gameState.playerGuess.lat,
        gameState.playerGuess.lng
    );

    const score = calculateScore(distance);
    gameState.totalScore += score;

    showResult(distance, score);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
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

function calculateScore(distanceKm) {
    if (distanceKm < 1) return 5000;
    if (distanceKm < 10) return Math.round(5000 - (distanceKm * 100));
    if (distanceKm < 100) return Math.round(4000 - (distanceKm * 20));
    if (distanceKm < 1000) return Math.round(2000 - (distanceKm * 1.5));
    return Math.max(0, Math.round(500 - (distanceKm * 0.1)));
}

function showResult(distance, score) {
    // Atualizar elementos da tela de resultado
    document.getElementById('resultRound').textContent = gameState.currentRound;
    document.getElementById('distance').textContent = distance < 1 ?
        `${Math.round(distance * 1000)}m` : `${Math.round(distance)}km`;
    document.getElementById('roundScore').textContent = score.toLocaleString();
    document.getElementById('progressScore').textContent = gameState.totalScore.toLocaleString();

    // Calcular pontuações separadas
    const distanceScore = score;
    const countryScore = calculateCountryScore();

    document.getElementById('distanceScore').textContent = distanceScore.toLocaleString();
    document.getElementById('countryScore').textContent = countryScore.toLocaleString();

    // Emoji baseado na pontuação
    const emoji = score >= 4000 ? '🎯' : score >= 2000 ? '👍' : score >= 1000 ? '👌' : '😅';
    document.getElementById('resultEmoji').textContent = emoji;

    // Texto do botão
    if (gameState.currentRound < gameState.totalRounds) {
        elements.nextBtn.textContent = 'CONTINUE';
    } else {
        elements.nextBtn.textContent = 'VIEW FINAL RESULTS';
    }

    // Criar mapa de resultado
    createResultMap();

    showScreen('result');
}

function calculateCountryScore() {
    // Implementação simples - pode ser expandida para verificar se o país está correto
    // Por enquanto, retorna 0 ou pontos bonus baseado na distância
    if (!gameState.playerGuess) return 0;

    const distance = calculateDistance(
        gameState.currentLocation.lat,
        gameState.currentLocation.lng,
        gameState.playerGuess.lat,
        gameState.playerGuess.lng
    );

    // Bonus se estiver no mesmo país (aproximação por distância)
    if (distance < 100) return 1000; // Mesmo país
    if (distance < 500) return 500;  // País próximo
    return 0;
}

function createResultMap() {
    if (!gameState.googleMapsLoaded || !window.google || !gameState.playerGuess) {
        console.log('Não é possível criar mapa de resultado');
        return;
    }

    const resultMapElement = document.getElementById('resultMap');
    if (!resultMapElement) return;

    // Limpar mapa anterior
    resultMapElement.innerHTML = '';

    // Coordenadas da localização real e do palpite
    const realLocation = { lat: gameState.currentLocation.lat, lng: gameState.currentLocation.lng };
    const guessLocation = { lat: gameState.playerGuess.lat, lng: gameState.playerGuess.lng };

    // Calcular bounds para mostrar ambos os pontos
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(realLocation);
    bounds.extend(guessLocation);

    // Criar mapa
    const map = new google.maps.Map(resultMapElement, {
        zoom: 2,
        center: realLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });

    // Marcador da localização real (vermelho)
    const realMarker = new google.maps.Marker({
        position: realLocation,
        map: map,
        title: 'Localização Real',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#e74c3c',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        }
    });

    // Marcador do palpite (azul)
    const guessMarker = new google.maps.Marker({
        position: guessLocation,
        map: map,
        title: 'Seu Palpite',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3498db',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        }
    });

    // Linha conectando os dois pontos
    const line = new google.maps.Polyline({
        path: [realLocation, guessLocation],
        geodesic: true,
        strokeColor: '#f39c12',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
    });

    // Ajustar zoom para mostrar ambos os pontos
    map.fitBounds(bounds);

    // Adicionar padding para não ficar muito apertado
    const padding = { top: 50, right: 400, bottom: 50, left: 50 }; // Mais padding à direita por causa do sidebar
    map.fitBounds(bounds, padding);

    console.log('✅ Mapa de resultado criado');
}

function nextRound() {
    if (gameState.currentRound < gameState.totalRounds) {
        gameState.currentRound++;
        showScreen('game');
        elements.loading.classList.remove('hidden');
        elements.gameArea.classList.add('hidden');
        setTimeout(() => loadRound(), 1500);
    } else {
        showFinalResult();
    }
}

function showFinalResult() {
    const averageScore = Math.round(gameState.totalScore / gameState.totalRounds);

    // Determinar performance
    let performance;
    if (averageScore >= 4000) {
        performance = { emoji: '🏆', title: 'EXPERT', desc: 'Você é um mestre da geografia!' };
    } else if (averageScore >= 3000) {
        performance = { emoji: '🥇', title: 'EXCELENTE', desc: 'Performance impressionante!' };
    } else if (averageScore >= 2000) {
        performance = { emoji: '🥈', title: 'MUITO BOM', desc: 'Você se saiu muito bem!' };
    } else if (averageScore >= 1000) {
        performance = { emoji: '🥉', title: 'BOM', desc: 'Bom trabalho, continue praticando!' };
    } else {
        performance = { emoji: '🎯', title: 'INICIANTE', desc: 'Todo expert começou assim!' };
    }

    // Atualizar elementos
    document.getElementById('finalEmoji').textContent = performance.emoji;
    document.getElementById('performanceBadge').textContent = performance.title;
    document.getElementById('performanceDesc').textContent = performance.desc;
    document.getElementById('finalScore').textContent = gameState.totalScore.toLocaleString();
    document.getElementById('averageScore').textContent = averageScore.toLocaleString();

    showScreen('final');
}

function resetGame() {
    gameState.currentRound = 1;
    gameState.totalScore = 0;
    gameState.currentLocation = null;
    gameState.playerGuess = null;

    showScreen('start');
}

// Função para carregar Google Maps API dinamicamente
function loadGoogleMapsAPI() {
    // Verificar se já foi carregado
    if (window.google && window.google.maps) {
        console.log('✅ Google Maps já estava carregado');
        gameState.googleMapsLoaded = true;
        checkApiConfiguration();
        return;
    }

    // Verificar se o script já existe
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('⚠️ Script do Google Maps já existe, aguardando carregamento...');
        return;
    }

    const apiKey = getApiKey();
    console.log('🔑 Carregando Google Maps API...');

    // Criar e carregar o script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
        console.error('❌ Erro ao carregar Google Maps API:', error);
        gameState.googleMapsLoaded = false;
        checkApiConfiguration();
    };
    document.head.appendChild(script);
}



// Callback do Google Maps
function initGoogleMaps() {
    console.log('✅ Google Maps API carregada com sucesso!');
    gameState.googleMapsLoaded = true;
    checkApiConfiguration();

    // Testar se conseguimos criar um mapa simples
    try {
        const testDiv = document.createElement('div');
        const testMap = new google.maps.Map(testDiv, {
            zoom: 2,
            center: { lat: 0, lng: 0 }
        });
        console.log('✅ Google Maps funcionando corretamente!');

        // Pré-carregar alguns locais válidos em background
        preloadValidLocations();
    } catch (error) {
        console.error('❌ Erro ao criar mapa de teste:', error);
    }
}

// Função para pré-carregar locais válidos
async function preloadValidLocations() {
    console.log('🔄 Pré-carregando locais válidos...');

    const promises = [];
    const maxPreload = 10;

    for (let i = 0; i < maxPreload; i++) {
        // Escolher região aleatória
        const region = gameState.streetViewRegions[Math.floor(Math.random() * gameState.streetViewRegions.length)];

        // Gerar coordenadas aleatórias
        const lat = region.bounds.south + Math.random() * (region.bounds.north - region.bounds.south);
        const lng = region.bounds.west + Math.random() * (region.bounds.east - region.bounds.west);

        // Adicionar à lista de promessas
        promises.push(checkStreetViewAvailability(lat, lng, region.name));
    }

    // Aguardar todas as verificações
    const results = await Promise.all(promises);

    // Adicionar locais válidos ao cache
    results.forEach(location => {
        if (location) {
            gameState.validLocations.push(location);
        }
    });

    console.log(`✅ ${gameState.validLocations.length} locais válidos pré-carregados!`);
}

// Tornar a função global para o callback
window.initGoogleMaps = initGoogleMaps;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 GeoGuessr carregado!');

    // Verificar se está em modo multiplayer
    const multiplayerData = localStorage.getItem('multiplayerRoom');
    if (multiplayerData) {
        try {
            const roomData = JSON.parse(multiplayerData);
            if (roomData.isMultiplayer && roomData.roomCode && roomData.playerName) {
                console.log('🎮 Modo Multiplayer detectado para sala:', roomData.roomCode);

                // Aguardar o multiplayer manager inicializar
                setTimeout(() => {
                    if (window.multiplayerManager && window.multiplayerManager.isMultiplayerMode()) {
                        // Não iniciar o jogo automaticamente, aguardar round-started do servidor
                        console.log('🎮 Multiplayer inicializado, aguardando primeiro round...');
                        showScreen('loading');
                        updateLoadingMessage('Aguardando início do jogo...<br>O jogo será iniciado automaticamente pelo servidor.');
                    }
                }, 1000);
            } else {
                console.log('⚠️ Dados de multiplayer inválidos, removendo...');
                localStorage.removeItem('multiplayerRoom');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados multiplayer:', error);
            localStorage.removeItem('multiplayerRoom');
        }
    }

    checkApiConfiguration();
    loadGoogleMapsAPI();
    showScreen('start');

    console.log('✅ Inicialização completa!');
});
