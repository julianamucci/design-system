// Portão do nome acessível do `<kbd>`.
//
// O Kbd é a única das seis fábricas da unificação sem página de documentação e
// sem árvore de stories: ele é peça interna — quem o consome é a seção de
// testes das docs pages (`DocsTestes`), não o catálogo. Por isso a asserção
// mora numa story QA (`tags: ['!dev']`, fora da barra lateral) em vez de num
// `UI/Kbd` que prometeria uma página que não existe.
//
// O que ela guarda: `label` nomeava o atalho em forma legível ("Command",
// "Shift") — o mesmo nome que no button é TEXTO VISÍVEL. A unificação trouxe
// `'aria-label'` como canônico e manteve o antigo como apelido, porque apagá-lo
// quebraria chamador em silêncio. Compatibilidade sem asserção é promessa.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createKbd, createKbdGroup } from './kbd';

const meta: Meta = {
  title: 'QA/Nome Acessível do Kbd',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

export const NomeAcessivel: Story = {
  render: () => {
    const grupo = createKbdGroup();
    grupo.appendChild(createKbd({ text: 'Ctrl', 'aria-label': 'Control' }));
    grupo.appendChild(document.createTextNode('+'));
    grupo.appendChild(createKbd({ text: 'B' }));
    return grupo;
  },
  play: async ({ canvasElement, step }) => {
    await step('A tecla desenhada carrega o nome legível do atalho', async () => {
      const teclas = canvasElement.querySelectorAll<HTMLElement>('[data-slot="kbd"]');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0]).toHaveAttribute('aria-label', 'Control');
      // Sem nome, a tecla é lida pelo próprio texto — "B" já se anuncia.
      await expect(teclas[1].hasAttribute('aria-label')).toBe(false);
    });

    await step('O apelido depreciado continua produzindo o atributo', async () => {
      const antigo = createKbd({ text: '⇧', label: 'Shift' });
      await expect(antigo).toHaveAttribute('aria-label', 'Shift');

      // E o canônico vence quando os dois vierem — dois nomes disputando um
      // atributo é o defeito que a unificação existe para fechar.
      const ambos = createKbd({ text: '⌘', label: 'Antigo', 'aria-label': 'Command' });
      await expect(ambos).toHaveAttribute('aria-label', 'Command');
    });
  },
};
