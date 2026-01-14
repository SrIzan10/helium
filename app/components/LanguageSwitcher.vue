<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Languages } from 'lucide-vue-next'

const { locale, locales, setLocale } = useI18n()
const { t } = useI18n()

const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() => locales.value)

const currentLocale = computed({
  get: () => locale.value,
  set: (value) => {
    const path = switchLocalePath(value)
    navigateTo(path)
  },
})
</script>

<template>
  <Select v-model="currentLocale">
    <SelectTrigger class="w-[160px]">
      <Languages class="mr-2 h-4 w-4" />
      <SelectValue :placeholder="t('selectLanguage')" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="loc in availableLocales"
          :key="loc.code"
          :value="loc.code"
        >
          {{ loc.name }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
