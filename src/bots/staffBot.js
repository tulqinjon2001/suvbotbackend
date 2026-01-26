import { Telegraf, Markup } from 'telegraf';
import { User, Order, OrderItem, Product, Category } from '../models/index.js';

let bot = null;
let notifyOperatorsCallback = null;

export function initStaffBot(token) {
  if (!token) {
    console.warn('Staff Bot token topilmadi. Bot ishlamaydi.');
    return null;
  }

  bot = new Telegraf(token);

  bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    const existing = await User.findOne({ where: { telegram_id: telegramId } });
    
    if (existing && ['operator', 'picker', 'courier'].includes(existing.role)) {
      await ctx.reply(
        `Assalomu alaykum, ${existing.full_name}!\n\nRolingiz: ${getRoleLabel(existing.role)}`,
        Markup.removeKeyboard()
      );
      await showRoleMenu(ctx, existing.role);
      return;
    }

    await ctx.reply(
      'Assalomu alaykum! Xodimlar botiga kirish uchun telefon raqamingizni yuboring.',
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
      const user = await User.findOne({ where: { phone } });
      
      if (!user) {
        await ctx.reply('❌ Bu telefon raqam bazada topilmadi. Admin bilan bog\'laning.');
        return;
      }

      if (!['operator', 'picker', 'courier'].includes(user.role)) {
        await ctx.reply('❌ Kirish taqiqlangan. Siz xodim emassiz.');
        return;
      }

      if (user.telegram_id && user.telegram_id !== contact.user_id) {
        await ctx.reply('❌ Bu telefon raqam boshqa akkauntga bog\'langan.');
        return;
      }

      user.telegram_id = contact.user_id;
      await user.save();

      await ctx.reply('✅ Tizimga kirdingiz!', Markup.removeKeyboard());
      await ctx.reply(
        `Assalomu alaykum, ${user.full_name}!\n\nRolingiz: ${getRoleLabel(user.role)}`,
        Markup.removeKeyboard()
      );
      await showRoleMenu(ctx, user.role);
    } catch (err) {
      console.error('Staff bot xatosi:', err);
      await ctx.reply('Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  });

  bot.action(/^confirm_order_(\d+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match[1], 10);
    const user = await getUserByTelegramId(ctx.from.id);
    
    if (!user || user.role !== 'operator') {
      await ctx.answerCbQuery('Siz operator emassiz.');
      return;
    }

    try {
      const order = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          {
            model: OrderItem,
            as: 'OrderItems',
            include: [
              {
                model: Product,
                as: 'Product',
                include: [{ model: Category, as: 'Category' }],
              },
            ],
          },
        ],
      });
      
      if (!order) {
        await ctx.answerCbQuery('Buyurtma topilmadi.');
        return;
      }

      order.status = 'confirmed';
      await order.save();

      await ctx.editMessageText('✅ Buyurtma tasdiqlandi!');
      await ctx.answerCbQuery('Tasdiqlandi');

      // Yig'uvchilarga xabarnoma yuborish
      await notifyPickersNewConfirmedOrder(order);
    } catch (err) {
      console.error('Confirm order xatosi:', err);
      await ctx.answerCbQuery('Xatolik yuz berdi.');
    }
  });

  bot.action(/^picked_order_(\d+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match[1], 10);
    const user = await getUserByTelegramId(ctx.from.id);
    
    if (!user || user.role !== 'picker') {
      await ctx.answerCbQuery('Siz yig\'uvchi emassiz.');
      return;
    }

    try {
      const order = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          {
            model: OrderItem,
            as: 'OrderItems',
            include: [
              {
                model: Product,
                as: 'Product',
                include: [{ model: Category, as: 'Category' }],
              },
            ],
          },
        ],
      });
      
      if (!order) {
        await ctx.answerCbQuery('Buyurtma topilmadi.');
        return;
      }

      order.status = 'preparing';
      await order.save();

      await ctx.editMessageText('✅ Buyurtma yig\'ildi va tayyorlanmoqda!');
      await ctx.answerCbQuery('Yig\'ildi');

      // Kuryerlarga xabarnoma yuborish
      await notifyCouriersNewReadyOrder(order);
    } catch (err) {
      console.error('Picked order xatosi:', err);
      await ctx.answerCbQuery('Xatolik yuz berdi.');
    }
  });

  bot.action(/^accept_delivery_(\d+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match[1], 10);
    const user = await getUserByTelegramId(ctx.from.id);
    
    if (!user || user.role !== 'courier') {
      await ctx.answerCbQuery('Siz kuryer emassiz.');
      return;
    }

    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'customer' }],
      });
      
      if (!order) {
        await ctx.answerCbQuery('Buyurtma topilmadi.');
        return;
      }

      // Agar allaqachon boshqa kuryerga biriktirilgan bo'lsa
      if (order.courier_id && order.courier_id !== user.id) {
        await ctx.answerCbQuery('Bu buyurtma boshqa kuryerga biriktirilgan.');
        return;
      }

      order.courier_id = user.id;
      order.status = 'on_the_way';
      await order.save();

      await ctx.editMessageText('✅ Buyurtma qabul qilindi! Yo\'lga chiqing.');
      await ctx.answerCbQuery('Qabul qilindi');

      // Mijozga xabarnoma yuborish
      if (order.customer?.telegram_id) {
        await notifyCustomerStatusChange(
          order.customer.telegram_id,
          order.id,
          'on_the_way'
        );
      }
    } catch (err) {
      console.error('Accept delivery xatosi:', err);
      await ctx.answerCbQuery('Xatolik yuz berdi.');
    }
  });

  bot.action(/^delivered_order_(\d+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match[1], 10);
    const user = await getUserByTelegramId(ctx.from.id);
    
    if (!user || user.role !== 'courier') {
      await ctx.answerCbQuery('Siz kuryer emassiz.');
      return;
    }

    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'customer' }],
      });
      
      if (!order || order.courier_id !== user.id) {
        await ctx.answerCbQuery('Bu buyurtma sizga biriktirilmagan.');
        return;
      }

      order.status = 'delivered';
      await order.save();

      await ctx.editMessageText('✅ Buyurtma yetkazildi!');
      await ctx.answerCbQuery('Yetkazildi');

      // Mijozga xabarnoma yuborish
      if (order.customer?.telegram_id) {
        await notifyCustomerStatusChange(
          order.customer.telegram_id,
          order.id,
          'delivered'
        );
      }
    } catch (err) {
      console.error('Delivered order xatosi:', err);
      await ctx.answerCbQuery('Xatolik yuz berdi.');
    }
  });

  bot.action(/^payment_(\d+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match[1], 10);
    const user = await getUserByTelegramId(ctx.from.id);
    
    if (!user || user.role !== 'courier') {
      await ctx.answerCbQuery('Siz kuryer emassiz.');
      return;
    }

    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'customer' }],
      });
      
      if (!order || order.courier_id !== user.id) {
        await ctx.answerCbQuery('Bu buyurtma sizga biriktirilmagan.');
        return;
      }

      // Agar "Rahmat" orqali to'langan bo'lsa
      if (order.payment_type === 'rahmat') {
        await ctx.answerCbQuery('Bu buyurtma allaqachon online to\'langan!');
        return;
      }

      // Naqd to'lovni qabul qilish
      order.paid_amount = order.total_amount;
      await order.save();

      await ctx.answerCbQuery('✅ To\'lov qabul qilindi!');
      await ctx.reply(`✅ Buyurtma #${order.id} uchun ${Number(order.total_amount).toLocaleString()} so'm to'lov qabul qilindi.`);
    } catch (err) {
      console.error('Payment xatosi:', err);
      await ctx.answerCbQuery('Xatolik yuz berdi.');
    }
  });

  bot.command('orders', async (ctx) => {
    const user = await getUserByTelegramId(ctx.from.id);
    if (!user || !['operator', 'picker', 'courier'].includes(user.role)) {
      return;
    }
    await showRoleMenu(ctx, user.role);
  });

  bot.launch().then(() => {
    console.log('Staff Bot ishga tushdi');
  }).catch((err) => {
    console.error('Staff Bot xatosi:', err.message);
  });

  return bot;
}

async function getUserByTelegramId(telegramId) {
  return await User.findOne({ where: { telegram_id: telegramId } });
}

function getRoleLabel(role) {
  const labels = {
    operator: 'Operator',
    picker: 'Yig\'uvchi',
    courier: 'Kuryer',
  };
  return labels[role] || role;
}

async function showRoleMenu(ctx, role) {
  if (role === 'operator') {
    await showOperatorMenu(ctx);
  } else if (role === 'picker') {
    await showPickerMenu(ctx);
  } else if (role === 'courier') {
    await showCourierMenu(ctx);
  }
}

async function showOperatorMenu(ctx) {
  const orders = await Order.findAll({
    where: { status: 'new' },
    include: [
      { model: User, as: 'customer' },
      {
        model: OrderItem,
        as: 'OrderItems',
        include: [
          {
            model: Product,
            as: 'Product',
            include: [{ model: Category, as: 'Category' }],
          },
        ],
      },
    ],
    order: [['id', 'DESC']],
    limit: 10,
  });

  if (orders.length === 0) {
    await ctx.reply('Yangi buyurtmalar yo\'q.');
    return;
  }

  for (const order of orders) {
    const text = formatOrderForOperator(order);
    await ctx.reply(text, Markup.inlineKeyboard([
      Markup.button.callback('✅ Tasdiqlash', `confirm_order_${order.id}`),
    ]));
  }
}

async function showPickerMenu(ctx) {
  const orders = await Order.findAll({
    where: { status: 'confirmed' },
    include: [
      { model: User, as: 'customer' },
      {
        model: OrderItem,
        as: 'OrderItems',
        include: [
          {
            model: Product,
            as: 'Product',
            include: [{ model: Category, as: 'Category' }],
          },
        ],
      },
    ],
    order: [['id', 'DESC']],
    limit: 10,
  });

  if (orders.length === 0) {
    await ctx.reply('Tasdiqlangan buyurtmalar yo\'q.');
    return;
  }

  for (const order of orders) {
    const text = formatOrderForPicker(order);
    await ctx.reply(text, Markup.inlineKeyboard([
      Markup.button.url('📄 PDF yuklash', `https://example.com/orders/${order.id}/pdf`),
      Markup.button.callback('✅ Yig\'ildi', `picked_order_${order.id}`),
    ]));
  }
}

async function showCourierMenu(ctx) {
  const user = await getUserByTelegramId(ctx.from.id);
  const orders = await Order.findAll({
    where: { 
      status: 'on_the_way',
      courier_id: user.id,
    },
    include: [{ model: User, as: 'customer' }],
    order: [['id', 'DESC']],
  });

  if (orders.length === 0) {
    await ctx.reply('Sizga biriktirilgan buyurtmalar yo\'q.');
    return;
  }

  for (const order of orders) {
    const text = formatOrderForCourier(order);
    const buttons = [];
    
    // Xaritada ko'rish tugmalari (agar lokatsiya bo'lsa)
    if (order.location_lat && order.location_long) {
      buttons.push([
        Markup.button.url('🗺️ Google Maps', `https://www.google.com/maps?q=${order.location_lat},${order.location_long}`),
        Markup.button.url('🗺️ Yandex Maps', `https://yandex.uz/maps/?pt=${order.location_long},${order.location_lat}&z=16&l=map`)
      ]);
    }
    
    // Amallar tugmalari
    const actionButtons = [
      Markup.button.callback('✅ Yetkazildi', `delivered_order_${order.id}`)
    ];
    
    // Faqat naqd to'lov va to'lanmagan bo'lsa "To'lovni olish" tugmasini ko'rsatish
    if (order.payment_type === 'cash' && order.paid_amount < order.total_amount) {
      actionButtons.push(Markup.button.callback('💰 To\'lovni olish', `payment_${order.id}`));
    }
    
    buttons.push(actionButtons);
    
    await ctx.reply(text, Markup.inlineKeyboard(buttons));
  }
}

function formatOrderForOperator(order) {
  const items = order.OrderItems?.map((item, index) => 
    `${index + 1}. ${item.Product?.name || 'Noma\'lum'}\n   ${item.quantity} dona × ${Number(item.price_at_purchase).toLocaleString()} SUM = ${Number(item.price_at_purchase * item.quantity).toLocaleString()} SUM`
  ).join('\n\n') || 'Mahsulotlar topilmadi';

  const paymentTypeLabel = order.payment_type === 'rahmat' ? 'Rahmat (Online)' : 'Naqd';
  const paymentStatus = order.payment_type === 'rahmat' 
    ? '✅ To\'langan' 
    : '❌ To\'lanmagan';

  const itemCount = order.OrderItems?.length || 0;

  return `📦 Yangi buyurtma #${order.id}

👤 Mijoz: ${order.customer?.full_name || 'Noma\'lum'}
📞 Telefon: ${order.customer?.phone || 'Noma\'lum'}
📍 Manzil: ${order.address || 'Ko\'rsatilmagan'}
💰 Jami: ${Number(order.total_amount).toLocaleString()} SUM
💳 To'lov: ${paymentTypeLabel}
${paymentStatus}

🛒 MAHSULOTLAR (${itemCount} ta)

${items}`;
}

function formatOrderForPicker(order) {
  const items = order.OrderItems?.map((item, index) => 
    `${index + 1}. ${item.Product?.name || 'Noma\'lum'}\n   ${item.quantity} dona`
  ).join('\n\n') || 'Mahsulotlar topilmadi';

  const itemCount = order.OrderItems?.length || 0;

  return `📦 Buyurtma #${order.id}

👤 Mijoz: ${order.customer?.full_name || 'Noma\'lum'}
📞 Telefon: ${order.customer?.phone || 'Noma\'lum'}
📍 Manzil: ${order.address || 'Ko\'rsatilmagan'}

🛒 MAHSULOTLAR (${itemCount} ta)

${items}`;
}

function formatOrderForCourier(order) {
  const paymentTypeLabel = order.payment_type === 'rahmat' ? 'Rahmat (Online)' : 'Naqd';
  const paymentStatus = order.payment_type === 'rahmat' 
    ? '✅ To\'langan' 
    : order.paid_amount >= order.total_amount 
      ? '✅ To\'langan' 
      : '❌ To\'lanmagan';

  return `🚚 Buyurtma #${order.id}

👤 Mijoz: ${order.customer?.full_name || 'Noma\'lum'}
📞 Telefon: ${order.customer?.phone || 'Noma\'lum'}
📍 Manzil: ${order.address || 'Ko\'rsatilmagan'}
💰 Jami: ${Number(order.total_amount).toLocaleString()} SUM
💳 To'lov: ${paymentTypeLabel}
${paymentStatus}`;
}

export async function notifyOperatorsNewOrder(order) {
  if (!bot) return;

  const operators = await User.findAll({ where: { role: 'operator' } });
  const orderWithDetails = await Order.findByPk(order.id, {
    include: [
      { model: User, as: 'customer' },
      {
        model: OrderItem,
        as: 'OrderItems',
        include: [
          {
            model: Product,
            as: 'Product',
            include: [{ model: Category, as: 'Category' }],
          },
        ],
      },
    ],
  });

  const text = formatOrderForOperator(orderWithDetails);

  for (const operator of operators) {
    if (operator.telegram_id) {
      try {
        const buttons = [];
        
        // Xaritada ko'rish tugmalari (agar lokatsiya bo'lsa)
        if (orderWithDetails.location_lat && orderWithDetails.location_long) {
          buttons.push([
            Markup.button.url('🗺️ Google Maps', `https://www.google.com/maps?q=${orderWithDetails.location_lat},${orderWithDetails.location_long}`),
            Markup.button.url('🗺️ Yandex Maps', `https://yandex.uz/maps/?pt=${orderWithDetails.location_long},${orderWithDetails.location_lat}&z=16&l=map`)
          ]);
        }
        
        // Tasdiqlash tugmasi
        buttons.push([
          Markup.button.callback('✅ Tasdiqlash', `confirm_order_${order.id}`)
        ]);
        
        await bot.telegram.sendMessage(
          operator.telegram_id,
          `🔔 Yangi buyurtma!\n\n${text}`,
          Markup.inlineKeyboard(buttons)
        );
      } catch (err) {
        console.error(`Operator ${operator.id} ga xabar yuborishda xatolik:`, err);
      }
    }
  }
}

async function notifyPickersNewConfirmedOrder(order) {
  if (!bot) return;

  const pickers = await User.findAll({ where: { role: 'picker' } });
  const text = formatOrderForPicker(order);

  for (const picker of pickers) {
    if (picker.telegram_id) {
      try {
        await bot.telegram.sendMessage(
          picker.telegram_id,
          `🔔 Yangi tasdiqlangan buyurtma!\n\n${text}`,
          Markup.inlineKeyboard([
            Markup.button.url('📄 PDF yuklash', `https://example.com/orders/${order.id}/pdf`),
            Markup.button.callback('✅ Yig\'ildi', `picked_order_${order.id}`),
          ])
        );
      } catch (err) {
        console.error(`Yig'uvchi ${picker.id} ga xabar yuborishda xatolik:`, err);
      }
    }
  }
}

async function notifyCouriersNewReadyOrder(order) {
  if (!bot) return;

  const couriers = await User.findAll({ where: { role: 'courier' } });
  const text = formatOrderForCourier(order);

  for (const courier of couriers) {
    if (courier.telegram_id) {
      try {
        const buttons = [];
        
        // Xaritada ko'rish tugmalari (agar lokatsiya bo'lsa)
        if (order.location_lat && order.location_long) {
          buttons.push([
            Markup.button.url('🗺️ Google Maps', `https://www.google.com/maps?q=${order.location_lat},${order.location_long}`),
            Markup.button.url('🗺️ Yandex Maps', `https://yandex.uz/maps/?pt=${order.location_long},${order.location_lat}&z=16&l=map`)
          ]);
        }
        
        // Qabul qilish tugmasi
        buttons.push([
          Markup.button.callback('✅ Qabul qilish', `accept_delivery_${order.id}`)
        ]);
        
        await bot.telegram.sendMessage(
          courier.telegram_id,
          `🔔 Yangi yig'ilgan buyurtma!\n\n${text}`,
          Markup.inlineKeyboard(buttons)
        );
      } catch (err) {
        console.error(`Kuryer ${courier.id} ga xabar yuborishda xatolik:`, err);
      }
    }
  }
}

export function getStaffBot() {
  return bot;
}
