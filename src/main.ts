import { Client, Message } from 'discord.js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const isCommand = async (message: Message, currentModel: string) => {
  const args = message.content.split(' ');

  if (message.content.includes('!ignore') || message.content.includes('!ig')) {
    // 何もしない
  }
  else if (message.content === '!model') {
    message.channel.send(`現在のモデルは${currentModel}です。`);
  }
  else if (message.content.includes('!setmodel')) {
    if (args.length === 2) {
      if (args[1] === 'default') {
        model = defaultModel;
        message.channel.send(`モデルを${defaultModel}に設定しました。`);
      }
      else if (args[1] === 'plus') {
        model = plusModel;
        message.channel.send(`モデルを${plusModel}に設定しました。`);
      }
      else {
        message.channel.send('存在しないモデルです。');
      }
    }
    else {
      message.channel.send('引数の数が不正です。');
    }
  }
  else if (args[0] === '!reply' || args[0] === '!r') {
    if (args.length !== 2) {
      message.channel.send('引数の数が不正です。');
      return true;
    }
    
    let before = 1;

    try {
      before = Number(args[1]);
      if (before < 1) {
        throw new Error();
      }
    }
    catch {
      message.channel.send('引数の数が不正です。');
      return true;
    }

    const discordMessages = await message.channel.messages.fetch({ limit: before, before: message.id });
    const beforeMessage = discordMessages.first(before).reverse();

    message.channel.sendTyping();
    const completion = await openai.chat.completions.create({
      messages: [
        {
          "role": "system",
          "content": systemContent
        },
        {
          "role": "user",
          "content": beforeMessage[0].content
        }
      ],
      model: model,
    });

    beforeMessage[0].reply(completion.choices[0].message.content ?? 'null');
  }
  else if (message.content[0] === '!') {
    message.channel.send('存在しないコマンドです。');
  }
  else {
    return false;
  }

  return true;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const defaultModel = 'gpt-3.5-turbo-1106';
const plusModel = 'gpt-4-1106-preview';
let model = defaultModel;

const systemContent = process.env.SYSTEM_PROMPT ?? '';

const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});

client.once('ready', () => {
  console.log('準備完了!');
  console.log(`BOT Name: ${client.user?.tag}`);
  console.log(`Default GPT Model: ${defaultModel}`);
});

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;

  // Default
  if (message.channelId === process.env.DEFAULT_CHANNEL_ID) {
    model = defaultModel;
  }
  // Plus
  else if (message.channelId === process.env.PLUS_CHANNEL_ID) {
    model = plusModel;
  }
  else if (message.channelId === process.env.DEBUG_CHANNEL_ID) {
    console.log('debug channel');
  }
  else {
    return;
  }

  if (await isCommand(message, model)) return;

  message.channel.sendTyping();
  const completion = await openai.chat.completions.create({
    messages: [
      {
        "role": "system",
        "content": systemContent
      },
      {
        "role": "user",
        "content": message.content
      }
    ],
    model: model,
  });

  message.channel.send(completion.choices[0].message.content ?? 'null');
});

client.login(process.env.DISCORD_TOKEN);
