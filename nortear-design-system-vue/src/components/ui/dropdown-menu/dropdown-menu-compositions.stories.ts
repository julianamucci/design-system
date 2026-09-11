import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import {
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithChoiceUnicaSource,
  dropdownMenuWithMarkupSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithSubmenuSource,
} from './dropdown-menu.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta = {
  title: 'Components/Overlay/DropdownMenu/Compositions',
  component: DropdownMenu,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      source: { transform: dropdownMenuWithLabelSource },
      description: {
        component:
          'As composições canônicas: grupos com rótulo, alternadores, escolha única, submenu e ' +
          'atalhos. Todas partem das mesmas peças — o que muda é o papel ARIA do item e o ' +
          'indicador que o acompanha.',
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const componentes = {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Button,
};

export const WithLabel: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    components: componentes,
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Conta</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Suporte</DropdownMenuLabel>
              <DropdownMenuItem>Documentação</DropdownMenuItem>
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);

    await step('Cada grupo é nomeado pelo próprio rótulo', async () => {
      // É o que o rótulo entrega além do texto: sem o `aria-labelledby`, o
      // leitor anuncia "grupo" e a pessoa não sabe de qual bloco se trata.
      await expect(canvas.getByRole('group', { name: 'Conta' })).toBeTruthy();
      await expect(canvas.getByRole('group', { name: 'Suporte' })).toBeTruthy();
    });

    await step('O rótulo não é item de menu', async () => {
      // Rótulo dentro de `role="menu"` não pode ser navegável: a seta o pousaria
      // como se fosse ação, e o typeahead o traria como resultado.
      await expect(canvas.getAllByRole('menuitem')).toHaveLength(4);
    });

    await step('O separador divide os grupos', async () => {
      await expect(canvas.getAllByRole('separator')).toHaveLength(1);
    });
  },
};

export const WithCheckboxItems: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item4', 'visual.item2'],
    // A marcação exige estado ligado por `v-model` — dois `ref` no script, que
    // o snippet do meta (só itens de ação) não tem.
    docs: { source: { transform: dropdownMenuWithMarkupSource } },
  },
  render: () => ({
    components: componentes,
    setup() {
      const name = ref(true);
      const email = ref(false);
      const role = ref(false);
      return { name, email, role };
    },
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Colunas</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
              <DropdownMenuCheckboxItem v-model="name">Nome</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem v-model="email">E-mail</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem v-model="role">Função</DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const name = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const email = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(canvas.getAllByRole('menuitemcheckbox')).toHaveLength(3);
      await expect(name).toHaveAttribute('aria-checked', 'true');
      await expect(email).toHaveAttribute('aria-checked', 'false');
    });

    // O estado não pode depender só do texto: o Check é o que a pessoa vê e o
    // `aria-checked` é o que ela ouve. A leitura é pura — cabe dentro de
    // `waitFor` sem provocar a próxima tentativa.
    const marca = (item: HTMLElement) =>
      item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;

    // Alternar não fecha (C10): um quadro depois do clique o painel ainda é o
    // MESMO nó, montado — a lib decide fechar no tique seguinte à escolha, e
    // olhar antes disso passaria com o menu já de saída.
    const staysOpen = async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      await expect(menu.isConnected).toBe(true);
    };

    await step('O indicador só aparece no item marcado', async () => {
      await expect(marca(name)).toBe(true);
      await expect(marca(email)).toBe(false);
    });

    await step('Clicar marca o item: aria-checked e indicador vão juntos, e o menu segue aberto', async () => {
      // Idempotente: leva o e-mail a marcado só se ainda não estiver.
      if (email.getAttribute('aria-checked') !== 'true') await userEvent.click(email);

      await waitFor(async () => {
        await expect(email).toHaveAttribute('aria-checked', 'true');
        // O indicador conferido DEPOIS do clique: antes dele o passo anterior já
        // mostrou que o item desmarcado não tem tique, e é a troca que se mede.
        await expect(marca(email)).toBe(true);
      });
      await staysOpen();
      // Independentes entre si — é o que separa checkbox de escolha única.
      await expect(name).toHaveAttribute('aria-checked', 'true');
    });

    await step('Clicar de novo desmarca: o indicador some, e o menu segue aberto', async () => {
      // O outro sentido (F5: "alterna entre true e false"). Idempotente pelo
      // mesmo par: só clica se o item ainda estiver marcado, e a story termina
      // no estado inicial — o e-mail desmarcado.
      if (email.getAttribute('aria-checked') !== 'false') await userEvent.click(email);

      await waitFor(async () => {
        await expect(email).toHaveAttribute('aria-checked', 'false');
        await expect(marca(email)).toBe(false);
      });
      await staysOpen();
      await expect(name).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const WithRadioGroup: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    // Na escolha única o valor vive no GRUPO, não em cada item: outra peça e
    // outro estado.
    docs: { source: { transform: dropdownMenuWithChoiceUnicaSource } },
  },
  render: () => ({
    components: componentes,
    setup() {
      const theme = ref('light');
      return { theme };
    },
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Tema</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuRadioGroup :model-value="theme" @update:model-value="(v) => theme = v">
              <DropdownMenuLabel>Aparência</DropdownMenuLabel>
              <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const light = canvas.getByRole('menuitemradio', { name: 'Claro' });
    const escuro = canvas.getByRole('menuitemradio', { name: 'Escuro' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(3);
      await expect(light).toHaveAttribute('aria-checked', 'true');
      await expect(escuro).toHaveAttribute('aria-checked', 'false');
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);

      await waitFor(async () => {
        await expect(escuro).toHaveAttribute('aria-checked', 'true');
        await expect(light).toHaveAttribute('aria-checked', 'false');
      });
      // Escolher não fecha, como no vanilla e no react. A lib fecha por padrão, e
      // sem esta linha a story passava com o menu já fechado: o item guarda o
      // último `aria-checked` mesmo fora do documento.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
    });
  },
};

export const WithSubmenu: Story = {
  parameters: {
    covers: ['functional.item7', 'functional.item12', 'visual.item4'],
    // O segundo nível é a tríade Sub/SubTrigger/SubContent, que o snippet do
    // meta esconderia por inteiro.
    docs: { source: { transform: dropdownMenuWithSubmenuSource } },
    // Sem exceção de `scrollable-region-focusable` aqui. Ela existiu enquanto o
    // painel do submenu nascia DENTRO do painel pai (sem portal) e o fazia
    // rolar; o último passo da play é o que impede a rolagem de voltar.
  },
  render: () => ({
    components: componentes,
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Arquivo</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Renomear</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>CSV</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    // O painel do submenu, achado pelo endereço: o `menu` guardado acima é o
    // RAIZ, e é ele que os passos de fechamento provam que segue aberto.
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="dropdown-menu-sub-content"]');
    // O primeiro item do submenu, relido a cada chamada: o painel é outro nó a
    // cada abertura.
    const firstSubItem = () => within(submenu()!).getAllByRole('menuitem')[0];

    await step('O sub-gatilho anuncia que abre um menu', async () => {
      await expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
    });

    await step('A seta para a direita abre o submenu, e o foco vai ao primeiro item dele', async () => {
      // Idempotente: a seta só é enviada com o submenu fechado. O sub-gatilho é
      // focado à mão — é o ponto de partida do gesto —, mas o item do submenu
      // NÃO: onde o foco cai depois da seta é justamente o que F12 afirma, e
      // focá-lo à mão faria o passo passar com a lib deixando o foco no painel.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        await expect(subTrigger).toHaveAttribute('aria-expanded', 'false');
        subTrigger.focus();
        await userEvent.keyboard('{ArrowRight}');
      }
      await waitFor(async () => {
        await expect(subTrigger).toHaveAttribute('aria-expanded', 'true');
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(firstSubItem());
      });
    });

    await step('O submenu abre AO LADO, não por cima do menu pai', async () => {
      const submenu = body.getAllByRole('menu')[1];
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(2);
      // Um submenu que nasce sobre o pai cobre os irmãos do item que o abriu.
      // A comparação é com a borda DIREITA do pai — comparar com a esquerda
      // passaria com os dois painéis empilhados. O posicionador coloca o popup
      // em passo assíncrono, daí o `waitFor` em volta da medida.
      await waitFor(async () => {
        await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          menu.getBoundingClientRect().right - 8,
        );
      });
    });

    await step('O submenu é um painel próprio, fora do pai — e o pai não rola', async () => {
      const submenu = body.getAllByRole('menu')[1];
      // Sem portal o painel filho nascia dentro do pai, que tem `overflow-y:
      // auto`: o pai passava a rolar e o axe acusava região rolável sem foco.
      await expect(menu.contains(submenu)).toBe(false);
      await expect(submenu.getAttribute('data-slot')).toBe('dropdown-menu-sub-content');
      // Sem a classe do painel o submenu flutuava sem fundo, borda nem sombra.
      await expect(submenu.classList.contains('nds-dropdown-menu-content')).toBe(true);
      await expect(menu.scrollHeight).toBeLessThanOrEqual(menu.clientHeight);
    });

    await step('Seta esquerda fecha só o submenu e devolve o foco ao sub-gatilho', async () => {
      // O foco já está no primeiro item do submenu, pela seta do passo de
      // abertura — os passos de medida no meio não o movem.
      await expect(submenu()!.contains(document.activeElement)).toBe(true);
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(subTrigger).toHaveAttribute('aria-expanded', 'false');
        await expect(submenu()).toBeNull();
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(subTrigger);
      });
      // O raiz é o MESMO nó: fechar e reabrir no meio passaria por "aberto".
      await expect(body.getAllByRole('menu')).toHaveLength(1);
      await expect(menu.isConnected).toBe(true);
    });

    await step('Escape no submenu fecha só o submenu, e o menu segue aberto', async () => {
      // WAI-ARIA APG e F12: Escape fecha o menu em que o foco está. A lib
      // fechava a árvore inteira — um nível de volta custava os dois, e a pessoa
      // recomeçava do gatilho. Quem segura é o painel do submenu
      // (`useSubmenuEscape`).
      // O foco está no sub-gatilho (passo anterior): a seta reabre e LEVA o foco
      // para dentro, sem mão da play.
      await expect(document.activeElement).toBe(subTrigger);
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(submenu()).not.toBeNull();
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(firstSubItem());
      });
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(submenu()).toBeNull();
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(subTrigger);
      });
      await expect(subTrigger).toHaveAttribute('aria-expanded', 'false');
      // Um quadro depois, o raiz continua o MESMO nó, montado: a decisão de
      // fechar já teria sido tomada.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await expect(body.getAllByRole('menu')).toHaveLength(1);
      await expect(menu.isConnected).toBe(true);
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item4` descreve o submenu aberto — é o que o Chromatic fotografa.
      subTrigger.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
    });
  },
};

export const WithShortcuts: Story = {
  parameters: {
    covers: ['functional.item14'],
    // O atalho é uma peça a mais DENTRO do item, e é ela que completa o nome
    // acessível — o snippet do meta não a mostra.
    docs: { source: { transform: dropdownMenuWithShortcutsSource } },
  },
  render: () => ({
    components: componentes,
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Editar</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>
              Desfazer<DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Copiar<DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Colar<DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);

    await step('O atalho faz parte do nome do item', async () => {
      // Sem isso o leitor de tela anunciaria "Copiar" e a pessoa nunca saberia
      // que existe uma tecla — o atalho é informação, não decoração.
      await expect(canvas.getByRole('menuitem', { name: 'Copiar Ctrl+C' })).toBeTruthy();
    });

    await step('O texto do atalho não some para o leitor de tela', async () => {
      const atalho = menu.querySelector('[data-slot="dropdown-menu-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBe(null);
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      // `margin-left: auto` é o mecanismo, mas num item flex o valor computado
      // já vem resolvido em pixels — o que dá para afirmar é o resultado.
      const item = canvas.getByRole('menuitem', { name: 'Colar Ctrl+V' });
      const atalho = item.querySelector<HTMLElement>('[data-slot="dropdown-menu-shortcut"]')!;
      const itemBox = item.getBoundingClientRect();
      const shortcutBox = atalho.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });
  },
};
