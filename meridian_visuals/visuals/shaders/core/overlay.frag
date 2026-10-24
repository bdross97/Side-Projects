#version 330
// Places an RGBA image (logo or text) at a position, size and rotation.
in vec2 uv;
out vec4 frag;
uniform sampler2D tex;
uniform vec2 resolution;
uniform vec2 center_px;
uniform vec2 size_px;
uniform float rotation;   // radians
uniform float opacity;

void main() {
    vec2 d = uv * resolution - center_px;
    float c = cos(-rotation), s = sin(-rotation);
    d = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
    vec2 st = d / size_px + 0.5;
    if (any(lessThan(st, vec2(0.0))) || any(greaterThan(st, vec2(1.0)))) {
        frag = vec4(0.0);
        return;
    }
    frag = texture(tex, vec2(st.x, 1.0 - st.y)) * opacity;
}
