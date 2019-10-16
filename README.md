# MMM-Homematic-Rooms
![screenshot](https://github.com/JFWenisch/MMM-Homematic-Rooms/blob/master/readme_screenshot.png)

A [MagicMirror²](https://github.com/MichMich/MagicMirror) module that automically requests device information from the [HomeMatic](https://www.homematic.com/)  CCU and displays them grouped by the assigned room.
This module requires the CCU to have the [XML-API](https://github.com/hobbyquaker/XML-API) installed. Easy to use, only the connection URL needs to be specified.
The information are automatically refreshed every 10 minutes.

# Installation
1. Clone repo:
```
	cd MagicMirror/modules/
	git clone https://github.com/JFWenisch/MMM-Homematic-Rooms
```
2. Install dependencies:
```
	cd MMM-Homematic-Rooms/
	npm install
```
3. Add the module to the ../MagicMirror/config/config.js, example:
```
		{
			module: 'MMM-Homematic-Rooms',
			header: 'MMM-Homematic-Rooms',
			position: 'bottom_right',
			config: {
				homematicURL: "http://192.168.0.2"
			}
		},
```
# Config
| key	                   | Description
| -------------------------| -----------
| `homematicURL`           | The URL to be used to  request information from the CCU2<br />**Default value:** http://192.168.0.2

# How it works
When the module is started, the within the ../MagicMirror/config/config.js set homematic url is used as base URL for all queries. As this modules makes use of the [XML-API](https://github.com/hobbyquaker/XML-API), the module automatically appends  `/config/xmlapi/` to all request.
![screenshot_01](https://github.com/JFWenisch/MMM-Homematic-Rooms/blob/master/readme_connect.png)

After the URL has been set the moduls does an XMLHTTPRequest on `/config/xmlapi/devicelist.cgi` to get the ids of all currently configured devices. Currently only found heaters are stored for further processing.
![screenshot_02](https://github.com/JFWenisch/MMM-Homematic-Rooms/blob/master/readme_listDevices.png)

Once all devices have been read, the module does an XMLHTTPRequest on `/config/xmlapi/roomlist.cgi` to find all currently configured rooms, and linked sensors.

![screenshot_03](https://github.com/JFWenisch/MMM-Homematic-Rooms/blob/master/readme_listRooms.png)

Now, as we  have a roomlist that contains a list of sensors and we have a list of devices, we need to find out which sensor belongs to which device, create a mapping and query useful information by doing a XMLHTTPRequest on `/config/xmlapi/state.cgi?device_id={id}`. As there is no way to get the device based on a sensor id ( at least i'm not aware of this right now), we are iterate over our previously stored list of heater devices and call the state cgi with the heater ids to get the temperatur sensor for our devices. Once we get the sensor id, we look within our roomlist to find the sensor linked to a room. If found, we are getting the actual temperature and set temperature from the state.cgi resonse and update our room configuration which is afterwards used to render the frontend.
![screenshot_04](https://github.com/JFWenisch/MMM-Homematic-Rooms/blob/master/readme_updateTemperature.png)
