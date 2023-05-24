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
function deg2rad(angle) {
    return angle * Math.PI / 180;
}
// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTexBuffer    = gl.createBuffer();
    this.iPointBuffer  = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices,normals,texCoord) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iPointBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0]), gl.DYNAMIC_DRAW);

        

        this.count = vertices.length/3;
    }

    this.Draw = function() {
        gl.uniform1i(shProgram.iDrawPoint, false);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexBuffer);
        gl.vertexAttribPointer(shProgram.itexCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.itexCoordLocation);


        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);

        gl.uniform1i(shProgram.iDrawPoint, true);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.iWorldInverseTransposeLocation =  -1;
    this.iLightWorldPositionLocation = -1;
    this.iWorldLocation = -1;
    this.viewWorldPositionLocation = -1;
     
    this.ITMU = -1;
    this.itexCoordLocation = -1;
    this.iPointWorldLocation = -1;
    this.iDrawPoint = -1;
    this.iScaleValue = -1;
    this.iPointLocation_u_v = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12); 
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.5,0.5,0.5], 0.7);
    let WorldMatrix = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(WorldMatrix, matAccum0 );
        

    let modelViewProjection = m4.multiply(projection, matAccum1 );

    let worldInverseMatrix = m4.inverse(matAccum1);
    let worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection );
    gl.uniformMatrix4fv(shProgram.iWorldInverseTransposeLocation, false, worldInverseTransposeMatrix);
    gl.uniformMatrix4fv(shProgram.iWorldLocation, false, matAccum1);
    gl.uniform3fv(shProgram.iLightWorldPositionLocation, getCoordParabola() );
    gl.uniform3fv(shProgram.viewWorldPositionLocation, [100,150,200]);

    gl.uniform1i(shProgram.Itmu, 0);
    gl.uniform3fv(shProgram.iPointWorldLocation, getPointLocation());
    gl.uniform1f(shProgram.iScaleValue,  ScaleValue);
    gl.uniform2fv(shProgram.iPointLocation_u_v,[pointLocationI / (2 * b), pointLocationJ / 360]);
    surface.Draw();
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
function ProcessPressW()
{
    pointLocationJ -= 1.0;
    draw();
}

function ProcessPressS()
{
    pointLocationJ += 1.0;
    draw();
}

function ProcessPressA()
{
    pointLocationI -= 0.1;
    draw();
}

function ProcessPressD()
{
    pointLocationI += 0.1;
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

function createTexture(){
    let texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://raw.githubusercontent.com/MykolaFurmanchuk/VGGI_Practic/cgw/texture.jpg';
    img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        draw()
    }
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex                     = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix        = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                            = gl.getUniformLocation(prog, "color");
    
    shProgram.iAttribNormal                     = gl.getAttribLocation(prog,"normals");

    shProgram.iWorldInverseTransposeLocation    = gl.getUniformLocation(prog, "worldInverseTranspose");
    shProgram.iLightWorldPositionLocation       = gl.getUniformLocation(prog, "lightWorldPosition");
    shProgram.iWorldLocation                    = gl.getUniformLocation(prog, "world");
    shProgram.viewWorldPositionLocation         = gl.getUniformLocation(prog, "viewWorldPosition");
    
    shProgram.Itmu                              = gl.getUniformLocation(prog, "tmu");//u_tex->textureLocation
    shProgram.itexCoordLocation                 = gl.getAttribLocation(prog, "texCoordLocation")//a_tex->texcoordLocation

    shProgram.iDrawPoint                        = gl.getUniformLocation(prog,"DrawPoint");

    shProgram.iPointWorldLocation               = gl.getUniformLocation(prog,"PointWorldLocation");
    shProgram.iScaleValue                       = gl.getUniformLocation(prog,"fScaleValue");
    shProgram.iPointLocation_u_v                = gl.getUniformLocation(prog,"UserPointLocation");
    surface = new Model('Surface');
    let surfaceData = CreateSurfaceData()
    surface.BufferData(surfaceData[0],surfaceData[1],surfaceData[2]);

    //createTexture();

    gl.enable(gl.DEPTH_TEST);
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
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
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

    spaceball = new TrackballRotator(canvas, draw, 0);

    createTexture();
}