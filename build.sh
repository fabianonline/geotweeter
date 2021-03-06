#!/bin/bash
if [ "$1" = "specs" ]; then
	coffee $2 --bare --output specs/ --compile specs/src/*.coffee
else
	coffee $@ --bare --join geotweeter.js --compile \
		src/_info.coffee \
		src/extension.date.coffee \
		src/extension.number.coffee \
		src/extension.string.coffee \
		src/class.account.coffee \
		src/class.filteraccount.coffee \
		src/class.hooks.coffee \
		src/class.thumbnail.coffee \
		src/class.twittermessage.coffee \
		src/class.tweet.coffee \
		src/class.directmessage.coffee \
		src/class.user.coffee \
		src/class.request.coffee \
		src/class.streamrequest.coffee \
		src/class.filterrequest.coffee \
		src/class.pullrequest.coffee \
		src/class.event.coffee \
		src/settings_migrations.coffee \
		src/class.settingsfields.coffee \
		src/class.settings.coffee \
		src/geotweeter.coffee
fi
