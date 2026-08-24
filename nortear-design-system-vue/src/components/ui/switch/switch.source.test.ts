import { describe, expect, it } from 'vitest';
import {
  switchWithDescriptionSource,
  switchCompactoSource,
  switchDisabledSource,
  switchDesligadoSource,
  formSwitchSource,
  switchInvalidoSource,
  switchSemRotuloSource,
  switchLigadoSource,
  switchControlledSource,
  switchDefaultSource,
  configSwitchPanelSource,
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
    <Label for="notificacoes">Receber notificações</Label>
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
    expect(switchDefaultSource()).toContain('<Switch id="notificacoes" />');
    expect(switchDefaultSource()).not.toContain('name=');
  });

  it('com descrição, o parágrafo fica FORA do rótulo', () => {
    const saida = switchWithDescriptionSource();
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
    expect(switchDisabledSource()).toContain('<Switch id="notificacoes" disabled />');
  });

  it('o inválido aponta para a mensagem, e a mensagem tem o id apontado', () => {
    const saida = switchInvalidoSource();
    expect(saida).toContain('aria-invalid="true" aria-describedby="aceitar-termos-erro"');
    expect(saida).toContain('<p id="aceitar-termos-erro"');
    expect(saida).toContain('nds-border-destructive');
  });
});

describe('transforms das stories de composição', () => {
  it('a lista dá a cada painel um id próprio — ids repetidos quebram o vínculo', () => {
    const saida = configSwitchPanelSource();
    const ids = [...saida.matchAll(/<Switch id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
    // Uma preferência nasce ligada e duas desligadas, como a lista demonstra.
    expect([...saida.matchAll(/default-value/g)]).toHaveLength(1);
    expect(saida).toContain('Preferências de notificação');
  });

  it('a descrição de cada painel fica FORA do rótulo', () => {
    // Dentro do `Label` ela entraria no nome acessível, e quem usa leitor de
    // tela ouviria a frase inteira a cada passagem pelo controle.
    const saida = configSwitchPanelSource();
    expect(saida).not.toMatch(/<Label[^>]*>[^<]*Resumo semanal/);
    expect(saida).toContain('<p class="nds-text-body">Resumo semanal sobre o produto.</p>');
  });

  it('no formulário é o `name` que faz o campo ser enviado', () => {
    const saida = formSwitchSource();
    expect(saida).toContain('name="newsletter"');
    expect(saida).toContain(`import { Button } from '@/components/ui/button'`);
    expect(saida).toContain('<Button type="submit">Salvar preferências</Button>');
  });

  it('sem rótulo visível, o nome vive em aria-label — e existe', () => {
    const saida = switchSemRotuloSource();
    expect(saida).toContain('aria-label="Ativar modo escuro"');
    // É a única composição em que o par rótulo ↔ controle não aparece; se um
    // `<Label>` voltasse aqui, o exemplo deixaria de ensinar o que se propõe.
    expect(saida).not.toContain('<Label');
  });

  it('o controlado escreve a ligação de volta, não só o valor', () => {
    // Ligar só o valor deixa o interruptor inerte: ele deixa de ser dono do
    // próprio estado e ninguém assume o lugar.
    const saida = switchControlledSource();
    expect(saida).toContain('v-model="ativo"');
    expect(saida).toContain('const ativo = ref(false)');
  });
});
