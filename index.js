const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ongoingTests = require('./ongoing-tests');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  console.log(`✅ 봇 로그인: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('terminate_')) {
      const id = Number(interaction.customId.split('_')[1]);
      const test = ongoingTests.find(t => t.id === id);
      if (!test) {
        return interaction.reply({ content: '이미 종료된 테스트입니다.', ephemeral: true });
      }
      const idx = ongoingTests.indexOf(test);
      if (idx !== -1) ongoingTests.splice(idx, 1);
      await interaction.channel.send(`**코딩 테스트가 ${interaction.user}에 의해 강제 종료되었습니다.**`);
      return interaction.update({ content: '테스트를 종료했습니다.', components: [] });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
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
});

client.login(process.env.DISCORD_TOKEN);
