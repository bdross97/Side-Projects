// @name Laser grid
// @pack techoma
// Perspective grid floor (and ceiling) scrolling into the distance.
// @param travel int 8 1 32 "Grid rows passed per loop"
// @param cell float 0.5 0.1 2 "Cell size"
// @param horizon float 0.0 -0.8 0.8 "Horizon height"
// @param ceiling float 1.0 0 1 "Ceiling grid"
// @param width float 0.02 0.002 0.15 "Line width"
// @param fog float 0.25 0 1 "Distance fade"
// @param flash float 0.4 0 2 "Flash on beat"
// @param color color #ffffff "Line color"
uniform float p_travel, p_cell, p_horizon, p_ceiling, p_width, p_fog, p_flash;
uniform vec3 p_color;

float grid_lines(vec2 g) {
    vec2 d = abs(fract(g + 0.5) - 0.5);
    vec2 fw = fwidth(g);
    vec2 l = 1.0 - smoothstep(vec2(p_width), vec2(p_width) + fw * 1.5, d);
    l *= 1.0 - smoothstep(0.25, 0.6, fw);   // fade lines packed tighter than a pixel
    return max(l.x, l.y);
}

vec3 image() {
    vec2 p = centered();
    float dy = p.y - p_horizon;
    float side = dy < 0.0 ? 1.0 : p_ceiling;
    float ady = max(abs(dy), 1e-3);
    float z = 0.35 / ady;                                  // distance into the scene
    vec2 g = vec2(p.x * z, z) / p_cell;
    g.y += u_phase * floor(p_travel + 0.5);
    float v = grid_lines(g) * exp(-z * p_fog * 0.5) * side;
    v *= smoothstep(0.0, 0.04, ady);                        // hide horizon moire
    float glow = exp(-abs(dy) * 45.0) * 0.9;                // laser line on the horizon
    return p_color * (v + glow) * (1.0 + p_flash * beat_pulse(7.0));
}
