<script setup lang="ts">
import { ref, watch } from "vue"
import { Delete } from "lucide-vue-next"
import {
  PinInput,
  PinInputGroup,
  PinInputSlot,
} from "@/components/ui/pin-input"
import { Button } from "@/components/ui/button"
import { useViewerStore } from "~/state/viewer";

const viewerStore = useViewerStore()
const digits = ref<string[]>([])

// Sync local digits with store code
watch(digits, (newDigits) => {
  const code = newDigits.join('')
  viewerStore.code = code
})

// Also sync if store updates from elsewhere (though unlikely in this flow)
watch(() => viewerStore.code, (newCode) => {
  if (newCode !== digits.value.join('')) {
    digits.value = newCode.split('')
  }
})

const handleNumPad = (num: number) => {
  if (digits.value.length < 6) {
    digits.value = [...digits.value, num.toString()]
  }
}

const handleBackspace = () => {
  digits.value = digits.value.slice(0, -1)
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <PinInput
      id="pin-input"
      v-model="digits"
      type="number"
    >
      <PinInputGroup>
        <PinInputSlot
          v-for="(id, index) in 6"
          :key="id"
          :index="index"
          class="h-14 w-10 sm:h-16 sm:w-12 text-lg sm:text-xl"
        />
      </PinInputGroup>
    </PinInput>

    <!-- Touchscreen Numpad -->
    <div class="grid grid-cols-3 gap-3 w-full max-w-[280px]">
      <Button
        v-for="n in 9"
        :key="n"
        variant="outline"
        class="h-14 text-xl font-medium active:scale-95 transition-transform"
        @click="handleNumPad(n)"
      >
        {{ n }}
      </Button>
      
      <div class="col-span-1"></div> <!-- Spacer -->
      
      <Button
        variant="outline"
        class="h-14 text-xl font-medium active:scale-95 transition-transform"
        @click="handleNumPad(0)"
      >
        0
      </Button>

      <Button
        variant="ghost"
        class="h-14 active:scale-95 transition-transform hover:bg-destructive/10 hover:text-destructive"
        @click="handleBackspace"
        :disabled="digits.length === 0"
      >
        <Delete class="w-6 h-6" />
      </Button>
    </div>
  </div>
</template>
