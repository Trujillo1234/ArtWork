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
  const ambient=new T.HemisphereLight(0xfff8eb,0x99a591,1.9);
  sunlight.shadow.normalBias=.022;scene.add(sunlight,sunlight.target,ambient);
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
  const landscape=new T.Group();scene.add(landscape);
  box(landscape,0,-.38,0,160,.25,112,material(0x647c59));
  box(landscape,0,-.22,-14,144,.14,18,material(0x839f91));
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
  function instance(geom,list){const mesh=new T.InstancedMesh(geom,material(0xffffff),list.length);list.forEach(([m,c],i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,c)});landscape.add(mesh)}
  instance(new T.CylinderGeometry(.69,1,1,6),bark);instance(new T.IcosahedronGeometry(1,1),needles);
  instance(new T.CylinderGeometry(.55,1,1,5),twigs);instance(new T.IcosahedronGeometry(1,0),tufts);
  for(let j=0;j<1450;j++){
    part(ripples,random()*140-47,-.139+random()*.006,-5-random()*17,.14+random()*1.9,.004,.018+random()*.065,0,random()*.15,0,[0x9cae9c,0x8caa9e,0x78948b,0xb2c2ac][j%4]);
  }
  instance(cube,ripples);
  const museum=window.museumGallery;
  const spacing=21;
  const wingFinishes={
    Studio:plaster,
    Objects:surface("#ad9178",[3,1]),
    Family:surface("#c0c5aa",[3,1]),
    Schoolroom:surface("#bec8c3",[3,1])
  };
  const frameGeometry=new T.PlaneGeometry(1,1);
  const hitTest=new T.Raycaster(),pointer=new T.Vector2();
  const shadeGeometry=new T.ConeGeometry(.4,.33,24,1,true);
  const bulbGeometry=new T.SphereGeometry(.12,12,8);
  const shade=material(0x37453c);shade.side=T.DoubleSide;
  const globe=new T.MeshStandardMaterial({color:0xffefd6,emissive:0xffc680,emissiveIntensity:.2});
  const suite=new Map();
  // Each bay has an uninterrupted view to the pines between three freestanding walls.
  const wallPositions=[[0,-2.9,0],[-7.55,.55,1.06],[7.55,.55,-1.06]];
  const aims=wallPositions.map(([x,z])=>Math.atan2(x,4.45-z));
  function buildRoom(i){
    const description=museum.galleries[i],group=new T.Group(),frames=[];
    group.position.x=i*spacing;scene.add(group);
    const finish=wingFinishes[description.wing];
    box(group,0,-.16,2,spacing,.32,15,floor);
    for(let j=-2;j<=2;j++)box(group,j*4,.005,2,.012,.008,15,bronze);
    for(let j=-4;j<=4;j++)box(group,j*2.22,6.38,1.2,.16,.32,11.5,wood);
    for(const z of [-3.9,.8,6.4])box(group,0,6.13,z,spacing,.18,.24,wood);
    for(const x of [-9.6,9.6]){
      box(group,x,3.02,-3.9,.16,6.04,.16,bronze);
      box(group,x,3.02,6.4,.16,6.04,.16,bronze);
    }
    box(group,2.35,.49,2.25,2.5,.13,.58,wood);
    for(const x of [1.45,3.25])box(group,x,.22,2.25,.12,.44,.46,bronze);
    const lamps=[];
    description.walls.forEach((entries,wall)=>{
      const [x,z,angle]=wallPositions[wall],panel=new T.Group();
      panel.rotation.y=angle;panel.position.set(x,0,z);group.add(panel);
      const width=wall===0?10:8.2;
      box(panel,0,2.45,0,width,4.9,.26,finish);
      box(panel,0,.1,.14,width,.2,.04,bronze);
      const lampX=x+Math.sin(angle)*1.25, lampZ=z+Math.cos(angle)*1.25;
      // A narrow crossbar carries the pendant cord between the timber rafters.
      box(group,lampX,6.14,lampZ,2.3,.11,.13,wood);
      box(group,lampX,5.52,lampZ,.025,1.22,.025,bronze);
      const hood=new T.Mesh(shadeGeometry,shade);hood.position.set(lampX,4.79,lampZ);group.add(hood);
      const bulb=new T.Mesh(bulbGeometry,globe);bulb.position.set(lampX,4.60,lampZ);group.add(bulb);
      for(const side of [-1,1]){
        const offset=side*(width*.30);
        const px=lampX+Math.cos(angle)*offset,pz=lampZ-Math.sin(angle)*offset;
        box(group,px,6.14,pz,2.3,.11,.13,wood);
        box(group,px,5.48,pz,.018,1.28,.018,bronze);
        const pendant=new T.Mesh(shadeGeometry,shade);pendant.scale.setScalar(.72);pendant.position.set(px,4.76,pz);group.add(pendant);
        const lamp=new T.Mesh(bulbGeometry,globe);lamp.scale.setScalar(.76);lamp.position.set(px,4.63,pz);group.add(lamp);
      }
      lamps.push([lampX,4.50,lampZ,x,2.1,z]);
      const cols=Math.min(3,Math.ceil(entries.length/2));
      entries.forEach((entry,j)=>{
        const row=Math.floor(j/cols),count=Math.min(cols,entries.length-row*cols);
        const px=(j%cols-(count-1)/2)*(width-.7)/3;
        const py=entries.length===1?2.45:row===0?3.44:1.45;
        const ratio=FRAME_RATIOS[entry.view.file]||1;
        const w=Math.min((width-.8)/3-.22,1.53*ratio),h=w/ratio;
        box(panel,px,py,.18,w+.2,h+.2,.11,edge);
        box(panel,px,py,.25,w+.13,h+.13,.045,matte);
        const picture=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,emissive:0xffffff,emissiveIntensity:.22});
        const face=new T.Mesh(frameGeometry,picture);
        face.scale.set(w,h,1);face.position.set(px,py,.282);face.userData.entry=entry;panel.add(face);frames.push(face);
        box(panel,px+w*.35,py-h*.5-.17,.175,.26,.075,.025,matte);
      });
    });
    const bay={group,frames,lamps};suite.set(i,bay);return bay;
  }
  const loader=new T.TextureLoader();
  function loadPictures(bay){
    if(bay.loaded)return;
    bay.loaded=true;
    for(const face of bay.frames){
      const view=face.userData.entry.view;
      const tex=loader.load(window.localFrames?.[view.file]||view.thumb,()=>{if(!bay.retired)draw()});
      tex.colorSpace=T.SRGBColorSpace;
      face.material.map=tex;face.material.emissiveMap=tex;face.material.needsUpdate=true;
    }
  }
  function retire(bay){
    bay.retired=true;scene.remove(bay.group);
    for(const f of bay.frames){f.material.map?.dispose();f.material.dispose()}
  }
  const fixtures=wallPositions.map(()=>{
    const light=new T.SpotLight(0xffd198,0,14,1.06,.65,1.25);
    scene.add(light,light.target);return light;
  });
  const skyPoints=[];
  for(let i=0;i<700;i++){
    const a=random()*Math.PI*2,b=.06+random()*1.45;
    skyPoints.push(89*Math.cos(b)*Math.sin(a),89*Math.sin(b),89*Math.cos(b)*Math.cos(a));
  }
  const starGeo=new T.BufferGeometry();starGeo.setAttribute("position",new T.Float32BufferAttribute(skyPoints,3));
  const stars=new T.Points(starGeo,new T.PointsMaterial({color:0xf6e7bf,size:.105,fog:false}));
  scene.add(stars);
  const moon=new T.Mesh(new T.SphereGeometry(1.9,16,12),new T.MeshBasicMaterial({color:0xffe7bb,fog:false}));scene.add(moon);
  let camX=0,destination=0,heading=0,aimHeading=0,pitch=0,frame=0,active=-1,wall=-1,ready=false;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function draw(){
    if(!ready)return;
    camera.position.set(camX+.18,2.38,4.45);
    camera.lookAt(camX+.18+Math.sin(heading)*8,2.50+pitch,4.45-Math.cos(heading)*8);
    landscape.position.x=camX;
    sunlight.position.x=camX-12;sunlight.target.position.x=camX;stars.position.x=camX;moon.position.set(camX-33,15,-52);
    renderer.render(scene,camera);
  }
  function animate(){
    frame=0;
    camX+=(destination-camX)*.16;heading+=(aimHeading-heading)*.19;
    if(Math.abs(destination-camX)<.018)camX=destination;
    if(Math.abs(aimHeading-heading)<.002)heading=aimHeading;
    draw();if(camX!==destination||heading!==aimHeading)frame=requestAnimationFrame(animate);
  }
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;
    camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.max(.43,.72/camera.aspect)));
    camera.updateProjectionMatrix();renderer.setSize(w,h,false);draw();
  }
  function update({roomIndex,wallIndex,night}){
    if(active!==roomIndex){
      const jump=Math.abs(roomIndex-active)>1;
      for(const [i,bay] of suite)if(Math.abs(i-roomIndex)>1){retire(bay);suite.delete(i)}
      for(let i=Math.max(0,roomIndex-1);i<=Math.min(museum.galleries.length-1,roomIndex+1);i++){
        const bay=suite.get(i)||buildRoom(i);loadPictures(bay);
      }
      destination=roomIndex*spacing;if(jump||reduced)camX=destination;
    }
    if(active!==roomIndex||wall!==wallIndex){aimHeading=aims[wallIndex];pitch=0}
    active=roomIndex;wall=wallIndex;
    scene.background.set(night?0x10203a:0xdce5d7);scene.fog.color.set(night?0x182d40:0xd8dfcc);
    sunlight.color.set(night?0x95b5ff:0xfff0cf);sunlight.intensity=night?.42:2.6;
    ambient.intensity=night?.45:1.9;ambient.color.set(night?0xa7badc:0xfff8eb);
    globe.emissiveIntensity=night?3:.25;stars.visible=moon.visible=night;
    suite.get(active).lamps.forEach(([x,y,z,tx,ty,tz],j)=>{
      const light=fixtures[j];light.position.set(destination+x,y,z);light.target.position.set(destination+tx,ty,tz);light.intensity=night?37:1.8;
    });
    if(reduced)heading=aimHeading;
    if(!frame)animate();
  }
  let down=null,moved=false;
  host.addEventListener("pointerdown",e=>{down=[e.clientX,e.clientY,heading,pitch];moved=false;host.setPointerCapture(e.pointerId)});
  host.addEventListener("pointermove",e=>{
    if(!down)return;const dx=e.clientX-down[0],dy=e.clientY-down[1];
    if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
    if(moved){heading=aimHeading=T.MathUtils.clamp(down[2]-dx*.005,-1.65,1.65);pitch=T.MathUtils.clamp(down[3]+dy*.018,-2.6,3);draw()}
  });
  host.addEventListener("pointercancel",()=>{down=null});
  host.addEventListener("pointerup",e=>{
    if(!down)return;down=null;
    if(moved){const closest=aims.reduce((best,a,i)=>Math.abs(a-heading)<Math.abs(aims[best]-heading)?i:best,0);
      if(closest!==wall && museum.galleries[active].walls[closest].length)museum.visit(active,closest);return}
    const r=host.getBoundingClientRect();
    pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
    hitTest.setFromCamera(pointer,camera);
    const hit=hitTest.intersectObjects(suite.get(active).frames,false)[0];
    if(hit){const {id,index}=hit.object.userData.entry;museum.openWork(id,index)}
  });
  window.addEventListener("pavilion-view",e=>update(e.detail));
  ready=true;fallback.hidden=true;resize();update(museum.current());new ResizeObserver(resize).observe(host);
}
try{launch()}catch(error){console.error(error);host.querySelector("canvas")?.remove();fallback.hidden=false;document.getElementById("sceneHelp").textContent="Choose a photograph from the wall list to open it."}
