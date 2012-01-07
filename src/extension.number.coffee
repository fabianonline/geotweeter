Number::add_null = ->
	return this.toString() if this>10
	return "0"+this.toString()