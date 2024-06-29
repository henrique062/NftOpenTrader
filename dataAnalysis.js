const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./nft_data.db'); 

// Função para inserir um evento no banco de dados
function inserirEvento(event) {
  const { slug, base_price, payment_token } = event.payload;
  const decimals = payment_token ? payment_token.decimals : 0;

  db.run('INSERT INTO nft_events (slug, event_type, base_price, payment_token_decimals) VALUES (?, ?, ?, ?)', [
    slug,
    event.eventType,
    base_price,
    decimals
  ]);
}

// Função para calcular o preço médio de um tipo de evento em uma coleção
async function calcularPrecoMedio(slug, eventType) {
  return new Promise((resolve, reject) => {
    db.all('SELECT base_price, payment_token_decimals FROM nft_events WHERE slug = ? AND event_type = ? ORDER BY timestamp DESC LIMIT 50', [slug, eventType], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const precos = rows.map(row => row.base_price / 10 ** row.payment_token_decimals);
        const soma = precos.reduce((acc, preco) => acc + preco, 0);
        const media = soma / precos.length;
        resolve(media);
      }
    });
  });
}

module.exports = { inserirEvento, calcularPrecoMedio };
