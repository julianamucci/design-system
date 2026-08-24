/**
 * Transforms do painel Code do InputOTP.
 *
 * Módulo de TS puro — o `.tsx` só entraria por `import type`, que o compilador
 * apaga. É o que deixa estas funções rodarem no projeto `unit` do vitest, a
 * única guarda que elas têm: a saída do painel não chega ao DOM durante a
 * `play`.
 *
 * Aqui o defeito era literal: as stories chamam `campo(canvasElement)`, uma
 * fixture que só existe no repositório de testes, e o painel imprimia a chamada
 * como se fosse API do design system.
 *
 * Três coisas valem para TODO snippet daqui:
 *
 * - O componente é CONTROLADO. Sem `value`/`onChange` as caixas ficam vazias e
 *   parece defeito do componente, então o estado entra no snippet.
 * - `autoComplete="one-time-code"` é o que faz o sistema operacional oferecer o
 *   código que acabou de chegar por SMS, e `inputMode` é o que escolhe o
 *   teclado do celular. Os dois são o motivo de existir do componente.
 * - O `<input>` real fica recortado atrás das caixas, então quem dá nome
 *   acessível é o `Label` ligado pelo `htmlFor` ↔ `id`.
 */
import { jsxSnippet, propNumber, type SourceTransform } from '@/lib/story-source';

export type InputOtpArgs = {
  maxLength: number;
  disabled: boolean;
  autoFocus: boolean;
  onComplete: (value: string) => void;
};

const IMPORT_BASE = `import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";`;

/** Quantas caixas o exemplo mostra quando o control não diz outra coisa. */
const DEFAULT = 6;

/**
 * Um campo de código completo: coluna, rótulo, estado e uma caixa por dígito.
 *
 * `attrs` já vem indentado para dentro da tag — é onde cada exemplo põe o
 * que o diferencia (comprimento, bloqueio, marcas de erro).
 */
function otpSnippet({
  id,
  label,
  boxes,
  attrs,
  valueInitial = '',
  imports = IMPORT_BASE,
  depois = '',
}: {
  id: string;
  label: string;
  boxes: number;
  attrs: string[];
  valueInitial?: string;
  imports?: string;
  depois?: string;
}): string {
  const lines = attrs.map((atributo) => `    ${atributo}`).join('\n');
  return jsxSnippet(
    imports,
    `const [codigo, setCodigo] = useState("${valueInitial}");

<div className="nds-stack" data-spacing="sm">
  <Label htmlFor="${id}">${label}</Label>
  <InputOTP
    id="${id}"
${lines}
    value={codigo}
    onChange={setCodigo}
    autoComplete="one-time-code"
    inputMode="numeric"
  >
    <InputOTPGroup>
      {Array.from({ length: ${boxes} }).map((_, indice) => (
        <InputOTPSlot key={indice} index={indice} />
      ))}
    </InputOTPGroup>
  </InputOTP>${depois}
</div>`,
  );
}

/**
 * Transform do `meta` — vale para todas as stories dos quatro arquivos do
 * InputOTP. Lê os controls do Playground; nas stories sem args cai no código de
 * seis dígitos, que é o formato mais comum de SMS e email.
 *
 * `onComplete` NÃO é interpolado a partir dos args: o Storybook entrega um
 * espião ali, e interpolá-lo despejaria o corpo do mock no painel. O que entra
 * é a composição real, com o valor completo chegando por parâmetro.
 */
export const inputOtpSource: SourceTransform<InputOtpArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const boxes =
    typeof args.maxLength === 'number' && Number.isFinite(args.maxLength)
      ? args.maxLength
      : DEFAULT;
  return otpSnippet({
    id: 'codigo-verificacao',
    label: 'Código de verificação',
    boxes,
    attrs: [
      propNumber('maxLength', boxes) ?? `maxLength={${DEFAULT}}`,
      ...(args.disabled === true ? ['disabled'] : []),
      ...(args.autoFocus === true ? ['autoFocus'] : []),
      'onComplete={(valor) => verificarCodigo(valor)}',
    ],
  });
};

/* -------------------------------------------------------------- variantes -- */

/**
 * PIN de quatro dígitos. `maxLength` e a contagem de caixas são o MESMO número
 * — declarar seis slots num campo de quatro deixa duas caixas mortas na tela.
 */
export function inputOtpQuatroDigitosSource(): string {
  return otpSnippet({
    id: 'pin',
    label: 'PIN do aplicativo',
    boxes: 4,
    attrs: ['maxLength={4}'],
  });
}

/**
 * Formato xxx-xxx. Os índices são explícitos porque a divisão em dois blocos é
 * de LEITURA, não de valor: o campo continua sendo um só, com seis posições
 * contínuas. O separador tem `role="separator"` próprio, que é o que informa a
 * quebra a quem usa leitor de tela.
 */
export function inputOtpWithSeparatorSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";`,
    `const [codigo, setCodigo] = useState("");

<div className="nds-stack" data-spacing="sm">
  <Label htmlFor="codigo-recuperacao">Código de recuperação</Label>
  <InputOTP
    id="codigo-recuperacao"
    maxLength={6}
    value={codigo}
    onChange={setCodigo}
    autoComplete="one-time-code"
    inputMode="numeric"
  >
    <InputOTPGroup>
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} />
      <InputOTPSlot index={2} />
    </InputOTPGroup>
    <InputOTPSeparator />
    <InputOTPGroup>
      <InputOTPSlot index={3} />
      <InputOTPSlot index={4} />
      <InputOTPSlot index={5} />
    </InputOTPGroup>
  </InputOTP>
</div>`,
  );
}

/**
 * Alfanumérico. O componente recusa tudo que não for dígito por padrão, então
 * aceitar letra exige trocar o `pattern` — e o `inputMode` acompanha, senão o
 * celular abre o teclado numérico para um código que tem letras.
 */
export function inputOtpAlfanumericoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";`,
    `const [codigo, setCodigo] = useState("");

<div className="nds-stack" data-spacing="sm">
  <Label htmlFor="codigo-auth">Código de autenticação</Label>
  <InputOTP
    id="codigo-auth"
    maxLength={6}
    value={codigo}
    onChange={setCodigo}
    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
    autoComplete="one-time-code"
    inputMode="text"
  >
    <InputOTPGroup>
      {Array.from({ length: 6 }).map((_, indice) => (
        <InputOTPSlot key={indice} index={indice} />
      ))}
    </InputOTPGroup>
  </InputOTP>
</div>`,
  );
}

/* ---------------------------------------------------------------- estados -- */

/**
 * Vazio com o cursor já posto. `autoFocus` cabe aqui porque a tela inteira
 * existe para receber o código — numa tela com outros campos ele roubaria o
 * foco de quem navega por teclado.
 */
export function inputOtpEmptySource(): string {
  return otpSnippet({
    id: 'codigo-vazio',
    label: 'Código de verificação',
    boxes: DEFAULT,
    attrs: ['maxLength={6}', 'autoFocus'],
  });
}

/**
 * Preenchendo: o valor inicial é o assunto, e ele se distribui da esquerda para
 * a direita sozinho — não existe prop de caixa em caixa.
 */
export function inputOtpPreenchendoSource(): string {
  return otpSnippet({
    id: 'codigo-parcial',
    label: 'Código de verificação',
    boxes: DEFAULT,
    attrs: ['maxLength={6}'],
    valueInitial: '123',
  });
}

/** Completo: as seis posições ocupadas, que é quando `onComplete` dispara. */
export function inputOtpCompletoSource(): string {
  return otpSnippet({
    id: 'codigo-completo',
    label: 'Código de verificação',
    boxes: DEFAULT,
    attrs: ['maxLength={6}', 'onComplete={(valor) => verificarCodigo(valor)}'],
    valueInitial: '482913',
  });
}

/** Bloqueado: `disabled` recusa foco e digitação, e esmaece o campo inteiro. */
export function inputOtpDisabledSource(): string {
  return otpSnippet({
    id: 'codigo-bloqueado',
    label: 'Código de verificação',
    boxes: DEFAULT,
    attrs: ['maxLength={6}', 'disabled'],
    valueInitial: '4829',
  });
}

/**
 * Erro. `aria-invalid` marca o campo para o leitor de tela e troca a cor da
 * borda das caixas por cascata; `aria-describedby` amarra a mensagem ao campo.
 * A mensagem NÃO leva `role="alert"`: ela já está no DOM quando a página
 * carrega, e uma live region em conteúdo estático faz o leitor anunciar um erro
 * sem que nada tenha acontecido.
 */
export function inputOtpWithErrorSource(): string {
  return otpSnippet({
    id: 'codigo-erro',
    label: 'Código de verificação',
    boxes: DEFAULT,
    attrs: [
      'maxLength={6}',
      'aria-invalid="true"',
      'aria-describedby="codigo-erro-msg"',
    ],
    valueInitial: '482913',
    depois: `
  <p id="codigo-erro-msg" className="nds-text-caption nds-text-destructive">
    Código incorreto. Verifique e tente novamente.
  </p>`,
  });
}

/* ------------------------------------------------------------ composições -- */

/**
 * Texto auxiliar: de onde o código veio e quanto tempo dura. Vale ligá-lo por
 * `aria-describedby` — a informação é útil antes de digitar, e sem a ligação
 * ela só existe para quem enxerga a tela.
 */
export function inputOtpWithTextAuxiliarSource(): string {
  return otpSnippet({
    id: 'codigo-ajuda',
    label: 'Código de verificação',
    boxes: DEFAULT,
    attrs: ['maxLength={6}', 'aria-describedby="codigo-ajuda-texto"'],
    depois: `
  <p id="codigo-ajuda-texto" className="nds-text-caption nds-text-muted-foreground">
    Enviamos por SMS, expira em 5 min.
  </p>`,
  });
}

/**
 * Com reenvio. O botão vem DEPOIS do campo na ordem do DOM: quem termina de
 * digitar encontra o reenvio no próximo Tab, sem voltar pelo caminho. É ordem
 * de marcação, não de posição na tela.
 */
export function inputOtpWithReenvioSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";`,
    `const [codigo, setCodigo] = useState("");

<div className="nds-stack" data-spacing="sm">
  <div className="nds-stack" data-spacing="sm">
    <Label htmlFor="codigo-reenvio">Código de verificação</Label>
    <InputOTP
      id="codigo-reenvio"
      maxLength={6}
      value={codigo}
      onChange={setCodigo}
      autoComplete="one-time-code"
      inputMode="numeric"
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }).map((_, indice) => (
          <InputOTPSlot key={indice} index={indice} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  </div>
  <div className="nds-cluster" data-spacing="sm" data-align="center">
    <span className="nds-text-caption nds-text-muted-foreground">Não recebeu?</span>
    <Button variant="link" size="sm" type="button">
      Reenviar código
    </Button>
  </div>
</div>`,
  );
}
