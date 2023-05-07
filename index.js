const Device = require('./Device');

let Service, Characteristic;

('use strict');
module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('@kfkos/homebridge-ledstrip-ble', 'LedStrip', LedStrip);
};

function LedStrip(log, config, api) {
  this.log = log;
  this.config = config;
  this.homebridge = api;

  this.bulb = new Service.Lightbulb(this.config.name);
  // Set up Event Handler for bulb on/off
  this.bulb
    .getCharacteristic(Characteristic.On)
    .on('get', this.getPower.bind(this))
    .on('set', this.setPower.bind(this));
  this.bulb
    .getCharacteristic(Characteristic.Brightness)
    .on('get', this.getBrightness.bind(this))
    .on('set', this.setBrightness.bind(this));
  this.bulb
    .getCharacteristic(Characteristic.Hue)
    .on('get', this.getHue.bind(this))
    .on('set', this.setHue.bind(this));
  this.bulb
    .getCharacteristic(Characteristic.Saturation)
    .on('get', this.getSaturation.bind(this))
    .on('set', this.setSaturation.bind(this));

  this.log('all event handlers setup successfully.');

  if (!this.config.uuid) return;
  this.uuid = this.config.uuid;

  this.device = new Device(this.uuid);
}

LedStrip.prototype = {
  getServices: function () {
    if (!this.bulb) return [];
    const infoService = new Service.AccessoryInformation();
    infoService.setCharacteristic(Characteristic.Manufacturer, 'LedStrip');
    return [infoService, this.bulb];
  },
  getPower: function (callback) {
    callback(null, this.device.power);
  },
  setPower: function (on, callback) {
    this.device.set_power(on);
    callback(null);
  },
  getBrightness: function (callback) {
    callback(null, this.device.brightness);
  },
  setBrightness: function (brightness, callback) {
    this.device.set_brightness(brightness);
    callback(null);
  },
  getHue: function (callback) {
    callback(null, this.device.hue);
  },
  setHue: function (hue, callback) {
    this.device.set_hue(hue);
    callback(null);
  },
  getSaturation: function (callback) {
    callback(null, this.device.saturation);
  },
  setSaturation: function (saturation, callback) {
    this.device.set_saturation(saturation);
    callback(null);
  }
};
