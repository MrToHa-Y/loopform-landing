uniform float uProgress;
uniform float uDirection;
uniform float uMinY;
uniform float uMaxY;
uniform float uLayerHeight;
uniform vec3 uEdgeColor;
uniform float uEdgeWidth;
uniform vec3 uBaseColor;
uniform vec3 uSpeckle[3];
uniform float uSpeckleAmount;
uniform float uSpeckleScale;
uniform float uRelief;
uniform float uRoughMin;
uniform float uRoughMax;
uniform float uTime;
uniform float uClipFloor;
uniform float uGrain;
uniform float uGlow;
uniform vec3 uGlowColor;
uniform float uGlowY;
uniform float uGlowSpan;
varying vec3 vObjPos;
varying vec3 vUpView;
varying float vLayer;

float printHash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
}

float printNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 blend = local * local * (3.0 - 2.0 * local);
  float bottom = mix(printHash(cell), printHash(cell + vec2(1.0, 0.0)), blend.x);
  float top = mix(printHash(cell + vec2(0.0, 1.0)), printHash(cell + vec2(1.0, 1.0)), blend.x);

  return mix(bottom, top, blend.y);
}
