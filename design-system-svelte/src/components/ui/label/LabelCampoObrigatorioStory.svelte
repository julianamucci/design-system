<script lang="ts">
  import { Label } from '@/components/ui/label';
  import { Input } from '@/components/ui/input';
</script>

<div class="flex flex-col gap-2 w-64">
  <Label for="email-obrigatorio">
    Email profissional
    <span class="text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input id="email-obrigatorio" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />
</div>
