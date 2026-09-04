import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, within } from 'storybook/test';
import { resolveColor } from '@shared/testing/cor';
import { contrastesNosDoisModos } from '@shared/testing/form-probe';
import { createFormField, createFieldset } from './form';
import { formSource, formSourceWith } from './form.source';
import { createInput } from './input';

const meta: Meta = {
  title: 'Components/Form/Form/States',
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: formSource } },
  },
};

export default meta;
type Story = StoryObj;

/**
 * O campo com mensagem de erro. Nada aqui interage: o estado é o assunto, e a
 * foto do Chromatic tem que sair com o erro na tela — story de estado visual
 * cuja play termina em OUTRO estado fotografa a coisa errada.
 */
export const Invalid: Story = {
  parameters: {
    covers: [
      'functional.item4',
      'accessibility.item3',
      'accessibility.item5',
      'visual.item3',
    ],
    // Override de story: a mensagem e o `aria-invalid` são o estado inteiro, e o
    // atributo é de quem compõe — a fábrica deliberadamente não o escreve, então
    // um snippet sem ele documentaria um campo que se pinta de erro sem se
    // anunciar como inválido.
    docs: {
      source: {
        transform: formSourceWith({
          label: 'Senha',
          inputType: 'password',
          value: '123',
          description: 'Use pelo menos 8 caracteres, com letras e números.',
          error: 'A senha precisa ter pelo menos 8 caracteres.',
          ariaInvalid: true,
        }),
      },
    },
  },
  render: () => {
    const input = createInput({ type: 'password', value: '123' });
    // `aria-invalid` é de quem compõe — é o que a documentação afirma e o que a
    // factory deliberadamente não escreve.
    input.setAttribute('aria-invalid', 'true');
    return createFormField({
      label: 'Senha',
      input,
      description: 'Use pelo menos 8 caracteres, com letras e números.',
      error: 'A senha precisa ter pelo menos 8 caracteres.',
      class: 'nds-max-w-sm',
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvasElement.querySelector<HTMLElement>('[data-slot="field"]')!;
    const control = canvas.getByLabelText('Senha');
    const label = field.querySelector<HTMLLabelElement>('label')!;
    const mensagem = field.querySelector<HTMLElement>('[data-slot="field-error"]')!;

    await step('A mensagem é anunciada sem roubar o foco', async () => {
      // `polite` e não `assertive`: em validação a cada tecla, interromper a
      // digitação a cada caractere é pior que esperar a pausa.
      await expect(mensagem).toHaveAttribute('aria-live', 'polite');
    });

    await step('A mensagem está em --destructive, e não numa cor qualquer', async () => {
      // Comparar com o token RESOLVIDO pelo navegador, não com um rgb literal:
      // o literal quebraria a cada ajuste de paleta e não valeria nos temas de
      // marca. É a metade do item de contrato que ninguém verificava.
      const destrutivo = resolveColor(field, 'hsl(var(--destructive))');
      await expect(getComputedStyle(mensagem).color).toBe(destrutivo);
    });

    await step('O erro chega ao controle e ao rótulo, não só à cor da mensagem', async () => {
      // Vermelho sozinho não alcança quem não enxerga cor. O `aria-describedby`
      // é o que faz o leitor anunciar a mensagem junto com o nome do campo, e o
      // `data-error` é o gancho que o CSS usa para pintar o rótulo.
      await expect(control.getAttribute('aria-describedby')).toContain(mensagem.id);
      await expect(document.getElementById(mensagem.id)).toBe(mensagem);
      await expect(label).toHaveAttribute('data-error', 'true');
      await expect(getComputedStyle(label).color).toBe(resolveColor(field, 'hsl(var(--destructive))'));
    });

    await step('Rótulo, apoio e erro passam de 4.5:1 no claro E no escuro', async () => {
      // O axe do test-runner mede só o que está na tela, e a tela está sempre no
      // tema claro — metade do produto ficava fora enquanto o contrato afirmava
      // "em todos os temas". A classe `.dark` sai no `finally` do colhedor.
      const measurements = contrastesNosDoisModos(field);
      await expect(measurements).toHaveLength(2);
      for (const m of measurements) {
        await expect(m.label).toBeGreaterThanOrEqual(4.5);
        await expect(m.helper).toBeGreaterThanOrEqual(4.5);
        await expect(m.error).toBeGreaterThanOrEqual(4.5);
      }
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item7'],
    // Override de story: o `disabled` vive no CONTROLE, e não no campo — sem
    // isto o snippet mostraria um campo comum onde a story renderiza um campo
    // que não recebe foco.
    docs: {
      source: {
        transform: formSourceWith({
          label: 'CPF',
          inputType: 'text',
          value: '000.000.000-00',
          description: 'Preenchido pelo cadastro da empresa.',
          disabled: true,
        }),
      },
    },
  },
  render: () =>
    createFormField({
      label: 'CPF',
      input: createInput({ type: 'text', value: '000.000.000-00', disabled: true }),
      description: 'Preenchido pelo cadastro da empresa.',
      class: 'nds-max-w-sm',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByLabelText('CPF') as HTMLInputElement;

    await step('O controle não recebe foco nem digitação', async () => {
      // Clique em elemento desabilitado é idempotente por natureza: ele não
      // muda de estado em rodada nenhuma do replay.
      await expect(control).toBeDisabled();
      await userEvent.click(control);
      await expect(control).not.toHaveFocus();
    });

    await step('O rótulo continua visível e associado', async () => {
      // Rótulo escondido em campo desabilitado é o padrão que faz a pessoa
      // perder a referência do que aquele valor significa.
      const label = canvasElement.querySelector<HTMLLabelElement>('label')!;
      await expect(label.offsetParent).not.toBeNull();
      await expect(label.htmlFor).toBe(control.id);
    });

    await step('A descrição segue sendo lida junto com o campo', async () => {
      const descricao = canvasElement.querySelector<HTMLElement>('[data-slot="field-description"]')!;
      await expect(control.getAttribute('aria-describedby')).toContain(descricao.id);
    });
  },
};

/**
 * O tema escuro não é enfeite do Chromatic: a mensagem de erro e o texto de
 * apoio dependem de tokens que trocam de valor entre paletas, e é onde o
 * contraste costuma cair primeiro.
 */
export const DarkPalette: Story = {
  parameters: {
    covers: ['visual.item5'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack nds-max-w-sm';

    root.appendChild(
      createFormField({
        label: 'Nome completo',
        input: createInput({ type: 'text', placeholder: 'ex: João da Silva' }),
      }),
    );

    const email = createInput({ type: 'email', value: 'joao@' });
    email.setAttribute('aria-invalid', 'true');
    root.appendChild(
      createFormField({
        label: 'Email',
        input: email,
        description: 'Usaremos apenas para contato.',
        error: 'Endereço de email incompleto.',
      }),
    );

    root.appendChild(
      createFieldset({
        legend: 'Endereço de entrega',
        children: [
          createFormField({
            label: 'Cidade',
            input: createInput({ type: 'text', value: 'São Paulo', disabled: true }),
          }),
        ],
      }),
    );

    return root;
  },
  play: async ({ canvasElement, step }) => {
    await step('A paleta escura está aplicada no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('O campo é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const field = canvasElement.querySelector<HTMLElement>('input[type="text"]')!;
      const cs = getComputedStyle(field);
      const brilho = (cor: string) => {
        const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });

    await step('A mensagem de erro se distingue do texto de apoio', async () => {
      // Se as duas caíssem na mesma cor, o erro deixaria de ser visível como
      // erro — e nenhum teste de contraste pegaria, porque as duas passariam.
      const descricao = canvasElement.querySelector<HTMLElement>('[data-slot="field-description"]')!;
      const mensagem = canvasElement.querySelector<HTMLElement>('[data-slot="field-error"]')!;
      await expect(getComputedStyle(mensagem).color).not.toBe(getComputedStyle(descricao).color);
    });
  },
};
