import { describe, expect, it } from 'vitest';
import {
  inputOtpAlfanumericoSource,
  inputOtpWithHelperSource,
  inputOtpWithErrorSource,
  inputOtpWithReenvioSource,
  inputOtpWithLabelSource,
  inputOtpWithSeparatorSource,
  inputOtpCompletoSource,
  inputOtpDisabledSource,
  inputOtpPreenchendoSource,
  inputOtpQuatroDigitosSource,
  inputOtpSeisDigitosSource,
  inputOtpSource,
  inputOtpEmptySource,
} from './input-otp.source';

const ALL = [
  inputOtpSource,
  inputOtpSeisDigitosSource,
  inputOtpQuatroDigitosSource,
  inputOtpWithSeparatorSource,
  inputOtpAlfanumericoSource,
  inputOtpEmptySource,
  inputOtpPreenchendoSource,
  inputOtpCompletoSource,
  inputOtpDisabledSource,
  inputOtpWithErrorSource,
  inputOtpWithLabelSource,
  inputOtpWithHelperSource,
  inputOtpWithReenvioSource,
];

describe('inputOtpSource', () => {
  it('sem args, entrega o campo de seis dígitos rotulado', () => {
    expect(inputOtpSource()).toBe(
      `<script setup lang="ts">
import { ref } from 'vue'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

const codigo = ref('')
</script>

<template>
  <div class="nds-stack" data-spacing="sm">
    <Label for="codigo-verificacao">Código de verificação</Label>
    <InputOTP
      id="codigo-verificacao"
      v-model="codigo"
      :max-length="6"
      autocomplete="one-time-code"
      inputmode="numeric"
    >
      <template #default="{ slots }">
        <InputOTPGroup>
          <InputOTPSlot v-for="(slot, index) in slots" :key="index" :index="index" />
        </InputOTPGroup>
      </template>
    </InputOTP>
  </div>
</template>`,
    );
  });

  it('o comprimento acompanha o control', () => {
    expect(inputOtpSource('', { args: { maxLength: 4 } })).toContain(':max-length="4"');
  });

  it('não escreve o desligado nem o foco quando estão no padrão', () => {
    const output = inputOtpSource('', { args: { disabled: false, autoFocus: false } });
    expect(output).not.toContain('disabled');
    expect(output).not.toContain('auto-focus');
  });

  it('liga bloqueio e foco inicial quando o control pede', () => {
    const output = inputOtpSource('', { args: { disabled: true, autoFocus: true } });
    expect(output).toContain('disabled');
    expect(output).toContain('auto-focus');
  });

  it('não copia o :key composto que a story usa para remontar', () => {
    // `max-length` e `auto-focus` só são lidos na montagem: o `:key` é
    // instrumento do Storybook, não parte do uso.
    expect(inputOtpSource('', { args: { maxLength: 8 } })).not.toContain(':key="String');
  });

  it('ignora control que não é número — o espião de ação vira ruído no painel', () => {
    const output = inputOtpSource('', {
      args: { maxLength: (() => {}) as never, onComplete: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    // Cai no comprimento padrão em vez de sumir com as caixas.
    expect(output).toContain(':max-length="6"');
  });
});

describe('contrato comum a todo snippet de OTP', () => {
  it('o comprimento vai SEMPRE escrito — é a definição do campo', () => {
    // A prop já falhou em silêncio nesta stack: caindo em `$attrs`, o campo
    // montava com zero caixas sem erro no console. Um snippet sem comprimento
    // ensina o caminho desse defeito.
    for (const fn of ALL) expect(fn()).toMatch(/:max-length="\d+"/);
  });

  it('todo campo pede o código de uso único ao sistema e escolhe o teclado', () => {
    for (const fn of ALL) {
      expect(fn()).toContain('autocomplete="one-time-code"');
      expect(fn()).toMatch(/inputmode="(numeric|text)"/);
    }
  });

  it('todo campo chega rotulado, e o for casa com o id', () => {
    for (const fn of ALL) {
      const output = fn();
      const target = /<Label for="([^"]+)">/.exec(output)?.[1];
      expect(target).toBeTruthy();
      expect(output).toContain(`id="${target}"`);
    }
  });

  it('nenhum snippet carrega andaime de story', () => {
    for (const fn of ALL) {
      const output = fn();
      // Reserva de altura para o exemplo caber no canvas centralizado.
      expect(output).not.toContain('style=');
      expect(output).not.toContain('min-height');
      // Ganchos das plays.
      expect(output).not.toContain('data-testid');
    }
  });
});

describe('transforms das stories de variante', () => {
  it('seis e quatro dígitos se distinguem só pelo comprimento', () => {
    expect(inputOtpSeisDigitosSource()).toContain(':max-length="6"');
    expect(inputOtpQuatroDigitosSource()).toContain(':max-length="4"');
  });

  it('o separador quebra o miolo em dois grupos de três índices nomeados', () => {
    const output = inputOtpWithSeparatorSource();
    expect([...output.matchAll(/<InputOTPGroup>/g)]).toHaveLength(2);
    expect(output).toContain('<InputOTPSeparator />');
    expect([...output.matchAll(/<InputOTPSlot :index="\d" \/>/g)]).toHaveLength(6);
    // O laço sobre o escopo do slot não separaria grupo nenhum.
    expect(output).not.toContain('v-for');
    expect(output).toContain(`import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'`);
  });

  it('o alfanumérico troca o conjunto aceito E o teclado', () => {
    const output = inputOtpAlfanumericoSource();
    // O `pattern` é o que RECUSA o caractere; o inputmode sozinho é só uma dica
    // de teclado de software, e num teclado físico a letra entraria.
    expect(output).toContain('pattern="^[a-zA-Z0-9]+$"');
    expect(output).toContain('inputmode="text"');
    // A constante da lib não é reexportada pelo design system: o padrão vai
    // literal, e o snippet não manda ninguém importar por fora.
    expect(output).not.toContain('REGEXP');
    expect(output).not.toContain('vue-input-otp');
  });
});

describe('transforms das stories de estado', () => {
  it('o valor mora no estado, não num atributo do campo', () => {
    expect(inputOtpEmptySource()).toContain(`const codigo = ref('')`);
    expect(inputOtpPreenchendoSource()).toContain(`const codigo = ref('123')`);
    expect(inputOtpCompletoSource()).toContain(`const codigo = ref('482913')`);
    expect(inputOtpCompletoSource()).not.toContain('value=');
  });

  it('só o estado vazio pede o foco inicial', () => {
    expect(inputOtpEmptySource()).toContain('auto-focus');
    expect(inputOtpPreenchendoSource()).not.toContain('auto-focus');
  });

  it('o desabilitado bloqueia o campo e mantém o valor já digitado', () => {
    const output = inputOtpDisabledSource();
    expect(output).toContain('disabled');
    expect(output).toContain(`const codigo = ref('4829')`);
  });

  it('o erro liga o campo à mensagem, e a mensagem existe no snippet', () => {
    const output = inputOtpWithErrorSource();
    expect(output).toContain('aria-invalid="true"');
    const target = /aria-describedby="([^"]+)"/.exec(output)?.[1];
    expect(output).toContain(`<p id="${target}"`);
    // Um campo só: a segunda instância da story existe para a play comparar
    // bordas, e é andaime de medição.
    expect([...output.matchAll(/<InputOTP\b/g)]).toHaveLength(1);
  });
});

describe('transforms das stories de composição', () => {
  it('o apoio é apontado pelo campo, e não é erro', () => {
    const output = inputOtpWithHelperSource();
    expect(output).toContain('aria-describedby="codigo-sms-apoio"');
    expect(output).toContain('<p id="codigo-sms-apoio"');
    expect(output).not.toContain('aria-invalid');
  });

  it('o reenvio vem DEPOIS do campo, e é botão de verdade', () => {
    const output = inputOtpWithReenvioSource();
    expect(output.indexOf('</InputOTP>')).toBeLessThan(output.indexOf('Reenviar código'));
    expect(output).toContain('<Button variant="link" size="sm" type="button">Reenviar código</Button>');
  });

  it('a composição com rótulo não inventa estado nem erro', () => {
    const output = inputOtpWithLabelSource();
    expect(output).not.toContain('aria-invalid');
    expect(output).not.toContain('aria-describedby');
    expect(output).not.toContain('auto-focus');
  });
});
