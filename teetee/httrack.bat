rem These should be set to match the local test address (i.e. http://localhost:8080/)
set PORT=8080
set HOST=localhost
set PATH=/

rem This is the name of the output directory, in the same place as this script
set OUTPUT=static

rem This should be changed to the full path of the httrack.exe
set CMD=httrack.exe

rem You should have to touch anything else

set URL=http://%HOST%:%PORT%%PATH%

rem Remove any old output
del /q /y %OUTPUT%

rem Grab a new copy of the whole site
%CMD% %URL% --path=%OUTPUT% --depth=20 --sockets=10 --retries=2 --display --index=0 --cache=0

rem maybe --updatehack

echo.
echo Done.
pause
