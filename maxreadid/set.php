<?php
$old_string = @file_get_contents('maxreadid.dat');
$data = json_decode($old_string, true);
if (!is_array($data)) $data = array();
$data[$_GET['account_id']] = $_GET['id'];
$result = @file_put_contents('maxreadid.dat', json_encode($data));
if ($result === false) {
    header('HTTP/1.1 500 Internal Server Error');
    echo "Could not write to file maxreadid.dat";
}

