<script lang="ts" setup>
import {ref} from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>


</template>

<style scoped>

</style>
