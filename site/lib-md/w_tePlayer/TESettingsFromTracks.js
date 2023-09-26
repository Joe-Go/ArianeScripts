TESettingsFromTracks = function (classPrefix, insertBefore, subTitlesArea, transcriptArea, transcriptSubWin) {
	this.classPrefix = classPrefix;
	this.insertBefore = insertBefore;
	this.subTitlesArea = subTitlesArea || '.' + this.classPrefix + 'SubtitlesArea';
	this.transcriptArea = transcriptArea || '.' + this.classPrefix + 'TranscriptArea';
};

TESettingsFromTracks.ctrlCount = 0;

TESettingsFromTracks.prototype = {
	ready: function (ctrl) {
		var self = this;
		this.id = TESettingsFromTracks.ctrlCount++;

		this.ctrl = ctrl;
		this.insertBefore = ctrl.container.querySelector(this.insertBefore);
		this.subTitlesArea = ctrl.container.querySelector(this.subTitlesArea);
		this.transcriptArea = ctrl.container.querySelector(this.transcriptArea);

		var media = ctrl.media.originalNode || ctrl.media;
		var subtitleTracks = [], altVideoTrack, audioDescTrack, transcriptTrack;
		for (var child = media.firstElementChild; child; child = child.nextElementSibling) {
			var kind = child.getAttribute('kind');
			if (child.localName == 'track') {
				if (kind == 'subtitles') subtitleTracks.push(child);
			} else if (child.localName == 'audio-track') {
				if (kind == 'descriptions') audioDescTrack = child;
			} else if (child.localName == 'video-track') {
				if (kind == 'sign') altVideoTrack = child;
			} else if (child.localName == 'html-track') {
				if (kind == 'captions') transcriptTrack = child;
			}
		}

		var settingsList = document.createElement('ul');
		settingsList.className = this.classPrefix + 'SettingsList';
		var settingsBtn = this.createPressButton(
			this.classPrefix + 'SettingsBtn',
			"Options d\'accessibilité",
			"Afficher les options d\'accessibilité",
			"Cacher les options d\'accessibilité",
			true);

		function updateVisibility() {
			settingsBtn.hidden = Array.prototype.every.call(settingsList.children, function (child) { return child.hidden });
		}

		this.subTitlesArea.hidden = true;
		if (subtitleTracks.length) {
			var subtitlesList = document.createElement('ul');
			subtitlesList.className = this.classPrefix + 'SubtitlesList';
			subtitlesList.appendChild(self.createSubtitleItem(null));
			subtitleTracks.forEach(function (track) {
				subtitlesList.appendChild(self.createSubtitleItem(track));
			});

			var subtitlesItem = settingsList.appendChild(document.createElement('li'));
			var subtitlesBtn = subtitlesItem.appendChild(this.createPressButton(
				this.classPrefix + 'SubtitlesBtn',
					"Sous-titres",
					"Afficher la liste des sous-titres",
					"Cacher la liste des sous-titres")
			);
			subtitlesItem.appendChild(this.createPanel(subtitlesBtn, this.classPrefix + 'SubtitlesPanel', subtitlesList));
		}

		if (audioDescTrack) {
			var audioDescItem = settingsList.appendChild(document.createElement('li'));
			var audioDescInput = audioDescItem.appendChild(this.createInput(
				this.classPrefix + 'AudioDesc',
				'checkbox',
					"Audio-description",
					"Écouter l\'audio-description",
					"Arrêter l\'audio-description")
			);
			audioDescInput.firstElementChild.onchange = function () {
				var src = audioDescTrack.getAttribute('src');
				if (this.checked) ctrl.addAudio(src);
				else ctrl.removeAudio(src)
			}
		}

		self.transcriptArea.hidden = true;
		if (transcriptTrack) {
			var transcriptItem = settingsList.appendChild(document.createElement('li'));
			var transcriptInput = transcriptItem.appendChild(this.createInput(
				this.classPrefix + 'Transcript',
				'checkbox',
					"Transcription",
					"Afficher la transcription",
					"Cacher la transcription")
			);
			transcriptInput.firstElementChild.onchange = function () {
				if (this.checked) {
					if (transcriptTrack.parentNode) {
						var content = document.createRange();
						content.selectNodeContents(transcriptTrack);
						self.transcriptArea.appendChild(content.extractContents());
						transcriptTrack.parentNode.removeChild(transcriptTrack);
					}
					ctrl.container.classList.add('teActiveTranscript');
					self.transcriptArea.hidden = false;
				} else {
					ctrl.container.classList.remove('teActiveTranscript');
					self.transcriptArea.hidden = true;
				}
			};

		}

		if (altVideoTrack) {
			var altVideoItem = settingsList.appendChild(document.createElement('li'));
			var altVideoInput = altVideoItem.appendChild(this.createInput(
				this.classPrefix + 'AltVideo',
				'checkbox',
					"Alternative vidéo (LSF, LPC)",
					"Regarder l\'alternative vidéo",
					"Quitter l\'alternative vidéo")
			);
			altVideoInput.firstElementChild.onchange = function () {
				if (this.checked) ctrl.switchMedia(altVideoTrack.getAttribute('src'), altVideoTrack.getAttribute('type'));
				else ctrl.restoreMedia()
			}
		}

		var qualities = ctrl.media.renderer && ctrl.media.renderer.getQualities && ctrl.media.renderer.getQualities();
		// Si il y a une gestion de la qualité, getQualities retourne un tableaux (qui peut être vide)
		if (qualities) {
			var qualitiesItem = settingsList.appendChild(document.createElement('li'));
			qualitiesItem.hidden = true;
			var qualitiesBtn = qualitiesItem.appendChild(this.createPressButton(
				this.classPrefix + 'QualitiesBtn',
				"Qualité",
				"Afficher les différentes qualités disponibles",
				"Cacher les différentes qualités disponibles")
			);
			qualitiesItem.appendChild(qualitiesBtn);

			var qualitiesPanel = null;
			function updateQualities(qualities) {
				if (qualitiesPanel) qualitiesItem.removeChild(qualitiesPanel);
				if (qualities.length) {
					qualitiesItem.hidden = false;
					var qualitiesList = document.createElement('ul');
					qualitiesList.className = self.classPrefix + 'QualitiesList';

					var currentQuality = ctrl.media.renderer.getQuality();
					for (var i = 0; i < qualities.length; i++) {
						var quality = qualities[i];
						qualitiesList.appendChild(self.createQualityItem(quality, quality.value == currentQuality));
					}
					qualitiesPanel = self.createPanel(qualitiesBtn, self.classPrefix + 'QualitiesPanel', qualitiesList);
					qualitiesItem.appendChild(qualitiesPanel);
				} else {
					qualitiesItem.hidden = true;
				}
				updateVisibility();
			}

			updateQualities(qualities);

			ctrl.media.addEventListener('me-qualitiesavailable', function () {
				updateQualities(ctrl.media.renderer.getQualities());
			});

			ctrl.media.addEventListener('me-qualitychange', function () {
				var input = qualitiesItem.querySelector('input:checked');
				if (input) input.checked = false;
				var currentQuality = ctrl.media.renderer.getQuality();
				input = qualitiesItem.querySelector('input[value="' + currentQuality + '"]');
				if (input) input.checked = true;
			});
		}

		var settingsPanel = this.createPanel(settingsBtn, this.classPrefix + 'SettingsPanel', settingsList);
		updateVisibility();
		ctrl.element.insertBefore(settingsBtn, this.insertBefore);
		ctrl.element.insertBefore(settingsPanel, this.insertBefore);
	},

	createPanel: function (btn, className, content) {
		var panel = document.createElement('div');
		panel.hidden = true;
		panel.className = className;
		panel.setAttribute('role', 'dialog');
		var closeBtn = panel.appendChild(this.createButton(
			this.classPrefix + 'VisuallyHidden',
			"Fermer",
			"Fermer la fenêtre")
		);
		panel.appendChild(content);
		var focusOutBtn = panel.appendChild(this.createButton(
			this.classPrefix + 'VisuallyHidden',
			"Sortir",
			"Sortir de la fenêtre",
			true)
		);
		panel.appendChild(focusOutBtn);
		var focusRingBtn = panel.appendChild(this.createButton(
			this.classPrefix + 'VisuallyHidden',
			"Retour",
			"Retour en début de fenêtre", true)
		);

		function closePanel() {
			if (!panel.hidden) btn.click();
		}

		function mouseUpListener(event) {
			if (event.target != btn && !panel.contains(event.target)) {
				closePanel();
			}
		}

		btn.addEventListener('change', function () {
			if (panel.hidden) {
				panel.hidden = false;
				setTimeout(function () {
					closeBtn.focus();
				}, 200);
				window.addEventListener('mouseup', mouseUpListener);
			} else {
				panel.hidden = true;
				window.removeEventListener('mouseup', mouseUpListener);
			}
		});

		closeBtn.onclick = closePanel;
		focusOutBtn.onclick = function () {
			var focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex=\'-1\'])';
			var focussable = Array.prototype.filter.call(ctrl.element.querySelectorAll(focussableElements), function (element) {
				return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
			});
			var index = focussable.indexOf(document.activeElement);
			if (index > -1) {
				var nextElement = focussable[index + 1] || focussable[0];
				nextElement.focus();
			}
		};
		focusRingBtn.onfocus = function () {
			closeBtn.focus();
		};

		panel.addEventListener('change', function () {
			closePanel();
		});

		window.addEventListener('keydown', function (event) {
			if (!panel.hidden && event.keyCode == 27 /* Escape */) {
				closePanel();
			}
		});

		return panel;
	},

	createButton: function (className, label, title, labelHidden) {
		var btn = document.createElement('button');
		btn.className = className;
		btn.title = title;
		var span = btn.appendChild(document.createElement('span'));
		span.textContent = label;
		if (labelHidden) span.className = this.classPrefix + 'VisuallyHidden';
		return btn;
	},


	createPressButton: function (className, label, title, pressedTitle, labelHidden) {
		var btn = this.createButton(className, label, title, labelHidden);
		btn.setAttribute('aria-pressed', 'false');
		btn.dataset.pressedTitle = pressedTitle;
		return btn;
	},

	createInput: function (className, type, label, title, checkedTitle, value) {
		var labelElt = document.createElement('label');
		var input = labelElt.appendChild(document.createElement('input'));
		labelElt.className = className;
		labelElt.tabIndex = 0;
		input.type = type;
		if (value !== undefined) input.value = value;
		labelElt.title = title;
		if (checkedTitle) input.addEventListener('change', function () {
			if (this.checked) labelElt.title = checkedTitle;
			else labelElt.title = title;
		});
		var span = labelElt.appendChild(document.createElement('span'));
		span.textContent = label;
		labelElt.addEventListener('keydown', function (event) {
			if (event.keyCode == 13 || event.keyCode == 32) {
				this.click();
			}
		});
		return labelElt;
	},

	createSubtitleItem: function (track) {
		var self = this;
		var item = document.createElement('li');
		var src = track ? track.getAttribute('src') : "";
		var title = track ?  "Activer les sous-titres " + track.getAttribute('srclang') : "Désactiver les sous-titres";
		var label = track ? track.getAttribute('srclang') : "Désactivés";
		var labelElt = item.appendChild(this.createInput(this.classPrefix + 'Subtitle', 'radio', label, title, null, src));
		var input = labelElt.firstElementChild;
		input.name = this.classPrefix + 'Subtitles_' + this.id;
		input.onchange = function () {
			if (this.checked) self.ctrl.showSubtitle(src, self.subTitlesArea);
		};
		return item;
	},

	createQualityItem: function (quality, checked) {
		var self = this;
		var item = document.createElement('li');
		var labelElt = item.appendChild(this.createInput(this.classPrefix + 'Quality', 'radio', quality.label, quality.label, null, quality.value));
		var input = labelElt.firstElementChild;
		input.name = this.classPrefix + 'Qualities_' + this.id;
		input.checked = checked;
		//if (checked) input.setAttribute('checked', '');
		input.onchange = function () {
			if (this.checked) self.ctrl.media.renderer.setQuality(this.value);
		};
		return item;
	},
};
