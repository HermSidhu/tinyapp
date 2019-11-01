// TinyApp: store your shortened URLs!
const bodyParser = require("body-parser");
const express = require('express');
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { getUserByEmail, generateRandomString } = require("./helpers");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const urlsForUser = function(id) {
  let userURLS = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userid === id) {
      userURLS[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLS;
};

// sample users
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
};

// sample database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userid: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userid: "aJ48lW" }
};

// banner if you try to use TinyApp without logging in
app.use('/urls', function(req, res, next) {
  if (!req.session.userid) {
    res.render('login', { user: null, msg: "Please Register or Log In First" });
  } else {
    next();
  }
});

// GET: login
app.get('/login', (req, res) => {
  let templateVars = { msg: null, urls: urlDatabase, user: users[req.session.userid] };
  res.render('login', templateVars);
});

// POSE: login
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user &&
    bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userid = user.id;
    res.redirect("/urls");
    return;
  }
  res.status(400);
  res.send("LOGIN INCORRECT");
});

// POST: logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// GET: register
app.get('/register', (req, res) => {
  let templateVars = { msg: null, urls: urlDatabase, user: users[req.session.userid] };
  res.render('register', templateVars);
});

// POST: register
app.post('/register', (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.sendStatus(400);
    return;
  }
  if (getUserByEmail(req.body.email, users)) {
    res.sendStatus(400);
    return;
  }
  let randomID = generateRandomString(10);
  users[randomID] = {
    id: randomID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  };
  req.session.userid = randomID;
  res.redirect('/urls');
});

// POST: URLs
app.post('/urls', (req, res) => {
  let id = generateRandomString(6);
  console.log(req.body);
  urlDatabase[id] = { longURL: req.body.longURL, userid: req.session.userid };
  res.redirect(`/urls/${id}`);
});

// GET: URLs
app.get('/urls', (req, res) => {
  let templateVars = { msg: null, urls: urlsForUser(req.session.userid), user: users[req.session.userid] };
  res.render('urls_index', templateVars);
});

//GET: new URLs
app.get("/urls/new", (req, res) => {
  let templateVars = { msg: null, user: users[req.session.userid] };
  res.render("urls_new", templateVars);
});

// POST: for the short URLs
app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    msg: null,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.userid]
  };
  res.render("urls_show", templateVars);
});

// GET: link to the website using the short URL
app.get('/u/:shortURL', (req, res) => {
  let shortcut = req.params.shortURL;
  if (urlDatabase[shortcut].longURL.startsWith("http://")) {
    res.redirect(urlDatabase[shortcut].longURL);
  } else {
    res.redirect("http://" + urlDatabase[shortcut].longURL);
  }
});

// GET: this just redirects to login if you put "/" in address bar
app.get('/', (req, res) => {
  res.redirect("/login");
});

// starts server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

// GET: a list of URL items in JSON format
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// POST: delete button function
app.post(`/urls/:shortURL/delete`, (req, res) => {
  let shortcut = req.params.shortURL;
  if (urlDatabase[shortcut].userid === req.session.userid) {
    delete urlDatabase[shortcut];
    res.redirect('/urls');
  } else {
    res.redirect('/urls');
  }
});

// POST: edit button function
app.post('/urls/:shortURL', (req, res) => {
  let shortcut = req.params.shortURL;
  if (urlDatabase[shortcut].userid === req.session.userid) {
    urlDatabase[shortcut].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.redirect('/urls');
  }
});