const bodyParser = require("body-parser");
const express = require('express');
const app = express();
const PORT = 8080;
// const cookieParser = require("cookie-parser")
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

function generateRandomString(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userid: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userid: "aJ48lW" }
};

const urlsForUser = function(id) {
  let userURLS = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userid === id) {
      userURLS[shortURL] = urlDatabase[shortURL]
    }
  }
  return userURLS;
}

app.get('/login', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.session.userid] };
  res.render('login', templateVars);
})

app.use('/urls', function (req, res, next) {
  if (!req.session.userid) {
    res.redirect('/login')
  } else {
    next();
  }
});

app.post('/login', (req, res) => {
  console.log('users:', users);
  console.log('body: ', req.body)
  for (userid in users) {
    if (
      req.body.email === users[userid].email && 
      bcrypt.compareSync(req.body.password, users[userid].password) 
    ) {
      req.session.userid = userid;
      console.log("!!!!!!!!!",req.body)
      res.redirect("/urls")
      return;
    }
  }
  res.status(400);
  res.send("LOGIN INCORRECT");
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls')
})

app.get('/register', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.session.userid] };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  console.log("Here")
  if (req.body.email === "" || req.body.password === "") {
    res.sendStatus(400);
    return;
  } 
  for (userid in users) {
     if (req.body.email === users[userid].email) {
      res.sendStatus(400);
      return;
    }
  }
  let randomID = generateRandomString(10);
  users[randomID] = {
    id : randomID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  }
  req.session.userid = randomID;
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  let id = generateRandomString(6)
  console.log(req.body);
  urlDatabase[id] = { longURL: req.body.longURL, userid: req.session.userid };
  res.redirect(`/urls/${id}`)
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlsForUser(req.session.userid), user: users[req.session.userid] };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.userid] }
  res.render("urls_new", templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL, 
    user: users[req.session.userid] 
  };
  console.log("!!!!!!!!!!", templateVars)
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  let shortcut = req.params.shortURL;
  if (urlDatabase[shortcut].longURL.startsWith("http://")) {
    res.redirect(urlDatabase[shortcut].longURL)
} else { 
  res.redirect("http://" + urlDatabase[shortcut].longURL)
}
  console.log(shortcut + urlDatabase[shortcut].longURL);
});

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post(`/urls/:shortURL/delete`, (req, res) => {
  let shortcut = req.params.shortURL;
  if (urlDatabase[shortcut].userid === req.session.userid) {
    delete urlDatabase[shortcut]
    res.redirect('/urls')
  } else {
    res.redirect('/urls')
  }
})

// EDIT function
app.post('/urls/:shortURL', (req, res) => {
  let shortcut = req.params.shortURL;
  if (urlDatabase[shortcut].userid === req.session.userid) {
    urlDatabase[shortcut].longURL = req.body.longURL
    res.redirect('/urls')
  } else {
    res.redirect('/urls')
  }
})