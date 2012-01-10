Date::format = (format) -> 
	format = format.replace(/%d/g, this.getDate().add_null())
	format = format.replace(/%H/g, this.getHours().add_null())
	format = format.replace(/%m/g, (this.getMonth()+1).add_null())
	format = format.replace(/%M/g, this.getMinutes().add_null())
	format = format.replace(/%S/g, this.getSeconds().add_null())
	format = format.replace(/%y/g, ((this.getYear()+1900) % 100).add_null())
	format = format.replace(/%Y/g, this.getYear()+1900)
	return format