import { Client, GatewayIntentBits, Interaction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Map to store loaded commands
(client as any).commands = new Map<string, any>();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`) as any;
  if ('data' in command && 'execute' in command) {
    (client as any).commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  console.log(`✅ 봇 로그인: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    await handleCommand(interaction as any);
  } else if (interaction.isButton()) {
    await handleButton(interaction as any);
  }
});

async function handleCommand(interaction: any) {
  const command = (interaction.client as any).commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const reply = { content: '❌ 명령 실행 중 오류가 발생했습니다.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}

async function handleButton(interaction: any) {
  let data;
  try {
    data = JSON.parse(interaction.customId);
  } catch (e) {
    console.error('버튼 customId 파싱 오류:', e);
    return;
  }
  const command = (interaction.client as any).commands.get(data?.cmd);
  if (command && typeof command.handleButton === 'function') {
    try {
      await command.handleButton(interaction);
    } catch (error) {
      console.error(error);
    }
  }
}

client.login(process.env.DISCORD_TOKEN);
