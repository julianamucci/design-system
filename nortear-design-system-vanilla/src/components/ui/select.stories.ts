import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createSelect } from './select';
import { createSelectDocs } from '@/components/docs/SelectDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { medirAnelDeFoco, ESTADOS } from '@shared/testing/select-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SelectArgs = {
  name: string;
  placeholder: string;
  disabled: boolean;
  labelText: string;
};

const meta: Meta<SelectArgs> = {
  title: 'UI/Select',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createSelectDocs) },
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
      table: { type: { summary: 'string' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto exibido quando nenhuma opção está selecionada.',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo inteiro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    labelText: {
      control: 'text',
      description: 'Texto do rótulo associado por `for`/`id` — obrigatório para acessibilidade.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    name: 'estado',
    placeholder: 'Selecione...',
    disabled: false,
    labelText: 'Estado',
  },
};

export default meta;
type Story = StoryObj<SelectArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2', 'accessibility.item3'],
    // Esta stack entrega o campo pelo `<select>` do próprio navegador. O que
    // desaparece com isso não é cobertura de teste: é DOM. A lista aberta é
    // desenhada pelo sistema operacional, fora do documento — nenhuma API de
    // teste a alcança, e nenhum atributo ARIA a descreve.
    coversNotApplicable: {
      'functional.item1':
        'a lista aberta é o popup nativo do navegador, desenhado fora do documento — não há elemento para observar depois do clique',
      'functional.item2':
        'a escolha por teclado acontece dentro do popup nativo, que o teste não alcança; o que o DOM expõe é o valor final, provado no passo de troca de valor',
      'functional.item3':
        'Escape é tratado pelo popup nativo do navegador, fora do documento',
      'accessibility.item4':
        'o campo expõe role=combobox, mas não existe elemento de lista no documento para receber role=listbox — o popup é do navegador',
      'accessibility.item5':
        'o `<select>` nativo não expõe aria-expanded; quem anuncia aberto/fechado ao leitor de tela é o próprio navegador',
      'functional.item4':
        'a busca por digitação do campo nativo é do navegador, não da página: medido que a tecla enviada pelo teste não altera o valor com a lista fechada, e a lista aberta é o popup do sistema — não há caminho de teste até ela',
    },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '20rem';

    const label = document.createElement('label');
    label.htmlFor = 'sel-pg';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = args.labelText;

    const select = createSelect({
      placeholder: args.placeholder,
      disabled: args.disabled,
      items: [...ESTADOS],
    });
    select.id = 'sel-pg';
    select.name = args.name;

    wrap.append(label, select);
    return wrap;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox') as HTMLSelectElement;

    await step('O campo é um combobox nomeado pelo rótulo externo', async () => {
      await expect(select).toHaveAccessibleName(args.labelText);
      await expect(select.name).toBe(args.name);
    });

    if (args.disabled) {
      await step('Desabilitado — o campo não recebe foco nem valor', async () => {
        await expect(select).toBeDisabled();
      });
      return;
    }

    await step('Placeholder visível e nenhum valor escolhido', async () => {
      // O placeholder é uma opção escondida e bloqueada: aparece no campo
      // fechado e não pode ser escolhida de volta.
      const placeholder = select.querySelector('option[value=""]') as HTMLOptionElement;
      await expect(placeholder.textContent).toBe(args.placeholder);
      await expect(placeholder.disabled).toBe(true);
      await expect(placeholder.hidden).toBe(true);
    });

    await step('Trocar a opção atualiza o valor e o rótulo exibido', async () => {
      // Idempotente: escolher sempre a mesma opção deixa o mesmo estado, então
      // o replay do painel Interactions parte de onde a primeira rodada parou.
      await userEvent.selectOptions(select, 'rj');
      await expect(select.value).toBe('rj');
      await expect(select.selectedOptions[0].textContent).toBe('Rio de Janeiro');
    });

    await step('O campo tem anel de foco por teclado', async () => {
      // `outline: 0` na folha é intencional — o anel é `box-shadow`. Medir a
      // MUDANÇA, e não `boxShadow !== 'none'`, é o que distingue anel de foco
      // de anel de erro, que já existe sem foco.
      await expect(medirAnelDeFoco(select).mudou).toBe(true);
    });
  },
};
