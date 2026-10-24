#version 330
// Draws a video frame (or two, crossfading across the loop seam) filling the
// output ("cover" fit), then applies zoom and pan for this aspect ratio.
in vec2 uv;
out vec4 frag;
uniform sampler2D tex_a;
uniform sampler2D tex_b;
uniform float mix_b;        // 0 = only A, 1 = only B
uniform float src_aspect;   // width / height of the video
uniform float out_aspect;
uniform float zoom;
uniform vec2 pan;           // -1..1, +y = look up

void main() {
    vec2 frac = vec2(1.0);  // portion of the video visible on each axis
    if (src_aspect > out_aspect) frac.x = out_aspect / src_aspect;
    else frac.y = src_aspect / out_aspect;
    frac /= zoom;
    vec2 center = vec2(0.5 + pan.x * (1.0 - frac.x) * 0.5,
                       0.5 - pan.y * (1.0 - frac.y) * 0.5);
    // Video rows are stored top-first, so flip y when sampling.
    vec2 st = center + (vec2(uv.x, 1.0 - uv.y) - 0.5) * frac;
    vec3 a = texture(tex_a, st).rgb;
    vec3 b = texture(tex_b, st).rgb;
    frag = vec4(mix(a, b, mix_b), 1.0);
}
