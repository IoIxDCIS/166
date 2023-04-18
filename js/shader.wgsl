struct VertexOut {
    @builtin(position)  position : vec4f,
    @location(0)        color1 : vec4f,
    @location(1)        color2 : vec4f,
    @location(2)        color3 : vec4f
}

@vertex
fn vertex_main(@location(0) position: vec4f,
                @location(1) color: vec4f) -> VertexOut
{
    var output: VertexOut;
    output.position = position;
    output.color1 = color;
    return output;
}

@fragment 
fn fragment_main(fragColor: VertexOut) -> @location(0) vec4f
{
    return fragColor.color1;
}