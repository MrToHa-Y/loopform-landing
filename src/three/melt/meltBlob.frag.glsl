uniform float uTime;
uniform float uBands;
uniform float uHeat;
uniform vec3 uPress;
uniform vec2 uClip;
uniform vec3 uRampA;
uniform vec3 uRampB;
uniform vec3 uRampC;
uniform vec3 uRampD;
uniform vec3 uRampE;
uniform vec3 uRimA;
uniform vec3 uRimB;
uniform vec3 uHot;
varying vec3 vSurface;
varying vec3 vNormalView;
varying vec3 vViewDirection;

float flowField(vec3 point) {
  vec3 warp = vec3(
    snoise(point * 0.55 + vec3(0.0, uTime * 0.05, 0.0)),
    snoise(point * 0.55 + vec3(7.1, 0.0, uTime * 0.04)),
    snoise(point * 0.55 + vec3(-3.3, uTime * 0.03, 0.0))
  );
  return snoise(point * 0.62 + warp * 0.6) * 0.62 + 0.56;
}

vec3 ramp(float value) {
  float scaled = clamp(value, 0.0, 1.0) * 4.0;
  vec3 color = mix(uRampA, uRampB, clamp(scaled, 0.0, 1.0));
  color = mix(color, uRampC, clamp(scaled - 1.0, 0.0, 1.0));
  color = mix(color, uRampD, clamp(scaled - 2.0, 0.0, 1.0));
  return mix(color, uRampE, clamp(scaled - 3.0, 0.0, 1.0));
}

void main() {
  if (gl_FragCoord.y > uClip.x || gl_FragCoord.y < uClip.y) discard;

  vec3 normal = normalize(vNormalView);
  float field = flowField(vSurface);
  float stepped = floor(field * uBands) / uBands;
  float layered = mix(field, stepped, 0.5);
  vec3 color = ramp(layered);
  float light = 0.92 + 0.12 * dot(normal, normalize(vec3(0.4, 0.6, 0.7)));
  float fresnel = pow(1.0 - clamp(dot(normal, normalize(vViewDirection)), 0.0, 1.0), 3.0);
  float distanceToPress = distance(vSurface, uPress);
  float hot = exp(-distanceToPress * distanceToPress / 0.07) * uHeat;
  float core = exp(-distanceToPress * distanceToPress / 0.012) * uHeat;

  color *= light;
  color = mix(color, mix(uRimA, uRimB, vSurface.y * 0.5 + 0.5), fresnel * 0.72);
  color = mix(color, uHot, hot);
  color = mix(color, uRampE, core * 0.9);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
