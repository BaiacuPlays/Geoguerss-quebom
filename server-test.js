import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

console.log('🚀 Iniciando servidor de teste...');

const app = express();
const server = createServer(app);

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
};

const io = new Server(server, {
    cors: corsOptions,
    allowEIO3: true
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('.'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io eventos
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);
    
    socket.on('test', (data) => {
        console.log('📨 Teste recebido:', data);
        socket.emit('test-response', { message: 'Servidor funcionando!', timestamp: new Date().toISOString() });
    });
    
    socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
    console.log(`✅ Servidor de teste rodando na porta ${PORT}`);
    console.log(`🌍 Health check: http://localhost:${PORT}/api/health`);
});
