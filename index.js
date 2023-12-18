const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql2');
const OneDay = 1000 * 60 * 60 * 24;
const imageSize = require('image-size');
const session = require('express-session');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
  secret: 'your_secret_key',
  resave: true,
  saveUninitialized: true,
}));
app.use(cookieParser());
app.use(express.json());
function checkAuthentication(req, res, next) {
  if (req.session.authenticated || (req.cookies.authenticated === 'true' && req.cookies.username)) {
    if (!req.session.authenticated) {
      req.session.authenticated = true;
      req.session.username = req.cookies.username;
    }
    return next();
  }
  res.redirect('/register');
}

const connection = mysql.createConnection({
  host: '192.168.1.161',
  user: 'adam.rosch',
  password: 'Roschambo12',
  database: 'arcade',
  port: 3001,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000 * 1920 * 1080 },
});

app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT * FROM uzivatele WHERE BINARY username = ?', [username], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Chyba při registraci.');
    } else {
      if (results.length > 0) {
        res.send('Uživatelské jméno již existuje. Vyberte si prosím jiné.');
      } else {
        connection.query('INSERT INTO uzivatele (username, password) VALUES (?, ?)', [username, password], (error, results, fields) => {
          if (error) {
            console.error(error);
            res.status(500).send('Chyba při registraci.');
          } else {
            console.log('Uživatel byl úspěšně registrován.');
            req.session.authenticated = true;
            req.session.username = username;
            res.cookie('username', username, { maxAge: OneDay });
            res.cookie('authenticated', true, { maxAge: OneDay });
            res.redirect('/main');
          }
        });
      }
    }
  });
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT id, username FROM uzivatele WHERE BINARY username = ? AND BINARY password = ?', [username, password], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Chyba při přihlášení.');
    } else {
      if (results.length > 0) {
        const userId = results[0].id;
        req.session.authenticated = true;
        req.session.username = username;
        req.session.userId = userId;
        res.cookie('username', username, { maxAge: OneDay });
        res.cookie('authenticated', true, { maxAge: OneDay });
        res.redirect('/main');
      } else {
        res.send('Nesprávné uživatelské jméno nebo heslo.');
      }
    }
  });
});

app.get('/main', (req, res) => {
  if (req.session.authenticated) {
    const loggedInUserName = req.session.username;

    connection.query('SELECT * FROM hentai', (error, results, fields) => {
      if (error) {
        console.error(error);
        return;
      }

      const recentImages = results.slice(-5).map(row => ({
        imageURL: `data:image/jpeg;base64,${row.test.toString('base64')}`
      }));

      res.render('main.ejs', { results, loggedInUserName, recentImages });
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/galerie', checkAuthentication, (req, res) => {
  const loggedInUserName = req.session.username;

  connection.query('SELECT hentai.test, uzivatele.username FROM hentai JOIN uzivatele ON hentai.user_id = uzivatele.ID', (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Chyba při načítání obrázků.');
      return;
    }
    res.render('galerie.ejs', { images: results, loggedInUserName });
  });
});
// Definice cesty pro získání SVG
app.get('/karel', (req, res) => {
  // Dotaz na databázi pro získání šířky a výšky
  const sql = 'SELECT width, height FROM dimensions2';

  connection.query(sql, (error, results, fields) => {
    if (error) throw error;

    if (results.length > 0) {
      // Získání dat
      const width = results[0].width;
      const height = results[0].height;

      // Vytvoření SVG kódu s dynamickou šířkou a výškou
      const svgCode = `

      <h1 style="color: red;"><center>Karel</center></h1>
      <style>
      body {
        background-image: url('https://cdn.britannica.com/74/84674-004-C0E414EA/Flag-Palestinian-Authority-Palestine.jpg');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }
    </style>
      <center>
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Tělo kočky -->
          <circle cx="50%" cy="50%" r="40%" fill="#FDB813" />

          <!-- Hlava kočky -->
          <circle cx="70%" cy="30%" r="15%" fill="#FDB813" />

          <!-- Oči -->
          <circle cx="65%" cy="25%" r="2%" fill="black" />
          <circle cx="75%" cy="25%" r="2%" fill="black" />

          <!-- Nos -->
          <polygon points="70%,30% 68%,35% 72%,35%" fill="pink" />

          <!-- Uši -->
          <polygon points="78%,20% 70%,10% 62%,20%" fill="#FDB813" />
          <polygon points="90%,20% 80%,10% 72%,20%" fill="#FDB813" />

          <!-- Tělo ocásku -->
          <ellipse cx="30%" cy="60%" rx="10%" ry="5%" fill="#FDB813" />

          <!-- Ocásek -->
          <line x1="30%" y1="60%" x2="20%" y2="70%" stroke="#000000" stroke-width="2%" />
        </svg>
        </center>
      `;

      res.send(svgCode);
    } else {
      res.send('No data found in the database.');
    }
  });
});
app.get('/Istvan', (req, res) => {
  // Dotaz na databázi pro získání šířky a výšky
  const sql = 'SELECT width, height FROM dimensions2';

  connection.query(sql, (error, results, fields) => {
    if (error) throw error;

    if (results.length > 0) {
      // Získání dat
      const width = results[0].width;
      const height = results[0].height;

      // Vytvoření SVG kódu s dynamickou šířkou a výškou
      const svgCode = `

      <h1 style="color: red;"><center>Ištván</center></h1>
      <style>
      body {
      background-color: white;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }
    </style>
      <center>
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <!-- Tělo tučňáka -->
        <ellipse cx="50%" cy="60%" rx="30%" ry="50%" fill="#000000" />
      
        <!-- Bílý břicho -->
        <ellipse cx="50%" cy="70%" rx="25%" ry="40%" fill="#FFFFFF" />
      
        <!-- Hlava tučňáka -->
        <circle cx="50%" cy="40%" r="20%" fill="#000000" />
      
        <!-- Oko -->
        <circle cx="55%" cy="35%" r="3%" fill="#FFFFFF" />
      
        <!-- Zobák -->
        <polygon points="50%,40% 52%,45% 48%,45%" fill="#FFD700" />
      
        <!-- Nohy -->
        <line x1="48%" y1="60%" x2="48%" y2="75%" stroke="#000000" stroke-width="2%" />
        <line x1="52%" y1="60%" x2="52%" y2="75%" stroke="#000000" stroke-width="2%" />
      </svg>
      
        </svg>
        </center>
      `;

      res.send(svgCode);
    } else {
      res.send('No data found in the database.');
    }
  });
});
app.get('/dino', checkAuthentication, (req, res) => {
  const loggedInUserName = req.session.username;
  res.render('dino.ejs', { loggedInUserName });
});

app.get('/mentalstate', checkAuthentication, (req, res) => {
  const loggedInUserName = req.session.username;
  res.render('mentalstate.ejs', { loggedInUserName });
});
app.get('/upload', checkAuthentication, (req, res) => {
  const loggedInUserName = req.session.username;
  res.render('upload.ejs', { loggedInUserName });
});
app.get('/kok', checkAuthentication, (req, res) => {
  connection.query('SELECT ID, username FROM uzivatele', (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Chyba při načítání uživatelů.');
      return;
    }

    const users = results;
    const loggedInUserName = req.session.username;

    res.render('kok.ejs', { users, loggedInUserName });
  });
});
app.get('/profile', checkAuthentication, (req, res) => {
  const username = req.session.username;

  connection.query('SELECT * FROM uzivatele WHERE username = ?', [username], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Chyba při načítání uživatelských údajů.');
    } else {
      if (results.length > 0) {
        const user = results[0];
        res.render('profile.ejs', { user, loggedInUserName: req.session.username });
      } else {
        res.status(404).send('Uživatel nenalezen.');
      }
    }
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Chyba při rušení session:', err);
    }
    res.clearCookie('username');
    res.clearCookie('authenticated');
    res.redirect('/login');
  });
});


app.post('/upload', checkAuthentication, upload.single('image'), (req, res) => {
  const imageBuffer = req.file.buffer;
  const nameValue = req.body.name;
  const loggedInUsername = req.session.username; // Retrieve the logged-in user's username from the session

  // Fetch the user ID based on the logged-in username
  connection.query('SELECT ID FROM uzivatele WHERE BINARY username = ?', [loggedInUsername], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Chyba při hledání uživatele.');
    } else {
      if (results.length === 0) {
        res.status(404).send('Uživatelské jméno nenalezeno.');
      } else {
        const loggedInUserId = results[0].ID;

        // Insert the uploaded image along with the user ID into the database
        connection.query('INSERT INTO hentai (Name, test, user_id) VALUES (?, ?, ?)', [nameValue, imageBuffer, loggedInUserId], (insertError, insertResults, insertFields) => {
          if (insertError) {
            console.error(insertError);
            res.status(500).send('Chyba při ukládání obrázku.');
          } else {
            console.log('Obrázek byl úspěšně uložen do databáze.');
            res.redirect('/galerie');
          }
        });
      }
    }
  });
});

app.post('/update-username', checkAuthentication, (req, res) => {
  const newUsername = req.body['new-username'];

  if (!newUsername || typeof newUsername !== 'string') {
    return res.status(400).send('Invalid or missing new username in the request body.');
  }

  const trimmedUsername = newUsername.trim();
  const loggedInUserName = req.session.username;

  // Check if the new username already exists in the database
  connection.query(
    'SELECT id FROM uzivatele WHERE username = ?',
    [trimmedUsername],
    (checkError, checkResults) => {
      if (checkError) {
        console.error(checkError);
        return res.status(500).send('Chyba při kontrole existence uživatelského jména.');
      }

      if (checkResults.length > 0) {
        // Username already exists, return an error
        return res.status(409).send('Uživatelské jméno již existuje. Vyberte si prosím jiné.');
      }

      // Continue with the update if the new username is unique
      // Fetch user ID based on the current username
      connection.query(
        'SELECT id FROM uzivatele WHERE username = ?',
        [loggedInUserName],
        (error, results) => {
          if (error) {
            console.error(error);
            return res.status(500).send('Chyba při hledání uživatele.');
          }

          if (results.length === 0) {
            return res.status(404).send('Uživatelské jméno nenalezeno.');
          }

          const userId = results[0].id;

          // Update the username in the database
          connection.query(
            'UPDATE uzivatele SET username = ? WHERE id = ?',
            [trimmedUsername, userId],
            (updateError, updateResults) => {
              if (updateError) {
                console.error(updateError);
                return res.status(500).send('Chyba při aktualizaci uživatelského jména.');
              }

              // Check if any rows were affected
              if (updateResults.affectedRows === 0) {
                return res.status(404).send('Uživatelské jméno nenalezeno.');
              }

              // Update the username in the session
              req.session.username = trimmedUsername;

              return res.redirect('/kok'); // Redirect back to the original page after updating
            }
          );
        }
      );
    }
  );
});
app.listen(port, () => {
  console.log(`Server běží na portu ${port}`);
});
