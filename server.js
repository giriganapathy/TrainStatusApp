var restify = require("restify");
var builder = require("botbuilder");
//var model = process.env.model || "https://api.projectoxford.ai/luis/v1/application?id=1d4ed816-3795-4a87-a105-ef7c5c904e85&subscription-key=b27a7109bc1046fb9cc7cfa874e3f819&q="
//var dialog = new builder.LuisDialog(model);
var bot = new builder.BotConnectorBot();
bot.add("/", [
    function (session) {
        builder.Prompts.text(session, "Hello...What is your name?");
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.choice(session, "Hello " + session.userData.name + " Which product do you like to know the bundle availability?", ["FiOS", "FiOS - Triple Play", "FiOS - Double Play", "Standalone"]);
    },
    function (session, results) {
        session.userData.product = results.response.entity;
        builder.Prompts.number(session, "Can you please tell me your Zip Code?");
    },
    function (session, results) {
        session.userData.zipCode = results.response;
        builder.Prompts.text(session, "Can i have your address please");
    },
    function (session, results) {
        session.userData.address = results.response;
        builder.Prompts.text(session, "Can i tell your country code (2 Letter)");
    },
    function (session, results) {
        session.userData.countryCode = results.response;
        var stateInfo = "";
        var Client = require('node-rest-client').Client;
        var client = new Client();
        // set content-type header and data as json in args parameter 
        var args = {
            data: { test: "hello" },
            headers: { "Content-Type": "application/json" }
        };
        client.get("http://services.groupkt.com/state/get/" + session.userData.countryCode + "/all", args, function (data, response) {
            // parsed response body as js object 
            var result = data["RestResponse"]["result"];
            for (var idx = 0; idx < result.length; idx++) {
                var info = result[idx];
                stateInfo = stateInfo + info["country"] + "-" + info["name"] + ",";
                console.log(info["country"] + "-" + info["name"]);
            }
            session.send("Hello " + session.userData.name + "! I am going to check the " + session.userData.product +
                " availability for the address:" + session.userData.address + ", ZipCode:" + session.userData.zipCode +
                "\nList of States for your country code:" + session.userData.countryCode + "\n" + stateInfo);
        });
    }
]);
var server = restify.createServer();
//server.use(bot.verifyBotFramework({ "appId": process.env.appId, "appSecret": process.env.appSecret }));
server.post("/api/messages", bot.listen());
server.listen(8080, function () {
    console.log("%s listening to %s", server.name, server.url);
});
//# sourceMappingURL=server.js.map
