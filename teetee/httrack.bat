rem
PORT=8080
HOST=localhost
PATH=/

OUTPUT=static

CMD=httrack


%CMD http://%HOST:%PORT%PATH --mirror -c8
