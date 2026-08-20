/**
 * Transforms do painel Code do Select.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta é ANDAIME e não entra no snippet: o
 * `<div style={{ contain: "layout", minHeight: 200, position: "relative" }}>`
 * existe porque a lista é portalizada e o Storybook precisa de um quadro contra
 * o que posicioná-la, e os mapas `ESTADOS` / `ESTADOS_POR_VALOR` vêm de um
 * módulo de instrumentação de teste. O snippet declara os próprios dados.
 *
 * A prop `items` NÃO é andaime, e por isso aparece em quase todos os exemplos:
 * o primitivo desmonta a lista ao fechar e, sem esse mapa de valor para rótulo,
 * o campo fechado exibe o VALOR cru ("rj") no lugar do texto da opção. É o
 * defeito mais fácil de reproduzir neste componente, e o snippet que o
 * escondesse ensinaria a reproduzi-lo.
 */
import {
  attrs,
  indentar,
  jsxSnippet,
  propBool,
  propTexto,
  type SourceTransform,
} from '@/lib/story-source';

export type SelectArgs = {
  disabled: boolean;
  name: string;
};

/** Bloco de import do componente, em ordem alfabética das peças usadas. */
function importarSelect(...pecas: string[]): string {
  const lista = [...pecas].sort();
  return `import {\n${lista
    .map((peca) => `  ${peca},`)
    .join('\n')}\n} from "@/components/ui/select";`;
}

const PECAS_BASE = ['Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue'];

/**
 * Mapa de valor para rótulo declarado UMA vez e usado duas: alimenta `items` e
 * gera as opções. Escrever as duas listas à mão é o caminho por onde elas saem
 * de sincronia, e a divergência só aparece com o campo fechado.
 */
const MAPA = `const ESTADOS = {
  sp: "São Paulo",
  rj: "Rio de Janeiro",
  mg: "Minas Gerais",
  es: "Espírito Santo",
};`;

/**
 * Composição inteira do campo. O `placeholder` mora no `SelectValue`, e não no
 * gatilho: é ele que o primitivo troca pelo rótulo escolhido.
 */
function campo(raiz: string, gatilho = ' aria-label="Selecionar estado"'): string {
  return `<Select items={ESTADOS}${raiz}>
  <SelectTrigger${gatilho}>
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    {Object.entries(ESTADOS).map(([valor, rotulo]) => (
      <SelectItem key={valor} value={valor}>
        {rotulo}
      </SelectItem>
    ))}
  </SelectContent>
</Select>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai no campo fechado com placeholder, que é
 * o estado inicial do componente e o uso canônico.
 *
 * `onValueChange` NÃO é interpolado: o Storybook o entrega como espião, e o
 * corpo do mock apareceria no painel como se fosse código do design system.
 */
export const selectSource: SourceTransform<SelectArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const raiz = attrs(propTexto('name', args.name), propBool('disabled', args.disabled));
  return jsxSnippet(`${importarSelect(...PECAS_BASE)}\n\n${MAPA}`, campo(raiz));
};

/**
 * Opções agrupadas. O `SelectSeparator` é DECORATIVO aqui — quem separa para o
 * leitor de tela é o grupo, nomeado pelo `SelectLabel`. Por isso os itens são
 * escritos um a um: cada grupo é uma decisão de conteúdo, não uma iteração.
 */
export function selectComGruposSource(): string {
  return jsxSnippet(
    `${importarSelect(
      'Select',
      'SelectContent',
      'SelectGroup',
      'SelectItem',
      'SelectLabel',
      'SelectSeparator',
      'SelectTrigger',
      'SelectValue',
    )}

const REGIOES = {
  sp: "São Paulo",
  rj: "Rio de Janeiro",
  mg: "Minas Gerais",
  rs: "Rio Grande do Sul",
  sc: "Santa Catarina",
  pr: "Paraná",
};`,
    `<Select items={REGIOES}>
  <SelectTrigger aria-label="Selecionar região">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Sudeste</SelectLabel>
      <SelectItem value="sp">São Paulo</SelectItem>
      <SelectItem value="rj">Rio de Janeiro</SelectItem>
      <SelectItem value="mg">Minas Gerais</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Sul</SelectLabel>
      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
      <SelectItem value="sc">Santa Catarina</SelectItem>
      <SelectItem value="pr">Paraná</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`,
  );
}

/**
 * Ícone dentro da opção. Ele é decorativo: o nome acessível continua sendo só o
 * rótulo, sem eco do ícone, e o tamanho vem da folha do componente — dimensionar
 * o SVG na marcação tiraria o ícone da escala do tema.
 */
export function selectComIconeSource(): string {
  return jsxSnippet(
    `${importarSelect(...PECAS_BASE)}
import { MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";

const CANAIS = {
  email: "E-mail",
  phone: "Telefone",
  chat: "Chat",
};`,
    `<Select items={CANAIS}>
  <SelectTrigger aria-label="Selecionar canal de contato">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="email">
      <MailIcon /> E-mail
    </SelectItem>
    <SelectItem value="phone">
      <PhoneIcon /> Telefone
    </SelectItem>
    <SelectItem value="chat">
      <MessageCircleIcon /> Chat
    </SelectItem>
  </SelectContent>
</Select>`,
  );
}

/**
 * Valor de partida. `defaultValue` é o caminho não controlado — quem guarda a
 * escolha é o componente. É aqui que o mapa `items` mais importa: a lista nunca
 * foi aberta, então o rótulo do campo fechado só pode vir dele.
 */
export function selectSelecionadoSource(): string {
  return jsxSnippet(
    `${importarSelect(...PECAS_BASE)}\n\n${MAPA}`,
    campo(' defaultValue="rj"'),
  );
}

/**
 * Bloqueado. `disabled` na RAIZ, e não só no gatilho: é a raiz que também
 * impede a abertura da lista por teclado.
 */
export function selectDesabilitadoSource(): string {
  return jsxSnippet(`${importarSelect(...PECAS_BASE)}\n\n${MAPA}`, campo(' disabled'));
}

/**
 * Erro. O anel destrutivo vem da folha compartilhada por `aria-invalid` — a
 * marcação não pinta nada. E o atributo sozinho não basta: sem a mensagem ao
 * lado, quem usa leitor de tela ouve "inválido" sem saber o que corrigir.
 */
export function selectInvalidoSource(): string {
  return jsxSnippet(
    `${importarSelect(...PECAS_BASE)}\n\n${MAPA}`,
    `<div className="nds-stack" data-spacing="sm">
${indentar(campo('', ' aria-label="Selecionar estado" aria-invalid="true"'))}
  <p className="nds-text-body nds-text-destructive">
    Selecione um estado para continuar.
  </p>
</div>`,
  );
}

/**
 * Densidade compacta. `size` mora no GATILHO — é ele que tem padding e texto —,
 * e a altura menor nasce do `padding-block`, nunca de uma altura cravada: o
 * campo precisa continuar crescendo com a fonte do navegador.
 */
export function selectCompactoSource(): string {
  return jsxSnippet(
    `${importarSelect(...PECAS_BASE)}\n\n${MAPA}`,
    campo('', ' size="sm" aria-label="Selecionar estado"'),
  );
}

/**
 * Escolha controlada de fora. O primitivo entrega `null` quando a seleção é
 * limpa, e é por isso que o estado externo normaliza o valor antes de guardá-lo
 * — um `null` no `value` reabre o campo em modo placeholder sem aviso.
 */
export function selectControladoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importarSelect(...PECAS_BASE)}

${MAPA}

const [estado, setEstado] = useState("");`,
    `<div className="nds-stack" data-spacing="md">
  <Select
    items={ESTADOS}
    value={estado}
    onValueChange={(valor) => setEstado(String(valor ?? ""))}
  >
    <SelectTrigger aria-label="Selecionar estado">
      <SelectValue placeholder="Selecione..." />
    </SelectTrigger>
    <SelectContent>
      {Object.entries(ESTADOS).map(([valor, rotulo]) => (
        <SelectItem key={valor} value={valor}>
          {rotulo}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="nds-text-body">
    Selecionado: <span className="nds-font-mono">{estado || "—"}</span>
  </p>
</div>`,
  );
}

/**
 * Dentro de um formulário. `name` é o que faz o valor viajar no `FormData`: o
 * primitivo mantém um campo escondido com esse nome, e a serialização nativa do
 * `<form>` enxerga só ele. Sem `name`, o envio sai sem o campo.
 */
export function selectEmFormularioSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importarSelect(...PECAS_BASE)}
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

${MAPA}

const [estado, setEstado] = useState("");`,
    `<form
  className="nds-stack"
  data-spacing="md"
  onSubmit={(evento) => evento.preventDefault()}
>
  <div className="nds-stack" data-spacing="sm">
    <Label htmlFor="estado">Estado</Label>
    <Select
      name="estado"
      items={ESTADOS}
      value={estado}
      onValueChange={(valor) => setEstado(String(valor ?? ""))}
    >
      <SelectTrigger id="estado" aria-label="Selecionar estado">
        <SelectValue placeholder="Selecione..." />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ESTADOS).map(([valor, rotulo]) => (
          <SelectItem key={valor} value={valor}>
            {rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  <Button type="submit" disabled={!estado}>
    Continuar
  </Button>
</form>`,
  );
}

/**
 * Rótulo visível ligado ao campo. `htmlFor` aponta para o `id` do GATILHO, que é
 * o elemento focável — apontar para a raiz deixaria o clique no rótulo sem
 * efeito. O `aria-label` fica junto por redundância; com rótulo visível ele
 * pode ser dispensado, desde que os dois textos digam a mesma coisa.
 */
export function selectComRotuloSource(): string {
  return jsxSnippet(
    `${importarSelect(...PECAS_BASE)}
import { Label } from "@/components/ui/label";

${MAPA}`,
    `<div className="nds-stack" data-spacing="sm">
  <Label htmlFor="estado-residencia">Estado de residência</Label>
${indentar(campo('', ' id="estado-residencia" aria-label="Estado de residência"'))}
  <p className="nds-text-caption nds-text-muted-foreground">
    Esse dado é usado apenas para cálculo de frete.
  </p>
</div>`,
  );
}
