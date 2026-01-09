<script setup lang="ts">
import { LogIn } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
</script>

<template>
  <NuxtLink to="/sign-in">
    <Button size="icon">
      <LogIn />
    </Button>
  </NuxtLink>
</template>
