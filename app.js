process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


const WebSocket = require('ws');
const express = require('express');
const mysql = require('mysql');
const config = require('./config');

const app = express();

const url = config.parentUrl;

let ws;

//Open relay server socket
const wss = new WebSocket.Server({
    port: config.socketPort,
});

//The data that is sent to clients.
const publicData = {
    test1 : [],
    test2 : []
}


//Connect to parent websocket
const connect = () => {
    ws = new WebSocket(url);
    ws.on('open', () => {
        //Logic that you want to run when you are connected to a websocket.
    });

    //get Message from websocket
    ws.on('message', (data) => {
        //Logic that you want to run when you get message from a websocket.
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    //Send immediate information to connected clients
                    //You have to customize data for clients
                    client.send(data);
                }
            });

    });

    //When the parent socket is dead.
    ws.on('close', () => {
        console.log('Parent Websocket is dead')
        publicData.test1 = [];
        publicData.test1 = [];
        setTimeout(connect, 2000); // reconnect.
    })
    ws.on('error', (err) => {
        console.log(err);
    })
}
connect();


//Clients connect to relay server socket.
wss.on('connection', (client, req) => {
    try {
        client.clientIP = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'];
        client.isAlive = true;
        client.on('pong', () => heartbeat(client));
        client.on('message', (data) => {
            //Processing logic by data sent by the user
        });
        client.on('close', () => {
            //client closed websocket
            client.terminate();
        })
        client.on('error', (err) => {
            console.log('error:', err);
        })
    } catch (e) {
        console.log(e)
    }
});

const noop = () => {
};
const heartbeat = (client) => {
    client.isAlive = true;
}

//Check customer connection
setInterval(() => {
    wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            if (ws.isAlive === false) {
                console.log(ws.clientIP, 'dead');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping(noop);
        }

    });
}, 30000000);


const connection = mysql.createConnection(config.dbInfo);


//dbSave and send data to clients periodically.
setInterval(() => {
    const data = ''

    setTimeout(() =>
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }

        }),1000);
},300000)

//The apis
app.get('/public',(req,res) => {
    const getData = {};
    res.send(getData);
    res.end();
});
app.get('/products',(req,res) => {
    const products = []
    res.send(products);
    res.end();
});

//apiServer
app.listen(config.apiServerPort, () => {
    console.log('server start');
});


