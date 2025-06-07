# 👥 GeoGuessr Multiplayer - Guia Completo

## 🚀 Início Rápido

### 1. **Configuração:**
```bash
# Instalar dependências
npm install

# Iniciar servidor
npm run server
# ou
node server.js
```

### 2. **Acessar o jogo:**
- Abra `http://localhost:3002` no navegador
- Clique "👥 Multiplayer"

### 3. **Criar ou entrar em sala:**
- **Criar:** Digite seu nome → "🏠 Criar Nova Sala"
- **Entrar:** Digite seu nome → "🚪 Entrar em Sala" → Digite código

### 4. **Jogar:**
- Aguarde outros jogadores
- Host clica "🎮 Iniciar Jogo"
- Jogue 5 rounds simultaneamente!

## 🎮 Como Funciona

### **Sistema de Salas:**
- Cada sala tem um **código único** de 6 caracteres
- **Primeiro jogador** que entra vira o **host** (👑)
- **Máximo 8 jogadores** por sala
- Salas são **removidas automaticamente** quando vazias

### **Gameplay:**
1. **Todos veem o mesmo local** em cada round
2. **Timer de 2 minutos** para fazer o palpite
3. **Pontuação calculada** pela distância do local real
4. **Ranking atualizado** em tempo real
5. **5 rounds** por partida completa

### **Pontuação:**
- 🏆 **5000 pts**: < 1km (Perfeito!)
- 🥇 **4000+ pts**: < 10km (Excelente!)
- 🥈 **2000+ pts**: < 100km (Muito Bom!)
- 🥉 **1000+ pts**: < 1000km (Bom!)
- 😅 **Menos pontos**: Quanto mais longe, menos pontos

## 🔧 Funcionalidades Técnicas

### **Servidor (Node.js + Socket.io):**
- **Gerenciamento de salas** em tempo real
- **Sincronização de jogadores** e rounds
- **Timer automático** por round
- **Cálculo de pontuação** no servidor
- **Reconexão automática** de jogadores

### **Cliente (JavaScript):**
- **Interface de lobby** responsiva
- **Painel multiplayer** durante o jogo
- **Notificações em tempo real**
- **Integração** com jogo single-player existente

### **Comunicação:**
- **WebSockets** para comunicação em tempo real
- **Eventos sincronizados** entre todos os jogadores
- **Estados consistentes** entre cliente e servidor

## 🎯 Eventos do Jogo

### **Lobby:**
- `create-room` - Criar nova sala
- `join-room` - Entrar em sala existente
- `player-joined` - Novo jogador entrou
- `player-left` - Jogador saiu

### **Jogo:**
- `start-game` - Iniciar partida
- `round-started` - Novo round iniciado
- `submit-guess` - Enviar palpite
- `round-ended` - Round finalizado
- `game-ended` - Jogo completo

## 🌍 Locais do Jogo

O servidor seleciona **5 locais aleatórios** dos 15 disponíveis:

### **América:**
- 🗽 Times Square, Nova York
- 🏔️ Cristo Redentor, Rio de Janeiro
- 🏛️ Machu Picchu, Peru

### **Europa:**
- 🗼 Torre Eiffel, Paris
- 🕰️ Big Ben, Londres
- 🏛️ Coliseu, Roma
- 🏛️ Acrópole, Atenas
- ❄️ Reykjavik, Islândia

### **Ásia:**
- 🏯 Tóquio, Japão
- 🏯 Grande Muralha, China
- 🕌 Taj Mahal, Índia
- 🏙️ Burj Khalifa, Dubai

### **Outros:**
- 🏛️ Praça Vermelha, Moscou
- 🎭 Sydney Opera House, Austrália
- 🏺 Pirâmides de Gizé, Egito

## 🔧 Configuração Avançada

### **Portas:**
- **Servidor:** 3002 (configurável em `server.js`)
- **Frontend:** Servido pelo mesmo servidor

### **Variáveis de Ambiente:**
```bash
PORT=3002  # Porta do servidor
```

### **Personalização:**
- **Tempo por round:** Modificar `roundDuration` em `server.js`
- **Máximo de jogadores:** Ajustar validação no servidor
- **Novos locais:** Adicionar ao array `gameLocations`

## 🐛 Solução de Problemas

### **Servidor não inicia:**
```bash
# Verificar se a porta está livre
netstat -an | findstr :3002

# Matar processo se necessário
taskkill /f /pid [PID]
```

### **Conexão perdida:**
- O jogo **reconecta automaticamente**
- Jogadores podem **reentrar na sala** com o mesmo código
- **Estado do jogo é mantido** no servidor

### **Sala não encontrada:**
- Verificar se o **código está correto**
- Sala pode ter sido **removida** se ficou vazia
- **Criar nova sala** se necessário

## 🎉 Dicas para Diversão

### **Organize torneios:**
- Crie **múltiplas salas** para eliminatórias
- Use **códigos temáticos** (ex: BRASIL, EUROPA)
- **Compartilhe códigos** em grupos

### **Modos de jogo:**
- **Speedrun:** Quem responde mais rápido
- **Precisão:** Quem chega mais perto
- **Equipes:** Dividir jogadores em grupos
- **Educativo:** Aprender geografia juntos

### **Streaming/Gravação:**
- **Compartilhe tela** para audiência
- **Comente** as escolhas em tempo real
- **Crie conteúdo** educativo

---

**Divirta-se explorando o mundo com seus amigos! 🌍👥**
