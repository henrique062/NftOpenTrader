const { connect } = require('./db');

// Função para extrair o ID do NFT a partir da URL do OpenSea
function extrairNftId(permalink) {
  if (permalink) {
    const partes = permalink.split('/');
    return partes[partes.length - 1];
  }
  return null;
}

async function inserirEvento(event) {
  const db = await connect();
  await db.collection('nft_events').insertOne({
    event_data: event, // Armazena o evento completo
    created_at: new Date(),
  });
}

async function calcularPrecoMedio(slug, eventType, nft_id) {
  const db = await connect();
  const pipeline = [
    { 
      $match: { 
        "event_data.payload.collection.slug": slug,
        "event_data.event_type": eventType,
        "event_data.payload.item.nft_id": nft_id 
      }
    },
    { $sort: { created_at: -1 } },
    { $limit: 50 },
    {
      $group: {
        _id: null,
        media: { 
          $avg: { 
            $divide: [
              "$event_data.payload.base_price", 
              { $pow: [10, "$event_data.payload.payment_token.decimals"] }
            ] 
          }
        },
      }
    }
  ];
  const result = await db.collection('nft_events').aggregate(pipeline).toArray();
  return result.length > 0 ? result[0].media : null;
}

module.exports = { inserirEvento, calcularPrecoMedio };