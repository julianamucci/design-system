/**
 * Transforms do painel Code do Input (campo simples) e do InputGroup (campo com
 * addons), que dividem o mesmo slug e os mesmos quatro arquivos de story.
 *
 * Módulo de TS puro — o `.tsx` só entraria por `import type`, que o compilador
 * apaga. É o que deixa estas funções rodarem no projeto `unit` do vitest, a
 * única guarda que elas têm: a saída do painel não chega ao DOM durante a
 * `play`.
 *
 * Duas regras valem para TODO snippet daqui:
 *
 * - O campo nunca aparece sem rótulo programático. `placeholder` some ao
 *   primeiro caractere e não é nome acessível — um exemplo com o placeholder
 *   fazendo as vezes do rótulo ensina o defeito.
 * - A largura vem de utilitário (`nds-w-xs`), nunca de um
 *   `style` com valor de design. E nada de `height`: a altura do campo é
 *   resultado de `padding-block` + `line-height`, que é o que o deixa crescer
 *   com a fonte do navegador (WCAG 1.4.4).
 */
import {
  attrs,
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propOption,
  propText,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

export type InputArgs = {
  type: string;
  placeholder: string;
  disabled: boolean;
  'aria-invalid': boolean;
};

/** Os tipos que os controls oferecem — control adulterado não vira atributo. */
const TIPOS = [
  'text',
  'email',
  'password',
  'number',
  'tel',
  'url',
  'search',
  'date',
  'file',
] as const;

const IMPORT_FIELD = 'import { Input } from "@/components/ui/input";';
const IMPORT_LABEL = 'import { Label } from "@/components/ui/label";';
const IMPORT_PAIR = `${IMPORT_FIELD}
${IMPORT_LABEL}`;

/** A coluna que segura rótulo e campo, com o respiro curto entre os dois. */
const COLUMN = '<div className="nds-stack nds-w-xs" data-spacing="xs">';

/**
 * Rótulo + campo: a unidade mínima que se copia de uma vez.
 *
 * A fila de atributos quebra numa linha por atributo quando passa do limite —
 * fila longa demais some na barra de rolagem do painel, e o que some é
 * justamente a parte que difere do exemplo anterior.
 */
function fieldLabelled(
  id: string,
  rotulo: string,
  atributos: Array<string | false | undefined>,
): string {
  const lista = [`id="${id}"`, ...atributos].filter(
    (parte): parte is string => Boolean(parte),
  );
  const inLine = lista.join(' ');
  const campo =
    inLine.length <= 60
      ? `  <Input${attrs(...lista)} />`
      : `  <Input${attrsMultilinha(lista, '    ', 0)}  />`;
  return jsxSnippet(
    IMPORT_PAIR,
    `${COLUMN}
  <Label htmlFor="${id}">${rotulo}</Label>
${campo}
</div>`,
  );
}

/**
 * Transform do `meta` — vale para as stories de Playground, tipos e estados.
 * Lê os controls quando existem; nos arquivos que os desligam cai no campo de
 * texto rotulado, que é o uso canônico.
 *
 * `type="text"` fica de fora por ser o padrão do HTML, e `aria-invalid={false}`
 * também: repetir valor padrão ensina ruído a quem copia. Ligar o erro no
 * control traz junto a mensagem — um `aria-describedby` apontando para um id
 * que o snippet não contém seria um exemplo que não é lido por ninguém.
 */
export const inputSource: SourceTransform<InputArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  if (args['aria-invalid'] === true) return inputWithErrorSource();
  return fieldLabelled('nome-completo', 'Nome completo', [
    propOption('type', args.type, TIPOS, 'text'),
    propText('placeholder', texto(args.placeholder) ?? 'ex: João da Silva'),
    propBool('disabled', args.disabled),
  ]);
};

/* ------------------------------------------------------------------ tipos -- */

/** Endereço de email: o teclado do celular muda e o navegador valida o formato. */
export function inputEmailSource(): string {
  return fieldLabelled('email', 'Email', [
    'type="email"',
    'placeholder="ex: joao@empresa.com"',
  ]);
}

/**
 * Senha: o navegador mascara o valor e oferece o gerenciador de senhas. O
 * placeholder aqui é só desenho — quem nomeia continua sendo o rótulo.
 */
export function inputSenhaSource(): string {
  return fieldLabelled('senha', 'Senha', ['type="password"', 'placeholder="••••••••"']);
}

/** Numérico: o papel implícito vira spinbutton, e é assim que é anunciado. */
export function inputNumberSource(): string {
  return fieldLabelled('quantidade', 'Quantidade', ['type="number"', 'placeholder="0"']);
}

/**
 * Busca: `type="search"` troca o papel implícito para searchbox, e nada no
 * visual denuncia se o tipo estiver errado — é só o leitor de tela que perde.
 */
export function inputSearchSource(): string {
  return fieldLabelled('busca', 'Buscar', [
    'type="search"',
    'placeholder="Buscar componentes..."',
  ]);
}

/**
 * Arquivo: sem `placeholder` de propósito — quem desenha o miolo é o navegador
 * (`::file-selector-button`), e o design system já pinta esse botão. Um texto
 * de exemplo aqui não apareceria em lugar nenhum.
 */
export function inputFileSource(): string {
  return fieldLabelled('arquivo', 'Arquivo', ['type="file"']);
}

/* ----------------------------------------------------------------- estados -- */

/** Bloqueado: `disabled` apaga o campo e troca o cursor pelo de bloqueio. */
export function inputDisabledSource(): string {
  return fieldLabelled('campo-bloqueado', 'Campo desabilitado', [
    'placeholder="Não disponível"',
    'disabled',
  ]);
}

/**
 * Erro. Duas peças, e as duas são obrigatórias: `aria-invalid` marca o campo
 * como inválido para o leitor de tela, e `aria-describedby` amarra a mensagem
 * ao campo — sem ele o texto vermelho existe só para quem enxerga. A cor da
 * borda vem sozinha de `[aria-invalid="true"]` no CSS.
 */
export function inputWithErrorSource(): string {
  return jsxSnippet(
    IMPORT_PAIR,
    `${COLUMN}
  <Label htmlFor="email-erro">Email</Label>
  <Input
    id="email-erro"
    type="email"
    placeholder="ex: joao@empresa.com"
    aria-invalid="true"
    aria-describedby="email-erro-msg"
  />
  <p id="email-erro-msg" className="nds-text-body nds-text-destructive">
    Email inválido. Use o formato nome@dominio.com
  </p>
</div>`,
  );
}

/**
 * Paleta escura: a marcação é a MESMA do tema claro — o que muda são os tokens
 * resolvidos no ancestral. Os três estados juntos porque o assunto é a
 * comparação entre eles; um campo sozinho não mostraria que padrão, erro e
 * bloqueado continuam distinguíveis no escuro.
 */
export function inputPaletteDarkSource(): string {
  return jsxSnippet(
    IMPORT_PAIR,
    `<div className="dark nds-stack nds-w-xs" data-spacing="md">
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="dk-padrao">Padrão</Label>
    <Input id="dk-padrao" placeholder="ex: João da Silva" />
  </div>
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="dk-erro">Com erro</Label>
    <Input
      id="dk-erro"
      type="email"
      aria-invalid="true"
      aria-describedby="dk-erro-msg"
    />
    <p id="dk-erro-msg" className="nds-text-body nds-text-destructive">
      Email inválido
    </p>
  </div>
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="dk-off">Desabilitado</Label>
    <Input id="dk-off" placeholder="Não disponível" disabled />
  </div>
</div>`,
  );
}

/* -------------------------------------------------------------- InputGroup -- */

/**
 * Bloco de import do grupo com só as peças que o exemplo usa. Importar a lista
 * inteira ensinaria uma dependência que aquele snippet não tem.
 */
function importGroup(...names: string[]): string {
  const lista = [...names].sort();
  if (lista.length === 1) return `import { ${lista[0]} } from "@/components/ui/input-group";`;
  return `import {
${lista.map((nome) => `  ${nome},`).join('\n')}
} from "@/components/ui/input-group";`;
}

/**
 * Monta o par rótulo + grupo. `InputGroupInput` substitui o `Input`: quem
 * desenha a moldura é o GRUPO, e o campo interno fica sem borda própria para
 * não aparecer uma linha dupla no meio.
 */
function groupLabelled(
  id: string,
  rotulo: string,
  miolo: string,
  ofGroup: string,
  deIcone = '',
): string {
  return jsxSnippet(
    [ofGroup, IMPORT_LABEL, deIcone].filter(Boolean).join('\n'),
    `${COLUMN}
  <Label htmlFor="${id}">${rotulo}</Label>
  <InputGroup>
${miolo}
  </InputGroup>
</div>`,
  );
}

/**
 * Transform do `meta` do arquivo de composições. O `component` daquele arquivo
 * é o InputGroup, não o Input: cair no campo simples deixaria o snippet padrão
 * ensinando outro componente. O ícone à esquerda é a forma canônica do grupo —
 * decorativo (`aria-hidden`), porque quem nomeia o campo é o rótulo.
 */
export const inputGroupSource: SourceTransform<InputArgs> = () =>
  groupLabelled(
    'busca',
    'Buscar',
    `    <InputGroupAddon align="inline-start">
      <Search aria-hidden="true" />
    </InputGroupAddon>
    <InputGroupInput id="busca" type="search" placeholder="Buscar componentes..." />`,
    importGroup('InputGroup', 'InputGroupAddon', 'InputGroupInput'),
    'import { Search } from "lucide-react";',
  );

/** Ícone no fim: o addon muda de lado por `align`, e a ordem no JSX acompanha. */
export function inputGroupIconEndSource(): string {
  return groupLabelled(
    'email',
    'Email',
    `    <InputGroupInput id="email" type="email" placeholder="ex: joao@empresa.com" />
    <InputGroupAddon align="inline-end">
      <Mail aria-hidden="true" />
    </InputGroupAddon>`,
    importGroup('InputGroup', 'InputGroupAddon', 'InputGroupInput'),
    'import { Mail } from "lucide-react";',
  );
}

/**
 * Prefixo em texto: `InputGroupText` é a peça para conteúdo textual dentro do
 * addon — ela carrega a cor esmaecida e o respiro que um ícone nu não tem.
 */
export function inputGroupPrefixoTextSource(): string {
  return groupLabelled(
    'usuario',
    'Usuário',
    `    <InputGroupAddon align="inline-start">
      <InputGroupText>@</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput id="usuario" placeholder="nome.usuario" />`,
    importGroup('InputGroup', 'InputGroupAddon', 'InputGroupInput', 'InputGroupText'),
  );
}

/**
 * Prefixo e sufixo ao mesmo tempo: a moldura continua sendo uma só, e é isso
 * que o exemplo prova. A unidade fica no addon, e não no placeholder, porque
 * placeholder some ao primeiro caractere digitado.
 */
export function inputGroupPrefixoESufixoSource(): string {
  return groupLabelled(
    'preco',
    'Preço',
    `    <InputGroupAddon align="inline-start">
      <InputGroupText>R$</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput id="preco" type="number" placeholder="0,00" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>BRL</InputGroupText>
    </InputGroupAddon>`,
    importGroup('InputGroup', 'InputGroupAddon', 'InputGroupInput', 'InputGroupText'),
  );
}

/**
 * Botão dentro do grupo: `InputGroupButton` já nasce fantasma e no tamanho do
 * miolo. O nome acessível vem de `aria-label`, porque o conteúdo é só um ícone
 * — e o ícone sai da árvore de acessibilidade para não duplicar o anúncio.
 */
export function inputGroupButtonInternoSource(): string {
  return groupLabelled(
    'busca-submit',
    'Buscar',
    `    <InputGroupInput id="busca-submit" type="search" placeholder="Buscar componentes..." />
    <InputGroupAddon align="inline-end">
      <InputGroupButton type="submit" aria-label="Buscar">
        <Search aria-hidden="true" />
      </InputGroupButton>
    </InputGroupAddon>`,
    importGroup('InputGroup', 'InputGroupAddon', 'InputGroupButton', 'InputGroupInput'),
    'import { Search } from "lucide-react";',
  );
}

/**
 * Alternar a exibição da senha. É a única composição do grupo com estado, e o
 * estado troca DUAS coisas ao mesmo tempo: o `type` do campo e o nome acessível
 * do botão. Trocar só o ícone deixaria quem usa leitor de tela sem saber o que
 * o botão passou a fazer.
 */
export function inputGroupSenhaSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importGroup('InputGroup', 'InputGroupAddon', 'InputGroupButton', 'InputGroupInput')}
${IMPORT_LABEL}
import { Eye, EyeOff } from "lucide-react";`,
    `const [visivel, setVisivel] = useState(false);

${COLUMN}
  <Label htmlFor="senha">Senha</Label>
  <InputGroup>
    <InputGroupInput
      id="senha"
      type={visivel ? "text" : "password"}
      placeholder="••••••••"
    />
    <InputGroupAddon align="inline-end">
      <InputGroupButton
        type="button"
        aria-label={visivel ? "Ocultar senha" : "Exibir senha"}
        onClick={() => setVisivel((atual) => !atual)}
      >
        {visivel ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</div>`,
  );
}

/**
 * Bloqueado: o `disabled` vai no CONTROLE, e o grupo inteiro esmaece pela
 * cascata. Marcar o contêiner apagaria o desenho sem impedir a digitação.
 */
export function inputGroupDisabledSource(): string {
  return groupLabelled(
    'grupo-bloqueado',
    'Campo desabilitado',
    `    <InputGroupAddon align="inline-start">
      <Search aria-hidden="true" />
    </InputGroupAddon>
    <InputGroupInput id="grupo-bloqueado" placeholder="Não disponível" disabled />`,
    importGroup('InputGroup', 'InputGroupAddon', 'InputGroupInput'),
    'import { Search } from "lucide-react";',
  );
}

/**
 * Erro dentro do grupo: as marcas de ARIA continuam no CONTROLE, não no
 * contêiner — é o campo que é inválido, e é ele que precisa apontar para a
 * mensagem. A borda de erro aparece na moldura por cascata.
 */
export function inputGroupWithErrorSource(): string {
  return jsxSnippet(
    `${importGroup('InputGroup', 'InputGroupAddon', 'InputGroupInput')}
${IMPORT_LABEL}
import { Mail } from "lucide-react";`,
    `${COLUMN}
  <Label htmlFor="email-grupo">Email</Label>
  <InputGroup>
    <InputGroupAddon align="inline-start">
      <Mail aria-hidden="true" />
    </InputGroupAddon>
    <InputGroupInput
      id="email-grupo"
      type="email"
      placeholder="ex: joao@empresa.com"
      aria-invalid="true"
      aria-describedby="email-grupo-msg"
    />
  </InputGroup>
  <p id="email-grupo-msg" className="nds-text-body nds-text-destructive">
    Email inválido. Use o formato nome@dominio.com
  </p>
</div>`,
  );
}

/**
 * Os três alinhamentos juntos, porque o assunto é a comparação entre eles: um
 * addon sozinho não mostraria que `block-start` empilha e os `inline-*` ficam
 * lado a lado. Quem posiciona é a propriedade `order` no CSS a partir de
 * `align` — não a ordem em que as peças aparecem no JSX.
 */
export function inputGroupAlinhamentosSource(): string {
  return jsxSnippet(
    `${importGroup('InputGroup', 'InputGroupAddon', 'InputGroupInput', 'InputGroupText')}
${IMPORT_LABEL}
import { Search } from "lucide-react";`,
    `<div className="nds-stack nds-w-md" data-spacing="lg">
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="ig-inicio">Buscar</Label>
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput id="ig-inicio" type="search" placeholder="Buscar" />
    </InputGroup>
  </div>

  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="ig-fim">Atalho</Label>
    <InputGroup>
      <InputGroupInput id="ig-fim" placeholder="Comando" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>Ctrl+K</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  </div>

  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="ig-bloco">Mensagem</Label>
    <InputGroup>
      <InputGroupAddon align="block-start">
        <InputGroupText>Para: suporte</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput id="ig-bloco" placeholder="Assunto" />
    </InputGroup>
  </div>
</div>`,
  );
}

/**
 * Clique no addon. Não há prop nenhuma para ligar: o `InputGroupAddon` já leva
 * o foco ao campo quando o alvo não é um botão — a área toda parece o campo, e
 * quem mira o "@" espera começar a digitar. O botão ao lado é o que prova a
 * exceção: apertá-lo NÃO devolve o foco ao campo.
 */
export function addonInputGroupClickSource(): string {
  return groupLabelled(
    'ig-clique',
    'Usuário',
    `    <InputGroupAddon align="inline-start">
      <InputGroupText>@</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput id="ig-clique" placeholder="nome.usuario" />
    <InputGroupAddon align="inline-end">
      <InputGroupButton type="button" aria-label="Limpar">
        <X aria-hidden="true" />
      </InputGroupButton>
    </InputGroupAddon>`,
    importGroup(
      'InputGroup',
      'InputGroupAddon',
      'InputGroupButton',
      'InputGroupInput',
      'InputGroupText',
    ),
    'import { X } from "lucide-react";',
  );
}
