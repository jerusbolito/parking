const router = require("express").Router();
const parkingLotController = require("../controllers/ParkingLot");

router.get("/", parkingLotController.getParkingSpots);
router.get("/vehicles", parkingLotController.getVehicles);
router.get("/vehicles/records", parkingLotController.getVehicleRecords);
router.get("/map", parkingLotController.getMap);
router.get("/map/count", parkingLotController.getMapCount);
router.post("/", parkingLotController.placeVehicle);
router.patch("/:vehicleId", parkingLotController.changeVehicleParkTime);
router.delete("/:vehicleId", parkingLotController.removeVehicle);

module.exports = router;