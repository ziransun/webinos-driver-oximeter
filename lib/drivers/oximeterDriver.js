/*******************************************************************************
 *  Code contributed to the webinos project
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Author: Ziran Sun   ziran.sun@samsung.com
 * 
 ******************************************************************************/

(function () {
    'use strict';

    var serialport_module = require('serialport');
    var serialPort = serialport_module.SerialPort;

    var path = require("path");
    var fs = require("fs");
    var SERIAL_PORT;
    var SERIAL_RATE;

    var buffer = [];
    var index = 0;
    var STX = 0x02;
    var MSGID = 0x26;
    var DLC = 0x37;
    var ETX = 0x03;
    var start = false;
    var prevIsStart = false;
    var prevIsMsgId = false;
    var prevIsDlc = false;
    var prevIsCrc = false;
    var counter = 0;

    var driverId = null;
    var registerFunc = null;
    var removeFunc = null;
    var callbackFunc = null;

    var elementsList = new Array;

    var serial;
    var elementIndex = 0;

    elementsList[0] = {
        'type': 'oximeter',
        'name': 'Contec Oximeter',
        'description': 'Bluetooth pulse oximeter',
        'sa': 0,
        'interval': 1000,
        'value': 0,
        'running': false,
        'id': 0
    };

	exports.init = function(dId, regFunc, remFunc, cbkFunc) {
    //exports.init = function(dId, regFunc, cbkFunc) {
        console.log('Contec Oximeter driver init - id is '+dId);
        driverId = dId;
        registerFunc = regFunc;
        removeFunc = remFunc;  // added - ziran
        callbackFunc = cbkFunc;
        intReg();
    };
  
    exports.execute = function(cmd, eId, data, errorCB, successCB) {
        switch(cmd) {
            case 'cfg':
                //In this case cfg data are transmitted to the sensor/actuator
                //this data is in json(???) format
                console.log(' Contec Oximeter driver - Received cfg for element '+eId+', cfg is '+data);
                successCB(eId);
                break;
            case 'start':
                //In this case the sensor should start data acquisition
                //the parameter data has value 'fixed' (in case of fixed interval
                // acquisition) or 'change' (in case od acquisition on value change)
                console.log('Contec Oximeter driver - Received start for element '+eId+', mode is '+data);

                elementsList[elementIndex].running = true;

                try{
                    var filePath = path.resolve(__dirname, "../../config.json");
                    fs.readFile(filePath, function(err,data) {
                        if (!err) {
                            var settings = JSON.parse(data.toString());
                            var drivers = settings.params.drivers;
                            for(var i in drivers){
                                if(drivers[i].type == "serial"){
                                    SERIAL_PORT = drivers[i].interfaces[0].port;
                                    SERIAL_RATE = drivers[i].interfaces[0].rate;
                                    break;
                                }
                            }

                            try{
                                serial = new serialPort(SERIAL_PORT, {baudrate: SERIAL_RATE}, false);

                                serial.open(function () {
                                    serial.on('close', function (err) {
                                        console.log("Serial port ["+SERIAL_PORT+"] was closed");
                                        
                                    });

                                    serial.on('error', function (err) {
                                        if(err.path == SERIAL_PORT){
                                            console.log("Serial port ["+SERIAL_PORT+"] is not ready. Err code : "+err.code);  
                                        }
                                    });
                                    start_serial();
                                });

                            }
                            catch(e){
                                console.log("catch : " + e);
                            }
                        }
                    });
                }
                catch(err){
                    console.log("Error : "+err);
                }
                break;
            case 'stop':
                //In this case the sensor should stop data acquisition
                //the parameter data can be ignored
                console.log('Contec Oximeter driver - Received stop for element '+eId);
                serial.close();
                break;
            case 'value':
                //In this case the actuator should store the value
                //the parameter data is the value to store
                console.log('Received value for element '+eId+'; value is '+data);
                break;
            default:
                console.log('Contec Oximeter driver - unrecognized cmd');
        }
    };

    function start_serial(){
        serial.on( "data", function( chunk ) {
          if(chunk.length == 9)
          {
            //collect Heart beat rate
            var HB = chunk[5];
            HB = (0x7F & HB);
            console.log("Heart pulse is:", HB);
            
            /*if(HB != undefined){
              console.log("passing HB to callback");
              elementsList[elementIndex].value = HB;
              callbackFunc('data', elementsList[elementIndex].id, elementsList[elementIndex].value);
            }  */
            
            //collect data SPO2 and pass back to dashboard 
            var value = chunk[6];
            value = (0x7F & value);
            console.log("SPO2 level is:", value);
            if(value != undefined){
              console.log("passing SPO2 to callback");
              elementsList[elementIndex].value = value;
              callbackFunc('data', elementsList[elementIndex].id, elementsList[elementIndex].value);
            } 
          }
          
        });
    }
    
    
    function intReg() {
        console.log('\nOximeter driver - register new elements');
        for(var i in elementsList) {
            var json_info = {type:elementsList[i].type, name:elementsList[i].name, description:elementsList[i].description, range:elementsList[i].range};
            //console.log("Register " + JSON.stringify(json_info));
            elementsList[i].id = registerFunc(driverId, elementsList[i].sa, json_info);
        };
    }
    
}());
