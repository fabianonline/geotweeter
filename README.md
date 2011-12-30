Fabians Geotweeter
==================

Fabians Geotweeter ist mein kleiner, fast komplett in Javascript geschriebener, "privater" Twitter-Client.
Diese Version ist der Coffeescript-basierende Rewrite mit Klassen, Objekten und so.

Die Source-Files liegen in src/, zum Kompilieren nutze man `coffee --bare --join geotweeter.js --compile src/*.coffee`.

Geschichte
----------

Es fing damit an, dass ich einfach einen Twitter-Client haben wollte, der Tweets mit beliebigen, von mir
festgelegten Geotags absenden konnte. Genau das konnte der Geotweeter damals halt (und daher kommt halt auch
der Name).

Dann fand ich es ganz praktisch, auch Tweets anzuzeigen, damit man komfortabler auf Tweets antworten konnte.

Dann wurde die Anzeige aufgehübscht. Twitter führte User-Streams ein... Und so führte eins zum anderen und
der Geotweeter wurde mein privater, selbstgeschriebener und an meine Wünsche und Anforderungen angepasster
Twitter-Client.

Installation
------------

Der Geotweeter war nie dafür gedacht, von jemand anderem als mir genutzt zu werden. Dementsprechend
"komfortabel" lässt er sich an andere User anpassen.

### Ein grober Überblick
In der `.htaccess` werden ein paar Proxys definiert, um die Same-Origin-Policy
zu umgehen. Dafür sollte der Geotweeter auf einem Apache-Server laufen, der entsprechend mod_proxy und
so zur Verfügung hat.

## Apache-Konfiguration
Folgende Module sollten geladen werden:

* mod_proxy
* mod_proxy_http
* mod_rewrite
* mod_ssl

Folgende Einstellungen sollten zudem vorgenommen werden:

    # Wenn man Proxys sonst nicht nutzt, sollte man sie sicherheitshalber deaktivieren
    ProxyRequests off
    <Proxy *>
      Order deny,allow
      Deny from all
    </Proxy>
    
    # Twitter nutzt SSL
    SSLProxyEngine on

Zudem muss die .htaccess genug Rechte haben. Hier wäre dann also im Ordner-Kontext ein
`AllowOverride all` sinnvoll.

## Konfiguration

In der `settings.js` werden Twitter-OAuth-Tokens und -Secrets sowie sonstige Einstellungen hinterlegt.
`settings.js.example` dient hier als Vorlage.

`setmaxreadid.php` und `getmaxreadid.php` sind minimale PHP-Skripte, über die eine Echofon-mäßige Sync-
Funktionalität realisiert wird. Diese müssen Schreibzugriff auf eine Datei `maxreadid.dat` im gleichen
Ordner haben.

