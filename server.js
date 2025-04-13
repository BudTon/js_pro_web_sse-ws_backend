const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const WS = require('ws');
const router = require('./routes/index.js');
const app = new Koa();
const cors = require('@koa/cors');


app.use(koaBody({
  urlencoded: true,
}))

app.use(cors());

//TODO: write code here
app.use(router())

const port = process.env.PORT || 7077;
const server = http.createServer(app.callback());

const wsServer = new WS.Server({
  server
});

const chat = [];
const participantsList = [];

wsServer.on('connection', (ws) => {

  ws.on('message', (message) => {

    if (ws.nickname === undefined) {
      const obj = JSON.parse(message)
      ws.nickname = obj.nickname
      participantsList.push(ws.nickname);

      const participants = JSON.stringify({ participants: participantsList });

      Array.from(wsServer.clients)
        .filter(client => client.readyState === WS.OPEN)
        .forEach(client => {
          client.send(participants);
        });

      return
    }

    const now = new Date(Date.now()).toLocaleString();
    chat.push({ dataMessage: now, nicknameMessage: ws.nickname, textMessage: message });
    Array.from(wsServer.clients)
      .filter(client => client.readyState === WS.OPEN)
      .forEach(client => {
        let eventData = undefined;
        if (client.nickname === ws.nickname) {
          eventData = JSON.stringify({ chat: [{ dataMessage: now, nicknameMessage: 'You', textMessage: message }] });
        } else {
          eventData = JSON.stringify({ chat: [{ dataMessage: now, nicknameMessage: ws.nickname, textMessage: message }] });
        }
        client.send(eventData)
      });

  });

  ws.on('close', () => {

    participantsList.map((participant, index) => {
      if (participant === ws.nickname) {
        participantsList.splice(index, 1)
      }

    })

    Array.from(wsServer.clients)
      .filter(client => client.readyState === WS.OPEN)
      .forEach(client => client.send(JSON.stringify({ nicknameClose: ws.nickname })));

    const now = new Date(Date.now()).toLocaleString();

    chat.push({ dataMessage: now, nicknameMessage: ws.nickname, textMessage: `Покинул чат` });

    const messageClose = JSON.stringify({ chat: [{ dataMessage: now, nicknameMessage: ws.nickname, textMessage: `Покинул чат` }] });
    Array.from(wsServer.clients)
      .filter(client => client.readyState === WS.OPEN)
      .forEach(client => client.send(messageClose));

  });

  ws.send(JSON.stringify({ chat }));
  ws.send(JSON.stringify({ participants: participantsList }));

});

server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Server is listening to ' + port);
  console.log('hello');
});
