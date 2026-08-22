import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  waitForOpen,
  waitForQuantidade,
  nomeAcessivel,
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
  title: 'UI/HoverCard/Compositions',
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
      const painel = await waitForOpen();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText('Joana Silva')).toBeVisible();
      await expect(within(painel).getByText(/142 seguidores/)).toBeVisible();
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
    const conteudo = document.createElement('div');
    conteudo.className = 'nds-stack';
    conteudo.dataset.spacing = 'sm';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
    cabecalho.dataset.spacing = 'xs';

    const favicon = document.createElement('span');
    favicon.className = 'nds-rounded-sm nds-bg-muted nds-px-1';
    favicon.setAttribute('aria-hidden', 'true');
    favicon.textContent = 'D';

    const url = document.createElement('span');
    url.className = 'nds-truncate';
    url.textContent = 'design-system.dev/overlays';

    cabecalho.append(favicon, url);
    conteudo.append(
      cabecalho,
      construirDuasLines(
        'Guia de overlays acessíveis',
        'Quando usar tooltip, popover e cartão de hover — e o que cada um exige de teclado.',
      ),
    );

    const cartao = createHoverCard({
      trigger: construirLink('design-system.dev', 'https://design-system.dev'),
      content: conteudo,
      defaultOpen: true,
    });
    return emFrase(cartao, 'O guia completo está em', '.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O cartão mostra origem, título e descrição do destino', async () => {
      const painel = await waitForOpen();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText(/design-system\.dev\/overlays/)).toBeVisible();
      await expect(within(painel).getByText('Guia de overlays acessíveis')).toBeVisible();
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
    const gatilho = construirButton('WCAG 2.2 AA');
    gatilho.setAttribute('aria-label', 'Definição de WCAG 2.2 AA');
    const cartao = createHoverCard({
      trigger: gatilho,
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
      const gatilho = canvas.getByRole('button', { name: 'Definição de WCAG 2.2 AA' });
      // Sem `type="button"`, o mesmo gatilho dentro de um <form> enviaria o
      // formulário ao ser ativado por Enter.
      await expect(gatilho).toHaveAttribute('type', 'button');
    });

    await step('O nome acessível do painel vem do rótulo declarado', async () => {
      const painel = await waitForOpen();
      // Sem rótulo no gatilho, o nome cairia no texto dele ("WCAG 2.2 AA"), que
      // repetiria a sigla sem dizer o que o cartão traz.
      await expect(nomeAcessivel(painel)).toBe('Definição de WCAG 2.2 AA');
      await expect(within(painel).getByText('WCAG 2.2 nível AA')).toBeVisible();
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
    const conteudo = document.createElement('div');
    conteudo.className = 'nds-stack';
    conteudo.dataset.spacing = 'xs';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'nds-cluster';
    cabecalho.dataset.justify = 'between';
    cabecalho.dataset.align = 'baseline';
    cabecalho.dataset.spacing = 'sm';

    const nome = document.createElement('p');
    nome.className = 'nds-text-body nds-font-medium';
    nome.textContent = 'Largest Contentful Paint';

    const valor = document.createElement('span');
    valor.className = 'nds-text-caption nds-font-medium nds-text-success';
    valor.textContent = '1.8s';

    cabecalho.append(nome, valor);

    const descricao = document.createElement('p');
    descricao.className = 'nds-text-caption nds-text-muted-foreground';
    descricao.textContent =
      'Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.';

    conteudo.append(cabecalho, descricao);

    const gatilho = construirButton('LCP 1.8s');
    gatilho.setAttribute('aria-label', 'Explicação da métrica LCP');
    const cartao = createHoverCard({ trigger: gatilho, content: conteudo, defaultOpen: true });
    return emFrase(cartao, 'A página inicial fechou o mês em', ', dentro da meta.');
  },
  play: async ({ step }) => {
    await step('O número carrega a cor semântica; o texto corrido, não', async () => {
      const painel = await waitForOpen();
      const valor = within(painel).getByText('1.8s');
      await expect(valor).toHaveClass('nds-text-success');
      const descricao = within(painel).getByText(/Tempo até o maior elemento/);
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
    const grade = document.createElement('div');
    grade.className = 'nds-grid nds-max-w-lg';
    grade.dataset.cols = '2';
    grade.dataset.spacing = 'lg';


    const lados: Array<{ rotulo: string; side: 'top' | 'bottom' | 'left' | 'right' }> = [
      { rotulo: 'acima', side: 'top' },
      { rotulo: 'abaixo', side: 'bottom' },
      { rotulo: 'esquerda', side: 'left' },
      { rotulo: 'direita', side: 'right' },
    ];

    for (const { rotulo, side } of lados) {
      const gatilho = construirButton(rotulo);
      gatilho.setAttribute('aria-label', `Cartão ${rotulo} do gatilho`);
      const conteudo = document.createElement('p');
      conteudo.className = 'nds-text-caption';
      conteudo.textContent = `Lado preferido: ${rotulo}.`;

      const cartao = createHoverCard({ trigger: gatilho, content: conteudo, side, defaultOpen: true });
      const frase = emFrase(cartao, 'Abre', 'do gatilho.');
      // Na grade cada célula já tem altura própria: a altura mínima da frase
      // solta só empurraria as quatro para longe umas das outras.
      frase.classList.remove('nds-min-h-50');
      frase.classList.add('nds-p-8');
      grade.appendChild(frase);
    }

    return grade;
  },
  play: async ({ step }) => {
    await step('Os quatro cartões abrem e cada um declara o lado que usou', async () => {
      const panels = await waitForQuantidade(4);
      await expect(panels).toHaveLength(4);

      const lados = panels.map((p) => p.getAttribute('data-side'));
      for (const lado of lados) {
        await expect(lado).toBeTruthy();
      }

      // O EIXO é o contrato, e não o lado exato: nas stacks com fuga de colisão
      // pedir "acima" sem espaço acima resulta em "abaixo". Afirmar o literal
      // transformaria o tamanho da janela do teste em parte do contrato — e a
      // asserção deixaria de valer nas cinco.
      const [acima, abaixo, esquerda, direita] = lados;
      await expect(['top', 'bottom']).toContain(acima);
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
      const painel = await waitForOpen();
      // As duas coexistem: a classe do design system não é substituída pela do
      // consumidor, é acrescida.
      await expect(painel).toHaveClass('nds-hover-card-content');
      await expect(painel).toHaveClass('nds-w-md');
      await expect(getComputedStyle(painel).textAlign).toBe('center');
      await expect(panelsAbertos()).toHaveLength(1);
    });

    await step('E a largura customizada vence a largura padrão do cartão', async () => {
      // 28rem da utilitária contra os 20rem que `.nds-hover-card-content`
      // define. É o que prova que a customização de largura funciona de fato,
      // e não só que a classe está no atributo.
      const painel = await waitForOpen();
      const raiz = parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(painel.getBoundingClientRect().width).toBeCloseTo(28 * raiz, 0);
    });
  },
};
