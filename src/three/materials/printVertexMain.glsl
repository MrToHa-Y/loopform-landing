#include <begin_vertex>
transformed.y = transformed.y < uSeatY ? transformed.y * uLegStretch : transformed.y + uSeatY * (uLegStretch - 1.0);
vObjPos = transformed;
vUpView = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
vLayer = aLayer;
