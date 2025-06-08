const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
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
const ongoingTests = [];
let nextId = 1;

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
  if (interaction.isButton()) {
    if (interaction.customId.startsWith("terminate_")) {
      const id = Number(interaction.customId.split("_")[1]);
      const test = ongoingTests.find((t) => t.id === id);
      if (!test) {
        return interaction.reply({
          content: "이미 종료된 테스트입니다.",
          ephemeral: true,
        });
      }
      const idx = ongoingTests.indexOf(test);
      if (idx !== -1) ongoingTests.splice(idx, 1);
      await interaction.channel.send(
        `**코딩 테스트가 ${interaction.user}에 의해 강제 종료되었습니다.**`
      );
      return interaction.update({
        content: "테스트를 종료했습니다.",
        components: [],
      });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "start") {
    const duration = interaction.options.getInteger("duration");
    const timeStr = interaction.options.getString("starttime");

    if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
      return interaction.reply("❌ 시작 시각은 00:00~23:59 형식으로 입력해주세요.");
    }
    const startTime = parseTimeToFutureToday(timeStr);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const now = new Date();
    const msUntilStart = startTime - now;
    const schedule = predefinedSchedules[duration] || defaultSchedule;

    const testInfo = {
      id: nextId++,
      startTime,
      endTime,
      userId: interaction.user.id,
      duration,
    };
    ongoingTests.push(testInfo);
    setTimeout(() => {
      const idx = ongoingTests.indexOf(testInfo);
      if (idx !== -1) ongoingTests.splice(idx, 1);
    }, msUntilStart + duration * 60000);

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
  } else if (interaction.commandName === "status") {
    const now = new Date();
    const active = ongoingTests.filter((t) => t.endTime > now);

    if (active.length === 0) {
      return interaction.reply({ content: "진행중인 코딩 테스트가 없습니다.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("진행 중인 코딩 테스트")
      .setColor(0x0099ff);

    active.forEach((t, idx) => {
      const start = t.startTime.toLocaleTimeString("ko-KR");
      const end = t.endTime.toLocaleTimeString("ko-KR");
      const remaining = Math.max(0, Math.ceil((t.endTime - now) / 60000));
      embed.addFields({
        name: `${idx + 1}. ${start} ~ ${end}`,
        value: `<@${t.userId}> • 남은 시간 약 ${remaining}분`,
      });
    });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } else if (interaction.commandName === "terminate") {
    const now = new Date();
    const active = ongoingTests.filter((t) => t.endTime > now);

    if (active.length === 0) {
      return interaction.reply({
        content: "진행중인 코딩 테스트가 없습니다.",
        ephemeral: true,
      });
    }

    const description = active
      .map(
        (t, i) =>
          `${i + 1}. ${t.startTime.toLocaleTimeString("ko-KR")} ~ ${t.endTime.toLocaleTimeString(
            "ko-KR"
          )} (<@${t.userId}>)`
      )
      .join("\n");

    const components = active.map((t) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`terminate_${t.id}`)
          .setLabel("종료")
          .setStyle(ButtonStyle.Danger)
      )
    );

    return interaction.reply({
      content: description,
      components,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
