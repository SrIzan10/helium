import { defineStore} from 'pinia';

export const useViewerStore = defineStore('viewer', {
  state: () => ({
    code: '',
  }),
  actions: {
    setCode(code: string) {
      this.code = code;
    },
  },
});