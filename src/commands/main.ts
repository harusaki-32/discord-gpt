import { SlashCommandBuilder, ButtonInteraction, Interaction, CommandInteraction } from 'discord.js';

export const data = [
  new SlashCommandBuilder().setName('test').setDescription('テスト用コマンドです'),
  new SlashCommandBuilder().setName('version').setDescription('先生の現在のバージョンを表示します'),
  new SlashCommandBuilder().setName('model').setDescription('現在のGPTモデルを表示します(Debug用)'),
  new SlashCommandBuilder().setName('setmodel').setDescription('GPTモデルを設定します(Debug用)')
    .addStringOption(option => option.setName('model').setDescription('設定するモデル名').setRequired(true)),
];