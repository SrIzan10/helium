<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-vue-next';
const router = useRouter()
</script>

<template>
  <Select>
    <SelectTrigger class="w-[180px]">
      <SelectValue placeholder="Select a preset" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="default">
        Default
      </SelectItem>
      <SelectItem value="create-new" @click="router.push('/presets/new')">
        <div class="font-bold flex gap-2 items-center">
          <Plus class="size-4" />
          Create New Preset
        </div>
      </SelectItem>
      <!-- add database provided presets here -->
    </SelectContent>
  </Select>
</template>
