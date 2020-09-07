var express         = require('express');
var mysql           = require('mysql2');
var session         = require('express-session');
var BodyParser      = require('body-parser');
var uploadGambar    = require('express-fileupload');
var fs              = require('fs');

var app = express();

app.set('views', './templates');
app.set('view engine', 'pug');
app.use(express.static('assets'));
app.use(uploadGambar());

var koneksi = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tugas5'
});

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(BodyParser.urlencoded({extended:true}))
app.use(BodyParser.json());

// Route To Login
app.get('/', function (req, res) {
    res.render('V_login');
});

app.post('/', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    if(username && password) {
        koneksi.query('SELECT * FROM tb_user WHERE username = ? AND password = md5(?)', [username, password], function (error, result, fields) {
            if(error) {
                throw error;
            } else {
                if(result.length > 0) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    res.redirect('/main');
                    res.end();
                } else {
                    res.render('V_login', {'msg' : `Username & Password Salah!`});
                }
            }
            res.end();
        });
    } else {
        res.render('V_login', {'msg' : `Masukan Username & Password!`});
		res.end();
    }
});

app.get('/register', function (req, res) {
    res.render('V_register');
});

app.post('/register', (req, res) => {
    var queryGetUsername = 'SELECT * FROM tb_user WHERE username = ? OR email = ?';
    var dataAkun = [
        req.body.username,
        req.body.email
    ];
    koneksi.query(queryGetUsername, dataAkun, (error, result, field) => {
        if(error) 
        {
            throw error;
        } else {
            if(result.length > 0) {
                res.render('V_register', {'msg' : `Akun ${dataAkun[0]} atau ${dataAkun[1]} sudah ada, Silahkan gunakan Username & Email yang lain !!!`});
                res.end();
            } else {
                var DataAkun = [ 
                    req.body.email,
                    req.body.username,
                    req.body.password
                ];
                var sql   = 'INSERT INTO tb_user VALUES(null,?,?,md5(?))';
            
                koneksi.query(sql, DataAkun, (error, result) => {
                    if(error) {
                        // console.log('Data Gagal Dibuat');
                        throw error;
                    }
                    // console.log('Data Berhasil Dibuat');
                    res.redirect('/');
                });
            }
        }
    })
});

app.get('/main', function (req, res) {
    if(req.session.loggedin) {
        koneksi.query(`SELECT COUNT(*) AS cnt FROM tb_user`, (error, result, fields) => {
            koneksi.query(`SELECT COUNT(*) AS brg FROM tb_barang`, (error2, result2, fields2) => {
                if(error)
                {
                    throw error;
                }
                var totalDataUser = result[0].cnt;
                var totalDataBarang = result2[0].brg;
                console.log(totalDataUser);
                console.log(totalDataBarang);
                res.render('V_utama', {'totalUser' : totalDataUser, 'totalBarang': totalDataBarang});
            })
        });
    } else {
        res.redirect('/');  
    }
});


// User
app.get('/user', function (req, res) {

    if(req.session.loggedin) {
        var User = [];
        koneksi.query('SELECT * FROM tb_user', function (error, result, fields) {

            if (error) res.status(500).json({"status_code":500, "error_message" : "internal server error"});

            var no = 0;
            for (let index = 0; index < result.length; index++) {

                var data = {
                    'no'        : ++no,
                    'id'        : result[index].id,
                    'username'  : result[index].username,
                    'email'     : result[index].email
                };
                
                User.push(data);

            }
            res.render('V_dataUser', {'data' : User});
            res.end();
        });
    } else {
        res.redirect('/');
    }
});

app.post('/EditUser', (req, res) => {
    if(req.session.loggedin) {
        var email       = req.body.email;
        var username    = req.body.username;
        var id          = req.body.idUser;
        var sql = 'UPDATE tb_user SET email=?, username=? WHERE id=?';
        koneksi.query(sql, [email, username, id], (error, results) => {
            if(error) throw error
            res.redirect('/user');
        }); 
    } else {
        res.redirect('/')
    }
});

app.post('/deleteUser',(req, res) => {
    if(req.session.loggedin) {
        var sql = "DELETE FROM tb_user WHERE id="+req.body.id+"";
        koneksi.query(sql, function (err, results) {
            if(err)
            {
                throw err;
            }

            res.redirect('/user');
            res.end();
        });
    } else {
        res.redirect('/')
    }
});


// Barang
app.get('/barang', (req, res) => {
    if(req.session.loggedin) {
        koneksi.query('SELECT * FROM tb_barang', (error, result, fields) => {
            if (error) {
                throw error;
            }
             
            var dataBarang = [];
            var no = 0;
            for (let i = 0; i < result.length; i++) {
                var Barang = {
                    'no'            : ++no,
                    'id'            : result[i].id_barang,
                    'nama_barang'   : result[i].nama_barang,
                    'harga_barang'  : result[i].harga_barang,
                    'gambar'        : result[i].gambar,
                    'deskripsi'     : result[i].deskripsi,
                };
                dataBarang.push(Barang);
            }
            res.render('V_barang', {'data' : dataBarang, 'username' : username});
            res.end();
        })
    } else {
        res.redirect('/')
    }
})

app.post('/barang', (req, res) => {
    var namaBarang  = req.body.namaBarang;
    var hargaBarang = req.body.hargaBarang;
    var deskripsi   = req.body.deskripsi;
    console.log(req.files);

    if (req.files) {
        var file = req.files.gambar;
        var date = Date.now();
        var filename = date + '-' + file.name;
        var params = [namaBarang, hargaBarang, filename, deskripsi];
        console.log(params);

        if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/jpg' || file.mimetype == 'image/png' || file.mimetype == 'image/gif') {
            file.mv('assets/img/'+filename, (error) => {
                if(error) return res.status(500).send(error);
                var sql = 'INSERT INTO tb_barang VALUES(null,?,?,?,?)';
                koneksi.query(sql, params, (error, result) => {
                    res.redirect('/barang');
                })
            })
        } else {
            console.log('Penambahan Data Gagal1')
            res.redirect('/barang');
        }
    } else {
        console.log('Penambahan Data Gagal2')
        res.redirect('/barang');
    }
})

app.post('/EditBarang', (req, res) => {
    var namaBarang  = req.body.namaBarang;
    var hargaBarang = req.body.hargaBarang;
    var deskripsi   = req.body.deskripsi;
    var id          = req.body.idBarang;
    
    if (req.files) {
        var file = req.files.gambar;
        var gambarLama = req.body.gambarLama;
        var date = Date.now();
        var filename = date + '-' + file.name;
        var params = [namaBarang, hargaBarang, filename, deskripsi, id]; 
        if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/jpg' || file.mimetype == 'image/png' || file.mimetype == 'image/gif') {
            file.mv('assets/img/'+filename, (error) => {

                if(error) return res.status(500).send(error);
                var sql = 'UPDATE tb_barang SET nama_barang=?, harga_barang=?, gambar=?, deskripsi=? WHERE id_barang=?';
                koneksi.query(sql, params, (error, result) => {
                    path = './assets/img/'+gambarLama;
                    try {
                        fs.unlinkSync(path);
                        res.redirect('/barang');
                    } catch (error) {
                        console.log(error);
                    }
                })
            })
        } else {
            console.log('Penambahan Data Gagal1')
            res.redirect('/barang');
        }
    } else {
        console.log('Penambahan Data Gagal2')
        res.redirect('/barang');
    }
})

app.post('/deleteBarang', (req, res) => {
    var id = req.body.id;
    var gambar = req.body.gambar;
    var sql = 'DELETE FROM tb_barang WHERE id_barang = ?';
    koneksi.query(sql, id, function (error, result) {
        if (error) return res.status(400).send('Error here.')

        // delete photo
        path = `./assets/img/${gambar}`;
            try {
            //file removed
            fs.unlinkSync(path)
            // kode untuk direct ke root
            res.redirect('/barang')
            } catch(err) {
            console.error(err)
            }
    })
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

app.get('*', (req,res) => {
    res.send('404 Not Found');
})

app.listen(3000);
console.log('Server Berjalan di PORT : 3000')