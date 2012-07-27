class SettingsField
	values: null
	
	constructor: (values) ->
		@values = values
	
class SettingsText extends SettingsField
	get_html: ->
		$('<input>')
			.attr({type: "text"})
			.val(@values.getValue())
			.change((elm) => @values.setValue(elm.target.value))
	
class SettingsList extends SettingsField
	get_html: ->
		table = $('<table>')
		count = @values.count()
		if count>0 then for i in [0..@values.count()-1]
			do (i) =>
				tr = $('<tr>')
				cells = @values.getValue(i)
				if typeof cells == Array
					tr.append($('<td>').html(val)) for val in cells
				else
					tr.append($('<td>').html(cells))
				tr.append($('<td>').html("X").click((elm) => @values.deleteValue(i)))
				table.append(tr)
		return table