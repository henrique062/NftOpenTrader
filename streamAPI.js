const WebSocket = require('ws');
const { OpenSeaStreamClient } = require('@opensea/stream-js');
require("dotenv").config();

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const client = new OpenSeaStreamClient({
  token: process.env.OPENSEA_API_KEY || 'cd91be4a0b7f45838ee0be826578882a',
  apiUrl: 'wss://stream.openseabeta.com/socket',
  connectOptions: {
    transport: WebSocket
  },
});

const { enviarMensagem } = require('./telegramBot.js');
const { inserirEvento, calcularPrecoMedio } = require('./dataAnalysis.js');

app.use(express.static('public'));

// Configuração dos critérios de destaque
const destacarConfig = {
  'Item listado': (precoMedioVenda, precoListagem) => precoMedioVenda && precoListagem < precoMedioVenda * 0.7,
  'Item vendido': () => false,
  'Item recebeu lance': () => false,
  'Item recebeu oferta': () => false,
};

// Função para processar eventos com armazenamento e cálculo
async function processarEvento(event, tipo, corEtiqueta) {
  try {
    console.log("Evento recebido:", event);

    await inserirEvento(event);

    // Extrair informações do evento completo
    const nft_id = event.payload.item?.nft_id || null;
    const precoListagem = event.payload.base_price ? (event.payload.base_price / 10 ** event.payload.payment_token.decimals) : 0; // Trata o caso de base_price ser nulo

    const precoMedioVenda = await calcularPrecoMedio('sunflower-land-collectibles', 'Item vendido', nft_id);
    const destaque = destacarConfig[tipo](precoMedioVenda, precoListagem);

    event.eventType = tipo;
    event.corEtiqueta = corEtiqueta;
    event.destaque = destaque;
    event.precoMedio = precoMedioVenda; 

    io.emit('itemEvent', event);
    enviarMensagem(event);
  } catch (error) {
    console.error('Erro ao processar o evento:', error);
  }
}

client.onItemListed('sunflower-land-collectibles', async (event) => {
  await processarEvento(event, "Item listado", 'blue');
});

client.onItemSold('sunflower-land-collectibles', async (event) => {
  await processarEvento(event, "Item vendido", 'green');
});

client.onItemReceivedBid('sunflower-land-collectibles', async (event) => {
  await processarEvento(event, "Item recebeu lance", 'red');
});

client.onItemReceivedOffer('sunflower-land-collectibles', async (event) => {
  await processarEvento(event, "Item recebeu oferta", 'red');
});

client.on('error', (error) => {
  console.error('Erro na conexão com a OpenSea Stream API:', error);
});

// Rota para buscar eventos de um NFT específico
app.get('/eventos/:nftId', async (req, res) => {
  try {
    const nftId = req.params.nftId;
    const db = await connect();
    const eventos = await db.collection('nft_events')
      .find({ "event_data.payload.item.nft_id": nftId }) // Filtra pelo nft_id dentro de event_data
      .sort({ created_at: -1 })
      .toArray();

    // Calcular o preço médio para cada evento
    for (const evento of eventos) {
      evento.preco_medio = await calcularPrecoMedio('sunflower-land-collectibles', evento.event_data.event_type, nftId); // Substitua pelo slug da sua coleção
    }

    res.json(eventos);
  } catch (error) {
    console.error("Erro ao buscar eventos do NFT:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

http.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});