#version 330
// One direction of a Gaussian blur (run horizontally, then vertically).
// The engine shrinks the image first for big radii, so sigma stays <= 4
// texels here and 25 taps cover it.
in vec2 uv;
out vec4 frag;
uniform sampler2D tex;
uniform vec2 step_uv;    // one texel in the blur direction
uniform float sigma;     // in texels
void main() {
    vec4 sum = vec4(0.0);
    float wsum = 0.0;
    for (int i = -12; i <= 12; i++) {
        float w = exp(-float(i * i) / (2.0 * sigma * sigma));
        sum += texture(tex, uv + step_uv * float(i)) * w;
        wsum += w;
    }
    frag = sum / wsum;
}
