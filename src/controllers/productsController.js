import { Product, Category } from '../models/index.js';

export const getAllProducts = async (req, res) => {
  try {
    const { category_id } = req.query;
    const where = category_id ? { category_id } : {};
    const products = await Product.findAll({
      where,
      order: [['id', 'DESC']],
      include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }],
    });
    if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, price, image_url, category_id } = req.body;
    const product = await Product.create({ name, price, image_url, category_id });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    const { name, price, image_url, category_id } = req.body;
    await product.update({ name, price, image_url, category_id });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    await product.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
