import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  waitForOpen,
  waitForCount,
  accessibleName,
  panelsAbertos,
  paresAbertos,
  expectOndeDiz,
} from '@shared/testing/hover-card-probe';
import { createHoverCard } from './hover-card';
import { hoverCardSource, hoverCardSourceWith } from './hover-card.source';
import {
  buildDefinitionLink,
  construirButton,
  construirCartaoPerfil,
  construirDuasLines,
  construirLink,
  emFrase,
} from './hover-card.fixtures';

/**
 * Destinos das duas composições que carregam informação própria (D15).
 *
 * Fixos e iguais nas cinco stacks e nos três idiomas — URL não se traduz, como o
 * `/users/joana` do cartão de perfil já fazia.
 *
 * São usados pelo `render`, e NÃO pelas asserções: cada passo repete a URL por
 * extenso, para que trocar a constante reprove em vez de mover os dois lados do
 * `expect` de uma vez.
 */
const HREF_GLOSSARY = '/glossario/wcag-2-2-aa';
const HREF_METRIC = '/metricas/conversao';

import { figmaDesign } from '@shared/figma/design-links';
// Os padrões de conteúdo que o cartão hospeda. Todos seguem a mesma regra: o
// que está aqui dentro é ENRIQUECIMENTO — existe outro caminho para a mesma
// informação (o link, a página, o glossário), porque no toque não há hover.
//
// Todas as composições nascem abertas: é o estado que a regressão visual
// precisa capturar, e o estado fechado já está em UI/HoverCard/States.

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/HoverCard/Compositions',
  parameters: {
    design: figmaDesign('hoverCard'),
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

// O termo e a definição são os do conteúdo compartilhado
// (`variants.items.definitionTooltip.cardTerm` / `cardMeaning`), que é o que a
// docs page publica nesta variante. A story dizia "WCAG 2.2 nível AA" e uma
// definição própria: quem comparasse a página e a story via duas respostas para
// a mesma variante, e nenhuma das duas errada sozinha. A story não LÊ o conteúdo
// — é markup de captura, num idioma só —, mas copia dele.
//
// O gatilho e o termo em destaque são a MESMA sigla, e os dois saem de
// `cardTerm`: foi a fresta entre um `cardTerm` que dizia "WCAG 2.2" e um `use`
// que citava "WCAG 2.2 AA" que dividiu as cinco stacks.
export const TermDefinition: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override de story: o gatilho leva ao VERBETE (D15) e carrega rótulo
    // próprio. O snippet do meta mostraria o link de perfil, que aqui seria
    // outro destino e outro desenho.
    docs: {
      source: {
        transform: hoverCardSourceWith({
          triggerTipo: 'definition',
          triggerLabel: 'WCAG 2.2 AA',
          triggerHref: HREF_GLOSSARY,
          triggerAriaLabel: 'Definição de WCAG 2.2 AA',
          contentTitle: 'WCAG 2.2 AA',
          contentApoio:
            'Web Content Accessibility Guidelines: padrão internacional de acessibilidade para conteúdo web.',
          fraseAntes: 'Todo componente do sistema atende',
          fraseDepois: ', sem exceção.',
        }),
      },
      description: {
        story:
          'Sigla no meio da prosa abre o termo por extenso e a definição em uma frase. O gatilho leva ao verbete do glossário: o cartão explica, e o link é o caminho de quem está no toque ou num leitor de tela.',
      },
    },
  },
  render: () => {
    const trigger = buildDefinitionLink('WCAG 2.2 AA', HREF_GLOSSARY);
    trigger.setAttribute('aria-label', 'Definição de WCAG 2.2 AA');
    const cartao = createHoverCard({
      trigger: trigger,
      content: construirDuasLines(
        'WCAG 2.2 AA',
        'Web Content Accessibility Guidelines: padrão internacional de acessibilidade para conteúdo web.',
      ),
      defaultOpen: true,
    });
    return emFrase(cartao, 'Todo componente do sistema atende', ', sem exceção.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho de definição leva ao verbete no glossário', async () => {
      // D15, e é o portão do C8: o conteúdo do cartão não pode ser o único
      // caminho para a informação. Em touch não existe hover, então sem destino
      // no gatilho o termo é BECO SEM SAÍDA — e esta era uma das duas
      // composições publicadas em que o julgamento morde.
      //
      // A URL é LITERAL aqui, e não `HREF_GLOSSARY`. Afirmar pela constante que
      // o `render` também usa compara a constante com ela mesma: trocá-la moveria
      // os dois lados do `expect` e nada reprovaria. É a forma exata que deixou a
      // D8 passar meses, e ela reapareceu nesta mesma rodada noutra stack.
      const trigger = canvas.getByRole('link', { name: 'Definição de WCAG 2.2 AA' });
      await expect(trigger).toHaveAttribute('href', '/glossario/wcag-2-2-aa');
    });

    await step('O rótulo nomeia o GATILHO; o painel é descrição, e não tem nome', async () => {
      const trigger = canvas.getByRole('link', { name: 'Definição de WCAG 2.2 AA' });
      const panel = await waitForOpen();
      // O `aria-label` do gatilho continua valendo — ele nomeia o botão, que
      // sem ele se chamaria só "WCAG 2.2 AA". O que saiu foi o nome do PAINEL:
      // sem papel, `aria-label` nele é `aria-prohibited-attr` no axe.
      await expect(accessibleName(panel)).toBe('');
      await expect(trigger).toHaveAttribute('aria-describedby', panel.id);
      await expect(within(panel).getByText(/Web Content Accessibility Guidelines/)).toBeVisible();
    });
  },
};

// O nome da métrica, a linha de cálculo e o valor são os do conteúdo
// compartilhado (`variants.items.metricExplainer.cardMetric` / `cardFormula` /
// `cardValue`), que é o que a docs page publica. A story cravava "Largest
// Contentful Paint" e "LCP 1.8s" — outra métrica, outro assunto — e quem
// comparasse a página com a story não teria como saber qual é a do sistema.
export const ExplainedMetric: Story = {
  parameters: {
    // Override de story: mesma razão do termo — o gatilho leva à página da
    // métrica (D15) e carrega rótulo próprio.
    docs: {
      source: {
        transform: hoverCardSourceWith({
          triggerTipo: 'definition',
          triggerLabel: '3,42%',
          triggerHref: HREF_METRIC,
          triggerAriaLabel: 'Explicação da métrica de conversão',
          contentTitle: 'Conversão (últimos 30d)',
          contentApoio: 'Cliques no CTA / usuários únicos',
          fraseAntes: 'A página inicial fechou o mês em',
          fraseDepois: ', dentro da meta.',
        }),
      },
      description: {
        story:
          'Valor de painel com o nome completo da métrica e a conta que a produz. A cor semântica fica no número — texto corrido dentro do cartão continua na cor de corpo, que é o que garante o contraste independentemente do valor.',
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
    name.textContent = 'Conversão (últimos 30d)';

    const value = document.createElement('span');
    value.className = 'nds-text-caption nds-font-medium nds-text-success';
    value.textContent = '3,42%';

    header.append(name, value);

    const formula = document.createElement('p');
    formula.className = 'nds-text-caption nds-text-muted-foreground';
    formula.textContent = 'Cliques no CTA / usuários únicos';

    content.append(header, formula);

    const trigger = buildDefinitionLink('3,42%', HREF_METRIC);
    trigger.setAttribute('aria-label', 'Explicação da métrica de conversão');
    const cartao = createHoverCard({ trigger: trigger, content: content, defaultOpen: true });
    return emFrase(cartao, 'A página inicial fechou o mês em', ', dentro da meta.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho da métrica leva à página da métrica', async () => {
      // D15, e é o portão do C8 — a mesma razão do termo: a conta que produz o
      // número só existe dentro do cartão, e no toque não há hover que o abra.
      // Sem destino, o número é beco sem saída.
      //
      // URL LITERAL, e não `HREF_METRIC` — ver o passo equivalente do termo.
      const trigger = canvas.getByRole('link', { name: 'Explicação da métrica de conversão' });
      await expect(trigger).toHaveAttribute('href', '/metricas/conversao');
    });

    await step('O número carrega a cor semântica; o texto corrido, não', async () => {
      const panel = await waitForOpen();
      const value = within(panel).getByText('3,42%');
      await expect(value).toHaveClass('nds-text-success');
      const formula = within(panel).getByText(/Cliques no CTA/);
      await expect(formula).not.toHaveClass('nds-text-success');
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
  play: async ({ canvasElement, step }) => {
    await step('Os quatro cartões abrem e cada um declara o lado que usou', async () => {
      const panels = await waitForCount(4);
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

    await step('E cada cartão está ANCORADO no lado que publicou', async () => {
      // O passo acima mede a AFIRMAÇÃO da lib; este mede o resultado dela. Com
      // o painel fora do fluxo os quatro publicavam o lado certo e pousavam
      // mais de 100px do lado errado, e a story passava. Ver `expectOndeDiz`.
      const pares = paresAbertos(canvasElement);
      await expect(pares).toHaveLength(4);
      for (const [trigger, panel] of pares) expectOndeDiz(trigger, panel);
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
    await step('O painel mostra o miolo que a story compôs', async () => {
      // Dente que faltava aqui: a play afirmava classe e largura e não olhava o
      // CONTEÚDO. Foi assim que um ramo de conteúdo faltando sobreviveu meses no
      // andaime de outra stack — a story passava mostrando o cartão errado, e
      // nem a foto acusava, porque cada stack fotografa o próprio resultado.
      const panel = await waitForOpen();
      await expect(within(panel).getByText('Joana Silva')).toBeVisible();
      await expect(within(panel).getByText(/14 tarefas nesta sprint/)).toBeVisible();
    });

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
