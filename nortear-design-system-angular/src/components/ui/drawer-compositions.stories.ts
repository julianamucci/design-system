import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_DRAWER } from './drawer';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { waitForPortal } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import { stripHtml } from '@/lib/strip-html';
import drawerTranslations from '@shared/content/drawer/translations.json';
import { LABELS_DRAWER } from '@/components/docs/DrawerDocs';

// Os rótulos de ação vêm do mesmo lugar que a docs page usa — ver o comentário
// sobre `LABELS_DRAWER` em DrawerDocs.ts. Duplicar a tabela aqui faria os dois
// textos divergirem na primeira revisão de conteúdo.
const { t } = useTranslation(drawerTranslations as Record<string, unknown>, LABELS_DRAWER);

// As duas composições que o conteúdo compartilhado documenta. Ambas nascem
// ABERTAS: é o rodapé de ações que elas existem para mostrar, e ele só existe
// com o painel montado.

const meta: Meta = {
  title: 'Primitives/Disclosure/Drawer/Compositions',
  tags: ['disclosure'],
  decorators: [moduleMetadata({ imports: [...NDS_DRAWER, NdsButton, NdsInput, NdsLabel] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar e confirmação de ' +
          'ação destrutiva. Em ambas o rodapé oferece uma saída explícita além de Escape.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LABEL = {
  trigger: () => t('usage.uxWriting.table.trigger.good'),
  title: () => t('usage.uxWriting.table.title.good'),
  descricao: () => t('usage.uxWriting.table.description.good'),
  close: () => t('usage.uxWriting.table.close.good'),
  confirmar: () => t('demonstration.labels.confirm'),
  destruir: () => t('demonstration.labels.destroy'),
  field: () => t('demonstration.labels.fieldName'),
  aviso: () => t('demonstration.labels.destroyMessage'),
};

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Formulário curto no corpo e par de ações no rodapé. O título diz o que está sendo ' +
          'editado e a descrição dá o contexto — juntos formam o nome e a descrição acessíveis.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.trigger(),
      tituloPainel: LABEL.title(),
      descricaoPainel: LABEL.descricao(),
      rotuloCampo: LABEL.field(),
      rotuloFechar: LABEL.close(),
      rotuloConfirmar: LABEL.confirmar(),
    },
    template: `
      <nds-drawer [defaultOpen]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerBody class="nds-stack" data-spacing="sm">
            <label ndsLabel for="drawer-comp-nome">{{ rotuloCampo }}</label>
            <input ndsInput id="drawer-comp-nome" name="nome" />
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
            <button ndsButton>{{ rotuloConfirmar }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const inside = within(panel);

    await step('O painel carrega nome, descrição e o campo do formulário', async () => {
      await expect(panel).toHaveAccessibleName(LABEL.title());
      await expect(panel).toHaveAccessibleDescription(LABEL.descricao());
      // O campo é achado pelo RÓTULO: se o `for`/`id` não casassem, o input
      // ficaria sem nome acessível e esta busca falharia.
      await expect(inside.getByLabelText(LABEL.field())).toBeInTheDocument();
    });

    await step('O rodapé oferece cancelar e confirmar, nessa ordem de leitura', async () => {
      const buttons = inside.getAllByRole('button');
      const names = buttons.map((b) => b.textContent?.trim());
      await expect(names).toContain(LABEL.close());
      await expect(names).toContain(LABEL.confirmar());
    });

    await step('O corpo do formulário é a região rolável do painel', async () => {
      const body = panel.querySelector<HTMLElement>('[data-slot="drawer-body"]')!;
      await expect(body).toHaveAttribute('tabindex', '0');
      await expect(body).toHaveClass(/nds-overflow-y/);
    });
  },
};

export const WithConfirmation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Mensagem curta e par de ações, com a principal na variante destrutiva. Vale para ' +
          'confirmação reversível; se a ação for realmente bloqueante, o componente é o AlertDialog.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.trigger(),
      tituloPainel: stripHtml(t('variants.compositions.withConfirmation.name')),
      descricaoPainel: LABEL.aviso(),
      rotuloFechar: LABEL.close(),
      rotuloDestruir: LABEL.destruir(),
    },
    template: `
      <nds-drawer [defaultOpen]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
            <button ndsButton variant="destructive">{{ rotuloDestruir }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const inside = within(panel);

    await step('A consequência está escrita, não subentendida', async () => {
      await expect(panel).toHaveAccessibleDescription(LABEL.aviso());
    });

    await step('A ação principal carrega a variante destrutiva', async () => {
      // Afirma a CLASSE resultante: sob JIT o input `variant` seria ignorado e o
      // botão sairia com a variante default, sem erro nenhum (armadilha 1).
      const destrutivo = inside.getByRole('button', { name: LABEL.destruir() });
      await expect(destrutivo).toHaveClass(/nds-button-destructive/);
    });

    await step('Cancelar continua sendo a saída de menor risco', async () => {
      const cancelar = inside.getByRole('button', { name: LABEL.close() });
      await expect(cancelar).toHaveClass(/nds-button-outline/);
    });
  },
};
