uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 uClip;
varying vec2 vCardUv;

void main() {
  if (gl_FragCoord.y > uClip.x || gl_FragCoord.y < uClip.y) discard;

  float dash = step(0.45, fract(vCardUv.x * 90.0));

  gl_FragColor = vec4(uColor, uOpacity * dash);
  #include <colorspace_fragment>
}
