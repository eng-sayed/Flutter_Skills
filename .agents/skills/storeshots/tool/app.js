const canvas = document.querySelector('#designCanvas');
const ctx = canvas.getContext('2d');
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const defaults = {
  frame: 'island', frameColor: '#d9eef1', scale: 78, x: 50, y: 59, rotation: 0, shadow: true,
  background: 'gradient', solidColor: '#16b95c', gradientStart: '#14c768', gradientEnd: '#068d73', gradientAngle: 135,
  backgroundBlur: 0, decorations: true, decorationStyle: 'rings', decorationColor: '#ffffff', decorationOpacity: 45, headline: 'كل ما تحتاجه… في تطبيق واحد', headlineColor: '#ffffff', headlineSize: 78,
  headlineY: 12, headlineVisible: true, screenshot: null, backgroundImage: null, pages: [], currentPage: 0,
  coverLogo: null, coverLogoUrl: null, coverPhoneScale: 82, coverLogoScale: 22, coverLogoX: 20, coverLogoY: 42,
  coverPhone1X: 57, coverPhone1Y: 54, coverPhone1Rotation: -5, coverPhone2X: 76, coverPhone2Y: 58, coverPhone2Rotation: 5,
  coverLayout: 'angled', coverShowHeadline: true
};
let state = {...defaults};
const STYLE_KEYS=['frame','frameColor','scale','x','y','rotation','shadow','background','solidColor','gradientStart','gradientEnd','gradientAngle','backgroundBlur','decorations','decorationStyle','decorationColor','decorationOpacity','headlineColor','headlineSize','headlineY','headlineVisible','coverPhoneScale','coverLogoScale','coverLogoX','coverLogoY','coverPhone1X','coverPhone1Y','coverPhone1Rotation','coverPhone2X','coverPhone2Y','coverPhone2Rotation','coverLayout','coverShowHeadline'];

function activePage(){ return state.pages[state.currentPage] || null; }
function activeScreenshot(){ return activePage()?.image || state.screenshot; }
function activeHeadline(){ return activePage()?.headline ?? state.headline; }
function value(key){const page=activePage();return page?.settings && key in page.settings?page.settings[key]:state[key]}
function setValue(key,newValue){const page=activePage();if($('#editCurrentOnly').checked&&page){page.settings ||= {};page.settings[key]=newValue}else{state[key]=newValue}}
function isCoverMode(){return ['5244x2950','3840x1646','1024x500'].includes($('#canvasPreset').value)}
function isPlayFeature(){return $('#canvasPreset').value==='1024x500'}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, r);
}

function coverImage(image, x, y, w, h) {
  const ratio = Math.max(w / image.width, h / image.height);
  const sw = w / ratio, sh = h / ratio;
  const sx = (image.width - sw) / 2, sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function drawBackground() {
  ctx.save();
  if (value('background') === 'solid') {
    ctx.fillStyle = value('solidColor');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (value('background') === 'image' && value('backgroundImage')) {
    ctx.filter = `blur(${value('backgroundBlur') * canvas.width / 1080}px)`;
    const bleed = value('backgroundBlur') * 3;
    coverImage(value('backgroundImage'), -bleed, -bleed, canvas.width + bleed * 2, canvas.height + bleed * 2);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  } else {
    const angle = value('gradientAngle') * Math.PI / 180;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const length = Math.abs(canvas.width * Math.cos(angle)) + Math.abs(canvas.height * Math.sin(angle));
    const x = Math.cos(angle) * length / 2, y = Math.sin(angle) * length / 2;
    const gradient = ctx.createLinearGradient(cx-x, cy-y, cx+x, cy+y);
    gradient.addColorStop(0, value('gradientStart')); gradient.addColorStop(1, value('gradientEnd'));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
}

function drawDecorations() {
  const style=value('decorationStyle');
  if (!value('decorations') || style==='none') return;
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.globalAlpha=value('decorationOpacity')/100;ctx.strokeStyle=value('decorationColor');ctx.fillStyle=value('decorationColor');ctx.lineWidth=w*.008;
  if(style==='rings'){
    [[.12,.36,.1],[.91,.76,.14],[.82,.2,.055]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(w*x,h*y,w*r,0,Math.PI*2);ctx.stroke()});
  }else if(style==='dots'){
    [[.08,.18],[.79,.29],[.82,.7]].forEach(([sx,sy])=>{for(let r=0;r<4;r++)for(let c=0;c<4;c++){ctx.beginPath();ctx.arc(w*(sx+c*.035),h*(sy+r*.025),w*.008,0,Math.PI*2);ctx.fill()}});
  }else if(style==='waves'){
    ctx.lineWidth=w*.012;[[.12,.34,.22],[.76,.68,.28]].forEach(([sx,sy,len])=>{ctx.beginPath();for(let i=0;i<=40;i++){const x=w*(sx+len*i/40),y=h*(sy+Math.sin(i/3)*.018);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()});
  }else if(style==='geometry'){
    [[.12,.3,.08,0],[.86,.24,.065,Math.PI/4],[.83,.75,.1,Math.PI/6]].forEach(([x,y,size,angle],i)=>{ctx.save();ctx.translate(w*x,h*y);ctx.rotate(angle);ctx.beginPath();i===1?ctx.arc(0,0,w*size,0,Math.PI*2):ctx.rect(-w*size,-w*size,w*size*2,w*size*2);ctx.stroke();ctx.restore()});
  }else if(style==='confetti'){
    const pieces=[[.08,.2,.04],[.18,.42,-.7],[.88,.18,.9],[.82,.38,-.2],[.1,.72,.6],[.91,.78,-.8],[.7,.13,.3],[.27,.83,-.4]];
    ctx.lineWidth=w*.014;ctx.lineCap='round';pieces.forEach(([x,y,a],i)=>{ctx.save();ctx.translate(w*x,h*y);ctx.rotate(a);if(i%3===0){ctx.beginPath();ctx.arc(0,0,w*.018,0,Math.PI*2);ctx.stroke()}else{ctx.beginPath();ctx.moveTo(-w*.025,0);ctx.lineTo(w*.025,0);ctx.stroke()}ctx.restore()});
  }
  ctx.restore();
}

function drawPlaceholder(x, y, w, h) {
  ctx.fillStyle='#f3f5fb';ctx.fillRect(x,y,w,h);
  const grad=ctx.createLinearGradient(x,y,x+w,y);grad.addColorStop(0,'#12b7aa');grad.addColorStop(1,'#37cfc1');ctx.fillStyle=grad;ctx.fillRect(x,y,w,h*.18);
  ctx.fillStyle='#ffffff';ctx.globalAlpha=.94;roundedRect(ctx,x+w*.08,y+h*.25,w*.84,h*.36,w*.04);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#dce3f0';roundedRect(ctx,x+w*.16,y+h*.31,w*.68,h*.04,w*.02);ctx.fill();roundedRect(ctx,x+w*.16,y+h*.39,w*.51,h*.03,w*.015);ctx.fill();
  ctx.fillStyle='#0eb0a8';roundedRect(ctx,x+w*.16,y+h*.5,w*.68,h*.08,w*.025);ctx.fill();
  ctx.fillStyle='#4d5663';ctx.font=`700 ${Math.max(18,w*.055)}px Arial`;ctx.textAlign='center';ctx.direction='rtl';ctx.fillText('ارفع صورة التطبيق',x+w/2,y+h*.68);
  ctx.fillStyle='#e8ebf3';roundedRect(ctx,x+w*.08,y+h*.82,w*.84,h*.1,w*.05);ctx.fill();
}

function drawDevice(options={}) {
  const screenshot=Object.prototype.hasOwnProperty.call(options,'screenshot')?options.screenshot:activeScreenshot();
  const aspect = 0.49;
  const deviceH = canvas.height * ((options.scale??value('scale')) / 100);
  const deviceW = deviceH * aspect;
  const centerX = canvas.width * (options.x??value('x')) / 100;
  const centerY = canvas.height * (options.y??value('y')) / 100;
  const outerRadius = deviceW * (value('frame') === 'simple' ? .12 : .15);
  const bezel = deviceW * (value('frame') === 'simple' ? .055 : .038);
  const screenX = -deviceW/2 + bezel * 1.7;
  const screenY = -deviceH/2 + bezel * 1.55;
  const screenW = deviceW - bezel * 3.4;
  const screenH = deviceH - bezel * 3.1;
  const screenRadius = outerRadius * .72;
  ctx.save(); ctx.translate(centerX, centerY); ctx.rotate((options.rotation??value('rotation'))*Math.PI/180);
  if(value('shadow')){ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=deviceW*.1;ctx.shadowOffsetY=deviceW*.065}
  ctx.fillStyle = value('frame') === 'simple' ? '#565b61' : value('frameColor');
  roundedRect(ctx,-deviceW/2,-deviceH/2,deviceW,deviceH,outerRadius);ctx.fill();
  ctx.shadowColor='transparent';
  if(value('frame')!=='simple'){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=Math.max(2,deviceW*.009);roundedRect(ctx,-deviceW/2+deviceW*.012,-deviceH/2+deviceW*.012,deviceW-deviceW*.024,deviceH-deviceW*.024,outerRadius*.92);ctx.stroke()}
  ctx.fillStyle='#060708';roundedRect(ctx,-deviceW/2+bezel,-deviceH/2+bezel,deviceW-bezel*2,deviceH-bezel*2,outerRadius*.85);ctx.fill();
  ctx.save();roundedRect(ctx,screenX,screenY,screenW,screenH,screenRadius);ctx.clip();
  if(screenshot) coverImage(screenshot,screenX,screenY,screenW,screenH); else drawPlaceholder(screenX,screenY,screenW,screenH);
  ctx.restore();
  if(value('frame')==='island'){
    ctx.fillStyle='#020303';roundedRect(ctx,-deviceW*.18,-deviceH/2+bezel*1.95,deviceW*.36,deviceW*.105,deviceW*.06);ctx.fill();
    ctx.fillStyle='#10141a';ctx.beginPath();ctx.arc(deviceW*.105,-deviceH/2+bezel*2.75,deviceW*.026,0,Math.PI*2);ctx.fill();
  } else if(value('frame')==='notch'){
    ctx.fillStyle='#030404';ctx.beginPath();ctx.moveTo(-deviceW*.17,-deviceH/2+bezel*1.45);ctx.lineTo(deviceW*.17,-deviceH/2+bezel*1.45);ctx.lineTo(deviceW*.14,-deviceH/2+bezel*3.3);ctx.quadraticCurveTo(0,-deviceH/2+bezel*4, -deviceW*.14,-deviceH/2+bezel*3.3);ctx.closePath();ctx.fill();
  } else if(value('frame')==='android'){
    ctx.fillStyle='#101318';ctx.beginPath();ctx.arc(0,-deviceH/2+bezel*2.8,deviceW*.024,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function wrapText(text, maxWidth) {
  const words = text.trim().split(/\s+/); const lines=[]; let current='';
  for(const word of words){const test=current?`${current} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&current){lines.push(current);current=word}else current=test}if(current)lines.push(current);return lines.slice(0,3);
}

function drawHeadline() {
  const headline = activeHeadline();
  if(!value('headlineVisible') || !headline.trim()) return;
  const base = canvas.width / 1242;
  ctx.save();ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=value('headlineColor');ctx.font=`800 ${value('headlineSize')*base}px "Noto Sans Arabic", Tahoma, Arial, sans-serif`;
  ctx.shadowColor='rgba(0,0,0,.16)';ctx.shadowBlur=8*base;ctx.shadowOffsetY=3*base;
  const lines=wrapText(headline,canvas.width*.78);const lineHeight=value('headlineSize')*base*1.25;const startY=canvas.height*value('headlineY')/100-(lines.length-1)*lineHeight/2;
  lines.forEach((line,i)=>ctx.fillText(line,canvas.width/2,startY+i*lineHeight));ctx.restore();
}

function containImage(image,x,y,maxW,maxH){const ratio=Math.min(maxW/image.width,maxH/image.height);const w=image.width*ratio,h=image.height*ratio;ctx.drawImage(image,x-w/2,y-h/2,w,h)}
function drawCover(){
  const scale=value('coverPhoneScale');
  drawDevice({screenshot:state.pages[0]?.image||null,x:value('coverPhone1X'),y:value('coverPhone1Y'),scale,rotation:value('coverPhone1Rotation')});
  drawDevice({screenshot:state.pages[1]?.image||null,x:value('coverPhone2X'),y:value('coverPhone2Y'),scale,rotation:value('coverPhone2Rotation')});
  const logoX=canvas.width*value('coverLogoX')/100,logoY=canvas.height*value('coverLogoY')/100,maxW=canvas.width*value('coverLogoScale')/100,maxH=canvas.height*.3;
  ctx.save();
  if(state.coverLogo)containImage(state.coverLogo,logoX,logoY,maxW,maxH);
  else{ctx.fillStyle='rgba(255,255,255,.92)';roundedRect(ctx,logoX-maxW*.28,logoY-maxW*.28,maxW*.56,maxW*.56,maxW*.12);ctx.fill();ctx.fillStyle='#596273';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.max(34,canvas.width*.018)}px Arial`;ctx.fillText('LOGO',logoX,logoY)}
  if(value('coverShowHeadline')&&activeHeadline().trim()){
    const size=Math.max(38,canvas.width*.021);ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=value('headlineColor');ctx.font=`800 ${size}px "Noto Sans Arabic", Tahoma, Arial, sans-serif`;
    const lines=wrapText(activeHeadline(),canvas.width*.3),lineHeight=size*1.28,startY=canvas.height*.68-(lines.length-1)*lineHeight/2;lines.forEach((line,i)=>ctx.fillText(line,logoX,startY+i*lineHeight));
  }
  ctx.restore();
}

function render(){drawBackground();drawDecorations();if(isCoverMode())drawCover();else{drawDevice();drawHeadline()}updateZoomLabel()}
function updateZoomLabel(){requestAnimationFrame(()=>{$('#zoomLabel').textContent=`${Math.round(canvas.getBoundingClientRect().width/canvas.width*100)}%`})}

function loadImageFile(file, key, statusText) {
  if(!file) return;
  if(!file.type.startsWith('image/')){showToast('اختَر ملف صورة صالحًا');return}
  const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{image.dataUrl=reader.result;setValue(key,image);if(statusText)$('#imageStatus').textContent=file.name;render();showToast('تم تحميل الصورة')};image.onerror=()=>showToast('تعذر قراءة الصورة');image.src=reader.result};reader.readAsDataURL(file);
}

function readImageFile(file){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/')) return reject(new Error('invalid'));
    const reader=new FileReader();
    reader.onload=()=>{const image=new Image();image.onload=()=>resolve({image,name:file.name,url:reader.result,headline:state.headline,settings:{}});image.onerror=reject;image.src=reader.result};
    reader.onerror=reject;reader.readAsDataURL(file);
  });
}

async function addScreenshots(files){
  const imageFiles=[...files].filter(file=>file.type.startsWith('image/'));
  if(!imageFiles.length){showToast('اختَر ملفات صور صالحة');return}
  try{
    const added=await Promise.all(imageFiles.map(readImageFile));
    const wasEmpty=state.pages.length===0;state.pages.push(...added);if(wasEmpty)state.currentPage=0;
    selectPage(state.currentPage);showToast(`تمت إضافة ${added.length} صورة`);
  }catch{showToast('تعذر قراءة واحدة أو أكثر من الصور')}
}

function selectPage(index){
  if(!state.pages.length){state.currentPage=0;$('#headline').value=state.headline;updateGallery();render();return}
  state.currentPage=Math.max(0,Math.min(index,state.pages.length-1));
  $('#headline').value=activeHeadline();updateGallery();syncControls();render();
}

function syncControls(){
  syncOutputs();
  $('#frameColor').value=value('frameColor');$('#solidColor').value=value('solidColor');$('#gradientStart').value=value('gradientStart');$('#gradientEnd').value=value('gradientEnd');$('#headlineColor').value=value('headlineColor');$('#headlineSize').value=value('headlineSize');
  $('#deviceShadow').checked=value('shadow');$('#headlineVisible').checked=value('headlineVisible');$('#decorationColor').value=value('decorationColor');$('#decorationOpacity').value=value('decorationOpacity');
  $$('.frame-option').forEach(button=>{const selected=button.dataset.frame===value('frame');button.classList.toggle('selected',selected);button.setAttribute('aria-checked',selected)});
  $$('[data-background]').forEach(button=>button.classList.toggle('active',button.dataset.background===value('background')));
  $$('[data-decoration]').forEach(button=>{const selected=button.dataset.decoration===value('decorationStyle');button.classList.toggle('selected',selected);button.setAttribute('aria-checked',selected)});
  $$('[data-cover-layout]').forEach(button=>button.classList.toggle('active',button.dataset.coverLayout===state.coverLayout));
  $('#solidControls').hidden=value('background')!=='solid';$('#gradientControls').hidden=value('background')!=='gradient';$('#imageControls').hidden=value('background')!=='image';
}

const templates={
  fresh:{background:'gradient',gradientStart:'#14c768',gradientEnd:'#068d73',gradientAngle:135,frame:'island',frameColor:'#d9eef1',headlineColor:'#ffffff',rotation:0,decorations:true,decorationStyle:'rings'},
  night:{background:'gradient',gradientStart:'#15173b',gradientEnd:'#713b91',gradientAngle:145,frame:'island',frameColor:'#252938',headlineColor:'#ffffff',rotation:-4,decorations:true,decorationStyle:'dots'},
  sunset:{background:'gradient',gradientStart:'#ff6a58',gradientEnd:'#ffbd67',gradientAngle:120,frame:'android',frameColor:'#252525',headlineColor:'#2b1930',rotation:4,decorations:true,decorationStyle:'confetti'},
  clean:{background:'solid',solidColor:'#f1f4f8',frame:'simple',headlineColor:'#18202a',rotation:0,decorations:false,decorationStyle:'none'}
};
function applyTemplate(name){Object.entries(templates[name]).forEach(([key,val])=>setValue(key,val));syncControls();render();showToast('تم تطبيق القالب')}
function applyCoverLayout(name){
  const layouts={angled:{coverPhone1X:57,coverPhone1Y:54,coverPhone1Rotation:-5,coverPhone2X:76,coverPhone2Y:58,coverPhone2Rotation:5},parallel:{coverPhone1X:57,coverPhone1Y:55,coverPhone1Rotation:0,coverPhone2X:76,coverPhone2Y:55,coverPhone2Rotation:0},stacked:{coverPhone1X:61,coverPhone1Y:50,coverPhone1Rotation:-7,coverPhone2X:72,coverPhone2Y:60,coverPhone2Rotation:4}};
  state.coverLayout=name;Object.assign(state,layouts[name]);syncControls();render();
}

function imageFromUrl(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url})}
function saveProjectFile(){
  const globalStyles=Object.fromEntries(STYLE_KEYS.map(key=>[key,state[key]]));
  const pages=state.pages.map(page=>{const settings={...(page.settings||{})};if(settings.backgroundImage){settings.backgroundImageUrl=settings.backgroundImage.dataUrl;delete settings.backgroundImage}return{name:page.name,url:page.url,headline:page.headline,settings}});
  const project={version:1,canvas:$('#canvasPreset').value,format:$('#exportFormat').value,quality:$('#exportQuality').value,globalStyles,globalBackgroundImage:state.backgroundImage?.dataUrl||null,coverLogoUrl:state.coverLogoUrl||null,pages};
  const blob=new Blob([JSON.stringify(project)],{type:'application/json'});downloadBlob(blob,'project.storeshots');showToast('تم حفظ المشروع');
}
async function loadProjectFile(file){
  try{
    const project=JSON.parse(await file.text());if(project.version!==1||!Array.isArray(project.pages))throw new Error('invalid');
    Object.assign(state,project.globalStyles||{});state.backgroundImage=project.globalBackgroundImage?await imageFromUrl(project.globalBackgroundImage):null;state.coverLogoUrl=project.coverLogoUrl||null;state.coverLogo=state.coverLogoUrl?await imageFromUrl(state.coverLogoUrl):null;const pages=[];
    for(const page of project.pages){const image=await imageFromUrl(page.url);const settings=page.settings||{};if(settings.backgroundImageUrl){settings.backgroundImage=await imageFromUrl(settings.backgroundImageUrl);settings.backgroundImage.dataUrl=settings.backgroundImageUrl;delete settings.backgroundImageUrl}pages.push({...page,image,settings})}
    state.pages=pages;state.currentPage=0;
    const presetMigration={'1260x2736':'1206x2622','1242x2688':'1179x2556','1242x2208':'1179x2556','1290x2796':'1206x2622'};
    const requestedPreset=presetMigration[project.canvas]||project.canvas||'1206x2622';
    $('#canvasPreset').value=[...$('#canvasPreset').options].some(option=>option.value===requestedPreset)?requestedPreset:'1206x2622';
    const [w,h]=$('#canvasPreset').value.split('x').map(Number);canvas.width=w;canvas.height=h;
    $('#exportFormat').value=project.format||'jpeg';$('#exportQuality').value=project.quality||'0.82';updateModeUI();selectPage(0);showToast('تم فتح المشروع');
  }catch{showToast('ملف المشروع غير صالح')}
}

function updateGallery(){
  const gallery=$('#pageGallery');gallery.innerHTML='';
  state.pages.forEach((page,index)=>{
    const button=document.createElement('button');button.type='button';button.className=`page-thumb${index===state.currentPage?' selected':''}`;
    button.setAttribute('aria-label',`الصورة ${index+1}: ${page.name}`);button.innerHTML=`<img alt="" src="${page.url}"><b>${index+1}</b>`;
    button.addEventListener('click',()=>selectPage(index));gallery.appendChild(button);
  });
  const add=document.createElement('label');add.className='page-thumb add';add.setAttribute('aria-label','إضافة صور أخرى');
  add.innerHTML='+<input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>';
  add.querySelector('input').addEventListener('change',e=>addScreenshots(e.target.files));gallery.appendChild(add);
  $('#imageStatus').textContent=state.pages.length?`${state.pages.length} صورة في المشروع`:'لم تُرفع صور بعد';
  $('#pageIndicator').textContent=state.pages.length?`الصورة ${state.currentPage+1} من ${state.pages.length}`:'معاينة مباشرة';
  updateExportLabel();
}

function updateExportLabel(){const extension=$('#exportFormat').value==='png'?'PNG':'JPG';if(isCoverMode()){$('#exportButton').textContent=isPlayFeature()?`تنزيل Feature Graphic ${extension}`:`تنزيل الكفر ${extension}`;return}$('#exportButton').textContent=state.pages.length>1?'تنزيل الكل ZIP':`تنزيل ${extension}`}
function updateQualityLabels(){
  const png=$('#exportFormat').value==='png',labels=png?['PNG أصلي — أكبر حجم','PNG ضغط متوازن','PNG حجم صغير','PNG حجم صغير جدًا']:['JPG جودة عالية','JPG جودة متوازنة','JPG حجم صغير','JPG حجم صغير جدًا'];
  [...$('#exportQuality').options].forEach((option,index)=>option.textContent=labels[index]);
}
function updateModeUI(){
  const cover=isCoverMode();$('#coverPanel').hidden=!cover;
  $('#exportFormat').disabled=false;$('#exportQuality').disabled=false;
  if(cover){
    const play=isPlayFeature();
    $('#pageIndicator').textContent=play?'معاينة Feature Graphic':'معاينة كفر صفحة التطبيق';
    $('#stageHint').textContent=play
      ?'Your featured graphic must be a PNG or JPEG, up to 15 MB and 1024 px by 500 px. This graphic will be used when you choose to feature your app.'
      :'يمكنك تحريك اللوجو وكل موبايل من إعدادات الكفر. اختر PNG للنسخة المقبولة في Apple.';
    const help=$('#coverHelp'), spec=$('#coverSpec');
    if(help) help.textContent=play
      ?'Feature Graphic يستخدم أول صورتين + اللوجو. الصيغة PNG أو JPEG، حتى 15 MB، والمقاس ثابت 1024×500.'
      :'الكفر يستخدم أول صورتين من الصور المرفوعة ويضعهما داخل فريمَي موبايل.';
    if(spec) spec.hidden=!play;
  }
  else{$('#stageHint').textContent='اسحب الموبايل أو العنوان مباشرة لتغيير مكانهما — الصور تظل على جهازك.';updateGallery()}
  updateQualityLabels();updateExportLabel();render();
}

function crc32(bytes){let crc=-1;for(const byte of bytes){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0)}return(crc^-1)>>>0}
function u16(n){return [n&255,(n>>>8)&255]}
function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
function makeZip(files){
  const encoder=new TextEncoder(),local=[],central=[];let offset=0;
  files.forEach(file=>{
    const name=encoder.encode(file.name),data=file.data,crc=crc32(data);
    const localHeader=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
    local.push(localHeader,data);
    const centralHeader=new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);
    central.push(centralHeader);offset+=localHeader.length+data.length;
  });
  const centralSize=central.reduce((sum,item)=>sum+item.length,0);
  const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),...u16(0)]);
  return new Blob([...local,...central,end],{type:'application/zip'});
}

function exportOptions(){
  const format=$('#exportFormat').value;
  return {format,mime:format==='png'?'image/png':'image/jpeg',extension:format==='png'?'png':'jpg',quality:Number($('#exportQuality').value)};
}
function pngColorStep(quality){if(quality>=.9)return 1;if(quality>=.8)return 8;if(quality>=.68)return 16;return 32}
function canvasBlob(){
  const options=exportOptions();
  if(options.format!=='png')return new Promise(resolve=>canvas.toBlob(resolve,options.mime,options.quality));
  const step=pngColorStep(options.quality);
  if(step===1)return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  return new Promise(resolve=>setTimeout(()=>{
    const compressed=document.createElement('canvas');compressed.width=canvas.width;compressed.height=canvas.height;const cctx=compressed.getContext('2d',{willReadFrequently:true});cctx.drawImage(canvas,0,0);
    const imageData=cctx.getImageData(0,0,compressed.width,compressed.height),pixels=imageData.data,lut=new Uint8Array(256);
    for(let i=0;i<256;i++)lut[i]=Math.min(255,Math.round(i/step)*step);
    for(let i=0;i<pixels.length;i+=4){pixels[i]=lut[pixels[i]];pixels[i+1]=lut[pixels[i+1]];pixels[i+2]=lut[pixels[i+2]];pixels[i+3]=255}
    cctx.putImageData(imageData,0,0);compressed.toBlob(resolve,'image/png');
  },0));
}
function fileSizeLabel(bytes){return bytes>=1048576?`${(bytes/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(bytes/1024))} KB`}
function downloadBlob(blob,name){const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
async function exportDesigns(){
  const options=exportOptions();
  if(isCoverMode()){
    render();
    const blob=await canvasBlob();
    if(!blob){showToast('تعذر تجهيز الكفر');return}
    if(isPlayFeature() && blob.size>15*1024*1024){showToast('Feature Graphic أكبر من 15 MB — خفّض الجودة');return}
    const name=isPlayFeature()?`play-feature-graphic-1024x500.${options.extension}`:`apple-header-${canvas.width}x${canvas.height}.${options.extension}`;
    downloadBlob(blob,name);
    showToast(isPlayFeature()?`تم تجهيز Feature Graphic — ${fileSizeLabel(blob.size)}`:options.format==='png'?`تم تجهيز PNG مضغوط — ${fileSizeLabel(blob.size)}`:`تم تجهيز JPG للمعاينة — ${fileSizeLabel(blob.size)}`);
    return;
  }
  if(state.pages.length<=1){render();const blob=await canvasBlob();if(!blob){showToast('تعذر تجهيز الملف');return}downloadBlob(blob,`storeshots-${canvas.width}x${canvas.height}.${options.extension}`);showToast(`تم تجهيز ${options.extension.toUpperCase()} — ${fileSizeLabel(blob.size)}`);return}
  const original=state.currentPage,files=[];$('#exportButton').disabled=true;$('#exportButton').textContent='جاري التجهيز…';
  for(let i=0;i<state.pages.length;i++){state.currentPage=i;render();const blob=await canvasBlob();files.push({name:`storeshots-${String(i+1).padStart(2,'0')}.${options.extension}`,data:new Uint8Array(await blob.arrayBuffer())})}
  state.currentPage=original;selectPage(original);const zip=makeZip(files);downloadBlob(zip,'storeshots-all.zip');$('#exportButton').disabled=false;updateGallery();showToast(`تم تجهيز ${files.length} صور — ${fileSizeLabel(zip.size)}`);
}

function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2200)}
function syncOutputs(){
  $('#scaleValue').textContent=`${value('scale')}%`;$('#xValue').textContent=`${Math.round(value('x'))}%`;$('#yValue').textContent=`${Math.round(value('y'))}%`;$('#rotationValue').textContent=`${value('rotation')}°`;$('#gradientValue').textContent=`${value('gradientAngle')}°`;$('#blurValue').textContent=value('backgroundBlur');$('#headlineYValue').textContent=`${Math.round(value('headlineY'))}%`;
  $('#deviceScale').value=value('scale');$('#deviceX').value=value('x');$('#deviceY').value=value('y');$('#deviceRotation').value=value('rotation');$('#headlineY').value=value('headlineY');
  const coverValues=['coverPhoneScale','coverLogoScale','coverLogoX','coverLogoY','coverPhone1X','coverPhone1Y','coverPhone1Rotation','coverPhone2X','coverPhone2Y','coverPhone2Rotation'];
  coverValues.forEach(key=>{$(`#${key}`).value=value(key);$(`#${key}Value`).textContent=`${value(key)}${key.includes('Rotation')?'°':'%'}`});$('#coverShowHeadline').checked=value('coverShowHeadline');
}

$$('.panel-title').forEach(button=>button.addEventListener('click',()=>{const panel=button.closest('.panel');panel.classList.toggle('open');button.setAttribute('aria-expanded',panel.classList.contains('open'));button.querySelector('i').textContent=panel.classList.contains('open')?'−':'+'}));
$$('.frame-option').forEach(button=>button.addEventListener('click',()=>{$$('.frame-option').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-checked',b===button)});setValue('frame',button.dataset.frame);render()}));
$$('[data-background]').forEach(button=>button.addEventListener('click',()=>{$$('[data-background]').forEach(b=>b.classList.toggle('active',b===button));setValue('background',button.dataset.background);$('#solidControls').hidden=value('background')!=='solid';$('#gradientControls').hidden=value('background')!=='gradient';$('#imageControls').hidden=value('background')!=='image';render()}));

const bindings = [
  ['#frameColor','frameColor','input'],['#deviceScale','scale','number'],['#deviceX','x','number'],['#deviceY','y','number'],['#deviceRotation','rotation','number'],['#deviceShadow','shadow','checked'],
  ['#solidColor','solidColor','input'],['#gradientStart','gradientStart','input'],['#gradientEnd','gradientEnd','input'],['#gradientAngle','gradientAngle','number'],['#backgroundBlur','backgroundBlur','number'],['#decorationColor','decorationColor','input'],['#decorationOpacity','decorationOpacity','number'],
  ['#headlineColor','headlineColor','input'],['#headlineSize','headlineSize','number'],['#headlineY','headlineY','number'],['#headlineVisible','headlineVisible','checked']
];
bindings.forEach(([selector,key,type])=>{$(selector).addEventListener('input',e=>{setValue(key,type==='checked'?e.target.checked:type==='number'?Number(e.target.value):e.target.value);syncOutputs();render()})});
$('#headline').addEventListener('input',e=>{if(activePage())activePage().headline=e.target.value;else state.headline=e.target.value;render()});
$('#editCurrentOnly').addEventListener('change',()=>{syncControls();showToast($('#editCurrentOnly').checked?'التعديلات للحالية فقط':'التعديلات ستطبق على الكل')});
$('#screenshotInput').addEventListener('change',e=>addScreenshots(e.target.files));
$('#backgroundInput').addEventListener('change',e=>loadImageFile(e.target.files[0],'backgroundImage',false));
$('#coverLogoInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{state.coverLogo=image;state.coverLogoUrl=reader.result;$('#coverLogoStatus').textContent=file.name;render();showToast('تم تحميل اللوجو')};image.onerror=()=>showToast('تعذر قراءة اللوجو');image.src=reader.result};reader.readAsDataURL(file)});
$('#removeScreenshot').addEventListener('click',()=>{if(state.pages.length){state.pages.splice(state.currentPage,1);state.currentPage=Math.min(state.currentPage,state.pages.length-1);selectPage(state.currentPage)}else{state.screenshot=null;render()}$('#screenshotInput').value='';updateGallery()});
$('#canvasPreset').addEventListener('change',e=>{const [w,h]=e.target.value.split('x').map(Number);canvas.width=w;canvas.height=h;updateModeUI()});
$('#exportFormat').addEventListener('change',e=>{$('#exportQuality').disabled=false;updateQualityLabels();updateExportLabel();showToast(e.target.value==='png'?'اختيار الجودة سيقلل ألوان PNG وحجمه مع ثبات المقاس':'JPG يدعم ضغطًا أكبر للمعاينة')});
$('#exportButton').addEventListener('click',exportDesigns);
$$('[data-template]').forEach(button=>button.addEventListener('click',()=>applyTemplate(button.dataset.template)));
$$('[data-decoration]').forEach(button=>button.addEventListener('click',()=>{setValue('decorationStyle',button.dataset.decoration);setValue('decorations',button.dataset.decoration!=='none');syncControls();render()}));
$$('[data-cover-layout]').forEach(button=>button.addEventListener('click',()=>applyCoverLayout(button.dataset.coverLayout)));
['coverPhoneScale','coverLogoScale','coverLogoX','coverLogoY','coverPhone1X','coverPhone1Y','coverPhone1Rotation','coverPhone2X','coverPhone2Y','coverPhone2Rotation'].forEach(key=>{$(`#${key}`).addEventListener('input',event=>{state[key]=Number(event.target.value);if(key.startsWith('coverPhone')&&key!=='coverPhoneScale'){state.coverLayout='custom';$$('[data-cover-layout]').forEach(item=>item.classList.remove('active'))}syncOutputs();render()})});
$('#coverShowHeadline').addEventListener('input',event=>{state.coverShowHeadline=event.target.checked;render()});
$('#applyCurrentToAll').addEventListener('click',()=>{STYLE_KEYS.forEach(key=>state[key]=value(key));state.pages.forEach(page=>page.settings={});$('#editCurrentOnly').checked=false;syncControls();render();showToast('تم نسخ التصميم إلى جميع الصور')});
$('#saveProject').addEventListener('click',saveProjectFile);
$('#loadProject').addEventListener('change',e=>{if(e.target.files[0])loadProjectFile(e.target.files[0]);e.target.value=''});
$('#resetButton').addEventListener('click',()=>{state={...defaults};location.reload()});

let dragTarget=null;
function canvasPoint(event){const rect=canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)*canvas.width/rect.width,y:(event.clientY-rect.top)*canvas.height/rect.height}}
canvas.addEventListener('pointerdown',event=>{
  if(isCoverMode())return;
  const point=canvasPoint(event),headlineY=canvas.height*value('headlineY')/100,deviceX=canvas.width*value('x')/100,deviceY=canvas.height*value('y')/100,deviceH=canvas.height*value('scale')/100,deviceW=deviceH*.49;
  if(value('headlineVisible')&&Math.abs(point.y-headlineY)<canvas.height*.075)dragTarget='headline';
  else if(point.x>deviceX-deviceW*.6&&point.x<deviceX+deviceW*.6&&point.y>deviceY-deviceH*.55&&point.y<deviceY+deviceH*.55)dragTarget='device';
  if(dragTarget){canvas.setPointerCapture(event.pointerId);canvas.classList.add('dragging');event.preventDefault()}
});
canvas.addEventListener('pointermove',event=>{
  if(!dragTarget)return;const point=canvasPoint(event);
  if(dragTarget==='headline')setValue('headlineY',Math.max(5,Math.min(45,point.y/canvas.height*100)));
  else{setValue('x',Math.max(5,Math.min(95,point.x/canvas.width*100)));setValue('y',Math.max(15,Math.min(95,point.y/canvas.height*100)))}
  syncOutputs();render();
});
function stopDrag(){dragTarget=null;canvas.classList.remove('dragging')}
canvas.addEventListener('pointerup',stopDrag);canvas.addEventListener('pointercancel',stopDrag);
window.addEventListener('resize',updateZoomLabel);
syncControls();updateGallery();updateModeUI();render();
