<script setup lang="ts">
import { ref } from "vue"
import {
  PinInput,
  PinInputGroup,
  PinInputSlot,
} from "@/components/ui/pin-input"
import { useViewerStore } from "~/state/viewer";

const viewerStore = useViewerStore()
</script>

<template>
  <div>
    <PinInput
      id="pin-input"
      @complete="(viewerStore.code = $event.join(''))"
      type="number"
    >
      <PinInputGroup>
        <PinInputSlot
          v-for="(id, index) in 6"
          :key="id"
          :index="index"
        />
      </PinInputGroup>
    </PinInput>
  </div>
</template>