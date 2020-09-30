var alexa = require('alexa-app');
var app = new alexa.app();
const {MongoClient} = require('mongodb');

async function connect_to_db(uri, client) {
    uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";
 

    client = new MongoClient(uri);
 
    try {
        // Connect to the MongoDB cluster
        await client.connect();
 
        // Make the appropriate DB calls
        await  listDatabases(client);
 
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

connect_to_db.catch(console.error);

app.launch(function(request, response){
 response.say("Hello there, I am a bot created to help you find what to eat for lunch.");
 response.shouldEndSession(false);
})

app.intent('GetLunchSuggestions',
 {
  "slots": {},
  "utterances": [
   "what's for lunch",
   "where should {I|we} go for lunch"
  ]
 },
 function (request, response) {
  generate_suggestions(response);
  return; 
 }
);

app.intent('AddClass',{
    "slots": {Class},
    "utterances": [
        "Add {Class} to {the|my} schedule"
    ]
},
function (request, response) {
    register_for_class(request, response);
    return;
});

function generate_suggestions(response){
 var food = ["Thai",
  "Sushi",
  "Chik-fil-a",
  "Smash Burgers",
  "Uncle Julio's"
 ];
 
 var rand = food[Math.floor(Math.random() * food.length)];
 
 response.say("How about some " + rand + " today?");
 response.send();return ;}
 
 function register_for_class(request, response) {

 }
 // Connect to lambda
exports.handler = app.lambda();

if ((process.argv.length === 3) && (process.argv[2] === 'schema'))
{
    console.log (app.schema ());
    console.log (app.utterances ());
}