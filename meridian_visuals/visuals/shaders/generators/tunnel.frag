// @name Tunnel
// @pack techoma
// Endless white-on-black tunnel, rings rushing toward the camera.
// @param travel int 8 1 32 "Rings passed per loop"
// @param density float 0.6 0.1 3 "Ring spacing"
// @param square float 1.0 0 1 "Round -> square"
// @param spokes int 8 0 32 "Spokes"
// @param twist int 0 -4 4 "Twist (turns per loop)"
// @param width float 0.06 0.01 0.4 "Line width"
// @param flash float 0.5 0 2 "Flash on beat"
// @param color color #ffffff "Line color"
uniform float p_travel, p_density, p_square, p_spokes, p_twist, p_width, p_flash;
uniform vec3 p_color;

vec3 image() {
    vec2 p = centered();
    float r = mix(length(p), max(abs(p.x), abs(p.y)), p_square);
    float depth = p_density / max(r, 1e-3);
    float z = depth + u_phase * floor(p_travel + 0.5);
    float d = abs(fract(z + 0.5) - 0.5);
    // Measure line width on screen (in pixels), thicker toward the edges as
    // if closer to the camera, and scaled with resolution.
    float px = d / max(fwidth(z), 1e-6);
    float w_px = p_width * min(u_resolution.x, u_resolution.y) * 0.08 * (0.3 + r);
    float rings = 1.0 - smoothstep(w_px - 0.75, w_px + 0.75, px);
    float spokes = 0.0;
    float S = floor(p_spokes + 0.5);
    if (S > 0.0) {
        float a = atan(p.y, p.x) / TAU + loop_angle(p_twist) / TAU / S;
        float s = fract(a * S + 0.5);
        float ps = abs(s - 0.5) / max(fwidth(a * S), 1e-6);   // distance in pixels
        spokes = 1.0 - smoothstep(w_px * 0.5 - 0.75, w_px * 0.5 + 0.75, ps);
    }
    float fog = smoothstep(0.02, 0.6, r);          // fade the dense center
    float v = max(rings, spokes) * fog;
    return p_color * v * (1.0 + p_flash * beat_pulse(7.0));
}
