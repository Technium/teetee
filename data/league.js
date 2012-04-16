{
	_version: 1,
	team: [
		{ id: 1,  divisionId: 1, order: 1, name: 'Kingfisher A',			clubId: 2, homeNight: 'Thursday' },
		{ id: 2,  divisionId: 1, order: 2, name: 'Kingfisher B',			clubId: 2, homeNight: 'Thursday' },
		{ id: 3,  divisionId: 1, order: 3, name: 'Kingfisher C',			clubId: 2, homeNight: 'Thursday' },
		{ id: 4,  divisionId: 1, order: 4, name: 'Nomads A',				clubId: 3, homeNight: 'Monday' },
		{ id: 5,  divisionId: 1, order: 5, name: 'Nomads B',				clubId: 3, homeNight: 'Wednesday' },
		{ id: 6,  divisionId: 1, order: 6, name: 'Wokingham A',				clubId: 6, homeNight: 'Monday' },
		{ id: 7,  divisionId: 1, order: 7, name: 'OLOP A',					clubId: 4, homeNight: 'Thursday' },
		{ id: 8,  divisionId: 1, order: 8, name: 'Wokingham B',				clubId: 6, homeNight: 'Monday' },
		{ id: 9,  divisionId: 2, order: 1, name: 'OLOP B',					clubId: 4, homeNight: 'Monday' },
		{ id: 10, divisionId: 2, order: 2, name: 'Wokingham C',				clubId: 6, homeNight: 'Monday' },
		{ id: 11, divisionId: 2, order: 3, name: 'OLOP C',					clubId: 4, homeNight: 'Tuesday' },
		{ id: 12, divisionId: 2, order: 4, name: 'Broadmoor A',				clubId: 1, homeNight: 'Wednesday' },
		{ id: 13, divisionId: 2, order: 5, name: 'Broadmoor B',				clubId: 1, homeNight: 'Wednesday' },
		{ id: 15, divisionId: 2, order: 6, name: 'Wokingham Methodists A',	clubId: 7, homeNight: 'Thursday' },
		{ id: 16, divisionId: 2, order: 7, name: 'Kingfisher D',			clubId: 2, homeNight: 'Thursday' },
		{ id: 19, divisionId: 2, order: 8, name: 'WAMDSAD A',				clubId: 5, homeNight: 'Thursday' },
		{ id: 14, divisionId: 3, order: 1, name: 'Wokingham D',				clubId: 6, homeNight: 'Wednesday' },
		{ id: 17, divisionId: 3, order: 2, name: 'Nomads C',				clubId: 3, homeNight: 'Wednesday' },
		{ id: 20, divisionId: 3, order: 3, name: 'WAMDSAD B',				clubId: 5, homeNight: 'Thursday' },
		{ id: 21, divisionId: 3, order: 4, name: 'WAMDSAD C',				clubId: 5, homeNight: 'Thursday' },
		{ id: 22, divisionId: 3, order: 5, name: 'Broadmoor C',				clubId: 1, homeNight: 'Thursday' },
		{ id: 23, divisionId: 3, order: 6, name: 'Kingfisher E',			clubId: 2, homeNight: 'Thursday' },
		{ id: 24, divisionId: 3, order: 7, name: 'Wokingham Methodists B',	clubId: 7, homeNight: 'Thursday' },
	],

	division: [
		{ id: 1, order: 0, leagueId: 0, name: 'Premier Division',	shortName: 'Premier' },
		{ id: 2, order: 1, leagueId: 0, name: 'Division 1',			shortName: 'Div 1' },
		{ id: 3, order: 2, leagueId: 0, name: 'Division 2',			shortName: 'Div 2' },
	],

	club: [
		{ id: 1, leagueId: 0, name: 'Broadmoor Staff T.T.C',			shortName: 'Broadmoor' },
		{ id: 2, leagueId: 0, name: 'Kingfisher T.T.C',				shortName: 'Kingfisher' },
		{ id: 3, leagueId: 0, name: 'Nomads T.T.C',					shortName: 'Nomads' },
		{ id: 4, leagueId: 0, name: 'OLOP (Impact) T.T.C',			shortName: 'OLOP' },
		{ id: 5, leagueId: 0, name: 'WAMDSAD T.T.C',					shortName: 'WAMDSAD' },
		{ id: 6, leagueId: 0, name: 'Wokingham T.T.C',				shortName: 'Wokingham' },
		{ id: 7, leagueId: 0, name: 'Wokingham Methodist Church',	shortName: 'Wokingham Meths' },
	],

	location: [
		{
			id: 0,
			clubId: 4,
			address: 'Our Lady of Peace Community Centre, 338 Wokingham Road, Reading, Earley, Reading, RG6 7DA',
			tel: '0118 9352927',
			directions: "<p>From Wokingham take the A329 towards Reading.</p><p>Some 80 yards before the Three Tuns traffic lights, turn left into Aldbourne Ave, then immediately right into church car park. Playing area within the Our Lady of Peace Community Centre.</p>",
			latlong: "51.441637, -0.92982",
		}
	],
}
