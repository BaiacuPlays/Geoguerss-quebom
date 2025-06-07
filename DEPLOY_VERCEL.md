# 🚀 Deploy do GeoGuessr Multiplayer na Vercel

## 📋 Pré-requisitos

1. **Conta na Vercel**: [vercel.com](https://vercel.com)
2. **Repositório no GitHub**: Seu código deve estar em um repositório GitHub
3. **Google Maps API Key**: Configure no arquivo `.env`

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

### 2. Configuração da Vercel

O projeto já inclui:
- `vercel.json` - Configuração de deploy
- `api/socket.js` - Função serverless para Socket.IO
- Detecção automática de ambiente

## 🚀 Deploy

### Opção 1: Via Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### Opção 2: Via GitHub (Recomendado)

1. **Conectar repositório**:
   - Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
   - Clique em "New Project"
   - Conecte seu repositório GitHub

2. **Configurar variáveis**:
   - Na página do projeto, vá em "Settings" > "Environment Variables"
   - Adicione: `VITE_GOOGLE_MAPS_API_KEY`

3. **Deploy automático**:
   - Cada push para `main` fará deploy automático

## 🔍 Verificação

Após o deploy:

1. **Teste o lobby**: `https://seu-projeto.vercel.app/lobby.html`
2. **Teste o jogo**: `https://seu-projeto.vercel.app/index.html`
3. **Verifique o console** para logs de conexão

## 🐛 Troubleshooting

### Problema: Socket.IO não conecta

**Solução**: Verifique se:
- O arquivo `api/socket.js` está presente
- As variáveis de ambiente estão configuradas
- O domínio está correto nos logs do console

### Problema: Google Maps não carrega

**Solução**: 
- Verifique a API key no `.env`
- Configure os domínios permitidos no Google Cloud Console
- Adicione `*.vercel.app` aos domínios autorizados

### Problema: Salas não persistem

**Nota**: Na versão atual, as salas são armazenadas em memória.
Para persistência, considere implementar Vercel KV:

```bash
npm install @vercel/kv
```

## 📊 Monitoramento

- **Logs**: Vercel Dashboard > Functions > View Function Logs
- **Analytics**: Vercel Dashboard > Analytics
- **Performance**: Vercel Dashboard > Speed Insights

## 🔄 Atualizações

Para atualizar o projeto:

1. Faça push das mudanças para GitHub
2. Vercel fará deploy automático
3. Teste a nova versão

## 📝 Notas Importantes

- **Limitações Serverless**: Funções têm timeout de 30s
- **Memória**: Estado das salas é perdido entre deployments
- **Escalabilidade**: Para muitos usuários, considere Redis/KV

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no Vercel Dashboard
2. Teste localmente com `npm run start`
3. Verifique a configuração do Google Maps
4. Confirme que todas as dependências estão instaladas
