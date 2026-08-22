/**
 * Transforms do painel Code do Input.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 *
 * O rótulo aparece em todos os snippets de propósito: o campo sozinho não é
 * uso válido do design system, e o painel Code é copiado como está.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type InputArgs = {
  type: string;
  placeholder: string;
  disabled: boolean;
  'aria-invalid'?: 'true' | 'false';
};

const IMPORT = `import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`;

/**
 * Elemento auto-fechado: atributos em fila enquanto couberem, um por linha
 * depois. `indentacao` é a coluna do próprio elemento na marcação.
 */
function elemento(
  nome: string,
  partes: Array<string | false | null | undefined>,
  indentacao = '',
): string {
  const props = attrsMultilinha(partes, `${indentacao}  `, 68);
  return props.startsWith('\n') ? `<${nome}${props}${indentacao}/>` : `<${nome}${props} />`;
}

/** Par rótulo + campo, que é a unidade mínima de uso do Input. */
function campoRotulado(
  rotulo: string,
  id: string,
  partes: Array<string | false | null | undefined>,
): string {
  return `<div class="nds-stack" data-spacing="xs">
  <Label for="${id}">${rotulo}</Label>
  ${elemento('Input', [`id="${id}"`, ...partes], '  ')}
</div>`;
}

/** Forma canônica: o campo de texto sob o seu rótulo. Serve o Playground. */
export function inputSource(_gerado?: string, ctx?: { args?: Partial<InputArgs> }): string {
  const {
    type = 'text',
    placeholder = 'ex: João da Silva',
    disabled = false,
  } = ctx?.args ?? {};
  const invalido = ctx?.args?.['aria-invalid'];

  return svelteSnippet(
    IMPORT,
    campoRotulado('Nome completo', 'nome', [
      `type="${type}"`,
      placeholder ? `placeholder="${placeholder}"` : '',
      disabled ? 'disabled' : '',
      invalido === 'true' ? 'aria-invalid="true"' : '',
    ]),
  );
}

/** Tipo texto: o padrão, para nome, apelido e qualquer cadeia livre. */
export function inputTipoTextoSource(): string {
  return svelteSnippet(
    IMPORT,
    campoRotulado('Nome completo', 'nome', ['type="text"', 'placeholder="ex: João da Silva"']),
  );
}

/** Tipo email: teclado com arroba no celular e validação nativa do formato. */
export function inputTipoEmailSource(): string {
  return svelteSnippet(
    IMPORT,
    campoRotulado('Email', 'email', ['type="email"', 'placeholder="ex: joao@empresa.com"']),
  );
}

/** Tipo senha: o conteúdo digitado fica mascarado. */
export function inputTipoSenhaSource(): string {
  return svelteSnippet(
    IMPORT,
    campoRotulado('Senha', 'senha', ['type="password"', 'placeholder="••••••••"']),
  );
}

/** Tipo número: teclado numérico e controles de incremento do navegador. */
export function inputTipoNumeroSource(): string {
  return svelteSnippet(
    IMPORT,
    campoRotulado('Quantidade', 'quantidade', ['type="number"', 'placeholder="0"']),
  );
}

/** Tipo busca: muda o papel implícito para caixa de busca, e é isso que o leitor anuncia. */
export function inputTipoBuscaSource(): string {
  return svelteSnippet(
    IMPORT,
    campoRotulado('Buscar', 'busca', ['type="search"', 'placeholder="Buscar componentes..."']),
  );
}

/** Tipo arquivo: o botão nativo recebe estilo do design system, sem markup extra. */
export function inputTipoArquivoSource(): string {
  return svelteSnippet(IMPORT, campoRotulado('Arquivo', 'arquivo', ['type="file"']));
}

/**
 * Estado com texto de exemplo: o placeholder mostra o formato e nunca substitui
 * o rótulo. A marcação é a mesma do tipo email — o assunto aqui é o atributo.
 */
export function inputWithPlaceholderSource(): string {
  return inputTipoEmailSource();
}

/** Estado desabilitado: o campo esmaece e recusa foco e digitação. */
export function inputDesabilitadoSource(): string {
  return svelteSnippet(
    IMPORT,
    campoRotulado('Campo desabilitado', 'indisponivel', [
      'type="text"',
      'placeholder="Não disponível"',
      'disabled',
    ]),
  );
}

/** Estado de erro: `aria-invalid` marca o campo e a mensagem chega por `aria-describedby`. */
export function inputComErroSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
  <Label for="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="ex: joao@empresa.com"
    aria-invalid="true"
    aria-describedby="email-erro"
  />
  <p id="email-erro" class="nds-text-body nds-text-destructive">
    Email inválido. Use o formato nome@dominio.com
  </p>
</div>`,
  );
}

/** Estado com texto de apoio: a instrução é lida junto com o campo, não só vista. */
export function helperSourceInputWithText(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
  <Label for="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="ex: joao@empresa.com"
    aria-describedby="email-apoio"
  />
  <p id="email-apoio" class="nds-text-body">Use seu email corporativo.</p>
</div>`,
  );
}

/** Composição de senha: a política de senha vira apoio ligado ao campo. */
export function inputSenhaWithHelperSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
  <Label for="senha">Senha</Label>
  <Input
    id="senha"
    type="password"
    placeholder="••••••••"
    aria-describedby="senha-apoio"
  />
  <p id="senha-apoio" class="nds-text-body">
    Use letras maiúsculas, minúsculas e números.
  </p>
</div>`,
  );
}

/** Paleta escura: os três estados que dependem de token que troca de valor entre paletas. */
export function inputPaletaEscuraSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="md">
  <div class="nds-stack" data-spacing="xs">
    <Label for="padrao">Padrão</Label>
    <Input id="padrao" type="text" placeholder="ex: João da Silva" />
  </div>
  <div class="nds-stack" data-spacing="xs">
    <Label for="erro">Com erro</Label>
    <Input id="erro" type="email" aria-invalid="true" aria-describedby="erro-msg" />
    <p id="erro-msg" class="nds-text-body nds-text-destructive">Email inválido</p>
  </div>
  <div class="nds-stack" data-spacing="xs">
    <Label for="off">Desabilitado</Label>
    <Input id="off" type="text" placeholder="Não disponível" disabled />
  </div>
</div>`,
  );
}

const IMPORT_GRUPO = `import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";`;

/** Composição em grupo: os três alinhamentos do acessório em volta do mesmo campo. */
export function groupSourceInput(): string {
  return svelteSnippet(
    IMPORT_GRUPO,
    `<div class="nds-stack" data-spacing="lg">
  <div class="nds-stack" data-spacing="xs">
    <Label for="busca">Buscar</Label>
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput id="busca" type="search" placeholder="Buscar" />
    </InputGroup>
  </div>

  <div class="nds-stack" data-spacing="xs">
    <Label for="atalho">Atalho</Label>
    <InputGroup>
      <InputGroupInput id="atalho" placeholder="Comando" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>Ctrl+K</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  </div>

  <div class="nds-stack" data-spacing="xs">
    <Label for="assunto">Mensagem</Label>
    <InputGroup>
      <InputGroupAddon align="block-start">
        <InputGroupText>Para: suporte</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput id="assunto" placeholder="Assunto" />
    </InputGroup>
  </div>
</div>`,
  );
}

/** Composição em grupo com ação: o acessório leva o foco ao campo, o botão não. */
export function groupWithButtonSourceInput(): string {
  return svelteSnippet(
    `import X from "@lucide/svelte/icons/x";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";`,
    `<div class="nds-stack" data-spacing="xs">
  <Label for="usuario">Usuário</Label>
  <InputGroup>
    <InputGroupAddon align="inline-start">
      <InputGroupText>@</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput id="usuario" placeholder="nome.usuario" />
    <InputGroupAddon align="inline-end">
      <InputGroupButton type="button" size="icon-sm" aria-label="Limpar">
        <X aria-hidden="true" />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</div>`,
  );
}
