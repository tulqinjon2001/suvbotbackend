import sequelize from '../config/database.js';
import Category from './Category.js';
import Product from './Product.js';
import User from './User.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Admin from './Admin.js';
import AccountDef from './Account.js';
import PlanDef from './Plan.js';
import SubscriptionDef from './Subscription.js';
import InvoiceDef from './Invoice.js';
import UsageTrackingDef from './UsageTracking.js';
import SuperAdminDef from './SuperAdmin.js';

// Billing models use function pattern
const Account = AccountDef(sequelize);
const Plan = PlanDef(sequelize);
const Subscription = SubscriptionDef(sequelize);
const Invoice = InvoiceDef(sequelize);
const UsageTracking = UsageTrackingDef(sequelize);
const SuperAdmin = SuperAdminDef(sequelize);

// Billing associations
Admin.hasOne(Account, { foreignKey: 'admin_id', as: 'account' });
Account.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin' });

Account.hasMany(Subscription, { foreignKey: 'account_id', as: 'subscriptions' });
Subscription.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

Plan.hasMany(Subscription, { foreignKey: 'plan_id', as: 'subscriptions' });
Subscription.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });

Account.hasMany(Invoice, { foreignKey: 'account_id', as: 'invoices' });
Invoice.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

Subscription.hasMany(Invoice, { foreignKey: 'subscription_id', as: 'invoices' });
Invoice.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription' });

Account.hasMany(UsageTracking, { foreignKey: 'account_id', as: 'usage' });
UsageTracking.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

export { sequelize, Category, Product, User, Order, OrderItem, Admin, Account, Plan, Subscription, Invoice, UsageTracking, SuperAdmin };
