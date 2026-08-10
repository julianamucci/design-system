import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  NdsBreadcrumb,
  NdsBreadcrumbEllipsis,
  NdsBreadcrumbIcon,
  NdsBreadcrumbItem,
  NdsBreadcrumbLink,
  NdsBreadcrumbList,
  NdsBreadcrumbPage,
  NdsBreadcrumbSeparator,
} from './breadcrumb';
import { NdsButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Breadcrumb/Compositions',
  tags: ['navigation'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsBreadcrumb,
        NdsBreadcrumbList,
        NdsBreadcrumbItem,
        NdsBreadcrumbLink,
        NdsBreadcrumbPage,
        NdsBreadcrumbSeparator,
        NdsBreadcrumbEllipsis,
        NdsBreadcrumbIcon,
        NdsButton,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composições canônicas do Breadcrumb: trilha completa com evento de navegação e reticências dentro de um gatilho nomeado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espiões de escopo de módulo: dentro do `render`, a play não os alcançaria. */
const onNavigate = fn();
const onEllipsisOpen = fn();

function aoNavegar(event: Event): void {
  event.preventDefault();
  onNavigate({ label: (event.currentTarget as HTMLElement).textContent?.trim() });
}

// ─── Trilha completa ──────────────────────────────────────────────────────────

export const TrilhaCompleta: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item3'],
    docs: {
      description: {
        story:
          'Trilha de quatro níveis com evento de navegação em cada link. O último item é a página atual e não dispara nada.',
      },
    },
  },
  render: () => ({
    props: { aoNavegar },
    template: `
      <nav ndsBreadcrumb>
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event)">Início</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event)">Documentação</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event)">Componentes</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem><span ndsBreadcrumbPage>Breadcrumb</span></li>
        </ol>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A trilha inteira é uma lista ordenada de níveis', async () => {
      // functional.item1 — sete filhos: quatro níveis e três separadores.
      const list = canvasElement.querySelector<HTMLElement>('[data-slot="breadcrumb-list"]')!;
      await expect(list.tagName).toBe('OL');
      await expect(list.children.length).toBe(7);
      await expect(
        canvasElement.querySelectorAll('[data-slot="breadcrumb-item"]').length,
      ).toBe(4);
    });

    await step('Cada nível anterior dispara o evento de navegação uma vez', async () => {
      // functional.item3 — a página atual fica de fora da conta de propósito:
      // rastrear clique no item atual inflaria o evento com uma navegação que
      // nunca aconteceu.
      onNavigate.mockClear();
      for (const nome of ['Início', 'Documentação', 'Componentes']) {
        await userEvent.click(canvas.getByRole('link', { name: nome }));
      }
      await expect(onNavigate).toHaveBeenCalledTimes(3);
      await expect(canvas.getAllByRole('link').length).toBe(3);
    });
  },
};

// ─── Reticências com gatilho ──────────────────────────────────────────────────

export const EllipsisWithTrigger: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      description: {
        story:
          'Níveis colapsados atrás de um gatilho nomeado. As reticências ficam sem rótulo: quem nomeia o conjunto oculto é o botão, e dois nomes no mesmo controle viram leitura duplicada.',
      },
    },
  },
  render: () => ({
    props: {
      aoNavegar,
      aoAbrir: () => onEllipsisOpen({ hidden_count: 3 }),
    },
    template: `
      <nav ndsBreadcrumb>
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event)">Início</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <button
              ndsButton
              variant="ghost"
              size="icon-sm"
              aria-label="Expandir níveis ocultos"
              (click)="aoAbrir()"
            >
              <span ndsBreadcrumbEllipsis></span>
            </button>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem><span ndsBreadcrumbPage>Breadcrumb</span></li>
        </ol>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho é quem carrega o nome; as reticências são desenho', async () => {
      // functional.item5, metade "decorativas quando não recebem rótulo".
      const gatilho = canvas.getByRole('button', { name: 'Expandir níveis ocultos' });
      const reticencias = gatilho.querySelector<HTMLElement>(
        '[data-slot="breadcrumb-ellipsis"]',
      )!;
      await expect(reticencias).toHaveAttribute('aria-hidden', 'true');
      await expect(reticencias.hasAttribute('role')).toBe(false);
      await expect(reticencias.querySelector('svg')).not.toBeNull();
    });

    await step('O gatilho é alcançável por teclado e responde', async () => {
      onEllipsisOpen.mockClear();
      const gatilho = canvas.getByRole('button', { name: 'Expandir níveis ocultos' });
      gatilho.focus();
      await expect(gatilho).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(onEllipsisOpen).toHaveBeenCalledTimes(1);
    });
  },
};
