<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
</script>

<template>
  <Dialog>
    <DialogTrigger>Sign In</DialogTrigger>
    <DialogContent>
      <SignIn />
    </DialogContent>
  </Dialog>
</template>
