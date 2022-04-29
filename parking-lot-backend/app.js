const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const parkingLotRoutes = require("./routes/ParkingLot");
app.use("/", parkingLotRoutes);

module.exports = app;
