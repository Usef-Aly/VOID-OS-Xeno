import * as Tone from 'tone';

class XenoSoundService {
  private static instance: XenoSoundService;
  private isInitialized: boolean = false;
  private ambientDrone: any = null;
  private ambientFilter: Tone.AutoFilter | null = null;
  private volume: Tone.Volume;

  private constructor() {
    this.volume = new Tone.Volume(-12).toDestination();
  }

  public static getInstance(): XenoSoundService {
    if (!XenoSoundService.instance) {
      XenoSoundService.instance = new XenoSoundService();
    }
    return XenoSoundService.instance;
  }

  private async init() {
    if (this.isInitialized) return;
    await Tone.start();
    this.isInitialized = true;
    console.log('Xeno Neural Audio System Initialized');
  }

  // 1. Button Click / Glitch: short, glitchy, electronic click
  public async playClick() {
    await this.init();
    const noise = new Tone.Noise('pink').start();
    const filter = new Tone.Filter(2000, 'highpass').connect(this.volume);
    const env = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.05,
      sustain: 0,
      release: 0.05
    }).connect(filter);
    
    noise.connect(env);
    env.triggerAttackRelease(0.05);
    
    const synth = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.volume);
    synth.triggerAttackRelease('C6', '32n', undefined, 0.2);
    
    setTimeout(() => {
      noise.dispose();
      filter.dispose();
      env.dispose();
      synth.dispose();
    }, 200);
  }

  // 2. Button Hover / Pulse: soft, organic hum
  public async playHover() {
    await this.init();
    const synth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.1, release: 0.2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.volume);
    
    synth.triggerAttackRelease('G2', '8n', undefined, 0.1);
    setTimeout(() => synth.dispose(), 500);
  }

  // 3. Sidebar Movement / Breathing: low, continuous alien hum
  public async startAmbient() {
    await this.init();
    if (this.ambientDrone) return;

    this.ambientFilter = new Tone.AutoFilter({
      frequency: 0.1,
      baseFrequency: 100,
      octaves: 2,
      type: 'sine'
    }).connect(this.volume).start();

    this.ambientDrone = new Tone.FatOscillator({
      frequency: 55, // A1
      type: 'sine',
      spread: 40,
      count: 3
    }).connect(this.ambientFilter).start();
    
    this.ambientDrone.partials = [1, 0.5, 0.3, 0.2];
    
    this.ambientDrone.volume.rampTo(-20, 2);
  }

  public stopAmbient() {
    if (this.ambientDrone) {
      this.ambientDrone.volume.rampTo(-100, 1);
      setTimeout(() => {
        this.ambientDrone?.dispose();
        this.ambientFilter?.dispose();
        this.ambientDrone = null;
        this.ambientFilter = null;
      }, 1000);
    }
  }

  // 4. Canvas Interaction: gentle, deep-space ambient pulses
  public async playCanvas() {
    await this.init();
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.1,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 1, sustain: 0, release: 1 }
    }).connect(this.volume);
    
    synth.triggerAttackRelease('E1', '2n', undefined, 0.15);
    setTimeout(() => synth.dispose(), 2000);
  }

  // 5. Image Upload: futuristic scanning beep
  public async playUpload() {
    await this.init();
    const synth = new Tone.DuoSynth({
      vibratoAmount: 0.5,
      vibratoRate: 5,
      harmonicity: 1.5,
      voice0: { oscillator: { type: 'sine' } },
      voice1: { oscillator: { type: 'sine' } }
    }).connect(this.volume);
    
    synth.triggerAttackRelease('C5', '8n', undefined, 0.2);
    setTimeout(() => synth.triggerAttackRelease('G5', '4n', undefined, 0.2), 150);
    setTimeout(() => synth.dispose(), 1000);
  }

  // 6. Mode Switch: soft toggle with metallic timbre
  public async playToggle() {
    await this.init();
    const metal = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).connect(this.volume);
    
    metal.triggerAttackRelease('16n', undefined, 0.15);
    setTimeout(() => metal.dispose(), 1000);
  }

  // 7. Extraction / Export: satisfying alien "ping"
  public async playExport() {
    await this.init();
    const reverb = new Tone.Reverb(3).connect(this.volume).toDestination();
    const ping = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 4000,
      resonance: 0.95
    }).connect(reverb);
    
    ping.triggerAttack('C6', undefined);
    setTimeout(() => {
      ping.dispose();
      reverb.dispose();
    }, 4000);
  }

  // 8. Ghost Signature: ethereal, echoing ghostly sound
  public async playGhost() {
    await this.init();
    const delay = new Tone.FeedbackDelay('4n', 0.6).connect(this.volume);
    const reverb = new Tone.Reverb(5).connect(delay);
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 1, sustain: 0.5, release: 3 }
    }).connect(reverb);
    
    synth.triggerAttackRelease(['A3', 'E4', 'G4'], '2n', undefined, 0.1);
    setTimeout(() => {
      synth.dispose();
      reverb.dispose();
      delay.dispose();
    }, 8000);
  }

  public setVolume(val: number) {
    this.volume.volume.rampTo(val, 0.1);
  }
}

export const soundService = XenoSoundService.getInstance();
