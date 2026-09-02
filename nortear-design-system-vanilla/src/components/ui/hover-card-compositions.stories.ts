import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  waitForOpen,
  waitForQuantidade,
  accessibleName,
  panelsAbertos,
} from '@shared/testing/hover-card-probe';
import { createHoverCard } from './hover-card';
import { hoverCardSource, hoverCardSourceWith } from './hover-card.source';
import {
  construirButton,
  construirCartaoPerfil,
  construirDuasLines,
  construirLink,
  emFrase,
} from './hover-card.fixtures';

// Os padrões de conteúdo que o cartão hospeda. Todos seguem a mesma regra: o
// que está aqui dentro é ENRIQUECIMENTO — existe outro caminho para a mesma
// informação (o link, a página, o glossário), porque no toque não há hover.
//
// Todas as composições nascem abertas: é o estado que a regressão visual
// precisa capturar, e o estado fechado já está em UI/HoverCard/States.

const meta: Meta = {
  tags: ['overlay'],
  title: 'Primitives/Overlay/HoverCard/Compositions',
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: hoverCardSource },
      description: {
        component:
          'Perfil, preview de link, definição de termo, métrica explicada, lados de abertura e classe extra no painel. O gatilho aparece sempre dentro de uma frase: é o uso real do componente e é o que mantém o alvo em linha dispensado do mínimo de 24px.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const UserProfile: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Menção a uma pessoa revela avatar, nome e uma métrica curta. O link continua navegável por clique e por teclado — é ele o caminho de quem está no toque.',
      },
    },
  },
  render: () => {
    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirCartaoPerfil(),
      defaultOpen: true,
    });
    return emFrase(cartao, 'Comentário de', 'há 2 horas.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O cartão traz avatar, nome e uma métrica curta', async () => {
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText('Joana Silva')).toBeVisible();
      await expect(within(panel).getByText(/142 seguidores/)).toBeVisible();
    });

    await step('E o gatilho continua sendo um link de verdade', async () => {
      await expect(canvas.getByRole('link')).toHaveAttribute('href', '/users/joana');
    });
  },
};

export const LinkPreview: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Cabeçalho com a origem, título do destino e uma linha de descrição. Reduz o clique exploratório: quem lê decide antes de sair da página.',
      },
    },
  },
  render: () => {
    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';

    const header = document.createElement('div');
    header.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
    header.dataset.spacing = 'xs';

    const favicon = document.createElement('span');
    favicon.className = 'nds-rounded-sm nds-bg-muted nds-px-1';
    favicon.setAttribute('aria-hidden', 'true');
    favicon.textContent = 'D';

    const url = document.createElement('span');
    url.className = 'nds-truncate';
    url.textContent = 'design-system.dev/overlays';

    header.append(favicon, url);
    content.append(
      header,
      construirDuasLines(
        'Guia de overlays acessíveis',
        'Quando usar tooltip, popover e cartão de hover — e o que cada um exige de teclado.',
      ),
    );

    const cartao = createHoverCard({
      trigger: construirLink('design-system.dev', 'https://design-system.dev'),
      content: content,
      defaultOpen: true,
    });
    return emFrase(cartao, 'O guia completo está em', '.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O cartão mostra origem, título e descrição do destino', async () => {
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText(/design-system\.dev\/overlays/)).toBeVisible();
      await expect(within(panel).getByText('Guia de overlays acessíveis')).toBeVisible();
      await expect(canvas.getByRole('link')).toHaveAttribute('href', 'https://design-system.dev');
    });
  },
};

export const TermDefinition: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override de story: o gatilho é OUTRO elemento — um botão, porque não há
    // para onde navegar — e carrega rótulo próprio, de onde sai o nome do
    // painel. O snippet do meta mostraria o link, que aqui seria errado.
    docs: {
      source: {
        transform: hoverCardSourceWith({
          triggerTipo: 'botao',
          triggerLabel: 'WCAG 2.2 AA',
          triggerAriaLabel: 'Definição de WCAG 2.2 AA',
          contentTitle: 'WCAG 2.2 nível AA',
          contentApoio:
            'Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1, operação por teclado e alvo de toque de 24px.',
          fraseAntes: 'Todo componente do sistema atende',
          fraseDepois: ', sem exceção.',
        }),
      },
      description: {
        story:
          'Sigla no meio da prosa abre o termo por extenso e a definição em uma frase. O gatilho é um botão, não um link: não há para onde navegar — o glossário continua sendo o caminho alternativo obrigatório.',
      },
    },
  },
  render: () => {
    const trigger = construirButton('WCAG 2.2 AA');
    trigger.setAttribute('aria-label', 'Definição de WCAG 2.2 AA');
    const cartao = createHoverCard({
      trigger: trigger,
      content: construirDuasLines(
        'WCAG 2.2 nível AA',
        'Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1, operação por teclado e alvo de toque de 24px.',
      ),
      defaultOpen: true,
    });
    return emFrase(cartao, 'Todo componente do sistema atende', ', sem exceção.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho de definição é um botão, e não envia formulário', async () => {
      const trigger = canvas.getByRole('button', { name: 'Definição de WCAG 2.2 AA' });
      // Sem `type="button"`, o mesmo gatilho dentro de um <form> enviaria o
      // formulário ao ser ativado por Enter.
      await expect(trigger).toHaveAttribute('type', 'button');
    });

    await step('O rótulo nomeia o GATILHO; o painel é descrição, e não tem nome', async () => {
      const trigger = canvas.getByRole('button', { name: 'Definição de WCAG 2.2 AA' });
      const panel = await waitForOpen();
      // O `aria-label` do gatilho continua valendo — ele nomeia o botão, que
      // sem ele se chamaria só "WCAG 2.2 AA". O que saiu foi o nome do PAINEL:
      // sem papel, `aria-label` nele é `aria-prohibited-attr` no axe.
      await expect(accessibleName(panel)).toBe('');
      await expect(trigger).toHaveAttribute('aria-describedby', panel.id);
      await expect(within(panel).getByText('WCAG 2.2 nível AA')).toBeVisible();
    });
  },
};

export const ExplainedMetric: Story = {
  parameters: {
    // Override de story: mesma razão do termo — o gatilho é um botão com rótulo
    // próprio, porque uma métrica não navega para lugar nenhum.
    docs: {
      source: {
        transform: hoverCardSourceWith({
          triggerTipo: 'botao',
          triggerLabel: 'LCP 1.8s',
          triggerAriaLabel: 'Explicação da métrica LCP',
          contentTitle: 'Largest Contentful Paint',
          contentApoio:
            'Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.',
          fraseAntes: 'A página inicial fechou o mês em',
          fraseDepois: ', dentro da meta.',
        }),
      },
      description: {
        story:
          'Valor de painel com o nome completo da métrica e os limiares. A cor semântica fica no número — texto corrido dentro do cartão continua na cor de corpo, que é o que garante o contraste independentemente do valor.',
      },
    },
  },
  render: () => {
    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';

    const header = document.createElement('div');
    header.className = 'nds-cluster';
    header.dataset.justify = 'between';
    header.dataset.align = 'baseline';
    header.dataset.spacing = 'sm';

    const name = document.createElement('p');
    name.className = 'nds-text-body nds-font-medium';
    name.textContent = 'Largest Contentful Paint';

    const value = document.createElement('span');
    value.className = 'nds-text-caption nds-font-medium nds-text-success';
    value.textContent = '1.8s';

    header.append(name, value);

    const descricao = document.createElement('p');
    descricao.className = 'nds-text-caption nds-text-muted-foreground';
    descricao.textContent =
      'Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.';

    content.append(header, descricao);

    const trigger = construirButton('LCP 1.8s');
    trigger.setAttribute('aria-label', 'Explicação da métrica LCP');
    const cartao = createHoverCard({ trigger: trigger, content: content, defaultOpen: true });
    return emFrase(cartao, 'A página inicial fechou o mês em', ', dentro da meta.');
  },
  play: async ({ step }) => {
    await step('O número carrega a cor semântica; o texto corrido, não', async () => {
      const panel = await waitForOpen();
      const value = within(panel).getByText('1.8s');
      await expect(value).toHaveClass('nds-text-success');
      const descricao = within(panel).getByText(/Tempo até o maior elemento/);
      await expect(descricao).not.toHaveClass('nds-text-success');
    });
  },
};

export const Sides: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Override de story: o lado de abertura é o assunto e não tem control neste
    // arquivo. O snippet mostra UM cartão com o lado escolhido — a grade de
    // quatro é o andaime da comparação, não o que se copia.
    docs: {
      source: {
        transform: hoverCardSourceWith({
          triggerTipo: 'botao',
          triggerLabel: 'acima',
          triggerAriaLabel: 'Cartão acima do gatilho',
          side: 'top',
          contentTitle: 'Lado preferido: acima.',
          contentApoio: 'O painel publica em data-side o lado que de fato usou.',
          fraseAntes: 'Abre',
          fraseDepois: 'do gatilho.',
        }),
      },
      description: {
        story:
          'Os quatro lados de abertura. O painel publica em data-side o lado que de fato usou — nesta factory o lado é o pedido, sem fuga de colisão, e é isso que a asserção afirma por eixo.',
      },
    },
  },
  render: () => {
    const grid = document.createElement('div');
    grid.className = 'nds-grid nds-max-w-lg';
    grid.dataset.cols = '2';
    grid.dataset.spacing = 'lg';


    const lados: Array<{ label: string; side: 'top' | 'bottom' | 'left' | 'right' }> = [
      { label: 'acima', side: 'top' },
      { label: 'abaixo', side: 'bottom' },
      { label: 'esquerda', side: 'left' },
      { label: 'direita', side: 'right' },
    ];

    for (const { label, side } of lados) {
      const trigger = construirButton(label);
      trigger.setAttribute('aria-label', `Cartão ${label} do gatilho`);
      const content = document.createElement('p');
      content.className = 'nds-text-caption';
      content.textContent = `Lado preferido: ${label}.`;

      const cartao = createHoverCard({ trigger: trigger, content: content, side, defaultOpen: true });
      const frase = emFrase(cartao, 'Abre', 'do gatilho.');
      // Na grade cada célula já tem altura própria: a altura mínima da frase
      // solta só empurraria as quatro para longe umas das outras.
      frase.classList.remove('nds-min-h-50');
      frase.classList.add('nds-p-8');
      grid.appendChild(frase);
    }

    return grid;
  },
  play: async ({ step }) => {
    await step('Os quatro cartões abrem e cada um declara o lado que usou', async () => {
      const panels = await waitForQuantidade(4);
      await expect(panels).toHaveLength(4);

      const lados = panels.map((p) => p.getAttribute('data-side'));
      for (const side of lados) {
        await expect(side).toBeTruthy();
      }

      // O EIXO é o contrato, e não o lado exato: nas stacks com fuga de colisão
      // pedir "acima" sem espaço acima resulta em "abaixo". Afirmar o literal
      // transformaria o tamanho da janela do teste em parte do contrato — e a
      // asserção deixaria de valer nas cinco.
      const [above, abaixo, esquerda, direita] = lados;
      await expect(['top', 'bottom']).toContain(above);
      await expect(['top', 'bottom']).toContain(abaixo);
      await expect(['left', 'right']).toContain(esquerda);
      await expect(['left', 'right']).toContain(direita);
    });
  },
};

export const ExtraPanelClass: Story = {
  parameters: {
    covers: ['visual.item5'],
    // Override de story: a classe extra do painel é o assunto inteiro, e não há
    // control que a carregue — sem isto o snippet mostraria o painel padrão.
    docs: {
      source: {
        transform: hoverCardSourceWith({
          class: 'nds-w-md nds-text-center',
          contentTitle: 'Joana Silva',
          contentApoio: 'Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.',
          fraseAntes: 'Resumo da entrega de',
          fraseDepois: 'nesta sprint.',
        }),
      },
      description: {
        story:
          'A classe extra do painel é o caminho para o que a folha do cartão não define — e também para trocar a largura de UMA instância: as utilities entram por último no CSS compartilhado, então uma utilitária de largura vence a largura padrão de 20rem.',
      },
    },
  },
  render: () => {
    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirDuasLines(
        'Joana Silva',
        'Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.',
      ),
      class: 'nds-w-md nds-text-center',
      defaultOpen: true,
    });
    return emFrase(cartao, 'Resumo da entrega de', 'nesta sprint.');
  },
  play: async ({ step }) => {
    await step('A classe extra convive com a classe do componente', async () => {
      const panel = await waitForOpen();
      // As duas coexistem: a classe do design system não é substituída pela do
      // consumidor, é acrescida.
      await expect(panel).toHaveClass('nds-hover-card-content');
      await expect(panel).toHaveClass('nds-w-md');
      await expect(getComputedStyle(panel).textAlign).toBe('center');
      await expect(panelsAbertos()).toHaveLength(1);
    });

    await step('E a largura customizada vence a largura padrão do cartão', async () => {
      // 28rem da utilitária contra os 20rem que `.nds-hover-card-content`
      // define. É o que prova que a customização de largura funciona de fato,
      // e não só que a classe está no atributo.
      const panel = await waitForOpen();
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(panel.getBoundingClientRect().width).toBeCloseTo(28 * root, 0);
    });
  },
};
