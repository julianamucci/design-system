import { describe, expect, it } from 'vitest';
import {
  inputAddonWithButtonSource,
  inputAlinhamentosSource,
  inputWithHelperSource,
  inputComErroSource,
  inputWithLabelSource,
  inputDesabilitadoSource,
  inputObrigatorioSource,
  inputPaletaEscuraSource,
  inputSource,
  inputTipoArquivoSource,
  inputTipoBuscaSource,
  inputTipoEmailSource,
  inputTipoNumeroSource,
  inputTipoSenhaSource,
  inputTipoTextoSource,
} from './input.source';

describe('inputSource', () => {
  it('sem args, entrega o campo rotulado na forma canônica', () => {
    expect(inputSource()).toBe(
      `<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
</script>

<template>
  <div class="nds-stack nds-w-xs" data-spacing="xs">
    <Label for="nome-completo">Nome completo</Label>
    <Input id="nome-completo" placeholder="ex: João da Silva" />
  </div>
</template>`,
    );
  });

  it('o id do campo e o for do rótulo são o MESMO valor', () => {
    // Um `for` apontando para id inexistente passa em checagem de atributo e
    // não associa nada: o clique não leva o foco e o leitor não anuncia.
    const saida = inputSource();
    const ids = [...saida.matchAll(/(?:for|id)="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(1);
  });

  it('não repete o tipo padrão do HTML', () => {
    expect(inputSource('', { args: { type: 'text' } })).not.toContain('type=');
  });

  it('escreve o tipo quando o control o tira de text', () => {
    expect(inputSource('', { args: { type: 'email' } })).toContain('type="email"');
  });

  it('desabilita sem escrever o padrão ligado', () => {
    expect(inputSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(inputSource('', { args: { disabled: true } })).toContain(' disabled />');
  });

  it('ignora control que não é string — o espião vira ruído no painel', () => {
    const saida = inputSource('', {
      args: { placeholder: (() => {}) as never, type: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('type=');
    expect(saida).toContain('placeholder="ex: João da Silva"');
  });
});

describe('transforms das stories de tipo', () => {
  it('cada tipo sai escrito à vista, porque o atributo é o assunto', () => {
    expect(inputTipoTextoSource()).toContain('type="text"');
    expect(inputTipoEmailSource()).toContain('type="email"');
    expect(inputTipoSenhaSource()).toContain('type="password"');
    expect(inputTipoNumeroSource()).toContain('type="number"');
    expect(inputTipoBuscaSource()).toContain('type="search"');
    expect(inputTipoArquivoSource()).toContain('type="file"');
  });

  it('o campo de arquivo não inventa marcador — quem desenha o miolo é o navegador', () => {
    expect(inputTipoArquivoSource()).not.toContain('placeholder');
  });

  it('todo tipo chega rotulado — o campo não tem nome acessível próprio', () => {
    for (const fn of [
      inputTipoTextoSource,
      inputTipoEmailSource,
      inputTipoSenhaSource,
      inputTipoNumeroSource,
      inputTipoBuscaSource,
      inputTipoArquivoSource,
    ]) {
      const saida = fn();
      expect(saida).toContain('<Label for=');
      const ids = [...saida.matchAll(/(?:for|id)="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size).toBe(1);
    }
  });

  it('cada tipo traz o rótulo do seu próprio domínio, não um genérico repetido', () => {
    const rotulos = [
      inputTipoTextoSource,
      inputTipoEmailSource,
      inputTipoSenhaSource,
      inputTipoNumeroSource,
      inputTipoBuscaSource,
      inputTipoArquivoSource,
    ].map((fn) => /<Label for="[^"]+">([^<]+)<\/Label>/.exec(fn())?.[1]);
    expect(new Set(rotulos).size).toBe(rotulos.length);
  });
});

describe('transforms das stories de estado', () => {
  it('o estado de repouso não escreve foco nem valor', () => {
    const saida = inputWithLabelSource();
    // Focar é interação: não há atributo a escrever, e inventar um ensinaria
    // uma prop que não existe.
    expect(saida).not.toContain('autofocus');
    expect(saida).not.toContain('aria-invalid');
  });

  it('o desabilitado mantém o rótulo visível e associado', () => {
    const saida = inputDesabilitadoSource();
    expect(saida).toContain('<Label for="campo-indisponivel">Campo desabilitado</Label>');
    expect(saida).toContain(' disabled />');
  });

  it('o erro liga o campo à mensagem, e a mensagem existe no snippet', () => {
    const saida = inputComErroSource();
    expect(saida).toContain('aria-invalid="true"');
    const alvo = /aria-describedby="([^"]+)"/.exec(saida)?.[1];
    expect(alvo).toBeTruthy();
    // O alvo do describedby precisa EXISTIR: um id que não aponta para nada
    // passa em asserção de atributo e não é lido por ninguém.
    expect(saida).toContain(`<p id="${alvo}"`);
  });

  it('a paleta escura mostra os três estados e não escreve tema na marcação', () => {
    const saida = inputPaletaEscuraSource();
    expect([...saida.matchAll(/<Input /g)]).toHaveLength(3);
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain(' disabled />');
    // Escrever `.dark` no snippet ensinaria a prender a paleta ao componente.
    expect(saida).not.toContain('dark');
  });
});

describe('transforms das stories de composição', () => {
  it('o texto de apoio é apontado pelo campo, não só exibido', () => {
    const saida = inputWithHelperSource();
    expect(saida).toContain('aria-describedby="email-apoio"');
    expect(saida).toContain('<p id="email-apoio"');
    // Apoio não é erro: nada de aria-invalid nesta composição.
    expect(saida).not.toContain('aria-invalid');
  });

  it('o obrigatório anuncia por ARIA e tira o asterisco da leitura', () => {
    const saida = inputObrigatorioSource();
    expect(saida).toContain('aria-required="true"');
    expect(saida).toContain('<span class="nds-text-destructive" aria-hidden="true">*</span>');
  });

  it('nos alinhamentos, a moldura é do GRUPO e o campo interno vai nu', () => {
    const saida = inputAlinhamentosSource();
    expect(saida).toContain('align="inline-start"');
    expect(saida).toContain('align="inline-end"');
    expect(saida).toContain('align="block-start"');
    // Nenhum `<Input>` solto: dentro do grupo quem entra é o campo do grupo,
    // senão apareceria uma borda dupla no meio.
    expect(saida).not.toContain('<Input ');
    expect([...saida.matchAll(/<InputGroupInput /g)]).toHaveLength(3);
  });

  it('os data-testid da story não vazam para o snippet', () => {
    // São ganchos da play, não parte da composição.
    expect(inputAlinhamentosSource()).not.toContain('data-testid');
    expect(inputAddonWithButtonSource()).not.toContain('data-testid');
  });

  it('o botão do acessório tem nome próprio e o ícone sai da leitura', () => {
    const saida = inputAddonWithButtonSource();
    expect(saida).toContain('<InputGroupButton type="button" size="icon-sm" aria-label="Limpar">');
    expect(saida).toContain('<XIcon aria-hidden="true" />');
    // Sem `type="button"` o mesmo gatilho dentro de um formulário o enviaria.
    expect(saida).toContain('type="button"');
  });
});
