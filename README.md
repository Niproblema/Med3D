# Med3D
Med3D is a free open-source web-based 3D medical data visualisation application with support for displaying 3D mesh models (in form of OBJ files) as well as 3D volumetric data - such as CT and MRI scans (in form of MHR files).

Application enables remote collaboration between users, who can share data, view, annotations and can also communicate via integrated chat.

## Setup Guide

Med3D requires [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) to run.

Install the dependencies, setup the database and run NodeJS application.
```sh
$ # Load submodules 
$ git pull && git submodule init && git submodule update && git submodule status
$ # Build VPT 
$ cd src/VPT/VPTrepo/	
$ make clean
$ make 
$ cd ../../..
$ # Setup database (do not forget to add path to MongoDB binaries to your PATH variable).
$ mkdir database
$ mongod --dbpath ./database
$ # Start server application with 8gb memory available. 8gb for large json heap for server volume files.
$ node --max-old-space-size=8192 src_server/index.js
$ # Web application should be hosted on: <YOUR IP>:8080/web
```

## Host Resources
Application currently supports hosting of .obj and .raw/.mhd files.
```sh
# Host .obj mesh files by copying them in:
src_server/database_init_resources/obj
# Host .mhd/.raw volume files by copying them in:
src_server/database_init_resources/mhd
# Note: .mhd and .raw volume files must have a matching name
```
