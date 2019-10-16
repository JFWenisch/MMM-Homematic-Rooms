 const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
 const DOMParser = require('xmldom').DOMParser;


var config = { 
    rooms: [{ name: "", id:"",
     temperature:{actualTemperature:"",setTemperature:""}, 
     sensors:[] }],
     heaters:[], 
     windows:[] 
    };

let promise = new Promise(function(resolve, reject) 
{
    loadDevices();
    setTimeout(() => resolve("done"), 3000);
    loadRooms();
   

  });
  
  // resolve runs the first function in .then
  promise.then(
    result =>  initRealHeaters(), // shows "done!" after 1 second
    error => console.log(error) // doesn't run
  );

function loadDevices() 
{
    console.log("Searching devices.......");
    $.ajax({
        url: 'http://10.0.0.5/config/xmlapi/devicelist.cgi',
        type: 'GET',
        success: function(responseText){
            console.log("Found devices.......");
          let  xml = new DOMParser().parseFromString(responseText, "text/xml");


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
                  else 
                  {
                      console.log("[Heater:"+deviceid+"] " + devicename );
                    config.heaters.push(deviceid);
                    
                    
                  }

              }
              else if (devicetype.includes("HM-Sec-SD")) //Rauchmelder
              {
                  console.log("[SmokeDetector:"+deviceid+"] " + devicename );
              }
              else if (devicetype.includes("HM-Sec-SCo")) //Fenster
              {
                  console.log("[Window:"+deviceid+"] " + devicename );
                  config.windows.push(deviceid);
              }
              else if (devicetype.includes("HM-LC-Sw1")) //Schalter steckdose
              {
                  console.log("[Switch:"+deviceid+"] " + devicename );
              }
              else {
                  console.log("[Unknown:"+deviceid+"] " + devicename );
              }
        }
     

}

function initRealHeaters()
{
    console.log("Searching sensor ids for previously found heaters.......")
    for (let i = 0; i < config.heaters.length; i++) 
    {
        updateRoomTemperatureFromHeater( config.heaters[i]);
  
    }
}

function updateRoomTemperatureFromHeater(deviceID) {

     let request = new XMLHttpRequest();
       request.open("GET", "http://10.0.0.5/config/xmlapi/state.cgi?device_id=" + deviceID, true);
       request.onreadystatechange = function () 
    {
        if (request.readyState == 4 && request.status == 200) {
             xml = new DOMParser().parseFromString(request.responseText, "text/xml");

             devices = xml.getElementsByTagName("device");
             device = devices[0];
             channels = device.getElementsByTagName("channel");

            if (channels[4].getAttribute("name").includes(":4")) //Assuming Temperature information to be found below the channel ending with :4
            {
               let  tempSensorID= channels[4].getAttribute("ise_id");
                for (let i = 0; i < config.rooms.length; i++) 
                {
                    room = config.rooms[i];
                    if(room.sensors.includes(tempSensorID))
                   {
                        dataPoints = channels[4].getElementsByTagName("datapoint");
                        for (let j = 0; j <dataPoints.length; j++)  //Scanning device datapoints to get actual tempurature and set temperature
                        {
                            dataPoint = dataPoints[j];
                            var actutalTemp ;
                            var setTemp;
                            if(dataPoint.getAttribute("name").includes("ACTUAL_TEMPERATURE"))
                            {
                                 actutalTemp =dataPoint.getAttribute("value")+" "+dataPoint.getAttribute("valueunit");
                            }
                            else if(dataPoint.getAttribute("name").includes("SET_TEMPERATURE"))
                            {
                                 setTemp =dataPoint.getAttribute("value")+" "+dataPoint.getAttribute("valueunit");
                            }
                           
                        }
                        console.log(device.getAttribute("name") +" is providing temperature data for " + room.name + "["+actutalTemp+"/"+setTemp+"]");
                        let temp = {   actualTemperature: actutalTemp, setTemperature:setTemp                   
                            };
                            room.temperature.push(temp);
                    }
                }
                return tempSensorID;
            }

        }
    }
    request.send(null);;

}
 function loadRooms(){
    console.log("Searching rooms.......")
    let request = new XMLHttpRequest();
  
    request.open("GET", "http://10.0.0.5/config/xmlapi/roomlist.cgi", true);
    request.onreadystatechange = function () 
    {
        if (request.readyState == 4 && request.status == 200) {
            xml = new DOMParser().parseFromString(request.responseText, "text/xml");

             rooms = xml.getElementsByTagName("room");
            for (let i = 0; i < rooms.length; i++) {
                let roomNode = rooms[i];
                let room = { 
                    name: "", id:"", sensors:[] 
                  
                    };
                room.name=roomNode.getAttribute("name");
                room.id=roomNode.getAttribute("ise_id");
                room.temperature=[];
                roomDevicesNodes = roomNode.getElementsByTagName("channel");
                for (let i = 0; i < roomDevicesNodes.length; i++) 
                {
                   room.sensors.push(roomDevicesNodes[i].getAttribute("ise_id"));
                }
                config.rooms.push(room);
                console.log(room);
            }



        }
    }
    request.send(null);;
}
;
;





