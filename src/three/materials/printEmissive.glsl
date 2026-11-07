#include <emissivemap_fragment>
totalEmissiveRadiance += uEdgeColor * edgeGlow * (uDirection > 0.0 ? 3.0 : 1.6) * step(0.001, uProgress) * step(uProgress, 0.999);
if (uGlow > 0.0) {
  float glowFacing = max(normalize(layerBaseNormal.xz + vec2(0.0, 0.0001)).y, 0.0);
  float glowHeight = (vObjPos.y - uGlowY) / uGlowSpan;
  float glowCore = pow(glowFacing, 46.0) * exp(-glowHeight * glowHeight * 1.2);
  float glowHalo = pow(glowFacing, 22.0) * exp(-glowHeight * glowHeight * 0.14);
  totalEmissiveRadiance += uGlowColor * uGlow * (glowCore * 7.0 + glowHalo * 0.42) * mix(0.3, 1.0, layer);
}
