normal_tweet = {
	"contributors":null,
	"place":null,
	"truncated":false,
	"text":"Es ist jetzt 14 Uhr.",
	"id_str":"162157777156980736",
	"retweet_count":0,
	"favorited":false,
	"created_at":"Wed Jan 25 13:00:01 +0000 2012",
	"coordinates":null,
	"in_reply_to_screen_name":null,
	"source":"<a href=\"http://leumund.ch/dienstleistungsboter-in-twitter-001129\" rel=\"nofollow\">zurvollenstunde</a>",
	"geo":null,
	"retweeted":false,
	"in_reply_to_status_id_str":null,
	"in_reply_to_user_id_str":null,
	"in_reply_to_user_id":null,
	"user":{
		"default_profile":true,
		"profile_sidebar_border_color":"C0DEED",
		"id_str":"14383393",
		"created_at":"Mon Apr 14 10:11:30 +0000 2008",
		"following":null,
		"profile_use_background_image":true,
		"geo_enabled":false,
		"profile_text_color":"333333",
		"description":"Immer auf die volle Stunde eine Nachricht mit der Zeit. ",
		"default_profile_image":false,
		"statuses_count":32814,
		"profile_background_image_url":"http://a0.twimg.com/images/themes/theme1/bg.png",
		"url":"http://leumund.ch/2008/technologiebloggen/dienstleistungsboter-in-twitter/",
		"show_all_inline_media":false,
		"follow_request_sent":null,
		"favourites_count":0,
		"profile_link_color":"0084B4",
		"followers_count":5106,
		"profile_image_url":"http://a0.twimg.com/profile_images/1200663831/10_normal.jpg",
		"profile_background_image_url_https":"https://si0.twimg.com/images/themes/theme1/bg.png",
		"screen_name":"zurvollenstunde",
		"time_zone":"Bern",
		"profile_background_color":"C0DEED",
		"protected":false,
		"profile_image_url_https":"https://si0.twimg.com/profile_images/1200663831/10_normal.jpg",
		"location":"GMT+1",
		"contributors_enabled":false,
		"profile_background_tile":false,
		"friends_count":0,
		"name":"zurvollenstunde",
		"listed_count":293,
		"profile_sidebar_fill_color":"DDEEF6",
		"id":14383393,
		"is_translator":false,
		"lang":"en",
		"verified":false,
		"notifications":null,
		"utc_offset":3600
	},
	"in_reply_to_status_id":null,
	"id":162157777156980740,
	"entities":{
		"hashtags":[],
		"user_mentions":[],
		"urls":[]
	}
}

tweet_with_image = {"retweeted":false,"created_at":"Wed Jan 25 14:41:45 +0000 2012","in_reply_to_status_id_str":null,"in_reply_to_user_id_str":null,"in_reply_to_status_id":null,"entities":{"urls":[],"hashtags":[{"indices":[38,48],"text":"schifoarn","type":"hashtags"}],"media":[{"type":"media","sizes":{"medium":{"h":448,"resize":"fit","w":600},"thumb":{"h":150,"resize":"crop","w":150},"small":{"h":254,"resize":"fit","w":340},"large":{"h":484,"resize":"fit","w":648}},"media_url":"http://p.twimg.com/AkAw66RCMAM1ngm.jpg","expanded_url":"http://twitter.com/Rene_dev/status/162183375212392449/photo/1","indices":[49,69],"url":"http://t.co/OadOhn9z","media_url_https":"https://p.twimg.com/AkAw66RCMAM1ngm.jpg","id":162183375216586750,"id_str":"162183375216586755","display_url":"pic.twitter.com/OadOhn9z"}],"user_mentions":[]},"coordinates":null,"user":{"listed_count":42,"contributors_enabled":false,"created_at":"Sun Feb 15 17:02:00 +0000 2009","profile_text_color":"333333","protected":false,"screen_name":"Rene_dev","profile_background_image_url":"http://a0.twimg.com/images/themes/theme1/bg.png","name":"Rene","default_profile":true,"notifications":false,"profile_link_color":"0084B4","utc_offset":3600,"description":"Student der Informatik. Auto Reparieren, Basteln, iOS Developer, Funken(DO1WTF), T5 Geocachen, ...","verified":false,"friends_count":409,"profile_background_color":"C0DEED","profile_image_url_https":"https://si0.twimg.com/profile_images/90413863/P1060502_normal.jpg","lang":"en","profile_background_tile":false,"profile_background_image_url_https":"https://si0.twimg.com/images/themes/theme1/bg.png","location":"Münster/TU Dortmund","default_profile_image":false,"geo_enabled":true,"profile_sidebar_fill_color":"DDEEF6","favourites_count":131,"url":"http://amerika.ist-wunderbar.com/","is_translator":false,"show_all_inline_media":false,"follow_request_sent":false,"profile_sidebar_border_color":"C0DEED","id_str":"20921094","id":20921094,"statuses_count":18075,"following":true,"profile_use_background_image":true,"time_zone":"Berlin","followers_count":302,"profile_image_url":"http://a1.twimg.com/profile_images/90413863/P1060502_normal.jpg"},"in_reply_to_user_id":null,"truncated":false,"contributors":null,"place":null,"retweet_count":0,"favorited":false,"geo":null,"source":"<a href=\"http://www.apple.com\" rel=\"nofollow\">Photos on iOS</a>","possibly_sensitive":false,"id_str":"162183375212392449","in_reply_to_screen_name":null,"id":162183375212392450,"text":"Mal eben was aus dem Auto holen. Brb. #schifoarn http://t.co/OadOhn9z"}

settings = {
	version: 12,
	twitter: {
		consumerKey: "",
		consumerSecret: "",
		users: [
			{
				token: ""
				tokenSecret: ""
			}
		]
	}
}

get_account = ->
	acct = new Account(0)
	return acct