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

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username)
  res.redirect('/urls')
});

app.post('/logout', (req, res) => {
  res.clearCookie('username', req.body.username)
  res.redirect('/urls')
})

app.post('/urls', (req, res) => {
  let id = generateRandomString(6)
  console.log(req.body);
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`)
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] }
  res.render("urls_new", templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
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