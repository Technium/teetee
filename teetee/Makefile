
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
