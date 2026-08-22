import { describe, expect, it } from 'vitest';
import {
  avatarCarregandoSource,
  avatarComStatusSource,
  avatarGrupoSource,
  avatarIconSource,
  avatarIniciaisSource,
  avatarSource,
  avatarTamanho2xlSource,
  avatarSizeLgSource,
  avatarSizeSmSource,
  avatarSizeXlSource,
} from './avatar.source';

describe('avatarSource', () => {
  it('sem args, entrega a forma canônica: foto com iniciais de reserva', () => {
    expect(avatarSource()).toBe(
      `<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
</script>

<Avatar>
  <AvatarImage src="/equipe/maria.jpg" alt="Foto de perfil de Maria Rodrigues" />
  <AvatarFallback>MR</AvatarFallback>
</Avatar>`,
    );
  });

  it('só escreve size quando o preset difere do padrão', () => {
    expect(avatarSource('', { args: { size: 'md' } })).not.toContain('size=');
    expect(avatarSource('', { args: { size: 'xl' } })).toContain('<Avatar size="xl">');
  });

  it('acompanha o control de classe extra, sem substituir a do componente', () => {
    expect(avatarSource('', { args: { class: 'nds-shadow-sm' } })).toContain(
      '<Avatar class="nds-shadow-sm">',
    );
    expect(avatarSource('', { args: { size: 'lg', class: 'nds-shadow-sm' } })).toContain(
      '<Avatar size="lg" class="nds-shadow-sm">',
    );
  });
});

describe('transforms das stories de tamanho', () => {
  it('cada preset diferente do padrão aparece explícito', () => {
    expect(avatarSizeSmSource()).toContain('<Avatar size="sm">');
    expect(avatarSizeLgSource()).toContain('<Avatar size="lg">');
    expect(avatarSizeXlSource()).toContain('<Avatar size="xl">');
    expect(avatarTamanho2xlSource()).toContain('<Avatar size="2xl">');
  });
});

describe('transforms das stories de estado e composição', () => {
  it('o carregamento mostra o atraso da troca, que é o assunto da story', () => {
    expect(avatarCarregandoSource()).toContain('<Avatar delayMs={600}>');
  });

  it('a composição só com iniciais não importa nem renderiza imagem', () => {
    const saida = avatarIniciaisSource();
    expect(saida).toContain('<AvatarFallback>JP</AvatarFallback>');
    expect(saida).not.toContain('AvatarImage');
  });

  it('o ícone é decorativo e quem nomeia é o rótulo do fallback', () => {
    const saida = avatarIconSource();
    expect(saida).toContain('role="img" aria-label="Usuário genérico"');
    expect(saida).toContain('aria-hidden="true"');
    expect(saida).toContain('@lucide/svelte/icons/user');
  });

  it('o grupo traz três avatares e o contador que fecha a fila', () => {
    const saida = avatarGrupoSource();
    expect(saida.match(/<Avatar>/g)).toHaveLength(3);
    expect(saida).toContain('<AvatarGroup role="group" aria-label="Participantes">');
    expect(saida).toContain('<AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>');
    // Dentro do grupo, a foto é decorativa: quem nomeia o conjunto é o grupo.
    expect(saida).toContain('alt=""');
  });

  it('o indicador de status é nomeado, e não fica mudo no canto', () => {
    expect(avatarComStatusSource()).toContain('<AvatarBadge role="img" aria-label="Online" />');
  });
});
