var connect = require('connect');
var http = require('http');
const express = require('express');
const cors = require('cors');
var app = connect();

var gzipStatic = require('connect-gzip-static');

var compression = require('compression');
app.use(compression());

app.use(gzipStatic(__dirname + '/'))

app.use(cors())

//create node.js http server and listen on port
http.createServer(app).listen(8080);