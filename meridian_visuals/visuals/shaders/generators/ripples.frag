// @name Water ripples
// @pack meridian
// Overlapping ripples from drifting sources, lit like light on a pool.
// @param sources int 4 1 6 "Ripple sources"
// @param wavelength float 0.18 0.03 0.6 "Wavelength"
// @param cycles int 4 1 16 "Wave cycles per loop"
// @param orbit float 0.5 0 1.5 "Source drift"
// @param shimmer float 0.6 0 1.5 "Shimmer"
// @param color_a color #031a2a "Deep"
// @param color_b color #1f6f8b "Water"
// @param color_c color #e9fbff "Light"
uniform float p_sources, p_wavelength, p_cycles, p_orbit, p_shimmer;
uniform vec3 p_color_a, p_color_b, p_color_c;

float height(vec2 p) {
    float h = 0.0;
    float N = floor(p_sources + 0.5);
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        if (fi >= N) break;
        float ang = loop_angle(1.0) * (mod(fi, 2.0) < 0.5 ? 1.0 : -1.0) + fi * 2.399;
        vec2 c = vec2(cos(ang), sin(ang * 1.0 + fi)) * p_orbit * (0.6 + 0.2 * fi);
        float d = length(p - c);
        h += sin(d / p_wavelength * TAU - loop_angle(p_cycles) + fi) / (1.0 + d * 1.5);
    }
    return h / max(1.0, sqrt(N));
}

vec3 image() {
    vec2 p = centered();
    float e = 2.0 / min(u_resolution.x, u_resolution.y);
    float h = height(p);
    vec2 g = vec2(height(p + vec2(e, 0)) - h, height(p + vec2(0, e)) - h) / e;
    float t = 0.5 + 0.35 * h;
    vec3 col = ramp3(p_color_a, p_color_b, p_color_c * 0.8, t);
    float spec = pow(clamp(1.0 - length(g) * p_wavelength * 0.12, 0.0, 1.0), 6.0);
    return col + p_color_c * spec * p_shimmer * 0.6;
}
