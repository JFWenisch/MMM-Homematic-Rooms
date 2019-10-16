
Module.register('MMM-Homematic-Rooms',
	{
		defaults: {
			homematicURL: "10.0.0.5"
		},

		getStyles: function () {
			return ['modules/MMM-Homematic-Rooms/css/MMM-Homematic-Rooms.css'];
		},

		getTranslations: function () {
			return
			{
				en: "translations/en.json"
			}
		},

		// Notification from node_helper.js.
		// The standings are received here. Then module is redrawn.
		// @param notification - Notification type.
		// @param payload - Contains an array of teams. Each team contains position, name, points etc...
		socketNotificationReceived: function (notification, payload) {
			var self = this;
			if (notification === 'SET_DEVICES') {

				this.devices = payload;
				this.sendSocketNotification('GET_ROOMS', {});
			}
			else if (notification === 'SET_ROOMS') {

				this.rooms = payload;
				this.sendSocketNotification('GET_TEMPERATURE', {});
			}
			else if (notification === 'SET_TEMPERATURE') {

				this.sendSocketNotification('GET_DATA', {});
			}
			else if (notification === 'SET_DATA') {

				this.rooms = payload;
				this.updateDom(0);
			}
		},

		// Override dom generator.
		getDom: function () {
			var wrapper = document.createElement('table');

			if (this.rooms.length === 0) {
				wrapper.innerHTML = this.translate('Initializing MMM-Homematic');
				wrapper.className = 'dimmed xsmall';
				return wrapper;
			}

			wrapper.className = 'bright xsmall';



			for (var i = 0; i < this.rooms.length; ++i) {
				var evenRow = (i % 2 == 0);

				var row = document.createElement('tr');

				row.className = evenRow ? 'evenrow' : 'oddrow';
				
				var imageColumn = document.createElement("TD");
				imageColumn.className="imageColumn";
				var img = new Image(50, 50);
				img.src = 'https://visualpharm.com/assets/686/Room-595b40b85ba036ed117da28a.svg';
				imageColumn.appendChild(img);
				row.appendChild(imageColumn);



				var room = this.rooms[i];
				var td = document.createElement('TD');
				td.appendChild(document.createTextNode(room.name));
				td.appendChild(document.createElement("br"));
				td.appendChild(document.createTextNode(room.sensors.length +" sensors"));
				for (let j = 0; j < room.temperature.length; j++) 
				{
					td.appendChild(document.createElement("br"));
					let heaterImg = new Image(20,20);
					heaterImg.src = 'https://image.flaticon.com/icons/svg/281/281308.svg';
					td.appendChild(heaterImg);
				}
				row.appendChild(td);

			
				try {
					var tempcolumn = document.createElement('TD');
					tempcolumn.width = '50';
					tempcolumn.appendChild(document.createTextNode(room.temperature[0].actualTemperature)); //Showing the temperature of the first found entity if set
					row.appendChild(tempcolumn);

				

				//	var destTempcolumn = document.createElement('TD');
				//	destTempcolumn.width = '50';
				//	destTempcolumn.appendChild(document.createTextNode(room.temperature[0].setTemperature)); //Showing the temperature of the first found entity if set
				//	row.appendChild(destTempcolumn);
				}
				catch (error) {
					console.log("error");
				}


				wrapper.appendChild(row);
			}

			return wrapper;
		},

		// Override start to init stuff.
		start: function () {
			this.devices = [];
			this.rooms = [];

			// Tell node_helper to load standings at startup.
			this.sendSocketNotification('SET_CONNECTION',this.config.homematicURL);
			this.sendSocketNotification('GET_DEVICES', {});



			// Make sure standings are reloaded every 10 minutes.
			var self = this;
			setInterval(function () {
				self.sendSocketNotification('GET_DEVICES', {});
			}, 10 * 60 * 1000); // In millisecs. Refresh every 10 minutes.
		},

	});
