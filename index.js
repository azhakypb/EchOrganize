/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const todolistHelper = require('./helpers/todolistHelper');
const calendarHelper = require('./helpers/calendarHelper');
const examHelper = require('./helpers/examHelper');
const GENERAL_REPROMPT = "What would you like to do?";
const dynamoDBTableName = "todolist-table";
const dynamoDBCalTableName = "calendar-table";
const dynamoDBExamTableName = "exam-table";

let populateSchedule = false;
let scheduleStart = false;
let scheduleEnd = false;
let addToCal = false;
let conflictExists = false;
let functionalityExists = false;
let noScheduleCreate = false;
let examStart = false;
let examDate = false;
let examTime = false;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'What would you like to do?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();

    }
};

/*  Sprint 2 DOCS */

const calendars = [];

const calendarInstance = {
    "isActive": "",
    "name": "",
    "calendarName": "",
    "classes": [],
    "startDate": "",
    "endDate": ""
};

let activeCalendar = calendarInstance;

const classItem = {
    "className": "",
    "classTime": "",
    "DepartureTime": "",
    "reccurence": {
        "startDateTime": "",
        "endDateTime": "",
        "recurrenceRules": []
    }
    
};
const CreateScheduleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateScheduleIntent';
    },
    
    async handle(handlerInput) {
        scheduleStart = true;
        return handlerInput.responseBuilder
            .speak("What would you like to call your new schedule?")
            .reprompt()
            .getResponse();
    }
};

const ScheduleNameIntentHandler = {
     canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ScheduleNameIntent';
    },
    
    async handle(handlerInput) {
        let season = handlerInput.requestEnvelope.request.intent.slots.Season.value;
        console.log('SEASON: ' + season);
        let term = handlerInput.requestEnvelope.request.intent.slots.Term.value;
        console.log('TERM: ' + term);
        let year = handlerInput.requestEnvelope.request.intent.slots.Year.value;
        console.log('YEAR: ' + year);
        let name = season + ' ' + term + ' ' + year;
        if (scheduleStart) {
            calendarInstance.name = name;
            return handlerInput.responseBuilder
                .speak("What is the start date for your new schedule?")
                .reprompt()
                .getResponse();
        }
        else {
            calendars.forEach(function(item)
            {
                if (item.name === name) {

                    return handlerInput.responseBuilder
                        .speak("I found a saved + " + name + " schedule that starts on " + item.startDate + " and ends on " + item.endDate + ". Is that what you are looking for?")
                        .reprompt()
                        .getResponse();
                }
            }); 
        }
    }
};

/*
async function f() {

  let promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve("done!"), 1000)
  });

  let result = await promise; // wait until the promise resolves (*)

  alert(result); // "done!"
}

f();
*/

const TimeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DateIntent';
    },
    
    async handle(handlerInput) {
        if (examDate) {
          examDate = false;
          const date = new Date(handlerInput.requestEnvelope.request.intent.slots.date.value);
          examInstance.date = date.toISOString();
          examTime = true;
          return handlerInput.responseBuilder
            .speak(`Ok, and what time is your exam?`)
            .reprompt()
            .getResponse();
        }
        else if (examTime) {
          const time = handlerInput.requestEnvelope.request.intent.slots.time.value;
          const userId = handlerInput.requestEnvelope.context.System.user.userId;
          examInstance.time = time;
          examTime = false;
          return examHelper.saveNewExam(
            examInstance.name,
            examInstance.date,
            examInstance.time,
            userId
            )
            .then((data) => {
                    const startDateFormatted = new Date(examInstance.date).toDateString();
                    return handlerInput.responseBuilder
                      .speak('Ok, I have saved a new exam for you in ' + examInstance.name + ' on ' + startDateFormatted +' at ' + examInstance.time)
                      .reprompt()
                      .getResponse();
                    })
                    .catch((err) => {
                      console.log("Error occured while saving new examr", err);
                      return handlerInput.responseBuilder
                        .speak("Sorry, I wasn't able to save your exam. Please try again.")
                        .getResponse();
                      })
              }
        
        else if (scheduleStart) {
        const startDate = new Date(handlerInput.requestEnvelope.request.intent.slots.date.value);
        calendarInstance.startDate = startDate.toISOString();
        scheduleStart = false;
        scheduleEnd = true;
        return handlerInput.responseBuilder
            .speak(`Ok, and when does this schedule end?`)
            .reprompt()
            .getResponse();
        }
        else if (scheduleEnd) {
            const userId = handlerInput.requestEnvelope.context.System.user.userId;
            const endDate = new Date(handlerInput.requestEnvelope.request.intent.slots.date.value);
            calendarInstance.endDate = endDate.toISOString();
            
            const attributesManager = handlerInput;
            scheduleEnd = false;
            addToCal = true;
            
            let promise = new Promise((resolve, reject) => {
              calendarHelper.getCurrentSchedule(userId)
              .then((data) => {
                if (data.length > 0) {
                  let scheduleName = "a";
                  const scheduleMap = data.map(e => {
                  let foundStartDate = new Date(e.startDate);
                  console.log("found start date:" + foundStartDate.toDateString());
                  let foundEndDate = new Date(e.endDate);
                  console.log("found end date:" + foundEndDate.toDateString());
                  let startCheck = new Date(calendarInstance.startDate);
                  let endCheck = new Date(calendarInstance.endDate);
                  if (foundStartDate.getTime() <= startCheck.getTime() && foundEndDate >= startCheck.getTime()) {
                    console.log("new start date in range");
                    console.log("name: " + e.calendarName);
                    setTimeout(() => resolve(e.calendarName), 1000)
                  }
                  else if (foundStartDate.getTime() <= endCheck.getTime() && foundEndDate >= endCheck.getTime()) {
                    console.log("new end date in range");
                    console.log("name: " + e.calendarName);
                    setTimeout(() => resolve(e.calendarName), 1000)
                  }
                  else {
                    console.log("empty data!");
                    setTimeout(() => resolve("1"), 1000)
                  }
                  });
                  setTimeout(() => resolve("1"), 1000)
                }
                else {
                  setTimeout(() => resolve("1"), 1000)
                }
            });
              
            });
            let foundCalendar = await promise;
            console.log("found schedule: " + foundCalendar);
             
            if (foundCalendar !== "1") {
              return handlerInput.responseBuilder
                .speak('Your ' + foundCalendar + ' schedule overlaps with your new ' + calendarInstance.calendarName + ' schedule. This may result in event reminders disappearing from your calendar. Are you sure you want to continue?')
                .reprompt()
                .getResponse();
              }
              else {
                console.log("I'm going to return the wrong value, but first here is the foundSchedule  and conflict value: " + foundCalendar);
                return calendarHelper.saveNewSchedule(
                  calendarInstance.name,
                  calendarInstance.startDate,
                  calendarInstance.endDate,
                  userId
                  ).then((data) => {
                    const startDateFormatted = new Date(calendarInstance.startDate).toDateString();
                    const endDateFormatted = new Date(calendarInstance.endDate).toDateString();
                    return handlerInput.responseBuilder
                      .speak('Ok, I have created a new ' + calendarInstance.name + ' calendar for you that runs from ' + startDateFormatted + ' to ' + endDateFormatted + '. Would you like to add some classes or exams?')
                      .reprompt()
                      .getResponse();
                    })
                    .catch((err) => {
                      console.log("Error occured while saving new calendar", err);
                      return handlerInput.responseBuilder
                        .speak("Sorry, I wasn't able to save your new calendar. Please try again.")
                        .getResponse();
                      })
              }
        }
        else {
             const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
             const speakOutput = requestAttributes.t('ERROR');
             const repromptOutput = requestAttributes.t('ERROR_REPROMPT');

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(repromptOutput)
                .getResponse();
        }
    }
};

const GetScheduleIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetScheduleIntent';
    },
    async handle(handlerInput) {
        const { responseBuilder } = handlerInput;
        const userID = handlerInput.requestEnvelope.context.System.user.userId;
        return calendarHelper.getCurrentSchedule(userID)
            .then((data) => {
                var speechText = '';
                if (data.length === 0) {
                  speechText += 'I dont see any currently active schedules. Would you like to create one?';
                  functionalityExists = true;
                  noScheduleCreate = true;
                  return responseBuilder
                      .speak(speechText)
                      .reprompt()
                      .getResponse();
                }
                else {
                  let now = new Date();
                  const foundSchedule = data.map(e => {
                    let startDate = new Date(e.startDate);
                    let endDate = new Date(e.endDate);
                    if (startDate.getTime() <= now.getTime() && endDate.getTime() >= now.getTime()) {
                      return e.calendarName;
                    }
                  });
                  return calendarHelper.getClassesBySchedule(userID, foundSchedule)
                    .then((classList) => {
                      speechText += 'Here is your ' + foundSchedule + ' schedule. ';
                      if (classList.length == 0) {
                        speechText += 'It doesnt look like you have any classes saved in your schedule. Would you like to add some?'
                      }
                      else {
                        speechText += 'You are currently enrolled in: ';
                        speechText += data.map(e => e.classes).join(', ');
                      }
                      return responseBuilder
                      .speak(speechText)
                      .reprompt()
                      .getResponse();
                    })
                }
            })
            .catch((err) => {
                const speechText = "Sorry, I'm having trouble finding your schedule right now. Please try again later."
                return responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
    }
}

const YesIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
  },
  async handle(handlerInput) {
      if (!functionalityExists) {
        return handlerInput.responseBuilder
          .speak('Hmm, Id like to help, but youll have to wait until the next sprint to be able to do that.')
          .getResponse();
      }
      else {
        if (noScheduleCreate) {
          scheduleStart = true;
          functionalityExists = false;
          return handlerInput.responseBuilder
            .speak("What would you like to call your new schedule?")
            .reprompt()
            .getResponse();
          
        }
      }
    
  }
};

const NoIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
  },
  async handle(handlerInput) {
    if (!functionalityExists) {
        return handlerInput.responseBuilder
          .speak('Hmm, Id like to help, but youll have to wait until the next sprint to be able to do that.')
          .getResponse();
      }
    else {
      if (noScheduleCreate) {
        functionalityExists = false;
        noScheduleCreate = false;
        return handlerInput.responseBuilder
          .speak('Ok, Im here if you want to create one later.')
          .getResponse();
      }
    }
  },
};

const examInstance = {
    "isActive": "",
    "name": "",
    "date": "",
    "time": "",
};

const NewExamIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'NewExamIntent';
  },
  async handle(handlerInput) {
        examStart = true;
        return handlerInput.responseBuilder
            .speak("What class is your exam in?")
            .reprompt()
            .getResponse();
    }
};

const ClassNameIntentHandler = {
     canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClassNameIntent';
    },
    
    async handle(handlerInput) {
        let name = handlerInput.requestEnvelope.request.intent.slots.ClassName.value;
        console.log('Class: ' + name);
        if (examStart) {
            examInstance.name = name;
            console.log('examInstance.name: ' + name);
            examDate = true;
            return handlerInput.responseBuilder
                .speak("What day is your exam?")
                .reprompt()
                .getResponse();
        }
    }
};

const GetExamsIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetExamsIntent';
  },
  
  async handle(handlerInput) {
    let UserId = handlerInput.requestEnvelope.context.System.user.userId;
    return examHelper.getExams(UserId).then((data) => {
      if (data.length === 0) {
        return handlerInput.responseBuilder
          .speak('It doesnt look like you have any saved exams. Would you like to add one?')
          .reprompt
          .getResponse();
      }
      else {
        var speechText = 'Here are all your exams.';
        data.map(e => {
          let formattedDay = new Date(e.examDate).toDateString();
          speechText += ' In ' + e.className + ' you have an exam on ' + formattedDay + ' at '+ e.examTime + '.';
        });
        return handlerInput.responseBuilder
          .speak(speechText)
          .getResponse();
      }
    })
    .catch((err) => {
                const speechText = "Sorry, I'm having trouble finding your exams right now. Please try again later."
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
  }
}

/*  Adding To Do List   */
const InProgressAddToDoListIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
          request.intent.name === 'AddToDoListIntent' &&
          request.dialogState !== 'COMPLETED';
      },
      handle(handlerInput) {
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        return handlerInput.responseBuilder
          .addDelegateDirective(currentIntent)
          .getResponse();
      }
}
const AddToDoListIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AddToDoListIntent';  
    },
    async handle(handlerInput) {
        const userID = handlerInput.requestEnvelope.context.System.user.userId; 
        const todoString = handlerInput.requestEnvelope.request.intent.slots.todoString.value;
        /*working with the date*/
        const todoData = handlerInput.requestEnvelope.request.intent.slots.todoData.value.toString();
        console.log(todoData);
        /*working with the date*/
        return todolistHelper.addToDoList(todoString, todoData, userID)
            .then((data) => {
                const speechText = `You have added ${todoString}  objective for ${todoData}. Say add to add another objective, or remove to remove objectives from your to do list.`;
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .reprompt("to do list intent handler waiting for response")
                    .getResponse();
            })
            .catch((err) => {
                console.log("Error occured while saving to do list", err);
                return handlerInput.responseBuilder
                    .speak("we cannot save your to do list right now. Try again!")
                    .getResponse();
            })
    }
};
/*  Adding To Do List   */

/*  Getting To Do List   */
const GetToDoListsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetToDoListsIntent';
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId;
    const todoData = handlerInput.requestEnvelope.request.intent.slots.todoData.value.toString();
    return todolistHelper.getToDoLists(userID, todoData)
      .then((data) => {
        var speechText = "Your objectives are "
        if (data.length == 0) {
          speechText = "You do not have any objectives for this date. Say add to add an objective "
        } else {
          speechText += data.map(e => e.todoString).join(", ")
        }
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        const speechText = "we cannot get your to do list right now. Try again!"
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  }
}
/*  Getting To Do List   */

/*  Removing objectives from To Do List   */
const InProgressRemoveToDoListIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'RemoveToDoListIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const RemoveToDoListIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RemoveToDoListIntent';
  }, 
  handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const todoString = slots.todoString.value;
    return todolistHelper.removeToDoList(todoString, userID)
      .then((data) => {
        const speechText = `You have removed objective: ${todoString}, you can remove more, by saying remove or complete`
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        const speechText = `You do not have objective: ${todoString}, you can add it by saying add`
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
  }
}
/*  Removing objectives from To Do List   */

/*  Sprint 2 DOCS */

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can introduce yourself by telling me your name';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressAddToDoListIntentHandler,
    AddToDoListIntentHandler,
    GetToDoListsIntentHandler,
    InProgressRemoveToDoListIntentHandler,
    RemoveToDoListIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    CreateScheduleIntentHandler,
    ScheduleNameIntentHandler,
    TimeIntentHandler,
    GetScheduleIntentHandler,
    YesIntentHandler,
    NoIntentHandler,
    NewExamIntentHandler,
    ClassNameIntentHandler,
    GetExamsIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName(dynamoDBTableName)
  .withAutoCreateTable(true)
  .lambda();
