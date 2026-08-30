import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import {
  stateBorders,
  fieldOf,
  contrastesNosDoisModos,
  tokenColor,
  focusHalo,
} from '@shared/testing/input-probe';
import { NdsInput } from './input';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/Input/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsInput, NdsLabel] })],
  parameters: { layout: 'padded', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  // O contraste é medido AQUI, na story clara, porque `contrastesNosDoisModos`
  // liga o escuro e desliga: numa story que já nasce escura os dois lados da
  // medição sairiam escuros e o item ficaria meio verificado. Era declarado na
  // Playground como "coberto pelo axe", que nunca olhou o escuro.
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="est-padrao">Nome completo</label>
        <input ndsInput id="est-padrao" type="text" placeholder="ex: João da Silva" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O fundo do campo é opaco, não transparente', async () => {
      // A documentação afirmou "fundo transparente" por meses. O campo pinta
      // --background: medir é o que separa a afirmação do que se vê.
      const background = getComputedStyle(fieldOf(canvasElement)!).backgroundColor;
      await expect(background).not.toBe('rgba(0, 0, 0, 0)');
      await expect(background).not.toBe('transparent');
    });

    await step('Contraste nos DOIS modos (accessibility.item5)', async () => {
      const measurements = contrastesNosDoisModos(canvasElement);
      await expect(measurements).not.toBeNull();
      await expect(measurements!.length).toBe(2);
      for (const m of measurements!) {
        await expect(m.text ?? 0).toBeGreaterThanOrEqual(4.5);
        await expect(m.placeholder ?? 0).toBeGreaterThanOrEqual(4.5);
        await expect(m.border ?? 0).toBeGreaterThanOrEqual(3);
      }
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
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="est-foco">Nome completo</label>
        <input ndsInput id="est-foco" type="text" placeholder="ex: João da Silva" />
      </div>
    `,
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
      const borders = stateBorders(input);
      await expect(borders.focus.cor).not.toBe(borders.rest.cor);
      await expect(borders.focus.casaFocusVisible).toBe(true);
    });

    await step('O hover é opaco, e não some sob o ponteiro', async () => {
      // O hover translúcido de antes APAGAVA a borda depois que o repouso
      // escureceu para 3:1. A declaração da folha é lida porque evento
      // sintético não acende `:hover`.
      const borders = stateBorders(input);
      await expect(borders.hover.declarado).toBeTruthy();
      await expect(borders.hover.declarado).not.toMatch(/\/\s*0?\.\d/);
    });

    // O foco fica posto de propósito: é o estado que esta story documenta.
    await userEvent.click(input);
    await expect(input).toHaveFocus();
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm" data-disabled="true">
        <label ndsLabel for="est-disabled">CPF</label>
        <input ndsInput id="est-disabled" type="text" disabled value="000.000.000-00" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O campo não recebe foco nem digitação', async () => {
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      await expect(input).toBeDisabled();
      await userEvent.click(input);
      await expect(input).not.toHaveFocus();
    });

    await step('O rótulo acompanha o estado do grupo', async () => {
      // O `.nds-label` reage a um ancestral com data-disabled. Medir a opacidade
      // é o que prova que a cascata chegou — o atributo sozinho não pinta nada.
      const label = canvasElement.querySelector<HTMLLabelElement>('label.nds-label')!;
      await expect(Number(getComputedStyle(label).opacity)).toBeLessThan(1);
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

export const Invalid: Story = {
  // `visual.item2` saiu daqui: o item pede a foto do trio foco/desabilitado/
  // erro, e o foco não aparecia em captura nenhuma. Passou para `Focus`, que é
  // a story que termina com o anel na tela.
  parameters: {
    covers: ['functional.item4', 'accessibility.item3', 'accessibility.item4'],
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="est-invalid">Email profissional</label>
        <input
          ndsInput
          id="est-invalid"
          type="email"
          value="joao@"
          aria-invalid="true"
          aria-describedby="est-invalid-msg est-invalid-dica"
        />
        <p id="est-invalid-dica" class="nds-text-caption nds-text-muted-foreground">
          Use o email da empresa.
        </p>
        <p id="est-invalid-msg" class="nds-text-caption nds-text-destructive">
          Endereço de email incompleto.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O erro é anunciado por ARIA, não só por cor', async () => {
      // Borda vermelha sozinha não chega a quem não enxerga cor. `aria-invalid`
      // é o que o leitor de tela anuncia junto com o nome do campo.
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para a dica E para o erro', async () => {
      // Os dois textos precisam ser lidos. Um `aria-describedby` que só cita a
      // mensagem de erro descarta a instrução original.
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      await expect(ids.length).toBe(2);
      for (const id of ids) {
        await expect(canvasElement.querySelector(`#${id}`)).toBeTruthy();
      }
    });

    await step('A borda é a cor destrutiva, e o halo de foco também', async () => {
      // Afirmar o token resolvido, não um rgb literal: a paleta muda por tema
      // de marca e um literal reprovaria em warm e cold sem defeito nenhum.
      const destrutivo = tokenColor(canvasElement, '--destructive');
      const borders = stateBorders(fieldOf(canvasElement)!);
      await expect(borders.rest.cor).toBe(destrutivo);
      await expect(focusHalo(fieldOf(canvasElement)!)!.cor).toContain(
        destrutivo!.replace(/rgba?\(|\)/g, '').split(',').slice(0, 3).map((n) => n.trim()).join(', '),
      );
    });
  },
};

export const Types: Story = {
  // `functional.item6` (digitar) e `accessibility.item2` (rótulo alcança o
  // campo) migraram para a Playground, que já os verifica; `visual.item3` foi
  // para a story `Search`, criada nas cinco stacks nesta rodada. Aqui fica o
  // que só esta story prova: o `type` de cada campo, incluindo o `file`.
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    props: {
      tipos: [
        { id: 'tipo-email',    type: 'email',    label: 'Email',    ph: 'ex: joao@empresa.com' },
        { id: 'tipo-password', type: 'password', label: 'Senha',    ph: '' },
        { id: 'tipo-search',   type: 'search',   label: 'Buscar',   ph: 'Buscar produtos' },
        { id: 'tipo-file',     type: 'file',     label: 'Anexo',    ph: '' },
      ],
    },
    template: `
      <div class="nds-grid nds-w-full" data-spacing="lg" style="--grid-min: 14rem">
        @for (t of tipos; track t.id) {
          <div class="nds-stack" data-spacing="sm">
            <label ndsLabel [for]="t.id">{{ t.label }}</label>
            <input ndsInput [id]="t.id" [type]="t.type" [placeholder]="t.ph" />
          </div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada campo tem o type que declarou', async () => {
      // O type muda o teclado do dispositivo e a validação do browser; é o que
      // a seção Variantes documenta e nada no visual denuncia se estiver errado.
      const inputs = [...canvasElement.querySelectorAll<HTMLInputElement>('[data-slot="input"]')];
      await expect(inputs.map((i) => i.type)).toEqual(['email', 'password', 'search', 'file']);
    });

    await step('Todos os campos são alcançáveis pelo rótulo', async () => {
      for (const name of ['Email', 'Senha', 'Buscar', 'Anexo']) {
        await expect(canvas.getByLabelText(name)).toBeTruthy();
      }
    });

    await step('O botão nativo do type=file recebe estilo próprio', async () => {
      // `::file-selector-button` é a única parte do campo que o navegador
      // desenha sozinho; sem a regra do design system ele sai com o cinza do
      // sistema operacional e o exemplo mente sobre o resultado.
      const arquivo = canvasElement.querySelector<HTMLInputElement>('#tipo-file')!;
      const button = getComputedStyle(arquivo, '::file-selector-button');
      await expect(button.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      await expect(parseFloat(button.borderTopLeftRadius)).toBeGreaterThan(0);
    });
  },
};

/**
 * `type="search"` estava dentro da grade de Types e não tinha captura própria
 * em stack nenhuma. Fecha `visual.item3` nas cinco.
 */
export const Search: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="tipo-search">Buscar</label>
        <input ndsInput id="tipo-search" type="search" placeholder="Buscar componentes..." />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O campo de busca é anunciado como busca, não como texto', async () => {
      // `type="search"` muda o papel implícito para searchbox — é o que o
      // leitor de tela anuncia, e nada no visual denuncia se estiver errado.
      const input = canvas.getByRole('searchbox', { name: 'Buscar' });
      await expect(input).toHaveAttribute('type', 'search');
    });

    await step('Aceita digitação', async () => {
      const input = canvas.getByRole('searchbox', { name: 'Buscar' }) as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, 'Button');
      await expect(input.value).toBe('Button');
      await userEvent.clear(input);
    });
  },
};

/**
 * Fecha `visual.item5`. O tema escuro não é um enfeite do Chromatic: os estados
 * de erro e desabilitado dependem de tokens que trocam de valor entre paletas,
 * e é onde o contraste costuma cair primeiro.
 */
export const DarkPalette: Story = {
  parameters: {
    covers: ['visual.item5'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="dk-padrao">Padrão</label>
          <input ndsInput id="dk-padrao" type="text" placeholder="Digite" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="dk-erro">Com erro</label>
          <input ndsInput id="dk-erro" type="email" aria-invalid="true" aria-describedby="dk-erro-msg" />
          <p id="dk-erro-msg" class="nds-text-caption nds-text-destructive">E-mail inválido</p>
        </div>
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="dk-off">Desabilitado</label>
          <input ndsInput id="dk-off" type="text" disabled value="Bloqueado" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A paleta escura está aplicada no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('O campo é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const field = canvasElement.querySelector<HTMLElement>('#dk-padrao')!;
      const cs = getComputedStyle(field);
      const brilho = (cor: string) => {
        const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });
  },
};
