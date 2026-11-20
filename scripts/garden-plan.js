export const courts=[
  {name:"Pavilion Court",x:0,z:0},
  {name:"Pine Court",x:-52,z:-52},
  {name:"Magnolia Court",x:52,z:-52},
  {name:"Cypress Court",x:-52,z:52},
  {name:"Live Oak Court",x:52,z:52}
];
const sides=[[0,-18,0],[18,0,-Math.PI/2],[0,18,Math.PI],[-18,0,Math.PI/2]];
export const rooms=courts.flatMap((court,c)=>sides.map(([dx,dz,angle],side)=>({
  x:court.x+dx,z:court.z+dz,angle,cos:Math.cos(angle),sin:Math.sin(angle),court:c,side
})));
export function world(room,x,z){
  return [room.x+room.cos*x+room.sin*z,room.z-room.sin*x+room.cos*z];
}
export function local(room,x,z){
  const dx=x-room.x,dz=z-room.z;
  return [room.cos*dx-room.sin*dz,room.sin*dx+room.cos*dz];
}
export function nearestRoom(x,z){
  let best=0,distance=Infinity;
  rooms.forEach((p,i)=>{const d=(p.x-x)**2+(p.z-z)**2;if(d<distance){best=i;distance=d}});
  return best;
}
export function onGardenPath(x,z){
  if(courts.some(c=>Math.max(Math.abs(x-c.x),Math.abs(z-c.z))<12.1))return true;
  return Math.max(Math.abs(x),Math.abs(z))<=52&&Math.abs(Math.abs(x)-Math.abs(z))<3.35;
}
