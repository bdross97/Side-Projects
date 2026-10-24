
void main() {
    vec3 c = max(image(), 0.0);
    float a = 1.0;
    if (u_key_black > 0.5) a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
    frag = vec4(c, a);   // premultiplied alpha
}
