import { tool } from 'ai';
import { z } from 'zod';

export const requestMoneyTransfer = tool({
  description: 'Call this action when user asks to transfer money to another user. This action doesnt transfer money, it only requests the user to transfer money.',
  parameters: z.object({
    userId: z.string(),
    amountInEuros: z.number(),
  }),
  execute: async ({ userId, amountInEuros }) => {
    return { userId, amountInEuros };
  },
});

// Global user map for slot names (user IDs)
export interface UserInfo {
  name: string;
  eBankCode: string;
  currency: string;
}

export const userMap: { [key: string]: UserInfo } = {
  'ID123': {
    name: 'Michal Horňák',
    eBankCode: 'SK57 0900 0000 0051 2345 6789',
    currency: 'EUR',
  },
  'ID456': {
    name: 'Tomáš Novák',
    eBankCode: 'SK32 1100 0000 0029 8765 4321',
    currency: 'EUR',
  },
  'ID789': {
    name: 'Peter Kováč',
    eBankCode: 'SK68 0200 0000 0012 3456 7890',
    currency: 'EUR',
  },
};

// Create a string representation of the user map for use in LLM prompts
export const userMapString = Object.entries(userMap)
  .map(([id, info]) => {
    return `User ID: ${id}, Name: ${info.name}, IBAN/e-bank code: ${info.eBankCode}, Currency: ${info.currency}`;
  })
  .join('\n');
