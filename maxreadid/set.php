<?php
$result = @file_put_contents('maxreadid.dat', $_GET['id']);
if ($result === false) {
    header('HTTP/1.1 500 Internal Server Error');
    echo "Could not write to file maxreadid.dat";
}

