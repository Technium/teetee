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

if (!('console' in window)) {
	window.console = { log: function() {} };
}
if (!$dev) {
	console.log = function() {};
} else if ($dev >= 2) {
	console.log = function() {
		var args = $.Enumerable.From(arguments).Select("$.toString()").ToArray();
		var str = args.join(' ');
		$('div.console').append('<p>'+str+'</p>');
	};
}

tmpl = {
	nextLink: function (attr, items) {
		return tmpl.nextPrevLink(attr, 1, items);
	},
	prevLink: function (attr, items) {
		return tmpl.nextPrevLink(attr, -1, items);
	},

	nextPrevLink: function (attr, dir, items) {
		return function(a) {
			var valids;
			if (typeof items === "function") {
				valids = items(a);
			} else {
				valids = app.db[cls];
			}

			// Find the index of the current ID
			var id = a.context.obj.id;
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
			switch (attr) {
				case "href": return "#" + (bad ? "": a.context.obj_type+"/"+nextId);
				case "class": return bad ? "disabled" : "";
			}
		};
	},

	if: function($test, $value, $elseValue) {
		return function (ctx) {
			with (ctx) {
				return eval($test) ? $value : $elseValue;
			}
		};
	},

	lookup: function(type, id, options) {
		return function (a) {
			return tmpl.lookupAction(a, type, id, options);
		};
	},

	lookupAction: function(a, type, id, options) {
		return tmpl.itemsAction(a, type, id, options)[0];
	},

	items: function(type, value, options) {
		return function (a) {
			return tmpl.itemsAction(a, type, value, options);
		};
	},

	itemsAction: function (a, type, value, options) {
		if (!options) { options = {}; }
		if (!('key' in options)) { options.key = 'id'; }

		var all = $.Enumerable.From(app.db[type]);

		if ('where' in options) {
			with (a) {
				all = all.Where(function ($) { return eval(options.where); });
			}
		} else if (typeof value != "undefined" && value != null) {
			var actualValue = eval('a.'+value);
			all = all.Where(function(obj) { return obj[options.key] == actualValue; });
		}

		if ('sort' in options) {
			all = all.OrderBy("$."+options.sort);
		}
		if ('field' in options) {
			all = all.Select("$."+options.field);
		}
		return all.ToArray();
	},
};


app = {
	DATA_FILES: [ 'league', 'results', 'players', 'averages', 'fixtures' ],

	state: {
		awaitingHashReload: false,
	},

	start: function () {
		//~ app.start = new Date;
		app.random = Kybos();
		app.templateCache = {};
		app.lastHash = null;
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
				data.obj = data[type];
				data.obj_type = type;
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
			'aside ul.league > li': {
				'division<-db.division': {
					'a@href+': 'division.id',
					'a': 'division.name',
				},
			},
		},

		divisions: {
			'aside ul.league > li': {
				'division<-db.division': {
					'a@href+': 'division.id',
					'a': 'division.name',
				},
			},
			'content ul.league > li': {
				'division<-db.division': {
					'a@href+': 'division.id',
					'a': 'division.name',
				},
			},
		},

		clubs: {
			'content ul.clubs > li': {
				'club<-db.club': {
					'a@href+': 'club.id',
					'span.name': 'club.name',
				},
			},
			'aside ul.clubs > li': {
				'club<-db.club': {
					'a@href+': 'club.id',
					'a': 'club.shortName',
				},
			},
		},

		division: {
			'header .name': 'division.name',
			'.prevItemLink@href': tmpl.prevLink('href', tmpl.items('division')),
			'.prevItemLink@class': tmpl.prevLink('class', tmpl.items('division')),
			'.nextItemLink@href': tmpl.nextLink('href', tmpl.items('division')),
			'.nextItemLink@class': tmpl.nextLink('class', tmpl.items('division')),
			'table.standings tbody tr': {
				generator: tmpl.lookup('table', 'context.division.id', { key:'divisionId', field:'standings' }),
				'row<-generator': {
					'td.name a@href+': 'row.teamId',
					'td.name a': tmpl.lookup('team', 'item.teamId', { field:'name' }),
					'td.for': 'row.for',
					'td.agst': 'row.agst',
					'td.pld': 'row.pld',
					'td.won': 'row.won',
					'td.drwn': 'row.drwn',
					'td.lost': 'row.lost',
					'td.pts': 'row.pts',
				},
			},
			'table.averages tbody tr': {
				generator: tmpl.lookup("averages", 'context.division.id', { key:"divisionId", field:'players' }),
				'row<-generator': {
					'td.name': tmpl.lookup('player', 'item.playerId', { field:'name' }),
					'td.pct': function(a) {
						return (a.item.played==0)?'n/a':(100*(a.item.won/a.item.played)).toFixed(1);
					},
					'td.pld': 'row.played',
					'td.won': 'row.won',
				},
			},
			'table.fixtures tbody tr': {
				generator: tmpl.items('fixture', 'context.division.id', { sort:'matchDate', key:'divisionId' }),
				'fixture<-generator': {
					'td.matchDate': 'fixture.matchDate',
					'td.homeTeam a@href+': 'fixture.homeTeamId',
					'td.homeTeam a': tmpl.lookup('team', 'item.homeTeamId', { field: 'name' }),
					'td.awayTeam a@href+': 'fixture.awayTeamId',
					'td.awayTeam a': tmpl.lookup('team', 'item.awayTeamId', { field: 'name' }),
					'td.notes': function() { return ""; },
				},
			},
			'aside ul.league > li': {
				'division<-db.division': {
					'aside ul.league > li > a@href+': 'division.id',
					'aside ul.league > li > a': 'division.name',
					'aside ul.teams@style': tmpl.if("context.division.id != item.id", "display:none"),
					'aside ul.teams > li': {
						generator: tmpl.items('team', 'item.id', { key:'divisionId', sort:'order' }),
						'team<-generator': {
							'a@href+': 'team.id',
							'a': 'team.name',
						},
					},
				},
			},
		},

		club: {
			'header .name': 'club.name',
			'.prevItemLink@href': tmpl.prevLink('href', tmpl.items('club')),
			'.prevItemLink@class': tmpl.prevLink('class', tmpl.items('club')),
			'.nextItemLink@href': tmpl.nextLink('href', tmpl.items('club')),
			'.nextItemLink@class': tmpl.nextLink('class', tmpl.items('club')),
			'table.teams tr': {
				generator: tmpl.items('team', 'context.club.id', { key:'clubId', sort:'name' }),
				'team<-generator': {
					'a@href+': 'team.id',
					'span.name': 'team.name',
					'span.division': tmpl.lookup('division', 'item.divisionId', { field:'name' }),
				},
			},
			'aside ul.clubs > li': {
				'club<-db.club': {
					'a@href+': 'club.id',
					'a': 'club.shortName',
				},
			},
		},

		team: {
			'header .name': 'team.name',
			'.prevItemLink@href': tmpl.prevLink('href', tmpl.items('team', "context.team.divisionId", { key:"divisionId" })),
			'.prevItemLink@class': tmpl.prevLink('class', tmpl.items('team', "context.team.divisionId", { key:"divisionId" })),
			'.nextItemLink@href': tmpl.nextLink('href', tmpl.items('team', "context.team.divisionId", { key:"divisionId" })),
			'.nextItemLink@class': tmpl.nextLink('class', tmpl.items('team', "context.team.divisionId", { key:"divisionId" })),
			'table.fixtures tbody tr': {
				generator: tmpl.items('fixture', null, { sort:'matchDate', where:'$.homeTeamId == context.team.id || $.awayTeamId == context.team.id' }),
				'fixture<-generator': {
					'td.matchDate': 'fixture.matchDate',
					'td.homeTeam a@href+': 'fixture.homeTeamId',
					'td.homeTeam a': tmpl.lookup('team', 'item.homeTeamId', { field: 'name' }),
					'td.awayTeam a@href+': 'fixture.awayTeamId',
					'td.awayTeam a': tmpl.lookup('team', 'item.awayTeamId', { field: 'name' }),
					'td.notes': function() { return ""; },
				},
			},
			'table.averages tbody tr': {
				generator: function (a) {
					var playerAvgs = $.Enumerable.From(app.db.averages).First("$.divisionId == "+a.context.team.divisionId).players;
					var teamPlayers = $.Enumerable.From(app.db.player).Where("$.teamId == "+a.context.team.id);
					var teamAvgs = teamPlayers.Join(playerAvgs, "$.id", "$.playerId",
						"{ id: $.id, name: $.name, played: $$.played, won: $$.won }")
						.OrderByDescending("$.won / $.played");
					return teamAvgs.ToArray();
				},
				'row<-generator': {
					'td.name': "row.name",
					'td.pct': function(a) {
						return (a.item.played==0)?'n/a':(100*(a.item.won/a.item.played)).toFixed(1);
					},
					'td.pld': 'row.played',
					'td.won': 'row.won',
				},
			},
			'aside ul.league > li': {
				'division<-db.division': {
					'aside ul.league > li > a@href+': 'division.id',
					'aside ul.league > li > a': 'division.name',
					'aside ul.teams@style': tmpl.if("context.team.divisionId != item.id", "display:none"),
					'aside ul.teams > li': {
						generator: tmpl.items('team', 'item.id', { key:'divisionId', sort:'order' }),
						'team<-generator': {
							'a@href+': 'team.id',
							'a': 'team.name',
						},
					},
				},
			},
		},
	},
}

$(document).ready(app.start);
