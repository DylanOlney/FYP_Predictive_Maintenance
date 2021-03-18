

var intervalId = 0;
const interval = 1000; // Poll very second.


listener = (e) => {
    if (e.data !=='stopPolling') {
        intervalID = setInterval(() => {request(e.data)}, interval);  
        this.console.log("Polling started!\nInterval = " + interval + "ms. " + "IntervalID = " +  intervalID ); 
    }
    else {
        clearInterval(intervalID);
        intervalID = 0;
        this.console.log('Polling stopped!');
    }
}

request = (data) => {
    var req = new XMLHttpRequest();
    req.onload = () => {postMessage(req.responseText);}
    //req.addEventListener('load', () => {postMessage(req.responseText);});
    req.open('POST', "/flask/getMostRecent", true);   
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    req.send(JSON.stringify(data));
};

addEventListener('message', listener, false);
 
 



