import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import ComboboxStory from './ComboboxStory.svelte';
import ComboboxDocs from '@/components/docs/ComboboxDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { comboboxSource } from './combobox.source';
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
