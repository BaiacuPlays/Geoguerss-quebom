#!/usr/bin/env node

// Script automatizado para deploy na Vercel
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Script de Deploy para Vercel - GeoGuessr Multiplayer');
console.log('=' .repeat(60));

// Verificar se está no diretório correto
if (!fs.existsSync('package.json')) {
    console.error('❌ Erro: Execute este script na raiz do projeto!');
    process.exit(1);
}

// Verificar dependências necessárias
console.log('📦 Verificando dependências...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['socket.io', 'express', 'cors'];
    
    for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep]) {
            console.error(`❌ Dependência faltando: ${dep}`);
            process.exit(1);
        }
    }
    console.log('✅ Dependências OK');
} catch (error) {
    console.error('❌ Erro ao verificar package.json:', error.message);
    process.exit(1);
}

// Verificar arquivo .env
console.log('🔑 Verificando configuração...');
if (!fs.existsSync('.env') && !fs.existsSync('.env.example')) {
    console.warn('⚠️  Arquivo .env não encontrado. Certifique-se de configurar VITE_GOOGLE_MAPS_API_KEY');
} else {
    console.log('✅ Configuração OK');
}

// Verificar arquivos necessários para Vercel
console.log('📁 Verificando arquivos para Vercel...');
const requiredFiles = [
    'vercel.json',
    'api/socket.js',
    'config.js',
    'lobby.html',
    'index.html'
];

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Arquivo necessário não encontrado: ${file}`);
        process.exit(1);
    }
}
console.log('✅ Arquivos necessários OK');

// Testar build local
console.log('🔨 Testando build...');
try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build OK');
} catch (error) {
    console.error('❌ Erro no build:', error.message);
    process.exit(1);
}

// Verificar se Vercel CLI está instalado
console.log('🔧 Verificando Vercel CLI...');
try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI OK');
} catch (error) {
    console.log('📥 Instalando Vercel CLI...');
    try {
        execSync('npm install -g vercel', { stdio: 'inherit' });
        console.log('✅ Vercel CLI instalado');
    } catch (installError) {
        console.error('❌ Erro ao instalar Vercel CLI:', installError.message);
        console.log('💡 Tente instalar manualmente: npm install -g vercel');
        process.exit(1);
    }
}

// Fazer deploy
console.log('🚀 Iniciando deploy na Vercel...');
console.log('📝 Nota: Se for o primeiro deploy, você precisará configurar o projeto');

try {
    // Deploy para produção
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('');
    console.log('🎉 Deploy concluído com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Acesse o Vercel Dashboard para ver a URL do projeto');
    console.log('2. Configure a variável VITE_GOOGLE_MAPS_API_KEY se necessário');
    console.log('3. Teste o multiplayer na URL fornecida');
    console.log('4. Configure domínios no Google Cloud Console se necessário');
    console.log('');
    console.log('🔗 URLs para testar:');
    console.log('   - Lobby: https://seu-projeto.vercel.app/lobby.html');
    console.log('   - Jogo: https://seu-projeto.vercel.app/index.html');
    console.log('   - Health: https://seu-projeto.vercel.app/api/health');
    
} catch (error) {
    console.error('❌ Erro durante o deploy:', error.message);
    console.log('');
    console.log('💡 Possíveis soluções:');
    console.log('1. Faça login: vercel login');
    console.log('2. Verifique sua conexão com a internet');
    console.log('3. Tente novamente: vercel --prod');
    process.exit(1);
}

// Verificar se o deploy funcionou
console.log('');
console.log('🔍 Para verificar se está funcionando:');
console.log('1. Abra a URL fornecida');
console.log('2. Teste criar uma sala no lobby');
console.log('3. Verifique o console do navegador para logs');
console.log('');
console.log('📊 Para monitorar:');
console.log('- Logs: Vercel Dashboard > Functions');
console.log('- Analytics: Vercel Dashboard > Analytics');
console.log('- Errors: Vercel Dashboard > Functions > View Logs');
