import { Subscription, Account, Plan } from '../models/index.js';

export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'business_name', 'status'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'name', 'price', 'duration_days'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const { account_id, plan_id, starts_at, ends_at } = req.body;

    // Plan va Account mavjudligini tekshirish
    const plan = await Plan.findByPk(plan_id);
    if (!plan) return res.status(404).json({ error: 'Plan topilmadi' });

    const account = await Account.findByPk(account_id);
    if (!account) return res.status(404).json({ error: 'Account topilmadi' });

    const subscription = await Subscription.create({
      account_id,
      plan_id,
      starts_at: starts_at || new Date(),
      ends_at: ends_at || (() => {
        const endDate = new Date(starts_at || new Date());
        endDate.setDate(endDate.getDate() + plan.duration_days);
        return endDate;
      })(),
      status: 'active',
    });

    // Account statusni yangilash
    if (account.status === 'trial') {
      await account.update({ status: 'active' });
    }

    res.status(201).json(subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) return res.status(404).json({ error: 'Subscription topilmadi' });
    
    await subscription.update({
      status: 'cancelled',
      cancelled_at: new Date(),
    });
    
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
