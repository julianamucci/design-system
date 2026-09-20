import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createDrawer } from './drawer';
import { drawerWithFormSource, drawerSource, drawerSourceWith } from './drawer.source';
import { createButton } from './button';
import { buildDrawerFooter, buildDrawerWrapper, openPeloTrigger } from './drawer.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Drawer/Compositions',
  parameters: {
    design: figmaDesign('drawer'),
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: drawerSource },
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar e confirmação reversível.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildField(labelText: string, id: string, type: string, value: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'nds-stack nds-text-body';
  label.dataset.spacing = 'xs';
  label.htmlFor = id;

  const span = document.createElement('span');
  span.className = 'nds-font-medium';
  span.textContent = labelText;

  const input = document.createElement('input');
  input.id = id;
  input.className = 'nds-input';
  input.type = type;
  input.value = value;

  label.append(span, input);
  return label;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item5'],
    // Override de story: o corpo deixa de ser um parágrafo e passa a ser uma
    // composição de campos — a sub-fábrica que fecha o par rótulo ↔ controle é o
    // assunto, e o snippet do meta a esconderia.
    docs: {
      source: {
        transform: drawerWithFormSource({
          triggerLabel: 'Editar perfil',
          title: 'Editar perfil',
          description: 'Atualize seu nome e e-mail.',
          fields: [
            { label: 'Nome', value: 'Maria Souza' },
            { label: 'E-mail', type: 'email', value: 'maria@exemplo.com' },
          ],
        }),
      },
      description: {
        story:
          'Formulário curto no corpo e par de ações no rodapé. Título e descrição dizem o que está sendo editado — juntos formam o nome e a descrição acessíveis do painel.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

    const form = document.createElement('form');
    form.id = 'drawer-comp-form';
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';
    form.addEventListener('submit', (event) => event.preventDefault());
    form.append(
      buildField('Nome', 'drawer-comp-nome', 'text', 'Maria Souza'),
      buildField('E-mail', 'drawer-comp-email', 'email', 'maria@exemplo.com'),
    );

    const drawer = createDrawer({
      trigger,
      title: 'Editar perfil',
      description: 'Atualize seu nome e e-mail.',
      content: form,
      // O rodapé é irmão do corpo: é o par id ↔ `form` que religa a ação
      // principal ao formulário. Sem ele o Enter num campo não dispara nada.
      footer: buildDrawerFooter('Cancelar', 'Confirmar', false, form.id),
    });
    return buildDrawerWrapper(drawer);
  },
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement, /editar perfil/i);
    const inside = within(panel);

    await step('O painel carrega nome, descrição e os campos do formulário', async () => {
      await expect(panel).toHaveAccessibleName('Editar perfil');
      await expect(panel).toHaveAccessibleDescription('Atualize seu nome e e-mail.');
      // Os campos são achados pelo RÓTULO: se `for`/`id` não casassem, o input
      // ficaria sem nome acessível e a busca falharia.
      await expect(inside.getByLabelText(/Nome/i)).toBeInTheDocument();
      await expect(inside.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });

    await step('O rodapé oferece confirmar e cancelar, NESSA ordem no DOM', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      await expect(footer).not.toBeNull();
      const names = within(footer).getAllByRole('button').map((b) => b.textContent?.trim());
      // `toContain` diz que os dois estão lá e não diz em que ordem — era o que
      // as CINCO stacks afirmavam, e é a pendência do §2 do PRD do Drawer. A
      // D1 fixa uma ordem só de DOM para os dois eixos: secundário primeiro,
      // porque o `column-reverse` põe o primário em cima quando empilha e o
      // `row` o põe à direita quando cabe lado a lado.
      await expect(names).toEqual(['Cancelar', 'Confirmar']);
    });

    await step('E a folha põe o primário no lugar certo do eixo que estiver valendo', async () => {
      // A outra metade da D1: a mesma ordem de DOM tem de RENDERIZAR o primário
      // em cima (empilhado) ou à direita (lado a lado). Afirmar só o DOM
      // passaria com a folha invertida, que é exatamente o defeito corrigido em
      // 2026-09-07 — `flex-direction: column` puro, primário embaixo.
      const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      const cancelar = within(footer).getByRole('button', { name: 'Cancelar' });
      const confirmar = within(footer).getByRole('button', { name: 'Confirmar' });
      const eixo = getComputedStyle(footer).flexDirection;
      await expect(['row', 'column-reverse']).toContain(eixo);

      const boxCancelar = cancelar.getBoundingClientRect();
      const boxConfirmar = confirmar.getBoundingClientRect();
      if (eixo === 'row') {
        await expect(boxConfirmar.left).toBeGreaterThan(boxCancelar.left);
      } else {
        await expect(boxConfirmar.top).toBeLessThan(boxCancelar.top);
      }
    });

    await step('Confirmar submete o formulário do corpo', async () => {
      // `button.form` é o que denuncia o botão órfão: vem `null` quando nada o
      // liga ao `<form>`, e nada na tela denuncia. Leitura pura, sem `waitFor`.
      const confirmar = inside.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement;
      await expect(confirmar.type).toBe('submit');
      await expect(confirmar.form?.id).toBe('drawer-comp-form');
    });
  },
};

export const WithConfirmation: Story = {
  parameters: {
    // Override de story: a ênfase da ação principal não passa por control
    // nenhum, e o snippet do meta mostraria `default` onde a story renderiza a
    // variante destrutiva.
    docs: {
      source: {
        transform: drawerSourceWith({
          triggerLabel: 'Remover anexo',
          title: 'Remover anexo?',
          description: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
          bodyText: 'O anexo sai desta mensagem e continua na biblioteca.',
          footer: [
            { label: 'Cancelar', variant: 'outline', close: true },
            { label: 'Remover', variant: 'destructive' },
          ],
          initialFocusOnCloser: true,
        }),
      },
      description: {
        story:
          'Mensagem curta e par de ações, com a principal na variante destrutiva. Vale para confirmação reversível; se a ação for realmente bloqueante, o componente é o AlertDialog.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Remover anexo' });

    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent = 'O anexo sai desta mensagem e continua na biblioteca.';

    // Aqui a decisão É a tela, e por isso o foco entra no cancelar — a mesma
    // escolha do `alert-dialog` desta stack: o Enter por reflexo tem de cair na
    // saída segura, nunca na ação que consuma. Sem isto o foco iria para o corpo
    // rolável, que é o primeiro focável do painel. Na `WithForm` o padrão FICA:
    // ali o assunto é editar, e cobrar um Tab a mais de quem só quer editar é o
    // custo que esta regra não paga.
    const footerActions = buildDrawerFooter('Cancelar', 'Remover', true);

    const drawer = createDrawer({
      trigger,
      title: 'Remover anexo?',
      description: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
      content: body,
      footer: footerActions,
      initialFocus: footerActions[0],
    });
    return buildDrawerWrapper(drawer);
  },
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement, /remover anexo/i);
    const inside = within(panel);

    await step('A consequência está escrita, não subentendida', async () => {
      await expect(panel).toHaveAccessibleName('Remover anexo?');
      await expect(panel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step('A ação principal carrega a variante destrutiva', async () => {
      const destrutivo = inside.getByRole('button', { name: /^Remover$/i });
      await expect(destrutivo).toHaveClass('nds-button-destructive');
      const cancelar = inside.getByRole('button', { name: /Cancelar/i });
      await expect(cancelar).toHaveClass('nds-button-outline');
    });

    // O ELEMENTO, não a mera presença de foco: um painel que foca a si mesmo, ou
    // o corpo rolável, também tem foco dentro — e é justamente o que esta story
    // recusa.
    await step('O foco abre no cancelar, que é a saída segura', async () => {
      const cancelar = inside.getByRole('button', { name: /^Cancelar$/i });
      await expect(cancelar).toHaveFocus();
      // E a ação que CONSUMA não tem o foco. Era a metade que faltava aqui e
      // que as outras quatro stacks já afirmavam (§7 inconsistência 15 do PRD).
      //
      // Honestidade sobre o que ela acrescenta: num DOM com um foco só, ela
      // SEGUE da linha acima, e um defeito plantado reprova as duas juntas. O
      // que ela acrescenta é o contrato ESCRITO — a D12 é "o Enter por reflexo
      // cai na saída segura, nunca na ação que consuma", e essa segunda metade
      // não estava dita em lugar nenhum desta stack.
      const destrutivo = inside.getByRole('button', { name: /^Remover$/i });
      await expect(destrutivo).not.toHaveFocus();
    });

    await step('Sem formulário no corpo, a ação não promete envio', async () => {
      // `buildDrawerFooter` serve a este painel e ao de formulário. O elo de
      // envio que a WithForm precisa não pode vazar para cá: `type="submit"`
      // sem `<form>` é a mesma promessa vazia, só que em outro painel.
      const acao = inside.getByRole('button', { name: /^Remover$/i }) as HTMLButtonElement;
      await expect(acao.type).toBe('button');
      await expect(acao.form).toBeNull();
    });
  },
};
