#version 330
// Final pass to 8-bit: clamp, add a fixed sub-1/255 dither so smooth
// gradients (skies, glows) don't band after encoding, and flip so rows read
// top-first for the encoder.
in vec2 uv;
out vec4 frag;
uniform sampler2D tex;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
    vec3 c = texture(tex, vec2(uv.x, 1.0 - uv.y)).rgb;
    float n = hash(gl_FragCoord.xy) + hash(gl_FragCoord.xy + 0.37) - 1.0;
    frag = vec4(clamp(c + n / 255.0, 0.0, 1.0), 1.0);
}
