/** The dot field's shaders (GLSL 3, for three's RawShaderMaterial). The vertex
 *  shader is a line-for-line port of `morph.ts`: `ease`, `dotProgress`, the
 *  Bézier, the flow wrap, the drift and the frame. Keep the two in step; the
 *  CPU copy is what makes a retarget seamless, and it is the tested one. */

export const VERTEX = /* glsl */ `
precision highp float;

in vec3 position; // the morph's source, viewport px
in vec3 aMid;     // the scattered midpoint, viewport px
in vec3 aTo;      // the target, in the target frame
in float aDelay;
in float aSeed;
in vec4 aFlow;    // edge vector (target frame) and phase
in float aKindFrom;
in float aKindTo;
in float aGroup;

uniform float uNow;
uniform float uStart;
uniform float uDuration;
uniform float uStagger;
uniform float uFlowSpeed;
uniform float uDrift;
uniform vec3 uRow0;
uniform vec3 uRow1;
uniform vec3 uRow2;
uniform vec3 uFrameT;
uniform float uFrameS;
uniform float uStack;
uniform vec2 uViewport;
uniform float uDpr;
uniform vec4 uMask[4];
uniform int uMaskCount;
uniform vec2 uPointer;
uniform float uPointerAmt;
uniform float uHighlight;
uniform float uHighlightAmt;
uniform vec3 uSystem;
uniform vec3 uBright;
uniform vec3 uDust;
uniform vec3 uModel;
uniform float uDustAlpha;

out vec3 vColor;
out float vAlpha;
out float vSize;
out float vModel;

float ease(float t) {
  float c = clamp(t, 0.0, 1.0);
  return (1.0 - pow(2.0, -10.0 * c)) / (1.0 - pow(2.0, -10.0));
}

float dotProgress(float now, float start, float delay, float duration, float stagger) {
  if (duration <= 0.0) return 1.0;
  return ease((now - start - delay * stagger) / duration);
}

vec3 kindColor(float k) { return k < 0.5 ? uDust : (k < 1.5 ? uSystem : uModel); }
float kindAlpha(float k) { return k < 0.5 ? uDustAlpha : (k < 1.5 ? 0.85 : 1.0); }
float kindSize(float k) { return k < 0.5 ? 1.4 : (k < 1.5 ? 2.2 : 2.6); }

void main() {
  float p = dotProgress(uNow, uStart, aDelay, uDuration, uStagger);
  float phase = aFlow.w + uNow * uFlowSpeed;
  float u = phase - floor(phase);
  vec3 l = aTo + aFlow.xyz * u;
  vec3 t = uFrameT + uFrameS * vec3(dot(uRow0, l), dot(uRow1, l), dot(uRow2, l));
  float q = 1.0 - p;
  vec3 pos = q * q * position + 2.0 * q * p * aMid + p * p * t;
  pos.x += uDrift * sin(uNow * (0.6 + 0.5 * aSeed) + 6.283 * aSeed);
  pos.y += uDrift * cos(uNow * (0.7 + 0.4 * aSeed) + 6.283 * aSeed);

  // The pointer parts the dots a little, and they settle back.
  vec2 d = pos.xy - uPointer;
  float dist = length(d);
  if (uPointerAmt > 0.0 && dist < 100.0 && dist > 0.001) {
    float f = 1.0 - dist / 100.0;
    pos.xy += d / dist * 14.0 * f * f * uPointerAmt;
  }

  vec3 col = mix(kindColor(aKindFrom), kindColor(aKindTo), p);
  float alpha = mix(kindAlpha(aKindFrom), kindAlpha(aKindTo), p);
  float size = mix(kindSize(aKindFrom), kindSize(aKindTo), p);
  // The stack has depth: nearer dots are slightly larger.
  if (uStack > 0.5) size *= 1.0 + clamp(pos.z / (uFrameS * 2.5), -0.15, 0.15);

  float hl = abs(aGroup - uHighlight) < 0.5 ? uHighlightAmt : 0.0;
  col = mix(col, uBright, 0.6 * hl);
  alpha = min(1.0, alpha * (1.0 + 0.6 * hl));

  // No dots behind the copy: anything inside a mask rect fades to 15%.
  for (int i = 0; i < 4; i++) {
    if (i >= uMaskCount) break;
    vec4 m = uMask[i];
    if (pos.x >= m.x && pos.x <= m.x + m.z && pos.y >= m.y && pos.y <= m.y + m.w) {
      alpha *= 0.15;
      break;
    }
  }

  vModel = (aKindTo > 1.5 ? p : 0.0) + (aKindFrom > 1.5 ? 1.0 - p : 0.0);
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
