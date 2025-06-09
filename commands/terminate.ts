import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';
import ongoingTests from '../ongoing-tests';

export default {
  data: new SlashCommandBuilder()
    .setName('terminate')
    .setDescription('진행 중인 코딩 테스트 강제 종료'),
  async execute(interaction: ChatInputCommandInteraction) {
    const now = new Date();
    const active = ongoingTests.filter(t => t.endTime > now);

    if (active.length === 0) {
      return interaction.reply({ content: '진행중인 코딩 테스트가 없습니다.', ephemeral: true });
    }

    const description = active.map((t, idx) => {
      const label = t.label || `${t.startTime.toLocaleTimeString('ko-KR')} ~ ${t.endTime.toLocaleTimeString('ko-KR')}`;
      const remaining = Math.max(0, Math.ceil((t.endTime.getTime() - now.getTime()) / 60000));
      return `${idx + 1}. ${label} • 남은 시간 약 ${remaining}분`;
    }).join('\n');

    const components = active.map((t, idx) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(JSON.stringify({ cmd: 'terminate', idx }))
          .setLabel(`${idx + 1}번 종료`)
          .setStyle(ButtonStyle.Danger),
      )
    );

    return interaction.reply({
      content: description,
      components: components as any,
      ephemeral: true,
    });
  },
  async handleButton(interaction: ButtonInteraction) {
    let data;
    try {
      data = JSON.parse(interaction.customId);
    } catch (e) {
      return interaction.update({ content: '버튼 정보 파싱 오류', components: [] });
    }
    const idx = data?.idx;
    const test = ongoingTests[idx];
    if (!test) {
      return interaction.update({ content: '이미 종료된 테스트입니다.', components: [] });
    }
    test.timeouts.forEach((t: NodeJS.Timeout) => clearTimeout(t));
    ongoingTests.splice(idx, 1);
    const testName = test.label || `${test.startTime.toLocaleTimeString('ko-KR')} ~ ${test.endTime.toLocaleTimeString('ko-KR')}`;
    await interaction.update({ content: `${testName} 테스트 종료`, components: [] });
    await (interaction.channel as any).send(`**${testName} 테스트가 <@${interaction.user.id}>에 의해 강제 종료되었습니다.**`);
  },
};
