import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

const msg=document.getElementById("loginMessage");
const configured=!Object.values(firebaseConfig).some(v=>String(v).includes("YOUR_"));
if(!configured){msg.textContent="Firebase is not configured yet. Add your Firebase Web App settings to firebase-config.js.";document.getElementById("sendOtp").disabled=true;}
else{
 const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);let confirmation,recaptcha,profileBlob;
 const step=id=>["authPhone","authOtp","profileSetup"].forEach(x=>document.getElementById(x).classList.toggle("hidden",x!==id));
 document.getElementById("sendOtp").onclick=async()=>{const phone=document.getElementById("phoneNumber").value.trim();if(!/^\+\d{10,15}$/.test(phone)){msg.textContent="Use format +91XXXXXXXXXX.";return}try{if(!recaptcha){recaptcha=new RecaptchaVerifier(auth,"recaptcha-container",{size:"normal"});await recaptcha.render()}confirmation=await signInWithPhoneNumber(auth,phone,recaptcha);step("authOtp");msg.textContent="OTP sent."; }catch(e){console.error(e);msg.textContent="Could not send OTP. Check Firebase Phone Authentication and domain setup."}};
 document.getElementById("verifyOtp").onclick=async()=>{try{await confirmation.confirm(document.getElementById("otpCode").value.trim());const u=auth.currentUser,s=await getDoc(doc(db,"users",u.uid));if(s.exists())location.href="community.html";else step("profileSetup")}catch(e){console.error(e);msg.textContent="Invalid or expired OTP."}};
 document.getElementById("profilePic").onchange=e=>{const f=e.target.files[0];if(!f)return;profileBlob=f;document.getElementById("profilePicPreview").innerHTML=`<img src="${URL.createObjectURL(f)}" alt="Preview">`};
 document.getElementById("saveProfile").onclick=async()=>{const u=auth.currentUser,name=document.getElementById("profileName").value.trim();if(!name){msg.textContent="Please enter your name.";return}try{let photoURL="";if(profileBlob){const r=ref(storage,`users/${u.uid}/profile.jpg`);await uploadBytes(r,profileBlob,{contentType:profileBlob.type});photoURL=await getDownloadURL(r)}await setDoc(doc(db,"users",u.uid),{name,photoURL,phone:u.phoneNumber,createdAt:serverTimestamp()});location.href="community.html"}catch(e){console.error(e);msg.textContent="Could not save profile. Check Firestore and Storage setup."}};
}