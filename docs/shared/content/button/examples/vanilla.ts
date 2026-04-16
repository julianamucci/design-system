// ─── Exemplos de código — Vanilla JS (Basecoat UI) ────────────────────────────

export const importExample = `<!-- Via CDN -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/basecoat-css/dist/basecoat.min.css" />

<!-- Via npm -->
import "basecoat-css"`;

export const basicExample = `<button class="btn btn-primary">Salvar</button>`;

export const variantsExample = `<!-- Default (primary) -->
<button class="btn btn-primary">Default</button>

<!-- Secondary -->
<button class="btn btn-secondary">Secondary</button>

<!-- Outline -->
<button class="btn btn-outline">Outline</button>

<!-- Ghost -->
<button class="btn btn-ghost">Ghost</button>

<!-- Destructive -->
<button class="btn btn-destructive">Destructive</button>`;

export const sizesExample = `<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-icon">⚡</button>`;

export const withIconExample = `<button class="btn btn-primary">
  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,12 2,6"/>
  </svg>
  Enviar email
</button>`;

export const loadingExample = `<button id="save-btn" class="btn btn-primary" onclick="handleSave(this)">
  Salvar
</button>

<script>
  async function handleSave(btn) {
    btn.disabled = true
    btn.textContent = "Aguarde..."
    await new Promise(resolve => setTimeout(resolve, 2000))
    btn.disabled = false
    btn.textContent = "Salvar"
  }
</script>`;

export const asChildExample = `<!-- Para navegação, use <a> com classe btn -->
<a href="/dashboard" class="btn btn-primary">
  Ir para Dashboard
</a>`;
