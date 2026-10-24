#version 330
// Layer `src` over the stack so far (`dst`). Both premultiplied alpha.
in vec2 uv;
out vec4 frag;
uniform sampler2D dst;
uniform sampler2D src;
uniform float opacity;
void main() {
    vec4 d = texture(dst, uv);
    vec4 s = texture(src, uv) * opacity;
    frag = s + d * (1.0 - clamp(s.a, 0.0, 1.0));
}
