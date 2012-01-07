String::pad = (length, pad_char=" ") -> if length>this.length then this+pad_char.repeat(length-this.length) else this
String::repeat = (times) -> (new Array(times+1)).join(this)
