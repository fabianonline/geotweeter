class SettingsField
	values: null
	name: null
	category: null
	help: ""
	
	constructor: (values) ->
		@values = values
		@values.validations = [] unless @values.validations?
	
	get_id: -> (@category+@name).replace(/[^A-Za-z0-9]/g, "")
	
	get_html: ->
		$("<div id='#{@get_id()}' class='setting'>").append(@get_head_html()).append(@get_field_html()).append("<br class='clear' />")
	
	get_head_html: ->
		$("<h2>").html("#{@name}:").after(@get_help_html())
	
	get_help_html: ->
		$('<img>').attr({src: "icons/help.png", title: @help}).tooltip({track: true, delay: 0, showURL: false, extraClass: "settings_tooltip"})
	
	_setValue: (val, event) ->
		val = switch @values.format
			when "integer"
				@values.validations.unshift({message: "Bitte eine Zahl eingeben", func: (x) -> !isNaN(x)})
				parseInt(val)
			else val
		
		for validation in @values.validations
			if !validation.func(val)
				alert(validation.message)
				event.target.focus()
				return true
		
		@values.setValue(val)
		Settings.save()
		Settings.refresh_view(true)
	
	_addValue: -> @values.addValue(); Settings.refresh_view(true)
	
class SettingsText extends SettingsField
	get_field_html: ->
		if @values.readOnly
			elm = $('<div>').html(@values.getValue())
		else
			elm = $('<input>')
				.attr({type: "text"})
				.val(@values.getValue())
				.blur((event) => 
					@_setValue(event.target.value, event)
				)
		elm.addClass(@values.style) if @values.style
		return elm

class SettingsPassword extends SettingsText
	get_field_html: ->
		return super().attr({type: "password"})

class SettingsBoolean extends SettingsField
	get_field_html: ->
		elm = $('<input>')
			.attr({type: "checkbox", checked: @values.getValue()})
			.change((event) =>
				@_setValue($(event.target).is(':checked'), event)
			)
		return elm
	
class SettingsList extends SettingsField
	constructor: (values) ->
		super(values)
		@values.listHeaders ?= ["Name"]
	
	get_html: ->
		div = $('<div>').append(@get_head_html()).addClass('list')
		button = $("<a href='#' style='float: right;'>").html("<img src='icons/add.png' title='Hinzufügen' /> Hinzufügen").click( =>
			@_addValue()
		)
		div.append(button)
		div.append("<br class='break' />")
		table = $('<table>')
		
		tr = $('<tr>')
		tr.append($('<th>').html(val)) for val in @values.listHeaders
		tr.append($('<th>').html("Aktionen").addClass("grey"))
		table.append(tr)
		
		count = @values.count()
		if count>0 then for i in [0..count-1]
			do (i, table) =>
				tr = $('<tr>')
				cells = @values.getValue(i)
				if cells.constructor == Array
					tr.append($('<td>').html(val)) for val in cells
				else
					tr.append($('<td>').html(cells))
				td = $('<td>')
				for action in @values.actions
					do (action) =>
						td.append(
							elm = $("<a>").attr({href: "#"}).addClass("grey").click(=>
								action.action(i)
								Settings.save()
								Settings.refresh_view()
							)
							elm.append($('<img>').attr({src: action.icon, title: action.name})) if action.icon?
							elm.append(action.name)
						)
				tr.append(td)
				table.append(tr)
		div.append(table)
		return div

class SettingsButton extends SettingsField
	get_html: ->
		elm = $('<div>')
		elm.append($('<button>').html(@name).click( => @values.action() ))
		elm.append(@get_help_html())
		return elm