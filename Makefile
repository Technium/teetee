
.PHONY: all css watch dev prod clean upload data static json

DATA_IN := $(shell find data -name '*.js')
DATA_OUT := $(DATA_IN:.js=.json)

all: data css

css: stylesheets/newlayout.css

stylesheets/newlayout.css: sass/newlayout.scss
	@compass compile -e production

watch: dev data
	@compass watch

dev:
	@echo Switching to development mode
	@echo "\$$dev: 1;" > sass/_env.scss

prod:
	@echo Switching to production mode
	@echo "\$$dev: 0;" > sass/_env.scss

static:
	@rm -rf capture
	@bash -c 'httrack http://localhost/teetee/index.html \
	    http://localhost/teetee/data/{averages,league,players,results,fixtures}.json \
	    --cache=0 -A9999999 -n -o0 -c100 -%c100 -r10 -O capture --index=0 -s0 -a --include-query-string -%P'

clean:
	@echo Cleaning output...
	@rm -f updates.json
	@rm -f data/*.json
	@rm -f stylesheets/*.css

upload: prod clean data css
	@echo Syncing...
	@rsync -rt --del index.html js/ images/ stylesheets/ $(DATA_OUT) updates.json .htaccess tt:public_html/tt

data: json updates.json

json: $(DATA_OUT)

updates.json: $(DATA_OUT)
	@echo Creating index...
	@python utils/update-index.py $(DATA_OUT) > $@

%.json: %.js
	@echo Stringifying $<
	@node -e 'fs=require("fs");fs.writeFileSync("$@", JSON.stringify(eval("d="+fs.readFileSync("$<", "utf8"))));' >/dev/null
