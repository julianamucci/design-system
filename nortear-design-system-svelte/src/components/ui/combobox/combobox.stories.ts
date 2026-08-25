import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import ComboboxStory from './ComboboxStory.svelte';
import ComboboxDocs from '@/components/docs/ComboboxDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { comboboxMultipleSource, comboboxSource } from './combobox.source';
import type { ComboboxOption } from './index';

// ─── Dados fixos ──────────────────────────────────────────────────────────────
//
// Os mesmos rótulos que a spec de exemplos fechou, e que as outras quatro
// stacks repetem. Divergir aqui é o que faz a mesma story mostrar coisas
// diferentes em cada stack — e isso só aparece tarde, na comparação final.

const COUNTRIES: ComboboxOption[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'colombia', label: 'Colômbia' },
	{ value: 'mexico', label: 'México' },
	{ value: 'peru', label: 'Peru' },
	{ value: 'portugal', label: 'Portugal' },
	{ value: 'espanha', label: 'Espanha' },
	{ value: 'uruguai', label: 'Uruguai' },
];

// ─── Contraste ────────────────────────────────────────────────────────────────
//
// O axe não mede o chip contra a superfície do CAMPO: ele compara com o fundo
// que herda. E o chip pinta sobre `--input-background`, não sobre a página —
// medir contra a página superestima e deixa passar um par que na tela não
// alcança.

function luminance(color: string): number {
	const channels = (color.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
	const [r, g, b] = channels.map((channel) => {
		const scaled = channel / 255;
		return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string): number {
	const a = luminance(first);
	const b = luminance(second);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
	title: 'UI/Combobox',
	tags: ['autodocs', 'form'],
	parameters: {
		layout: 'padded',
		docs: {
			page: withAutoDocsTab(ComboboxDocs),
			source: { transform: comboboxSource },
			description: {
				component:
					'Campo de texto que filtra uma lista e permite escolher um ou vários valores. No modo múltiplo os escolhidos viram chips dentro do próprio campo.',
			},
		},
	},
	// Com o docgen desligado nesta stack, `argTypes` é a ÚNICA fonte da aba API
	// Reference: prop que não estiver aqui não existe para quem lê.
	argTypes: {
		label: {
			control: 'text',
			description: 'Rótulo visível do campo.',
			table: { type: { summary: 'string' } },
		},
		placeholder: {
			control: 'text',
			description: 'Dica exibida no campo de texto enquanto nada foi digitado.',
			table: { type: { summary: 'string' } },
		},
		multiple: {
			control: 'boolean',
			description: 'Modo múltiplo: os escolhidos viram chips dentro do campo.',
			table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
		},
		chipsLayout: {
			control: 'inline-radio',
			options: ['wrap', 'single-line'],
			description:
				'Como os chips ocupam o campo: em linhas que se acumulam ou numa linha só que rola na horizontal. Limpar e abrir ficam na primeira linha nos dois casos.',
			table: {
				type: { summary: "'wrap' | 'single-line'" },
				defaultValue: { summary: "'wrap'" },
			},
		},
		disabled: {
			control: 'boolean',
			description: 'Torna o campo indisponível e impede a abertura da lista.',
			table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
		},
		invalid: {
			control: 'boolean',
			description: 'Marca o campo como reprovado pela validação.',
			table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
		},
		name: {
			control: 'text',
			description: 'Nome do campo no formulário HTML.',
			table: { type: { summary: 'string' } },
		},
		onValueChange: {
			control: false,
			description: 'Disparado ao trocar a escolha; recebe o valor escolhido.',
			table: { type: { summary: '(value: string | string[]) => void' } },
		},
	},
	args: {
		label: 'País',
		placeholder: 'Buscar país',
		multiple: false,
		chipsLayout: 'wrap',
		disabled: false,
		invalid: false,
		name: 'pais',
		onValueChange: fn(),
	},
};

export default meta;
type Story = StoryObj;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
	parameters: {
		covers: [
			'functional.item1',
			'functional.item3',
			'accessibility.item1',
			'accessibility.item2',
			'accessibility.item3',
			'accessibility.item4',
			'visual.item1',
		],
	},
	render: (args) => ({
		Component: ComboboxStory,
		props: {
			items: COUNTRIES,
			label: args.label,
			placeholder: args.placeholder,
			multiple: args.multiple,
			chipsLayout: args.chipsLayout,
			disabled: args.disabled,
			invalid: args.invalid,
			name: args.name,
			onValueChange: args.onValueChange,
		},
	}),
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		// A lista é portalada: quem a procura dentro do canvas não acha nada.
		const body = within(document.body);
		const field = canvas.getByRole('combobox');
		const spy = args.onValueChange as unknown as ReturnType<typeof fn>;

		await step('O campo é anunciado como combobox fechado', async () => {
			// `role` no INPUT, não num wrapper: é o que faz o leitor de tela
			// anunciar o campo como combobox e ler a opção ativa depois.
			await expect(field.tagName).toBe('INPUT');
			await expect(field).toHaveAttribute('aria-expanded', 'false');
			await expect(field).toHaveAttribute('aria-autocomplete', 'list');
		});

		await step('Digitar abre a lista e filtra', async () => {
			// `clear` e não `click`: o painel Interactions reexecuta a play no MESMO
			// DOM, sem remontar. Na segunda rodada o campo já traz "Brasil" do
			// último passo, e digitar por cima daria "Brasilbra" — filtro vazio,
			// asserção invertida, suíte verde (o vitest remonta) e painel vermelho.
			await userEvent.clear(field);
			await userEvent.type(field, 'bra');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'true');
			});
			await waitFor(async () => {
				const options = body.getAllByRole('option');
				await expect(options).toHaveLength(1);
				await expect(options[0]).toHaveTextContent('Brasil');
			});
		});

		await step('A lista é anunciada como listbox e o campo aponta para ela', async () => {
			// O item de contrato fala dos DOIS papéis; declarar sem medir o segundo
			// deixaria o auditor mentindo com aval. `aria-controls` apontando um id
			// que não existe não acende nada na tela, então a conta é feita à mão.
			const listbox = body.getByRole('listbox');
			await expect(listbox).toBeVisible();
			await expect(document.getElementById(field.getAttribute('aria-controls') ?? '')).toBe(
				listbox,
			);
		});

		await step('A opção ativa é apontada, e não focada', async () => {
			// Sem esta medida, mover o foco para a opção passaria — e a digitação
			// pararia de funcionar, que é o defeito clássico do padrão.
			await waitFor(async () => {
				const active = body.getAllByRole('option')[0];
				await expect(field).toHaveAttribute('aria-activedescendant', active.id);
			});
			await expect(field).toHaveFocus();
		});

		await step('Enter escolhe a opção ativa', async () => {
			spy.mockClear();
			await userEvent.keyboard('{Enter}');
			// Modo simples entrega TEXTO, não lista: é a forma do valor nesta stack.
			await expect(spy).toHaveBeenCalledWith('brasil');
			await waitFor(async () => {
				await expect(field).toHaveValue('Brasil');
				await expect(field).toHaveAttribute('aria-expanded', 'false');
			});
		});
	},
};

// ─── Múltiplo com chips ───────────────────────────────────────────────────────

export const MultipleWithChips: Story = {
	parameters: {
		covers: [
			'functional.item4',
			'functional.item5',
			'functional.item6',
			'accessibility.item5',
			'accessibility.item6',
			'visual.item2',
		],
		// A story mexe na lista aberta antes de fechar; ver o motivo do guarda de
		// foco em `wait-for-portal`.
		a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
		docs: {
			source: { transform: comboboxMultipleSource },
			description: {
				story:
					'Modo múltiplo: cada escolhido vira um chip dentro do campo. Backspace com o texto vazio remove o último.',
			},
		},
	},
	args: {
		label: 'Países',
		placeholder: 'Adicionar país',
		multiple: true,
		name: 'paises',
	},
	render: (args) => ({
		Component: ComboboxStory,
		props: {
			items: COUNTRIES,
			label: args.label,
			placeholder: args.placeholder,
			// `multiple` fica fixo: é o assunto da story, e um control que a
			// desligasse deixaria a story sem o que demonstrar.
			multiple: true,
			// A story do modo múltiplo é onde o modo de chips tem efeito visível:
			// no simples não há chip para quebrar linha nem para rolar.
			chipsLayout: args.chipsLayout,
			disabled: args.disabled,
			invalid: args.invalid,
			name: args.name,
			value: ['brasil', 'argentina'],
			onValueChange: args.onValueChange,
		},
	}),
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		const field = canvas.getByRole('combobox') as HTMLInputElement;
		const spy = args.onValueChange as unknown as ReturnType<typeof fn>;
		const chips = () => canvasElement.querySelectorAll('[data-slot="combobox-chip"]');

		const chooseByKeyboard = async (text: string) => {
			await userEvent.clear(field);
			await userEvent.type(field, text);
			await waitFor(async () => {
				await expect(within(document.body).getAllByRole('option').length).toBeGreaterThan(0);
			});
			await userEvent.keyboard('{Enter}');
		};

		await step('Os escolhidos iniciais aparecem como chips', async () => {
			await waitFor(async () => {
				await expect(chips()).toHaveLength(2);
			});
			await expect(chips()[0]).toHaveTextContent('Brasil');
			await expect(chips()[1]).toHaveTextContent('Argentina');
		});

		await step('Cada botão de remover tem nome próprio', async () => {
			// Cinco botões chamados "Remover" são indistinguíveis para quem navega
			// por lista de controles — o rótulo entra no nome.
			await expect(canvas.getByRole('button', { name: 'Remover Brasil' })).toBeVisible();
			await expect(canvas.getByRole('button', { name: 'Remover Argentina' })).toBeVisible();
		});

		await step('Backspace com o texto vazio remove o último chip', async () => {
			// É o gesto que define o chip: sem ele, desfazer exige o mouse.
			spy.mockClear();
			await userEvent.clear(field);
			field.focus();
			await userEvent.keyboard('{Backspace}');
			await expect(spy).toHaveBeenCalledWith(['brasil']);
			await waitFor(async () => {
				await expect(chips()).toHaveLength(1);
			});
		});

		await step('O botão de remover do chip funciona pelo clique', async () => {
			// O passo anterior cobriu o Backspace, que é outro gesto para o mesmo
			// fim; este cobre o botão, e prova que o foco fica no campo.
			spy.mockClear();
			await userEvent.click(canvas.getByRole('button', { name: 'Remover Brasil' }));
			await expect(spy).toHaveBeenCalledWith([]);
			await waitFor(async () => {
				await expect(chips()).toHaveLength(0);
			});
			await expect(field).toHaveFocus();
		});

		await step('O texto do chip alcança 4.5:1 contra a superfície do campo', async () => {
			await chooseByKeyboard('brasil');
			const chip = (await waitFor(() => {
				const first = chips()[0] as HTMLElement | undefined;
				if (!first) throw new Error('chip ainda não montou');
				return first;
			})) as HTMLElement;
			const wrapper = canvasElement.querySelector<HTMLElement>(
				'[data-slot="combobox-input-wrapper"]',
			)!;
			const ratio = contrast(
				getComputedStyle(chip).color,
				getComputedStyle(wrapper).backgroundColor,
			);
			await expect(ratio).toBeGreaterThanOrEqual(4.5);
		});

		await step('Escolher pelo teclado devolve o segundo chip', async () => {
			// Devolve a story ao estado que o Chromatic fotografa, e prova a ida e a
			// volta na mesma rodada.
			await chooseByKeyboard('argentina');
			await waitFor(async () => {
				await expect(chips()).toHaveLength(2);
			});
			// Escolher no múltiplo limpa a busca: manter o filtro esconderia as
			// opções restantes atrás de um texto que ninguém digitou.
			await expect(field).toHaveValue('');
		});

		await step('Escape fecha a lista sem alterar a escolha', async () => {
			await userEvent.keyboard('{Escape}');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'false');
			});
			await expect(chips()).toHaveLength(2);
		});
	},
};
