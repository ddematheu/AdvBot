var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var prompt = require('prompt-sync')();
var mongoClient = require('mongodb').MongoClient , assert = require('assert');
var url = 'mongodb://adviserbot:4dv1s3rb0t@ds155490.mlab.com:55490/adviserbot?authMexhanism=DEFAULT';
var endConversation = false;
var category = '';
var topic = '';
var text = '';
var left = false;
var masterContext = {};
var student = {};
var requirements = {};
var first = false;

// Set up Conversation service wrapper.
var conversation = new ConversationV1({
  username: '204fed80-eb44-4d6d-8672-27c138891f8a', // replace with username from service key
  password: 'tcGhpEOcX173', // replace with password from service key
  path: { workspace_id: '05d889f6-5ec6-4c37-a13f-60a518496bd5' }, // replace with workspace ID
  version_date: '2016-07-11'
});

var audit = new ConversationV1({
  username: '204fed80-eb44-4d6d-8672-27c138891f8a', // replace with username from service key
  password: 'tcGhpEOcX173', // replace with password from service key
  path: { workspace_id: '97ef8aff-5fbd-4c2e-8698-0a4b52b1c2d5' }, // replace with workspace ID
  version_date: '2016-07-11'
});

//Getting student info and requirements
mongoClient.connect(url,function(err,db){
    assert.equal(null,err);
    console.log("Connected correctly to server");
    var students = db.collection('students');
    students.findOne({lastname:"Dematheu"}, function(err, item){
        student = item;
        mongoClient.connect(url,function(err,db){
            assert.equal(null,err);
            var students = db.collection('majors');
            students.findOne({name:student.major}, function(err, item){
                requirements = item;
            });
            db.close();
        });
    });
    db.close();
});

// Start conversation with empty message.
conversation.message({}, processResponse);

// Process the conversation response.
function processResponse(err, response) {
  if (err) {
    console.error(err); // something went wrong
    return;
  }
  // Display the output from dialog, if any.
    if (response.output.text.length != 0) {
        console.log(response.output.text[0]);
    }
    // If an intent was detected, log it out to the console.
  if (response.intents.length > 0) {
    //console.log('Detected intent: #' + response.intents[0].intent);
    // Check for action flags.
    if (response.output.action != null) {
        // User asked what time it is, so we output the local system time.
        ///console.log('Action Detected: #' + response.output.action);
        //Welcome Action
        if(response.intents[0].intent === 'Welcome' && response.output.action === 'welcome'){
            console.log("Hello " + student.firstname + " " + student.lastname);
            console.log("My name is Mark, your Penn State Academic Adviser. Let me tell you a bit about me.");
            console.log('I am here to help you resolve you issues fast and easy.');
              // Prompt for the next round of input.
            if(!endConversation && !left){
                var newMessageFromUser = prompt('>> ');
                text = newMessageFromUser;
                conversation.message({
                    input: { text: newMessageFromUser },
                    context : response.context,  
                    }, processResponse)
                }
        }
        else if(response.intents[0].intent == 'definitions'){
             // Prompt for the next round of input.
            mongoClient.connect(url,function(err,db){
                assert.equal(null,err);
                var definitions = db.collection('definitions');
                definitions.findOne({name:response.entities[0].value},function(err, item){
                    console.log(item.name + ' ' + item.description);
                        // Prompt for the next round of input.
                    if(!endConversation && !left){
                        var newMessageFromUser = prompt('>> ');
                        text = newMessageFromUser;
                        conversation.message({
                            input: { text: newMessageFromUser },
                            context : response.context,  
                            }, processResponse)
                        }
                    });
                db.close();
            });
        }
        else if(response.intents[0].intent == 'requirements'){
            console.log("The graduation requirements for " + requirements.name + " are:")
            console.log("   Total Number of Credits: " + requirements.credits[0].total);
            console.log("   The requirements for your major are:");
            console.log("       Department Elective Credits: " + requirements.credits[0].major[0].department);
            console.log("       400-Level Elective Credits: " + requirements.credits[0].major[0].electives);
            console.log("       Support Electives: " + requirements.credits[0].major[0].support);
            console.log("   The General Eduation Requirements are:");
            console.log("       GA: " + requirements.credits[0].geneds[0].ga);
            console.log("       GS: " + requirements.credits[0].geneds[0].gs);
            console.log("       GH: " + requirements.credits[0].geneds[0].gh);
            console.log("       GQ: " + requirements.credits[0].geneds[0].gq);
            console.log("       GN: " + requirements.credits[0].geneds[0].gn);
            console.log("       GHA: " + requirements.credits[0].geneds[0].gha);
            console.log("       GWS: " + requirements.credits[0].geneds[0].gws);
            if(!endConversation && !left){
                var newMessageFromUser = prompt('>> ');
                text = newMessageFromUser;
                conversation.message({
                    input: { text: newMessageFromUser },
                    context : response.context,  
                    }, processResponse)
                }
        }
        //Audit Branch
        else if(response.intents[0].intent == 'Audit'){
            left = true;
            masterContext = response.context;
            audit.message({
                input: { text: text },
                context : response.context,
                }, AuditBranch);
        }
         //Petition Branch
        else if(response.intents[0].intent == 'Petition'){
            left = true;
            masterContext = response.context;
            audit.message({
                input: { text: text },
                context : response.context,
                }, PetitionBranch);
        }
        //Credits
        else if(response.intents[0].intent === 'CreditCount' && response.output.action === 'Creds'){
            switch(response.output.context.category){
                case 'GA':
                    var total = requirements.credits[0].geneds[0].ga;
                    var sTotal = student.credits[0].geneds[0].ga;
                    console.log("You currently have " + sTotal + " GA credits out of " + total + ".");
                    break;
                case 'GS':
                    var total = requirements.credits[0].geneds[0].gs;
                    var sTotal = student.credits[0].geneds[0].gs;
                    console.log("You currently have " + sTotal + " GS credits out of " + total + ".");
                    break;
                case 'GH':
                    var total = requirements.credits[0].geneds[0].gh;
                    var sTotal = student.credits[0].geneds[0].gh;
                    console.log("You currently have " + sTotal + " GH credits out of " + total + ".");
                    break;
                case 'Total':
                    var total = requirements.credits[0].total;
                    var sTotal = student.credits[0].total;
                    console.log("You currently have " + sTotal + " Total credits out of " + total + ".");
                    break;
            }
            // Prompt for the next round of input.
            if(!endConversation && !left){
                var newMessageFromUser = prompt('>> ');
                text = newMessageFromUser;
                conversation.message({
                    input: { text: newMessageFromUser },
                    context : response.context,  
                    }, processResponse)
                }
        }
        //Recommendation Action
        else if(response.intents[0].intent === 'ClassRecommend' && response.output.action === "Rec"){
            if(response.output.context.category != 'none'){
            //console.log('Category Detected: #' + response.output.context.category);
            category = response.output.context.category;
            }
            else 
            {
                console.log(category);
                if(category != ''){
                console.log("Using given category: " + category);

                }
                else {
                    console.log("Specify type of course (GA, GS, GH)");
                    var newCategory = '';
                    while(newCategory == ''){
                        newCategory = prompt('>> ');
                    }
                    category = newCategory;
                }
            }
              // Prompt for the next round of input.
               mongoClient.connect(url,function(err,db){
                assert.equal(null,err);
                var courses = db.collection('courses');
                courses.find({attribute:response.entities[0].value}).toArray(function(err, item){
                for( var i = 0; i < 3; i++){
                    console.log(item[i].num + ":" + item[i].name);
                }
                    // Prompt for the next round of input.
                if(!endConversation && !left){
                    var newMessageFromUser = prompt('>> ');
                    text = newMessageFromUser;
                    conversation.message({
                        input: { text: newMessageFromUser },
                        context : response.context,  
                        }, processResponse)
                    }
                });
                db.close();
            });
        }
        //CourseInfo
        else if(response.intents[0].intent === 'courseInfo' && response.output.action === "courseInfo"){
            mongoClient.connect(url,function(err,db){
                assert.equal(null,err);
                var courses = db.collection('courses');
                courses.findOne({num:response.entities[0].value}, function(err, item){
                    console.log(item.num + ":" + item.name);
                    console.log(item.description);
                    console.log("Attribute: " + item.attribute);
                    console.log("Credits: " + item.credits);
                    console.log("Campus: " + item.campus); 
                      // Prompt for the next round of input.
                    if(!endConversation && !left){
                        var newMessageFromUser = prompt('>> ');
                        text = newMessageFromUser;
                        conversation.message({
                            input: { text: newMessageFromUser },
                            context : response.context,  
                            }, processResponse)
                        }
                    });
                db.close();

            });
        }
        //Schedule
        else if(response.intents[0].intent === 'Schedule'){
            if(response.output.action === 'Add'){
                console.log("Adding Course....");
            }
            else if(response.output.action === 'drop'){
                console.log("Dropping Course....");
            }
              // Prompt for the next round of input.
            if(!endConversation && !left){
                var newMessageFromUser = prompt('>> ');
                text = newMessageFromUser;
                conversation.message({
                    input: { text: newMessageFromUser },
                    context : response.context,  
                    }, processResponse)
                }
        }
        //Goodbye Action
        else if (response.output.action === "goodbye"){
            endConversation = true;
        }
  }
}
  // Prompt for first round of input
  if(!endConversation && !left && !first){
      var newMessageFromUser = prompt('>> ');
      first = true;
      text = newMessageFromUser;
      conversation.message({
          input: { text: newMessageFromUser },
          context : response.context,  
        }, processResponse)
    }
}

function AuditBranch(err, response) {
    console.log("Audit Branch");
    if (err) {
        console.error(err); // something went wrong
        return;
    }
    if (response.output.text.length != 0) {
    console.log(response.output.text[0]);
    }
    if (response.intents.length > 0) {
        console.log('Detected intent: #' + response.intents[0].intent);
        // Check for action flags.
        if(response.intents[0].intent === 'Grade'){
        }
        else if(response.intents[0].intent === 'Info'){
        }
        else if(response.intents[0].intent === 'Auditing'){
        }
        else{
            if(!endConversation){
                left = false;
                conversation.message({
                input: { text: text },
                context : masterContext,
                }, processResponse)
            }
        }
    }
    if(!endConversation && left){
        var newMessageFromUser = prompt('>> ');
        text = newMessageFromUser;
        audit.message({
            input: { text: newMessageFromUser },
            context : response.context,
            }, AuditBranch)
    }
}

function PetitionBranch(err, response) {
    console.log("Petition Branch");
    if (err) {
        console.error(err); // something went wrong
        return;
    }
    if (response.output.text.length != 0) {
    console.log(response.output.text[0]);
    }
    if (response.intents.length > 0) {
        console.log('Detected intent: #' + response.intents[0].intent);
        // Check for action flags.
        if(response.intents[0].intent === 'Grade'){
        }
        else if(response.intents[0].intent === 'Info'){
        }
        else if(response.intents[0].intent === 'Auditing'){
        }
        else{
            if(!endConversation){
                left = false;
                conversation.message({
                input: { text: text },
                context : masterContext,
                }, processResponse)
            }
        }
    }
    if(!endConversation && left){
        var newMessageFromUser = prompt('>> ');
        text = newMessageFromUser;
        audit.message({
            input: { text: newMessageFromUser },
            context : response.context,
            }, PetitionBranch)
    }
}