This project illustrates how to make Smooch work as a secondary channel with a bot on Facebook.

It shows how to switch from primary to secondary, and synchronize messages sent from the bot to Facebook to the Smooch conversation if the Smooch appUser is active.

**However, this sample does not show how to synchronize user messages sent while the thread is controlled by the bot to Smooch. In order to accomplish this you would have to maintain a record of the conversation and then inject it into Smooch when control is passed to the secondary agent system.**

# Explanation of project

When run this project defines a Messenger menu that allows the user to toggle between a primary bot system on the Facebook API and a secondary agent system (for example on Smooch).

When the user sends the text _"help"_, the bot responds with a preset message. This message includes the metadata "bot". This metadata allows the project to synchronize messages sent from the bot to the agent system. We add the metadata to avoid synchronizing every message sent to the page and duplicating messages in the agent system. There seems to be no other way to determine what messages come from what channel except with metadata.

*You can use the above strategy to synchronize other kinds of events from the bot as well. Converting them to text messages on the Smooch platform.*

This project has an extremely light storage system (light as in lite, not light as in elegant) that synchronously writes records as files to the storage folder. This is used to map FB user IDs to Smooch user IDs for the purposes of synchronizing.

**Bottom line: synchronizing is difficult, but handover itself is quite simple to manage.**

To look at the code open up the _index.js_ file.

# Getting started

1. Fill in the config variables at the top of the fb_bot/index.js file.
2. Set a webhook on Smooch pointing at this service on the _/smooch_ route.
3. Connect Smooch to your Facebook page.
4. Connect your Facebook bot app to your Facebook page.
5. In the Facebook page settings, set the bot to primary and set the Smooch app to secondary.
6. Run the project with `node index.js`
