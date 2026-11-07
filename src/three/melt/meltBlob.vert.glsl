uniform float uTime;
uniform float uAmplitude;
uniform vec3 uPress;
uniform float uPressAmount;
varying vec3 vSurface;
varying vec3 vNormalView;
varying vec3 vViewDirection;

float surfaceOffset(vec3 point) {
  float slow = snoise(point * 0.8 + vec3(0.0, uTime * 0.1, uTime * 0.07));
  float detail = snoise(point * 1.7 - vec3(uTime * 0.08, 0.0, 0.0));
  float distanceToPress = distance(point, uPress);
  float dent = exp(-distanceToPress * distanceToPress / 0.14) * uPressAmount;
  float ripple = sin(distanceToPress * 15.0 - uTime * 6.0) * exp(-distanceToPress * distanceToPress / 0.55) * uPressAmount * 0.022;
  return (slow + detail * 0.16) * uAmplitude - dent * 0.2 + ripple;
}

vec3 displaced(vec3 point) {
  return point * (1.0 + surfaceOffset(point));
}

void main() {
  vec3 point = normalize(position);
  vec3 axis = abs(point.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(point, axis));
  vec3 bitangent = cross(point, tangent);
  float step = 0.02;
  vec3 center = displaced(point);
  vec3 sideA = displaced(normalize(point + tangent * step));
  vec3 sideB = displaced(normalize(point + bitangent * step));
  vec3 normalObject = normalize(cross(sideA - center, sideB - center));

  if (dot(normalObject, point) < 0.0) {
    normalObject = -normalObject;
  }

  vec4 viewPosition = modelViewMatrix * vec4(center, 1.0);

  vSurface = point;
  vNormalView = normalize(normalMatrix * normalObject);
  vViewDirection = normalize(-viewPosition.xyz);
  gl_Position = projectionMatrix * viewPosition;
}
