#version 330
// Shared header for every generator. A generator defines `vec3 image()`.
//
// LOOP RULE: anything that moves must be built from u_phase (0..1 over the
// loop) times a whole number, or from u_beat. Then the last frame flows
// straight back into the first.
in vec2 uv;
out vec4 frag;
uniform vec2 u_resolution;   // output size in pixels
uniform float u_phase;       // 0..1 through the loop
uniform float u_beats;       // beats in the loop (bars * 4)
uniform float u_beat;        // beats elapsed since loop start (fractional)
uniform float u_key_black;   // 1 = black becomes transparent

#define TAU 6.28318530718
#define PI 3.14159265359

// Coordinates centered on the frame; the shorter side spans -1..1, so shapes
// keep their proportions in 16:9, 9:16, 1:1...
vec2 centered() {
    return (uv - 0.5) * u_resolution / min(u_resolution.x, u_resolution.y) * 2.0;
}
float beat_phase() { return fract(u_beat); }          // 0..1 within each beat
float bar_phase() { return fract(u_beat / 4.0); }     // 0..1 within each bar
float beat_pulse(float decay) { return exp(-beat_phase() * decay); }  // spike on each beat
float loop_angle(float cycles) { return TAU * u_phase * floor(cycles + 0.5); }

mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

uint _h(uint x) {
    x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16;
    return x;
}
uint _hash3(ivec3 c) { return _h(uint(c.x) + _h(uint(c.y) + _h(uint(c.z)))); }
float hash12(vec2 p) { return float(_h(uint(int(p.x)) + _h(uint(int(p.y))))) / 4294967295.0; }

vec3 _grad(ivec3 c) {
    uint k = _hash3(c);
    float a = float(k & 0xffffu) / 65535.0 * TAU;
    float z = float(k >> 16) / 65535.0 * 2.0 - 1.0;
    float r = sqrt(max(0.0, 1.0 - z * z));
    return vec3(r * cos(a), r * sin(a), z);
}

// Gradient noise whose z axis repeats every `period` units. Feed it
// z = u_phase * period and the pattern evolves and returns exactly to its
// start at the end of the loop. Returns roughly -1..1.
float loop_noise(vec3 p, float period) {
    int P = max(1, int(period + 0.5));
    vec3 i = floor(p), f = p - i;
    ivec3 c = ivec3(i);
    int z0 = ((c.z % P) + P) % P, z1 = (z0 + 1) % P;
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float n000 = dot(_grad(ivec3(c.x, c.y, z0)), f - vec3(0, 0, 0));
    float n100 = dot(_grad(ivec3(c.x + 1, c.y, z0)), f - vec3(1, 0, 0));
    float n010 = dot(_grad(ivec3(c.x, c.y + 1, z0)), f - vec3(0, 1, 0));
    float n110 = dot(_grad(ivec3(c.x + 1, c.y + 1, z0)), f - vec3(1, 1, 0));
    float n001 = dot(_grad(ivec3(c.x, c.y, z1)), f - vec3(0, 0, 1));
    float n101 = dot(_grad(ivec3(c.x + 1, c.y, z1)), f - vec3(1, 0, 1));
    float n011 = dot(_grad(ivec3(c.x, c.y + 1, z1)), f - vec3(0, 1, 1));
    float n111 = dot(_grad(ivec3(c.x + 1, c.y + 1, z1)), f - vec3(1, 1, 1));
    return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
               mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z) * 1.4;
}

// Layered noise (fractal Brownian motion). Each octave doubles detail and
// doubles its time period, so the whole stack still loops.
float loop_fbm(vec2 p, float cycles, int octaves) {
    float sum = 0.0, amp = 0.5, norm = 0.0;
    float period = max(1.0, floor(cycles + 0.5));
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        sum += amp * loop_noise(vec3(p, u_phase * period), period);
        norm += amp;
        p = p * 2.03 + vec2(17.1, 9.7);
        period *= 2.0;
        amp *= 0.5;
    }
    return sum / norm;
}

// Smooth three-color gradient, t in 0..1
vec3 ramp3(vec3 a, vec3 b, vec3 c, float t) {
    t = clamp(t, 0.0, 1.0);
    return t < 0.5 ? mix(a, b, smoothstep(0.0, 1.0, t * 2.0))
                   : mix(b, c, smoothstep(0.0, 1.0, t * 2.0 - 1.0));
}
