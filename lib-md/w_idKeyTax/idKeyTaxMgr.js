var idKeyMgr = scOnLoads[scOnLoads.length] = {
	links : null,
	titles : null,

	onLoad : function(){
		if(window.parent && "idKeyMgr" in window.parent){
			var count = 0, total = window.parent.idKeyMgr.state.length;
			window.parent.idKeyMgr.state.forEach(function(step) {
				var crit = scPaLib.findNode("des:div." + step.crit);
				var found = false;
				step.critVals.forEach(function (critVal) {
					var critVal = scPaLib.findNode("des:span." + critVal, crit);
					if (critVal) {
						critVal.classList.add("selected");
						found = true;
					}
				});
				if (found) count++;
			});
			if(total != 0){
				dom.newBd(scPaLib.findNode("des:h1",sc$("header"))).elt("span", "score")
					.att("title", count+(count>1?window.parent.idKeyMgr.strings.critsOn:window.parent.idKeyMgr.strings.critOn)+total).text(count+"/"+total).up()
			}
			if("scImageMgr" in window){
				scImageMgr.registerListener("onOverlayOpen", function(){
					window.parent.document.body.classList.add("subWindowOverlay")
				});scImageMgr.registerListener("onOverlayClose", function(){
					window.parent.document.body.classList.remove("subWindowOverlay")
				});

			}
		}
		//Gestion des blocks closed
		scPaLib.findNodes("des:.cbkClosed").forEach(function(block){
			scPaLib.findNode("des:a",block).onclick();
		});

		idKeyMgr.titles = scPaLib.findNodes("chi:div/chi:h2", sc$("main"));
		idKeyMgr.links = scPaLib.findNodes("des:nav/des:a",sc$("header"));
		scroll = function(event){
			for(var i  = 0 ; i < idKeyMgr.titles.length ; i++){
				var rect = idKeyMgr.titles[i].getBoundingClientRect();
				if(rect.top > 0 && rect.bottom <= window.innerHeight){
					for(var j = 0 ; j < idKeyMgr.links.length ; j++){
						if(j == i) idKeyMgr.links[j].classList.add("selected");
						else idKeyMgr.links[j].classList.remove("selected");
					}
					return;
				}
			}
		}
		sc$("main").addEventListener("scroll", scroll);
		scroll();
	}
}