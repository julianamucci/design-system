import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import {
  stateBorders,
  fieldOf,
  contrastesNosDoisModos,
  corDoToken,
  focusHalo,
} from '@shared/testing/input-probe';
import InputStory from './InputStory.svelte';
import InputWithLabelStory from './InputWithLabelStory.svelte';
import InputDarkPaletteStory from './InputDarkPaletteStory.svelte';
import {
  inputWithErrorSource,
  inputWithPlaceholderSource,
  inputDisabledSource,
  inputPaletteDarkSource,
  inputSource,
} from './input.source';

const meta: Meta = {
  title: 'UI/Input/States',
  component: InputStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo. Padrão e Foco compartilham
      // a marcação canônica: o foco é estado, não muda uma linha do snippet.
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

export const Default: Story = {
  // O contraste é medido AQUI, na story clara, porque `contrastesNosDoisModos`
  // liga o escuro e desliga: numa story que já nasce escura os dois lados da
  // medição sairiam escuros e o item ficaria meio verificado.
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    Component: InputWithLabelStory,
    props: { labelText: 'Nome completo', id: 'estado-padrao', type: 'text', placeholder: 'ex: João da Silva' },
  }),
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
      const fundo = getComputedStyle(fieldOf(canvasElement)!).backgroundColor;
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
 * foco" virou diagnóstico falso nas cinco stacks. `focusHalo` congela a
 * transição antes de medir.
 */
export const Focus: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () => ({
    Component: InputWithLabelStory,
    props: { labelText: 'Nome completo', id: 'estado-foco', type: 'text', placeholder: 'ex: João da Silva' },
  }),
  play: async ({ canvasElement, step }) => {
    const input = fieldOf(canvasElement)!;

    await step('O halo de foco tem 2px e 30% de opacidade', async () => {
      const halo = focusHalo(input);
      await expect(halo).not.toBeNull();
      await expect(halo!.espessura).toBe(2);
      await expect(halo!.alfa).toBeCloseTo(0.3, 2);
    });

    await step('A borda de foco difere da borda em repouso', async () => {
      // Sem esta comparação, um foco que não mudasse nada passaria: as duas
      // cores viriam do mesmo token e ninguém veria a diferença na tela.
      const bordas = stateBorders(input);
      await expect(bordas.foco.cor).not.toBe(bordas.repouso.cor);
      await expect(bordas.foco.casaFocusVisible).toBe(true);
    });

    await step('O hover é opaco, e não some sob o ponteiro', async () => {
      // O hover translúcido de antes APAGAVA a borda depois que o repouso
      // escureceu para 3:1. A declaração da folha é lida porque evento
      // sintético não acende `:hover`.
      const bordas = stateBorders(input);
      await expect(bordas.hover.declarado).toBeTruthy();
      await expect(bordas.hover.declarado).not.toMatch(/\/\s*0?\.\d/);
    });

    // O foco fica posto de propósito: é o estado que esta story documenta.
    await userEvent.click(input);
    await expect(input).toHaveFocus();
  },
};

export const WithPlaceholder: Story = {
  parameters: { docs: { source: { transform: inputWithPlaceholderSource } } },
  render: () => ({
    Component: InputWithLabelStory,
    props: { labelText: 'Email', id: 'estado-placeholder', type: 'email', placeholder: 'ex: joao@empresa.com' },
  }),
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
    docs: { source: { transform: inputDisabledSource } },
  },
  render: () => ({
    Component: InputWithLabelStory,
    props: { labelText: 'Campo desabilitado', id: 'estado-disabled', type: 'text', placeholder: 'Não disponível', disabled: true },
  }),
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
      const cs = getComputedStyle(fieldOf(canvasElement)!);
      await expect(Number(cs.opacity)).toBeLessThan(1);
      await expect(cs.cursor).toBe('not-allowed');
    });

    await step('Desabilitado não ganha halo de foco', async () => {
      await expect(focusHalo(fieldOf(canvasElement)!)).toBeNull();
    });
  },
};

export const Error: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item3', 'accessibility.item4'],
    docs: { source: { transform: inputWithErrorSource } },
  },
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Email',
      id: 'estado-erro',
      type: 'email',
      placeholder: 'ex: joao@empresa.com',
      'aria-invalid': 'true',
      errorMessage: 'Email inválido. Use o formato nome@dominio.com',
    },
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
      const bordas = stateBorders(fieldOf(canvasElement)!);
      await expect(bordas.repouso.cor).toBe(destrutivo);
      await expect(focusHalo(fieldOf(canvasElement)!)!.cor).toContain(
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
    docs: { source: { transform: inputPaletteDarkSource } },
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  render: () => ({ Component: InputDarkPaletteStory, props: {} }),
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
