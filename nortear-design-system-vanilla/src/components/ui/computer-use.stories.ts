import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createComputerUse } from './computer-use';
import { computerUseLabels, createDemoScreen } from './computer-use.fixtures';
import { computerUseSource } from './computer-use.source';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import { COMPUTER_STEPS_LOGIN, COMPUTER_URL } from '@shared/primitives/computer-use-examples';
import { createComputerUseDocs } from '@/components/docs/ComputerUseDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Os três eixos da peça, numa peça só.
 *
 * O estado decide se a peça se declara ocupada e se a marca em curso pulsa; o
 * índice decide qual passo é o em curso, quais duas o antecedem no rastro e o
 * que a legenda diz; e a ausência de passo decide se existe rastro e legenda.
 * A grade dos cinco estados mora em `States`; aqui o assunto é o que muda
 * quando se mexe em cada eixo.
 */
type PlaygroundArgs = {
  status: RunStatus;
  activeIndex: number;
  withSteps: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/ComputerUse',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(createComputerUseDocs),
      source: { transform: computerUseSource },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: [...RUN_STATUSES],
      description:
        'Em que pé está a sessão. Decide se a peça se declara ocupada e se a marca em curso ganha o anel que pulsa.',
      table: {
        type: { summary: RUN_STATUSES.map((s) => `'${s}'`).join(' | ') },
        defaultValue: { summary: "'idle'" },
      },
    },
    activeIndex: {
      control: { type: 'number' },
      description:
        'Qual passo está acontecendo agora. Fora de alcance é preso ao alcance, para que incrementar além do último continue apontando para um passo de verdade.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    withSteps: {
      control: 'boolean',
      description:
        'Houve passo? Sem passo nenhum não há rastro nem legenda, e sobra a moldura com o endereço e a tela.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    status: 'running',
    activeIndex: 3,
    withSteps: true,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'functional.item5', 'functional.item6', 'functional.item10',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) =>
    createComputerUse({
      url: COMPUTER_URL,
      screen: createDemoScreen(),
      steps: args.withSteps ? COMPUTER_STEPS_LOGIN : [],
      activeIndex: args.activeIndex,
      status: args.status,
      labels: computerUseLabels(),
    }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="computer-use"]')!;
    const labels = computerUseLabels();

    await step('O endereço aparece, com a palavra que só quem ouve recebe', async () => {
      // A barra diz pelo desenho o que não conseguiria dizer em voz — sem a
      // palavra, quem ouve recebe uma cadeia solta no começo da figura.
      const url = root.querySelector<HTMLElement>('[data-slot="computer-use-url"]')!;
      await expect(url.textContent).toBe(COMPUTER_URL);
      await expect(url.getAttribute('lang')).toBe('en');
      const address = root.querySelector<HTMLElement>('[data-slot="computer-use-address"]')!;
      // A monoespaçada vem de uma utilitária que mora na MARCAÇÃO, não nesta
      // folha — e por isso some em silêncio quando alguém copia a árvore pela
      // metade. Esta asserção é o que impede o silêncio.
      await expect(address.classList.contains('nds-font-mono')).toBe(true);
      await expect(address.textContent).toContain(labels.address);
    });

    await step('A tela entra no quadro, e a peça não toca no que ela traz', async () => {
      // A tela é ESPAÇO de quem consome: a peça a encaixa inteira e não mexe em
      // nada do que veio com ela — nem no texto alternativo, nem no `inert` que
      // faz dela uma foto em vez de um formulário para preencher.
      const surface = root.querySelector<HTMLElement>('[data-slot="computer-use-surface"]')!;
      await expect(surface.children.length).toBe(1);
      await expect(surface.firstElementChild!.hasAttribute('inert')).toBe(true);
    });

    await step('O rastro e a legenda existem quando há passo', async () => {
      const marks = root.querySelectorAll('[data-slot="computer-use-mark"]');
      const caption = root.querySelector<HTMLElement>('[data-slot="computer-use-caption"]');

      if (!args.withSteps) {
        // Sem passo não há o que apontar nem o que dizer, e uma legenda vazia
        // daria à figura um nome em branco.
        await expect(marks.length).toBe(0);
        await expect(caption).toBeNull();
        return;
      }

      // No máximo três, contando a em curso: duas marcas são um segmento, e é
      // preciso um segundo para desenhar um caminho.
      const clamped = Math.min(Math.max(args.activeIndex, 0), COMPUTER_STEPS_LOGIN.length - 1);
      await expect(marks.length).toBe(Math.min(clamped + 1, 3));

      const activeStep = COMPUTER_STEPS_LOGIN[clamped];
      const action = root.querySelector<HTMLElement>('[data-slot="computer-use-action"]')!;
      const target = root.querySelector<HTMLElement>('[data-slot="computer-use-target"]')!;
      const position = root.querySelector<HTMLElement>('[data-slot="computer-use-position"]')!;
      await expect(action.textContent).toBe(activeStep.action);
      await expect(target.textContent).toBe(activeStep.target);
      await expect(position.textContent).toBe(
        labels.position
          .replace('{index}', String(clamped + 1))
          .replace('{total}', String(COMPUTER_STEPS_LOGIN.length)),
      );

      // A LEGENDA É O NOME DA FIGURA, e é assim que a tela deixa de ser uma
      // imagem anônima no meio da conversa. A asserção é ESTRUTURAL de
      // propósito: o nome acessível de uma figura sai do `<figcaption>` que é
      // filho dela, e comparar a cadeia calculada exigiria reproduzir aqui a
      // regra de espaçamento do cálculo — que é do navegador, não desta peça.
      await expect(root.tagName).toBe('FIGURE');
      await expect(caption!.tagName).toBe('FIGCAPTION');
      await expect(caption!.parentElement).toBe(root);
    });

    await step('A marca e o rastro ficam fora do que é lido em voz', async () => {
      // Posição numa imagem não chega a quem não a vê — o que chega é a
      // legenda, e é por isso que ela existe.
      const trail = root.querySelector<HTMLElement>('[data-slot="computer-use-trail"]');
      if (trail) await expect(trail.getAttribute('aria-hidden')).toBe('true');
    });

    await step('Nada na peça é região viva', async () => {
      // Uma tela dirigida troca de passo mais depressa do que se lê, e anunciar
      // cada um tornaria a tela impossível de ouvir (regra 1 da §8 da
      // guideline 17). O que existe no lugar é a peça se declarar ocupada.
      await expect(root.hasAttribute('aria-live')).toBe(false);
      const alive = root.querySelectorAll(
        '[role="status"], [role="alert"], [role="log"], [aria-live]',
      );
      await expect([...alive]).toEqual([]);
      await expect(root.getAttribute('aria-busy')).toBe(
        args.status === 'running' ? 'true' : null,
      );
    });
  },
};
