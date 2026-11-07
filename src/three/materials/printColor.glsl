#include <color_fragment>
diffuseColor.rgb = uBaseColor * mix(0.82, 1.0, layer);
vec3 speckleCell = floor(vObjPos * 140.0);
float speckleNoise = fract(sin(dot(speckleCell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
float speckleShape = length(fract(vObjPos * 140.0) - 0.5);
if (speckleNoise > 1.0 - uSpeckleAmount && speckleShape < 0.3 + speckleNoise * 0.25) {
  diffuseColor.rgb = speckleNoise > 1.0 - uSpeckleAmount / 3.0 ? uSpeckle[0] : (speckleNoise > 1.0 - uSpeckleAmount * 2.0 / 3.0 ? uSpeckle[1] : uSpeckle[2]);
}
if (!gl_FrontFacing) {
  diffuseColor.rgb = mix(uBaseColor * 0.55, uEdgeColor, 0.18);
}
