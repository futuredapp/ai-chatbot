export const DEFAULT_CHAT_MODEL: string = 'chat-model-custom';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-custom',
    name: 'Bankový asistent',
    description: 'Asistent pre používanie bankovej aplikácie a finančné služby',
  }
];
