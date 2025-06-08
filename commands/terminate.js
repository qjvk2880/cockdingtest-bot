const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ongoingTests = require('../ongoing-tests');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('terminate')
    .setDescription('진행 중인 테스트 강제 종료'),
  async execute(interaction) {
    const now = new Date();
    const active = ongoingTests.filter(t => t.endTime > now);

    if (active.length === 0) {
      return interaction.reply({
        content: '진행중인 코딩 테스트가 없습니다.',
        ephemeral: true,
      });
    }

    const description = active
      .map(
        (t, i) =>
          `${i + 1}. ${t.startTime.toLocaleTimeString('ko-KR')} ~ ${t.endTime.toLocaleTimeString('ko-KR')} (<@${t.userId}>)`
      )
      .join('\n');

    const components = active.map(t =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`terminate_${t.id}`)
          .setLabel('종료')
          .setStyle(ButtonStyle.Danger)
      )
    );

    return interaction.reply({
      content: description,
      components,
      ephemeral: true,
    });
  },
};
