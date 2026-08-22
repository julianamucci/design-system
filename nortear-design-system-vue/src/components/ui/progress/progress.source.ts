/**
 * Transforms do painel Code do Progress.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A largura cravada das stories (`style="width: 360px"`) NÃO atravessa para cá.
 * Ela existe para a foto do Chromatic sair sempre do mesmo tamanho; a barra é um
 * bloco que ocupa a largura do contêiner, e é isso que quem consome precisa
 * saber. Copiar a largura para o snippet ensinaria a cravar um valor de desenho
 * onde o tema, a densidade e a escala tipográfica não alcançam.
 */
import { attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type ProgressArgs = {
  modelValue: number | null;
  max: number;
};

/** Escala que a barra assume quando ninguém pede outra. */
const MAX_DEFAULT = 100;

/**
 * O valor da barra é a API inteira do componente — ele nunca é ruído, nem
 * quando bate com o padrão.
 *
 * Aqui a regra de "só o que difere do padrão entra" cede, e por medida: `0` e
 * `null` desenham telas quase idênticas, e só uma delas informa o progresso ao
 * leitor de tela. Um snippet que omitisse o `0` por ser o padrão deixaria as
 * duas indistinguíveis justamente onde a diferença importa.
 *
 * `null` sai escrito porque é o modo indeterminado: "não sei quanto falta", que
 * é outra coisa de "zero por cento".
 */
function valor(bruto: unknown): string {
  if (bruto === null) return ':model-value="null"';
  if (typeof bruto !== 'number' || Number.isNaN(bruto)) return ':model-value="0"';
  return `:model-value="${bruto}"`;
}

/** Escala máxima: essa sim some quando é a de fábrica. */
function escala(bruto: unknown): string {
  if (typeof bruto !== 'number' || Number.isNaN(bruto) || bruto === MAX_DEFAULT) return '';
  return `:max="${bruto}"`;
}

const IMPORT = `import { Progress } from '@/components/ui/progress'`;

/**
 * Barra com rótulo visível e porcentagem ao lado.
 *
 * O número repete o que `aria-valuenow` já diz, e é o que quem enxerga a tela
 * lê. Ele vive num `aria-live="polite"`: `assertive` interromperia o leitor de
 * tela a cada avanço.
 *
 * `nds-tabular-nums` impede que o número dance de largura conforme os dígitos
 * mudam — sem ele, "9%" e "88%" empurram o rótulo a cada atualização.
 */
function comRotulo(opcoes: {
  titulo: string;
  numero: string;
  barra: string;
  vivo?: boolean;
  recuo?: number;
}): string {
  const { titulo, numero, barra, vivo = true, recuo = 0 } = opcoes;
  const p = ' '.repeat(recuo);
  const live = vivo ? ' aria-live="polite"' : '';
  return `${p}<div class="nds-stack" data-spacing="xs">
${p}  <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
${p}    <span class="nds-text-foreground">${titulo}</span>
${p}    <span class="nds-text-muted-foreground nds-tabular-nums"${live}>${numero}</span>
${p}  </div>
${p}  ${barra}
${p}</div>`;
}

/**
 * Forma canônica: a barra com rótulo visível, porcentagem ao lado e nome
 * acessível próprio.
 *
 * O nome é obrigatório e descreve a OPERAÇÃO medida: `role="progressbar"` sem
 * nome anuncia "barra de progresso" e mais nada.
 */
export const progressSource: SourceTransform<ProgressArgs> = (_gerado, ctx) => {
  const bruto = ctx?.args?.modelValue;
  const numero = typeof bruto === 'number' && !Number.isNaN(bruto) ? bruto : 0;
  const barra = `<Progress${attrs(valor(bruto), escala(ctx?.args?.max))} aria-label="Progresso do upload" />`;

  return vueSnippet(
    IMPORT,
    comRotulo({ titulo: 'Enviando arquivo', numero: `${numero}%`, barra }),
  );
};

/**
 * Valor conhecido: a barra sozinha, sem rótulo em volta. Ela ocupa a largura
 * de quem a contém — não há prop de largura, e não deve haver medida cravada.
 */
export function progressDeterminadoSource(): string {
  return vueSnippet(IMPORT, `<Progress :model-value="42" aria-label="Progresso do upload" />`);
}

/**
 * Valor desconhecido: `null` é o modo indeterminado, e não zero.
 *
 * Sem valor o componente para de publicar `aria-valuenow` — um zero fixo
 * mentiria, dizendo "zero por cento" quando a verdade é "não sei quanto falta".
 * O desenho passa a ser o traço em ciclo, que vem do CSS, não de uma posição
 * calculada.
 */
export function progressIndeterminadoSource(): string {
  return vueSnippet(IMPORT, `<Progress :model-value="null" aria-label="Processando dados" />`);
}

/** Barra com rótulo visível e porcentagem — a forma que se usa numa tela real. */
export function progressWithLabelSource(): string {
  return vueSnippet(
    IMPORT,
    comRotulo({
      titulo: 'Enviando arquivo',
      numero: '42%',
      barra: '<Progress :model-value="42" aria-label="Enviando arquivo" />',
    }),
  );
}

/**
 * Cor semântica: a variante vem de `data-variant`, um ATRIBUTO, e não de uma
 * classe montada em runtime.
 *
 * A trilha continua neutra de propósito: o contraste de 3:1 entre barra e
 * trilha não pode depender de qual variante alguém escolheu (WCAG 1.4.11).
 */
export function progressColorSemanticaSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="sm">
  <Progress :model-value="100" data-variant="success" aria-label="Sincronização concluída" />
  <Progress :model-value="92" data-variant="destructive" aria-label="Espaço de armazenamento quase esgotado" />
</div>`,
  );
}

/**
 * Valor zero: escrito, e não omitido.
 *
 * Zero e indeterminado desenham a mesma trilha vazia, mas só o zero informa o
 * progresso ao leitor de tela. É a única diferença entre os dois, e ela mora
 * exatamente nesta linha.
 */
export function progressZeroSource(): string {
  return vueSnippet(IMPORT, `<Progress :model-value="0" aria-label="Progresso do upload" />`);
}

/** Meio do caminho: metade da trilha preenchida, com o número repetindo o valor. */
export function progressLoadingSource(): string {
  return vueSnippet(
    IMPORT,
    comRotulo({
      titulo: 'Carregando dados',
      numero: '50%',
      barra: '<Progress :model-value="50" aria-label="Progresso do carregamento" />',
    }),
  );
}

/**
 * Concluído: o valor bate com a escala, e o componente publica o estado no
 * DOM. É o gancho de quem quer trocar a cor ou remover a barra ao fim — sem
 * ele, quem consome teria de comparar valor com máximo por conta própria.
 *
 * Aqui o número NÃO é `aria-live`: ele não vai mudar mais, e uma região viva
 * que não muda só ocupa o leitor de tela à toa.
 */
export function progressConcluidoSource(): string {
  return vueSnippet(
    IMPORT,
    comRotulo({
      titulo: 'Concluído',
      numero: '100%',
      vivo: false,
      barra: '<Progress :model-value="100" aria-label="Operação concluída" />',
    }),
  );
}

/**
 * Processando sem medida: o rótulo diz o que está acontecendo, já que não há
 * porcentagem que possa dizer.
 */
export function progressProcessandoSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
  <div class="nds-text-body">Processando…</div>
  <Progress :model-value="null" aria-label="Processando dados" />
</div>`,
  );
}

/**
 * Upload com valor que anda: a barra acompanha um valor reativo, e o número ao
 * lado lê o MESMO valor — dois números que se calculam à parte divergem.
 *
 * O relógio é desligado no desmonte: um `setInterval` sobrevivente continua
 * escrevendo num componente que já saiu da tela.
 */
export function progressUploadAnimadoSource(): string {
  return vueSnippet(
    `${IMPORT}
import { onMounted, onUnmounted, ref } from 'vue'

const valor = ref(0)
let relogio: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  relogio = setInterval(() => {
    valor.value = valor.value >= 100 ? 0 : valor.value + 4
  }, 250)
})

onUnmounted(() => {
  if (relogio) {
    clearInterval(relogio)
    relogio = null
  }
})`,
    comRotulo({
      titulo: 'Enviando arquivo',
      numero: '{{ valor }}%',
      barra: '<Progress :model-value="valor" aria-label="Progresso do upload" />',
    }),
  );
}

/**
 * Várias barras numa lista: cada uma precisa de nome acessível PRÓPRIO.
 *
 * Repetir "Progresso do upload" nas três equivale a não nomear nenhuma — quem
 * ouve não saberia qual arquivo está a 92%. Por isso o rótulo carrega o nome do
 * arquivo, e mora no dado, não no markup.
 */
export function progressListSource(): string {
  return vueSnippet(
    `${IMPORT}

const itens = [
  { nome: 'relatorio-final.pdf', valor: 92 },
  { nome: 'planilha-q4.xlsx', valor: 64 },
  { nome: 'imagens.zip', valor: 28 },
]`,
    `<ul class="nds-stack nds-m-0 nds-p-0 nds-list-none" data-spacing="md">
  <li v-for="item in itens" :key="item.nome" class="nds-stack" data-spacing="xs">
    <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
      <span class="nds-text-foreground nds-truncate">{{ item.nome }}</span>
      <span class="nds-text-muted-foreground nds-tabular-nums">{{ item.valor }}%</span>
    </div>
    <Progress
      :model-value="item.valor"
      :aria-label="\`Progresso do upload de \${item.nome}\`"
    />
  </li>
</ul>`,
  );
}

/**
 * Três medidas na mesma tela, cada uma com a cor que o seu significado pede —
 * e a do meio sem variante nenhuma, porque "em andamento" não é semântico.
 */
export function listProgressColorsSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="sm">
${comRotulo({
  titulo: 'Sincronização',
  numero: '100%',
  vivo: false,
  recuo: 2,
  barra: '<Progress :model-value="100" data-variant="success" aria-label="Sincronização concluída" />',
})}
${comRotulo({
  titulo: 'Backup',
  numero: '72%',
  vivo: false,
  recuo: 2,
  barra: '<Progress :model-value="72" aria-label="Progresso do backup" />',
})}
${comRotulo({
  titulo: 'Espaço usado',
  numero: '92%',
  vivo: false,
  recuo: 2,
  barra:
    '<Progress :model-value="92" data-variant="destructive" aria-label="Espaço de armazenamento quase esgotado" />',
})}
</div>`,
  );
}

/**
 * Processamento no servidor: a operação existe, mas ninguém sabe medi-la. O
 * traço em ciclo ocupa parte da trilha, nunca a trilha inteira — uma barra
 * cheia leria como "100%", o oposto do que o estado quer dizer.
 */
export function progressProcessandoServidorSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
  <div class="nds-text-body">Processando…</div>
  <Progress :model-value="null" aria-label="Processando dados do servidor" />
</div>`,
  );
}
