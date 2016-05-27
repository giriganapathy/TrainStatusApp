/*-----------------------------------------------------------------------------
This is a sample bot.

@author: giriganapathy
@since: May 26, 2016 01:32 PM
-----------------------------------------------------------------------------*/
var restify = require("restify");
var builder = require("botbuilder");
var model = process.env.model || "https://api.projectoxford.ai/luis/v1/application?id=83b0d263-bcb7-4ded-b197-95b25ee68030&subscription-key=b27a7109bc1046fb9cc7cfa874e3f819&q=";

var dialog = new builder.LuisDialog(model);
var bot = new builder.BotConnectorBot(); //new builder.TextBot();
bot.add("/", dialog);
dialog.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));
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
                        var resultInfo = "\nTrain Name: " + data["train_name"] +
                            "\nFrom Station: " + data["from_station"]["name"] +
                            "\nTo Station: " + data["to_station"]["name"] +
                            "\nDate Of Journey: " + data["doj"];
                        session.send(resultInfo);
                    }
                    else {
                        session.send("Sorry! Information not available...");
                        delete session.userData.pnrNumber;
                    }
                });
                req.on("error", function(err) {
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
