# relay-server
웹소켓을 제공하는 파트너 업체의 클라이언트 허용량이 낮아,  
이를 중계하는 서버를 만들어 보게 되었습니다.

### Run
```
    $ yarn start 
    or
    $ npm start
```

### config
``` 
    parentUrl : "url",                  #parent socket url
    socketPort : 3004,                  #socket port
    dbInfo : {                          #mysql connection info
        host     : 'dbUrl',
        user     : 'dbUsername',
        password : 'password',
        port     : 3306,
        database : 'database'
    },
    socketServerPort : 3005,            #socket server port
    apiServerPort : 3006                #api server port
```

### Open Socket

중계서버의 소켓을 오픈합니다.

```
    const wss = new WebSocket.Server({
        port: config.socketPort,
    });
```

### Parent socket connect

<details>
    <summary>Open</summary>  
    <p>파트너사의 소켓에 연결해서 데이터를 받아옵니다.</p>
    <p>받아온 데이터는 서버에서 보관하거나, 필요에 따라 즉시 고객들에게 전송해줍니다.</p>
    

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

</details>



### Connected to clients

중계서버 소켓에 접속한 사용자들과 통신합니다.

주기적으로 접속여부를 체크해주고, 사용자들이 보내준 메세지에 따라 서버의 데이터를 전송해줍니다.

```
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
```

### Check client's socket is valid

주기적으로 사용자의 접속이 유효한지 체크합니다.

예시는 30000초마다 체크하게 되어있습니다.

```
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

```

### DB
DB에 저장할 데이터를 mysql DB에 저장합니다.

```
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

```

### API

서버에 저장하고 있는 데이터를 선택해서 API를 제공합니다.

```
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
```

### Api Server 

API서버를 열어줍니다.

```
    
    //apiServer
    app.listen(config.apiServerPort, () => {
        console.log('server start');
    });

```
