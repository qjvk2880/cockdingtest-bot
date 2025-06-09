import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextBasedChannel } from 'discord.js';
import ongoingTests from './ongoing-tests';

export function concludeTest(test: any, channel: TextBasedChannel) {
  if (test.ended) return;
  test.ended = true;
  test.timeouts.forEach((t: NodeJS.Timeout) => clearTimeout(t));
  const idx = ongoingTests.indexOf(test);
  if (idx === -1) return;
  channel.send({
    content: '⛳ 코딩 테스트 종료!',
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(JSON.stringify({ cmd: 'start', action: 'score', idx }))
          .setLabel('점수 입력')
          .setStyle(ButtonStyle.Primary),
      ),
    ] as any,
  });
}
