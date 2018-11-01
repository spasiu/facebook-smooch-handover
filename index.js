// imports
const Smooch = require('smooch-core');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const storage = require('./storage');
const jwt = require('jsonwebtoken');

// config variables
const port = 8000;
const fbPageSenderId = '';
const fbSmoochAppId = '';
const fbPageAccessToken = '';
const smoochAppId = '';
const smoochAppKeyId = '';
const smoochAppKeySecret = '';

const menuDefinition = {
    "persistent_menu": [
        {
            "locale": "default",
            "composer_input_disabled": false,
            "call_to_actions": [
                {
                    "title": "Talk to agent",
                    "type": "postback",
                    "payload": "AGENT"
                },
                {
                    "title": "Talk to bot",
                    "type": "postback",
                    "payload": "BOT"
                }
            ]
        }
    ]
};

// smooch API
const smooch = new Smooch({
    keyId: smoochAppKeyId,
    secret: smoochAppKeySecret,
    scope: 'app'
});

const smoochToken = jwt.sign({
    scope: 'app'
}, smoochAppKeySecret, {
    header: {
        kid: smoochAppKeyId
    }
});


// server routes
express()
    .use(bodyParser.json())
    .post('/', fbWebhookHandler)
    .get('/', fbWebhookValidationRoute)
    .post('/smooch', smoochWebhookHandler)
    .head('/smooch', smoochWebhookValidationRoute)
    .listen(port, async () => {
        try {
            await setMenu();
        } catch (error) {
            console.error(error);
        }
    });


// handle Facebook's Webhook target validation requests
async function fbWebhookValidationRoute(req, res) {
    res.send(req.query['hub.challenge'])
}

// handle Smooch's Webhook target validation requests
async function smoochWebhookValidationRoute(req, res) {
    res.end();
}

// echo agent messages from the primary to Smooch and handle postbacks
async function fbWebhookHandler(req, res) {
    if (req.body.entry) {
        for (const entry of req.body.entry) {
            if (entry.messaging) {
                for (const item of entry.messaging) {
                    if (item.postback) {
                        if (item.postback.payload === 'AGENT') {
                            await passThreadControl(item.sender.id);
                        }

                        if (item.postback.payload === 'BOT') {
                            await takeThreadControl(item.sender.id);
                        }
                    }

                    if (item.message) {
                        if (item.sender.id === fbPageSenderId && item.message.metadata === 'bot') {
                            const smoochAppUserId = storage.getByFbId(item.recipient.id);
                            if (smoochAppUserId) {
                                await smooch.appUsers.sendMessage(smoochAppUserId, {
                                    role: 'appUser',
                                    name: 'bot',
                                    type: 'text',
                                    text: item.message.text
                                });
                            }
                        }

                        if (item.sender.id !== fbPageSenderId) {
                            // process user message with bot
                            const smoochAppUserId = storage.getByFbId(item.recipient.id);



                            if (item.message.text === 'help') {
                                await axios.post(`https://graph.facebook.com/v2.6/me/messages?access_token=${fbPageAccessToken}`, {
                                    messaging_type: 'RESPONSE',
                                    recipient: {
                                        id: item.sender.id
                                    },
                                    message: {
                                        text: 'hello, this is bot',
                                        metadata: 'bot'
                                    }
                                }, {
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    res.end();
}

// handle events from Smooch and add user to storage
async function smoochWebhookHandler(req, res) {
    const smoochAppUserId = req.body.appUser._id;
    const fbId = storage.getBySmoochId(smoochAppUserId);
    if (!fbId) {

        const data = await smooch.appUsers.getChannels({
            appId: smoochAppId,
            userId: smoochAppUserId
        });

        const fbId = data.channels
            .filter(channel => channel.type === 'messenger')
            .map(channel => channel.userId)
            .pop();
        if (fbId) {

            storage.setBySmoochId(smoochAppUserId, fbId);
            storage.setByFbId(fbId, smoochAppUserId);
        }
    }
    res.end();
}

async function passThreadControl(recipientId) {
    await axios.post(`https://graph.facebook.com/v2.6/me/pass_thread_control?access_token=${fbPageAccessToken}`, {
        recipient: {
            id: recipientId
        },
        target_app_id: fbSmoochAppId
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

async function takeThreadControl(recipientId) {
    await axios.post(`https://graph.facebook.com/v2.6/me/take_thread_control?access_token=${fbPageAccessToken}`, {
        recipient: {
            id: recipientId
        }
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

async function setMenu() {
    await axios.post(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${fbPageAccessToken}`, menuDefinition, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
