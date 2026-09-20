import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { dropdownMenuSource, dropdownMenuSourceWith } from './dropdown-menu.source';
import { endClose, mount } from './dropdown-menu.fixtures';
import { waitForAnimationsDone } from '@/lib/wait-for-portal';
import { waitForAncorado } from '@shared/testing/ancoragem';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/DropdownMenu/Compositions',
  parameters: {
    design: figmaDesign('dropdownMenu'),
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'As composições canônicas: grupos com rótulo, alternadores, escolha única, submenu e ' +
          'atalhos. Todas partem das mesmas peças — o que muda é o papel ARIA do item e o ' +
          'indicador que o acompanha.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** As listas daqui são as mais longas do componente — a moldura acompanha. */
const FRAME_HEIGHT = '220px';

/**
 * As opções da escolha única, numa lista só: a prévia, o snippet e as asserções
 * contam a partir DELA, e não de um número escrito à mão no play.
 */
const THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
] as const;

// ─── Com Label ────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  parameters: {
    covers: ['visual.item1'],
    // Override de story: são DOIS grupos rotulados, e a composição da lista é o
    // assunto — o snippet do meta traria um só.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Conta',
          items: [
            { type: 'label', label: 'Conta' },
            { label: 'Perfil', value: 'profile' },
            { label: 'Configurações', value: 'settings' },
            { type: 'separator' },
            { type: 'label', label: 'Suporte' },
            { label: 'Documentação', value: 'docs' },
            { label: 'Sair', value: 'logout' },
          ],
        }),
      },
    },
  },
  render: () =>
    mount(
      'Conta',
      [
        { type: 'label', label: 'Conta' },
        { type: 'item', label: 'Perfil', value: 'profile' },
        { type: 'item', label: 'Configurações', value: 'settings' },
        { type: 'separator' },
        { type: 'label', label: 'Suporte' },
        { type: 'item', label: 'Documentação', value: 'docs' },
        { type: 'item', label: 'Sair', value: 'logout' },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);

    await step('O rótulo não é item de menu', async () => {
      // Rótulo dentro de `role="menu"` não pode ser navegável: a seta o pousaria
      // como se fosse ação, e o typeahead o traria como resultado.
      await expect(canvas.getAllByRole('menuitem')).toHaveLength(4);
      const rotulos = menu.querySelectorAll('.nds-dropdown-menu-label');
      await expect(rotulos).toHaveLength(2);
      for (const r of rotulos) await expect(r.getAttribute('role')).toBe('presentation');
    });

    await step('Rótulo e separador têm ENDEREÇO próprio, como nas outras quatro', async () => {
      // `data-slot` é por onde a auditoria cross-stack compara o markup, e estas
      // duas peças eram as únicas da família sem ele — nesta fábrica, que é a
      // REFERÊNCIA. As outras quatro stacks escrevem os dois nomes, e as duas
      // fábricas irmãs desta stack também; faltava só aqui.
      for (const r of menu.querySelectorAll<HTMLElement>('.nds-dropdown-menu-label')) {
        await expect(r.dataset.slot).toBe('dropdown-menu-label');
      }
      const separadores = menu.querySelectorAll<HTMLElement>('[role="separator"]');
      await expect(separadores).toHaveLength(1);
      for (const s of separadores) {
        await expect(s.dataset.slot).toBe('dropdown-menu-separator');
      }
    });

    await step('O rótulo dá nome ao grupo que ele encabeça', async () => {
      // É o que o rótulo entrega além do texto: sem o `aria-labelledby`, o
      // leitor anuncia "grupo" e a pessoa não sabe de qual bloco se trata.
      await expect(canvas.getByRole('group', { name: 'Conta' })).toBeTruthy();
      await expect(canvas.getByRole('group', { name: 'Suporte' })).toBeTruthy();
      await expect(canvas.getAllByRole('group')).toHaveLength(2);
    });

    await step('O grupo fica FORA do percurso do teclado', async () => {
      // O grupo é embrulho, não parada: se ele entrasse na roda das setas, a
      // navegação ganharia um passo que não ativa nada.
      const groups = canvas.getAllByRole('group');
      for (const g of groups) await expect(g.getAttribute('tabindex')).toBeNull();

      // Uma volta inteira: são quatro itens, e toda parada tem de ser um deles.
      // Sem espera de relógio — o foco muda dentro do próprio `keydown`.
      for (let i = 0; i < 4; i++) {
        await userEvent.keyboard('{ArrowDown}');
        await expect((document.activeElement as HTMLElement).getAttribute('role')).toBe('menuitem');
      }
    });

    await step('O separador divide os grupos', async () => {
      await expect(canvas.getAllByRole('separator')).toHaveLength(1);
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Com CheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item4', 'visual.item2'],
    // Override de story: o item alternador tem papel ARIA e indicador próprios,
    // e o snippet do meta mostraria itens de ação simples.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Colunas',
          items: [
            { type: 'label', label: 'Colunas visíveis' },
            { type: 'checkbox', label: 'Nome', value: 'nome', checked: true },
            { type: 'checkbox', label: 'E-mail', value: 'email', checked: false },
            { type: 'checkbox', label: 'Função', value: 'funcao', checked: false },
          ],
        }),
      },
    },
  },
  render: () =>
    mount(
      'Colunas',
      [
        { type: 'label', label: 'Colunas visíveis' },
        { type: 'checkbox', label: 'Nome', value: 'nome', checked: true },
        { type: 'checkbox', label: 'E-mail', value: 'email', checked: false },
        { type: 'checkbox', label: 'Função', value: 'funcao', checked: false },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);
    const name = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const email = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(canvas.getAllByRole('menuitemcheckbox')).toHaveLength(3);
      await expect(name.getAttribute('aria-checked')).toBe('true');
      await expect(email.getAttribute('aria-checked')).toBe('false');
    });

    await step('O indicador só aparece no item marcado', async () => {
      // O estado não pode depender só do texto: o Check é o que a pessoa vê e o
      // `aria-checked` é o que ela ouve.
      const marca = (item: HTMLElement) =>
        item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;
      await expect(marca(name)).toBe(true);
      await expect(marca(email)).toBe(false);
    });

    await step('Clicar alterna nos DOIS sentidos, o indicador acompanha e o menu segue aberto', async () => {
      // O indicador é conferido DEPOIS de cada clique — o passo anterior o lia
      // só no estado de montagem, e um tique que não se redesenhasse ao marcar
      // passaria. E os dois sentidos: falso → verdadeiro → falso. Um alternador
      // que só marcasse passaria com um clique só.
      //
      // A precondição é a do primeiro passo (e-mail desmarcado), e o passo
      // termina nela: o replay do painel Interactions parte do mesmo estado.
      const marca = () => email.querySelector('.nds-dropdown-menu-item-indicator svg');
      const menusAbertos = () => within(document.body).queryAllByRole('menu');

      await userEvent.click(email);
      await expect(email.getAttribute('aria-checked')).toBe('true');
      await expect(marca()).not.toBeNull();
      // Alternar não fecha: quem marca uma coluna costuma marcar a próxima.
      // Consulta NOVA ao documento, e não a referência de antes do clique: um
      // menu que fechasse levaria o painel embora, e `email` continuaria
      // respondendo por atributo — nó solto não sabe que saiu do documento.
      await expect(menusAbertos()).toHaveLength(1);

      await userEvent.click(email);
      await expect(email.getAttribute('aria-checked')).toBe('false');
      await expect(marca()).toBeNull();
      await expect(menusAbertos()).toHaveLength(1);

      // Independentes entre si — é o que separa checkbox de escolha única.
      await expect(name.getAttribute('aria-checked')).toBe('true');
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Com RadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    // Override de story: a escolha única é UM grupo com as opções dentro
    // (`type: 'radio-group'`, D16) — o snippet do meta mostraria itens de ação
    // soltos, que é o oposto do que esta composição ensina.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Tema',
          items: [
            { type: 'label', label: 'Aparência' },
            {
              type: 'radio-group',
              value: 'light',
              options: THEMES.map((theme) => ({ value: theme.value, label: theme.label })),
            },
          ],
        }),
      },
    },
  },
  render: () =>
    mount(
      'Tema',
      [
        { type: 'label', label: 'Aparência' },
        {
          type: 'radio-group',
          value: 'light',
          options: THEMES.map((theme) => ({ value: theme.value, label: theme.label })),
        },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);
    const light = canvas.getByRole('menuitemradio', { name: 'Claro' });
    const escuro = canvas.getByRole('menuitemradio', { name: 'Escuro' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(THEMES.length);
      await expect(light.getAttribute('aria-checked')).toBe('true');
      await expect(escuro.getAttribute('aria-checked')).toBe('false');
    });

    await step('O rótulo dá nome ao grupo da escolha única — um grupo só', async () => {
      // D16: a escolha única é UM bloco, e o rótulo que vem antes dele É o nome
      // desse bloco. Um segundo `role="group"` aninhado faria o leitor anunciar
      // dois grupos para um bloco só; a forma antiga — itens soltos com um
      // `group` por item — não nomeava nada.
      const group = canvas.getByRole('group', { name: 'Aparência' });
      await expect(group.dataset.slot).toBe('dropdown-menu-radio-group');
      await expect(within(group).getAllByRole('menuitemradio')).toHaveLength(THEMES.length);
      await expect(canvas.getAllByRole('group')).toHaveLength(1);
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);

      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
        await expect(light.getAttribute('aria-checked')).toBe('false');
      });
      // O indicador acompanha a troca, senão o estado só existiria para o leitor.
      await expect(escuro.querySelector('.nds-dropdown-menu-item-indicator svg')).not.toBeNull();
      await expect(light.querySelector('.nds-dropdown-menu-item-indicator svg')).toBeNull();
    });

    await step('Escolher não fecha o menu', async () => {
      // A consulta é NOVA, e não a referência guardada antes do clique: um menu
      // que fechasse levaria o painel embora, mas `escuro` e `light` continuariam
      // respondendo por atributo — nós soltos não sabem que saíram do documento.
      // Contar os menus do documento é o que reprova esse fechamento.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      await expect(within(document.body).getByRole('menuitemradio', { name: 'Escuro' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Com submenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    covers: ['functional.item7', 'functional.item12', 'visual.item4'],
    // Override de story: o item de submenu leva a própria lista aninhada, e o
    // snippet do meta mostraria uma lista plana.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Arquivo',
          items: [
            { label: 'Renomear', value: 'rename' },
            {
              type: 'submenu',
              label: 'Exportar',
              value: 'export',
              items: [
                { label: 'PDF', value: 'pdf' },
                { label: 'CSV', value: 'csv' },
              ],
            },
          ],
        }),
      },
    },
  },
  render: () =>
    mount(
      'Arquivo',
      [
        { type: 'item', label: 'Renomear', value: 'rename' },
        {
          type: 'submenu',
          label: 'Exportar',
          value: 'export',
          items: [
            { type: 'item', label: 'PDF', value: 'pdf' },
            { type: 'item', label: 'CSV', value: 'csv' },
          ],
        },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await body.findByRole('menu');
    // O painel raiz ANIMA a entrada — `translateY` e `scale(0.98)` (D5) —, e o
    // sub-gatilho mora dentro dele: enquanto a escada roda, o item está até
    // ~1px do lugar onde vai parar. Um submenu aberto nesse intervalo é
    // posicionado contra o item EM MOVIMENTO e fica lá, porque
    // `autoUpdateFloating` observa rolagem, redimensionamento e mudança de
    // TAMANHO — e `transform` não muda nenhum dos três. Medido em 2026-09-19 ao
    // escrever a asserção da D15: sem esta espera a medida oscila 1,13px entre
    // rodadas, e a asserção de alinhamento vira intermitente sem que nada no
    // componente tenha mudado.
    await waitForAnimationsDone(menu);
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-triggerBox anuncia que abre um menu, e que está fechado', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      // Fechado, não há painel para apontar — `aria-owns` só existe enquanto o
      // menu filho existe.
      await expect(subTrigger.getAttribute('aria-owns')).toBe(null);
    });

    await step('A seta para a direita abre o submenu e entra nele', async () => {
      // Idempotente: a seta só é enviada com o submenu fechado, então o replay
      // do painel Interactions parte do mesmo estado.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        subTrigger.focus();
        await userEvent.keyboard('{ArrowRight}');
      }
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
      await expect(body.getAllByRole('menu')).toHaveLength(2);
      // Abrir sem entrar deixaria a pessoa vendo um painel que a seta seguinte
      // não percorre: o percurso do teclado sai do painel que tem o foco.
      await expect((document.activeElement as HTMLElement).textContent).toBe('PDF');
    });

    await step('O painel do submenu está ligado ao item que o abriu', async () => {
      // O painel mora no `body`, fora da árvore do menu pai — é `aria-owns` que
      // repõe a ligação. Sem ele o submenu é um menu solto para quem lê a tela.
      const submenu = body.getAllByRole('menu')[1];
      await expect(submenu.dataset.slot).toBe('dropdown-menu-sub-content');
      await expect(subTrigger.getAttribute('aria-owns')).toBe(submenu.id);
      await expect(submenu.id).not.toBe('');
      // Fora da árvore do pai também para o teclado: se o painel fosse aninhado,
      // a seta do menu pai passaria a percorrer os itens do filho.
      await expect(menu.contains(submenu)).toBe(false);
    });

    await step('O submenu abre AO LADO, não por cima do menu pai', async () => {
      const submenu = body.getAllByRole('menu')[1];
      // Dois formatos de exportação, que é o que o painel filho lista.
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(2);
      // Um submenu que nasce sobre o pai cobre os irmãos do item que o abriu. A
      // comparação é com a borda DIREITA do pai — comparar com a esquerda
      // passaria com os dois painéis empilhados.
      await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        menu.getBoundingClientRect().right - 8,
      );
    });

    await step('O subpainel ENCOSTA no sub-triggerBox e alinha o primeiro item com ele', async () => {
      // D15, e ela fixa um RESULTADO, não um número: `sideOffset: 0` encosta o
      // subpainel no painel pai, e o TOPO DO PRIMEIRO ITEM alinha com o topo do
      // sub-gatilho que o abriu — não com a borda da caixa. Quem alinha é o
      // item, que é o que a pessoa vê; uma asserção sobre o topo do PAINEL
      // passaria com `alignOffset: 0`, que é o que a conta faria sozinha.
      //
      // A ÂNCORA É O SUB-GATILHO, não a borda do painel pai. O sub-gatilho fica
      // recuado 5px da borda direita do pai (o `border: 1px` mais o
      // `padding: var(--spacing-1)` de `.nds-dropdown-menu-content`), então
      // cobrar o vão contra a borda do PAI aceitaria o número errado — é o que
      // o passo acima faz com tolerância de 8px, e por isso ele não substitui
      // este.
      //
      // Os NÚMEROS medidos em 2026-09-19, iguais nos três membros da família:
      // `alignOffset` 0 → o item nasce 5,00px ABAIXO do sub-gatilho; -2 → 3,00;
      // -4 → 1,00; **-5 → 0,00**. `positionFloating` com `align: 'start'`
      // ancora a BORDA da caixa do painel no topo do sub-gatilho, e do topo do
      // painel ao topo do primeiro item há os mesmos 5px de borda + padding. O
      // `-4` que a primeira versão da D15 escreveu derivava só do `--spacing-1`
      // e esquecia a borda.
      //
      // A tolerância é 0,75 e não é conforto: os dois números candidatos ficam a
      // exatamente 1px um do outro, então a faixa PRECISA ser menor que 1 para
      // separá-los; o resto dela cobre o meio pixel que aparece quando o gatilho
      // cai em coordenada fracionária.
      //
      // E a espera é `waitForAncorado` mais o fim das animações, NUNCA um
      // `waitFor` em volta da medida: no lugar de espera a diferença já cabe na
      // tolerância, e o `waitFor` fecha no primeiro quadro — passaria com o
      // defeito plantado. A entrada anima `translateY` e `scale(0.98)` (D5), e
      // medir no quadro zero mede a animação.
      const panel = body.getAllByRole('menu')[1];
      await waitForAncorado(panel);
      await waitForAnimationsDone(panel);
      const triggerBox = subTrigger.getBoundingClientRect();
      const caixa = panel.getBoundingClientRect();
      const item = within(panel).getAllByRole('menuitem')[0].getBoundingClientRect();
      const diagnostico =
        `vão lateral=${(caixa.left - triggerBox.right).toFixed(2)} · ` +
        `topo do painel=${(caixa.top - triggerBox.top).toFixed(2)} · ` +
        `topo do 1º item=${(item.top - triggerBox.top).toFixed(2)} (esperado 0)`;
      await expect(Math.abs(caixa.left - triggerBox.right), diagnostico).toBeLessThanOrEqual(0.75);
      await expect(Math.abs(item.top - triggerBox.top), diagnostico).toBeLessThanOrEqual(0.75);
    });

    await step('A seta para a esquerda fecha o submenu e devolve o foco', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(body.getAllByRole('menu')).toHaveLength(1);
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      // A ligação sai junto: apontar para um painel que já não está no documento
      // é pior que não apontar para nada.
      await expect(subTrigger.getAttribute('aria-owns')).toBe(null);
      await expect(document.activeElement).toBe(subTrigger);
    });

    await step('Escape dentro do submenu fecha SÓ o submenu e o menu segue aberto', async () => {
      // Reabre e entra: o passo anterior deixou o foco no sub-gatilho, com o
      // submenu fechado.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        subTrigger.focus();
        await userEvent.keyboard('{ArrowRight}');
      }
      await expect(body.getAllByRole('menu')).toHaveLength(2);
      await expect((document.activeElement as HTMLElement).textContent).toBe('PDF');

      await userEvent.keyboard('{Escape}');
      // Um nível por tecla: fechar o menu inteiro aqui tiraria a pessoa de dois
      // níveis de uma vez. O menu pai continua na tela, e o foco volta ao item
      // que abriu o submenu.
      await expect(body.getAllByRole('menu')).toHaveLength(1);
      await expect(menu.isConnected).toBe(true);
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(subTrigger);
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    covers: ['functional.item14'],
    // Override de story: o atalho é uma chave do item e integra o nome
    // acessível — o snippet do meta mostraria itens sem tecla nenhuma.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Editar',
          items: [
            { label: 'Desfazer', value: 'undo', shortcut: 'Ctrl+Z' },
            { label: 'Copiar', value: 'copy', shortcut: 'Ctrl+C' },
            { type: 'separator' },
            { label: 'Colar', value: 'paste', shortcut: 'Ctrl+V' },
          ],
        }),
      },
    },
  },
  render: () =>
    mount(
      'Editar',
      [
        { type: 'item', label: 'Desfazer', value: 'undo', shortcut: 'Ctrl+Z' },
        { type: 'item', label: 'Copiar', value: 'copy', shortcut: 'Ctrl+C' },
        { type: 'separator' },
        { type: 'item', label: 'Colar', value: 'paste', shortcut: 'Ctrl+V' },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
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

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};
