# 🗝️ Como Configurar Google Maps (5 minutos)

## 1. Obter Chave da API

1. **Acesse:** https://console.cloud.google.com/
2. **Crie um projeto** (qualquer nome)
3. **Vá em:** APIs e Serviços → Biblioteca
4. **Ative estas APIs:**
   - Maps JavaScript API
   - Street View Static API
5. **Vá em:** APIs e Serviços → Credenciais
6. **Clique:** + CRIAR CREDENCIAIS → Chave de API
7. **Copie a chave** (algo como: AIzaSyB...)

## 2. Configurar no Projeto

1. **Abra o arquivo:** `.env`
2. **Substitua** `YOUR_API_KEY_HERE` pela sua chave:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyB...sua_chave_aqui
   ```
3. **Salve o arquivo**
4. **Recarregue a página** do jogo

## 3. Testar

- Se funcionou: Você verá Street View real
- Se não funcionou: Você verá "Street View Simulado"

## 💰 Custo

- **GRATUITO** para uso pessoal
- Google dá $200 de crédito por mês
- Você provavelmente não pagará nada

## ❌ Problemas?

- **Erro de API:** Verifique se ativou as APIs corretas
- **Não carrega:** Recarregue a página (F5)
- **Ainda simulado:** Verifique se a chave está correta no .env

---

**O jogo funciona perfeitamente sem Google Maps também!**
