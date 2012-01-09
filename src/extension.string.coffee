String::pad = (length, pad_char=" ") -> if length>this.length then this+pad_char.repeat(length-this.length) else this
String::repeat = (times) -> (new Array(times+1)).join(this)

String::is_bigger_than = (id) ->
	l1 = this.length
	l2 = id.length
	return this>id if l1 == l2
	return l1 > l2
