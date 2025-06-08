const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const predefinedSchedules = {
  180: [90, 60, 30, 10],
  120: [60, 30, 10],
  90: [45, 30, 10],
  60: [30, 10],
  30: [10],
};
const defaultSchedule = [30, 10];

function parseTimeToFutureToday(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const now = new Date();
  const startTime = new Date(now);
  startTime.setHours(hour, minute, 0, 0);
  if (startTime < now) startTime.setDate(startTime.getDate() + 1);
  return startTime;
}

client.once("ready", () => {
  console.log(`✅ 봇 로그인: ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "start") return;

  const duration = interaction.options.getInteger("duration");
  const timeStr = interaction.options.getString("starttime");

  // Validate time format (HH:mm) with strict 24-hour range
  if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
    return interaction.reply("❌ 시작 시각은 00:00~23:59 형식으로 입력해주세요.");
  }

  const startTime = parseTimeToFutureToday(timeStr);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  const now = new Date();
  const msUntilStart = startTime - now;
  const schedule = predefinedSchedules[duration] || defaultSchedule;

  await interaction.reply(`🧠 ${startTime.toLocaleTimeString("ko-KR")}에 코딩테스트 시작 (⏱ ${duration}분)`);

  setTimeout(() => {
    interaction.followUp("🚀 코딩테스트 시작!");
    schedule.forEach((offset) => {
      const after = duration - offset;
      if (after > 0) {
        setTimeout(() => {
          interaction.followUp(`⏳ ${offset}분 남았습니다!`);
        }, after * 60000);
      }
    });
    setTimeout(() => {
      interaction.followUp("⛳ 코딩 테스트 종료!");
    }, duration * 60000);
  }, msUntilStart);
});

client.login(process.env.DISCORD_TOKEN);
