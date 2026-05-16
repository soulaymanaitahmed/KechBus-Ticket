const ROUTES_DATA = {
  "5": {
    name: "Route 5",
    path: [
      { lat: 31.6295, lng: -7.9810 }, // Start
      { lat: 31.6300, lng: -7.9820 },
      { lat: 31.6310, lng: -7.9830 },
      { lat: 31.6320, lng: -7.9840 },
      { lat: 31.6330, lng: -7.9850 }, // Station 1
      { lat: 31.6340, lng: -7.9860 },
      { lat: 31.6350, lng: -7.9870 },
      { lat: 31.6360, lng: -7.9880 },
      { lat: 31.6370, lng: -7.9890 },
      { lat: 31.6380, lng: -7.9900 }, // Station 2
      { lat: 31.6390, lng: -7.9910 },
      { lat: 31.6400, lng: -7.9920 },
      { lat: 31.6410, lng: -7.9930 },
      { lat: 31.6420, lng: -7.9940 },
      { lat: 31.6430, lng: -7.9950 }, // Station 3
      { lat: 31.6440, lng: -7.9960 },
      { lat: 31.6450, lng: -7.9970 },
      { lat: 31.6460, lng: -7.9980 },
      { lat: 31.6470, lng: -7.9990 },
      { lat: 31.6480, lng: -8.0000 }, // End
    ],
    stations: [
      { name: "Gueliz", pathIndex: 4, stopDuration: 5000 },
      { name: "Bab Doukkala", pathIndex: 9, stopDuration: 3000 },
      { name: "Menara", pathIndex: 14, stopDuration: 7000 },
    ]
  },
  "24": {
    name: "Route 24",
    path: [
      { lat: 31.6200, lng: -8.0100 },
      { lat: 31.6210, lng: -8.0110 },
      { lat: 31.6220, lng: -8.0120 },
      { lat: 31.6230, lng: -8.0130 },
      { lat: 31.6240, lng: -8.0140 }, // Station 1
      { lat: 31.6250, lng: -8.0150 },
      { lat: 31.6260, lng: -8.0160 },
      { lat: 31.6270, lng: -8.0170 },
      { lat: 31.6280, lng: -8.0180 },
      { lat: 31.6290, lng: -8.0190 }, // Station 2
      { lat: 31.6300, lng: -8.0200 },
      { lat: 31.6310, lng: -8.0210 },
      { lat: 31.6320, lng: -8.0220 },
      { lat: 31.6330, lng: -8.0230 },
      { lat: 31.6340, lng: -8.0240 }, // Station 3
      { lat: 31.6350, lng: -8.0250 },
      { lat: 31.6360, lng: -8.0260 },
      { lat: 31.6370, lng: -8.0270 },
      { lat: 31.6380, lng: -8.0280 },
      { lat: 31.6390, lng: -8.0290 }, // End
    ],
    stations: [
      { name: "Palmeraie", pathIndex: 4, stopDuration: 5000 },
      { name: "Jamaa El Fna", pathIndex: 9, stopDuration: 4000 },
      { name: "Koutoubia", pathIndex: 14, stopDuration: 6000 },
    ]
  }
};

module.exports = ROUTES_DATA;
