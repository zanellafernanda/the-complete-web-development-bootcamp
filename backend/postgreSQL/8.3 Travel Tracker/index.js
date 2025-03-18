import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

db.connect();

const app = express();
const port = process.env.SERVER_PORT || 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

async function checkVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisited();
  res.render("index.ejs", { countries: countries, total: countries.length });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [input.toLowerCase()]);

    const data = result.rows[0];
    const countryCode = data.country_code;
    
    try {
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
      res.redirect("/");
    } catch (error) {
      const countries = await checkVisited();
      res.render("index.ejs", { countries: countries, total: countries.length, error: "Country has already been added, try again!" });
    }
  } catch (error) {
    const countries = await checkVisited();
    res.render("index.ejs", { countries: countries, total: countries.length, error: "Country does not exist, try again!" });
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
