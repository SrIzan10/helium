interface VenmicModule {
  PatchBay: new () => PatchBay;
}

interface PatchBay {
  list(props: string[]): Record<string, string>[];
  link(options: VenmicLinkOptions): boolean;
  unlink(): void;
}

export interface VenmicLinkOptions {
  include?: Record<string, string>[];
  exclude?: Record<string, string>[];
  ignore_devices?: boolean;
  only_speakers?: boolean;
  only_default_speakers?: boolean;
  workaround?: Record<string, string>[];
}

export class VenmicManager {
  private venmic: VenmicModule | null = null;
  private patchBay: PatchBay | null = null;
  private available: boolean = false;
  private linked: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this.venmic = require('@vencord/venmic') as VenmicModule;
      this.available = true;
      console.log('[Venmic] Module loaded successfully');
    } catch (error) {
      const err = error as Error;
      console.warn('[Venmic] Not available:', err.message);
      console.warn('[Venmic] Install with: pnpm add @vencord/venmic');
      this.available = false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  listSources(props: string[] = ['node.name', 'application.name', 'application.process.binary']): Record<string, string>[] {
    if (!this.available || !this.venmic) return [];

    try {
      if (!this.patchBay) {
        this.patchBay = new this.venmic.PatchBay();
      }
      return this.patchBay.list(props);
    } catch (error) {
      console.error('[Venmic] Error listing sources:', error);
      return [];
    }
  }

  link(options: VenmicLinkOptions = {}): boolean {
    if (!this.available || !this.venmic) return false;

    try {
      if (!this.patchBay) {
        this.patchBay = new this.venmic.PatchBay();
      }

      if (this.linked) {
        this.unlink();
      }

       const linkOptions: VenmicLinkOptions = {
         ignore_devices: options.ignore_devices ?? true,
         only_speakers: options.only_speakers ?? false,
         only_default_speakers: options.only_default_speakers ?? false,
         include: options.include || [],
         exclude: options.exclude || [],
         workaround: options.workaround || [],
       };

      console.log('[Venmic] Linking:', JSON.stringify(linkOptions));
      
      const success = this.patchBay.link(linkOptions);
      this.linked = success;
      
      if (success) {
        console.log('[Venmic] Audio linked successfully');
      }
      
      return success;
    } catch (error) {
      console.error('[Venmic] Link error:', error);
      return false;
    }
  }

  linkAll(): boolean {
    return this.link({
      exclude: [],
      ignore_devices: true,
      only_speakers: true,
      only_default_speakers: false,
    });
  }

  linkApp(appName: string): boolean {
    return this.link({
      include: [{ 'application.name': appName }],
    });
  }

  unlink(): boolean {
    if (!this.available || !this.patchBay) return false;

    try {
      this.patchBay.unlink();
      this.linked = false;
      console.log('[Venmic] Audio unlinked');
      return true;
    } catch (error) {
      console.error('[Venmic] Unlink error:', error);
      return false;
    }
  }

  isLinked(): boolean {
    return this.linked;
  }

  destroy(): void {
    this.unlink();
    this.patchBay = null;
  }
}

