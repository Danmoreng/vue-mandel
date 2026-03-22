#version 300 es
precision highp float;

in vec2 a_Position;

void main() {
    gl_Position = vec4(a_Position, 0.0, 1.0);
}
