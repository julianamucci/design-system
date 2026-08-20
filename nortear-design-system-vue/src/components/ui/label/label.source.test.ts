import { describe, expect, it } from 'vitest';
import {
  labelComCaixaDeSelecaoSource,
  labelComCampoSource,
  labelDesabilitadoPeloGrupoSource,
  labelDesabilitadoSource,
  labelObrigatorioSource,
  labelPadraoSource,
  labelSource,
} from './label.source';

const TODAS = [
  labelSource,
  labelPadraoSource,
  labelDesabilitadoSource,
  labelDesabilitadoPeloGrupoSource,
  labelObrigatorioSource,
  labelComCampoSource,
  labelComCaixaDeSelecaoSource,
];

describe('labelSource', () => {
  it('sem args, entrega o par rótulo + campo na forma canônica', () => {
    expect(labelSource()).toBe(
      `<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
</script>

<template>
  <div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
    <Label for="nome-completo">Nome completo</Label>
    <Input id="nome-completo" type="text" placeholder="ex: João da Silva" />
  </div>
</template>`,
    );
  });

  it('o control de destino move os DOIS lados do par', () => {
    // Mover só o `for` deixaria o snippet com uma associação quebrada — e é
    // justamente essa igualdade que o componente inteiro produz.
    const saida = labelSource('', { args: { for: 'email-corporativo' } });
    expect(saida).toContain('<Label for="email-corporativo">');
    expect(saida).toContain('<Input id="email-corporativo"');
  });

  it('não escreve class vazia no rótulo', () => {
    // `class=""` no snippet é ruído que quem copia leva junto.
    expect(labelSource('', { args: { class: '' } })).toContain('<Label for="nome-completo">');
  });

  it('acrescenta a classe extra quando o control traz uma', () => {
    expect(labelSource('', { args: { class: 'nds-text-caption' } })).toContain(
      '<Label for="nome-completo" class="nds-text-caption">',
    );
  });

  it('ignora control que não é string — o espião vira ruído no painel', () => {
    const saida = labelSource('', {
      args: { for: (() => {}) as never, class: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('class="undefined"');
    expect(saida).toContain('<Label for="nome-completo">');
  });
});

describe('contrato comum a todo snippet de rótulo', () => {
  it('o rótulo nunca aparece sozinho — ele é metade de um par', () => {
    // Isolado, o `<Label>` é a única forma em que ele não produz nada: sem
    // controle não há nome acessível, nem clique que leve o foco.
    for (const fn of TODAS) expect(fn()).toMatch(/<(Input|Checkbox)\b/);
  });

  it('o for do rótulo e o id do controle carregam o mesmo valor', () => {
    for (const fn of TODAS) {
      const saida = fn();
      const alvo = /<Label for="([^"]+)"/.exec(saida)?.[1];
      expect(alvo).toBeTruthy();
      expect(saida).toContain(`id="${alvo}"`);
    }
  });
});

describe('transforms das stories de estado', () => {
  it('o desabilitado pelo irmão marca o CONTROLE, e o rótulo não recebe prop', () => {
    const saida = labelDesabilitadoSource();
    // Sem `nds-peer` no controle a folha não alcança o rótulo: o campo apaga e
    // o rótulo fica aceso, prometendo interação que não existe.
    expect(saida).toContain('class="nds-peer"');
    expect(saida).toContain(' disabled />');
    expect(saida).toMatch(/<Label for="cpf">CPF<\/Label>/);
  });

  it('o desabilitado pelo grupo age do contêiner, sem tocar o controle irmão', () => {
    const saida = labelDesabilitadoPeloGrupoSource();
    expect(saida).toContain('data-disabled="true"');
    expect(saida).not.toContain('nds-peer');
  });

  it('os dois caminhos de desabilitar não se misturam', () => {
    // Um snippet com os dois ensinaria que é preciso escrever ambos.
    expect(labelDesabilitadoSource()).not.toContain('data-disabled');
  });

  it('o obrigatório traz o asterisco decorativo e o anúncio no controle', () => {
    const saida = labelObrigatorioSource();
    expect(saida).toContain('<span class="nds-text-destructive" aria-hidden="true">*</span>');
    expect(saida).toContain('aria-required="true"');
    // O asterisco fica DENTRO do rótulo, e fora da leitura: sem `aria-hidden` o
    // nome acessível do campo viraria "Email profissional asterisco".
    expect(saida.indexOf('aria-hidden="true"')).toBeLessThan(saida.indexOf('</Label>'));
  });
});

describe('transforms das stories de composição', () => {
  it('com campo de texto, o rótulo vem ANTES do controle', () => {
    const saida = labelComCampoSource();
    expect(saida.indexOf('<Label')).toBeLessThan(saida.indexOf('<Input'));
    expect(saida).toContain('type="tel"');
  });

  it('com caixa de seleção, a ordem se inverte e o bloco deita', () => {
    const saida = labelComCaixaDeSelecaoSource();
    expect(saida).toContain('<div class="nds-cluster" data-spacing="sm">');
    expect(saida.indexOf('<Checkbox')).toBeLessThan(saida.indexOf('<Label'));
    expect(saida).toContain(`import { Checkbox } from '@/components/ui/checkbox'`);
    // Nada de Input nesta composição: o controle é outro.
    expect(saida).not.toContain('<Input');
  });
});
