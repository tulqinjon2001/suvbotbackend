import { Plan } from '../models/index.js';

export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      order: [['price', 'ASC']],
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { name, price, duration_days, max_users, max_products, features, is_active } = req.body;
    const plan = await Plan.create({
      name,
      price,
      duration_days: duration_days || 30,
      max_users,
      max_products,
      features,
      is_active: is_active !== undefined ? is_active : true,
    });
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan topilmadi' });
    const { name, price, duration_days, max_users, max_products, features, is_active } = req.body;
    await plan.update({
      name,
      price,
      duration_days,
      max_users,
      max_products,
      features,
      is_active,
    });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan topilmadi' });
    await plan.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
