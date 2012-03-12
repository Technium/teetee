
files = [
	{ name: 'clubs', tableIndex: 2 },
	{ name: 'divisions', tableIndex: 3 },
	{ name: 'tournament', tableIndex: 4 },
	{ name: 'teams', tableIndex: 5 },
	{ name: 'fix_results', tableIndex: 6 },
	{ name: 'fix_players', tableIndex: 7 },
]

function csvToJson () {
	var message = "";
	var error = false;
	var f = document.forms["convertForm"];
	var csvText = f.elements["csv"].value;
	var jsonText = "";

	if (csvText == "") { error = true; message = "Enter CSV text below."; }

	if (!error) {
		csvRows = csvText.split(/[\r\n]/g); // split into rows

		// get rid of empty rows
		for (var i = 0; i < csvRows.length; i++)
		{
			if (csvRows[i].replace(/^[\s]*|[\s]*$/g, '') == "")
			{
				csvRows.splice(i, 1);
				i--;
			}
		}

		if (csvRows.length < 2) {
			error = true; message = "The CSV text MUST have a header row!";
		} else {
			objArr = [];

			for (var i = 0; i < csvRows.length; i++) {
				csvRows[i] = parseCSVLine(csvRows[i]);
			}

			for (var i = 1; i < csvRows.length; i++) {
				if (csvRows[i].length > 0) objArr.push({});

				for (var j = 0; j < csvRows[i].length; j++) {
					objArr[i - 1][csvRows[0][j]] = csvRows[i][j];
				}
			}

			jsonText = JSON.stringify(objArr, null, "\t");
			f.elements["json"].value = jsonText;
			message = getBenchmarkResults();
		}
	}

	setMessage(message, error);
}


