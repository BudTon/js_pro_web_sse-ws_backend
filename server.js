const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const WS = require('ws');
const router = require('./routes/index.js');
const app = new Koa();

app.use(koaBody({
  urlencoded: true,
}))

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }


  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }

    ctx.response.status = 204;
  }
});


//TODO: write code here
app.use(router())

const port = process.env.PORT || 7071;
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
        .forEach(client => client.send(participants));
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


