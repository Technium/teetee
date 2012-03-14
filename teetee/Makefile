
DEFAULT: dev

watch:
	@compass watch

dev: clean
	@echo "\$$dev: 1;" > sass/_env.scss
	@compass compile -e development

prod: clean
	@echo "\$$dev: 0;" > sass/_env.scss
	@compass compile -e production

clean:
	@rm stylesheets/*

upload:
	scp -r *.js *.html images stylesheets data t220@t220.com:public_html/tt

data/%.json: data.in/%.js
	node -e 'fs=require("fs");fs.writeFileSync("$@", fs.readFileSync("$<", "utf8"))'
