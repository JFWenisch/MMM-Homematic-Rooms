const NodeHelper = require('node_helper');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const DOMParser = require('xmldom').DOMParser;
var config = {
	rooms: [{
		name: "", id: "",
		temperature: { actualTemperature: "", setTemperature: "" },
		sensors: []
	}],
	heaters: [],
	windows: [],
	url:""
};

module.exports = NodeHelper.create({
	start: function () {
		const self = this;
		console.log('Starting node_helper for: ' + this.name);

	},



	// Listens to notifications from client (from MMM-AllsvenskanStandings.js).
	// Client sends a notification when it wants download new standings.
	socketNotificationReceived: function (notification, payload) {
		const self = this;

		if (notification === 'SET_CONNECTION')
		{
			config.url= payload;
			console.log("["+ this.name+"]"+" connecting to "+ config.url);
	
		}
		if (notification === 'GET_DEVICES')
		{
			
				self.loadDevices(payload);
	
		}
		else if (notification === 'GET_ROOMS')
		{
			self.loadRooms(payload);
		}
		else if (notification === 'GET_TEMPERATURE')
		{
			self.initRealHeaters(payload);
		}
		else if (notification === 'GET_DATA')
		{
			self.sendSocketNotification('SET_DATA',config.rooms);
		}
	},

	loadDevices: function () {
		console.log("Searching devices.......")
		var self = this;
		let request = new XMLHttpRequest();

		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) 
			{
				 xml = new DOMParser().parseFromString(request.responseText, "text/xml");
			


				let devices = xml.getElementsByTagName("device");
				for (let i = 0; i < devices.length; i++) {
					let device = devices[i];
					let devicename = device.getAttribute("name");
					let deviceid = device.getAttribute("ise_id");
					let devicetype = device.getAttribute("device_type");
					if (devicetype.includes("HM-CC-")) // Heizung
					{
						if (device.getAttribute("interface").includes("VirtualDevices")) {

						}
						else {
							console.log("[Heater:" + deviceid + "] " + devicename);
							config.heaters.push(deviceid);


						}

					}
					else if (devicetype.includes("HM-Sec-SD")) //Rauchmelder
					{
						console.log("[SmokeDetector:" + deviceid + "] " + devicename);
					}
					else if (devicetype.includes("HM-Sec-SCo")) //Fenster
					{
						console.log("[Window:" + deviceid + "] " + devicename);
						config.windows.push(deviceid);
					}
					else if (devicetype.includes("HM-LC-Sw1")) //Schalter steckdose
					{
						console.log("[Switch:" + deviceid + "] " + devicename);
					}
					else {
						console.log("[Unknown:" + deviceid + "] " + devicename);
					}

			

				}
				self.sendSocketNotification('SET_DEVICES',config.rooms);
			}
		
		}
		request.open("GET", config.url+"/config/xmlapi/devicelist.cgi", true);
		request.send(null);;

	},

	initRealHeaters: function () 
	{
		var self = this;
		console.log("Searching sensor ids for previously found heaters.......")
		for (i = 0; i < config.heaters.length; i++) 
		{
			let heater = config.heaters[i];
			self.updateRoomTemperatureFromHeater(heater);
		}
		/*
		for (i = 0; i < config.windows.length; i++) 
		{
			let window = config.windows[i];
			self.updateRoomTemperatureFromHeater(winde);
		}
		*/
		},

	updateRoomTemperatureFromHeater: function (deviceID) {
		var self = this;
		let	request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				xml = new DOMParser().parseFromString(request.responseText, "text/xml");

				devices = xml.getElementsByTagName("device");
				device = devices[0];
				channels = device.getElementsByTagName("channel");

				if (channels[4].getAttribute("name").includes(":4")) //Assuming Temperature information to be found below the channel ending with :4
				{
					let tempSensorID = channels[4].getAttribute("ise_id");
					for (let i = 0; i < config.rooms.length; i++) {
						room = config.rooms[i];
						if (room.sensors.includes(tempSensorID)) {
							dataPoints = channels[4].getElementsByTagName("datapoint");
							for (let j = 0; j < dataPoints.length; j++)  //Scanning device datapoints to get actual tempurature and set temperature
							{
								dataPoint = dataPoints[j];
								var actutalTemp;
								var setTemp;
								if (dataPoint.getAttribute("name").includes("ACTUAL_TEMPERATURE")) {
									let tempvalue =dataPoint.getAttribute("value");
									let tempunit=dataPoint.getAttribute("valueunit");
									if(tempunit.includes("C"))
									{
										tempunit="°C"
									}
									else if(tempunit.includes("F"))
									{
										tempunit="°F"
									}
									actutalTemp = Number(tempvalue).toFixed(1) + " " + tempunit;
								}
								else if (dataPoint.getAttribute("name").includes("SET_TEMPERATURE")) {
									let tempvalue =dataPoint.getAttribute("value");
									let tempunit=dataPoint.getAttribute("valueunit");
									if(tempunit.includes("C"))
									{
										tempunit="°C"
									}
									else if(tempunit.includes("F"))
									{
										tempunit="°F"
									}
									setTemp = Number(tempvalue).toFixed(1) + " " + tempunit;
								}

							}
							console.log(device.getAttribute("name") + " is providing temperature data for " + room.name + "[" + actutalTemp + "/" + setTemp + "]");
							let temp = {
								actualTemperature: actutalTemp, setTemperature: setTemp
							};
							config.rooms[i].temperature.push(temp);
						
						
						}
					}
				
				}
				self.sendSocketNotification('SET_TEMPERATURE',config.rooms);
			}
		}
		request.open("GET", config.url+"/config/xmlapi/state.cgi?device_id=" + deviceID, true);
		
		request.send(null);;

	},
	updateRoomFromWIndow: function (deviceID) {
		var self = this;
		let	request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				xml = new DOMParser().parseFromString(request.responseText, "text/xml");

				devices = xml.getElementsByTagName("device");
				device = devices[0];
				channels = device.getElementsByTagName("channel");

				if (channels[4].getAttribute("name").includes(":4")) //Assuming Temperature information to be found below the channel ending with :4
				{
					let tempSensorID = channels[4].getAttribute("ise_id");
					for (let i = 0; i < config.rooms.length; i++) {
						room = config.rooms[i];
						if (room.sensors.includes(tempSensorID)) {
							dataPoints = channels[4].getElementsByTagName("datapoint");
							for (let j = 0; j < dataPoints.length; j++)  //Scanning device datapoints to get actual tempurature and set temperature
							{
								dataPoint = dataPoints[j];
								var actutalTemp;
								var setTemp;
								if (dataPoint.getAttribute("name").includes("ACTUAL_TEMPERATURE")) {
									let tempvalue =dataPoint.getAttribute("value");
									let tempunit=dataPoint.getAttribute("valueunit");
									if(tempunit.includes("C"))
									{
										tempunit="°C"
									}
									else if(tempunit.includes("F"))
									{
										tempunit="°F"
									}
									actutalTemp = Number(tempvalue).toFixed(1) + " " + tempunit;
								}
								else if (dataPoint.getAttribute("name").includes("SET_TEMPERATURE")) {
									let tempvalue =dataPoint.getAttribute("value");
									let tempunit=dataPoint.getAttribute("valueunit");
									if(tempunit.includes("C"))
									{
										tempunit="°C"
									}
									else if(tempunit.includes("F"))
									{
										tempunit="°F"
									}
									setTemp = Number(tempvalue).toFixed(1) + " " + tempunit;
								}

							}
							console.log(device.getAttribute("name") + " is providing temperature data for " + room.name + "[" + actutalTemp + "/" + setTemp + "]");
							let temp = {
								actualTemperature: actutalTemp, setTemperature: setTemp
							};
							config.rooms[i].temperature=[];
							config.rooms[i].temperature.push(temp);
						
						
						}
					}
				
				}
				self.sendSocketNotification('SET_TEMPERATURE',config.rooms);
			}
		}
		request.open("GET", config.url+"/config/xmlapi/state.cgi?device_id=" + deviceID, true);
		
		request.send(null);;

	},
	loadRooms: function () {
		console.log("Searching rooms.......")
		var self = this;
		 let request = new XMLHttpRequest();


		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				xml = new DOMParser().parseFromString(request.responseText, "text/xml");
				config.rooms=[];
				rooms = xml.getElementsByTagName("room");
				for (let i = 0; i < rooms.length; i++) {
					let roomNode = rooms[i];
					let room = {
						name: "", id: "", sensors: []

					};
					room.name = roomNode.getAttribute("name");
					room.id = roomNode.getAttribute("ise_id");
					room.temperature = [];
					roomDevicesNodes = roomNode.getElementsByTagName("channel");
					for (let i = 0; i < roomDevicesNodes.length; i++) {
						room.sensors.push(roomDevicesNodes[i].getAttribute("ise_id"));
					}
					config.rooms.push(room);
					console.log(room);
				}

				self.sendSocketNotification('SET_ROOMS',config.rooms);

			}
		}
		request.open("GET", config.url+"/config/xmlapi/roomlist.cgi", true);
		request.send(null);;
	}

});
