const noble = require("@abandonware/noble");

function getShortToByte(i) {
  var result = new Uint8Array(2);
  result[0] = (i >> 8) & 255;
  result[1] = i & 255;
  return result;
}

function crc16Check(bArr) {
  var crc_16_0xa001 = [0, 49345, 49537, 320, 49921, 960, 640, 49729, 50689, 1728, 1920, 51009, 1280, 50625, 50305, 1088, 52225, 3264, 3456, 52545, 3840, 53185, 52865, 3648, 2560, 51905, 52097, 2880, 51457, 2496, 2176, 51265, 55297, 6336, 6528, 55617, 6912, 56257, 55937, 6720, 7680, 57025, 57217, 8000, 56577, 7616, 7296, 56385, 5120, 54465, 54657, 5440, 55041, 6080, 5760, 54849, 53761, 4800, 4992, 54081, 4352, 53697, 53377, 4160, 61441, 12480, 12672, 61761, 13056, 62401, 62081, 12864, 13824, 63169, 63361, 14144, 62721, 13760, 13440, 62529, 15360, 64705, 64897, 15680, 65281, 16320, 16000, 65089, 64001, 15040, 15232, 64321, 14592, 63937, 63617, 14400, 10240, 59585, 59777, 10560, 60161, 11200, 10880, 59969, 60929, 11968, 12160, 61249, 11520, 60865, 60545, 11328, 58369, 9408, 9600, 58689, 9984, 59329, 59009, 9792, 8704, 58049, 58241, 9024, 57601, 8640, 8320, 57409, 40961, 24768, 24960, 41281, 25344, 41921, 41601, 25152, 26112, 42689, 42881, 26432, 42241, 26048, 25728, 42049, 27648, 44225, 44417, 27968, 44801, 28608, 28288, 44609, 43521, 27328, 27520, 43841, 26880, 43457, 43137, 26688, 30720, 47297, 47489, 31040, 47873, 31680, 31360, 47681, 48641, 32448, 32640, 48961, 32000, 48577, 48257, 31808, 46081, 29888, 30080, 46401, 30464, 47041, 46721, 30272, 29184, 45761, 45953, 29504, 45313, 29120, 28800, 45121, 20480, 37057, 37249, 20800, 37633, 21440, 21120, 37441, 38401, 22208, 22400, 38721, 21760, 38337, 38017, 21568, 39937, 23744, 23936, 40257, 24320, 40897, 40577, 24128, 23040, 39617, 39809, 23360, 39169, 22976, 22656, 38977, 34817, 18624, 18816, 35137, 19200, 35777, 35457, 19008, 19968, 36545, 36737, 20288, 36097, 19904, 19584, 35905, 17408, 33985, 34177, 17728, 34561, 18368, 18048, 34369, 33281, 17088, 17280, 33601, 16640, 33217, 32897, 16448]

  var crc = 0xffff;
  for (let i = 0; i < bArr.length - 2; i++) {
    var b = bArr[i];
    crc = (crc >>> 8) ^ crc_16_0xa001[(crc ^ b) & 0xff];
  }
  return crc;
}

function generateReq(b, bArr) {
  var length = bArr.length + 5;
  bArr2 = new Uint8Array(length);
  bArr2[0] = 160; // DeviceCommand.APP_DEVICE

  // device command id
  bArr2[1] = b;

  // length of entire request
  bArr2[2] = bArr.length + 3;

  // append request data
  for (let i = 3; i < bArr.length + 3; i++) {
    bArr2[i] = bArr[i - 3];
  }

  // calculate checksum for request
  var shortToByte = getShortToByte(crc16Check(bArr2));
  bArr2[length - 2] = shortToByte[1];
  bArr2[length - 1] = shortToByte[0];

  return bArr2;
}

function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, l ];
}

module.exports = class Device {
  constructor(uuid) {
    this.uuid = uuid;
    this.connected = false;
    this.power = false;
    this.brightness = 100;
    this.hue = 0;
    this.saturation = 0;
    this.l = 0.5;
    this.peripheral = undefined;

    noble.on("stateChange", (state) => {
      if (state == "poweredOn") {
        noble.startScanningAsync();
      } else {
        this.connected = false;
      }
    });

    noble.on("discover", async (peripheral) => {
      if (peripheral.uuid == this.uuid) {
        console.log("Connected with BLE device" + this.uuid + " successfully")
        this.peripheral = peripheral;
        noble.stopScanning();
      }
    });
  }

  async connectAndGetCharacteristics() {
    if (!this.peripheral) {
      noble.startScanningAsync();
      return;
    }
    await this.peripheral.connectAsync();
    this.connected = true;
    const { characteristics } =
      await this.peripheral.discoverSomeServicesAndCharacteristicsAsync(
        ["0000ff1000001000800000805f9b34fb"]
      );
      console.log(characteristics);
    this.write = characteristics[0];
    this.read = characteristics[1];
  }

  async disconnect() {
    return;
    if (this.peripheral) {
      await this.peripheral.disconnectAsync();
      this.connected = false;
    }
  }

  async set_power(status) {
    if (!this.connected) await this.connectAndGetCharacteristics();
    if (this.write) {
      var cmdArgs = new Uint8Array(1);
      cmdArgs[0] = status ? 1 : 0;
      // 17 = DeviceCommand.LIGHT_SWITCH
      const buffer = Buffer.from(generateReq(17, cmdArgs), "uint8");
      this.write.write(buffer, false, (err) => {
        if (err) console.log("Error:", err);
        this.power = status;
        this.disconnect();
      });
    }
  }

  async set_brightness(level) {
    if (level > 100 || level < 0) return;
    if (!this.connected) await this.connectAndGetCharacteristics();
    if (this.write) {
      var cmdArgs = new Uint8Array(1);
      cmdArgs[0] = level;
      // 19 = DeviceCommand.LIGHT_BRIGHTNESS
      const buffer = Buffer.from(generateReq(19, cmdArgs), "uint8");
      this.write.write(buffer, false, (err) => {
        if (err) console.log("Error:", err);
        this.brightness = level;
        this.disconnect();
      });
    }
  }

  async set_rgb(r, g, b) {
    if (!this.connected) await this.connectAndGetCharacteristics();
    if (this.write) {
      var cmdArgs = new Uint8Array(3);
      cmdArgs[0] = r;
      cmdArgs[1] = g;
      cmdArgs[2] = b;
      // 21 = DeviceCommand.LIGHT_COLOR
      const buffer = Buffer.from(generateReq(21, cmdArgs), "uint8");
      this.write.write(buffer, false, (err) => {
        if (err) console.log("Error:", err);
        this.disconnect();
      });
    }
  }

  async set_hue(hue) {
    if (!this.connected) await this.connectAndGetCharacteristics();
    if (this.write) {
      this.hue = hue;
      const rgb = hslToRgb(hue / 360, this.saturation / 100, this.l);
      this.set_rgb(rgb[0], rgb[1], rgb[2]);
      this.disconnect();
    }
  }

  async set_saturation(saturation) {
    if (!this.connected) await this.connectAndGetCharacteristics();
    if (this.write) {
      this.saturation = saturation;
      const rgb = hslToRgb(this.hue / 360, saturation / 100, this.l);
      this.set_rgb(rgb[0], rgb[1], rgb[2]);
      this.disconnect();
    }
  }
};
