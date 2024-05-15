import { Client, Message, Interaction, CommandInteraction, Events } from 'discord.js';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { data } from './commands/main';
import channelList from '../channel-list.json'

dotenv.config();

const version = '2.2';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const defaultModel = 'gpt-3.5-turbo-1106';
const plusModel = 'gpt-4o';
const systemContent = process.env.SYSTEM_PROMPT ?? '';
let debugModel = plusModel;

interface Channel {
  id: string;
  name: string;
  mode: string;
}

const getModel = (mode: string) => {
  switch (mode) {
    case "default":
      return defaultModel;
    case "plus":
      return plusModel;
    case "debug":
      return debugModel;
    default:
      return;
  }
}

const getChannelMode = (channelId: string) => {
  return channelList.find((channel: Channel) => channel.id === channelId)?.mode;
}

const isCommand = async (message: Message, model: string) => {
  const args = message.content.split(' ');

  if (message.content.includes('!ignore') || message.content.includes('!ig')) {
    // 何もしない
  }
  else if (message.content === '!model') {
    message.channel.send(`現在のモデルは${model}です。`);
  }
  else if (message.content.includes('!setmodel')) {
    if (args.length === 2) {
      if (args[1] === 'default') {
        debugModel = defaultModel;
        message.channel.send(`モデルを${defaultModel}に設定しました。`);
      }
      else if (args[1] === 'plus') {
        debugModel = plusModel;
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

const getImageExplanation = async (message: Message) => {
  const file = message.attachments.first();
  const textContent = message.content ? message.content : "この画像について説明してください。"

  if (file?.height && file?.width) {
    if (file.contentType?.includes('image')) {
      message.channel.sendTyping();
      const completion = await openai.chat.completions.create({
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": textContent
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": file.url,
                  "detail": "low"
                }
              }
            ]
          }
        ],
        model: 'gpt-4o',
        max_tokens: 300,
      });

      return completion.choices[0].message.content ?? 'null';
    }
    else {
      return undefined;
    }
  }
  else {
    return undefined;
  }
}

const sendMessage = async (message: Message, model: string) => {
  if (await isCommand(message, model)) return;

  let content = message.content;

  if (model === plusModel) {
    const imageExplanation = await getImageExplanation(message);

    if (imageExplanation) {
      content = process.env.IMAGE_PROMPT + imageExplanation;
    }
  }

  message.channel.sendTyping();
  const completion = await openai.chat.completions.create({
    messages: [
      {
        "role": "system",
        "content": systemContent
      },
      {
        "role": "user",
        "content": content
      }
    ],
    model: model,
  });

  message.channel.send(completion.choices[0].message.content ?? 'null');
}

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
  if (message.content.startsWith('https://')) return;

  const mode = getChannelMode(message.channelId);
  switch (mode) {
    case "default":
      sendMessage(message, defaultModel);
      break;
    case "plus":
      sendMessage(message, plusModel);
      break;
    case "debug":
      sendMessage(message, debugModel);
      break;
    default:
      return;
  }
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const mode = getChannelMode(interaction.channelId);
  if (!mode) {
    await interaction.reply('このチャンネルではBOTを利用できません');
    return;
  }

  const commandInteraction = interaction as CommandInteraction;
  console.log(commandInteraction.commandName);

  switch (commandInteraction.commandName) {
    case 'test':
      await commandInteraction.reply('テストっぽいテキスト');
      break;
    case 'version':
      await commandInteraction.reply('現在のバージョンは' + version + 'です');
      break;
    case 'model':
      await commandInteraction.reply('現在のGPTモデルは' + getModel(mode) + 'です');
      break;
    case 'setmodel':
      const model = commandInteraction.options.get('model', true)?.value as string;
      if (model === 'default') {
        debugModel = defaultModel;
        await commandInteraction.reply('モデルを' + defaultModel + 'に設定しました');
      }
      else if (model === 'plus') {
        debugModel = plusModel;
        await commandInteraction.reply('モデルを' + plusModel + 'に設定しました');
      }
      else {
        await commandInteraction.reply('存在しないモデルです');
      }
      break;
    default:
      break;
  }
});

client.login(process.env.DISCORD_TOKEN);
