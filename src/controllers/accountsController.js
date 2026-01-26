import { Account, Admin } from '../models/index.js';

export const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'username'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'username'],
        },
      ],
    });
    if (!account) return res.status(404).json({ error: 'Account topilmadi' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account topilmadi' });
    const { business_name, status, trial_ends_at } = req.body;
    await account.update({
      business_name,
      status,
      trial_ends_at,
    });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
