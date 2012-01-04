class DirectMessage extends Tweet
	fill_user_variables: -> @sender = new User(@data.sender)
	get_classes: -> ["dm", "by_#{@sender.get_screen_name()}"]
