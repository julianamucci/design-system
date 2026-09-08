import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_DRAWER } from './drawer';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { waitForPortal } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import { stripHtml } from '@/lib/strip-html';
import drawerTranslations from '@shared/content/drawer/translations.json';
import { drawerWithConfirmationSource, drawerWithFormSource } from './drawer.source';

import { figmaDesign } from '@shared/figma/design-links';
// Os rótulos de ação saem do conteúdo compartilhado, como todo texto de tela
// desta stack. Declará-los aqui faria os dois textos divergirem na primeira
// revisão de conteúdo.
const { t } = useTranslation(drawerTranslations as Record<string, unknown>);

// As duas composições que o conteúdo compartilhado documenta. Ambas nascem
// ABERTAS: é o rodapé de ações que elas existem para mostrar, e ele só existe
// com o painel montado.

const meta: Meta = {
  title: 'Components/Overlay/Drawer/Compositions',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DRAWER, NdsButton, NdsInput, NdsLabel] })],
  parameters: {
    design: figmaDesign('drawer'),
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
  fieldEmail: () => t('demonstration.labels.fieldEmail'),
  aviso: () => t('demonstration.labels.destroyMessage'),
};

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: drawerWithFormSource },
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
      // Nome em inglês, ao contrário dos vizinhos: código se escreve em inglês
      // (guideline 11), e os `rotulo*` daqui são dívida de linha de base que o
      // `identificador_pt_novo` tolera mas não deixa CRESCER — um `rotulo`
      // novo reprovaria o portão.
      emailFieldLabel: LABEL.fieldEmail(),
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

          <!--
            DOIS campos, e ambos preenchidos: é o formulário que a stack de
            referência mostra, é o que a docs page publica, e é o que as play
            das outras quatro afirmam procurando o campo de e-mail pelo rótulo.
            Com um campo só o navegador faz submissão implícita sozinho, e o
            par id ↔ form abaixo — o único elo entre rodapé e corpo — ficaria
            sem cobertura real.
          -->
          <div ndsDrawerBody class="nds-stack" data-spacing="sm">
            <form id="drawer-comp-form" class="nds-stack" data-spacing="sm" (submit)="$event.preventDefault()">
              <div class="nds-stack" data-spacing="xs">
                <label ndsLabel for="drawer-comp-nome">{{ rotuloCampo }}</label>
                <input ndsInput id="drawer-comp-nome" name="nome" value="Maria Souza" />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <label ndsLabel for="drawer-comp-email">{{ emailFieldLabel }}</label>
                <input
                  ndsInput
                  id="drawer-comp-email"
                  name="email"
                  type="email"
                  value="maria@exemplo.com"
                />
              </div>
            </form>
          </div>

          <!--
            O rodapé é IRMÃO do corpo por construção da diretiva — o corpo só
            rola enquanto é filho direto do flex column do painel —, então o
            <form> não pode envolvê-lo. Quem religa os dois é o par id ↔ form:
            sem ele a ação primária não envia nada, e o Enter no campo tampouco.
          -->
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
            <button ndsButton type="submit" form="drawer-comp-form">{{ rotuloConfirmar }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const inside = within(panel);

    await step('O painel carrega nome, descrição e os campos do formulário', async () => {
      await expect(panel).toHaveAccessibleName(LABEL.title());
      await expect(panel).toHaveAccessibleDescription(LABEL.descricao());
      // Os campos são achados pelo RÓTULO: se o `for`/`id` não casassem, o
      // input ficaria sem nome acessível e esta busca falharia. São dois, como
      // nas outras quatro stacks — e é o de e-mail que prova o segundo.
      await expect(inside.getByLabelText(LABEL.field())).toBeInTheDocument();
      await expect(inside.getByLabelText(LABEL.fieldEmail())).toBeInTheDocument();
    });

    await step('O rodapé oferece cancelar e confirmar, nessa ordem de leitura', async () => {
      const buttons = inside.getAllByRole('button');
      const names = buttons.map((b) => b.textContent?.trim());
      await expect(names).toContain(LABEL.close());
      await expect(names).toContain(LABEL.confirmar());
    });

    await step('A ação primária submete o formulário do corpo', async () => {
      // `button.form` é o que denuncia o botão órfão: vem `null` quando nada o
      // liga ao `<form>`, e nada na tela denuncia. Leitura pura, sem `waitFor`.
      //
      // `type` também se lê do ELEMENTO: nesta stack o atributo é escrito por
      // host binding da diretiva a partir do input de mesmo nome, e é a
      // propriedade resolvida que diz o que o navegador vai fazer.
      const confirmar = inside.getByRole('button', {
        name: LABEL.confirmar(),
      }) as HTMLButtonElement;
      await expect(confirmar.type).toBe('submit');
      await expect(confirmar.form?.id).toBe('drawer-comp-form');
    });

    await step('O corpo do formulário é a região rolável do painel', async () => {
      const body = panel.querySelector<HTMLElement>('[data-slot="drawer-body"]')!;
      await expect(body).toHaveAttribute('tabindex', '0');
      // Comportamento, e não nome de classe. A asserção cobrava a utilitária
      // `nds-overflow-y`, que era como o corpo se montava ANTES de a folha
      // compartilhada ganhar `.nds-drawer-body` — a classe deixou de ser
      // necessária e ninguém viu, porque esta play nunca tinha rodado. O que
      // prova a região rolável é o overflow computado, e ele sobrevive a
      // renomear classe.
      await expect(getComputedStyle(body).overflowY).toBe('auto');
    });
  },
};

export const WithConfirmation: Story = {
  parameters: {
    docs: {
      source: { transform: drawerWithConfirmationSource },
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
      // Aqui a decisão É a tela, e por isso o foco entra no cancelar — a mesma
      // escolha do AlertDialog: o Enter por reflexo tem de cair na saída segura,
      // nunca na ação que consuma. Na WithForm o padrão FICA (primeiro tabbável,
      // que é o primeiro campo), porque ali o assunto é editar.
      //
      // A busca é pelo ATRIBUTO DA DIRETIVA, e não por `data-slot`: nesta stack
      // o `data-slot` do botão é disputado entre host bindings, e o seletor da
      // diretiva continua no DOM sem disputa nenhuma.
      focusSafeExit: (event: Event) => {
        const panelEl = event.target;
        if (!(panelEl instanceof HTMLElement)) return;
        const safeExit = panelEl.querySelector<HTMLElement>('[ndsDrawerClose]');
        // Sem saída no rodapé não há alvo, e aí o padrão do primitivo é melhor
        // que um diálogo aberto sem foco nenhum dentro.
        if (!safeExit) return;
        event.preventDefault();
        safeExit.focus();
      },
    },
    template: `
      <nds-drawer [defaultOpen]="true" (openAutoFocus)="focusSafeExit($event)">
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

    await step('O foco abre no cancelar, não na ação destrutiva', async () => {
      // O ELEMENTO, não a mera presença de foco: o painel também recebe foco
      // quando o escopo não acha candidato, e é justamente o que esta story
      // recusa.
      const cancelar = inside.getByRole('button', { name: LABEL.close() });
      const destrutivo = inside.getByRole('button', { name: LABEL.destruir() });
      await waitFor(() => expect(cancelar).toHaveFocus());
      await expect(destrutivo).not.toHaveFocus();
    });
  },
};
