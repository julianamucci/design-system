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
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';

import LargurasStory from './LargurasStory.svelte';

const meta: Meta = {
  title: 'QA/Larguras',
  parameters: {
    chromatic: { viewports: [320] },
    controls: { disable: true },
    actions: { disable: true },
  },
};
export default meta;

export const SemRolagemHorizontal: StoryObj = {
  globals: { viewport: { value: 'mobile1' } },
  render: () => ({ Component: LargurasStory as never }),
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
