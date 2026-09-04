import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CONTEXT_MENU } from './context-menu';
import { gestoOpen } from './context-menu.fixtures';
import { FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { AREA_CLICK_DIREITO, brilho } from '@shared/testing/context-menu-area';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

// Sem argTypes, então o painel Controls é desligado — do contrário abriria vazio.

const meta: Meta = {
  title: 'Components/Overlay/ContextMenu/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_CONTEXT_MENU] })],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component:
          'Estados do Context Menu: item desabilitado, item recuado, item destrutivo e a paleta escura.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const target = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

// ── Item desabilitado ─────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    // `functional.item9` deixou de ser dispensa e passou a ser cobertura.
    //
    // Histórico, porque o texto compartilhado mudou de lado duas vezes. Ele
    // prometia que o item desabilitado "não recebe foco via teclado"; essa
    // promessa era idiomática de lib e não do design system, porque as stacks se
    // dividiam, e por isso foi reescrita para o que valia nas cinco (anunciado
    // por `aria-disabled`, não ativa por clique nem por Enter, menu segue
    // aberto). Em 2026-09-02 a divergência foi RESOLVIDA por decisão: a seta
    // pousa no item desabilitado nas cinco, e `accessibility.item9` promete
    // isso. O passo "Ele recebe foco, mas não ativa" é quem o cobra aqui.
    covers: ['functional.item9', 'accessibility.item6', 'accessibility.item9', 'visual.item5'],
  },
  render: () => ({
    props: { areaClasse: AREA_CLICK_DIREITO },
    template: `
      <div ndsContextMenu>
        <div
          ndsContextMenuTrigger
          [class]="areaClasse"
          data-align="center"
          data-justify="center"
          data-testid="area"
        >Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem data-testid="primeiro">
            Editar
            <span ndsContextMenuShortcut>Ctrl+E</span>
          </div>
          <div ndsContextMenuItem [disabled]="true" data-testid="off">Duplicar</div>
          <div ndsContextMenuItem data-testid="ultimo">Renomear</div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuItem variant="destructive" [disabled]="true" data-testid="perigo-off">
            Excluir
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;

    await step('O item desabilitado é anunciado como tal', async () => {
      await gestoOpen(area());
      await expect(target('off').getAttribute('aria-disabled')).toBe('true');
      await expect(target('perigo-off').getAttribute('aria-disabled')).toBe('true');
    });

    await step('Ele está atenuado, e não só marcado', async () => {
      // A cor sozinha não chega a quem não a distingue; a opacidade é o sinal
      // que sobra quando o contraste falha.
      await expect(Number(getComputedStyle(target('off')).opacity)).toBeLessThan(1);
    });

    await step('A seta POUSA no item desabilitado', async () => {
      // Decisão de 2026-09-02, nas cinco stacks: o item desabilitado continua no
      // percurso das setas para ser ANUNCIADO como indisponível. Some-lo da roda
      // esconderia de quem navega de ouvido que a opção existe.
      //
      // O que prova isso é APERTAR a seta e ver onde o foco pousa. Afirmar a
      // presença de `tabindex` não provaria: a diretiva o liga em TODO item,
      // desabilitado ou não, e por isso não reprovaria nunca.
      target('primeiro').focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(target('off')));
    });

    await step('Enter nele não escolhe nada e o menu segue aberto', async () => {
      // Ativar um item desabilitado é o caso raro em que a play pode repetir sem
      // preparo: ele não muda de estado em rodada nenhuma.
      await userEvent.keyboard('{Enter}');
      await expect(document.querySelector('[data-slot="context-menu-content"]')).not.toBeNull();
    });

    await step('O ponteiro também não o alcança', async () => {
      // Aqui a asserção é a folha de estilo, e não um clique: `userEvent` se
      // recusa a clicar em elemento com `pointer-events: none` e derruba a play
      // com erro em vez de falha — o que provaria o mesmo, mas sem dizer o quê.
      await expect(getComputedStyle(target('off')).pointerEvents).toBe('none');
    });
  },
};

// ── Item recuado ──────────────────────────────────────────────────────────────

export const ItemInset: Story = {
  render: () => ({
    props: { areaClasse: AREA_CLICK_DIREITO },
    template: `
      <div ndsContextMenu>
        <div
          ndsContextMenuTrigger
          [class]="areaClasse"
          data-align="center"
          data-justify="center"
          data-testid="area"
        >Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuGroup>
            <div ndsContextMenuLabel [inset]="true">Arquivo</div>
            <div ndsContextMenuItem data-testid="normal">Editar</div>
            <div ndsContextMenuItem [inset]="true" data-testid="recuado">Duplicar</div>
          </div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuItem [inset]="true" variant="destructive">Excluir</div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;

    await step('O recuo é geometria, não classe', async () => {
      // O que o recuo entrega é o alinhamento com itens que têm indicador à
      // esquerda. Afirmar o nome da classe não protegeria isso: a classe pode
      // continuar aplicada com a regra vazia.
      await gestoOpen(area());
      const recuo = parseFloat(getComputedStyle(target('recuado')).paddingLeft);
      const normal = parseFloat(getComputedStyle(target('normal')).paddingLeft);
      await expect(recuo).toBeGreaterThan(normal);
    });

    await step('Os dois itens continuam alinhados à direita', async () => {
      // O recuo empurra só a borda esquerda: se empurrasse a caixa inteira, o
      // menu ganharia um degrau à direita.
      const recuo = target('recuado').getBoundingClientRect();
      const normal = target('normal').getBoundingClientRect();
      await expect(Math.abs(recuo.right - normal.right)).toBeLessThan(2);
    });
  },
};

// ── Item destrutivo ───────────────────────────────────────────────────────────

export const ItemDestructive: Story = {
  parameters: { covers: ['functional.item10', 'visual.item2'] },
  render: () => ({
    props: { areaClasse: AREA_CLICK_DIREITO },
    template: `
      <div ndsContextMenu>
        <div
          ndsContextMenuTrigger
          [class]="areaClasse"
          data-align="center"
          data-justify="center"
          data-testid="area"
        >Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuGroup>
            <div ndsContextMenuItem data-testid="normal">
              Editar
              <span ndsContextMenuShortcut>Ctrl+E</span>
            </div>
            <div ndsContextMenuItem>Duplicar</div>
          </div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuItem variant="destructive" data-testid="perigo">
            Excluir permanentemente
            <span ndsContextMenuShortcut>Delete</span>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;

    await step('O item destrutivo se declara pelo atributo, não só pela cor', async () => {
      // `data-variant` é o que o CSS lê e o que a auditoria compara entre
      // stacks; a cor é consequência dele.
      await gestoOpen(area());
      await expect(target('perigo').getAttribute('data-variant')).toBe('destructive');
      await expect(target('normal').getAttribute('data-variant')).toBe('default');
    });

    await step('E a cor do texto realmente muda', async () => {
      await expect(getComputedStyle(target('perigo')).color).not.toBe(
        getComputedStyle(target('normal')).color,
      );
    });
  },
};

// ── Item de marcação em estado misto ──────────────────────────────────────────
//
// Story SEM interação sobre os itens, de propósito. O que ela declara vale na
// montagem, e o primeiro clique num item misto o resolve para marcado — uma play
// que clicasse mediria outro estado no REPLAY do painel Interactions, que
// reexecuta no mesmo DOM. Abrir o menu é idempotente: `gestoOpen` parte das
// coordenadas da área, não do estado anterior.

export const CheckboxIndeterminate: Story = {
  parameters: { covers: ['functional.item11'] },
  render: () => ({
    props: { areaClasse: AREA_CLICK_DIREITO },
    template: `
      <div ndsContextMenu>
        <div
          ndsContextMenuTrigger
          [class]="areaClasse"
          data-align="center"
          data-justify="center"
          data-testid="area"
        >Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuLabel>Mostrar na tela</div>
          <div ndsContextMenuCheckboxItem [checked]="'indeterminate'">Colunas</div>
          <div ndsContextMenuCheckboxItem [checked]="true">Régua</div>
          <div ndsContextMenuCheckboxItem [checked]="false">Grade</div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
    const menu = await gestoOpen(area);
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Colunas' });
    const checked = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria `'indeterminate'` como verdadeiro; o que a
      // pessoa ouve tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(checked.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. Com o mesmo símbolo
      // nos dois estados — o defeito — esta asserção fica vermelha.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(checked);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado não mostra glifo nenhum', async () => {
      // Aqui o indicador CONTINUA montado (é assim que a lib deixa possível uma
      // animação de saída) e some por `display: none`. Sem caixa de layout o
      // `getBBox` devolve tudo zerado, que é o que o colhedor lê como
      // "sem glifo" — a asserção mede o que a pessoa vê, não o que existe.
      await expect(formaDoIndicador(desmarcado)).toBeNull();
    });
  },
};

// ── Paleta escura ─────────────────────────────────────────────────────────────

export const DarkPalette: Story = {
  parameters: {
    covers: ['visual.item6'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  render: () => ({
    props: { areaClasse: AREA_CLICK_DIREITO },
    template: `
      <div ndsContextMenu>
        <div
            ndsContextMenuTrigger
            [class]="areaClasse"
            data-align="center"
            data-justify="center"
            data-testid="area"
          >Clique com o botão direito aqui</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>Editar</div>
          <div ndsContextMenuItem [disabled]="true">Duplicar</div>
          <div ndsContextMenuSeparator></div>
          <div ndsContextMenuItem variant="destructive">Excluir</div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A paleta escura está aplicada no documento', async () => {
      await waitFor(() =>
        expect(document.documentElement.classList.contains('dark')).toBe(true),
      );
    });

    await step('O menu é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const area = canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
      const menu = await gestoOpen(area);
      const cs = getComputedStyle(menu);
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });
  },
};
