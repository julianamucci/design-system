import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_MENUBAR } from './menubar';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
const SHORTCUTS = [
  { label: 'Desfazer', atalho: '⌘Z' },
  { label: 'Refazer', atalho: '⇧⌘Z' },
  { label: 'Copiar', atalho: '⌘C' },
] as const;

const EXPORTACOES = ['PDF', 'CSV', 'PNG'] as const;

const EXIBICOES = ['Régua', 'Barra lateral', 'Grade'] as const;

const THEMES = [
  { valor: 'light', label: 'Claro' },
  { valor: 'dark', label: 'Escuro' },
  { valor: 'system', label: 'Do sistema' },
] as const;

const MENUS_EDITOR = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'] as const;

const meta: Meta = {
  title: 'UI/Menubar/Compositions',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_MENUBAR] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
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
  parameters: { covers: ['visual.item2'] },
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
    const itens = within(menu).getAllByRole('menuitem');

    await step('Cada item leva o próprio atalho', async () => {
      await expect(itens).toHaveLength(SHORTCUTS.length);
      const shortcuts = menu.querySelectorAll('[data-slot="menubar-shortcut"]');
      await expect(shortcuts).toHaveLength(SHORTCUTS.length);
    });

    await step('O atalho entra no nome do item, e não fica escondido do leitor', async () => {
      // Sem `aria-hidden`: "Desfazer, Control Z" é o que dá serventia ao atalho
      // para quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of itens.entries()) {
        await expect(item).toHaveAccessibleName(`${SHORTCUTS[i].label} ${SHORTCUTS[i].atalho}`);
      }
    });

    await step('O atalho é secundário — cor esmaecida à direita do rótulo', async () => {
      const atalho = menu.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
      await expect(atalho.classList.contains('nds-dropdown-menu-shortcut')).toBe(true);
      await expect(getComputedStyle(atalho).color).not.toBe(getComputedStyle(itens[0]).color);
    });
  },
};

// ─── WithSubmenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: { covers: ['functional.item5', 'visual.item4'] },
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
  play: async ({ step }) => {
    const corpo = within(document.body);
    const menu = await waitForPortal('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-gatilho anuncia que abre outro menu', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Seta Baixo alcança o sub-gatilho; Seta Direita abre o submenu', async () => {
      // Idempotente: só navega e abre quando ainda está fechado.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(async () => {
          await expect(document.activeElement).toBe(subTrigger);
        });
        await userEvent.keyboard('{ArrowRight}');
      }

      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu.
        await expect(corpo.getAllByRole('menu')).toHaveLength(2);
      });
    });

    await step('O submenu traz os próprios itens e abre AO LADO do pai', async () => {
      const submenu = corpo.getAllByRole('menu').find((m) => m !== menu)!;
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(EXPORTACOES.length);
      await expect(submenu.getAttribute('data-slot')).toBe('menubar-sub-content');
      // `side="right"` é o padrão do submenu neste stack: um submenu que nasce
      // embaixo cobriria os irmãos do item que o abriu.
      await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        menu.getBoundingClientRect().left,
      );
    });
  },
};

// ─── WithCheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  parameters: { covers: ['functional.item7', 'visual.item3'] },
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
      for (const caixa of boxes) {
        await expect(caixa.getAttribute('data-slot')).toBe('menubar-checkbox-item');
        await expect(caixa.getAttribute('aria-checked')).toBeTruthy();
      }
    });

    await step('Alternar reflete no estado anunciado e no marcador visual', async () => {
      const alvo = boxes[EXIBICOES.indexOf('Barra lateral')];
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (alvo.getAttribute('aria-checked') !== 'true') await userEvent.click(alvo);
      await waitFor(async () => {
        await expect(alvo.getAttribute('aria-checked')).toBe('true');
        // O marcador visual acompanha: `aria-checked` é o que a pessoa ouve,
        // `data-checked` é o que o CSS usa para desenhar o tique.
        await expect(alvo.hasAttribute('data-checked')).toBe(true);
      });
    });

    await step('Marcar não fecha o menu — quem marca uma quer marcar a próxima', async () => {
      await expect(document.body.contains(menu)).toBe(true);
      const outra = boxes[EXIBICOES.indexOf('Grade')];
      await expect(outra.getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    props: { temas: THEMES, tema: 'light' },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Aparência</button>

          <ng-template ndsMenubarContent>
            <div ndsMenubarRadioGroup [value]="tema" (valueChange)="tema = $event">
              <div ndsMenubarLabel>Tema</div>
              @for (t of temas; track t.valor) {
                <div ndsMenubarRadioItem [value]="t.valor">{{ t.label }}</div>
              }
            </div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const opcoes = within(menu).getAllByRole('menuitemradio');

    await step('O grupo publica escolha única, e só uma opção está marcada', async () => {
      await expect(opcoes).toHaveLength(THEMES.length);
      await expect(opcoes.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });

    await step('Escolher outra opção transfere a marcação', async () => {
      const escuro = opcoes[THEMES.findIndex((t) => t.valor === 'dark')];
      // Idempotente: o clique só acontece com a opção desmarcada — e escolher a
      // MESMA opção duas vezes deixaria o mesmo estado de qualquer forma, que é
      // o que distingue escolha única de alternador.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);
      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
      });
      await expect(opcoes.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });
  },
};

// ─── EditorCompleto ───────────────────────────────────────────────────────────

export const EditorCompleto: Story = {
  render: () => ({
    props: { menus: MENUS_EDITOR },
    template: `
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>Arquivo</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarGroup>
              <div ndsMenubarLabel>Documento</div>
              <div ndsMenubarItem>Novo <span ndsMenubarShortcut>⌘N</span></div>
              <div ndsMenubarItem>Abrir <span ndsMenubarShortcut>⌘O</span></div>
            </div>
            <div ndsMenubarSeparator></div>
            <div ndsMenubarItem variant="destructive">Descartar alterações</div>
          </ng-template>
        </nds-menubar-menu>

        <nds-menubar-menu>
          <button ndsMenubarTrigger>Editar</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>Desfazer <span ndsMenubarShortcut>⌘Z</span></div>
            <div ndsMenubarItem>Refazer <span ndsMenubarShortcut>⇧⌘Z</span></div>
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
      for (const [i, gatilho] of triggers.entries()) {
        await expect(gatilho).toHaveAccessibleName(MENUS_EDITOR[i]);
      }
    });

    await step('A barra é uma só parada de tabulação, com todos os menus fechados', async () => {
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
      for (const gatilho of triggers) {
        await expect(gatilho.getAttribute('data-state')).toBe('closed');
      }
    });
  },
};
