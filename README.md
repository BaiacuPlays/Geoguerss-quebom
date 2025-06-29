# 🌍 GeoGuessr Multiplayer

Um jogo estilo GeoGuessr com **modo multiplayer** desenvolvido com HTML, CSS, JavaScript vanilla e Socket.IO, utilizando a API do Google Maps para Street View real.

## ✨ Novidades - Multiplayer Implementado!

### 🎮 Modo Multiplayer
- ✅ **Salas privadas** - Crie salas com códigos únicos
- ✅ **Até 8 jogadores** - Jogue com seus amigos
- ✅ **Tempo real** - Veja quando outros jogadores enviam palpites
- ✅ **Ranking ao vivo** - Acompanhe pontuações durante o jogo
- ✅ **Reconexão automática** - Não perca o jogo se a conexão cair
- ✅ **Sistema robusto** - Tratamento de erros e validações

### 🚀 Deploy na Vercel
- ✅ **Pronto para produção** - Configurado para deploy na Vercel
- ✅ **Serverless** - Funções otimizadas para escalabilidade
- ✅ **CORS configurado** - Funciona em qualquer domínio
- ✅ **Health checks** - Monitoramento automático

## 🚀 Como Usar

### **Modo Multiplayer (Recomendado):**
1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor:**
   ```bash
   npm run server
   # ou
   node server.js
   ```

3. **Acesse o jogo:**
   - Abra `http://localhost:3002` no navegador
   - Clique "👥 Multiplayer" para jogar com amigos
   - Ou clique "🎮 Jogar Solo" para modo single-player

### **Modo Single-Player (Simples):**
1. Abra o arquivo `index.html` diretamente no navegador
2. Clique "🎮 Jogar Solo"
3. Jogue!

## 🎮 Como Jogar

### **Modo Single-Player:**
1. **Observe** a imagem do Street View (real ou simulada)
2. **Clique no mapa** onde acha que está
3. **Confirme** seu palpite
4. **Ganhe pontos** pela proximidade
5. **Complete 5 rounds** e veja sua classificação!

### **Modo Multiplayer:**
1. **Digite seu nome** no lobby
2. **Crie uma sala** ou **entre em uma existente** com o código
3. **Aguarde** outros jogadores se juntarem
4. **Clique "Iniciar Jogo"** quando todos estiverem prontos
5. **Jogue simultaneamente** com seus amigos!
6. **Veja o ranking** em tempo real
7. **Compare resultados** ao final de cada round

## 🎯 Sistema de Pontuação

- 🏆 **5000 pts**: < 1km (EXPERT!)
- 🥇 **4000+ pts**: < 10km (Excelente!)
- 🥈 **2000+ pts**: < 100km (Muito Bom!)
- 🥉 **1000+ pts**: < 1000km (Bom!)

## ✨ Características

- 🎨 **Design moderno** com gradientes e animações
- 🌍 **10 locais famosos** (Times Square, Torre Eiffel, etc.)
- 🎯 **Street View simulado** com cenários por região
- 📱 **Totalmente responsivo**
- 🏆 **Sistema de classificação** (Iniciante → Expert)
- 📊 **Estatísticas detalhadas**
- 🚀 **Sem dependências** - só HTML, CSS, JS!

## 🎮 Funcionalidades Multiplayer

### **Sistema de Salas:**
- 🏠 **Criar sala** com código único de 6 caracteres
- 🚪 **Entrar em sala** usando código compartilhado
- 👥 **Até 8 jogadores** por sala
- 👑 **Host** pode iniciar o jogo

### **Gameplay Sincronizado:**
- 🌍 **Mesmos locais** para todos os jogadores
- ⏱️ **Timer de 2 minutos** por round
- 🎯 **5 rounds** por partida
- 📊 **Pontuação em tempo real**

### **Interface Multiplayer:**
- 🏆 **Ranking ao vivo** durante o jogo
- 💬 **Notificações** de ações dos jogadores
- ⏰ **Timer visual** com aviso de tempo
- 📱 **Painel de jogadores** responsivo

## 📁 Arquivos

### **Frontend:**
- `index.html` - Jogo principal
- `lobby.html` - Interface de lobby multiplayer
- `style.css` - Estilos e animações
- `script.js` - Lógica do jogo single-player
- `lobby.js` - Lógica do lobby
- `multiplayer.js` - Gerenciador multiplayer

### **Backend:**
- `server.js` - Servidor Node.js + Socket.io
- `package.json` - Dependências e scripts

---

**Abra index.html e divirta-se! 🌍🎮**
#   G e o g u e r s s - q u e b o m 
 
 