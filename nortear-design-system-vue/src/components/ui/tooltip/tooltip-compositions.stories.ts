import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Save } from 'lucide-vue-next';
import { balaoDe, sideOf, spaceOnSide, sizeOnAxis, ARROW_GAP } from './tooltip.fixtures';
import { aguardarSeta } from '@shared/testing/tooltip-arrow-probe';
import {
  tooltipButtonIconSource,
  tooltipWithShortcutSource,
  tooltipHelpInFormFieldSource,
  tooltipMetricDescriptionSource,
  tooltipQuatroLadosSource,
  tooltipCollisionSource,
  tooltipGroupWaitSource,
} from './tooltip.source';

import { figmaDesign } from '@shared/figma/design-links';
// As composições que o conteúdo compartilhado documenta. Todas repetem a mesma
// regra: o Tooltip acrescenta contexto a um elemento que JÁ se explica sozinho —
// nunca é o único portador da informação.

// `sideOf`, `spaceOnSide`, `sizeOnAxis` e `ARROW_GAP` moram em
// `tooltip.fixtures.ts`: são medida de geometria, e três arquivos de story
// precisavam delas.

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

const meta = {
  title: 'Components/Overlay/Tooltip/Compositions',
  component: Tooltip,
  tags: ['overlay'],
  decorators: [
    (story) => ({
      components: { TooltipProvider, story },
      template: '<TooltipProvider><story /></TooltipProvider>',
    }),
  ],
  parameters: {
    design: figmaDesign('tooltip'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipButtonIconSource },
      description: {
        component:
          'Botão icon-only com atalho em Kbd, ajuda ao lado do rótulo de um campo, sigla de métrica expandida no balão, os quatro lados de posicionamento, a virada por colisão e a janela de espera compartilhada do grupo.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider, Button, Kbd, Save };

export const IconButtonWithShortcut: Story = {
  parameters: {
    docs: {
      // O balão ganha estrutura própria: o rótulo mais as teclas em Kbd, que a
      // do meta esconderia numa linha de texto corrido.
      source: { transform: tooltipWithShortcutSource },
      description: {
        story: 'Tooltip com atalho via Kbd — comunica a hotkey visualmente sem tirá-la do aria-label.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Salvar</span>
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /Salvar/i });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('O atalho vai em <kbd>, e a folha reconhece a tecla', async () => {
      const balao = balaoDe(trigger)!;
      const teclas = balao.querySelectorAll('kbd');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe('Ctrl');
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
    });
  },
};

export const HelpInFormField: Story = {
  parameters: {
    docs: {
      // O gatilho vira um glifo ao lado de um rótulo, e entra um campo de
      // formulário na composição — a do meta mostraria o botão de ícone solto.
      source: { transform: tooltipHelpInFormFieldSource },
      description: {
        story:
          'Ajuda ao lado do rótulo de um campo. Quem nomeia o campo é o label ligado por for/id; o balão explica onde achar o valor, e pode faltar sem quebrar o formulário.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <div class="nds-stack" data-spacing="sm" style="align-items: flex-start">
          <div class="nds-cluster" data-spacing="sm">
            <label for="api-token-input" class="nds-text-body nds-font-medium">Token de API</label>
            <Tooltip :default-open="true">
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon-sm" aria-label="Onde encontrar o Token de API">?</Button>
              </TooltipTrigger>
              <TooltipContent side="right">Gere em Configurações › Acesso › Tokens.</TooltipContent>
            </Tooltip>
          </div>
          <input id="api-token-input" type="text" class="nds-input" placeholder="ndsk_..." />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Onde encontrar o Token de API/i });

    await step('O campo continua rotulado pelo label, não pelo Tooltip', async () => {
      // O `for`/`id` é o que nomeia o campo. O Tooltip explica ONDE achar o
      // valor — informação complementar, que pode faltar sem quebrar o form.
      const field = canvas.getByLabelText('Token de API');
      await expect(field).toHaveAttribute('id', 'api-token-input');
    });

    await step('O glifo de ajuda é um botão focável, com nome próprio', async () => {
      // "?" é desenho feito de letra: sem o `aria-label` o botão se anunciaria
      // como "ponto de interrogação".
      await expect(trigger).toHaveAttribute('aria-label', 'Onde encontrar o Token de API');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.textContent).toContain('Tokens');
    });
  },
};

export const MetricDescription: Story = {
  parameters: {
    docs: {
      // A composição é a métrica inteira — sigla, glifo e valor —, e o balão só
      // expande a sigla. A do meta mostraria o balão sem o que ele explica.
      source: { transform: tooltipMetricDescriptionSource },
      description: {
        story:
          'Sigla de métrica com a expansão no balão. A sigla fica visível: quem não abre o tooltip ainda lê a métrica e o valor.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <div class="nds-stack" data-spacing="xs" style="align-items: flex-start">
          <div class="nds-cluster" data-spacing="sm">
            <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">LCP</p>
            <Tooltip :default-open="true">
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon-sm" aria-label="O que é LCP">i</Button>
              </TooltipTrigger>
              <TooltipContent>LCP — Largest Contentful Paint</TooltipContent>
            </Tooltip>
          </div>
          <p class="nds-text-h3 nds-font-semibold">1,8 s</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /O que é LCP/i });

    await step('A sigla fica visível; o Tooltip só a expande', async () => {
      // O balão não é o único portador do significado: tirado ele, a tela
      // continua dizendo qual é a métrica e quanto ela mede.
      await expect(canvasElement.textContent).toContain('LCP');
      await expect(canvasElement.textContent).toContain('1,8 s');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.textContent).toContain('Largest Contentful Paint');
    });
  },
};

export const PlacementSides: Story = {
  parameters: {
    covers: ['visual.item3'],
    // `padded`, e não o `centered` do meta: sob `centered` o Storybook encolhe o
    // ancestral para o CONTEÚDO, e uma grade de duas colunas colapsa para perto
    // da largura dos botões. Quem pede `left` fica sem folga à esquerda e a lib
    // vira o balão — a story reprovava por enquadramento, não por defeito.
    // Altura não compra lado: é a largura da tela que dá espaço horizontal. É a
    // mesma moldura do vanilla, que é a referência.
    layout: 'padded',
    docs: {
      // Quatro unidades numa grade, uma por lado de posicionamento — a do meta
      // mostraria uma só, e o assunto aqui é justamente a comparação.
      source: { transform: tooltipQuatroLadosSource },
      description: {
        story:
          'Quatro tooltips abertos ao mesmo tempo mostrando side=top/right/bottom/left. A grade tem folga dos quatro lados, então cada balão nasce exatamente do lado pedido — a virada por falta de espaço é assunto da story Collision.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; place-items: center" class="nds-grid nds-w-full nds-p-8 nds-min-h-80" data-spacing="xl" data-cols="2">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm" aria-label="top">top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">Tooltip top</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm" aria-label="right">right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">Tooltip right</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm" aria-label="bottom">bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip bottom</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm" aria-label="left">left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">Tooltip left</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const baloes = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-slot="tooltip-content"]'));

    await step('Os quatro balões abrem ao mesmo tempo', async () => {
      await waitFor(async () => {
        await expect(baloes().length).toBe(4);
      });
    });

    await step('Cada balão nasce exatamente do lado pedido', async () => {
      for (const side of ['top', 'right', 'bottom', 'left']) {
        // O texto identifica o balão sem depender do gatilho: aqui o que
        // interessa é de onde ele nasceu, não a ponte de acessibilidade.
        const balao = baloes().find((b) => b.textContent?.includes(`Tooltip ${side}`));
        await expect(balao).toBeTruthy();

        // PREMISSA antes do resultado: só faz sentido cobrar o lado pedido se
        // ele COUBER. Sem esta medida, uma story apertada reprova por moldura e
        // manda procurar defeito no componente.
        const trigger = within(canvasElement).getByRole('button', { name: side });
        await expect(spaceOnSide(trigger, side)).toBeGreaterThan(
          sizeOnAxis(balao!, side) + ARROW_GAP,
        );

        // Esperar o VALOR, e não a existência do atributo: `data-side` nasce
        // com o lado pedido e o posicionador mede no quadro seguinte, quando
        // pode trocá-lo. `toBeTruthy` devolvia na primeira leitura, antes da
        // medição. A condição só lê o DOM, que é o que a torna segura aqui.
        //
        // EXATO, e não `[side, oposto]`: com a folga provada acima, o lado
        // pedido é o lado final. Aceitar os dois passava com ou sem
        // reposicionamento — a virada tem story própria, `Collision`.
        await waitFor(
          async () => {
            await expect(sideOf(balao!)).toBe(side);
          },
          { timeout: 2000 },
        );
      }
    });

    await step('A seta encosta no balão, aponta para o gatilho e para a 4px dele', async () => {
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const balao = baloes().find((b) => b.textContent?.includes(`Tooltip ${side}`))!;
        const trigger = within(canvasElement).getByRole('button', { name: side });
        // `aguardarSeta` espera por RELÓGIO, não por `waitFor`: a medida força
        // layout, e o `data-side` aparece antes de a posição assentar. O porquê
        // dos dois está no módulo compartilhado.
        await aguardarSeta(balao, trigger);
      }
    });
  },
};

export const Collision: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      // A barra presa à borda é o assunto, e ela não aparece em composição
      // nenhuma das outras — a do meta mostraria um gatilho solto no meio.
      source: { transform: tooltipCollisionSource },
      description: {
        story:
          'Gatilho encostado na borda de cima: o balão pede o lado superior, não cabe, e nasce do lado oposto. Quem traz o lado final é o data-side — e é dele que a folha compartilhada desenha a seta e a origem da animação.',
      },
    },
    // A barra sai do fluxo e gruda na janela: a foto do Chromatic pegaria a
    // página inteira para mostrar um balão de duas linhas.
    chromatic: { disable: true },
  },
  render: () => ({
    components: sharedComponents,
    // SEM `contain: layout` no contêiner, e isso é o mecanismo da story:
    // `contain` cria bloco contentor, e o `position: fixed` passaria a se medir
    // por ele em vez de pela janela — o gatilho sairia da borda e não haveria
    // colisão nenhuma a observar.
    template: `
      <div class="nds-cluster" data-justify="center" style="position: fixed; inset-block-start: 0; inset-inline: 0">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline">Compartilhar</Button>
          </TooltipTrigger>
          <TooltipContent side="top">Cria um link público de leitura</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /Compartilhar/i });

    await step('A premissa: não cabe balão acima do gatilho', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      // PREMISSA antes do resultado. Sem ela a story "prova" uma virada que
      // pode não ter acontecido: bastaria a barra desgrudar da borda para o
      // lado pedido caber, e a asserção de baixo passaria por outro motivo —
      // ou reprovaria acusando o componente de um defeito que é de moldura.
      await expect(spaceOnSide(trigger, 'top')).toBeLessThan(
        sizeOnAxis(balaoDe(trigger)!, 'top') + ARROW_GAP,
      );
    });

    await step('Sem espaço acima, o balão nasce do lado OPOSTO ao pedido', async () => {
      // Esperar o VALOR, e não a existência do atributo: `data-side` nasce com
      // o lado PEDIDO (`top`) e a virada só chega no quadro seguinte, quando o
      // posicionador mede. O `toBeTruthy` de antes devolvia na primeira
      // leitura e pegava o `top` de nascença — o balão virava, e a story
      // reprovava mesmo com o componente certo. A condição só lê o DOM.
      //
      // `bottom`, e não "top ou bottom": com a premissa provada acima, a virada
      // é o único resultado possível. Asserção que aceitasse os dois passaria
      // com o reposicionamento desligado.
      await waitFor(
        async () => {
          await expect(sideOf(balaoDe(trigger))).toBe('bottom');
        },
        { timeout: 2000 },
      );
    });

    await step('E o balão fica dentro da janela, que é o motivo de virar', async () => {
      const rect = balaoDe(trigger)!.getBoundingClientRect();
      await expect(rect.top).toBeGreaterThanOrEqual(0);
      await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    });
  },
};

export const GroupWait: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // Dois gatilhos sob um Provider com as duas esperas declaradas — a do
      // meta publica um balão só, e sem vizinho não há janela de grupo.
      source: { transform: tooltipGroupWaitSource },
      description: {
        story:
          'Dois gatilhos num Provider só. O primeiro cumpre a espera; enquanto a janela de cortesia não expira, o vizinho abre na hora — é ela que faz percorrer uma barra de ações parecer um movimento só, em vez de uma espera a cada parada.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    // Esperas largas de propósito: é a distância entre as duas que torna a
    // dispensa MENSURÁVEL. Com a espera padrão, "abriu sem esperar" e "abriu
    // depois de esperar" ficam a 300ms um do outro, e a play não teria o que
    // separar.
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-30" data-align="center" data-justify="center">
        <TooltipProvider :delay-duration="3000" :skip-delay-duration="5000">
          <div class="nds-cluster" data-spacing="md">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline">Copiar</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span>Copiar</span>
                <Kbd>Ctrl</Kbd>
                <Kbd>C</Kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline">Colar</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span>Colar</span>
                <Kbd>Ctrl</Kbd>
                <Kbd>V</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const copy = canvas.getByRole('button', { name: 'Copiar' });
    const paste = canvas.getByRole('button', { name: 'Colar' });

    await step('Com o grupo frio, o ponteiro PAGA a espera', async () => {
      // A metade negativa, e é ela que impede a outra de passar por acidente:
      // sem este passo, "o vizinho abriu na hora" também seria verdade num
      // provedor que nunca esperasse coisa nenhuma. A sonda vai no MESMO
      // gatilho que o último passo mede, então o que muda entre os dois é só a
      // temperatura do grupo — não o elemento.
      await userEvent.hover(paste);
      // Piso bem abaixo da espera declarada (3s): balão aberto dentro dele só
      // pode significar atraso que sumiu.
      await wait(800);
      await expect(balaoDe(paste)).toBeNull();
      await userEvent.unhover(paste);
    });

    await step('Um balão abre e fecha, e é o fechamento que esquenta o grupo', async () => {
      copy.focus();
      await waitFor(async () => {
        await expect(balaoDe(copy)).not.toBeNull();
      });
      copy.blur();
      await waitFor(async () => {
        await expect(balaoDe(copy)).toBeNull();
      });
    });

    await step('Dentro da janela, o vizinho abre SEM esperar', async () => {
      // Ponteiro, e não foco: o foco já abria na hora antes de existir grupo
      // nenhum, e provaria a coisa errada. Quem espera é o ponteiro.
      await userEvent.hover(paste);
      // O prazo é a prova: a espera declarada é de 3s, então um balão que
      // aparece dentro de 1s só pode ter pulado a fila.
      await waitFor(
        async () => {
          await expect(balaoDe(paste)).not.toBeNull();
        },
        { timeout: 1000 },
      );
      // E o gancho diz o mesmo sem depender de relógio: `instant-open` é a
      // abertura que NÃO passou pelo temporizador.
      await expect(balaoDe(paste)).toHaveAttribute('data-state', 'instant-open');
      await expect(balaoDe(paste)!.querySelector('kbd')?.textContent).toBe('Ctrl');
    });
  },
};
