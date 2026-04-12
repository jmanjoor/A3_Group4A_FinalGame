// ── AudioManager.js ──────────────────────────────────────────────────────
// Handles all game audio. Completely self-contained — remove this file
// and its <script> tag + the audioManager calls in main.js to revert.

// ── Volume levels (tune here) ─────────────────────────────────────────────
const VOL_BGM = 0.05; // background music — well under SFX
const VOL_WINGS = 0.55; // airborne wing flaps
const VOL_WALK = 0.38; // ground footsteps
const VOL_CRUNCH = 0.72; // apple collect — punchy one-shot
const VOL_HURT = 0.05; // damage hit — sharp and urgent
const VOL_SONAR = 0.6; // echolocation ping
const VOL_WHOOSH = 0.5; // tutorial page transition

// ── Fade durations (seconds) ──────────────────────────────────────────────
const BGM_FADE_IN = 1.8; // slow atmospheric rise when level starts
const BGM_FADE_OUT = 1.2; // smooth fade on death / level complete
const WINGS_FADE_IN = 0.18;
const WINGS_FADE_OUT = 0.35;
const WALK_FADE_IN = 0.2;
const WALK_FADE_OUT = 0.28;

// ── Internal looping track helper ─────────────────────────────────────────
class _AudioTrack {
  constructor(ctx, targetVolume) {
    this._ctx = ctx;
    this._gain = ctx.createGain();
    this._gain.gain.value = 0;
    this._gain.connect(ctx.destination);
    this._vol = targetVolume;
    this._buf = null;
    this._src = null;
    this._playing = false;
    this._stopping = false;
  }

  setBuffer(buf) {
    this._buf = buf;
  }

  fadeIn(sec) {
    if (!this._buf) return;

    // If fading out, cancel and reverse — avoids silent gaps on quick state changes.
    if (this._playing && this._stopping) {
      this._stopping = false;
      const now = this._ctx.currentTime;
      this._gain.gain.cancelScheduledValues(now);
      this._gain.gain.setValueAtTime(this._gain.gain.value, now);
      this._gain.gain.linearRampToValueAtTime(this._vol, now + sec);
      return;
    }

    if (this._playing) return; // already fully playing
    this._gain.gain.cancelScheduledValues(this._ctx.currentTime);
    this._src = this._ctx.createBufferSource();
    this._src.buffer = this._buf;
    this._src.loop = true;
    this._src.connect(this._gain);
    this._src.start();
    this._playing = true;
    this._stopping = false;
    const now = this._ctx.currentTime;
    this._gain.gain.setValueAtTime(0, now);
    this._gain.gain.linearRampToValueAtTime(this._vol, now + sec);
  }

  fadeOut(sec) {
    if (!this._playing || this._stopping) return;
    this._stopping = true;
    const now = this._ctx.currentTime;
    this._gain.gain.cancelScheduledValues(now);
    this._gain.gain.setValueAtTime(this._gain.gain.value, now);
    this._gain.gain.linearRampToValueAtTime(0, now + sec);
    const src = this._src;
    setTimeout(
      () => {
        try {
          src.stop();
        } catch (_) {}
        if (this._src === src) {
          this._src = null;
          this._playing = false;
          this._stopping = false;
        }
      },
      sec * 1000 + 50,
    );
  }
}

// ── AudioManager ──────────────────────────────────────────────────────────
class AudioManager {
  constructor() {
    this._ctx = null;
    this._bgm = null; // _AudioTrack — level background music
    this._wings = null; // _AudioTrack — wing flap loop
    this._walk = null; // _AudioTrack — footstep loop
    this._crunchBuf = null; // one-shot buffer
    this._hurtBuf = null; // one-shot buffer
    this._sonarBuf = null; // one-shot buffer
    this._whooshBuf = null; // one-shot buffer
    this._bgmPending = false; // true if startBgm() was called before buffer decoded
    this._pending = {};

    // Sound: "gameBgm.mp3" — level background music
    // Source: Pixabay
    // Type: Free sound effect (direct download)
    // License: Royalty-free
    // Access: https://pixabay.com
    // Date Accessed: March 24
    this._fetch("assets/audio/gameBgm.mp3", "bgm");

    // Sound: "wings" — bat wing flap loop (airborne ambient)
    // Source: Mixkit
    // Type: Free sound effect (direct download)
    // License: Royalty-free
    // Access: https://mixkit.co
    // Date Accessed: March 24
    this._fetch("assets/audio/wings", "wings");

    // Sound: "pavement _walk.wav" — footstep / pavement walk loop
    // Source: Mixkit
    // Type: Free sound effect (direct download)
    // License: Royalty-free
    // Access: https://mixkit.co
    // Date Accessed: March 24
    this._fetch("assets/audio/pavement%20_walk.wav", "walk");

    // Sound: "AppleCrunch.wav" — apple collect sound effect
    // Source: Mixkit
    // Type: Free sound effect (direct download)
    // License: Royalty-free
    // Access: https://mixkit.co
    // Date Accessed: March 24
    this._fetch("assets/audio/AppleCrunch.wav", "crunch");

    // Sound: "damageHurt.wav" — damage / hurt sound effect
    // Source: Mixkit
    // Type: Free sound effect (direct download)
    // License: Royalty-free
    // Access: https://mixkit.co
    // Date Accessed: March 24
    this._fetch("assets/audio/damageHurt.wav", "hurt");

    // Sound: "sonar.mp3" — echolocation ping (E key)
    // Source: Pixabay
    // Type: Free sound effect (direct download)
    // License: Royalty-free
    // Access: https://pixabay.com
    // Date Accessed: March 24
    this._fetch("assets/audio/sonar.mp3", "sonar");

    // Sound: "whooshInstructions.mp3" — tutorial page transition whoosh
    // Source: Mixkit
    // Type: Free sound effect (direct download)
    // License: Royalty-free
    // Access: https://mixkit.co
    // Date Accessed: March 24
    this._fetch("assets/audio/whooshInstructions.mp3", "whoosh");
  }

  _fetch(url, key) {
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.arrayBuffer();
      })
      .then((ab) => {
        this._pending[key] = ab;
        this._tryDecode(key);
      })
      .catch((e) => console.warn(`[AudioManager] Could not load "${url}":`, e));
  }

  // Call on first keypress to satisfy browser autoplay policy.
  unlock() {
    if (this._ctx) {
      // Resume in case the browser suspended the context after creation.
      if (this._ctx.state === "suspended") this._ctx.resume();
      return;
    }
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._ctx.resume(); // force active — some browsers start suspended
    this._bgm = new _AudioTrack(this._ctx, VOL_BGM);
    this._wings = new _AudioTrack(this._ctx, VOL_WINGS);
    this._walk = new _AudioTrack(this._ctx, VOL_WALK);
    for (const key of [
      "bgm",
      "wings",
      "walk",
      "crunch",
      "hurt",
      "sonar",
      "whoosh",
    ])
      this._tryDecode(key);
  }

  _tryDecode(key) {
    if (!this._ctx || !this._pending[key]) return;
    const raw = this._pending[key];
    delete this._pending[key];

    const loopTracks = { bgm: "_bgm", wings: "_wings", walk: "_walk" };
    if (loopTracks[key]) {
      const track = this[loopTracks[key]];
      this._ctx.decodeAudioData(
        raw,
        (buf) => {
          track.setBuffer(buf);
          // Auto-start BGM if it was requested before the buffer was ready.
          if (key === "bgm" && this._bgmPending && !this._bgm._playing) {
            this._bgm.fadeIn(BGM_FADE_IN);
            this._bgmPending = false;
          }
        },
        (err) => console.warn(`[AudioManager] Decode error (${key}):`, err),
      );
    } else if (key === "crunch") {
      this._ctx.decodeAudioData(
        raw,
        (buf) => {
          this._crunchBuf = buf;
        },
        (err) => console.warn(`[AudioManager] Decode error (crunch):`, err),
      );
    } else if (key === "hurt") {
      this._ctx.decodeAudioData(
        raw,
        (buf) => {
          this._hurtBuf = buf;
        },
        (err) => console.warn(`[AudioManager] Decode error (hurt):`, err),
      );
    } else if (key === "sonar") {
      this._ctx.decodeAudioData(
        raw,
        (buf) => {
          this._sonarBuf = buf;
        },
        (err) => console.warn(`[AudioManager] Decode error (sonar):`, err),
      );
    } else if (key === "whoosh") {
      this._ctx.decodeAudioData(
        raw,
        (buf) => {
          this._whooshBuf = buf;
        },
        (err) => console.warn(`[AudioManager] Decode error (whoosh):`, err),
      );
    }
  }

  // ── Public API ────────────────────────────────────────────────────────

  // Start BGM — call when entering tutorial. Safe to call before buffer decodes.
  startBgm() {
    if (!this._ctx || !this._bgm) return;
    if (this._bgm._playing && !this._bgm._stopping) return; // already fully playing
    if (!this._bgm._buf) {
      // Buffer not ready yet — set flag so decode callback auto-starts it.
      this._bgmPending = true;
    } else {
      this._bgm.fadeIn(BGM_FADE_IN);
    }
  }

  // One-shot SFX.
  playCrunch() {
    this._playOneShot(this._crunchBuf, VOL_CRUNCH);
  }
  playHurt() {
    this._playOneShot(this._hurtBuf, VOL_HURT);
  }
  playSonar() {
    this._playOneShot(this._sonarBuf, VOL_SONAR);
  }
  playWhoosh() {
    this._playOneShot(this._whooshBuf, VOL_WHOOSH);
  }

  _playOneShot(buf, vol) {
    if (!this._ctx || !buf) return;
    const gain = this._ctx.createGain();
    gain.gain.value = vol;
    gain.connect(this._ctx.destination);
    const src = this._ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    src.onended = () => {
      src.disconnect();
      gain.disconnect();
    };
    src.start();
  }

  // Called every frame from drawPlaying().
  update(player) {
    if (!this._ctx) return;

    // Wings: airborne (not resting on any surface).
    const wantsWings = !player.dead && !player.isHanging;
    if (wantsWings && !this._wings._playing) {
      this._wings.fadeIn(WINGS_FADE_IN);
    } else if (!wantsWings && this._wings._playing) {
      this._wings.fadeOut(WINGS_FADE_OUT);
    }

    // Walk: bat is on a surface and moving horizontally.
    //
    // Why coyoteTimer: when pstate=HANGING and vy=0, Physics.moveY receives
    // 0 and returns early without sweeping for collisions, so onCeiling comes
    // back false and _resolveState flips to AIRBORNE for that frame. The bat
    // then re-detects the ceiling the very next frame and flips back to
    // HANGING. This alternation every frame makes isHanging flicker, which
    // would constantly reverse the fade and produce no audible sound.
    // coyoteTimer is set to COYOTE_FRAMES whenever onCeiling is true and only
    // decrements otherwise, so it stays > 0 across both halves of the
    // alternation, giving a stable "near ceiling" signal.
    const moving = Math.abs(player.vx) > 0.5;
    const onSurface =
      player.isOnPlatformTop || player.isHanging || player.coyoteTimer > 0;
    const wantsWalk = !player.dead && onSurface && moving && !player.isDiving;
    if (wantsWalk && !this._walk._playing) {
      this._walk.fadeIn(WALK_FADE_IN);
    } else if (!wantsWalk && this._walk._playing) {
      this._walk.fadeOut(WALK_FADE_OUT);
    }
  }

  // Fade out all looping audio (death / level transition).
  stopAll() {
    this._bgmPending = false;
    this._bgm && this._bgm.fadeOut(BGM_FADE_OUT);
    this._wings && this._wings.fadeOut(WINGS_FADE_OUT);
    this._walk && this._walk.fadeOut(WALK_FADE_OUT);
  }
}
