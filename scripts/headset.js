import * as T from "three";

export function enableHeadset({renderer,scene,camera,pose,walk,drawFlat,resize,frames,museum,distance}){
  const button=document.querySelector("#enterVR");
  const help=document.querySelector("#vrHelp");
  if(!navigator.xr||!window.isSecureContext)return;
  const xr=renderer.xr,rig=new T.Group();
  scene.add(rig);rig.add(camera);xr.enabled=true;
  xr.setFramebufferScaleFactor(.85);
  const direction=new T.Vector3(),eye=new T.Vector3(),ray=new T.Raycaster();
  const rayShape=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]);
  const rayMaterial=new T.LineBasicMaterial({color:0xffdda0});
  const inspectMaterial=new T.MeshBasicMaterial({color:0xffffff});
  const detail=new T.Mesh(new T.PlaneGeometry(),inspectMaterial);
  scene.add(detail);detail.visible=false;
  const loader=new T.TextureLoader();
  let enlarged=null,sequence=0,latched=false,previousTime=0,turn=0;
  function close(){
    ++sequence;detail.visible=false;inspectMaterial.map=null;enlarged?.dispose();enlarged=null;
  }
  function select(controller){
    if(detail.visible){close();return}
    ray.setFromXRController(controller);
    const hit=ray.intersectObjects(frames(),false)[0];
    if(!hit)return;
    const {id,index}=hit.object.userData.entry;
    const view=museum.byId.get(id).views[index],token=++sequence;
    const head=xr.getCamera();head.getWorldPosition(eye);head.getWorldDirection(direction);
    detail.position.copy(eye).addScaledVector(direction,1.35);
    detail.lookAt(eye);const ratio=FRAME_RATIOS[view.file]||1;
    const width=Math.min(1.28,.91*ratio);detail.scale.set(width,width/ratio,1);
    inspectMaterial.map=hit.object.material.map||null;inspectMaterial.needsUpdate=true;detail.visible=true;
    loader.load(window.localFrames?.[view.file]||view.src,texture=>{
      if(sequence!==token){texture.dispose();return}
      texture.colorSpace=T.SRGBColorSpace;enlarged=texture;inspectMaterial.map=texture;inspectMaterial.needsUpdate=true;
    });
  }
  for(let i=0;i<2;i++){
    const controller=xr.getController(i),line=new T.Line(rayShape,rayMaterial);
    line.scale.z=4;controller.add(line);rig.add(controller);
    controller.addEventListener("select",()=>select(controller));
  }
  function frame(time){
    if(!xr.isPresenting)return;
    const dt=Math.min(.05,(time-previousTime)/1000);previousTime=time;
    let forward=0,side=0,stick=0;
    for(const source of xr.getSession().inputSources){
      const axes=source.gamepad?.axes;if(!axes?.length)continue;
      const x=axes.at(-2)||0,y=axes.at(-1)||0;
      if(source.handedness==="left"){side=Math.abs(x)>.18?x:0;forward=Math.abs(y)>.18?-y:0}
      if(source.handedness==="right")stick=x;
    }
    if(!latched&&Math.abs(stick)>.65){turn-=Math.sign(stick)*Math.PI/6;latched=true}
    if(Math.abs(stick)<.28)latched=false;
    rig.rotation.y=turn;rig.updateMatrixWorld(true);
    camera.getWorldDirection(direction);
    if(!detail.visible)walk(forward,side,Math.atan2(direction.x,-direction.z),dt*1.7);
    const p=pose();rig.position.set(p.x,0,p.z);rig.updateMatrixWorld(true);
    camera.getWorldPosition(eye);distance.position({position:eye},time/1000);
    renderer.render(scene,camera);
  }
  xr.addEventListener("sessionstart",()=>{
    turn=-pose().angle;rig.position.set(pose().x,0,pose().z);rig.rotation.y=turn;
    camera.position.set(0,0,0);camera.rotation.set(0,0,0);
    previousTime=performance.now();latched=false;renderer.shadowMap.enabled=false;
    xr.setFoveation(.8);renderer.setAnimationLoop(frame);button.textContent="Exit VR";
  });
  xr.addEventListener("sessionend",()=>{
    renderer.setAnimationLoop(null);close();rig.position.set(0,0,0);rig.rotation.y=0;
    renderer.shadowMap.enabled=true;button.textContent="Enter VR";resize();requestAnimationFrame(drawFlat);
  });
  button.onclick=async()=>{
    button.disabled=true;let started;
    try{
      if(xr.getSession())await xr.getSession().end();
      else{started=await navigator.xr.requestSession("immersive-vr",{requiredFeatures:["local-floor"]});await xr.setSession(started)}
    }catch(error){
      if(started)await started.end().catch(()=>{});
      help.textContent="VR could not start. Check the browser’s headset permission, then try Enter VR again.";
    }finally{button.disabled=false}
  };
  async function detect(){
    try{button.hidden=!(await navigator.xr.isSessionSupported("immersive-vr"));help.hidden=button.hidden}catch{button.hidden=help.hidden=true}
  }
  detect();navigator.xr.addEventListener("devicechange",detect);
}
