float cutY = mix(uMinY, uMaxY, uProgress);
if (vObjPos.y > cutY) discard;
float layerPhase = vObjPos.y / uLayerHeight * 6.28318;
float layerFade = (1.0 - smoothstep(0.3, 0.6, fwidth(vObjPos.y) / uLayerHeight)) * uRelief;
float layer = mix(0.5, 0.5 + 0.5 * sin(layerPhase), clamp(layerFade, 0.0, 1.0));
float edgeGlow = 1.0 - smoothstep(0.0, uEdgeWidth, abs(vObjPos.y - cutY));
