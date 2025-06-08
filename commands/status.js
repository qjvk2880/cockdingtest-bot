const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ongoingTests = require('../ongoing-tests');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('진행 중인 코딩 테스트 확인'),
  async execute(interaction) {
    const now = new Date();
    const active = ongoingTests.filter(t => t.endTime > now);

    if (active.length === 0) {
      return interaction.reply({ content: '진행중인 코딩 테스트가 없습니다.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('진행 중인 코딩 테스트')
      .setColor(0x0099ff);

    active.forEach((t, idx) => {
      const start = t.startTime.toLocaleTimeString('ko-KR');
      const end = t.endTime.toLocaleTimeString('ko-KR');
      const remaining = Math.max(0, Math.ceil((t.endTime - now) / 60000));
      embed.addFields({
        name: `${idx + 1}. ${start} ~ ${end}`,
        value: `<@${t.userId}> • 남은 시간 약 ${remaining}분`,
      });
    });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
