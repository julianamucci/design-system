/**
 * Transforms do painel Code do InputOTP.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Nada do andaime das stories entra aqui: o `campo()` que as plays usam para
 * achar o `<input>` recortado, os `data-testid`, a segunda instância que a
 * story de erro monta só para COMPARAR bordas, e o `style` de reserva de altura
 * que existe para o exemplo caber no canvas centralizado. O que sobra é o que
 * alguém escreveria num formulário de verdade.
 */
import { attrBool, attrNum, attrsMultilinha, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type InputOTPArgs = {
  maxLength: number;
  disabled: boolean;
  autoFocus: boolean;
  onComplete: (value: string) => void;
};

const IMPORT = `import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'`;

/**
 * O miolo padrão: uma caixa por posição, vindas do escopo do slot.
 *
 * A lista de slots é do componente — escrever seis `<InputOTPSlot>` à mão só se
 * justifica quando os índices precisam ser separados em grupos, que é o caso do
 * separador.
 */
const CAIXAS = `<template #default="{ slots }">
  <InputOTPGroup>
    <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
  </InputOTPGroup>
</template>`;

/**
 * Campo completo: rótulo associado, estado ligado e o miolo de caixas.
 *
 * `:max-length` sai escrito SEMPRE, mesmo valendo o padrão de 6. Não é valor
 * padrão repetido por descuido: é o número de caixas, ou seja, a definição do
 * campo — e é a prop que já falhou em silêncio nesta stack, montando o campo
 * com zero caixas sem erro nenhum no console. Um snippet de OTP sem comprimento
 * ensina justamente o caminho desse defeito.
 *
 * `autocomplete="one-time-code"` e `inputmode` não são enfeite: o primeiro é o
 * que faz o sistema operacional oferecer o código recebido, o segundo é o
 * teclado que aparece no celular.
 */
function campoOtp(opcoes: {
  id: string;
  rotulo: string;
  modelo: string;
  comprimento?: number;
  teclado?: string;
  padraoAceito?: string;
  desabilitado?: boolean;
  foco?: boolean;
  invalido?: boolean;
  descritoPor?: string;
  miolo?: string;
  depois?: string[];
  espaco?: string;
}): string {
  const {
    id,
    rotulo,
    modelo,
    comprimento = 6,
    teclado = 'numeric',
    padraoAceito,
    desabilitado = false,
    foco = false,
    invalido = false,
    descritoPor,
    miolo = CAIXAS,
    depois = [],
    espaco = 'sm',
  } = opcoes;

  const cabeca = attrsMultilinha(
    [
      `id="${id}"`,
      `v-model="${modelo}"`,
      attrNum('max-length', comprimento),
      padraoAceito && `pattern="${padraoAceito}"`,
      attrBool('disabled', desabilitado, false),
      attrBool('auto-focus', foco, false),
      invalido && 'aria-invalid="true"',
      descritoPor && `aria-describedby="${descritoPor}"`,
      'autocomplete="one-time-code"',
      `inputmode="${teclado}"`,
    ],
    '  ',
    // Um campo de OTP nunca cabe numa linha: rótulo, comprimento, autocomplete
    // e teclado já são quatro atributos. O limite baixo mantém a fila sempre
    // quebrada, que é como o exemplo fica legível no painel.
    0,
  );

  const partes = [
    `<Label for="${id}">${rotulo}</Label>`,
    `<InputOTP${cabeca}>\n${indentar(miolo)}\n</InputOTP>`,
    ...depois,
  ];

  return `<div class="nds-stack" data-spacing="${espaco}">
${indentar(partes.join('\n'))}
</div>`;
}

/** Estado do campo, do lado de quem consome: uma `ref` com o valor digitado. */
function script(estado: string): string {
  return `import { ref } from 'vue'
${IMPORT}

${estado}`;
}

/**
 * Forma canônica: código de seis dígitos, rotulado, com o valor num `ref`.
 *
 * O `:key` composto que a story usa para remontar ao trocar os controls é
 * instrumento do Storybook — `max-length` e `auto-focus` só são lidos na
 * montagem —, e não entra no snippet. O `@complete` também fica de fora aqui:
 * o control é um espião do painel de ações, e o evento tem story própria.
 */
export const inputOtpSource: SourceTransform<InputOTPArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    script(`const codigo = ref('')`),
    campoOtp({
      id: 'codigo-verificacao',
      rotulo: 'Código de verificação',
      modelo: 'codigo',
      comprimento: typeof args.maxLength === 'number' ? args.maxLength : 6,
      desabilitado: args.disabled === true,
      foco: args.autoFocus === true,
    }),
  );
};

/** Seis dígitos: o formato dos códigos enviados por SMS ou email. */
export function inputOtpSeisDigitosSource(): string {
  return vueSnippet(
    script(`const codigo = ref('')`),
    campoOtp({
      id: 'codigo-sms',
      rotulo: 'Código enviado por SMS',
      modelo: 'codigo',
    }),
  );
}

/** PIN de quatro dígitos: carteira, conta, aplicativo travado. */
export function inputOtpQuatroDigitosSource(): string {
  return vueSnippet(
    script(`const pin = ref('')`),
    campoOtp({
      id: 'pin',
      rotulo: 'PIN do aplicativo',
      modelo: 'pin',
      comprimento: 4,
    }),
  );
}

/**
 * Dois blocos de três com um separador entre eles — o formato xxx-xxx dos
 * códigos de recuperação.
 *
 * Aqui os índices são escritos um a um, e não varridos do escopo do slot: é a
 * separação em grupos que pede isso, e o índice é o que liga cada caixa à sua
 * posição no valor.
 */
export function inputOtpComSeparadorSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const codigo = ref('')`,
    campoOtp({
      id: 'codigo-recuperacao',
      rotulo: 'Código de recuperação',
      modelo: 'codigo',
      miolo: `<template #default>
  <InputOTPGroup>
    <InputOTPSlot :index="0" />
    <InputOTPSlot :index="1" />
    <InputOTPSlot :index="2" />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot :index="3" />
    <InputOTPSlot :index="4" />
    <InputOTPSlot :index="5" />
  </InputOTPGroup>
</template>`,
    }),
  );
}

/**
 * Conjunto alfanumérico. Duas trocas juntas: o `pattern`, que é o que RECUSA o
 * caractere fora do conjunto, e o teclado, que passa a ser de texto. Sem o
 * `pattern` o `inputmode` seria só uma dica — num teclado físico a letra
 * entraria de qualquer jeito.
 */
export function inputOtpAlfanumericoSource(): string {
  return vueSnippet(
    script(`const codigo = ref('')`),
    campoOtp({
      id: 'codigo-autenticacao',
      rotulo: 'Código de autenticação',
      modelo: 'codigo',
      padraoAceito: '^[a-zA-Z0-9]+$',
      teclado: 'text',
    }),
  );
}

/** Vazio, com o campo já em foco: o estado de quem acabou de chegar na tela. */
export function inputOtpVazioSource(): string {
  return vueSnippet(
    script(`const codigo = ref('')`),
    campoOtp({
      id: 'codigo-verificacao',
      rotulo: 'Código de verificação',
      modelo: 'codigo',
      foco: true,
    }),
  );
}

/**
 * Parcialmente preenchido. O valor não é atributo: ele mora no estado, e o
 * componente o distribui pelas caixas da esquerda para a direita.
 */
export function inputOtpPreenchendoSource(): string {
  return vueSnippet(
    script(`const codigo = ref('123')`),
    campoOtp({
      id: 'codigo-verificacao',
      rotulo: 'Código de verificação',
      modelo: 'codigo',
    }),
  );
}

/** Completo: o valor preenche todas as caixas. */
export function inputOtpCompletoSource(): string {
  return vueSnippet(
    script(`const codigo = ref('482913')`),
    campoOtp({
      id: 'codigo-verificacao',
      rotulo: 'Código de verificação',
      modelo: 'codigo',
    }),
  );
}

/** Bloqueado: não aceita foco nem digitação, e o campo inteiro esmaece. */
export function inputOtpDesabilitadoSource(): string {
  return vueSnippet(
    script(`const codigo = ref('4829')`),
    campoOtp({
      id: 'codigo-verificacao',
      rotulo: 'Código de verificação',
      modelo: 'codigo',
      desabilitado: true,
    }),
  );
}

/**
 * Erro. `aria-invalid` é o que anuncia o estado e `aria-describedby` é o que
 * liga o campo à mensagem — a borda vermelha sozinha não alcança quem não
 * enxerga cor. A mensagem diz a causa e a ação corretiva.
 */
export function inputOtpComErroSource(): string {
  return vueSnippet(
    script(`const codigo = ref('482913')`),
    campoOtp({
      id: 'codigo-verificacao',
      rotulo: 'Código de verificação',
      modelo: 'codigo',
      invalido: true,
      descritoPor: 'codigo-erro',
      depois: [
        `<p id="codigo-erro" class="nds-text-caption nds-text-destructive">
  Código incorreto. Verifique e tente novamente.
</p>`,
      ],
    }),
  );
}

/** Rótulo visível associado ao campo — WCAG 3.3.2, instruções antes do controle. */
export function inputOtpWithLabelSource(): string {
  return vueSnippet(
    script(`const codigo = ref('')`),
    campoOtp({
      id: 'codigo-verificacao',
      rotulo: 'Código de verificação',
      modelo: 'codigo',
    }),
  );
}

/**
 * Texto auxiliar: de onde veio o código e quanto tempo ele dura. Visível não
 * basta — é o `aria-describedby` que o leva a quem usa leitor de tela.
 */
export function inputOtpWithHelperSource(): string {
  return vueSnippet(
    script(`const codigo = ref('')`),
    campoOtp({
      id: 'codigo-sms',
      rotulo: 'Código SMS',
      modelo: 'codigo',
      descritoPor: 'codigo-sms-apoio',
      depois: [
        '<p id="codigo-sms-apoio" class="nds-text-caption nds-text-muted-foreground">Enviamos por SMS, expira em 5 min.</p>',
      ],
    }),
  );
}

/**
 * Reenvio. O botão vem DEPOIS do campo na ordem do DOM: quem chega ao fim do
 * código encontra o reenvio no Tab seguinte, sem voltar pelo caminho. O rótulo
 * é verbo no infinitivo mais objeto, e não "clique aqui".
 */
export function inputOtpComReenvioSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${IMPORT}
import { Button } from '@/components/ui/button'

const codigo = ref('')`,
    campoOtp({
      id: 'codigo-verificacao',
      rotulo: 'Código de verificação',
      modelo: 'codigo',
      depois: [
        `<div class="nds-cluster" data-align="center" data-spacing="xs">
  <span class="nds-text-caption nds-text-muted-foreground">Não recebeu?</span>
  <Button variant="link" size="sm" type="button">Reenviar código</Button>
</div>`,
      ],
    }),
  );
}
