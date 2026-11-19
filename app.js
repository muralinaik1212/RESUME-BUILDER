import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signInWithPopup,GoogleAuthProvider,signOut,deleteUser,sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs,addDoc,increment,serverTimestamp,query,orderBy} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";

const app0=initializeApp(firebaseConfig),auth=getAuth(app0),db=getFirestore(app0);
const $=s=>document.querySelector(s),root=$("#app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const TEMPLATES=[{id:"classic",name:"Classic",ats:1},{id:"compact",name:"Compact",ats:1},{id:"modern",name:"Modern"},{id:"bold",name:"Bold"}];
const FIELDS=[
["name","Full name","i","Use the same name as on your documents."],
["email","Email","i","Use a professional address, not a nickname."],
["phone","Phone","i",""],["location","City, State","i",""],
["links","LinkedIn / GitHub / portfolio","i","Recruiters click these. Make sure they work."],
["objective","Career objective","t","Two lines: your goal + your strongest skill. Tailor it to the job."],
["education","Education (one per line)","t","Degree | College | Year | CGPA. As a fresher, keep this near the top."],
["projects","Projects (one per line)","t","Title | what you built and the tech used. Start with action verbs."],
["skills","Skills (comma separated)","t","Copy keywords from the job post. ATS software scans for them."],
["certs","Certifications (one per line)","t","Only relevant ones."],
["achievements","Achievements and activities","t","Hackathons, clubs, leadership. Add numbers where you can."]];
let vcount=null,user=null,profile=null,isAdmin=false,cur=null,pendingName="",timer;
const day=new Date().toISOString().slice(0,10);
const showVisits=()=>{const e=$("#visits2");if(e&&vcount!=null)e.textContent=vcount.toLocaleString("en-IN")+" people have visited"};
const bump=async f=>{try{await setDoc(doc(db,"stats","site"),{[f]:increment(1)},{merge:true})}catch(e){}};

async function countVisit(){
  let first=false;try{first=localStorage.getItem("rf_day")!==day;if(first)localStorage.setItem("rf_day",day)}catch(e){}
  const inc={views:increment(1)};if(first)inc.uniques=increment(1);
  try{await setDoc(doc(db,"stats","site"),inc,{merge:true});await setDoc(doc(db,"stats","d_"+day),inc,{merge:true})}catch(e){}
  try{const s=await getDoc(doc(db,"stats","site"));vcount=s.data()?.views||0;showVisits()}catch(e){}
}

/* ---------- auth ---------- */
async function ensureProfile(u){
  const ref=doc(db,"users",u.uid);let s=await getDoc(ref);
  if(!s.exists()){await setDoc(ref,{name:pendingName||u.displayName||u.email.split("@")[0],email:u.email,blocked:false,createdAt:serverTimestamp(),consentAt:serverTimestamp()});s=await getDoc(ref)}
  return s.data();
}
onAuthStateChanged(auth,async u=>{
  user=u;profile=null;isAdmin=false;
  if(u){
    profile=await ensureProfile(u);
    if(profile.blocked){await signOut(auth);return authView("This account has been blocked. Contact the site owner.")}
    try{isAdmin=(await getDoc(doc(db,"admins",u.uid))).exists()}catch(e){}
  }
  nav();if(!u)return authView();await loadPeople();
  if(!people.length)wizard({data:{name:profile.name,email:profile.email}},true,dash);else dash();
});
function nav(){
  $("#nav").innerHTML=user?`<button class="alt" id="n1">My resumes</button>${isAdmin?'<button class="alt" id="n2">Admin</button>':""}<button class="alt" id="n3">Log out</button>`:`<button class="alt" data-go="login">Log in</button><button data-go="signup">Sign up free</button>`;
  if(user){$("#n1").onclick=dash;if(isAdmin)$("#n2").onclick=admin;$("#n3").onclick=()=>signOut(auth)}
}
function authView(note=""){
  let signup=false;
  root.innerHTML=`<div class="land"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
  <section class="hero2"><div class="ht"><span class="pill">Free for students and freshers</span>
  <h1>Turn your college years into a resume recruiters actually read.</h1>
  <p>Pick a template, fill in a few boxes, and download as PDF or Word. Tips on every field tell you what recruiters expect.</p>
  <div class="row"><button class="big" data-go="signup">Create my free resume</button><button class="alt big" onclick="document.getElementById('how').scrollIntoView({behavior:'smooth'})">See how it works</button></div><div class="vc"><i></i><span id="visits2">Counting visitors...</span></div></div>
  <div class="stage"><span class="chip c1">ATS-friendly</span><span class="chip c2">Saved</span><span class="chip c3">PDF + Word</span><div id="demo" class="paper demo classic"></div><div class="dlab" id="dlab"></div></div></section>
  <div class="mq"><div class="mt">${"Python,SQL,React,Java,Projects,Internships,Leadership,Excel,Communication,Teamwork,Git,Design,".repeat(2).split(",").filter(Boolean).map(x=>`<span>${x}</span>`).join("")}</div></div>
  <section class="sec"><h2 class="rv">Everything a fresher needs, nothing they don't</h2><div class="fg">${[["🎯","ATS-friendly templates","Clean layouts that applicant tracking software can read."],["💡","Tips on every field","Know what recruiters look for before you type."],["👀","Live preview","Watch your resume change as you type."],["📥","Download anywhere","PDF, Word, text or HTML. Your choice."],["🔒","Private by design","Only you can read your resumes. Delete them anytime."],["🎲","Random template","Not sure which one? Let us pick for you."]].map(([i,t,d],n)=>`<div class="fc rv" style="--d:${n*.08}s"><b>${i}</b><h3>${t}</h3><p>${d}</p></div>`).join("")}</div></section>
  <section class="sec" id="how"><h2 class="rv">Three steps to done</h2><div class="steps">${[["Create a free account","Sign up with email or Google in seconds."],["Fill in your details","Education, projects, skills. Preview updates live."],["Download and apply","Save as PDF or Word and send it out."]].map(([t,d],n)=>`<div class="st rv" style="--d:${n*.12}s"><span>${n+1}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div></section>
  <section class="sec" id="join"><h2 class="rv">Start your resume now</h2>
  <form id="af" class="card rv"><h2 id="at">Log in</h2><input id="n" placeholder="Full name" autocomplete="name" hidden><input id="e" type="email" placeholder="Email" required autocomplete="email"><input id="p" type="password" placeholder="Password (min 6 characters)" minlength="6" required autocomplete="current-password">
  <p class="chk">By continuing, you confirm you are 18 or older and agree to the <a href="terms.html" target="_blank">Terms</a> and <a href="privacy.html" target="_blank">Privacy Policy</a>.</p>
  <button>Continue</button><button type="button" class="alt" id="g">Continue with Google</button><p class="msg" id="m">${esc(note)}</p>
  <a href="#" id="sw">New here? Create an account</a> &nbsp; <a href="#" id="fp">Forgot password?</a></form></section></div>`;
  const m=t=>$("#m").textContent=t,need=()=>true;
  $("#sw").onclick=ev=>{ev.preventDefault();signup=!signup;$("#n").hidden=!signup;$("#at").textContent=signup?"Create account":"Log in";$("#sw").textContent=signup?"Have an account? Log in":"New here? Create an account"};
  $("#fp").onclick=async ev=>{ev.preventDefault();if(!$("#e").value)return m("Enter your email first.");try{await sendPasswordResetEmail(auth,$("#e").value);m("Reset link sent. Check your inbox.")}catch(e){m("Could not send reset email.")}};
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{if(b.dataset.go=="signup"&&!signup)$("#sw").click();if(b.dataset.go=="login"&&signup)$("#sw").click();$("#join").scrollIntoView({behavior:"smooth"})});
  reveal();demo();showVisits();
  $("#g").onclick=async()=>{if(!need())return;try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){m("Google sign-in failed.")}};
  $("#af").onsubmit=async ev=>{ev.preventDefault();try{
    if(signup){if(!need())return;pendingName=$("#n").value.trim();await createUserWithEmailAndPassword(auth,$("#e").value,$("#p").value)}
    else await signInWithEmailAndPassword(auth,$("#e").value,$("#p").value)}catch(e){m(e.code==="auth/email-already-in-use"?"That email already has an account. Log in instead.":"Check your email and password and try again.")}};
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms)),still=matchMedia("(prefers-reduced-motion: reduce)").matches;
function reveal(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.15});document.querySelectorAll(".rv").forEach(el=>io.observe(el))}
async function demo(){
  const el=$("#demo");if(!el)return;
  const L=[["h1","Aarav Sharma"],["p","aarav@email.com | Bengaluru"],["h3","Projects"],["p","- Built a weather app with React and APIs"],["p","- Led a 4-member hackathon team"],["h3","Skills"],["p","Python, SQL, React, Teamwork"]];
  const T=[["classic","Classic (ATS-friendly)"],["modern","Modern"],["compact","Compact (ATS-friendly)"],["bold","Bold"]];let t=0;
  while($("#demo")===el){
    const [c,name]=T[t++%4];el.className="paper demo "+c;el.innerHTML="";$("#dlab").textContent="Template: "+name;
    for(const [tag,txt] of L){if($("#demo")!==el)return;const n=document.createElement(tag);el.appendChild(n);
      if(still){n.textContent=txt;continue}
      for(const ch of txt){n.textContent+=ch;await sleep(24)}await sleep(120)}
    if(still)return;await sleep(2200);
  }
}

/* ---------- profiles, wizard, JD ---------- */
const pc=()=>collection(db,"users",user.uid,"profiles"),FM=Object.fromEntries(FIELDS.map(f=>[f[0],f]));
let people=[];
async function loadPeople(){people=(await getDocs(pc())).docs.map(d=>({id:d.id,...d.data()}));people.sort((a,b)=>(b.main?1:0)-(a.main?1:0))}
const STEPS=[{t:"Let's start with the basics",s:"You enter this once. It is reused on every resume.",f:["name","email","phone","location","links"]},
{t:"Your education",s:"Add one entry per line.",f:["education"]},{t:"Projects you are proud of",s:"Add one per line.",f:["projects"]},
{t:"Your skills",s:"List what you can really do.",f:["skills","certs"]},{t:"Final touches",s:"Optional, but recruiters like these.",f:["objective","achievements"]}];
function wizard(p,main,done){
  const st={label:p?.label||(main?"Me":""),data:{...(p?.data||{})},i:0},isMain=main||p?.main;
  const steps=isMain?STEPS:[{t:"Who is this person?",s:"Saved under this name so you can pick them any time.",f:[],label:1},...STEPS];
  (function show(){
    const S=steps[st.i];
    root.innerHTML=`<div class="wiz"><div class="bar"><i style="width:${(st.i+1)/steps.length*100}%"></i></div><small>Step ${st.i+1} of ${steps.length}</small><h2>${S.t}</h2><p class="sub">${S.s}</p>
    ${S.label?`<label>Name</label><input id="lb" value="${esc(st.label)}" placeholder="e.g. Priya (my sister)">`:""}
    ${S.f.map(k=>{const [,l,ty,tip]=FM[k];return `<label>${l}</label>${ty=="i"?`<input data-k="${k}" value="${esc(st.data[k])}">`:`<textarea data-k="${k}">${esc(st.data[k])}</textarea>`}${tip?`<span class="tip">Tip: ${tip}</span>`:""}`}).join("")}
    <p class="msg" id="wm"></p><div class="row">${st.i?'<button class="alt" id="wb">Back</button>':""}<button id="wn">${st.i==steps.length-1?"Save profile":"Next"}</button></div></div>`;
    const grab=()=>{root.querySelectorAll("[data-k]").forEach(e=>st.data[e.dataset.k]=e.value);if(S.label)st.label=$("#lb").value.trim()};
    if(st.i)$("#wb").onclick=()=>{grab();st.i--;show()};
    $("#wn").onclick=async()=>{grab();
      if(S.label&&!st.label)return $("#wm").textContent="Please enter a name.";
      if(S.f.includes("name")&&!(st.data.name||"").trim())return $("#wm").textContent="Please enter the name.";
      if(st.i<steps.length-1){st.i++;return show()}
      const rec={label:st.label,main:!!isMain,data:st.data,updatedAt:serverTimestamp()};
      if(p?.id)await updateDoc(doc(pc(),p.id),rec);else await addDoc(pc(),rec);
      await loadPeople();done()};
  })();
}
const SK="python,java,javascript,typescript,react,angular,vue,node,html,css,sql,mysql,mongodb,postgresql,c++,c#,git,github,docker,aws,azure,linux,excel,power bi,tableau,machine learning,data analysis,django,flask,spring,kotlin,swift,android,figma,photoshop,communication,teamwork,leadership,problem solving,presentation,seo,marketing,accounting,tally,research,writing,testing,selenium,api,agile,scrum,jira,php,sales,customer service".split(",");
const STOP=new Set("the and for with you our are will this that your from have has not all can any who job work team role able per etc years year experience skills required knowledge good strong ability including such also more must about their they them been which using use into out new".split(" "));
const has=(t,k)=>new RegExp("(^|[^a-z0-9+#])"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"($|[^a-z0-9+#])").test(t);
function analyze(jd,pd){
  const low=jd.toLowerCase();let kw=SK.filter(k=>has(low,k));
  if(kw.length<5){const f={};low.split(/[^a-z0-9+#]+/).forEach(w=>{if(w.length>4&&!STOP.has(w))f[w]=(f[w]||0)+1});kw=[...new Set([...kw,...Object.entries(f).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0])])]}
  const hay=Object.values(pd).join(" ").toLowerCase(),match=kw.filter(k=>has(hay,k)),miss=kw.filter(k=>!match.includes(k));
  const sc=s=>kw.filter(k=>has(s.toLowerCase(),k)).length,sents=jd.replace(/\s+/g," ").split(/(?<=[.!?])\s/).filter(s=>s.length>30);
  const summary=[...sents].sort((a,b)=>sc(b)-sc(a)).slice(0,2).join(" ");
  const role=((jd.match(/(?:position|role|title|hiring)\s*[:\-]\s*([^\n.]{3,60})/i)||[])[1]||jd.trim().split("\n")[0]).slice(0,60).trim();
  return {edu:/degree|b\.?tech|bachelor|graduat|cgpa|qualification|campus/i.test(jd),kw,match,miss,summary,role,score:kw.length?Math.round(match.length/kw.length*100):0};
}
const DEF=["education","projects","skills","certs","achievements"],LBL={education:"Education",projects:"Projects",skills:"Skills",certs:"Certifications",achievements:"Achievements"};
function tailor(pd,an){
  const d={...pd};if(!an)return d;
  const sc=t=>an.kw.filter(k=>has(String(t).toLowerCase(),k)).length;
  d.skills=(pd.skills||"").split(",").map(x=>x.trim()).filter(Boolean).sort((x,y)=>sc(y)-sc(x)).join(", ");
  d.projects=list(pd.projects).sort((x,y)=>sc(y)-sc(x)).join("\n");
  const pts=k=>!(pd[k]||"").trim()?-1:sc(pd[k])+(k=="education"?(an.edu?2:1):0);
  d.order=[...DEF].sort((x,y)=>pts(y)-pts(x));
  if(!(pd.objective||"").trim())d.objective=`Motivated fresher${an.role?" targeting "+an.role:""} with hands-on experience in ${an.match.slice(0,3).join(", ")||"my field"}, eager to contribute and learn quickly.`;
  return d;
}
function newResume(){
  const st={pid:(people.find(x=>x.main)||people[0]).id,jd:"",an:null,tpl:"classic"},me=()=>people.find(x=>x.id==st.pid);
  const bar=n=>`<div class="bar"><i style="width:${n*33.3}%"></i></div><small>Step ${n} of 3</small>`;
  function s1(){
    root.innerHTML=`<div class="wiz">${bar(1)}<h2>Who is this resume for?</h2><div class="pp">${people.map(x=>`<button class="pc ${x.id==st.pid?"on":""}" data-p="${x.id}">${esc(x.label)}${x.main?" (you)":""}</button>`).join("")}<button class="pc" id="ap">+ Add another person</button></div><div class="row"><button class="alt" id="cx">Cancel</button><button id="nx">Next</button></div></div>`;
    root.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{st.pid=b.dataset.p;s1()});
    $("#ap").onclick=()=>wizard(null,false,newResume);$("#cx").onclick=dash;$("#nx").onclick=s2;
  }
  function s2(){
    root.innerHTML=`<div class="wiz">${bar(2)}<h2>Paste the job description</h2><p class="sub">We pull out the key skills and a short summary, then tailor the resume. The text stays in your browser and is not stored.</p><textarea id="jd" rows="10" placeholder="Paste the job description here">${esc(st.jd)}</textarea><label>Or upload a .txt file</label><input type="file" id="jf" accept=".txt"><p class="msg" id="wm"></p><div class="row"><button class="alt" id="b1">Back</button><button class="alt" id="sk">Skip</button><button id="an">Analyze</button></div></div>`;
    $("#jf").onchange=async e=>{const f=e.target.files[0];if(f)$("#jd").value=await f.text()};
    $("#b1").onclick=s1;$("#sk").onclick=()=>{st.an=null;st.jd="";s3()};
    $("#an").onclick=()=>{st.jd=$("#jd").value;if(st.jd.trim().length<40)return $("#wm").textContent="Paste a longer job description, or tap Skip.";st.an=analyze(st.jd,me().data);s3()};
  }
  function s3(){
    const an=st.an;
    root.innerHTML=`<div class="wiz">${bar(3)}<h2>${an?"What this job wants":"Pick a template"}</h2>${an?`<div class="jdbox"><b>${esc(an.role)}</b><p>${esc(an.summary||"No summary found.")}</p><div class="ring">${an.score}% of the keywords are already in ${esc(me().label)}'s profile</div><div class="kw">${an.match.map(k=>`<span class="k ok">${esc(k)}</span>`).join("")}${an.miss.map(k=>`<span class="k no">${esc(k)}</span>`).join("")}</div><span class="tip">Green: already in the profile. Orange: missing. Only add skills that are true.</span><span class="tip">Section order for this job: ${tailor(me().data,an).order.map(k=>LBL[k]).join(", ")}</span></div>`:""}
    <label>Template</label><div class="tpls">${TEMPLATES.map(t=>`<button class="tp ${t.id==st.tpl?"on":""}" data-t="${t.id}">${t.name}${t.ats?" (ATS-friendly)":""}</button>`).join("")}<button class="tp" id="rn">Random</button></div><div class="row"><button class="alt" id="b2">Back</button><button id="go">Create resume</button></div></div>`;
    root.querySelectorAll(".tp[data-t]").forEach(b=>b.onclick=()=>{st.tpl=b.dataset.t;s3()});
    $("#rn").onclick=()=>{bump("random");st.tpl=TEMPLATES[Math.floor(Math.random()*4)].id;s3()};$("#b2").onclick=s2;
    $("#go").onclick=async()=>{const p=me(),r={title:an?.role||p.label+"'s resume",template:st.tpl,profileId:p.id,forName:p.label,jd:an?{role:an.role,score:an.score,summary:an.summary}:null,data:tailor(p.data,an),updatedAt:serverTimestamp()};
      const ref=await addDoc(rc(),r);bump("resumes");bump("t_"+st.tpl);editor(ref.id,r)};
  }
  s1();
}

/* ---------- dashboard ---------- */
const rc=()=>collection(db,"users",user.uid,"resumes");
const TIPS=["Start every bullet with an action verb like built, led or designed.","As a fresher, keep your resume to one page.","Add numbers: cut load time by 30% beats improved speed.","Copy keywords from the job post into your skills.","Use a professional email address, not a nickname.","No internship yet? Put your projects at the top."];
const pct=d=>Math.round(FIELDS.filter(f=>String(d?.[f[0]]||"").trim()).length/FIELDS.length*100);
async function dash(){
  root.innerHTML=`<div class="wrap dash"><div class="banner"><div><h2>Hi ${esc(profile.name.split(" ")[0])}, let's get you hired</h2><p>Tip: ${TIPS[Math.floor(Math.random()*TIPS.length)]}</p></div><div class="row"><button class="big" id="nw">New resume</button><button class="alt big" id="rd">Surprise me</button></div></div>
  <div class="stats" id="st"></div><h3>Profiles</h3><div class="pp" id="pl">${people.map(x=>`<span class="pc">${esc(x.label)}${x.main?" (you)":""} <button class="alt" data-pe="${x.id}">Edit</button></span>`).join("")}<button class="alt" id="ap2">+ Add person</button></div><h3>Your resumes</h3><div id="ls" class="cards">Loading…</div>
  <details class="danger"><summary>Account and privacy</summary><p>Deleting your account permanently removes your profile and all resumes.</p><button class="red" id="del">Delete my account</button></details></div>`;
  $("#nw").onclick=newResume;
  $("#rd").onclick=()=>{bump("random");create(TEMPLATES[Math.floor(Math.random()*TEMPLATES.length)].id)};
  $("#del").onclick=delAccount;$("#ap2").onclick=()=>wizard(null,false,dash);$("#pl").onclick=ev=>{const e=ev.target.dataset.pe;if(e)wizard(people.find(x=>x.id==e),false,dash)};
  const docs=(await getDocs(query(rc(),orderBy("updatedAt","desc")))).docs,ps=docs.map(d=>pct(d.data().data));
  $("#st").innerHTML=[["Resumes",docs.length],["Best score",(ps.length?Math.max(...ps):0)+"%"],["Templates to try",TEMPLATES.length]].map(([a,b])=>`<div class="stat"><b>${b}</b>${a}</div>`).join("");
  $("#ls").innerHTML=`<button class="newc" id="nc"><span>+</span>New resume</button>`+docs.map((d,i)=>{const r=d.data();return `<div class="rcard"><div class="thumb"><div class="paper ${r.template}">${paper(r.data||{})}</div></div><div class="rb"><b>${esc(r.title)}</b><small>${r.forName?"For "+esc(r.forName)+", ":""}${esc(r.template)} template, edited ${r.updatedAt?.toDate?.().toLocaleDateString()||"just now"}</small><div class="bar"><i style="width:${ps[i]}%"></i></div><small>${ps[i]}% complete</small><div class="row"><button data-o="${d.id}">Edit</button><button class="alt" data-c="${d.id}">Duplicate</button><button class="alt" data-x="${d.id}">Delete</button></div></div></div>`}).join("");
  $("#nc").onclick=newResume;
  $("#ls").onclick=async ev=>{const o=ev.target.dataset.o,c=ev.target.dataset.c,x=ev.target.dataset.x;
    if(o)editor(o,(await getDoc(doc(rc(),o))).data());
    if(c){const r=(await getDoc(doc(rc(),c))).data();await addDoc(rc(),{...r,title:r.title+" (copy)",updatedAt:serverTimestamp()});dash()}
    if(x&&confirm("Delete this resume?")){await deleteDoc(doc(rc(),x));dash()}};
}
async function create(t){
  const p=people.find(x=>x.main)||people[0],r={title:"Quick resume",template:t,forName:p.label,data:{...p.data},updatedAt:serverTimestamp()};
  const ref=await addDoc(rc(),r);bump("resumes");bump("t_"+t);editor(ref.id,r);
}
async function delAccount(){
  if(!confirm("Permanently delete your account and all resumes? This cannot be undone."))return;
  try{for(const d of (await getDocs(rc())).docs)await deleteDoc(d.ref);for(const d of (await getDocs(pc())).docs)await deleteDoc(d.ref);await deleteDoc(doc(db,"users",user.uid));await deleteUser(auth.currentUser);alert("Your account and data were deleted.")}
  catch(e){alert("For security, please log out, log in again, then retry deleting your account.")}
}

/* ---------- editor ---------- */
const list=t=>(t||"").split("\n").map(s=>s.trim()).filter(Boolean);
function paper(d){
  const ul=t=>list(t).length?`<ul>${list(t).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"",sec=(h,b)=>b?`<h3>${h}</h3>${b}`:"";
  const ct=[d.email,d.phone,d.location,d.links].filter(Boolean).map(esc).join(" | ");
  return `<h1>${esc(d.name||"Your Name")}</h1><p class="ct">${ct}</p>`+sec("Objective",d.objective?`<p>${esc(d.objective)}</p>`:"")+(d.order||DEF).map(k=>sec(LBL[k],k=="skills"?(d.skills?`<p>${esc(d.skills)}</p>`:""):ul(d[k]))).join("");
}
function editor(id,r){
  cur={id,...r};
  root.innerHTML=`<div class="grid"><div class="panel"><div class="row"><button class="alt" id="bk">Back to dashboard</button><span id="sv"></span></div>${r.jd?`<div class="jdb">Tailored for ${esc(r.jd.role)}: ${r.jd.score}% keyword match</div>`:""}<div class="bar"><i id="pb"></i></div><small id="pt"></small>
  <label>Resume name</label><input id="ti" value="${esc(r.title)}">
  <label>Template</label><div class="tpls">${TEMPLATES.map(t=>`<button class="tp ${t.id==r.template?"on":""}" data-t="${t.id}">${t.name}${t.ats?" (ATS-friendly)":""}</button>`).join("")}<button class="tp" id="rn">Random</button></div>
  ${FIELDS.map(([k,l,ty,tip])=>`<label>${l}</label>${ty=="i"?`<input data-k="${k}" value="${esc(r.data[k])}">`:`<textarea data-k="${k}">${esc(r.data[k])}</textarea>`}${tip?`<span class="tip">Tip: ${tip}</span>`:""}`).join("")}
  <label>Download</label><div class="row"><button data-e="pdf">PDF</button><button data-e="doc">Word</button><button class="alt" data-e="txt">Text</button><button class="alt" data-e="html">HTML</button></div>
  <span class="tip">PDF opens your print dialog: choose “Save as PDF”.</span></div><div id="paper" class="paper ${r.template}"></div></div>`;
  const draw=()=>{const p=pct(cur.data);$("#pb").style.width=p+"%";$("#pt").textContent="Resume strength: "+p+"%";$("#paper").className="paper "+cur.template;$("#paper").innerHTML=paper(cur.data)};draw();
  const save=()=>{$("#sv").textContent="Saving…";clearTimeout(timer);timer=setTimeout(async()=>{try{await updateDoc(doc(rc(),cur.id),{title:cur.title,template:cur.template,data:cur.data,updatedAt:serverTimestamp()});$("#sv").textContent="Saved"}catch(e){$("#sv").textContent="Could not save"}},700)};
  const setT=t=>{cur.template=t;document.querySelectorAll(".tp[data-t]").forEach(b=>b.classList.toggle("on",b.dataset.t==t));draw();save()};
  $("#bk").onclick=dash;$("#ti").oninput=e=>{cur.title=e.target.value;save()};
  root.querySelectorAll("[data-k]").forEach(el=>el.oninput=()=>{cur.data[el.dataset.k]=el.value;draw();save()});
  root.querySelectorAll(".tp[data-t]").forEach(b=>b.onclick=()=>setT(b.dataset.t));
  $("#rn").onclick=()=>{bump("random");setT(TEMPLATES[Math.floor(Math.random()*TEMPLATES.length)].id)};
  root.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>exportAs(b.dataset.e));
}
function dl(name,type,content){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3)}
function exportAs(f){
  const d=cur.data,base=(d.name||"resume").replace(/\W+/g,"_"),css="body{font-family:Georgia,serif;font-size:11pt}h1{margin:0}h3{border-bottom:1px solid #666;margin:12px 0 4px}";
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(d.name)}</title><style>${css}</style></head><body>${paper(d)}</body></html>`;
  if(f=="pdf")window.print();
  if(f=="html")dl(base+".html","text/html",html);
  if(f=="doc")dl(base+".doc","application/msword",html);
  if(f=="txt")dl(base+".txt","text/plain",[d.name,[d.email,d.phone,d.location,d.links].filter(Boolean).join(" | "),"",...[["OBJECTIVE",d.objective],...(d.order||DEF).map(k=>[LBL[k].toUpperCase(),d[k]])].filter(x=>x[1]).flatMap(([h,t])=>[h,...list(t).map(l=>"- "+l),""])].join("\n"));
}

/* ---------- admin ---------- */
async function admin(){
  if(!isAdmin)return;
  const s=(await getDoc(doc(db,"stats","site"))).data()||{},us=(await getDocs(collection(db,"users"))).docs;
  const days=[];for(let i=0;i<7;i++){const k=new Date(Date.now()-i*864e5).toISOString().slice(0,10);days.push([k,(await getDoc(doc(db,"stats","d_"+k))).data()||{}])}
  root.innerHTML=`<div class="wrap"><h2>Admin</h2><div class="stats">${[["Page views",s.views],["Unique visitors (per day)",s.uniques],["Students",us.length],["Resumes created",s.resumes],["Random clicks",s.random]].map(([a,b])=>`<div class="stat"><b>${b||0}</b>${a}</div>`).join("")}</div>
  <h3>Template popularity</h3><p>${TEMPLATES.map(t=>`${t.name}: ${s["t_"+t.id]||0}`).join(" &nbsp; ")}</p>
  <h3>Last 7 days</h3><table><tr><th>Date</th><th>Views</th><th>Unique</th></tr>${days.map(([k,v])=>`<tr><td>${k}</td><td>${v.views||0}</td><td>${v.uniques||0}</td></tr>`).join("")}</table>
  <h3>Students</h3><table><tr><th>Name</th><th>Email</th><th>Joined</th><th></th></tr>${us.map(d=>{const u=d.data();return `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.createdAt?.toDate?.().toLocaleDateString()||""}</td><td><button class="alt" data-b="${d.id}" data-v="${u.blocked?0:1}">${u.blocked?"Unblock":"Block"}</button></td></tr>`}).join("")}</table>
  <p><small>For privacy, admins cannot read students' resume contents.</small></p></div>`;
  root.onclick=async ev=>{const b=ev.target.dataset.b;if(b){await updateDoc(doc(db,"users",b),{blocked:ev.target.dataset.v=="1"});admin()}};
}
countVisit();
