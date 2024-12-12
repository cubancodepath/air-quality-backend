interface AqiBreakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

// Breakpoints para CO (en ppm) - 8 horas
const CO_BREAKPOINTS: AqiBreakpoint[] = [
  { cLow: 0.0, cHigh: 4.4, iLow: 0, iHigh: 50 },
  { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
  { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
  { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
  { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
  { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
  { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 },
];

const NO2_BREAKPOINTS: AqiBreakpoint[] = [
  { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
  { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
  { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
  { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
  { cLow: 1250, cHigh: 1649, iLow: 301, iHigh: 400 },
  { cLow: 1650, cHigh: 2049, iLow: 401, iHigh: 500 },
];

const O3_BREAKPOINTS: AqiBreakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
  { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
  { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
  { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 },
];

function concentrationToPpmCO(mg_m3: number): number {
  return mg_m3 / 1.145;
}

function ugm3ToPpbNO2(ug_m3: number): number {
  return ug_m3 / 1.91;
}

function ugm3ToPpbO3(ug_m3: number): number {
  return ug_m3 / 2;
}

function computeAqi(
  concentration: number,
  breakpoints: AqiBreakpoint[],
): number {
  const bp = breakpoints.find(
    (b) => concentration >= b.cLow && concentration <= b.cHigh,
  );
  if (!bp) {
    return -1;
  }
  const { cLow, cHigh, iLow, iHigh } = bp;
  const aqi = ((iHigh - iLow) / (cHigh - cLow)) * (concentration - cLow) + iLow;
  return Math.round(aqi);
}

export const calculateAqi = (
  co_gt: number,
  no2_gt: number,
  pt08s5_o3: number,
): number => {
  const coPpm = concentrationToPpmCO(co_gt);
  const no2Ppb = ugm3ToPpbNO2(no2_gt);
  const o3Ppb = ugm3ToPpbO3(pt08s5_o3);

  const coAqi = computeAqi(coPpm, CO_BREAKPOINTS);
  const o3Aqi = computeAqi(o3Ppb, O3_BREAKPOINTS);
  const no2Aqi = computeAqi(no2Ppb, NO2_BREAKPOINTS);

  const allAqis = [coAqi, no2Aqi, o3Aqi].filter((a) => a >= 0); // Filtramos los -1 si algo falla
  const overallAqi = allAqis.length > 0 ? Math.max(...allAqis) : -1;

  return overallAqi;
};
