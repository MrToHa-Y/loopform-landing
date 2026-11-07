varying vec2 vCardUv;

void main() {
  vCardUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
