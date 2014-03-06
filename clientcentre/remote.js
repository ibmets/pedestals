$(document).ready(function() {
     var ws;
     function connectWS() {
        //var path = location.hostname+":1880/pedestal-remote"
        var path = "ws://localhost:1880/pedestal-remote"
        ws = new WebSocket(path);
        ws.onopen = function() {
            console.log("Connected");
        }
        ws.onmessage = function(event) {
            var msg = JSON.parse(event.data);
            if (msg.page) {
                pauseKiosk();
                goTo(msg.page,msg.section||"");
            } else if (msg.cmd === "play") {
                startKiosk();
            } else if (msg.cmd === "pause") {
                pauseKiosk();
            }
        };
        ws.onclose = function() {
            setTimeout(connectWS,5000);
        }
    }
    connectWS();
});
