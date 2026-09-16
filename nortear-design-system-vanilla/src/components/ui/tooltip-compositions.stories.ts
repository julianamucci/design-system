import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createTooltip, createTooltipProvider } from './tooltip';
import { aguardarLado, balaoDe, clearPortal, wrap } from './tooltip.fixtures';
import { aguardarSeta } from '@shared/testing/tooltip-arrow-probe';
import { tooltipSource, tooltipSourceWith, tooltipSourceLados } from './tooltip.source';
import { createButton, createButtonIcon } from './button';

import { figmaDesign } from '@shared/figma/design-links';
// As composições que o conteúdo compartilhado documenta, mais os quatro lados de
// posicionamento. Em todas, o Tooltip acrescenta contexto a um elemento que JÁ
// se explica sozinho — nunca é o único portador da informação.
//
// A moldura destas composições reserva 200px: são maiores que as stories de
// estados e variantes, que ficam no padrão de 180px do `wrap`.
const COMPOSITION_HEIGHT = '200px';

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Tooltip/Compositions',
  parameters: {
    design: figmaDesign('tooltip'),
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          'Botão de ação rápida com atalho, ajuda ao lado do rótulo de um campo, definição de sigla no cabeçalho de uma métrica e os quatro lados de posicionamento. O Tooltip NÃO substitui o aria-label: em touch não há hover, e o nome do botão precisa existir sem ele.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const IconButtonWithShortcut: Story = {
  parameters: {
    docs: {
      source: {
        transform: tooltipSourceWith({
          triggerVariant: 'ghost',
          triggerSize: 'icon',
          triggerLabel: '',
          triggerAriaLabel: 'Salvar',
          content: 'Salvar',
          contentComMarcacao: true,
          teclas: ['Ctrl', 'S'],
          side: 'bottom',
        }),
      },
    },
  },
  render: () => {
    const trigger = createButton({
      variant: 'ghost',
      size: 'icon',
      'aria-label': 'Salvar',
      children: createButtonIcon('download'),
    });

    // Uma tecla por `<kbd>`, como nas outras quatro stacks — e não a string
    // "Salvar (Ctrl+S)", que era o que estava aqui. Esta é A composição do
    // atalho, e as outras quatro a copiam desta stack: com o atalho solto no
    // texto ela não demonstrava o próprio assunto. Sem `<kbd>` não há caixa de
    // tecla, e sem `data-slot="kbd"` a folha não encurta o respiro à direita.
    const content = document.createElement('span');
    content.style.display = 'contents';
    const label = document.createElement('span');
    label.textContent = 'Salvar';
    content.appendChild(label);
    for (const nome of ['Ctrl', 'S']) {
      const tecla = document.createElement('kbd');
      tecla.dataset.slot = 'kbd';
      tecla.className = 'nds-kbd';
      tecla.textContent = nome;
      content.appendChild(tecla);
    }

    const el = createTooltip({ trigger, content, side: 'bottom' });
    queueMicrotask(() => trigger.focus());
    return wrap(el, COMPOSITION_HEIGHT);
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      // A ordem importa: o `aria-label` sozinho já diz o que o botão faz. O
      // Tooltip acrescenta a tecla, que é conveniência, não requisito.
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao.textContent).toContain('Salvar');
      const teclas = balao.querySelectorAll('kbd');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe('Ctrl');
      await expect(teclas[1].textContent).toBe('S');
    });

    await step('A folha compartilhada reconhece a tecla e encurta o respiro', async () => {
      // D7 do PRD, e a prova de que o gancho `data-slot="kbd"` chegou: sem ele
      // a regra `.nds-tooltip-content:has([data-slot="kbd"])` não pinta nada e o
      // balão mantém o respiro simétrico ao lado da caixa da tecla, que lê como
      // erro de alinhamento.
      const balao = balaoDe(trigger)!;
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
      const computedStyle = getComputedStyle(balao);
      await expect(parseFloat(computedStyle.paddingInlineEnd)).toBeLessThan(
        parseFloat(computedStyle.paddingInlineStart),
      );
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};

export const HelpInFormField: Story = {
  name: 'Form field with help',
  parameters: {
    docs: {
      source: {
        transform: tooltipSourceWith({
          triggerVariant: 'ghost',
          triggerSize: 'icon-sm',
          triggerLabel: '?',
          triggerAriaLabel: 'Onde encontrar o Token de API',
          content: 'Gere em Configurações › Acesso › Tokens.',
          side: 'right',
        }),
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'sm';
    root.style.alignItems = 'flex-start';

    const labelRow = document.createElement('div');
    labelRow.className = 'nds-cluster';
    labelRow.dataset.spacing = 'sm';

    const label = document.createElement('label');
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Token de API';
    label.htmlFor = 'api-token-input';

    const help = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      'aria-label': 'Onde encontrar o Token de API',
      label: '?',
    });

    const tooltip = createTooltip({
      trigger: help,
      content: 'Gere em Configurações › Acesso › Tokens.',
      side: 'right',
    });

    labelRow.append(label, tooltip);

    const input = document.createElement('input');
    input.id = 'api-token-input';
    input.type = 'text';
    input.className = 'nds-input';
    input.placeholder = 'ndsk_...';

    root.append(labelRow, input);
    queueMicrotask(() => help.focus());
    return wrap(root, COMPOSITION_HEIGHT);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Onde encontrar o Token de API/i });

    await step('O campo continua rotulado pelo label, não pelo Tooltip', async () => {
      // O `for`/`id` é o que nomeia o campo. O Tooltip explica ONDE achar o
      // valor — informação complementar, que pode faltar sem quebrar o form.
      const field = canvas.getByLabelText('Token de API');
      await expect(field).toHaveAttribute('id', 'api-token-input');
    });

    await step('O ícone de ajuda é um botão focável, com nome próprio', async () => {
      trigger.blur();
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.textContent).toContain('Tokens');
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};

export const MetricDescription: Story = {
  parameters: {
    docs: {
      source: {
        transform: tooltipSourceWith({
          triggerVariant: 'ghost',
          triggerSize: 'icon-sm',
          triggerLabel: 'i',
          triggerAriaLabel: 'O que é LCP',
          content: 'LCP — Largest Contentful Paint',
        }),
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'xs';
    root.style.alignItems = 'flex-start';

    const headerRow = document.createElement('div');
    headerRow.className = 'nds-cluster';
    headerRow.dataset.spacing = 'sm';

    const title = document.createElement('p');
    title.className = 'nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider';
    title.textContent = 'LCP';

    const help = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      'aria-label': 'O que é LCP',
      label: 'i',
    });

    const tooltip = createTooltip({
      trigger: help,
      content: 'LCP — Largest Contentful Paint',
      side: 'top',
    });

    headerRow.append(title, tooltip);

    const value = document.createElement('p');
    value.className = 'nds-text-h3 nds-font-semibold';
    value.textContent = '1,8 s';

    root.append(headerRow, value);
    queueMicrotask(() => help.focus());
    return wrap(root, COMPOSITION_HEIGHT);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /O que é LCP/i });

    await step('A sigla fica visível; o Tooltip só a expande', async () => {
      await expect(canvasElement.textContent).toContain('LCP');
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.textContent).toContain('Largest Contentful Paint');
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};

export const PlacementSides: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override: a story mostra os QUATRO lados, e um balão só não diria isso.
    docs: { source: { transform: tooltipSourceLados } },
  },
  render: () => {
    // A folga é por EIXO, e ela não vem da altura sozinha.
    //
    // Com o flip ligado, quem afirma `top` precisa de espaço ACIMA e quem afirma
    // `left`, à ESQUERDA. Antes desta correção o gatilho era ITEM ESTICADO da
    // grade: o topo dele caía no `nds-p-8` (32px) mais o respiro do quadro, ~48px
    // contra os ~46px que o balão pede — e o `top` virava para baixo.
    //
    // Crescer o palco NÃO cria folga por si: medido no react, um palco de 400px
    // fica mais alto que o quadro do runner, encosta no topo e a única folga que
    // resta continua sendo o padding. O que converte altura em folga é CENTRAR o
    // gatilho na célula — com a linha alta, sobra meia linha acima dele. É também
    // o que resolve o eixo horizontal: um botão de ~90px centrado numa coluna de
    // ~400px fica longe das duas bordas, e `right`/`left` deixam de colidir.
    const grid = document.createElement('div');
    grid.style.contain = 'layout';
    grid.style.placeItems = 'center';
    grid.className = 'nds-grid nds-w-full nds-p-8';
    grid.dataset.cols = '2';
    grid.dataset.spacing = 'xl';
    grid.classList.add('nds-min-h-100');

    const lados: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];

    for (const side of lados) {
      const trigger = createButton({ variant: 'outline', label: side, 'aria-label': side });
      grid.appendChild(createTooltip({ trigger, content: `Tooltip ${side}`, side }));
      queueMicrotask(() => {
        trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      });
    }

    return wrap(grid, '420px');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const baloes = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-slot="tooltip-content"]'));

    await step('Os quatro balões abrem ao mesmo tempo', async () => {
      await waitFor(
        async () => {
          await expect(baloes().length).toBe(4);
        },
        { timeout: 3000 },
      );
    });

    await step('Cada balão nasce do lado pedido', async () => {
      for (const side of ['top', 'right', 'bottom', 'left'] as const) {
        const trigger = canvas.getByRole('button', { name: side });
        // A factory posiciona por JS e publica o lado escolhido em `data-side`
        // — o mesmo gancho que as outras stacks emitem. A espera é pelo VALOR:
        // o atributo nasce com o lado pedido e só vira quando o posicionador
        // mede, então ler cedo aprova o que o flip deveria ter virado.
        const balao = await aguardarLado(trigger, side);
        await expect(balao).toHaveAttribute('data-side', side);
        await expect(balao.textContent).toBe(`Tooltip ${side}`);
      }
    });

    await step('A seta encosta no balão, aponta para o gatilho e para a 4px dele', async () => {
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const trigger = canvas.getByRole('button', { name: side });
        // `aguardarSeta` espera por RELÓGIO, não por `waitFor`: a medida força
        // layout, e o `data-side` aparece antes de a posição assentar. O porquê
        // dos dois está no módulo compartilhado.
        await aguardarSeta(balaoDe(trigger)!, trigger);
      }
    });


    await step('Cleanup', async () => { clearPortal(); });
  },
};

// ─── Grupo com espera compartilhada e conteúdo com marcação ───────────────────
//
// Duas faltas de uma vez. A espera era constante de MÓDULO: a página inteira
// tinha de concordar com 300ms, e ajustar a barra de ícones significava ajustar
// todo balão do produto. E `content` era só `string`, então um atalho em `<kbd>`
// não tinha como entrar — a alternativa seria HTML em string, que a guideline
// 09 fecha.

export const ProviderWithMarkup: Story = {
  parameters: {
    docs: {
      source: {
        transform: tooltipSourceWith({
          provider: { delayDuration: 3000, skipDelayDuration: 5000 },
          triggerLabel: 'Copiar',
          content: 'Copiar',
          contentComMarcacao: true,
          teclas: ['Ctrl', 'C'],
          side: 'bottom',
        }),
      },
      description: {
        story:
          'Uma barra de ícones com espera própria: o provedor guarda o padrão do grupo, e o ' +
          'balão seguinte abre na hora enquanto a janela de dispensa dura. O conteúdo entra ' +
          'como elemento, que é como a tecla do atalho ganha desenho próprio.',
      },
    },
  },
  render: () => {
    const barra = document.createElement('div');
    barra.className = 'nds-cluster';
    barra.dataset.spacing = 'md';

    // Espera longa de propósito: é ela que torna a dispensa MENSURÁVEL. Sem a
    // janela do grupo, o segundo balão levaria três segundos para aparecer, e a
    // asserção da play falha por tempo. Uma espera por chamada é justamente o
    // que a constante de módulo não permitia.
    const group = createTooltipProvider({ delayDuration: 3000, skipDelayDuration: 5000 });

    for (const [acao, tecla] of [['Copiar', 'C'], ['Colar', 'V']] as const) {
      const trigger = createButton({ variant: 'outline', label: acao, 'aria-label': acao });

      const content = document.createElement('span');
      content.append(`${acao} `);
      const kbd = document.createElement('kbd');
      // O gancho que a folha casa: `.nds-tooltip-content:has([data-slot="kbd"])`
      // encurta o respiro à direita. Sem ele a tecla desenha a caixa e o balão
      // mantém o padding cheio ao lado dela, que lê como erro de alinhamento.
      kbd.dataset.slot = 'kbd';
      kbd.className = 'nds-kbd';
      kbd.textContent = `Ctrl+${tecla}`;
      content.appendChild(kbd);

      barra.appendChild(group.createTooltip({ trigger, content: content, side: 'bottom' }));
    }

    return wrap(barra, COMPOSITION_HEIGHT);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const copiar = canvas.getByRole('button', { name: 'Copiar' });
    const colar = canvas.getByRole('button', { name: 'Colar' });

    await step('A marcação chega ao balão como marcação, não como texto', async () => {
      copiar.focus();
      await waitFor(async () => {
        await expect(balaoDe(copiar)).not.toBeNull();
      });
      const balao = balaoDe(copiar)!;
      // Uma string teria virado o literal "<kbd>Ctrl+C</kbd>" na tela.
      await expect(balao.querySelector('kbd')?.textContent).toBe('Ctrl+C');
      await expect(balao.textContent).toMatch(/Copiar Ctrl\+C/);
    });

    await step('Dentro da janela do grupo, o balão seguinte abre sem esperar', async () => {
      copiar.blur();
      await waitFor(async () => {
        await expect(balaoDe(copiar)).toBeNull();
      });
      // `mouseenter` e não `focus`: o foco já abria na hora antes de existir
      // grupo nenhum, e provaria a coisa errada. Quem espera é o ponteiro.
      //
      // O prazo é a prova: a espera do grupo é de 3s, então um balão que
      // aparece dentro de 1s só pode ter pulado a fila.
      colar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await waitFor(
        async () => {
          await expect(balaoDe(colar)).not.toBeNull();
        },
        { timeout: 1000 },
      );
      await expect(balaoDe(colar)!.querySelector('kbd')?.textContent).toBe('Ctrl+V');
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};

// ─── Colisão com a borda da janela ───────────────────────────────────────────
//
// O `side` é uma PREFERÊNCIA, e esta é a story que prova isso. Sem ela, nenhuma
// das cinco stacks forçava colisão: as asserções de lado ou exigiam o lado exato
// num gatilho com espaço de sobra — o que passa com ou sem o recurso — ou
// aceitavam `[lado, oposto]`, que passa nos dois casos e nunca reprova.

export const Collision: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: {
        transform: tooltipSourceWith({
          triggerLabel: 'Renomear',
          content: 'Renomear o arquivo',
        }),
      },
      description: {
        story:
          'O balão pede `top` com o gatilho encostado no topo da janela. Sem espaço acima, ' +
          'ele vira para baixo e publica o lado FINAL em `data-side` — que é o mesmo gancho ' +
          'que a folha lê para desenhar a seta e a origem do crescimento.',
      },
    },
  },
  render: () => {
    // Sem a moldura de `wrap`: ela declara `contain: layout`, e contenção de
    // layout faz do elemento bloco contedor de descendente `fixed` — o gatilho
    // deixaria de ser medido contra a JANELA, que é a colisão que se quer.
    const palco = document.createElement('div');
    palco.className = 'nds-cluster nds-w-full nds-min-h-50';
    palco.dataset.justify = 'center';

    const trigger = createButton({
      variant: 'outline',
      label: 'Renomear',
      'aria-label': 'Renomear',
    });
    // Encosto na borda SUPERIOR da janela. Mecânica de cena, não valor de
    // design: acima do gatilho não sobra a altura do balão mais o vão de 9px,
    // então o lado pedido não cabe e o oposto cabe.
    trigger.style.position = 'fixed';
    trigger.style.top = '0px';
    trigger.style.left = '50%';

    palco.appendChild(createTooltip({ trigger, content: 'Renomear o arquivo', side: 'top' }));
    return palco;
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /renomear/i });

    await step('A premissa: o gatilho está mesmo encostado no topo da janela', async () => {
      // Declarada, e não presumida. Se um ancestral virar bloco contedor de
      // `fixed` — `contain`, `transform`, `filter` —, o gatilho desce, não há
      // colisão nenhuma, e o passo seguinte passaria a medir o caso trivial
      // enquanto continuava verde.
      await expect(trigger.getBoundingClientRect().top).toBeLessThan(40);
    });

    await step('Sem espaço acima, o balão vira para o lado OPOSTO ao pedido', async () => {
      trigger.blur();
      trigger.focus();
      // Pelo VALOR, e não pela existência do atributo: ele nasce `top` — o lado
      // PEDIDO — e só vira quando o posicionador mede. Afirmar logo depois de o
      // balão existir leria o primeiro paint e daria esta story por verde
      // justamente no caso em que o flip não tivesse acontecido.
      const balao = await aguardarLado(trigger, 'bottom');
      // O lado EXATO, e o oposto do pedido: `[lado, oposto]` aqui seria a
      // asserção que não pode reprovar.
      await expect(balao).toHaveAttribute('data-side', 'bottom');
    });

    await step('E a seta segue o lado final, em vez de apontar para o vão', async () => {
      // O par que dá dentes ao passo acima: virar o painel e esquecer a seta é
      // defeito que compila, renderiza e nenhum portão de tipo alcança.
      await aguardarSeta(balaoDe(trigger)!, trigger);
    });

    await step('Cleanup', async () => { trigger.blur(); clearPortal(); });
  },
};

// ─── Espera compartilhada do grupo ───────────────────────────────────────────
//
// A story que mede a JANELA do provedor: o primeiro balão paga a espera, e o
// vizinho aberto logo depois não paga de novo. É o que faz percorrer uma barra
// de ícones parecer um movimento só, e o que se perde ao montar balão sem grupo.

export const GroupWait: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      source: {
        transform: tooltipSourceWith({
          provider: { delayDuration: 3000, skipDelayDuration: 5000 },
          triggerLabel: 'Copiar',
          content: 'Copiar',
          side: 'bottom',
        }),
      },
      description: {
        story:
          'Dois gatilhos no mesmo provedor. O primeiro espera o atraso do grupo; o segundo, ' +
          'aberto dentro da janela de dispensa, abre na hora.',
      },
    },
  },
  render: () => {
    const barra = document.createElement('div');
    barra.className = 'nds-cluster';
    barra.dataset.spacing = 'md';

    // Espera longa de propósito: é ela que torna a dispensa MENSURÁVEL. Com os
    // 300 ms da casa, "abriu rápido" e "abriu sem esperar" seriam a mesma
    // medida, e a story não distinguiria uma da outra.
    const group = createTooltipProvider({ delayDuration: 3000, skipDelayDuration: 5000 });

    for (const acao of ['Copiar', 'Colar']) {
      const trigger = createButton({ variant: 'outline', label: acao, 'aria-label': acao });
      barra.appendChild(group.createTooltip({ trigger, content: acao, side: 'bottom' }));
    }

    return wrap(barra, COMPOSITION_HEIGHT);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const copiar = canvas.getByRole('button', { name: 'Copiar' });
    const colar = canvas.getByRole('button', { name: 'Colar' });

    await step('Com o grupo frio, o primeiro balão PAGA a espera', async () => {
      // A metade negativa, e é ela que impede a outra de passar por acidente:
      // sem este passo, "o vizinho abriu rápido" também seria verdade num
      // provedor que nunca espera coisa nenhuma.
      colar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(800);
      await expect(balaoDe(colar)).toBeNull();
      colar.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    });

    await step('O primeiro abre e fecha, deixando o grupo quente', async () => {
      // Foco, que abre na hora por contrato, e depois `blur`: é o fechamento que
      // anota no grupo o instante em que a janela de dispensa começa.
      copiar.focus();
      await waitFor(async () => {
        await expect(balaoDe(copiar)).not.toBeNull();
      });
      copiar.blur();
      await waitFor(async () => {
        await expect(balaoDe(copiar)).toBeNull();
      });
    });

    await step('Dentro da janela, o vizinho abre SEM esperar', async () => {
      // `mouseenter` e não `focus`: o foco já abria na hora antes de existir
      // grupo nenhum, e provaria a coisa errada. Quem espera é o ponteiro.
      //
      // O prazo é a prova: a espera do grupo é de 3s, então um balão que aparece
      // dentro de 1s só pode ter pulado a fila.
      colar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await waitFor(
        async () => {
          await expect(balaoDe(colar)).not.toBeNull();
        },
        { timeout: 1000 },
      );
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};
