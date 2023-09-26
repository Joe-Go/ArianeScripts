var tePlayerMgr = {
	subControllers : [],
	init: function () {
		if ('mejs' in window) mejs.Renderers.add(teMgr.scPortalRenderer);
		var self = this;
		if (document.readyState == 'loading') {
			document.addEventListener('DOMContentLoaded', function () {
				self.initPlayers();
			});
		} else {
			self.initPlayers();
		}
	},

	initPlayers: function () {
		var self = this;
		var playerElts = document.querySelectorAll('.tePlayer');
		Array.prototype.forEach.call(playerElts, function (playerElt) {
			var ctrlElt = playerElt.querySelector('.tepController');
			if ('MediaElement' in window) {
				var me = new MediaElement(playerElt.querySelector('audio,video'), {
					success: function() {
						self.initController(ctrlElt);
					}
				});
				me.addEventListener('error', function(error) {
					console.error(error.message);
				});
			} else {
				self.initController(ctrlElt);
			}
		});
	},

	initController: function(ctrlElt) {
		teMgr.initController(ctrlElt, this.subControllers.concat([
			new TEActiveMouse(1500),
			new TEFullscreenCtrl('.tepFullscreen'),
			new TEOnlyOnePlayingCtrl(),
			new TESettingsFromTracks('tep', '.tepFullscreen'),
			new TEErrorHandler(),
			new TESessionCurrentSubtitle('.tepSubtitlesList')
		]));
	}
};
