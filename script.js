getlocation();
    //Automatically get user's location
    let latitudeNum;
    let longitudeNum;

    function getlocation() {
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } 
        else { 
            x.innerHTML = "Geolocation is not supported by this browser.";
        }
    }

    function showPosition(position) {
        latitudeNum = position.coords.latitude;
        longitudeNum = position.coords.longitude;
        console.log("latitude is "+latitudeNum);
        console.log("longitude is "+longitudeNum);
        //put coordinates into the search query
        checkWeather(latitudeNum+" , "+longitudeNum);
    }



    const apiURL = "https://api.weatherapi.com/v1/";
    const forecast = "forecast.json?";
    const key = "key=135f15ba9e1e49d3a64160722231710&q=";
    const days = "&days=3";
    const airQual = "&aqi=yes";
    const alerts = "&alerts=yes";

    
    async function checkWeather(city){

        /*fetch 3 day weather data*/
        const response = await fetch(apiURL + forecast + key + city + days + airQual + alerts);
        var data = await response.json();

        console.log(data);

        //need to get correct background according to condition
       
        buildBackgroundImage();
        function buildBackgroundImage(){
            let currentCondition = data.current.condition.text;
            let sky = "clear";
            let sky2 = "overcast";
            let sky3 = "night"
            /*document.body.style.backgroundColor = "#f3f3f3";*/
            /*document.body.style.backgroundImage = "url('images2/backgrounds/overcast.png')";*/
            if(sky == "clear")
            {
                divColor = "rgba(32, 101, 161, 0.7)";
                titleColor = "rgb(136, 199, 252)";
            }
            document.querySelector(".square-card").style.background = divColor;

        }


        buildCurrentWeather();

        buildHumidityWidget();

        buildPrecipitationWidget();

        buildUVWidget();

        buildAirQualityWidget();

        
        //Save the sunset time, Used for hourly
        let sunsetT = data.forecast.forecastday[0].astro.sunset.replace(/^0+/,"");//format is something like "5:51 PM"
        const array = sunsetT.split(":"); 
        let sunsetHour = Number(array[0]);   //Take hour portion (sunsetHour is used by others)
        let rightPortion = array[1];  //Something like "32 PM"
        const array1 = rightPortion.split(" ");
        let sunsetMin = array1[0];   //left part is minute
        let amPM = array1[1];        //right part is AM/PM

        //Check if AM or PM
        if (amPM == "PM"){
            sunsetHour = sunsetHour + 12;  //convert to 24 hour time
        }
        let sunsetTime = sunsetHour+":"+sunsetMin; //sunsetTime is used by others


        
        let sunriseTime = getSunriseTime();

        let sunriseHour = getSunriseHour(sunriseTime);
        

        removeOldHourlyData();
    

        //get the current Hour of the city (used in houly forecast)
        let cityTime = data.current.last_updated.substring(11, 13); //take the time date time from datapack and cut the hour portion
        cityTime = cityTime.split(" ").join("");  //remove white spaces from string
        let theTime = cityTime.replace(/^0+/,"");   //remove any leading 0's from the hour portion
        let theHour = Number(theTime);      //convert the string into a number
        theHour = theHour + 1;   //Adding plus 1 to the hour (because we want to start hourly on the next hour)
        let dewpointHour = theHour - 1;



        //Get dew point data (It needs the current Hour)
        document.querySelector(".dewpoint").innerHTML = 'The dew point is '+Math.round(data.forecast.forecastday[0].hour[dewpointHour].dewpoint_c)+'° <br />right now.';


        //Added current temp as first entry into houlry-weather
        document.querySelector(".hourly-weather").innerHTML +=  
            '<div class="hour">'+
                '<p class=hourNum> Now </p>'+                                                      
                '<img class = "hourIcon" src='+ data.current.condition.icon +'>'+                                             
                '<p class = "hourlytemp">'+Math.round(data.current.temp_c) +'°</p>'+                                             
            '</div>';
        
        let currentDay = 0;
        let counter = 0;

        while (counter < 24)
        {
            //Need this incase the current hour of a city is on (theHour = 23) + 1  = 24
            //Need to increment the day and hour, otherwise it won't have the chance to change the day, result in error
            if(theHour == 24){
                currentDay = 1;
                theHour = 0;
            }

            let newHour;  //variable used for output purposes and not for calculations
            if(theHour.toString().length ==  1){
                newHour = theHour; //.toString().padStart(2, '0');  //convert single digit hour to double digit hours before outputting
            }
            else{
                newHour = theHour%24;
            }

            newHour = convert24to12(newHour);

            //Get the cahnce of rain for theHour
            let rainChance = data.forecast.forecastday[currentDay].hour[theHour].chance_of_rain;
            //Round the number to the nearest 10
            rainChance = Math.round(rainChance/10) * 10;

            // (*** MAIN AREA ***)
            //Check if the next hour will need a precipitation % under the icon
            if(rainChance > 9){
                //Fill next hourly slot with information  (Has chance of rain)
                document.querySelector(".hourly-weather").innerHTML +=  
                '<div class="hour">'+
                    '<p class=hourNum>'+newHour+'</p>'+   //The time on top of temperature       
                    '<div class = "iconArea">'+                                   
                        '<img class = "hourIconRain" src='+ data.forecast.forecastday[currentDay].hour[theHour].condition.icon +'>'+ //weather icon for that hour
                        '<p class= "rain-chance">'+rainChance+'%</p>'+  //chance of rain percent for that hour
                    '</div>'+                                  
                    '<p class = "hourlytemp">'+Math.round(data.forecast.forecastday[currentDay].hour[theHour].temp_c) +'°</p>'+  //temperature for that hour                                                
                '</div>';
            }
            else{
                //Fill next hourly slot with information  (No chance of rain)
                document.querySelector(".hourly-weather").innerHTML +=  
                '<div class="hour">'+
                    '<p class=hourNum>'+newHour+'</p>'+   //The time on top of temperature       
                    '<div class = "iconArea">'+                                   
                        '<img class = "hourIcon" src='+ data.forecast.forecastday[currentDay].hour[theHour].condition.icon +'>'+   //weather icon for that hour
                    '</div>'+                                  
                    '<p class = "hourlytemp">'+Math.round(data.forecast.forecastday[currentDay].hour[theHour].temp_c) +'°</p>'+  //temperature for that hour                                                
                '</div>';
            }

            
            //If we are at the last hour of day0, then we switch to day1
            if (theHour == 23){
                currentDay = 1;
                theHour = -1;
            }
            
            //Check if the next entry should be a sunset entry
            if(theHour == sunsetHour){
                //insert the sunset slot now
                document.querySelector(".hourly-weather").innerHTML +=  
                '<div class="hour">'+
                    '<p class=hourNum>'+convert24to12NoEnding(sunsetHour)+":"+sunsetMin+'<span>PM</span></p>'+  //time of sunset for hourly                                                   
                    '<img class = "hourIcon" src=images2/sunset.png>'+  //image of sunset for hourly                                           
                    '<p class = "sunlabel">Sunset</p>'+   //label for sunset at hourly                                          
                '</div>';
            }
            //check if next extry should be sunrise time
            if(theHour == sunriseHour){
                //insert the sunrise slot now
                document.querySelector(".hourly-weather").innerHTML +=  
                '<div class="hour">'+
                    '<p class=hourNum>'+sunriseTime+'<span>AM</span></p>'+   //time of sunrise for hourly                                                   
                    '<img class = "hourIcon" src=images2/sunrise.png>'+  //image of sunrise for hourly                                           
                    '<p class = "sunlabel">Sunrise</p>'+   //label for sunrise at hourly                                          
                '</div>';
            }
            theHour = theHour + 1;
            counter = counter + 1;
        }
        

        removeOldThreeDayData();
        buildThreeDayWidget();

        buildWindWidget();

        buildSunriseWidget();

        buildSunsetWidget();

        buildVisibilityWidget();

        buildPressureWidget();



        /**********Functions**********/

        function buildCurrentWeather(){
            /*Put current weather data into website elements*/
            //document.getElementById("icon").src= data.current.condition.icon;
            document.querySelector(".city").innerHTML = data.location.name;
            document.querySelector(".region").innerHTML = data.location.region +" , "+data.location.country;
            document.querySelector(".temp").innerHTML = Math.round(data.current.temp_c) + "°";
            document.querySelector(".feel-temp").innerHTML =  Math.round(data.current.feelslike_c);
            document.querySelector(".condition").innerHTML = data.current.condition.text;
            document.querySelector(".H").innerHTML = "H:"+Math.round(data.forecast.forecastday[0].day.maxtemp_c) + "°";
            document.querySelector(".L").innerHTML = "L:"+Math.round(data.forecast.forecastday[0].day.mintemp_c) + "°";

        }

        function buildHumidityWidget(){
            document.querySelector(".humidity").innerHTML = data.current.humidity + "%";
        }

        //takes a number from 0 to 23 and outputs the string in AM or PM
        function convert24to12(number){
            if(number == 0){
                return "12<span>AM</span>";
            }
            else if(number < 12){
                return number+"<span>AM</span>";
            }
            else if(number == 12){
                return "12<span>PM<span>";
            }
            else if(number > 12){
                return (number-12)+"<span>PM<span>";
            }
        }

        function convert24to12NoEnding(number){
            if(number == 0){
                return "12";
            }
            else if(number < 12){
                return number+"";
            }
            else if(number == 12){
                return "12";
            }
            else if(number > 12){
                return (number-12)+"";
            }
        }

        function buildPrecipitationWidget(){
            document.querySelector(".precipitation").innerHTML = Math.round(data.forecast.forecastday[0].day.totalprecip_mm) + " mm";
            document.querySelector(".future-precipitation").innerHTML = Math.round(data.forecast.forecastday[1].day.totalprecip_mm) + " mm expected <br /> tomorrow.";
        }

        function buildUVWidget()
        {
            //Get UV-index place into its widget
            document.querySelector(".uvIndex").innerHTML = data.current.uv;

            let uvDescription;
            if(data.current.uv > 10){
                uvDescription = "Extreme";  //purple
                document.getElementById("uvimg").src = "images2/uv/purple.png";
                document.querySelector(".uvNote").innerHTML = "Very high risk of harm <br /> from sun exposure.";
            }
            else if(data.current.uv > 7){
                uvDescription = "Very High";  //red
                document.getElementById("uvimg").src = "images2/uv/red.png";
                document.querySelector(".uvNote").innerHTML = "High risk of harm <br />from sun exposure.";
            }
            else if(data.current.uv > 5){
                uvDescription = "High";   //orange
                document.getElementById("uvimg").src = "images2/uv/orange.png";
                document.querySelector(".uvNote").innerHTML = "Moderate risk of harm <br /> from sun exposure.";
            }
            else if(data.current.uv > 2){
                uvDescription = "Moderate";  //yellow
                document.getElementById("uvimg").src = "images2/uv/yellow.png";
                document.querySelector(".uvNote").innerHTML = "Low risk of harm from <br /> sun exposure.";
            }
            else{
                uvDescription = "Low";  //green
                document.getElementById("uvimg").src = "images2/uv/green.png";
                document.querySelector(".uvNote").innerHTML = "Minimal danger from <br /> sun's UV rays.";
            }
            document.querySelector(".uvDesc").innerHTML = uvDescription;
        }

        function buildAirQualityWidget(){
                let airQualWord;
                if(data.current.air_quality["us-epa-index"] == "null"){
                    document.querySelector(".airQual").innerHTML = "Air Quality inforation is currently not available for this location";
                } 
                else{
                    switch(data.current.air_quality["us-epa-index"]){
                        case 1:
                            airQualWord = "Good";
                            document.getElementById("aqi-img").src = "images2/aqi/green.png";
                            break;
                        case 2:
                            airQualWord = "Moderate";
                            document.getElementById("aqi-img").src = "images2/aqi/yellow.png";
                            break;
                        case 3:
                            airQualWord = "Unhealthy for sensitive people";
                            document.getElementById("aqi-img").src = "images2/aqi/orange.png";
                            break;
                        case 4:
                            airQualWord = "Unhealthy";
                            document.getElementById("aqi-img").src = "images2/aqi/red.png";
                            break;
                        case 5:
                            airQualWord = "Very Unhealthy";
                            document.getElementById("aqi-img").src = "images2/aqi/purple.png";
                            break;
                        case 6:
                            airQualWord = "Hazardous";
                            document.getElementById("aqi-img").src = "images2/aqi/maroon.png";
                            break;
                        default:
                            airQualWord = "No info";
                    }
                    document.querySelector(".airDesc").innerHTML = airQualWord;
                    document.querySelector(".airNote").innerHTML = "Based on US EPA Standard";
                }
            
            /*Based on the US - EPA standard
            1 means Good (Green)
            2 means Moderate (Yellow)
            3 means Unhealthy for sensitive group (Orange)
            4 means Unhealthy (Red)
            5 means Very Unhealthy (Purple)
            6 means Hazardous (Maroon) */
        }

        function buildWindWidget(){
            document.querySelector(".wind").innerHTML = Math.round(data.current.wind_kph) + " km/h";
            document.querySelector(".windDirection").innerHTML = "Direction: "+data.current.wind_dir;
            document.querySelector(".windGust").innerHTML = " With wind gusts of <br />"+Math.round(data.current.gust_kph)+" km/h.";
        }

        function getSunriseTime(){
            //Save the sunrise time
            let sunriseTime = data.forecast.forecastday[0].astro.sunrise;
            const array2 = sunriseTime.split(" ");  
            sunriseTime = array2[0];    //remove the AM/PM portion will now look like "05:21" (sunriseTime is used by others)
            //remove padded zero from front
            sunriseTime = sunriseTime.replace(/^0+/,"");
            return sunriseTime;
        }

        function getSunriseHour(someTime){
            //get the sunrise hour
            const array3 = someTime.split(":")
            let sunriseHour = array3[0].replace(/^0+/,""); // looks like "5"  (sunriseHour is used by others)
            return sunriseHour;
        }

        function removeOldHourlyData(){
            /*Remove the old houly data, if there is one from a previous search*/
            const elements = document.getElementsByClassName("hour");
            while(elements.length > 0){
                elements[0].parentNode.removeChild(elements[0]);
            }
        }

        function removeOldThreeDayData(){
            /*Remove the old houly data, if there is one from a previous search*/
            const elements = document.getElementsByClassName("daily-weather");
            while(elements.length > 0){
                elements[0].parentNode.removeChild(elements[0]);
            }
        }

        function buildThreeDayWidget()
        {
            const weekday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            //create a date object using the date string value from json
            //Need to change from 2023-10-31 to 2023/10/31 to get correct date for some reason (might be javascript glitch or inconsistency)
            let dt = new Date(data.forecast.forecastday[0].date.replace(/-/g, '\/'));  

            document.querySelector(".daily-card").innerHTML += '<div class = "daily-weather"></div>';

            dayCounter = 0;
            let theDay;
            while(dayCounter < 3)
            {
                //Check if it's the first day, if so, set text to "Today"
                if(dayCounter == 0){
                    theDay = "Today";
                }
                else{
                    theDay = weekday[(dt.getDay() + dayCounter) % 7];
                }

                document.querySelector(".daily-weather").innerHTML +=  
                    '<div class="dayWeather">'+
                        '<div class = "dailycol1">'+
                            '<p class = "theDay">'+theDay+'</p>'+
                            '<img src='+data.forecast.forecastday[dayCounter].day.condition.icon+'>'+  
                        '</div>'+
                        '<div class = "dailycol2">'+    
                            '<p class="dayhigh">H: '+Math.round(data.forecast.forecastday[dayCounter].day.maxtemp_c)+'°</p>'+  
                            '<p class="daylow">L: '+Math.round(data.forecast.forecastday[dayCounter].day.mintemp_c)+'°</p>'+  
                        '</div>'+
                        '<div class = "dailycol3">'+                                     
                            '<p class="daypop">POP: '+data.forecast.forecastday[dayCounter].day.daily_chance_of_rain+'%</p>'+  
                            '<p class="dayprecip">'+Math.round(data.forecast.forecastday[dayCounter].day.totalprecip_mm)+' mm</p>'+
                        '</div>'+                                  
                    '</div>'+
                    '<p class="daily-condition">'+data.forecast.forecastday[dayCounter].day.condition.text +'</p>';
                
                //Make sure the last row does not print a horizontal rule <hr>
                if(dayCounter != 2){
                    document.querySelector(".daily-weather").innerHTML +=  '<hr><br>';
                }
                //Increment day counter
                dayCounter = dayCounter + 1;
            }
        }

        function buildSunriseWidget(){
            document.querySelector(".sunrise").innerHTML = sunriseTime +"<span>AM</span>"; 
        }

        function buildSunsetWidget(){
            document.querySelector(".sunset").innerHTML = convert24to12NoEnding(sunsetHour)+":"+sunsetMin +"<span>PM</span>"; 
        }

        function buildVisibilityWidget(){
            //Get main value
            document.querySelector(".visibility").innerHTML = data.current.vis_km + " km";
            //Choose correct visibility descroption
            let visibility = data.current.vis_km;
            let description = "None";
            if(visibility < 3){
                description = "Poor visibility at the moment.";
            }
            else if(visibility < 6){
                description = "Fair visibility at the moment.";
            }
            else if(visibility < 10){
                description = "Clear visibility at the moment.";
            }
            else{
                description = "It's perfectly clear right now.";
            }
            document.querySelector(".visible-note").innerHTML = description;
        }

        function buildPressureWidget(){
            let currentPressure = data.current.pressure_mb;
            document.querySelector(".pressure").innerHTML = currentPressure+"hPa"; 

            if(currentPressure >= 1013)
            {
                document.getElementById("pressure-img").src = "images2/arrow-up.png";
            }
            else{
                document.getElementById("pressure-img").src = "images2/arrow-down.png";
            }

            //For pressure in hPa
            //min low <= 900
            //mid low == 950
            //mid == 1000
            //mid high == 1050
            //max high >= 1100

            //5 images
            // 950,  975,  1000,  1025,  1050
        }









    }


    /*
    const searchBtn = document.querySelector(".search button");

    /*Event listener for clicking search button*/
    /*
    searchBtn.addEventListener("click", ()=>{
        checkWeather(searchBox.value);
    })
    */
    const searchBox = document.querySelector(".search input");

    /*Event listener for pressing the enter key*/
    searchBox.addEventListener("keypress", ()=>{
        if(event.key === "Enter"){
            checkWeather(searchBox.value);
        }
    })




    const rightBtn = document.querySelector(".right-arrow");
    
    rightBtn.addEventListener("click", function(event) {
        document.querySelector(".hourly-weather").style.scrollBehavior = "smooth";
        const conent = document.querySelector(".hourly-weather");
        conent.scrollLeft += 380;
        event.preventDefault();

       
    });

    const leftBtn = document.querySelector(".left-arrow");

    leftBtn.addEventListener("click", function(event) {
        document.querySelector(".hourly-weather").style.scrollBehavior = "smooth";
        const conent = document.querySelector(".hourly-weather");
        conent.scrollLeft -= 380;
        event.preventDefault();
    });

    

    //Check position of horizontal scroll bar and choose visibility for arrows
    const hourlyScroll = document.querySelector(".hourly-weather");

    hourlyScroll.addEventListener("scroll", function(event) {
        const conent = document.querySelector(".hourly-weather");

        //check if the scroll bar is at the beginning
        if(conent.scrollLeft == 0){   
            document.querySelector(".left-arrow").style.display = "none";
        }
        //if the scrollbar is all the way on the right
        else if(Math.abs(conent.scrollLeft) === conent.scrollWidth - conent.clientWidth){
            document.querySelector(".right-arrow").style.display = "none";
        }
        //when the scrollbar is not on the extremes
        else{
            document.querySelector(".left-arrow").style.display = "block";
            document.querySelector(".right-arrow").style.display = "block";
        }
    });




    //Code to allow for dragging on the hourly widget
    let mouseDown = false;
    let startX, scrollLeft;
    const slider = document.querySelector('.hourly-weather');

    const startDragging = (e) => {
        mouseDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        document.querySelector(".hourly-weather").style.scrollBehavior = "auto";  //need to shut off smooth scroll or dragging will be laggy
    }

    const stopDragging = (e) => {
        mouseDown = false; 
        document.querySelector(".hourly-weather").style.scrollBehavior = "smooth"; //turn smooth scroll back on when not dragging anymore
    }

    const move = (e) => {
        e.preventDefault();
        if(!mouseDown) { 
            return; 
        }
        const x = e.pageX - slider.offsetLeft;
        const scroll = x - startX;
        slider.scrollLeft = scrollLeft - scroll;
    }

    // Add the event listeners
    slider.addEventListener('mousemove', move, false);  //when mouse is moving, check if the mouse is being pressed down
    slider.addEventListener('mousedown', startDragging, false);  //When mouse is pressed down, active startDreagging method
    slider.addEventListener('mouseup', stopDragging, false);  //When mouse is not being pressed activate stop dragging method
    slider.addEventListener('mouseleave', stopDragging, false);  //active stopDragging method when mouse is not over the houlry-weather div






