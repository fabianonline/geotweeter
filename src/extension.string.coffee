String::pad = (length, pad_char=" ") -> if length>this.length then this+pad_char.repeat(length-this.length) else this
String::repeat = (times) -> (new Array(times+1)).join(this)

String::is_bigger_than = (id) ->
	l1 = this.length
	l2 = id.length
	return this>id if l1 == l2
	return l1 > l2

String::decrement = ->
	chars = (char.charCodeAt(0) for char in this.split(""))
	char_to_look_at = chars.length-1
	loop
		chars[char_to_look_at]-=1
		break unless chars[char_to_look_at]==47
		chars[char_to_look_at]=57
		char_to_look_at-=1
		break if char_to_look_at<0
	(String.fromCharCode(char) for char in chars).join("")