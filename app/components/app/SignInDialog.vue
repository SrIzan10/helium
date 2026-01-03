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
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-vue-next";
</script>

<template>
  <Dialog>
    <DialogTrigger>
      <Button size="icon">
        <LogIn />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <SignIn />
    </DialogContent>
  </Dialog>
</template>
