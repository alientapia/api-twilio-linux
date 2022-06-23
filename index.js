const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
const { redirect } = require("express/lib/response");
const res = require("express/lib/response");

const VoiceResponse = require("twilio").twiml.VoiceResponse;
const urlencoded = require("body-parser").urlencoded;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

const port = process.env.PORT || 3000;

const app = express();
let intentos = 0;
// Parse incoming POST params with Express middleware
app.use(urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(express.json());

// Create a route that will handle Twilio webhook requests, sent as an
app.get("/", (req, res) => {
  res.status(200).send(`<h1>Api de prueba Entel IVR Twilio</h1>`);
});
// HTTP POST to /voice in our application
app.post("/api/voice", async (request, response) => {
  //console.log(request.body);
  console.log({ body: request.body });
  intentos++;
  console.log("Intento numero: " + intentos);
  // Use the Twilio Node.js SDK to build an XML response

  const twiml = new VoiceResponse();
  if (intentos >= 5) {
    console.log("Superado el numero de intentos");
    twiml.say("Superado el numero de intentos!. El ticket será escalado.", {
      voice: "alice",
      language: "es-MX",
    });
    twiml.hangup();
  }
  /** helper function to set up a <Gather> */
  function gather() {
    const gatherNode = twiml.gather({ numDigits: 1 });
    gatherNode.say("Para ventas presione 1. Para soporte presione 2.", {
      voice: "alice",
      language: "es-MX",
    });

    // If the user doesn't enter input, loop
    twiml.redirect("/api/voice");
  }

  // If the user entered digits, process their request
  if (request.body.Digits) {
    switch (request.body.Digits) {
      case "1":
        twiml.say("Ha selecionado la opcion número 1 relacionada con ventas!", {
          voice: "alice",
          language: "es-MX",
        });
        break;
      case "2":
        twiml.say(
          "Ha selecionado la opcion número 2 relacionada con soporte!",
          {
            voice: "alice",
            language: "es-MX",
          }
        );
        break;
      default:
        twiml.say("Opción incorrepta", {
          voice: "alice",
          language: "es-MX",
        });
        twiml.pause();
        gather();
        break;
    }
  } else {
    // If no input was sent, use the <Gather> verb to collect user input
    gather();
  }
  // Render the response as XML in reply to the webhook request
  console.log(request.body);
  response.type("text/xml");
  response.send(twiml.toString());
});

//call
app.post("/api/call", (req, res) => {
  try {
    const data = req.body;
    const toPhoneNumber = data.toPhoneNumber;
    const toName = data.toName;
    const text = data.text;

    client.calls
      .create({
        twiml: `<Response><Say language="es-MX">Hola ${toName} ${text}</Say></Response>`,
        to: toPhoneNumber,
        from: phoneNumber,
      })
      .then((call) => {
        console.log(call);
        console.log(call.events());
        res.send(call);
      })
      .catch((reject) => {
        console.log(reject);
      });
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/api/llamar", async (req, res) => {
  try {
    //create twilio client
    const client = require("twilio")(accountSid, authToken);
    const call = await client.calls.create({
      twiml: `<Response><Say language="es-MX">Hola ${req.body.toName} ${req.body.text}</Say></Response>`,
      to: req.body.toPhoneNumber,
      from: phoneNumber,
    });
    if (call) {
      console.log(call.accountSid);
      res.status(200).send(call.accountSid);
    }
    return call;
  } catch (error) {}
});

// Create an HTTP server and listen for requests on port 300
app.listen(port, () => {
  console.log(`Twilio Client app HTTP server running on port: ${port}`);
});
