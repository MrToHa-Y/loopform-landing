#include <normal_fragment_maps>
normal = normalize(normal + vUpView * cos(layerPhase) * 0.35 * clamp(layerFade, 0.0, 1.6));
