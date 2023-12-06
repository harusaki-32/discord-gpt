import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { data } from "./commands/main";

dotenv.config();

const clientId = process.env.CLIENT_ID ?? "";
const guildId = process.env.GUILD_ID ?? "";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN ?? "");

(async () => {
  try {
    console.log("アプリケーションコマンドを登録します");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: data });

    console.log("アプリケーションコマンドの登録に成功しました");
  } catch (error) {
    console.error(error);
  }
}
)();