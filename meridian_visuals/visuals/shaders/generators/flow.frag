// @name Flow field
// @pack meridian
// Liquid, slowly evolving color fields (domain-warped noise): water, smoke, petals in wind.
// @param cycles int 1 1 4 "Evolution cycles per loop"
// @param scale float 1.4 0.3 6 "Pattern scale"
// @param warp float 1.4 0 4 "Swirl"
// @param detail int 4 1 7 "Detail"
// @param drift int 0 -2 2 "Rotation (turns per loop)"
// @param contrast float 1.2 0.3 3 "Contrast"
// @param pulse float 0.0 0 1 "Brighten on beat"
// @param color_a color #04201a "Shadow"
// @param color_b color #2e7d5b "Mid"
// @param color_c color #f6cfa4 "Highlight"
uniform float p_cycles, p_scale, p_warp, p_detail, p_drift, p_contrast, p_pulse;
uniform vec3 p_color_a, p_color_b, p_color_c;

vec3 image() {
    vec2 p = rot2(loop_angle(p_drift)) * centered() * p_scale;
    int oct = int(p_detail);
    vec2 q = vec2(loop_fbm(p, p_cycles, oct), loop_fbm(p + vec2(5.2, 1.3), p_cycles, oct));
    vec2 r = vec2(loop_fbm(p + p_warp * q + vec2(1.7, 9.2), p_cycles, oct),
                  loop_fbm(p + p_warp * q + vec2(8.3, 2.8), p_cycles, oct));
    float n = loop_fbm(p + p_warp * r, p_cycles, oct);
    float t = n * 0.9 * p_contrast + 0.5;
    vec3 col = ramp3(p_color_a, p_color_b, p_color_c, t);
    col += p_color_c * 0.15 * length(q) * p_warp * 0.3;   // soft sheen along the swirls
    return col * (1.0 + p_pulse * 0.6 * beat_pulse(5.0));
}
