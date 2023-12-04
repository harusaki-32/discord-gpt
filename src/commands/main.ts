import { SlashCommandBuilder, ButtonInteraction, Interaction, CommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('test')
  .setDescription('テスト用コマンドです');

export const execute = async (interaction: CommandInteraction) => {
  await interaction.reply('テスト');
}