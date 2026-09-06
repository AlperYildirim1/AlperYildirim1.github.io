(() => {
  'use strict';
  const canvas = document.getElementById('phase-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const slider = document.getElementById('phase');
  const output = document.getElementById('phase-value');
  const toggle = document.getElementById('motion-toggle');
  const symbol = document.getElementById('motion-symbol');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduceMotion.matches, phase = Math.PI / 2, time = 0, previous = 0, frame = 0, visible = true;
  let width = 0, height = 0;
  const tau = Math.PI * 2;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  function project(x, y, z) {
    const yaw = -.38, tilt = .93;
    const xx = x * Math.cos(yaw) - y * Math.sin(yaw);
    const yy = x * Math.sin(yaw) + y * Math.cos(yaw);
    const scale = Math.min(width / 3.9, height / 2.85);
    return [width * .5 + xx * scale, height * .51 + (yy * Math.cos(tilt) - z * Math.sin(tilt)) * scale];
  }
  function line(points, color, lineWidth = 1) {
    ctx.beginPath();points.forEach((p,i) => { const [x,y] = project(...p); if(i)ctx.lineTo(x,y); else ctx.moveTo(x,y); });
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
  }
  function ring(radius,z,color) { const p=[];for(let j=0;j<=180;j++){const a=j/180*tau;p.push([radius*Math.cos(a),radius*Math.sin(a),z]);}line(p,color); }
  function draw() {
    ctx.clearRect(0,0,width,height);
    const glow = ctx.createRadialGradient(width*.5,height*.48,0,width*.5,height*.5,width*.49);
    glow.addColorStop(0,'rgba(85,120,156,0.09)');glow.addColorStop(1,'rgba(9,14,24,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    for(let i=0;i<5;i++)ring(.45+i*.26,-.2,'rgba(123,148,182,0.10)');
    for(let i=0;i<12;i++){const a=i/12*tau;line([[.3*Math.cos(a),.3*Math.sin(a),-.2],[1.5*Math.cos(a),1.5*Math.sin(a),-.2]],'rgba(123,148,182,0.11)');}
    line([[-1.65,0,-.2],[1.65,0,-.2]],'rgba(133,159,194,0.21)');
    line([[0,-1.65,-.2],[0,1.65,-.2]],'rgba(133,159,194,0.21)');
    line([[0,0,-.65],[0,0,1.15]],'rgba(133,159,194,0.20)');
    // Each line is a circular wave embedding: (r cos θ, r sin θ, A sin(3θ + φ)).
    const families=[{shift:0,color:[130,215,219]},{shift:phase,color:[184,157,232]}];
    for(const family of families){
      for(let k=0;k<17;k++){
        const r=.74+k*.025, pts=[];
        for(let j=0;j<=260;j++){const a=j/260*tau;const z=.39*Math.sin(3*a+family.shift+time)+.12;pts.push([r*Math.cos(a),r*Math.sin(a),z]);}
        const alpha=k===8?.93:.12+.22*(1-Math.abs(k-8)/9);
        line(pts,`rgba(${family.color.join(',')},${alpha})`,k===8?1.65:.65);
      }
    }
    const sum=[];
    for(let j=0;j<=260;j++){const a=j/260*tau;sum.push([1.38*Math.cos(a),1.38*Math.sin(a),.23*(Math.sin(3*a+time)+Math.sin(3*a+phase+time))+.12]);}
    line(sum,'rgba(224,187,126,.75)',1.15);
    for(const [i,f] of families.entries()){
      const a=.9, z=.39*Math.sin(3*a+f.shift+time)+.12;
      const [x,y]=project(.94*Math.cos(a),.94*Math.sin(a),z);
      ctx.beginPath();ctx.arc(x,y,3.2,0,tau);ctx.fillStyle=`rgb(${f.color.join(',')})`;ctx.fill();
    }
    ctx.font='10px "IBM Plex Mono", monospace';ctx.fillStyle='#8c9eb8';
    const [rx,ry]=project(1.7,0,-.2),[ix,iy]=project(0,-1.68,-.2);
    ctx.fillText('Re',rx,ry);ctx.fillText('Im',ix-8,iy-7);
    const ly=height-13, center=width*.5;ctx.textAlign='center';
    [['#88d6da','wave A',-93],['#b9a2e8','wave B',0],['#ddba82','sum',86]].forEach(([c,t,dx])=>{ctx.fillStyle=c;ctx.fillRect(center+dx-29,ly-4,12,1);ctx.fillText(t,center+dx+9,ly);});ctx.textAlign='start';
  }
  function animate(timestamp){frame=0;if(paused||!visible||document.hidden){previous=0;return;}if(previous)time+=Math.min(timestamp-previous,50)*.00032;previous=timestamp;draw();frame=requestAnimationFrame(animate);}
  function sync(){cancelAnimationFrame(frame);previous=0;toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Play phase animation':'Pause phase animation');symbol.textContent=paused?'▷':'Ⅱ';draw();if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(animate);}
  slider.addEventListener('input',()=>{const n=Number(slider.value)/100;phase=n*Math.PI;output.textContent=n.toFixed(2)+'π';slider.setAttribute('aria-valuetext',n.toFixed(2)+' pi radians');draw();});
  toggle.addEventListener('click',()=>{paused=!paused;sync();});
  reduceMotion.addEventListener('change',e=>{paused=e.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
  resize();sync();
})();
