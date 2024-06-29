const WebSocket = require('ws');
const { OpenSeaStreamClient } = require('@opensea/stream-js');
require("dotenv").config();

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const client = new OpenSeaStreamClient({
  token: 'cd91be4a0b7f45838ee0be826578882a', 
  apiUrl: 'wss://stream.openseabeta.com/socket',
  connectOptions: {
    transport: WebSocket
  },
});

const { enviarMensagem } = require('./telegramBot.js');
const { inserirEvento, calcularPrecoMedio } = require('./dataAnalysis.js');

app.use(express.static('public'));

// Eventos da OpenSea
client.onItemListed('sunflower-land-collectibles', async (event) => {
  inserirEvento(event);

  const precoMedioVenda = await calcularPrecoMedio('sunflower-land-collectibles', 'Item vendido');
  const precoListagem = event.payload.base_price / 10 ** event.payload.payment_token.decimals;

  if (precoMedioVenda && precoListagem < precoMedioVenda * 0.7) {
    event.eventType = "OPORTUNIDADE: Item listado ABAIXO do preço médio!";
    event.precoMedio = precoMedioVenda;
    event.destaque = true;
  } else {
    event.eventType = "Item listado";
    event.destaque = false;
  }

  event.corEtiqueta = 'blue';
  io.emit('itemEvent', event);
  enviarMensagem(event);
});

client.onItemSold('sunflower-land-collectibles', (event) => {
  event.eventType = "Item vendido";
  event.corEtiqueta = 'green';
  event.destaque = false; // Não é uma oportunidade
  inserirEvento(event);
  io.emit('itemEvent', event);
  enviarMensagem(event);
});

client.onItemReceivedBid('sunflower-land-collectibles', (event) => {
  event.eventType = "Item recebeu lance";
  event.corEtiqueta = 'red';
  event.destaque = false; // Não é uma oportunidade
  inserirEvento(event);
  io.emit('itemEvent', event);
  enviarMensagem(event);
});

client.onItemReceivedOffer('sunflower-land-collectibles', (event) => {
  event.eventType = "Item recebeu oferta";
  event.corEtiqueta = 'red';
  event.destaque = false; // Não é uma oportunidade
  inserirEvento(event);
  io.emit('itemEvent', event);
  enviarMensagem(event);
});

client.on('error', (error) => {
  console.error('Erro na conexão com a OpenSea Stream API:', error);
});

http.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});