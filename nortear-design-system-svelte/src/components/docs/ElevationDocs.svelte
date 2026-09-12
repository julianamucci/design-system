<script lang="ts">
  import { untrack } from 'svelte';
  import FoundationPage from './shared/FoundationPage.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

  const { tStore } = untrack(() => useTranslation(translations));

  /** Linha da tabela de elevação no conteúdo compartilhado. */
  type LinhaDeElevacao = { level: string; token: string; usage: string };

  /* Os degraus do mostruário SAEM de `elevation.rows` — a mesma fonte que o
   * FoundationSection já usa para desenhar a tabela desta página. O array
   * cravado que vivia aqui era uma segunda fonte, e foi a que deixou de ser
   * corrigida: ficou com CINCO degraus depois que o nível de controle
   * (`--elevation-xs`) entrou, e com os rótulos deslocados um degrau (o token
   * de Dialog aparecia como "Tooltip"). Nada liga uma cópia à outra, então
   * nenhum portão via. A classe deriva do sufixo do token —
   * `--elevation-md` → `.nds-shadow-md`; token que não é de elevação (o nível
   * plano traz "—") cai em `.nds-shadow-none`. */
  const PREFIXO = '--elevation-';

  const elevacoes = $derived.by(() => {
    const raiz = ((translations as Record<string, unknown>)[$locale]
      ?? (translations as Record<string, unknown>)['pt-BR']) as
      { elevation?: { rows?: Record<string, LinhaDeElevacao> } } | undefined;
    return Object.values(raiz?.elevation?.rows ?? {}).map((linha) => ({
      label: linha.level,
      token: linha.token,
      classe: linha.token.startsWith(PREFIXO)
        ? `nds-shadow-${linha.token.slice(PREFIXO.length)}`
        : 'nds-shadow-none',
    }));
  });

  const RADII: Array<{ token: string | null; label: string }> = [
    { token: '--radius-none', label: 'none' },
    { token: '--radius-xs', label: 'xs' },
    { token: '--radius-sm', label: 'sm' },
    { token: '--radius-md', label: 'md' },
    { token: '--radius-lg', label: 'lg' },
    { token: '--radius-xl', label: 'xl' },
    { token: '--radius-full', label: 'full' },
  ];
</script>

<FoundationPage {translations} componentSlug="elevacao-bordas-sombras">
  {#snippet extra()}
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('specimens.title')}</h2>
        <p class="nds-text-body">{$tStore('specimens.subtitle')}</p>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.shadows')}</h3>
        <div
          class="nds-grid nds-p-6 nds-rounded-lg"
          data-spacing="lg"
          style="--grid-min: 8rem; background-color: hsl(var(--muted) / 0.2)"
        >
          {#each elevacoes as el (el.label)}
            <div
              class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center {el.classe}"
            >
              <div class="nds-font-medium nds-text-foreground nds-mb-1">{el.label}</div>
              <code class="nds-text-code">{el.token}</code>
            </div>
          {/each}
        </div>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.radius')}</h3>
        <div class="nds-grid" data-spacing="md" style="--grid-min: 8rem">
          {#each RADII as r (r.label)}
            <div
              class="nds-bg-primary-soft nds-border-primary-soft nds-p-6 nds-text-caption nds-text-muted-foreground nds-text-center {r.token ? '' : 'nds-rounded-full'}"
              style={r.token ? `border-radius: var(${r.token})` : undefined}
            >
              <code>{r.token ?? '.nds-rounded-full'}</code>
            </div>
          {/each}
        </div>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.nested')}</h3>
        <div class="nds-grid" data-spacing="md" style="--grid-min: 12rem">
          <!-- Rᵢ = Rₑ − E: 14 → 10 → 6 com inset p-1 (4px) em cada nível -->
          <div class="nds-stack" data-spacing="xs">
            <div class="nds-bg-primary-soft nds-p-1" style="border-radius: var(--radius-xl)">
              <div class="nds-bg-card nds-p-1" style="border-radius: var(--radius)">
                <div class="nds-bg-primary-soft nds-p-6" style="border-radius: var(--radius-sm)"></div>
              </div>
            </div>
            <span class="nds-text-caption nds-text-muted-foreground">{$tStore('specimens.nestedOk')}</span>
          </div>
          <!-- Errado: mesmo raio em todos os níveis -->
          <div class="nds-stack" data-spacing="xs">
            <div class="nds-bg-primary-soft nds-p-1" style="border-radius: var(--radius-xl)">
              <div class="nds-bg-card nds-p-1" style="border-radius: var(--radius-xl)">
                <div class="nds-bg-primary-soft nds-p-6" style="border-radius: var(--radius-xl)"></div>
              </div>
            </div>
            <span class="nds-text-caption nds-text-muted-foreground">{$tStore('specimens.nestedBad')}</span>
          </div>
        </div>
      </div>
    </section>
  {/snippet}
</FoundationPage>
