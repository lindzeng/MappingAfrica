<?php

// phpinfo();

$q = $_GET['kml'];
// $q = 'KML_01JUL13.kml';
// echo $q;

$dbconn = pg_connect("host=localhost port=5432 dbname=mappingafrica_sample_db");
if (!$dbconn) {
    die('Could not connect');
}
// echo "Connected successfully";
    
$sql="SELECT image_name FROM kml_data WHERE kml_name='".$q."'";
// echo $sql;

$result = pg_query($dbconn, $sql);
if (pg_num_rows($result) > 0) {
    while ($row = pg_fetch_assoc($result)) {
        $imageName = $row['image_name'];
        echo $imageName;
    }
} else {
    // echo "0 results";
    die('Could not retrieve result');
}

pg_close($dbconn);
?>