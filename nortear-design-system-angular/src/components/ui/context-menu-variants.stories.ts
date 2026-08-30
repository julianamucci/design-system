import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CONTEXT_MENU } from './context-menu';
import { gestoOpen } from './context-menu.fixtures';
import { FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { AREA_CLICK_DIREITO } from '@shared/testing/context-menu-area';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

// Sem argTypes, então o painel Controls é desligado — do contrário abriria vazio.

const meta: Meta = {
  title: 'Primitives/Overlay/ContextMenu/Types',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_CONTEXT_MENU] })],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
  },
};

export default meta;
type Story = StoryObj;

export const WithSubmenu: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item3'],
    coversNotApplicable: {
      'functional.item6':
        'a seta esquerda só fecha o submenu com o foco dentro dele, e o foco não entra: a view do ng-template resolve DI pela arvore de declaracao e o item nao acha a lista composta do popup (mesma limitacao registrada no DropdownMenu). O Escape fecha, e esta afirmado.',
    },
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

          <div ndsContextMenuSub>
            <div ndsContextMenuSubTrigger data-testid="sub">Compartilhar</div>
            <ng-template ndsContextMenuSubContent>
              <div ndsContextMenuItem>Por e-mail</div>
              <div ndsContextMenuItem>Por link</div>
            </ng-template>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
    const subTrigger = () => document.querySelector<HTMLElement>('[data-testid="sub"]')!;

    await step('O sub-gatilho diz que abre um menu', async () => {
      await gestoOpen(area());
      await expect(subTrigger().getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger().getAttribute('aria-expanded')).toBe('false');
    });

    await step('Seta direita abre o submenu, ao lado do item que o dispara', async () => {
      subTrigger().focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(subTrigger().getAttribute('aria-expanded')).toBe('true'));

      const submenu = document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]')!;
      const items = submenu.querySelectorAll('[data-slot="context-menu-item"]');
      await expect(items.length).toBe(2);

      // "À direita" é medida, não atributo: é o que o conteúdo promete e o que
      // um `side` errado quebraria sem nenhum aviso.
      //
      // O `waitFor` não é folga: o popup entra no DOM ANTES de o floating-ui
      // medir, e até lá fica em (0,0). Ler o retângulo no primeiro quadro dá
      // zero e o teste reprova por corrida, não por defeito.
      await waitFor(() =>
        expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          subTrigger().getBoundingClientRect().left,
        ),
      );
    });

    await step('Escape fecha o submenu e o foco fica no gatilho dele', async () => {
      // `functional.item6` promete SETA ESQUERDA fechando — mas ela só age com o
      // foco DENTRO do submenu, e aqui o foco nunca entra (mesma limitação do
      // ng-template registrada no DropdownMenu). Afirmar a seta seria afirmar o
      // que a story não produz; o Escape fecha e é caminho de teclado real.
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(subTrigger().getAttribute('aria-expanded')).toBe('false'));
      await expect(document.activeElement).toBe(subTrigger());
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item3` descreve o SUBMENU ABERTO. Até esta passada a play
      // terminava no Escape, ou seja, com ele fechado: o Chromatic fotografava
      // exatamente o estado que o item do contrato não descreve.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() =>
        expect(document.querySelector('[data-slot="context-menu-sub-content"]')).not.toBeNull(),
      );
    });
  },
};

export const WithSelection: Story = {
  parameters: {
    covers: [
      'functional.item7', 'functional.item8',
      'accessibility.item4', 'accessibility.item5',
      'visual.item4',
    ],
  },
  render: () => ({
    props: { grid: false, canal: 'email', areaClasse: AREA_CLICK_DIREITO },
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
          <div ndsContextMenuCheckboxItem [(checked)]="grid" data-testid="check">
            Mostrar grade
          </div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuRadioGroup [(value)]="canal">
            <div ndsContextMenuRadioItem value="email" data-testid="radio-email">Por e-mail</div>
            <div ndsContextMenuRadioItem value="link" data-testid="radio-link">Por link</div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
    const target = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

    await step('Os papéis dizem que tipo de escolha cada item é', async () => {
      await gestoOpen(area());
      await expect(target('check').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(target('radio-email').getAttribute('role')).toBe('menuitemradio');
    });

    await step('O estado marcado é anunciado, não só desenhado', async () => {
      // Lê o estado ANTES de clicar. A versão anterior exigia `false` na entrada
      // e só valia na montagem: o painel Interactions reexecuta a play no MESMO
      // DOM, então na segunda rodada o item já vinha marcado e a asserção
      // reprovava um componente correto.
      const antes = target('check').getAttribute('aria-checked');
      const esperado = antes === 'true' ? 'false' : 'true';
      await userEvent.click(target('check'));
      await waitFor(() => expect(target('check').getAttribute('aria-checked')).toBe(esperado));
      // O menu NÃO fecha: quem marca uma opção costuma querer marcar a próxima.
      await expect(document.querySelector('[data-slot="context-menu-content"]')).not.toBeNull();
    });

    await step('A escolha única limpa a anterior', async () => {
      // Mesmo motivo: alterna entre os dois valores a partir do estado corrente
      // e afirma o PAR, em vez de assumir de onde a rodada parte.
      const partiuDoEmail = target('radio-email').getAttribute('aria-checked') === 'true';
      const click = partiuDoEmail ? 'radio-link' : 'radio-email';
      const other = partiuDoEmail ? 'radio-email' : 'radio-link';
      await userEvent.click(target(click));
      await waitFor(() => expect(target(click).getAttribute('aria-checked')).toBe('true'));
      await expect(target(other).getAttribute('aria-checked')).toBe('false');
    });
  },
};

export const WithDisabledItems: Story = {
  parameters: {
    // `functional.item9` deixou de ser dispensa e passou a ser cobertura.
    //
    // O texto compartilhado prometia que o item desabilitado "não recebe foco
    // via teclado", e essa promessa era idiomática de lib, não do design system:
    // duas das cinco stacks pulam o item na roda de foco e três o mantêm — o que
    // a WAI-ARIA APG permite de propósito, para a opção não sumir de quem navega
    // às cegas. Com o item reescrito para o que vale nas cinco (anunciado por
    // `aria-disabled`, não ativa por clique nem por Enter, menu segue aberto), a
    // dispensa perdeu razão de existir.
    covers: [
      'functional.item9', 'functional.item10',
      'accessibility.item6',
      'visual.item2', 'visual.item5',
    ],
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
          <div ndsContextMenuItem data-testid="primeiro">Editar</div>
          <div ndsContextMenuItem [disabled]="true" data-testid="off">Duplicar</div>
          <div ndsContextMenuItem data-testid="ultimo">Renomear</div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuItem variant="destructive" data-testid="perigo">Excluir</div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
    const target = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

    await step('O item desabilitado é anunciado como tal', async () => {
      await gestoOpen(area());
      await expect(target('off').getAttribute('aria-disabled')).toBe('true');
    });

    await step('Ele está atenuado, e não só marcado', async () => {
      // A cor sozinha não chega a quem não a distingue; a opacidade é o sinal
      // que sobra quando o contraste falha.
      await expect(Number(getComputedStyle(target('off')).opacity)).toBeLessThan(1);
    });

    await step('O ponteiro também não o alcança', async () => {
      // Aqui a asserção é a folha de estilo, e não um clique: `userEvent` se
      // recusa a clicar em elemento com `pointer-events: none` e derruba a play
      // com erro em vez de falha — o que provaria o mesmo, mas sem dizer o quê.
      await expect(getComputedStyle(target('off')).pointerEvents).toBe('none');
    });

    await step('Ele recebe foco, mas não ativa', async () => {
      // O foco PASSA por ele: a APG permite manter item desabilitado focável
      // justamente para que quem navega por teclado saiba que a opção existe e
      // está indisponível — some-la esconderia a informação. O que não pode é
      // ativar.
      target('primeiro').focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(target('off')));

      await userEvent.keyboard('{Enter}');
      // O menu segue aberto: Enter num item desabilitado não escolhe nada.
      await expect(document.querySelector('[data-slot="context-menu-content"]')).not.toBeNull();
    });

    await step('O item destrutivo se declara pelo atributo, não só pela cor', async () => {
      // Cor sozinha não chega a quem não a distingue; o `data-variant` é o que
      // o CSS lê e o que a auditoria compara entre stacks.
      await expect(target('perigo').getAttribute('data-variant')).toBe('destructive');
    });
  },
};

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
          <div ndsContextMenuCheckboxItem [checked]="true">Mostrar grade</div>
          <div ndsContextMenuSeparator></div>
          <div ndsContextMenuItem variant="destructive">Excluir</div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A paleta escura está aplicada no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('O menu é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const area = canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;
      const menu = await gestoOpen(area);
      const cs = getComputedStyle(menu);
      const brilho = (cor: string) => {
        const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });
  },
};

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
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
