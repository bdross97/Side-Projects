#version 330
in vec2 uv;
out vec4 frag;
uniform sampler2D tex;
uniform float exposure, contrast, saturation, temperature, tint, hue;
void main() {
    vec4 c = texture(tex, uv);
    if (c.a <= 0.0) { frag = vec4(0.0); return; }
    vec3 rgb = c.rgb / c.a;                          // un-premultiply
    rgb *= exp2(exposure);
    rgb *= vec3(1.0 + 0.18 * temperature, 1.0 + 0.04 * temperature - 0.15 * tint,
                1.0 - 0.22 * temperature);
    float a = radians(hue);                          // rotate around the gray axis
    vec3 k = vec3(0.57735);
    rgb = rgb * cos(a) + cross(k, rgb) * sin(a) + k * dot(k, rgb) * (1.0 - cos(a));
    rgb = (rgb - 0.45) * contrast + 0.45;
    float l = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    rgb = mix(vec3(l), rgb, saturation);
    frag = vec4(max(rgb, 0.0) * c.a, c.a);
}
