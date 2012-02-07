class Event extends TwitterMessage
	get_user_data: -> @source
	get_html: -> 
		inner = @get_inner_html()
		return "" unless inner?
		return "
		<div class='status'>
			#{@source.get_avatar_html()}
			#{inner}
		</div>
	"
	get_inner_html: -> alert("get_inner_html should be overwritten!")
	id: null
	
	constructor: (@data, @account) ->
		@target = new User(@data.target)
		@source = new User(@data.source)
		@date = new Date(@data.created_at)
		Application.all_events.push(this)
	
	@get_object: (data, account) ->
		switch data.event
			when "follow" then return new FollowEvent(data, account)
			when "favorite" then return new FavoriteEvent(data, account)
			when "list_member_added" then return new ListMemberAddedEvent(data, account)
			when "list_member_removed" then return new ListMemberRemovedEvent(data, account)
			when "block", "user_update", "unfavorite" then return new HiddenEvent(data, account)
			else return new UnknownElement(data, account)

class FollowEvent extends Event
	get_inner_html: ->
		return if @source.id_str == @account.user.id
		@account.followers_ids.push(@source.id_str)
		"Neuer Follower: #{@source.get_link_html(true)}"

class FavoriteEvent extends Event
	get_inner_html: -> 
		return if @source.id == @account.user.id
		"#{@source.get_link_html(true)} favorisierte:<br />#{@data.target_object.text}"

class ListMemberAddedEvent extends Event
	get_inner_html: -> 
		return if @source.id == @account.user.id
		"{@source.get_link_html(true)} fügte dich zu einer Liste hinzu:<br />
		<a href='https://twitter.com#{@data.target_object.uri}' target='_blank'>#{@data.target_object.full_name}</a><br />
		(#{target_object.members_count} Members, #{event.target_object.subscriber_count} Subscribers)"

class ListMemberRemovedEvent extends Event
	get_inner_html: ->
		return if @source.id == @account.user.id
		"#{@source.get_link_html(true)} entfernte dich von einer Liste:<br />
		<a href='https://twitter.com#{@data.target_object.uri}' target='_blank'>#{@data.target_object.full_name}</a><br />
		(#{target_object.members_count} Members, #{event.target_object.subscriber_count} Subscribers)"

class HiddenEvent extends Event
	get_html: -> ""

class UnknownEvent extends Event
	get_inner_html: -> 
		"#{@source.get_link_html(true)} löste folgendes, unbekanntes Event namens #{@data.event} aus:<br />
		#{@data.toString()}"
