import { Order, User, OrderItem, Product, Category } from '../models/index.js';
import { notifyOperatorsNewOrder } from '../bots/index.js';
import { notifyCustomerStatusChange } from '../bots/index.js';

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['id', 'DESC']],
      include: [
        { model: User, as: 'customer', attributes: ['id', 'full_name', 'phone'] },
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [
            {
              model: Product,
              as: 'Product',
              include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }],
            },
          ],
        },
      ],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'full_name', 'phone'] },
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [
            {
              model: Product,
              as: 'Product',
              include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }],
            },
          ],
        },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { customer_id, items, address, location_lat, location_long, payment_type } = req.body;
    
    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'customer_id va items (array) talab qilinadi' });
    }

    const customer = await User.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Mijoz topilmadi' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        return res.status(404).json({ error: `Mahsulot ${item.product_id} topilmadi` });
      }
      const price = Number(product.price);
      const quantity = Number(item.quantity) || 1;
      const subtotal = price * quantity;
      totalAmount += subtotal;
      orderItems.push({
        product_id: product.id,
        quantity,
        price_at_purchase: price,
      });
    }

    // To'lov turini asosida paid_amount ni belgilash
    const paidAmount = payment_type === 'rahmat' ? totalAmount : 0;

    const order = await Order.create({
      customer_id,
      status: 'new',
      total_amount: totalAmount,
      paid_amount: paidAmount,
      address: address || null,
      location_lat: location_lat || null,
      location_long: location_long || null,
      payment_type: payment_type || 'cash',
    });

    for (const item of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        ...item,
      });
    }

    const orderWithDetails = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'customer' },
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [{ model: Product, as: 'Product' }],
        },
      ],
    });

    // Bot notification - xatolik bo'lsa ham order yaratiladi
    try {
      await notifyOperatorsNewOrder(orderWithDetails);
    } catch (botError) {
      console.error('Bot notification xatosi:', botError.message);
      // Bot xatosi order yaratishni to'xtatmaydi
    }

    res.status(201).json(orderWithDetails);
  } catch (err) {
    console.error('createOrder xatosi:', err);
    console.error('createOrder xatosi stack:', err.stack);
    res.status(500).json({ 
      error: err.message || 'Buyurtma yaratishda xatolik yuz berdi',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, courier_id } = req.body;

    const order = await Order.findByPk(id, {
      include: [{ model: User, as: 'customer' }],
    });

    if (!order) {
      return res.status(404).json({ error: 'Buyurtma topilmadi' });
    }

    const oldStatus = order.status;

    if (status) {
      order.status = status;
    }
    if (courier_id !== undefined) {
      order.courier_id = courier_id;
    }

    await order.save();

    if (status && status !== oldStatus && order.customer?.telegram_id) {
      await notifyCustomerStatusChange(
        order.customer.telegram_id,
        order.id,
        status
      );
    }

    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: User, as: 'customer' },
        { model: OrderItem, include: [{ model: Product }] },
      ],
    });

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
