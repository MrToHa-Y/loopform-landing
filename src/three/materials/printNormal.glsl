#include <normal_fragment_maps>
vec3 layerBaseNormal = normal;
vec3 layerPosX = dFdx(-vViewPosition);
vec3 layerPosY = dFdy(-vViewPosition);
vec3 layerAxisX = cross(layerPosY, normal);
vec3 layerAxisY = cross(normal, layerPosX);
float layerDet = dot(layerPosX, layerAxisX);
vec3 layerRise = sign(layerDet) * (dFdx(vLayer) * layerAxisX + dFdy(vLayer) * layerAxisY);
float layerRiseLength = length(layerRise);
if (layerRiseLength > 1e-9) {
  float layerSlope = layerU / max(layerRod, 0.3);
  normal = normalize(normal + (layerRise / layerRiseLength) * layerSlope * 0.95 * clamp(layerFade, 0.0, 1.6));
}
