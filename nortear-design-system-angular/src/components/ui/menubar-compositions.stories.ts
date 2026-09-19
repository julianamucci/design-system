import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_MENUBAR } from './menubar';
import {
  menubarEditorSource,
  menubarWithCheckboxSource,
  menubarWithRadioSource,
  menubarWithShortcutsSource,
  menubarWithSubmenuSource,
} from './menubar.source';
import { waitForPortal, waitForPousado, FOCUS_RULE_GUARDA, axeRules } from '@/lib/wait-for-portal';

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
const SHORTCUTS = [
  { label: 'Desfazer', atalho: 'Ctrl+Z' },
  { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
  { label: 'Copiar', atalho: 'Ctrl+C' },
] as const;

const EXPORTACOES = ['PDF', 'CSV', 'PNG'] as const;

const EXIBICOES = ['Régua', 'Barra lateral', 'Grade'] as const;

const THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Do sistema' },
] as const;

const MENUS_EDITOR = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'] as const;

const meta: Meta = {
  title: 'Components/Navigation/Menubar/Compositions',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_MENUBAR] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    // Sem `args` próprios: sem isto a aba Actions lista espião que estas stories
    // não usam, do mesmo jeito que o Controls abriria vazio.
    actions: { disable: true },
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    docs: {
      description: {
        component:
          'As composições canônicas de um menu da barra: atalhos visíveis, submenu, ' +
          'alternadores independentes, escolha única e a barra completa de um editor.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── WithShortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    // F16: o atalho à direita do rótulo e dentro do nome acessível do item.
    covers: ['functional.item16', 'visual.item2'],
    docs: { source: { transform: menubarWithShortcutsSource } },
  },
  render: () => ({
    props: { shortcuts: SHORTCUTS },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Editar</button>

          <ng-template ndsMenubarContent>
            @for (a of shortcuts; track a.label) {
              <div ndsMenubarItem>
                {{ a.label }}
                <span ndsMenubarShortcut>{{ a.atalho }}</span>
              </div>
            }
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('Cada item leva o próprio atalho', async () => {
      await expect(items).toHaveLength(SHORTCUTS.length);
      const shortcuts = menu.querySelectorAll('[data-slot="menubar-shortcut"]');
      await expect(shortcuts).toHaveLength(SHORTCUTS.length);
    });

    await step('O atalho entra no nome do item, e não fica escondido do leitor', async () => {
      // Sem `aria-hidden`: "Desfazer, Control Z" é o que dá serventia ao atalho
      // para quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of items.entries()) {
        await expect(item).toHaveAccessibleName(`${SHORTCUTS[i].label} ${SHORTCUTS[i].atalho}`);
      }
    });

    await step('O atalho é secundário — cor esmaecida à direita do rótulo', async () => {
      const atalho = menu.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
      await expect(atalho.classList.contains('nds-dropdown-menu-shortcut')).toBe(true);
      await expect(getComputedStyle(atalho).color).not.toBe(getComputedStyle(items[0]).color);
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      // O título do passo acima dizia "à direita" e só a cor era medida.
      // `margin-left: auto` é o mecanismo, mas num item flex o valor computado já
      // vem resolvido em pixels — o que dá para afirmar é o resultado: o atalho
      // encosta na direita e o rótulo fica na esquerda.
      const item = items[items.length - 1];
      const atalho = item.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
      const itemBox = item.getBoundingClientRect();
      const shortcutBox = atalho.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(shortcutBox.left - itemBox.left);
    });
  },
};

// ─── WithSubmenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: menubarWithSubmenuSource } },
  },
  render: () => ({
    props: { exportacoes: EXPORTACOES },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Arquivo</button>

          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>Novo</div>

            <nds-menubar-sub>
              <div ndsMenubarSubTrigger>Exportar</div>

              <ng-template ndsMenubarSubContent>
                @for (e of exportacoes; track e) {
                  <div ndsMenubarItem>{{ e }}</div>
                }
              </ng-template>
            </nds-menubar-sub>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });
    const barTrigger = within(within(canvasElement).getByRole('menubar')).getByRole('menuitem', {
      name: 'Arquivo',
    });
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="menubar-sub-content"]');
    const firstSubItem = () =>
      submenu()?.querySelector<HTMLElement>('[data-slot="menubar-item"]') ?? null;

    // Só o submenu fechou: o painel pai é o MESMO nó de antes, segue no
    // documento, e o gatilho da barra continua aberto. Numa barra a seta
    // esquerda também é "vá ao menu vizinho" — é esta conferência que separa
    // fechar o submenu de trocar de menu.
    const parentStillOpen = async () => {
      await waitFor(() => expect(body.getAllByRole('menu')).toHaveLength(1));
      await expect(menu.isConnected).toBe(true);
      await expect(barTrigger.getAttribute('aria-expanded')).toBe('true');
      await expect(barTrigger.getAttribute('data-state')).toBe('open');
    };

    await step('O sub-gatilho anuncia que abre outro menu', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      // Fechado, não há painel: apontar para um `id` que saiu do documento é
      // pior que não apontar.
      await expect(subTrigger.getAttribute('aria-owns')).toBeNull();
    });

    await step('Seta Baixo alcança o sub-gatilho; Seta Direita abre o submenu e o foco ENTRA nele', async () => {
      // O painel PAI assenta ANTES de o submenu abrir. `waitForPortal` libera
      // com `opacity >= 0.9`, e aí o `translateY` + `scale(0.98)` da entrada
      // ainda corre: o sub-gatilho mora dentro do pai, então abrir agora ancora
      // o subpainel contra um item EM MOVIMENTO — e ele fica lá, porque o
      // observador de reposicionamento acompanha rolagem, redimensionamento e
      // mudança de TAMANHO, e `transform` não muda nenhum dos três. A deriva é
      // da ordem de 1px, a mesma distância que a asserção de alinhamento abaixo
      // precisa separar.
      await waitForPousado(menu);

      // Idempotente: só navega quando o submenu ainda está fechado. A seta
      // direita vai sempre — com o submenu já aberto, ela ainda tem de levar o
      // foco para dentro, que é o caso que a lib não cobre sozinha.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(async () => {
          await expect(document.activeElement).toBe(subTrigger);
        });
      } else {
        subTrigger.focus();
      }
      await userEvent.keyboard('{ArrowRight}');

      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu.
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
      // Abrir sem entrar deixaria a pessoa vendo um painel que a seta seguinte
      // não percorre. Era o defeito deste stack (WCAG 2.1.1): a seta abria e o
      // foco ficava no sub-gatilho.
      await waitFor(() => expect(document.activeElement).toBe(firstSubItem()));
    });

    await step('O sub-gatilho aponta para ESTE painel pelo aria-owns', async () => {
      // O painel é portalado para fora da barra, então `aria-expanded` sozinho
      // diz que ABRIU sem dizer O QUÊ. Quem devolve a relação é `aria-owns` — e
      // ele tem de apontar para o painel aberto, não para um id qualquer.
      const panel = submenu()!;
      await expect(panel.id).not.toBe('');
      await expect(subTrigger.getAttribute('aria-owns')).toBe(panel.id);
    });

    await step('O submenu traz os próprios itens e abre AO LADO do pai', async () => {
      const panel = submenu()!;
      await expect(within(panel).getAllByRole('menuitem')).toHaveLength(EXPORTACOES.length);
      // `side="right"` é o padrão do submenu neste stack: um submenu que nasce
      // embaixo cobriria os irmãos do item que o abriu.
      await expect(panel.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        menu.getBoundingClientRect().left,
      );
    });

    await step('O primeiro item do submenu alinha com o SUB-GATILHO que o abriu', async () => {
      // O RESULTADO que a D15 fixa: o topo do primeiro item do submenu no topo
      // do sub-gatilho, não o topo da CAIXA. Medir o ITEM é o que dá dentes —
      // uma asserção sobre o topo do painel passaria com `alignOffset: 0`, que
      // é o que a lib faz sozinha.
      //
      // Os números, medidos em 2026-09-19 com o painel assentado:
      //
      //     alignOffset  0 → +5,00   -3 → +2,00   -4 → +1,00   -5 → 0,00   -6 → -1,00
      //
      // O `-4` que a primeira versão da D15 mandava aplicar deixa o item 1px
      // abaixo do gatilho: a derivação era o `--spacing-1` de padding do painel
      // e esquecia o `border: 1px` que vem junto. São 5px, não 4.
      //
      // Tolerância 0,75, e não 1: os dois candidatos ficam a exatamente 1px um
      // do outro, e com tolerância 1 a asserção passaria com o `-4` de volta.
      //
      // Esta asserção cobre só o SUBMENU. O painel da barra usa `-4`, que é
      // número da família (react e vue declaram o mesmo) e não sai daqui — o que
      // ele produz está medido em `menubar.ts`.
      // Os DOIS painéis assentados: o pai porque é nele que o sub-gatilho mora,
      // o filho porque é ele que acabou de ser posicionado.
      await waitForPousado(menu);
      const panel = submenu()!;
      await waitForPousado(panel);
      const itemBox = firstSubItem()!.getBoundingClientRect();
      const triggerBox = subTrigger.getBoundingClientRect();
      await expect(
        Math.abs(itemBox.top - triggerBox.top),
        `1º item em ${itemBox.top.toFixed(2)}, sub-gatilho em ${triggerBox.top.toFixed(2)}` +
          ` · caixa do painel a ${(panel.getBoundingClientRect().top - triggerBox.top).toFixed(2)}`,
      ).toBeLessThanOrEqual(0.75);

      // A outra metade da D15, e a âncora é o SUB-GATILHO, não a borda do painel
      // pai: `sideOffset: 0` encosta o subpainel no item que o abriu. O passo
      // anterior compara com o pai e passa com `sideOffset: 8`; esta linha é a
      // que tem dentes.
      await expect(
        Math.abs(panel.getBoundingClientRect().left - triggerBox.right),
        `painel a ${panel.getBoundingClientRect().left.toFixed(2)}, ` +
          `borda direita do sub-gatilho em ${triggerBox.right.toFixed(2)}`,
      ).toBeLessThanOrEqual(0.75);
    });

    await step('Seta esquerda fecha SÓ o submenu e devolve o foco ao sub-gatilho', async () => {
      await expect(document.activeElement).toBe(firstSubItem());
      await userEvent.keyboard('{ArrowLeft}');

      await waitFor(() => expect(subTrigger.getAttribute('aria-expanded')).toBe('false'));
      // Fechou: a ligação sai junto com o painel.
      await expect(subTrigger.getAttribute('aria-owns')).toBeNull();
      await waitFor(() => expect(document.activeElement).toBe(subTrigger));
      await parentStillOpen();
    });

    await step('Escape dentro do submenu fecha SÓ o submenu, com o mesmo destino', async () => {
      // O foco está no sub-gatilho (passo anterior): a seta reabre e entra.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toBe(firstSubItem()));

      // Escape fecha o nível mais fundo, não o menu da barra: o painel do
      // submenu precisa ser FILHO do pai na árvore flutuante para a lib saber
      // que existe um nível a quem ceder.
      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(subTrigger.getAttribute('aria-expanded')).toBe('false'));
      await waitFor(() => expect(document.activeElement).toBe(subTrigger));
      await parentStillOpen();
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item4` descreve o menu com o submenu aberto: é esse o estado
      // que o Chromatic fotografa.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toBe(firstSubItem()));
    });
  },
};

// ─── WithCheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item3'],
    docs: { source: { transform: menubarWithCheckboxSource } },
  },
  render: () => ({
    props: { exibicoes: EXIBICOES, marcados: { 'Régua': true, 'Barra lateral': false, 'Grade': false } },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Exibir</button>

          <ng-template ndsMenubarContent>
            <div ndsMenubarLabel>Mostrar na tela</div>
            @for (e of exibicoes; track e) {
              <div
                ndsMenubarCheckboxItem
                [checked]="marcados[e]"
                (checkedChange)="marcados[e] = $event"
              >{{ e }}</div>
            }
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const boxes = canvas.getAllByRole('menuitemcheckbox');

    await step('Cada linha é uma caixa de seleção independente', async () => {
      await expect(boxes).toHaveLength(EXIBICOES.length);
      for (const box of boxes) {
        await expect(box.getAttribute('data-slot')).toBe('menubar-checkbox-item');
        await expect(box.getAttribute('aria-checked')).toBeTruthy();
      }
    });

    await step('Alternar reflete no estado anunciado e no marcador visual', async () => {
      const target = boxes[EXIBICOES.indexOf('Barra lateral')];
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (target.getAttribute('aria-checked') !== 'true') await userEvent.click(target);
      await waitFor(async () => {
        await expect(target.getAttribute('aria-checked')).toBe('true');
        // O marcador visual acompanha: `aria-checked` é o que a pessoa ouve,
        // `data-checked` é o que o CSS usa para desenhar o tique.
        await expect(target.hasAttribute('data-checked')).toBe(true);
      });
    });

    await step('Marcar não fecha o menu — quem marca uma quer marcar a próxima', async () => {
      await expect(document.body.contains(menu)).toBe(true);
      // E o documento o confirma: UM menu, sem a marca de fechado. A referência
      // capturada antes do clique sozinha passaria durante a animação de saída.
      const menus = within(document.body).queryAllByRole('menu');
      await expect(menus).toHaveLength(1);
      await expect(menus[0].hasAttribute('data-closed')).toBe(false);
      const other = boxes[EXIBICOES.indexOf('Grade')];
      await expect(other.getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    // F15: a opção escolhida passa a marcada, a anterior é desmarcada, e o menu
    // SEGUE aberto — o último passo conta os menus no documento.
    covers: ['functional.item15', 'accessibility.item5'],
    docs: { source: { transform: menubarWithRadioSource } },
  },
  render: () => ({
    props: { temas: THEMES, theme: 'light' },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Aparência</button>

          <ng-template ndsMenubarContent>
            <div ndsMenubarRadioGroup [value]="theme" (valueChange)="theme = $event">
              <div ndsMenubarLabel>Tema</div>
              @for (t of temas; track t.value) {
                <div ndsMenubarRadioItem [value]="t.value">{{ t.label }}</div>
              }
            </div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const options = within(menu).getAllByRole('menuitemradio');

    await step('O grupo publica escolha única, e só uma opção está marcada', async () => {
      await expect(options).toHaveLength(THEMES.length);
      await expect(options.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });

    await step('Escolher outra opção transfere a marcação', async () => {
      const escuro = options[THEMES.findIndex((t) => t.value === 'dark')];
      // Idempotente: o clique só acontece com a opção desmarcada — e escolher a
      // MESMA opção duas vezes deixaria o mesmo estado de qualquer forma, que é
      // o que distingue escolha única de alternador.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);
      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
      });
      await expect(options.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });

    await step('Escolher uma opção NÃO fecha o menu', async () => {
      // As opções de cima foram capturadas antes do clique: com o menu fechado
      // elas continuariam respondendo `aria-checked` de um nó que saiu do
      // documento. A prova é o documento — um menu, montado e sem a marca de
      // fechado — e a opção lida de novo DESSE menu.
      const menus = within(document.body).queryAllByRole('menu');
      await expect(menus).toHaveLength(1);
      await expect(menus[0].hasAttribute('data-closed')).toBe(false);
      const escuro = THEMES.find((t) => t.value === 'dark')!.label;
      await expect(
        within(menus[0]).getByRole('menuitemradio', { name: escuro }).getAttribute('aria-checked'),
      ).toBe('true');
    });
  },
};

// ─── EditorCompleto ───────────────────────────────────────────────────────────

export const EditorCompleto: Story = {
  parameters: { docs: { source: { transform: menubarEditorSource } } },
  render: () => ({
    props: { menus: MENUS_EDITOR },
    template: `
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>Arquivo</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarGroup>
              <div ndsMenubarLabel>Documento</div>
              <div ndsMenubarItem>Novo <span ndsMenubarShortcut>Ctrl+N</span></div>
              <div ndsMenubarItem>Abrir <span ndsMenubarShortcut>Ctrl+O</span></div>
            </div>
            <div ndsMenubarSeparator></div>
            <div ndsMenubarItem variant="destructive">Descartar alterações</div>
          </ng-template>
        </nds-menubar-menu>

        <nds-menubar-menu>
          <button ndsMenubarTrigger>Editar</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>Desfazer <span ndsMenubarShortcut>Ctrl+Z</span></div>
            <div ndsMenubarItem>Refazer <span ndsMenubarShortcut>Ctrl+Shift+Z</span></div>
          </ng-template>
        </nds-menubar-menu>

        <nds-menubar-menu>
          <button ndsMenubarTrigger>Exibir</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarLabel>Mostrar na tela</div>
            <div ndsMenubarCheckboxItem [checked]="true">Régua</div>
            <div ndsMenubarCheckboxItem>Grade</div>
          </ng-template>
        </nds-menubar-menu>

        <nds-menubar-menu>
          <button ndsMenubarTrigger>Ajuda</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>Documentação</div>
            <div ndsMenubarItem>Atalhos de teclado</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');

    await step('As quatro categorias clássicas convivem na mesma barra', async () => {
      await expect(triggers).toHaveLength(MENUS_EDITOR.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS_EDITOR[i]);
      }
    });

    await step('A barra é uma só parada de tabulação, com todos os menus fechados', async () => {
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
      for (const trigger of triggers) {
        await expect(trigger.getAttribute('data-state')).toBe('closed');
      }
    });
  },
};
