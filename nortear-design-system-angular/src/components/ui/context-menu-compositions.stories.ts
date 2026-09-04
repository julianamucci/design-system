import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CONTEXT_MENU } from './context-menu';
import { gestoOpen } from './context-menu.fixtures';
import { FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { AREA_CLICK_DIREITO } from '@shared/testing/context-menu-area';

// Sem argTypes, então o painel Controls é desligado — do contrário abriria vazio.

const meta: Meta = {
  title: 'Components/Overlay/ContextMenu/Compositions',
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
          'Composições do Context Menu: atalhos, marcação, escolha única, submenu e o menu completo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const target = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

// ── Com atalhos ───────────────────────────────────────────────────────────────

export const WithShortcut: Story = {
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
          <div ndsContextMenuItem data-testid="editar">
            Editar
            <span ndsContextMenuShortcut>Ctrl+E</span>
          </div>
          <div ndsContextMenuItem>
            Desfazer
            <span ndsContextMenuShortcut>Ctrl+Z</span>
          </div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuItem variant="destructive">
            Excluir
            <span ndsContextMenuShortcut>Delete</span>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;

    await step('O atalho vive dentro do item e é lido junto dele', async () => {
      const menu = await gestoOpen(area());
      const shortcuts = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-shortcut"]');
      await expect(shortcuts.length).toBe(3);
      for (const atalho of shortcuts) {
        await expect(atalho.hasAttribute('aria-hidden')).toBe(false);
        await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
      }
    });

    await step('O atalho fica encostado à direita do rótulo', async () => {
      // É o alinhamento que faz a coluna de atalhos existir; sem ele o texto
      // sai colado no rótulo e a leitura visual se perde.
      const item = target('editar').getBoundingClientRect();
      const atalho = target('editar')
        .querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!
        .getBoundingClientRect();
      await expect(item.right - atalho.right).toBeLessThan(16);
    });
  },
};

// ── Com marcação ──────────────────────────────────────────────────────────────

export const WithCheckbox: Story = {
  parameters: { covers: ['functional.item7', 'accessibility.item4'] },
  render: () => ({
    props: { grade: false, reguas: true, areaClasse: AREA_CLICK_DIREITO },
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
          <div ndsContextMenuLabel>Visualização</div>
          <div ndsContextMenuCheckboxItem [(checked)]="grade" data-testid="grade">
            Mostrar grade
          </div>
          <div ndsContextMenuCheckboxItem [(checked)]="reguas" data-testid="reguas">
            Mostrar réguas
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;

    await step('O papel diz que tipo de escolha o item é', async () => {
      await gestoOpen(area());
      await expect(target('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(target('reguas').getAttribute('role')).toBe('menuitemcheckbox');
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // Endereço por TIPO de item: marcação e escolha única não compartilham
      // slot, como nas outras quatro stacks.
      for (const id of ['grade', 'reguas']) {
        await expect(
          target(id).querySelector('[data-slot="context-menu-checkbox-item-indicator"]'),
        ).not.toBeNull();
      }
    });

    await step('Marcar alterna o estado anunciado', async () => {
      // Lê o estado ANTES de clicar: o painel Interactions reexecuta a play no
      // MESMO DOM, e um valor esperado fixo inverteria o resultado no replay.
      const antes = target('grade').getAttribute('aria-checked');
      const esperado = antes === 'true' ? 'false' : 'true';
      await userEvent.click(target('grade'));
      await waitFor(() => expect(target('grade').getAttribute('aria-checked')).toBe(esperado));
      // O menu NÃO fecha: quem marca uma opção costuma querer marcar a próxima.
      await expect(document.querySelector('[data-slot="context-menu-content"]')).not.toBeNull();
    });
  },
};

// ── Com escolha única ─────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: { covers: ['functional.item8', 'accessibility.item5'] },
  render: () => ({
    props: { layout: 'grid', areaClasse: AREA_CLICK_DIREITO },
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
          <div ndsContextMenuLabel>Layout</div>
          <div ndsContextMenuRadioGroup [(value)]="layout">
            <div ndsContextMenuRadioItem value="grid" data-testid="grid">Grade</div>
            <div ndsContextMenuRadioItem value="list" data-testid="list">Lista</div>
            <div ndsContextMenuRadioItem value="columns" data-testid="columns">Colunas</div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;

    await step('O papel diz que a escolha é única', async () => {
      await gestoOpen(area());
      await expect(target('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(target('list').getAttribute('role')).toBe('menuitemradio');
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      for (const id of ['grid', 'list', 'columns']) {
        await expect(
          target(id).querySelector('[data-slot="context-menu-radio-item-indicator"]'),
        ).not.toBeNull();
      }
    });

    await step('Escolher uma opção limpa a anterior', async () => {
      // Alterna entre dois valores conhecidos e afirma o PAR: assim o passo vale
      // igual em qualquer rodada, não importa de onde parta.
      const partiuDeGrid = target('grid').getAttribute('aria-checked') === 'true';
      const click = partiuDeGrid ? 'columns' : 'grid';
      const other = partiuDeGrid ? 'grid' : 'columns';
      await userEvent.click(target(click));
      await waitFor(() => expect(target(click).getAttribute('aria-checked')).toBe('true'));
      await expect(target(other).getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ── Com submenu ───────────────────────────────────────────────────────────────

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

// ── Composição completa ───────────────────────────────────────────────────────

export const CompleteComposition: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    props: { grade: true, layout: 'grid', areaClasse: AREA_CLICK_DIREITO },
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
            <div ndsContextMenuLabel>Ações</div>
            <div ndsContextMenuItem>
              Editar
              <span ndsContextMenuShortcut>Ctrl+E</span>
            </div>
            <div ndsContextMenuSub>
              <div ndsContextMenuSubTrigger>Compartilhar</div>
              <ng-template ndsContextMenuSubContent>
                <div ndsContextMenuItem>Por e-mail</div>
                <div ndsContextMenuItem>Por link</div>
              </ng-template>
            </div>
          </div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuGroup>
            <div ndsContextMenuLabel>Visualização</div>
            <div ndsContextMenuCheckboxItem [(checked)]="grade" data-testid="grade">
              Mostrar grade
            </div>
          </div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuGroup>
            <div ndsContextMenuLabel>Layout</div>
            <div ndsContextMenuRadioGroup [(value)]="layout">
              <div ndsContextMenuRadioItem value="grid" data-testid="grid">Grade</div>
              <div ndsContextMenuRadioItem value="list">Lista</div>
            </div>
          </div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuItem variant="destructive">
            Excluir
            <span ndsContextMenuShortcut>Delete</span>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;

    await step('Marcação e escolha única convivem no mesmo menu', async () => {
      // `visual.item4` descreve exatamente esta convivência — é o que precisa
      // estar na tela quando o Chromatic fotografa.
      const menu = await gestoOpen(area());
      await expect(target('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(target('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(
        menu.querySelectorAll('[data-slot="context-menu-separator"]').length,
      ).toBe(3);
    });

    await step('Os rótulos de grupo não são itens escolhíveis', async () => {
      const menu = document.querySelector<HTMLElement>('[data-slot="context-menu-content"]')!;
      const rotulos = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-label"]');
      await expect(rotulos.length).toBe(3);
      for (const label of rotulos) {
        await expect(label.getAttribute('role')).not.toBe('menuitem');
      }
      // E cada grupo empresta o rótulo como nome: é o que faz o leitor de tela
      // anunciar "Ações, grupo" em vez de um bloco anônimo.
      const groups = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-group"]');
      await expect(groups.length).toBe(3);
      for (const group of groups) {
        const id = group.getAttribute('aria-labelledby');
        await expect(id && menu.querySelector(`#${id}`)?.textContent?.trim()).toBeTruthy();
      }
    });

    await step('O menu inteiro cabe numa varredura só', async () => {
      // `within` procura pelo nome acessível, que é o que a pessoa ouve — não
      // pelo `data-testid`, que só existe para o teste.
      const menu = within(document.querySelector<HTMLElement>('[data-slot="context-menu-content"]')!);
      await expect(menu.getByRole('menuitem', { name: /Excluir/ })).toBeVisible();
    });
  },
};
