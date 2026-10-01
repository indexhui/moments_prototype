// Build atlas metadata without repainting art. Frog cells preserve the shared source canvas/foot anchor.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.join(__dirname, '../public/images/muffin-knight/sprites');
(async () => {
  const layers = [];
  for (let i = 1; i <= 6; i++) {
    const input = await sharp(path.join(__dirname, `../public/assets/pet-sanctuary/characters/frog/movement/0${i}.png`)).extract({left:190,top:734,width:440,height:370}).png().toBuffer();
    layers.push({input,left:((i-1)%3)*440,top:Math.floor((i-1)/3)*370});
  }
  await sharp({create:{width:1320,height:740,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(path.join(root,'frog.png'));
  const atlas = {};
  for (const id of ['naotaro','chicken','raccoon','seal','snake','ostrich']) {
    const file = path.join(root, `${id}.png`); if (!fs.existsSync(file)) continue;
    const {data,info} = await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const frames=[];
    for(let frame=0;frame<8;frame++){
      const left=Math.floor(frame%4*info.width/4),right=Math.floor((frame%4+1)*info.width/4),top=Math.floor(Math.floor(frame/4)*info.height/2),bottom=Math.floor((Math.floor(frame/4)+1)*info.height/2);
      let x0=right,y0=bottom,x1=left,y1=top;
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>100){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      frames.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});
    }
    atlas[id]={width:info.width,height:info.height,frames,scale:Math.min(92/Math.max(...frames.map(f=>f.w)),79/Math.max(...frames.map(f=>f.h)))};
  }
  fs.writeFileSync(path.join(root,'atlas.json'),JSON.stringify(atlas,null,2)+'\n');
  console.log('Sprite atlases:',Object.keys(atlas).join(', '),'plus original frog (6 frames)');
})();
