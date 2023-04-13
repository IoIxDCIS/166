/*
    make a javascript script with a variable, 
*/
$(window).on("load", () => {
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

    function animate() {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        let ctx1 = new OffscreenCanvas(c.width, c.height).getContext("2d");
        ctx1.willReadFrequently = true;
        let ctx2 = new OffscreenCanvas(c.width, c.height).getContext("2d");
        ctx2.willReadFrequently = true;
        
        colors.forEach((c, i) => {
            (!reverse[i] && c < 255) ? colors[i]+=5 : reverse[i]=true;
            (reverse[i] && c > 0) ? colors[i]-=5 : reverse[i]=false;
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
})
