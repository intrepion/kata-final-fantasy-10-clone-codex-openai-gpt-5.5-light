export class TidewakeAudio {
  private context: AudioContext | undefined;
  private muted = true;
  private ambience: OscillatorNode | undefined;
  private gain: GainNode | undefined;
  private battleLoop: OscillatorNode | undefined;
  private battleGain: GainNode | undefined;

  get isMuted(): boolean {
    return this.muted;
  }

  async toggle(): Promise<boolean> {
    this.muted = !this.muted;

    if (this.muted) {
      this.stopAmbience();
      this.stopBattleLoop();
      return this.muted;
    }

    await this.ensureContext();
    this.startAmbience();
    this.playConfirm();
    return this.muted;
  }

  async playConfirm(): Promise<void> {
    await this.playTone(660, 0.08, 0.04);
  }

  async playSave(): Promise<void> {
    await this.playTone(880, 0.16, 0.05);
  }

  async playHit(): Promise<void> {
    await this.playTone(110, 0.1, 0.07);
  }

  async startBattleLoop(): Promise<void> {
    if (this.muted || this.battleLoop || this.battleGain) {
      return;
    }

    const context = await this.ensureContext();
    this.battleLoop = context.createOscillator();
    this.battleGain = context.createGain();
    this.battleLoop.type = "sawtooth";
    this.battleLoop.frequency.value = 98;
    this.battleGain.gain.value = 0.018;
    this.battleLoop.connect(this.battleGain);
    this.battleGain.connect(context.destination);
    this.battleLoop.start();
  }

  stopBattleLoop(): void {
    this.battleLoop?.stop();
    this.battleLoop?.disconnect();
    this.battleGain?.disconnect();
    this.battleLoop = undefined;
    this.battleGain = undefined;
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    return this.context;
  }

  private startAmbience(): void {
    if (!this.context || this.ambience || this.gain) {
      return;
    }

    this.ambience = this.context.createOscillator();
    this.gain = this.context.createGain();
    this.ambience.type = "sine";
    this.ambience.frequency.value = 146.8;
    this.gain.gain.value = 0.025;
    this.ambience.connect(this.gain);
    this.gain.connect(this.context.destination);
    this.ambience.start();
  }

  private stopAmbience(): void {
    this.ambience?.stop();
    this.ambience?.disconnect();
    this.gain?.disconnect();
    this.ambience = undefined;
    this.gain = undefined;
  }

  private async playTone(frequency: number, duration: number, volume: number): Promise<void> {
    if (this.muted) {
      return;
    }

    const context = await this.ensureContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "triangle";
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }
}
