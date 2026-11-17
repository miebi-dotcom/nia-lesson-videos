var r={file:app.project.file?app.project.file.fsName:"none",n:app.project.numItems,hits:[]};
var c=app.project.item(1);
for(var i=1;i<=app.project.numItems;i++){var it=app.project.item(i);if(it.id==4638){for(var j=1;j<=it.numLayers;j++){var n=it.layer(j).name;if(/PART B|OST |S17 image|S13|Kator/.test(n))r.hits.push(n);}}}
R.done.push(r.toSource());
