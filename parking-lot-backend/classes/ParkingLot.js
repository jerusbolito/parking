class ParkingSpot{
    #vehicle = null;
    constructor(parkingSpotId, parkingSpotSize, entryPointsProximity){
        this.parkingSpotId = parkingSpotId;
        this.parkingSpotSize = parkingSpotSize;
        this.entryPointsProximity = entryPointsProximity;
        this.fixedRate = 40;
        this.vehicleId = null;
    }

    isOccupied(){
        return !!this.vehicleId;
    }

    getVehicle(){
        return this.#vehicle;
    }

    setVehicle(vehicle){
        this.#vehicle = vehicle;
        this.vehicleId = vehicle.vehicleId;
    }

    unsetVehicle(){
        this.#vehicle = null;
        this.vehicleId = null;
    }

    getRates(totalHoursParked, previousParkingHours){
        let rate = 0;
        if(previousParkingHours <= 3){
            if(totalHoursParked <= 3){
                rate = this.fixedRate;
                return rate;
            }
            rate = totalHoursParked < 24 ? (this.fixedRate + (this.exceedingHourlyRate * (totalHoursParked - 3) )) : (Math.floor(totalHoursParked / 24) * 5000 ) + ((totalHoursParked % 24) * this.exceedingHourlyRate);
            return rate;
        }

        rate = totalHoursParked < 24 ? (this.exceedingHourlyRate * (totalHoursParked - previousParkingHours)) : (Math.floor(totalHoursParked / 24) * 5000 ) + ((totalHoursParked % 24) * this.exceedingHourlyRate);
        return rate + this.#vehicle.amountPaid;
    }
}

class SParkingSpot extends ParkingSpot{
    constructor(parkingSpotId, entryPointsProximity){
        super(parkingSpotId, 0, entryPointsProximity);
        this.exceedingHourlyRate = 20;
    }
}

class MParkingSpot extends ParkingSpot{
    constructor(parkingSpotId, entryPointsProximity){
        super(parkingSpotId, 1, entryPointsProximity);
        this.exceedingHourlyRate = 60;
    }
}

class LParkingSpot extends ParkingSpot{
    constructor(parkingSpotId, entryPointsProximity){
        super(parkingSpotId, 2, entryPointsProximity);
        this.exceedingHourlyRate = 100;
    }
}

class ParkingLot{
    constructor(numberOfentryPoints, parkingLotMap){
        this.parkingLotMap = parkingLotMap;
        this.spotsLeft = parkingLotMap.length;
        this.vehicles = new Map();
        this.numberOfEntryPoints = numberOfentryPoints;
    }

    placeVehicle(vehicle, parkTime){
        if(this.vehicles.has(vehicle.vehicleId)) throw new Error(JSON.stringify({message: 'Duplicate vehicleId', code: 409}));
        if(vehicle.entryPoint > (this.numberOfEntryPoints - 1) || vehicle.entryPoint < 0) throw new Error(JSON.stringify({message: 'Invalid entry point', code: 400}));

        let openSpots = this.parkingLotMap.filter((spot) => {
            return !spot.isOccupied() && spot.parkingSpotSize >= vehicle.size;
        });

        if(this.spotsLeft > 0 && openSpots.length > 0){
            openSpots.sort((a, b) =>{
                return a.entryPointsProximity[vehicle.entryPoint] - b.entryPointsProximity[vehicle.entryPoint];
            });

            try{
                let parkVehicle = vehicle.park(openSpots[0], parkTime);
                this.vehicles.set(vehicle.vehicleId, {vehicle: parkVehicle, parkingSpot: openSpots[0]});
                this.spotsLeft--;
                return { vehicle : vehicle};
            }catch(err){
                throw new Error(err.message);
            }
        }

        let error = this.spotsLeft > 0 ? new Error(JSON.stringify({message: "No more parking slots left for given vehicle type.", code: 422})) : new Error(JSON.stringify({message: "No more open slots left in the parking lot.", code: 422}));
        throw error;
    }

    removeVehicle(vehicleId, unparkTime){
        if(this.vehicles.has(vehicleId)){
            let vehicle = this.vehicles.get(vehicleId).vehicle;
            let parkingSummary = vehicle.unpark(unparkTime);
            this.vehicles.delete(vehicleId);
            this.spotsLeft++;
            return { summary: parkingSummary, vehicle: vehicle }
        }
        throw new Error({message: 'Vehicle does not exist in the parking lot.', code: 400});
    }

    getSpotsSummary(){
        return {
            openSlots: this.parkingLotMap.filter((spot) => { return !spot.isOccupied()}),
            occupiedSlots : this.parkingLotMap.filter((spot) => { return spot.isOccupied()}),
            availableSlotsCount: this.spotsLeft
        }
    }

    getParkedVehicles(vehicleId){
        if(vehicleId){
            return this.vehicles.get(vehicleId);
        }
        return this.vehicles;
    }

    getMapBySize(){
        return {
            LP : this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 2),
            MP : this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 1),
            SP : this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 0)
        }
    }

    getMapCountBySize(){
        let lpOccupied = this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 2 && spot.isOccupied()).length;
        let mpOccupied = this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 1 && spot.isOccupied()).length;
        let spOccupied = this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 0 && spot.isOccupied()).length;
        let lpOpen = this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 2 && !spot.isOccupied()).length;
        let mpOpen = this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 1 && !spot.isOccupied()).length;
        let spOpen = this.parkingLotMap.filter((spot) => spot.parkingSpotSize === 0 && !spot.isOccupied()).length;
        return {
            LP : { open: lpOpen, occupied: lpOccupied, total: lpOpen + lpOccupied},
            MP : { open: mpOpen, occupied: mpOccupied, total: mpOpen + mpOccupied},
            SP : { open: spOpen, occupied: spOccupied, total: spOpen + spOccupied}
        }
    }
}

map = [
    new LParkingSpot(1, [1, 3, 5]), new SParkingSpot(2, [2, 2, 3]), new MParkingSpot(3, [3, 1, 3]), new SParkingSpot(4, [4, 2, 2]), new LParkingSpot(5, [5, 3, 1])
]

module.exports = new ParkingLot(3, map)