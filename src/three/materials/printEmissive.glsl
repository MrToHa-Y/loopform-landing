#include <emissivemap_fragment>
totalEmissiveRadiance += uEdgeColor * edgeGlow * (uDirection > 0.0 ? 3.0 : 1.6) * step(0.001, uProgress) * step(uProgress, 0.999);
