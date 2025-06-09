import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
} from 'discord.js';
import ongoingTests from '../ongoing-tests';
import { concludeTest } from '../test-utils';

const predefinedSchedules = {
  180: [90, 60, 30, 10],
  120: [60, 30, 10],
  90: [45, 30, 10],
  60: [30, 10],
  30: [10],
};
const defaultSchedule = [30, 10];

function parseTimeToFutureToday(timeStr: string): Date {
  const [hour, minute] = timeStr.split(':').map(Number);
  const now = new Date();
  const startTime = new Date(now);
  startTime.setHours(hour, minute, 0, 0);
  if (startTime < now) startTime.setDate(startTime.getDate() + 1);
  return startTime;
}

export default {
  data: new SlashCommandBuilder()
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
    .addIntegerOption(opt =>
      opt.setName('participants')
        .setDescription('참가 인원 수')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const duration = interaction.options.getInteger('duration', true);
    const timeStr = interaction.options.getString('starttime', true);
    const participants = interaction.options.getInteger('participants', true);

    if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
      return interaction.reply('❌ 시작 시각은 00:00~23:59 형식으로 입력해주세요.');
    }
    const startTime = parseTimeToFutureToday(timeStr);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const now = new Date();
    const msUntilStart = startTime.getTime() - now.getTime();
    const schedule = (predefinedSchedules as any)[duration] || defaultSchedule;

  const label = `${startTime.toLocaleTimeString('ko-KR')} ~ ${endTime.toLocaleTimeString('ko-KR')}`;
  const testInfo = {
    startTime,
    endTime,
    userId: interaction.user.id,
    duration,
    timeouts: [] as NodeJS.Timeout[],
    label,
    participants,
    channelId: interaction.channelId,
    scores: {} as Record<string, { name: string; score: number }>,
    ended: false,
  };
  ongoingTests.push(testInfo);

  await interaction.reply(`🧠 ${startTime.toLocaleTimeString('ko-KR')}에 코딩테스트 시작 (⏱ ${duration}분)`);

  const startTimeout = setTimeout(() => {
    interaction.followUp('🚀 코딩테스트 시작!');
  }, msUntilStart);
  testInfo.timeouts.push(startTimeout);

  schedule.forEach((offset: number) => {
    const after = duration - offset;
    if (after > 0) {
      const t = setTimeout(() => {
        interaction.followUp(`⏳ ${offset}분 남았습니다!`);
      }, msUntilStart + after * 60000);
      testInfo.timeouts.push(t);
    }
  });

  const endTimeout = setTimeout(() => {
    concludeTest(testInfo, interaction.channel as any);
  }, msUntilStart + duration * 60000);
  testInfo.timeouts.push(endTimeout);
  },
  async handleButton(interaction: ButtonInteraction) {
    let data: any;
    try {
      data = JSON.parse(interaction.customId);
    } catch (e) {
      return interaction.reply({ content: '버튼 정보 파싱 오류', ephemeral: true });
    }
    if (data.action !== 'score') return;
    const test = ongoingTests[data.idx];
    if (!test) {
      return interaction.reply({ content: '테스트 정보를 찾을 수 없습니다.', ephemeral: true });
    }
    if (!test.ended) {
      return interaction.reply({ content: '아직 종료되지 않은 테스트입니다.', ephemeral: true });
    }
    const modal = new ModalBuilder()
      .setCustomId(JSON.stringify({ cmd: 'start', action: 'submitScore', idx: data.idx }))
      .setTitle('점수 입력');
    const input = new TextInputBuilder()
      .setCustomId('score')
      .setLabel('본인 점수')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await interaction.showModal(modal);
  },
  async handleModal(interaction: ModalSubmitInteraction) {
    let data: any;
    try {
      data = JSON.parse(interaction.customId);
    } catch (e) {
      return interaction.reply({ content: '모달 정보 파싱 오류', ephemeral: true });
    }
    if (data.action !== 'submitScore') return;
    const test = ongoingTests[data.idx];
    if (!test) {
      return interaction.reply({ content: '테스트 정보를 찾을 수 없습니다.', ephemeral: true });
    }
    const value = interaction.fields.getTextInputValue('score');
    const score = parseInt(value, 10);
    if (isNaN(score)) {
      return interaction.reply({ content: '숫자 점수를 입력해주세요.', ephemeral: true });
    }
    if (test.scores[interaction.user.id]) {
      return interaction.reply({ content: '이미 점수를 제출하셨습니다.', ephemeral: true });
    }
    test.scores[interaction.user.id] = { name: interaction.user.username, score };
    await interaction.reply({ content: '점수가 기록되었습니다.', ephemeral: true });
    if (Object.keys(test.scores).length >= test.participants) {
      const results = Object.values(test.scores).sort((a, b) => b.score - a.score);
      const medals = ['🥇', '🥈', '🥉'];
      const lines = results.map((r, i) => `${medals[i] || `${i + 1}.`} ${r.name} - ${r.score}점`);
      const message = `🏁 코딩테스트 결과\n\n${lines.join('  \n')}`;
      const channel = interaction.client.channels.cache.get(test.channelId) as any;
      if (channel) {
        channel.send(message);
      } else {
        interaction.followUp({ content: message });
      }
      const idx = ongoingTests.indexOf(test);
      if (idx !== -1) ongoingTests.splice(idx, 1);
    }
  },
};
