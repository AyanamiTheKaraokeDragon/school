const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
// app.use(express.static('public'));
const bodyParser = require('body-parser');
const ejs = require('ejs');//šablonovací knihovna
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))
const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: '192.168.1.161',
  user: 'adam.rosch',
  password: 'Roschambo12',
  database: 'adam.rosch',
  port: 3001
});

app.get('/anime', (req, res) => {
  connection.query('SELECT * FROM anime', (error, results, fields) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(results);
    res.render('users',{results});

 
  });
});
app.get("/newuser", (req, res) => {
  let results = 5;
  res.render('newuser',{results});
});

app.post('/newuser', function (request, response, next) {
  console.log(request.body)
  var sql = `INSERT INTO anime (Nazev, Hodnoceni, Rok_vydani) VALUES ('${request.body.Nazev}', '${request.body.Hodnoceni}', '${request.body.Rok_vydani}')`;

  connection.query(sql, (error, results, fields) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(results);
    response.send('Anime bylo vloženo do DB');
  });
});
app.get('/users2', (req, res) => {

  //dotaz na SQLccd 
  connection.query('SELECT * FROM anime', (error, results, fields) => {
    if (error) {
      console.error(error);
      return;
    }

    res.render('index', { results });

  })
})



app.get('/', (req, res) => {
  fs.readFile('index.html', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Interní chyba serveru');
      return;
    }
    res.send(data);
  });
});

app.listen(3000, () => {
  console.log('Server běží na portu 3000');
});