@echo off

rem This should be set to match the local test address
set URL=http://localhost:8080/joomla15

rem This is the name of the output directory, in the same place as this script
set OUTPUT=static

rem This should be changed to the full path of the httrack.exe (i.e. where you installed it)
set CMD=httrack.exe

rem You shouldn't have to touch anything else
rem ========================================================================================




rem Remove any old output
del /q /s /f %OUTPUT%

rem Grab a new copy of the whole site
%CMD% %URL% --path=%OUTPUT% --cache=0 -A9999999 -n -o0 -c100 -%c100 -r10 -R2 -O capture --index=0 -s0 -a

rem maybe --updatehack

echo.
echo Done.
pause
