require("dotenv").config();
const express = require("express");
var bodyparser = require("body-parser");
var cors = require("cors");
var request = require("request");
const app = express();
const fetch = require("node-fetch");

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(bodyparser.json());
app.use(
  bodyparser.urlencoded({
    extended: true
  })
);

app.set("port", process.env.PORT || 8080);

// DATABASE
var pgp = require("pg-promise")();

const db = pgp(process.env.DATABASE_URL);

app.get("/", (req, res) => {
  console.log("Backend running on port " + app.get("port"));
  res.send({
    PORT: app.get("port")
  });
});

app.get("/notice/:column", (req, res) => {
  console.log("Request Started");
  db.any("SELECT " + req.params.column + " FROM notice ORDER BY id DESC")
    .then(function(data) {
      console.log(data);
      res.send(data);
    })
    .catch(err => {
      console.log(err);
      res.send("500");
    });
});

app.get("/search/:tags", (req, res) => {
  console.log("Request Started");
  console.log(req.params.tags);
  var tags = req.params.tags.split(" ");
  console.log(tags);
  // tags = tags.join("%");
  // console.log(tags);

  var ids = [];

  var tagQuery = "SELECT * FROM notice WHERE tags LIKE '%" + tags[0] + "%'";
  for (var i = 1; i < tags.length; i++) {
    var tagQuery = tagQuery + " AND tags LIKE '%" + tags[i] + "%'";
  }

  db.any(tagQuery)
    .then(function(data) {
      console.log(data);
      res.send(data);
    })

    .catch(err => {
      console.log(err);
      res.send("500");
    });
});

app.get("/tester", (req, res) => {
  const url = "http://api.postcodes.io/postcodes/W67JQ";
  const getData = async url => {
    try {
      const response = await fetch(url);
      const json = await response.json();
      console.log(json);
      res.send(json);
    } catch (error) {
      console.log(error);
    }
  };

  getData(url);
});

var jsonList = [];
// just an unnecessary comment
app.get("/map", (req, res) => {
  const url = "http://api.postcodes.io/postcodes/";
  jsonList = [];
  const getData = async obj => {
    try {
      const response = await fetch(obj.url);
      const json = await response.json();
      console.log(json);
      jsonList.push({
        id: obj.id,
        postcode: json.result.postcode,
        latitude: json.result.latitude,
        longitude: json.result.longitude,
        pic1: obj.pic1,
        pic2: obj.pic2,
        pic3: obj.pic3
      });
      //jsonList.push(json.result);
      //jsonList.push(json);
    } catch (error) {
      console.log(error);
    }
  };

  db.any(
    "SELECT id,postcode, pic1, pic2, pic3 FROM notice ORDER BY id DESC"
  ).then(async function(data) {
    for (var i = 0; i < data.length; ++i) {
      console.log("postcode " + data[i]["postcode"]);
      var newUrl = url + data[i]["postcode"];
      var encapsulatingJson = {
        url: newUrl,
        id: data[i]["id"],
        pic1: data[i]["pic1"],
        pic2: data[i]["pic2"],
        pic3: data[i]["pic3"]
      };
      await getData(encapsulatingJson);
    }
    res.send(jsonList);
  });
});

app.get("/notice/max/:column", (req, res) => {
  console.log("Request Started");
  db.any(
    "SELECT " +
      req.params.column +
      " FROM notice WHERE length(" +
      req.params.column +
      ") = (SELECT max(length(" +
      req.params.column +
      ")) from notice )" +
      " ORDER BY " +
      req.params.column +
      " DESC fetch first row only"
  )
    .then(function(data) {
      res.send(data);
    })
    .catch(err => {
      console.log(err);
      res.send("500");
    });
});

//post example: curl -d "id=69&title="test"&description="a"&community="a"&tags="ghsj"" -X POST localhost:8080/submit
app.post("/submit", (req, res) => {
  console.log(
    "Submission receieved for",
    req.body.id,
    req.body.title,
    req.body.description,
    req.body.postcode,
    req.body.community,
    req.body.tags,
    req.body.contact,
    req.body.lastSeen,
    req.body.pic1,
    req.body.pic2,
    req.body.pic3
  );
  db.any(
    "INSERT INTO notice (id, title, description, postcode, community, tags, contact, lastseen, pic1, pic2, pic3) VALUES (" +
      req.body.id +
      ", '" +
      req.body.title +
      "', '" +
      req.body.description +
      "', '" +
      req.body.postcode +
      "', '" +
      req.body.community +
      "', '" +
      req.body.tags +
      "', '" +
      req.body.contact +
      "', '" +
      req.body.lastSeen +
      "', '" +
      req.body.pic1 +
      "', '" +
      req.body.pic2 +
      "', '" +
      req.body.pic3 +
      "')"
  )
    .then(function(data) {
      res.send("200");
    })
    .catch(err => {
      console.log(err);
      res.send("500");
    });
});

app.listen(app.get("port"), function() {
  console.log("Server listening on port " + app.get("port"));
});
