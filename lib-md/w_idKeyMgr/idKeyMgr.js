 var idKeyMgr = scOnLoads[scOnLoads.length] = {
	datasUrl : null,
	datas : {},			//data chargées depuis datas.json
	state : [],			//etat de sélection courant
	reverseCritsState:{},
	critLoadedCb : {},
	strings : {
		valid : "Confirmer",
		cancel : "Annuler",
		select : "Sélectionner",
		close : "Fermer",
		open : "Ouvrir",
		edit : "Éditer",
		remove : "Supprimer",
		return : "Retour",
		choose : "Choisir",
		reset : "Réinitialiser",
		criterions : "Critères",
		selection : "Sélection",
		share : "Partager la sélection",
		critsOn : " critères respectés sur ",
		critOn : " critère respecté sur ",
		returnToCrits : "Retour aux critères",
		error : "Une erreur est survenue. Veuillez recharger la page pour recommencer votre détermination de taxon",
		seeMore : "Voir plus de critères",
		seeMoreTitle : "Voir les critères qui ne concernent qu\'une partie des taxons restant",
		seeLessTitle : "Voir uniquement les critères principaux",
		seeLess : "Voir moins",
		details : "Détails",
		seeDetails : "Ouvrir les détails de cette valeur de critère",
		closeDetails : "Fermer les détails de cette valeur de critère",
		filter : "Filtrer",
		applyFilter : "Appliquer le filtre",
		next : "Suivant",
		previous :"Précédent",
		info : "En savoir plus ?",
		legal : "Mentions légales",
		selecteds : " taxons sélectionnés",
		selected : " taxon sélectionné",
		selectedOn : " taxon sélectionné sur ",
		selectedsOn : " taxons sélectionnés sur ",
		loading : "Chargement en cours...",
		installApp : "Installer l\'application",
		prepareOffline : "Télécharger pour usage offline",
		prepareUpdate : "Mettre à jour l\'application",
		updateOfflineReady : "<div><span>Une mise à jour est disponible.</span></div>",
		offlineWarning : "<div class='warning'><span>Attention, le poids de l\'application est estimé à %s. Le téléchargement peut entrainer des surcoûts en fonction de la nature de votre accès internet.</span></div><div><span>Souhaitez-vous poursuivre maintenant ?</span></div>",
		updateWarning : "<div class='warning'><span>Attention, le volume de données à télécharger est estimé à %s. Cela peut entrainer des surcoûts en fonction de la nature de votre accès internet.</span></div><div><span>Souhaitez-vous poursuivre maintenant ?</span></div>",
		offlineLoadingStarted : "Le téléchargement est en cours, vous pouvez continuer votre navigation.",
		offlineReady : "L\'application est prête à fonctionner offline.",
		updateReady : "Une mise à jour est disponible, la page doit être rechargée.",
		notEnoughSpace :"Le navigateur ne dispose pas d\'assez de place pour installer l\'application (%s disponible sur %s requis)",
		offlineFailed : "Une erreur a eu lieu dans le téléchargement. Vous ne pouvez pas utiliser l\'application offline.",
		featureNotAvailable : "Impossible de télécharger, votre navigateur refuse d\'allouer un espace de stockage. Vérifier les autorisations du navigateur.",
		downloading : "Téléchargement en cours",
		downloaded : "Application offline",
		noMoreCrits : "Aucun critère supplémentaire disponible",
		closeHisto : "Fermer l\'historique",
		openHisto : "Ouvrir l\'historique",
		definedCrits : " critères définis",
		definedCrit : " critère défini",
		copySuccess : "URL copiée dans le presse-papier",
		placeHolderKeys : "Rechercher un critère",
		placeHolderTxns : "Rechercher un taxon",
		selectNewCriterion : "Sélectionner un nouveau critère",
		selectTitle : "Valider la sélection de ce taxon",
	},

	// active/désactive le pushState dans l'histo
	inReloadUrlState : false,
	//active/désactive le bouton de sélection CID d'un taxon
	cid:false,

	/**
	 * Calcul et affichage de l'historique et du menu de sélection d'un prochain critère
	 */
	nextSelStep : function(){
		var bd = dom.newBd(sc$("keys")).clear();
		bd.elt("div", "keysHead")
			.elt("span", "keysTitle").text(idKeyMgr.strings.criterions).up();
			if(idKeyMgr.state.length) bd.elt("button").att("title", idKeyMgr.strings.share).listen("click", idKeyMgr.onShare).elt("span").text(idKeyMgr.strings.share).up().up();
		bd.up();

		bd.elt("div", "keys");
		idKeyMgr.xBuildHTMLHistoCritLst();
		idKeyMgr.xBuildHTMLTaxonsLst();


		//Reprise sur state incomplet, modifié ou supprimé.
		for(var i = 0 ; i < idKeyMgr.state.length ; i++){
			if(i==0) {
				if (idKeyMgr.datas.exclusiveCrits.length && idKeyMgr.datas.exclusiveCrits.indexOf(idKeyMgr.state[0].crit) == -1) {
					idKeyMgr.xBuildHTMLExclusiveCrits(idKeyMgr.datas.exclusiveCrits, "noReturn");
					return;
				}
			}
			else {
				var exclusiveCrits = [];
				idKeyMgr.state[i - 1].critVals.forEach(function(critValName){
					var critVal = idKeyMgr.getCritVal(idKeyMgr.state[i - 1].crit, critValName);
					if (critVal.exclusiveCrits && critVal.exclusiveCrits.indexOf(idKeyMgr.state[i].crit) == -1) {
						critVal.exclusiveCrits.forEach(function(exCrit){
							if(idKeyMgr.getHistoCrit(exCrit) == null) exclusiveCrits.push(exCrit);
						});
					}
				});
				if(exclusiveCrits.length){
					idKeyMgr.xBuildHTMLExclusiveCrits(exclusiveCrits, "noReturn");
					return;
				}
			}

		}

		//Next step
		var lastStep = idKeyMgr.state.length ? idKeyMgr.state[idKeyMgr.state.length-1] : null;
		var exclusiveCrits = [];
		if(lastStep != null) lastStep.critVals.forEach(function(critValNam){
			var critVal = idKeyMgr.getCritVal(lastStep.crit, critValNam);
			if(critVal != null && critVal.exclusiveCrits) critVal.exclusiveCrits.forEach(function(exCrit){
				if(idKeyMgr.getHistoCrit(exCrit) == null) exclusiveCrits.push(exCrit);
			});
		});

		//exclusive crit
		if(!idKeyMgr.state.length && idKeyMgr.datas.exclusiveCrits.length) idKeyMgr.xBuildHTMLExclusiveCrits(idKeyMgr.datas.exclusiveCrits, "noReturn");
		else if(exclusiveCrits.length) idKeyMgr.xBuildHTMLExclusiveCrits(exclusiveCrits);
		else{
			//seconday crit
			idKeyMgr.xBuildHTMLNextCritLst();
		}
		idKeyUi.xHistoHtmlChange();
	},

	getCritName : function(param){
		if(typeof param == "string") return param;
		else return (scPaLib.findNode("can:ul.critVals",param)||scPaLib.findNode("can:div.step",param)).getAttribute("data-crit");
	},
	getCrit : function(param){
		return this.datas.crits[this.getCritName(param)];
	},
	getCritValName : function(param){
		if(typeof param == "string") return param;
		else return (scPaLib.findNode("can:li.critVal",param)||scPaLib.findNode("can:div.step",param)).getAttribute("data-critVal");
	},
	getCritVal : function(param, critValName){
		var crit = this.getCrit(param);
		if(! crit) return null;
		else if(critValName) return crit.critvals[critValName];
		else return crit.critvals[this.getCritValName(param)];
	},
	loadCritDatas : function(critName, cb){
		try{
			if(cb) idKeyMgr.addCritDatasLoadedCb(critName,cb);
			var crit = idKeyMgr.getCrit(critName);
			if(crit.loaded == true) {
				idKeyMgr.onCritDatasLoaded(critName);
				return false;
			}
			else{
				idKeyMgr.fetchJson(crit.descUrl, function(datas){
					crit.shortDesc = datas.shortDesc;
					for(var key in datas.critvals) for(var critValKey in datas.critvals[key]) crit.critvals[key][critValKey] = datas.critvals[key][critValKey];
					crit.loaded = true;
					idKeyMgr.onCritDatasLoaded(critName);
					for(var critVal in crit.critvals) if(crit.critvals[critVal].exclusiveCrits) crit.critvals[critVal].exclusiveCrits.forEach(function (critName) {idKeyMgr.loadCritDatas(critName);});
				});
				return true;
			}
		}
		catch (e) {
			idKeyUi.alert(idKeyMgr.strings.error);
			console.error(e);
		}
	},
	getHistoCrit : function(critName){
		for(var i = 0 ; i< idKeyMgr.state.length ; i++) if(idKeyMgr.state[i].crit == critName) return idKeyMgr.state[i];
		return null;
	},
	getHistoCritIndex : function(critName){
		for(var i = 0 ; i< idKeyMgr.state.length ; i++) if(idKeyMgr.state[i].crit == critName) return i;
		return -1;
	},

	onCritDatasLoaded : function(critName){
		if(idKeyMgr.critLoadedCb[critName]) idKeyMgr.critLoadedCb[critName].forEach(function(cb){cb.call(idKeyMgr,critName)});
		delete idKeyMgr.critLoadedCb[critName];
	},
	addCritDatasLoadedCb : function(critName,cb){
		if(!idKeyMgr.critLoadedCb[critName]) idKeyMgr.critLoadedCb[critName] = [];
		idKeyMgr.critLoadedCb[critName].push(cb);
	},

	/**
	 * Ouvre une valeur de critère suite à clic sur lien.
	 */
	onOpenCritVal : function(event){
		var openBtn = scPaLib.findNode("can:button", event.target)
		var critVal = idKeyMgr.getCritVal(openBtn);
		var li = scPaLib.findNode("can:li", openBtn);

		if(openBtn.classList.contains("seeDetails")){
			var taxons = scPaLib.findNode("can:div.crit", li).taxonsToMatch, score = 0;
			critVal.reverseTaxons.forEach(function(taxon){if(taxons.indexOf(taxon) != -1) score++;});

			openBtn.classList.remove("seeDetails");
			openBtn.classList.add("closeDetails");
			openBtn.setAttribute("title", idKeyMgr.strings.closeDetails);
			//li.classList.add("selected");
			if(idKeyMgr.getCrit(openBtn).multiselect === "true"){
				scPaLib.findNode("des:button.select",sc$("keys")).disabled = false;
			}
			if(taxons.length){
				li.insertAdjacentHTML("beforeend", "<span class='critValScore'>"+score + (score > 1 ? idKeyMgr.strings.selectedsOn : idKeyMgr.strings.selectedOn)+taxons.length+"</span>");
			}
			var bd = dom.newBd(li);
			bd.elt("div", "desc").current().insertAdjacentHTML("beforeend", critVal.desc);
			idKeyMgr.resetMediaMgrs();
		}
		else{
			openBtn.classList.remove("closeDetails");
			openBtn.classList.add("seeDetails");
			openBtn.setAttribute("title", idKeyMgr.strings.seeDetails);
			//li.classList.remove("selected");
			if(idKeyMgr.getCrit(openBtn).multiselect === "true"){
				if(scPaLib.findNode("des:li.selected", sc$("keys"))) scPaLib.findNode("des:button.select",sc$("keys")).disabled = false;
				else scPaLib.findNode("des:button.select",sc$("keys")).disabled = true;
			}
			var desc = scPaLib.findNode("des:div.desc",li);
			if(desc) desc.parentElement.removeChild(desc);
			var score = scPaLib.findNode("des:span.critValScore",li);
			if(score) score.parentElement.removeChild(score);
			idKeyMgr.resetMediaMgrs();
		}
	},

	onCritSelected : function(event){
		idKeyUi.xClose();
		var list = scPaLib.findNode("des:div.critlist", sc$("keys"));
		var listParent = list.parentElement;
		listParent.removeChild(list);
		listParent.appendChild(idKeyMgr.xBuildHTMLCrit(idKeyMgr.getCritName(event.target)));
		idKeyMgr.xBrowserHisto("pushState");
	},

	onCritValSelected : function(event){
		var li = scPaLib.findNode("can:li.critVal", event.target);
		var critName = idKeyMgr.getCritName(li);
		var critValName =idKeyMgr.getCritValName(li);
		var crit = idKeyMgr.getCrit(critName);
		if(crit.multiselect === "true"){
			li.classList.toggle("selected");
			if(scPaLib.findNode("des:li.selected", sc$("keys"))) scPaLib.findNode("des:button.select",sc$("keys")).disabled = false;
			else scPaLib.findNode("des:button.select",sc$("keys")).disabled = true;
			return;
		}
		idKeyMgr.xValidCritValSelection(critName, [critValName]);
	},
	onClickCritValMulti : function(event){
		if(scPaLib.findNode("can:button", event.target)) return;
		scPaLib.findNode("can:li", event.target).classList.toggle("selected");
		var btn = scPaLib.findNode("des:button.select", sc$("keys"));
		btn.disabled = scPaLib.findNodes("des:li.selected", sc$("keys")).length ? false : true;
	},
	onCritValMultiSelected : function(event){
		var val = [];
		var critName = null;;
		scPaLib.findNodes("des:li.selected", sc$("keys")).forEach(function (li){
			if(!critName) critName = idKeyMgr.getCritName(li);
			val.push(idKeyMgr.getCritValName(li));
		});
		idKeyMgr.xValidCritValSelection(critName, val);
	},
	onEditHistory : function(event){
		idKeyUi.xClose();

		var critName = idKeyMgr.getCritName(event.target);
		var critVals = [];
		for(var i = 0 ; i < idKeyMgr.state.length ; i++){
			if(critName == idKeyMgr.state[i].crit){
				critVals = idKeyMgr.state[i].critVals;
			}
		}
		for(var key in idKeyMgr.state)

		var bd = dom.newBd(sc$("keys"));
		bd.clear();
		bd.current().append(idKeyMgr.xBuildHTMLCrit(idKeyMgr.getCritName(event.target), null, critVals));
		idKeyMgr.xBrowserHisto("pushState");
	},

	onRemoveHistory : function(event){
		var critName = idKeyMgr.getCritName(event.target);
		var removedIndex;
		for(var i = 0 ; i < idKeyMgr.state.length ; i++){
			if(idKeyMgr.state[i].crit == critName){
				removedIndex = i;
				idKeyMgr.state.splice(i,1);
				idKeyMgr.xCleanHisto(removedIndex);
				idKeyMgr.xBrowserHisto("pushState");
				idKeyMgr.nextSelStep();
				return;
			}
		}
	},
	onSeeMore : function(event){
		var button = scPaLib.findNode("can:button", event.target);
		var bd = dom.newBd(button.parentElement);
		scPaLib.findNode("des:div.secondaryCrits", sc$("keys")).removeAttribute("hidden")
		button.parentElement.removeChild(button);
		bd.elt("button", "seeLess").att("title", idKeyMgr.strings.seeLessTitle).listen("click",idKeyMgr.onSeeLess).elt("span").text(idKeyMgr.strings.seeLess).up().up();
	},
	onSeeLess : function(event){
		var button = scPaLib.findNode("can:button", event.target);
		var bd = dom.newBd(button.parentElement);
		scPaLib.findNode("des:div.secondaryCrits", sc$("keys")).setAttribute("hidden", "true");
		button.parentElement.removeChild(button);
		bd.elt("button", "seeMore").att("title", idKeyMgr.strings.seeMoreTitle).listen("click",idKeyMgr.onSeeMore).elt("span").text(idKeyMgr.strings.seeMore).up().up();
	},
	onFilter : function(event){
		var input = scPaLib.findNode("anc:label/des:input", event.target);
		if(input.getAttribute("data-filter") == "keys"){
			scPaLib.findNodes("des:.critBlck",sc$("keys")).forEach(function(node){
				if(!input.value) node.removeAttribute("hidden")
				else if(scPaLib.findNode("des:span.crit",node).textContent.toLowerCase().indexOf(input.value.toLowerCase()) != -1) node.removeAttribute("hidden");
				else node.setAttribute("hidden","true");
			});
		}
		else{
			scPaLib.findNodes("des:li",sc$("taxlist")).forEach(function(node){
				if(!input.value) node.removeAttribute("hidden")
				else if(scPaLib.findNode("chi:a/chi:span",node).textContent.toLowerCase().indexOf(input.value.toLowerCase()) != -1) node.removeAttribute("hidden");
				else node.setAttribute("hidden","true");
			});
		}
	},

	onOpenTaxo : function(event){
		var input = scPaLib.findNode("can:button",event.target);
		input.setAttribute("onclick","idKeyMgr.onCloseTaxo(event);");
		input.setAttribute("title", idKeyMgr.strings.close);
		input.classList.remove("openTaxo");
		input.classList.add("closeTaxo");
		dom.newBd(input).clear().elt("span").text(idKeyMgr.strings.close);
		scPaLib.findNode("nsi:ul", input).removeAttribute("hidden");
	},
	onCloseTaxo : function(event){
		var input = scPaLib.findNode("can:button",event.target);
		input.setAttribute("onclick","idKeyMgr.onOpenTaxo(event);");
		input.setAttribute("title", idKeyMgr.strings.open);
		input.classList.remove("closeTaxo");
		input.classList.add("openTaxo");
		dom.newBd(input).clear().elt("span").text(idKeyMgr.strings.open);
		scPaLib.findNode("nsi:ul", input).setAttribute("hidden", "true");
	},
	onPhotoAdded : function(event){
		var input = scPaLib.findNode("can:input", event.target);
		if(input.files.length){
				idKeyMgr.onRemovePhoto();
				var reader = new FileReader();
				reader.onload = function (e) {
					sc$("taxlist").insertAdjacentElement("beforebegin", dom.newBd(document.createDocumentFragment()).elt("div").att("id", "ownPhoto")
						.elt("img").att("src", e.target.result).up()
					.elt("div", "tools")
						.elt("button", "remove").att("title", idKeyMgr.strings.remove).listen("click",idKeyMgr.onRemovePhoto).elt("span").text(idKeyMgr.strings.remove).up().up()
					.up().current());
				};
				reader.readAsDataURL(input.files[0]);
		}
		document.body.classList.add("hasPhoto");
	},
	onRemovePhoto : function(event){
		var div = sc$("ownPhoto");
		if(div) div.parentElement.removeChild(div);
		//on ne reset que sur clic du bouton delete, pas sur clean depuis onPhotoAdded
		if(event) scPaLib.findNode("des:input.addPhoto", sc$("navMenu")).value = null;
		document.body.classList.remove("hasPhoto");
	},
	onOpenCloseHisto : function(event){
		var btn = scPaLib.findNode("can:button", event.target);
		var histo = scPaLib.findNode("anc:div.history", btn);
		var isClosed = histo.classList.contains("closed");
		sessionStorage.setItem("histoClosed", isClosed ? "false" : "true");
		btn.setAttribute("title", isClosed ? idKeyMgr.strings.closeHisto : idKeyMgr.strings.openHisto);

		histo.classList.toggle("opened");
		histo.classList.toggle("closed");
		idKeyUi.xHistoHtmlChange()
	},
	onResetHisto : function(event){
		idKeyMgr.state = [];
		idKeyMgr.xBrowserHisto("pushState");
		idKeyMgr.nextSelStep();
	},
	onShare : function(event){
		var bd = dom.newBd(sc$("keys"));
		var input = bd.elt("input").att("id", "urlcopy").prop("value", location.toString()).current();
		input.select();
		input.setSelectionRange(0, 99999); /*mobile*/
		document.execCommand("copy");
		input.parentElement.removeChild(input);
		var btn = scPaLib.findNode("can:button", event.target);
		if(!scPaLib.findNode("nsi:span.copySuccess", btn)){
			bd.setCurrent(btn.parentElement);
			bd.elt("span", "copySuccess").text(idKeyMgr.strings.copySuccess);
		}
	},
	onLoadSubPage : function(page){
		idKeyUi.alert(idKeyMgr.datas[page],null, idKeyMgr.strings[page],true);
	},
	setDatasUrl : function(datasUrl){
		idKeyMgr.datasUrl = datasUrl;
	},
	loadDatas : function(json, errorCtx){
		if(json == null) {
			idKeyUi.alert(idKeyMgr.strings.error);
			console.error(errorCtx);
			return;
		}
		idKeyMgr.datas = json;
		idKeyMgr.datas.exclusiveCrits.forEach(function (critName) {idKeyMgr.loadCritDatas(critName);});
		idKeyMgr.datas.taxonsLst = Object.keys(idKeyMgr.datas.taxons);
		var elision = function(title){
			var str = title.toLowerCase();
			if(str[0] =='l'){
				if(str.startsWith("les ")) return title.substring(4);
				if(str.startsWith("le ")) return title.substring(3);
				if(str.startsWith("la ")) return title.substring(3);
				if(str[1] == '\'') return title.substring(2);
			}
			return title;
		}
		idKeyMgr.datas.taxonsLst.forEach(function(id){
			idKeyMgr.datas.taxons[id].elisedCN = elision(idKeyMgr.datas.taxons[id].commonName);
		});

		var bd = dom.newBd(sc$("footer"));
		if(idKeyMgr.datas.info)
			bd.elt("div", "info")
				.elt("a", "info").att("title", idKeyMgr.strings.info).att("href","#")
					.att("onclick","idKeyMgr.onLoadSubPage('info');return false;").elt("span").text(idKeyMgr.strings.info).up()
				.up()
			.up();
		if(idKeyMgr.datas.legal)
			bd.elt("div", "legal")
				.elt("a", "legal").att("title", idKeyMgr.strings.legal).att("href","#")
					.att("onclick","idKeyMgr.onLoadSubPage('legal');return false;").elt("span").text(idKeyMgr.strings.legal).up()
				.up()
			.up();

		idKeyMgr.xReloadUrlState();
	},
	resetMediaMgrs : function(){
		scPaLib.findNodes("bod:/chi:div.scImgGalCvs").forEach(function(glr){
			glr.parentElement.removeChild(glr);
		});
		scImageMgr.onLoad();
		if("tePlayerMgr" in window) tePlayerMgr.init();
		//Gestion des blocks closed
		scPaLib.findNodes("des:.cbkClosed").forEach(function(block){
			scPaLib.findNode("des:a",block).onclick();
		});
	},
	onLoad : function(){
		idKeyMgr.fetchJson(idKeyMgr.datasUrl, function (json) {
			try{
				idKeyMgr.loadDatas(json)
			}
			catch (e) {
				idKeyUi.alert(idKeyMgr.strings.error);
				console.error(e);
			}
		},function(error){
			idKeyUi.alert(idKeyMgr.strings.error);
		});
		var qs = io.parseQueryString(location.search);
		idKeyMgr.cid = qs.context == "select";
		scPaLib.findNodes("des:button.outBtn").forEach(function(btn){
			btn.addEventListener("click", idKeyUi.changeTab);
		});
		scPaLib.findNode("des:button.openNavMenu").addEventListener("click", function(event){
			sc$('navMenu').classList.toggle('showMenu');
			event.stopPropagation();
		});
		window.addEventListener("popstate",idKeyMgr.xReloadUrlState);
		scPaLib.findNode("des:input.addPhoto").addEventListener("change", idKeyMgr.onPhotoAdded);
		scPaLib.findNodes("des:button.back2Criterions").forEach(function (backBtn){
			backBtn.addEventListener("click", function (event){
				var outBtn =scPaLib.findNode("des:button.outBtn", sc$("navMenu"));
				outBtn.click({"target":outBtn});
			});
		});
	},

	xBuildHTMLHistoCritLst : function(){
		idKeyMgr.reverseCritsState = {};
		if(idKeyMgr.state.length){
			var isClosed = sessionStorage.getItem("histoClosed") === "true";
			var bd = dom.newBd(scPaLib.findNode("des:div.keys",sc$("keys")));
			bd.elt("div","history "+ (isClosed ? "closed" : "opened"))
				.elt("button", "critHitoSize").att("title", isClosed ? idKeyMgr.strings.openHisto : idKeyMgr.strings.closeHisto).listen("click", idKeyMgr.onOpenCloseHisto)
					.elt("span").text(idKeyMgr.state.length).text(idKeyMgr.state.length > 1 ? idKeyMgr.strings.definedCrits : idKeyMgr.strings.definedCrit).up()
				.up()
				.elt("button", "reset").att("title", idKeyMgr.strings.reset).listen("click", idKeyMgr.onResetHisto)
					.elt("span").text(idKeyMgr.strings.reset).up()
				.up()
				.elt("div", "histo_content")
					idKeyMgr.state.forEach(function (step) {
						idKeyMgr.reverseCritsState[step.crit] = step.critVals;
						bd.current().appendChild(idKeyMgr.xBuildHTMLStep(step.crit,"history" ,step.critVals));
					});
				bd.up()
			.up();
		}
	},

	/**
	 * Ne sont publis que les critères :
	 *  - qui match tout les taxons restants (sauf si aucun dans ce cas qui match au moins un taxon)
	 *  - dont les values ne match pas chacune tous les taxons restants
	 *  - par ordre de plus petit maximum sélectionné par valeur
	 */
	xBuildHTMLNextCritLst : function(){
		// 1 critère qui match toutes la liste restante
			//-> par pouvoir dichotomique
		// 2 critère qui match un sous ensemble ->
			// par pouvoir dichotomique
		// 3 critères (masqués) qui ne match aucun élément de la liste
			// masqué -> par ordre alpha

		//indice dichotomique ->
			// inverse du Nbr de taxon max sélectionné
			//Plus max est faible, plus dicho score est élevé
		var dichotomyScore = function(values) {
			var max = 0;
			values.forEach(function(val){max = val > max ? val : max;});
			if(max == 0) return 0;
			return 1/max;
		}

		//Recup de la liste des critères restants.
		var crits = {};
		idKeyMgr.datas.secondaryCrits.forEach(function(crit){
			if(!idKeyMgr.getHistoCrit(crit)) crits[crit] = true;
		});
		idKeyMgr.state.forEach(function(step){
			step.critVals.forEach(function(critValName){
				var critVal = idKeyMgr.getCritVal(step.crit, critValName);
				if(critVal.secondaryCrits) critVal.secondaryCrits.forEach(function(crit){
					if(!idKeyMgr.getHistoCrit(crit)) crits[crit] = true;
				});
			});
		})

		//Taxons de référence
		var curTaxMap = {};
		//On cherche les taxons qui matchent tous les critères.
		scPaLib.findNodes("des:li.taxon.selected", sc$("taxons")).forEach(function(node){curTaxMap[node.getAttribute("data-taxon")] = true;});
		//sinon, on cherche les taxons qui matchent une partie des critères.
		if(Object.keys(curTaxMap).length == 0) scPaLib.findNodes("des:li.taxon.partialSelected", sc$("taxons")).forEach(function(node){curTaxMap[node.getAttribute("data-taxon")] = true;});
		//Sinon, on charge tous les taxons.
		if(Object.keys(curTaxMap).length == 0) curTaxLst = idKeyMgr.datas.taxonsLst.forEach(function(taxon){curTaxMap[taxon] = true;});

		var matchAllTxnCrts = [], matchPartialTxnCrits = [];
		for (var critName in crits){
			if(idKeyMgr.reverseCritsState[critName]) continue;
			var selectableTxns = {};
			var txnsLengthByCritVal = {}
			for(var critValName in idKeyMgr.getCrit(critName).critvals){
				var reverseTaxons = idKeyMgr.getCritVal(critName, critValName).reverseTaxons;
				txnsLengthByCritVal[critValName] = 0;
				reverseTaxons.forEach(function(taxonsName){
					if(curTaxMap[taxonsName]){
						selectableTxns[taxonsName] = true;
						txnsLengthByCritVal[critValName]++;
					}
				});
			}
			var values = Object.values(txnsLengthByCritVal);
			var total = Object.keys(curTaxMap).length;
			var min = total;
			values.forEach(function(val){min = val < min ? val : min});
			var entry = {
				"crit":critName,
				"dichoScore":dichotomyScore(values),
				"minSel" : min,
				"selScore" : Object.keys(selectableTxns).length
			};

			if(entry.minSel == total) continue;
			else if(entry.selScore == total) matchAllTxnCrts.push(entry);
			else if(entry.selScore > 0 ) matchPartialTxnCrits.push(entry);
		}
		if(matchAllTxnCrts.length == 1) matchPartialTxnCrits.push(matchAllTxnCrts.pop());
		if(matchPartialTxnCrits.length == 1){
			var critName = matchPartialTxnCrits.pop().crit;
			idKeyMgr.loadCritDatas(critName, function(){
				var bd = dom.newBd(scPaLib.findNode("chi:div.keys",sc$("keys")));
				bd.current().append(idKeyMgr.xBuildHTMLCrit(critName, "popOnReturn"));
			});
			return;
		}
		//On tri d'abord par nombre de taxons sélectionné
		//Ensuite par dicho maximale
		var sort = function(a,b){
			if(a.selScore != b.selScore) return a.selScore > b.selScore ? -1 : 1;
			return a.dichoScore > b.dichoScore ? -1 : 1;
		}
		var bd = dom.newBd(scPaLib.findNode("chi:div.keys",sc$("keys")));
		var critsToBuild = matchAllTxnCrts.length ? matchAllTxnCrts : matchPartialTxnCrits;
		if(critsToBuild.length == 0){
			bd.elt("div", "warning noMoreCrit")
				.elt("span").text(idKeyMgr.strings.noMoreCrits).up();
				idKeyMgr.xBuildHTMLCrit2TaxNavBtn(bd);
			bd.up();
			return;
		}
		critsToBuild.sort(sort);

		idKeyMgr.xBuildHTMLCritsList(critsToBuild, "mainCrits");
	},

	xBuildHTMLTaxonsLst : function(){
		idKeyMgr.datas.taxonsLst.forEach(function(taxon){idKeyMgr.datas.taxons[taxon].score = 0;});
		var histoCrits = scPaLib.findNodes("chi:div.keys/chi:div.history/des:div.history", sc$("keys"));
		histoCrits.forEach(function (histo) {
			var matchedTaxons = {};
			var critName = idKeyMgr.getCritName(histo);
			histo.getAttribute("data-critVal").split(" ").forEach(function (critValName){
				idKeyMgr.getCritVal(critName, critValName).reverseTaxons.forEach(function (taxon) {matchedTaxons[taxon] = true});
			})
			for (var key in matchedTaxons) idKeyMgr.datas.taxons[key].score++;
		});

		idKeyMgr.datas.taxonsLst = Object.keys(idKeyMgr.datas.taxons).sort(function(a,b){
			if(idKeyMgr.datas.taxons[a].score != idKeyMgr.datas.taxons[b].score) return idKeyMgr.datas.taxons[a].score > idKeyMgr.datas.taxons[b].score ? -1:1;
			return idKeyMgr.datas.taxons[a].elisedCN < idKeyMgr.datas.taxons[b].elisedCN ? -1 : 1;
		});
		var bd = dom.newBd(sc$("taxlist"));
		bd.clear();
		bd.outTree();

		var taxoCount;

		bd.elt("div", "taxlistHead")
			.elt("span", "headTitle").text(idKeyMgr.strings.selection).up()
			.elt("span", "taxoCount"); taxoCount = bd.current(); bd.up();

			bd.elt("div", "filter")
				.elt("label")
					.elt("span").text(idKeyMgr.strings.filter).up()
					.elt("input").att("type", "text").att("placeholder", idKeyMgr.strings.placeHolderTxns).att("data-filter","taxons").listen("keyup", idKeyMgr.onFilter).up()
					.elt("button").att("title", idKeyMgr.strings.applyFilter).listen("click", idKeyMgr.onFilter).elt("span").text(idKeyMgr.strings.applyFilter).up().up()
				.up()
			.up()
		.up();
		bd.elt("ul", histoCrits.length ? "sel":"");
		var count = histoCrits.length ? 0 : idKeyMgr.datas.taxonsLst.length;
		idKeyMgr.datas.taxonsLst.forEach(function(id){
			var taxon = idKeyMgr.datas.taxons[id];
			var matchClass;
			if(histoCrits.length){
				if(taxon.score == 0) matchClass = "unselected";
				else if(histoCrits.length == taxon.score) {
					matchClass = "selected";
					count++;
				}
				else matchClass = "partialSelected";
			}
			else matchClass = "noHistoCrits";
			bd.elt("li", "taxon " + id + " "+ matchClass).att("data-taxon",id).elt("a").att("href", "#").att("onclick", "idKeyUi.iframe('"+taxon.url+"',scPaLib.findNode('can:li',event.target)); return false;").elt("span").elt("span", "commonName").text(taxon.commonName).up();
			if(taxon.scientificName) bd.text(" (").elt("span", "scientificName").text(taxon.scientificName).up().text(")")
			if(histoCrits.length) bd.text(" ").elt("span", "score").att("title", taxon.score+(taxon.score > 1 ? idKeyMgr.strings.critsOn : idKeyMgr.strings.critOn) +histoCrits.length).text(taxon.score+"/"+histoCrits.length).up()
			bd.up().up().up();
		});
		bd.inTree()
		taxoCount.title = count + (count > 1 ? idKeyMgr.strings.selecteds : idKeyMgr.strings.selected);
		taxoCount.textContent = "("+count+")";
		var rootTaxoCount = sc$("taxoCount");
		rootTaxoCount.setAttribute("data-count", count)
		rootTaxoCount.textContent = "("+count+")";
		/*
		if(histoCrits.length){
			taxoCount.title = count + (count > 1 ? idKeyMgr.strings.selecteds : idKeyMgr.strings.selected);
			taxoCount.textContent = "("+count+")";
			var rootTaxoCount = sc$("taxoCount");
			rootTaxoCount.setAttribute("data-count", count)
			rootTaxoCount.textContent = "("+count+")";
		}
		else {
			sc$("taxoCount").textContent= "("+idKeyMgr.datas.taxonsLst.length+")";
			taxoCount.textContent = "("+count+")";

			var rootTaxoCount = sc$("taxoCount");
			rootTaxoCount.setAttribute("data-count", count)
			rootTaxoCount.textContent = "("+count+")";
		}*/
		idKeyMgr.xBuildHTMLTax2CritNavBtn(bd);
	},

	/**
	 * Constuit le contenu d'un critère dans un domBuilder
	 */
	xBuildHTMLCrit : function(critName, returnOpt, histoCritVals){
		var crit = idKeyMgr.getCrit(critName);
		if(!crit) console.error("Unable to build html criterion");

		var bd = dom.newBd(document.createDocumentFragment());
		if(!crit.loaded) {
			bd.elt("div", "loading").elt("span", "loading").text(idKeyMgr.strings.loading).up().up();
			idKeyMgr.addCritDatasLoadedCb(critName, function(){
				var node = idKeyMgr.xBuildHTMLCrit(critName,returnOpt, histoCritVals);
				var loading = scPaLib.findNode("des:div.loading");
				loading.insertAdjacentElement("afterend",node);
				loading.parentElement.removeChild(loading);
			});
			return bd.current();
		}

		var taxons;
		//Si premier critère (en ajout ou modifcation)
		if(!idKeyMgr.state.length || idKeyMgr.state.length==1 && idKeyMgr.state[0].crit == critName) taxons = idKeyMgr.datas.taxonsLst;
		else{
			var taxonsScore = {},maxScore=0;
			idKeyMgr.state.forEach(function(step){
				if(step.crit != critName) {
					var matchedTaxons = {};
					step.critVals.forEach(function(critValName){
						idKeyMgr.getCritVal(step.crit, critValName).reverseTaxons.forEach(function (taxon) {
							matchedTaxons[taxon] = true;
						});
					});
					for(var key in matchedTaxons) taxonsScore[key] = taxonsScore[key]?taxonsScore[key]+1:1;
					maxScore++;
				}
			});
			taxons = [];
			for(var taxon in taxonsScore) if(taxonsScore[taxon] == maxScore) taxons.push(taxon);
		}

		var cancel = (event) => {
			if(returnOpt == "popOnReturn") {
				idKeyMgr.state.pop();
				idKeyMgr.nextSelStep(event);
			}
			else idKeyMgr.nextSelStep(event);
			idKeyMgr.xBrowserHisto("pushState");
		}

		bd.elt("div", "crit edit "+(histoCritVals?"histo":"")).prop("taxonsToMatch", taxons);
			bd.elt("div", "critHead");
				if(returnOpt != "noReturn") bd.elt("button", "return").att("title", idKeyMgr.strings.return).listen("click", cancel).elt("span").text(idKeyMgr.strings.return).up().up();
				bd.elt("div", "illus");
					if (crit.illus)  bd.current().insertAdjacentHTML("afterbegin", crit.illus);
				bd.up()
				.elt("div", "content")
					.elt("span").text(crit.title).up()
				.up()
			.up();
			bd.elt("div", "critContent");
				if(crit.shortDesc) bd.current().insertAdjacentHTML("afterbegin",crit.shortDesc);
				bd.elt("ul","critVals").att("data-crit", critName);
				Object.keys(crit.critvals).forEach(function(critValName){
					var critVal = crit.critvals[critValName];
					var histoSelected = histoCritVals && histoCritVals.indexOf(critValName)!= -1;
					bd.elt("li","critVal "+( histoSelected ? "histoSelected selected" : "")).att("data-critVal", critValName).elt("div", "critBlk");
					if(crit.multiselect === "true") bd.elt("a", "multival").att("title", idKeyMgr.strings.select).att("href", "#").att("onclick", "idKeyMgr.onClickCritValMulti(event); return false;")
						bd.elt("div", "illus")
							if(critVal.illus) bd.current().insertAdjacentHTML("afterbegin", critVal.illus);
						bd.up();
						bd.elt("div", "content")
							.elt("span","value").text(critVal.value).up();
							if(critVal.shortDesc) bd.elt("span", "shortDesc").currentUp().insertAdjacentHTML("beforeend",critVal.shortDesc);
						bd.up();
					bd.elt("div", "tools");
					if(critVal.desc) bd.elt("button", "seeDetails").att("title", idKeyMgr.strings.seeDetails).listen("click", idKeyMgr.onOpenCritVal).elt("span").text(idKeyMgr.strings.details).up().up()
					if(crit.multiselect !== "true" && !histoSelected) bd.elt("button", "select").att("title", idKeyMgr.strings.choose).listen("click",idKeyMgr.onCritValSelected).elt("span").text(idKeyMgr.strings.choose).up().up();
					bd.up();
					if(crit.multiselect === "true") bd.up();
					bd.up().up();
				});
		bd.up().up();
		idKeyMgr.resetMediaMgrs();
		if(crit.multiselect === "true"){
			bd.elt("div","tools");
				bd.elt("button", "select").att("title", idKeyMgr.strings.valid).prop("disabled",histoCritVals && histoCritVals.length ? false : true).listen("click",idKeyMgr.onCritValMultiSelected).elt("span").text(idKeyMgr.strings.valid).up().up();
			bd.up();
		}
		return bd.current();
	},
	/**
	 * Construit un critère ou une étape d'historique
	 * ctx = "history", "exclusive", "regular"
	 */
	xBuildHTMLStep : function(critName, ctx, critVals){
		if(!idKeyMgr.getCrit(critName).loaded) idKeyMgr.loadCritDatas(critName);
		var crit = idKeyMgr.getCrit(critName);
		var firstCritVal = null;
		if(critVals && critVals.length === 1) firstCritVal = idKeyMgr.getCritVal(critName, critVals[0]);
		var bd = dom.newBd(document.createDocumentFragment());

		if(ctx != "history")bd.elt("a", "selectCrit critBlck "+critName).att("href", "#").att("title", idKeyMgr.strings.select).att("onclick", "idKeyMgr.onCritSelected(event); return false;");
		bd.elt("div", "step "+(ctx?ctx:"") +(ctx == "history" ? " critBlck "+critName:"")).att("data-crit", critName);

		if(critVals) bd.att("data-critVal", critVals.join(" "));
			bd.elt("div", "illus")
				if(firstCritVal && firstCritVal.illus) bd.current().insertAdjacentHTML("afterbegin", firstCritVal.illus);
				else if (crit.illus)  bd.current().insertAdjacentHTML("afterbegin", crit.illus);
			bd.up()
			bd.elt("div", "content")
				.elt("span", "crit").text(crit.title).up();
				if(critVals) {
					if(crit.multiselect == "true"){
						bd.elt("ul");
						for(var i = 0 ; i < critVals.length ; i++) bd.elt("li").elt("span", "critVal").text(idKeyMgr.getCritVal(critName, critVals[i]).value).up().up();
						bd.up();
					}
					else{
						bd.elt("span", "critVal").text(idKeyMgr.getCritVal(critName, critVals[0]).value).up()
					}
				}

			bd.up()
			if(critVals){
				bd.elt("div", "tools")
					.elt("button", "edit").att("title", idKeyMgr.strings.edit).listen("click",idKeyMgr.onEditHistory).elt("span").text(idKeyMgr.strings.edit).up().up()
					.elt("button", "remove").att("title", idKeyMgr.strings.remove).listen("click",idKeyMgr.onRemoveHistory).elt("span").text(idKeyMgr.strings.remove).up().up()
				bd.up();
			}
		bd.up();
		if(ctx != "history") bd.up();
		return bd.current();
	},
	xBuildHTMLExclusiveCrits : function(exclusiveCrits, returnOpt){
		var bd = dom.newBd(scPaLib.findNode("chi:div.keys",sc$("keys")))/*.clear()*/;
		if(exclusiveCrits.length == 1) bd.current().appendChild(idKeyMgr.xBuildHTMLCrit(exclusiveCrits[0], returnOpt ? returnOpt : "popOnReturn"));
		else idKeyMgr.xBuildHTMLCritsList(exclusiveCrits, "exclusiveCrits");
	},

	xBuildHTMLCritsList : function(list, code){
		var bd = dom.newBd(scPaLib.findNode("chi:div.keys",sc$("keys")));

		bd.elt("div", "critlist");

		bd.elt("div","critListHead")
			.elt("span", "headTitle").text(idKeyMgr.strings.selectNewCriterion).up()

			.elt("div", "filter")
				.elt("label")
					.elt("span").text(idKeyMgr.strings.filter).up()
					.elt("input").att("type", "text").att("placeholder", idKeyMgr.strings.placeHolderKeys).att("data-filter","keys").listen("keyup", idKeyMgr.onFilter).up()
					.elt("button").att("title", idKeyMgr.strings.applyFilter).listen("click", idKeyMgr.onFilter).elt("span").text(idKeyMgr.strings.applyFilter).up().up()
				.up()
			.up()
		.up();

		bd.elt("div", code)
		list.forEach(function(crit){ /*autorise la liste d'objet json crit ou des critname uniquement */
			bd.current().appendChild(idKeyMgr.xBuildHTMLStep(crit.crit ? crit.crit : crit));
		});
		bd.up();
		idKeyMgr.xBuildHTMLCrit2TaxNavBtn(bd);
		bd.up();
	},

	xBuildHTMLCrit2TaxNavBtn : function(bd){
		var count = parseInt(sc$("taxoCount").getAttribute("data-count"));
		var taxLst = scPaLib.findNodes("des:li", sc$("taxlist"));
		//pas de bouton si pas de sélection
		if (count == taxLst.length) return;
		if(count == 1){
			var a = scPaLib.findNode("chi:a", taxLst[0]);
			bd.elt("button", "mobileFixedNav taxFound").att("title", a.textContent).listen("click", function(){a.click({"target": a})}).elt("span").text(a.textContent).up().up();
		}
		else{
			bd.elt("button", "mobileFixedNav seeTaxLst").att("title", count +idKeyMgr.strings.selecteds).listen("click", function(){
				var taxoCount = sc$("taxoCount");
				taxoCount.click({"target": taxoCount})
			}).elt("span").text(count +idKeyMgr.strings.selecteds).up().up();
		}
	},

	xBuildHTMLTax2CritNavBtn : function(bd){
		bd.elt("button", "mobileFixedNav seeCrits").att("title", idKeyMgr.strings.returnToCrits).listen("click", function(){
			var btn = scPaLib.findNode("des:button.keys", sc$("navMenu"));
			btn.click({"target":btn});
		}).elt("span").text(idKeyMgr.strings.returnToCrits).up().up();
	},
	/**
	 * Vérification qu'un critère est disponible selon l'état actuel
	 * @param crit
	 */
	xCleanHisto : function(index){
		var cleaned = 0;
		var isAvailableCrit = function(crit, toIndex){
			if(idKeyMgr.datas.exclusiveCrits.indexOf(crit) != -1) return true;
			else if(idKeyMgr.datas.secondaryCrits.indexOf(crit) != -1) return true;
			else for (var i = 0 ; i < toIndex ; i++) {
					var step = idKeyMgr.state[i];
					for(var i = 0 ; i < step.critVals.length ; i++){
						var critVal = idKeyMgr.getCritVal(step.crit, step.critVals[i]);
						if(critVal.exclusiveCrits && critVal.exclusiveCrits.indexOf(crit) != -1) return true;
						else if(critVal.secondaryCrits && critVal.secondaryCrits.indexOf(crit) != -1) return true;
					}
				}
			return false;
		}
		//Netoyage des des critères qui n'ont pas de raison d'être
		while (index < idKeyMgr.state.length){
			if(!isAvailableCrit(idKeyMgr.state[index].crit, index))  {
				idKeyMgr.state.splice(index,1);
				cleaned++;
			}
			else index++;
		}
		return cleaned;
	},
	/**
	 * Ajoute ou remplace une entrée d'historique
	 * @param fct : pushState/replaceState
	 */
	xBrowserHisto : function(fct){
		if(idKeyMgr.inReloadUrlState && fct === "pushState") return ;
		var tab = scPaLib.findNode("chi:div.tab.selected", sc$("main")).id;
		var taxon = scPaLib.findNode("bod:/chi:div.modal_container/des:iframe");
		var editCrit = scPaLib.findNode("des:div.crit.edit", sc$("keys"));
		if(taxon) taxon = taxon.getAttribute("data-taxon");
		var str = location.origin + location.pathname +"?state="+JSON.stringify(idKeyMgr.state)+"&tab="+tab + (taxon?"&taxon="+taxon:"");
		var qs = io.parseQueryString(location.search)
		if(qs.mode) str += "&mode="+qs.mode;
		if(qs.context) str += "&context="+qs.context;
		if(editCrit)
			if(editCrit.classList.contains("histo")) str += "&editHisto=" + scPaLib.findNode("des:ul", editCrit).getAttribute("data-crit");
			else str += "&editCrit=" + scPaLib.findNode("des:ul", editCrit).getAttribute("data-crit");
		if(str === window.location.toString()) return;
		history[fct](idKeyMgr.state, "",str);
	},

	xValidCritValSelection : function(critName, val){
		var editedIndex = idKeyMgr.getHistoCritIndex(critName);
		var insertToIndexFct = function(){
			for(var i = 0 ; i < idKeyMgr.state.length ; i++){
				if(i==0) {if (idKeyMgr.datas.exclusiveCrits.length && idKeyMgr.datas.exclusiveCrits.indexOf(idKeyMgr.state[0].crit) == -1) {return 0;}}
				else {
					for(var j = 0 ; j < idKeyMgr.state[i - 1].critVals.length ; j++){
						var critVal = idKeyMgr.getCritVal(idKeyMgr.state[i - 1].crit, idKeyMgr.state[i - 1].critVals[j]);
						if (critVal.exclusiveCrits && critVal.exclusiveCrits.indexOf(idKeyMgr.state[i].crit) == -1) return i;
					}

				}
			}
			return -1;
		}
		var insertToIndex = insertToIndexFct(critName);

		if(editedIndex != -1) {
			idKeyMgr.state[editedIndex].critVals = val;
			idKeyMgr.xCleanHisto(editedIndex);
		}
		else if(insertToIndex != -1) idKeyMgr.state.splice(insertToIndex,0,{"crit":critName,"critVals":val});
		else idKeyMgr.state.push({"crit":critName,"critVals":val});

		idKeyUi.xClose();
		idKeyMgr.nextSelStep();
		idKeyMgr.xBrowserHisto("pushState");
	},

	xReloadUrlState : function () {
		idKeyMgr.inReloadUrlState = true;
		var qs = io.parseQueryString(location.search);
		if(qs) try{
			var state = qs.state ? JSON.parse(qs.state) : [];
			var critsToLoad = [];
			var reloaded = false;
			var cb = function(){
				if(reloaded) return;
				for(var i = 0 ; i < critsToLoad.length ; i++) if(!idKeyMgr.getCrit(critsToLoad[i]).loaded) return;
				reloaded = true;

				if(state.length) {
					for(var i = 0 ; i < state.length ; i ++) {
						if(!idKeyMgr.getCrit(state[i].crit))  {
							state.splice(i--,1);
							continue;
						}
						for(var j = 0 ; j < state[i].critVals ; j++) if(!idKeyMgr.getCritVal(state[i].crit, state[i].critVals[j])) state[i].critVals.splice(j--,1);
						if(! state[i].critVals.length) state.splice(i--,1);
						if(idKeyMgr.xCleanHisto(i)) i--;
					}
				}
				idKeyMgr.state = state;
				idKeyUi.xClose();
				idKeyMgr.nextSelStep();
				var btn = scPaLib.findNode("des:button.outBtn."+qs.tab, sc$("navMenu")) || scPaLib.findNode("des:button.outBtn."+qs.tab, sc$("footer"));
				if(btn) btn.click({"target":btn});
				if(qs.editHisto){
					btn = scPaLib.findNode("des:.critBlck."+qs.editHisto+"/des:button.edit", scPaLib.findNode("des:div.histo_content", sc$("keys")));
					if(btn) btn.click({"target":btn});
				}
				if(qs.editCrit){
					btn = scPaLib.findNode("des:a.critBlck."+qs.editCrit+"/chi:div.step", scPaLib.findNode("des:div.critlist", sc$("keys")));
					if(btn) btn.click({"target":btn});
				}
				if(qs.taxon){
					var lnk = scPaLib.findNode("des:li."+qs.taxon+"/des:a", sc$("main"));
					if(lnk) lnk.click({"target":lnk});
				}
				idKeyMgr.xBrowserHisto("replaceState");
				idKeyMgr.inReloadUrlState = false;
			}
			if(state.length) {
				for(var i = 0 ; i < state.length ; i ++) {
					if (!idKeyMgr.getCrit(state[i].crit)) state.splice(i--, 1);
					else critsToLoad.push(state[i].crit);
				}
				for(var i = 0 ; i < critsToLoad.length ; i++) idKeyMgr.loadCritDatas(critsToLoad[i], cb);
			}
			else cb();
		}
		catch(e){
			console.error("error in state recovery",e);
		}
	},
	fetchJson : function(url,cb, cberror){
		if("fetch" in window){
			fetch(url).then(function(response) {
				if(!response.ok){if(cberror) cberror.call(null, response);}
				return response.json();
			}).then(function(json){
				cb.call(null,json);
			});
		}
		else {
			var fetchDatas = io.openHttpRequest(url);
			fetchDatas.onload = function(event){
				if(event.status >= 300) { if(cberror) cberror.call(null, event.target);}
				else cb.call(null,JSON.parse(event.target.responseText));
			}
			fetchDatas.send();
		}
	}
}

var idKeyUi = {
	alert : function(txt,cb,title, insert){
		idKeyUi.xClose();
		var bd = dom.newBd(document.body);
		bd.elt("div", "modal_container")
			bd.elt("div", "modal_over").up()
			.elt("div", "modal alert")
				.elt("div", "close").elt("button", "close").att("title", idKeyMgr.strings.close).listen("click", cb?cb:idKeyUi.xClose).elt("span").text(idKeyMgr.strings.close).up().up().up()
					.elt("div", "modal_content");
						if(title) bd.elt("div", "modalTitle").elt("h2").text(title).up().up();
						if(insert) {
							bd.current().insertAdjacentHTML("beforeend", txt);
							idKeyMgr.resetMediaMgrs();
						}
						else{
							bd.elt("span").text(txt).up()
						}
					bd.up()
					.elt("div","tools")
						.elt("button", "valid").att("title", idKeyMgr.strings.close).listen("click",("click",function(event){idKeyUi.xClose();cb?cb(event):null;})).elt("span").text(idKeyMgr.strings.close).up().up()
					.up()
				.up()
			.up();
	},
	confirm : function(txt,cb, type){
		idKeyUi.xClose();
		var bd = dom.newBd(document.body);
		bd.elt("div", "modal_container")
			bd.elt("div", "modal_over").up()
			.elt("div", "modal confirm")
				.elt("div", "close").elt("button", "close").att("title", idKeyMgr.strings.close).listen("click", idKeyUi.xClose).elt("span").text(idKeyMgr.strings.close).up().up().up()
				.elt("div", "modal_content").elt("span");
					if(type && type == "html") bd.current().insertAdjacentHTML("afterbegin",txt);
					else bd.text(txt)
					bd.up().up()
				.elt("div","tools")
					.elt("button", "cancel").att("title", idKeyMgr.strings.cancel).listen("click",idKeyUi.xClose).elt("span").text(idKeyMgr.strings.cancel).up().up()
					.elt("button", "valid").att("title", idKeyMgr.strings.valid).listen("click",function(event){idKeyUi.xClose();cb(event);}).elt("span").text(idKeyMgr.strings.valid).up().up()
				.up()
			.up()
		.up();
	},
	modal : function(node,cb){
		idKeyUi.xClose();
		var bd = dom.newBd(document.body);
		bd.elt("div", "modal_container")
			bd.elt("div", "modal_over").up()
			.elt("div", "modal")
				.elt("div", "close").elt("button", "close").att("title", idKeyMgr.strings.close).listen("click", idKeyUi.xClose).elt("span").text(idKeyMgr.strings.close).up().up().up()
				.elt("div", "modal_content")
					.current().appendChild(node);
				bd.up()
				bd.elt("div","tools")
					.elt("button", "cancel").att("title", idKeyMgr.strings.cancel).listen("click",idKeyUi.xClose).elt("span").text(idKeyMgr.strings.cancel).up().up()
					.elt("button", "valid").att("title", idKeyMgr.strings.valid).listen("click",("click",function(event){idKeyUi.xClose();cb(event);})).elt("span").text(idKeyMgr.strings.valid).up().up()
				.up()
			.up()
		up();
		idKeyMgr.resetMediaMgrs();
	},
	iframe : function(url, navCtx){
		if(url.startsWith("co/")) url = url.substring(3);
		idKeyUi.xClose();
		var bd = dom.newBd(document.body);
		bd.elt("div", "modal_container")
			bd.elt("div", "modal_over").up()
			.elt("div", "modal")
				.elt("div", "close").elt("button", "close").att("title", idKeyMgr.strings.close).listen("click", idKeyUi.xClose).elt("span").text(idKeyMgr.strings.close).up().up().up()
				.elt("div", "modal_content");
		if(navCtx){
			var prev = scPaLib.findNode("psi:li.taxon",navCtx);
			var next = scPaLib.findNode("nsi:li.taxon",navCtx);
			if(prev || next || idKeyMgr.cid){
					bd.elt("div", "navtools");
						if(prev) bd.elt("button", "previous").att("title", idKeyMgr.strings.previous).listen("click", function(event){
							idKeyUi.iframe(prev.getAttribute("data-taxon-url") || idKeyMgr.datas.taxons[prev.getAttribute("data-taxon")].url,prev);
						}).elt("span").text(scPaLib.findNode("chi:a",prev).textContent).up().up();
						else bd.elt("button", "previous").att("title", idKeyMgr.strings.previous).att("disabled", "true")
							.elt("span").text(idKeyMgr.strings.previous).up().up();

						if(idKeyMgr.cid) bd.elt("button", "selectTaxo").att("title", idKeyMgr.strings.selectTitle).listen("click", function(event){
							var taxon = idKeyMgr.datas.taxons[navCtx.getAttribute("data-taxon")]
							var datas = {};
							for (var key in taxon){
								if(key === "url" || key === "critvals" || key === "score" || key === "elisedCN") continue;
								datas[key] = taxon[key];
							}
							datas['cidInteraction'] = "ended";
							if(window.parent) window.parent.postMessage(datas, '*');
							else console.log(datas);
						}).elt("span").text(idKeyMgr.strings.select).up().up();

						if(next) bd.elt("button", "next").att("title", idKeyMgr.strings.next).listen("click", function(event){
							idKeyUi.iframe(next.getAttribute("data-taxon-url") || idKeyMgr.datas.taxons[next.getAttribute("data-taxon")].url,next);
						}).elt("span").text(scPaLib.findNode("chi:a",next).textContent).up().up();
						else bd.elt("button", "next").att("title", idKeyMgr.strings.next).att("disabled", "true")
							.elt("span").text(idKeyMgr.strings.next).up().up();
					bd.up();
				}
			}
					bd.elt("iframe").att("src", url).att("data-taxon", navCtx.getAttribute("data-taxon")).up()
				.up()
			.up()
		.up();
		idKeyMgr.xBrowserHisto("pushState");
	},
	changeTab : function(event){
		var button = scPaLib.findNode("can:button.outBtn", event.target);
		scPaLib.findNodes("des:button.outBtn",sc$("navMenu")).forEach(function(node){
			if(node != button) node.classList.remove("selected");
			else node.classList.add("selected");
		});
		scPaLib.findNodes("des:button.outBtn",sc$("footer")).forEach(function(node){
			if(node != button) node.classList.remove("selected");
			else node.classList.add("selected");
		});
		scPaLib.findNodes("chi:div.tab", sc$("main")).forEach(function(tab){
			if(tab.id == button.getAttribute("data-tab")) {
				tab.classList.add("selected");
			}
			else {
				tab.classList.remove("selected");
			}
		});
		idKeyMgr.xBrowserHisto("pushState");
	},
	xClose : function(){
		var mod = scPaLib.findNode("des:div.modal_container");
		if(mod) mod.parentElement.removeChild(mod);
		if(scPaLib.findNode("des:iframe", mod)) idKeyMgr.xBrowserHisto("pushState");
	},
	xCloseMenus : function (){
		sc$("navMenu").classList.remove("showMenu");
		var extMenu = sc$('extendedMenu');
		if(extMenu) extMenu.classList.remove('showMenu');
	},
	xHistoHtmlChange(){
		var keysDiv = scPaLib.findNode("chi:div.keys", sc$("keys"));
		if(keysDiv.children.length == 2 && keysDiv.children[0].offsetHeight > keysDiv.offsetHeight/2) keysDiv.classList.add("scroller");
		else keysDiv.classList.remove("scroller");
	}
};
/**
 * Gestionnaire de l'app
 */
var idKeyApp = scOnLoads[scOnLoads.length] = {
	event : null,
	mode : null,
	inApp : null,
	worker:null,
	newWorker:null,

	/**
	 * page loaded
	 */
	onLoad : function(){
		idKeyApp.inApp = navigator.standalone || window.matchMedia('(display-mode: standalone)').matches || io.parseQueryString(location.search).mode == "app";
		navigator.serviceWorker.ready.then(function(registration){
			idKeyApp.worker = registration.active;
			if(registration.waiting){
				idKeyApp.newWorker = registration.waiting;
				setTimeout(function(){  idKeyApp.onUpdateAvailable(null, true);}, 2000);
			}
			if(sessionStorage.getItem("downloadOnStart") == "true") {
				idKeyApp.downloadCaches(true);
				sessionStorage.setItem("downloadOnStart", null);
			}
			else {
				if(idKeyApp.inApp) idKeyApp.postMessage({"type":"isFullyOffline"});
			}
			navigator.onLine ? idKeyApp.onOnline() : idKeyApp.onOffline();
		});
	},
	postMessage(message, worker){
		const channel = new MessageChannel();
		channel.port1.onmessage = idKeyApp.onSwMessage;
		(worker || idKeyApp.worker).postMessage(message, [channel.port2]);
	},

	onOnline : function(){sc$("mobileZone").hidden = false;},
	onOffline : function(){if(!idKeyApp.mode === "offline") sc$("mobileZone").hidden = true;},

	/**
	 * interception du prompt d'install
	 */
	onBeforeInstallPrompt : function(event){
		// Prevent Chrome <= 67 from automatically showing the prompt
		event.preventDefault();
		idKeyApp.event = event;
		dom.newBd(sc$("mobileZone")).elt("button", "install mobile").att("title", idKeyMgr.strings.installApp).listen("click", idKeyApp.onInstallApp).elt("span").text(idKeyMgr.strings.installApp).up().up();
	},
	/**
	 * Lancement du prompt d'install
	 */
	onInstallApp : function(event){
		var btn = scPaLib.findNode("can:button", event.target);
		btn.parentElement.removeChild(btn);
		idKeyApp.event.prompt();
	},

	/**
	 * Message de warning update & download ou offline
	 */
	onPrepareOffline : function(event, message, size){
		message = message || (idKeyApp.mode === "offline" ? idKeyMgr.strings.updateWarning : idKeyMgr.strings.offlineWarning);
		var rawSize = size ? size : scPaLib.findNode("can:button",event.target).appSize;
		var size = idKeyApp.xGetHumanReadableSize(rawSize);

		var onError = function(){
			console.log("Unable to user navigator.storage. Try to bypass");
			idKeyApp.downloadCaches();
		}
		var onSpaceSuccess = function(){
			idKeyUi.confirm(message.replace("%s", size), function(){
				if (navigator.storage && navigator.storage.persist){
					navigator.storage.persist().then(function(persistent) {
						if (persistent) {
							if(idKeyApp.mode == "offline") {
								idKeyApp.xDownloading();
								sessionStorage.setItem("downloadOnStart", "true");
								idKeyApp.postMessage({"type":"clearCache"});
							}
							else idKeyApp.downloadCaches();
						}
						else idKeyUi.alert(idKeyMgr.strings.featureNotAvailable);
					});
				}
				else onError();
			}, "html");
		};

		//handle space
		new Promise(function (resolve, reject){
			if (navigator.storage && navigator.storage.estimate) {
				navigator.storage.estimate().then(function (storage) {
					if((storage.quota + storage.usage) > rawSize) resolve();
					else idKeyUi.alert(idKeyMgr.strings.notEnoughSpace.replace("%s", size).replace("%s", idKeyApp.xGetHumanReadableSize(storage.quota + storage.usage)));
				}).catch(reject);
			}
			else resolve();
		}).then(onSpaceSuccess)
			.catch(onError);
	},
	/**
	 * gestion de message du SW
	 */
	onSwMessage : function(event){
		if(event.data){
			switch (event.data.type) {
				case "offlineReady":
					idKeyApp.xDownloaded();
					break;
				case "offlineNotReady":
					dom.newBd(sc$("mobileZone")).clear()
						.elt("button", "offline mobile").prop("appSize", event.data.appSize).att("title", idKeyMgr.strings.prepareOffline).listen("click", idKeyApp.onPrepareOffline)
							.elt("span").text(idKeyMgr.strings.prepareOffline).up()
						.up();
					idKeyApp.mode = "online";
					break;
				case "allCacheInstalled":
					idKeyUi.alert(idKeyMgr.strings.offlineReady)
					idKeyApp.xDownloaded();

					break;
				case "cacheCleared":
					idKeyApp.postMessage({"type":"activate"}, idKeyApp.newWorker);
					break;
				case "installationFailed":
					idKeyUi.alert(idKeyMgr.strings.offlineFailed, function(){window.location.reload();});
					break;
				case "updateSize":
					dom.newBd(sc$("mobileZone")).clear().elt("button", "update mobile").prop("appSize", event.data.appSize).att("title", idKeyMgr.strings.prepareUpdate).listen("click", idKeyApp.onPrepareOffline)
						.elt("span").text(idKeyMgr.strings.prepareUpdate).up()
					.up();
					if(!event.data.onStart) idKeyApp.onPrepareOffline(null, idKeyMgr.strings.updateOfflineReady+idKeyMgr.strings.updateWarning, event.data.appSize);
			}
		}
	},

	/**
	 * Lancement d'un update d'un nouveau SW
	 */
	onUpdateAvailable : function(newWorker, onStart){
		if(newWorker) idKeyApp.newWorker = newWorker;
		navigator.serviceWorker.addEventListener('controllerchange', function () {if(idKeyApp.newWorker) window.location.reload();});
		if(idKeyApp.mode == "online" || !idKeyApp.inApp) {
			if(onStart) idKeyApp.postMessage({"type":"clearCache"});
			else idKeyUi.alert(idKeyMgr.strings.updateReady,function(){idKeyApp.postMessage({"type":"clearCache"});});
		}
		else if(idKeyApp.mode == "offline") idKeyApp.postMessage({"type":"fetchNewSize", "onStart":onStart}, idKeyApp.newWorker);
		else console.log("DEBUG: Erreur dans le process de maj");
	},

	/**
	 * Lancement du download
	 */
	downloadCaches : function (skipAlert){
		idKeyApp.postMessage({"type":"loadOffline"});
		if(!skipAlert) idKeyUi.alert(idKeyMgr.strings.offlineLoadingStarted);
		idKeyApp.xDownloading();
		idKeyApp.xPingWS();
	},
	xDownloading : function(){dom.newBd(sc$("mobileZone")).clear().elt("span", "downloading mobile").att("title", idKeyMgr.strings.downloading).elt("span").text(idKeyMgr.strings.downloading).up().up();},
	xDownloaded : function(){
		idKeyApp.mode = "offline";
		dom.newBd(sc$("mobileZone")).clear().elt("span", "downloaded mobile").att("title", idKeyMgr.strings.downloaded).elt("span").text(idKeyMgr.strings.downloaded).up().up();
	},
	/** en cas d'installation longue, le SW peut stopper si pas d'interaction avec un client **/
	xPingWS : function(){
		if(scPaLib.findNode("chi:span.mobile", sc$("mobileZone"))) setTimeout(function (){
			idKeyApp.postMessage({"type":"ping"});
			idKeyApp.xPingWS();
		},1000);
	},
	xGetHumanReadableSize : function(size){
		var counter = 0;
		while (size > 1000){
			size /= 1024;
			counter++
		}
		size = Math.round(size);
		switch (counter) {
			case 0:size +="octets";break;
			case 1:size +="Ko";break;
			case 2:size +="Mo";break;
			case 3:size +="Go";break;
			case 4:size +="To";break;
		}
		return size;
	}
}
window.addEventListener('beforeinstallprompt', idKeyApp.onBeforeInstallPrompt);
window.addEventListener('appinstalled', function(event){setTimeout(function (){idKeyApp.postMessage({"type":"isFullyOffline"});},200);});
window.addEventListener('online', idKeyApp.onOnline);
window.addEventListener('offline', idKeyApp.onOffline);
window.addEventListener('message', idKeyApp.onSwMessage);
window.addEventListener('click', idKeyUi.xCloseMenus);
