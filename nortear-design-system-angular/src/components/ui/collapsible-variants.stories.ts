import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_COLLAPSIBLE } from './collapsible';
import { NdsButton } from './button';

// O Collapsible não tem variante visual: o que varia é o MODO de operação —
// controlado (estado externo + callback de mudança) e não-controlado
// (`defaultOpen`) — mais a liberdade de estilo do trigger, que é um elemento
// nativo do consumidor.

const CHEVRON = `<svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>`;

const PANEL_CLASSES =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';

const meta: Meta = {
  title: 'UI/Collapsible/Variants',
  decorators: [moduleMetadata({ imports: [...NDS_COLLAPSIBLE, NdsButton] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Modos de uso. Não-controlado guarda o estado dentro do componente; controlado ' +
          'recebe o estado de fora e devolve cada mudança, o que é o necessário quando outra ' +
          'parte da tela depende de o painel estar aberto.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Uncontrolled: Story = {
  render: () => ({
    template: `
      <div ndsCollapsible class="nds-w-sm" [defaultOpen]="false">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4"
          data-justify="between"
        >
          <span>Exibir filtros avançados</span>
          ${CHEVRON}
        </button>

        <div ndsCollapsiblePanel class="${PANEL_CLASSES}" data-spacing="sm">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('O estado nasce e vive dentro do componente', async () => {
      // Ninguém de fora escreveu `open`: o painel abre só porque o primitivo
      // guarda o próprio estado.
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      ).toBeInTheDocument();
    });
  },
};

export const Controlled: Story = {
  parameters: { covers: ['functional.item4', 'visual.item3'] },
  render: () => ({
    props: { aberto: false },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-spacing="xs">
          <!-- Nomes próprios, e não os mesmos do trigger: dois botões com o
               mesmo nome acessível na tela são ambíguos para quem navega por
               lista de controles no leitor de tela. -->
          <button ndsButton size="sm" variant="outline" (click)="aberto = true">
            Abrir pelo estado externo
          </button>
          <button ndsButton size="sm" variant="outline" (click)="aberto = false">
            Fechar pelo estado externo
          </button>
        </div>

        <div ndsCollapsible class="nds-w-full" [open]="aberto" (openChange)="aberto = $event">
          <button
            ndsCollapsibleTrigger
            ndsButton
            variant="ghost"
            class="nds-cluster nds-w-full nds-px-4"
            data-justify="between"
            [attr.aria-label]="aberto ? 'Ocultar filtros avançados' : 'Exibir filtros avançados'"
          >
            <span>{{ aberto ? 'Ocultar filtros avançados' : 'Exibir filtros avançados' }}</span>
            ${CHEVRON}
          </button>

          <div ndsCollapsiblePanel class="${PANEL_CLASSES}" data-spacing="sm">
            <p>Filtro avançado 1</p>
            <p>Filtro avançado 2</p>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const openExterno = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });
    const trigger = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    )!;
    const painel = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step('O painel obedece ao estado externo', async () => {
      // Nenhum clique no trigger: quem manda é a prop, e é isso que distingue o
      // modo controlado.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(openExterno);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(painel()).toBeInTheDocument();
    });

    await step('O trigger devolve a mudança para o estado externo', async () => {
      // Clicar no trigger emite o novo valor; o exemplo grava de volta em
      // `aberto`, e o rótulo alternado prova que a volta chegou.
      if (trigger.getAttribute('aria-expanded') !== 'false') await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger.textContent?.trim()).toBe('Exibir filtros avançados');
      await waitFor(async () => {
        await expect(painel()).toBeNull();
      });
    });
  },
};

export const CustomButton: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    template: `
      <div ndsCollapsible class="nds-w-sm">
        <button ndsCollapsibleTrigger ndsButton variant="outline">
          Exibir opções avançadas
        </button>

        <div ndsCollapsiblePanel class="${PANEL_CLASSES}" data-spacing="sm">
          <p>Opção avançada 1</p>
          <p>Opção avançada 2</p>
          <p>Opção avançada 3</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Exibir opções avançadas' });

    await step('O botão do design system E o trigger são o MESMO elemento', async () => {
      // Aqui não existe repasse de comportamento para um filho: as duas
      // diretivas são de atributo e moram no mesmo `<button>`. Consequência
      // direta — o botão estilizado carrega `aria-expanded` e, quando aberto,
      // `aria-controls`, sem nenhum código de ligação.
      await expect(trigger).toHaveClass(/nds-button-outline/);
      await expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger');
      await expect(trigger).toHaveAttribute('aria-expanded');
    });

    await step('Aberto, o mesmo botão aponta para o painel', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      );
    });
  },
};
