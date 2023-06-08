'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let R1 = 0.3;
let R2 = 3 * R1;
let b =  3 * R1;
let pointLocationI = 0;
let pointLocationJ = 0;
let ScaleValue = 0.0;
let InputCounter = 0.0;
let video;

let videoTexture;
let texture;

let stereoCamera;
let track;
let CanvasWidth;
let CanvasHeight;
let BackgroundVideoModel;
let RotationMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

let World_X = 0;
let World_Y = 0;
let World_Z = 0;
let Sphere;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}
// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTexBuffer    = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices,normals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        this.count = vertices.length/3;
    }

    this.TextureBufferData = function(texCoord){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STREAM_DRAW);
        this.count = texCoord.length/2;
    }



    this.Draw = function() {
        gl.uniform1i(shProgram.iDrawPoint, false);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);


        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexBuffer);
        gl.vertexAttribPointer(shProgram.itexCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.itexCoordLocation);


        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }

    this.BufferDataSphere = function (vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;
    };

    this.DrawSphere = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    };
}

// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;


    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.iTexture  = -1;
    this.itexCoordLocation = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */

function draw() {
    if (audioPanner) {
            audioPanner.setPosition(
                World_X * 1000,
                World_Y * 1000,
                World_Z * 1000
            );
        }

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    
    let ViewMatrix = m4.translation(0, 0, 0);
    let projection = m4.orthographic(-CanvasWidth / 2.0, CanvasWidth / 2.0, -CanvasHeight / 2.0, CanvasHeight / 2.0, 1.0, 20000);

    let WorldViewMatrix = m4.multiply(m4.translation(0, 0, -100), ViewMatrix);
    let ModelViewProjection = m4.multiply(projection, WorldViewMatrix);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, ModelViewProjection );
    
    gl.uniform1i(shProgram.iTexture, 0);

    BackgroundVideoModel.Draw();

    gl.clear(gl.DEPTH_BUFFER_BIT);
    stereoCamera.ApplyLeftFrustum();
    gl.colorMask(true, false, false, false);
    DrawSurface();
    DrawSphere();

    gl.clear(gl.DEPTH_BUFFER_BIT);
    stereoCamera.ApplyRightFrustum();
    gl.colorMask(false, true, true, false);
    DrawSurface();
    DrawSphere();

    gl.colorMask(true, true, true, true);
}

function DrawSurface() {
    let modelView = RotationMatrix;
    let translateToPointZero = m4.translation(0, 0, 0);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(stereoCamera.mModelViewMatrix, m4.multiply(m4.multiply(stereoCamera.mProjectionMatrix, translateToPointZero), modelView)));
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shProgram.iTexture, 0);
    surface.Draw();
}

function DrawSphere() {
    let modelView = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    let translateToPointZero;

    translateToPointZero = m4.translation(World_X, World_Y, World_Z - 20);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(stereoCamera.mModelViewMatrix, m4.multiply(m4.multiply(stereoCamera.mProjectionMatrix, translateToPointZero), modelView)));
    gl.uniform1i(shProgram.iTexture, 0);

    Sphere.Draw();
}
function CreateBackgroundData()
{
    let vertexList = [-CanvasWidth / 2.0, -CanvasHeight / 2.0, 0,
                        -CanvasWidth / 2.0, CanvasHeight / 2.0, 0,
                        CanvasWidth / 2.0, CanvasHeight / 2.0, 0,
                        -CanvasWidth / 2.0, -CanvasHeight / 2.0, 0,
                        CanvasWidth / 2.0, CanvasHeight / 2.0, 0,
                        CanvasWidth / 2.0, -CanvasHeight / 2.0, 0];
    let normalsList = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
    let textCoords = [1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1];

    return [vertexList, normalsList, textCoords];
}


function getWebcam() {
    navigator.getUserMedia({ video: true, audio: false }, function (stream) {
      video.srcObject = stream;
      track = stream.getTracks()[0];
    }, function (e) {
      console.error('Rejected!', e);
    });
  }

window.addEventListener("keydown", (event) =>{  
    switch (event.key) {
        case "ArrowLeft":
            drawParabolaL();
            break;
        case "ArrowRight":
            drawParabolaR();
            break;
        case "w":
            ProcessPressW();
            break;
        case "s":
            ProcessPressS();
            break;
        case "a":
            ProcessPressA();
            break;
        case "d":
            ProcessPressD();
            break;
        case "+":
            ProcessAddValueScale();
            break;
        case "-":
            ProcessSubValueScale();
            break;
        default:
            return; 
    }
});



function ProcessAddValueScale()
{
    ScaleValue += 0.2
    draw();
}
function ProcessSubValueScale()
{
    ScaleValue -= 0.2
    draw();
}

function drawParabolaL()
{
    InputCounter -= 0.05;
    draw();
}

function drawParabolaR()
{
    InputCounter += 0.05;
    draw();
}

function getCoordParabola() {
    let cord = Math.cos(InputCounter) * 10;
    return [cord, 30,  (cord * cord)*2-100];
}
function getX (i,j){
    let r = ( R2 - R1 ) * Math.pow(Math.sin(deg2rad(( 180 * i ) / (4 * b))),2) + R1; 
    return r * Math.cos(deg2rad(j));
}

function getY (i,j){
    let r = ( R2 - R1 ) * Math.pow(Math.sin(deg2rad(( 180 * i ) / (4 * b))),2) + R1; 
    return r * Math.sin(deg2rad(j))
}

function getZ(i){
    return i;
}

function getDerivativeU(u,v,x,y,z,delta){
    let dx_du = (getX(u+delta,v) - x) / deg2rad(delta);  
    let dy_du = (getY(u+delta,v) - y) / deg2rad(delta);
    let dz_du = (getZ(u+delta,v) - z) / deg2rad(delta);
    return [dx_du,dy_du,dz_du];
}

function getDerivativeV(u,v,x,y,z,delta){
    let dx_du = (getX(u,v+delta) - x) / deg2rad(delta);  
    let dy_du = (getY(u,v+delta) - y) / deg2rad(delta);
    let dz_du = (getZ(u,v+delta) - z) / deg2rad(delta);
    return [dx_du,dy_du,dz_du];
}

const createSphereSurface = (radius = 0.1) => {
    const lonStep = 0.5;
    const latStep = 0.5;
  
    const vertexList = Array.from({ length: (Math.PI * 2) / lonStep }, (_, lonIndex) =>
      Array.from({ length: Math.PI / latStep }, (_, latIndex) => {
        const lon = lonIndex * lonStep - Math.PI;
        const lat = latIndex * latStep - Math.PI * 0.5;
        return [
          ...getSphereSurfaceData(radius, lon, lat),
          ...getSphereSurfaceData(radius, lon + lonStep, lat),
          ...getSphereSurfaceData(radius, lon, lat + latStep),
          ...getSphereSurfaceData(radius, lon + lonStep, lat + latStep),
          ...getSphereSurfaceData(radius, lon + lonStep, lat),
          ...getSphereSurfaceData(radius, lon, lat + latStep),
        ];
      }).flat()
    ).flat();
  
    return vertexList;
  };
  
  const getSphereSurfaceData = (radius, lon, lat) => {
    const x = radius * Math.sin(lon) * Math.cos(lat);
    const y = radius * Math.sin(lon) * Math.sin(lat);
    const z = radius * Math.cos(lon);
    return [x, y, z];
  };

function CreateSurfaceData()
{
    let normalsList = [];
    let vertexList = [];
    let x = 0;
    let y = 0;
    let z = 0;
    let delta = 0.0001
    let texCoordList = [];
    // 2 * b is a lenght of a segment between two cylinders of diferent diameters
    for (let i = 0;  i< 2 * b;  i+= 0.1) {
        // j is the angle in the planes of parallels taken from the axis Ox in the direction of the axis Oy
        for (let j = 0; j< 360; j+=0.1){
            x = getX(i,j);
            y = getY(i,j);
            z = getZ(i);
            let derU = getDerivativeU(i,j,x,y,z,delta);
            let derV = getDerivativeV(i,j,x,y,z,delta);
            let res = m4.cross(derU,derV);
            
            vertexList.push(x, y, z);
            normalsList.push(res[0],res[1],res[2]);
            texCoordList.push(i/(2 * b), j/360);
          

            x = getX(i + 0.1, j);
            y = getY(i + 0.1, j);
            z = getZ(i + 0.1);
            derU = getDerivativeU(i+0.1,j,x,y,z,delta);
            derV = getDerivativeV(i+0.1,j,x,y,z,delta);
            res = m4.cross(derU,derV);
            vertexList.push(x, y, z);
            normalsList.push(res[0],res[1],res[2]);
            texCoordList.push((i+0.1)/(2 * b), j/360);
            
        }
    }
    return [vertexList, normalsList,texCoordList];  
}

function getPointLocation(){
    let pointList = [];
    let x,y,z;

    x = getX(pointLocationI,pointLocationJ);
    y = getY(pointLocationI,pointLocationJ);
    z = getZ(pointLocationI);
    pointList.push(x,y,z);
    return pointList;
}

function ReadMagnetometer() {

    let sensor = new Magnetometer({
        frequency: 60
    });
    sensor.addEventListener('reading', e => {
        RotationMatrix = getRotationMatrix(sensor.x, sensor.y, sensor.z)
    });
    sensor.start();


}


function getRotationMatrix(x, y, z) {
    var _x = -deg2rad(x)
    var _y = -deg2rad(y)
    var _z = deg2rad(-z)

    var cX = Math.cos(_x);
    var cY = Math.cos(_y);
    var cZ = Math.cos(_z);
    var sX = Math.sin(_x);
    var sY = Math.sin(_y);
    var sZ = Math.sin(_z);

    var m11 = cZ * cY - sZ * sX * sY;
    var m12 = -cX * sZ;
    var m13 = cY * sZ * sX + cZ * sY;

    var m21 = cY * sZ + cZ * sX * sY;
    var m22 = cZ * cX;
    var m23 = sZ * sY - cZ * cY * sX;

    var m31 = -cX * sY;
    var m32 = sX;
    var m33 = cX * cY;

    return [
    m11, m12, m13, 0.0,
    m21, m22, m23, 0.0,
    m31, m32, m33, 0.0,
    0.0, 0.0, 0.0, 1.0
  ];

};

function StereoCamera(
    Convergence,
    EyeSeparation,
    AspectRatio,
    FOV,
    NearClippingDistance,
    FarClippingDistance
  ) {
    this.mConvergence = Convergence;
    this.mEyeSeparation = EyeSeparation;
    this.mAspectRatio = AspectRatio;
    this.mFOV = FOV;
    this.mNearClippingDistance = NearClippingDistance;
    this.mFarClippingDistance = FarClippingDistance;
  
    this.mProjectionMatrix = null;
    this.mModelViewMatrix = null;
  
    this.ApplyLeftFrustum = function () {
      let top, bottom, left, right;
      top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
      bottom = -top;
  
      let a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;
      let b = a - this.mEyeSeparation / 2;
      let c = a + this.mEyeSeparation / 2;
  
      left = (-b * this.mNearClippingDistance) / this.mConvergence;
      right = (c * this.mNearClippingDistance) / this.mConvergence;
  
      // Set the Projection Matrix
      this.mProjectionMatrix = m4.orthographic(
        left,
        right,
        bottom,
        top,
        this.mNearClippingDistance,
        this.mFarClippingDistance
      );
  
      // Displace the world to right
      this.mModelViewMatrix = m4.translation(
        this.mEyeSeparation / 2,
        0.0,
        0.0
      );
    };
  
    this.ApplyRightFrustum = function () {
      let top, bottom, left, right;
      top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
      bottom = -top;
  
      let a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;
      let b = a - this.mEyeSeparation / 2;
      let c = a + this.mEyeSeparation / 2;
  
      left = (-c * this.mNearClippingDistance) / this.mConvergence;
      right = (b * this.mNearClippingDistance) / this.mConvergence;
  
      // Set the Projection Matrix
      this.mProjectionMatrix = m4.orthographic(
        left,
        right,
        bottom,
        top,
        this.mNearClippingDistance,
        this.mFarClippingDistance
      );
  
      // Displace the world to left
      this.mModelViewMatrix = m4.translation(
        -this.mEyeSeparation / 2,
        0.0,
        0.0
      );
    };
  }
 

function createWebCamTexture(){
    videoTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function createTextureImg(){
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
 
    const img = new Image();
    img.crossOrigin = "anonymous"
    img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Sciences_exactes.svg/256px-Sciences_exactes.svg.png';
    img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, img);
        draw();
    };
}
/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex                     = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix        = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");

    shProgram.iTexture                          = gl.getUniformLocation(prog, "tmu");//u_tex->textureLocation
    shProgram.itexCoordLocation                 = gl.getAttribLocation(prog, "texCoordLocation")//a_tex->texcoordLocation

    surface = new Model('Surface');
    let surfaceData = CreateSurfaceData()
    surface.BufferData(surfaceData[0],surfaceData[1]);
    surface.TextureBufferData(surfaceData[2]);

    BackgroundVideoModel = new Model('Camera');
    let BackgroundData = CreateBackgroundData();
    BackgroundVideoModel.BufferData(BackgroundData[0],BackgroundData[1]);
    BackgroundVideoModel.TextureBufferData(BackgroundData[2]);

    Sphere = new Model("Sphere");
    Sphere.BufferDataSphere(createSphereSurface());
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    ReadMagnetometer()
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        CanvasWidth = canvas.scrollWidth;
        CanvasHeight = canvas.scrollHeight;
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    video = document.createElement('video');
    video.setAttribute('autoplay', true);
    window.vid = video;

    getWebcam();
    createWebCamTexture();

    stereoCamera = new StereoCamera(5, 0.4, 1, 1, 4, 100);

    spaceball = new TrackballRotator(canvas, draw, 0);
    createTextureImg();
    initAudio();
    playVideo() ;

}

function playVideo() {
    draw();
    window.requestAnimationFrame(playVideo);
}

let audio = null;
let audioPanner;
let audioFilter;
let audioContext;
let audioSource;


function initAudio() {
  audio = document.getElementById("audio");

  audio.addEventListener("pause", () => {
    audioContext.resume();
  });

  audio.addEventListener("play", () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioSource = audioContext.createMediaElementSource(audio);

      audioPanner = audioContext.createPanner();
      audioFilter = audioContext.createBiquadFilter();

      audioPanner.panningModel = "HRTF";
      audioPanner.distanceModel = "linear";
      audioFilter.type = "lowpass";


      audioSource.connect(audioPanner);
      audioPanner.connect(audioFilter);
      audioFilter.connect(audioContext.destination);

      audioContext.resume();
    }
  });

  const filter = document.getElementById("filter_check");

  filter.addEventListener("change", function () {
    if (filter.checked) {
        console.log('checked')
      audioPanner.disconnect();
      audioPanner.connect(audioFilter);
      audioFilter.connect(audioContext.destination);
    } else {
      audioPanner.disconnect();
      audioPanner.connect(audioContext.destination);
    }
  });

  audio.play();
}