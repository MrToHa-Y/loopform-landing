vec2 frameDistance = abs(gl_FragCoord.xy - uFrame.xy) - uFrame.zw + uFrameRadius;
if (length(max(frameDistance, 0.0)) + min(max(frameDistance.x, frameDistance.y), 0.0) > uFrameRadius) discard;
