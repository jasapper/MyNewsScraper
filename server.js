var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request"); 
var cheerio = require("cheerio");
var express = require("express");
var logger = require("morgan");
var app = express();

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI); // "useMongoClient" is deprecated

var db = mongoose.connection;

var Article = require("./models/Article.js");
var Note = require("./models/Notes.js");

var PORT = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/", function (req, res) {
	Article.find({}, function (error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			res.render("index", { articles: doc });
		}
	});
});

app.get("/scrape", function (req, res) {
	request("https://www.nbcdfw.com/news/local/", function (error, response, html) {
		var $ = cheerio.load(html);
		// Grabbing the article title from every h3 tag
		$("h3.title").each(function (i, element) {
			var result = {};

			// Add the text and href of every link... prepending https: to links due to site's funky linking strategy
			result.title = $(this)
				.text();
			result.link = "https:" + $(this)
				.children()
				.attr("href");

			var entry = new Article(result);

			// Save each object to the db
			entry.save(function (err, doc) {
				if (err) {
					console.log(err);
				}
				else {
					console.log(doc);
				}
			});

		});
	});
  // Redirect to root after completing scrape to view latest articles
	res.redirect("/");
});

app.get("/articles", function (req, res) {
	Article.find({}, function (error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			res.json(doc);
		}
	});
});

// Grab a specific article by it's id then populating with it's note
app.get("/articles/:id", function (req, res) {
	Article.findOne({ "_id": req.params.id })
		.populate("note")
		.then(function(doc) {
			res.json(doc);
		})
		.catch(function (err) {
			res.json(err);
		});
});

// Route for saving/updating note to their associated article
app.post("/articles/:id", function (req, res) {
	var newNote = new Note(req.body);
	newNote.save(function (error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
				.exec(function (err, doc) {
					if (err) {
						console.log(err);
					}
					else {
						res.send(doc);
					}
				});
		}
	});
});

app.listen(PORT, function () {
	console.log("Running on port " + PORT + "!");
});