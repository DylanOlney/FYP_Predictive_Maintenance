#! /bin/sh
sudo echo "Running Postman test suite in Newman (from Docker Image)!"
echo "Please wait, running application server API tests..."
sudo docker run --net=host -v  "$(pwd)"/tests:/etc/newman -t postman/newman run node.json 
echo "Application server API tests complete!"
echo "\nPress ENTER to continue to Flask server API tests..."
read input
echo "Please wait, running Flask server API tests..."
sudo docker run --net=host -v  "$(pwd)"/tests:/etc/newman -t postman/newman run flask.json 
echo "Flask server API tests complete!"
echo "\nPress ENTER to continue..."
read input













