#version 330
// Keep only the bright parts (soft threshold) for the glow.
in vec2 uv;
out vec4 frag;
uniform sampler2D tex;
uniform float threshold;
void main() {
    vec4 c = texture(tex, uv);
    float l = max(c.r, max(c.g, c.b));
    float w = smoothstep(threshold - 0.05, threshold + 0.15, l);
    frag = vec4(c.rgb * w, c.a * w);
}
