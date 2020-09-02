var http = require('http')
var Client = require('mysql2')
var pug = require('pug')
var qs = require('querystring')
var url = require('url')
var NodeSession = require('node-session')

var register = './templates/V_register.pug';
var login = './templates/V_login.pug';
var pageUtama = './templates/V_utama.pug';

var db = Client.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tugas5'
})

// membuat session
var session = new NodeSession({
    secret: 'Q3UBzdH9GEfiRCTKbi5MTPyChpzXLsTD'
})

var server = http.createServer(function (req, res) {

    session.startSession(req, res , function () {

        if (req.url === "/") {
            
            res.writeHead(200, {"Content-Type" : "text/html"});
            var template = pug.renderFile(login);
            res.end(template);  

        } else if (req.url === "/login" && req.method === "POST") {

            var body = '';

            req.on('data', function (data) {
                body += data
            })

            req.on('end', function () {
                var form = qs.parse(body);
                var params = [
                    form['username'],
                    form['password']
                ];

                var sql = `SELECT COUNT(*) AS cnt FROM tb_user WHERE username = ? AND password = md5(?)`;

                db.query(sql, params, function (error, result) {

                    if (error)
                    {
                        throw error;
                    }

                    var n = result[0]['cnt'];
                    console.log(`Nilai n adalan ${n}`);
                    if (n > 0) {
                        // login berhasil
                        req.session.put("username", params[0]);
                        // redirect ke halaman utama 
                        res.writeHead(302,{'Location' : '/main'});
                        res.end();

                    } else {

                        res.writeHead(200, {'Content-Type' : 'text/html'});
                        var template =  pug.renderFile(login, {msg : "User ID atau password salah !!"});
                        res.end(template);

                    }
                })
            })

        } else if (req.url === "/register" && req.method === 'GET') { 

            res.writeHead(200, {"Content-Type" : "text/html"});
            var template = pug.renderFile(register);
            res.end(template);

        } else if (req.url === "/main") { 
            
            if(!req.session.has('username')) {
                res.writeHead(302, {'Location' : '/'});
                res.end();
            } else if (req.session.has('username')) {
                db.query(`SELECT * FROM tb_user`, function (error, result) {
                    if (error)
                    {   
                        console.log('Gagal menampilkan data');
                        throw error;
                    }
                    var no = 0;
                    var username = req.session.get('username');
                    var template = pug.renderFile(pageUtama, {data:result, username:username, no : no});
                    res.writeHead(200, {"Content-Type" : "text/html"});
                    res.end(template);
                })

            }
            
        } else if (req.url === "/register" && req.method === 'POST') {
            var body = '';

            req.on('data', function (data) {
                body += data
            })

            req.on('end', function() {
                var sqlCek = `SELECT COUNT(*) AS cnt FROM tb_user WHERE username = ?`;
                var form = qs.parse(body);
                var username = form['username'];

                db.query(sqlCek, username, function(error, result) {

                    if(error) {
                        throw error;
                    }

                    var n = result[0]['cnt'];
                    if (n > 0) {
                        res.writeHead(200, {"Content-Type" : "text/html"});
                        var template =  pug.renderFile(register, {msg : "Username sudah digunakan !!"});
                        res.end(template);
                    } else {      
                        var DataAkun = [ 
                            form['email'],
                            form['username'],
                            form['password']
                        ];
                        var sql = 'INSERT INTO tb_user VALUES(null,?,?,md5(?))';
                        
                        db.query(sql, DataAkun, function(error, result) {
                            if (error)
                            {
                                throw error
                            }
                            
                            console.log('Data Inputan : ' + result.affectedRows);
                            // kode untuk direct ke root 
                            var template =  pug.renderFile(login, {msg : "Berhasil menambahkan Akun"});
                            res.end(template);
                        });
                    }
                });
            })  
        } else if (req.url === "/logout") {

            if (req.session.has('username')) {
                req.session.forget('username');
            }

            // direcct ke login
            res.writeHead(302, {'Location' : "/"});
            res.end();
        }
         else {
            res.writeHead(200, {"Content-Type" : "text/html"});
            res.end('Halaman tidak ditemukan');   
        }
    })

})

server.listen(4000);