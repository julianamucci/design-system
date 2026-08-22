import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_DROPDOWN_MENU } from './dropdown-menu';
import { NdsButton } from './button';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

const meta: Meta = {
  title: 'UI/DropdownMenu/Compositions',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DROPDOWN_MENU, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component:
          'As composições canônicas: grupos com rótulo, alternadores, escolha única, ' +
          'submenu e atalhos. Todas partem das mesmas peças — o que muda é o papel ARIA ' +
          'do item e o indicador que o acompanha.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com Label ────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Conta</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>Conta</div>
            <div ndsDropdownMenuItem>Perfil</div>
            <div ndsDropdownMenuItem>Configurações</div>
          </div>

          <div ndsDropdownMenuSeparator></div>

          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>Suporte</div>
            <div ndsDropdownMenuItem>Documentação</div>
            <div ndsDropdownMenuItem>Sair</div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
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
      // Rótulo dentro de `role="menu"` não pode ser navegável: a seta o pularia
      // como se fosse ação, e o typeahead o traria como resultado.
      await expect(canvas.getAllByRole('menuitem')).toHaveLength(4);
    });

    await step('O separador divide os grupos', async () => {
      await expect(canvas.getAllByRole('separator')).toHaveLength(1);
    });
  },
};

// ─── Com CheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  // `accessibility.item4` fala dos TRÊS papéis de item. A variante Default só
  // alcança `menuitem`; quem verifica `menuitemcheckbox` é esta story, e quem
  // verifica `menuitemradio` é a de escolha única. Declarar tudo lá era
  // declaração deslocada: a story vizinha é que verificava.
  parameters: { covers: ['functional.item5', 'accessibility.item4', 'visual.item2'] },
  render: () => ({
    props: { nome: true, email: false },
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Colunas</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>Colunas visíveis</div>
            <div
              ndsDropdownMenuCheckboxItem
              [checked]="nome"
              (checkedChange)="nome = $event"
            >Nome</div>
            <div
              ndsDropdownMenuCheckboxItem
              [checked]="email"
              (checkedChange)="email = $event"
            >E-mail</div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const nome = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const email = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(nome.getAttribute('aria-checked')).toBe('true');
      await expect(email.getAttribute('aria-checked')).toBe('false');
    });

    await step('O indicador só aparece no item marcado', async () => {
      // O visual do estado não pode depender só de cor: o Check é o que a
      // pessoa vê, e o `aria-checked` é o que ela ouve. O indicador fica no DOM
      // nos dois casos (é assim que a lib deixa a animação de saída possível) —
      // o que muda é o `display`, então é ele que a asserção olha.
      const marca = (item: HTMLElement) =>
        getComputedStyle(item.querySelector<HTMLElement>('[rdxmenucheckboxitemindicator]')!).display;
      await expect(marca(nome)).not.toBe('none');
      await expect(marca(email)).toBe('none');
    });

    await step('Clicar alterna o item e mantém o menu aberto', async () => {
      // Idempotente: leva o e-mail a marcado só se ainda não estiver, então o
      // replay do painel Interactions termina no mesmo estado.
      if (email.getAttribute('aria-checked') !== 'true') await userEvent.click(email);

      await waitFor(async () => {
        await expect(email.getAttribute('aria-checked')).toBe('true');
        await expect(email.hasAttribute('data-checked')).toBe(true);
      });
      // Alternar não fecha: quem marca uma coluna costuma marcar a próxima.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      // Independentes entre si — é o que separa checkbox de escolha única.
      await expect(nome.getAttribute('aria-checked')).toBe('true');
    });
  },
};

// ─── Com RadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item4', 'visual.item3'] },
  render: () => ({
    props: { tema: 'light' },
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Tema</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuRadioGroup [value]="tema" (valueChange)="tema = $event">
            <div ndsDropdownMenuLabel>Aparência</div>
            <div ndsDropdownMenuRadioItem value="light">Claro</div>
            <div ndsDropdownMenuRadioItem value="dark">Escuro</div>
            <div ndsDropdownMenuRadioItem value="system">Sistema</div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const claro = canvas.getByRole('menuitemradio', { name: 'Claro' });
    const escuro = canvas.getByRole('menuitemradio', { name: 'Escuro' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(claro.getAttribute('aria-checked')).toBe('true');
      await expect(escuro.getAttribute('aria-checked')).toBe('false');
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(3);
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);

      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
        await expect(claro.getAttribute('aria-checked')).toBe('false');
      });
    });
  },
};

// ─── Com submenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: { covers: ['functional.item7', 'visual.item4'] },
  render: () => ({
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Arquivo</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>Renomear</div>

          <nds-dropdown-menu-sub>
            <div ndsDropdownMenuSubTrigger>Exportar</div>

            <ng-template ndsDropdownMenuSubContent>
              <div ndsDropdownMenuItem>PDF</div>
              <div ndsDropdownMenuItem>CSV</div>
            </ng-template>
          </nds-dropdown-menu-sub>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ step }) => {
    const corpo = within(document.body);
    const menu = await waitForPortal('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-gatilho anuncia que abre um menu', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
    });

    await step('A seta para a direita abre o submenu', async () => {
      // Idempotente: a seta só é enviada com o submenu fechado.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        subTrigger.focus();
        await userEvent.keyboard('{ArrowRight}');
      }

      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
        await expect(corpo.getAllByRole('menu')).toHaveLength(2);
      });
    });

    await step('O submenu abre AO LADO, não por cima do menu pai', async () => {
      const submenu = corpo.getAllByRole('menu')[1];
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(2);
      // A comparação é com a borda DIREITA do pai. Comparar com a ESQUERDA —
      // como estava — passa com os dois painéis perfeitamente empilhados, que é
      // exatamente o defeito que a asserção deveria pegar. O posicionador
      // coloca o popup em passo assíncrono, daí o `waitFor` em volta da medida:
      // ler a caixa no tick da abertura devolve a posição de partida.
      await waitFor(async () => {
        await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          menu.getBoundingClientRect().right - 8,
        );
      });
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  render: () => ({
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Editar</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>
            Desfazer <span ndsDropdownMenuShortcut>Ctrl Z</span>
          </div>
          <div ndsDropdownMenuItem>
            Copiar <span ndsDropdownMenuShortcut>Ctrl C</span>
          </div>
          <div ndsDropdownMenuSeparator></div>
          <div ndsDropdownMenuItem>
            Colar <span ndsDropdownMenuShortcut>Ctrl V</span>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);

    await step('O atalho faz parte do nome do item', async () => {
      // Sem isso o leitor de tela anunciaria "Copiar" e a pessoa nunca saberia
      // que existe uma tecla — o atalho é informação, não decoração.
      await expect(canvas.getByRole('menuitem', { name: 'Copiar Ctrl C' })).toBeTruthy();
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      // `margin-left: auto` é o mecanismo, mas num item flex o valor computado
      // já vem resolvido em pixels — o que dá para afirmar é o resultado: o
      // atalho encosta na direita e o rótulo fica na esquerda.
      const item = canvas.getByRole('menuitem', { name: 'Colar Ctrl V' });
      const atalho = item.querySelector<HTMLElement>('[data-slot="dropdown-menu-shortcut"]')!;
      const itemBox = item.getBoundingClientRect();
      const shortcutBox = atalho.getBoundingClientRect();
      const folgaDireita = itemBox.right - shortcutBox.right;
      const folgaEsquerda = shortcutBox.left - itemBox.left;
      await expect(folgaDireita).toBeLessThan(folgaEsquerda);
    });

    await step('O texto do atalho não some para o leitor de tela', async () => {
      const atalho = menu.querySelector<HTMLElement>('[data-slot="dropdown-menu-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBe(null);
    });
  },
};
