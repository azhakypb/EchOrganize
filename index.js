/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const todolistHelper = require('./helpers/todolistHelper');
const GENERAL_REPROMPT = "What would you like to do?";
const dynamoDBTableName = "todolist-table";

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
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName(dynamoDBTableName)
  .withAutoCreateTable(true)
  .lambda();
