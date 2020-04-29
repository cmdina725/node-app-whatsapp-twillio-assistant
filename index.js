require('dotenv').config();

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const watsonAssistantID = process.env.ASSISTANT_ID;
const apiKey = process.env.API_KEY;
const urlAPI = process.env.URL;
const PORT = process.env.PORT || 5000

const bodyParser = require('body-parser');
const express = require('express');
const client = require('twilio')(accountSid, authToken);
var app = express();

// Twilio variables
var messageWhatsApp;
var numberWhatsApp;
var twilioNumber;

// Watson variables
var watsonSessionId;
var watsonRes;
var jsonRes;
var resp;

app.use(bodyParser.urlencoded({
    extended: false
}));

const AssistantV2 = require('ibm-watson/assistant/v2');
const {
    IamAuthenticator
} = require('ibm-watson/auth');

const assistant = new AssistantV2({
    version: '2020-04-01',
    authenticator: new IamAuthenticator({
        apikey: apiKey,
    }),
    url: urlAPI,
});

app.get('/', (req, res) => {
    console.log('Node-app-sms working! [GET]');
    res.send('Node-app-sms working!');
});

app.post('/smssent', (req, res) => {
    messageWhatsApp = req.body.Body;
    numberWhatsApp = req.body.From;
    twilioNumber = req.body.To;

    console.log('Recieved message from ' + numberWhatsApp + ' saying \'' + messageWhatsApp + '\'');

    // Get session
    assistant.createSession({
            assistantId: watsonAssistantID
            // assistantId: 'e96a663a-ea49-47f1-8fe8-104d4854e859'
        })
        .then(res => {
            watsonSessionId = res.result.session_id;
            console.log('session_id:', watsonSessionId);

            // send message to watson
            assistant.message({
                    assistantId: watsonAssistantID,
                    sessionId: watsonSessionId,
                    input: {
                        'message_type': 'text',
                        'text': '' + messageWhatsApp
                    }
                })
                .then(res => {
                    watsonRes = JSON.stringify(res.result, null, 2);
                    jsonRes = JSON.parse(watsonRes);
                    resp = jsonRes['output']['generic'][0].text;
                    console.log('Response', resp);

                    // send response from watson to twilio
                    client.messages.create({
                        from: twilioNumber,
                        to: numberWhatsApp,
                        body: resp
                    }).then(message => console.log(`Status: ${message.status}`));
                })
                .catch(err => {
                    console.log(err);
                });
        })
        .catch(err => {
            console.log(err);
        });
});

app.listen(PORT, () => {
    console.log('Example app listening on port 5000!');
});