/*
 * TODO
 *
 * Common data context for all templates - pass in (db, type, id, subtype)?
 * Loading animation during template compilation/rending?
 * Do prev/next for divisions and clubs, don't for teams
 * Left menu list
 * 	* Context sensitive - clubs mode, league mode
 *
 * Save stats on a timer?
 *
 * Split app.js
 * Compile with yui
 * Rearrange make system to make new copy for release
 */

$dev = 1;
transitionDuration = 500;

userConfigDefaults = {
	maxDataAge: 4,
};

if (!$dev) { console.log = function() {}; }

utils = {
	nextPrevLink: function (cls, type, dir, itemsFn) {
		return function(a) {
			var valids;
			if (itemsFn) {
				valids = itemsFn(a);
			} else {
				valids = app.db[cls];
			}

			// Find the index of the current ID
			var id = a.context[cls].id;
			var i;
			for (i=0; i<valids.length; i++) {
				if (valids[i].id == id) {
					break;
				}
			}

			// Shift it, then check it's good
			i += (dir || +1);
			var bad = (i < 0 || i >= valids.length);

			// Fetch the next ID (if valid)
			var nextId;
			if (!bad) { nextId = valids[i].id; }

			// Act based on what the user asked for
			switch (type) {
				case "href": return "#" + (bad ? "": cls+"/"+nextId);
				case "class": return bad ? "disabled" : "";
			}
		};
	},

	lookupItems: function(type, matchValue, matchField, sortField) {
		return function (a) {
			var actualMatchValue = eval('a.'+matchValue);
			var all = $.Enumerable.From(app.db[type])
				.Where(function(obj) { return obj[matchField] == actualMatchValue; });
			if (sortBy) {
				all = all.OrderBy("$."+sortBy);
			}
			return all.ToArray();
		}
	},

	lookupItem: function(type, id, idField, subField) {
		return function (a) {
			idField = idField || "id";
			var actualId = eval('a.'+id);
			var result = $.Enumerable.From(app.db[type]).First("$."+idField+"=="+actualId);
			if (subField) { result = result[subField]; }
			return result;
		}
	},
};


app = {
	DATA_FILES: [ 'league', 'results', 'players', 'averages' ],

	state: {
		awaitingHashReload: false,
	},

	start: function () {
		//~ app.start = new Date;
		app.random = Kybos();
		app.templateCache = {};
		app.dbParts = app.getConfig('dbParts', {});
		app.stats = app.getConfig('stats', {});
		app.userConfig = app.getConfig('userConfig', {});
		app.updateTimes = app.getConfig('updateTimes', {});
		app.lastGoodUpdate = app.getConfig('lastGoodUpdate', null);

		/* Update stuff */
		app.checkIfUpdatesRequired();
		app.displayUpdateDate();
		app.rebuildDatabase(); // Uses cached data

		/* Location/back-stack stuff */
		$(window).bind("hashchange", app.hashChange);
		$('section.articles').on('click', 'a.disabled', false);

		/* Stats stuff */
		app.initStats();
		app.updateStat('loaded', 1);
	},

	initStats: function () {
		if ("undefined" == typeof app.stats.id) {
			app.stats.id = app.random.uint32().toString(16) + app.random.uint32().toString(16);
		}
	},

	checkIfUpdatesRequired: function () {
		var when = new Date(app.lastGoodUpdate || 0);
		var maxAge = app.userConfig.maxDataAge || userConfigDefaults.maxDataAge;

		if (when < new Date().add(-app.maxDataAge).day()) {
			console.log("update required, triggering check");
			app.updateRequired = true;
			setTimeout(app.checkForUpdates, 25);
		} else {
			console.log("update not required");
			app.updateRequired = false;
		}
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
			app.lastGoodUpdate = +new Date();
			app.setConfig('lastGoodUpdate', app.lastGoodUpdate);
			app.updateStat('updateCompleted', 1);
			app.markUpdateState('okay');
			if (app.fetches.changes) {
				console.log("update found changes!");
				app.rebuildDatabase();
			} else {
				console.log("update complete - nothing changed");
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

		app.triggerHashChange(true);
	},

	triggerHashChange: function (force) {
		if (app.state.awaitingHashReload) { return; }

		app.state.awaitingHashReload = true;
		if (force) {
			app.lastHash = null;
		}
		setTimeout(function () {
			if (app.state.awaitingHashReload) {
				app.hashChange();
			}
		}, 10);
	},

	displayUpdateDate: function () {
		var q = $.Enumerable.From(app.updateTimes).Select("$.Value");
		var dateField = $('.update .status .date');
		if (q.Any()) {
			var when = new Date(q.Max());
			dateField.text(when.toString('d'));
		} else {
			dateField.text('n/a');
		}

		dateField.removeClass('good bad');
		dateField.addClass(app.updateRequired ? 'bad' : 'good');

		//~ if ($dev) app.updateRequired = true;
	},

	markUpdateState: function (state) {
		//~ console.log("update state = "+state, (new Date).getTime() - app.start);
		$('.update .notice').attr('class', 'notice '+state);
	},

	fetchData: function (name, force) {
		console.log("fetching",name);
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
		app.state.awaitingHashReload = false;

		var target, slide = 0;
		var newHash = window.location.hash || "#main";

		console.log('hash change:', newHash);
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

		if (slide != 0 &&
			Modernizr.csstransitions &&
			navigator.userAgent.search("Windows Phone OS 7")==-1) {
				app.switchItems(visibles, target,
					(slide > 0)? 'offRight' : 'offLeft',
					(slide > 0)? 'offLeft' : 'offRight', transitionDuration);
		} else {
			visibles.fadeOut('fast');
			target.fadeIn('fast');
		}

		app.lastHash = newHash;
		if (evt) {
			evt.preventDefault();
			evt.stopPropagation();
		}
		return false;
	},

	instantiateTemplate: function (type, id) {
		var name = type;
		if (typeof id === "number" || typeof id === "string") {
			name += "/"+id;
		}

		// Check for a cached instance
		var ele = $('section.articles > article[id="'+name+'"]').first();
		if (ele.length) { return ele; }

		// Prepare the data
		var data = { db: app.db };
		if (typeof id != "undefined") {
			var store = app.db[type];
			if (store) {
				data[type] = $.Enumerable.From(store).Where("$.id == "+id).First();
			}
			if (!data[type]) { console.log("item '"+name+"' not found for instantiation"); }
		}

		// Compile the template
		if (!(type in app.templateCache)) {
			var tmpl = $('section.templates > article.'+type);
			if (!tmpl.length) {
				console.log("template '"+name+"' does not exist");
				return null;
			}
			console.log("compiling:",type);
			app.templateCache[type] = tmpl.compile(app.templateMapping[type]);;
		}

		// Instantiate it for this data
		console.log("instantiating:",name);
		ele = $(app.templateCache[type](data))
			.addClass(type).addClass('generated')
			.attr('id', name).appendTo($('section.articles'));

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

		app.updateConfig('stats', {}, function () {
			result = app.stats[name] = (app.stats[name] || initValue) + addValue;
		});

		console.log('stat:', name, result);

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
		main: {
			'ul.divisions li': {
				'division<-db.division': {
					'a@href+': 'division.id',
					'a': 'division.name',
				},
			},
		},
		divisions: {
			'ul.divisions li': {
				'division<-db.division': {
					'a@href+': 'division.id',
					'a': 'division.name',
				},
			},
		},
		clubs: {
			'ul.clubs li': {
				'club<-db.club': {
					'a@href+': 'club.id',
					'span.name': 'club.name',
				},
			},
			'ul.clubs-aside li': {
				'club<-db.club': {
					'a@href+': 'club.id',
					'a': 'club.shortName',
				},
			},
		},
		division: {
			'header .name': 'division.name',
			'.prevItemLink@href': utils.nextPrevLink('division', 'href', -1),
			'.prevItemLink@class': utils.nextPrevLink('division', 'class', -1),
			'.nextItemLink@href': utils.nextPrevLink('division', 'href', 1),
			'.nextItemLink@class': utils.nextPrevLink('division', 'class', 1),
			'ul.divisions li': {
				'division<-db.division': {
					'a@href+': 'division.id',
					'a': 'division.name',
				},
			},
			'table.standings tbody tr': {
				'row<-generator': {
					'td.name a@href+': 'row.teamId',
					'td.name a': utils.lookupItem('team', 'item.teamId', null, 'name'),
					'td.for': 'row.for',
					'td.agst': 'row.agst',
					'td.pld': 'row.pld',
					'td.won': 'row.won',
					'td.drwn': 'row.drwn',
					'td.lost': 'row.lost',
					'td.pts': 'row.pts',
				},
				generator: utils.lookupItem('table', 'context.division.id', null, 'standings'),
			},
			'table.averages tbody tr': {
				'row<-generator': {
					'td.name': utils.lookupItem('player', 'item.playerId', null, 'name'),
					'td.pct': function(a) {
						return (a.item.played==0)?'n/a':(100*(a.item.won/a.item.played)).toFixed(1);
					},
					'td.pld': 'row.played',
					'td.won': 'row.won',
				},
				generator: utils.lookupItem("averages", 'context.division.id', "divisionId", 'players'),
			},
		},
		club: {
			'.name': 'club.name',
			'.prevItemLink@href': utils.nextPrevLink('club', 'href', -1),
			'.prevItemLink@class': utils.nextPrevLink('club', 'class', -1),
			'.nextItemLink@href': utils.nextPrevLink('club', 'href', 1),
			'.nextItemLink@class': utils.nextPrevLink('club', 'class', 1),
			'ul.clubs-aside li': {
				'club<-db.club': {
					'a@href+': 'club.id',
					'a': 'club.shortName',
				},
			},
			'table.teams tr': {
				'team<-generator': {
					'a@href+': 'team.id',
					'span.name': 'team.name',
					'span.division': utils.lookupItem('division', 'item.divisionId', null, 'name'),
				},
				generator: utils.lookupItems('team', 'context.club.id', 'clubId'),
				//~ function (arg) {
					//~ return $.Enumerable.From(app.db.team).Where("$.clubId == "+arg.context.club.id).ToArray();
				//~ },
			},
		},
	},
}


//~ $(document).ready(app.start);
$(window).load(app.start);
