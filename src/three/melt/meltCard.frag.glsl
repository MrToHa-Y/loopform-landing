uniform sampler2D uMap;
uniform float uOpacity;
uniform float uRadius;
uniform vec2 uSize;
uniform vec2 uCrop;
uniform vec2 uClip;
varying vec2 vCardUv;

void main() {
  if (gl_FragCoord.y > uClip.x || gl_FragCoord.y < uClip.y) discard;

  vec2 centered = (vCardUv - 0.5) * uSize;
  vec2 corner = abs(centered) - (uSize * 0.5 - vec2(uRadius));
  float shape = length(max(corner, 0.0)) - uRadius;
  float mask = 1.0 - smoothstep(-0.006, 0.006, shape);
  vec2 sampleUv = (vCardUv - 0.5) * uCrop + 0.5;
  vec4 texel = texture2D(uMap, sampleUv);
  float alpha = texel.a * mask * uOpacity;

  if (alpha < 0.004) discard;

  gl_FragColor = vec4(texel.rgb, alpha);
  #include <colorspace_fragment>
}
