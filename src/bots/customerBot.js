import { Telegraf, Markup } from 'telegraf';
import { User } from '../models/index.js';

let bot = null;
let notifyCustomerCallback = null;

export function initCustomerBot(token, webAppUrl) {
  if (!token) {
    console.warn('Customer Bot token topilmadi. Bot ishlamaydi.');
    return null;
  }

  bot = new Telegraf(token);

  bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    const existing = await User.findOne({ where: { telegram_id: telegramId } });
    
    if (existing && existing.role === 'customer') {
      await showMainMenu(ctx, webAppUrl);
      return;
    }

    await ctx.reply(
      'Assalomu alaykum! Buyurtma berish uchun telefon raqamingizni yuboring.',
      Markup.keyboard([
        Markup.button.contactRequest('📱 Telefon raqamini yuborish'),
      ]).resize()
    );
  });

  bot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;
    if (!contact.phone_number) {
      await ctx.reply('Telefon raqam topilmadi. Qayta urinib ko\'ring.');
      return;
    }

    const phone = contact.phone_number.startsWith('+') 
      ? contact.phone_number 
      : `+${contact.phone_number}`;

    try {
      let user = await User.findOne({ where: { phone } });
      
      if (user) {
        if (user.telegram_id && user.telegram_id !== contact.user_id) {
          await ctx.reply('Bu telefon raqam boshqa akkauntga bog\'langan.');
          return;
        }
        user.telegram_id = contact.user_id;
        user.role = 'customer';
        await user.save();
      } else {
        user = await User.create({
          telegram_id: contact.user_id,
          full_name: contact.first_name || 'Mijoz',
          phone,
          role: 'customer',
        });
      }

      await ctx.reply('✅ Ro\'yxatdan o\'tdingiz!', Markup.removeKeyboard());
      await showMainMenu(ctx, webAppUrl);
    } catch (err) {
      console.error('Customer bot xatosi:', err);
      await ctx.reply('Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  });

  bot.launch().then(() => {
    console.log('Customer Bot ishga tushdi');
  }).catch((err) => {
    console.error('Customer Bot xatosi:', err.message);
  });

  return bot;
}

async function showMainMenu(ctx, webAppUrl) {
  await ctx.reply(
    'Buyurtma berish uchun quyidagi tugmani bosing:',
    Markup.keyboard([
      Markup.button.webApp('🛒 Buyurtma berish', webAppUrl),
    ]).resize()
  );
}

export async function notifyCustomerStatusChange(telegramId, orderId, status, message) {
  if (!bot) return false;
  
  try {
    const statusMessages = {
      confirmed: '✅ Buyurtmangiz tasdiqlandi!',
      preparing: '👨‍🍳 Buyurtmangiz tayyorlanmoqda...',
      on_the_way: '🚚 Buyurtmangiz yo\'lda!',
      delivered: '🎉 Buyurtmangiz yetkazildi!',
      cancelled: '❌ Buyurtmangiz bekor qilindi.',
    };

    const text = message || statusMessages[status] || `Buyurtma holati: ${status}`;
    await bot.telegram.sendMessage(telegramId, text);
    return true;
  } catch (err) {
    console.error('Customer notification xatosi:', err);
    return false;
  }
}

export function getCustomerBot() {
  return bot;
}
