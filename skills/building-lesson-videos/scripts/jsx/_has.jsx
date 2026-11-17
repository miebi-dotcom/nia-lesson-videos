var ids=[4638,4637,6204,6812,5631,5472,5271,5543,5422,6478,1699,7005,6068,5882];var out=[];
for(var k=0;k<ids.length;k++){var it=null;try{it=app.project.itemByID(ids[k]);}catch(e){}out.push(ids[k]+":"+(it?it.name:"MISSING"));}
R.done.push(out.join(" | "));
