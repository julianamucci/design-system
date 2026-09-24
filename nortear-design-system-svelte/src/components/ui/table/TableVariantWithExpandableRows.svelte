<script lang="ts">
  import type { ClassValue } from 'svelte/elements';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { Button } from '@/components/ui/button';
  import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from './index';

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
   * 2. **A revelada é IRMÃ, sempre no DOM, escondida por `hidden`.** O `id` dela
   *    é o alvo do `aria-controls`, e um alvo que some deixa o atributo apontando
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
  // `class` existe para o wrapper ter uma prop em comum com as do Table — sem
  // isso o `render` da story não tipa contra `Meta<typeof Table>`. Mesma razão
  // registrada no `AlertDynamicInsertionStory` desta stack.
  const { class: className = undefined }: { class?: ClassValue | null } = $props();

  const columns = ['Fatura', 'Status', 'Método', 'Valor'];

  const invoices = [
    { id: '#INV-001', status: 'Pago', method: 'Cartão de crédito', amount: 'R$ 250,00' },
    { id: '#INV-002', status: 'Pendente', method: 'Boleto bancário', amount: 'R$ 150,00' },
    { id: '#INV-003', status: 'Cancelado', method: 'Pix', amount: 'R$ 350,00' },
  ];

  // A segunda também está MARCADA: aberta e selecionada ao mesmo tempo é o caso
  // que o `:not([data-state="selected"])` da folha compartilhada protege.
  const selected = invoices[1].id;

  let open = $state<Record<string, boolean>>({});

  /**
   * O id sai do REGISTRO, sem o `#`: duas tabelas na mesma tela não podem repetir
   * id, e `#` dentro dele quebraria qualquer `querySelector`.
   */
  function detailIdOf(id: string): string {
    return `table-row-detail-${id.replace('#', '')}`;
  }

  function toggle(id: string) {
    open = { ...open, [id]: !open[id] };
  }
</script>

<Table class={className}>
  <TableCaption class="nds-sr-only">Faturas recentes com detalhes</TableCaption>
  <TableHeader>
    <TableRow>
      <!-- A coluna do disclosure vem primeiro e tem cabeçalho: o rótulo sai da
           tela num span, e não por classe no `th`, que desmontaria a grade. -->
      <TableHead scope="col"><span class="nds-sr-only">Detalhes</span></TableHead>
      {#each columns as column (column)}
        <TableHead scope="col" class={column === 'Valor' ? 'nds-text-right' : undefined}>
          {column}
        </TableHead>
      {/each}
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow data-state={invoice.id === selected ? 'selected' : undefined}>
        <TableCell>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={open[invoice.id] ? 'true' : 'false'}
            aria-controls={detailIdOf(invoice.id)}
            aria-label={`Detalhes da fatura ${invoice.id}`}
            onclick={() => toggle(invoice.id)}
          >
            <!-- Sem classe de tamanho: `.nds-button > svg` já dimensiona o ícone.
                 `nds-chevron` é a rotação global do disclosure, e ela casa com
                 `[aria-expanded="true"]` — o mesmo atributo que a folha lê. -->
            <ChevronDown class="nds-chevron" aria-hidden="true" />
          </Button>
        </TableCell>
        <TableCell class="nds-font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell class="nds-text-right">{invoice.amount}</TableCell>
      </TableRow>
      <TableRow id={detailIdOf(invoice.id)} hidden={!open[invoice.id]}>
        <TableCell colspan={columns.length + 1}>
          <div class="nds-stack" data-spacing="sm">
            <p class="nds-text-muted-foreground">
              Emitida por {invoice.method}, no valor de {invoice.amount}.
            </p>
            <!-- Um controle dentro do detalhe: é ele que prova que o conteúdo
                 revelado vem depois do disclosure na tabulação, e que some dela
                 quando a linha fecha. -->
            <Button variant="outline" size="sm" aria-label={`Baixar recibo da fatura ${invoice.id}`}>
              Baixar recibo
            </Button>
          </div>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
