
.PHONY: dev prod clean upload data static

DEFAULT: dev

DATA_FILES = $(shell find data.in -name '*.js')

watch: dev data
	@compass watch

dev: data
	@echo "\$$dev: 1;" > sass/_env.scss
	@compass compile -e development

prod: data
	@echo "\$$dev: 0;" > sass/_env.scss
	@compass compile -e production

static:
	@rm -rf capture
	@bash -c 'httrack http://localhost/teetee/index.html \
	    http://localhost/teetee/data/{averages,league,players,results}.json \
	    --cache=0 -A9999999 -o0 -c20 -%c1000 --quiet -r10 -O capture --index=0 -s0 -a --include-query-string'

clean:
	@rm -f stylesheets/*.css
	@rm -f data/*.json

upload: prod data
	@scp -rp *.js *.html images stylesheets data t220@t220.com:public_html/tt

data: data/results.json data/league.json data/averages.json data/players.json

data/%.json: data.in/%.js
	@echo Stringifying $<
	@mkdir -p data
	@node -e 'fs=require("fs");fs.writeFileSync("$@", JSON.stringify(eval("d="+fs.readFileSync("$<", "utf8"))));' >/dev/null
	@touch -t $$(python -c "from time import *;print strftime('%Y%m%d%H%M.%S',localtime($$(git log -1 --format=%at $<)))") $@
