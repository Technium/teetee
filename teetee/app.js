/*
 * TODO
 *
 * Common template framework for all pages - pass in (db, type, id, subtype)?
 *  - ALL of the pages are templates? would clean up DOM a bit...
 *  - access to results, etc, all are easier
 * Loading animation during template compilation/rending?
 * Do prev/next for divisions and clubs, don't for teams
 * Left menu list - always there? always divisions?        STATIC - templated
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

// magic logging
log = $dev ? function() { console.log.apply(console, arguments); } : function() {};

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

	lookupItem: function(type, id) {
		return $.Enumerable.From(app.db[type]).First("$.id=="+id);
	},
};


app = {
	DATA_FILES: [ 'league', 'results', 'players', 'averages' ],

	state: {
		awaitingHashReload: false,
	},

	start: function () {
<<<<<<< HEAD
		console.log("started");
=======
		log("started");
>>>>>>> steves_stuff
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
		//~ $(window).hashchange(app.hashChange);
		$(window).bind("hashchange", app.hashChange);
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
				log("changed!");
				app.rebuildDatabase();
			} else {
				log("not changed :(");
			}
		}
	},

	rebuildDatabase: function () {
		log("rebuild");
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
		log("update state = "+state, (new Date).getTime() - app.start);
		$('.update .notice').attr('class', 'notice '+state);
	},

	fetchData: function (name, force) {
		log("fetching",name);
		var lastFetchTime = new Date(app.updateTimes[name] || 0);
		if (force) lastFetchTime = 0;
		var url = 'data/'+name+'.json';
		var req = $.ajax(url, {
			headers: { 'If-Modified-Since': lastFetchTime.toGMTString() },
			dataType: 'json',
			ifModified: true,
		});
		req.success(function (data, status) { app.dataFetched(name, data, req, status); });
		req.error(function (obj, err, msg) { app.dataFetchFailed(name); })
	},

	dataFetchFailed: function (name) {
		log("fetch failed for",name);
		app.fetches.pending -= 1;
		app.fetches.fail = true;

		if (app.fetches.pending == 0) { app.updateFinished(); }
	},

	dataFetched: function (name, data, req, status) {
		if (status == "notmodified") {
			log("fetch notmodified for ",name);
		} else {
			log("fetch done for",name);

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
		var target, slide = 0;
		var newHash = window.location.hash || "#main";

		log('hash change', newHash);
		if (app.lastHash == newHash) { return; }

		var bits = newHash.substring(1).split('/');
		if (bits.length == 1) {
			var type = bits[0];
			target = app.instantiateTemplate(type, null, {});
			//~ target = $('.articles .'+bits[0]);
		} else if (bits.length == 2) {
			var type = bits[0];
			var id = parseInt(bits[1]);
			if (type in app.db) {
				var data = $.Enumerable.From(app.db[type]).Where("$.id == "+id).First();
				target = app.instantiateTemplate(type, id, data);

				// If the last hash was also a division, do fancy transitions
				if (app.lastHash && app.lastHash.search('#'+type+'/') != -1) {
					var lastId = parseInt(app.lastHash.split('/')[1]);
					slide = (id < lastId) ? 1 : -1;
				}
			}
		}

		var visibles = $('.articles > article:visible');
		if (!target || !target.length) {
			target = app.instantiateTemplate('notfound', null, {});
			if (!target) { target = $('.articles .notfound-basic'); }
		}

<<<<<<< HEAD
		if (slide != 0) {
			if (Modernizr.csstransitions && navigator.userAgent.search("Windows Phone OS 7")==-1) {
=======
		if (slide != 0 &&
			Modernizr.csstransitions &&
			navigator.userAgent.search("Windows Phone OS 7")==-1) {
>>>>>>> steves_stuff
				app.switchItems(visibles, target,
					(slide > 0)? 'offRight' : 'offLeft',
					(slide > 0)? 'offLeft' : 'offRight', transitionDuration);
		} else {
			visibles.fadeOut('fast');
			target.fadeIn('fast');
		}

		app.lastHash = newHash;
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	},

	instantiateTemplate: function (type, id, data) {
		var ele = $('section.articles article[id="'+type+'/'+id+'"]').first();
		if (ele.length == 0) {
			// Compile the template
			if (!(type in app.templateCache)) {
				var tmpl = $('section.templates .'+type);
				if (!tmpl.length) { return null; }
				app.templateCache[type] = tmpl.compile(app.templateMapping[type]);;
			}

			// Instantiate it for this data
			//var data = app.db[type][id];
			switch (type) {
				case "division": {
					data.standings = ((app.db.table || {})[id] || {standings: []}).standings;
					data.averages = (app.db.averages || {})[id] || [];
				};
			};
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
		log(name, addValue);

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
			'table.standings tbody tr': {
				'row<-standings': {
					'td.name': function(a) { return utils.lookupItem('team', a.item.teamId).name; },
					//	var teams = a.context.teams;
					//	return $.Enumerable.From(teams).First("$.id=="+a.item.teamId).name;
					//},
					'td.for': 'row.for',
					'td.agst': 'row.agst',
					'td.pld': 'row.pld',
					'td.won': 'row.won',
					'td.drwn': 'row.drwn',
					'td.lost': 'row.lost',
					'td.pts': 'row.pts',
				}
			},
			'table.averages tbody tr': {
				'row<-averages.players': {
					'td.name': function(a) {
						return utils.lookupItem('player', a.item.playerId).name; },
					'td.pct': function(a) {
						return (a.item.played==0)?'n/a':(100*(a.item.won/a.item.played)).toFixed(1); },
					'td.pld': 'row.played',
					'td.won': 'row.won',
				}
			},
		},
	},
}


$(document).ready(app.start);
