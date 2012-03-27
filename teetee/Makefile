
.PHONY: dev prod clean upload data static

DEFAULT: dev

watch: dev data
	@compass watch

dev: data
	@echo "\$$dev: 1;" > sass/_env.scss
	@compass compile -e development

prod: data
	@echo "\$$dev: 0;" > sass/_env.scss
	@compass compile -e production

static:
	@mkdir -p capture
	@bash -c 'httrack http://localhost/teetee/index.html \
	    http://localhost/teetee/data/{averages,league,players,results}.json \
	    -o0 --purge-old= -O capture --index=0 -s0 -a --cache=1 --include-query-string'

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
	sh -c "t=`git log -1 --format=%at $<`;f=`python -c "from time import *;print strftime('%Y%m%d%H%M.%S',localtime($$t))"`;touch -t $$f $@"
