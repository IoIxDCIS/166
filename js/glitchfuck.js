/*
    make a javascript script with a variable, 
*/
window.addEventListener("load", async () => {
    if(!navigator.gpu) {
        console.warn("could not find GPU, going to software rendering");
        //softwareRender();
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if(!adapter) {
        console.warn("could not find adapter, going to software rendering");
        //softwareRender();
        return;
    }

    const device = await adapter.requestDevice();

    webGPURender(device);
});

function webGPURender(device) {
    // Clear color for GPURenderPassDescriptor
    const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

    // Vertex data for triangle
    // Each vertex has 8 values representing position and color: X Y Z W R G B A

    function gradCreate(r1,g1,b1,r2,g2,b2) {
        return new Float32Array([
            -1.0,    1.0, 0, 1,     r1, g1, b1, 1,                      // a
            -1.0,   -1.0, 0, 1,     r1, g1, b1, 1,                      // a
            0.0,    1.0, 0, 1,     (r2+r1)/2, (g2+g1)/2, (b2+b1)/2, 1, // b
            
            0.0,    1.0, 0, 1,     (r2+r1)/2, (g2+g1)/2, (b2+b1)/2, 1, // b
            -1.0,   -1.0, 0, 1,     r1, g1, b1, 1,                      // a
            0.0,   -1.0, 0, 1,     (r2+r1)/2, (g2+g1)/2, (b2+b1)/2, 1, // b
        
            0.0,    1.0, 0, 1,     (r2+r1)/2, (g2+g1)/2, (b2+b1)/2, 1, // a
            0.0,   -1.0, 0, 1,     (r2+r1)/2, (g2+g1)/2, (b2+b1)/2, 1, // a
            1.0,    1.0, 0, 1,     r2, g2, b2, 1,                      // b
            
            1.0,    1.0, 0, 1,     r2, g2, b2, 1,                      // b
            0.0,   -1.0, 0, 1,     (r2+r1)/2, (g2+g1)/2, (b2+b1)/2, 1, // a
            1.0,   -1.0, 0, 1,     r2, g2, b2, 1,                      // b
        ]);
    }

    function randGradient() {
        return gradCreate(
            1.0 * Math.random(), 1.0 * Math.random(), 1.0 * Math.random(),
            1.0 * Math.random(), 1.0 * Math.random(), 1.0 * Math.random()
        );
    }


    // Main function

    async function init() {
        const vertices1 = randGradient();
        const vertices2 = randGradient();

        // Vertex and fragment shaders

        const shaders = await (await fetch("/js/shader.wgsl")).text();

        // 1: request adapter and device
        if (!navigator.gpu) {
            throw Error('WebGPU not supported.');
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw Error('Couldn\'t request WebGPU adapter.');
        }

        let device = await adapter.requestDevice();
        // 2: Create a shader module from the shaders template literal
        const shaderModule = device.createShaderModule({
            code: shaders
        });

        setInterval(async () => {await draw(device, shaderModule, vertices1, vertices2)}, 1000/60)
    }
    init();

    async function draw(device, shaderModule, vertices1, vertices2) {

        // 3: Get reference to the canvas to render on
        const canvas = document.querySelector('#glitchfuck');
        const ctx0 = canvas.getContext('webgpu');

        const c1 = new OffscreenCanvas(canvas.width, canvas.height);
        const ctx1 = c1.getContext("webgpu");
        const c2 = new OffscreenCanvas(canvas.width, canvas.height);
        const ctx2 = c2.getContext("webgpu");

        ctx0.configure({
            device: device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied'
        });
        ctx1.configure({
            device: device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied'
        });
        ctx2.configure({
            device: device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied'
        });

        // 4: Create vertex buffer to contain vertex data
        const vertexBuffer1 = device.createBuffer({
            size: vertices1.byteLength, // make it big enough to store vertices in
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        const vertexBuffer2 = device.createBuffer({
            size: vertices2.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
        device.queue.writeBuffer(vertexBuffer1, 0, vertices1, 0, vertices1.length);
        device.queue.writeBuffer(vertexBuffer2, 0, vertices2, 0, vertices2.length);

        // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
        const vertexBuffers = [{
            attributes: [{
                shaderLocation: 0, // position
                offset: 0,
                format: 'float32x4'
            }, 
            {
                shaderLocation: 1, // color
                offset: 16,
                format: 'float32x4'
            }],
            arrayStride: 32,
            stepMode: 'vertex'
        }];

        const format =  navigator.gpu.getPreferredCanvasFormat();

        const pipelineDescriptor = {
            vertex: {
                module: shaderModule,
                entryPoint: 'vertex_main',
                buffers: vertexBuffers
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fragment_main',
                targets: [
                    { format: 'rgba32float' },
                    { format: 'rgba32float' },
                    { format: 'rgba32float' }
                ]
            },
            primitive: {
                topology: 'triangle-list'
            },
            layout: 'auto'
        };

        // 6: Create the actual render pipeline

        const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
            
        // 7: Create GPUCommandEncoder to issue commands to the GPU
        // Note: render pass descriptor, command encoder, etc. are destroyed after use, fresh one needed for each frame.
        const commandEncoder = device.createCommandEncoder();

        // 8: Create GPURenderPassDescriptor to tell WebGPU which texture to draw into, then initiate render pass

        const renderPassDescriptor = {
            colorAttachments: [
            {
                clearValue: clearColor,
                loadOp: 'clear',
                storeOp: 'store',
                view: ctx0.getCurrentTexture().createView()
            },
            {
                clearValue: clearColor,
                loadOp: 'clear',
                storeOp: 'store',
                view: ctx1.getCurrentTexture().createView()
            },
            {
                clearValue: clearColor,
                loadOp: 'clear',
                storeOp: 'store',
                view: ctx2.getCurrentTexture().createView()
            },
        ]
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            
        // 9: Draw the triangle

        passEncoder.setPipeline(renderPipeline);
        passEncoder.setVertexBuffer(0, vertexBuffer1);
        passEncoder.setVertexBuffer(0, vertexBuffer2);
        passEncoder.draw(vertices1.length/8);

        // End the render pass
        passEncoder.end();

        // 10: End frame by passing array of command buffers to command queue for execution
        device.queue.submit([commandEncoder.finish()]);

    }
}

function softwareRender() {
    let c = document.getElementById("glitchfuck");
    let ctx = c.getContext("2d");
    ctx.willReadFrequently = true;

    let colors = [
        // first image
        Math.random() * 255, Math.random() * 255, Math.random() * 255,
        Math.random() * 255, Math.random() * 255, Math.random() * 255,
        // second image
        Math.random() * 255, Math.random() * 255, Math.random() * 255,
        Math.random() * 255, Math.random() * 255, Math.random() * 255,
    ]

    let dir = [
        Math.round(Math.random()),Math.round(Math.random()),
    ]
    let type1 = Math.round(Math.random());
    let type2 = Math.round(Math.random());
    let reverse = [
        false,false,false,
        false,false,false,
        false,false,false,
        false,false,false
    ];

    let alpha = 255 - (Math.random() * 128);
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    let ctx1 = new OffscreenCanvas(c.width, c.height).getContext("2d");
    ctx1.willReadFrequently = true;
    let ctx2 = new OffscreenCanvas(c.width, c.height).getContext("2d");
    ctx2.willReadFrequently = true;
    
    function animate() {
        colors.forEach((c, i) => {
            (!reverse[i] && c < 255)    ? colors[i]++ : reverse[i]=true;
            (reverse[i] && c > 0)       ? colors[i]-- : reverse[i]=false;
        });
        
        let grd1;
        if(type1 == 0) {
            grd1 = ctx.createLinearGradient(0,0,c.width*dir[0],c.height);
        } else {
            grd1 = ctx.createRadialGradient(c.width/2,c.height/2,0,c.width,c.height,c.width);
        }
        
        grd1.addColorStop(0, `rgb(${colors[0]},${colors[1]},${colors[2]})`);
        grd1.addColorStop(1, `rgb(${colors[3]},${colors[4]},${colors[5]})`);

        let grd2 = ctx.createLinearGradient(0,0,c.width,c.height*dir[1]);
        
        grd2.addColorStop(0, `rgb(${colors[6]},${colors[7]},${colors[8]})`);
        grd2.addColorStop(1, `rgb(${colors[9]},${colors[10]},${colors[11]})`);

        ctx1.fillStyle = grd1;
        ctx1.fillRect(0,0,c.width,c.height);
        ctx2.fillStyle = grd2;
        ctx2.fillRect(0,0,c.width,c.height);

        let d1 = ctx1.getImageData(0,0,c.width,c.height);
        let d2 = ctx2.getImageData(0,0,c.width,c.height);
        let d3 = ctx1.createImageData(c.width,c.height);
        
        d3.data.forEach((_, i) => {
            if(i+1 & 3 != 0) {
                d3.data[i] = d1.data[i] ^ d2.data[i];
            } else {
                d3.data[i] = alpha;
            }
        })
        ctx.putImageData(d3, 0, 0);
        requestAnimationFrame(animate);
    }
    animate();

}