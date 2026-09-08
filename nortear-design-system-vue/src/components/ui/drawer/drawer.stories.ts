import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import DrawerDocs from '@/components/docs/DrawerDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { drawerSource } from './drawer.source';

import { figmaDesign } from '@shared/figma/design-links';
import drawerTranslations from '@shared/content/drawer/translations.json';

/**
 * Rótulos dos cenários: saem do MESMO `translations.json` que a docs page lê,
 * onde cada chave existe nos três idiomas. A story é fixture e fica presa a
 * pt-BR de propósito — quem resolve o idioma de quem lê é a docs page, e uma
 * play que dependesse do seletor de idioma procuraria um nome diferente a cada
 * rodada. A interpolação é do template literal (`${...}`), e não uma mustache:
 * assim o nome da chave passa pelo `vue-tsc`, que não abre template em string.
 *
 * O que segue literal aqui é o que o conteúdo compartilhado NÃO nomeia — ver o
 * comentário de cada ponto.
 */
const L = drawerTranslations['pt-BR'].demonstration.labels;

// Gatilho, descrição e ação primária deste painel genérico não têm chave em
// `demonstration.labels` — a descrição é a da tabela de UX writing, e as outras
// duas nomeiam o andaime da story. Título e saída passam a sair do conteúdo
// compartilhado, que é o que esta rodada consertou.
const LABEL = {
  trigger: 'Abrir drawer',
  title: L.title,
  descricao: 'Atualize seus dados pessoais e foto.',
  confirmar: 'Confirmar',
  cancelar: L.cancel,
};

const meta = {
  title: 'Components/Overlay/Drawer',
  component: Drawer,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('drawer'),
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(DrawerDocs),
      source: { transform: drawerSource },
      description: {
        component:
          'Painel deslizante mobile-first. Renderiza em portal com overlay, foco preso e role=dialog, em quatro direções de entrada.',
      },
    },
  },
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['bottom', 'top', 'left', 'right'],
      description: 'Direção de entrada do painel.',
      table: { type: { summary: "'bottom' | 'top' | 'left' | 'right'" }, defaultValue: { summary: "'bottom'" } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dismissible: {
      control: 'boolean',
      description: 'Permite fechar via swipe, ESC ou clique no overlay.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    modal: {
      control: 'boolean',
      description: 'Quando true, bloqueia interação com o resto da página.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    // `control: false` de propósito: é espião de callback, não parâmetro. Sem a
    // entrada aqui ele ficaria fora da aba API Reference e a aba Actions
    // nasceria vazia.
    'onUpdate:open': {
      control: false,
      description: 'Emitido a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    direction: 'bottom',
    defaultOpen: false,
    dismissible: true,
    modal: true,
    'onUpdate:open': fn(),
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Par idempotente de abertura e fechamento.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM — não remonta. Um clique
 * cego partiria do estado que a rodada anterior deixou e inverteria todo o
 * resto. Cada passo estabelece a própria precondição.
 */
async function open(trigger: HTMLElement): Promise<HTMLElement> {
  if (within(document.body).queryAllByRole('dialog').length === 0) {
    await userEvent.click(trigger);
  }
  return await waitForPortal('dialog');
}

async function close(): Promise<void> {
  if (within(document.body).queryAllByRole('dialog').length > 0) {
    await userEvent.keyboard('{Escape}');
  }
  await waitForPortalGone('dialog');
}

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item3', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => ({
    components: {
      Drawer,
      DrawerBody,
      DrawerClose,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      Button,
    },
    setup() {
      return { args, LABEL };
    },
    template: `
      <div style="contain: layout">
        <Drawer :key="String(args.defaultOpen) + args.direction" v-bind="args">
          <DrawerTrigger as-child>
            <Button variant="outline">{{ LABEL.trigger }}</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{{ LABEL.title }}</DrawerTitle>
              <DrawerDescription>{{ LABEL.descricao }}</DrawerDescription>
            </DrawerHeader>
            <DrawerBody class="nds-text-body nds-text-muted-foreground">
              Conteúdo do drawer.
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">{{ LABEL.cancelar }}</Button>
              </DrawerClose>
              <Button>{{ LABEL.confirmar }}</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: LABEL.trigger });

    await close();

    await step('1. Clicar no gatilho abre o painel, com nome e descrição acessíveis', async () => {
      const spy = args['onUpdate:open'] as ReturnType<typeof fn>;
      const callsBefore = spy.mock.calls.length;
      const panel = await open(trigger);

      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('role', 'dialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      // O nome sai do aria-labelledby ligado ao id REAL do DrawerTitle. Já houve
      // um aria-label fixo em inglês aqui, que vencia o título e deixava o
      // painel se anunciando "Drawer".
      await expect(panel).toHaveAccessibleName(LABEL.title);
      await expect(panel).toHaveAccessibleDescription(LABEL.descricao);
      await expect(panel).toHaveAttribute('data-direction', args.direction!);
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(spy.mock.calls.length).toBe(callsBefore + 1);
    });

    await step('2. O painel é portalizado para fora da story', async () => {
      const panel = await waitForPortal('dialog');
      await expect(canvasElement.contains(panel)).toBe(false);
      await expect(document.body.contains(panel)).toBe(true);
    });

    await step('3. O foco entra no painel e Tab não escapa dele', async () => {
      const panel = await waitForPortal('dialog');
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
      for (let i = 0; i < 6; i++) await userEvent.tab();
      await expect(panel.contains(document.activeElement)).toBe(true);
    });

    await step('4. Escape fecha e devolve o foco ao gatilho', async () => {
      await close();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('5. O botão de fechar do rodapé fecha e devolve o foco ao gatilho', async () => {
      const panel = await open(trigger);
      await userEvent.click(within(panel).getByRole('button', { name: LABEL.cancelar }));
      await waitForPortalGone('dialog');
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    // Termina fechado: a próxima rodada da play precisa do mesmo ponto de
    // partida desta, e é este estado que o Chromatic fotografa.
    await close();
  },
};
