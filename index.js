import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

app.set(`view engine`, `ejs`);

app.use(bodyParser.urlencoded({extended: true}));
// 1. need to create public folder for partials
app.use(express.static("public"));

// initialising the postgres database for access
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "best books",
    password: "Westham99",
    port: 5433,
})
// line to connect to the database
db.connect();    


// function to check the current reviews in the database
 async function checkReviews() {    
    const result = await db.query("SELECT books.isbn, id, url, title, author, date, rating, review FROM books INNER JOIN reviews ON books.isbn = reviews.isbn ORDER BY id;")
    const response = result.rows;
    return response;
}


// route used when the application is first loaded up
app.get("/", async(req,res) => {
    try {
    const result = await checkReviews();        
    const coverURL = `https://covers.openlibrary.org/b/isbn/${result}-M.jpg`;
    console.log(result);
    console.log(result[0])
    res.render("index.ejs",
        {review : result} 
    );
    } catch (err) {
    console.log(err);
    res.render("index.ejs");    
    }
});

// route used to filter the application by rating
app.get("/rating", async(req, res) => {
    const response = await db.query("SELECT books.isbn, id, url, title, author, date, rating, review FROM books INNER JOIN reviews ON books.isbn = reviews.isbn ORDER BY rating DESC;")
    const result = response.rows;
    res.render("index.ejs",
        {review : result}
    );
});

// route used to filter the application by date
app.get("/recency", async(req, res) => {
    const response = await db.query("SELECT books.isbn, id, url, title, author, date, rating, review FROM books INNER JOIN reviews ON books.isbn = reviews.isbn ORDER BY date DESC;")
    const result = response.rows;
    res.render("index.ejs",
        {review : result}
    );
});

// route used to load the edit review page
app.post("/editReview", async(req,res) => {
    const id = req.body.id;
    console.log(id);
    const response = await db.query("SELECT books.isbn, id, url, title, author, date, rating, review FROM books INNER JOIN reviews ON books.isbn = reviews.isbn WHERE id = $1;",
        [id],
    );
    const result = response.rows;
    console.log(result);
    res.render("editReview.ejs",
        {review : result}
    );
})

// route used to load the add review page
app.post("/add", (req,res) => {
    res.render("newReview.ejs")
});

// route used to create a new review
app.post("/new", async(req,res) => {
    // getting the variables from the add form
    const name = req.body.Name;
    const isbn = req.body.isbn;
    const author = req.body.Author;
    const rating = req.body.Rating;
    const review = req.body.Review;
    const date = await db.query("SELECT (CURRENT_DATE);"); 
    const insertedDate = date.rows[0].current_date;
    const coverURL = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    console.log(date.current_date, name, isbn, author, rating, review, coverURL);
    await db.query("INSERT INTO books(isbn, url, title, author) VALUES ($1, $2, $3, $4)",
        [isbn, coverURL, name, author ]
    );
    await db.query("INSERT INTO reviews(date, rating, review, isbn) VALUES ($1, $2, $3, $4)",
        [insertedDate, rating, review, isbn ]
    )
    res.redirect("/");
});

// route used to update a review
app.post("/edit", async(req,res) => {
    const updatedText = req.body.updatedReview;
    const updatedRating = req.body.Rating;
    const id = req.body.id;
    console.log(updatedText, updatedRating, id);
    try {
        await db.query("UPDATE reviews SET review = $1, rating = $2 WHERE id = $3; ",
            [updatedText, updatedRating, id],
        );
        res.redirect("/");
    } catch (error) {
        console.error(err);
    }
})

// route used to delete a review
app.post("/delete", async(req,res) => {
    const id = req.body.id;
    try {
        await db.query("DELETE from reviews WHERE id = $1;",
            [id],
         );
         res.redirect("/");
    } catch (error) {
        console.error(err);   
    }
})

// console logging which port the server is running on
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
