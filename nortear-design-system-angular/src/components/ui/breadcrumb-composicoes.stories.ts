import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
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
import { navegacaoEspionada } from './breadcrumb.fixtures';
import { NDS_DROPDOWN_MENU } from './dropdown-menu';

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

const { onNavigate, aoNavegar } = navegacaoEspionada();

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onEllipsisOpen = fn();
// ─── Trilha completa ──────────────────────────────────────────────────────────

export const CompleteTrail: Story = {
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

/**
 * Fecha `visual.item4`, aberto desde o Bloco 3: a trilha colapsada num
 * DropdownMenu, que é o padrão no mobile quando o caminho não cabe.
 *
 * Os níveis ocultos entram como LINKS (`ndsDropdownMenuLinkItem`), não como
 * itens de comando: são destinos, e destino quer link — abrir em nova aba,
 * copiar o endereço, ver para onde vai antes de clicar.
 */
export const Collapsed: Story = {
  parameters: { covers: ['visual.item4'] },
  decorators: [
    moduleMetadata({
      imports: [
        NdsBreadcrumb, NdsBreadcrumbEllipsis, NdsBreadcrumbIcon, NdsBreadcrumbItem,
        NdsBreadcrumbLink, NdsBreadcrumbList, NdsBreadcrumbPage, NdsBreadcrumbSeparator,
        NdsButton, ...NDS_DROPDOWN_MENU,
      ],
    }),
  ],
  render: () => ({
    template: `
      <nav ndsBreadcrumb label="Trilha de navegação">
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#inicio">Início</a>
          </li>
          <li ndsBreadcrumbSeparator></li>

          <li ndsBreadcrumbItem>
            <nds-dropdown-menu>
              <button
                ndsDropdownMenuTrigger
                ndsButton
                variant="ghost"
                size="icon-sm"
                aria-label="Mostrar níveis ocultos"
              >
                <!-- Sem o input de rótulo: as reticências viram decorativas
                     porque o gatilho já carrega o nome. Com as duas coisas, o
                     leitor de tela anunciaria o mesmo item duas vezes. -->
                <span ndsBreadcrumbEllipsis></span>
              </button>

              <ng-template ndsDropdownMenuContent align="start">
                <a ndsDropdownMenuLinkItem href="#produtos">Produtos</a>
                <a ndsDropdownMenuLinkItem href="#categorias">Categorias</a>
              </ng-template>
            </nds-dropdown-menu>
          </li>
          <li ndsBreadcrumbSeparator></li>

          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#eletronicos">Eletrônicos</a>
          </li>
          <li ndsBreadcrumbSeparator></li>

          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbPage>Fones de ouvido</span>
          </li>
        </ol>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = () => canvas.getByRole('button', { name: 'Mostrar níveis ocultos' });
    const menu = () => document.querySelector<HTMLElement>('[data-slot="dropdown-menu-content"]');

    await step('A trilha visível fica curta, e o resto vai para o gatilho', async () => {
      const trilha = canvasElement.querySelector<HTMLElement>('[data-slot="breadcrumb-list"]')!;
      await expect(trilha.querySelectorAll('[data-slot="breadcrumb-item"]').length).toBe(4);
      await expect(canvas.getByText('Fones de ouvido')).toBeVisible();
    });

    await step('As reticências não são anunciadas duas vezes', async () => {
      // O gatilho já tem nome; deixar `label` nas reticências repetiria o item.
      const reticencias = canvasElement.querySelector<HTMLElement>(
        '[data-slot="breadcrumb-ellipsis"]',
      )!;
      await expect(reticencias.getAttribute('aria-hidden')).toBe('true');
      await expect(reticencias.hasAttribute('role')).toBe(false);
    });

    await step('O gatilho abre o menu e diz que abre algo', async () => {
      await expect(gatilho().getAttribute('aria-haspopup')).toBe('menu');
      await userEvent.click(gatilho());
      await waitFor(() => expect(menu()).not.toBeNull());
      await expect(gatilho().getAttribute('aria-expanded')).toBe('true');
    });

    await step('Os níveis ocultos são links de verdade, não comandos', async () => {
      // É o ponto da composição: destino quer <a href>. Com <div> e callback a
      // pessoa perde nova aba, copiar endereço e a barra de status.
      const itens = [...menu()!.querySelectorAll('[data-slot="dropdown-menu-item"]')];
      await expect(itens.length).toBe(2);
      for (const item of itens) {
        await expect(item.tagName).toBe('A');
        await expect(item.getAttribute('href')).toBeTruthy();
      }
    });

    await step('O teclado percorre os níveis ocultos', async () => {
      // O foco já está no primeiro item: quem abre o menu não deveria precisar
      // de uma tecla a mais para chegar ao começo da lista.
      await waitFor(() => expect(document.activeElement?.textContent?.trim()).toBe('Produtos'));
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement?.textContent?.trim()).toBe('Categorias');
      // E a lista dá a volta no fim, em vez de prender o foco no último.
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement?.textContent?.trim()).toBe('Produtos');
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(menu()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(gatilho()));
    });
  },
};
