import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

const configured = !Object.values(firebaseConfig).some(v => String(v).includes("YOUR_"));
let auth, db, storage, confirmationResult, recaptcha;

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
menuBtn?.addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
document.getElementById("year").textContent = new Date().getFullYear();

const modal = document.getElementById("authModal");
const loginCard = document.getElementById("loginCard");
const profileBar = document.getElementById("profileBar");
const feedLayout = document.getElementById("feedLayout");
const authMini = document.getElementById("authMini");

function openModal() { modal.classList.remove("hidden"); modal.setAttribute("aria-hidden","false"); }
function closeModal() { modal.classList.add("hidden"); modal.setAttribute("aria-hidden","true"); }
document.getElementById("openLogin").onclick = openModal;
document.getElementById("closeLogin").onclick = closeModal;

function showStep(id) {
  ["authPhone","authOtp","profileSetup"].forEach(x => document.getElementById(x).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function avatarHTML(url, name="User") {
  return url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}">` : "👤";
}
function escapeHtml(s="") {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function resizeImage(file, max=700) {
  return new Promise((resolve,reject)=>{
    const img = new Image(), reader = new FileReader();
    reader.onload = () => { img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width,img.height));
      const c=document.createElement("canvas"); c.width=Math.round(img.width*scale); c.height=Math.round(img.height*scale);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      c.toBlob(resolve,"image/jpeg",0.82);
    }; img.onerror=reject; img.src=reader.result; };
    reader.onerror=reject; reader.readAsDataURL(file);
  });
}

if (!configured) {
  document.getElementById("openLogin").disabled = true;
  document.getElementById("openLogin").textContent = "Connect Firebase first";
  const note = document.createElement("p");
  note.className = "setup-note";
  note.textContent = "Citizen login is ready in the code, but Firebase credentials must be added to firebase-config.js.";
  document.querySelector(".login-card").appendChild(note);
} else {
  const firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);

  document.getElementById("sendOtp").onclick = async () => {
    const phone = document.getElementById("phoneNumber").value.trim();
    if (!/^\+\d{10,15}$/.test(phone)) return alert("Enter your phone number with country code, e.g. +91XXXXXXXXXX.");
    try {
      if (!recaptcha) {
        recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", {size:"normal"});
        await recaptcha.render();
      }
      confirmationResult = await signInWithPhoneNumber(auth, phone, recaptcha);
      showStep("authOtp");
    } catch (e) {
      console.error(e);
      alert("OTP could not be sent. Check Firebase Phone Authentication and reCAPTCHA setup.");
    }
  };

  document.getElementById("verifyOtp").onclick = async () => {
    const code = document.getElementById("otpCode").value.trim();
    if (!/^\d{6}$/.test(code)) return alert("Enter the 6-digit OTP.");
    try {
      await confirmationResult.confirm(code);
      const u = auth.currentUser;
      const snap = await getDoc(doc(db,"users",u.uid));
      if (snap.exists()) {
        closeModal();
      } else {
        showStep("profileSetup");
      }
    } catch (e) {
      console.error(e);
      alert("Invalid or expired OTP.");
    }
  };

  let selectedProfileBlob = null;
  document.getElementById("profilePic").onchange = async e => {
    const file=e.target.files[0]; if(!file)return;
    selectedProfileBlob=await resizeImage(file,500);
    document.getElementById("profilePicPreview").innerHTML = `<img src="${URL.createObjectURL(selectedProfileBlob)}" alt="Preview">`;
  };

  document.getElementById("saveProfile").onclick = async () => {
    const u=auth.currentUser, name=document.getElementById("profileName").value.trim();
    if(!u || !name) return alert("Please enter your name.");
    try {
      let photoURL="";
      if(selectedProfileBlob){
        const r=ref(storage,`users/${u.uid}/profile.jpg`);
        await uploadBytes(r,selectedProfileBlob,{contentType:"image/jpeg"});
        photoURL=await getDownloadURL(r);
      }
      await setDoc(doc(db,"users",u.uid),{name,photoURL,phone:u.phoneNumber,createdAt:serverTimestamp()});
      closeModal();
    } catch(e) {
      console.error(e); alert("Could not save profile. Check Firestore and Storage setup.");
    }
  };

  onAuthStateChanged(auth, async u => {
    if(!u){ renderLoggedOut(); return; }
    const snap=await getDoc(doc(db,"users",u.uid));
    if(!snap.exists()){ showStep("profileSetup"); openModal(); return; }
    renderLoggedIn({uid:u.uid,...snap.data()});
    subscribeToFeed();
  });

  async function renderLoggedIn(user){
    loginCard.classList.add("hidden"); profileBar.classList.remove("hidden"); feedLayout.classList.remove("hidden");
    const photo=avatarHTML(user.photoURL,user.name);
    profileBar.innerHTML=`<div class="avatar">${photo}</div><div><b>${escapeHtml(user.name)}</b><small>Citizen of Asko community</small></div><button id="logout" class="btn outline">Log out</button>`;
    document.getElementById("logout").onclick=()=>signOut(auth);
    authMini.innerHTML=`<button class="avatar mini-avatar">${photo}</button>`;
    document.getElementById("sidebarProfile").innerHTML=`<div class="avatar large">${photo}</div><h3>${escapeHtml(user.name)}</h3><p>Asko Community</p>`;
    document.getElementById("createAvatar").innerHTML=photo;
  }
  function renderLoggedOut(){
    loginCard.classList.remove("hidden"); profileBar.classList.add("hidden"); feedLayout.classList.add("hidden"); authMini.innerHTML="";
  }

  document.getElementById("postForm").onsubmit=async e=>{
    e.preventDefault();
    const text=document.getElementById("postText").value.trim();
    const file=document.getElementById("postImage").files[0];
    if(!text && !file) return;
    const u=auth.currentUser; if(!u)return;
    const userSnap=await getDoc(doc(db,"users",u.uid)); const user=userSnap.data();
    try{
      let imageURL="";
      if(file){
        const blob=await resizeImage(file,1200);
        const r=ref(storage,`posts/${u.uid}/${Date.now()}.jpg`);
        await uploadBytes(r,blob,{contentType:"image/jpeg"}); imageURL=await getDownloadURL(r);
      }
      await addDoc(collection(db,"posts"),{uid:u.uid,name:user.name,photoURL:user.photoURL||"",text,imageURL,createdAt:serverTimestamp()});
      document.getElementById("postText").value=""; document.getElementById("postImage").value="";
    }catch(e){console.error(e);alert("Could not publish post. Check Firestore/Storage rules.");}
  };

  function subscribeToFeed(){
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));
    onSnapshot(q,snap=>{
      const box=document.getElementById("feedMessages"); box.innerHTML="";
      if(snap.empty){box.innerHTML='<div class="empty-feed card">No posts yet. Be the first citizen to share something about Asko.</div>';return;}
      snap.forEach(d=>renderPost(d.id,d.data(),box));
    },err=>{console.error(err);document.getElementById("feedMessages").innerHTML='<div class="card">Feed could not be loaded. Check Firestore rules.</div>';});
  }
  function renderPost(id,p,box){
    const article=document.createElement("article"); article.className="post card";
    const date=p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}) : "Just now";
    article.innerHTML=`<div class="post-head"><div class="avatar">${avatarHTML(p.photoURL,p.name)}</div><div><b>${escapeHtml(p.name||"Asko Citizen")}</b><small>${date}</small></div></div>
      ${p.text?`<div class="post-text">${escapeHtml(p.text)}</div>`:""}${p.imageURL?`<img class="post-image" src="${escapeHtml(p.imageURL)}" alt="Citizen post image" loading="lazy">`:""}
      <div class="post-actions"><button>👍 Like</button><button>💬 Comment</button><button>↗ Share</button></div>`;
    box.appendChild(article);
  }
}

const chatForm=document.getElementById("chatForm"), input=document.getElementById("chatInput"), messages=document.getElementById("chatMessages");
function addMessage(text,who){const d=document.createElement("div");d.className=`message ${who}`;d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d;}
chatForm?.addEventListener("submit",async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;addMessage(q,"user");input.value="";const t=addMessage("Thinking…","bot");try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q})});const d=await r.json();t.textContent=d.answer||d.error||"Something went wrong."}catch{t.textContent="Could not connect to the village assistant."}});
