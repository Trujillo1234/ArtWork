import * as T from "three";
import {architecture} from "./architecture.js";
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
  const wood=surface("#915b37",[4,1],true);
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
  const steel=material(0x435663),brick=surface("#a6563e",[5,2]),cream=material(0xe8d3ad);
  const copper=material(0x57756c),white=material(0xe2e4de),orange=material(0xb95b38);
  const dock=surface("#957a55",[9,4],true),tile=surface("#b08d70",[6,4]),deck=surface("#889398",[5,3]);
  const cityGlass=material(0x455e70),asphalt=material(0x414d56);
  const windowLight=new T.MeshStandardMaterial({color:0xc3d4d3,emissive:0xffce84});
  const tube=new T.CylinderGeometry(1,1,1,12),tip=new T.ConeGeometry(1,1,24),hoop=new T.TorusGeometry(1,.045,8,80);
  const arch=new T.TorusGeometry(1,.09,8,40,Math.PI);
  const globeShape=new T.SphereGeometry(1,16,12);
  function shape(parent,geometry,mat,x,y,z,sx,sy,sz){
    const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
  }
  function beam(parent,a,b,r,mat){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);
    const mesh=shape(parent,tube,mat,0,0,0,r,v.length(),r);
    mesh.position.copy(start).lerp(end,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
  }
  // The three places use different structures to carry the frames.
  function buildSetting(group,place){
    if(place===0){
      box(group,0,-.16,1,20,.32,13,dock);
      for(let z=-5;z<8;z+=.42)box(group,0,.005,z,20,.009,.014,bronze);
      for(const x of [-9.4,-5.4,5.4,9.4]){
        box(group,x,2.83,-3.3,.22,5.66,.24,wood);
        beam(group,[x,4.8,-3.3],[x+.7,5.65,-3.3],.10,wood);
      }
      for(const z of [-3.3,4.9]){
        box(group,0,5.7,z,20,.25,.29,wood);
        for(const x of [-9.4,9.4])box(group,x,2.8,z,.22,5.6,.24,wood);
      }
      for(let x=-9;x<=9;x+=2.25)box(group,x,5.94,.75,.15,.21,9,wood);
      for(const x of [-8,8]){
        box(group,x,.65,-6.4,3.8,.12,.12,wood);
        for(const dx of [-1.8,0,1.8])box(group,x+dx,.4,-6.4,.10,1.2,.1,wood);
      }
      // A low boardwalk crossing and a green-and-cream trolley beyond the exhibition.
      box(group,0,.26,-10,20,.24,2.3,dock);
    }else if(place===1){
      box(group,0,-.18,1,21,.36,18,tile);
      for(let j=-9;j<10;j+=1.2)box(group,j,.01,1,.018,.01,18,cream);
      for(let z=-7;z<9;z+=1.2)box(group,0,.012,z,21,.01,.018,cream);
      // A brick clock pavilion anchors the square behind the open colonnade.
      box(group,0,2.4,-12,12,4.8,3.5,brick);box(group,0,4.88,-12,12.5,.28,4,cream);
      box(group,2.8,5.7,-12,3.4,2.3,3,brick);box(group,2.8,6.8,-12,3.7,.25,3.3,cream);
      const clock=shape(group,tube,cream,2.8,5.75,-10.45,.83,.12,.83);clock.rotation.x=Math.PI/2;
      box(group,2.8,5.99,-10.35,.07,.49,.04,bronze);box(group,2.99,5.72,-10.35,.38,.07,.04,bronze);
      shape(group,tip,copper,2.8,7.85,-12,2.45,2.05,2.45);shape(group,tube,cream,2.8,9.13,-12,.05,.83,.05);
      for(const x of [-4.7,-3,3,4.7])box(group,x,2.6,-10.22,1.03,2,.08,cityGlass);
    }else if(place===2){
      box(group,0,-.16,0,21,.32,18,deck);
      for(const x of [-8.2,8.2]){
        box(group,x,.015,0,.1,.02,16,orange);
        for(const z of [-5,4])beam(group,[x,0,z],[x*.72,6.75,z],.14,steel);
      }
      for(const z of [-5,4]){
        beam(group,[-6,6.7,z],[6,6.7,z],.11,steel);
        beam(group,[-6,7.4,z],[6,7.4,z],.09,steel);
        for(let x=-6;x<6;x+=1.5)beam(group,[x,6.7,z],[x+.75,7.4,z],.065,steel);
      }
      // Launch vehicle, service levels and a layered downtown silhouette.
      shape(group,tube,white,-3.65,4.4,-9,.85,7.7,.85);shape(group,tip,white,-3.65,9.05,-9,.85,1.6,.85);
      for(const y of [1.4,4.6,7.1])shape(group,tube,steel,-3.65,y,-9,.86,.38,.86);
      for(const x of [-4.56,-2.74]){shape(group,tube,orange,x,2.05,-9,.31,3.65,.31);shape(group,tip,white,x,4.22,-9,.32,.7,.32)}
      for(let j=0;j<11;j++){
        const x=(j-5)*2.5,h=3+(j*7%9)*.67;
        box(group,x,h/2,-17-j%3,1.95,h,2.0,cityGlass);
        for(let y=.7;y<h-.2;y+=.92)box(group,x,y,-15.98-j%3,1.65,.12,.02,windowLight);
      }
    }
  }
  const addDetail=architecture();
  const palettes=[[0xff4149,0xffcc64,0x38e6a2,0x6eacff],[0xffbd66,0xff425c,0xffeaa0,0x5dde99],[0x79dfff,0xff548c,0xffe89a,0x8da1ff]];
  const glowCanvas=document.createElement("canvas");glowCanvas.width=glowCanvas.height=64;
  const gc=glowCanvas.getContext("2d"),grad=gc.createRadialGradient(32,32,0,32,32,32);
  for(const [pos,color] of [[0,"#fff"],[.15,"#fffd"],[.4,"#fff4"],[1,"#fff0"]])grad.addColorStop(pos,color);
  gc.fillStyle=grad;gc.fillRect(0,0,64,64);const glowTex=new T.CanvasTexture(glowCanvas);
  const wireMat=new T.LineBasicMaterial({color:0x36453a});
  const haloMat=new T.PointsMaterial({map:glowTex,vertexColors:true,size:.30,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  function hangLights(panel,width,place,holiday,owned){
    const points=[],colors=[],wire=[];
    for(let i=0;i<=36;i++){
      const t=i/36,x=(t-.5)*width,y=5.02-.53*Math.sin(t*Math.PI)**2,z=.50;
      wire.push(new T.Vector3(x,y,z));
      if(i%2===0){points.push(x,y-.055,z);const color=new T.Color(palettes[place%palettes.length][i/2%4]);colors.push(color.r,color.g,color.b)}
    }
    const cord=new T.BufferGeometry().setFromPoints(wire);owned.push(cord);panel.add(new T.Line(cord,wireMat));
    const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(points,3));g.setAttribute("color",new T.Float32BufferAttribute(colors,3));owned.push(g);
    const halo=new T.Points(g,haloMat);panel.add(halo);holiday.push(halo);
    const bulbs=new T.InstancedMesh(globeShape,festiveMat,points.length/3);
    for(let i=0;i<points.length/3;i++){
      dummy.position.fromArray(points,3*i);dummy.scale.set(.064,.094,.064);dummy.rotation.set(0,0,0);dummy.updateMatrix();
      bulbs.setMatrixAt(i,dummy.matrix);bulbs.setColorAt(i,new T.Color().fromArray(colors,i*3));
    }
    panel.add(bulbs);holiday.push(bulbs);owned.push(bulbs);
  }
  const festiveMat=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  function buildRoom(i){
    const description=museum.galleries[i],group=new T.Group(),frames=[];
    group.position.x=i*spacing;scene.add(group);
    const place=description.theme,holiday=[],owned=[];
    buildSetting(group,place);
    if(place>=3)box(group,0,-.18,1,21,.36,19,place===3?deck:tile);
    box(group,0,-.12,8.55,21,.24,3.2,place===0?dock:place===1||place===4?tile:deck);
    addDetail(group,place,owned);
    const lamps=[];
    description.walls.forEach((entries,wall)=>{
      const [x,z,angle]=wallPositions[wall],panel=new T.Group();
      panel.rotation.y=angle;panel.position.set(x,0,z);group.add(panel);
      const width=wall===0?10:8.2;
      if(place===0){
        box(panel,0,4.94,0,width+.3,.20,.24,wood);
        for(const end of [-1,1])box(panel,end*width/2,2.45,0,.20,4.9,.22,wood);
      }else if(place===1){
        box(panel,0,.38,-.08,width,.76,.36,brick);
        for(let col=0;col<3;col++){
          const step=width/3,cx=step*(col-1);
          shape(panel,arch,cream,cx,3.38,-.12,step*.47,1.38,1.1);
        }
        for(let col=0;col<=3;col++){
          const cx=width*(col/3-.5);
          box(panel,cx,1.70,-.12,.33,3.4,.4,brick);
          box(panel,cx,3.35,-.12,.51,.21,.51,cream);
        }
        box(panel,0,4.96,-.14,width+.48,.24,.46,brick);
      }else if(place>=3){
        const frame=place===3?steel:wood;
        for(const side of [-1,1])box(panel,side*(width/2-.08),2.45,0,.14,4.9,.17,frame);
        for(const h of [.56,2.44,4.84])box(panel,0,h,-.04,width,.10,.14,frame);
        box(panel,0,5,-.04,width+.30,.14,place===3?.74:.30,place===3?orange:cream);
      }else{
        shape(panel,hoop,steel,0,2.58,-.28,width*.51,2.67,.8);
        for(const h of [.62,2.4,4.35])box(panel,0,h,-.18,width,.12,.18,steel);
        for(const end of [-1,1])beam(panel,[end*width*.42,0,-.2],[end*width*.49,4.6,-.2],.095,orange);
      }
      hangLights(panel,width,place,holiday,owned);
      const lampX=x+Math.sin(angle)*1.25, lampZ=z+Math.cos(angle)*1.25;
      // A narrow crossbar carries the pendant cord between the timber rafters.
      box(panel,0,6.14,1.25,width+.25,.14,.17,place===0?wood:steel);
      for(const side of [-1,1]){
        const sx=side*(width*.5-.08);
        beam(panel,[sx,4.91,0],[sx,6.14,1.25],.055,place===0?wood:steel);
      }
      box(group,lampX,5.52,lampZ,.025,1.22,.025,bronze);
      const hood=new T.Mesh(shadeGeometry,shade);hood.position.set(lampX,4.79,lampZ);group.add(hood);
      const bulb=new T.Mesh(bulbGeometry,globe);bulb.position.set(lampX,4.60,lampZ);group.add(bulb);
      for(const side of [-1,1]){
        const offset=side*(width*.30);
        const px=lampX+Math.cos(angle)*offset,pz=lampZ-Math.sin(angle)*offset;

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
        if(place===0){
          for(const dx of [-w*.34,w*.34])beam(panel,[px+dx,4.85,.10],[px+dx,py+h/2,.10],.018,bronze);
        }else if(place===1){
          box(panel,px,py/2,-.01,.085,py,.15,bronze);
        }else{
          box(panel,px,py,-.025,.13,1.9,.22,steel);
        }
        box(panel,px,py,.18,w+.2,h+.2,.11,edge);
        box(panel,px,py,.25,w+.13,h+.13,.045,matte);
        const picture=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,emissive:0xffffff,emissiveIntensity:.22});
        const face=new T.Mesh(frameGeometry,picture);
        face.scale.set(w,h,1);face.position.set(px,py,.282);face.userData.entry=entry;panel.add(face);frames.push(face);
        box(panel,px+w*.35,py-h*.5-.17,.175,.26,.075,.025,matte);
      });
    });
    if(place===0){
      const trolleyWork=[...museum.byId.values()].find(work=>work.title==="The Woodlands trolley");
      if(trolleyWork){
        const target=new T.Mesh(cube,hitOnly);
        target.scale.set(1.75,2.1,4.14);target.position.set(4.05,1.34,4.65);
        target.userData.entry={id:trolleyWork.id,index:0};group.add(target);frames.push(target);
      }
    }
    const bay={group,frames,lamps,holiday,owned};suite.set(i,bay);return bay;
  }
  const hitOnly=new T.MeshBasicMaterial({visible:false});
  const loader=new T.TextureLoader();
  function loadPictures(bay){
    if(bay.loaded)return;
    bay.loaded=true;
    for(const face of bay.frames){
      const view=face.userData.entry.view;if(!view)continue;
      const tex=loader.load(window.localFrames?.[view.file]||view.thumb,()=>{if(!bay.retired)draw()});
      tex.colorSpace=T.SRGBColorSpace;
      face.material.map=tex;face.material.emissiveMap=tex;face.material.needsUpdate=true;
    }
  }
  function retire(bay){
    for(const resource of bay.owned)resource.dispose();
    bay.retired=true;scene.remove(bay.group);
    for(const f of bay.frames){if(f.material===hitOnly)continue;f.material.map?.dispose();f.material.dispose()}
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
  let walkX=0,walkZ=7.6,crossing=false,lastTime=0;
  const held=new Set();
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function draw(){
    if(!ready)return;
    camera.position.set(camX+walkX,1.78,walkZ);
    camera.lookAt(camera.position.x+Math.sin(heading)*8,2.46+pitch,walkZ-Math.cos(heading)*8);
    landscape.position.x=camX;
    sunlight.position.x=camX-12;sunlight.target.position.x=camX;stars.position.x=camX;moon.position.set(camX-33,15,-52);
    renderer.render(scene,camera);
  }
  function animate(){
    frame=0;
    camX+=(destination-camX)*.16;heading+=(aimHeading-heading)*.19;
    if(Math.abs(destination-camX)<.018)camX=destination;
    if(Math.abs(aimHeading-heading)<.002)heading=aimHeading;
    movePlayer();draw();if(held.size||camX!==destination||heading!==aimHeading)frame=requestAnimationFrame(animate);
  }
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;
    camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.max(.49,.81/camera.aspect)));
    camera.updateProjectionMatrix();renderer.setSize(w,h,false);draw();
  }
  function update({roomIndex,wallIndex,night}){
    if(active!==roomIndex){
      const jump=Math.abs(roomIndex-active)>1;
      for(const [i,bay] of suite)if(Math.abs(i-roomIndex)>1){retire(bay);suite.delete(i)}
      for(let i=Math.max(0,roomIndex-1);i<=Math.min(museum.galleries.length-1,roomIndex+1);i++){
        const bay=suite.get(i)||buildRoom(i);loadPictures(bay);
      }
      destination=roomIndex*spacing;camX=destination;
    }
    if(!crossing && (active!==roomIndex||wall!==wallIndex||museum.visiting)){
      walkX=0;walkZ=7.6;const [x,z]=wallPositions[wallIndex];heading=aimHeading=Math.atan2(x,walkZ-z);pitch=0;
    }
    active=roomIndex;wall=wallIndex;
    scene.background.set(night?0x10203a:0xdce5d7);scene.fog.color.set(night?0x182d40:0xd8dfcc);
    sunlight.color.set(night?0x95b5ff:0xfff0cf);sunlight.intensity=night?.42:2.6;
    ambient.intensity=night?.45:1.9;ambient.color.set(night?0xa7badc:0xfff8eb);
    for(const bay of suite.values())for(const item of bay.holiday)item.visible=night;
    landscape.visible=museum.galleries[active].theme!==2;
    windowLight.emissiveIntensity=night?1.1:.05;
    globe.emissiveIntensity=night?3:.25;stars.visible=moon.visible=night;
    suite.get(active).lamps.forEach(([x,y,z,tx,ty,tz],j)=>{
      const light=fixtures[j];light.position.set(destination+x,y,z);light.target.position.set(destination+tx,ty,tz);light.intensity=night?25:1.5;
    });
    if(reduced)heading=aimHeading;
    if(!frame && !crossing)frame=requestAnimationFrame(animate);
  }
  function available(x,z){
    if(z < -6.95 || z>9.75 || x< -10.15 || x>(museum.galleries.length-1)*spacing+10.15)return false;
    const nearest=Math.max(0,Math.min(museum.galleries.length-1,Math.round(x/spacing)));
    const local=x-nearest*spacing,place=museum.galleries[nearest].theme;
    if(Math.abs(local)>9.95 && z<7.1)return false;
    if(place===0 && Math.abs(local-4.05)<1.19 && Math.abs(z-4.65)<2.40)return false;
    if(place===3 && local>5.1 && local<7 && z< -2.2)return false;
    if(place===4 && Math.abs(Math.abs(local)-5.8)<1.6 && Math.abs(z+5.5)<.86)return false;
    return wallPositions.every(([cx,cz,a],i)=>{
      const dx=local-cx,dz=z-cz;
      return Math.abs(dx*Math.cos(a)-dz*Math.sin(a))>(i?4.1:5)+.2 || Math.abs(dx*Math.sin(a)+dz*Math.cos(a))>.47;
    });
  }
  function movePlayer(){
    const now=performance.now(),dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
    if(!held.size)return;
    const f=Number(held.has("w"))-Number(held.has("s")),r=Number(held.has("d"))-Number(held.has("a"));
    heading=aimHeading+=dt*1.55*(Number(held.has("e"))-Number(held.has("q")));
    const distance=dt*3.35/Math.max(1,Math.hypot(f,r)),x=camX+walkX;
    const nx=x+distance*(Math.sin(heading)*f+Math.cos(heading)*r),nz=walkZ+distance*(-Math.cos(heading)*f+Math.sin(heading)*r);
    if(available(nx,walkZ))walkX=nx-camX;
    if(available(camX+walkX,nz))walkZ=nz;
    const absolute=camX+walkX,next=Math.round(absolute/spacing);
    if(next!==active){crossing=true;walkX=absolute-next*spacing;museum.visit(next,0);crossing=false;}
  }
  function begin(key){held.add(key);if(!frame){lastTime=performance.now();frame=requestAnimationFrame(animate)}}
  const keyMap={arrowup:"w",arrowdown:"s",arrowleft:"a",arrowright:"d"};
  function key(e){const k=e.key.toLowerCase();return keyMap[k]||k}
  host.onkeydown=e=>{const k=key(e);if("wasdqe".split("").includes(k)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();begin(k)}};
  window.addEventListener("keyup",e=>held.delete(key(e)));
  host.addEventListener("blur",()=>held.clear());window.addEventListener("blur",()=>held.clear());
  document.addEventListener("visibilitychange",()=>held.clear());
  for(const button of document.querySelectorAll("[data-step]")){
    button.onpointerdown=e=>{e.preventDefault();host.focus({preventScroll:true});button.setPointerCapture(e.pointerId);begin(button.dataset.step)};
    button.onlostpointercapture=()=>held.delete(button.dataset.step);
    button.onclick=e=>{if(e.detail===0){begin(button.dataset.step);setTimeout(()=>held.delete(button.dataset.step),200)}};
  }
  let down=null,moved=false;
  host.addEventListener("pointerdown",e=>{host.focus({preventScroll:true});down=[e.clientX,e.clientY,heading,pitch];moved=false;host.setPointerCapture(e.pointerId)});
  host.addEventListener("pointermove",e=>{
    if(!down)return;const dx=e.clientX-down[0],dy=e.clientY-down[1];
    if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
    if(moved){heading=aimHeading=down[2]-dx*.005;pitch=T.MathUtils.clamp(down[3]+dy*.018,-12,15);draw()}
  });
  host.addEventListener("pointercancel",()=>{down=null});
  host.addEventListener("pointerup",e=>{
    if(!down)return;down=null;
    if(moved)return;
    const r=host.getBoundingClientRect();
    pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
    hitTest.setFromCamera(pointer,camera);
    const hit=hitTest.intersectObjects(Array.from(suite.values()).flatMap(b=>b.frames),false)[0];
    if(hit){const {id,index}=hit.object.userData.entry;museum.openWork(id,index)}
  });
  window.addEventListener("pavilion-view",e=>update(e.detail));
  ready=true;fallback.hidden=true;resize();update(museum.current());new ResizeObserver(resize).observe(host);
}
try{launch()}catch(error){console.error(error);host.querySelector("canvas")?.remove();fallback.hidden=false;document.getElementById("sceneHelp").textContent="Choose a photograph from the wall list to open it."}
