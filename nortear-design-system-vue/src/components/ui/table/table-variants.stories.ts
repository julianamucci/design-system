import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { userEvent, within, expect } from 'storybook/test';
import { ChevronDown } from 'lucide-vue-next';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './index';
import { Button } from '@/components/ui/button';
import { COLUMNS, INVOICES, MONTHS, TOTAL } from './table.fixtures';
import {
  tableBasicaSource,
  tableWithActionsSource,
  tableWithFooterSource,
  tableCaptionInvisivelSource,
  tableScrollHorizontalSource,
  tableWithExpandableRowsSource,
} from './table.source';

const meta: Meta = {
  title: 'Components/Tables/Table/Variants',
  tags: ['tables'],
  parameters: {
    layout: 'padded',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: tableBasicaSource } },
  },
};

export default meta;
type Story = StoryObj;

// O cabeçalho da coluna numérica recebe `nds-text-right` junto com as células:
// número se lê pela unidade, alinhado à direita, e o rótulo tem de acompanhar.
// A classe só passou a valer no `<th>` quando o CSS compartilhado rebaixou o
// seletor para `:where(.nds-table) th`; antes disso estas páginas alinhavam por
// `style` inline. É por isso que as stories afirmam o alinhamento COMPUTADO.

const COMPONENTES = {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};

export const Basic: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  render: () => ({
    components: COMPONENTES,
    setup() {
      return { invoices: INVOICES };
    },
    template: `
      <Table>
        <TableCaption>Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fatura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Método</TableHead>
            <TableHead class="nds-text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="invoice in invoices" :key="invoice.id">
            <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
            <TableCell>{{ invoice.status }}</TableCell>
            <TableCell>{{ invoice.method }}</TableCell>
            <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Uma linha por registro, quatro colunas por linha', async () => {
      // functional.item1 — a conta sai da fixture, nunca de um número escrito à
      // mão: um dado a menos deixaria a asserção verde e a tabela errada.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(INVOICES.length);
      for (const [i, line] of lines.entries()) {
        await expect(line).toHaveAttribute('data-slot', 'table-row');
        await expect(line.querySelectorAll('td').length).toBe(4);
        await expect(line).toHaveTextContent(INVOICES[i].id);
      }
    });

    await step('A coluna de valores alinha à direita, rótulo junto com os números', async () => {
      // visual.item1 — é o caso de uso central de `nds-text-right`. A asserção é
      // do alinhamento computado: por muito tempo a classe existia no markup e
      // não pintava nada, e nenhuma story reprovava por isso.
      const ths = [...canvasElement.querySelectorAll<HTMLElement>('thead th')];
      await expect(ths[3]).toHaveTextContent('Valor');
      await expect(getComputedStyle(ths[3]).textAlign).toBe('right');
      const valueTd = canvasElement.querySelector<HTMLElement>('tbody tr td:last-child')!;
      await expect(getComputedStyle(valueTd).textAlign).toBe('right');
      // A coluna descritiva continua à esquerda: o alinhamento é escolha por
      // coluna, não estilo da tabela.
      await expect(getComputedStyle(ths[0]).textAlign).toBe('left');
    });

    await step('A legenda visível é o nome acessível da tabela', async () => {
      const table = canvas.getByRole('table', { name: /faturas recentes/ });
      const caption = table.querySelector<HTMLElement>('caption')!;
      await expect(caption.classList.contains('nds-sr-only')).toBe(false);
    });
  },
};

export const WithFooter: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    // O `tfoot` e o `colspan` são uma seção inteira a mais, que a básica não tem.
    docs: { source: { transform: tableWithFooterSource } },
  },
  render: () => ({
    components: COMPONENTES,
    setup() {
      return { invoices: INVOICES, total: TOTAL };
    },
    template: `
      <Table>
        <TableCaption class="nds-sr-only">Faturas recentes com total</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fatura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Método</TableHead>
            <TableHead class="nds-text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="invoice in invoices" :key="invoice.id">
            <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
            <TableCell>{{ invoice.status }}</TableCell>
            <TableCell>{{ invoice.method }}</TableCell>
            <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colspan="3">Total</TableCell>
            <TableCell class="nds-text-right">{{ total }}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O rodapé fica depois do corpo e cobre as três primeiras colunas', async () => {
      // functional.item3 — o `colspan` é o que faz o rótulo "Total" ocupar a
      // largura das colunas descritivas e o valor cair sob a coluna certa.
      // Estava escrito `:col-span="3"`, que o Vue repassa como atributo
      // `col-span` — inexistente em HTML, e a célula cobria uma coluna só.
      const table = canvasElement.querySelector<HTMLElement>('table')!;
      const tfoot = table.querySelector<HTMLElement>('tfoot')!;
      await expect(tfoot).toHaveAttribute('data-slot', 'table-footer');
      const position = table.querySelector('tbody')!.compareDocumentPosition(tfoot);
      await expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await expect(tfoot.querySelector('td')).toHaveAttribute('colspan', '3');
      await expect(tfoot).toHaveTextContent(TOTAL);
      // O total não é registro: o corpo continua com as mesmas cinco linhas.
      await expect(table.querySelectorAll('tbody tr').length).toBe(INVOICES.length);
    });

    await step('O rodapé se distingue do corpo por fundo próprio', async () => {
      // visual.item3 — `.nds-table tfoot tr` pinta hsl(var(--muted) / 0.5). Sem
      // a distinção o sumário some no meio dos registros.
      const lineFooter = canvasElement.querySelector<HTMLElement>('tfoot tr')!;
      const lineBody = canvasElement.querySelector<HTMLElement>('tbody tr')!;
      await expect(getComputedStyle(lineFooter).backgroundColor).not.toBe(
        getComputedStyle(lineBody).backgroundColor,
      );
    });
  },
};

export const CaptionSrOnly: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item2'],
    // A tabela entra sob um título visível, e é essa vizinhança que justifica a
    // legenda invisível — sem ela no snippet, a classe pareceria gratuita.
    docs: { source: { transform: tableCaptionInvisivelSource } },
  },
  render: () => ({
    components: COMPONENTES,
    setup() {
      return { invoices: INVOICES.slice(0, 3) };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <h2 class="nds-text-h3 nds-m-0">Faturas recentes</h2>
        <Table>
          <TableCaption class="nds-sr-only">Lista de faturas recentes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="nds-text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="invoice in invoices" :key="invoice.id">
              <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
              <TableCell>{{ invoice.status }}</TableCell>
              <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A legenda está no DOM e fora da tela', async () => {
      // functional.item6 — `display: none` tiraria também da árvore de
      // acessibilidade; a classe de leitor de tela recorta a caixa e mantém a
      // leitura. A asserção é do EFEITO: verificar o nome da classe deixava
      // passar o caso em que ela existe no markup e não existe no CSS.
      const caption = canvasElement.querySelector<HTMLElement>('caption')!;
      await expect(caption).toHaveTextContent('Lista de faturas recentes');
      await expect(getComputedStyle(caption).position).toBe('absolute');
      const r = caption.getBoundingClientRect();
      await expect(Math.max(r.width, r.height)).toBeLessThanOrEqual(2);
    });

    await step('A tabela continua nomeada para o leitor de tela', async () => {
      // accessibility.item2 — é isto que a legenda invisível existe para
      // garantir; sem ela o leitor anuncia só "tabela".
      await expect(canvas.getByRole('table', { name: /Lista de faturas recentes/ })).toBeTruthy();
    });
  },
};

export const WithRowActions: Story = {
  parameters: {
    covers: ['accessibility.item3', 'visual.item4'],
    // Uma coluna a mais, com cabeçalho só para leitor de tela e um botão nomeado
    // por registro — nada disso existe na básica.
    docs: { source: { transform: tableWithActionsSource } },
  },
  render: () => ({
    components: { ...COMPONENTES, Button },
    setup() {
      return { invoices: INVOICES };
    },
    template: `
      <Table>
        <TableCaption class="nds-sr-only">Faturas recentes com ações</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fatura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Método</TableHead>
            <TableHead class="nds-text-right">Valor</TableHead>
            <!-- O cabeçalho da coluna de ações não é decorativo: sem ele a
                 coluna existe para quem vê e some para quem navega por
                 cabeçalhos. -->
            <TableHead><span class="nds-sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="invoice in invoices" :key="invoice.id">
            <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
            <TableCell>{{ invoice.status }}</TableCell>
            <TableCell>{{ invoice.method }}</TableCell>
            <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
            <TableCell class="nds-text-right">
              <Button variant="ghost" size="sm" :aria-label="'Ações para fatura ' + invoice.id">
                Ações
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada ação diz a qual fatura pertence', async () => {
      // accessibility.item3 — cinco botões chamados "Ações" seriam cinco
      // controles indistinguíveis na lista de elementos do leitor de tela.
      const buttons = canvas.getAllByRole('button');
      await expect(buttons.length).toBe(INVOICES.length);
      for (const [i, button] of buttons.entries()) {
        await expect(button).toHaveAccessibleName(`Ações para fatura ${INVOICES[i].id}`);
        // O botão mora dentro da própria linha do registro que ele opera.
        await expect(button.closest('tr')).toHaveTextContent(INVOICES[i].id);
      }
    });

    await step('O botão de ação é discreto (variante ghost)', async () => {
      // visual.item4 — a coluna de ações não pode competir com o dado; o ghost
      // é o que o conteúdo compartilhado documenta para ação por linha.
      const button = canvas.getAllByRole('button')[0];
      await expect(button).toHaveAttribute('data-variant', 'ghost');
    });
  },
};

export const HorizontalScroll: Story = {
  parameters: {
    covers: ['functional.item5'],
    // As colunas passam a ser iteradas: o assunto é a tabela larga, e a básica
    // de quatro colunas não a mostraria.
    docs: { source: { transform: tableScrollHorizontalSource } },
  },
  render: () => ({
    components: COMPONENTES,
    setup() {
      // Dois anos de competência, não um: com doze colunas a tabela ainda cabe
      // num canvas largo, e a story provaria a rolagem só nos viewports
      // estreitos.
      return { invoices: INVOICES.slice(0, 3), months: MONTHS };
    },
    // A legenda nomeia a TABELA; `regionLabel` nomeia o contêiner que ROLA, que
    // é outro elemento e entra sozinho na ordem de tabulação. Sem nome o wrapper
    // não recebe papel, e quem chega nele por Tab ouve uma parada muda.
    template: `
      <Table regionLabel="Faturas por mês de competência">
        <TableCaption class="nds-sr-only">Faturas por mês de competência</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fatura</TableHead>
            <TableHead v-for="month in months" :key="month">{{ month }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="invoice in invoices" :key="invoice.id">
            <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
            <TableCell v-for="month in months" :key="month" class="nds-text-right">
              {{ invoice.amount }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Quem rola é o container, e ele aceita foco', async () => {
      // functional.item5 — sem o wrapper a tabela empurraria a página inteira
      // para o lado; sem o tabindex a rolagem existiria só para o mouse
      // (axe scrollable-region-focusable, WCAG 2.1.1).
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      await expect(wrapper).toHaveClass('nds-table-wrapper');
      await expect(wrapper).toHaveAttribute('tabindex', '0');
      await expect(getComputedStyle(wrapper).overflowX).toBe('auto');
      await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);

      // A parada só é anunciável com PAPEL e NOME: `group` (e não `region`, que
      // viraria marco de página numa tela com várias tabelas) mais o nome do
      // conteúdo, que vem de fora porque o design system não o conhece.
      await expect(wrapper).toHaveAttribute('role', 'group');
      await expect(wrapper).toHaveAccessibleName('Faturas por mês de competência');
    });

    await step('A rolagem chega ao fim da tabela', async () => {
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      wrapper.focus();
      await expect(wrapper).toHaveFocus();
      wrapper.scrollLeft = wrapper.scrollWidth;
      await expect(wrapper.scrollLeft).toBeGreaterThan(0);
    });
  },
};

// ─── Linha expansível ─────────────────────────────────────────────────────────

/** Os três primeiros registros — três pares de linhas bastam para a prova. */
const EXPANDABLE_LINES = INVOICES.slice(0, 3);

/**
 * O id da linha revelada sai do REGISTRO, sem o `#`: duas tabelas na mesma tela
 * não podem repetir id, e `#` dentro dele quebraria qualquer `querySelector`.
 */
function detailIdOf(id: string): string {
  return `table-row-detail-${id.replace('#', '')}`;
}

/**
 * Uma linha de dados com disclosure, e a linha irmã que ela revela.
 *
 * As quatro decisões da forma, e o motivo de cada uma:
 *
 * 1. **`aria-expanded` no BOTÃO, nunca na `<tr>`.** A linha já usa `data-state`
 *    para a SELEÇÃO, e os dois estados coexistem — uma linha marcada pode estar
 *    aberta. Quem faz a linha reagir ao controle é a folha compartilhada, por
 *    `tbody tr:has([aria-expanded="true"])`; o `:has()` existe exatamente para
 *    o estado morar no controle e o efeito acontecer na linha.
 * 2. **A revelada é IRMÃ, sempre no DOM, escondida por `hidden`.** O `id` dela é
 *    o alvo do `aria-controls`, e um alvo que some deixa o atributo apontando
 *    para nada. O `colspan` sai da lista de colunas mais a do disclosure, e não
 *    de um número escrito à mão.
 * 3. **O leitor de tela anuncia pelo `aria-expanded`.** O nome acessível é do
 *    REGISTRO ("Detalhes da fatura #INV-001") e não muda: trocar "Mostrar" por
 *    "Ocultar" diria a mesma coisa duas vezes e ficaria em desacordo com o
 *    atributo no instante entre uma escrita e outra. Nada de live region — a
 *    mudança de estado do próprio controle já é anunciada.
 * 4. **A ordem de foco sai do DOM.** A linha revelada vem imediatamente depois
 *    da linha de dados, então o que ela contém é o próximo ponto de tabulação
 *    depois do controle, sem `tabindex` nenhum. Fechada, ela é `hidden`: sai da
 *    tabulação e da árvore de acessibilidade pelo mesmo atributo.
 */
export const WithExpandableRows: Story = {
  parameters: {
    // Os três itens nasceram nesta mesma rodada, junto com a decisão de que a
    // linha expansível é recurso do Table. O `visual.item7` é o que prova o
    // conserto de cascata: marcada E expandida mantém a cor da seleção.
    covers: ['functional.item8', 'visual.item7', 'accessibility.item5'],
    docs: { source: { transform: tableWithExpandableRowsSource } },
  },
  render: () => ({
    components: { ...COMPONENTES, Button, ChevronDown },
    setup() {
      const open = ref<Record<string, boolean>>({});
      function toggle(id: string) {
        open.value = { ...open.value, [id]: !open.value[id] };
      }
      return {
        lines: EXPANDABLE_LINES,
        // A segunda também está MARCADA: aberta e selecionada ao mesmo tempo é
        // o caso que o `:not([data-state="selected"])` da folha protege.
        selected: EXPANDABLE_LINES[1].id,
        open,
        toggle,
        detailIdOf,
        // Colunas de dado MAIS a do disclosure.
        detailColspan: COLUMNS.length + 1,
      };
    },
    template: `
      <Table>
        <TableCaption class="nds-sr-only">Faturas recentes com detalhes</TableCaption>
        <TableHeader>
          <TableRow>
            <!-- A coluna do disclosure vem primeiro e tem cabeçalho: o rótulo
                 sai da tela num span, e não por classe no th, que desmontaria
                 a grade. -->
            <TableHead><span class="nds-sr-only">Detalhes</span></TableHead>
            <TableHead>Fatura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Método</TableHead>
            <TableHead class="nds-text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-for="invoice in lines" :key="invoice.id">
            <TableRow :data-state="invoice.id === selected ? 'selected' : null">
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :aria-expanded="open[invoice.id] ? 'true' : 'false'"
                  :aria-controls="detailIdOf(invoice.id)"
                  :aria-label="'Detalhes da fatura ' + invoice.id"
                  @click="toggle(invoice.id)"
                >
                  <ChevronDown class="nds-chevron" aria-hidden="true" />
                </Button>
              </TableCell>
              <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
              <TableCell>{{ invoice.status }}</TableCell>
              <TableCell>{{ invoice.method }}</TableCell>
              <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
            </TableRow>
            <TableRow :id="detailIdOf(invoice.id)" :hidden="!open[invoice.id]">
              <TableCell :colspan="detailColspan">
                <div class="nds-stack" data-spacing="sm">
                  <p class="nds-text-muted-foreground">
                    Emitida por {{ invoice.method }}, no valor de {{ invoice.amount }}.
                  </p>
                  <!-- Um controle dentro do detalhe: é ele que prova que o
                       conteúdo revelado vem depois do disclosure na tabulação,
                       e que some dela quando a linha fecha. -->
                  <Button
                    variant="outline"
                    size="sm"
                    :aria-label="'Baixar recibo da fatura ' + invoice.id"
                  >
                    Baixar recibo
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const rows = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const toggles = () => canvas.getAllByRole('button', { name: /^Detalhes da fatura/ });

    // Cada par de linhas é dado + detalhe: 0 dado, 1 detalhe, 2 dado marcado…
    const collapsedBackground = getComputedStyle(rows()[0]).backgroundColor;
    const selectedBackground = getComputedStyle(rows()[2]).backgroundColor;

    await step('Fechada, a linha de detalhe sai da tela e da tabulação', async () => {
      await expect(rows().length).toBe(EXPANDABLE_LINES.length * 2);
      for (const [i, toggle] of toggles().entries()) {
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveAttribute('aria-controls', rows()[i * 2 + 1].id);
        // O detalhe atravessa as colunas de dado MAIS a do disclosure.
        const cell = rows()[i * 2 + 1].querySelector('td')!;
        await expect(cell).toHaveAttribute('colspan', String(COLUMNS.length + 1));
      }
      // `hidden` tira da tela, da árvore de acessibilidade e da tabulação de uma
      // vez — por isso o botão do detalhe não é alcançável por papel.
      await expect(getComputedStyle(rows()[1]).display).toBe('none');
      await expect(canvas.queryAllByRole('button', { name: /^Baixar recibo/ }).length).toBe(0);
    });

    await step('Enter no controle abre a linha irmã, e o nome não muda', async () => {
      // Teclado, e não clique: o ponteiro deixaria a linha em `:hover`, que pinta
      // com a MESMA cor da regra que este teste existe para provar — a asserção
      // do fundo passaria com ou sem o recurso.
      toggles()[0].focus();
      await userEvent.keyboard('{Enter}');

      await expect(toggles()[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(rows()[1].hidden).toBe(false);
      await expect(rows()[1].getBoundingClientRect().height).toBeGreaterThan(0);
      // Quem anuncia o estado é o `aria-expanded`; o nome continua sendo o do
      // registro, nos dois sentidos da alternância.
      await expect(toggles()[0]).toHaveAccessibleName(
        `Detalhes da fatura ${EXPANDABLE_LINES[0].id}`,
      );
    });

    await step('O conteúdo revelado é o próximo ponto de tabulação', async () => {
      // A linha irmã vem logo depois da linha de dados no DOM: a ordem de foco
      // sai daí, sem `tabindex` nenhum.
      await userEvent.tab();
      await expect(
        canvas.getByRole('button', { name: `Baixar recibo da fatura ${EXPANDABLE_LINES[0].id}` }),
      ).toHaveFocus();
    });

    await step('A linha expandida muda de fundo', async () => {
      // É o contrato da folha compartilhada (`:has([aria-expanded="true"])`), e
      // até hoje ele não tinha produtor em stack nenhuma.
      const expandedBackground = getComputedStyle(rows()[0]).backgroundColor;
      await expect(expandedBackground).not.toBe(collapsedBackground);
      await expect(expandedBackground).not.toBe('rgba(0, 0, 0, 0)');
      // A terceira continua fechada: a mudança é da linha aberta, não da tabela.
      await expect(getComputedStyle(rows()[4]).backgroundColor).toBe(collapsedBackground);
    });

    await step('Marcada e expandida ao mesmo tempo: a cor da seleção vence', async () => {
      // Os três seletores de fundo são (0,2,2) — sem o `:not([data-state="selected"])`
      // a regra do disclosure é a última do arquivo e rebaixaria a linha marcada
      // ao tom claro do hover.
      toggles()[1].focus();
      await userEvent.keyboard('{Enter}');

      await expect(toggles()[1]).toHaveAttribute('aria-expanded', 'true');
      await expect(rows()[3].hidden).toBe(false);
      await expect(getComputedStyle(rows()[2]).backgroundColor).toBe(selectedBackground);
      await expect(getComputedStyle(rows()[2]).backgroundColor).not.toBe(
        getComputedStyle(rows()[0]).backgroundColor,
      );
    });

    await step('Enter de novo fecha, e tudo volta ao estado anterior', async () => {
      toggles()[0].focus();
      await userEvent.keyboard('{Enter}');

      await expect(toggles()[0]).toHaveAttribute('aria-expanded', 'false');
      await expect(getComputedStyle(rows()[1]).display).toBe('none');
      await expect(getComputedStyle(rows()[0]).backgroundColor).toBe(collapsedBackground);
      await expect(canvas.queryAllByRole('button', { name: /^Baixar recibo/ }).length).toBe(1);
    });
  },
};
