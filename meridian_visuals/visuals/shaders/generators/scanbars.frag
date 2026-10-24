// @name Scan bars
// @pack techoma
// Hard horizontal bars and scanlines with per-beat glitch jumps.
// @param bars int 6 1 32 "Bars"
// @param travel int 2 -8 8 "Bar scrolls per loop"
// @param duty float 0.35 0.02 0.95 "Bar thickness"
// @param scanlines float 0.4 0 1 "Fine scanlines"
// @param glitch float 0.4 0 1 "Glitch on beat"
// @param angle float 0 0 180 "Angle (deg)"
// @param color color #ffffff "Color"
uniform float p_bars, p_travel, p_duty, p_scanlines, p_glitch, p_angle;
uniform vec3 p_color;

vec3 image() {
    vec2 p = rot2(radians(p_angle)) * centered();
    float beat = floor(u_beat);                 // whole beats repeat each loop
    float row = floor((p.y * 0.5 + 0.5) * 24.0);
    float jump = hash12(vec2(row, beat)) > 1.0 - p_glitch * 0.5 ? (hash12(vec2(beat, row + 7.0)) - 0.5) : 0.0;
    float hit = step(beat_phase(), 0.25);       // glitch only in the first quarter of each beat
    float y = p.y * 0.5 + 0.5 + jump * hit * 0.2;
    float s = fract(y * floor(p_bars + 0.5) + u_phase * floor(p_travel + 0.5));
    float fw = fwidth(y * p_bars);
    float bar = (1.0 - smoothstep(p_duty, p_duty + fw, s)) * smoothstep(0.0, fw, s);
    // 270 scanlines regardless of resolution; fade them out where the preview is too small to show them
    float sl = uv.y * 270.0;
    float sl_amt = p_scanlines * (1.0 - smoothstep(0.3, 0.5, fwidth(sl)));
    float lines = 1.0 - sl_amt * 0.5 * (1.0 + sin(sl * TAU));
    return p_color * bar * lines;
}
