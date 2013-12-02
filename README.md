webinos-driver-oximeter
===================

Webinos oximeter driver handler that read data CONTEC Pulse Oximeter model CMS50E via bluetooth.


##Setup

### Bluetooth Pairing in Linux

To pair the oximeter with your Linux PC, go to Bluetooth Settings (pull your bluetooth icon from right corner of screen or go to system settings)

	Bluetooth Settings -> choose "+" to add new device -> SpO2 device should show on your found device list -> choose SpO2 ->continue -> choose "PIN options" -> Custom PIN -> input "7762" as the pin -> continue


###Mount as a serial port in /dev  in Linux

Release /dev/rfcomm0 if it exists

sudo rfcomm release /dev/rfcomm0


For Linux, in command line, do the following -

	hcitool scan

It will return MAC address of your oximeter. 

	sudo rfcomm bind /dev/rfcomm0 [MAC addr] 1

You might need to add your username to the dialout group:

sudo add [your Username] dialout


### For other OSs

The oximeter might be discovered automatically in windows and MAC OSs. After pairing with the pin code "7762", Please change the "port" setting in config.json to match your settings. 







