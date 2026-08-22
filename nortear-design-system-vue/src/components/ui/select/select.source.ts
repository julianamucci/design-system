/**
 * Transforms do painel Code do Select.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * As stories embrulham o campo num `<div style="contain: layout; min-height…">`
 * para reservar espaço ao portal no canvas do Storybook. Isso é enquadramento
 * de story: a lista sai do fluxo e não empurra nada, então quem consome não
 * precisa reservar altura nenhuma. O embrulho fica de fora do snippet, e com
 * ele a medida cravada em `style` inline.
 */
import { attr, attrBool, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type SelectArgs = {
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
};

/** Os nomes que a composição usa, um por linha, do design system. */
function importing(...nomes: string[]): string {
  return `import {
${nomes.map((nome) => `  ${nome},`).join('\n')}
} from '@/components/ui/select'`;
}

const IMPORT_BASE = importing(
  'Select',
  'SelectContent',
  'SelectItem',
  'SelectTrigger',
  'SelectValue',
);

const STATES = `const estados = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
]`;

/**
 * A largura do campo sai de utilitária, e não de `style` inline: o gatilho
 * nasce com `width: fit-content`, então o campo encolheria e cresceria a cada
 * troca de escolha se ninguém desse a ele uma largura própria.
 */
const WIDTH_FIELD = 'class="nds-w-xs"';

const LACO_ITEMS = `<SelectItem v-for="estado in estados" :key="estado.value" :value="estado.value">
  {{ estado.label }}
</SelectItem>`;

/**
 * A forma do campo: raiz de estado, gatilho com nome próprio e valor exibido,
 * e a lista dentro do conteúdo.
 *
 * O gatilho tem `role="combobox"`, e combobox NÃO tira nome do próprio
 * conteúdo — o conteúdo dele é o valor escolhido. Sem `aria-label` ou rótulo
 * externo o campo fica anônimo mesmo mostrando texto.
 */
function campo(opcoes: {
  raiz?: Array<string | false | null | undefined>;
  gatilho?: Array<string | false | null | undefined>;
  valor?: string;
  itens: string;
}): string {
  const { raiz = [], gatilho = [], itens } = opcoes;
  const valor = opcoes.valor ?? '<SelectValue placeholder="Selecione..." />';
  return `<Select${attrs(...raiz)}>
  <SelectTrigger${attrs(...gatilho)}>
${indentar(valor, 4)}
  </SelectTrigger>
  <SelectContent>
${indentar(itens, 4)}
  </SelectContent>
</Select>`;
}

/**
 * Forma canônica: campo fechado com placeholder e uma lista de opções vinda de
 * um array. O portal, o papel de listbox e o teclado vêm do componente.
 */
export const selectSource: SourceTransform<SelectArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const bloqueado = args.disabled === true;
  return vueSnippet(
    `${IMPORT_BASE}\n\n${STATES}`,
    campo({
      raiz: [
        attr('default-value', args.defaultValue),
        attrBool('disabled', args.disabled, false),
        attr('name', args.name),
      ],
      // O bloqueio vale para os dois: a raiz impede a abertura, e o gatilho é
      // o que sai do percurso do Tab — `disabled` nativo, não só `aria-`.
      gatilho: ['aria-label="Selecionar estado"', WIDTH_FIELD, bloqueado && 'disabled'],
      itens: LACO_ITEMS,
    }),
  );
};

const QUATRO_STATES = `<SelectItem value="sp">São Paulo</SelectItem>
<SelectItem value="rj">Rio de Janeiro</SelectItem>
<SelectItem value="mg">Minas Gerais</SelectItem>
<SelectItem value="es">Espírito Santo</SelectItem>`;

/** Lista plana: só itens dentro do conteúdo, sem cabeçalho de grupo. */
export function selectListPlanaSource(): string {
  return vueSnippet(
    IMPORT_BASE,
    campo({
      gatilho: ['aria-label="Selecionar estado"', WIDTH_FIELD],
      itens: QUATRO_STATES,
    }),
  );
}

/**
 * Lista agrupada: cada categoria é um grupo, e o cabeçalho é o que o nomeia. O
 * agrupamento é semântico — as opções continuam todas na mesma lista.
 */
export function selectAgrupadoSource(): string {
  return vueSnippet(
    importing(
      'Select',
      'SelectContent',
      'SelectGroup',
      'SelectItem',
      'SelectLabel',
      'SelectTrigger',
      'SelectValue',
    ),
    campo({
      gatilho: ['aria-label="Selecionar estado por região"', WIDTH_FIELD],
      itens: `<SelectGroup>
  <SelectLabel>Sudeste</SelectLabel>
  <SelectItem value="sp">São Paulo</SelectItem>
  <SelectItem value="rj">Rio de Janeiro</SelectItem>
  <SelectItem value="mg">Minas Gerais</SelectItem>
  <SelectItem value="es">Espírito Santo</SelectItem>
</SelectGroup>
<SelectGroup>
  <SelectLabel>Sul</SelectLabel>
  <SelectItem value="rs">Rio Grande do Sul</SelectItem>
  <SelectItem value="sc">Santa Catarina</SelectItem>
  <SelectItem value="pr">Paraná</SelectItem>
</SelectGroup>`,
    }),
  );
}

/**
 * Ícone na opção: ele entra como filho direto do item, antes do texto, e é
 * DECORATIVO — `aria-hidden` mantém o nome acessível igual ao rótulo, sem eco.
 */
export function selectWithIconSource(): string {
  return vueSnippet(
    `import { Globe } from 'lucide-vue-next'
${IMPORT_BASE}`,
    campo({
      gatilho: ['aria-label="Selecionar idioma"', WIDTH_FIELD],
      itens: `<SelectItem value="pt-BR">
  <Globe class="nds-size-4" aria-hidden="true" />
  <span>Português (BR)</span>
</SelectItem>
<SelectItem value="en">
  <Globe class="nds-size-4" aria-hidden="true" />
  <span>English</span>
</SelectItem>
<SelectItem value="es">
  <Globe class="nds-size-4" aria-hidden="true" />
  <span>Español</span>
</SelectItem>`,
    }),
  );
}

/** Estado vazio: o campo mostra o placeholder, e a lista nem existe no DOM. */
export function selectEmptySource(): string {
  return vueSnippet(
    `${IMPORT_BASE}\n\n${STATES}`,
    campo({
      gatilho: ['aria-label="Selecionar estado"', WIDTH_FIELD],
      itens: LACO_ITEMS,
    }),
  );
}

/**
 * Valor inicial: os rótulos das opções só existem enquanto a lista está
 * montada, e ela desmonta ao fechar. Um valor que chega antes da primeira
 * abertura não teria rótulo, e o campo mostraria o valor cru — o slot do
 * SelectValue é onde se resolve isso, com o mapa que a própria lista já usa.
 */
export function selectPreenchidoSource(): string {
  return vueSnippet(
    `${IMPORT_BASE}

${STATES}

const rotulos = Object.fromEntries(estados.map((estado) => [estado.value, estado.label]))`,
    campo({
      raiz: ['default-value="rj"'],
      gatilho: ['aria-label="Selecionar estado"', WIDTH_FIELD],
      valor: `<SelectValue placeholder="Selecione...">
  <template #default="{ modelValue }">
    {{ rotulos[modelValue] ?? 'Selecione...' }}
  </template>
</SelectValue>`,
      itens: LACO_ITEMS,
    }),
  );
}

/**
 * Campo bloqueado: a raiz impede a abertura e o gatilho carrega o `disabled`
 * nativo, que é o que o tira do percurso do Tab e cancela o clique no próprio
 * navegador.
 */
export function selectBloqueadoSource(): string {
  return vueSnippet(
    `${IMPORT_BASE}\n\n${STATES}`,
    campo({
      raiz: ['disabled'],
      gatilho: ['aria-label="Selecionar estado"', WIDTH_FIELD, 'disabled'],
      itens: LACO_ITEMS,
    }),
  );
}

/**
 * Campo reprovado: `aria-invalid` no gatilho, e a mensagem em texto ao lado. A
 * borda de perigo vem da folha — a cor é reforço do aviso, nunca o aviso.
 */
export function selectInvalidoSource(): string {
  return vueSnippet(
    `${IMPORT_BASE}\n\n${STATES}`,
    `<div class="nds-stack" data-spacing="sm">
${indentar(
  campo({
    gatilho: ['aria-label="Selecionar estado"', 'aria-invalid="true"', WIDTH_FIELD],
    itens: LACO_ITEMS,
  }),
)}
  <p class="nds-text-body nds-text-destructive">Selecione um estado para continuar.</p>
</div>`,
  );
}

/**
 * Densidade compacta: `size` no GATILHO, ao lado do campo padrão para comparar.
 * A altura menor nasce do padding — altura cravada não cresceria junto com a
 * fonte do navegador (WCAG 1.4.4).
 */
export function selectCompactoSource(): string {
  return vueSnippet(
    `${IMPORT_BASE}\n\n${STATES}`,
    `<div class="nds-stack" data-spacing="sm">
${indentar(
  campo({
    gatilho: ['aria-label="Selecionar estado"', WIDTH_FIELD],
    itens: LACO_ITEMS,
  }),
)}

${indentar(
  campo({
    gatilho: ['aria-label="Selecionar cidade"', 'size="sm"', WIDTH_FIELD],
    itens: '<SelectItem value="campinas">Campinas</SelectItem>',
  }),
)}
</div>`,
  );
}

/**
 * Rótulo externo: o `for` do rótulo aponta para o `id` do gatilho, e o
 * `aria-labelledby` fecha o par do lado do campo. É o padrão de formulário —
 * um rótulo visível diz o que o campo quer antes de ele ter valor.
 */
export function selectWithLabelSource(): string {
  return vueSnippet(
    `import { Label } from '@/components/ui/label'
${IMPORT_BASE}`,
    `<div class="nds-stack nds-w-xs" data-spacing="sm">
  <Label id="estado-rotulo" for="estado">Estado</Label>
${indentar(
  campo({
    gatilho: ['id="estado"', 'aria-labelledby="estado-rotulo"', 'class="nds-w-full"'],
    itens: `<SelectItem value="sp">São Paulo</SelectItem>
<SelectItem value="rj">Rio de Janeiro</SelectItem>
<SelectItem value="mg">Minas Gerais</SelectItem>`,
  }),
)}
</div>`,
  );
}

/**
 * Seleção controlada: o valor mora fora do componente. As duas metades são
 * declaradas — a que entra (`:model-value`) e a que sai (`@update:model-value`)
 * —, e é assim que o estado externo passa a mandar no campo.
 */
export function selectControlledSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
import { Label } from '@/components/ui/label'
${IMPORT_BASE}

const estado = ref('')`,
    `<div class="nds-stack nds-w-xs" data-spacing="sm">
  <div class="nds-stack" data-spacing="sm">
    <Label for="estado">Estado</Label>
${indentar(
  campo({
    raiz: [':model-value="estado"', '@update:model-value="(valor) => (estado = valor)"'],
    gatilho: ['id="estado"', 'aria-label="Selecionar estado"', 'class="nds-w-full"'],
    itens: `<SelectItem value="sp">São Paulo</SelectItem>
<SelectItem value="rj">Rio de Janeiro</SelectItem>
<SelectItem value="mg">Minas Gerais</SelectItem>`,
  }),
  4,
)}
  </div>
  <p class="nds-text-caption nds-text-muted-foreground">Valor atual: <code>{{ estado || '—' }}</code></p>
</div>`,
  );
}

/**
 * Dentro de um formulário: `name` na raiz é o que faz o valor viajar no envio —
 * o componente mantém um campo escondido com esse nome, e é ele que a
 * serialização nativa enxerga.
 */
export function formSelectSource(): string {
  return vueSnippet(
    `import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
${IMPORT_BASE}`,
    `<form class="nds-stack nds-w-xs" data-spacing="sm" @submit.prevent>
  <div class="nds-stack" data-spacing="sm">
    <Label for="estado">Estado</Label>
${indentar(
  campo({
    raiz: ['name="estado"'],
    gatilho: ['id="estado"', 'aria-label="Selecionar estado"', 'class="nds-w-full"'],
    itens: `<SelectItem value="sp">São Paulo</SelectItem>
<SelectItem value="rj">Rio de Janeiro</SelectItem>
<SelectItem value="mg">Minas Gerais</SelectItem>`,
  }),
  4,
)}
  </div>
  <Button type="submit">Enviar</Button>
</form>`,
  );
}

/**
 * Divisão entre grupos: o separador é linha para o olho e silêncio para o
 * leitor de tela — quem separa semanticamente continua sendo o grupo.
 */
export function selectWithSeparatorSource(): string {
  return vueSnippet(
    importing(
      'Select',
      'SelectContent',
      'SelectGroup',
      'SelectItem',
      'SelectLabel',
      'SelectSeparator',
      'SelectTrigger',
      'SelectValue',
    ),
    campo({
      gatilho: ['aria-label="Selecionar estado"', WIDTH_FIELD],
      itens: `<SelectGroup>
  <SelectLabel>Sudeste</SelectLabel>
  <SelectItem value="sp">São Paulo</SelectItem>
  <SelectItem value="rj">Rio de Janeiro</SelectItem>
</SelectGroup>
<SelectSeparator />
<SelectGroup>
  <SelectLabel>Sul</SelectLabel>
  <SelectItem value="rs">Rio Grande do Sul</SelectItem>
  <SelectItem value="sc">Santa Catarina</SelectItem>
</SelectGroup>`,
    }),
  );
}
