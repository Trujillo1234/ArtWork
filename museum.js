"use strict";
const $ = id => document.getElementById(id);
const rooms = ["Studio", "Objects", "Family", "Schoolroom"];
const byId = new Map(MUSEUM.works.map(w=>[w.id,w]));
const wings = {Studio:"Studio",Objects:"Object gallery",Family:"Family gallery",Schoolroom:"Schoolroom"};
const galleries=[];
const wallNames=["Center wall","Left wall","Right wall"];
const locations=new Map();
for(const wing of rooms){
  const works=MUSEUM.works.filter(work=>work.room===wing);
  const groups=[];
  let group=[];
  for(const work of works){
    if(group.length && group.length+work.views.length>18){groups.push(group);group=[]}
    work.views.forEach((view,index)=>group.push({id:work.id,index,view}));
  }
  if(group.length)groups.push(group);
  for(const [i,frames] of groups.entries()){
    frames.sort((a,b)=>Number(a.index>0)-Number(b.index>0));
    const n=Math.ceil(frames.length/3),left=Math.ceil((frames.length-n)/2);
    const walls=[frames.slice(0,n),frames.slice(n,n+left),frames.slice(n+left)];
    const room={wing,title:wings[wing]+" "+(i+1),walls};
    for(const [wall,entries] of walls.entries()){
      for(const entry of entries)locations.set(entry.view.file,{room:galleries.length,wall});
    }
    galleries.push(room);
  }
}
let roomIndex=0,wallIndex=0,filter="All",limit=24,night=false;
try{night=localStorage.getItem("woodlands-night")==="true"}catch{}
function current(){return {roomIndex,wallIndex,night}}
function emitView(){window.dispatchEvent(new CustomEvent("pavilion-view",{detail:current()}))}
function visit(index,wall=0){
  roomIndex=(index+galleries.length)%galleries.length;
  const room=galleries[roomIndex];
  wallIndex=room.walls[wall]?.length?wall:0;
  const entries=room.walls[wallIndex];
  $("roomCount").textContent="Room "+(roomIndex+1)+" of "+galleries.length+" · "+wallNames[wallIndex];
  $("roomName").textContent=room.title;
  $("roomPicker").value=String(roomIndex);
  for(const b of document.querySelectorAll("[data-wall]")){
    const i=Number(b.dataset.wall);b.disabled=!room.walls[i].length;b.setAttribute("aria-pressed",String(i===wallIndex));
  }
  $("wallList").replaceChildren(...entries.map(e=>button(e.view.title,()=>openWork(e.id,e.index))));
  $("fallback").src=entries[0].view.thumb;$("fallback").alt=entries[0].view.title;
  emitView();
}
for(const [index,room] of galleries.entries())$("roomPicker").add(new Option(room.title,String(index)));
$("roomPicker").onchange=()=>visit(Number($("roomPicker").value));
for(const b of document.querySelectorAll("[data-wall]"))b.onclick=()=>visit(roomIndex,Number(b.dataset.wall));
function setLighting(){
  document.body.classList.toggle("night",night);
  $("night").setAttribute("aria-pressed",String(night));
  emitView();
}
$("night").onclick=()=>{night=!night;try{localStorage.setItem("woodlands-night",String(night))}catch{}setLighting()};

function button(label,fn){const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=fn;return b}
function openWork(id,index=0){
  const work=byId.get(id),views=[...work.views,...(work.relatedViews||[])],view=views[index];
  const location=locations.get(view.file);
  $("locate").hidden=!location;
  $("locate").onclick=()=>{if(location){$("viewer").close();visit(location.room,location.wall);$("scene").focus();$("pavilion").scrollIntoView({block:"start"})}};
  $("objectRoom").textContent=work.room;
  $("objectTitle").textContent=view.title;
  $("large").src=view.src;$("large").alt=view.title;
  $("credit").textContent=work.artist||"Artist unconfirmed";
  $("objectNote").textContent=work.note||"";
  if(work.relatedWork){
    const related=byId.get(work.relatedWork);
    $("objectNote").append(document.createElement("br"),button("View "+related.title,()=>openWork(related.id)));
  }
  if(work.website){
    const link=document.createElement("a");
    link.href=work.website.url;
    link.textContent=work.website.label;
    $("objectNote").append(document.createElement("br"),link);
  }
  $("file").textContent=[view.file,...view.aliases].join(" · ");
  $("pages").replaceChildren(...(views.length>1?views.map((v,i)=>{
    const b=button(String(i+1),()=>openWork(id,i));b.setAttribute("aria-label","View "+(i+1)+": "+v.title);b.title=v.title;b.setAttribute("aria-pressed",String(i===index));return b}):[]));
  if(!$("viewer").open)$("viewer").showModal();
  else $("pages").children[index]?.focus();
}
function render(){
  const q=$("search").value.trim().toLowerCase();
  const matches=MUSEUM.works.filter(w=>(filter==="All"||w.room===filter)&&
    [w.title,w.artist,...(MUSEUM.artistAliases?.[w.artist]||[]),w.note,...w.views.flatMap(v=>[v.file,...v.aliases,v.title])].join(" ").toLowerCase().includes(q));
  $("count").textContent=matches.length?Math.min(limit,matches.length)+" of "+matches.length+" works":"No matching works";
  $("grid").replaceChildren(...matches.slice(0,limit).map(w=>{
    const b=button("",()=>openWork(w.id));b.className="card";
    const mat=document.createElement("span");mat.className="mat";
    const img=new Image();img.loading="lazy";img.alt="";img.src=w.views[0].thumb;mat.append(img);
    const title=document.createElement("h3");title.textContent=w.title;
    const meta=document.createElement("span");meta.className="meta";meta.textContent=[w.room,w.artist,w.views.length>1?w.views.length+" views":null].filter(Boolean).join(" · ");
    b.append(mat,title,meta);return b;
  }));
  $("more").hidden=matches.length<=limit;
}
for(const room of ["All",...rooms]){
  const b=button(room,()=>{filter=room;limit=24;for(const el of $("filters").children)el.setAttribute("aria-pressed",String(el===b));render()});
  b.setAttribute("aria-pressed",String(room===filter));$("filters").append(b);
}
$("search").oninput=()=>{limit=24;render()};$("more").onclick=()=>{limit+=24;render()};
$("close").onclick=()=>$("viewer").close();
$("viewer").onclick=e=>{if(e.target===$("viewer")){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};
$("back").onclick=()=>visit(roomIndex-1);$("next").onclick=()=>visit(roomIndex+1);
$("scene").onkeydown=e=>{if(["ArrowLeft","ArrowRight"].includes(e.key)){e.preventDefault();visit(roomIndex+(e.key==="ArrowRight"?1:-1))}};
window.museumGallery={current,galleries,visit,openWork,byId};
visit(0);setLighting();render();

