/**
 * A família `nds-w-*` dentro de um container ESTREITO.
 *
 * Ela declara `width` fixa — é o propósito dela. O que faltava era o teto: um
 * `nds-w-md` de 28rem dentro de um container de 288px empurrava 160px para fora
 * e aparecia barra de rolagem horizontal. Foi visto primeiro no carrossel em
 * breakpoint de celular, mas o carrossel era só quem estava vestindo a classe:
 * o defeito é da utilitária, e atinge qualquer componente que a vista.
 *
 * A MOLDURA não é enfeite. A primeira versão deste guarda media o `<html>`, que
 * não transborda porque quem rola é o container da story — e por isso ela
 * passou verde enquanto a tela mostrava a barra. O teto que interessa é
 * relativo ao PAI, então é contra um pai com respiro que ele precisa ser
 * medido.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const LARGURAS = [
  'nds-w-3xs', 'nds-w-2xs', 'nds-w-xs', 'nds-w-sm', 'nds-w-md',
  'nds-w-lg', 'nds-w-xl', 'nds-w-prose', 'nds-w-content', 'nds-w-docs',
];

const meta: Meta = {
  title: 'QA/Larguras',
  parameters: {
    chromatic: { viewports: [320] },
    controls: { disable: true },
    actions: { disable: true },
  },
};
export default meta;

export const HorizontalNoScroll: StoryObj = {
  globals: { viewport: { value: 'mobile1' } },
  render: () => (
    <div data-moldura className="nds-p-4 nds-border-default nds-rounded-lg">
      <div className="nds-stack" data-spacing="sm">
        {LARGURAS.map((classe) => (
          <div key={classe} className={`${classe} nds-p-2 nds-bg-muted nds-text-caption`}>
            {classe}
          </div>
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step('Nenhuma largura transborda o container', async () => {
      const moldura = canvasElement.querySelector('[data-moldura]') as HTMLElement;
      // `scrollWidth` maior que `clientWidth` É a barra horizontal — medir o
      // sintoma, e não a largura de cada caixa, é o que faz este teste valer
      // para a próxima classe que alguém acrescentar à família.
      await expect(
        moldura.scrollWidth,
        `sobra=${moldura.scrollWidth - moldura.clientWidth}px além dos ${moldura.clientWidth}px do container`,
      ).toBeLessThanOrEqual(moldura.clientWidth);
    });
  },
};
