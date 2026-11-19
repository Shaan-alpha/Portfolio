/** The dot field's shaders (GLSL 3, for three's RawShaderMaterial). The vertex
 *  shader is a line-for-line port of `morph.ts`: `ease`, `dotProgress`,
 *  `cycle`, `travel`, `pulseFactor`, `visibility`, the Bézier, the drift and
 *  the frame. Keep the two in step; the CPU copy is what makes a retarget
 *  seamless, and it is the tested one. */

/** How many mask rects the shader tests; `engine.ts` keeps the first ones. */
export const MAX_MASKS = 16;

export const VERTEX = /* glsl */ `
precision highp float;

in vec3 position; // the morph's source, viewport px
in vec3 aMid;     // the scattered midpoint, viewport px
in vec3 aTo;      // the target, in the target frame
in float aDelay;
in float aSeed;
in vec4 aFlow;    // edge vector (target frame) and phase; a pulse's vector from its centre
in vec4 aLoop;    // mode, rate (cycles per second), window a, b
in float aWander; // drift multiplier: 0 is rigid
in float aVisFrom;
in vec4 aLookFrom; // the look a dot leaves with: weights of dust, system, model, line
in vec2 aTintFrom; // and its ink and grey
in float aKindTo;
in float aGroup;

uniform float uNow;
uniform float uStart;
uniform float uDuration;
uniform float uStagger;
uniform float uLoopClock;
uniform float uDrift;
uniform vec3 uRow0;
uniform vec3 uRow1;
uniform vec3 uRow2;
uniform vec3 uFrameT;
uniform float uFrameS;
uniform float uStack;
uniform vec2 uViewport;
uniform float uDpr;
uniform vec4 uMask[${MAX_MASKS}];
uniform int uMaskCount;
uniform vec2 uPointer;
uniform float uPointerAmt;
uniform float uHighlight;
uniform float uHighlightAmt;
uniform vec3 uSystem;
uniform vec3 uBright;
uniform vec3 uDust;
uniform vec3 uModel;
uniform vec3 uLine;
uniform float uDustAlpha;
uniform float uLineAlpha;

out vec3 vColor;
out float vAlpha;
out float vSize;
out float vModel;

// The programs (morph.ts MODE): 0 stream, 1 packet, 2 hold, 3 bounce,
// 4 pulse, 5 arrive.
bool isMode(float mode, float m) { return abs(mode - m) < 0.5; }

float ease(float t) {
  float c = clamp(t, 0.0, 1.0);
  return (1.0 - pow(2.0, -10.0 * c)) / (1.0 - pow(2.0, -10.0));
}

float dotProgress(float now, float start, float delay, float duration, float stagger) {
  if (duration <= 0.0) return 1.0;
  return ease((now - start - delay * stagger) / duration);
}

float cycle(float phase, float rate, float clock) {
  float v = phase + clock * rate;
  return v - floor(v);
}

float travel(float mode, float c, float a, float b) {
  if (isMode(mode, 0.0)) return c;
  if (isMode(mode, 4.0)) return 0.0;
  if (isMode(mode, 3.0)) {
    if (c <= a || c >= b) return 0.0;
    float m = (a + b) * 0.5;
    return c < m ? smoothstep(0.0, 1.0, (c - a) / (m - a)) : 1.0 - smoothstep(0.0, 1.0, (c - m) / (b - m));
  }
  if (c <= a) return 0.0;
  if (c >= b) return 1.0;
  return smoothstep(0.0, 1.0, (c - a) / (b - a));
}

float pulseFactor(float c, float a, float rate) {
  if (c < a) return 0.0;
  float tau = (c - a) / rate;
  return 0.3 * exp(-2.6 * tau) * sin(6.283185307179586 * 1.6 * tau);
}

float visibility(float mode, float c, float u, float a, float b, bool moving) {
  if (isMode(mode, 0.0)) return moving ? smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.88, 1.0, u)) : 1.0;
  if (isMode(mode, 1.0) || isMode(mode, 3.0)) return smoothstep(a, a + 0.03, c) * (1.0 - smoothstep(b - 0.03, b, c));
  if (isMode(mode, 2.0) || isMode(mode, 5.0)) return smoothstep(a, a + 0.03, c) * (1.0 - smoothstep(0.93, 1.0, c));
  return 1.0;
}

// A kind as weights (dust, system, model, line), and the two tints (morph.ts
// inkOf, greyOf). A dot's look is a blend of these, so it can be carried
// across a scene change without a jump.
vec4 onehot(float k) { return vec4(k < 0.5 ? 1.0 : 0.0, k >= 0.5 && k < 1.5 ? 1.0 : 0.0, k >= 1.5 && k < 2.5 ? 1.0 : 0.0, k >= 2.5 ? 1.0 : 0.0); }
float inkOf(float mode) { return isMode(mode, 1.0) || isMode(mode, 3.0) || isMode(mode, 5.0) ? 1.0 : 0.0; }
float greyOf(float mode, float c, float b) { return isMode(mode, 2.0) ? smoothstep(b, b + 0.1, c) : 0.0; }

void main() {
  float p = dotProgress(uNow, uStart, aDelay, uDuration, uStagger);
  float mode = aLoop.x;
  float c = cycle(aFlow.w, aLoop.y, uLoopClock);
  float u = travel(mode, c, aLoop.z, aLoop.w);
  float k = isMode(mode, 4.0) ? pulseFactor(c, aLoop.z, aLoop.y) : u;
  vec3 l = aTo + aFlow.xyz * k;
  vec3 t = uFrameT + uFrameS * vec3(dot(uRow0, l), dot(uRow1, l), dot(uRow2, l));
  float q = 1.0 - p;
  vec3 pos = q * q * position + 2.0 * q * p * aMid + p * p * t;
  // The drift grows in as a dot arrives; the snapshot carries the old one.
  float w = p * uDrift * aWander;
  pos.x += w * sin(uNow * (0.6 + 0.5 * aSeed) + 6.283 * aSeed);
  pos.y += w * cos(uNow * (0.7 + 0.4 * aSeed) + 6.283 * aSeed);

  // The pointer parts the dots a little, and they settle back.
  vec2 d = pos.xy - uPointer;
  float dist = length(d);
  if (uPointerAmt > 0.0 && dist < 100.0 && dist > 0.001) {
    float f = 1.0 - dist / 100.0;
    pos.xy += d / dist * 14.0 * f * f * uPointerAmt;
  }

  vec4 w = mix(aLookFrom, onehot(aKindTo), p);
  vec3 col = w.x * uDust + w.y * uSystem + w.z * uModel + w.w * uLine;
  float alpha = w.x * uDustAlpha + w.y * 0.85 + w.z + w.w * uLineAlpha;
  float size = w.x * 1.4 + w.y * 2.2 + w.z * 2.6 + w.w * 1.2;
  // The stack has depth: nearer dots are slightly larger.
  if (uStack > 0.5) size *= 1.0 + clamp(pos.z / (uFrameS * 2.5), -0.15, 0.15);

  float hl = abs(aGroup - uHighlight) < 0.5 ? uHighlightAmt : 0.0;
  col = mix(col, uBright, 0.6 * hl);
  alpha = min(1.0, alpha * (1.0 + 0.6 * hl));

  // The program's look: packets and an arriving approval are drawn in ink, so
  // a single piece of work reads against the grey stream; a held dot greys
  // once it rests; and every dot shows as much as its program says. Each is
  // eased from what the dot showed when its morph began.
  float ink = mix(aTintFrom.x, inkOf(mode), p);
  float grey = mix(aTintFrom.y, greyOf(mode, c, aLoop.w), p);
  col = mix(col, uBright, ink);
  alpha = mix(alpha, 1.0, ink);
  size = mix(size, 2.8, ink);
  col = mix(col, uDust, grey);
  alpha *= mix(aVisFrom, visibility(mode, c, u, aLoop.z, aLoop.w, dot(aFlow.xyz, aFlow.xyz) > 0.0), p);

  // No dots behind the copy: anything inside a mask rect fades to 15%.
  for (int i = 0; i < ${MAX_MASKS}; i++) {
    if (i >= uMaskCount) break;
    vec4 m = uMask[i];
    if (pos.x >= m.x && pos.x <= m.x + m.z && pos.y >= m.y && pos.y <= m.y + m.w) {
      alpha *= 0.15;
      break;
    }
  }

  vModel = w.z;
  vColor = col;
  vAlpha = alpha;
  vSize = size * uDpr;
  gl_PointSize = vSize;
  gl_Position = vec4(pos.x / uViewport.x * 2.0 - 1.0, 1.0 - pos.y / uViewport.y * 2.0, 0.0, 1.0);
}
`;

export const FRAGMENT = /* glsl */ `
precision highp float;

in vec3 vColor;
in float vAlpha;
in float vSize;
in float vModel;

uniform vec3 uModelEdge;
uniform float uLight;

out vec4 fragColor;

void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float soft = min(0.9, 2.0 / max(vSize, 1.0));
  float a = 1.0 - smoothstep(1.0 - soft, 1.0, r);
  if (a <= 0.0) discard;
  vec3 col = vColor;
  // On a light ground a yellow dot needs an edge to read as yellow.
  if (uLight > 0.5 && vModel > 0.5) col = mix(col, uModelEdge, smoothstep(0.4, 0.9, r));
  fragColor = vec4(col, vAlpha * a);
}
`;
