const TelegramBot = require('node-telegram-bot-api');

// Substitua pelos seus dados
const token = '7392024315:AAGQGpeHALe5c1Kc8ROqwWTuCYSrBtFjohI'; // Seu token do bot
const chatId = '-1001733882993'; // Seu Chat ID (substitua pelo ID correto)

const bot = new TelegramBot(token, { polling: true });

// Função para formatar e enviar mensagens
async function enviarMensagem(event) {
  const { eventType, payload } = event;
  const { item } = payload;
  const { metadata, permalink } = item;
  const { name, image_url } = metadata;
  const preco = (payload.base_price / 10 ** payload.payment_token.decimals).toFixed(2);
  const data = new Date(event.event_timestamp || payload.listing_date).toLocaleString();

  const mensagemFormatada = `
  *${eventType} - ${name}*

  Preço: $${preco} ${payload.payment_token.symbol}
  Data: ${data}
  Link: ${permalink}
  `;

  try {
    // Envia a foto primeiro
    await bot.sendPhoto(chatId, image_url);

    // Depois envia a mensagem formatada
    bot.sendMessage(chatId, mensagemFormatada, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
}

module.exports = { enviarMensagem };
