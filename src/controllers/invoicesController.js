import { Invoice, Account, Subscription } from '../models/index.js';

export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'business_name'],
        },
        {
          model: Subscription,
          as: 'subscription',
          attributes: ['id', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'business_name', 'status'],
        },
        {
          model: Subscription,
          as: 'subscription',
          attributes: ['id', 'status', 'starts_at', 'ends_at'],
        },
      ],
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice topilmadi' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markInvoiceAsPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice topilmadi' });
    
    await invoice.update({
      status: 'paid',
      paid_at: new Date(),
    });
    
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
