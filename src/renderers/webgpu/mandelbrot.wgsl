struct Uniforms {
  size: vec2<f32>,
  zoom_center: vec2<f32>,
  zoom_size: f32,
  max_iterations: f32,
  color_map: f32,
  _padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );

  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  return output;
}

fn mandelbrotStep(x: vec2<f32>, c: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(x.x * x.x - x.y * x.y, 2.0 * x.x * x.y) + c;
}

fn viridis(t: f32) -> vec3<f32> {
  let c0 = vec3<f32>(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
  let c1 = vec3<f32>(0.1050930431085774, 1.404613529898575, 1.384590162594685);
  let c2 = vec3<f32>(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
  let c3 = vec3<f32>(-4.634230498983486, -5.799100973351585, -19.33244095627987);
  let c4 = vec3<f32>(6.228269936347081, 14.17993336680509, 56.69055260068105);
  let c5 = vec3<f32>(4.776384997670288, -13.74514537774601, -65.35303263337234);
  let c6 = vec3<f32>(-5.435455855934631, 4.645852612178535, 26.3124352495832);
  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
}

fn inferno(t: f32) -> vec3<f32> {
  let c0 = vec3<f32>(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
  let c1 = vec3<f32>(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
  let c2 = vec3<f32>(11.60249308247187, -3.972853965665698, -15.9423941062914);
  let c3 = vec3<f32>(-41.70399613139459, 17.43639888205313, 44.35414519872813);
  let c4 = vec3<f32>(77.162935699427, -33.40235894210092, -81.80730925738993);
  let c5 = vec3<f32>(-71.31942824499214, 32.62606426397723, 73.20951985803202);
  let c6 = vec3<f32>(25.13112622477341, -12.24266895238567, -23.07032500287172);
  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
}

fn plasma(t: f32) -> vec3<f32> {
  let c0 = vec3<f32>(0.05873234392399702, 0.02333670892565664, 0.5433401826748754);
  let c1 = vec3<f32>(2.176514634195958, 0.2383834171260182, 0.7539604599784036);
  let c2 = vec3<f32>(-2.689460476458034, -7.455851135738909, 3.110799939717086);
  let c3 = vec3<f32>(6.130348345893603, 42.3461881477227, -28.51885465332158);
  let c4 = vec3<f32>(-11.10743619062271, -82.66631109428045, 60.13984767418263);
  let c5 = vec3<f32>(10.02306557647065, 71.41361770095349, -54.07218655560067);
  let c6 = vec3<f32>(-3.658713842777788, -22.93153465461149, 18.19190778539828);
  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
}

fn colorMap(t: f32, mapCode: i32) -> vec3<f32> {
  if (mapCode == 0) {
    return viridis(t);
  }
  if (mapCode == 1) {
    return viridis(1.0 - t);
  }
  if (mapCode == 2) {
    return inferno(t);
  }
  if (mapCode == 3) {
    return inferno(1.0 - t);
  }
  if (mapCode == 4) {
    return plasma(t);
  }

  return plasma(1.0 - t);
}

@fragment
fn fragmentMain(@builtin(position) fragmentPosition: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = vec2<f32>(
    fragmentPosition.x / uniforms.size.x,
    1.0 - fragmentPosition.y / uniforms.size.y
  );
  var c = uniforms.zoom_center + (uv * 4.0 - vec2<f32>(2.0, 2.0)) * (uniforms.zoom_size / 4.0);
  c.y = c.y * uniforms.size.y / uniforms.size.x;

  var x = vec2<f32>(0.0, 0.0);
  var iterations: u32 = 0u;
  let maxIterations = u32(uniforms.max_iterations);

  var i: u32 = 0u;
  loop {
    if (i >= 10000u || i >= maxIterations) {
      break;
    }

    x = mandelbrotStep(x, c);

    if (dot(x, x) > 4.0) {
      break;
    }

    iterations = i;
    i = i + 1u;
  }

  let value = 1.0 - f32(iterations) / uniforms.max_iterations;
  return vec4<f32>(colorMap(value, i32(uniforms.color_map)), 1.0);
}
