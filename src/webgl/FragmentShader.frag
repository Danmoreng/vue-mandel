precision highp float;

uniform vec2 u_zoomCenter;
uniform float u_zoomSize;
uniform int u_maxIterations;
uniform int u_colorMap;
uniform bool u_inverted;
uniform float u_width;
uniform float u_height;

vec2 f(vec2 x, vec2 c) {
    return mat2(x, -x.y, x.x)*x + c;
}
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b*cos(6.28318*(c*t+d));
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
    vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);
    c.y *= u_height/u_width;
    vec2 x = vec2(0.0);
    int iterations = 0;
    for (int i = 0; i < 10000; i++) {
        if (i > u_maxIterations) break;
        iterations = i;
        x = f(x, c);
        if (length(x) > 2.0) {
            break;
        }
    }
    float val = 1.0 - float(iterations)/float(u_maxIterations);
    gl_FragColor = vec4(color_map(val, u_colorMap), 1.0);
}