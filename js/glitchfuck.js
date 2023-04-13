$(window).on("load", () => {
    // Get canvas object from the DOM
    var canvas = document.getElementById("glitchfuck");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Init WebGL context
    var gl = canvas.getContext("webgl");
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }

    // Init shaders
    var vs = `
    attribute vec4 a_Position;
    void main() {
        gl_Position = a_Position;
    }`;
    var fs = `
    precision mediump float;
    uniform vec3 color1;
    uniform vec3 color2;
    void main() {
        vec2 st = gl_PointCoord;
        float mixValue = distance(st, vec2(0, 1));
      
        gl_FragColor = vec4(mix(color1, color2, mixValue), 1);
    }
    `;
    
    if (!initShaders(gl, vs, fs)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Write the positions of vertices to a vertex shader
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    // Clear canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, n);
});

function initVertexBuffers(gl) {
    // Vertices
    var dim = 2; 
    var vertices = new Float32Array([
        -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, // Triangle 1
        -1.0, 1.0, 1.0, -1.0, -1.0, -1.0 // Triangle 2 
    ]);

    // Fragment color
    var g1 = [0.5, 0.0, 0.0];
    var g2 = [0.0, 0.0, 0.5];

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Assign the vertices in buffer object to a_Position variable
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, dim, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    var color1 = gl.getUniformLocation(gl.program, 'color1');
    if (color1 < 0) {
        console.log('Failed to get the storage location of color1');
        return -1;
    }
    gl.uniform3fv(color1, g1);
    var color2 = gl.getUniformLocation(gl.program, 'color2');
    if (color2 < 0) {
        console.log('Failed to get the storage location of color2');
        return -1;
    }
    gl.uniform3fv(color2, g2);

    // Return number of vertices
    return vertices.length / dim;
}

function initShaders(gl, vs_source, fs_source) {
    // Compile shaders
    var vertexShader = makeShader(gl, vs_source, gl.VERTEX_SHADER);
    var fragmentShader = makeShader(gl, fs_source, gl.FRAGMENT_SHADER);

    // Create program
    var glProgram = gl.createProgram();

    // Attach and link shaders to the program
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, fragmentShader);
    gl.linkProgram(glProgram);
    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program");
        return false;
    }

    // Use program
    gl.useProgram(glProgram);
    gl.program = glProgram;

    return true;
}

function makeShader(gl, src, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        $("body").text("Error compiling shader: " + gl.getShaderInfoLog(shader));
        return;
    }
    return shader;
}

