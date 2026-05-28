let sharedAudioCtx: AudioContext | null = null;
let cachedAscensionImpulse: AudioBuffer | null = null;
let cachedNobleImpulse: AudioBuffer | null = null;

export function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!sharedAudioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
}

export function playAscensionSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.27, now);
        masterGain.connect(ctx.destination);

        const reverbTime = 4.0;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * reverbTime;
        
        const convolver = ctx.createConvolver();
        const impulse = ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        for (let i = 0; i < length; i++) {
            const decay = Math.pow(1 - i / length, 3);
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }
        convolver.buffer = impulse;
        
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.8;
        convolver.connect(reverbGain);
        reverbGain.connect(masterGain);

        function playDeepPad(freq: number, vol: number, attack: number, duration: number) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.Q.value = 1.0;
            
            filter.frequency.setValueAtTime(freq, now);
            filter.frequency.exponentialRampToValueAtTime(freq * 3, now + attack);
            filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + duration);
            
            const envGain = ctx.createGain();
            envGain.gain.setValueAtTime(0, now);
            envGain.gain.linearRampToValueAtTime(vol, now + attack);
            envGain.gain.setValueAtTime(vol * 0.9, now + attack + 0.3);
            envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            
            filter.connect(envGain);
            envGain.connect(convolver);
            
            const dryGain = ctx.createGain();
            dryGain.gain.value = 0.4;
            envGain.connect(dryGain);
            dryGain.connect(masterGain);
            
            const detunes = [-12, 0, 12];
            const types: OscillatorType[] = ['sawtooth', 'triangle', 'sawtooth'];
            
            detunes.forEach((detune, i) => {
                const osc = ctx.createOscillator();
                osc.type = types[i];
                osc.frequency.value = freq;
                osc.detune.value = detune;
                
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.2 + Math.random() * 0.3; 
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 8;
                
                lfo.connect(lfoGain);
                lfoGain.connect(osc.detune);
                
                lfo.start(now);
                lfo.stop(now + duration);
                osc.connect(filter);
                osc.start(now);
                osc.stop(now + duration + 0.5);
            });
        }
        
        playDeepPad(87.5, 0.4, 0.8, 3.5);  // F2
        playDeepPad(175.5, 0.2, 0.7, 3.2); // F3
        playDeepPad(220.0, 0.2, 0.6, 3.0); // A3
        playDeepPad(262.5, 0.3, 0.5, 3.0); // C4
        playDeepPad(329.5, 0.2, 0.5, 2.8); // E4
        playDeepPad(392.0, 0.2, 0.6, 2.8); // G4
        playDeepPad(493.0, 0.1, 0.7, 2.5); // B4
        playDeepPad(523.0, 0.05, 0.8, 2.0); // C5
    } catch (e) {
        console.warn("Audio Context block active", e);
    }
}

export function playNobleSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.23, now);
        masterGain.connect(ctx.destination);

        const reverbTime = 3.5;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * reverbTime;
        
        const convolver = ctx.createConvolver();
        const impulse = ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        for (let i = 0; i < length; i++) {
            const decay = Math.pow(1 - i / length, 2.5);
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }
        convolver.buffer = impulse;
        
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.75;
        convolver.connect(reverbGain);
        reverbGain.connect(masterGain);

        function playWarmVoice(freq: number, vol: number, attack: number, duration: number) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.Q.value = 1.0;
            
            filter.frequency.setValueAtTime(freq * 1.5, now);
            filter.frequency.exponentialRampToValueAtTime(freq * 3.5, now + attack);
            filter.frequency.exponentialRampToValueAtTime(freq * 1.0, now + duration);
            
            const envGain = ctx.createGain();
            envGain.gain.setValueAtTime(0, now);
            envGain.gain.linearRampToValueAtTime(vol, now + attack);
            envGain.gain.setValueAtTime(vol * 0.85, now + attack + 0.2);
            envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            
            filter.connect(envGain);
            envGain.connect(convolver);
            
            const dryGain = ctx.createGain();
            dryGain.gain.value = 0.35;
            envGain.connect(dryGain);
            dryGain.connect(masterGain);
            
            const detunes = [-10, 0, 10];
            const types: OscillatorType[] = ['triangle', 'sine', 'triangle'];
            
            detunes.forEach((detune, i) => {
                const osc = ctx.createOscillator();
                osc.type = types[i];
                osc.frequency.value = freq;
                osc.detune.value = detune;
                
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.25 + Math.random() * 0.25; 
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 6;
                
                lfo.connect(lfoGain);
                lfoGain.connect(osc.detune);
                
                lfo.start(now);
                lfo.stop(now + duration);
                
                osc.connect(filter);
                osc.start(now);
                osc.stop(now + duration + 0.5);
            });
        }
        
        playWarmVoice(130.81, 0.35, 0.6, 3.2);
        playWarmVoice(196.00, 0.25, 0.55, 3.0);
        playWarmVoice(261.63, 0.30, 0.45, 2.8);
        playWarmVoice(293.66, 0.18, 0.5, 2.7);
        playWarmVoice(329.63, 0.25, 0.48, 2.6);
        playWarmVoice(392.00, 0.20, 0.42, 2.5);
        playWarmVoice(493.88, 0.12, 0.52, 2.2);
    } catch (e) {
        console.warn("Audio Context init failed", e);
    }
}
