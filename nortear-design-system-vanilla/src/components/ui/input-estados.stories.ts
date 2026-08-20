import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, userEvent, expect } from 'storybook/test';
import {
  bordasPorEstado,
  campoDe,
  contrastesNosDoisModos,
  corDoToken,
  haloDeFoco,
} from '@shared/testing/input-probe';
import { campoRotulado } from './input.fixtures';
import { inputSource, inputSourceCom } from './input.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Input/States',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: inputSource },
      description: {
        component:
          'Estados do Input: padrão, foco, desabilitado e erro (aria-invalid). Cada asserção afere a cor computada, nunca o nome da classe.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  // O contraste é medido AQUI, na story clara, porque `contrastesNosDoisModos`
  // liga o escuro e desliga: numa story que já nasce escura os dois lados da
  // medição sairiam escuros e o item ficaria meio verificado.
  parameters: { covers: ['accessibility.item5'] },
  render: () =>
    campoRotulado({ id: 'estado-padrao', rotulo: 'Nome completo', placeholder: 'ex: João da Silva' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Nome completo');

    await step('Campo editável e sem estado de erro', async () => {
      await expect(input).toBeVisible();
      await expect(input).not.toBeDisabled();
      await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    });

    await step('O fundo do campo é opaco, não transparente', async () => {
      // A documentação afirmou "fundo transparente" por meses. O campo pinta
      // --background: medir é o que separa a afirmação do que se vê.
      const fundo = getComputedStyle(campoDe(canvasElement)!).backgroundColor;
      await expect(fundo).not.toBe('rgba(0, 0, 0, 0)');
      await expect(fundo).not.toBe('transparent');
    });

    await step('Contraste nos DOIS modos (accessibility.item5)', async () => {
      // 4.5:1 no texto e no placeholder, 3:1 na borda, no claro e no escuro. O
      // axe do test-runner só mede a tela, e a tela está sempre no claro.
      const medidas = contrastesNosDoisModos(canvasElement);
      await expect(medidas).not.toBeNull();
      await expect(medidas!.length).toBe(2);
      for (const m of medidas!) {
        await expect(m.texto ?? 0).toBeGreaterThanOrEqual(4.5);
        await expect(m.placeholder ?? 0).toBeGreaterThanOrEqual(4.5);
        await expect(m.borda ?? 0).toBeGreaterThanOrEqual(3);
      }
    });

    await step('Aceita digitação', async () => {
      await userEvent.clear(input);
      await userEvent.type(input, 'Maria Souza');
      await expect(input).toHaveValue('Maria Souza');
      await userEvent.clear(input);
    });
  },
};

/**
 * O anel de foco é o que o Chromatic precisa fotografar, então a play TERMINA
 * com o campo focado — story cujo propósito é um estado visual não pode acabar
 * em outro.
 *
 * Ler o estilo logo após `focus()` devolveria o primeiro quadro da transição
 * (`rgba(0,0,0,0) 0px 0px 0px 0px`), e foi assim que "o campo não tem anel de
 * foco" virou diagnóstico falso nas cinco stacks. `haloDeFoco` congela a
 * transição antes de medir.
 */
export const Focus: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () =>
    campoRotulado({ id: 'estado-foco', rotulo: 'Nome completo', placeholder: 'ex: João da Silva' }),
  play: async ({ canvasElement, step }) => {
    const input = campoDe(canvasElement)!;

    await step('O halo de foco tem 2px e 30% de opacidade', async () => {
      const halo = haloDeFoco(input);
      await expect(halo).not.toBeNull();
      await expect(halo!.espessura).toBe(2);
      await expect(halo!.alfa).toBeCloseTo(0.3, 2);
    });

    await step('A borda de foco difere da borda em repouso', async () => {
      // Sem esta comparação, um foco que não mudasse nada passaria: as duas
      // cores viriam do mesmo token e ninguém veria a diferença na tela.
      const bordas = bordasPorEstado(input);
      await expect(bordas.foco.cor).not.toBe(bordas.repouso.cor);
      await expect(bordas.foco.casaFocusVisible).toBe(true);
    });

    await step('O hover é opaco, e não some sob o ponteiro', async () => {
      // O hover translúcido de antes APAGAVA a borda depois que o repouso
      // escureceu para 3:1. A declaração da folha é lida porque evento
      // sintético não acende `:hover`.
      const bordas = bordasPorEstado(input);
      await expect(bordas.hover.declarado).toBeTruthy();
      await expect(bordas.hover.declarado).not.toMatch(/\/\s*0?\.\d/);
    });

    // O foco fica posto de propósito: é o estado que esta story documenta.
    await userEvent.click(input);
    await expect(input).toHaveFocus();
  },
};

export const WithPlaceholder: Story = {
  parameters: {
    docs: {
      source: {
        transform: inputSourceCom({
          type: 'email',
          id: 'email',
          label: 'Email',
          placeholder: 'ex: joao@empresa.com',
        }),
      },
    },
  },
  render: () =>
    campoRotulado({ id: 'estado-placeholder', rotulo: 'Email', type: 'email', placeholder: 'ex: joao@empresa.com' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Email');

    await step('Placeholder configurado', async () => {
      await expect(input).toHaveAttribute('placeholder', 'ex: joao@empresa.com');
    });

    await step('Placeholder desaparece ao digitar', async () => {
      await userEvent.clear(input);
      await userEvent.type(input, 'joao@empresa.com');
      await expect(input).toHaveValue('joao@empresa.com');
      await userEvent.clear(input);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      source: {
        transform: inputSourceCom({
          disabled: true,
          id: 'bloqueado',
          label: 'Campo desabilitado',
          placeholder: 'Não disponível',
        }),
      },
    },
  },
  render: () =>
    campoRotulado({ id: 'estado-disabled', rotulo: 'Campo desabilitado', placeholder: 'Não disponível', disabled: true }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Campo desabilitado');

    await step('O campo está desabilitado e não aceita digitação', async () => {
      await expect(input).toBeDisabled();
      await userEvent.type(input, 'teste', { pointerEventsCheck: 0 });
      await expect(input).toHaveValue('');
    });

    await step('O apagamento é visível: opacidade e cursor de bloqueio', async () => {
      // A documentação afirmava `bg-input/50` — nome de utilitário morto. O que
      // existe é opacidade 0.5 e fundo em --muted; medir foi o que revelou.
      const cs = getComputedStyle(campoDe(canvasElement)!);
      await expect(Number(cs.opacity)).toBeLessThan(1);
      await expect(cs.cursor).toBe('not-allowed');
    });

    await step('Desabilitado não ganha halo de foco', async () => {
      await expect(haloDeFoco(campoDe(canvasElement)!)).toBeNull();
    });
  },
};

export const Error: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item3', 'accessibility.item4'],
    // O erro não é opção da fábrica: são dois atributos e uma mensagem com id
    // próprio. Sem override o painel esconderia justamente o assunto da story.
    docs: {
      source: {
        transform: inputSourceCom({
          type: 'email',
          id: 'email',
          label: 'Email',
          placeholder: 'ex: joao@empresa.com',
          ariaInvalid: true,
          mensagem: 'Email inválido. Use o formato nome@dominio.com',
        }),
      },
    },
  },
  render: () =>
    campoRotulado({
      id: 'estado-erro',
      rotulo: 'Email',
      type: 'email',
      placeholder: 'ex: joao@empresa.com',
      invalido: true,
      mensagem: 'Email inválido. Use o formato nome@dominio.com',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Email');

    await step('O erro é anunciado por ARIA, não só por cor', async () => {
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('A mensagem de erro está visível', async () => {
      await expect(canvas.getByText(/Email inválido/)).toBeVisible();
    });

    await step('aria-describedby aponta para um alvo que existe', async () => {
      // Um describedby apontando para id inexistente passa em checagem de
      // atributo e não é lido por ninguém.
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      await expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        await expect(canvasElement.ownerDocument.getElementById(id)).not.toBeNull();
      }
    });

    await step('A borda é a cor destrutiva, e o halo de foco também', async () => {
      // Afirmar o token resolvido, não um rgb literal: a paleta muda por tema
      // de marca e um literal reprovaria em warm e cold sem defeito nenhum.
      const destrutivo = corDoToken(canvasElement, '--destructive');
      const bordas = bordasPorEstado(campoDe(canvasElement)!);
      await expect(bordas.repouso.cor).toBe(destrutivo);
      await expect(haloDeFoco(campoDe(canvasElement)!)!.cor).toContain(
        destrutivo!.replace(/rgba?\(|\)/g, '').split(',').slice(0, 3).map((n) => n.trim()).join(', '),
      );
    });
  },
};

/**
 * Fecha `visual.item5`. O escuro é metade do produto e o axe do test-runner
 * nunca o vê — a tela está sempre no tema claro.
 */
export const DarkPalette: Story = {
  parameters: {
    covers: ['visual.item5'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
    // O campo é o mesmo dos demais estados; o que muda é a classe de tema no
    // documento. É isso que o snippet precisa mostrar, e não um quarto campo.
    docs: { source: { transform: inputSourceCom({ temaEscuro: true }) } },
  },
  render: () => {
    const raiz = document.createElement('div');
    raiz.className = 'nds-stack nds-w-xs';
    raiz.dataset.spacing = 'md';
    raiz.append(
      campoRotulado({ id: 'dk-padrao', rotulo: 'Padrão', placeholder: 'ex: João da Silva' }),
      campoRotulado({ id: 'dk-erro', rotulo: 'Com erro', type: 'email', invalido: true, mensagem: 'Email inválido' }),
      campoRotulado({ id: 'dk-off', rotulo: 'Desabilitado', placeholder: 'Não disponível', disabled: true }),
    );
    return raiz;
  },
  play: async ({ canvasElement, step }) => {
    await step('A paleta escura está aplicada no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('O campo é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const cs = getComputedStyle(canvasElement.querySelector<HTMLElement>('#dk-padrao')!);
      const brilho = (cor: string) => {
        const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });

    await step('Os três estados continuam distinguíveis no escuro', async () => {
      const erro = canvasElement.querySelector<HTMLInputElement>('#dk-erro')!;
      const padrao = canvasElement.querySelector<HTMLInputElement>('#dk-padrao')!;
      const off = canvasElement.querySelector<HTMLInputElement>('#dk-off')!;
      await expect(getComputedStyle(erro).borderTopColor).not.toBe(
        getComputedStyle(padrao).borderTopColor,
      );
      await expect(Number(getComputedStyle(off).opacity)).toBeLessThan(1);
    });
  },
};
