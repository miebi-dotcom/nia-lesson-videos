function P(s){R.done.push(s);}
function txt(c,i){try{return c.layer(i).property("ADBE Text Properties").property("ADBE Text Document").value.text.replace(/[\r\n]+/g," / ");}catch(e){return "?";}}
var c=app.project.itemByID(5631);P("S01 "+txt(c,10)+" | "+txt(c,11)+" | "+txt(c,12));
c=app.project.itemByID(5472);var h=0;for(var i=1;i<=c.numLayers;i++){if(c.layer(i).name.indexOf("TXT")==0)P("5472 "+i+" "+c.layer(i).name+" "+c.layer(i).enabled);}
c=app.project.itemByID(5271);for(i=1;i<=c.numLayers;i++){if(c.layer(i).name.indexOf("TXT")==0)P("5271 "+c.layer(i).name+" "+c.layer(i).enabled);}
c=app.project.itemByID(5543);for(i=1;i<=c.numLayers;i++){if(c.layer(i).name.indexOf("TXT")==0)P("5543 "+c.layer(i).name+" "+c.layer(i).enabled);}
c=app.project.itemByID(6819);for(i=1;i<=c.numLayers;i++){var L=c.layer(i);if(L.name=="Textplaceholder"){var o=L.property("ADBE Transform Group").property("ADBE Opacity"),p=L.property("ADBE Transform Group").property("ADBE Position");P("6819 opkeys "+o.numKeys+" poskeys "+p.numKeys);}}
c=app.project.itemByID(6068);for(i=1;i<=c.numLayers;i++){L=c.layer(i);if(L.name.indexOf(".mp4")>0)P("6068 mp4 y "+L.property("ADBE Transform Group").property("ADBE Position").value[1]);}
c=app.project.itemByID(6478);P("6478 layers "+c.numLayers+" L1 "+c.layer(1).name+" blur? "+(function(){for(var i=1;i<=c.numLayers;i++)if(c.layer(i).name=="Poster text blur")return "yes";return "no";})());
c=app.project.itemByID(5422);var sc=c.layer(4).property("ADBE Transform Group").property("ADBE Scale");P("5422 L4 scale keys "+sc.numKeys+" v1 "+(sc.numKeys?sc.keyValue(1)[0]:"-"));
var m=app.project.itemByID(4638);for(i=1;i<=m.numLayers;i++){var n=m.layer(i).name;if(/S06 Health|OUT S06|S12 Service|OUT S12|OUT S16|S16 Three|IN S33|S36 Int|S35 Bar|S05 Blue/.test(n))P("main "+n+" "+m.layer(i).inPoint.toFixed(2)+"-"+m.layer(i).outPoint.toFixed(2));}
