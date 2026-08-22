/**
 * A família `nds-w-*` sob uma tela ESTREITA.
 *
 * Ela declara `width` fixa — é o propósito dela. O que faltava era o teto: numa
 * viewport de 320px, um `nds-w-md` de 28rem empurrava 128px para fora e a
 * página ganhava rolagem horizontal. Foi visto primeiro no carrossel, mas o
 * carrossel era só quem estava usando a classe: o defeito é da utilitária, e
 * atinge qualquer componente que a vista.
 *
 * Por isso o guarda mora aqui e não no carrossel — uma story cobre a família
 * inteira, e é onde a próxima largura acrescentada será cobrada.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';

const meta: Meta = {
  title: 'QA/Larguras',
  parameters: {
    chromatic: { viewports: [320] },
    controls: { disable: true },
    actions: { disable: true },
  },
};
export default meta;

const LARGURAS = [
  'nds-w-3xs', 'nds-w-2xs', 'nds-w-xs', 'nds-w-sm', 'nds-w-md',
  'nds-w-lg', 'nds-w-xl', 'nds-w-prose', 'nds-w-content', 'nds-w-docs',
];

export const SemRolagemHorizontal: StoryObj = {
  globals: { viewport: { value: 'mobile1' } },
  render: () => {
    const pilha = document.createElement('div');
    pilha.className = 'nds-stack';
    pilha.dataset['spacing'] = 'sm';
    for (const classe of LARGURAS) {
      const caixa = document.createElement('div');
      caixa.className = `${classe} nds-p-2 nds-bg-muted nds-text-caption`;
      caixa.textContent = classe;
      pilha.appendChild(caixa);
    }
    return pilha;
  },
  play: async ({ step }) => {
    await step('Nenhuma largura empurra a página para fora da tela', async () => {
      const html = document.documentElement;
      // `scrollWidth` maior que `clientWidth` É a barra horizontal — medir o
      // sintoma, e não a largura de cada caixa, é o que faz este teste valer
      // para a próxima classe que alguém acrescentar à família.
      await expect(
        html.scrollWidth,
        `sobra=${html.scrollWidth - html.clientWidth}px além dos ${html.clientWidth}px da tela`,
      ).toBeLessThanOrEqual(html.clientWidth);
    });
  },
};
