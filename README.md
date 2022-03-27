# Visualise igbinary serialized values for Memcache/Memcached.

This tool is developed to ease checking igbinary (PHP) serialized Memcached values over SSH. 
Once running it is exposing a port (by default: 3008) used for loading the user 
interface in a web browser (e.g. http://127.0.0.1:3008)

It supports: 
* to compare values to find difference between two Memcached instances.
* connection over SSH
* Yubikey
* Syntax highlighting (e.g. PHP array)

## Dependency

- BASH (>= 3.2) or ZSH
- socat
- jq
- Docker Desktop (>= 2.3.0.4)
- SSH Client

MAC users can use brew to install 'jq' and 'socat':
```
brew update && brew install jq socat
```

## Docker

The tool is packaged into a docker image and developed in NodeJS (Express framework).
Images are created based on the official Alpine version of PHP & NodeJS docker images.

## How to use it?

Copy `settings.json.example` to `src/settings.json` modify the values (e.g. `sshUser`, port numbers, etc...) as you need.

To start the tool:
```
$ ./start.sh 
```

Once it's running please follow onscreen instructions (STDOUT).

## Common connection problems

- Yubikey is not inserted.
- GPG Keychain is not running.
- User has SSH permission to the server.
- SSH waiting for RSA key fingerprint verification (Solution: Accept it in the terminal you started the MCE)
- SSH permission denied. (Solution: restart the Terminal/GPG Keychain/Computer)
- `sshUser` value is incorrect/empty in `src/settings.json` file.

The tool is using simple SSH client for connecting to Memcached.
You can easily verify if SSH working correctly on your machine with the following command: `ssh [sshUser]@[host]`
