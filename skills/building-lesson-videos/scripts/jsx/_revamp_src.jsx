var ids=[6610,5351]; R.s=[];
for (var i=0;i<ids.length;i++){var f=byId(ids[i]); R.s.push(f.name+" | "+(f.mainSource&&f.mainSource.constructor.name)+" | "+(f.file?f.file.fsName:"nofile")+" | "+f.width+"x"+f.height+" | missing="+f.footageMissing);}
