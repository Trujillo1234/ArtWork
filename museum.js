"use strict";
const $ = id => document.getElementById(id);
const rooms = ["Studio", "Objects", "Family", "Schoolroom"];
const roomsNamed = {Studio:"The painting wall",Objects:"The object gallery",Family:"The family room",Schoolroom:"The schoolroom"};
const byId = new Map(MUSEUM.works.map(w=>[w.id,w]));
let roomIndex=0, filter="All", limit=24;
function visit(index){
  roomIndex=(index+rooms.length)%rooms.length;
  const room=rooms[roomIndex], ids=MUSEUM.walls[room];
  $("roomCount").textContent="Gallery "+(roomIndex+1)+" of "+rooms.length;
  $("roomName").textContent=roomsNamed[room];
  $("wallList").replaceChildren(...ids.map(id=>button(byId.get(id).title,()=>openWork(id))));
  $("fallback").src=byId.get(ids[1]||ids[0]).views[0].src;
  $("fallback").alt=byId.get(ids[1]||ids[0]).title;
  window.dispatchEvent(new CustomEvent("hang-gallery",{detail:room}));
}
function button(label,fn){const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=fn;return b}
function openWork(id,index=0){
  const work=byId.get(id),views=[...work.views,...(work.relatedViews||[])],view=views[index];
  $("objectRoom").textContent=work.room;
  $("objectTitle").textContent=view.title;
  $("large").src=view.src;$("large").alt=view.title;
  $("credit").textContent=work.artist||"Artist unconfirmed";
  $("objectNote").textContent=work.note||"";
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
window.museumGallery={current:()=>rooms[roomIndex],openWork,byId};
visit(0);render();

