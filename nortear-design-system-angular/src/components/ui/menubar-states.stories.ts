import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_MENUBAR } from './menubar';
import { waitForPortal, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

const MENUS_FECHADOS = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'] as const;

const ITENS_COM_BLOQUEIO = [
  { label: 'Novo', disabled: false },
  { label: 'Salvar', disabled: false },
  { label: 'Enviar para revisão', disabled: true },
] as const;

const meta: Meta = {
  title: 'UI/Menubar/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_MENUBAR] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Os quatro estados que o conteúdo compartilhado descreve: barra fechada, menu aberto, ' +
          'item bloqueado e item marcado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Closed ───────────────────────────────────────────────────────────────────
//
// A única story que termina sem nada portalizado — e por isso a única em que o
// axe roda com TODAS as regras, inclusive a das âncoras de foco que o resto da
// família precisa desligar. É aqui que "sem violações no estado padrão" vale.

export const Closed: Story = {
  parameters: { covers: ['accessibility.item1', 'accessibility.item2', 'visual.item1'] },
  render: () => ({
    props: { menus: MENUS_FECHADOS },
    template: `
      <nds-menubar>
        @for (m of menus; track m) {
          <nds-menubar-menu>
            <button ndsMenubarTrigger>{{ m }}</button>
            <ng-template ndsMenubarContent>
              <div ndsMenubarItem>{{ m }} — primeira ação</div>
              <div ndsMenubarItem>{{ m }} — segunda ação</div>
            </ng-template>
          </nds-menubar-menu>
        }
      </nds-menubar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const gatilhos = within(barra).getAllByRole('menuitem');

    await step('A barra publica o papel e a orientação', async () => {
      await expect(barra.getAttribute('data-slot')).toBe('menubar');
      await expect(barra.getAttribute('aria-orientation')).toBe('horizontal');
      await expect(gatilhos).toHaveLength(MENUS_FECHADOS.length);
    });

    await step('Fechado é ausência: nenhum painel existe no DOM', async () => {
      for (const gatilho of gatilhos) {
        await expect(gatilho.getAttribute('data-state')).toBe('closed');
        await expect(gatilho.getAttribute('aria-expanded')).toBe('false');
      }
      // Portal desmontado, não escondido: um painel só oculto continuaria
      // sendo lido por leitor de tela e encontrável pela busca da página.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(0);
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: {
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    // Sem `functional.item3` aqui: este item do contrato fala de ABRIR por
    // teclado, e esta story nasce aberta por `defaultOpen`, sem interação
    // nenhuma. A declaração era honesta na intenção e vazia no efeito.
    covers: ['accessibility.item4'],
  },
  render: () => ({
    props: { menus: MENUS_FECHADOS },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Arquivo</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>Novo</div>
            <div ndsMenubarItem>Abrir</div>
          </ng-template>
        </nds-menubar-menu>

        <nds-menubar-menu>
          <button ndsMenubarTrigger>Editar</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>Desfazer</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const [arquivo, editar] = within(barra).getAllByRole('menuitem');
    const menu = await waitForPortal('menu');

    await step('O gatilho aberto se distingue dos vizinhos', async () => {
      await expect(arquivo.getAttribute('data-state')).toBe('open');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      await expect(editar.getAttribute('data-state')).toBe('closed');
      // O realce do gatilho aberto é fundo, não só cor de texto: o CSS
      // compartilhado casa por `[data-state="open"]`.
      await expect(getComputedStyle(arquivo).backgroundColor)
        .not.toBe(getComputedStyle(editar).backgroundColor);
    });

    await step('O painel é um menu de verdade, ancorado abaixo do gatilho', async () => {
      await expect(menu.getAttribute('data-slot')).toBe('menubar-content');
      await waitFor(async () => {
        // O positioner mede DEPOIS de o painel entrar no DOM: no primeiro
        // quadro o retângulo ainda é (0,0), e ler daí é corrida.
        const barraRect = barra.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        await expect(menuRect.top).toBeGreaterThanOrEqual(barraRect.bottom - 1);
      });
    });
  },
};

// ─── ItemDisabled ─────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
  },
  argTypes: {
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(onSelect)` ficaria ligado a nada, sem erro nenhum.
    onSelect: { control: false, table: { disable: true } },
  },
  args: { onSelect: fn() },
  render: (args) => ({
    props: { ...args, itens: ITENS_COM_BLOQUEIO },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Arquivo</button>
          <ng-template ndsMenubarContent>
            @for (i of itens; track i.label) {
              <div ndsMenubarItem [disabled]="i.disabled" (onSelect)="onSelect(i.label)">
                {{ i.label }}
              </div>
            }
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step, args }) => {
    const menu = await waitForPortal('menu');
    const itens = within(menu).getAllByRole('menuitem');
    const bloqueado = itens[ITENS_COM_BLOQUEIO.findIndex((i) => i.disabled)];

    await step('O item bloqueado se anuncia como tal', async () => {
      await expect(itens).toHaveLength(ITENS_COM_BLOQUEIO.length);
      await expect(bloqueado.getAttribute('aria-disabled')).toBe('true');
      // `aria-disabled`, e não o atributo `disabled`: o item continua
      // alcançável pela seta, para ser ANUNCIADO como indisponível em vez de
      // sumir sem explicação de quem navega por teclado.
      await expect(bloqueado.hasAttribute('disabled')).toBe(false);
    });

    await step('O bloqueio é visível sem depender de cor', async () => {
      const livre = itens[0];
      await expect(Number(getComputedStyle(bloqueado).opacity))
        .toBeLessThan(Number(getComputedStyle(livre).opacity));
    });

    await step('Escolher o item bloqueado não executa nada', async () => {
      await userEvent.click(bloqueado, { pointerEventsCheck: 0 });
      await expect(args['onSelect']).not.toHaveBeenCalledWith(bloqueado.textContent?.trim());
    });
  },
};

// ─── CheckboxChecked ──────────────────────────────────────────────────────────

export const CheckboxChecked: Story = {
  parameters: {
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    covers: ['functional.item7'],
  },
  render: () => ({
    props: { regua: true, grade: false },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Exibir</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarLabel>Mostrar na tela</div>
            <div
              ndsMenubarCheckboxItem
              [checked]="regua"
              (checkedChange)="regua = $event"
            >Régua</div>
            <div
              ndsMenubarCheckboxItem
              [checked]="grade"
              (checkedChange)="grade = $event"
            >Grade</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const regua = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const grade = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado inicial chega marcado ao markup', async () => {
      // Afirmar o resultado do input é o que impede o defeito silencioso do
      // fallback JIT, em que `[checked]="true"` é ignorado sem erro nenhum.
      await expect(regua.getAttribute('aria-checked')).toBe('true');
      await expect(grade.getAttribute('aria-checked')).toBe('false');
    });

    await step('O marcado mostra o tique; o desmarcado, não', async () => {
      // O visual do estado não pode depender só de cor: o tique é o que a
      // pessoa vê, e o `aria-checked` é o que ela ouve. O indicador fica no DOM
      // nos dois casos (é assim que a lib deixa a animação de saída possível) —
      // o que muda é o `display`, então é ele que a asserção olha.
      const marca = (item: HTMLElement) =>
        getComputedStyle(item.querySelector<HTMLElement>('[rdxmenucheckboxitemindicator]')!).display;
      await expect(marca(regua)).not.toBe('none');
      await expect(marca(grade)).toBe('none');
    });

    await step('Desmarcar o que estava marcado mantém o menu aberto', async () => {
      if (regua.getAttribute('aria-checked') !== 'false') await userEvent.click(regua);
      await waitFor(async () => {
        await expect(regua.getAttribute('aria-checked')).toBe('false');
      });
      await expect(document.body.contains(menu)).toBe(true);
    });
  },
};

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
//
// Story SEM interação, de propósito. O que ela declara vale na montagem, e o
// primeiro clique num item misto o resolve para marcado — uma play que clicasse
// aqui mediria outro estado no REPLAY do painel Interactions, que reexecuta no
// mesmo DOM. Sem clique, cada rodada mede exatamente o mesmo.

export const CheckboxIndeterminate: Story = {
  parameters: {
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    covers: ['functional.item9'],
  },
  render: () => ({
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Exibir</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarLabel>Mostrar na tela</div>
            <div ndsMenubarCheckboxItem [checked]="'indeterminate'">Colunas</div>
            <div ndsMenubarCheckboxItem [checked]="true">Régua</div>
            <div ndsMenubarCheckboxItem [checked]="false">Grade</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Colunas' });
    const marcado = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria `'indeterminate'` como verdadeiro; o que a
      // pessoa ouve tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(marcado.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. Com o mesmo símbolo
      // nos dois estados — o defeito — esta asserção fica vermelha.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(marcado);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado não mostra glifo nenhum', async () => {
      // Aqui o indicador CONTINUA montado (é assim que a lib deixa possível uma
      // animação de saída) e some por `display: none`. Sem caixa de layout o
      // `getBBox` devolve tudo zerado, que é o que o colhedor lê como
      // "sem glifo" — a asserção mede o que a pessoa vê, não o que existe.
      await expect(formaDoIndicador(desmarcado)).toBeNull();
    });
  },
};
