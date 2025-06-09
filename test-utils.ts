import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import ongoingTests from './ongoing-tests';

export function concludeTest(test: any, channel: any) {
  if (test.ended) return;
  test.ended = true;
  test.timeouts.forEach((t: any) => clearTimeout(t));
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
