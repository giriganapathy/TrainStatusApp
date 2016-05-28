/*-----------------------------------------------------------------------------
This is a sample bot.

@author: giriganapathy
@since: May 26, 2016 01:32 PM
-----------------------------------------------------------------------------*/
var restify = require("restify");
var builder = require("botbuilder");
var model = process.env.model || "https://api.projectoxford.ai/luis/v1/application?id=83b0d263-bcb7-4ded-b197-95b25ee68030&subscription-key=b27a7109bc1046fb9cc7cfa874e3f819&q=";

var helpInfo = {
    helpMessage: "Here's what you can check with me:\n\n" +
    "* Status of pnr <pnr-number>\n" +
    "* Status of train <train-number>\n"
};

var dialog = new builder.LuisDialog(model);
var bot = new builder.BotConnectorBot(); //new builder.TextBot();
bot.add("/", dialog);
bot.configure({
    userWelcomeMessage: helpInfo.helpMessage,
    goodbyeMessage: "Goodbye..."
});

dialog.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));

dialog.onBegin(function (session, args, next) {
    if (!session.userData.firstRun) {
        // Send the user through the first run experience
        session.userData.firstRun = true;
        session.send(helpInfo.helpMessage);
        session.beginDialog('/');        
    } else {
        next();
    }
});

dialog.on("intent.doj", [
    function (session, args) {
        if (!session.userData.trainNumber) {
            session.endDialog("Please provide the train number...");
            return;
        }
        var time = builder.EntityRecognizer.resolveTime(args.entities, "builtin.datetime.date");
        if (null == time) {
            session.endDialog("I dont understand your details..Please provide the date of journey again...?");
            return;
        }
        else {
            var month = (time.getMonth() + 1) < 10 ? ("0" + (time.getMonth() + 1)) : (time.getMonth() + 1);
            var dt = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();
            session.userData.doj = time.getFullYear() + "" + month + "" + dt;

            var key = "embct6154";

            var Client = require('node-rest-client').Client;
            var client = new Client();
            // set content-type header and data as json in args parameter 
            var options = {
                headers: { "Content-Type": "application/json" }
            };

            var req = client.get("http://api.railwayapi.com/live/train/" + session.userData.trainNumber + "/doj/" + session.userData.doj + "/apikey/" + key + "/", options, function (data, response) {
                // parsed response body as js object 
                if (data) {
                    var stationInfo = "";
                    //session.send(data["response_code"]);
                    var routes = data["route"];
                    if (null != routes) {

                        stationInfo = stationInfo + "Point | Station | Arr. | Dep. | Date\n";
                        stationInfo = stationInfo + "------------ | ------------- | -------------| -------------| -------------\n";

                        for (var idx = 0; idx < routes.length; idx++) {
                            var route = routes[idx];
                            stationInfo = stationInfo + route["no"] + "|" + route["station_"]["name"] + "|" + route["actarr"] + "|" + route["actdep"] + "|" + route["actarr_date"] + "\n";
                        }
                        stationInfo = stationInfo + data["position"];
                    }
                    session.send(stationInfo);
                    delete session.userData.trainNumber;
                }
                else {
                    session.send("Sorry! Information not available...");
                    delete session.userData.pnrNumber;
                    delete session.userData.trainNumber;
                }
            });
            req.on("error", function (err) {
                session.send("Error:" + err);
                delete session.userData.trainNumber;
            });
        }
    }
]);

dialog.on("intent.train.enquiry", [
    function (session, args) {
        delete session.userData.trainNumber;
        var entity = builder.EntityRecognizer.findEntity(args.entities, 'train-number');
        if (null != entity) {
            var trainNumber = entity.entity;
            if (null != trainNumber) {
                session.userData.trainNumber = trainNumber;
                builder.Prompts.text(session, "Can i have the date of journey...?");
            }
        }
    },
    function (session, results, next) {
        if (results.response) {            
            var modelUri = process.env.model || "https://api.projectoxford.ai/luis/v1/application?id=83b0d263-bcb7-4ded-b197-95b25ee68030&subscription-key=b27a7109bc1046fb9cc7cfa874e3f819";
            builder.LuisDialog.recognize(results.response, modelUri, function (err, intents, entities) {                
                if (null != err) {
                    session.endDialog("Unexpected error while parsing your answer. Try again!");
                    return;
                }                 
                var time = builder.EntityRecognizer.resolveTime(entities, "builtin.datetime.date");
                if (null == time) {
                    session.endDialog("I dont understand your details..Please provide the date of journey again...?");
                    return;
                }
                else {
                    var month = (time.getMonth() + 1) < 10 ? ("0" + (time.getMonth() + 1)) : (time.getMonth() + 1);
                    var dt = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();
                    session.userData.doj = time.getFullYear() + "" + month + "" + dt;

                    var key = "embct6154";

                    var Client = require('node-rest-client').Client;
                    var client = new Client();
                    // set content-type header and data as json in args parameter 
                    var options = {
                        headers: { "Content-Type": "application/json" }
                    };

                    var req = client.get("http://api.railwayapi.com/live/train/" + session.userData.trainNumber + "/doj/" + session.userData.doj + "/apikey/" + key + "/", options, function (data, response) {
                        // parsed response body as js object 
                        if (data) {
                            var stationInfo = "";
                            //session.send(data["response_code"]);
                            var routes = data["route"];
                            if (null != routes) {

                                stationInfo = stationInfo + "Point | Station | Arr. | Dep. | Date\n";
                                stationInfo = stationInfo + "------------ | ------------- | -------------| -------------| -------------\n";

                                for (var idx = 0; idx < routes.length; idx++) {
                                    var route = routes[idx];
                                    stationInfo = stationInfo + route["no"] + "|" + route["station_"]["name"] + "|" + route["actarr"] + "|" + route["actdep"] + "|" + route["actarr_date"] + "\n";
                                }
                                stationInfo = stationInfo + data["position"];
                            }
                            session.send(stationInfo);
                            delete session.userData.trainNumber;
                        }
                        else {
                            session.send("Sorry! Information not available...");
                            delete session.userData.pnrNumber;
                            delete session.userData.trainNumber;
                        }
                    });
                    req.on("error", function (err) {
                        session.send("Error:" + err);
                        delete session.userData.pnrNumber;
                        delete session.userData.trainNumber;
                    });

                }
            });
        }
        else {


        }
    }
]);

dialog.on("intent.pnr.enquiry", [
    function (session, args) {
        var key = "embct6154";
        var entity = builder.EntityRecognizer.findEntity(args.entities, 'pnr-number');
        if (null != entity) {
            var pnrNumber = entity.entity;
            if (null != pnrNumber) {
                session.userData.pnrNumber = pnrNumber;
                var Client = require('node-rest-client').Client;
                var client = new Client();
                // set content-type header and data as json in args parameter 
                var options = {
                    headers: { "Content-Type": "application/json" }
                };

                var req = client.get("http://api.railwayapi.com/pnr_status/pnr/" + session.userData.pnrNumber + "/apikey/" + key + "/", options, function (data, response) {
                    // parsed response body as js object 
                    //session.send("http://api.railwayapi.com/pnr_status/pnr/" + session.userData.pnrNumber + "/apikey/" + key + "\nResponse:" + response + "\nData:" + data);
                    if (data) {
                        //session.send(data["response_code"]);
                        var resultInfo = "Train Name | From | To. | Date of Journey\n";
                        resultInfo = resultInfo + "------------ | ------------- | -------------| -------------\n";
                        resultInfo = resultInfo + data["train_name"] + "|" + data["from_station"]["name"] + "|" + data["to_station"]["name"] + "|" + data["doj"];
                        session.send(resultInfo);
                    }
                    else {
                        session.send("Sorry! Information not available...");
                        delete session.userData.pnrNumber;
                    }
                });
                req.on("error", function (err) {
                    session.send("Error:" + err);
                });
            }
            else {
                session.send("1 Please provide your PNR Number...");
            }
        }
        else {
            session.send("2 Please provide your PNR Number...");
        }
    }
]);



//bot.listenStdin();
var server = restify.createServer();
server.use(bot.verifyBotFramework({ appId: process.env.appId, appSecret: process.env.appSecret }));
//server.use(bot.verifyBotFramework());
server.post("/api/messages", bot.listen());
server.listen(process.env.port, function () {
    console.log("%s listening to %s", server.name, server.url);
});
//# sourceMappingURL=server.js.map

