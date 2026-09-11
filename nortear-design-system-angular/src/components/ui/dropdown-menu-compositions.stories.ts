import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_DROPDOWN_MENU } from './dropdown-menu';
import {
  dropdownMenuWithCheckboxSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithRadioSource,
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithSubmenuSource,
} from './dropdown-menu.source';
import { NdsButton } from './button';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/DropdownMenu/Compositions',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DROPDOWN_MENU, NdsButton] })],
  parameters: {
    design: figmaDesign('dropdownMenu'),
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
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: dropdownMenuWithLabelSource } },
  },
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
  parameters: {
    covers: ['functional.item5', 'accessibility.item4', 'visual.item2'],
    // A story liga `[checked]` a `name` e `email`, campos do objeto de props do
    // renderer. O snippet põe os dois num sinal — quem copiasse o template cru
    // receberia um binding que não resolve em componente nenhum.
    docs: { source: { transform: dropdownMenuWithCheckboxSource } },
  },
  render: () => ({
    props: { name: true, email: false, role: false },
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Colunas</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>Colunas visíveis</div>
            <div
              ndsDropdownMenuCheckboxItem
              [checked]="name"
              (checkedChange)="name = $event"
            >Nome</div>
            <div
              ndsDropdownMenuCheckboxItem
              [checked]="email"
              (checkedChange)="email = $event"
            >E-mail</div>
            <div
              ndsDropdownMenuCheckboxItem
              [checked]="role"
              (checkedChange)="role = $event"
            >Função</div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const name = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const email = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(canvas.getAllByRole('menuitemcheckbox')).toHaveLength(3);
      await expect(name.getAttribute('aria-checked')).toBe('true');
      await expect(email.getAttribute('aria-checked')).toBe('false');
    });

    await step('O indicador só aparece no item marcado', async () => {
      // O visual do estado não pode depender só de cor: o Check é o que a
      // pessoa vê, e o `aria-checked` é o que ela ouve. O indicador fica no DOM
      // nos dois casos (é assim que a lib deixa a animação de saída possível) —
      // o que muda é o `display`, então é ele que a asserção olha.
      const marca = (item: HTMLElement) =>
        getComputedStyle(item.querySelector<HTMLElement>('[rdxmenucheckboxitemindicator]')!).display;
      await expect(marca(name)).not.toBe('none');
      await expect(marca(email)).toBe('none');
    });

    await step('Clicar alterna nos DOIS sentidos, o indicador acompanha e o menu segue aberto', async () => {
      // F5 inteiro: `aria-checked` vai de falso a verdadeiro e volta, o
      // indicador é conferido DEPOIS de cada clique (e não só no estado
      // inicial), e o menu continua aberto depois dos dois. Sem guarda de
      // idempotência: dois cliques devolvem o item ao estado de partida, então o
      // replay do painel Interactions começa e termina igual.
      //
      // O menu e o item são relidos do DOCUMENTO a cada volta: uma referência
      // capturada antes do clique continuaria respondendo de um nó que saiu do
      // documento, e o "segue aberto" passaria com o menu fechado.
      const liveEmail = () => {
        const menus = within(document.body).queryAllByRole('menu');
        return menus.length === 1
          ? within(menus[0]).queryByRole('menuitemcheckbox', { name: 'E-mail' })
          : null;
      };
      // Leitura pura do estilo em linha que a lib escreve (`display: none`
      // quando desmarcado) — nada que mexa no DOM dentro do `waitFor`.
      const indicatorShown = (item: HTMLElement) =>
        item.querySelector<HTMLElement>('[rdxmenucheckboxitemindicator]')!.style.display !== 'none';

      const before = email.getAttribute('aria-checked') === 'true';
      for (const expected of [!before, before]) {
        await userEvent.click(liveEmail()!);
        await waitFor(async () => {
          const item = liveEmail();
          await expect(item).not.toBeNull();
          await expect(item!.getAttribute('aria-checked')).toBe(String(expected));
          await expect(indicatorShown(item!)).toBe(expected);
        });
        // Alternar não fecha: quem marca uma coluna costuma marcar a próxima.
        const menus = within(document.body).queryAllByRole('menu');
        await expect(menus).toHaveLength(1);
        await expect(menus[0].hasAttribute('data-closed')).toBe(false);
      }
      // Independentes entre si — é o que separa checkbox de escolha única.
      await expect(name.getAttribute('aria-checked')).toBe('true');
    });
  },
};

// ─── Com RadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    // `functional.item6` diz também "e o menu segue aberto" (C10): o último passo
    // CONTA os menus no documento em vez de consultar a referência capturada
    // antes do clique, que continuaria respondendo com o menu fechado.
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    docs: { source: { transform: dropdownMenuWithRadioSource } },
  },
  render: () => ({
    props: { theme: 'light' },
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Tema</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuRadioGroup [value]="theme" (valueChange)="theme = $event">
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
    const light = canvas.getByRole('menuitemradio', { name: 'Claro' });
    const escuro = canvas.getByRole('menuitemradio', { name: 'Escuro' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(light.getAttribute('aria-checked')).toBe('true');
      await expect(escuro.getAttribute('aria-checked')).toBe('false');
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(3);
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);

      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
        await expect(light.getAttribute('aria-checked')).toBe('false');
      });
    });

    await step('Escolher uma opção NÃO fecha o menu', async () => {
      // As referências de cima foram capturadas antes do clique: com o menu
      // fechado elas continuariam respondendo `aria-checked` de um nó que saiu
      // do documento. A prova é o documento — um menu, montado e sem a marca de
      // fechado — e a opção lida de novo DESSE menu.
      const menus = within(document.body).queryAllByRole('menu');
      await expect(menus).toHaveLength(1);
      await expect(menus[0].hasAttribute('data-closed')).toBe(false);
      await expect(
        within(menus[0]).getByRole('menuitemradio', { name: 'Escuro' }).getAttribute('aria-checked'),
      ).toBe('true');
    });
  },
};

// ─── Com submenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    // F12: seta direita entra no submenu; seta esquerda e Escape fecham SÓ o
    // submenu, com o foco de volta no sub-gatilho e o menu pai aberto.
    covers: ['functional.item7', 'functional.item12', 'visual.item4'],
    docs: { source: { transform: dropdownMenuWithSubmenuSource } },
  },
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
  play: async ({ canvasElement, step }) => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });
    const rootTrigger = within(canvasElement).getByRole('button', { name: 'Arquivo' });
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="dropdown-menu-sub-content"]');
    const firstSubItem = () =>
      submenu()?.querySelector<HTMLElement>('[data-slot="dropdown-menu-item"]') ?? null;

    // Só o submenu fechou: o painel pai é o MESMO nó de antes, segue no
    // documento, e o gatilho da raiz continua anunciando o menu aberto.
    const rootStillOpen = async () => {
      await waitFor(() => expect(body.getAllByRole('menu')).toHaveLength(1));
      await expect(menu.isConnected).toBe(true);
      await expect(rootTrigger.getAttribute('aria-expanded')).toBe('true');
    };

    await step('O sub-gatilho anuncia que abre um menu', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      // Fechado, não há painel: apontar para um `id` que saiu do documento é
      // pior que não apontar.
      await expect(subTrigger.getAttribute('aria-owns')).toBeNull();
    });

    await step('A seta para a direita abre o submenu e o foco ENTRA nele', async () => {
      // Sem guarda de idempotência: com o submenu já aberto, a mesma seta ainda
      // tem de levar o foco para dentro — é o caso que a lib não cobre sozinha.
      subTrigger.focus();
      await userEvent.keyboard('{ArrowRight}');

      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
      // Abrir sem entrar deixaria a pessoa vendo um painel que a seta seguinte
      // não percorre. Era o defeito deste stack (WCAG 2.1.1): a seta abria e o
      // foco ficava no sub-gatilho.
      await waitFor(() => expect(document.activeElement).toBe(firstSubItem()));
    });

    await step('O sub-gatilho aponta para ESTE painel pelo aria-owns', async () => {
      // O painel é portalado para fora da árvore do menu, então `aria-expanded`
      // sozinho diz que ABRIU sem dizer O QUÊ. Quem devolve a relação é
      // `aria-owns` — e ele tem de apontar para o painel aberto, não para um id
      // qualquer.
      const panel = submenu()!;
      await expect(panel.id).not.toBe('');
      await expect(subTrigger.getAttribute('aria-owns')).toBe(panel.id);
    });

    await step('O submenu abre AO LADO, não por cima do menu pai', async () => {
      const panel = submenu()!;
      await expect(within(panel).getAllByRole('menuitem')).toHaveLength(2);
      // A comparação é com a borda DIREITA do pai. Comparar com a ESQUERDA —
      // como estava — passa com os dois painéis perfeitamente empilhados, que é
      // exatamente o defeito que a asserção deveria pegar. O posicionador
      // coloca o popup em passo assíncrono, daí o `waitFor` em volta da medida:
      // ler a caixa no tick da abertura devolve a posição de partida.
      await waitFor(async () => {
        await expect(panel.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          menu.getBoundingClientRect().right - 8,
        );
      });
    });

    await step('Seta esquerda fecha SÓ o submenu e devolve o foco ao sub-gatilho', async () => {
      await expect(document.activeElement).toBe(firstSubItem());
      await userEvent.keyboard('{ArrowLeft}');

      await waitFor(() => expect(subTrigger.getAttribute('aria-expanded')).toBe('false'));
      // Fechou: a ligação sai junto com o painel.
      await expect(subTrigger.getAttribute('aria-owns')).toBeNull();
      await waitFor(() => expect(document.activeElement).toBe(subTrigger));
      await rootStillOpen();
    });

    await step('Escape dentro do submenu fecha SÓ o submenu, com o mesmo destino', async () => {
      // O foco está no sub-gatilho (passo anterior): a seta reabre e entra.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toBe(firstSubItem()));

      // Escape é o nível mais fundo que fecha, não o menu inteiro: o painel do
      // submenu precisa ser FILHO do pai na árvore flutuante para a lib saber
      // que existe um nível a quem ceder.
      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(subTrigger.getAttribute('aria-expanded')).toBe('false'));
      await waitFor(() => expect(document.activeElement).toBe(subTrigger));
      await rootStillOpen();
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item4` descreve o SubContent aberto: é esse o estado que o
      // Chromatic fotografa.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toBe(firstSubItem()));
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    // F14: o atalho à direita do rótulo e dentro do nome acessível.
    covers: ['functional.item14'],
    docs: { source: { transform: dropdownMenuWithShortcutsSource } },
  },
  render: () => ({
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Editar</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>
            Desfazer <span ndsDropdownMenuShortcut>Ctrl+Z</span>
          </div>
          <div ndsDropdownMenuItem>
            Copiar <span ndsDropdownMenuShortcut>Ctrl+C</span>
          </div>
          <div ndsDropdownMenuSeparator></div>
          <div ndsDropdownMenuItem>
            Colar <span ndsDropdownMenuShortcut>Ctrl+V</span>
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
      await expect(canvas.getByRole('menuitem', { name: 'Copiar Ctrl+C' })).toBeTruthy();
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      // `margin-left: auto` é o mecanismo, mas num item flex o valor computado
      // já vem resolvido em pixels — o que dá para afirmar é o resultado: o
      // atalho encosta na direita e o rótulo fica na esquerda.
      const item = canvas.getByRole('menuitem', { name: 'Colar Ctrl+V' });
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
