#version 330
in vec2 uv;
out vec4 frag;
uniform sampler2D tex;
uniform float amount;
void main() {
    vec4 c = texture(tex, uv);
    if (c.a <= 0.0) { frag = vec4(0.0); return; }
    vec3 rgb = clamp(c.rgb / c.a, 0.0, 1.0);
    frag = vec4(mix(rgb, 1.0 - rgb, amount) * c.a, c.a);
}
