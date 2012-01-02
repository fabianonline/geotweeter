class TwitterMessage
	constructor: (@data) -> @sender = new User(@data.sender)
	get_date: -> @date
	get_id: -> @object_id
	
	@get_object: (data, account) ->
		return unless data?
		return if data.text? && data.recipient?
		return new Tweet(data, account) if data.text?
		
		return
		
