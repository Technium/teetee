@echo off

rem These should be set to match the local test address (i.e. http://localhost:8080/joomla15)
set PORT=8080
set HOST=localhost
set PATH=/joomla15

rem This is the name of the output directory, in the same place as this script
set OUTPUT=static

rem This should be changed to the full path of the httrack.exe
set CMD=httrack.exe

rem You should have to touch anything else

set URL=http://%HOST%:%PORT%%PATH%

rem Remove any old output
del /q /y %OUTPUT%

rem Grab a new copy of the whole site
%CMD% %URL% --path=%OUTPUT% --cache=0 -A9999999 -n -o0 -c100 -%c100 -r10 -R2 -O capture --index=0 -s0 -a

rem maybe --updatehack

echo.
echo Done.
pause
