<?php

$result = [];

# Usage example for staging:
#  - memcached.php 127.0.0.1:3001 [namespace]-[memcached-key]
#  - memcached.php host.docker.internal:3001 [namespace]-[memcached-key]
$hostPort = isset($_SERVER['argv'][1]) ? explode(':', $_SERVER['argv'][1]) : [];
$key = isset($_SERVER['argv'][2]) ? trim($_SERVER['argv'][2]) : null;
$host = null;
$port = null;

if (!empty($hostPort)) {
    $host = array_shift($hostPort);
    $port = array_shift($hostPort);
}

if ($port !== null && !empty(trim($port))) {
    $port = (int)$port;
}

if ($port > 0 && $key !== null && !empty(trim($key))) {
    // This is how I now it's Memcache or Memcached
    $memcacheKeys = [
        'memcache_key_name'
    ];

    $adapter = in_array($key, $memcacheKeys) ? 'Memcache' : 'Memcached';

    // Init connection.
    $client = new $adapter();
    $response = $client->addServer($host, $port);

    if ($response === false) {
        throw new Exception('Could not connect to memcached server on host="'.$host.'" and port="'.$port.'"');
    }

    // GET query.
    $result = $client->get($key);

    if (gettype($result) === 'string') {
        $object = unserialize($result);
        if ($object !== false) {
            $result = (array)$object;
        }
    } elseif (gettype($result) === 'integer') {
        $result = ['value' => $result];
    }

    // Handle string response.
    if (!is_array($result)) {
        $result = [$result];
    }
}

echo json_encode($result);
