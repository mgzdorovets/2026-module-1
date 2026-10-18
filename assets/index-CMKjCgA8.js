(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=e(i);fetch(i.href,r)}})();class g{constructor(){this.audio=new Audio,this.audio.preload="metadata",this.audio.playsInline=!0,this.useNativeAudio=window.matchMedia("(pointer: coarse)").matches||/iPhone|iPad|iPod|Android/i.test(navigator.userAgent),this.context=null,this.analyser=null,this.gain=null,this.volume=.8,this.source=null,this.data=null,this.currentTrack=null,this.listeners={}}connect(){if(this.useNativeAudio)return;this.context||(this.context=new AudioContext,this.source=this.context.createMediaElementSource(this.audio),this.analyser=this.context.createAnalyser(),this.analyser.fftSize=512,this.gain=this.context.createGain(),this.gain.gain.value=this.volume,this.data=new Uint8Array(this.analyser.frequencyBinCount),this.source.connect(this.analyser),this.analyser.connect(this.gain),this.gain.connect(this.context.destination))}play(t){this.currentTrack=t,this.audio.src=t.file,this.connect(),this.context&&this.context.state==="suspended"&&this.context.resume(),this.audio.play().catch(()=>{}),this.emit("track",t)}pause(){this.audio.pause()}toggle(){this.audio.paused?this.audio.play():this.audio.pause()}setVolume(t){const e=Math.min(1,Math.max(0,Number(t)||0));this.volume=e,this.gain&&this.gain.gain.setValueAtTime(e,this.context.currentTime),this.audio.volume=e}getProgress(){return this.audio.duration?this.audio.currentTime/this.audio.duration:0}seek(t){this.audio.duration&&(this.audio.currentTime=t*this.audio.duration)}getTime(){return{current:this.audio.currentTime||0,duration:this.audio.duration||0}}getLevels(){return this.analyser?(this.analyser.getByteFrequencyData(this.data),{bass:this.data.slice(0,20).reduce((t,e)=>t+e,0)/20/255,mid:this.data.slice(20,100).reduce((t,e)=>t+e,0)/80/255,high:this.data.slice(100).reduce((t,e)=>t+e,0)/(this.data.length-100)/255}):this.useNativeAudio&&this.currentTrack&&!this.audio.paused?window.getMobileTrackLevels?.(this.audio.currentTime)||(()=>{const e=this.audio.currentTime||0,s=Math.sin(e*5.2),i=Math.sin(e*8.4+1),r=Math.sin(e*13.7+2);return{bass:.25+s*s*.55,mid:.18+i*i*.35,high:.12+r*r*.25}})():{bass:0,mid:0,high:0}}on(t,e){this.listeners[t]||(this.listeners[t]=[]),this.listeners[t].push(e)}emit(t,e){this.listeners[t]&&this.listeners[t].forEach(s=>s(e))}}class f{constructor(t){this.audio=t,this.running=!1,this.listeners=[],this.energy=0,this.average=0,this.lastBeat=0,this.threshold=1.45,this.cooldown=180}start(){this.running||(this.running=!0,this.update())}stop(){this.running=!1}on(t){this.listeners.push(t)}emit(t){this.listeners.forEach(e=>e(t)),window.dispatchEvent(new CustomEvent("beat",{detail:t}))}update(){if(!this.running||(requestAnimationFrame(()=>this.update()),!this.audio.context))return;const{bass:t,mid:e,high:s}=this.audio.getLevels(),i=t*.65+e*.25+s*.1;this.average+=(i-this.average)*.03;const r=performance.now();i>this.average*this.threshold&&r-this.lastBeat>this.cooldown&&(this.lastBeat=r,this.emit({bass:t,mid:e,high:s,energy:i,average:this.average,time:r}))}}function w(n,t){const e=document.createElement("div");e.className="track-card",e.dataset.track=n.title||"";const s=n.title||"Без названия",i=s.length>28?s.slice(0,28)+"...":s,r=n.cover?n.cover:"covers/default.jpeg";e.innerHTML=`

    <div class="cover-wrap">


      <img

        src="${r}"

        loading="lazy"

        class="track-cover"

        alt="${s}"

      />


      <button

        class="play-button"

        aria-label="Play track">

        ▶

      </button>


    </div>



    <div class="track-info">


      <h3 title="${s}">

        ${i}

      </h3>


      <p>

        ${n.student||"Неизвестный автор"}

      </p>


      <span>

        ${n.module||"Без модуля"}

      </span>


    </div>

  `;const o=()=>{if(window.audio&&window.audio.currentTrack&&window.audio.currentTrack.title===n.title&&!window.audio.audio.paused){window.audio.pause();if(window.player){window.player.updateButton();window.player.updateSceneState()}return}document.querySelectorAll(".track-card.active").forEach(c=>c.classList.remove("active")),e.classList.add("active"),window.dispatchEvent(new CustomEvent("track-change",{detail:{title:n.title,student:n.student,cover:r,file:n.file}})),t(n)};return e.onclick=o,e.querySelector(".play-button").onclick=c=>{c.stopPropagation(),o()},e}function x(n,t){const e=["Все ученики",...new Set(n.map(i=>i.student))],s=["Все модули",...new Set(n.map(i=>i.module))];return{students:e,modules:s,filter(i,r,o=""){return n.filter(c=>{const a=i==="Все ученики"||c.student===i,h=r==="Все модули"||c.module===r,l=c.title.toLowerCase().includes(o.toLowerCase());return a&&h&&l})}}}class L{constructor(t,e){this.root=t,this.audio=e,this.currentTrack=null,this.visualLoop=null,t.innerHTML=`

<div class="player-panel">


<div class="player-info">

<div class="player-title">
Нет трека
</div>


<div class="player-author"></div>


</div>



<button class="player-play">
▶
</button>



<input
class="player-progress"
type="range"
min="0"
max="100"
value="0"
/>

<input
class="player-volume"
type="range"
min="0"
max="100"
value="80"
/>



<div class="player-time">
0:00 / 0:00
</div>






</div>

`,this.playButton=t.querySelector(".player-play"),this.progress=t.querySelector(".player-progress"),this.volume=t.querySelector(".player-volume"),this.title=t.querySelector(".player-title"),this.author=t.querySelector(".player-author"),this.time=t.querySelector(".player-time"),this.bind(),this.playButton.disabled=!0}bind(){this.playButton.onclick=()=>{if(!this.currentTrack)return;this.audio.toggle(),this.updateButton(),this.updateSceneState()},this.progress.oninput=()=>{this.audio.seek(this.progress.value/100)},this.volume&&(this.volume.oninput=()=>this.audio.setVolume(this.volume.value/100)),this.audio.audio.ontimeupdate=()=>{this.updateProgress()},this.audio.audio.onended=()=>{this.exitScene(),this.updateButton()}}play(t){this.currentTrack=t,this.playButton.disabled=!1,this.title.textContent=t.title,this.author.textContent=t.student,this.audio.play(t),this.updateButton(),this.enterScene(t)}enterScene(t){document.body.classList.add("listening");document.querySelectorAll(".track-card").forEach(e=>{e.style.pointerEvents=e.classList.contains("active")?"auto":"none"});const e=document.querySelector("#visual-title"),s=document.querySelector("#visual-cover");s&&(s.innerHTML=`

<img src="${t.cover}">

`,s.classList.add("show"),this.startVisualPulse()),e&&(e.innerHTML=`

<h2>${t.title}</h2>

<p>${t.student}</p>

`,requestAnimationFrame(()=>{e.classList.add("show")}))}startVisualPulse(){if(this.visualLoop)return;const t=document.querySelector("#visual-cover"),e=()=>{if(!t||this.audio.audio.paused){this.visualLoop=null;return}const{bass:s}=this.audio.getLevels(),i=1+s*.12,r=40+s*120;t.style.setProperty("--cover-scale",i),t.style.setProperty("--cover-glow",`${r}px`),requestAnimationFrame(e)};this.visualLoop=requestAnimationFrame(e)}exitScene(){document.body.classList.remove("listening");document.querySelectorAll(".track-card").forEach(e=>e.style.pointerEvents="auto");const t=document.querySelector("#visual-title"),e=document.querySelector("#visual-cover");t&&t.classList.remove("show"),e&&(e.classList.remove("show"),e.style.removeProperty("--cover-scale"),e.style.removeProperty("--cover-glow"))}updateSceneState(){this.audio.audio.paused?this.exitScene():this.currentTrack&&this.enterScene(this.currentTrack)}updateButton(){this.playButton.textContent=this.audio.audio.paused?"▶":"❚❚"}updateProgress(){const t=this.audio.getProgress();this.progress.value=t*100;const e=this.audio.getTime();this.time.textContent=`${this.format(e.current)} / ${this.format(e.duration)}`}format(t){if(!t)return"0:00";const e=Math.floor(t/60),s=Math.floor(t%60).toString().padStart(2,"0");return`${e}:${s}`}}class S{constructor(t,e){this.canvas=t,this.ctx=t.getContext("2d"),this.audio=e,this.particles=[],this.running=!1,this.center={x:window.innerWidth/2,y:window.innerHeight/2},this.color={h:250,s:90,l:70},this.targetColor={h:250,s:90,l:70},this.spaceLimit=1100,this.resize(),window.addEventListener("resize",()=>this.resize()),this.createParticles(2500)}resize(){this.canvas.width=window.innerWidth,this.canvas.height=window.innerHeight,this.center.x=this.canvas.width/2,this.center.y=this.canvas.height/2}createParticles(t){this.particles=[];for(let e=0;e<t;e++){const s=Math.random()*Math.PI*2,i=Math.sqrt(Math.random())*750;this.particles.push({x:this.center.x+Math.cos(s)*i,y:this.center.y+Math.sin(s)*i,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8,baseSize:Math.random()+.25,baseAlpha:Math.random()*.35+.55,size:1,alpha:1,noise:Math.random()*Math.PI*2,pulse:Math.random()*Math.PI*2})}}setTheme(t){t&&(this.targetColor={h:t.h||250,s:t.s||90,l:t.l||70})}start(){this.running||(this.running=!0,this.animate())}animate(){if(!this.running)return;requestAnimationFrame(()=>this.animate());const{bass:t,mid:e,high:s}=this.audio.getLevels();this.ctx.fillStyle="#05000f",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height),this.color.h+=(this.targetColor.h-this.color.h)*.02,this.color.s+=(this.targetColor.s-this.color.s)*.02,this.color.l+=(this.targetColor.l-this.color.l)*.02;const i=performance.now()*.001,r=t*1.6,o=e*1.4,c=s*2;this.particles.forEach(a=>{a.x+=a.vx,a.y+=a.vy,a.x+=Math.sin(i*.5+a.noise)*(.15+o),a.y+=Math.cos(i*.6+a.noise)*(.15+o);const h=a.x-this.center.x,l=a.y-this.center.y,u=Math.sqrt(h*h+l*l)||1;a.x+=h/u*r*.12,a.y+=l/u*r*.12,a.x<this.center.x-this.spaceLimit&&(a.x=this.center.x+this.spaceLimit),a.x>this.center.x+this.spaceLimit&&(a.x=this.center.x-this.spaceLimit),a.y<this.center.y-this.spaceLimit&&(a.y=this.center.y+this.spaceLimit),a.y>this.center.y+this.spaceLimit&&(a.y=this.center.y-this.spaceLimit);const p=Math.sin(i*3+a.pulse);a.size=a.baseSize+p*.175+t*2.25,a.alpha=a.baseAlpha+c*.35,a.alpha>1&&(a.alpha=1),this.ctx.beginPath(),this.ctx.fillStyle=`hsla(

${this.color.h},

${this.color.s}%,

${this.color.l}%,

${a.alpha}

)`,this.ctx.arc(a.x,a.y,a.size,0,Math.PI*2),this.ctx.fill()})}}function M(n){return new Promise(t=>{const e=new Image;e.crossOrigin="anonymous",e.src=n,e.onload=()=>{const s=document.createElement("canvas"),i=s.getContext("2d");s.width=50,s.height=50,i.drawImage(e,0,0,50,50);const r=i.getImageData(0,0,50,50).data;let o=0,c=0,a=0,h=0;for(let u=0;u<r.length;u+=4)r[u+3]<120||(o+=r[u],c+=r[u+1],a+=r[u+2],h++);o/=h,c/=h,a/=h;const l=b(o,c,a);t({h:l.h,s:Math.max(l.s,60),l:Math.min(Math.max(l.l,45),75)})},e.onerror=()=>{t({h:250,s:90,l:70})}})}function b(n,t,e){n/=255,t/=255,e/=255;const s=Math.max(n,t,e),i=Math.min(n,t,e);let r,o,c=(s+i)/2;if(s===i)r=0,o=0;else{const a=s-i;switch(o=c>.5?a/(2-s-i):a/(s+i),s){case n:r=(t-e)/a+(t<e?6:0);break;case t:r=(e-n)/a+2;break;case e:r=(n-t)/a+4;break}r/=6}return{h:r*360,s:o*100,l:c*100}}const y=new g,v=new f(y),d=new S(document.querySelector("#particles"),y);d.start();v.start();const m=new L(document.querySelector("#player"),y);window.audio=y;window.player=m;window.particles=d;window.beat=v;window.addEventListener("track-change",async n=>{const t=n.detail;if(!t.cover)return;const e=await M(t.cover);d.setTheme(e)});window.addEventListener("beat",n=>{var e,s;const t=n.detail;(e=d.onBeat)==null||e.call(d,t),(s=m.onBeat)==null||s.call(m,t)});
;(()=>{
 const isInside = (el)=> el && (el.closest('#player') || el.closest('.track-card') || el.closest('button') || el.closest('input'));
 document.addEventListener('click',(e)=>{
   if(isInside(e.target)) return;
   if(window.audio && !window.audio.audio.paused){
      window.audio.pause();
      if(window.player){ window.player.updateButton(); window.player.updateSceneState(); }
   }
 });
})();
fetch("tracks.json").then(n=>n.json()).then(n=>{window.tracks=n;const t=document.querySelector("#tracks");t&&n.forEach(e=>{t.appendChild(w(e,s=>{m.play(s)}))}),x(n)}).catch(n=>{console.error("Track loading error:",n)});

/* v10 bass boost marker: analyser response kept stable */
