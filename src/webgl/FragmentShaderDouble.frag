precision highp float;

uniform vec2 u_zoomCenter;
uniform vec2 u_zoomCenterDouble;
uniform float u_zoomSize;
uniform int u_maxIterations;
uniform int u_colorMap;
uniform bool u_inverted;
uniform float u_width;
uniform float u_height;

vec2 set(float a) {
    return vec2(a, 0.0);
}

vec2 complexMul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y,a.x*b.y + a.y * b.x);
}

float times_frc(float a, float b) {
    return mix(0.0, a * b, b != 0.0 ? 1.0 : 0.0);
}

float plus_frc(float a, float b) {
    return mix(a, a + b, b != 0.0 ? 1.0 : 0.0);
}

float minus_frc(float a, float b) {
    return mix(a, a - b, b != 0.0 ? 1.0 : 0.0);
}

// Double emulation based on GLSL Mandelbrot Shader by Henry Thasler (www.thasler.org/blog)
//
// Emulation based on Fortran-90 double-single package. See http://crd.lbl.gov/~dhbailey/mpdist/
// Substract: res = ds_add(a, b) => res = a + b
vec2 add (vec2 dsa, vec2 dsb) {
    vec2 dsc;
    float t1, t2, e;
    t1 = plus_frc(dsa.x, dsb.x);
    e = minus_frc(t1, dsa.x);
    t2 = plus_frc(plus_frc(plus_frc(minus_frc(dsb.x, e), minus_frc(dsa.x, minus_frc(t1, e))), dsa.y), dsb.y);
    dsc.x = plus_frc(t1, t2);
    dsc.y = minus_frc(t2, minus_frc(dsc.x, t1));
    return dsc;
}

// Substract: res = ds_sub(a, b) => res = a - b
vec2 sub (vec2 dsa, vec2 dsb) {
    vec2 dsc;
    float e, t1, t2;

    t1 = minus_frc(dsa.x, dsb.x);
    e = minus_frc(t1, dsa.x);
    t2 = minus_frc(plus_frc(plus_frc(minus_frc(minus_frc(0.0, dsb.x), e), minus_frc(dsa.x, minus_frc(t1, e))), dsa.y), dsb.y);

    dsc.x = plus_frc(t1, t2);
    dsc.y = minus_frc(t2, minus_frc(dsc.x, t1));
    return dsc;
}

// Multiply: res = ds_mul(a, b) => res = a * b
vec2 mul (vec2 dsa, vec2 dsb) {
    vec2 dsc;
    float c11, c21, c2, e, t1, t2;
    float a1, a2, b1, b2, cona, conb, split = 8193.;

    cona = times_frc(dsa.x, split);
    conb = times_frc(dsb.x, split);
    a1 = minus_frc(cona, minus_frc(cona, dsa.x));
    b1 = minus_frc(conb, minus_frc(conb, dsb.x));
    a2 = minus_frc(dsa.x, a1);
    b2 = minus_frc(dsb.x, b1);

    c11 = times_frc(dsa.x, dsb.x);
    c21 = plus_frc(times_frc(a2, b2), plus_frc(times_frc(a2, b1), plus_frc(times_frc(a1, b2), minus_frc(times_frc(a1, b1), c11))));

    c2 = plus_frc(times_frc(dsa.x, dsb.y), times_frc(dsa.y, dsb.x));

    t1 = plus_frc(c11, c2);
    e = minus_frc(t1, c11);
    t2 = plus_frc(plus_frc(times_frc(dsa.y, dsb.y), plus_frc(minus_frc(c2, e), minus_frc(c11, minus_frc(t1, e)))), c21);

    dsc.x = plus_frc(t1, t2);
    dsc.y = minus_frc(t2, minus_frc(dsc.x, t1));

    return dsc;
}

// Compare: res = -1 if a < b
//              = 0 if a == b
//              = 1 if a > b
float cmp(vec2 dsa, vec2 dsb) {
    if (dsa.x < dsb.x) {
        return -1.;
    }
    if (dsa.x > dsb.x) {
        return 1.;
    }
    if (dsa.y < dsb.y) {
        return -1.;
    }
    if (dsa.y > dsb.y) {
        return 1.;
    }
    return 0.;
}

vec4 dcAdd(vec4 a, vec4 b) {
    return vec4(add(a.xy,b.xy),add(a.zw,b.zw));
}

vec4 dcMul(vec4 a, vec4 b) {
    return vec4(sub(mul(a.xy,b.xy),mul(a.zw,b.zw)),add(mul(a.xy,b.zw),mul(a.zw,b.xy)));
}

vec2 dcLength(vec4 a) {
    return add(mul(a.xy,a.xy),mul(a.zw,a.zw));
}

vec4 dcSet(vec2 a) {
    return vec4(a.x,0.,a.y,0.);
}

vec4 dcSet(vec2 a, vec2 ad) {
    return vec4(a.x, ad.x,a.y,ad.y);
}

vec4 dcMul(vec4 a, vec2 b) {
    return vec4(mul(a.xy,b),mul(a.wz,b));
}

vec3 viridis(float t) {
    const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
    const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
    const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
    const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
    const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
    const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
    const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);
    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
}

vec3 inferno(float t) {
    const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
    const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
    const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
    const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
    const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
    const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
    const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);
    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
}

vec3 plasma(float t) {
    const vec3 c0 = vec3(0.05873234392399702, 0.02333670892565664, 0.5433401826748754);
    const vec3 c1 = vec3(2.176514634195958, 0.2383834171260182, 0.7539604599784036);
    const vec3 c2 = vec3(-2.689460476458034, -7.455851135738909, 3.110799939717086);
    const vec3 c3 = vec3(6.130348345893603, 42.3461881477227, -28.51885465332158);
    const vec3 c4 = vec3(-11.10743619062271, -82.66631109428045, 60.13984767418263);
    const vec3 c5 = vec3(10.02306557647065, 71.41361770095349, -54.07218655560067);
    const vec3 c6 = vec3(-3.658713842777788, -22.93153465461149, 18.19190778539828);
    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
}

vec3 color_map(float t, int m) {
    if(m == 0) {
        return viridis(t);
    }else if(m==1) {
        return viridis(1.0 - t);
    }else if(m==2) {
        return inferno(t);
    } else if (m==3){
        return inferno(1.0-t);
    } else if (m==4){
        return plasma(t);
    } else {
        return plasma(1.0-t);
    }
}

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(u_width, u_height);
    vec4 c = dcAdd(dcSet(u_zoomCenter, u_zoomCenterDouble), dcMul(dcSet(uv*4.0 - vec2(2.0)),vec2(u_zoomSize/4.0,0.)));
    vec4 dZ = dcSet(vec2(0.0,0.0));
    // set aspect ratio on double complex y
    c.z *= u_height/u_width;
    c.w *= u_height/u_width;
    int iterations = 0;
    for (int i = 0; i <= 10000; i++) {
        if (i > u_maxIterations) break;
        if (cmp(dcLength(dZ), set(1000.0))>0.) { break; }
        dZ = dcAdd(dcMul(dZ,dZ),c);
        iterations = i;
    }
    float val = 1.0 - float(iterations)/float(u_maxIterations);
    gl_FragColor = vec4(color_map(val, u_colorMap), 1.0);
}