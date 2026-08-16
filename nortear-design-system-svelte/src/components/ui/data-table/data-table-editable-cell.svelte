<script lang="ts">
  import { Input } from '@/components/ui/input';
  import { DATA_TABLE_LABELS_PADRAO, type DataTableLabels } from './data-table-labels';

  const {
    initial,
    columnId,
    label,
    edit,
    onCommit,
  }: {
    initial: string | number | null;
    rowIndex: number;
    columnId: string;
    /**
     * Nome da coluna como o leitor de tela deve ouvir. Vem do CABEÇALHO e não
     * do `columnId`: o id é chave de dados (`customer`, `amount`) e o rótulo
     * saía "Editar amount" numa interface em português.
     */
    label?: string;
    /**
     * Como o rótulo do controle de edição é escrito. Chega pronto do
     * DataTable (`labels.edit`) para que trocar a palavra "Editar" — ou o
     * idioma inteiro — seja uma decisão de quem consome, e não texto cravado
     * numa célula.
     */
    edit?: DataTableLabels['edit'];
    onCommit: (value: unknown) => void;
  } = $props();

  const rotulo = $derived((edit ?? DATA_TABLE_LABELS_PADRAO.edit)(label ?? columnId));

  let value = $derived(initial == null ? '' : String(initial));
  let editing = $state(false);

  function commit() {
    // O `blur` também confirma — e o Escape sai da edição ANTES dele. Sem esta
    // guarda, descartar com Escape disparava `onCommit` mesmo assim: o valor
    // voltava na tela e quem consome recebia a edição que o usuário cancelou.
    if (!editing) return;
    const isNumber = typeof initial === 'number';
    const next: unknown = isNumber ? Number(value) : value;
    onCommit(next);
    editing = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      value = initial == null ? '' : String(initial);
      editing = false;
    }
  }
</script>

<div class="nds-data-table-editable">
  {#if editing}
    <!-- Sem `aria-label` o campo aberto não tem NOME nenhum: o leitor anuncia
         "edição, em branco" e não diz de que coluna. WCAG 4.1.2, nível A. -->
    <Input
      autofocus
      {value}
      oninput={(e: Event) => (value = (e.currentTarget as HTMLInputElement).value)}
      onblur={commit}
      onkeydown={handleKeyDown}
      aria-label={rotulo}
      class="nds-data-table-edit-input"
    />
  {:else}
    <button
      type="button"
      onclick={() => (editing = true)}
      class="nds-data-table-edit-btn"
      aria-label={rotulo}
    >
      {#if value === ''}
        <span class="nds-dt-icon-muted">—</span>
      {:else}
        {value}
      {/if}
    </button>
  {/if}
</div>
