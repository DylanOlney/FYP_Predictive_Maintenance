@echo off
echo Running Postman test suite in Newman (from Docker Image)!
echo Please wait, running application server API tests...
docker run --net=host -v  "%~dp0/tests":/etc/newman -t postman/newman run node.json 
echo Application server API tests complete!
pause
echo Please wait, running Flask server API tests...
docker run --net=host -v  "%~dp0/tests":/etc/newman -t postman/newman run flask.json 
echo Flask server API tests complete!
pause












