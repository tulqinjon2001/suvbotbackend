import { initCustomerBot } from './customerBot.js';
import { initStaffBot } from './staffBot.js';

let customerBot = null;
let staffBot = null;

export function startBots() {
  const customerToken = process.env.CUSTOMER_BOT_TOKEN;
  const staffToken = process.env.STAFF_BOT_TOKEN;
  const webAppUrl = process.env.WEB_APP_URL || 'http://localhost:3000/webapp';

  if (customerToken) {
    customerBot = initCustomerBot(customerToken, webAppUrl);
  }

  if (staffToken) {
    staffBot = initStaffBot(staffToken);
  }

  return { customerBot, staffBot };
}

export { notifyCustomerStatusChange } from './customerBot.js';
export { notifyOperatorsNewOrder } from './staffBot.js';
