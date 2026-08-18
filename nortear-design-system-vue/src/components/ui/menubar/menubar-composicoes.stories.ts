import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { reactive, ref } from 'vue';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './index';
import { waitForPortal, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
const ATALHOS = [
  { label: 'Desfazer', atalho: '⌘Z' },
  { label: 'Refazer', atalho: '⇧⌘Z' },
  { label: 'Copiar', atalho: '⌘C' },
];

const EXPORTACOES = ['PDF', 'CSV', 'PNG'];

const EXIBICOES = ['Régua', 'Barra lateral', 'Grade'];

const TEMAS = [
  { valor: 'light', label: 'Claro' },
  { valor: 'dark', label: 'Escuro' },
  { valor: 'system', label: 'Do sistema' },
];

const MENUS_EDITOR = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'];

const meta = {
  title: 'UI/Menubar/Compositions',
  component: Menubar,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        component:
          'As composições canônicas de um menu da barra: atalhos visíveis, submenu, alternadores independentes, escolha única e a barra completa de um editor.',
      },
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

const pecas = {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};

// ─── WithShortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    components: pecas,
    setup: () => ({ atalhos: ATALHOS }),
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Menubar default-value="edit">
          <MenubarMenu value="edit">
            <MenubarTrigger>Editar</MenubarTrigger>
            <MenubarContent>
              <MenubarItem v-for="a in atalhos" :key="a.label">
                {{ a.label }}
                <MenubarShortcut>{{ a.atalho }}</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const itens = within(menu).getAllByRole('menuitem');

    await step('Cada item leva o próprio atalho', async () => {
      await expect(itens).toHaveLength(ATALHOS.length);
      const atalhos = menu.querySelectorAll('[data-slot="menubar-shortcut"]');
      await expect(atalhos).toHaveLength(ATALHOS.length);
    });

    await step('O atalho entra no nome do item, e não fica escondido do leitor', async () => {
      // Sem `aria-hidden`: "Desfazer, ⌘Z" é o que dá serventia ao atalho para
      // quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of itens.entries()) {
        await expect(item).toHaveAccessibleName(`${ATALHOS[i].label} ${ATALHOS[i].atalho}`);
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
    components: pecas,
    setup: () => ({ exportacoes: EXPORTACOES }),
    template: `
      <div style="contain: layout; min-height: 320px;">
        <Menubar default-value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Novo</MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem v-for="e in exportacoes" :key="e">{{ e }}</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const corpo = within(document.body);
    const menu = await waitForPortal('menu');
    const subGatilho = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-gatilho anuncia que abre outro menu', async () => {
      await expect(subGatilho.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subGatilho.getAttribute('data-slot')).toBe('menubar-sub-trigger');
    });

    await step('Seta Baixo alcança o sub-gatilho; Seta Direita abre o submenu', async () => {
      // Idempotente: só navega e abre quando ainda está fechado.
      if (subGatilho.getAttribute('aria-expanded') !== 'true') {
        // Quantas setas até o sub-gatilho depende de onde a lib deixou o realce
        // ao abrir — cravar o número é o que quebra quando um item muda de
        // lugar. Anda até chegar, e falha se não chegar.
        const itens = menu.querySelectorAll('[role="menuitem"]');
        for (let i = 0; i < itens.length + 1; i++) {
          if (document.activeElement === subGatilho) break;
          await userEvent.keyboard('{ArrowDown}');
        }
        await waitFor(async () => {
          await expect(document.activeElement).toBe(subGatilho);
        });
        await userEvent.keyboard('{ArrowRight}');
      }

      await waitFor(async () => {
        await expect(subGatilho.getAttribute('aria-expanded')).toBe('true');
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu.
        await expect(corpo.getAllByRole('menu')).toHaveLength(2);
      });
    });

    await step('O submenu traz os próprios itens e abre AO LADO do pai', async () => {
      const submenu = corpo.getAllByRole('menu').find((m) => m !== menu)!;
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(EXPORTACOES.length);
      await expect(submenu.getAttribute('data-slot')).toBe('menubar-sub-content');
      // Um submenu que nascesse embaixo cobriria os irmãos do item que o abriu.
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
    components: pecas,
    setup() {
      // Reativo de verdade: com um objeto solto o clique emitiria a mudança e
      // nada re-renderizaria — o item ficaria preso no estado inicial.
      const estado = reactive<Record<string, boolean>>({
        'Régua': true,
        'Barra lateral': false,
        Grade: false,
      });
      return { exibicoes: EXIBICOES, estado };
    },
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Menubar default-value="view">
          <MenubarMenu value="view">
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarLabel>Mostrar na tela</MenubarLabel>
                <MenubarCheckboxItem
                  v-for="e in exibicoes"
                  :key="e"
                  :checked="estado[e]"
                  @update:checked="estado[e] = $event"
                >{{ e }}</MenubarCheckboxItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const caixas = within(menu).getAllByRole('menuitemcheckbox');

    await step('Cada linha é uma caixa de seleção independente', async () => {
      await expect(caixas).toHaveLength(EXIBICOES.length);
      for (const caixa of caixas) {
        await expect(caixa.getAttribute('data-slot')).toBe('menubar-checkbox-item');
        await expect(caixa.getAttribute('aria-checked')).toBeTruthy();
      }
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia: o menubar era,
      // com o context-menu, o único indicador do sistema sem endereço próprio.
      for (const caixa of caixas) {
        await expect(
          caixa.querySelector('[data-slot="menubar-checkbox-item-indicator"]')
        ).not.toBeNull();
      }
    });

    await step('Alternar reflete no estado anunciado e no marcador visual', async () => {
      const alvo = caixas[EXIBICOES.indexOf('Barra lateral')];
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (alvo.getAttribute('aria-checked') !== 'true') await userEvent.click(alvo);
      await waitFor(async () => {
        await expect(alvo.getAttribute('aria-checked')).toBe('true');
        // `aria-checked` é o que a pessoa ouve; o tique é o que ela vê. Buscar
        // pelo `data-slot` prova de quebra que o atributo ficou no INVÓLUCRO do
        // marcador — se caísse no item ou no nó interno da lib, o tique não
        // estaria dentro dele.
        await expect(
          alvo.querySelector('[data-slot="menubar-checkbox-item-indicator"] svg')
        ).not.toBeNull();
      });
    });

    await step('Marcar não fecha o menu — quem marca uma quer marcar a próxima', async () => {
      await expect(document.body.contains(menu)).toBe(true);
      const outra = caixas[EXIBICOES.indexOf('Grade')];
      await expect(outra.getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    components: pecas,
    setup() {
      const tema = ref('light');
      return { temas: TEMAS, tema };
    },
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Menubar default-value="theme">
          <MenubarMenu value="theme">
            <MenubarTrigger>Aparência</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup v-model="tema">
                <MenubarLabel>Tema</MenubarLabel>
                <MenubarRadioItem v-for="t in temas" :key="t.valor" :value="t.valor">
                  {{ t.label }}
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const opcoes = within(menu).getAllByRole('menuitemradio');

    await step('O grupo publica escolha única, e só uma opção está marcada', async () => {
      await expect(opcoes).toHaveLength(TEMAS.length);
      await expect(opcoes.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      for (const opcao of opcoes) {
        await expect(
          opcao.querySelector('[data-slot="menubar-radio-item-indicator"]')
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      const marcada = opcoes.find((o) => o.getAttribute('aria-checked') === 'true')!;
      await expect(
        marcada.querySelector('[data-slot="menubar-radio-item-indicator"] svg')
      ).not.toBeNull();
    });

    await step('Escolher outra opção transfere a marcação', async () => {
      const escuro = opcoes[TEMAS.findIndex((t) => t.valor === 'dark')];
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
    components: pecas,
    template: `
      <div style="contain: layout; min-height: 200px;">
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarLabel>Documento</MenubarLabel>
                <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
                <MenubarItem>Abrir <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarItem variant="destructive">Descartar alterações</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="edit">
            <MenubarTrigger>Editar</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
              <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="view">
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarLabel>Mostrar na tela</MenubarLabel>
                <MenubarCheckboxItem :checked="true">Régua</MenubarCheckboxItem>
                <MenubarCheckboxItem :checked="false">Grade</MenubarCheckboxItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu value="help">
            <MenubarTrigger>Ajuda</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentação</MenubarItem>
              <MenubarItem>Atalhos de teclado</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const gatilhos = within(barra).getAllByRole('menuitem');

    await step('As quatro categorias clássicas convivem na mesma barra', async () => {
      await expect(gatilhos).toHaveLength(MENUS_EDITOR.length);
      for (const [i, gatilho] of gatilhos.entries()) {
        await expect(gatilho).toHaveAccessibleName(MENUS_EDITOR[i]);
      }
    });

    await step('Com todos os menus fechados, nenhum painel existe no DOM', async () => {
      for (const gatilho of gatilhos) {
        await expect(gatilho.getAttribute('data-state')).toBe('closed');
      }
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(0);
    });
  },
};
