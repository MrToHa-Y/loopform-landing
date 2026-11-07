#include <color_fragment>
diffuseColor.rgb = mix(uBaseColor * uBaseColor * 0.66, uBaseColor, pow(layer, 0.5));
vec3 speckleSpace = vObjPos * uSpeckleScale;
vec3 speckleCell = floor(speckleSpace);
float speckleNoise = fract(sin(dot(speckleCell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
vec3 speckleCenter = fract(sin(speckleCell * vec3(3.17, 5.41, 7.73) + speckleNoise * 19.0) * 91.73) * 0.5 + 0.25;
float speckleShape = length(fract(speckleSpace) - speckleCenter);
if (vLayer > 0.0005 && speckleNoise > 1.0 - uSpeckleAmount && speckleShape < 0.14 + fract(speckleNoise * 37.0) * 0.16) {
  float speckleKind = fract(speckleNoise * 113.0);
  diffuseColor.rgb = speckleKind > 0.66 ? uSpeckle[0] : (speckleKind > 0.33 ? uSpeckle[1] : uSpeckle[2]);
}
if (uGrain > 0.5) {
  float plank = floor(vObjPos.z * 4.2 + 0.5);
  vec2 grainSpace = vec2(vObjPos.x * 1.5 + plank * 2.3, vObjPos.z * 10.0 + plank * 5.1);
  float warp = printNoise(grainSpace) * 1.6 + printNoise(grainSpace * 2.4) * 0.6;
  float rings = 0.5 + 0.5 * sin((vObjPos.z * 34.0 + warp * 4.2 + plank * 2.0) * 2.0);
  float fibers = printNoise(vec2(vObjPos.x * 9.0, vObjPos.z * 190.0));
  float seam = 1.0 - smoothstep(0.0, 0.0035, abs(fract(vObjPos.z * 4.2 + 0.5) - 0.5) - 0.4985);
  vec3 grainDark = uBaseColor * vec3(0.66, 0.6, 0.54);
  vec3 grainLight = uBaseColor * vec3(1.12, 1.08, 1.02);
  diffuseColor.rgb = mix(grainDark, grainLight, rings * 0.62 + fibers * 0.38) * mix(1.0, 0.86, seam) * (0.92 + 0.16 * printHash(vec2(plank, 3.0)));
}
if (!gl_FrontFacing) {
  diffuseColor.rgb = mix(uBaseColor * 0.55, uEdgeColor, 0.18);
}
