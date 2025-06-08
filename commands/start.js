const { SlashCommandBuilder } = require('discord.js');
const ongoingTests = require('../ongoing-tests');

const predefinedSchedules = {
  180: [90, 60, 30, 10],
  120: [60, 30, 10],
  90: [45, 30, 10],
  60: [30, 10],
  30: [10],
};
const defaultSchedule = [30, 10];

function parseTimeToFutureToday(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const now = new Date();
  const startTime = new Date(now);
  startTime.setHours(hour, minute, 0, 0);
  if (startTime < now) startTime.setDate(startTime.getDate() + 1);
  return startTime;
}

module.exports = {
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
        .setRequired(true)),
  async execute(interaction) {
    const duration = interaction.options.getInteger('duration');
    const timeStr = interaction.options.getString('starttime');

    if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
      return interaction.reply('❌ 시작 시각은 00:00~23:59 형식으로 입력해주세요.');
    }
    const startTime = parseTimeToFutureToday(timeStr);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const now = new Date();
    const msUntilStart = startTime - now;
    const schedule = predefinedSchedules[duration] || defaultSchedule;

  const label = `${startTime.toLocaleTimeString('ko-KR')} ~ ${endTime.toLocaleTimeString('ko-KR')}`;
  const testInfo = { startTime, endTime, userId: interaction.user.id, duration, timeouts: [], label };
  ongoingTests.push(testInfo);

  await interaction.reply(`🧠 ${startTime.toLocaleTimeString('ko-KR')}에 코딩테스트 시작 (⏱ ${duration}분)`);

  const startTimeout = setTimeout(() => {
    interaction.followUp('🚀 코딩테스트 시작!');
  }, msUntilStart);
  testInfo.timeouts.push(startTimeout);

  schedule.forEach((offset) => {
    const after = duration - offset;
    if (after > 0) {
      const t = setTimeout(() => {
        interaction.followUp(`⏳ ${offset}분 남았습니다!`);
      }, msUntilStart + after * 60000);
      testInfo.timeouts.push(t);
    }
  });

  const endTimeout = setTimeout(() => {
    interaction.followUp('⛳ 코딩 테스트 종료!');
    const idx = ongoingTests.indexOf(testInfo);
    if (idx !== -1) ongoingTests.splice(idx, 1);
  }, msUntilStart + duration * 60000);
  testInfo.timeouts.push(endTimeout);
  },
};
