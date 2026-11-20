import * as T from "three";
import {GroundedSkybox} from "three/addons/objects/GroundedSkybox.js";

// One photographed environment serves the sky, distant ground and water reflections.
export function createDistance(scene, redraw) {
  const sky=new GroundedSkybox(null,4.2,108,88);
  sky.position.y=3.64;
  sky.material.fog=false;
  sky.renderOrder=-10;
  sky.visible=false;
  scene.add(sky);
  const uniforms={panorama:{value:null},night:{value:0},time:{value:0}};
  const surface=new T.ShaderMaterial({
    uniforms,
    vertexShader:`
      varying vec3 point;
      void main(){
        point=(modelMatrix*vec4(position,1.)).xyz;
        gl_Position=projectionMatrix*viewMatrix*vec4(point,1.);
      }`,
    fragmentShader:`
      uniform sampler2D panorama;
      uniform float night,time;
      varying vec3 point;
      void main(){
        vec2 p=point.xz;
        float fine=1.-smoothstep(18.,68.,length(point-cameraPosition));
        vec2 slope=vec2(.014*cos(dot(p,vec2(1.7,.65))+time*.66)+.008*sin(p.y*6.5-time),
                        .022*sin(dot(p,vec2(.53,2.85))-time*.8)+fine*.008*sin(dot(p,vec2(5.7,12.2))+time));
        vec3 n=normalize(vec3(slope.x,1.,slope.y));
        vec3 v=normalize(cameraPosition-point), r=reflect(-v,n);
        vec2 uv=vec2(fract(atan(-r.z,-r.x)/6.2831853+1.),.5+asin(clamp(r.y,-1.,1.))/3.14159265);
        vec3 light=texture2D(panorama,uv).rgb;
        float fresnel=.12+.78*pow(1.-max(dot(v,n),0.),3.);
        vec3 water=mix(vec3(.025,.071,.058),vec3(.004,.009,.014),night);
        gl_FragColor=vec4(mix(water,light,fresnel),1.);
        #include <colorspace_fragment>
      }`
  });
  const waterGeometry=new T.PlaneGeometry(34,22);
  let activeKey="", generation=0, current=null;
  const textureLoader=new T.TextureLoader();
  async function select(place,isNight){
    const type=place===2?"houston":place===0||place===3?"pines":"meadow";
    const key=type+(isNight?"-night":"");
    uniforms.night.value=Number(isNight);
    if(key===activeKey)return;
    activeKey=key;
    const token=++generation;
    try{
      const file="assets/distance/"+key+".jpg";
      const texture=await textureLoader.loadAsync(window.localDistance?.[key]||file);
      if(token!==generation){texture.dispose();return}
      texture.colorSpace=T.SRGBColorSpace;
      texture.wrapS=T.RepeatWrapping;
      const old=current;current=texture;
      sky.material.map=texture;sky.material.needsUpdate=true;sky.visible=true;
      uniforms.panorama.value=texture;old?.dispose();redraw();
    }catch(error){
      if(token===generation)activeKey="";
      console.warn("Could not load the landscape photograph.",error);
    }
  }
  function addWater(group){
    const water=new T.Mesh(waterGeometry,surface);
    water.rotation.x=-Math.PI/2;water.position.set(0,-.27,-15.1);group.add(water);
  }
  function position(camera,seconds){
    sky.position.x=camera.position.x;
    uniforms.time.value=seconds;
  }
  return {select,addWater,position};
}
