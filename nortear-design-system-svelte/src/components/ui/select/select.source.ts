/**
 * Transforms do painel Code do Select.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Sem elas o painel montava a tag a partir do nome
 * interno do componente compilado — o andaime da story, que ninguém importa.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type SelectArgs = {
  value: string;
  disabled: boolean;
  name?: string;
};

type Opcao = { value: string; label: string };
type Grupo = { label: string; opcoes: Opcao[] };

const ESTADOS: Opcao[] = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
];

const ESTADOS_COM_ES: Opcao[] = [...ESTADOS, { value: 'es', label: 'Espírito Santo' }];

const REGIOES: Grupo[] = [
  { label: 'Sudeste', opcoes: ESTADOS },
  {
    label: 'Sul',
    opcoes: [
      { value: 'rs', label: 'Rio Grande do Sul' },
      { value: 'sc', label: 'Santa Catarina' },
      { value: 'pr', label: 'Paraná' },
    ],
  },
];

const PLACEHOLDER = 'Selecione...';

/** Literal de opções indentado para dentro do bloco `<script>`. */
function literalDeOpcoes(opcoes: Opcao[], recuo = '  '): string {
  return opcoes
    .map((o) => `${recuo}{ value: "${o.value}", label: "${o.label}" },`)
    .join('\n');
}

type Opcoes = {
  valor?: string;
  disabled?: boolean;
  name?: string;
  size?: 'sm';
  invalido?: boolean;
  rotuloAcessivel?: string;
};

/** Atributos da raiz. `type` é obrigatório; o resto só quando difere do padrão. */
function propsDaRaiz(o: Opcoes): string {
  return attrs(
    'type="single"',
    'bind:value',
    o.disabled ? 'disabled' : '',
    o.name ? `name="${o.name}"` : '',
  );
}

/** Atributos do gatilho, na ordem em que a composição real os escreve. */
function propsDoGatilho(o: Opcoes): string {
  return attrs(
    o.size ? `size="${o.size}"` : '',
    `aria-label="${o.rotuloAcessivel ?? 'Selecionar estado'}"`,
    o.invalido ? 'aria-invalid="true"' : '',
  );
}

/** Gatilho: rótulo do valor escolhido, ou o texto de espera em tom apagado. */
function gatilho(o: Opcoes): string {
  return `  <SelectTrigger${propsDoGatilho(o)}>
    {#if rotulo}
      <span>{rotulo}</span>
    {:else}
      <span class="nds-text-muted-foreground">${PLACEHOLDER}</span>
    {/if}
  </SelectTrigger>`;
}

/**
 * Lista plana — a forma canônica.
 *
 * O rótulo do campo fechado sai da lista que a composição já tem em mãos: a
 * lista é desmontada ao fechar, e não haveria de onde tirá-lo depois.
 */
function listaPlana(opcoes: Opcao[], o: Opcoes = {}): string {
  return svelteSnippet(
    `import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

let value = $state("${o.valor ?? ''}");

const estados = [
${literalDeOpcoes(opcoes)}
];

const rotulo = $derived(estados.find((estado) => estado.value === value)?.label ?? "");`,
    `<Select${propsDaRaiz(o)}>
${gatilho(o)}
  <SelectContent>
    {#each estados as estado (estado.value)}
      <SelectItem value={estado.value} label={estado.label} />
    {/each}
  </SelectContent>
</Select>`,
  );
}

/** Lista agrupada por categoria, com divisão decorativa entre os grupos. */
function listaAgrupada(o: Opcoes = {}): string {
  const grupos = REGIOES.map(
    (g) => `  {
    label: "${g.label}",
    opcoes: [
${literalDeOpcoes(g.opcoes, '      ')}
    ],
  },`,
  ).join('\n');

  return svelteSnippet(
    `import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupHeading,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";

let value = $state("");

const regioes = [
${grupos}
];

const rotulo = $derived(
  regioes.flatMap((regiao) => regiao.opcoes).find((opcao) => opcao.value === value)?.label ?? "",
);`,
    `<Select${propsDaRaiz(o)}>
${gatilho(o)}
  <SelectContent>
    {#each regioes as regiao, i (regiao.label)}
      <SelectGroup>
        <SelectGroupHeading>{regiao.label}</SelectGroupHeading>
        {#each regiao.opcoes as opcao (opcao.value)}
          <SelectItem value={opcao.value} label={opcao.label} />
        {/each}
      </SelectGroup>
      {#if i < regioes.length - 1}
        <SelectSeparator />
      {/if}
    {/each}
  </SelectContent>
</Select>`,
  );
}

/** Lista com ícone decorativo antes do texto de cada opção. */
function listaComIcone(o: Opcoes = {}): string {
  return svelteSnippet(
    `import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import MapPinIcon from "@lucide/svelte/icons/map-pin";

let value = $state("");

const estados = [
${literalDeOpcoes(ESTADOS_COM_ES)}
];

const rotulo = $derived(estados.find((estado) => estado.value === value)?.label ?? "");`,
    `<Select${propsDaRaiz(o)}>
${gatilho(o)}
  <SelectContent>
    {#each estados as estado (estado.value)}
      <SelectItem value={estado.value} label={estado.label}>
        <!-- O ícone é decorativo: o nome acessível continua sendo só o rótulo. -->
        <MapPinIcon class="nds-size-4 nds-text-muted-foreground" />
        <span>{estado.label}</span>
      </SelectItem>
    {/each}
  </SelectContent>
</Select>`,
  );
}

/**
 * Playground: acompanha os controls de valor escolhido, bloqueio e nome do
 * campo no formulário.
 */
export function selectSource(_gerado?: string, ctx?: { args?: Partial<SelectArgs> }): string {
  const { value = '', disabled = false, name } = ctx?.args ?? {};
  return listaPlana(ESTADOS, { valor: value, disabled, name });
}

/** Variante de lista plana: só opções, sem cabeçalho nem divisão. */
export function selectListaPlanaSource(): string {
  return listaPlana(ESTADOS_COM_ES);
}

/**
 * Variante agrupada — também a seleção por região das composições: o cabeçalho
 * nomeia o grupo, e a linha entre grupos é só para o olho.
 */
export function selectComGruposSource(): string {
  return listaAgrupada({ rotuloAcessivel: 'Selecionar região' });
}

/** Variante com ícone inline antes do rótulo de cada opção. */
export function selectComIconeSource(): string {
  return listaComIcone();
}

/** Estado preenchido: um valor já escolhido antes da primeira abertura. */
export function selectSelecionadoSource(): string {
  return listaPlana(ESTADOS, { valor: 'rj' });
}

/** Estado bloqueado: o campo não abre e sai do percurso do Tab. */
export function selectBloqueadoSource(): string {
  return listaPlana(ESTADOS, { disabled: true });
}

/** Estado inválido: o campo reprovado se anuncia, e a borda de perigo reforça. */
export function selectInvalidoSource(): string {
  return listaPlana(ESTADOS, { invalido: true });
}

/** Composição compacta: densidade menor pelo `padding-block`, sem altura cravada. */
export function selectCompactoSource(): string {
  return listaPlana(ESTADOS_COM_ES, { size: 'sm' });
}
