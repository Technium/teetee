
DEFAULT: dev

watch: dev DATA
	@compass watch

dev: clean DATA
	@echo "\$$dev: 1;" > sass/_env.scss
	@compass compile -e development

prod: clean DATA
	@echo "\$$dev: 0;" > sass/_env.scss
	@compass compile -e production

clean:
	@rm -f stylesheets/*.css
	@rm -f data/*.json

upload: DATA
	@scp -r *.js *.html images stylesheets data t220@t220.com:public_html/tt

DATA: data/results.json data/league.json data/averages.json data/players.json

data:
	mkdir -p data

data/%.json: data data.in/%.js
	@echo Stringifying $<
	@node -e 'fs=require("fs");fs.writeFileSync("$@", JSON.stringify(eval("d="+fs.readFileSync("$<", "utf8"))));' >/dev/null
