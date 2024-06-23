[[location(0)]] var<in> a_Position : vec2<f32>;

fn main() -> void {
	gl_Position = vec4<f32>(a_Position.x, a_Position.y, 0.0, 1.0);
	return;
}
