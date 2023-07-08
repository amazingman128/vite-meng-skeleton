<template>
  <div class="flex flex-row w-screen h-screen ">
    <div class="basis-1/3 bg-blue ">
      <div class="grid place-content-center">
        <img class="w-120 center mt-120 " src="/img/loginbg.svg" alt="">
      </div>

    </div>

    <div class="basis-2/3">
      <div class="grid  mt-80  place-content-center">
        <div class=" pt-20 pl-10 pr-10 pb-10  border-2  border-red !w-auto rounded-20px shadow-sm" >
          <PasswordLogin/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {PasswordLogin} from './components'

</script>


<style scoped>

</style>