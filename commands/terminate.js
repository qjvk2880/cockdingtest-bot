const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ongoingTests = require('../ongoing-tests');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('terminate')
    .setDescription('진행 중인 코딩 테스트 강제 종료'),
  async execute(interaction) {
    const now = new Date();
    const active = ongoingTests.filter(t => t.endTime > now);

    if (active.length === 0) {
      return interaction.reply({ content: '진행중인 코딩 테스트가 없습니다.', ephemeral: true });
    }

    const description = active.map((t, idx) => {
      const label = t.label || `${t.startTime.toLocaleTimeString('ko-KR')} ~ ${t.endTime.toLocaleTimeString('ko-KR')}`;
      const remaining = Math.max(0, Math.ceil((t.endTime - now) / 60000));
      return `${idx + 1}. ${label} • 남은 시간 약 ${remaining}분`;
    }).join('\n');

    const components = active.map((t, idx) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`terminate_${idx}`)
          .setLabel(`${idx + 1}번 종료`)
          .setStyle(ButtonStyle.Danger),
      )
    );

    return interaction.reply({
      content: description,
      components,
      ephemeral: true,
    });
  },
  async handleButton(interaction) {
    const idx = parseInt(interaction.customId.split('_')[1], 10);
    const test = ongoingTests[idx];
    if (!test) {
      return interaction.update({ content: '이미 종료된 테스트입니다.', components: [] });
    }
    test.timeouts.forEach(t => clearTimeout(t));
    ongoingTests.splice(idx, 1);
    const testName = test.label || `${test.startTime.toLocaleTimeString('ko-KR')} ~ ${test.endTime.toLocaleTimeString('ko-KR')}`;
    await interaction.update({ content: `${testName} 테스트 종료`, components: [] });
    await interaction.channel.send(`**${testName} 테스트가 <@${interaction.user.id}>에 의해 강제 종료되었습니다.**`);
  },
};
