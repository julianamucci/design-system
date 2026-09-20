import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { dropdownMenuSource, dropdownMenuSourceWith } from './dropdown-menu.source';
import { createButton } from './button';
import { clicarQuandoMontado, endClose, mount } from './dropdown-menu.fixtures';
import { itemContrast } from '@shared/testing/dropdown-menu-probe';
import { resolveColor, ruleDeclaration } from '@shared/testing/cor';
import { waitForAnimationsDone } from '@/lib/wait-for-portal';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/DropdownMenu/Variants',
  parameters: {
    design: figmaDesign('dropdownMenu'),
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'As duas ênfases de item. `default` é o item neutro; `destructive` marca a ação ' +
          'irreversível com a cor de perigo, e existe para que "Excluir conta" não pareça ' +
          '"Editar perfil".',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: { covers: ['accessibility.item4', 'accessibility.item6'] },
  render: () =>
    mount('Ações', [
      { type: 'item', label: 'Editar', value: 'edit' },
      { type: 'item', label: 'Duplicar', value: 'duplicate' },
      { type: 'item', label: 'Compartilhar', value: 'share' },
    ]),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('A variante default é escrita no markup', async () => {
      await expect(items).toHaveLength(3);
      for (const item of items) {
        await expect(item.dataset.variant).toBe('default');
        await expect(item.classList.contains('nds-dropdown-menu-item')).toBe(true);
      }
    });

    await step('O item neutro herda a cor do popup, sem cor semântica', async () => {
      // O item em foco troca de cor de propósito — a comparação tem que ser com
      // um item em repouso, senão mede o realce e não a variante.
      const inRest = items.filter((i) => i !== document.activeElement);
      await expect(inRest.length).toBeGreaterThan(0);
      await expect(getComputedStyle(inRest[0]).color).toBe(getComputedStyle(menu).color);
    });

    await step('O texto do item atinge 4.5:1 sobre o fundo do popup', async () => {
      // O item de contrato dizia "verificar por axe-core" — verificação que
      // ninguém rodava: o axe do test-runner mede o que está na tela, e comparar
      // nome de token não responde a pergunta. A razão é aritmética. 14px em
      // peso normal é texto normal pela WCAG: o limite é 4.5, não 3.
      const inRest = items.filter((i) => i !== document.activeElement);
      const measurement = itemContrast(inRest[0]);
      await expect(measurement).not.toBeNull();
      await expect(measurement!.ratio).toBeGreaterThanOrEqual(4.5);
    });

    await step('O PONTEIRO também destaca o item, e quem pinta é a folha', async () => {
      // §7 #16 do PRD: react, vue, svelte e angular afirmam `userEvent.hover` →
      // `[data-highlighted]`, que a lib headless de cada uma escreve. Aqui não
      // há lib — as fábricas desta stack NÃO escutam ponteiro nos itens —, e
      // quem destaca é o `:hover` de `dropdown-menu.css` (D4). Ou seja: esta é
      // justamente a stack que depende da regra, e era a única sem asserção
      // sobre ela. Foi assim que marcação, rádio e sub-gatilho passaram meses
      // sem `:hover` nenhum aqui.
      //
      // A medida NÃO é o fundo computado depois de um `hover`: a pseudo-classe
      // só acende com ponteiro real, e o evento sintético deixa o fundo em
      // repouso — medido no badge em 2026-09-14. A saída é a mesma daquele
      // caso: conferir a DECLARAÇÃO da folha e resolvê-la no contexto do item,
      // onde quem expande o `var` e compõe o alfa continua sendo o navegador.
      const inRest = items.filter((i) => i !== document.activeElement);
      const declared = ruleDeclaration(
        document,
        (selector) => /\.nds-dropdown-menu-item:hover(\s*[,{]|$)/.test(selector),
        'background-color',
      );
      await expect(declared, 'a regra de :hover do item sumiu da folha').not.toBeNull();
      // O peso é o da D4 — accent a 20%, o mesmo do `[data-highlighted]`. Um
      // 10% aqui reprova, que é o estado de antes de 2026-09-10.
      const expected = resolveColor(inRest[0], 'hsl(var(--accent) / 0.2)');
      await expect(resolveColor(inRest[0], declared!)).toBe(expected);
      // E o realce MUDA alguma coisa: em repouso o item não carrega esse fundo.
      await expect(getComputedStyle(inRest[0]).backgroundColor).not.toBe(expected);
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Destructive ──────────────────────────────────────────────────────────────

export const Destructive: Story = {
  parameters: {
    covers: ['visual.item5'],
    // Override de story: a ênfase do item não passa por control nenhum, e o
    // snippet do meta mostraria `default` onde a story marca a ação
    // irreversível.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Mais ações',
          items: [
            { label: 'Editar', value: 'edit' },
            { type: 'separator' },
            { label: 'Excluir conta', value: 'delete', variant: 'destructive' },
          ],
        }),
      },
    },
  },
  render: () =>
    mount('Mais ações', [
      { type: 'item', label: 'Editar', value: 'edit' },
      { type: 'separator' },
      { type: 'item', label: 'Excluir conta', value: 'delete', variant: 'destructive' },
    ]),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);
    const neutro = canvas.getByRole('menuitem', { name: 'Editar' });
    const perigoso = canvas.getByRole('menuitem', { name: 'Excluir conta' });

    await step('A variante chega ao markup', async () => {
      await expect(perigoso.dataset.variant).toBe('destructive');
    });

    await step('A cor do texto distingue a ação irreversível', async () => {
      // O seletor do CSS é `[data-variant="destructive"]`: se o atributo não
      // chegasse, esta asserção pegaria a mesma cor do item neutro. O neutro tem
      // que estar em repouso para a comparação medir a variante, não o realce.
      neutro.blur();
      await expect(getComputedStyle(perigoso).color).not.toBe(getComputedStyle(neutro).color);
    });

    await step('O destaque não depende só da cor: o realce pinta o fundo', async () => {
      // Critério 1.4.1 na prática — quem não distingue matiz precisa do fundo.
      const antes = getComputedStyle(perigoso).backgroundColor;
      perigoso.focus();
      await waitFor(async () => {
        await expect(getComputedStyle(perigoso).backgroundColor).not.toBe(antes);
      });
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Placement ────────────────────────────────────────────────────────────────
//
// `side` e `align` eram controles MORTOS: a story os declarava e a fábrica
// cravava bottom/start a 4px. Esta story existe para que voltar àquilo doa —
// ela não lê atributo nenhum para provar o efeito, ela MEDE a caixa. Um
// controle que não faz nada e uma asserção que não falha são o mesmo defeito
// visto de dois lados.

export const Placement: Story = {
  parameters: {
    // Override de story: lado, encosto e modo não têm control neste arquivo, e
    // são os três o assunto — o snippet do meta mostraria o padrão, que é
    // justamente o oposto do que a story renderiza.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Abrir para cima',
          items: [
            { label: 'Renomear', value: 'rename' },
            { label: 'Mover', value: 'move' },
            { label: 'Arquivar', value: 'archive' },
          ],
          side: 'top',
          align: 'end',
          modal: false,
        }),
      },
      description: {
        story:
          'O menu sai pela borda escolhida (`side`) e encosta na ponta escolhida (`align`). ' +
          'Aqui ele abre para CIMA e encostado à direita — o oposto do padrão, que é para ' +
          'baixo e à esquerda.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir para cima' });
    const menu = createDropdownMenu({
      trigger,
      items: [
        { type: 'item', label: 'Renomear', value: 'rename' },
        { type: 'item', label: 'Mover', value: 'move' },
        { type: 'item', label: 'Arquivar', value: 'archive' },
      ],
      side: 'top',
      align: 'end',
      // Não modal: a página em volta continua utilizável, e a medida não passa
      // a depender de nada que o bloqueio faça.
      modal: false,
    });
    // Caixa alta e gatilho centrado: é o respiro que o painel precisa para
    // caber ACIMA dele sem encostar no topo da tela. `nds-min-h-100` em vez de
    // uma altura em `style`, que sairia do tema e da densidade.
    const wrapper = document.createElement('div');
    wrapper.style.contain = 'layout';
    wrapper.className = 'nds-cluster nds-w-full nds-min-h-100';
    wrapper.dataset.justify = 'center';
    wrapper.appendChild(menu);
    clicarQuandoMontado(trigger);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir para cima/i });
    const menu = await within(document.body).findByRole('menu');
    // Esta story MEDE a caixa, e a entrada anima `translateY` e `scale(0.98)`:
    // no meio do quadro as bordas direitas ficam a 1,28px uma da outra — 2% da
    // largura do painel —, que é o `scale` a caminho e não o `align` errado.
    await waitForAnimationsDone(menu);

    await step('Com side="top" o menu fica ACIMA do gatilho', async () => {
      const menuBox = menu.getBoundingClientRect();
      const triggerBox = trigger.getBoundingClientRect();
      // Com o `bottom` cravado da versão anterior, o menu nascia ABAIXO e esta
      // asserção falharia por toda a altura do gatilho mais o vão.
      await expect(menuBox.bottom).toBeLessThanOrEqual(triggerBox.top);
    });

    await step('Com align="end" as bordas direitas coincidem', async () => {
      const menuBox = menu.getBoundingClientRect();
      const triggerBox = trigger.getBoundingClientRect();
      // Um pixel de folga porque a medida é fracionária; `start` juntaria as
      // bordas ESQUERDAS, e a diferença aqui seria a largura inteira do menu.
      await expect(Math.abs(menuBox.right - triggerBox.right)).toBeLessThanOrEqual(1);
    });

    await step('O markup declara o que a medida mostrou', async () => {
      await expect(menu.dataset.side).toBe('top');
      await expect(menu.dataset.align).toBe('end');
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};
