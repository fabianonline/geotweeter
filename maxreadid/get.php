<?php
$data = @unserialize(@file_get_contents('maxreadid.dat'));
if (is_array($data) && isset($data[$_GET['account_id']])) {
	echo $data[$_GET['account_id']];
} else {
	echo 0;
}