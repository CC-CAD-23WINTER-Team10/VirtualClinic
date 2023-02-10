const express = require(`express`);
const app = express();
const server = require(`http`).Server(app);

app.set(`view engine`, `ejs`);
app.use(express.static(`public`));

/*
* Routes
*/
app.get(`/`, (req, res) => {
    //res.status(200).send(`Hello World`);
    res.render(`test2`);
});



const port = 3030;
server.listen(port);
console.log(`Open(Ctrl + click) http://localhost:${port} in your broswer.`);