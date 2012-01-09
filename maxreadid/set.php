<?php
$data = @unserialize(@file_get_contents('maxreadid.dat'));
if (!is_array($data)) $data = array();

$data[$_POST['account_id']] = $_POST['value'];
$result = @file_put_contents('maxreadid.dat', serialize($data));
if ($result === false) {
    header('HTTP/1.1 500 Internal Server Error');
    echo "Could not write to file maxreadid.dat";
}
