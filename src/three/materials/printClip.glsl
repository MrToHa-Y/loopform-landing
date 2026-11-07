if (gl_FragCoord.y < uClipFloor) discard;
float cutY = mix(uMinY, uMaxY, uProgress);
if (vObjPos.y > cutY) discard;
float layerWidth = fwidth(vLayer) / uLayerHeight;
float layerFade = (1.0 - smoothstep(0.34, 0.62, layerWidth)) * uRelief;
float layerU = fract(vLayer / uLayerHeight) * 2.0 - 1.0;
float layerRod = sqrt(max(1.0 - layerU * layerU, 0.0));
float layer = mix(0.72, layerRod, clamp(layerFade, 0.0, 1.0));
float edgeGlow = 1.0 - smoothstep(0.0, uEdgeWidth, abs(vObjPos.y - cutY));
