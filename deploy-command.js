const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('코딩 테스트 타이머 시작')
    .addIntegerOption(opt =>
      opt.setName('duration')
        .setDescription('시험 시간 (분 단위)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('starttime')
        .setDescription('시작 시각 (HH:mm)')
        .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('📡 Slash Command 등록 중...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('✅ 등록 완료!');
  } catch (error) {
    console.error(error);
  }
})();
