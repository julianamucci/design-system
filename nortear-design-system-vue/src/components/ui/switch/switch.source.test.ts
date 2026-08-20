import { describe, expect, it } from 'vitest';
import {
  switchComDescricaoSource,
  switchCompactoSource,
  switchDesabilitadoSource,
  switchDesligadoSource,
  switchEmFormularioSource,
  switchInvalidoSource,
  switchItemDeMenuSource,
  switchLigadoSource,
  switchListaDePreferenciasSource,
  switchPadraoSource,
  switchPainelDeConfiguracoesSource,
  switchSource,
} from './switch.source';

describe('switchSource', () => {
  it('sem args, entrega o par mínimo: controle e rótulo vinculados pelo id', () => {
    expect(switchSource()).toBe(
      `<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
</script>

<template>
  <div class="nds-cluster" data-spacing="sm">
    <Switch id="notificacoes" />
    <Label for="notificacoes">Receber notificações por email</Label>
  </div>
</template>`,
    );
  });

  it('o nome do campo entra como veio do control', () => {
    expect(switchSource('', { args: { name: 'alertas' } })).toContain(
      '<Switch id="notificacoes" name="alertas" />',
    );
  });

  it('o degrau padrão não é escrito, o compacto é', () => {
    expect(switchSource('', { args: { size: 'default' } })).not.toContain('size=');
    expect(switchSource('', { args: { size: 'sm' } })).toContain('size="sm"');
  });

  it('os booleanos só aparecem quando desligam do padrão', () => {
    const desligados = switchSource('', {
      args: { defaultValue: false, disabled: false, required: false },
    });
    expect(desligados).not.toContain('default-value');
    expect(desligados).not.toContain('disabled');
    expect(desligados).not.toContain('required');

    const ligados = switchSource('', {
      args: { defaultValue: true, disabled: true, required: true },
    });
    expect(ligados).toContain('<Switch id="notificacoes" default-value required disabled />');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = switchSource('', { args: { name: (() => {}) as never } });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('name=');
  });
});

describe('transforms das stories de variante', () => {
  it('a padrão é o par mínimo, sem nem o nome de campo', () => {
    expect(switchPadraoSource()).toContain('<Switch id="notificacoes" />');
    expect(switchPadraoSource()).not.toContain('name=');
  });

  it('com descrição, o parágrafo fica FORA do rótulo', () => {
    const saida = switchComDescricaoSource();
    // Dentro do Label, o parágrafo viraria parte do nome acessível do controle.
    expect(saida).toContain('<Label for="marketing">Emails de marketing</Label>');
    expect(saida).toContain(
      '<p class="nds-text-body">Receba novidades e promoções da plataforma.</p>',
    );
    expect(saida).toContain('data-justify="between"');
  });

  it('o compacto mostra os DOIS degraus — a comparação é o assunto', () => {
    const saida = switchCompactoSource();
    expect(saida).toContain('<Switch id="tamanho-padrao" />');
    expect(saida).toContain('<Switch id="tamanho-compacto" size="sm" />');
    expect([...saida.matchAll(/<Switch /g)]).toHaveLength(2);
  });
});

describe('transforms das stories de estado', () => {
  it('o repouso não escreve prop nenhuma — o switch nasce desligado', () => {
    const saida = switchDesligadoSource();
    expect(saida).toContain('<Switch id="notificacoes" />');
    expect(saida).not.toContain('default-value');
  });

  it('o ligado parte de `default-value`, que é prop de montagem', () => {
    expect(switchLigadoSource()).toContain('<Switch id="notificacoes" default-value />');
    // `modelValue` é a via controlada; misturar as duas no mesmo exemplo ensina
    // um estado que briga consigo mesmo.
    expect(switchLigadoSource()).not.toContain('v-model');
  });

  it('o desabilitado escreve só `disabled`', () => {
    expect(switchDesabilitadoSource()).toContain('<Switch id="notificacoes" disabled />');
  });

  it('o inválido aponta para a mensagem, e a mensagem tem o id apontado', () => {
    const saida = switchInvalidoSource();
    expect(saida).toContain('aria-invalid="true" aria-describedby="aceitar-termos-erro"');
    expect(saida).toContain('<p id="aceitar-termos-erro"');
    expect(saida).toContain('nds-border-destructive');
  });
});

describe('transforms das stories de composição', () => {
  it('o painel dá a cada linha um id próprio — ids repetidos quebram o vínculo', () => {
    const saida = switchPainelDeConfiguracoesSource();
    const ids = [...saida.matchAll(/<Switch id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
    // Duas linhas nascem ligadas e uma desligada, como o painel demonstra.
    expect([...saida.matchAll(/default-value/g)]).toHaveLength(2);
  });

  it('a lista de preferências é lista de verdade, e só as linhas seguintes têm régua', () => {
    const saida = switchListaDePreferenciasSource();
    expect(saida).toContain('<ul class="nds-w-sm nds-rounded-lg nds-border-default">');
    expect([...saida.matchAll(/<li /g)]).toHaveLength(3);
    // A régua separa; acima da primeira linha não há o que separar.
    expect([...saida.matchAll(/nds-border-t/g)]).toHaveLength(2);
    expect(saida).not.toContain('nds-text-body');
  });

  it('no formulário é o `name` que faz o campo ser enviado', () => {
    const saida = switchEmFormularioSource();
    expect(saida).toContain('name="perfil-publico"');
    expect(saida).toContain(`import { Input } from '@/components/ui/input'`);
    expect(saida).toContain(`import { Button } from '@/components/ui/button'`);
    expect(saida).toContain('<Button type="submit">Salvar preferências</Button>');
  });

  it('o item de menu põe o degrau compacto em todas as linhas, rótulo incluso', () => {
    const saida = switchItemDeMenuSource();
    expect([...saida.matchAll(/size="sm"/g)]).toHaveLength(3);
    expect([...saida.matchAll(/nds-text-caption/g)]).toHaveLength(3);
  });
});
