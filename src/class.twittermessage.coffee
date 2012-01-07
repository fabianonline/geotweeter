class TwitterMessage
	constructor: (@data) -> @sender = new User(@get_user_data)
	get_user_data: -> throw "Fehler!"
	get_date: -> @date
	
	@get_object: (data, account) ->
		return unless data?
		return new DirectMessage(data, account) if data.text? && data.recipient?
		return new Tweet(data, account) if data.text?
		return Event.get_object(data, account) if data.event?
		return
	
