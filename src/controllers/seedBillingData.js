import { Plan } from '../models/index.js';

export async function seedDefaultPlans() {
  try {
    const count = await Plan.count();
    if (count > 0) {
      console.log('Default plans allaqachon mavjud.');
      return;
    }

    // Default plans yaratish
    await Plan.bulkCreate([
      {
        name: 'Basic',
        price: 0,
        duration_days: 30,
        max_users: 5,
        max_products: 50,
        features: {
          basic_support: true,
          api_access: false,
        },
      },
      {
        name: 'Professional',
        price: 29.99,
        duration_days: 30,
        max_users: 20,
        max_products: 200,
        features: {
          basic_support: true,
          priority_support: true,
          api_access: true,
        },
      },
      {
        name: 'Enterprise',
        price: 99.99,
        duration_days: 30,
        max_users: -1, // Unlimited
        max_products: -1, // Unlimited
        features: {
          basic_support: true,
          priority_support: true,
          api_access: true,
          custom_integrations: true,
        },
      },
    ]);

    console.log('Default plans yaratildi: Basic, Professional, Enterprise');
  } catch (err) {
    console.error('Default plans yaratishda xatolik:', err);
  }
}
