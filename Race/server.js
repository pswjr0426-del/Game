const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

let players = {};
let weather = 'CLEAR';

setInterval(() => {
    if (Math.random() < 0.4) {
        weather = 'STORM';
        io.emit('weatherUpdate', { weather: 'STORM' });
    } else {
        weather = 'CLEAR';
        io.emit('weatherUpdate', { weather: 'CLEAR' });
    }
}, 12000);

io.on('connection', (socket) => {
    if (Object.keys(players).length < 3) {
        const colors = [0xff7a45, 0x339af0, 0x51cf66];
        const pNum = Object.keys(players).length;
        players[socket.id] = {
            id: socket.id,
            num: pNum + 1,
            color: colors[pNum],
            x: (pNum - 1) * 4,
            y: 0,
            dist: 0,
            rotZ: 0
        };
    }

    socket.emit('init', { id: socket.id, players, weather });
    socket.broadcast.emit('playerJoined', players[socket.id]);

    socket.on('updateTransform', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].dist = data.dist;
            players[socket.id].rotZ = data.rotZ;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
