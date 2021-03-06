const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const expressSession = require("express-session");
const SessionStore = require("express-session-sequelize")(expressSession.Store);
const { conn, User } = require("../db");
const passport = require("../passport/setup");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const server = express();

///////////////
// MIDDLEWARES
///////////////
server.name = "auth";
server.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
server.use(bodyParser.json({ limit: "50mb" }));
server.use(cookieParser());
server.use(morgan("dev"));
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

server.use(
  cors({
    credentials: true,
    // origin: "http://localhost"
  })
);

//Session store
const sequelizeSessionStore = new SessionStore({
  db: conn,
});

//Express session
server.use(
  expressSession({
    secret: "keep it secret, keep it safe.",
    store: sequelizeSessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

//Passport middleware
server.use(passport.initialize());
server.use(passport.session());

// Error catching endware.
server.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const message = err.message || err;
  console.error(err);
  res.status(status).send(message);
});

// Middleware to verified email
const isNotVerified = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (user.isVerified) {
      return next();
    }
    res.send({
      success: false,
      message:
        "Your account has not been verified. Please check your email to verify your account",
    });
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      message: "Something went wrong. Please contact us for assistance.",
      error,
    });
  }
};

////////////////
// ROUTES /POST/
////////////////

// Route for logging in
server.post("/auth/login", isNotVerified, (req, res, next) => {
  console.log(req.body);
  passport.authenticate("local-login", (err, user, info) => {
    if (err) {
      return res.status(200).send({
        success: false,
        message: err.message,
        info,
      });
    }
    if (!user) {
      return res.status(200).send({
        success: false,
        info,
      });
    }
    req.login(user, function (err) {
      if (err) {
        return res.status(400).send(err);
      }
      return res.status(200).send({
        success: true,
        message: "You've logged in successfully",
        info,
        user,
      });
    });
  })(req, res, next);
});

// Route for reset password
server.post("/auth/reset_password", async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return res
        .send({ success: false, message: "User not found" });
    }
    const newResetToken = crypto.randomBytes(8).toString("hex");
    user.resetToken = newResetToken;
    await user.save();

    const msg = {
      template_id: process.env.SENGRID_TEMPLATE_ID_PASSWORD_RESET,
      from: {
        email: process.env.SENDGRID_SENDER_EMAIL,
        name: process.env.SENDGRID_SENDER_NAME,
      },
      personalizations: [
        {
          to: [
            {
              email: req.body.email,
            },
          ],
          dynamic_template_data: {
            name: user.name,
            newResetToken: newResetToken,
          },
        },
      ],
    };
    await sgMail.send(msg);
    res.send({
      success: true,
      message: `A reset token has been sent to your email.`,
    });
  } catch (e) {
    console.log(e);
    return next(new Error(e));
  }
});

// Route for checking passcode
server.post("/auth/check-passcode", async (req, res, next) => {
  const { passcode, userId } = req.body;
  User.findByPk(userId).then((user) => {
    if (user.checkPasscode(passcode)) {
      return res.status(200).send({
        success: true,
        message: "The provided passcode is valid",
      });
    } else {
      return res.send({
        success: false,
        message: "The provided passcode is incorrect",
      });
    }
  });
});

////////////////
// ROUTES /GET/
////////////////

// Route for getting session's info in case User is logged
server.get("/auth/info", (req, res, next) => {
  console.log(req.session);
  if (req.isAuthenticated()) {
    res.send({
      success: true,
      user: req.user,
    });
  } else {
    res.send({
      success: false,
      user: {
        role: "guest",
      },
      message: "You're not logged in",
    });
  }
});

// Fetching this route, logs out the user
server.get("/auth/logout", (req, res, next) => {
  try {
    req.session.destroy();
    req.logOut();
    res
      .status(200)
      .send({ success: true, message: "You have logged out successfully" });
  } catch (err) {
    res.send({ success: false, err });
  }
});

//   server.get(
//     "/auth/google",
//     passport.authenticate("google", { scope: ["profile", "email"] })
//   );

//   server.get(
//     "/auth/google/callback",
//     passport.authenticate("google", {
//       failureRedirect: "http://localhost:3000/login",
//     }), //cambiar luego
//     function (req, res) {
//       // Successful authentication, redirect home.
//       res.redirect("http://localhost:3000/");
//     }
//   );

////////////////
// ROUTES /PUT/
////////////////

// Route for changing password
server.put("/auth/change-password", (req, res, next) => {
  const { newResetToken, newPw } = req.body;
  User.findOne({ where: { resetToken: newResetToken } })
    .then((user) => {

      user.password = newPw;
      user.save();
      res.status(200).send({
        success: true,
        message: "The password has been successfully updated",
      });
      //}
    })
    .catch((err) => {
      res.send({
        success: false,
        message: "The provided reset token is not valid",
      });
    });
});

// Route for changing password
server.put("/auth/change-password/user", (req, res, next) => {
  const { currentPw, newPw, userId } = req.body;
  User.findByPk(userId)
    .then((user) => {
      if (!user.checkPassword(currentPw))
        return res.send({
          success: false,
          message: "The provided current password is not valid.",
        });
      else {
        user.password = newPw;
        user.save();
        res.status(200).send({
          success: true,
          message: "The password has been successfully updated",
        });
      }
    })
    .catch((err) => {
      res.status(400).send({
        success: false,
        message: "Something went wrong",
      });
    });
});

// Deploying service server
server.listen(3001, () => {
  console.log("Auth service running on 3001");
});

module.exports = server;
