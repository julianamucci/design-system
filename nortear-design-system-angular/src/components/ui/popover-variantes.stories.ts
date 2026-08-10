import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_POPOVER } from './popover';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';

// As três formas canônicas do painel, na ordem em que o conteúdo compartilhado
// as descreve: conteúdo livre, cabeçalho com título e descrição, e formulário
// inline. Nenhuma acrescenta API — todas são arranjo de conteúdo dentro do
// mesmo `<ng-template ndsPopoverContent>`.

const meta: Meta = {
  title: 'UI/Popover/Variants',
  decorators: [moduleMetadata({ imports: [...NDS_POPOVER, NdsButton, NdsInput, NdsLabel] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Conteúdo livre, cabeçalho com título e descrição, e formulário inline. ' +
          'O painel sempre precisa de nome acessível: com título ele vem do ' +
          'aria-labelledby, sem título ele herda o texto do gatilho.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function painel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}

async function abrir(gatilho: HTMLElement): Promise<void> {
  if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
  // Esperar pela VISIBILIDADE, não pela presença no DOM: o positioner nasce
  // com visibility hidden e só aparece depois que o floating-ui mede a posição.
  // Nesse intervalo o painel existe mas está fora da árvore de acessibilidade —
  // getByRole('dialog') não o acha e nada dentro dele recebe foco.
  await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
  // E esperar o foco assentar DENTRO do painel: a abertura o move no quadro
  // seguinte ao da medição, e mexer no foco antes disso disputaria com o
  // próprio componente — a ordem de tabulação medida sairia invertida.
  await waitFor(() => expect(painel()!.contains(document.activeElement)).toBe(true));
}

export const Default: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Ver atalhos</button>

        <ng-template ndsPopoverContent>
          <p class="nds-text-body">
            Use <kbd class="nds-kbd">Ctrl</kbd> + <kbd class="nds-kbd">K</kbd> para abrir a
            busca em qualquer tela.
          </p>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Ver atalhos' });

    await step('Sem título, o painel herda o nome acessível do gatilho', async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe. O
      // Vanilla resolve assim, e este stack copia: o texto do gatilho vira
      // aria-label do painel enquanto não houver `ndsPopoverTitle`.
      await abrir(gatilho);
      const dialogo = screen.getByRole('dialog', { name: 'Ver atalhos' });
      await expect(dialogo).toBeVisible();
      await expect(dialogo).not.toHaveAttribute('aria-labelledby');
    });

    await step('O painel carrega a classe do design system', async () => {
      await expect(painel()).toHaveClass(/nds-popover-content/);
    });
  },
};

export const WithTitle: Story = {
  parameters: { covers: ['visual.item2', 'accessibility.item5'] },
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Configurações de exibição</button>

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Configurações de exibição</h3>
            <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
            <button ndsPopoverClose ndsButton size="sm">Salvar</button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Configurações de exibição' });

    await step('O título nomeia o painel por aria-labelledby', async () => {
      await abrir(gatilho);
      const dialogo = screen.getByRole('dialog');
      const idTitulo = dialogo.getAttribute('aria-labelledby');
      await expect(idTitulo).toBeTruthy();
      const titulo = document.getElementById(idTitulo!)!;
      await expect(titulo).toHaveAttribute('data-slot', 'popover-title');
      await expect(titulo).toHaveClass(/nds-popover-title/);
      await expect(titulo.textContent?.trim()).toBe('Configurações de exibição');
    });

    await step('A descrição entra por aria-describedby', async () => {
      const dialogo = screen.getByRole('dialog');
      const idDescricao = dialogo.getAttribute('aria-describedby');
      await expect(idDescricao).toBeTruthy();
      await expect(document.getElementById(idDescricao!)).toHaveClass(/nds-popover-description/);
    });

    await step('O cabeçalho é um agrupador com classe própria', async () => {
      await expect(
        painel()!.querySelector('[data-slot="popover-header"]'),
      ).toHaveClass(/nds-popover-header/);
    });
  },
};

export const Form: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Editar perfil</button>

        <ng-template ndsPopoverContent align="start">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Editar perfil</h3>
            <p ndsPopoverDescription>Altere o nome e o email da conta.</p>
          </div>

          <div class="nds-stack" data-spacing="sm">
            <label ndsLabel for="pv-form-nome">Nome</label>
            <input ndsInput id="pv-form-nome" value="Ana Ribeiro" />
          </div>

          <div class="nds-stack" data-spacing="sm">
            <label ndsLabel for="pv-form-email">Email</label>
            <input ndsInput id="pv-form-email" type="email" value="ana@nortear.com.br" />
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
            <button ndsPopoverClose ndsButton size="sm">Atualizar</button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Editar perfil' });

    await step('Os campos existem e estão associados aos rótulos', async () => {
      await abrir(gatilho);
      const nome = screen.getByLabelText('Nome');
      const email = screen.getByLabelText('Email');
      await expect(nome).toHaveValue('Ana Ribeiro');
      await expect(email).toHaveValue('ana@nortear.com.br');
    });

    await step('E aceitam digitação — o painel não é inerte', async () => {
      // Conteúdo interativo dentro do painel é a razão de existir do popover.
      // Se o portal renderizasse fora de qualquer contexto de eventos, a
      // digitação abaixo não mudaria nada.
      const nome = screen.getByLabelText('Nome') as HTMLInputElement;
      await userEvent.clear(nome);
      await userEvent.type(nome, 'Bruno Lima');
      await expect(nome).toHaveValue('Bruno Lima');
    });
  },
};
