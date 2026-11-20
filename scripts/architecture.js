import * as T from "three";

// Batch the small architectural parts by shape and finish, shared across rooms.
export function architecture() {
  const geometries = {
    block: new T.BoxGeometry(), round: new T.CylinderGeometry(1,1,1,24),
    globe: new T.SphereGeometry(1,16,10), leaf: new T.IcosahedronGeometry(1,0)
  };
  const finish = new T.MeshStandardMaterial({roughness:.65});
  const labels = new Map();
  function sign(group,words,x,y,z,width,height,bg,fg,angle=0) {
    const key=[words,bg,fg,width/height].join("|");
    if (!labels.has(key)) {
      const c=document.createElement("canvas");c.width=768;c.height=Math.max(64,Math.round(768*height/width));
      const ctx=c.getContext("2d");ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle=fg;ctx.lineWidth=4;ctx.strokeRect(7,7,c.width-14,c.height-14);
      ctx.fillStyle=fg;ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.floor(c.height*.53)+"px Georgia";
      ctx.fillText(words,384,c.height*.53,720);
      const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
      labels.set(key,new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.28}));
    }
    const mesh=new T.Mesh(signPlane,labels.get(key));mesh.scale.set(width,height,1);mesh.position.set(x,y,z);mesh.rotation.y=angle;group.add(mesh);
  }
  const signPlane=new T.PlaneGeometry();
  return function detail(group,place,owned,courtName) {
    const bins=new Map(), obj=new T.Object3D();
    function add(kind,color,x,y,z,w,h,d,rx=0,ry=0,rz=0){
      obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(w,h,d);obj.updateMatrix();
      if(!bins.has(kind))bins.set(kind,[]);
      bins.get(kind).push([obj.matrix.clone(),new T.Color(color)]);
    }
    const b=(...a)=>add("block",...a), cyl=(...a)=>add("round",...a), ball=(...a)=>add("globe",...a);
    const pine=0x22523f, brass=0xcb9a4a, ivory=0xffe9bd, ebony=0x253237, oak=0xb57638, red=0xab4234, silver=0xc1c7c5, blue=0x36546c;
    function planter(x,z){
      b(oak,x,.26,z,1.5,.5,.66);
      for(let n=0;n<9;n++)add("leaf",n%2?0x5c7744:0x799957,x+(n%5-2)*.25,.60+.12*Math.sin(n),z+.12*Math.cos(n),.29,.32,.23,0,n,0);
    }
    if(place===0){
      const x=4.05,z=4.65;
      b(ebony,x,.51,z,1.58,.25,3.95);b(pine,x,.97,z,1.67,.73,3.95);
      for(const s of [-1,1]){
        const side=x+s*.85;
        b(ivory,side,1.22,z,.06,.15,3.98);b(brass,side,.82,z,.06,.055,3.98);
        for(let j=-2;j<=2;j++){
          b(oak,side,1.65,z+j*.77,.085,.80,.09);
          b(oak,x,1.14,z+j*.66,1.36,.09,.36);
          for(let k=0;k<3;k++)b(oak,x,1.22+k*.094,z+j*.66-.16,1.36,.06,.065);
        }
        for(const t of [-1,1]){
          cyl(ebony,side,.48,z+t*1.26,.35,.16,.35,0,0,Math.PI/2);
          cyl(brass,side+s*.10,.48,z+t*1.26,.16,.04,.16,0,0,Math.PI/2);
          cyl(brass,side,1.65,z+t*1.93,.035,.9,.035);
        }
        for(let j=-3;j<=3;j++)b(blue,x+s*.56,2.21,z+j*.5,.06,.17,.37);
      }
      for(const end of [-1,1]){
        b(pine,x,1.15,z+end*1.97,1.68,.62,.10);
        for(const dx of [-.74,0,.74])b(oak,x+dx,1.69,z+end*1.96,.08,.78,.09);
        for(const dx of [-.56,.56])ball(ivory,x+dx,1.08,z+end*2.045,.11,.11,.055);
        b(brass,x,.67,z+end*2.03,1.84,.11,.12);
      }
      b(ivory,x,2.04,z,1.92,.15,4.22);b(oak,x,2.19,z,1.09,.24,3.83);b(ivory,x,2.34,z,1.26,.12,3.99);
      for(const y of [1.81,1.91])b(brass,x,y,z, .035,.04,3.65);
      sign(group,"WATERWAY",x,2.12,z+2.13,1.34,.28,"#214434","#ffdf96");
      sign(group,"TOWN CENTER TROLLEY",x-.90,1.01,z,2.32,.30,"#214434","#ffdf96",-Math.PI/2);
      for(const px of [-5,0,7])planter(px,-5.5);
    }else if(place===1){
      const x=-5.9;
      b(red,x,2.45,-8.7,5.8,4.85,1.4);
      for(let i=0;i<5;i++)b(i%2?ivory:0x5f8f83,x+(i-2)*.30,4.56,-7.94,.19,1.05-.10*Math.abs(i-2),.18);
      b(0x377369,x,2.94,-7.35,5.62,1.05,1.30);
      sign(group,"OLD TOWN THEATRE",x,2.97,-6.68,5.49,.85,"#f5dfad","#7e352f");
      for(let j=0;j<24;j++)ball(ivory,x-2.6+j*.227,2.49,-6.68,.043,.054,.05);
      for(const dx of [-1.85,0,1.85]){b(ebony,x+dx,1.16,-7.92,1.38,2.32,.13);b(brass,x+dx,1.09,-7.81,.06,.48,.05);}
      for(let j=0;j<12;j++){const a=j*Math.PI/6;b(ebony,2.8+.68*Math.sin(a),5.75+.68*Math.cos(a),-10.35,.038,.13,.03,0,0,-a);}
      for(const px of [-9,6,8.4])planter(px,-5.4);
    }else if(place===2){
      // Inspection platform, lattice tower, rocket umbilicals and engine plumbing.
      for(const x of [-6.7,-5.2])for(const z of [-10,-8.45])b(ebony,x,4.65,z,.15,9.3,.15);
      for(let i=0;i<6;i++){
        const y=.38+i*1.46;b(silver,-5.95,y,-9.23,1.82,.12,1.76);
        b(red,-5.96,y+.74,-8.45,.085,2.09,.09,0,0,(i%2?1:-1)*.80);
        b(brass,-5.95,y+.50,-8.45,1.55,.05,.05);
        b(silver,-4.82,y+.13,-9.28,1.1,.07,.10);
      }
      for(let i=0;i<18;i++)b(silver,-6.75,.34+i*.45,-8.76,.08,.045,.46);
      for(const x of [-3.93,-3.37])cyl(ebony,x,.42,-8.72,.22,.5,.22);
      for(const x of [3.3,6.8]){b(blue,x,1.5,-6.4,.22,3,.22);b(ivory,x,3,-6.4,.4,.13,.4);}
      sign(group,"FLIGHT OPERATIONS",5.05,2.62,-6.37,3.65,.61,"#223848","#e6e1c9");
    }else if(place===3){
      b(silver,0,3.38,-8.8,17,6.76,1.9);
      for(let j=0;j<106;j++)b(0xa5b0ae,-8.4+j*.16,3.42,-7.82,.032,6.57,.055);
      for(const x of [-6.75,-4.4,-2.05,5.8]){
        b(ebony,x,4.81,-7.74,1.48,2.5,.14);b(blue,x,4.81,-7.65,1.30,2.31,.05);
        b(silver,x,4.9,-7.59,1.36,.065,.055);
      }
      b(red,-4.26,3.04,-7,8.4,.21,1.72);
      for(const x of [-7.6,-4.4,-1.1])b(ebony,x,1.5,-6.37,.12,3,.12);
      b(0xf2e9cf,2.7,3.28,-6.87,5.5,.21,1.95);
      for(let j=0;j<16;j++){
        b(silver,.12+j*.34,3.77,-5.94,.045,.91,.045);
        b(silver,6.05,(j+1)*.202,-2.48-j*.235,1.18,.202,.25);
      }
      b(ebony,2.67,4.22,-5.94,5.37,.07,.07);
      for(const dx of [-.62,.62])b(silver,6.05+dx,2.55,-4.22,.06,.06,4.97,.71);
      sign(group,"ESPRIT", -4.3,2.64,-6.09,2.62,.46,"#7e302b","#fff2d6");
      for(const x of [-7.4,-3.5,1.8])planter(x,-5.42);
    }else{
      for(const x of [-8.5,8.5])b(0xd58e4a,x,2.9,-6.8,.34,5.8,.34);
      b(0xeac77a,0,5.68,-6.8,17.4,.37,.42);
      for(let j=0;j<18;j++){
        const x=-8+j*.94,y=5.37-.58*Math.cos(x*.18);
        b(0x796b54,x,y+.16,-6.68,.97,.036,.035,0,0,.10*Math.sin(x*.18));
        b([0xe67554,0x308a91,0xe8b942,0x608e51][j%4],x,y-.03,-6.68,.48,.35,.045,0,0,.08*Math.sin(j));
      }
      sign(group,"ESTRELLA DE LA SEMANA",0,3.88,-6.35,6.8,.85,"#22686e","#fff1bf");
      for(const x of [-5.8,5.8]){
        b(oak,x,1.03,-5.5,2.64,.14,1.12);
        for(const s of [-1,1])for(const t of [-1,1])b(0xc18d4c,x+s*1.12,.49,-5.5+t*.44,.12,.98,.12);
        for(let j=0;j<5;j++)b([red,blue,ivory][j%3],x-.37,1.13+j*.069,-5.45,.61,.061,.42,0,j*.12);
        cyl(0x458681,x+.69,1.26,-5.45,.14,.35,.14);
        for(let j=0;j<6;j++)cyl([red,brass,blue][j%3],x+.69+.08*Math.cos(j),1.5,-5.45+.08*Math.sin(j),.019,.43,.019,0,0,.13*Math.cos(j));
      }
      ball(0x26629d,4,3.36,-6.35,.36,.57,.28);ball(0x357db6,4.05,3.86,-6.30,.29,.3,.24);
      ball(ebony,4.25,3.81,-6.13,.16,.15,.12);ball(ivory,4.14,3.94,-6.08,.085,.085,.05);ball(ebony,4.15,3.94,-6.03,.041,.041,.02);
      add("leaf",blue,3.88,2.74,-6.40,.16,.59,.14,0,0,-.19);
    }
    // The marker faces visitors leaving the artwork for the garden.
    b(oak,5.8,1.44,10.12,.15,2.88,.16);
    b(pine,5.8,2.72,10.12,3.5,.60,.13);
    sign(group,courtName,5.8,2.72,10.045,3.43,.54,"#29463b","#fff0ce",Math.PI);
    for(const px of [-3,3]){
      for(const end of [-.78,.78])b(ebony,px+end,.25,10.55,.12,.50,.43);
      for(let j=0;j<4;j++)b(oak,px,.52,10.32+j*.13,2.05,.085,.10);
      for(const h of [.83,1.02])b(oak,px,h,10.82,2.05,.14,.08);
    }
    for(const [kind,parts] of bins){
      const mesh=new T.InstancedMesh(geometries[kind],finish,parts.length);
      parts.forEach(([matrix,color],i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color);});
      mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);owned.push(mesh);
    }
  };
}
