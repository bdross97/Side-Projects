#version 330
in vec2 uv;
out vec4 frag;
uniform sampler2D tex;
uniform sampler2D glow;
uniform float intensity;
uniform vec3 tint;
void main() {
    vec4 c = texture(tex, uv);
    vec3 g = texture(glow, uv).rgb * intensity * tint;
    frag = vec4(c.rgb + g, clamp(c.a + max(g.r, max(g.g, g.b)), 0.0, 1.0));
}
