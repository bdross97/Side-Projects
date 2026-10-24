// @name Bloom
// @pack meridian
// Layered petals that open and close with each bar.
// @param petals int 6 3 12 "Petals"
// @param layers int 4 1 7 "Layers"
// @param size float 0.85 0.2 1.6 "Size"
// @param spin int 1 -3 3 "Spin (petal steps per loop)"
// @param breathe float 0.35 0 1 "Open / close per bar"
// @param softness float 0.04 0.002 0.3 "Edge softness"
// @param color_a color #0d1f14 "Background"
// @param color_b color #b5476b "Outer petals"
// @param color_c color #ffe4b8 "Center"
uniform float p_petals, p_layers, p_size, p_spin, p_breathe, p_softness;
uniform vec3 p_color_a, p_color_b, p_color_c;

vec3 image() {
    vec2 p = centered();
    float r = length(p);
    float a = atan(p.y, p.x);
    float n = floor(p_petals + 0.5);
    float L = max(1.0, floor(p_layers + 0.5));
    float open = 1.0 + p_breathe * 0.25 * (0.5 - 0.5 * cos(TAU * bar_phase()));
    vec3 col = mix(p_color_a * 1.3, p_color_a, smoothstep(0.0, 1.5, r));
    for (int i = 0; i < 7; i++) {
        float fi = float(i);
        if (fi >= L) break;
        float k = 1.0 - fi / L;                       // 1 = outermost layer
        float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
        // Rotating by whole petal steps (TAU / n) keeps the loop seamless.
        float rot = dir * loop_angle(p_spin) / n + fi * PI / n;
        float shape = pow(abs(cos(0.5 * n * (a + rot))), 0.6);
        float R = p_size * k * open * (0.55 + 0.45 * shape);
        float m = 1.0 - smoothstep(R - p_softness, R + p_softness, r);
        vec3 lc = ramp3(p_color_b * 0.6, p_color_b, p_color_c, 1.0 - k + 0.15);
        lc *= 0.75 + 0.25 * smoothstep(0.0, R, r);   // darker toward each petal's base
        col = mix(col, lc, m);
    }
    return col;
}
