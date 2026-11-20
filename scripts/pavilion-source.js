import * as T from "three";
const host=document.getElementById("scene");
const fallback=document.getElementById("fallback");
function launch(){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene=new T.Scene();
  scene.background=new T.Color(0xdce5d7); scene.fog=new T.FogExp2(0xd8dfcc,.019);
  const camera=new T.PerspectiveCamera(49,1,.1,130);
  const sunlight=new T.DirectionalLight(0xfff0cf,2.6);
  sunlight.position.set(-12,18,12);sunlight.castShadow=true;
  sunlight.shadow.mapSize.set(2048,2048);
  Object.assign(sunlight.shadow.camera,{left:-23,right:23,top:21,bottom:-20,far:70});
  sunlight.shadow.normalBias=.022;scene.add(sunlight,sunlight.target,new T.HemisphereLight(0xfff8eb,0x99a591,1.9));
  const cube=new T.BoxGeometry(1,1,1);
  const material=color=>new T.MeshStandardMaterial({color,roughness:.88});
  function box(parent,x,y,z,w,h,d,mat){
    const m=new T.Mesh(cube,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  let seed=1379;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  function surface(color,repeat,wood=false){
    const c=document.createElement("canvas");c.width=c.height=256;
    const ctx=c.getContext("2d");ctx.fillStyle=color;ctx.fillRect(0,0,256,256);
    for(let i=0;i<5000;i++){
      ctx.fillStyle=random()>.5?"rgba(62,46,35,.07)":"rgba(255,250,226,.12)";
      ctx.fillRect(random()*256,random()*256,wood?1+random()*36:1+random()*3,1);
    }
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(...repeat);
    return new T.MeshStandardMaterial({map:tex,roughness:wood?.7:.95});
  }
  const plaster=surface("#decfb9",[3,1]),floor=surface("#a49d8e",[14,6]),wood=surface("#915b37",[4,1],true);
  const bronze=material(0x363f36),matte=material(0xece6d7),edge=material(0x593e2b);
  box(scene,24,-.16,2,78,.32,14,floor);
  box(scene,24,-.38,0,160,.25,112,material(0x647c59));
  box(scene,25,-.22,-14,144,.14,18,material(0x839f91));
  for(let x=-15;x<69;x+=3.8)box(scene,x,.004,2,.014,.009,14,material(0x817b6e));
  for(let z=-4;z<9;z+=3.4)box(scene,24,.005,z,78,.009,.014,material(0x817b6e));
  // Broad crowns and open trunks leave a view through the pines to the water.
  const bark=[],needles=[],twigs=[],tufts=[],ripples=[],dummy=new T.Object3D();
  function part(list,x,y,z,sx,sy,sz,rx,ry,rz,color){
    dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();
    list.push([dummy.matrix.clone(),new T.Color(color)]);
  }
  for(let i=0;i<255;i++){
    const x=i<10?-10-random()*14:random()*175-68,z=i<10?-5-random()*15:-24-random()*45,h=7+random()*13;
    part(bark,x,h*.45,z,.12+random()*.13,h,.14,0,0,0,0x564c38);
    for(let j=0;j<10;j++){
      const t=j/10,a=random()*6.28,r=(1-t*.7)*(1.4+random()*1.3);
      const by=h*(.58+.4*t), dx=Math.cos(a)*r,dz=Math.sin(a)*r;
      const v=new T.Vector3(dx,1.1,dz);
      dummy.position.set(x+dx/2,by+.55,z+dz/2);
      dummy.scale.set(.075,v.length(),.075);
      dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());dummy.updateMatrix();
      twigs.push([dummy.matrix.clone(),new T.Color(0x564c38)]);
      for(let k=0;k<6;k++){
        const angle=random()*6.28,dist=random()*1.45;
        part(tufts,x+dx+Math.cos(angle)*dist,by+.95+random()*.75,z+dz+Math.sin(angle)*dist,.36+random()*.65,.42+random()*.62,.34+random()*.6,random()*.3,angle,random()*.3,[0x325038,0x3d5c39,0x607a4d][k%3]);
      }
      part(needles,x+Math.cos(a)*r,h*(.63+.36*t),z+Math.sin(a)*r,1+r*.26, .42+random()*.34,1+random()*.36,random()*.14,a,random()*.13,[0x304e37,0x3b5d3c,0x486643,0x577647][j%4]);
    }
  }
  function instance(geom,list){const mesh=new T.InstancedMesh(geom,material(0xffffff),list.length);list.forEach(([m,c],i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,c)});scene.add(mesh)}
  instance(new T.CylinderGeometry(.69,1,1,6),bark);instance(new T.IcosahedronGeometry(1,1),needles);
  instance(new T.CylinderGeometry(.55,1,1,5),twigs);instance(new T.IcosahedronGeometry(1,0),tufts);
  for(let j=0;j<1450;j++){
    part(ripples,random()*140-47,-.139+random()*.006,-5-random()*17,.14+random()*1.9,.004,.018+random()*.065,0,random()*.15,0,[0x9cae9c,0x8caa9e,0x78948b,0xb2c2ac][j%4]);
  }
  instance(cube,ripples);
  const slots=[],ray=new T.Raycaster(),point=new T.Vector2(),textureLoader=new T.TextureLoader();
  const order=["Studio","Objects","Family","Schoolroom"];
  const matBoard=surface("#eee8d9",[1,1]);
  for(let station=0;station<4;station++){
    const x=station*18,room=order[station];
    const wall=station===2?surface("#b49d80",[3,1]):plaster;
    box(scene,x,2.47,-2.65,9.9,4.94,.38,wall);
    box(scene,x,.085,-2.425,9.9,.17,.055,bronze);
    for(let k=-2;k<=2;k++)box(scene,x+k*3.35,2.98,-3.42,.095,5.98,.11,bronze);
    box(scene,x,5.5,-2.7,18,.19,.34,wood);
    for(let j=-4;j<=4;j++)box(scene,x+j*1.94,5.85,1,.14,.32,10.5,wood);
    box(scene,x,5.98,5.75,18,.25,.3,wood);
    box(scene,x+1.65,.64,1.78,3.5,.17,.84,wood);
    for(const dx of [-1.18,1.18])box(scene,x+1.65+dx,.29,1.78,.17,.58,.59,bronze);
    MUSEUM.walls[room].forEach((id,i)=>{
      const art=MUSEUM.textures[id],ratio=art.w/art.h;
      const w=Math.min(2.52,2.18*ratio),h=w/ratio,px=x+(i-1)*3.13,py=2.56;
      box(scene,px,py,-2.38,w+.26,h+.26,.17,edge);
      box(scene,px,py,-2.28,w+.18,h+.18,.05,matBoard);
      const tex=textureLoader.load(art.url,draw);tex.colorSpace=T.SRGBColorSpace;
      const face=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));
      face.position.set(px,py,-2.244);face.userData.id=id;scene.add(face);slots.push(face);
      box(scene,px+w*.4,py-h/2-.32,-2.42,.33,.13,.02,matte);
    });
  }
  let aim=0,camX=0,yaw=0,pitch=0,frame=0,ready=false;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function draw(){
    if(!ready)return;
    const aspect=camera.aspect;
    const depth=Math.max(7.6,5.55/Math.tan(camera.fov*Math.PI/360)/aspect);
    camera.position.set(camX+2.5,2.12,depth-2.5);
    camera.lookAt(camX-.22+yaw,2.62+pitch,-2.6);
    sunlight.position.x=camX-12;sunlight.target.position.x=camX;
    renderer.render(scene,camera);
  }
  function step(){frame=0;camX+=(aim-camX)*.14;if(Math.abs(aim-camX)<.01)camX=aim;draw();if(camX!==aim)frame=requestAnimationFrame(step)}
  function resize(){let w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);draw()}
  function update(room){aim=order.indexOf(room)*18;yaw=pitch=0;if(reduced)camX=aim;if(!frame)step()}
  let start=null,moved=false;
  host.addEventListener("pointerdown",e=>{start=[e.clientX,e.clientY,yaw,pitch];moved=false;host.setPointerCapture(e.pointerId)});
  host.addEventListener("pointermove",e=>{if(!start)return;const dx=e.clientX-start[0],dy=e.clientY-start[1];if(Math.abs(dx)+Math.abs(dy)>6)moved=true;if(moved){yaw=T.MathUtils.clamp(start[2]-dx*.017,-4,4);pitch=T.MathUtils.clamp(start[3]+dy*.011,-1.1,1.8);draw()}});
  host.addEventListener("pointercancel",()=>{start=null});
  host.addEventListener("pointerup",e=>{if(!start)return;start=null;if(moved)return;const r=host.getBoundingClientRect();point.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(point,camera);const hit=ray.intersectObjects(slots,false)[0];if(hit)window.museumGallery.openWork(hit.object.userData.id)});
  window.addEventListener("hang-gallery",e=>update(e.detail));ready=true;fallback.hidden=true;resize();new ResizeObserver(resize).observe(host);
  update(window.museumGallery.current());
}
try{launch()}catch(error){console.error(error);host.querySelector("canvas")?.remove();fallback.hidden=false;document.getElementById("sceneHelp").textContent="Choose a work from the wall list to see it up close."}
