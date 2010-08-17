<?php
$data = file_get_contents('maxreadid.dat');
if (strlen($data)==0) {
    echo '0';
} else {
    echo $data;
}

