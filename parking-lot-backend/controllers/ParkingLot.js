let parkingLot = require("../classes/ParkingLot");
let { SVehicle, MVehicle, LVehicle }= require("../classes/Vehicle");
let vehicleRecords = new Map();
let vehicles = {
    "LV" : LVehicle,
    "MV" : MVehicle,
    "SV" : SVehicle
}

exports.getParkingSpots = (req, res) => {
    res.status(200).json(parkingLot.getSpotsSummary())
}

exports.getMap = (req, res) => {
    res.status(200).json(parkingLot.getMapBySize());
}

exports.getMapCount = (req, res) => {
    res.status(200).json(parkingLot.getMapCountBySize());
}

exports.getVehicles = (req, res) => {
    res.status(200).json({results: Object.fromEntries(parkingLot.getParkedVehicles(req.query?.vehicleId))});
}

exports.placeVehicle = (req, res) => {
    let body = req.body;
    if(body.hasOwnProperty("vehicleType") && body.hasOwnProperty("vehicleId") && body.hasOwnProperty("entryPoint")){
        let newVehicle = vehicles.hasOwnProperty(body.vehicleType.toUpperCase()) && new vehicles[body.vehicleType](body.vehicleId, body.entryPoint);
        if(newVehicle){
            try{
                if(vehicleRecords.has(body.vehicleId) && vehicleRecords.get(body.vehicleId).size !== newVehicle.size){
                    res.status(400).json({error: "A vehicle with that ID and a different size already exists in the record"});
                }else{
                    if(vehicleRecords.has(body.vehicleId)){
                        let vehicle = vehicleRecords.get(body.vehicleId);
                        vehicle.entryPoint = body.entryPoint;
                        newVehicle = vehicle;
                    }
                    let placeVehicle = parkingLot.placeVehicle(newVehicle, req.body.parkTime);
                    vehicleRecords.set(placeVehicle.vehicle.vehicleId, placeVehicle.vehicle);
                    res.status(200).json({message: "Vehicle has been parked", vehicle : placeVehicle.vehicle});
                }
            }catch(err){
                try{
                    let errObject = JSON.parse(err.message);
                    res.status(errObject.code).json({error: errObject.message});
                }catch(err){
                    res.status(500).json({error : "Internal server error"});
                }
            }
        }
        return;
    }else{
        res.status(400).json({error: "Bad Request"});
    }
}

exports.removeVehicle = (req, res) => {
    if(+req.params.vehicleId && parkingLot.getParkedVehicles(+req.params.vehicleId)){
        let unparkTime = req.body.hasOwnProperty("unparkTime") ? new Date(req.body.unparkTime) : null;
        try{
            let removeVehicle = parkingLot.removeVehicle(+req.params.vehicleId, unparkTime);
            vehicleRecords.set(+req.params.vehicleId, removeVehicle.vehicle);
            res.status(200).json({message: "Vehicle has been unparked.", summary: removeVehicle.summary});
        }catch(err){
            try{
                let errObject = JSON.parse(err.message);
                res.status(errObject.code).json({error: errObject.message});
            }catch(err){
                res.status(500).json({error : "Internal server error"});
            }
        }
    }else{
        res.status(400).json({error : "Bad request"});
    }
}

exports.changeVehicleParkTime = (req, res) => {
    if(req.params.vehicleId){
        let vehicle = vehicleRecords.get(+req.params.vehicleId);

        if(vehicle){
            vehicle.parkTime = new Date(req.body.parkTime);
            res.status(200).json(vehicle);
            return;
        }
        
        res.status(400).json({error: "Vehicle does not exist in the record."})
    }
}

exports.getVehicleRecords = (req, res) => {
    res.status(200).json({results :Object.values(Object.fromEntries(vehicleRecords))});
}