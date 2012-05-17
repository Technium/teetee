
.PHONY: all css js watch dev prod clean upload data static json

DATA_IN := $(shell find data -name '*.js')
DATA_OUT := $(DATA_IN:.js=.json)

JS_IN := js/modernizr.js js/date-en-GB.js js/Kybos.js \
	js/jquery-1.7.1.min.js js/jquery.linq.min.js js/jquery.ba-hashchange.min.js \
	js/pure.js js/app.js
#$(shell find js -name '*.js')
JS_OUT := $(JS_IN:js/%.js=js-min/%.js)

all: data css js

css: stylesheets/newlayout.css

js: teetee.js


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
	@rm -rf js-min teetee.js
	@rm -f data/*.json updates.json
	@rm -f stylesheets/*.css

upload: prod clean all
	@echo Syncing...
	@rsync -rt --del --exclude 'data/*.js' index.html updates.json teetee.js .htaccess js images stylesheets data tt:public_html/tt

teetee.js: $(JS_OUT)
	@echo Merging into $@...
	@cat $(JS_OUT) > $@

js-min/%.js: js/%.js
	@mkdir -p js-min
	@echo Compressing $<...
	@uglifyjs -nc --unsafe --lift-vars $< > $@

#	@java -jar utils/yuicompressor-2.4.7.jar --nomunge --preserve-semi --disable-optimizations $< -o $@

data: json updates.json

json: $(DATA_OUT)

updates.json: $(DATA_OUT) utils/update-index.py
	@echo Creating data index...
	@python utils/update-index.py $(DATA_OUT) > $@

%.json: %.js
	@echo Stringifying $<
	@node -e 'fs=require("fs");fs.writeFileSync("$@", JSON.stringify(eval("d="+fs.readFileSync("$<", "utf8"))));' >/dev/null
