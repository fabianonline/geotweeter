class TwitterMessage
	constructor: (@data) -> @sender = new Sender(@data.sender)
