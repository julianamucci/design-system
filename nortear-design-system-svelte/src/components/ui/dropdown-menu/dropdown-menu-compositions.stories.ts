import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { waitForAncorado } from '@shared/testing/ancoragem';
import DropdownMenuStory from './DropdownMenuStory.svelte';
import {
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithCheckboxSource,
  dropdownMenuWithRadioSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithSubmenuSource,
  dropdownMenuSource,
} from './dropdown-menu.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Navigation/DropdownMenu/Compositions',
  component: DropdownMenuStory,
  tags: ['navigation'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'As composições canônicas: grupos com rótulo, alternadores, escolha única, submenu e ' +
          'atalhos. Todas partem das mesmas peças — o que muda é o papel ARIA do item e o ' +
          'indicador que o acompanha. Renderizadas abertas para captura no Chromatic.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Espera as animações de um painel ASSENTAREM. Espera PURA: só aguarda
 * `finished`, não lê nem escreve DOM, então não tem como provocar a própria
 * reagendagem.
 *
 * **Isto tem de rodar no painel PAI ANTES de o submenu abrir, e não só antes de
 * medir.** O painel entra por `nds-menu-in` (`nds/dropdown-menu.css`), que anima
 * `translateY` + `scale(0.98)`, e o SUB-GATILHO mora dentro dele. Abrir o
 * submenu nesse intervalo o ancora contra um gatilho EM MOVIMENTO — e ele fica
 * lá, porque o observador de reposicionamento da lib acompanha rolagem,
 * redimensionamento e mudança de TAMANHO, e `transform` não muda nenhum dos
 * três.
 *
 * Medido no vanilla em 2026-09-19, mesma folha e mesma animação: a deriva foi de
 * **1,13px**, a mesma ordem de grandeza do `-4`/`-5` que esta asserção precisa
 * separar. O dropdown sondado com o `-4` plantado devolveu −5,13 em vez de
 * −4,00, ou seja PASSOU numa rodada em que deveria reprovar. É intermitência
 * latente: no caso feliz a animação já acabou e ninguém vê.
 */
const assentarAnimacoes = async (el: HTMLElement) => {
  const nos = [el, el.parentElement].filter(Boolean) as HTMLElement[];
  await Promise.all(
    nos.flatMap((no) => no.getAnimations().map((a) => a.finished.catch(() => undefined))),
  );
};

/**
 * A medida da D15 — o submenu contra o SUB-GATILHO que o abriu.
 *
 * `deslocamentoDoItem` é o topo do PRIMEIRO ITEM do subpainel menos o topo do
 * sub-gatilho; a D15 pede zero. `deslocamentoDaCaixa` é o topo do PAINEL menos o
 * mesmo topo, e ele diz o que a lib ancora: medido em 2026-09-19, ele sai
 * EXATAMENTE igual ao `alignOffset` (0 → 0,00; −4 → −4,00; −5 → −5,00), o que
 * prova que o bits ancora a CAIXA DE BORDA do painel — como a base-ui e como o
 * `positionFloating` do vanilla, e ao contrário da reka, que desconta borda e
 * padding sozinha e por isso quer `0`. É daí que sai o número: `−(borda +
 * padding)`. `vaoLateral` é a borda esquerda do subpainel menos a borda direita
 * do sub-gatilho, que é o `sideOffset` de fato aplicado.
 *
 * **A espera é PURA, e a leitura é DIRETA.** `waitForAncorado` lê o `-200%` que
 * a lib deixa no invólucro enquanto mede, e as animações são esperadas por
 * `getAnimations().finished` — nenhum `waitFor` em volta da medida. Medido no
 * vue em 2026-09-18 e registrado na D15: envolver esta medida num `waitFor` faz
 * a asserção PASSAR COM O DEFEITO PLANTADO, porque no lugar de espera da lib a
 * diferença já cabe na tolerância e o `waitFor` fecha no primeiro quadro.
 */
const medirSubmenu = async (subTrigger: HTMLElement, submenu: HTMLElement) => {
  await waitForAncorado(submenu);
  await assentarAnimacoes(submenu);
  const item = submenu.querySelector<HTMLElement>(
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
  )!;
  const triggerBox = subTrigger.getBoundingClientRect();
  const panelBox = submenu.getBoundingClientRect();
  return {
    deslocamentoDoItem: item.getBoundingClientRect().top - triggerBox.top,
    deslocamentoDaCaixa: panelBox.top - triggerBox.top,
    vaoLateral: panelBox.left - triggerBox.right,
  };
};

export const WithLabel: Story = {
  args: { defaultOpen: true, variant: 'withLabel', triggerLabel: 'Conta' },
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: dropdownMenuWithLabelSource } },
  },
  play: async () => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);

    // É o que o rótulo entrega além do texto: sem o `aria-labelledby`, o leitor
    // anuncia "grupo" e a pessoa não sabe de qual bloco se trata. Até
    // 2026-09-18 quem nomeava era outra peça (`GroupHeading`), e o `Label`
    // desta stack era um `<div>` solto que não amarrava nada.
    await expect(canvas.getByRole('group', { name: 'Conta' })).toBeTruthy();
    await expect(canvas.getByRole('group', { name: 'Suporte' })).toBeTruthy();

    // E as DUAS peças desenham a mesma coisa: "Conta" sai de `Label` e
    // "Suporte" de `GroupHeading`, que delega a ele. O endereço de markup é um
    // só — `dropdown-menu-label`, o das outras quatro stacks —, e nenhum rótulo
    // carrega `role="group"`, que a lib põe no cabeçalho e criaria um bloco
    // vazio dentro do bloco que ele nomeia.
    const labels = menu.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-label"]');
    await expect(labels).toHaveLength(2);
    await expect(menu.querySelectorAll('[data-slot="dropdown-menu-group-heading"]')).toHaveLength(0);
    for (const label of labels) {
      await expect(label.hasAttribute('role')).toBe(false);
      await expect(label.classList.contains('nds-dropdown-menu-label')).toBe(true);
    }

    // Rótulo dentro de `role="menu"` não pode ser navegável: a seta o pousaria
    // como se fosse ação, e o typeahead o traria como resultado.
    await expect(canvas.getAllByRole('menuitem')).toHaveLength(4);

    // O divisor precisa do papel certo: um `role="group"` vazio (o que a lib
    // entrega sozinha) é anunciado como grupo sem nada dentro.
    await expect(canvas.getAllByRole('separator')).toHaveLength(1);
  },
};

export const WithCheckboxItems: Story = {
  args: { defaultOpen: true, variant: 'withCheckbox', triggerLabel: 'Colunas' },
  parameters: {
    covers: ['functional.item5', 'accessibility.item4', 'visual.item2'],
    docs: { source: { transform: dropdownMenuWithCheckboxSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const name = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const email = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });
    const role = canvas.getByRole('menuitemcheckbox', { name: 'Função' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(canvas.getAllByRole('menuitemcheckbox')).toHaveLength(3);
      await expect(name).toHaveAttribute('aria-checked', 'true');
      await expect(email).toHaveAttribute('aria-checked', 'false');
      await expect(role).toHaveAttribute('aria-checked', 'false');
    });

    // O estado não pode depender só do texto: o tique é o que a pessoa vê e o
    // `aria-checked` é o que ela ouve. Lido do DOM de agora, a cada chamada.
    const marca = (item: HTMLElement) =>
      item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;

    await step('O indicador só aparece no item marcado', async () => {
      await expect(marca(name)).toBe(true);
      await expect(marca(email)).toBe(false);
    });

    // F5 nos DOIS sentidos: marcar e desmarcar, cada um conferindo o anunciado,
    // o desenhado e o menu aberto DEPOIS do clique. O sentido que volta é o que
    // prova que o indicador acompanha o estado, e não só aparece.
    //
    // Cada clique é o do par idempotente — só clica quando o estado atual não é
    // o desejado —, porque o painel Interactions reexecuta a play no MESMO DOM.
    // Aqui a guarda sempre clica: o passo anterior acabou de afirmar o estado
    // oposto, e é isso que mantém a medição de pé.
    await step('Clicar marca o item: o anúncio e o tique mudam, e o menu segue aberto', async () => {
      await expect(email).toHaveAttribute('aria-checked', 'false');
      if (email.getAttribute('aria-checked') !== 'true') await userEvent.click(email);

      await waitFor(async () => {
        await expect(email).toHaveAttribute('aria-checked', 'true');
        await expect(marca(email)).toBe(true);
      });
      // Alternar não fecha: quem marca uma coluna costuma marcar a próxima.
      // Contar os menus é o que tem dentes no bits — o nó fechado continua no
      // documento, com o último `aria-checked`.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      // Independentes entre si — é o que separa checkbox de escolha única. O
      // terceiro item é quem prova: marcar o e-mail não arrasta nem o vizinho de
      // cima, que já estava marcado, nem o de baixo, que não estava.
      await expect(name).toHaveAttribute('aria-checked', 'true');
      await expect(role).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clicar de novo desmarca: o tique some, e o menu segue aberto', async () => {
      if (email.getAttribute('aria-checked') !== 'false') await userEvent.click(email);

      await waitFor(async () => {
        await expect(email).toHaveAttribute('aria-checked', 'false');
        await expect(marca(email)).toBe(false);
      });
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      await expect(name).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const WithRadioGroup: Story = {
  args: { defaultOpen: true, variant: 'withRadio', triggerLabel: 'Tema' },
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    docs: { source: { transform: dropdownMenuWithRadioSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const light = canvas.getByRole('menuitemradio', { name: 'Claro' });
    const dark = canvas.getByRole('menuitemradio', { name: 'Escuro' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(3);
      await expect(light).toHaveAttribute('aria-checked', 'true');
      await expect(dark).toHaveAttribute('aria-checked', 'false');
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (dark.getAttribute('aria-checked') !== 'true') await userEvent.click(dark);

      await waitFor(async () => {
        await expect(dark).toHaveAttribute('aria-checked', 'true');
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
  args: { defaultOpen: true, variant: 'withSubmenu', triggerLabel: 'Arquivo' },
  parameters: {
    covers: ['functional.item7', 'functional.item12', 'visual.item4'],
    docs: { source: { transform: dropdownMenuWithSubmenuSource } },
  },
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    // O painel PAI assenta ANTES de qualquer submenu abrir — ver
    // `assentarAnimacoes`. Aqui, e não junto da medida: o que estraga a medida é
    // o submenu ter sido ANCORADO contra um sub-gatilho em movimento, e depois
    // disso nenhuma espera desfaz.
    await assentarAnimacoes(menu);
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-triggerBox anuncia que abre um menu', async () => {
      await expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(subTrigger).toHaveAttribute('aria-expanded', 'false');
    });

    // O primeiro item do painel filho, lido de novo a cada chamada: o painel é
    // outro nó a cada abertura.
    const firstSubItem = () => within(body.getAllByRole('menu')[1]).getAllByRole('menuitem')[0];

    // Abre pela seta e confere ONDE o foco caiu — nenhum passo foca item do
    // submenu à mão. Focar à mão fazia a play medir o próprio `focus()`, e o
    // F12 promete que a SETA leva o foco ao primeiro item.
    const openByArrow = async () => {
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(subTrigger).toHaveAttribute('aria-expanded', 'true');
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(firstSubItem());
      });
    };

    await step('A seta para a direita abre o submenu e leva o foco ao primeiro item dele', async () => {
      // Idempotente: a seta só é enviada com o submenu fechado. No replay ele já
      // está aberto pela seta do último passo, com o foco onde ela o deixou.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        subTrigger.focus();
        await openByArrow();
      }
      await waitFor(async () => {
        await expect(document.activeElement).toBe(firstSubItem());
      });
    });

    await step('D15 · o submenu encosta no sub-triggerBox e alinha o primeiro item com ele', async () => {
      const submenu = body.getAllByRole('menu')[1];
      // Dois formatos de exportação, que é o que o painel filho lista agora.
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(2);
      const { deslocamentoDoItem, deslocamentoDaCaixa, vaoLateral } = await medirSubmenu(subTrigger, submenu);
      // D15 fixa o RESULTADO, não o número: o topo do PRIMEIRO ITEM do submenu
      // alinha com o topo do sub-gatilho que o abriu. Medir o ITEM, e não a
      // caixa, é o que dá dentes — uma asserção sobre o topo do painel passaria
      // com `alignOffset: 0`, que é o que a lib faria sozinha.
      //
      // Medido em 2026-09-19: `alignOffset: -5` sai 0,00; `-4` sai +1,00; `0`
      // sai +5,00; e sem `align="start"` sai −14,00 aqui e −29,00 no Menubar,
      // porque aí a lib centra o painel no gatilho e o desvio passa a depender
      // da ALTURA dele.
      //
      // **A tolerância é 0,75, e não 1.** Os dois candidatos plausíveis — o
      // `-4` da primeira redação da D15 e o `-5` que a medição escolheu — ficam
      // a EXATAMENTE 1px um do outro. Com tolerância de 1 a asserção não os
      // separa, e passaria com o `-4` plantado: portão sem dentes com cara de
      // cobertura, que é a forma exata do defeito que esta decisão existe para
      // pegar.
      await expect(Math.abs(deslocamentoDoItem)).toBeLessThanOrEqual(0.75);
      // A outra metade: `sideOffset: 0` encosta o subpainel no SUB-GATILHO — que
      // é a âncora, e não a borda do painel pai (o gatilho fica recuado o
      // `padding: var(--spacing-1)` do painel, então cobrar contra o pai cobraria
      // −4 e acusaria o número certo). Tem dentes: medido, o vão acompanha o
      // número (0 → 0,00; 8 → 8,00).
      await expect(Math.abs(vaoLateral)).toBeLessThanOrEqual(1);
      // E o que a lib ANCORA é a CAIXA DE BORDA do painel: o topo dele sai
      // exatamente no `alignOffset`. É a premissa de onde o -5 vem — ele é
      // `−(borda + padding)` porque a lib não desconta nenhum dos dois. Se o
      // bits passar a descontar sozinho, como a reka faz (e aí o número vira
      // 0), este passo reprova e manda remedir, em vez de o desenho quebrar em
      // silêncio.
      await expect(Math.abs(deslocamentoDaCaixa + 5)).toBeLessThanOrEqual(0.75);
      // E um submenu que nasce SOBRE o pai cobre os irmãos do item que o abriu.
      await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        menu.getBoundingClientRect().right - 8,
      );
    });

    await step('O submenu é um panelBox próprio, fora do pai — e o pai não rola', async () => {
      const submenu = body.getAllByRole('menu')[1];
      // Sem portal o painel filho nascia dentro do pai, que tem `overflow-y:
      // auto`: o pai passava a rolar e o axe acusava região rolável sem foco
      // (`scrollable-region-focusable`).
      await expect(menu.contains(submenu)).toBe(false);
      await expect(submenu.getAttribute('data-slot')).toBe('dropdown-menu-sub-content');
      // Sem a classe do painel o submenu flutuava sem fundo, borda nem sombra.
      await expect(submenu.classList.contains('nds-dropdown-menu-content')).toBe(true);
      await expect(menu.scrollHeight).toBeLessThanOrEqual(menu.clientHeight);
    });

    // Fecha só o submenu, e o menu de cima segue aberto: a prova é o painel
    // raiz ser o MESMO nó de antes, um quadro depois. Um raiz fechado e
    // reaberto no meio passaria por "aberto" numa contagem.
    const onlyRootStaysOpen = async () => {
      await waitFor(async () => {
        await expect(subTrigger).toHaveAttribute('aria-expanded', 'false');
        await expect(body.getAllByRole('menu')).toHaveLength(1);
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(subTrigger);
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await expect(body.getAllByRole('menu')).toHaveLength(1);
      await expect(body.getAllByRole('menu')[0]).toBe(menu);
      await expect(menu.isConnected).toBe(true);
    };

    await step('A seta para a esquerda fecha só o submenu e devolve o foco ao sub-triggerBox', async () => {
      // O foco está no submenu porque a SETA o levou até lá, no primeiro passo.
      await expect(document.activeElement).toBe(firstSubItem());
      await userEvent.keyboard('{ArrowLeft}');
      await onlyRootStaysOpen();
    });

    await step('Escape no submenu fecha só o submenu e devolve o foco ao sub-triggerBox', async () => {
      // WAI-ARIA APG: Escape fecha o menu em que o foco está, e o de fora segue
      // aberto. O bits fechava a árvore inteira — um nível de volta custava os
      // dois (ver `sub-escape.ts`). O foco volta ao submenu pelo teclado: a seta
      // parte do sub-gatilho, onde o passo anterior o deixou.
      await openByArrow();
      await userEvent.keyboard('{Escape}');
      await onlyRootStaysOpen();
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item4` descreve o submenu aberto — é o que o Chromatic precisa
      // fotografar.
      await openByArrow();
    });
  },
};

export const WithShortcuts: Story = {
  args: { defaultOpen: true, variant: 'withShortcuts', triggerLabel: 'Editar' },
  parameters: {
    // F14: o atalho à direita do rótulo e dentro do nome acessível — os três
    // passos abaixo medem exatamente isso.
    covers: ['functional.item14'],
    docs: { source: { transform: dropdownMenuWithShortcutsSource } },
  },
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
