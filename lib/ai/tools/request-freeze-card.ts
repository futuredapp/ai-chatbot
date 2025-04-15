import { tool } from 'ai';
import { z } from 'zod';

export const requestFreezeCard = tool({
  description: 'Call this action when you need to request a freeze card for a user. This tool should be called by everyone who needs to initiate a freeze card request. No parameters are required.',
  parameters: z.object({}),
  execute: async () => {
    return { message: 'Freeze card request has been initiated.' };
  },
}); 