
DEFAULT: dev

watch: dev data
	@compass watch

dev: data
	@echo "\$$dev: 1;" > sass/_env.scss
	@compass compile -e development

prod: data
	@echo "\$$dev: 0;" > sass/_env.scss
	@compass compile -e production

clean:
	@rm -f stylesheets/*.css
	@rm -f data/*.json

upload: data
	@scp -r *.js *.html images stylesheets data t220@t220.com:public_html/tt

data: data/results.json data/league.json data/averages.json data/players.json

data/%.json: data.in/%.js
	@echo Stringifying $<
	@mkdir -p data
	@node -e 'fs=require("fs");fs.writeFileSync("$@", JSON.stringify(eval("d="+fs.readFileSync("$<", "utf8"))));' >/dev/null
