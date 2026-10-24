#version 330
in vec2 in_pos;
out vec2 uv;  // 0..1, origin bottom-left (OpenGL convention)
void main() {
    uv = in_pos * 0.5 + 0.5;
    gl_Position = vec4(in_pos, 0.0, 1.0);
}
