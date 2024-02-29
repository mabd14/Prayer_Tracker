module.exports = function (app, prayerData) {
  const { check, validationResult } = require("express-validator");

  const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
      res.redirect("./login");
    } else {
      next();
    }
  };

  app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
  });

  app.get("/", function (req, res) {
    const data = {
      ...prayerData,
      username: req.session.userId || null,
    };
    res.render("index.ejs", data);
  });

  function getDefaultPrayers(callback) {
    const query = 'SELECT id FROM prayers WHERE type = "Fard"';
    db.query(query, (err, results) => {
      if (err) {
        console.error("Failed to fetch default prayers:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  }

  function addDefaultPrayersForUser(userId, prayers) {
    prayers.forEach((prayer) => {
      const insertQuery =
        'INSERT INTO user_prayers (user_id, prayer_id, date, status) VALUES (?, ?, CURDATE(), "Not Performed")';
      db.query(insertQuery, [userId, prayer.id], (err, result) => {
        if (err) {
          console.error("Failed to insert default prayer for user:", err);
        } else {
          console.log(`Default prayer added for user ${userId}: ${prayer.id}`);
        }
      });
    });
  }

  app.get("/register", function (req, res) {
    res.render("register.ejs", prayerData);
  });

  app.post("/registered", [
    check("email").isEmail(),
    check("password")
      .isLength({ min: 1 }).withMessage("Password cannot be empty")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/).withMessage("Password must contain 8 characters, including an uppercase letter, a lowercase letter, and a number"),
  ], (req, res) => {
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const { email, username, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send("Error processing the password.");
        }
      
        db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword], (err, results) => {
          if (err) {
            console.error("Failed to insert user into database:", err);
            return res.status(500).send("An error occurred during registration. Please try again later.");
          }
      
          getDefaultPrayers((err, prayers) => {
            if (err) {
              console.error('Error fetching default prayers:', err);
              return res.status(500).send("Failed to set up default prayers.");
            }
            addDefaultPrayersForUser(results.insertId, prayers);
            res.redirect("./login"); 
          });
        });
      });
});


  app.get("/login", function (req, res) {
    res.render("login.ejs", prayerData);
  });

  app.post("/loggedin", function (req, res) {
    const bcrypt = require("bcrypt");
    let sqlquery = "SELECT password, id FROM users WHERE username = ?";
    let user = [req.body.username];

    db.query(sqlquery, user, (err, result) => {
      if (err) {
        console.error("Database Error:", err.message);
        return res.status(500).send("Internal Server Error");
      }

      if (result.length === 0) {
        return res.status(400).send("User not found.");
      }

      const hashedPassword = result[0].password;

      bcrypt.compare(
        req.body.password,
        hashedPassword,
        function (err, isMatch) {
          if (err) {
            console.error("Bcrypt Error:", err.message);
            return res.status(500).send("Error while comparing passwords.");
          }

          if (isMatch) {
            req.session.userId = req.body.username;
            req.session.userDbId = result[0].user_id;
            res.redirect("./");
          } else {
            res.status(401).send("Incorrect Password!");
          }
        }
      );
    });
  });

  app.get("/tracker", (req, res) => {
    res.render("tracker.ejs",prayerData)
});













  app.get("/logout", redirectLogin, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("./");
      }
      res.redirect("./");
    });
  });
};
