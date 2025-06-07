# 🗺️ Configuração do Google Maps API

Este guia te ajudará a configurar o Google Maps API para ter Street View real no seu jogo GeoGuessr!

## 📋 Pré-requisitos

- Conta Google
- Cartão de crédito (para verificação - Google oferece $200 de crédito gratuito por mês)

## 🚀 Passo a Passo

### 1. Acesse o Google Cloud Console
- Vá para [console.cloud.google.com](https://console.cloud.google.com/)
- Faça login com sua conta Google

### 2. Crie um Projeto
- Clique em "Selecionar projeto" no topo
- Clique em "Novo Projeto"
- Digite um nome (ex: "geoguessr-game")
- Clique em "Criar"

### 3. Ative as APIs Necessárias
- No menu lateral, vá em "APIs e Serviços" > "Biblioteca"
- Procure e ative as seguintes APIs:
  - **Maps JavaScript API** ✅
  - **Street View Static API** ✅
  - **Places API** (opcional) ✅

### 4. Crie uma Chave de API
- Vá em "APIs e Serviços" > "Credenciais"
- Clique em "+ CRIAR CREDENCIAIS" > "Chave de API"
- Sua chave será gerada automaticamente
- **IMPORTANTE:** Copie e guarde esta chave!

### 5. Configure Restrições (Recomendado)
- Clique na chave que você criou
- Em "Restrições de aplicativo":
  - Selecione "Referenciadores HTTP (sites)"
  - Adicione: `http://localhost:*/*` e `https://seudominio.com/*`
- Em "Restrições de API":
  - Selecione "Restringir chave"
  - Escolha as APIs que você ativou
- Clique em "Salvar"

### 6. Configure no Projeto
- Copie o arquivo `.env.example` para `.env`:
  ```bash
  cp .env.example .env
  ```
- Edite o arquivo `.env` e substitua:
  ```
  VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
  ```

### 7. Teste o Projeto
```bash
npm run dev
```

## 💰 Custos

- **Gratuito**: $200 de crédito por mês
- **Street View**: ~$7 por 1000 visualizações
- **Maps JavaScript API**: ~$7 por 1000 carregamentos

Para um jogo pessoal, você provavelmente ficará dentro do limite gratuito!

## 🔧 Solução de Problemas

### Erro: "This API project is not authorized"
- Verifique se as APIs estão ativadas
- Confirme se a chave está correta no arquivo `.env`

### Erro: "RefererNotAllowedMapError"
- Configure as restrições de referenciador
- Adicione `http://localhost:*/*` nas restrições

### Street View não carrega
- Verifique se a "Street View Static API" está ativada
- Alguns locais podem não ter Street View disponível

## 🎮 Sem Google Maps?

Não se preocupe! O jogo funciona perfeitamente sem o Google Maps, usando:
- Simulações visuais de Street View
- Mapa mundial interativo em Canvas
- Todas as funcionalidades do jogo

## 📞 Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Confirme se todas as APIs estão ativadas
3. Teste com uma chave nova
4. Use o modo simulação como fallback

---

**Dica:** Para desenvolvimento, você pode usar o modo simulação e configurar o Google Maps apenas para produção!
