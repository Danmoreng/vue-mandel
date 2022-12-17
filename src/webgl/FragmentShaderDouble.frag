precision highp float;

uniform vec2 u_zoomCenter;
uniform float u_zoomSize;
uniform int u_maxIterations;
uniform float u_width;
uniform float u_height;

vec2 split(float a) {
    const float SPLITTER = 134217729.0;
    const float SPLIT_THRESH = 6.69692879491417e-39;
    float aHi = a * SPLITTER;
    float aLo = a - aHi;
    if (abs(a) < SPLIT_THRESH) return vec2(a, 0.0);
    return vec2(aHi, aLo);
}

vec2 ddAdd(vec2 x, vec2 y) {
    float hi = x.x + y.x;
    float lo = x.y + y.y;
    float y_hi = hi - x.x;
    lo -= y_hi;
    return vec2(hi, lo);
}

vec2 ddSub(vec2 x, vec2 y) {
    return ddAdd(x, vec2(-y.x, -y.y));
}

vec2 ddMul(vec2 x, vec2 y) {
    const float SPLITTER = 134217729.0;
    vec2 xHi = split(x.x);
    vec2 xLo = split(x.y);
    vec2 yHi = split(y.x);
    vec2 yLo = split(y.y);
    vec2 h = ddAdd(ddMul(xHi, yHi), split(xHi.x * yHi.y + xLo.x * yLo.y + xHi.y * yLo.x));
    vec2 l = ddAdd(ddMul(xLo, yLo), split(xLo.x * yLo.y));
    return vec2(h.x + h.y, l.x + l.y);
}

vec2 f(vec2 x, vec2 c) {
    vec2 res = ddAdd(ddMul(mat2(x, -x.y, x.x), x), c);
    return vec2(res.x + res.y, split(res.x * res.y).y);
}

vec3 color_map(float t) {
    const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
    const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
    const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
    const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
    const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
    const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
    const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);
    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
}


void main() {
    vec2 uv = gl_FragCoord.xy / vec2(u_width, u_height);
    vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);
    c.y *= u_height/u_width;
    vec2 x = vec2(0.0);
    bool escaped = false;
    int iterations = 0;
    for (int i = 0; i < 10000; i++) {
        if (i > u_maxIterations) break;
        iterations = i;
        x = f(x, c);
        if (length(x) > 2.0) {
            escaped = true;
            break;
        }
    }
    gl_FragColor = vec4(color_map(1.0 - float(iterations)/float(u_maxIterations)), 1.0);
}