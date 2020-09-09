var client = require('mysql2');

var koneksi = client.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'tugas5'
});

const sql = `
    CREATE TABLE tb_user (
        id INT(4) NOT NULL PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(100),
        username VARCHAR(100),
        password VARCHAR(40)
    )
`;

koneksi.query(sql,function (error, result) {
    
    if (error) {
        console.log('Tabel gagal dibuat')
        throw error;
    }
    console.log('Tabel berhasil dibuat');
});

koneksi.end();