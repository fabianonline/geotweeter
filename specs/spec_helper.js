var get_account, normal_tweet, settings, tweet_by_this_user, tweet_mentioning_this_user, tweet_with_image;

normal_tweet = {
  "contributors": null,
  "place": null,
  "truncated": false,
  "text": "Es ist jetzt 14 Uhr.",
  "id_str": "162157777156980736",
  "retweet_count": 0,
  "favorited": false,
  "created_at": "Wed Jan 25 13:00:01 +0000 2012",
  "coordinates": null,
  "in_reply_to_screen_name": null,
  "source": "<a href=\"http://leumund.ch/dienstleistungsboter-in-twitter-001129\" rel=\"nofollow\">zurvollenstunde</a>",
  "geo": null,
  "retweeted": false,
  "in_reply_to_status_id_str": null,
  "in_reply_to_user_id_str": null,
  "in_reply_to_user_id": null,
  "user": {
    "default_profile": true,
    "profile_sidebar_border_color": "C0DEED",
    "id_str": "14383393",
    "created_at": "Mon Apr 14 10:11:30 +0000 2008",
    "following": null,
    "profile_use_background_image": true,
    "geo_enabled": false,
    "profile_text_color": "333333",
    "description": "Immer auf die volle Stunde eine Nachricht mit der Zeit. ",
    "default_profile_image": false,
    "statuses_count": 32814,
    "profile_background_image_url": "http://a0.twimg.com/images/themes/theme1/bg.png",
    "url": "http://leumund.ch/2008/technologiebloggen/dienstleistungsboter-in-twitter/",
    "show_all_inline_media": false,
    "follow_request_sent": null,
    "favourites_count": 0,
    "profile_link_color": "0084B4",
    "followers_count": 5106,
    "profile_image_url": "http://a0.twimg.com/profile_images/1200663831/10_normal.jpg",
    "profile_background_image_url_https": "https://si0.twimg.com/images/themes/theme1/bg.png",
    "screen_name": "zurvollenstunde",
    "time_zone": "Bern",
    "profile_background_color": "C0DEED",
    "protected": false,
    "profile_image_url_https": "https://si0.twimg.com/profile_images/1200663831/10_normal.jpg",
    "location": "GMT+1",
    "contributors_enabled": false,
    "profile_background_tile": false,
    "friends_count": 0,
    "name": "zurvollenstunde",
    "listed_count": 293,
    "profile_sidebar_fill_color": "DDEEF6",
    "id": 14383393,
    "is_translator": false,
    "lang": "en",
    "verified": false,
    "notifications": null,
    "utc_offset": 3600
  },
  "in_reply_to_status_id": null,
  "id": 162157777156980740,
  "entities": {
    "hashtags": [],
    "user_mentions": [],
    "urls": []
  }
};

tweet_with_image = {
  "retweeted": false,
  "created_at": "Wed Jan 25 14:41:45 +0000 2012",
  "in_reply_to_status_id_str": null,
  "in_reply_to_user_id_str": null,
  "in_reply_to_status_id": null,
  "entities": {
    "urls": [],
    "hashtags": [
      {
        "indices": [38, 48],
        "text": "schifoarn",
        "type": "hashtags"
      }
    ],
    "media": [
      {
        "type": "media",
        "sizes": {
          "medium": {
            "h": 448,
            "resize": "fit",
            "w": 600
          },
          "thumb": {
            "h": 150,
            "resize": "crop",
            "w": 150
          },
          "small": {
            "h": 254,
            "resize": "fit",
            "w": 340
          },
          "large": {
            "h": 484,
            "resize": "fit",
            "w": 648
          }
        },
        "media_url": "http://p.twimg.com/AkAw66RCMAM1ngm.jpg",
        "expanded_url": "http://twitter.com/Rene_dev/status/162183375212392449/photo/1",
        "indices": [49, 69],
        "url": "http://t.co/OadOhn9z",
        "media_url_https": "https://p.twimg.com/AkAw66RCMAM1ngm.jpg",
        "id": 162183375216586750,
        "id_str": "162183375216586755",
        "display_url": "pic.twitter.com/OadOhn9z"
      }
    ],
    "user_mentions": []
  },
  "coordinates": null,
  "user": {
    "listed_count": 42,
    "contributors_enabled": false,
    "created_at": "Sun Feb 15 17:02:00 +0000 2009",
    "profile_text_color": "333333",
    "protected": false,
    "screen_name": "Rene_dev",
    "profile_background_image_url": "http://a0.twimg.com/images/themes/theme1/bg.png",
    "name": "Rene",
    "default_profile": true,
    "notifications": false,
    "profile_link_color": "0084B4",
    "utc_offset": 3600,
    "description": "Student der Informatik. Auto Reparieren, Basteln, iOS Developer, Funken(DO1WTF), T5 Geocachen, ...",
    "verified": false,
    "friends_count": 409,
    "profile_background_color": "C0DEED",
    "profile_image_url_https": "https://si0.twimg.com/profile_images/90413863/P1060502_normal.jpg",
    "lang": "en",
    "profile_background_tile": false,
    "profile_background_image_url_https": "https://si0.twimg.com/images/themes/theme1/bg.png",
    "location": "Münster/TU Dortmund",
    "default_profile_image": false,
    "geo_enabled": true,
    "profile_sidebar_fill_color": "DDEEF6",
    "favourites_count": 131,
    "url": "http://amerika.ist-wunderbar.com/",
    "is_translator": false,
    "show_all_inline_media": false,
    "follow_request_sent": false,
    "profile_sidebar_border_color": "C0DEED",
    "id_str": "20921094",
    "id": 20921094,
    "statuses_count": 18075,
    "following": true,
    "profile_use_background_image": true,
    "time_zone": "Berlin",
    "followers_count": 302,
    "profile_image_url": "http://a1.twimg.com/profile_images/90413863/P1060502_normal.jpg"
  },
  "in_reply_to_user_id": null,
  "truncated": false,
  "contributors": null,
  "place": null,
  "retweet_count": 0,
  "favorited": false,
  "geo": null,
  "source": "<a href=\"http://www.apple.com\" rel=\"nofollow\">Photos on iOS</a>",
  "possibly_sensitive": false,
  "id_str": "162183375212392449",
  "in_reply_to_screen_name": null,
  "id": 162183375212392450,
  "text": "Mal eben was aus dem Auto holen. Brb. #schifoarn http://t.co/OadOhn9z"
};

tweet_by_this_user = {
  "place": {
    "country_code": "DE",
    "country": "Germany",
    "attributes": {
      "street_address": "Letteweg"
    },
    "full_name": "Letteweg, Hennen, Iserlohn",
    "name": "Letteweg, Hennen",
    "id": "c2a82d0b6fbcde87",
    "bounding_box": {
      "type": "Polygon",
      "coordinates": [[[7.645818679541, 51.4466070554338], [7.645818679541, 51.4466070554338], [7.645818679541, 51.4466070554338], [7.645818679541, 51.4466070554338]]]
    },
    "place_type": "poi",
    "url": "http://api.twitter.com/1/geo/id/c2a82d0b6fbcde87.json"
  },
  "geo": {
    "type": "Point",
    "coordinates": [51.44671127, 7.64666165]
  },
  "retweeted": false,
  "text": "@johnassel Bei mir geht schon die alte nicht... o_O",
  "in_reply_to_status_id_str": "163554393621401600",
  "in_reply_to_status_id": 163554393621401600,
  "in_reply_to_user_id_str": "81554965",
  "truncated": false,
  "source": "<a href=\"http://blog.fabianonline.de\" rel=\"nofollow\">Fabians GeoTweeter</a>",
  "in_reply_to_user_id": 81554965,
  "contributors": null,
  "retweet_count": 0,
  "favorited": false,
  "created_at": "Sun Jan 29 09:29:52 +0000 2012",
  "coordinates": {
    "type": "Point",
    "coordinates": [7.64666165, 51.44671127]
  },
  "id_str": "163554444204720128",
  "user": {
    "show_all_inline_media": true,
    "profile_text_color": "333333",
    "statuses_count": 28094,
    "profile_background_image_url_https": "https://si0.twimg.com/images/themes/theme1/bg.png",
    "profile_background_image_url": "http://a0.twimg.com/images/themes/theme1/bg.png",
    "screen_name": "fabianonline",
    "listed_count": 20,
    "following": null,
    "verified": false,
    "time_zone": "Berlin",
    "profile_link_color": "0084B4",
    "profile_image_url_https": "https://si0.twimg.com/profile_images/1485014939/Fabian_und_die_Ju52_normal.JPG",
    "location": "Iserlohn, Dortmund",
    "is_translator": false,
    "geo_enabled": true,
    "friends_count": 150,
    "description": "Student, Pirate, Geocacher, Projectionist, Software Engineer",
    "default_profile": true,
    "profile_background_color": "C0DEED",
    "notifications": null,
    "profile_background_tile": false,
    "follow_request_sent": null,
    "profile_sidebar_fill_color": "DDEEF6",
    "created_at": "Wed Jun 04 15:49:22 +0000 2008",
    "protected": false,
    "default_profile_image": false,
    "contributors_enabled": false,
    "profile_sidebar_border_color": "C0DEED",
    "followers_count": 301,
    "profile_image_url": "http://a0.twimg.com/profile_images/1485014939/Fabian_und_die_Ju52_normal.JPG",
    "name": "Fabian Schlenz",
    "id_str": "15006408",
    "favourites_count": 27,
    "id": 15006408,
    "lang": "en",
    "profile_use_background_image": true,
    "utc_offset": 3600,
    "url": "http://blog.fabianonline.de"
  },
  "in_reply_to_screen_name": "johnassel",
  "id": 163554444204720130,
  "entities": {
    "user_mentions": [
      {
        "indices": [0, 10],
        "screen_name": "johnassel",
        "name": "Jonas Sell",
        "id_str": "81554965",
        "id": 81554965,
        "type": "user_mentions"
      }
    ],
    "urls": [],
    "hashtags": []
  }
};

tweet_mentioning_this_user = {
  "place": {
    "country_code": "DE",
    "country": "Germany",
    "place_type": "city",
    "attributes": {},
    "full_name": "Dortmund, Dortmund",
    "name": "Dortmund",
    "id": "b4fadeb3a3a29e2f",
    "bounding_box": {
      "type": "Polygon",
      "coordinates": [[[7.302443, 51.415504], [7.638168, 51.415504], [7.638168, 51.599943], [7.302443, 51.599943]]]
    },
    "url": "http://api.twitter.com/1/geo/id/b4fadeb3a3a29e2f.json"
  },
  "geo": {
    "type": "Point",
    "coordinates": [51.51159695, 7.46528895]
  },
  "retweeted": false,
  "text": "@fabianonline Die alte Version liegt unter /gt, die neue unter /unstable",
  "in_reply_to_status_id_str": null,
  "in_reply_to_status_id": null,
  "in_reply_to_user_id_str": "15006408",
  "truncated": false,
  "source": "<a href=\"https://github.com/johnassel/geotweeter/\" rel=\"nofollow\">Geotweeter by @fabianonline</a>",
  "in_reply_to_user_id": 15006408,
  "contributors": null,
  "retweet_count": 0,
  "favorited": false,
  "created_at": "Sun Jan 29 09:29:40 +0000 2012",
  "coordinates": {
    "type": "Point",
    "coordinates": [7.46528895, 51.51159695]
  },
  "id_str": "163554393621401600",
  "user": {
    "show_all_inline_media": true,
    "profile_text_color": "333333",
    "statuses_count": 29673,
    "profile_background_image_url_https": "https://si0.twimg.com/profile_background_images/91744426/hs-2008-34-a-1680x1050_wallpaper.jpg",
    "profile_background_image_url": "http://a0.twimg.com/profile_background_images/91744426/hs-2008-34-a-1680x1050_wallpaper.jpg",
    "screen_name": "johnassel",
    "listed_count": 21,
    "following": null,
    "verified": false,
    "time_zone": "Berlin",
    "profile_link_color": "009999",
    "profile_image_url_https": "https://si0.twimg.com/profile_images/1484980076/Ju52_normal.jpg",
    "location": "Dortmund, Germany",
    "is_translator": false,
    "geo_enabled": true,
    "friends_count": 272,
    "description": "Student @ FH Dortmund, Androidianer, Geocacher - den Nick spricht man btw Dschonässäl ;-)",
    "default_profile": false,
    "profile_background_color": "798ab3",
    "notifications": null,
    "profile_background_tile": false,
    "follow_request_sent": null,
    "profile_sidebar_fill_color": "efefef",
    "created_at": "Sun Oct 11 09:09:15 +0000 2009",
    "protected": false,
    "default_profile_image": false,
    "contributors_enabled": false,
    "profile_sidebar_border_color": "eeeeee",
    "followers_count": 202,
    "profile_image_url": "http://a1.twimg.com/profile_images/1484980076/Ju52_normal.jpg",
    "name": "Jonas Sell",
    "id_str": "81554965",
    "favourites_count": 43,
    "id": 81554965,
    "lang": "en",
    "profile_use_background_image": true,
    "utc_offset": 3600,
    "url": "http://johnassel.de"
  },
  "in_reply_to_screen_name": "fabianonline",
  "id": 163554393621401600,
  "entities": {
    "user_mentions": [
      {
        "indices": [0, 13],
        "screen_name": "fabianonline",
        "name": "Fabian Schlenz",
        "id_str": "15006408",
        "id": 15006408,
        "type": "user_mentions"
      }
    ],
    "urls": [],
    "hashtags": []
  }
};

settings = {
  version: 12,
  twitter: {
    consumerKey: "",
    consumerSecret: "",
    users: [
      {
        token: "",
        tokenSecret: ""
      }
    ]
  }
};

get_account = function() {
  var acct;
  acct = new Account(0);
  return acct;
};
