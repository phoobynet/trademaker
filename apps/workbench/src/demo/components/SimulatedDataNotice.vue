<script setup lang="ts">
import { FlaskConical } from '@lucide/vue';
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line -- Prettier owns Vue markup formatting. -->
  <div role="alert" class="alert alert-soft alert-warning py-3">
    <FlaskConical :size="18" :stroke-width="1.8" aria-hidden="true" />
    <div>
      <p class="text-sm font-semibold">Simulated demonstration</p>
      <p class="text-xs leading-relaxed">
        Fictional names, tickers, prices and market moves — not live market
        data.
      </p>
    </div>
  </div>
</template>
