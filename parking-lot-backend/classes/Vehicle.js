let format = require("date-fns").format;
class Vehicle{
    constructor(vehicleId, entryPoint){
        this.vehicleId = vehicleId;
        this.entryPoint = entryPoint;
        this.parkingSpot = null;
        this.parkTime = null;
        this.unparkTime = null;
        this.previousParkingHours = 0;
        this.amountPaid = 0;
    }

    isParked(){
        return !!this.parkingSpot;
    }

    park(parkingSpot, parkTime = null){
        if(!!this.unparkTime && (parkTime && new Date(parkTime) || new Date()) < this.unparkTime) throw new Error(JSON.stringify({message: `New park time cannot be lower than previous unpark time: ${format(this.unparkTime, "MMM dd, yyyy hh:mm:ss a")}`, code: 400}));
        if(!!this.parkTime && parkTime && new Date(parkTime) < new Date(this.parkTime)) throw new Error(JSON.stringify({message: `New park time cannot be lower than previous park time: ${format(this.parkTime, "MMM dd, yyyy hh:mm:ss a")}`, code: 400}));
        if(!!this.parkTime && !!this.unparkTime && this.getReentryHourDifference(parkTime) > 1){
            this.parkTime = parkTime ? new Date(parkTime) : new Date();
            this.amountPaid = 0;
            this.unparkTime = null;
            this.previousParkingHours = 0;
        }
        parkingSpot.setVehicle(this);
        this.parkingSpot = parkingSpot;
        this.parkTime = !!this.parkTime ? this.parkTime : parkTime ? new Date(parkTime) : new Date();
        return this;
    }

    unpark(unparkTime){
        if(((unparkTime && new Date(unparkTime)) || new Date()) < this.parkTime) throw new Error(JSON.stringify({message: `Unpark time: ${format(new Date(unparkTime), "MMM dd, yyyy hh:mm:ss a")} cannot be lower than park time: ${format(this.parkTime, "MMM dd, yyyy hh:mm:ss a")}`, code: 400}));
        if(!!this.unparkTime && ((unparkTime && new Date(unparkTime)) || new Date()) < new Date(this.unparkTime)) throw new Error(JSON.stringify({message: `New unpark time: ${format(new Date(unparkTime), "MMM dd, yyyy hh:mm:ss a")} cannot be lower than previous unpark time: ${format(this.unparkTime, "MMM dd, yyyy hh:mm:ss a")}`, code: 400}));
        this.unparkTime = unparkTime || new Date();
        let summary = this.generateSummary();
        this.amountPaid += summary.amountToPay;
        this.previousParkingHours += (this.getTotalHoursParked(unparkTime) - this.previousParkingHours);
        this.parkingSpot.unsetVehicle();
        this.parkingSpot = null;
        return summary;
    }
    
    getTotalHoursParked(unparkTime = null){
        if(this.isParked()){
            let dateToCompare = unparkTime || new Date();
            return Math.ceil(Math.abs(dateToCompare - this.parkTime) / 36e5);
        }
        throw new Error('Vehicle is not parked');
    }

    getReentryHourDifference(date = null){
        let reentryDate = !!date ? new Date(date) : new Date();
        if(this.unparkTime && reentryDate > this.unparkTime){
            return Math.abs(reentryDate - this.unparkTime) / 36e5;
        }
        return 0;
    }

    generateSummary(){
        let totalHoursParked = this.getTotalHoursParked(this.unparkTime);
        return {
            parkTime : this.parkTime,
            unparkTime : this.unparkTime,
            amountPaid : this.amountPaid,
            amountToPay: this.parkingSpot.getRates(totalHoursParked, this.previousParkingHours) - this.amountPaid,
            totalHoursParked : totalHoursParked
        }
    }
}

class SVehicle extends Vehicle{
    constructor(vehicleId, entryPoint){
        super(vehicleId, entryPoint);
        this.size = 0;
    }
    
}

class MVehicle extends Vehicle{
    constructor(vehicleId, entryPoint){
        super(vehicleId, entryPoint);
        this.size = 1;
        
    }
}

class LVehicle extends Vehicle{
    constructor(vehicleId, entryPoint){
        super(vehicleId, entryPoint);
        this.size = 2;
    }
}

module.exports = {
    SVehicle : SVehicle,
    MVehicle : MVehicle,
    LVehicle : LVehicle
}