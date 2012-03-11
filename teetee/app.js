/*
 * TODO
 *
 * Common template framework for all pages - pass in (db, type, id, subtype)?
 *  - ALL of the pages are templates? would clean up DOM a bit...
 *  - access to results, etc, all are easier
 * Loading animation during template compilation/rending?
 * Do prev/next for divisions and clubs, don't for teams
 * Left menu list - always there? always divisions?
 * Prioritised-column table... javascript needed, I think; check padding/margin size when centered
 * Decide on context for club display - never any?
 * Save stats on a timer?
 *
 * Split app.js
 * Compile with yui
 * Rearrange make system to make new copy for release
 */

$dev = 1;
transitionDuration = 500;

utils = {
	prevLink: function (cls, type) {
		return function(obj) {
			if (obj.context.id < 1) {
				switch (type) {
					case "href": return "#";
					case "class": return "disabled";
				}
			} else {
				switch (type) {
					case "href": return "#"+cls+"/"+(obj.context.id - 1);
					case "class": return "";
				}
			}
		};
	},

	nextLink: function (cls, type) {
		return function(obj) {
			if (obj.context.id > 1) {
				switch (type) {
					case "href": return "#";
					case "class": return "disabled";
				}
			} else {
				switch (type) {
					case "href": return "#"+cls+"/"+(obj.context.id + 1);
					case "class": return "";
				}
			}
		};
	},
};

app = {
	DATA_FILES: [ 'league', 'results' ],

	state: {
		awaitingHashReload: false,
	},

	start: function () {
		app.start = new Date;
		app.random = Kybos();
		app.templateCache = {};
		app.dbParts = app.getConfig('dbParts', {});
		app.stats = app.getConfig('stats', {});
		app.updateTimes = app.getConfig('updateTimes', {});

		/* Update stuff */
		app.displayUpdateDate();
		app.rebuildDatabase(); // Uses cached data
		if (app.updateRequired) { setTimeout(app.checkForUpdates, 10); }

		/* Location/back-stack stuff */
		$(window).hashchange(app.hashChange);
		$('section.articles').on('click', 'a.disabled', false);

		/* Stats stuff */
		if ("undefined" == typeof app.stats.id) {
			app.stats.id = app.random.uint32().toString(16) + app.random.uint32().toString(16);
		}
		app.updateStat('loaded', 1);
	},

	checkForUpdates: function () {
		app.updateStat('updateWanted', 1);
		if (navigator.onLine === false) {
			app.updateStat('updateFailOffline', 1);
			markUpdateState('offline');
			return;
		}

		// fetch!
		app.markUpdateState('checking');
		app.fetches = {pending: 1, fail: false, changes: 0};
		setTimeout(function () {
			app.fetches = {pending: app.DATA_FILES.length, fail: false};
			for (i=0; i<app.DATA_FILES.length; i++) {
				app.fetchData(app.DATA_FILES[i]);
			}
		}, $dev ? 1000 : 0);
	},

	updateFinished: function () {
		app.displayUpdateDate();

		if (app.fetches.fail) {
			app.updateStat('updateFailed', 1);
			app.markUpdateState('fail');
		} else {
			app.updateStat('updateCompleted', 1);
			app.markUpdateState('okay');
			if (app.fetches.changes) {
				console.log("changed!");
				app.rebuildDatabase();
			} else {
				console.log("not changed :(");
			}
		}
	},

	rebuildDatabase: function () {
		console.log("rebuild");
		app.db = {};
		for (name in app.dbParts) {
			$.extend(app.db, app.dbParts[name]);
		}
		$('section.articles > article.generated').remove();
		app.state.awaitingHashReload = true;
		setTimeout(function () {
			if (app.state.awaitingHashReload) {
				app.lastHash = null;
				$(window).hashchange();
				app.state.awaitingHashReload = false;
			}
		}, 10);
	},

	displayUpdateDate: function () {
		var q = $.Enumerable.From(app.updateTimes).Select("$.Value");
		var dateField = $('.update .status .date');
		var good;
		if (q.Any()) {
			var when = new Date(q.Max());
			dateField.text(when.toString('d'));
			good = (when > new Date().add(-7).day());
		} else {
			dateField.text('n/a');
			good = false;
		}

		dateField.removeClass('good bad');
		dateField.addClass(good ? 'good' : 'bad');

		app.updateRequired = !good;
		if ($dev) app.updateRequired = true;
	},

	markUpdateState: function (state) {
		console.log("update state = "+state, (new Date).getTime() - app.start);
		$('.update .notice').attr('class', 'notice '+state);
	},

	fetchData: function (name, force) {
		console.log("fetching",name);
		var lastFetchTime = new Date(app.updateTimes[name] || 0);
		if (force) lastFetchTime = 0;
		var url = 'data/'+name+'.json';
		var req = $.ajax(url, {
			headers: { 'If-Modified-Since': lastFetchTime.toGMTString() },
			ifModified: true,
		});
		req.success(function (data, status) { app.dataFetched(name, data, req, status); });
		req.error(function (obj, err, msg) { app.dataFetchFailed(name); })
	},

	dataFetchFailed: function (name) {
		console.log("fetch failed for",name);
		app.fetches.pending -= 1;
		app.fetches.fail = true;

		if (app.fetches.pending == 0) { app.updateFinished(); }
	},

	dataFetched: function (name, data, req, status) {
		if (status == "notmodified") {
			console.log("fetch notmodified for ",name);
		} else {
			console.log("fetch done for",name);

			// insert return data into database
			app.dbParts[name] = data;
			//~ $.extend(app.db, data);
			app.setConfig('dbParts', app.dbParts);

			app.fetches.changes = true;

			// record when it arrived
			var when = req.getResponseHeader('Last-Modified')
			app.updateTimes[name] = new Date(when).valueOf();
			app.setConfig('updateTimes', app.updateTimes);
		}

		app.fetches.pending -= 1;
		if (app.fetches.pending == 0) { app.updateFinished(); }
	},

	hashChange: function (evt) {
		var target, slide = false;
		var newHash = window.location.hash || "#main";
		console.log('hash change', newHash, evt);
		if (app.lastHash == newHash) { return; }

		var bits = newHash.substring(1).split('/');
		if (bits.length == 1) {
			//~ console.log("single part hash", bits);
			target = $('.articles .'+bits[0]);
		} else if (bits.length == 2) {
			//~ console.log("multi-part hash", bits);

			var type = bits[0];
			var id = parseInt(bits[1]);
			if (type in app.db) {
				var data = $.Enumerable.From(app.db[type]).Where("$.id == "+id).First();
				target = app.instantiateTemplate(type, id, data);

				// If the last hash was also a division, do fancy transitions
				if (app.lastHash && app.lastHash.search('#'+type+'/') != -1) {
					//~ console.log("fancy transition");
					var lastId = parseInt(app.lastHash.split('/')[1]);
					var currentArticle = $($('section.articles > article').filter(':visible')[0]);
					//~ console.log('current',currentArticle);
					if (Modernizr.csstransitions) {
						//console.log("transition support");
						app.switchItems(currentArticle, target,
							(id < lastId)? 'offRight' : 'offLeft',
							(id < lastId)? 'offLeft' : 'offRight', transitionDuration);
					} else {
						//console.log("no transition support");
						currentArticle.fadeOut('fast');
						target.fadeIn('fast');
					}
				} else {
					//~ console.log("no previous matching article type");
					var visibles = $('.articles > article:visible');
					if (visibles.length) {
						//~ console.log("found previously visible article");
						visibles.fadeOut('fast');
						target.fadeIn('fast');
					} else {
						//~ console.log("no previous article");
						target.fadeIn('fast');
					}
				}
			}
		}

		var visibles = $('.articles > article:visible');
		if (visibles.length) {
			visibles.fadeOut('fast');
		}
		if (!target || !target.length) {
			target = $('.articles .notfound');
		}
		target.fadeIn('fast');

		app.lastHash = newHash;
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	},

	instantiateTemplate: function (type, id, idList) {
		var ele = $('section.articles article[id="'+type+'/'+id+'"]').first();
		if (ele.length == 0) {
			// Compile the template
			if (!(type in app.templateCache)) {
				app.templateCache[type] = $('section.templates .'+type).compile(app.templateMapping[type]);;
			}

			// Instantiate it for this data
			var data = app.db[type][id];
			ele = $(app.templateCache[type](data))
				.addClass(type).addClass('generated')
				.attr('id', type+'/'+id).appendTo($('section.articles'));
		}
		return ele;
	},

	switchItems: function (outItem, inItem, outCls, inCls, time) {
		inItem.removeClass(outCls).addClass(inCls).show();
		setTimeout(function () {
			inItem.removeClass(outCls+' '+inCls);
			outItem.addClass(outCls);
			setTimeout(function() { outItem.hide().removeClass(outCls); }, time);
		}, 0);
	},

	updateStat: function (name, addValue, initValue) {
		if ('undefined' == typeof initValue) { initValue = 0; }
		if ('undefined' == typeof addValue) { addValue = 1; }

		var result;
		console.log(name, addValue);

		app.updateConfig('stats', {}, function () {
			result = app.stats[name] = (app.stats[name] || initValue) + addValue;
		});

		return result;
	},

	getConfig: function (name, def) {
		var value = localStorage.getItem(name);
		return (null == value) ? def : JSON.parse(value);
	},

	setConfig: function (name, value) {
		localStorage.setItem(name, JSON.stringify(value));
	},

	updateConfig: function (name, initValue, callback) {
		if ('undefined' == typeof app[name]) {
			app[name] = app.getConfig(name, initValue);
		}

		callback();

		app.setConfig(name, app[name]);
	},

	templateMapping: {
		division: {
			'.content_name': 'name',
			'.prevItemLink@href': utils.prevLink('division', 'href'),
			'.prevItemLink@class': utils.prevLink('division', 'class'),
			'.nextItemLink@href': utils.nextLink('division', 'href'),
			'.nextItemLink@class': utils.nextLink('division', 'class'),
		},
	},
}


$(document).ready(app.start);
