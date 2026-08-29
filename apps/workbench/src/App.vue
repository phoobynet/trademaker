<script setup lang="ts">
import WorkspaceFrame from './workspace/components/WorkspaceFrame.vue';
import WorkspaceHeader from './workspace/components/WorkspaceHeader.vue';
</script>

<template>
  <WorkspaceFrame>
    <template #header>
      <WorkspaceHeader />
    </template>
  </WorkspaceFrame>
</template>
