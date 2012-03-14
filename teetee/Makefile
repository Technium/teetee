
DEFAULT: dev

watch:
	@compass watch

dev: clean data
	@echo "\$$dev: 1;" > sass/_env.scss
	@compass compile -e development

prod: clean data
	@echo "\$$dev: 0;" > sass/_env.scss
	@compass compile -e production

clean:
	@rm stylesheets/*.css
	@rm data/*.json

upload:
	scp -r *.js *.html images stylesheets data t220@t220.com:public_html/tt

data: data/results.json data/league.json

data/%.json: data.in/%.js
	node -e 'fs=require("fs");fs.writeFileSync("$@", JSON.stringify(fs.readFileSync("$<", "utf8")))'
