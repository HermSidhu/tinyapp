const bodyParser = require("body-parser");
const express = require('express');
const app = express();
const PORT = 8080;
const cookieParser = require("cookie-parser")

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

app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/login', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies.userid] };
  res.render('login', templateVars);
})

app.post('/login', (req, res) => {
  console.log(req.body.email)
  for (userid in users) {
    console.log('user', userid, users[userid].email)
    if (req.body.email === users[userid].email && req.body.password === users[userid].password) {
      res.cookie('userid', req.body.userid)
      res.redirect("/urls")
    };
  };
  res.send("LOGIN INCORRECT");
  res.sendStatus(400);
});

app.post('/logout', (req, res) => {
  res.clearCookie('userid', req.body.userid)
  res.redirect('/urls')
})

app.get('/register', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies.userid] };
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
    password: req.body.password
  }
  res.cookie('userid', randomID);
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  let id = generateRandomString(6)
  console.log(req.body);
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`)
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies.userid] };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: req.cookies.userid }
  res.render("urls_new", templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: req.cookies.userid };
  console.log(req.params)
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  let shortcut = req.params.shortURL;
  if (urlDatabase[shortcut].startsWith("http://")) {
    res.redirect(urlDatabase[shortcut])
} else { 
  res.redirect("http://" + urlDatabase[shortcut])
}
  console.log(shortcut + urlDatabase[shortcut]);
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
  delete urlDatabase[shortcut]
  res.redirect('/urls')
})

app.post('/urls/:shortURL', (req, res) => {
  let shortcut = req.params.shortURL;
  urlDatabase[shortcut] = req.body.longURL
  res.redirect('/urls')
})