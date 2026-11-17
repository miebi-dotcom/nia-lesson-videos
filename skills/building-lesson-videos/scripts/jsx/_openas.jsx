var f=new File(DATA.path);
if(!f.exists){R.errors.push("missing "+DATA.path);}else{
app.open(f);
var r={file:app.project.file.fsName,hits:[]};
for(var i=1;i<=app.project.numItems;i++){var it=app.project.item(i);if(it.id==4638){for(var j=1;j<=it.numLayers;j++){var n=it.layer(j).name;if(/PART B|OST Medical|OST Roles|S17 image/.test(n))r.hits.push(n);}}}
R.done.push(r.toSource());}
