var client = require('mysql2');

var koneksi = client.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'tugas5'
});

const sql = `
    CREATE TABLE tb_barang (
        id_barang INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
        nama_barang VARCHAR(100),
        harga_barang INT(10),
        gambar TEXT,
        deskripsi VARCHAR(100)
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